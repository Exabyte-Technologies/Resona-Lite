const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.join(__dirname, '../src/engine');
const bundle = require(path.join(root, 'bundle.json'));

function runtime({ bridge = false, model = false } = {}) {
  let nextTimer = 0, wallTime = 100000;
  const timers = new Map(), listeners = new Map(), messages = [], nodes = [];
  const param = value => ({ value, calls:[], cancelScheduledValues(t) { this.calls.push(['cancel',t]); }, setValueAtTime(v,t) { this.value=v; this.calls.push(['set',v,t]); }, setTargetAtTime(v,t,d) { this.value=v; this.calls.push(['target',v,t,d]); }, linearRampToValueAtTime(v,t) { this.value=v; this.calls.push(['linear',v,t]); }, exponentialRampToValueAtTime(v,t) { this.value=v; this.calls.push(['exponential',v,t]); } });
  class Node {
    constructor(kind) { this.kind=kind; for (const key of ['gain','frequency','detune','pan','Q','delayTime','threshold','knee','ratio','attack','release']) this[key]=param(0); this.connections=[]; nodes.push(this); }
    connect(target,...args) { this.connections.push([target,...args]); return target; }
    disconnect() { this.disconnected=true; }
    start() { this.started=true; }
    stop() { this.stopped=true; }
  }
  class AudioContext {
    constructor() { this.currentTime=12; this.sampleRate=8000; this.state='running'; this.destination=new Node('destination'); }
    resume() { this.state='running'; return Promise.resolve(); }
    suspend() { this.state='suspended'; return Promise.resolve(); }
    createBuffer(channels,length,sampleRate) { const data=Array.from({length:channels},()=>new Float32Array(length)); return { getChannelData:c=>data[c], sampleRate,length }; }
  }
  for (const kind of ['Gain','Oscillator','ChannelMerger','BiquadFilter','BufferSource','StereoPanner','Delay','WaveShaper','DynamicsCompressor','Convolver','Analyser']) AudioContext.prototype[`create${kind}`]=()=>new Node(kind);
  let seed=71;
  const math=Object.create(Math); math.random=()=>((seed=seed*16807%2147483647)-1)/2147483646;
  const sandbox={ Date:class extends Date { static now(){return wallTime;} }, Float32Array,Uint8Array,ArrayBuffer,Math:math,console,AudioContext,
    CustomEvent:class { constructor(type,opts) { this.type=type; this.detail=opts?.detail; } },
    setInterval(fn,ms) { const id=++nextTimer; timers.set(id,{fn,ms,interval:true}); return id; },
    clearInterval(id) { timers.delete(id); },
    setTimeout(fn,ms) { const id=++nextTimer; timers.set(id,{fn,ms,interval:false}); return id; },
    clearTimeout(id) { timers.delete(id); },
    addEventListener(name,fn) { if (!listeners.has(name)) listeners.set(name,[]); listeners.get(name).push(fn); },
    dispatchEvent(event) { for (const fn of listeners.get(event.type)||[]) fn(event); },
    atob:value=>Buffer.from(value,'base64').toString('binary'),
    ReactNativeWebView:{ postMessage:value=>messages.push(JSON.parse(value)) },
    resonaModelAssets:{manifest:bundle.manifest,weights:bundle.weights},
    fetch() { throw new Error('Offline engine attempted a network request'); },
  };
  sandbox.window=sandbox; sandbox.parent=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(bundle.audio,sandbox);
  if (model || bridge) vm.runInContext(bundle.model,sandbox);
  if (bridge) vm.runInContext(bundle.bridge,sandbox);
  return { setNow:value=>{wallTime=value;}, window:sandbox, audio:sandbox.resonaAudio,timers,messages,nodes, tick(ms) { for (const [id,timer] of [...timers]) if (timer.ms===ms) { if (!timer.interval) timers.delete(id); timer.fn(); } } };
}
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);

