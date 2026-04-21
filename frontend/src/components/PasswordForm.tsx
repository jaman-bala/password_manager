import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, X, RefreshCw, Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import { PasswordEntry, PasswordFormData, Category } from '../types/Password';

interface PasswordFormProps {
  entry?: PasswordEntry | null;
  categories: Category[];
  onSubmit: (data: PasswordFormData) => void;
  onCancel: () => void;
  isDark?: boolean;
}

export const PasswordForm: React.FC<PasswordFormProps> = ({
  entry,
  categories,
  onSubmit,
  onCancel,
  isDark = false
}) => {
  const [formData, setFormData] = useState<PasswordFormData>({
    title: '',
    url: '',
    login: '',
    password: '',
    notes: '',
    category_id: undefined
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<PasswordFormData>>({});

  useEffect(() => {
    if (entry) {
      // Редактирование - заполняем данными
      setFormData({
        title: entry.title || '',
        url: entry.url || '',
        login: entry.login || '',
        password: entry.password || '',
        notes: entry.notes || '',
        category_id: entry.category?.id
      });
    } else {
      // Создание - сбрасываем форму
      setFormData({
        title: '',
        url: '',
        login: '',
        password: '',
        notes: '',
        category_id: undefined
      });
    }
    // Сбрасываем ошибки при открытии
    setErrors({});
    setShowPassword(false);
  }, [entry]);

  const validateForm = (): boolean => {
    const newErrors: Partial<PasswordFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Название обязательно';
    }
    if (!formData.login.trim()) {
      newErrors.login = 'Логин обязательный';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Пароль обязательный';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof PasswordFormData, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Генератор паролей
  const generatePassword = (length: number = 16) => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const all = uppercase + lowercase + numbers + symbols;

    let password = '';
    // Гарантируем минимум по одному из каждого типа
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Остальные символы
    for (let i = 4; i < length; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }

    // Перемешиваем
    password = password.split('').sort(() => Math.random() - 0.5).join('');

    handleChange('password', password);
  };

  // Оценка сложности пароля
  const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
    if (!password) return { score: 0, label: 'Пусто', color: 'gray' };

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const levels = [
      { label: 'Очень слабый', color: 'red' },
      { label: 'Слабый', color: 'orange' },
      { label: 'Средний', color: 'yellow' },
      { label: 'Хороший', color: 'blue' },
      { label: 'Отличный', color: 'green' },
      { label: 'Надёжный', color: 'emerald' },
    ];

    return { score, ...levels[Math.min(score, 5)] };
  };

  const strength = getPasswordStrength(formData.password || '');
  const strengthColors: Record<string, string> = {
    gray: 'bg-gray-200',
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    emerald: 'bg-emerald-500',
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className={`rounded-3xl p-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border transform animate-scale-in ${
        isDark
          ? 'bg-slate-800/95 backdrop-blur-xl border-slate-700/50'
          : 'bg-white/95 backdrop-blur-xl border-gray-200/50'
      }`}>
        <div className={`absolute inset-0 rounded-3xl ${
          isDark ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10' : 'bg-gradient-to-br from-blue-500/5 to-purple-500/5'
        }`}></div>
        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <h2 className={`text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r ${
              isDark ? 'from-gray-100 to-blue-400' : 'from-gray-900 to-blue-800'
            }`}>
              {entry ? 'Редактировать запись' : 'Добавить новую запись'}
            </h2>
            <div className="absolute -bottom-2 left-0 w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
          </div>
          <button
            onClick={onCancel}
            className={`p-3 transition-all duration-300 rounded-2xl transform hover:scale-110 hover:rotate-90 ${
              isDark
                ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
            }`}
          >
            <X size={28} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 relative">
          <div>
            <label className={`block text-sm font-bold mb-3 uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              Название *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.title
                  ? 'border-red-500 bg-red-50/50'
                  : isDark
                    ? 'border-slate-600 bg-slate-700/80 text-white placeholder-slate-400'
                    : 'border-gray-200 bg-white/80'
              }`}
              placeholder="Например: Gmail, Facebook..."
            />
            {errors.title && <p className="text-red-500 text-sm mt-2 font-medium animate-shake">{errors.title}</p>}
          </div>

          <div>
            <label className={`block text-sm font-bold mb-3 uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              URL
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => handleChange('url', e.target.value)}
              className={`w-full px-6 py-4 border rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 font-medium shadow-lg hover:shadow-xl ${
                isDark
                  ? 'border-slate-600 bg-slate-700/80 text-white placeholder-slate-400'
                  : 'border-gray-200 bg-white/80'
              }`}
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className={`block text-sm font-bold mb-3 uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              Логин *
            </label>
            <input
              type="text"
              value={formData.login}
              onChange={(e) => handleChange('login', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.login
                  ? 'border-red-500 bg-red-50/50'
                  : isDark
                    ? 'border-slate-600 bg-slate-700/80 text-white placeholder-slate-400'
                    : 'border-gray-200 bg-white/80'
              }`}
              placeholder="Ваш логин или email"
            />
            {errors.login && <p className="text-red-500 text-sm mt-2 font-medium animate-shake">{errors.login}</p>}
          </div>

          <div>
            <label className={`block text-sm font-bold mb-3 uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              Пароль *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-24 ${
                  errors.password
                    ? 'border-red-500 bg-red-50/50'
                    : isDark
                      ? 'border-slate-600 bg-slate-700/80 text-white placeholder-slate-400'
                      : 'border-gray-200 bg-white/80'
                }`}
                placeholder="Ваш пароль"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => generatePassword()}
                  className={`transition-all duration-300 p-2 rounded-xl hover:scale-110 ${
                    isDark
                      ? 'text-slate-400 hover:text-green-400 hover:bg-green-500/10'
                      : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                  }`}
                  title="Сгенерировать пароль"
                >
                  <RefreshCw size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`transition-all duration-300 p-2 rounded-xl hover:scale-110 ${
                    isDark
                      ? 'text-slate-400 hover:text-blue-400 hover:bg-blue-500/10'
                      : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {/* Индикатор сложности пароля */}
            {formData.password && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {strength.score >= 4 ? <ShieldCheck size={16} className="text-emerald-500" /> :
                     strength.score >= 3 ? <Shield size={16} className="text-blue-500" /> :
                     <ShieldAlert size={16} className="text-red-500" />}
                    <span className={`text-sm font-medium ${
                      strength.color === 'red' ? 'text-red-600' :
                      strength.color === 'orange' ? 'text-orange-600' :
                      strength.color === 'yellow' ? 'text-yellow-600' :
                      strength.color === 'blue' ? 'text-blue-600' :
                      'text-emerald-600'
                    }`}>
                      {strength.label}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{formData.password.length} симв.</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        i <= strength.score ? strengthColors[strength.color] : isDark ? 'bg-slate-600' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
            {errors.password && <p className="text-red-500 text-sm mt-2 font-medium animate-shake">{errors.password}</p>}
          </div>

          <div>
            <label className={`block text-sm font-bold mb-3 uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              Категория
            </label>
            <select
              value={formData.category_id || ''}
              onChange={(e) => handleChange('category_id', e.target.value ? parseInt(e.target.value) : undefined)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer ${
                isDark
                  ? 'border-slate-600 bg-slate-700/80 text-white'
                  : 'border-gray-200 bg-white/80'
              }`}
            >
              <option value="" className={isDark ? 'bg-slate-700' : ''}>Без категории</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className={isDark ? 'bg-slate-700' : ''}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-bold mb-3 uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              Описание
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className={`w-full px-6 py-4 border rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 resize-none font-medium shadow-lg hover:shadow-xl ${
                isDark
                  ? 'border-slate-600 bg-slate-700/80 text-white placeholder-slate-400'
                  : 'border-gray-200 bg-white/80'
              }`}
              placeholder="Дополнительная информация..."
            />
          </div>

          <div className="flex gap-6 pt-6">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-3 font-bold shadow-2xl shadow-blue-600/30 hover:shadow-blue-600/50 transform hover:scale-105 hover:-translate-y-1"
            >
              <Save size={22} />
              {entry ? 'Сохранить изменения' : 'Добавить запись'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className={`px-8 py-4 border-2 rounded-2xl transition-all duration-300 font-bold transform hover:scale-105 ${
                isDark
                  ? 'border-slate-500 text-gray-300 hover:bg-slate-700 hover:border-slate-400'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
