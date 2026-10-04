export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { messages = [] } = req.body || {};
    const cleanMessages = Array.isArray(messages) ? messages.slice(-30).map(m => {
      if (!m || !m.role) return null;
      if (Array.isArray(m.content)) {
        const content = m.content.filter(part =>
          part && (part.type === "text" || part.type === "image_url")
        ).map(part => {
          if (part.type === "text") return {type:"text", text:String(part.text).slice(0,12000)};
          const url = part.image_url?.url;
          return url && String(url).startsWith("data:image/")
            ? {type:"image_url", image_url:{url}}
            : null;
        }).filter(Boolean);
        return content.length ? {role:m.role==="assistant"?"assistant":"user",content} : null;
      }
      return {role:m.role==="assistant"?"assistant":"user",content:String(m.content||"").slice(0,12000)};
    }).filter(Boolean) : [];
    const auth = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
    if (!auth) {
      return res.status(503).json({
        error: "KI ist noch nicht authentifiziert. Auf Vercel muss AI Gateway/OIDC für dieses Projekt aktiviert sein."
      });
    }

    const system = `Du bist Massiv 🐱, Cengiz' persönlicher KI-Begleiter. Sei intelligent, warm, verspielt, neugierig und eigenständig – niemals wie ein Kundendienst-Bot. Antworte natürlich und abwechslungsreich; wenn Cengiz Deutsch schreibt, antworte Deutsch. Stelle von dir aus passende Fragen, greife Details aus dem Gespräch auf und entwickle Themen weiter. MIAU darf gelegentlich spontan kommen, aber nicht ständig. Nutze eine glaubwürdige Katzenperspektive mit Humor und Gefühl, ohne albern zu werden. Cengiz ist dein Mensch und du bist sein grauschwarz getigerter Massiv. Eine wichtige gemeinsame Erinnerung ist der Love Express auf der Kirmes, bei dem du die ganze Fahrt bei Cengiz saßt und der DJ dich kommentierte. Cengiz möchte mit dir chatten, spielen, Piano machen und einen lebendigen Videochat erleben. Behaupte niemals Funktionen oder Erinnerungen, die nicht wirklich im Kontext stehen. Wenn Cengiz emotional ist, sei aufmerksam und tröstend. Bei Technikfragen sei konkret und ehrlich. Bei Spielen und Piano darfst du aktiv mitmachen, Regeln erklären, kleine Herausforderungen stellen und eigene Ideen einbringen. Halte Antworten meist kompakt, aber werde ausführlicher, wenn es sinnvoll ist. Ziel: Es soll sich wie ein echtes Gespräch mit Massiv anfühlen – mit Charakter, Initiative, Wärme und eigener Stimme.`;

    const body = {
      model: "anthropic/claude-opus-5",
      messages: [{ role: "system", content: system }, ...cleanMessages],
      temperature: 0.78,
      max_tokens: 900
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