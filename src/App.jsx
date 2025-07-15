import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, ChevronLeft, ChevronRight, Users, LogOut, ArrowLeft } from 'lucide-react';

// --- DADOS MOCKADOS REMOVIDOS ---
// Agora os dados serão buscados da nossa API.

const daysOfWeek = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

// --- COMPONENTES ---

const TaskCard = ({ task, users, onToggleTask, currentUser }) => {
  const assignedUser = users.find(u => u.id === task.assignedTo);
  const completedByUser = users.find(u => u.id === task.completedBy);

  const handleToggle = () => {
    onToggleTask(task.id, currentUser.id);
  };

  return (
    <div className={`p-5 rounded-xl shadow-sm border-2 transition-all duration-300 ${
      task.isCompleted 
        ? 'bg-green-50 border-green-200' 
        : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-center justify-between">
        <p className={`font-medium text-lg ${
          task.isCompleted 
            ? 'line-through text-gray-500' 
            : 'text-gray-800'
        }`}>
          {task.taskName}
        </p>
        <button 
          onClick={handleToggle} 
          className="focus:outline-none rounded-full p-2 hover:bg-gray-100 transition-colors"
        >
          {task.isCompleted ? (
            <CheckCircle className="h-8 w-8 text-green-500" />
          ) : (
            <Circle className="h-8 w-8 text-gray-400 hover:text-gray-600" />
          )}
        </button>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full ${assignedUser?.avatarColor} flex items-center justify-center text-white font-bold text-sm mr-3`}>
            {assignedUser?.name.charAt(0)}
          </div>
          <span className="text-gray-700 font-medium">{assignedUser?.name}</span>
        </div>
        {task.isCompleted && completedByUser && (
          <div className="flex items-center text-sm text-gray-500">
            <span className="mr-2">Feito por:</span>
            <div className={`w-6 h-6 rounded-full ${completedByUser?.avatarColor} flex items-center justify-center text-white font-bold text-xs`}>
              {completedByUser?.name.charAt(0)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const LoginPage = ({ onLogin, onNavigateToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    setIsLoading(true);
    const success = await onLogin(username, password);
    if (!success) {
      setError('Nome de usuário ou senha inválidos.');
    }
    // O isLoading será resetado no componente pai ou aqui se a tela não mudar
    setIsLoading(false);
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="••••••••"
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
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
         <p className="text-center text-sm text-gray-600">
          Não tem uma conta?{' '}
          <button onClick={onNavigateToRegister} className="font-medium text-indigo-600 hover:text-indigo-500">
            Registre-se
          </button>
        </p>
      </div>
    </div>
  );
};

const RegisterPage = ({ onRegister, onNavigateToLogin }) => {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!name || !username || !password) {
            setError('Por favor, preencha todos os campos.');
            return;
        }
        setIsLoading(true);
        const result = await onRegister({ name, username, password });
        if (!result.success) {
            setError(result.message || 'Ocorreu um erro ao registrar.');
        }
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
            <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-2xl shadow-xl">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900">Criar Conta</h2>
                    <p className="mt-2 text-sm text-gray-600">É rápido e fácil.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                        <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Seu nome completo" />
                    </div>
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Nome de Usuário</label>
                        <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Escolha um nome de usuário" />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Crie uma senha" />
                    </div>
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:bg-indigo-400">
                        {isLoading ? 'Criando...' : 'Criar Conta'}
                    </button>
                </form>
                <button onClick={onNavigateToLogin} className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para o Login
                </button>
            </div>
        </div>
    );
};


const DashboardPage = ({ currentUser, onLogout, users, tasks, setTasks }) => {
  const [currentDayIndex, setCurrentDayIndex] = useState(new Date().getDay() -1); // Começa no dia atual

  const handleToggleTask = async (taskId, toggledByUserId) => {
    const newTasks = tasks.map(task => {
      if (task.id === taskId) {
        return { ...task, isCompleted: !task.isCompleted, completedBy: !task.isCompleted ? toggledByUserId : null };
      }
      return task;
    });
    setTasks(newTasks);

    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTasks),
      });
    } catch (error) {
      console.error("Failed to update task:", error);
      setTasks(tasks); // Reverte em caso de erro
    }
  };

  const goToPreviousDay = () => {
    setCurrentDayIndex(prev => prev === 0 ? daysOfWeek.length - 1 : prev - 1);
  };

  const goToNextDay = () => {
    setCurrentDayIndex(prev => prev === daysOfWeek.length - 1 ? 0 : prev + 1);
  };

  const currentDay = daysOfWeek[currentDayIndex];
  const tasksForDay = tasks.filter(t => t.day === currentDay);
  const completedCount = tasksForDay.filter(t => t.isCompleted).length;
  const totalCount = tasksForDay.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">🏠 Lar Doce App</h1>
            <p className="text-sm text-gray-600">Olá, {currentUser.name}!</p>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </header>
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
            <div className="w-48 bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {completedCount} de {totalCount} tarefas concluídas
            </p>
          </div>
          <button
            onClick={goToNextDay}
            className="flex items-center justify-center w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            <ChevronRight className="h-6 w-6 text-gray-600" />
          </button>
        </div>
      </div>
      <main className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-md mx-auto space-y-4">
          {tasksForDay.length > 0 ? (
            tasksForDay.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                users={users} 
                onToggleTask={handleToggleTask} 
                currentUser={currentUser} 
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

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError('');
      try {
        const [tasksRes, usersRes] = await Promise.all([
          fetch('/api/tasks'),
          fetch('/api/users')
        ]);
        if (!tasksRes.ok || !usersRes.ok) {
            throw new Error('Falha ao buscar dados do servidor.');
        }
        const tasksData = await tasksRes.json();
        const usersData = await usersRes.json();
        setTasks(tasksData);
        setUsers(usersData);
      } catch (err) {
        setError('Não foi possível carregar os dados. Tente novamente mais tarde.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleLogin = async (username, password) => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        const { user } = await response.json();
        setCurrentUser(user);
        setCurrentPage('dashboard');
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

    const handleRegister = async (userData) => {
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });
            const data = await response.json();
            if (response.ok) {
                alert('Usuário criado com sucesso! Agora você pode fazer o login.');
                setCurrentPage('login');
                return { success: true };
            } else {
                return { success: false, message: data.error || 'Erro desconhecido.' };
            }
        } catch (error) {
            console.error("Registration failed:", error);
            return { success: false, message: 'Falha na comunicação com o servidor.' };
        }
    };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('login');
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100"><p className="text-lg font-medium">Carregando Lar Doce App...</p></div>;
  }
  
  if (error) {
      return <div className="min-h-screen flex items-center justify-center bg-red-50"><p className="text-lg font-medium text-red-600">{error}</p></div>;
  }

  switch (currentPage) {
    case 'register':
        return <RegisterPage onRegister={handleRegister} onNavigateToLogin={() => setCurrentPage('login')} />;
    case 'dashboard':
        return (
            <DashboardPage 
              currentUser={currentUser}
              onLogout={handleLogout}
              users={users}
              tasks={tasks}
              setTasks={setTasks}
            />
        );
    case 'login':
    default:
        return <LoginPage onLogin={handleLogin} onNavigateToRegister={() => setCurrentPage('register')} />;
  }
}
