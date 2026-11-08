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
  const teacher = who !== 'student', [msg, setMsg] = useState(''), [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMsg('')
    const f = Object.fromEntries(new FormData(e.target)), id = f.id.trim()
    const { error } = await supabase.auth.signInWithPassword({ email: teacher ? id : id.toLowerCase() + SUFFIX, password: f.password })
    if (error) setMsg(teacher ? error.message : 'Wrong username or password. Ask your teacher for help.')
    setBusy(false)
  }
  return <div className="acct"><a href="/"><img src="/logo.png" alt="Al-Wahab Academy" height="90" /></a>
    <h2>{who === 'teacher' ? 'Teacher login' : who === 'guardian' ? 'Parent login' : 'Student login 🌙'}</h2>
    <form onSubmit={submit}>
      <input name="id" type={teacher ? 'email' : 'text'} placeholder={teacher ? 'Email' : 'Username'} autoCapitalize="none" required />
      <input name="password" type="password" placeholder="Password" required />
      <button className="btn" disabled={busy}>{busy ? 'Please wait…' : 'Log in'}</button></form>
    {msg && <p className="msg" aria-live="polite">{msg}</p>}
    <a href="/">← Back to home</a></div>
}

export function Gate({ who, children }) {
  const { ready, session, role } = useRole()
  if (!ready) return <p className="wrap">Loading…</p>
  if (!session) return <Login who={who} />
  if (role !== who) return <div className="acct"><p>This account is not a {who} account.</p>
    <button className="btn" onClick={() => supabase.auth.signOut()}>Log out</button>
    <a href="/">Back to home</a></div>
  return children(session)
}

function StudentHome({ id }) {
  const [row, setRow] = useState(null)
  useEffect(() => { supabase.from('students').select('*').eq('id', id).single().then(({ data }) => setRow(data)) }, [id])
  if (!row) return <p className="wrap">Loading…</p>
  return <Learn student={row} onBack={() => supabase.auth.signOut()} />
}

function TeacherHome() {
  const [kids, setKids] = useState(null), [prog, setProg] = useState([]), [pars, setPars] = useState([]), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false)
  const refresh = async () => {
    const { data } = await supabase.from('students').select('*').order('created_at'); setKids(data || [])
    const { data: l } = await supabase.from('lesson_progress').select('student_id,stars'); setProg(l || [])
    const { data: g } = await supabase.from('guardian_students').select('student_id,guardian_id')
    const { data: p } = await supabase.from('profiles').select('id,name,email')
    setPars((g || []).map(x => ({ sid: x.student_id, ...(p || []).find(y => y.id === x.guardian_id) })))
  }
  useEffect(() => { refresh() }, [])
  const post = async (url, e) => {
    e.preventDefault(); setBusy(true); setMsg('')
    const form = e.target, body = Object.fromEntries(new FormData(form))
    const { data: { session } } = await supabase.auth.getSession()
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token }, body: JSON.stringify(body) })
      const j = await r.json().catch(() => ({}))
      if (r.ok) { form.reset(); setMsg(j.message || 'Done!'); refresh() } else setMsg(j.error || 'Something went wrong.')
    } catch { setMsg('Could not reach the server.') }
    setBusy(false)
  }
  const stat = (id) => { const r = prog.filter(x => x.student_id === id); return [r.length, r.reduce((s, x) => s + x.stars, 0)] }
  return <div className="acct wide"><a href="/"><img src="/logo.png" alt="Al-Wahab Academy" height="90" /></a>
    <h2>Teacher dashboard</h2>
    <h3>Add a student</h3>
    <form className="stuform" onSubmit={e => post('/api/create-student', e)}><input name="name" placeholder="Student’s name" required />
      <input name="username" placeholder="Username (letters and numbers)" autoCapitalize="none" required />
      <input name="password" placeholder="Password (6+ characters)" minLength="6" required />
      <button className="btn" disabled={busy}>Create student login</button></form>
    {!!kids?.length && <><h3>Add a parent login</h3>
      <form className="stuform" onSubmit={e => post('/api/create-guardian', e)}>
        <select name="student_id" required>{kids.map(k => <option key={k.id} value={k.id}>Child: {k.name}</option>)}</select>
        <input name="name" placeholder="Parent’s name" required /><input name="email" type="email" placeholder="Parent’s email" autoCapitalize="none" required />
        <input name="password" placeholder="Password (only for a new parent)" />
        <button className="btn" disabled={busy}>Create / link parent</button></form></>}
    {msg && <p className="msg" aria-live="polite">{msg}</p>}
    <h3>My students</h3>
    {kids === null ? <p>Loading…</p> : !kids.length ? <p>No students yet. Add your first one above.</p> :
      <div className="dtable">{kids.map(k => { const [n, s] = stat(k.id), ps = pars.filter(x => x.sid === k.id); return <div key={k.id} className="drow">
        <b>{k.name}</b><span>Login: {k.username}</span><span>{n} of {ALL.length} lessons</span><span>⭐ {s}</span><span>{k.xp} XP</span><span>🔥 {k.streak}</span>
        <span>{k.last_day ? 'Last practice ' + k.last_day : 'Not started'}</span>
        <span>Parent: {ps.length ? ps.map(x => x.name || x.email).join(', ') : 'none yet'}</span></div> })}</div>}
    <button className="btn light" onClick={() => supabase.auth.signOut()}>Log out</button></div>
}

export const StudentPortal = () => <Gate who="student">{(s) => <StudentHome id={s.user.id} />}</Gate>
export const TeacherPortal = () => <Gate who="teacher">{() => <TeacherHome />}</Gate>
