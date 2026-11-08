import { useState } from 'react'
import Account from './Account.jsx'

const LETTERS = [['ا','Alif'],['ب','Ba'],['ت','Ta'],['ث','Tha'],['ج','Jeem'],['ح','Haa'],['خ','Khaa'],['د','Dal'],['ذ','Dhal'],['ر','Ra'],['ز','Zay'],['س','Seen'],['ش','Sheen'],['ص','Saad'],['ض','Daad'],['ط','Taa'],['ظ','Zaa'],['ع','Ain'],['غ','Ghain'],['ف','Fa'],['ق','Qaaf'],['ك','Kaaf'],['ل','Lam'],['م','Meem'],['ن','Noon'],['ه','Ha'],['و','Waw'],['ي','Ya']]
const COURSES = [
  ['🌙','Noorani Qaida','Letters, harakat and joining, step by step. Perfect for first-time readers.','Ages 4-12'],
  ['📖','Quran Reading','Read the Quran fluently with a patient teacher beside them.','Ages 6-15'],
  ['🎧','Tajweed','Beautiful, correct recitation with simple rules and lots of practice.','Ages 8+'],
  ['⭐','Hifz','Memorize with a plan, daily revision and gentle encouragement.','Ages 7+']]
const FAQ = [
  ['How do live classes work?','Your child joins a one-to-one video class from a phone, tablet or computer at a time that suits your family.'],
  ['Is the trial class really free?','Yes. Book a free class, meet the teacher and see if it is a good fit. No card needed.'],
  ['My child has never read Arabic. Is that OK?','Absolutely. We start from the very first letter, at your child’s pace.'],
  ['Which time zones do you teach in?','We schedule around you. Tell us your time zone in the form and we will match a teacher.']]

const say = (t) => { try { const u = new SpeechSynthesisUtterance(t); u.lang = 'ar-SA'; u.rate = .7; speechSynthesis.cancel(); speechSynthesis.speak(u) } catch {} }
const pick = (n) => [...LETTERS].sort(() => Math.random() - .5).slice(0, n)

   function Nav() {
     return <header className="nav"><a href="/" className="brand"><img src="/logo.png" alt="Al-Wahab Academy"/></a>
       <nav><a href="/learn">Learn</a><a href="/#play">Play</a><a href="/#courses">Courses</a><a href="/#faq">FAQ</a><a className="btn small" href="/#trial">Free trial</a></nav></header>
   }

function Hero() {
  return <section className="hero" id="top"><div className="wrap hero-in">
    <div><h1>Reading the Quran starts with one happy letter.</h1>
    <p>Live one-to-one Qaida and Quran classes for kids, with kind teachers who make every lesson feel like a win.</p>
    <a className="btn" href="#trial">Book a free class</a> <a className="btn ghost" href="#play">Try a letter game</a></div>
    <div className="hero-letters" aria-hidden="true">{['ب','ا','م','ن','ح','س'].map((l,i)=><span key={i} style={{'--i':i}}>{l}</span>)}</div>
  </div></section>
}

function Letters() {
  const [sel, setSel] = useState(null)
  return <div><h3>Tap a letter to hear it</h3>
    <div className="grid">{LETTERS.map(([a,n])=><button key={a} className={'tile'+(sel===a?' on':'')} onClick={()=>{setSel(a);say(a)}} aria-label={n}>
      <span className="ar">{a}</span><small>{sel===a?n:'?'}</small></button>)}</div></div>
}

function Quiz() {
  const make = () => { const o = pick(4); return { o, ans: o[Math.floor(Math.random()*4)] } }
  const [q, setQ] = useState(make), [stars, setStars] = useState(0), [msg, setMsg] = useState('')
  const guess = (n) => { if (n === q.ans[1]) { setStars(s=>s+1); setMsg('MashaAllah! ⭐'); setQ(make()) } else setMsg('Almost! Try again 💚') }
  return <div><h3>Which letter is this? <span className="stars">{'⭐'.repeat(Math.min(stars,10))||'Earn stars!'}</span></h3>
    <div className="quiz"><button className="big ar" onClick={()=>say(q.ans[0])}>{q.ans[0]}</button>
      <div className="opts">{q.o.map(([,n])=><button key={n} className="btn light" onClick={()=>guess(n)}>{n}</button>)}</div></div>
    <p className="msg" aria-live="polite">{msg}</p></div>
}

function Trial() {
  const [st, setSt] = useState('idle')
  const submit = async (e) => {
    e.preventDefault(); setSt('sending')
    try { const r = await fetch('/api/trial', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(Object.fromEntries(new FormData(e.target))) })
      setSt(r.ok ? 'done' : 'error') } catch { setSt('error') }
  }
  if (st === 'done') return <p className="thanks">JazakAllahu khayran! We will contact you within 24 hours to set up the free class.</p>
  return <form onSubmit={submit}>
    <input name="parent" placeholder="Your name" required/><input name="email" type="email" placeholder="Email" required/>
    <input name="whatsapp" placeholder="WhatsApp number (optional)"/><input name="child" placeholder="Child’s name" required/>
    <input name="age" type="number" min="3" max="17" placeholder="Child’s age"/>
    <button className="btn" disabled={st==='sending'}>{st==='sending'?'Sending…':'Book free class'}</button>
    {st==='error' && <p className="err">Something went wrong. Please try again.</p>}</form>
}

export function Home() {
  return <>
    <Nav/><Hero/>
    <section className="play" id="play"><div className="wrap two"><Letters/><Quiz/></div></section>
    <section className="wrap" id="courses"><h2>Classes your child will look forward to</h2>
      <div className="cards">{COURSES.map(([i,t,d,a])=><article key={t}><div className="ic">{i}</div><h3>{t}</h3><p>{d}</p><b>{a}</b></article>)}</div></section>
    <section className="dark"><div className="wrap why"><h2>Why families choose Al-Wahab</h2>
      <ul><li>One-to-one live classes, never crowded groups</li><li>Male and female teachers, you choose</li><li>Progress updates after every lesson</li><li>Flexible times in any time zone</li></ul></div></section>
    <section className="wrap" id="trial"><div className="trial"><div><h2>Start with a free class</h2><p>Tell us a little about your child and we will find the right teacher.</p></div><Trial/></div></section>
    <section className="wrap" id="faq"><h2>Questions parents ask</h2>{FAQ.map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</section>
    <footer><img src="/logo.png" alt="" height="90"/><p>© {new Date().getFullYear()} Al-Wahab Academy</p></footer>
  </>
}

 export default function App() {
  return window.location.pathname.startsWith('/learn') ? <Account /> : <Home />
}