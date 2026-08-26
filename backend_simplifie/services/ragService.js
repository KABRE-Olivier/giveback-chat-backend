const OpenAI = require('openai');
const { searchPdfChunks } = require('./vectorStore');

const MODEL = 'openai/gpt-oss-20b';
const MAX_CONTEXT_CHARACTERS = 12000;

function getClient() {
    if (!process.env.GROQ_API_KEY?.startsWith('gsk_')) {
        throw new Error('GROQ_API_KEY est absente ou invalide.');
    }
    return new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1'
    });
}

async function answerPdfQuestion(question) {
    const matches = await searchPdfChunks(question);
    if (matches.length === 0) {
        return { answer: "Je n'ai trouvé aucun passage pertinent dans les documents indexés.", sources: [] };
    }

    const context = matches.map(match => `Extrait du document "${match.source}" :\n${match.text}`)
        .join('\n\n---\n\n').slice(0, MAX_CONTEXT_CHARACTERS);
    const completion = await getClient().chat.completions.create({
        model: MODEL,
        messages: [
            { role: 'system', content: "Tu es l'assistant IA d'AfricanYouth GiveBack. Réponds uniquement à partir du contexte fourni ci-dessous, de façon naturelle et fluide, comme dans une vraie conversation. N'utilise jamais de crochets, de balises [Source: ...], ni de citations entre guillemets — reformule toujours avec tes propres mots. Si le contexte ne suffit pas pour répondre, dis-le simplement, sans inventer. Réponds toujours en français.\n\nContexte :\n" + context },
            { role: 'user', content: question }
        ],
        max_tokens: 1000,
        temperature: 0.3
    });
    return {
        answer: completion.choices[0]?.message?.content || 'Aucune réponse n\'a pu être générée.',
        sources: [...new Set(matches.map(match => match.source))]
    };
}

module.exports = { answerPdfQuestion };
