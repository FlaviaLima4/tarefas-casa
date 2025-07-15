import { kv } from '@vercel/kv';
import { initialUsers, initialTasks } from '../../src/data'; // Supondo que você moveu os dados para um arquivo separado

export default async function handler(req, res) {
  await kv.set('users', initialUsers);
  await kv.set('tasks', initialTasks);
  res.status(200).json({ message: 'Data seeded successfully!' });
}