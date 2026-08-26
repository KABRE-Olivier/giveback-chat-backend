require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');    //  CHAT NORMAL
const ragRoutes = require('./routes/rag');    //  QUESTIONS SUR PDFS

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// ✅ ROUTES - LES DEUX SONT PRÉSENTES
app.use('/api', apiRoutes);      // Chat normal
app.use('/rag', ragRoutes);      // Questions sur les PDFs

// Route de test
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: '🚀 Serveur opérationnel',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📡 Routes:`);
  console.log(`   - POST /api/ask   → Chat normal`);
  console.log(`   - POST /rag/ask   → Questions sur PDFs`);
  console.log(`   - GET  /rag/list  → Liste des PDFs`);

  // Indexation des PDF en arrière-plan, APRÈS que le serveur soit déjà en ligne.
  // Si ça échoue (réseau, fichier corrompu...), le serveur continue de tourner
  // normalement pour le chat classique — seule la recherche dans les PDF serait indisponible.
  try {
    require('./indexPdfs');
  } catch (e) {
    console.error('⚠️ Indexation des PDF non lancée (le chat normal fonctionne quand même) :', e.message);
  }
});
