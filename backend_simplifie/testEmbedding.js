const { generateEmbedding } = require('./services/embeddings');

async function test() {
    try {
        console.log('🚀 Test du modèle d\'embedding...\n');

        const text = 'Quelles sont les conditions pour obtenir une bourse d études ?';

        const embedding = await generateEmbedding(text);

        console.log('\n✅ Test réussi !');
        console.log(`📐 Dimensions du vecteur : ${embedding.length}`);
        console.log('🔢 Premières valeurs :');
        console.log(embedding.slice(0, 10));

    } catch (error) {
        console.error('\n❌ Erreur :');
        console.error(error);
    }
}

test();