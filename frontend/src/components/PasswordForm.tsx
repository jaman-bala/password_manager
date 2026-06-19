import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Eye, EyeOff, Save, X, RefreshCw, Shield, ShieldCheck, ShieldAlert, AlertTriangle, Paperclip, Trash2, Download, Image, FileText, ExternalLink } from 'lucide-react';
import { PasswordEntry, PasswordFormData, Category } from '../types/Password';
import { Attachment } from '../types/Attachment';
import { useSecurity } from '../hooks/useSecurity';
import { useFolders } from '../hooks/useFolders';
import { useOrganizations } from '../hooks/useOrganizations';
import { useAttachments } from '../hooks/useAttachments';
import { Folder } from '../types/Folder';
import { Vault } from '../types/Organization';

interface PasswordFormProps {
  entry?: PasswordEntry | null;
  categories: Category[];
  onSubmit: (data: PasswordFormData, files: File[]) => void;
  onCancel: () => void;
  isDark?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
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
    category_id: undefined,
    folder_id: undefined,
    vault_id: undefined
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<PasswordFormData>>({});
  const { checkPasswordBreach } = useSecurity();
  const { folders, fetchFolders } = useFolders();
  const { vaults, fetchVaults } = useOrganizations();
  const { fetchAttachments, deleteAttachment, getDownloadUrl } = useAttachments();
  const [breachCheck, setBreachCheck] = useState<{ is_breached: boolean; count: number } | null>(null);
  const [checkingBreach, setCheckingBreach] = useState(false);

