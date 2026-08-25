const fs = require('fs');
const path = require('path');

// Toutes les données (textes + embeddings) sont stockées dans UN SEUL fichier JSON,
// directement dans le dossier du projet. Plus besoin d'un serveur ChromaDB séparé
// qui tournerait en parallèle — un seul service à héberger, beaucoup plus simple.

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

/** Similarité cosinus entre deux vecteurs */
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Vide entièrement l'index (utilisé avant une réindexation complète) */
function clearAll() {
  saveStore([]);
}

/** Ajoute des chunks (texte + embedding + source) au magasin */
function addChunks(chunks) {
  const store = loadStore();
  store.push(...chunks);
  saveStore(store);
}

/** Recherche les chunks les plus proches d'une question, par similarité cosinus */
async function searchPdfChunks(question, limit = 5) {
  const { generateEmbedding } = require('./embeddings');
  const store = loadStore();

  if (store.length === 0) {
    throw new Error("La base de documents n'est pas disponible. Exécutez `npm run index-pdfs`.");
  }

  const questionEmbedding = await generateEmbedding(question);

  const scored = store.map(item => ({
    ...item,
    score: cosineSimilarity(questionEmbedding, item.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(item => ({
    text: item.text,
    source: item.source,
    distance: 1 - item.score,
  }));
}

module.exports = { addChunks, clearAll, searchPdfChunks, loadStore };
