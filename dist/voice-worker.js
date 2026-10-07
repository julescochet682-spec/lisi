import {env,StyleTextToSpeech2Model,AutoTokenizer,Tensor} from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2';
import createEphone, {roa} from 'https://cdn.jsdelivr.net/npm/ephone@1.0.2/ephone.js';
env.allowLocalModels=false;
env.backends.onnx.wasm.numThreads=1;
const modelId='onnx-community/Kokoro-82M-v1.0-ONNX';
let engine;
const pronunciation=createEphone(roa).then(p=>{p.setVoice('fr');return p;});
async function initialize(){if(!engine)engine=(async()=>{
  postMessage({type:'progress',message:'Téléchargement de la voix française (environ 100 Mo au premier lancement)…'});
  const [model,tokenizer,response]=await Promise.all([
    StyleTextToSpeech2Model.from_pretrained(modelId,{dtype:'q8',device:'wasm',progress_callback:p=>{if(p.status==='progress'&&p.file?.endsWith('.onnx'))postMessage({type:'progress',message:`Téléchargement de la voix : ${Math.round(p.progress)} %`});}}),
    AutoTokenizer.from_pretrained(modelId),
    fetch(`https://huggingface.co/${modelId}/resolve/main/voices/ff_siwis.bin`)
  ]);
  if(!response.ok)throw new Error('Voix française inaccessible.');
  const voice=new Float32Array(await response.arrayBuffer());
  postMessage({type:'progress',message:'La voix française est prête. Préparation de la première phrase…'});
  return {model,tokenizer,voice};
})().catch(e=>{engine=null;throw e;});return engine;}
async function synthesize(text){const {model,tokenizer,voice}=await initialize();
  let phonemes=(await pronunciation).textToIpa(text.replace(/«/g,'“').replace(/»/g,'”'));
  phonemes=phonemes.replace(/\((?:en|fr)\)/g,'').replace(/t͡ʃ/g,'ʧ').replace(/d͡ʒ/g,'ʤ').replace(/͡/g,'').replace(/-/g,'').trim();
  const {input_ids}=tokenizer(phonemes,{truncation:false});const length=input_ids.dims.at(-1)-2;
  if(length>509)throw new Error('Cette phrase est trop longue pour la voix.');
  const style=voice.slice(Math.max(0,length)*256,(Math.max(0,length)+1)*256);
  const result=await model({input_ids,style:new Tensor('float32',style,[1,256]),speed:new Tensor('float32',[1],[1])});
  return new Float32Array(result.waveform.data);
}
let queue=Promise.resolve();
self.onmessage=({data})=>{queue=queue.catch(()=>{}).then(async()=>{try{const samples=await synthesize(data.text);postMessage({type:'audio',id:data.id,samples},[samples.buffer]);}catch(error){postMessage({type:'error',id:data.id,message:error.message});}});};
