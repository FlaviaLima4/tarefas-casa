// api/users.js
// Esta é uma Serverless Function da Vercel.
// Ela busca a lista de todos os usuários do Vercel KV.

import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  // Esta rota só aceita o método GET.
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Busca a lista de usuários do banco de dados KV.
    const users = await kv.get('users');

    // Se não houver usuários, retorna um array vazio.
    if (!users || !Array.isArray(users)) {
      return response.status(200).json([]);
    }

    // 2. IMPORTANTE: Remove a senha de cada usuário antes de enviar.
    // Nunca envie senhas para o front-end, mesmo que sejam mockadas.
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userSafeData } = user;
      return userSafeData;
    });

    // 3. Retorna a lista de usuários segura.
    return response.status(200).json(usersWithoutPasswords);

  } catch (error) {
    console.error('Failed to fetch users:', error);
    return response.status(500).json({ error: 'Failed to fetch users from the database.' });
  }
}
