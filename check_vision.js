import Groq from 'groq-sdk';
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function checkModel(model) {
    try {
        await groq.chat.completions.create({
            model: model,
            messages: [{ role: "user", content: "hello" }],
            max_tokens: 10
        });
        console.log(`${model} is active`);
    } catch (e) {
        console.log(`${model} failed: ${e.message}`);
    }
}

async function run() {
    await checkModel('llama-3.2-11b-vision-preview');
    await checkModel('llama-3.2-90b-vision-preview');
    await checkModel('llama-3.2-11b-vision');
    await checkModel('llama-3.2-90b-vision');
}
run();
