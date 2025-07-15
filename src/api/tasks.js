// api/tasks.js
// Esta é uma Serverless Function da Vercel.
// Ela se conecta ao Vercel KV para ler e escrever a lista de tarefas.

import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  // O método GET é usado para buscar os dados.
  if (request.method === 'GET') {
    try {
      // Tenta buscar a lista de 'tasks' do banco de dados KV.
      const tasks = await kv.get('tasks');
      // Se não encontrar, retorna um array vazio.
      if (!tasks) {
        return response.status(200).json([]);
      }
      return response.status(200).json(tasks);
    } catch (error) {
      return response.status(500).json({ error: 'Failed to fetch tasks.' });
    }
  }

  // O método POST é usado para salvar/atualizar os dados.
  if (request.method === 'POST') {
    try {
      // Pega a nova lista de tarefas do corpo da requisição.
      const updatedTasks = request.body;
      if (!updatedTasks) {
        return response.status(400).json({ error: 'Tasks data is missing.' });
      }
      // Salva a nova lista no banco de dados KV sob a chave 'tasks'.
      await kv.set('tasks', updatedTasks);
      return response.status(200).json({ message: 'Tasks updated successfully.' });
    } catch (error) {
      return response.status(500).json({ error: 'Failed to update tasks.' });
    }
  }

  // Se o método não for GET ou POST, retorna um erro.
  return response.status(405).json({ error: 'Method not allowed.' });
}