  // Attachment state
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    fetchFolders();
    fetchVaults();
  }, []);

  useEffect(() => {
    if (entry) {
      setFormData({
        title: entry.title || '',
        url: entry.url || '',
        login: entry.login || '',
        password: entry.password || '',
        notes: entry.notes || '',
        category_id: entry.category?.id,
        folder_id: entry.folder_id,
        vault_id: entry.vault_id
      });
      // Load existing attachments when editing
      fetchAttachments(entry.id).then(setExistingAttachments);
    } else {
      setFormData({
        title: '',
        url: '',
        login: '',
        password: '',
        notes: '',
        category_id: undefined,
        folder_id: undefined,
        vault_id: undefined
      });
      setExistingAttachments([]);
    }
    setErrors({});
    setShowPassword(false);
    setPendingFiles([]);
    setPendingPreviews([]);
  }, [entry]);

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => {
      pendingPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [pendingPreviews]);

  const addFiles = useCallback((newFiles: File[]) => {
    setAttachmentError(null);
    const valid: File[] = [];
    const previews: string[] = [];
    const oversized: string[] = [];

    for (const f of newFiles) {
      if (f.size > MAX_FILE_SIZE) {
        oversized.push(f.name);
        continue;
      }
      valid.push(f);
      previews.push(f.type.startsWith('image/') ? URL.createObjectURL(f) : '');
    }

    if (oversized.length > 0) {
      setAttachmentError(`Файлы превышают 10 МБ: ${oversized.join(', ')}`);
    }

    setPendingFiles(prev => [...prev, ...valid]);
    setPendingPreviews(prev => [...prev, ...previews]);
  }, []);

  const removePendingFile = (index: number) => {
    if (pendingPreviews[index]) URL.revokeObjectURL(pendingPreviews[index]);
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
    setPendingPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExisting = async (attachment: Attachment) => {
    const result = await deleteAttachment(attachment.id);
    if (result.error) {
      setAttachmentError(result.error);
    } else {
      setExistingAttachments(prev => prev.filter(a => a.id !== attachment.id));
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) addFiles(dropped);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PasswordFormData> = {};
    if (!formData.title?.trim()) newErrors.title = 'Название обязательно';
    if (!formData.login?.trim()) newErrors.login = 'Логин обязательный';
    if (!formData.password?.trim()) newErrors.password = 'Пароль обязательный';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordChange = async (value: string) => {
    setFormData({ ...formData, password: value });
    setBreachCheck(null);
    if (value.length >= 8) {
      setCheckingBreach(true);
      const result = await checkPasswordBreach({ password: value });
      setBreachCheck(result);
      setCheckingBreach(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData, pendingFiles);
    }
  };

  const handleChange = (field: keyof PasswordFormData, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const generatePassword = (length: number = 16) => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const all = uppercase + lowercase + numbers + symbols;

    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    for (let i = 4; i < length; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    handleChange('password', password);
  };

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

  const inputClass = (hasError?: boolean) =>
    `w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
      hasError
        ? 'border-red-500 bg-red-50/50'
        : isDark
          ? 'border-slate-600 bg-slate-700/80 text-white placeholder-slate-400'
          : 'border-gray-200 bg-white/80'
    }`;

  const totalAttachments = existingAttachments.length + pendingFiles.length;

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
          {/* Название */}
          <div>
            <label className={`block text-sm font-bold mb-3 uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              Название *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={inputClass(!!errors.title)}
              placeholder="Например: Gmail, Facebook..."
            />
            {errors.title && <p className="text-red-500 text-sm mt-2 font-medium animate-shake">{errors.title}</p>}
          </div>

          {/* URL */}
          <div>
            <label className={`block text-sm font-bold mb-3 uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              URL
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => handleChange('url', e.target.value)}
              className={`w-full px-6 py-4 border rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 font-medium shadow-lg hover:shadow-xl ${
                isDark ? 'border-slate-600 bg-slate-700/80 text-white placeholder-slate-400' : 'border-gray-200 bg-white/80'
              }`}
              placeholder="https://example.com"
            />
          </div>

          {/* Логин */}
          <div>
            <label className={`block text-sm font-bold mb-3 uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              Логин *
            </label>
            <input
              type="text"
              value={formData.login}
              onChange={(e) => handleChange('login', e.target.value)}
              className={inputClass(!!errors.login)}
              placeholder="Ваш логин или email"
            />
            {errors.login && <p className="text-red-500 text-sm mt-2 font-medium animate-shake">{errors.login}</p>}
          </div>

          {/* Пароль */}
          <div>
            <label className={`block text-sm font-bold mb-3 uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              Пароль *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className={`${inputClass(!!errors.password)} pr-24`}
                placeholder="Ваш пароль"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => generatePassword()}
                  className={`transition-all duration-300 p-2 rounded-xl hover:scale-110 ${
                    isDark ? 'text-slate-400 hover:text-green-400 hover:bg-green-500/10' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                  }`}
                  title="Сгенерировать пароль"
                >
                  <RefreshCw size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`transition-all duration-300 p-2 rounded-xl hover:scale-110 ${
                    isDark ? 'text-slate-400 hover:text-blue-400 hover:bg-blue-500/10' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
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
                  {checkingBreach && <span className="text-sm text-gray-500 animate-pulse">Проверка утечек...</span>}
                </div>
                {breachCheck && breachCheck.is_breached && (
                  <div className={`p-3 rounded-xl flex items-start gap-2 ${
                    isDark ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'
                  }`}>
                    <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                    <div className="text-sm">
                      <p className="font-semibold text-red-600 dark:text-red-400">
                        Этот пароль найден в {breachCheck.count} утечке(ах) данных!
                      </p>
                      <p className="text-red-500/80 mt-1">Рекомендуется использовать другой пароль.</p>
                    </div>
                  </div>
                )}
                {breachCheck && !breachCheck.is_breached && (
                  <div className={`p-3 rounded-xl flex items-center gap-2 ${
                    isDark ? 'bg-green-500/10 border border-green-500/30' : 'bg-green-50 border border-green-200'
                  }`}>
                    <ShieldCheck className="text-green-500" size={16} />
                    <span className="text-sm font-medium text-green-600">Пароль не найден в утечках данных</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
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

          {/* Категория */}
          <div>
            <label className={`block text-sm font-bold mb-3 uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              Категория
            </label>
            <select
              value={formData.category_id || ''}
              onChange={(e) => handleChange('category_id', e.target.value ? parseInt(e.target.value) : undefined)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer ${
                isDark ? 'border-slate-600 bg-slate-700/80 text-white' : 'border-gray-200 bg-white/80'
              }`}
            >
              <option value="" className={isDark ? 'bg-slate-700' : ''}>Без категории</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className={isDark ? 'bg-slate-700' : ''}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Папка */}
          <div>
            <label className={`block text-sm font-bold mb-3 uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              Папка
            </label>
            <select
              value={formData.folder_id || ''}
              onChange={(e) => handleChange('folder_id', e.target.value ? parseInt(e.target.value) : undefined)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer ${
                isDark ? 'border-slate-600 bg-slate-700/80 text-white' : 'border-gray-200 bg-white/80'
              }`}
            >
              <option value="" className={isDark ? 'bg-slate-700' : ''}>Без папки</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id} className={isDark ? 'bg-slate-700' : ''}>
                  {folder.full_path || folder.name}
                </option>
              ))}
            </select>
          </div>

          {/* Сейф */}
          <div>
            <label className={`block text-sm font-bold mb-3 uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              Сейф (для командной работы)
            </label>
            <select
              value={formData.vault_id || ''}
              onChange={(e) => handleChange('vault_id', e.target.value ? parseInt(e.target.value) : undefined)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer ${
                isDark ? 'border-slate-600 bg-slate-700/80 text-white' : 'border-gray-200 bg-white/80'
              }`}
            >
              <option value="" className={isDark ? 'bg-slate-700' : ''}>Без сейфа</option>
              {vaults.map((vault) => (
                <option key={vault.id} value={vault.id} className={isDark ? 'bg-slate-700' : ''}>
                  {vault.name} (Организация ID: {vault.organization_id})
                </option>
              ))}
            </select>
          </div>

          {/* Описание */}
          <div>
            <label className={`block text-sm font-bold mb-3 uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              Описание
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className={`w-full px-6 py-4 border rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 resize-none font-medium shadow-lg hover:shadow-xl ${
                isDark ? 'border-slate-600 bg-slate-700/80 text-white placeholder-slate-400' : 'border-gray-200 bg-white/80'
              }`}
              placeholder="Дополнительная информация..."
            />
          </div>

          {/* ─── ВЛОЖЕНИЯ ─── */}
          <div>
            <label className={`flex items-center gap-2 text-sm font-bold mb-3 uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              <Paperclip size={15} />
              Вложения
              {totalAttachments > 0 && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                }`}>
                  {totalAttachments}
                </span>
              )}
            </label>

            {/* Drop zone */}
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? isDark
                    ? 'border-blue-400 bg-blue-500/10 scale-[1.01]'
                    : 'border-blue-400 bg-blue-50 scale-[1.01]'
                  : isDark
                    ? 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/40'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInputChange}
              />
              <Paperclip size={24} className={`mx-auto mb-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {isDragging ? 'Отпустите для загрузки' : 'Перетащите файлы или нажмите для выбора'}
              </p>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                Изображения, документы, до 10 МБ каждый
              </p>
            </div>

            {attachmentError && (
              <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                <AlertTriangle size={14} /> {attachmentError}
              </p>
            )}

            {/* Existing attachments (edit mode) */}
            {existingAttachments.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  Сохранённые вложения
                </p>
                {existingAttachments.map(att => {
                  const isImage = att.content_type.startsWith('image/');
                  const downloadUrl = getDownloadUrl(att.id);
                  return (
                    <div
                      key={att.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border ${
                        isDark ? 'border-slate-600 bg-slate-700/50' : 'border-gray-200 bg-gray-50/80'
                      }`}
                    >
                      {isImage ? (
                        <img
                          src={downloadUrl}
                          alt={att.filename}
                          className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isDark ? 'bg-slate-600' : 'bg-gray-200'
                        }`}>
                          <FileText size={20} className={isDark ? 'text-slate-300' : 'text-gray-500'} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          {att.filename}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          {formatBytes(att.size)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <a
                          href={downloadUrl}
                          target={isImage ? '_blank' : undefined}
                          download={!isImage ? att.filename : undefined}
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={`p-1.5 rounded-lg transition-all ${
                            isDark ? 'text-slate-400 hover:text-blue-400 hover:bg-blue-500/10' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                          title={isImage ? 'Открыть' : 'Скачать'}
                        >
                          {isImage ? <ExternalLink size={16} /> : <Download size={16} />}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteExisting(att)}
                          className={`p-1.5 rounded-lg transition-all ${
                            isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                          }`}
                          title="Удалить вложение"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pending (new) files */}
            {pendingFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  Будут загружены после сохранения
                </p>
                {pendingFiles.map((file, index) => {
                  const isImage = file.type.startsWith('image/');
                  const preview = pendingPreviews[index];
                  return (
                    <div
                      key={`${file.name}-${index}`}
                      className={`flex items-center gap-3 p-3 rounded-xl border ${
                        isDark ? 'border-slate-600 bg-slate-700/30 border-dashed' : 'border-gray-200 bg-blue-50/40 border-dashed'
                      }`}
                    >
                      {isImage && preview ? (
                        <img
                          src={preview}
                          alt={file.name}
                          className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isDark ? 'bg-slate-600' : 'bg-gray-200'
                        }`}>
                          {isImage
                            ? <Image size={20} className={isDark ? 'text-slate-300' : 'text-gray-500'} />
                            : <FileText size={20} className={isDark ? 'text-slate-300' : 'text-gray-500'} />
                          }
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          {file.name}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          {formatBytes(file.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePendingFile(index)}
                        className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${
                          isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                        }`}
                        title="Убрать файл"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Кнопки */}
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