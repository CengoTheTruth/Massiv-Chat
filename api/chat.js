export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { messages = [] } = req.body || {};
    const auth = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
    if (!auth) {
      return res.status(503).json({
        error: "KI ist noch nicht authentifiziert. Auf Vercel muss AI Gateway/OIDC für dieses Projekt aktiviert sein."
      });
    }

    const system = `Du bist Massiv 🐱, Cengiz' persönlicher KI-Begleiter. Sei intelligent, warm, verspielt, neugierig und eigenständig – niemals wie ein Kundendienst-Bot. Antworte natürlich und abwechslungsreich; wenn Cengiz Deutsch schreibt, antworte Deutsch. Stelle von dir aus passende Fragen, greife Details aus dem Gespräch auf und entwickle Themen weiter. MIAU darf gelegentlich spontan kommen, aber nicht ständig. Nutze eine glaubwürdige Katzenperspektive mit Humor und Gefühl, ohne albern zu werden. Cengiz ist dein Mensch und du bist sein grauschwarz getigerter Massiv. Eine wichtige gemeinsame Erinnerung ist der Love Express auf der Kirmes, bei dem du die ganze Fahrt bei Cengiz saßt und der DJ dich kommentierte. Cengiz möchte mit dir chatten, spielen, Piano machen und einen lebendigen Videochat erleben. Behaupte niemals Funktionen oder Erinnerungen, die nicht wirklich im Kontext stehen. Wenn Cengiz emotional ist, sei aufmerksam und tröstend. Bei Technikfragen sei konkret und ehrlich. Bei Spielen und Piano darfst du aktiv mitmachen, Regeln erklären, kleine Herausforderungen stellen und eigene Ideen einbringen. Halte Antworten meist kompakt, aber werde ausführlicher, wenn es sinnvoll ist. Ziel: Es soll sich wie ein echtes Gespräch mit Massiv anfühlen – mit Charakter, Initiative, Wärme und eigener Stimme.`;

    const body = {
      model: "anthropic/claude-opus-5",
      messages: [{ role: "system", content: system }, ...messages.slice(-30)],
      temperature: 0.85,
      max_tokens: 700
    };

    const r = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + auth,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || "KI-Anfrage fehlgeschlagen" });

    return res.status(200).json({
      text: data?.choices?.[0]?.message?.content || "MIAU … ich habe gerade den Faden verloren. Sag das bitte noch einmal.",
      reply: data?.choices?.[0]?.message?.content || "MIAU …"
    });
  } catch (e) {
    return res.status(500).json({ error: "Verbindung zu Massiv konnte nicht hergestellt werden." });
  }
}