const path=require('node:path');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const esbuild=require('esbuild');
const project=path.resolve(__dirname,'..');
const os=require('node:os');
const fs=require('node:fs');
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'resona-locale-test-'));
const bundlePath=path.join(temporary,'harness.cjs');
const motion=process.argv.includes('--motion');
(async()=>{
 const dom=new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>',{url:'http://localhost',pretendToBeVisual:true});
 Object.assign(global,{window:dom.window,localStorage:dom.window.localStorage,document:dom.window.document,HTMLElement:dom.window.HTMLElement,ShadowRoot:dom.window.ShadowRoot,Element:dom.window.Element,Node:dom.window.Node,requestAnimationFrame:dom.window.requestAnimationFrame.bind(dom.window),cancelAnimationFrame:dom.window.cancelAnimationFrame.bind(dom.window),getComputedStyle:dom.window.getComputedStyle.bind(dom.window)});
 Object.defineProperty(global,'navigator',{value:dom.window.navigator,configurable:true});
 global.IS_REACT_ACT_ENVIRONMENT=true;
 dom.window.AnimationEvent=dom.window.Event;
 dom.window.TransitionEvent=dom.window.Event;
 dom.window.matchMedia=query=>({matches:!motion && query.includes('prefers-reduced-motion'),media:query,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
 await esbuild.build({stdin:{contents:`import React,{act,useState} from 'react';import{createRoot}from'react-dom/client';import{SafeAreaProvider}from'react-native-safe-area-context';import{MotionProvider}from'./src/motion';import{BlurBackdropProvider}from'./src/components/BlurBackdrop';import{TutorialProvider,useLanguagePicker}from'./src/tutorial-context';import{LanguageProvider,LocalizedText,useLanguage}from'./src/i18n';import{StartupProvider}from'./src/startup';import SleepTimer from './src/components/SleepTimer';function Launcher(){const open=useLanguagePicker(),{language}=useLanguage();const[deadline,setDeadline]=useState<number|null>(null);return <><button onClick={open}>Change language</button><LocalizedText>Home</LocalizedText><output id="language">{language}</output><SleepTimer deadline={deadline} remaining={900} finished={false} onChange={minutes=>setDeadline(minutes===null?null:Date.now()+minutes*60000)}/><output id="timer">{deadline?'on':'off'}</output></>}export{React,act,createRoot};export function App(){return <SafeAreaProvider initialMetrics={{frame:{x:0,y:0,width:390,height:844},insets:{top:0,bottom:0,left:0,right:0}}}><LanguageProvider><StartupProvider><MotionProvider><BlurBackdropProvider><TutorialProvider><Launcher/></TutorialProvider></BlurBackdropProvider></MotionProvider></StartupProvider></LanguageProvider></SafeAreaProvider>}`,resolveDir:project,loader:'tsx'},outfile:bundlePath,bundle:true,loader:{'.png':'dataurl'},platform:'browser',format:'cjs',jsx:'automatic',alias:{'react-native':path.join(project,'node_modules/react-native-web')},resolveExtensions:['.web.tsx','.tsx','.web.ts','.ts','.web.js','.js','.json'],define:{'process.env.NODE_ENV':'"development"',__DEV__:'true'}});
 const {React,act,createRoot,App}=require(bundlePath);
 let root;
 async function mount(){await act(async()=>{root=createRoot(document.getElementById('root'));root.render(React.createElement(App));await new Promise(r=>setTimeout(r,80));});}
 const text=()=>document.body.textContent;
 async function click(label){const button=[...document.querySelectorAll('button,[role=button],[role=radio]')].find(el=>el.getAttribute('aria-label')===label||el.textContent.trim()===label);assert.ok(button,`Missing button ${label}: ${text()}`);await act(async()=>{button.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true}));});await act(async()=>{await new Promise(r=>setTimeout(r,motion ? 500 : 100));});
 // JSDOM has no CSS animation engine; deliver Modal's animation-end lifecycle.
 await act(async()=>{for(const el of document.querySelectorAll('div'))el.dispatchEvent(new dom.window.Event('animationend',{bubbles:true}));});}
 async function unmount(){await act(async()=>root.unmount());}
 async function settle(){await act(async()=>{await new Promise(r=>setTimeout(r,850));});await act(async()=>{await new Promise(r=>setTimeout(r,100));});}
 await mount();await settle();assert.match(text(),/Choose your language/);assert.doesNotMatch(text(),/Find your kind of quiet/);
 for(const name of ['English','简体中文','繁體中文','Español','हिन्दी','العربية','Português','Français','Русский','日本語'])assert.ok(text().includes(name),name);
 await click('简体中文');assert.match(text(),/选择语言/);await click('继续');
 assert.match(text(),/健康提示/);assert.doesNotMatch(text(),/找到你的宁静/);
 await click('继续');assert.match(text(),/找到你的宁静/);
 assert.equal(localStorage.getItem('resona.language.v1'),'zh');
 await click('跳过指南');await unmount();await mount();await settle();assert.doesNotMatch(text(),/找到你的宁静/);assert.doesNotMatch(text(),/选择语言/);assert.match(text(),/首页/);
 await click('Change language');await click('繁體中文');assert.match(text(),/選擇語言/);
 await click('完成');assert.match(text(),/睡眠計時器/);
 await unmount();await mount();await settle();assert.equal(document.documentElement.lang,'zh-Hant');
 assert.match(text(),/睡眠計時器/);
 await click('Change language');await click('العربية');assert.equal(document.documentElement.dir,'rtl');assert.equal(document.documentElement.lang,'ar');
 // Localized completion closes the picker without restarting the tour.
 const done=require(path.join(project,'src/i18n/messages.json'))['Done'][3];await click(done);assert.doesNotMatch(text(),/Choose your language/);
 await click('Change language');await click('English');await click('Done');assert.equal(document.documentElement.dir,'ltr');
 await click('15 min');assert.equal(document.getElementById('timer').textContent,'on');assert.match(text(),/Time remaining.*15:00/);await click('Cancel timer');assert.equal(document.getElementById('timer').textContent,'off');
 await unmount();dom.window.close();fs.rmSync(temporary,{recursive:true,force:true});console.log('PASS: native language names, language before tour, live translation, saved preference, Arabic RTL, language change, sleep timer controls');process.exit(0);
})().catch(error=>{console.error(error);fs.rmSync(temporary,{recursive:true,force:true});process.exit(1);});
