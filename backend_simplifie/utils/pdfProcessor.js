const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

async function extractTextFromPDF(pdfPath) {
    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (error) {
        console.error('Erreur extraction PDF:', error);
        throw error;
    }
}

async function extractTextFromDocument(documentPath) {
    const extension = path.extname(documentPath).toLowerCase();

    if (extension === '.pdf') {
        return extractTextFromPDF(documentPath);
    }
    if (extension === '.docx') {
        const result = await mammoth.extractRawText({ path: documentPath });
        return result.value;
    }
    if (extension === '.txt') {
        return fs.readFileSync(documentPath, 'utf8');
    }

    throw new Error(`Format non pris en charge : ${extension}`);
}

function chunkText(text, chunkSize = 1000, overlap = 200) {
    if (!text || text.length === 0) return [];
    const chunks = [];
    let start = 0;
    
    while (start < text.length) {
        let end = Math.min(start + chunkSize, text.length);
        if (end < text.length) {
            const lastPeriod = text.lastIndexOf('.', end);
            const lastNewline = text.lastIndexOf('\n', end);
            if (lastPeriod > start && lastPeriod - start > chunkSize * 0.6) {
                end = lastPeriod + 1;
            } else if (lastNewline > start && lastNewline - start > chunkSize * 0.6) {
                end = lastNewline + 1;
            }
        }
        const chunk = text.substring(start, end).trim();
        if (chunk.length > 0) chunks.push(chunk);
        start = end >= text.length ? text.length : end - overlap;
    }
    return chunks;
}

module.exports = { extractTextFromPDF, extractTextFromDocument, chunkText };
