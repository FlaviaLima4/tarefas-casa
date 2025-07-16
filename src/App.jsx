import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Circle, ChevronLeft, ChevronRight, Users, LogOut, Trophy, Star, Award, Medal, Wifi, WifiOff, Clock, AlertCircle } from 'lucide-react';
import enhancedApiService, { apiUtils } from './enhancedApiService.js';

// Componente de Status de Conexão
const ConnectionStatus = ({ connectionInfo, retryCount = 0, isLoading = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const shouldShow = !connectionInfo.isOnline || connectionInfo.isSlow || connectionInfo.queueSize > 0 || isLoading;
    setIsVisible(shouldShow);
  }, [connectionInfo, isLoading]);

  if (!isVisible) return null;

  const getStatusColor = () => {
    if (!connectionInfo.isOnline) return 'bg-red-500';
    if (connectionInfo.isSlow || retryCount > 0) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusMessage = () => {
    if (!connectionInfo.isOnline) {
      return `📴 Offline - ${connectionInfo.queueSize} ações pendentes`;
    }
    if (connectionInfo.isSlow || retryCount > 0) {
      return `🐌 Conexão lenta ${retryCount > 0 ? `(tentativa ${retryCount})` : ''}`;
    }
    if (isLoading) {
      return '⏳ Carregando...';
    }
    return '✅ Conectado';
  };

  const getIcon = () => {
    if (!connectionInfo.isOnline) return <WifiOff className="h-4 w-4" />;
    if (connectionInfo.isSlow || retryCount > 0) return <Clock className="h-4 w-4" />;
    return <Wifi className="h-4 w-4" />;
  };

  return (
    <div className={`fixed top-0 left-0 right-0 ${getStatusColor()} text-white px-4 py-2 text-center text-sm font-medium z-50 transition-all duration-300`}>
      <div className="flex items-center justify-center gap-2">
        {getIcon()}
        <span>{getStatusMessage()}</span>
        {(connectionInfo.isSlow || retryCount > 0) && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        )}
      </div>
      {!connectionInfo.isOnline && (
        <div className="text-xs mt-1 opacity-90">
          Suas ações serão sincronizadas quando a conexão voltar
        </div>
      )}
    </div>
  );
};

const daysOfWeek = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

// Mapeamento de ícones para tarefas
const taskIcons = {
  'Lavar a louça': '🍽️',
  'Limpar o fogão': '🔥',
  'Limpar o chão': '🧽',
  'Lavar o banheiro': '🚿',
  'Estender a roupa': '👕',
  'Colocar roupa na máquina': '🧺',
  'Tirar o lixo': '🗑️',
  'Varrer a casa': '🧹'
};

// --- COMPONENTES ---

