const express = require('express');
const fs = require('fs');
const path = require('path');
const { answerPdfQuestion } = require('../services/ragService');

const router = express.Router();
const PDF_DIR = path.join(__dirname, '../pdfs');

router.post('/ask', async (req, res) => {
    const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
    if (!question) {
        return res.status(400).json({ success: false, error: 'La question est requise.' });
    }

    try {
        const result = await answerPdfQuestion(question);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Erreur RAG :', error.message);
        const indexUnavailable = /disponible|vector_store/i.test(error.message);
        res.status(500).json({
            success: false,
            error: indexUnavailable
                ? "La base de documents n'est pas disponible. Exécutez `npm run index-pdfs`."
                : 'Erreur lors de la recherche dans les documents.',
            details: error.message
        });
    }
});

router.get('/list', (req, res) => {
    try {
        if (!fs.existsSync(PDF_DIR)) {
            return res.json({ success: true, pdfs: [], count: 0 });
        }
        const documents = fs.readdirSync(PDF_DIR)
            .filter(file => ['.pdf', '.docx', '.txt'].includes(path.extname(file).toLowerCase()));
        res.json({ success: true, documents, count: documents.length });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