test('vendored engine, LSTM and weights retain the original source hashes',()=>{
  const pinned={ 'audio.js':'114f3c6dab0c801e1f796b42946214dca96a605aeb93406aa626ff913a4e0d67', 'chord-model.js':'28256405485695d6b30649caee9102099668bbb6e310d5b8e2f9cb2b78667874', 'chord-model/model.json':'f633730b195812f8bfae3af82057120a49bd96008b885e9aed509dc7606ec1ae', 'chord-model/weights.bin':'38537f108d5c71d093aee57cc03b5511cea77621a453da7105a44b26286148f8' };
  for (const [file,sha] of Object.entries(pinned)) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'vendor',file))).digest('hex'),sha);
  assert.equal(bundle.audio,fs.readFileSync(path.join(root,'vendor/audio.js'),'utf8'));
});
test('Home transport starts all original layers, and volume changes keep the graph alive',async()=>{
  const r=runtime({bridge:true});
  assert.equal(r.audio.context,null);
  await r.window.resonaCommand({action:'toggleSession'});
  assert.ok(r.audio.playing && r.audio.ambientPlaying);
  assert.equal(r.audio.ambientVoices.body.length,9);
  assert.equal(r.audio.ambientVoices.drone.length,3);
  assert.equal(r.audio.ambientVoices.shimmer.length,3);
  const voices=r.audio.ambientVoices, oscillator=r.audio.left;
  await r.window.resonaCommand({action:'setMaster',args:[23]});
  assert.equal(r.audio.ambientVoices,voices); assert.equal(r.audio.left,oscillator);
  close(r.audio.master.gain.value,.5*.23);
  assert.equal(r.nodes.filter(n=>n.kind==='Convolver').length,1);
  assert.ok(r.nodes.filter(n=>n.kind==='Delay').length>=4);
  await r.window.resonaCommand({action:'toggleSession'});
  assert.ok(!r.audio.playing && !r.audio.ambientPlaying);
  r.tick(3000); r.tick(600);
  assert.ok(r.nodes.filter(n=>n.started).every(n=>n.stopped));
  assert.equal(r.timers.size,0);
});
test('all four modes use the website atmosphere, beat and exact equal-tempered tonic',async()=>{
  const r=runtime({bridge:true});
  for (const [mode,beat,atmosphere,midi] of [['sleep',2,'deep',57],['meditation',6,'deep',53],['focus',10,'restore',57],['awake',18,'restore',48]]) {
    await r.window.resonaCommand({action:'applyMode',args:[mode]});
    assert.equal(r.audio.config.beat,beat); assert.equal(r.audio.config.ambient.atmosphere,atmosphere);
    close(r.audio.config.carrier,440*2**((midi-69)/12));
  }
});
test('progressions retune ambient and binaural together; manual and chord timing stay separate',()=>{
  const {audio:a}=runtime(); a.start(); a.setChordProgression(['C','Amin','F','G'],2);
  assert.equal(a.config.ambient.chordProgression.join(' '),'C Amin F G');
  a.chordProgressionIndex=1; a.applyProgressionChord();
  close(a.config.carrier,440*2**((53+9-69)/12));
  close(a.right.frequency.value-a.left.frequency.value,6);
  assert.equal(a.left.frequency.calls.at(-1)[0],'set');
  a.setBinauralChordTransition(4); a.setChordTransition(1.5); a.applyProgressionChord();
  assert.equal(a.left.frequency.calls.at(-1)[0],'linear'); assert.equal(a.left.frequency.calls.at(-1)[2],14);
  assert.equal(a.ambientVoices.body[0].oscillator.frequency.calls.at(-1)[2],13.5);
  a.setTonalSource('manual'); a.setDroneFrequency(200);
  close(a.config.carrier,200); assert.equal(a.left.frequency.calls.at(-1)[0],'target');
  assert.equal(a.left.frequency.calls.at(-1)[3],.3);
  a.setChordProgression(['C','G'],500); assert.equal(a.config.ambient.chordDuration,120);
});
test('individual ear tuning stays independent and switching back restores the difference pair',()=>{
  const {audio:a}=runtime(); a.start(); a.setEarFrequency('left',180); a.setEarFrequency('right',190);
  a.setDroneFrequency(220); close(a.left.frequency.value,180); close(a.right.frequency.value,190);
  a.setBeat(10); close(a.left.frequency.value,215); close(a.right.frequency.value,225);
});
test('progression pause, stop, replay and switching to manual control the chord clock',()=>{
  const r=runtime(), a=r.audio; a.setChordProgression(['C','G'],4);
  r.tick(4000); assert.equal(a.chordProgressionIndex,1);
  a.toggleChordProgression(); assert.ok(a.chordProgressionPaused); assert.equal(a.chordTimer,null);
  a.toggleChordProgression(); assert.ok(!a.chordProgressionPaused);
  a.stopChordProgression(); assert.equal(a.chordTimer,null); assert.equal(a.chordProgressionIndex,0);
  a.replayChordProgression(); assert.ok(a.chordTimer);
  a.setTonalSource('manual'); assert.equal(a.chordTimer,null); assert.ok(a.manualHarmonyTimer);
});
test('all noise colours and synth controls configure the original graph without resynthesizing files',()=>{
  const {audio:a}=runtime(); a.startAmbient();
  const voices=a.ambientVoices;
  a.setAtmosphere('restore'); a.setAmbientParameter('warmth',40); a.setAmbientParameter('space',60); a.setAmbientParameter('output',20);
  close(a.ambientBodyFilter.frequency.value,1320); close(a.ambientReverbWet.gain.value,.528); close(a.ambientSynthMaster.gain.value,.128);
  a.setAmbient('pads',30); assert.equal(a.ambientVoices,voices);
  for (const noise of ['white','pink','brown','rain','ocean','forest']) { a.config.noise=noise; a.startNoise(); assert.ok(a.noisePlaying); a.stopNoise(); }
});
test('offline model matches original inference with identical seeds and options',async()=>{
  const r=runtime({bridge:true});
  const original=new r.window.ResonaChordModel('web');
  // Supply the original loader its exact manifest and binary as a local fetch fixture.
  const bytes=fs.readFileSync(path.join(root,'vendor/chord-model/weights.bin'));
  r.window.fetch=async url=>({ok:true,json:async()=>bundle.manifest,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)});
  const options={seedChords:['C','Amin','F','G'],length:8,temperature:1,topK:10,greedy:true,continuous:false,duration:4};
  const expected=await original.generate(options);
  const promise=r.window.resonaCommand({action:'generate',args:[options]}); r.tick(0); await promise;
  const comparison=r.audio.harmonizeProgression(expected);
  assert.equal(r.audio.config.ambient.chordProgression.join(' '),comparison.join(' '));
  assert.ok(r.audio.ambientPlaying); assert.equal(r.messages.at(-1).generating,false);
});
test('continuous pipeline rotates A/B/C, and disabling it cancels future sets',async()=>{
  const r=runtime({bridge:true});
  const options={seedChords:['C'],length:2,temperature:1,topK:10,greedy:true,continuous:true,duration:2};
  const promise=r.window.resonaCommand({action:'generate',args:[options]}); r.tick(0); await promise;
  let state=r.messages.at(-1); assert.equal(state.pipeline.playing,'A'); assert.equal(state.pipeline.ready.join(''),'B'); assert.equal(state.pipeline.generating,'C');
  r.tick(0); await new Promise(resolve=>setImmediate(resolve));
  r.tick(2000); r.tick(2000);
  state=r.messages.at(-1); assert.equal(state.pipeline.playing,'B'); assert.equal(state.pipeline.ready.join(''),'C'); assert.equal(state.pipeline.generating,'D');
  await r.window.resonaCommand({action:'continuous',args:[false]});
  r.tick(0); await new Promise(resolve=>setImmediate(resolve));
  assert.equal(r.messages.at(-1).pipeline.enabled,false);
});


