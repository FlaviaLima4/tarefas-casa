// api/auth.js
// Esta função valida o login de um usuário.

import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const { username, password } = request.body;

    if (!username || !password) {
      return response.status(400).json({ error: 'Username and password are required.' });
    }

    // Busca todos os usuários do Vercel KV.
    const users = await kv.get('users');
    if (!users) {
      return response.status(401).json({ error: 'Invalid credentials.' });
    }

    // Procura pelo usuário correspondente.
    const user = users.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );

    // Se o usuário for encontrado, retorna os dados dele (sem a senha!).
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return response.status(200).json({ user: userWithoutPassword });
    } else {
      // Se não, retorna erro de não autorizado.
      return response.status(401).json({ error: 'Invalid credentials.' });
    }
  } catch (error) {
    return response.status(500).json({ error: 'Authentication failed.' });
  }
}
