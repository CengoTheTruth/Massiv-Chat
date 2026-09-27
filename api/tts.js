export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Nur POST ist erlaubt." });
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(500).json({ error: "OPENAI_API_KEY fehlt." });
  try {
    const { text } = req.body || {};
    if (!text || typeof text !== "string") return res.status(400).json({ error: "Text fehlt." });
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: "gpt-4o-mini-tts", voice: "coral", input: text.slice(0, 5000), response_format: "mp3" })
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: data?.error?.message || "Sprachausgabe fehlgeschlagen." });
    }
    const buf = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(buf);
  } catch (e) {
    return res.status(500).json({ error: "Sprachausgabe konnte nicht verarbeitet werden." });
  }
}