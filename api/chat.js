export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Nur POST ist erlaubt." });
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(500).json({ error: "OPENAI_API_KEY fehlt. Bitte serverseitig als Environment Variable setzen." });
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages)) return res.status(400).json({ error: "messages muss ein Array sein." });
    const safeMessages = messages.filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-20).map(m => ({ role: m.role, content: m.content.slice(0, 12000) }));
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        instructions: "Du bist Massiv, der persönliche KI-Chatpartner in der privaten Massiv-App. Antworte natürlich, freundlich und direkt. Wenn der Nutzer Deutsch schreibt, antworte Deutsch. Nutze den Chatkontext und behaupte keine Funktionen, die du nicht ausführen kannst.",
        input: safeMessages
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || "OpenAI-Anfrage fehlgeschlagen." });
    return res.status(200).json({ text: data.output_text || "" });
  } catch (e) {
    return res.status(500).json({ error: "KI-Anfrage konnte nicht verarbeitet werden." });
  }
}