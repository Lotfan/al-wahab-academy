import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'
import { Gate } from './Portal.jsx'
import { ALL } from './Learn.jsx'

const iso = (o = 0) => new Date(Date.now() - o * 864e5).toISOString().slice(0, 10)
const title = (id) => ALL.find(l => l.id === id)?.title || id

function GuardianHome() {
  const [kids, setKids] = useState(null), [prog, setProg] = useState([])
  useEffect(() => { (async () => {
    const { data: k } = await supabase.from('students').select('*').order('name'); setKids(k || [])
    const { data: l } = await supabase.from('lesson_progress').select('student_id,lesson_id,stars,updated_at'); setProg(l || [])
  })() }, [])

  return <div className="acct wide"><a href="/"><img src="/logo.png" alt="Al-Wahab Academy" height="90" /></a>
    <h2>Parent dashboard</h2>
    {kids === null ? <p>Loading…</p> : !kids.length ? <p>No children are linked to your account yet. Please ask your teacher.</p> :
      kids.map(k => {
        const mine = prog.filter(x => x.student_id === k.id), done = Object.fromEntries(mine.map(x => [x.lesson_id, x.stars]))
        const next = ALL.find(l => !done[l.id]), pct = Math.round(mine.length / ALL.length * 100)
        const streak = k.last_day === iso() || k.last_day === iso(1) ? k.streak : 0
        const recent = [...mine].filter(x => x.updated_at).sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 3)
        return <section key={k.id} className="gcard">
          <h3>{k.name}</h3>
          <div className="bar dark"><i style={{ width: pct + '%' }} /></div>
          <p>{mine.length} of {ALL.length} lessons complete ({pct}%)</p>
          <div className="gstats"><span>⭐ {mine.reduce((s, x) => s + x.stars, 0)} stars</span><span>{k.xp} XP</span><span>🔥 {streak} day streak</span>
            <span>{k.last_day ? 'Last practice: ' + k.last_day : 'Has not started yet'}</span></div>
          <p><b>Now learning:</b> {next ? next.title : 'All lessons complete 🎉'}</p>
          {!!recent.length && <><b>Recent activity</b><ul>{recent.map(x => <li key={x.lesson_id}>{title(x.lesson_id)}: {'⭐'.repeat(x.stars)} on {new Date(x.updated_at).toLocaleDateString()}</li>)}</ul></>}
          <details><summary>All lessons</summary><ul>{ALL.map(l => <li key={l.id}>{l.title}: {done[l.id] ? '⭐'.repeat(done[l.id]) : 'not started'}</li>)}</ul></details>
        </section> })}
    <button className="btn light" onClick={() => supabase.auth.signOut()}>Log out</button></div>
}
export const GuardianPortal = () => <Gate who="guardian">{() => <GuardianHome />}</Gate>
