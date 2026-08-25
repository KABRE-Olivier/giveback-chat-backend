require('dotenv').config();

const fs = require('fs');
const path = require('path');

const { extractTextFromDocument, chunkText } = require('./utils/pdfProcessor');
const { generateEmbeddings } = require('./services/embeddings');
const { addChunks, clearAll } = require('./services/vectorStore');

const DOCUMENTS_DIR = path.join(__dirname, 'pdfs');
const SUPPORTED_EXTENSIONS = new Set(['.pdf', '.docx', '.txt']);

async function indexAllPDFs() {
    console.log('📚 ========================================');
    console.log('📚 INDEXATION DES DOCUMENTS PDF');
    console.log('📚 ========================================\n');

    if (!fs.existsSync(DOCUMENTS_DIR)) {
        fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
        console.log(`📁 Dossier créé : ${DOCUMENTS_DIR}`);
        console.log('📝 Placez vos PDF, Word ou TXT dans ce dossier puis relancez : npm run index-pdfs');
        console.log('   (le chat normal fonctionne quand même sans PDF indexés)\n');
        return;
    }

    const documentFiles = fs.readdirSync(DOCUMENTS_DIR)
        .filter(file => SUPPORTED_EXTENSIONS.has(path.extname(file).toLowerCase()));

    if (documentFiles.length === 0) {
        console.log('⚠️ Aucun document compatible trouvé dans :');
        console.log(`   ${DOCUMENTS_DIR}\n`);
        console.log('   (le chat normal fonctionne quand même sans PDF indexés)\n');
        return;
    }

    console.log(`📄 ${documentFiles.length} document(s) trouvé(s) :`);
    documentFiles.forEach((file, index) => console.log(`   ${index + 1}. ${file}`));
    console.log('');

    clearAll();
    console.log('🗑️ Ancien index effacé, reconstruction en cours...\n');

    let totalChunks = 0;

    for (const documentFile of documentFiles) {
        try {
            console.log('----------------------------------------');
            console.log(`📄 Document : ${documentFile}`);
            console.log('----------------------------------------');

            const documentPath = path.join(DOCUMENTS_DIR, documentFile);

            console.log('📄 Extraction du texte...');
            const text = await extractTextFromDocument(documentPath);

            if (!text || text.trim().length === 0) {
                console.log('⚠️ Aucun texte lisible trouvé.');
                continue;
            }
            console.log(`   ✅ ${text.length} caractères extraits`);

            const chunks = chunkText(text);
            if (chunks.length === 0) {
                console.log('⚠️ Aucun chunk généré.');
                continue;
            }
            console.log(`🧩 ${chunks.length} chunks générés`);

            console.log('🧠 Génération des embeddings...');
            const embeddings = await generateEmbeddings(chunks);
            console.log(`   ✅ ${embeddings.length} embeddings générés`);

            const toStore = chunks.map((chunk, i) => ({
                text: chunk,
                embedding: embeddings[i],
                source: documentFile,
            }));
            addChunks(toStore);

            totalChunks += chunks.length;
            console.log(`✅ ${documentFile} indexé.\n`);

        } catch (error) {
            console.error(`❌ Erreur sur ${documentFile} :`);
            console.error(error.message);
            console.log('');
        }
    }

    console.log('========================================');
    console.log('🎉 INDEXATION TERMINÉE');
    console.log('========================================');
    console.log(`📄 Documents traités : ${documentFiles.length}`);
    console.log(`🧩 Chunks indexés : ${totalChunks}`);
    console.log(`🗄️ Fichier : vector_store.json`);
    console.log('\n✅ Les documents sont maintenant disponibles');
    console.log('   pour la recherche vectorielle.\n');
}

indexAllPDFs().catch(error => {
    console.error('\n❌ Erreur générale :');
    console.error(error);
    process.exit(1);
});
