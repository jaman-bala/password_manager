import { useState } from 'react';
import { Plus, Shield, Sparkles, Lock, Key, AlertCircle, LogOut, User, LayoutGrid, Table2, Sun, Moon } from 'lucide-react';
import { PasswordTable } from './components/PasswordTable';
import { PasswordForm } from './components/PasswordForm';
import { SearchBar } from './components/SearchBar';
import { CategoryManager } from './components/CategoryManager';
import { Login } from './components/Login';
import { ToastContainer, Toast, ToastType } from './components/Toast';
import { Pagination } from './components/Pagination';
import { usePasswordAPI } from './hooks/usePasswordAPI';
import { useAuth } from './hooks/useAuth';
import { PasswordEntry, PasswordFormData } from './types/Password';

function App() {
  const { isAuthenticated, user, logout, isLoading: authLoading } = useAuth();
  const { entries, categories, loading, error, addEntry, updateEntry, deleteEntry, createCategory, deleteCategory, page, totalPages, total, limit, goToPage, search } = usePasswordAPI();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PasswordEntry | null>(null);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isDark, setIsDark] = useState(() => {
    // Проверяем localStorage или системные предпочтения
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Toast helper
  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Переключение темы
  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  // Обработчик поиска с серверной пагинацией
  const handleSearch = (query: string) => {
    setLocalSearchQuery(query);
    search(query);
  };

  // Показываем загрузку или форму входа
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  // Категория теперь фильтруется на сервере (TODO: добавить category в API)
  // Пока делаем клиентскую фильтрацию по категории
  let filteredEntries = selectedCategoryId !== null
    ? entries.filter(entry => entry.category?.id === selectedCategoryId)
    : entries;

  const handleFormSubmit = async (data: PasswordFormData) => {
    if (editingEntry) {
      const result = await updateEntry(editingEntry.id.toString(), data);
      if (result.error) {
        showToast(`Ошибка обновления: ${result.error}`, 'error');
        return;
      }
      showToast('Запись успешно обновлена!', 'success');
    } else {
      const result = await addEntry(data);
      if (result.error) {
        showToast(`Ошибка создания: ${result.error}`, 'error');
        return;
      }
      showToast('Пароль успешно добавлен!', 'success');
    }
    setIsFormOpen(false);
    setEditingEntry(null);
  };

  const handleEdit = (entry: PasswordEntry) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingEntry(null);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту запись?')) {
      const result = await deleteEntry(id.toString());
      if (result.error) {
        showToast(`Ошибка удаления: ${result.error}`, 'error');
      } else {
        showToast('Запись удалена', 'success');
      }
    }
  };

  const handleCreateCategory = async (name: string) => {
    const result = await createCategory(name);
    if (result.error) {
      throw new Error(result.error);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    const result = await deleteCategory(id);
    if (result.error) {
      throw new Error(result.error);
    }
    if (selectedCategoryId === id) {
      setSelectedCategoryId(null);
    }
  };

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${
      isDark
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white'
        : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40'
    }`}>
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-violet-400/10 to-pink-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-screen-3xl">
        {/* Header */}
        <div className="text-center mb-16 relative">
          {/* User info, theme toggle and logout button */}
          <div className="flex justify-between items-center mb-8">
            <div className={`flex items-center gap-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <User size={20} />
              <span className="font-medium">Добро пожаловать, {user?.fio || user?.username}</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-xl transition-all duration-300 ${
                  isDark
                    ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
                title={isDark ? 'Светлая тема' : 'Тёмная тема'}
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={logout}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                  isDark
                    ? 'text-gray-300 hover:text-red-400 hover:bg-red-500/10'
                    : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                <LogOut size={18} />
                <span>Выйти</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-lg opacity-75 animate-pulse"></div>
              <div className="relative p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
                <Shield className="text-white" size={40} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="text-blue-500 animate-spin" size={24} />
              <h1 className="text-5xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Password Manager
              </h1>
              <Sparkles className="text-purple-500 animate-spin" size={24} />
            </div>
          </div>
          <p className="text-gray-600 text-xl max-w-3xl mx-auto leading-relaxed font-medium">
            Безопасное хранение и управление вашими паролями с современным интерфейсом
          </p>
          <div className="flex items-center justify-center gap-8 mt-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Lock size={16} className="text-green-500" />
              <span>256-bit шифрование</span>
            </div>
            <div className="flex items-center gap-2">
              <Key size={16} className="text-blue-500" />
              <span>Локальное хранение</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-purple-500" />
              <span>Полная приватность</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 animate-fade-in">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-red-500" size={20} />
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="mb-6 animate-fade-in">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="text-blue-700 font-medium">Загрузка данных...</p>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-6 mb-10">
          <div className="flex-1">
            <SearchBar value={localSearchQuery} onChange={handleSearch} />
          </div>
          {/* View Mode Toggle */}
          <div className="flex bg-white/80 backdrop-blur-sm rounded-2xl p-1 shadow-lg border border-gray-200/50">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
                viewMode === 'table'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Table2 size={18} />
              <span className="hidden sm:inline">Таблица</span>
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
                viewMode === 'card'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <LayoutGrid size={18} />
              <span className="hidden sm:inline">Карточки</span>
            </button>
          </div>
          <CategoryManager
            categories={categories}
            onCreateCategory={handleCreateCategory}
            onDeleteCategory={handleDeleteCategory}
            onSelectCategory={(category) => setSelectedCategoryId(category ? category.id : null)}
            selectedCategoryId={selectedCategoryId}
            isDark={isDark}
          />
          <button
            onClick={() => setIsFormOpen(true)}
            disabled={loading}
            className="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-3 font-semibold shadow-2xl shadow-blue-600/30 hover:shadow-blue-600/50 transform hover:scale-105 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[220px]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
            Добавить пароль
          </button>
        </div>

        {/* Results count */}
        {(localSearchQuery || selectedCategoryId) && (
          <div className="mb-8 animate-fade-in">
            <div className="bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-4 shadow-lg">
              <p className="text-gray-700 font-medium">
                Найдено записей: <span className="font-medium">{filteredEntries.length}</span>
                {localSearchQuery && (
                  <span className="ml-2">
                    по запросу "<span className="font-medium">{localSearchQuery}</span>"
                  </span>
                )}
                {selectedCategoryId && categories.find(c => c.id === selectedCategoryId) && (
                  <span className="ml-2">
                    в категории "<span className="font-medium">{categories.find(c => c.id === selectedCategoryId)?.name}</span>"
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Table / Card View */}
        <PasswordTable
          entries={filteredEntries}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAddNew={() => setIsFormOpen(true)}
          viewMode={viewMode}
          onCopy={() => showToast('Скопировано в буфер обмена!', 'success')}
          isDark={isDark}
        />

        {/* Pagination */}
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={goToPage}
          isDark={isDark}
        />

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />

        {/* Statistics */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="group bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-gray-200/50 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <Shield className="text-white" size={28} />
            </div>
            <div className="text-3xl font-black text-blue-600 mb-2 group-hover:scale-110 transition-transform duration-300">
              {entries.length}
            </div>
            <div className="text-gray-600 font-medium">Всего паролей</div>
          </div>
          <div className="group bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-gray-200/50 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <Key className="text-white" size={28} />
            </div>
            <div className="text-3xl font-black text-green-600 mb-2 group-hover:scale-110 transition-transform duration-300">
              {entries.filter(e => e.url).length}
            </div>
            <div className="text-gray-600 font-medium">С URL</div>
          </div>
          <div className="group bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-gray-200/50 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <Lock className="text-white" size={28} />
            </div>
            <div className="text-3xl font-black text-purple-600 mb-2 group-hover:scale-110 transition-transform duration-300">
              {categories.length}
            </div>
            <div className="text-gray-600 font-medium">Категорий</div>
          </div>
        </div>

        {/* Form Modal */}
        {isFormOpen && (
          <PasswordForm
            entry={editingEntry}
            categories={categories}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isDark={isDark}
          />
        )}
      </div>
    </div>
  );
}

export default App;