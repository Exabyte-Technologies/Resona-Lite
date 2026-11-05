const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const originalLoader = require.extensions['.ts'];
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions:{module:ts.ModuleKind.CommonJS} }).outputText, filename);
const { DEFAULT_CONFIGURATION, normalizeConfiguration, decodeLibrary } = require('../src/sound-configurations.ts');
require.extensions['.ts'] = originalLoader;

test('fresh/reset chord defaults match the requested settings without changing mixer defaults', () => {
  assert.deepEqual(DEFAULT_CONFIGURATION.editor, {
    seed:'', length:8, duration:30, temperature:1, topK:10, greedy:false, continuous:true, enabled:true,
  });
  const { sound, progression } = DEFAULT_CONFIGURATION;
  assert.equal(sound.chordTransition, .5);
  assert.equal(sound.binauralChordTransition, .5);
  assert.deepEqual([sound.binauralVolume, sound.ambientVolume, sound.noiseVolume], [15,90,0]);
  assert.equal(progression.duration,30);
  assert.deepEqual(normalizeConfiguration(DEFAULT_CONFIGURATION), DEFAULT_CONFIGURATION);
});

test('chord enable preference survives storage, including enabled before first generation', () => {
  for (const enabled of [true,false]) {
    const current = { ...DEFAULT_CONFIGURATION, editor:{...DEFAULT_CONFIGURATION.editor, enabled} };
    const result = decodeLibrary(JSON.stringify({ version:1, revision:1, current, saved:[{id:1,name:'Quiet',configuration:current}] }));
    assert.deepEqual(result.current,current);
    assert.deepEqual(result.saved[0].configuration,current);
  }
});

test('existing saved custom timing and manual/generated choices survive migration', () => {
  for (const tonalSource of ['manual','generated']) {
    const result = normalizeConfiguration({
      sound:{...DEFAULT_CONFIGURATION.sound,tonalSource,chordTransition:1,binauralChordTransition:2},
      editor:{seed:'C',length:4,duration:12,temperature:1.3,topK:9,greedy:true,continuous:false},
      progression:{chords:['C','G'],duration:12},
    });
    assert.equal(result.editor.enabled,tonalSource==='generated');
    assert.equal(result.editor.duration,12);
    assert.equal(result.editor.continuous,false);
    assert.equal(result.sound.chordTransition,1);
    assert.equal(result.sound.binauralChordTransition,2);
  }
});
