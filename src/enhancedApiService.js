// enhancedApiService.js - API com retry, cache e offline support

// Configuração da API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

// Configurações para retry e timeout
const API_CONFIG = {
  timeout: 15000, // 15 segundos
  retryAttempts: 3,
  retryDelay: 2000, // 2 segundos entre tentativas
  slowConnectionThreshold: 5000, // 5 segundos = conexão lenta
};

// Cache local para dados
class LocalCache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.cacheDuration = 5 * 60 * 1000; // 5 minutos
  }

  set(key, data) {
    this.cache.set(key, data);
    this.timestamps.set(key, Date.now());
    console.log(`📦 Cache atualizado: ${key}`);
  }

  get(key) {
    const data = this.cache.get(key);
    const timestamp = this.timestamps.get(key);
    
    if (!data || !timestamp) {
      return null;
    }

    // Verificar se o cache ainda é válido
    if (Date.now() - timestamp > this.cacheDuration) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      console.log(`🗑️ Cache expirado: ${key}`);
      return null;
    }

    console.log(`✅ Cache hit: ${key}`);
    return data;
  }

  clear() {
    this.cache.clear();
    this.timestamps.clear();
    console.log('🧹 Cache limpo');
  }
}

// Queue para ações offline
class OfflineQueue {
  constructor() {
    this.queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
    this.isProcessing = false;
  }

  add(action) {
    this.queue.push({
      ...action,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9)
    });
    this.save();
    console.log(`📤 Ação adicionada à queue: ${action.type}`);
  }

  save() {
    localStorage.setItem('offline_queue', JSON.stringify(this.queue));
  }

  async processQueue(apiService) {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`🔄 Processando ${this.queue.length} ações da queue...`);

    const results = [];
    
    for (const action of [...this.queue]) {
      try {
        let result;
        
        switch (action.type) {
          case 'toggle_task':
            result = await apiService.tasks.toggle(action.taskId, action.userId);
            break;
          // Adicionar outros tipos de ação conforme necessário
        }
        
        // Remover da queue se bem-sucedido
        this.queue = this.queue.filter(a => a.id !== action.id);
        results.push({ success: true, action, result });
        
      } catch (error) {
        console.error(`❌ Erro ao processar ação ${action.type}:`, error);
        results.push({ success: false, action, error });
      }
    }

    this.save();
    this.isProcessing = false;
    
    console.log(`✅ Queue processada: ${results.filter(r => r.success).length} sucessos, ${results.filter(r => !r.success).length} falhas`);
    
    return results;
  }

  clear() {
    this.queue = [];
    this.save();
    console.log('🧹 Queue limpa');
  }

  getSize() {
    return this.queue.length;
  }
}

// Instâncias globais
const cache = new LocalCache();
const offlineQueue = new OfflineQueue();

// Estado de conectividade
let connectionStatus = {
  isOnline: navigator.onLine,
  isSlow: false,
  lastSuccessfulRequest: Date.now()
};

// Listeners para eventos de conectividade
window.addEventListener('online', () => {
  connectionStatus.isOnline = true;
  console.log('🌐 Conexão restaurada');
  // Processar queue quando voltar online
  setTimeout(() => offlineQueue.processQueue(enhancedApiService), 1000);
});

window.addEventListener('offline', () => {
  connectionStatus.isOnline = false;
  console.log('📴 Conexão perdida - modo offline ativado');
});

