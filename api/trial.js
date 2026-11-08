import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' })
  const { parent, email, child, age, whatsapp } = req.body || {}
  if (!parent || !email || !child) return res.status(400).json({ error: 'Please fill in all required fields.' })
  try {
    await resend.emails.send({
      from: 'Al-Wahab Academy <onboarding@resend.dev>',
      to: process.env.NOTIFY_EMAIL,
      replyTo: email,
      subject: `New free trial request: ${child}`,
      text: `Parent: ${parent}\nEmail: ${email}\nWhatsApp: ${whatsapp || '-'}\nChild: ${child}\nAge: ${age || '-'}`
    })
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Email failed', err)
    return res.status(500).json({ error: 'Could not send. Please try again.' })
  }
}