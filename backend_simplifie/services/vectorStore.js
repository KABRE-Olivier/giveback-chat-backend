const fs = require('fs');
const path = require('path');

// Toutes les données sont stockées dans UN SEUL fichier JSON, directement dans le
// dossier du projet. Recherche par mots-clés (pas de modèle IA lourd chargé en mémoire) —
// choix fait pour tenir dans les 512 Mo du plan gratuit d'hébergement.

const STORE_PATH = path.join(__dirname, '..', 'vector_store.json');

function loadStore() {
  if (!fs.existsSync(STORE_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
  } catch (e) {
    console.error('⚠️ vector_store.json illisible, on repart de zéro.');
    return [];
  }
}

function saveStore(items) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(items));
}

function clearAll() {
  saveStore([]);
}

/** Ajoute des chunks (texte + source) au magasin */
function addChunks(chunks) {
  const store = loadStore();
  store.push(...chunks);
  saveStore(store);
}

const MOTS_VIDES = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'est', 'sont',
  'que', 'qui', 'quoi', 'pour', 'dans', 'sur', 'avec', 'sans', 'ce', 'cette',
  'ces', 'à', 'au', 'aux', 'en', 'par', 'se', 'sa', 'son', 'ses', 'il', 'elle',
]);

function extraireMotsCles(texte) {
  return (texte || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // retire les accents
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(m => m.length > 2 && !MOTS_VIDES.has(m));
}

/** Recherche les chunks les plus pertinents par correspondance de mots-clés */
async function searchPdfChunks(question, limit = 5) {
  const store = loadStore();

  if (store.length === 0) {
    throw new Error("La base de documents n'est pas disponible. Exécutez `npm run index-pdfs`.");
  }

  const motsQuestion = extraireMotsCles(question);
  if (motsQuestion.length === 0) return [];

  const scored = store.map(item => {
    const motsChunk = extraireMotsCles(item.text);
    const score = motsQuestion.reduce((acc, mot) => acc + motsChunk.filter(m => m.includes(mot) || mot.includes(m)).length, 0);
    return { ...item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const pertinents = scored.filter(item => item.score > 0);

  return (pertinents.length ? pertinents : scored).slice(0, limit).map(item => ({
    text: item.text,
    source: item.source,
    score: item.score,
  }));
}

module.exports = { addChunks, clearAll, searchPdfChunks, loadStore };