// Função para fazer requisições com retry e timeout
const apiRequestWithRetry = async (endpoint, options = {}, callbacks = {}) => {
  const { onSlowConnection, onRetry, onSuccess, onError } = callbacks;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
  
  // Timer para detectar conexão lenta
  const slowConnectionTimer = setTimeout(() => {
    connectionStatus.isSlow = true;
    onSlowConnection?.();
  }, API_CONFIG.slowConnectionThreshold);

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    signal: controller.signal,
    ...options,
  };

  let lastError;
  
  for (let attempt = 1; attempt <= API_CONFIG.retryAttempts; attempt++) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      
      console.log(`🌐 Tentativa ${attempt}/${API_CONFIG.retryAttempts}: ${options.method || 'GET'} ${endpoint}`);
      
      const response = await fetch(url, config);
      
      // Limpar timers se a requisição foi bem-sucedida
      clearTimeout(timeoutId);
      clearTimeout(slowConnectionTimer);
      
      connectionStatus.isSlow = false;
      connectionStatus.lastSuccessfulRequest = Date.now();
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      onSuccess?.(data, attempt);
      
      return data;
      
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ Tentativa ${attempt} falhou:`, error.message);
      
      // Se não é a última tentativa, aguardar antes de tentar novamente
      if (attempt < API_CONFIG.retryAttempts) {
        onRetry?.(attempt, error);
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay * attempt));
      }
    }
  }
  
  // Limpar timers se todas as tentativas falharam
  clearTimeout(timeoutId);
  clearTimeout(slowConnectionTimer);
  
  connectionStatus.isSlow = false;
  onError?.(lastError);
  
  console.error(`❌ Todas as tentativas falharam para ${endpoint}:`, lastError);
  throw lastError;
};

// Serviços de Autenticação
export const authService = {
  login: async (username, password, callbacks = {}) => {
    const response = await apiRequestWithRetry('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }, callbacks);
    
    return response;
  },

  healthCheck: async (callbacks = {}) => {
    return await apiRequestWithRetry('/health', {}, callbacks);
  },
};

// Serviços de Usuários
export const userService = {
  getAll: async (callbacks = {}) => {
    // Tentar buscar do cache primeiro
    const cached = cache.get('users');
    if (cached) {
      console.log('📦 Usuários carregados do cache');
      return cached;
    }

    const response = await apiRequestWithRetry('/users', {}, {
      ...callbacks,
      onSuccess: (data) => {
        cache.set('users', data.users);
        callbacks.onSuccess?.(data);
      }
    });
    
    return response.users;
  },

  getById: async (userId, callbacks = {}) => {
    const response = await apiRequestWithRetry(`/users/${userId}`, {}, callbacks);
    return response.user;
  },
};

// Serviços de Tarefas
export const taskService = {
  getAll: async (day = null, callbacks = {}) => {
    const cacheKey = `tasks_${day || 'all'}`;
    
    // Tentar buscar do cache primeiro
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`📦 Tarefas carregadas do cache: ${cacheKey}`);
      return cached;
    }

    const endpoint = day ? `/tasks?day=${encodeURIComponent(day)}` : '/tasks';
    const response = await apiRequestWithRetry(endpoint, {}, {
      ...callbacks,
      onSuccess: (data) => {
        cache.set(cacheKey, data.tasks);
        callbacks.onSuccess?.(data);
      }
    });
    
    return response.tasks;
  },

  getById: async (taskId, callbacks = {}) => {
    const response = await apiRequestWithRetry(`/tasks/${taskId}`, {}, callbacks);
    return response.task;
  },

  toggle: async (taskId, userId, callbacks = {}) => {
    // Se estiver offline, adicionar à queue
    if (!connectionStatus.isOnline) {
      offlineQueue.add({
        type: 'toggle_task',
        taskId,
        userId
      });
      
      throw new Error('Ação salva para quando voltar online');
    }

    const response = await apiRequestWithRetry(`/tasks/${taskId}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    }, {
      ...callbacks,
      onSuccess: (data) => {
        // Limpar TODOS os caches relacionados para forçar atualização
        cache.cache.forEach((value, key) => {
          if (key.startsWith('tasks_') || key === 'ranking' || key === 'stats') {
            cache.cache.delete(key);
            cache.timestamps.delete(key);
            console.log(`🗑️ Cache limpo: ${key}`);
          }
        });
        
        callbacks.onSuccess?.(data);
      },
      onError: (error) => {
        // Se falhar, adicionar à queue para tentar depois
        offlineQueue.add({
          type: 'toggle_task',
          taskId,
          userId
        });
        
        callbacks.onError?.(error);
      }
    });
    
    return response;
  },

  create: async (taskData, callbacks = {}) => {
    const response = await apiRequestWithRetry('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    }, callbacks);
    
    return response;
  },

  update: async (taskId, taskData, callbacks = {}) => {
    const response = await apiRequestWithRetry(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    }, callbacks);
    
    return response;
  },

  delete: async (taskId, callbacks = {}) => {
    const response = await apiRequestWithRetry(`/tasks/${taskId}`, {
      method: 'DELETE',
    }, callbacks);
    
    return response;
  },
};

