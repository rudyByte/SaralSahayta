async function checkModel(model) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: "hello" }],
            max_tokens: 10
        })
    });
    console.log(model, res.status, await res.text());
}

async function run() {
    await checkModel('llama-3.2-11b-vision-instruct');
    await checkModel('llama-3.2-90b-vision-instruct');
    await checkModel('llama-3.2-11b-vision-preview');
    await checkModel('llama-3.2-90b-vision-preview');
}
run();
