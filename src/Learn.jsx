import { useState, useEffect, useMemo } from 'react'
import { loadProgress, saveProgress } from './supabase.js'
import Dashboard from './Dashboard.jsx'

// ---- Put your real Zoom / Google Meet link here ----
const LIVE_CLASS_URL = 'https://meet.google.com/'

const LET = [['ا','Alif'],['ب','Ba'],['ت','Ta'],['ث','Tha'],['ج','Jeem'],['ح','Haa'],['خ','Khaa'],['د','Dal'],['ذ','Dhal'],['ر','Ra'],['ز','Zay'],['س','Seen'],['ش','Sheen'],['ص','Saad'],['ض','Daad'],['ط','Taa'],['ظ','Zaa'],['ع','Ain'],['غ','Ghain'],['ف','Fa'],['ق','Qaaf'],['ك','Kaaf'],['ل','Lam'],['م','Meem'],['ن','Noon'],['ه','Ha'],['و','Waw'],['ي','Ya']]
const BASES = [['ب','b'],['ت','t'],['ث','th'],['ج','j'],['ح','h'],['خ','kh'],['د','d']]
const VOW = [['h1','Fatha: the “a” sound','َ','a'],['h2','Kasra: the “i” sound','ِ','i'],['h3','Damma: the “u” sound','ُ','u']]

const LEVELS = [
  { title: 'Level 1: Arabic letters', emoji: '🔤', lessons: [0,1,2,3].map(n => ({ id: 'l' + (n+1), title: `Letters set ${n+1}`, items: LET.slice(n*7, n*7+7) })) },
  { title: 'Level 2: Short vowels', emoji: '🌙', lessons: VOW.map(([id,title,mark,s]) => ({ id, title, items: BASES.map(([a,b]) => [a+mark, b+s]) })) },
  { title: 'Level 3: Joining letters and words', emoji: '📖', lessons: [
    { id: 'j1', title: 'Joining letters', items: [['بَتَ','bata'],['تَبَ','taba'],['ثَبَ','thaba'],['جَدَ','jada'],['حَدَ','hada'],['خَبَ','khaba'],['دَبَ','daba']] },
    { id: 'w1', title: 'Your first words', items: [['جَمَل','jamal','camel'],['قَلَم','qalam','pen'],['جَبَل','jabal','mountain'],['بَقَر','baqar','cow'],['حَجَر','hajar','stone'],['قَمَر','qamar','moon'],['وَلَد','walad','boy']] }] }
]
export const ALL = LEVELS.flatMap(l => l.lessons)

const EMPTY = { done: {}, xp: 0, streak: 0, last: '' }
const dayStr = (off = 0) => new Date(Date.now() - off * 864e5).toISOString().slice(0, 10)
const say = (t) => { try { const u = new SpeechSynthesisUtterance(t); u.lang = 'ar-SA'; u.rate = .7; speechSynthesis.cancel(); speechSynthesis.speak(u) } catch {} }
const shuffle = (a) => [...a].sort(() => Math.random() - .5)

