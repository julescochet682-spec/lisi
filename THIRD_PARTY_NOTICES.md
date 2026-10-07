# Composants tiers

Le code original de Lisi est distribué sous GPL-3.0-or-later. Les composants suivants conservent leurs licences et attributions. Ils sont chargés depuis leurs distributions publiques ; aucun poids de modèle n’est inclus dans ce dépôt.

| Composant | Version utilisée | Licence / source |
|---|---|---|
| PDF.js (Mozilla) | 4.10.38 | Apache-2.0 — https://github.com/mozilla/pdf.js |
| Mammoth (Michael Williamson) | 1.9.0 | BSD-2-Clause — https://github.com/mwilliamson/mammoth.js |
| Tesseract.js | 6.0.1 | Apache-2.0 — https://github.com/naptha/tesseract.js |
| Transformers.js (Hugging Face) | 3.7.2 | Apache-2.0 — https://github.com/huggingface/transformers.js |
| Kokoro 82M v1.0 / conversion ONNX et voix ff_siwis | v1.0, dépôt principal | Apache-2.0 — https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX et https://huggingface.co/hexgrad/Kokoro-82M |
| ephone / eSpeak NG (prononciation française) | 1.0.2 | GPL-3.0-or-later — https://github.com/sjmik/ephone-js et https://github.com/espeak-ng/espeak-ng ; sources de la version : https://registry.npmjs.org/ephone/-/ephone-1.0.2.tgz |
| OpenDyslexic via Fontsource | 5.2.5 | Licence incluse dans la distribution — https://cdn.jsdelivr.net/npm/@fontsource/opendyslexic@5.2.5/LICENSE |

Les bibliothèques peuvent elles-mêmes dépendre de composants supplémentaires, notamment ONNX Runtime, WebAssembly et les données linguistiques Tesseract. Consulter leurs dépôts pour leurs licences complètes. Les dépendances de test ne sont pas incluses dans le site distribué.
