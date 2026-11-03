const path=require('node:path');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const esbuild=require('esbuild');
const project=path.resolve(__dirname,'..');
const os=require('node:os');
const fs=require('node:fs');
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'resona-tour-test-'));
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
 await esbuild.build({stdin:{contents:`import React,{act} from 'react';import{createRoot}from'react-dom/client';import{SafeAreaProvider}from'react-native-safe-area-context';import{MotionProvider}from'./src/motion';import{TutorialProvider,useTutorial}from'./src/tutorial-context';function Launcher(){const open=useTutorial();return <button onClick={open}>Replay tour</button>}export{React,act,createRoot};export function App(){return <SafeAreaProvider initialMetrics={{frame:{x:0,y:0,width:390,height:844},insets:{top:0,bottom:0,left:0,right:0}}}><MotionProvider><TutorialProvider><Launcher/></TutorialProvider></MotionProvider></SafeAreaProvider>}`,resolveDir:project,loader:'tsx'},outfile:bundlePath,bundle:true,loader:{'.png':'dataurl'},platform:'browser',format:'cjs',jsx:'automatic',alias:{'react-native':path.join(project,'node_modules/react-native-web')},resolveExtensions:['.web.tsx','.tsx','.web.ts','.ts','.web.js','.js','.json'],define:{'process.env.NODE_ENV':'"development"',__DEV__:'true'}});
 const {React,act,createRoot,App}=require(bundlePath);
 let root;
 async function mount(){await act(async()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(App));await new Promise(r=>setTimeout(r,80));});}
 const text=()=>document.body.textContent;
 async function click(label){const button=[...document.querySelectorAll('button,[role=button]')].find(el=>el.getAttribute('aria-label')===label||el.textContent.trim()===label);assert.ok(button,`Missing button ${label}: ${text()}`);await act(async()=>{button.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true}));});await act(async()=>{await new Promise(r=>setTimeout(r,motion ? 500 : 100));});
 // JSDOM has no CSS animation engine; deliver Modal's animation-end lifecycle.
 await act(async()=>{for(const el of document.querySelectorAll('div'))el.dispatchEvent(new dom.window.Event('animationend',{bubbles:true}));});}
 async function unmount(){await act(async()=>root.unmount());}
 await mount();assert.match(text(),/Health notice/);await click('Continue');
 assert.match(text(),/Find your kind of quiet/);assert.match(text(),/Step 1 of 4/);
 await click('Continue  →');assert.match(text(),/Press play. Settle in./);
 await click('Back');assert.match(text(),/Find your kind of quiet/);
 await click('Continue  →');await click('Continue  →');assert.match(text(),/Shape your sound/);
 await click('Continue  →');assert.match(text(),/Explore living chords/);
 await click('Let’s begin  →');assert.equal(window.localStorage.getItem('resona.tutorial.v1'),'completed');assert.doesNotMatch(text(),/Explore living chords/);
 await unmount();await mount();assert.doesNotMatch(text(),/Find your kind of quiet/);
 await click('Replay tour');assert.match(text(),/Find your kind of quiet/);assert.doesNotMatch(text(),/Health notice/);
 await click('Skip tutorial');assert.doesNotMatch(text(),/Find your kind of quiet/);
 await unmount();await mount();assert.doesNotMatch(text(),/Find your kind of quiet/);
 await unmount();window.localStorage.clear();await mount();await click('Continue');assert.match(text(),/Find your kind of quiet/);await click('Skip tutorial');await unmount();await mount();assert.doesNotMatch(text(),/Health notice|Find your kind of quiet/);
 await unmount();dom.window.close();fs.rmSync(temporary,{recursive:true,force:true});console.log(`PASS (${motion ? 'animated' : 'reduced motion'}): first launch, all steps, Back, finish persistence, Skip persistence, replay reset`);
 process.exit(0);
})().catch(error=>{console.error(error);fs.rmSync(temporary,{recursive:true,force:true});process.exit(1);});
