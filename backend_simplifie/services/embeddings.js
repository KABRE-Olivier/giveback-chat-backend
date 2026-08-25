const { pipeline } = require('@xenova/transformers');

let extractor = null;

// Modèle multilingue adapté au français
const MODEL_NAME = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';

/**
 * Charge le modèle une seule fois.
 */
async function getExtractor() {
    if (!extractor) {
        console.log('');
        console.log('🧠 ========================================');
        console.log('🧠 CHARGEMENT DU MODÈLE D\'EMBEDDING');
        console.log('🧠 ========================================');
        console.log(`📦 Modèle : ${MODEL_NAME}`);
        console.log('🌍 Langues : multilingue / français');
        console.log('⏳ Premier chargement : téléchargement possible...');
        console.log('');

        extractor = await pipeline(
            'feature-extraction',
            MODEL_NAME
        );

        console.log('');
        console.log('✅ Modèle d\'embedding chargé !');
        console.log('');
    }

    return extractor;
}

/**
 * Nettoie le texte avant embedding.
 */
function cleanText(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }

    return text
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Génère un embedding pour un texte.
 */
async function generateEmbedding(text) {

    const cleanedText = cleanText(text);

    if (!cleanedText) {
        throw new Error('Le texte à encoder est vide.');
    }

    const model = await getExtractor();

    const output = await model(cleanedText, {
        pooling: 'mean',
        normalize: true
    });

    const embedding = Array.from(output.data);

    if (!embedding.length) {
        throw new Error('Le modèle a retourné un embedding vide.');
    }

    return embedding;
}

/**
 * Génère plusieurs embeddings.
 *
 * On traite les textes séquentiellement pour limiter
 * l'utilisation de la mémoire sur la machine.
 */
async function generateEmbeddings(texts, options = {}) {

    const {
        batchSize = 3
    } = options;

    if (!Array.isArray(texts) || texts.length === 0) {
        return [];
    }

    const embeddings = [];

    const totalBatches = Math.ceil(texts.length / batchSize);

    for (let i = 0; i < texts.length; i += batchSize) {

        const batch = texts.slice(
            i,
            Math.min(i + batchSize, texts.length)
        );

        const batchNumber = Math.floor(i / batchSize) + 1;

        console.log(
            `   🧠 Lot ${batchNumber}/${totalBatches} : ${batch.length} texte(s)`
        );

        for (const text of batch) {

            const embedding = await generateEmbedding(text);

            embeddings.push(embedding);
        }
    }

    return embeddings;
}

/**
 * Retourne la dimension du modèle.
 */
async function getEmbeddingDimension() {

    const embedding = await generateEmbedding(
        'Ceci est un texte de test en français.'
    );

    return embedding.length;
}

module.exports = {
    generateEmbedding,
    generateEmbeddings,
    getExtractor,
    getEmbeddingDimension,
    cleanText
};