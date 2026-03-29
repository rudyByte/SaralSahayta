const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: "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" });

async function listModels() {
  try {
    const list = await groq.models.list();
    console.log(JSON.stringify(list.data.map(m => m.id), null, 2));
  } catch (e) {
    console.error('Error listing models:', e.message);
  }
}
listModels();
