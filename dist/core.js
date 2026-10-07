export function splitText(text, max=260) {
  const result=[];
  const paragraphs=text.replace(/\r/g,'').split(/\n\s*\n/).map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean);
  for (const [paragraph, value] of paragraphs.entries()) {
    const segments=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('fr',{granularity:'sentence'}).segment(value)].map(x=>x.segment):value.match(/[^.!?]+[.!?]*\s*/g)||[value];
    for(const segment of segments){let chunk='';for(const word of segment.trim().split(/\s+/)){if(chunk && chunk.length+word.length+1>max){result.push({text:chunk,paragraph});chunk='';}if(word.length>max){if(chunk){result.push({text:chunk,paragraph});chunk='';}for(let i=0;i<word.length;i+=max)result.push({text:word.slice(i,i+max),paragraph});}else chunk+=(chunk?' ':'')+word;}if(chunk)result.push({text:chunk,paragraph});}
  }
  return result;
}
export function buildDocument(name,kind,pages,id=crypto.randomUUID()) {
  const sections=pages.map((p,page)=>({page:page+1,text:p,segments:splitText(p)}));
  const sentences=sections.flatMap(p=>p.segments.map(s=>({...s,page:p.page})));
  return {id,name,kind,pages:sections.map(p=>p.text),sentences,position:0,createdAt:Date.now()};
}
export function clampPosition(value,length){return Math.max(0,Math.min(Math.max(0,length-1),Number.isFinite(Number(value))?Math.trunc(Number(value)):0));}
export function wavBlob(samples,rate=24000){const buffer=new ArrayBuffer(44+samples.length*2),v=new DataView(buffer);const str=(s,o)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};str('RIFF',0);v.setUint32(4,36+samples.length*2,true);str('WAVE',8);str('fmt ',12);v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);str('data',36);v.setUint32(40,samples.length*2,true);for(let i=0;i<samples.length;i++){const x=Math.max(-1,Math.min(1,samples[i]));v.setInt16(44+i*2,x<0?x*32768:x*32767,true);}return new Blob([buffer],{type:'audio/wav'});}
