const {chromium}=require('playwright');
const {PDFDocument,StandardFonts}=require('pdf-lib');
const {Document,Packer,Paragraph}=require('docx');
const sharp=require('sharp');
const fs=require('node:fs/promises');
const assert=require('node:assert/strict');
(async()=>{
await fs.mkdir('test-results',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
await context.addInitScript(()=>{const NativeAudio=window.Audio;window.Audio=class extends NativeAudio{constructor(...args){super(...args);window.__testAudio=this;}};});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE_ERROR',e.message);});page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE_ERROR',m.text().slice(0,350));});page.on('requestfailed',r=>console.log('REQUEST_FAILED',r.url(),r.failure()?.errorText));
try{
await page.goto('http://127.0.0.1:4173');await page.locator('.sentence').first().waitFor();
await page.screenshot({path:'test-results/desktop.png',fullPage:true});
await page.locator('#font').selectOption('dys');await page.evaluate(()=>document.fonts.ready);console.log('FONT',await page.evaluate(()=>document.fonts.check('22px OpenDyslexic')));await page.locator('#font').selectOption('sans');
await page.locator('#play').click();console.log('VOICE_START');
await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Siwis vous accompagne')||document.querySelector('#status').classList.contains('error'),{},{timeout:300000});
console.log('VOICE_RESULT',await page.locator('#status').textContent());
assert.match(await page.locator('#status').textContent(),/Siwis vous accompagne/);
const sample=await page.evaluate(async()=>Array.from(new Uint8Array(await(await fetch(window.__testAudio.src)).arrayBuffer())));await fs.writeFile('test-results/siwis-francais.wav',Buffer.from(sample));assert.ok(sample.length>24000);
await page.waitForFunction(()=>document.querySelector('#position').value==='1',null,{timeout:60000});console.log('VOICE_AUDIO_AND_SENTENCE_SYNC_OK');
await page.locator('#play').click();assert.equal(await page.locator('#play-label').textContent(),'Reprendre');await page.locator('#play').click();await page.waitForTimeout(700);await page.locator('#play').click();
console.log('VOICE_PAUSE_RESUME_OK');
const pdf=await PDFDocument.create();const font=await pdf.embedFont(StandardFonts.Helvetica);for(let i=1;i<=130;i++){pdf.addPage().drawText(`Page ${i}. Un cours accessible pour apprendre ensemble.`,{x:40,y:700,size:18,font});}
await page.locator('#file').setInputFiles({name:'Cours 130 pages.pdf',mimeType:'application/pdf',buffer:Buffer.from(await pdf.save())});
await page.waitForFunction(()=>!document.querySelector('#import-dialog').open,null,{timeout:120000});
assert.equal(await page.locator('#page-total').textContent(),'sur 130');assert.equal(await page.locator('#play-label').textContent(),'Pause');console.log('IMPORT_AUTOPLAY_OK');await page.locator('#page-input').fill('130');await page.locator('#page-input').press('Tab');assert.match(await page.locator('#text').textContent(),/Page 130/);console.log('PDF_130_OK');
await page.waitForTimeout(500);await page.reload();await page.waitForFunction(()=>document.querySelector('#page-input').value==='130');console.log('RESUME_OK');
const word=new Document({sections:[{children:[new Paragraph('Bonjour, voici un document Word.'),new Paragraph('Nous lisons ensemble avec Lisi.')]}]});
await page.locator('#file').setInputFiles({name:'Cours Word.docx',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer:await Packer.toBuffer(word)});await page.waitForFunction(()=>!document.querySelector('#import-dialog').open,null,{timeout:120000});assert.match(await page.locator('#text').textContent(),/document Word/);console.log('DOCX_OK');
const photo=await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="500"><rect width="100%" height="100%" fill="white"/><text x="70" y="170" font-family="Arial" font-size="48" fill="black">Bonjour. La lecture devient accessible.</text><text x="70" y="260" font-family="Arial" font-size="48" fill="black">Nous apprenons chaque jour ensemble.</text></svg>')).png().toBuffer();
await page.locator('#file').setInputFiles({name:'Cours photo.png',mimeType:'image/png',buffer:photo});await page.waitForFunction(()=>!document.querySelector('#import-dialog').open,null,{timeout:180000});assert.match(await page.locator('#text').textContent(),/lecture devient accessible/i);console.log('PHOTO_OCR_OK');
const scan=await PDFDocument.create();const img=await scan.embedPng(photo);scan.addPage([700,250]).drawImage(img,{x:0,y:0,width:700,height:250});await page.locator('#file').setInputFiles({name:'Cours scanne.pdf',mimeType:'application/pdf',buffer:Buffer.from(await scan.save())});await page.waitForFunction(()=>!document.querySelector('#import-dialog').open,null,{timeout:180000});assert.match(await page.locator('#text').textContent(),/lecture devient accessible/i);console.log('SCANNED_PDF_OK');
await page.locator('#file').setInputFiles({name:'ancien.doc',mimeType:'application/msword',buffer:Buffer.from('not a docx')});await page.waitForFunction(()=>!document.querySelector('#import-dialog').open);assert.match(await page.locator('#status').textContent(),/Format non pris en charge/);console.log('INVALID_FILE_OK');
await page.locator('[data-theme="night"]').click();await page.locator('#focus').click();assert.equal(await page.locator('#focus').getAttribute('aria-pressed'),'true');await page.locator('#focus').click();await page.locator('[data-theme="light"]').click();
await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);console.log('MOBILE_OK');
assert.deepEqual(errors,[]);console.log('ALL_BROWSER_CHECKS_PASSED');
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
