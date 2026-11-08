// Vercel serverless function: lets a logged-in TEACHER create a student login.
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' })
  const url = process.env.VITE_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return res.status(500).json({ error: 'Server is not set up yet.' })
  const admin = createClient(url, key, { auth: { persistSession: false } })

  const token = (req.headers.authorization || '').replace('Bearer ', '')
  const { data: u } = await admin.auth.getUser(token)
  if (!u?.user) return res.status(401).json({ error: 'Please log in again.' })
  const { data: prof } = await admin.from('profiles').select('role').eq('id', u.user.id).single()
  if (prof?.role !== 'teacher') return res.status(403).json({ error: 'Teachers only.' })

  const { name, username, password } = req.body || {}
  const un = String(username || '').toLowerCase().trim()
  if (!name || !/^[a-z0-9]{3,20}$/.test(un) || String(password || '').length < 6)
    return res.status(400).json({ error: 'Enter a name, a username (3-20 letters or numbers) and a password of 6+ characters.' })

  const { data, error } = await admin.auth.admin.createUser({ email: `${un}@students.alwahab.app`, password, email_confirm: true })
  if (error) return res.status(400).json({ error: /already|registered/i.test(error.message) ? 'That username is taken.' : error.message })
  const id = data.user.id
  const a = await admin.from('profiles').insert({ id, role: 'student', name })
  const b = await admin.from('students').insert({ id, teacher_id: u.user.id, name, username: un })
  const c = await admin.from('enrollments').insert({ teacher_id: u.user.id, student_id: id })
  if (a.error || b.error || c.error) { await admin.auth.admin.deleteUser(id); return res.status(500).json({ error: 'Could not save the student.' }) }
  return res.status(200).json({ ok: true, message: `Student created! Username: ${un}` })
}
