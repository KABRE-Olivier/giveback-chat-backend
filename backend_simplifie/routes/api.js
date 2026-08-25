const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

console.log('🔧 CHARGEMENT API - Version simplifiée');

let client;
let MODEL = '';

// 🔵 GROQ
if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith('gsk_')) {
  client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });
  MODEL = 'openai/gpt-oss-20b';
  console.log(`✅ Utilisation de Groq avec ${MODEL}`);
} else {
  console.error('❌ GROQ_API_KEY manquante');
  process.exit(1);
}

router.post('/ask', async (req, res) => {
  try {
    const { question, history } = req.body;

    if (!question || question.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'La question est requise'
      });
    }

    // 🧠 CONSTRUIRE LES MESSAGES
    let messages = [];

    if (history && Array.isArray(history) && history.length > 0) {
      // ✅ NE PRENDRE QUE LE SYSTÈME + 6 DERNIERS MESSAGES MAX
      const nonSystemMessages = history.filter(
        m => ['user', 'assistant'].includes(m.role) && typeof m.content === 'string'
      );
      const recentMessages = nonSystemMessages.slice(-6);

      // L'instruction système vient du serveur, jamais du navigateur.
      messages = [
        { role: 'system', content: 'Tu es un assistant IA utile, amical et qui répond en français.' },
        ...recentMessages
      ];
      
      console.log(`🧠 Messages préparés: ${messages.length}`);
    } else {
      messages = [
        { role: 'system', content: 'Tu es un assistant IA utile, amical et qui répond en français.' },
        { role: 'user', content: question }
      ];
    }

    // ⚡ APPEL API AVEC TIMEOUT
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: messages,
      max_tokens: 500,  // Réduit pour limiter la taille
      temperature: 0.7,
    });

    const answer = completion.choices[0]?.message?.content?.trim();
    if (!answer) {
      throw new Error("Le modèle n'a pas retourné de réponse exploitable. Réessayez votre question.");
    }
    console.log(`✅ Réponse générée (${answer.length} caractères)`);

    res.json({ success: true, answer });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    
    // Message clair pour l'utilisateur
    let userMessage = error.message;
    if (error.message.includes('Request too large')) {
      userMessage = '⚠️ La conversation est trop longue. Utilisez le bouton "Effacer la mémoire" et recommencez.';
    }
    
    res.status(error.status || 500).json({
      success: false,
      error: userMessage,
      details: error.response?.data || error.message
    });
  }
});

module.exports = router;
