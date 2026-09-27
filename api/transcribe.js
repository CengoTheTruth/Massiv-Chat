export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Nur POST ist erlaubt." });
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(500).json({ error: "OPENAI_API_KEY fehlt." });
  try {
    const contentType = req.headers["content-type"] || "";
    if (!contentType.includes("multipart/form-data")) return res.status(400).json({ error: "Audio muss als Datei gesendet werden." });
    const chunks = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const body = Buffer.concat(chunks);
    const boundaryMatch = contentType.match(/boundary="?([^";]+)"?/i);
    if (!boundaryMatch) return res.status(400).json({ error: "Multipart-Grenze fehlt." });
    const boundary = Buffer.from("--" + boundaryMatch[1]);
    const parts = [];
    let start = 0;
    while ((start = body.indexOf(boundary, start)) !== -1) {
      const next = body.indexOf(boundary, start + boundary.length);
      if (next === -1) break;
      const part = body.subarray(start + boundary.length + 2, next - 2);
      parts.push(part);
      start = next;
    }
    const part = parts.find(p => p.includes(Buffer.from("filename=")));
    if (!part) return res.status(400).json({ error: "Keine Audiodatei gefunden." });
    const sep = part.indexOf(Buffer.from("\r\n\r\n"));
    if (sep === -1) return res.status(400).json({ error: "Ungültige Audiodatei." });
    const header = part.subarray(0, sep).toString();
    const audio = part.subarray(sep + 4);
    const filename = (header.match(/filename="([^"]+)"/i)?.[1] || "aufnahme.webm").replace(/[^a-zA-Z0-9._-]/g, "_");
    const type = header.match(/Content-Type:\s*([^\r\n]+)/i)?.[1] || "audio/webm";
    const form = new FormData();
    form.append("file", new Blob([audio], { type }), filename);
    form.append("model", "gpt-4o-mini-transcribe");
    form.append("language", "de");
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || "Transkription fehlgeschlagen." });
    return res.status(200).json({ text: data.text || "" });
  } catch (e) {
    return res.status(500).json({ error: "Audio konnte nicht verarbeitet werden." });
  }
}