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
  let generationRequest = 0;
  let transportPaused = false;
  let savedProgression = { chords: [], duration: 4 };
  let appliedConfiguration = 0;
  let applyingConfiguration = false;
  Object.assign(audio.config.volumes, { binaural: 15, ambient: 90, noise: 0 });
  // Declare long-form playback to WebKit instead of its default ambient session.
  try { if (window.navigator?.audioSession) window.navigator.audioSession.type = 'playback'; } catch (_) {}
  const originalInterval = window.setInterval.bind(window);
  window.setInterval = (callback, delay, ...args) => originalInterval(() => { if (!transportPaused) callback(...args); }, delay);
  audio.ensureContext = function () {
    if (!this.context) {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      context.onstatechange = () => { if (audio.context === context) state(); };
      this.context = context;
    }
    return this.context;
  };
  const hasTracks = () => audio.playing || audio.ambientPlaying || audio.noisePlaying || noiseRestart !== null;

  let sleepDeadline = null;
  let sleepTimeout = null;
  let noiseRestart = null;
  const stopAll = () => { transportPaused = false; clearTimeout(noiseRestart); noiseRestart = null; reset(false); generationRequest++; generating = false; audio.stop(); audio.stopAmbient(); audio.stopNoise(); audio.stopChordProgression(); };
  const expireSleep = () => {
    if (sleepDeadline === null || Date.now() < sleepDeadline) return false;
    sleepDeadline = null; clearTimeout(sleepTimeout); stopAll(); state(); return true;
  };
  const label = number => { let value = number + 1, result = ''; while (value > 0) { value--; result = String.fromCharCode(65 + value % 26) + result; value = Math.floor(value / 26); } return result; };
  const state = () => {
    if (applyingConfiguration) return;
    const paused = transportPaused || (hasTracks() && audio.context?.state === 'interrupted');
    send({
      type: 'state', appliedConfiguration, savedProgression, config: audio.config, paused,
      playing: !paused && audio.playing,
      ambientPlaying: !paused && audio.ambientPlaying,
      noisePlaying: !paused && (audio.noisePlaying || noiseRestart !== null),
      chordProgressionPlaying: audio.chordProgressionPlaying,
      chordProgressionPaused: paused || audio.chordProgressionPaused,
      chordProgressionIndex: audio.chordProgressionIndex,
      generating, chordStatus,
      pipeline: {
        enabled: pipeline.enabled,
        playing: pipeline.playing?.label || null,
        ready: pipeline.ready.map(set => set.label),
        generating: pipeline.generating?.label || null,
      },
    });
  };
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
    const options = pipeline.options;
    pipeline.generating = { label:label(pipeline.nextSetNumber) }; state();
    setTimeout(async () => {
      try {
        if (token !== pipeline.token) return;
        const chords = await generateSet(options, previous);
        if (!pipeline.enabled || token !== pipeline.token) return;
        pipeline.ready.push(makeSet(chords)); pipeline.generating = null; state();
      } catch (error) {
        if (token !== pipeline.token) return;
        pipeline.generating = null; chordStatus = `Continuous generation paused: ${error.message}`; state();
      }
    }, 0);
  }
  async function generate(options) {
    const token = ++generationRequest;
    const request = { ...options, length:Math.max(2, Math.min(32, Number(options.length) || 8)) };
    const wasPaused = transportPaused;
    generating = true; chordStatus = 'Generating on this device…'; state();
    await new Promise(resolve => setTimeout(resolve, 0));
    try {
      if (token !== generationRequest || expireSleep()) return;
      const first = await generateSet(request);
      if (token !== generationRequest || expireSleep()) return;
      const second = request.continuous ? await generateSet(request, first) : null;
      if (token !== generationRequest || expireSleep()) return;
      reset(request.continuous);
      pipeline.options = request;
      if (second) {
        pipeline.playing = makeSet(first);
        pipeline.ready = [makeSet(second)];
      }
      savedProgression = { chords: audio.harmonizeProgression(first), duration: options.duration };
      if (wasPaused) transportPaused = false;
      audio.setChordProgression(first, options.duration);
      generating = false; chordStatus = 'Playing the harmonized progression.';
      state();
      if (second) ahead(second);
      await checkOutput();
    } catch (error) {
      if (token !== generationRequest) return;
      generating = false;
      chordStatus = error.message;
      state();
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
  function changeNoise(name) {
    if (audio.config.noise === name) return;
    const restart = audio.noisePlaying || noiseRestart !== null;
    clearTimeout(noiseRestart);
    noiseRestart = null;
    audio.config.noise = name;
    if (restart) {
      audio.stopNoise();
      noiseRestart = setTimeout(() => {
        noiseRestart = null;
        if (!expireSleep()) audio.startNoise();
        state();
      }, 850);
    }
  }

  function applyConfiguration(configuration, requestId) {
    const { sound, editor, progression } = configuration;
    applyingConfiguration = true;
    try {
      generationRequest++;
      generating = false;
      reset(false);
      savedProgression = progression;
      const ambient = audio.config.ambient;
      ambient.chordProgression = progression.chords.slice();
      audio.progressionTonic = audio.parseChord(progression.chords[0]).root;
      ambient.chordDuration = progression.duration;
      ambient.droneFrequency = sound.droneFrequency;
      ambient.manualRootMidi = sound.manualRootMidi;
      audio.config.mode = sound.mode;
      audio.config.carrier = sound.droneFrequency;
      audio.config.leftFrequency = sound.leftFrequency;
      audio.config.rightFrequency = sound.rightFrequency;
      audio.config.binauralMode = sound.binauralMode;
      audio.config.beat = sound.beatHz;
      audio.setChordTransition(sound.chordTransition);
      audio.setBinauralChordTransition(sound.binauralChordTransition);
      audio.setAtmosphere(sound.atmosphere);
      for (const name of ['drone', 'pads', 'textures', 'melody', 'spatial']) audio.setAmbient(name, sound[name]);
      for (const name of Object.keys(ambient.parameters)) audio.setAmbientParameter(name, sound[name]);
      for (const name of ['binaural', 'ambient', 'noise']) audio.config.volumes[name] = sound[name + 'Volume'];
      audio.setMaster(sound.masterVolume);
      changeNoise(sound.noise);
      if (sound.tonalSource === 'generated' && progression.chords.length) {
        ambient.tonalSource = 'generated';
        audio.clearManualHarmonyTimer();
        audio.chordProgressionIndex = 0;
        audio.chordProgressionPaused = false;
        audio.chordProgressionPlaying = audio.ambientPlaying;
        audio.scheduleProgression();
        if (editor.continuous) {
          pipeline.enabled = true;
          pipeline.options = { ...editor, seedChords: [] };
          pipeline.playing = makeSet(progression.chords);
          if (audio.ambientPlaying && !transportPaused) ahead(progression.chords);
        }
      } else audio.setTonalSource('manual');
      audio.updateBinauralFrequencies();
      chordStatus = progression.chords.length ? 'Chord progression ready.' : 'Offline chord model ready to load.';
      appliedConfiguration = requestId;
    } finally {
      applyingConfiguration = false;
    }
    state();
  }

  // WebKit can report a running context whose audio clock has stopped.
  // Only recover after an explicit play request in the foreground.
  let outputCheck = 0;
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function checkOutput() {
    const context = audio.context;
    if (!context || transportPaused || !hasTracks()) return;
    if (!window.ReactNativeWebView || !window.document) {
      try {
        if (context.state === 'suspended') await context.resume();
      } catch (error) { send({ type: 'error', message: error.message }); }
      return;
    }
    const check = ++outputCheck;
    const current = () => check === outputCheck && context === audio.context &&
      !transportPaused && hasTracks() && !window.document.hidden && !expireSleep();
    if (!current()) return;
    const advancing = async ctx => {
      if (ctx.state !== 'running') void ctx.resume().catch(() => {});
      const time = ctx.currentTime;
      await delay(400);
      return ctx.state === 'running' && ctx.currentTime > time;
    };
    try {
      if (await advancing(context) || !current()) return;
      if (await advancing(context) || !current()) return;
      // Leave genuine OS interruptions alone until the system permits playback.
      if (context.state === 'interrupted') return;
      const tracks = { binaural: audio.playing, ambient: audio.ambientPlaying, noise: audio.noisePlaying };
      const index = audio.chordProgressionIndex;
      const playingChords = audio.chordProgressionPlaying;
      const pausedChords = audio.chordProgressionPaused;
      audio.stop();
      audio.stopAmbient();
      audio.stopNoise();
      void context.close().catch(() => {});
      audio.context = null;
      if (tracks.binaural) audio.start();
      if (tracks.ambient) {
        audio.startAmbient();
        audio.chordProgressionIndex = index;
        audio.chordProgressionPlaying = playingChords;
        audio.chordProgressionPaused = pausedChords;
        audio.scheduleProgression();
      }
      if (tracks.noise) audio.startNoise();
      const rebuilt = audio.context;
      if (!rebuilt || await advancing(rebuilt) || check !== outputCheck || transportPaused ||
        rebuilt.state === 'interrupted' || window.document.hidden || expireSleep()) return;
      throw new Error('Audio output could not resume.');
    } catch (error) {
      if (check !== outputCheck || transportPaused) return;
      audio.stop(); audio.stopAmbient(); audio.stopNoise();
      clearTimeout(noiseRestart);
      noiseRestart = null;
      send({ type: 'error', message: error.message });
      state();
    }
  }
  const presets = {
    sleep:{ beat:2, atmosphere:'deep', root:57 }, meditation:{ beat:6, atmosphere:'deep', root:53 },
    focus:{ beat:10, atmosphere:'restore', root:57 }, awake:{ beat:18, atmosphere:'restore', root:48 },
  };
  window.resonaCommand = async command => {
    try {
      const { action, args = [] } = command;
      if (action === 'applyConfiguration') { outputCheck++; applyConfiguration(args[0], args[1]); return; }
      if (action === 'sleepTimer') {
        sleepDeadline = Number.isFinite(args[0]) ? args[0] : null; clearTimeout(sleepTimeout);
        if (sleepDeadline !== null) sleepTimeout = setTimeout(() => expireSleep(), Math.max(0, sleepDeadline - Date.now()));
        expireSleep(); state(); return;
      }
      if (action === 'stopAll') { outputCheck++; sleepDeadline = null; clearTimeout(sleepTimeout); stopAll(); if (audio.context) await audio.context.suspend(); state(); return; }
      if (action === 'refresh') { expireSleep(); state(); return; }
      if (action === 'playSession') {
        const hadTracks = hasTracks();
        transportPaused = false;
        if (!hadTracks) { audio.start(); audio.startAmbient(); }
      }
      else if (action === 'pauseAll') {
        // An idle system pause must not leave an empty graph waiting to resume.
        if (audio.playing || audio.ambientPlaying || audio.noisePlaying) {
          outputCheck++;
          transportPaused = true;
          await audio.context.suspend();
        }
      }
      else if (action === 'generate') { await generate(args[0]); return; }
      if (action === 'continuous') {
        if (!args[0]) { reset(false); generationRequest++; generating = false; }
        else pipeline.enabled = true;
        state(); return;
      }
      if (['playSession', 'pauseAll'].includes(action)) { /* handled above */ }
      else if (action === 'applyMode') {
        const preset = presets[args[0]];
        if (preset) { audio.config.mode = args[0]; audio.setBeat(preset.beat); audio.setAtmosphere(preset.atmosphere); audio.setTonalCentre(preset.root); }
      } else if (action === 'toggleSession') {
        if (transportPaused) transportPaused = false;
        else if (audio.playing || audio.ambientPlaying) {
          outputCheck++;
          generationRequest++;
          generating = false;
          audio.stop(); audio.stopAmbient();
        }
        else { audio.start(); audio.startAmbient(); }
      } else if (action === 'suspend') {
        outputCheck++;
        // Keep transport flags and chord position intact while the app is inactive.
        if (audio.context) await audio.context.suspend();
      } else if (action === 'resume') {
        expireSleep();
        if (!transportPaused && audio.context?.state === 'suspended') await audio.context.resume();
      } else if (action === 'setNoise') {
        changeNoise(args[0]);
      } else {
        if (action === 'stopChordProgression' || (action === 'toggleAmbient' && audio.ambientPlaying && !transportPaused)) {
          generationRequest++;
          generating = false;
        }
        if (action === 'toggleNoise' && noiseRestart !== null) {
          clearTimeout(noiseRestart); noiseRestart = null; state(); return;
        }
        if (action === 'toggleNoise' && (!audio.noisePlaying || transportPaused) && audio.config.volumes.noise === 0) {
          send({ type: 'noiseMuted' });
        }
        const allowed = ['toggle','toggleAmbient','toggleNoise','setMaster','setVolume','setBeat','setBinauralMode','setEarFrequency','setDroneFrequency','setAtmosphere','setAmbientParameter','setAmbient','setLayer','setNoise','setTonalCentre','setTonalSource','setChordTransition','setBinauralChordTransition','toggleChordProgression','stopChordProgression','replayChordProgression'];
        if (!allowed.includes(action)) throw new Error('Unknown audio command');
        if (transportPaused && ['toggle','toggleAmbient','toggleNoise','toggleChordProgression','replayChordProgression'].includes(action)) {
          const alreadyPlaying = action === 'toggle' ? audio.playing : action === 'toggleAmbient' ? audio.ambientPlaying : action === 'toggleNoise' ? audio.noisePlaying : false;
          transportPaused = false;
          if (!alreadyPlaying) audio[action](...args);
        } else audio[action](...args);
        if (action === 'setNoise') setTimeout(state, 950);
      }
      if (['playSession', 'toggleSession', 'toggle', 'toggleAmbient', 'toggleNoise', 'toggleChordProgression', 'replayChordProgression', 'setTonalSource'].includes(action)) {
        if (pipeline.enabled && !pipeline.ready.length) ahead(audio.config.ambient.chordProgression);
        await checkOutput();
      }
      state();
    } catch (error) { send({ type:'error', message:error.message, configurationRequest: command.action === 'applyConfiguration' ? command.args[1] : undefined }); state(); }
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
