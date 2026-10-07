# Lisi

Un espace de lecture en français pour écouter ses cours et suivre le texte à son rythme. PDF, Word `.docx`, photographies et texte brut. Interface responsive, commandes clavier et préférences de lecture.

## Démarrer

Prérequis : Node.js 20 ou supérieur. Aucune clé API ni dépendance à installer pour démarrer.

```sh
node serve.mjs
```

Ouvrir http://127.0.0.1:4173. Importer un document : la lecture démarre après extraction du texte. Si le navigateur bloque le démarrage automatique, cliquer sur **Écouter**.

Le dossier `dist/` est un site statique complet, déployable sur tout hébergement HTTPS (y compris GitHub Pages). Ne pas ouvrir `index.html` directement avec `file://` : les modules et workers nécessitent un serveur HTTP.

## Fonctionnalités

- Extraction des PDF page par page, avec reconnaissance des pages scannées.
- Word DOCX, TXT, photos PNG/JPEG/WebP ; reconnaissance française locale.
- Voix française Siwis avec Kokoro 82M, exécutée dans un Web Worker sur l’appareil.
- Surlignage synchronisé **par phrase**, passage automatique des pages et préparation de la phrase suivante.
- Pause/reprise, phrase précédente/suivante, déplacement dans le document et vitesse de 0,75 à 1,5.
- Bibliothèque et reprise de progression avec IndexedDB dans le navigateur.
- Taille, interligne, police OpenDyslexic facultative, page blanche/crème/sombre et mode concentration.
- Espace pour lecture/pause hors des commandes ; Entrée sur une phrase pour la lire.

## Voix et confidentialité

Siwis est une **voix de synthèse neuronale**, pas une personne qui lit en direct. Le premier lancement télécharge le modèle et ses composants (environ 100 Mo pour le moteur vocal) depuis Hugging Face et jsDelivr. La vitesse de génération dépend du matériel ; des pauses peuvent subsister entre phrases sur les appareils lents. L’application ne garantit pas le fonctionnement hors connexion.

L’extraction, la reconnaissance et la génération vocale Siwis s’effectuent dans le navigateur. Aucun document n’est téléversé par Lisi. Les services de téléchargement voient les requêtes réseau habituelles (dont l’adresse IP), sans recevoir le contenu des cours. Les modules tiers exécutés dans la page sont une dépendance de confiance ; une distribution intégralement autonome pourra les héberger elle-même.

L’option « Voix de cet appareil » utilise l’API vocale du navigateur : qualité et traitement local ou distant dépendent de la voix disponible. Elle n’est jamais choisie automatiquement en remplacement de Siwis.

Les documents et la progression restent sur cet appareil, dans ce navigateur et pour cette adresse du site. Passer de l’aperçu local au site publié crée une bibliothèque distincte. Effacer les données du navigateur efface cette copie. Le fichier d’origine n’est pas modifié. Aucun compte utilisateur, aucune synchronisation entre appareils, aucune mesure d’audience.

## Limites connues

- L’ordre d’extraction des PDF multicolonnes, tableaux et formules peut être imparfait. Les images et formules ne sont pas décrites.
- La reconnaissance des scans/photos doit être relue, surtout pour les documents flous et manuscrits.
- Les anciens `.doc`, fichiers HEIC et PDF protégés ne sont pas pris en charge. Exporter en DOCX/PDF déverrouillé/JPEG.
- Limite de fichier : 100 Mo. Les PDF sont traités séquentiellement ; 130 pages textuelles ont été testées. La durée des longs scans dépend de l’appareil.
- Word est découpé en sections de lecture : les numéros ne sont pas ceux de la mise en page d’origine.
- Le suivi est par phrase (ou fragment d’une très longue phrase), pas mot à mot. Les fragments ne dépassent pas 260 caractères.
- L’application propose des préférences de confort ; aucun réglage ou police n’est présenté comme adapté à toutes les personnes dyslexiques.
- Chrome/Edge récents conseillés. Les autres navigateurs et les appareils mobiles réels restent à valider.

## Vérifications

```sh
node --test tests/core.test.mjs
```

Les tests couvrent le découpage sans perte de texte, 130 pages dont une vide, les bornes de navigation et l’encodage audio. `tests/browser-smoke.cjs` effectue les essais réels de voix, progression, import PDF 130 pages, DOCX, photo, scan PDF, fichier refusé et affichage mobile. Pour l’exécuter, installer les dépendances de développement `playwright`, `pdf-lib`, `docx`, `sharp` et Microsoft Edge, puis lancer le serveur dans un autre terminal. Il télécharge les composants publics et n’utilise aucun document personnel.

WebMCP : deux outils facultatifs (`get_reading_state`, `go_to_reading_page`) sont enregistrés uniquement si le navigateur expose `document.modelContext`. Leur validation dans un navigateur prenant nativement en charge cette API n’a pas été possible ici ; ils ne sont pas requis pour utiliser Lisi.

## Structure et publication libre

- `dist/` : interface et modules de lecture, stockage, import et synthèse.
- `serve.mjs` : serveur local limité à l’adresse de boucle locale.
- `tests/` : vérifications reproductibles.
- `.openai/hosting.json` : identifiant du déploiement personnel Sites ; à retirer pour créer votre propre Site. Sans effet sur un hébergement statique classique.

Le projet est sous licence **GPL-3.0-or-later**. Voir `LICENSE` et `THIRD_PARTY_NOTICES.md`. Le code peut être publié dans un dépôt GitHub public. Ne pas ajouter les documents personnels, données de navigateur ou résultats de test au dépôt. `.gitignore` les exclut quand ils sont dans `test-results/`.

Les rapports de bugs et contributions sont bienvenus. Décrire le navigateur, les étapes et le résultat attendu, en utilisant un document de démonstration sans informations privées.
