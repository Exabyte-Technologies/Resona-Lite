// Run with playwright in NODE_PATH. This compares real Web Audio DSP, not mocks.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const bundle = require('../src/engine/bundle.json');
const upstream = process.env.RESONA_SOURCE || path.resolve(__dirname, '../../../Resona/resona/static/js/audio.js');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true });
  try {
    const page = await browser.newPage();
    const results = await page.evaluate(async ({original,lite}) => {
      async function render(source,scenario) {
        let seed=123;
        const oldRandom=Math.random, oldInterval=window.setInterval;
        Math.random=()=>((seed=seed*16807%2147483647)-1)/2147483646;
        window.setInterval=()=>1;
        (0,eval)(source);
        const audio=window.resonaAudio;
        const context=new OfflineAudioContext(2,48000*5,48000);
        audio.context=context; audio.ensureContext=()=>context;
        const modes={sleep:[2,'deep',57],meditation:[6,'deep',53],focus:[10,'restore',57],awake:[18,'restore',48]};
        if (modes[scenario]) { const [beat,atmosphere,root]=modes[scenario]; audio.setBeat(beat); audio.setAtmosphere(atmosphere); audio.setTonalCentre(root); }
        if (scenario.startsWith('noise:')) { audio.setNoise(scenario.slice(6)); audio.startNoise(); }
        else { audio.start(); audio.startAmbient(); }
        if (scenario==='progression') { audio.setChordProgression(['C','Amin','F','G'],4); audio.chordProgressionIndex=1; audio.applyProgressionChord(); }
        if (scenario==='sculpt') { audio.setAtmosphere('melancholy'); audio.setAmbientParameter('warmth',37); audio.setAmbientParameter('space',66); audio.setAmbientParameter('output',42); audio.setAmbient('pads',32); audio.setDroneFrequency(196); }
        Math.random=oldRandom; window.setInterval=oldInterval;
        const buffer=await context.startRendering();
        return [buffer.getChannelData(0),buffer.getChannelData(1)];
      }
      const results=[];
      for (const scenario of ['sleep','meditation','focus','awake','progression','sculpt','noise:white','noise:pink','noise:brown','noise:rain','noise:ocean','noise:forest']) {
        const a=await render(original,scenario),b=await render(lite,scenario);
        let maximumDifference=0,energy=0;
        for (let c=0;c<2;c++) for(let i=0;i<a[c].length;i++) { maximumDifference=Math.max(maximumDifference,Math.abs(a[c][i]-b[c][i])); energy+=b[c][i]**2; }
        results.push({scenario,maximumDifference,rms:Math.sqrt(energy/(a[0].length*2))});
      }
      return results;
    },{original:fs.readFileSync(upstream,'utf8'),lite:bundle.audio});
    for (const result of results) { assert.ok(result.maximumDifference < 1e-6, JSON.stringify(result)); assert.ok(result.rms>0.00001); console.log(JSON.stringify(result)); }
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
