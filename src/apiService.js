// apiService.js - Centraliza todas as chamadas para a API

// Configuração da API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

// Função auxiliar para fazer requisições
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Erro na requisição para ${endpoint}:`, error);
    throw error;
  }
};

// Serviços de Autenticação
export const authService = {
  /**
   * Realiza login do usuário
   * @param {string} username - Nome de usuário
   * @param {string} password - Senha
   * @returns {Promise<Object>} Dados do usuário logado
   */
  login: async (username, password) => {
    const response = await apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    return response;
  },

  /**
   * Verifica se a API está funcionando
   * @returns {Promise<Object>} Status da API
   */
  healthCheck: async () => {
    return await apiRequest('/health');
  },
};

// Serviços de Usuários
export const userService = {
  /**
   * Busca todos os usuários
   * @returns {Promise<Array>} Lista de usuários
   */
  getAll: async () => {
    const response = await apiRequest('/users');
    return response.users;
  },

  /**
   * Busca um usuário específico
   * @param {number} userId - ID do usuário
   * @returns {Promise<Object>} Dados do usuário
   */
  getById: async (userId) => {
    const response = await apiRequest(`/users/${userId}`);
    return response.user;
  },
};

// Serviços de Tarefas
export const taskService = {
  /**
   * Busca todas as tarefas ou filtradas por dia
   * @param {string|null} day - Dia da semana para filtrar (opcional)
   * @returns {Promise<Array>} Lista de tarefas
   */
  getAll: async (day = null) => {
    const endpoint = day ? `/tasks?day=${encodeURIComponent(day)}` : '/tasks';
    const response = await apiRequest(endpoint);
    return response.tasks;
  },

  /**
   * Busca uma tarefa específica
   * @param {number} taskId - ID da tarefa
   * @returns {Promise<Object>} Dados da tarefa
   */
  getById: async (taskId) => {
    const response = await apiRequest(`/tasks/${taskId}`);
    return response.task;
  },

  /**
   * Marca/desmarca uma tarefa como concluída
   * @param {number} taskId - ID da tarefa
   * @param {number} userId - ID do usuário que está fazendo a ação
   * @returns {Promise<Object>} Dados atualizados da tarefa
   */
  toggle: async (taskId, userId) => {
    const response = await apiRequest(`/tasks/${taskId}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
    
    return response;
  },

  /**
   * Cria uma nova tarefa
   * @param {Object} taskData - Dados da tarefa
   * @param {string} taskData.day - Dia da semana
   * @param {string} taskData.task_name - Nome da tarefa
   * @param {number} taskData.assigned_user_id - ID do usuário responsável
   * @returns {Promise<Object>} Dados da tarefa criada
   */
  create: async (taskData) => {
    const response = await apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
    
    return response;
  },

  /**
   * Atualiza uma tarefa existente
   * @param {number} taskId - ID da tarefa
   * @param {Object} taskData - Dados para atualizar
   * @returns {Promise<Object>} Dados atualizados da tarefa
   */
  update: async (taskId, taskData) => {
    const response = await apiRequest(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
    
    return response;
  },

  /**
   * Deleta uma tarefa
   * @param {number} taskId - ID da tarefa
   * @returns {Promise<Object>} Confirmação da exclusão
   */
  delete: async (taskId) => {
    const response = await apiRequest(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
    
    return response;
  },
};

// Serviços de Estatísticas
export const statsService = {
  /**
   * Busca estatísticas gerais e por dia
   * @returns {Promise<Object>} Estatísticas completas
   */
  getGeneral: async () => {
    return await apiRequest('/stats');
  },

  /**
   * Busca o ranking de usuários por pontuação
   * @returns {Promise<Object>} Ranking com pontuações
   */
  getRanking: async () => {
    return await apiRequest('/ranking');
  },
};

// Serviço principal que agrupa todos os outros
const apiService = {
  auth: authService,
  users: userService,
  tasks: taskService,
  stats: statsService,
};

export default apiService;

// Constantes úteis
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 10000, // 10 segundos
  RETRY_ATTEMPTS: 3,
};

// Utilitários
export const apiUtils = {
  /**
   * Verifica se a API está acessível
   * @returns {Promise<boolean>} True se a API estiver funcionando
   */
  isApiAvailable: async () => {
    try {
      await authService.healthCheck();
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Formata mensagens de erro da API
   * @param {Error} error - Erro capturado
   * @returns {string} Mensagem de erro formatada
   */
  formatError: (error) => {
    if (error.message.includes('fetch')) {
      return 'Erro de conexão. Verifique se o backend está rodando.';
    }
    
    if (error.message.includes('401')) {
      return 'Credenciais inválidas. Verifique seu usuário e senha.';
    }
    
    if (error.message.includes('404')) {
      return 'Recurso não encontrado.';
    }
    
    if (error.message.includes('500')) {
      return 'Erro interno do servidor. Tente novamente mais tarde.';
    }
    
    return error.message || 'Erro desconhecido.';
  },
};