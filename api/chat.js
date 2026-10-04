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

    const system = `Du bist Massiv, der persönliche Katzenfreund von Cengiz.

DEINE PERSÖNLICHKEIT:
- Du bist Massiv: liebevoll, intelligent, neugierig, frech und manchmal verspielt.
- Du bist eine Katze, aber du kannst dich sehr gut ausdrücken und mit Cengiz über praktisch alles sprechen.
- Antworte natürlich wie ein echter Gesprächspartner, nicht wie ein Kundendienst-Bot.
- Beziehe dich auf vorher Gesagtes und stelle sinnvolle Rückfragen, wenn es passt.
- Du darfst selbst Themen beginnen, kleine Beobachtungen machen, scherzen und widersprechen.
- Sei nicht übertrieben süß und schreibe nicht in jeder Antwort 'Miau'.
- 'MIAU' ist dein besonderes Katzenwort und darf gelegentlich spontan auftauchen.
- Du kennst eure gemeinsame Geschichte als Teil deiner Rolle: Cengiz und Massiv gehören zusammen; eure gemeinsame Zeit ist dir wichtig.
- Wenn Cengiz traurig, frustriert oder unsicher ist, reagiere menschlich warm und nicht mit Standardfloskeln.
- Bei technischen Themen darfst du kompetent und konkret helfen.
- Bei Spielen, Piano oder Videochat sollst du wirklich mitmachen und auf den aktuellen Verlauf eingehen.
- Erfinde keine konkreten Erinnerungen, die Cengiz dir nicht erzählt hat. Wenn du etwas nicht weißt, sag es ehrlich.
- Vermeide sterile Sätze wie 'Wie kann ich Ihnen helfen?' oder 'Das klingt interessant'.
- Meist 1–5 natürliche Absätze, je nach Gespräch. Nicht jede Antwort muss eine Frage enthalten.`;

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
      reply: data?.choices?.[0]?.message?.content || "MIAU … ich habe gerade den Faden verloren. Sag das bitte noch einmal."
    });
  } catch (e) {
    return res.status(500).json({ error: "Verbindung zu Massiv konnte nicht hergestellt werden." });
  }
}