import { kv } from '@vercel/kv';

function randCode(len) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { title, subject, timed, questions } = req.body || {};

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'A quiz title is required.' });
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'At least one question is required.' });
    }
    for (const q of questions) {
      if (
        !q || typeof q.text !== 'string' || !q.text.trim() ||
        !Array.isArray(q.options) || q.options.length !== 4 ||
        q.options.some((o) => typeof o !== 'string' || !o.trim()) ||
        typeof q.correct !== 'number' || q.correct < 0 || q.correct > 3
      ) {
        return res.status(400).json({ error: 'Every question needs text, 4 filled-in answers, and a correct answer marked.' });
      }
    }

    let code;
    let tries = 0;
    do {
      code = randCode(6);
      tries++;
    } while ((await kv.get(`quiz:${code}`)) && tries < 8);

    const quiz = {
      code,
      title: title.trim().slice(0, 120),
      subject: subject || 'general',
      timed: !!timed,
      questions: questions.map((q) => ({
        text: q.text.trim().slice(0, 300),
        options: q.options.map((o) => o.trim().slice(0, 120)),
        correct: q.correct
      })),
      createdAt: Date.now()
    };

    await kv.set(`quiz:${code}`, quiz);
    return res.status(200).json({ code });
  }

  if (req.method === 'GET') {
    const code = String(req.query.code || '').toUpperCase();
    if (!code) return res.status(400).json({ error: 'Missing quiz code.' });
    const quiz = await kv.get(`quiz:${code}`);
    if (!quiz) return res.status(404).json({ error: 'No quiz found with that code.' });
    return res.status(200).json(quiz);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).json({ error: 'Method not allowed' });
}
