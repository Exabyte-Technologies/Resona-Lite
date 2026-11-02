const path=require('node:path');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const esbuild=require('esbuild');
const project=path.resolve(__dirname,'..');
const os=require('node:os');
const fs=require('node:fs');
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'resona-mixer-test-'));
const bundlePath=path.join(temporary,'harness.cjs');
const motion=process.argv.includes('--motion');
(async()=>{
 const dom=new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>',{url:'http://localhost',pretendToBeVisual:true});
 Object.assign(global,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,ShadowRoot:dom.window.ShadowRoot,Element:dom.window.Element,Node:dom.window.Node,requestAnimationFrame:dom.window.requestAnimationFrame.bind(dom.window),cancelAnimationFrame:dom.window.cancelAnimationFrame.bind(dom.window),getComputedStyle:dom.window.getComputedStyle.bind(dom.window)});
 Object.defineProperty(global,'navigator',{value:dom.window.navigator,configurable:true});
 global.IS_REACT_ACT_ENVIRONMENT=true;
 dom.window.AnimationEvent=dom.window.Event;
 dom.window.TransitionEvent=dom.window.Event;
 dom.window.matchMedia=query=>({matches:!motion && query.includes('prefers-reduced-motion'),media:query,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
 await esbuild.build({stdin:{contents:`import React,{act,useState} from 'react';import{createRoot}from'react-dom/client';import{SafeAreaProvider}from'react-native-safe-area-context';import{MotionProvider}from'./src/motion';import{BlurBackdropProvider}from'./src/components/BlurBackdrop';import HomeScreen from './src/screens/HomeScreen';import{DEFAULT_SETTINGS}from'./src/model';export{React,act,createRoot};export function App(){const[settings,setSettings]=useState(DEFAULT_SETTINGS);return <SafeAreaProvider initialMetrics={{frame:{x:0,y:0,width:390,height:844},insets:{top:0,bottom:0,left:0,right:0}}}><MotionProvider><BlurBackdropProvider><HomeScreen settings={settings} isPlaying={false} audioReady={true} audioError={null} onTogglePlayback={()=>{}} onSelectMode={()=>{}} onMasterVolumeChange={value=>setSettings(s=>({...s,masterVolume:value}))} onLayerVolumeChange={(key,value)=>setSettings(s=>({...s,[key]:value}))}/><output id="settings">{JSON.stringify(settings)}</output></BlurBackdropProvider></MotionProvider></SafeAreaProvider>}`,resolveDir:project,loader:'tsx'},outfile:bundlePath,bundle:true,platform:'browser',format:'cjs',jsx:'automatic',alias:{'react-native':path.join(project,'node_modules/react-native-web')},resolveExtensions:['.web.tsx','.tsx','.web.ts','.ts','.web.js','.js','.json'],define:{'process.env.NODE_ENV':'"development"',__DEV__:'true'}});
 const {React,act,createRoot,App}=require(bundlePath);
 let root;
 async function mount(){await act(async()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(App));await new Promise(r=>setTimeout(r,80));});}
 const text=()=>document.body.textContent;
 async function click(label){const button=[...document.querySelectorAll('button,[role=button]')].find(el=>el.getAttribute('aria-label')===label||el.textContent.trim()===label);assert.ok(button,`Missing button ${label}: ${text()}`);await act(async()=>{button.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true}));});await act(async()=>{await new Promise(r=>setTimeout(r,motion ? 500 : 100));});
 // JSDOM has no CSS animation engine; deliver Modal's animation-end lifecycle.
 await act(async()=>{for(const el of document.querySelectorAll('div'))el.dispatchEvent(new dom.window.Event('animationend',{bubbles:true}));});}
 async function unmount(){await act(async()=>root.unmount());}
 await mount();assert.doesNotMatch(text(),/Find your blend/);
 await click('Open layer balance');assert.match(text(),/Find your blend/);
 const sliders=[...document.querySelectorAll('[role=slider]')];
 assert.equal(sliders.length,4,'Master plus three mix sliders');
 const binaural=sliders.find(el=>el.getAttribute('aria-label')==='Binaural beats');
 assert.ok(binaural,'Binaural control is accessible');
 let ancestor=binaural;const margins=[];for(let i=0;i<4&&ancestor;i++,ancestor=ancestor.parentElement){const css=getComputedStyle(ancestor);margins.push({left:css.marginLeft,inline:css.marginInline,start:css.marginInlineStart});}
 assert.ok(margins.some(m=>[m.left,m.inline,m.start].includes('8px')),JSON.stringify(margins));
 assert.ok([...document.querySelectorAll('div')].some(el=>el.style.backdropFilter?.includes('blur(')),'Dialog has a real blur layer');
 await act(async()=>{binaural.dispatchEvent(new dom.window.MouseEvent('mousedown',{bubbles:true,clientX:10,button:0}));});
 await act(async()=>{binaural.dispatchEvent(new dom.window.MouseEvent('mouseup',{bubbles:true,clientX:10,button:0}));});
 assert.equal(JSON.parse(document.querySelector('#settings').textContent).binauralVolume,100,'Slider commits through Home callback');
 await click('Close layer balance');assert.doesNotMatch(text(),/Find your blend/);
 await click('Open layer balance');assert.match(text(),/100%/);
 await click('Close layer balance');
 await unmount();dom.window.close();fs.rmSync(temporary,{recursive:true,force:true});
 console.log(`PASS (${motion ? 'animated' : 'reduced motion'}): Home mixer open/close, real blur, shortened sliders, live volume updates, retained mix`);
 process.exit(0);
})().catch(error=>{console.error(error);fs.rmSync(temporary,{recursive:true,force:true});process.exit(1);});