// Serviços de Estatísticas
export const statsService = {
  getGeneral: async (callbacks = {}) => {
    const cached = cache.get('stats');
    if (cached) {
      console.log('📦 Stats carregadas do cache');
      return cached;
    }

    const response = await apiRequestWithRetry('/stats', {}, {
      ...callbacks,
      onSuccess: (data) => {
        cache.set('stats', data);
        callbacks.onSuccess?.(data);
      }
    });
    
    return response;
  },

  getRanking: async (callbacks = {}) => {
    // Para ranking, SEMPRE buscar dados frescos após ações importantes
    // Só usar cache se foi muito recente (menos de 30 segundos)
    const cached = cache.get('ranking');
    const rankingTimestamp = cache.timestamps.get('ranking');
    const isRecentCache = rankingTimestamp && (Date.now() - rankingTimestamp) < 30000; // 30 segundos
    
    if (cached && isRecentCache) {
      console.log('📦 Ranking carregado do cache (recente)');
      return cached;
    }

    const response = await apiRequestWithRetry('/ranking', {}, {
      ...callbacks,
      onSuccess: (data) => {
        cache.set('ranking', data);
        callbacks.onSuccess?.(data);
      }
    });
    
    return response;
  },
};

// Serviço principal
const enhancedApiService = {
  auth: authService,
  users: userService,
  tasks: taskService,
  stats: statsService,
  
  // Utilitários
  cache,
  offlineQueue,
  connectionStatus: () => connectionStatus,
  
  // Métodos de controle
  clearCache: () => cache.clear(),
  clearOfflineQueue: () => offlineQueue.clear(),
  processOfflineQueue: () => offlineQueue.processQueue(enhancedApiService),
  
  // Método para forçar atualização após ações importantes
  invalidateGameData: () => {
    ['ranking', 'stats'].forEach(key => {
      cache.cache.delete(key);
      cache.timestamps.delete(key);
    });
    console.log('🎮 Cache de gamificação invalidado');
  },
  
  // Configuração
  config: API_CONFIG,
};

export default enhancedApiService;

// Utilitários para o frontend
export const apiUtils = {
  isApiAvailable: async () => {
    try {
      await authService.healthCheck();
      return true;
    } catch (error) {
      return false;
    }
  },

  formatError: (error) => {
    if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
      return 'Erro de conexão. Tentando novamente...';
    }
    
    if (error.message.includes('timeout') || error.message.includes('aborted')) {
      return 'Conexão lenta. Continuando tentativas...';
    }
    
    if (error.message.includes('401')) {
      return 'Credenciais inválidas. Verifique seu usuário e senha.';
    }
    
    if (error.message.includes('404')) {
      return 'Recurso não encontrado.';
    }
    
    if (error.message.includes('500')) {
      return 'Erro interno do servidor. Tentando novamente...';
    }
    
    return error.message || 'Erro desconhecido.';
  },

  getConnectionInfo: () => ({
    isOnline: connectionStatus.isOnline,
    isSlow: connectionStatus.isSlow,
    queueSize: offlineQueue.getSize(),
    lastSuccess: connectionStatus.lastSuccessfulRequest
  })
};