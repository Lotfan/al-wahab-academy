const TITLES = ['Little Reader', 'Letter Explorer', 'Star Reader', 'Qaida Champion', 'Quran Hero']
const iso = (off = 0) => new Date(Date.now() - off * 864e5).toISOString().slice(0, 10)

export default function Dashboard({ student, p, levels, all, badges, unlocked, onStart, liveUrl }) {
  const count = Object.keys(p.done).length
  const stars = Object.values(p.done).reduce((a, b) => a + b, 0)
  const pct = Math.round(count / all.length * 100)
  const lvl = Math.floor(p.xp / 50) + 1, into = p.xp % 50
  const title = TITLES[Math.min(lvl - 1, TITLES.length - 1)]
  const next = all.find(l => !p.done[l.id] && unlocked(l.id))
  const streak = p.last === iso() || p.last === iso(1) ? p.streak : 0
  const practiced = new Set()
  if (p.last) for (let i = 0; i < streak; i++) practiced.add(new Date(new Date(p.last).getTime() - i * 864e5).toISOString().slice(0, 10))
  const week = [6, 5, 4, 3, 2, 1, 0].map(o => ({ k: iso(o), n: new Date(Date.now() - o * 864e5).toLocaleDateString('en', { weekday: 'short' }) }))

  return <div className="dash">
    <section className="hello">
      <div><h1>Assalamu alaikum, {student.name}! 👋</h1>
        <p className="ttl">Level {lvl}: {title}</p>
        <div className="bar"><i style={{ width: into * 2 + '%' }} /></div>
        <small>{50 - into} XP to reach level {lvl + 1}</small></div>
      <div className="ring" style={{ background: `conic-gradient(var(--gold) ${pct * 3.6}deg, #ffffff33 0)` }}><span>{pct}%<small>done</small></span></div>
    </section>

    <section className="cont">
      {next ? <><div><small>Up next</small><h3>{next.title}</h3></div>
        <button className="btn" onClick={() => onStart(next)}>{count ? 'Continue' : 'Start learning'}</button></>
        : <h3>🎉 You finished every lesson! New lessons are coming soon.</h3>}
    </section>

    <section className="stat4">
      <div><b>{count}/{all.length}</b>lessons</div><div><b>{stars}</b>stars ⭐</div>
      <div><b>{p.xp}</b>XP</div><div><b>{streak}</b>day streak 🔥</div>
    </section>

    <section className="card"><h3>This week</h3>
      <div className="week">{week.map(d => <span key={d.k} className={(practiced.has(d.k) ? 'on ' : '') + (d.k === iso() ? 'today' : '')}>
        <i>{practiced.has(d.k) ? '✓' : ''}</i>{d.n}</span>)}</div></section>

    <section className="card"><h3>Your levels</h3>
      {levels.map(lv => { const n = lv.lessons.filter(l => p.done[l.id]).length
        return <div key={lv.title} className="lv"><span>{lv.emoji} {lv.title}</span><div className="bar dark"><i style={{ width: n / lv.lessons.length * 100 + '%' }} /></div><small>{n}/{lv.lessons.length}</small></div> })}</section>

    <section className="card"><h3>Your badges</h3>
      <div className="badges">{badges.map(([e, n, on]) => <span key={n} className={on ? 'on' : ''} title={n}>{e}<small>{n}</small></span>)}</div></section>

    <section className="live"><div><b>Live class today?</b><br />Join your teacher for a one-to-one lesson.</div>
      <a className="btn" href={liveUrl} target="_blank" rel="noreferrer">Join live class</a></section>
  </div>
}
