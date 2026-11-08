import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'
import Learn, { ALL } from './Learn.jsx'

function Login() {
  const [mode, setMode] = useState('in'), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMsg('')
    const f = Object.fromEntries(new FormData(e.target))
    const { data, error } = mode === 'in' ? await supabase.auth.signInWithPassword(f) : await supabase.auth.signUp(f)
    if (error) setMsg(error.message)
    else if (mode === 'up' && !data.session) setMsg('Check your email and click the confirmation link, then log in.')
    setBusy(false)
  }
  return <div className="acct"><a href="/"><img src="/logo.png" alt="Al-Wahab Academy" height="90"/></a>
    <h2>{mode === 'in' ? 'Parent login' : 'Create parent account'}</h2>
    <form onSubmit={submit}><input name="email" type="email" placeholder="Email" required/>
      <input name="password" type="password" minLength="6" placeholder="Password (6+ characters)" required/>
      <button className="btn" disabled={busy}>{busy ? 'Please wait…' : mode === 'in' ? 'Log in' : 'Sign up'}</button></form>
    {msg && <p className="msg" aria-live="polite">{msg}</p>}
    <button className="link" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setMsg('') }}>
      {mode === 'in' ? 'New here? Create an account' : 'Already have an account? Log in'}</button></div>
}

function Picker({ onPick }) {
  const [kids, setKids] = useState(null), [prog, setProg] = useState([]), [dash, setDash] = useState(false), [name, setName] = useState('')
  const refresh = async () => {
    const { data } = await supabase.from('students').select('*').order('created_at'); setKids(data || [])
    const { data: l } = await supabase.from('lesson_progress').select('student_id,stars'); setProg(l || [])
  }
  useEffect(() => { refresh() }, [])
  const add = async (e) => { e.preventDefault(); if (!name.trim()) return
    await supabase.from('students').insert({ name: name.trim() }); setName(''); refresh() }
  const stat = (id) => { const r = prog.filter(x => x.student_id === id); return [r.length, r.reduce((s, x) => s + x.stars, 0)] }
  return <div className="acct wide"><a href="/"><img src="/logo.png" alt="Al-Wahab Academy" height="90"/></a>
    {dash ? <><h2>Parent dashboard</h2>
      {!kids?.length ? <p>Add a child first.</p> : <div className="dtable">{kids.map(k => { const [n, s] = stat(k.id); return <div key={k.id} className="drow">
        <b>{k.name}</b><span>{n} of {ALL.length} lessons</span><span>⭐ {s} stars</span><span>{k.xp} XP</span><span>🔥 {k.streak}</span>
        <span>{k.last_day ? 'Last practice ' + k.last_day : 'Not started'}</span></div> })}</div>}
      <button className="btn light" onClick={() => setDash(false)}>Back</button></>
    : <><h2>Who is learning today?</h2>
      <div className="kids">{kids === null ? <p>Loading…</p> : kids.map(k => <button key={k.id} className="kid" onClick={() => onPick(k)}>🌟<b>{k.name}</b></button>)}</div>
      <form className="addkid" onSubmit={add}><input value={name} onChange={e => setName(e.target.value)} placeholder="Add a child’s name"/><button className="btn">Add child</button></form>
      <div className="row"><button className="btn light" onClick={() => setDash(true)}>Parent dashboard</button>
        <button className="btn light" onClick={() => supabase.auth.signOut()}>Log out</button></div></>}</div>
}

export default function Account() {
  const [session, setSession] = useState(undefined), [student, setStudent] = useState(null)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); if (!s) setStudent(null) })
    return () => data.subscription.unsubscribe()
  }, [])
  if (session === undefined) return <p className="wrap">Loading…</p>
  if (!session) return <Login/>
  if (student) return <Learn student={student} onBack={() => setStudent(null)}/>
  return <Picker onPick={setStudent}/>
}
