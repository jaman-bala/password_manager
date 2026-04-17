import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, X } from 'lucide-react';
import { PasswordEntry, PasswordFormData, Category } from '../types/Password';

interface PasswordFormProps {
  entry?: PasswordEntry | null;
  categories: Category[];
  onSubmit: (data: PasswordFormData) => void;
  onCancel: () => void;
}

export const PasswordForm: React.FC<PasswordFormProps> = ({
  entry,
  categories,
  onSubmit,
  onCancel
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
      setFormData({
        title: entry.title || '',
        url: entry.url || '',
        login: entry.login || '',
        password: entry.password || '',
        notes: entry.notes || '',
        category_id: entry.category?.id
      });
    }
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200/50 transform animate-scale-in">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-3xl"></div>
        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <h2 className="text-3xl font-black bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
              {entry ? 'Редактировать запись' : 'Добавить новую запись'}
            </h2>
            <div className="absolute -bottom-2 left-0 w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
          </div>
          <button
            onClick={onCancel}
            className="p-3 text-gray-400 hover:text-red-500 transition-all duration-300 rounded-2xl hover:bg-red-50 transform hover:scale-110 hover:rotate-90"
          >
            <X size={28} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 relative">
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">
              Название *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.title ? 'border-red-500 bg-red-50/50' : 'border-gray-200 bg-white/80'
                }`}
              placeholder="Например: Gmail, Facebook..."
            />
            {errors.title && <p className="text-red-500 text-sm mt-2 font-medium animate-shake">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">
              URL
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => handleChange('url', e.target.value)}
              className="w-full px-6 py-4 border border-gray-200 bg-white/80 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">
              Логин *
            </label>
            <input
              type="text"
              value={formData.login}
              onChange={(e) => handleChange('login', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.login ? 'border-red-500 bg-red-50/50' : 'border-gray-200 bg-white/80'
                }`}
              placeholder="Ваш логин или email"
            />
            {errors.login && <p className="text-red-500 text-sm mt-2 font-medium animate-shake">{errors.login}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">
              Пароль *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12 ${errors.password ? 'border-red-500 bg-red-50/50' : 'border-gray-200 bg-white/80'
                  }`}
                placeholder="Ваш пароль"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-all duration-300 p-2 rounded-xl hover:bg-blue-50 hover:scale-110"
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-sm mt-2 font-medium animate-shake">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">
              Категория
            </label>
            <select
              value={formData.category_id || ''}
              onChange={(e) => handleChange('category_id', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-4 py-3 border border-gray-200 bg-white/80 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
            >
              <option value="">Без категории</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">
              Описание
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className="w-full px-6 py-4 border border-gray-200 bg-white/80 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 resize-none font-medium shadow-lg hover:shadow-xl"
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
              className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 font-bold transform hover:scale-105"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
