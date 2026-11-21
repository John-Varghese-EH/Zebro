import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const key = process.env.GEMINI_API_KEY, model = process.env.COPILOT_MODEL || 'gemini-1.5-flash';
  if (!key) return res.status(503).json({ error: 'copilot_not_configured' });

  const facts = JSON.stringify(req.body?.facts ?? {}).slice(0, 4000);
  const prompt =
    'You are a flight-dynamics analyst. Using only the JSON facts, write exactly three plain sentences: ' +
    'the situation, the recommendation, the cost and caveat. No bullets, no headings, no invented numbers. ' +
    'State that this is a screening-level estimate. Facts: ' + facts;

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 3000);
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        signal: ac.signal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 300 },
        }),
      }
    );
    if (!r.ok) return res.status(502).json({ error: 'upstream' });
    const j = await r.json();
    const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? res.status(200).json({ text }) : res.status(502).json({ error: 'empty' });
  } catch {
    return res.status(504).json({ error: 'timeout' });
  } finally {
    clearTimeout(timer);
  }
}
