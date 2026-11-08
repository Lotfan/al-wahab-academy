// Vercel serverless function: a TEACHER creates (or links) a parent login for one of their students.
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

  const { student_id, name, email, password } = req.body || {}
  const em = String(email || '').toLowerCase().trim()
  if (!student_id || !name || !/^\S+@\S+\.\S+$/.test(em)) return res.status(400).json({ error: 'Enter the parent’s name and a valid email.' })
  const { data: enr } = await admin.from('enrollments').select('student_id').eq('teacher_id', u.user.id).eq('student_id', student_id).maybeSingle()
  if (!enr) return res.status(403).json({ error: 'That is not your student.' })

  const { data: ex } = await admin.from('profiles').select('id,role').eq('email', em).maybeSingle()
  let gid
  if (ex) {
    if (ex.role !== 'guardian') return res.status(400).json({ error: 'That email belongs to a different kind of account.' })
    gid = ex.id
  } else {
    if (String(password || '').length < 6) return res.status(400).json({ error: 'Enter a password of 6+ characters for the new parent.' })
    const { data, error } = await admin.auth.admin.createUser({ email: em, password, email_confirm: true })
    if (error) return res.status(400).json({ error: /already|registered/i.test(error.message) ? 'That email already has an account.' : error.message })
    gid = data.user.id
    const p = await admin.from('profiles').insert({ id: gid, role: 'guardian', name, email: em })
    if (p.error) { await admin.auth.admin.deleteUser(gid); return res.status(500).json({ error: 'Could not save the parent.' }) }
  }
  const l = await admin.from('guardian_students').upsert({ guardian_id: gid, student_id })
  if (l.error) return res.status(500).json({ error: 'Could not link the parent to the child.' })
  return res.status(200).json({ ok: true, message: ex ? 'Linked the existing parent to this child.' : 'Parent login created and linked!' })
}
