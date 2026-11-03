/* Mobile adapter. The vendored synthesis and LSTM implementations stay unchanged. */
(() => {
  const audio = window.resonaAudio;
  const model = new window.ResonaChordModel('offline');
  // Use packaged assets instead of the website's authenticated storage endpoints.
  model.load = async function () {
    if (this.ready) return this;
    this.manifest = window.resonaModelAssets.manifest;
    const binary = atob(window.resonaModelAssets.weights);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    this.weights = {};
    Object.entries(this.manifest.tensors).forEach(([name, tensor]) => {
      this.weights[name] = new Float32Array(bytes.buffer, tensor.offset, tensor.length);
    });
    this.vocabulary = this.manifest.vocabulary;
    this.hiddenSize = this.manifest.architecture.hiddenDimension;
    this.ready = true;
    return this;
  };
  const send = data => {
    const message = JSON.stringify({ channel: 'resona-lite', ...data });
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(message);
    else window.parent.postMessage(message, '*');
  };
  const pipeline = { enabled:false, token:0, options:null, playing:null, ready:[], generating:null, nextSetNumber:0 };
  let chordStatus = 'Offline chord model ready to load.';
  let generating = false;
  let transportPaused = false;
  // Declare long-form playback to WebKit instead of its default ambient session.
  try { if (window.navigator?.audioSession) window.navigator.audioSession.type = 'playback'; } catch (_) {}
  const originalInterval = window.setInterval.bind(window);
  window.setInterval = (callback, delay, ...args) => originalInterval(() => { if (!transportPaused) callback(...args); }, delay);
  audio.ensureContext = function () {
    if (!this.context) this.context = new (window.AudioContext || window.webkitAudioContext)();
    if (transportPaused) { if (this.context.state === 'running') this.context.suspend(); }
    else if (this.context.state === 'suspended') this.context.resume();
    return this.context;
  };
  const resumeTransport = async () => { transportPaused = false; if (audio.context?.state === 'suspended') await audio.context.resume(); };

  let sleepDeadline = null;
  let sleepTimeout = null;
  let noiseRestart = null;
  const stopAll = () => { transportPaused = false; clearTimeout(noiseRestart); reset(false); generating = false; audio.stop(); audio.stopAmbient(); audio.stopNoise(); audio.stopChordProgression(); };
  const expireSleep = () => {
    if (sleepDeadline === null || Date.now() < sleepDeadline) return false;
    sleepDeadline = null; clearTimeout(sleepTimeout); stopAll(); state(); return true;
  };
  const label = number => { let value = number + 1, result = ''; while (value > 0) { value--; result = String.fromCharCode(65 + value % 26) + result; value = Math.floor(value / 26); } return result; };
  const state = () => send({ type:'state', config:audio.config, paused:transportPaused, playing:!transportPaused && audio.playing, ambientPlaying:!transportPaused && audio.ambientPlaying, noisePlaying:!transportPaused && audio.noisePlaying, chordProgressionPlaying:audio.chordProgressionPlaying, chordProgressionPaused:transportPaused || audio.chordProgressionPaused, chordProgressionIndex:audio.chordProgressionIndex, generating, chordStatus, pipeline:{ enabled:pipeline.enabled, playing:pipeline.playing?.label || null, ready:pipeline.ready.map(set => set.label), generating:pipeline.generating?.label || null } });
  const reset = enabled => { pipeline.token++; pipeline.enabled = enabled; pipeline.options = null; pipeline.playing = null; pipeline.ready = []; pipeline.generating = null; pipeline.nextSetNumber = 0; };
  const makeSet = chords => ({ label:label(pipeline.nextSetNumber++), chords });
  async function generateSet(options, previous) {
    if (!previous?.length) return model.generate(options);
    const chords = await model.generate({ ...options, seedChords:[previous[previous.length - 1]], length:options.length + 1 });
    return chords.slice(1, options.length + 1);
  }
  function ahead(previous) {
    if (!pipeline.enabled || pipeline.generating || !pipeline.options) return;
    const token = pipeline.token;
    pipeline.generating = { label:label(pipeline.nextSetNumber) }; state();
    setTimeout(async () => {
      try {
        const chords = await generateSet(pipeline.options, previous);
        if (!pipeline.enabled || token !== pipeline.token) return;
        pipeline.ready.push(makeSet(chords)); pipeline.generating = null; state();
      } catch (error) {
        if (token !== pipeline.token) return;
        pipeline.generating = null; chordStatus = `Continuous generation paused: ${error.message}`; state();
      }
    }, 0);
  }
  async function generate(options) {
    reset(Boolean(options.continuous));
    const token = pipeline.token;
    pipeline.options = { ...options, length:Math.max(2, Math.min(32, Number(options.length) || 8)) };
    generating = true; chordStatus = 'Generating on this device…'; state();
    // Yield so the transport and progress indicator can paint before local inference.
    await new Promise(resolve => setTimeout(resolve, 0));
    try {
      const first = await generateSet(pipeline.options);
      if (token !== pipeline.token) return;
      if (pipeline.enabled) {
        const second = await generateSet(pipeline.options, first);
        if (token !== pipeline.token) return;
        pipeline.playing = makeSet(first); pipeline.ready = [makeSet(second)];
      }
      audio.setChordProgression(first, options.duration);
      generating = false; chordStatus = 'Playing the harmonized progression.'; state();
      if (pipeline.enabled) ahead(pipeline.ready[0].chords);
    } catch (error) {
      if (token !== pipeline.token) return;
      reset(false); generating = false; chordStatus = error.message; state();
    }
  }
  window.addEventListener('resona:chord-set-ended', () => {
    if (!pipeline.enabled || !pipeline.ready.length) return;
    pipeline.playing = pipeline.ready.shift();
    audio.setChordProgression(pipeline.playing.chords, audio.config.ambient.chordDuration);
    state();
    if (!pipeline.generating) ahead((pipeline.ready[pipeline.ready.length - 1] || pipeline.playing).chords);
  });
  window.addEventListener('resona:audio-state-change', state);
  const presets = {
    sleep:{ beat:2, atmosphere:'deep', root:57 }, meditation:{ beat:6, atmosphere:'deep', root:53 },
    focus:{ beat:10, atmosphere:'restore', root:57 }, awake:{ beat:18, atmosphere:'restore', root:48 },
  };
  window.resonaCommand = async command => {
    try {
      const { action, args = [] } = command;
      if (action === 'sleepTimer') {
        sleepDeadline = Number.isFinite(args[0]) ? args[0] : null; clearTimeout(sleepTimeout);
        if (sleepDeadline !== null) sleepTimeout = setTimeout(() => expireSleep(), Math.max(0, sleepDeadline - Date.now()));
        expireSleep(); state(); return;
      }
      if (action === 'stopAll') { sleepDeadline = null; clearTimeout(sleepTimeout); stopAll(); if (audio.context) await audio.context.suspend(); state(); return; }
      if (action === 'refresh') { expireSleep(); state(); return; }
      if (action === 'playSession') {
        const hadTracks = audio.playing || audio.ambientPlaying || audio.noisePlaying;
        await resumeTransport();
        if (!hadTracks) { audio.start(); audio.startAmbient(); }
      }
      else if (action === 'pauseAll') { transportPaused = true; if (audio.context) await audio.context.suspend(); }
      else if (action === 'generate') { await generate(args[0]); return; }
      if (action === 'continuous') {
        if (!args[0]) { reset(false); generating = false; }
        else pipeline.enabled = true;
        state(); return;
      }
      if (['playSession', 'pauseAll'].includes(action)) { /* handled above */ }
      else if (action === 'applyMode') {
        const preset = presets[args[0]];
        if (preset) { audio.config.mode = args[0]; audio.setBeat(preset.beat); audio.setAtmosphere(preset.atmosphere); audio.setTonalCentre(preset.root); }
      } else if (action === 'toggleSession') {
        if (transportPaused) await resumeTransport();
        else if (audio.playing || audio.ambientPlaying) { audio.stop(); audio.stopAmbient(); }
        else { audio.start(); audio.startAmbient(); }
      } else if (action === 'suspend') {
        // Keep transport flags and chord position intact while the app is inactive.
        if (audio.context) await audio.context.suspend();
      } else if (action === 'resume') {
        expireSleep();
        if (!transportPaused && audio.context?.state === 'suspended') await audio.context.resume();
      } else if (action === 'setNoise') {
        clearTimeout(noiseRestart); audio.config.noise = args[0];
        if (audio.noisePlaying) { audio.stopNoise(); noiseRestart = setTimeout(() => { if (!expireSleep()) audio.startNoise(); state(); }, 850); }
      } else {
        if (action === 'toggleNoise') clearTimeout(noiseRestart);
        const allowed = ['toggle','toggleAmbient','toggleNoise','setMaster','setVolume','setBeat','setBinauralMode','setEarFrequency','setDroneFrequency','setAtmosphere','setAmbientParameter','setAmbient','setLayer','setNoise','setTonalCentre','setTonalSource','setChordTransition','setBinauralChordTransition','toggleChordProgression','stopChordProgression','replayChordProgression'];
        if (!allowed.includes(action)) throw new Error('Unknown audio command');
        if (transportPaused && ['toggle','toggleAmbient','toggleNoise','toggleChordProgression','replayChordProgression'].includes(action)) {
          const alreadyPlaying = action === 'toggle' ? audio.playing : action === 'toggleAmbient' ? audio.ambientPlaying : action === 'toggleNoise' ? audio.noisePlaying : false;
          await resumeTransport();
          if (!alreadyPlaying) audio[action](...args);
        } else audio[action](...args);
        if (action === 'setNoise') setTimeout(state, 950);
      }
      if (!transportPaused && audio.context?.state === 'suspended' && !['suspend'].includes(action)) await audio.context.resume();
      state();
    } catch (error) { send({ type:'error', message:error.message }); state(); }
  };
  const receive = event => {
    if (event.source && event.source !== window.parent) return;
    try { const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data; if (data?.channel === 'resona-lite-command') window.resonaCommand(data); } catch (_) { /* unrelated message */ }
  };
  window.addEventListener('message', receive);
  window.addEventListener('error', event => send({ type:'error', message:event.message }));
  window.addEventListener('unhandledrejection', event => send({ type:'error', message:String(event.reason?.message || event.reason) }));
  // No oscillators or context are created until the user presses Play.
  send({ type:'ready' }); state();
})();
