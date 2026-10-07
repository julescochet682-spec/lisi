const scripts=new Map();
function loadScript(url){if(!scripts.has(url))scripts.set(url,new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=url;s.onload=resolve;s.onerror=()=>{scripts.delete(url);s.remove();reject(new Error('Téléchargement du lecteur impossible. Vérifiez votre connexion.'));};document.head.append(s);}));return scripts.get(url);}
export async function extractFile(file,report,signal){
  if(file.size>100*1024*1024)throw new Error('Ce fichier dépasse 100 Mo. Exportez une version moins volumineuse.');
  const ext=file.name.split('.').pop().toLowerCase();
  let ocr;
  function check(){if(signal.aborted)throw new DOMException('Import annulé','AbortError');}
  async function recognize(image){check();await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js');check();if(!ocr){ocr=await Tesseract.createWorker('fra',1,{logger:m=>{if(m.status==='recognizing text')report('Reconnaissance du texte… '+Math.round(m.progress*100)+' %');}});check();}const r=await ocr.recognize(image);check();return r.data.text;}
  try{
    check();
    if(ext==='txt')return {kind:'TXT',pages:[await file.text()]};
    if(ext==='docx'){report('Lecture du document Word…');await loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.9.0/mammoth.browser.min.js');check();const r=await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});check();const paragraphs=r.value.split(/\n\s*\n/);const pages=[];let page='';for(const p of paragraphs){if(page.length>3500){pages.push(page);page='';}page+=p+'\n\n';}if(page.trim())pages.push(page);return {kind:'DOCX',pages};}
    if(['png','jpg','jpeg','webp'].includes(ext)){report('Reconnaissance de la photo…');return {kind:'PHOTO',pages:[await recognize(file)]};}
    if(ext!=='pdf')throw new Error('Format non pris en charge. Choisissez un PDF, DOCX, TXT, JPG, PNG ou WebP. Pour un ancien .doc, enregistrez-le en .docx.');
    report('Ouverture du PDF…');
    const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
    check();const task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false,useSystemFonts:true});
    const abort=()=>{void task.destroy().catch(()=>{});};signal.addEventListener('abort',abort,{once:true});
    let pdf;
    try{
      pdf=await task.promise;
      const pages=[];
      for(let n=1;n<=pdf.numPages;n++){
        check();report(`Lecture de la page ${n} sur ${pdf.numPages}…`,(n-1)/pdf.numPages*100);
        const page=await pdf.getPage(n);const content=await page.getTextContent();
        let text='';let previousY=null;
        for(const item of content.items){if(!('str' in item))continue;const y=item.transform[5];if(previousY!==null&&Math.abs(y-previousY)>Math.max(18,item.height*1.5))text+='\n\n';text+=item.str+(item.hasEOL?'\n':' ');previousY=y;}
        if(text.replace(/\s/g,'').length<8){report(`Reconnaissance de la page scannée ${n} sur ${pdf.numPages}…`,(n-1)/pdf.numPages*100);const native=page.getViewport({scale:1});const viewport=page.getViewport({scale:Math.min(2,2500/Math.max(native.width,native.height))});const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;text=await recognize(canvas);canvas.width=canvas.height=0;}
        pages.push(text);page.cleanup();
      }
      return {kind:'PDF',pages};
    }catch(error){if(signal.aborted)throw new DOMException('Import annulé','AbortError');if(error.name==='PasswordException')throw new Error('Ce PDF est protégé par un mot de passe. Déverrouillez-le puis importez-le à nouveau.');throw error;}
    finally{signal.removeEventListener('abort',abort);await task.destroy();}
  }finally{if(ocr)await ocr.terminate();}
}
