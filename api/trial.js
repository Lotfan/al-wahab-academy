// Vercel serverless function: POST /api/trial
// Right now it validates and logs (see Vercel > Logs). Next step: email it to yourself (Resend) or save to a database.
export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' })
  const { parent, email, child, age, whatsapp } = req.body || {}
  if (!parent || !email || !child) return res.status(400).json({ error: 'Please fill in all required fields.' })
  console.log('NEW TRIAL REQUEST', { parent, email, child, age, whatsapp, at: new Date().toISOString() })
  return res.status(200).json({ ok: true })
}