function Player({ lesson, onFinish, onExit }) {
  const items = lesson.items
  const [mode, setMode] = useState('learn'), [i, setI] = useState(0), [q, setQ] = useState(0), [miss, setMiss] = useState(0), [msg, setMsg] = useState('')
  const opts = useMemo(() => shuffle([items[q][1], ...shuffle(items.filter((_, k) => k !== q)).slice(0, 2).map(x => x[1])]), [q, lesson])
  const stars = miss === 0 ? 3 : miss <= 2 ? 2 : 1

  if (mode === 'done') return <div className="lp center"><h2>MashaAllah! 🎉</h2><div className="bigstars">{'⭐'.repeat(stars)}</div>
    <p>You earned {stars * 10} XP</p><button className="btn" onClick={() => onFinish(lesson.id, stars)}>Continue</button></div>

  if (mode === 'learn') return <div className="lp center"><button className="link" onClick={onExit}>← Back</button>
    <h3>{lesson.title}</h3><p>Card {i + 1} of {items.length}. Tap the letter to hear it.</p>
    <button className="flash ar" onClick={() => say(items[i][0])}>{items[i][0]}</button>
    <p className="sound">{items[i][1]}</p>{items[i][2] && <p>{items[i][2]}</p>}
    <div className="row"><button className="btn light" disabled={!i} onClick={() => setI(i - 1)}>Back</button>
      {i < items.length - 1 ? <button className="btn" onClick={() => setI(i + 1)}>Next</button> : <button className="btn" onClick={() => setMode('quiz')}>Start quiz</button>}</div></div>

  const guess = (s) => {
    if (s === items[q][1]) { setMsg('Correct! ⭐'); if (q === items.length - 1) setMode('done'); else { setQ(q + 1); setMsg('') } }
    else { setMiss(miss + 1); setMsg('Almost! Tap the letter to hear it again 💚') }
  }
  return <div className="lp center"><button className="link" onClick={onExit}>← Quit</button>
    <h3>Quiz: question {q + 1} of {items.length}</h3>
    <button className="flash ar" onClick={() => say(items[q][0])}>{items[q][0]}</button>
    <div className="row">{opts.map(o => <button key={o} className="btn light" onClick={() => guess(o)}>{o}</button>)}</div>
    <p className="msg" aria-live="polite">{msg}</p></div>
}

export default function Learn({ student, onBack }) {
  const [p, setP] = useState(EMPTY), [cur, setCur] = useState(null), [ready, setReady] = useState(false)
  useEffect(() => { loadProgress(student.id).then(x => { setP(x); setReady(true) }) }, [student.id])

  const finish = (id, stars) => {
    const t = dayStr(), streak = p.last === t ? p.streak : p.last === dayStr(1) ? p.streak + 1 : 1
    const n = { done: { ...p.done, [id]: Math.max(stars, p.done[id] || 0) }, xp: p.xp + stars * 10, streak, last: t }
    setP(n); saveProgress(student.id, id, n); setCur(null)
  }
  const count = Object.keys(p.done).length
  const unlocked = (id) => { const k = ALL.findIndex(l => l.id === id); return k === 0 || !!p.done[ALL[k - 1].id] }
  const badges = [
    ['🌱', 'First lesson', count >= 1], ['📚', '5 lessons', count >= 5], ['🏆', 'All lessons', count === ALL.length],
    ['🔥', '3-day streak', p.streak >= 3], ['💎', 'Perfect score', Object.values(p.done).includes(3)]]

  if (!ready) return <p className="wrap">Loading…</p>
  return <div className="learn">
    <header className="lhead"><a href="/"><img src="/logo.png" alt="Al-Wahab Academy" height="56"/></a>
      <div className="stats"><button className="link" style={{float:"none",color:"#d9b26f"}} onClick={onBack}>Log out</button><span>🔥 {p.streak}</span><span>⭐ {p.xp} XP</span></div></header>
    <main className="wrap">
      {cur ? <Player key={cur.id} lesson={cur} onFinish={finish} onExit={() => setCur(null)} /> : <>
          <Dashboard student={student} p={p} levels={LEVELS} all={ALL} badges={badges} unlocked={unlocked} onStart={setCur} liveUrl={LIVE_CLASS_URL} />
        {LEVELS.map(lv => <section key={lv.title}><h2>{lv.emoji} {lv.title}</h2>
          <div className="lessons">{lv.lessons.map(l => { const ok = unlocked(l.id), s = p.done[l.id]
            return <button key={l.id} className={'lesson' + (s ? ' done' : '')} disabled={!ok} onClick={() => setCur(l)}>
              <b>{l.title}</b><span className="ar prev">{l.items.slice(0, 4).map(x => x[0]).join(' ')}</span>
              <small>{!ok ? '🔒 Locked' : s ? '⭐'.repeat(s) : 'Start'}</small></button> })}</div></section>)}
        <p className="note">Progress is saved to your account, on any device.</p></>}
    </main></div>
}