test('sleep deadline stops every track and chord clock before resuming a suspended app',async()=>{
 const r=runtime({bridge:true});await r.window.resonaCommand({action:'playSession'});r.audio.startNoise();r.audio.setChordProgression(['C','G'],4);
 await r.window.resonaCommand({action:'sleepTimer',args:[160000]});await r.window.resonaCommand({action:'suspend'});r.setNow(170000);
 await r.window.resonaCommand({action:'resume'});
 assert.equal(r.audio.playing,false);assert.equal(r.audio.ambientPlaying,false);assert.equal(r.audio.noisePlaying,false);assert.equal(r.audio.chordProgressionPlaying,false);assert.equal(r.audio.chordTimer,null);
 const state=r.messages.filter(m=>m.type==='state').at(-1);assert.equal(state.pipeline.enabled,false);
 assert.equal(r.messages.filter(m=>m.type==='error').length,0);
});
test('stop cancels a delayed noise restart and remote play is idempotent',async()=>{
 const r=runtime({bridge:true});await r.window.resonaCommand({action:'playSession'});const oscillator=r.audio.left;
 await r.window.resonaCommand({action:'playSession'});assert.equal(r.audio.left,oscillator);
 r.audio.startNoise();await r.window.resonaCommand({action:'setNoise',args:['rain']});await r.window.resonaCommand({action:'stopAll'});r.tick(850);
 assert.equal(r.audio.noisePlaying,false);assert.equal(r.audio.playing,false);assert.equal(r.audio.ambientPlaying,false);
 assert.equal(r.messages.filter(m=>m.type==='error').length,0);
});
test('remote pause preserves the original graph and freezes chords until play resumes',async()=>{
 const r=runtime({bridge:true});
 await r.window.resonaCommand({action:'playSession'});
 r.audio.setChordProgression(['C','G'],4);
 const oscillator=r.audio.left, voices=r.audio.ambientVoices;
 await r.window.resonaCommand({action:'pauseAll'});
 assert.equal(r.audio.context.state,'suspended');
 assert.equal(r.messages.at(-1).paused,true);
 assert.equal(r.messages.at(-1).playing,false);
 r.tick(4000);
 assert.equal(r.audio.chordProgressionIndex,0);
 await r.window.resonaCommand({action:'playSession'});
 assert.equal(r.audio.context.state,'running');
 assert.equal(r.audio.left,oscillator);
 assert.equal(r.audio.ambientVoices,voices);
 r.tick(4000);
 assert.equal(r.audio.chordProgressionIndex,1);
 assert.equal(r.messages.at(-1).paused,false);
});
test('cancelled sleep timer does not stop a later session',async()=>{
 const r=runtime({bridge:true});await r.window.resonaCommand({action:'sleepTimer',args:[160000]});await r.window.resonaCommand({action:'sleepTimer',args:[null]});r.setNow(170000);await r.window.resonaCommand({action:'playSession'});await r.window.resonaCommand({action:'resume'});assert.ok(r.audio.playing&&r.audio.ambientPlaying);
});