// Componente para o Card de Tarefa Individual
const TaskCard = ({ task, users, onToggleTask, currentUser, isLoading }) => {
  const [isToggling, setIsToggling] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [connectionInfo, setConnectionInfo] = useState(apiUtils.getConnectionInfo());

  const assignedUser = users.find(u => u.id === task.assigned_user_id);
  const completedByUser = users.find(u => u.id === task.completed_by_user_id);
  const taskIcon = taskIcons[task.task_name] || '📋';

  // Atualizar info de conexão periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectionInfo(apiUtils.getConnectionInfo());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleToggle = async () => {
    try {
      setIsToggling(true);
      setRetryCount(0);
      
      await onToggleTask(task.id, currentUser.id, {
        onRetry: (attempt) => {
          setRetryCount(attempt);
        },
        onSlowConnection: () => {
          console.log('🐌 Conexão lenta detectada');
        }
      });
      
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      
      // Se a ação foi para a queue offline, mostrar mensagem diferente
      if (error.message.includes('offline')) {
        alert('📴 Ação salva! Será executada quando a conexão voltar.');
      } else {
        alert('Erro ao atualizar tarefa. Tente novamente.');
      }
    } finally {
      setIsToggling(false);
      setRetryCount(0);
    }
  };

  return (
    <div className={`p-5 rounded-xl shadow-lg border-2 transition-all duration-300 transform hover:scale-105 ${
      task.is_completed 
        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 shadow-green-100' 
        : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-xl'
    } ${(isLoading || isToggling) ? 'opacity-50 pointer-events-none' : ''}`}>
      
      {/* Status de Retry se necessário */}
      {retryCount > 0 && (
        <div className="mb-2 flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
          <Clock className="h-3 w-3" />
          <span>Tentativa {retryCount}... Conexão lenta</span>
        </div>
      )}
      
      {/* Header da Tarefa */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{taskIcon}</span>
          <div>
            <p className={`font-bold text-lg ${
              task.is_completed 
                ? 'line-through text-gray-500' 
                : 'text-gray-800'
            }`}>
              {task.task_name}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="text-sm font-semibold text-yellow-600">{task.points} pts</span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleToggle} 
          disabled={isLoading || isToggling}
          className={`relative focus:outline-none rounded-full p-2 transition-all duration-300 ${
            task.is_completed 
              ? 'bg-green-100 hover:bg-green-200' 
              : 'bg-gray-100 hover:bg-indigo-100'
          } disabled:opacity-50`}
        >
          {task.is_completed ? (
            <CheckCircle className="h-8 w-8 text-green-500" />
          ) : (
            <Circle className="h-8 w-8 text-gray-400 hover:text-indigo-500" />
          )}
          {(isLoading || isToggling) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
            </div>
          )}
        </button>
      </div>

      {/* Informações dos Usuários */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-500 font-medium">Responsável:</div>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full ${assignedUser?.avatar_color} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
              {assignedUser?.name.charAt(0)}
            </div>
            <span className="text-gray-700 font-medium">{assignedUser?.name}</span>
          </div>
        </div>

        {task.is_completed && completedByUser && (
          <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
            <span className="text-xs text-green-700 font-medium">Feito por:</span>
            <div className={`w-6 h-6 rounded-full ${completedByUser?.avatar_color} flex items-center justify-center text-white font-bold text-xs`}>
              {completedByUser?.name.charAt(0)}
            </div>
            <span className="text-xs text-green-700 font-semibold">{completedByUser?.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Página de Ranking
const RankingPage = ({ onBack, currentUser }) => {
  const [ranking, setRanking] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRanking();
  }, []);

  const loadRanking = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Invalidar cache antes de carregar
      enhancedApiService.invalidateGameData();
      
      const data = await enhancedApiService.stats.getRanking();
      setRanking(data.ranking);
      
      console.log(`🏆 Ranking carregado: ${data.ranking.length} usuários`);
    } catch (error) {
      console.error('Erro ao carregar ranking:', error);
      setError('Erro ao carregar ranking.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRankingIcon = (position) => {
    switch (position) {
      case 1: return <Trophy className="h-8 w-8 text-yellow-500" />;
      case 2: return <Medal className="h-8 w-8 text-gray-400" />;
      case 3: return <Award className="h-8 w-8 text-amber-600" />;
      default: return <span className="text-2xl font-bold text-gray-400">#{position}</span>;
    }
  };

  const getRankingColor = (position) => {
    switch (position) {
      case 1: return 'from-yellow-400 to-yellow-600';
      case 2: return 'from-gray-300 to-gray-500';
      case 3: return 'from-amber-400 to-amber-600';
      default: return 'from-blue-400 to-blue-600';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando ranking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-purple-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="flex items-center justify-center w-10 h-10 bg-purple-100 hover:bg-purple-200 rounded-full transition-colors"
            >
              <ChevronLeft className="h-6 w-6 text-purple-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                🏆 Ranking de Tarefas
              </h1>
              <p className="text-sm text-gray-600">Competição saudável em casa!</p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="p-4 max-w-2xl mx-auto">
        {error ? (
          <div className="text-center bg-white p-8 rounded-xl shadow-lg">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={loadRanking}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {ranking.map((user, index) => (
              <div 
                key={user.user_id} 
                className={`bg-white rounded-xl shadow-lg p-6 border-2 transition-all duration-300 hover:scale-105 ${
                  user.user_id === currentUser.id 
                    ? 'border-purple-400 bg-gradient-to-r from-purple-50 to-pink-50' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Posição */}
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${getRankingColor(user.position)} flex items-center justify-center shadow-lg`}>
                      {user.position <= 3 ? (
                        getRankingIcon(user.position)
                      ) : (
                        <span className="text-xl font-bold text-white">#{user.position}</span>
                      )}
                    </div>

                    {/* Dados do Usuário */}
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <div className={`w-10 h-10 rounded-full ${user.avatar_color} flex items-center justify-center text-white font-bold shadow-md`}>
                          {user.name.charAt(0)}
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">{user.name}</h3>
                        {user.user_id === currentUser.id && (
                          <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-semibold">
                            Você
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm">@{user.username}</p>
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      <span className="text-2xl font-bold text-gray-800">{user.points}</span>
                      <span className="text-sm text-gray-500">pts</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {user.tasks_completed} tarefas concluídas
                    </p>
                  </div>
                </div>

                {/* Barra de Progresso */}
                {ranking.length > 0 && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`bg-gradient-to-r ${getRankingColor(user.position)} h-2 rounded-full transition-all duration-500`}
                        style={{ 
                          width: `${ranking[0].points > 0 ? (user.points / ranking[0].points) * 100 : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {ranking.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl shadow-lg">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">
                  Nenhuma tarefa concluída ainda!
                </h3>
                <p className="text-gray-500">
                  Seja o primeiro a completar uma tarefa e liderar o ranking!
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

// Página de Login
const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    if (!username || !password) {
      setError('Por favor, preencha todos os campos.');
      setIsLoading(false);
      return;
    }
    
    try {
      const result = await enhancedApiService.auth.login(username.trim(), password);
      onLogin(result.user);
    } catch (error) {
      setError(apiUtils.formatError(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-2xl shadow-xl">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            🏠 Lar Doce App
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Faça login para organizar as tarefas
          </p>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700 font-medium">
              💡 Dica: Use seu nome como usuário e senha padrão: 12345
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Nome de usuário
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
              placeholder="Digite seu nome"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
              placeholder="12345"
            />
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Dashboard Principal
const DashboardPage = ({ currentUser, onLogout, onShowRanking }) => {
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [userStats, setUserStats] = useState(null);
  const [connectionInfo, setConnectionInfo] = useState(apiUtils.getConnectionInfo());
  const [retryCount, setRetryCount] = useState(0);

  // Atualizar info de conexão periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectionInfo(apiUtils.getConnectionInfo());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  // Carregar tarefas quando mudar o dia
  useEffect(() => {
    if (users.length > 0) {
      loadTasksForCurrentDay();
    }
  }, [currentDayIndex, users]);

  // Carregar stats do usuário
  useEffect(() => {
    loadUserStats();
  }, [currentUser]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setError('');
      setRetryCount(0);
      
      // Carregar usuários
      const usersData = await enhancedApiService.users.getAll({
        onRetry: (attempt) => setRetryCount(attempt),
        onSlowConnection: () => console.log('🐌 Conexão lenta ao carregar usuários')
      });
      setUsers(usersData);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados. Verifique se o backend está rodando.');
    } finally {
      setIsLoading(false);
      setRetryCount(0);
    }
  };

  const loadTasksForCurrentDay = async () => {
    try {
      const currentDay = daysOfWeek[currentDayIndex];
      const tasksData = await enhancedApiService.tasks.getAll(currentDay, {
        onRetry: (attempt) => setRetryCount(attempt),
        onSlowConnection: () => console.log('🐌 Conexão lenta ao carregar tarefas')
      });
      setTasks(tasksData);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      setError('Erro ao carregar tarefas do dia.');
    } finally {
      setRetryCount(0);
    }
  };

  const loadUserStats = async () => {
    try {
      // Forçar busca de dados frescos do ranking
      const rankingData = await enhancedApiService.stats.getRanking({
        onRetry: (attempt) => console.log(`🔄 Retry ${attempt} ao carregar stats`),
        onSlowConnection: () => console.log('🐌 Conexão lenta ao carregar stats')
      });
      const currentUserStats = rankingData.ranking.find(u => u.user_id === currentUser.id);
      setUserStats(currentUserStats);
      
      console.log(`📊 Stats atualizadas: ${currentUserStats?.points || 0} pontos, posição #${currentUserStats?.position || 0}`);
    } catch (error) {
      console.error('Erro ao carregar stats do usuário:', error);
    }
  };

  const handleToggleTask = async (taskId, userId, callbacks = {}) => {
    try {
      setIsUpdating(true);
      
      // Invalidar cache de gamificação antes da requisição
      enhancedApiService.invalidateGameData();
      
      await enhancedApiService.tasks.toggle(taskId, userId, callbacks);
      
      // Recarregar dados com cache limpo
      await Promise.all([
        loadTasksForCurrentDay(),
        loadUserStats() // Isso vai buscar dados frescos do ranking
      ]);
      
      console.log('✅ Tarefa atualizada e gamificação sincronizada');
      
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const goToPreviousDay = () => {
    setCurrentDayIndex(prev => prev === 0 ? daysOfWeek.length - 1 : prev - 1);
  };

  const goToNextDay = () => {
    setCurrentDayIndex(prev => prev === daysOfWeek.length - 1 ? 0 : prev + 1);
  };

  const currentDay = daysOfWeek[currentDayIndex];
  const completedCount = tasks.filter(t => t.is_completed).length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const dailyPoints = tasks.filter(t => t.is_completed).reduce((sum, task) => sum + task.points, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Erro de Conexão</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadInitialData}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      {/* Status de Conexão */}
      <ConnectionStatus 
        connectionInfo={connectionInfo} 
        retryCount={retryCount}
        isLoading={isLoading || isUpdating}
      />
      
      {/* Header */}
      <header className={`bg-white shadow-lg border-b border-gray-200 p-4 ${connectionInfo.isSlow || retryCount > 0 || !connectionInfo.isOnline ? 'mt-12' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">🏠 Lar Doce App</h1>
            <p className="text-sm text-gray-600">Olá, {currentUser.name}!</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onShowRanking}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors"
            >
              <Trophy className="h-4 w-4" />
              Ranking
            </button>
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>

        {/* Stats do Usuário */}
        {userStats && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${currentUser.avatar_color} flex items-center justify-center text-white font-bold shadow-md`}>
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Sua Posição: #{userStats.position}</p>
                  <p className="text-sm text-gray-600">{userStats.tasks_completed} tarefas concluídas</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  <span className="text-xl font-bold text-gray-800">{userStats.points}</span>
                  <span className="text-sm text-gray-500">pts</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Navegação dos Dias */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousDay}
            className="flex items-center justify-center w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            <ChevronLeft className="h-6 w-6 text-gray-600" />
          </button>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">{currentDay}</h2>
            <div className="w-48 bg-gray-200 rounded-full h-3 mt-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-center gap-4 mt-2">
              <p className="text-sm text-gray-500">
                {completedCount} de {totalCount} tarefas
              </p>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="text-sm font-semibold text-yellow-600">{dailyPoints} pts hoje</span>
              </div>
            </div>
          </div>

          <button
            onClick={goToNextDay}
            className="flex items-center justify-center w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            <ChevronRight className="h-6 w-6 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-md mx-auto space-y-4">
          {tasks.length > 0 ? (
            tasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                users={users} 
                onToggleTask={handleToggleTask} 
                currentUser={currentUser}
                isLoading={isUpdating}
              />
            ))
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-medium text-gray-700 mb-2">
                Nenhuma tarefa para hoje!
              </h3>
              <p className="text-gray-500">
                Aproveite seu dia livre!
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Indicador de Dias */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex justify-center space-x-2">
          {daysOfWeek.map((day, index) => (
            <button
              key={day}
              onClick={() => setCurrentDayIndex(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentDayIndex 
                  ? 'bg-indigo-500' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Componente Principal
export default function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('login');
  };

  const handleShowRanking = () => {
    setCurrentPage('ranking');
  };

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
  };

  switch (currentPage) {
    case 'login':
      return <LoginPage onLogin={handleLogin} />;
    case 'ranking':
      return <RankingPage onBack={handleBackToDashboard} currentUser={currentUser} />;
    case 'dashboard':
    default:
      return (
        <DashboardPage 
          currentUser={currentUser}
          onLogout={handleLogout}
          onShowRanking={handleShowRanking}
        />
      );
  }
}