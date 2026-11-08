import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

export async function loadProgress(id) {
  const [{ data: s }, { data: l }] = await Promise.all([
    supabase.from('students').select('xp,streak,last_day').eq('id', id).single(),
    supabase.from('lesson_progress').select('lesson_id,stars').eq('student_id', id)])
  return { done: Object.fromEntries((l || []).map(r => [r.lesson_id, r.stars])), xp: s?.xp || 0, streak: s?.streak || 0, last: s?.last_day || '' }
}
export async function saveProgress(id, lessonId, p) {
  await supabase.from('lesson_progress').upsert({ student_id: id, lesson_id: lessonId, stars: p.done[lessonId], updated_at: new Date().toISOString() })
  await supabase.from('students').update({ xp: p.xp, streak: p.streak, last_day: p.last }).eq('id', id)
}
