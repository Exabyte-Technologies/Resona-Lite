const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const Module=require('node:module');const ts=require('typescript');
function load(relative){const filename=path.resolve(__dirname,'..',relative);const loaded=new Module(filename,module);loaded.filename=filename;loaded.paths=Module._nodeModulePaths(path.dirname(filename));loaded._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,filename);return loaded.exports;}
const locale=load('src/i18n/core.ts'),timer=load('src/sleep-timer.ts');const messages=require('../src/i18n/messages.json');
test('every supported language has a native name and a complete nonempty catalog',()=>{
 assert.equal(locale.LANGUAGES.length,10);
 for(const [key,translations] of Object.entries(messages)){assert.equal(translations.length,locale.LANGUAGES.length-1,key);assert.ok(translations.every(value=>typeof value==='string'&&value.trim()),key);const placeholders=[...key.matchAll(/\{\{\w+\}\}/g)].map(v=>v[0]).sort();for(const value of translations)assert.deepEqual([...value.matchAll(/\{\{\w+\}\}/g)].map(v=>v[0]).sort(),placeholders,key);}
 for(const language of locale.LANGUAGES){assert.ok(locale.isLanguage(language.code));assert.ok(language.name);if(language.code!=='en')assert.notEqual(locale.translate(language.code,'Choose your language'),'Choose your language');}
 assert.equal(locale.isLanguage('de'),false);
});
test('translated sentences preserve interpolation, musical notation and spacing',()=>{
 assert.equal(locale.translate('zh','{{minutes}} min',{minutes:30}),'30 分钟');
 assert.equal(locale.translate('zh-Hant','{{minutes}} min',{minutes:30}),'30 分鐘');
 assert.match(locale.translate('es','Left {{left}} Hz · Right {{right}} Hz',{left:120,right:126}),/120.*126/);
 assert.equal(locale.translate('ja','C Amin F G'),'C Amin F G');
 assert.equal(locale.translate('fr',' Play '),' Lire ');
});
test('sleep deadline stays accurate across suspension and midnight, and cancellation clears it',()=>{
 const now=Date.UTC(2026,10,2,23,50);const end=timer.timerDeadline(30,now);
 assert.equal(end,Date.UTC(2026,10,3,0,20));assert.equal(timer.timerRemaining(end,now+17*60000),13*60);
 assert.equal(timer.timerExpired(end,end-1),false);assert.equal(timer.timerExpired(end,end),true);assert.equal(timer.timerRemaining(end,end+90000),0);
 assert.equal(timer.timerDeadline(null,now),null);assert.equal(timer.timerExpired(null,end),false);
 assert.equal(timer.formatRemaining(3661),'1:01:01');assert.equal(timer.formatRemaining(61),'1:01');
});
