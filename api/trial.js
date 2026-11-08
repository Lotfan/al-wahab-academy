import { Resend } from 'resend'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' })

  const { parent, email, child, age, whatsapp } = req.body || {}
  if (!parent || !email || !child) return res.status(400).json({ error: 'Please fill in all required fields.' })

  const key = process.env.RESEND_API_KEY
  const to = process.env.NOTIFY_EMAIL
  if (!key || !to) {
    console.error('Missing env vars', { hasKey: !!key, hasTo: !!to })
    return res.status(500).json({ error: 'Server is not set up yet.' })
  }

  try {
    const resend = new Resend(key)
    const { error } = await resend.emails.send({
      from: 'Al-Wahab Academy <onboarding@resend.dev>',
      to,
      replyTo: email,
      subject: `New free trial request: ${child}`,
      text: `Parent: ${parent}\nEmail: ${email}\nWhatsApp: ${whatsapp || '-'}\nChild: ${child}\nAge: ${age || '-'}`
    })
    if (error) {
      console.error('Resend error', error)
      return res.status(500).json({ error: 'Could not send. Please try again.' })
    }
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Function crashed', err)
    return res.status(500).json({ error: 'Could not send. Please try again.' })
  }
}