import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'
import Learn, { ALL } from './Learn.jsx'

const SUFFIX = '@students.alwahab.app'

function useRole() {
  const [s, setS] = useState({ ready: false, session: null, role: null })
  useEffect(() => {
    const check = async (session) => {
      if (!session) return setS({ ready: true, session: null, role: null })
      const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      setS({ ready: true, session, role: data?.role || 'none' })
    }
    supabase.auth.getSession().then(({ data }) => check(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, session) => check(session))
    return () => data.subscription.unsubscribe()
  }, [])
  return s
}

function Login({ who }) {
  const teacher = who === 'teacher', [msg, setMsg] = useState(''), [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMsg('')
    const f = Object.fromEntries(new FormData(e.target)), id = f.id.trim()
    const { error } = await supabase.auth.signInWithPassword({ email: teacher ? id : id.toLowerCase() + SUFFIX, password: f.password })
    if (error) setMsg(teacher ? error.message : 'Wrong username or password. Ask your teacher for help.')
    setBusy(false)
  }
  return <div className="acct"><a href="/"><img src="/logo.png" alt="Al-Wahab Academy" height="90" /></a>
    <h2>{teacher ? 'Teacher login' : 'Student login 🌙'}</h2>
    <form onSubmit={submit}>
      <input name="id" type={teacher ? 'email' : 'text'} placeholder={teacher ? 'Email' : 'Username'} autoCapitalize="none" required />
      <input name="password" type="password" placeholder="Password" required />
      <button className="btn" disabled={busy}>{busy ? 'Please wait…' : 'Log in'}</button></form>
    {msg && <p className="msg" aria-live="polite">{msg}</p>}
    <a href={teacher ? '/student' : '/teacher'}>{teacher ? 'I am a student' : 'I am a teacher'}</a></div>
}

function Gate({ who, children }) {
  const { ready, session, role } = useRole()
  if (!ready) return <p className="wrap">Loading…</p>
  if (!session) return <Login who={who} />
  if (role !== who) return <div className="acct"><p>This account is not a {who} account.</p>
    <button className="btn" onClick={() => supabase.auth.signOut()}>Log out</button>
    <a href={who === 'teacher' ? '/student' : '/teacher'}>Go to the {who === 'teacher' ? 'student' : 'teacher'} login</a></div>
  return children(session)
}

function StudentHome({ id }) {
  const [row, setRow] = useState(null)
  useEffect(() => { supabase.from('students').select('*').eq('id', id).single().then(({ data }) => setRow(data)) }, [id])
  if (!row) return <p className="wrap">Loading…</p>
  return <Learn student={row} onBack={() => supabase.auth.signOut()} />
}

function TeacherHome() {
  const [kids, setKids] = useState(null), [prog, setProg] = useState([]), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false)
  const refresh = async () => {
    const { data } = await supabase.from('students').select('*').order('created_at'); setKids(data || [])
    const { data: l } = await supabase.from('lesson_progress').select('student_id,stars'); setProg(l || [])
  }
  useEffect(() => { refresh() }, [])
  const add = async (e) => {
    e.preventDefault(); setBusy(true); setMsg('')
    const form = e.target, body = Object.fromEntries(new FormData(form))
    const { data: { session } } = await supabase.auth.getSession()
    try {
      const r = await fetch('/api/create-student', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token }, body: JSON.stringify(body) })
      const j = await r.json().catch(() => ({}))
      if (r.ok) { form.reset(); setMsg(`Student created! Username: ${body.username.toLowerCase().trim()}`); refresh() } else setMsg(j.error || 'Something went wrong.')
    } catch { setMsg('Could not reach the server.') }
    setBusy(false)
  }
  const stat = (id) => { const r = prog.filter(x => x.student_id === id); return [r.length, r.reduce((s, x) => s + x.stars, 0)] }
  return <div className="acct wide"><a href="/"><img src="/logo.png" alt="Al-Wahab Academy" height="90" /></a>
    <h2>Teacher dashboard</h2>
    <h3>Add a student</h3>
    <form className="stuform" onSubmit={add}><input name="name" placeholder="Student’s name" required />
      <input name="username" placeholder="Username (letters and numbers)" autoCapitalize="none" required />
      <input name="password" placeholder="Password (6+ characters)" minLength="6" required />
      <button className="btn" disabled={busy}>{busy ? 'Creating…' : 'Create student login'}</button></form>
    {msg && <p className="msg" aria-live="polite">{msg}</p>}
    <h3>My students</h3>
    {kids === null ? <p>Loading…</p> : !kids.length ? <p>No students yet. Add your first one above.</p> :
      <div className="dtable">{kids.map(k => { const [n, s] = stat(k.id); return <div key={k.id} className="drow">
        <b>{k.name}</b><span>Login: {k.username}</span><span>{n} of {ALL.length} lessons</span><span>⭐ {s}</span><span>{k.xp} XP</span><span>🔥 {k.streak}</span>
        <span>{k.last_day ? 'Last practice ' + k.last_day : 'Not started'}</span></div> })}</div>}
    <button className="btn light" onClick={() => supabase.auth.signOut()}>Log out</button></div>
}

export const StudentPortal = () => <Gate who="student">{(s) => <StudentHome id={s.user.id} />}</Gate>
export const TeacherPortal = () => <Gate who="teacher">{() => <TeacherHome />}</Gate>
