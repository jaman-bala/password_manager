import React, { useState } from 'react';
import { Eye, EyeOff, Edit, Trash2, ExternalLink, Copy, Shield, ChevronUp, ChevronDown, Plus, Check } from 'lucide-react';
import { PasswordEntry } from '../types/Password';

interface PasswordTableProps {
  entries: PasswordEntry[];
  onEdit: (entry: PasswordEntry) => void;
  onDelete: (id: number) => void;
  viewMode?: 'table' | 'card';
  onCopy?: () => void;
  isDark?: boolean;
  loading?: boolean;
}

export const PasswordTable: React.FC<PasswordTableProps & { onAddNew?: () => void }> = ({
  entries,
  onEdit,
  onDelete,
  onAddNew,
  viewMode = 'table',
  onCopy,
  isDark = false,
  loading = false
}) => {
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [sortField, setSortField] = useState<'title' | 'login' | 'created_at'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Сортировка записей
  const sortedEntries = [...entries].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'title':
        comparison = (a.title || '').localeCompare(b.title || '');
        break;
      case 'login':
        comparison = (a.login || '').localeCompare(b.login || '');
        break;
      case 'created_at':
        comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: 'title' | 'login' | 'created_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: 'title' | 'login' | 'created_at' }) => {
    if (sortField !== field) return <span className="text-gray-300">↕</span>;
    return sortDirection === 'asc' ? <ChevronUp size={16} className="text-blue-600" /> : <ChevronDown size={16} className="text-blue-600" />;
  };

  const togglePasswordVisibility = (id: number) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleDelete = (id: number) => {
    if (deleteConfirm === id) {
      onDelete(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copyToClipboard = async (text: string, id?: number) => {
    await navigator.clipboard.writeText(text);
    onCopy?.();
    if (id) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };


  if (entries.length === 0 && !loading) {
    return (
      <div className={`rounded-2xl shadow-lg border p-8 text-center min-h-[200px] flex flex-col items-center justify-center ${
        isDark
          ? 'bg-slate-800/80 border-slate-700/50'
          : 'bg-white/80 backdrop-blur-sm border-gray-200/50'
      }`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
          isDark ? 'bg-slate-700' : 'bg-gray-100'
        }`}>
          <Shield className={isDark ? 'text-slate-500' : 'text-gray-400'} size={24} />
        </div>
        <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
          Нет записей
        </h3>
        <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Попробуйте изменить параметры поиска или добавьте новую запись
        </p>
        {onAddNew && (
          <button
            onClick={onAddNew}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
          >
            <Plus size={18} />
            Добавить пароль
          </button>
        )}
      </div>
    );
  }

  // Card View Component
  const CardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sortedEntries.map((entry) => (
        <div
          key={entry.id}
          className={`rounded-2xl shadow-xl border p-6 hover:shadow-2xl transition-all duration-300 group hover:-translate-y-1 ${
            isDark
              ? 'bg-slate-800/90 border-slate-700/50'
              : 'bg-white/90 backdrop-blur-sm border-gray-200/50'
          }`}
        >
          {/* Header with favicon */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {entry.url && (
                <img
                  src={`https://www.google.com/s2/favicons?domain=${entry.url}&sz=64`}
                  alt=""
                  className={`w-10 h-10 rounded-lg p-1 ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <div>
                <h3 className={`font-bold group-hover:text-blue-500 transition-colors ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  {entry.title || 'Без названия'}
                </h3>
                {entry.category && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    isDark ? 'text-blue-300 bg-blue-900/30' : 'text-blue-600 bg-blue-50'
                  }`}>
                    {entry.category.name}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => onEdit(entry)}
                className={`p-2 rounded-lg transition-all ${
                  isDark
                    ? 'text-slate-400 hover:text-blue-400 hover:bg-blue-500/10'
                    : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDelete(entry.id)}
                className={`p-2 rounded-lg transition-all ${
                  deleteConfirm === entry.id
                    ? 'text-white bg-red-500'
                    : isDark
                      ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
                      : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* URL */}
          {entry.url && (
            <a
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm flex items-center gap-1 mb-3 truncate ${
                isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              <ExternalLink size={12} />
              {entry.url.replace(/^https?:\/\//, '').substring(0, 30)}...
            </a>
          )}

          {/* Login */}
          <div className={`rounded-xl p-3 mb-2 ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <span className={`text-xs block mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Логин</span>
                <span className={`text-sm font-medium truncate block ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  {entry.login || '—'}
                </span>
              </div>
              {entry.login && (
                <button
                  onClick={() => copyToClipboard(entry.login!, entry.id + 1000)}
                  className={`ml-2 p-2 rounded-lg transition-all ${
                    copiedId === entry.id + 1000
                      ? 'text-green-600 bg-green-100'
                      : isDark
                        ? 'text-slate-400 hover:text-blue-400 hover:bg-blue-500/10'
                        : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {copiedId === entry.id + 1000 ? <Check size={16} /> : <Copy size={16} />}
                </button>
              )}
            </div>
          </div>

          {/* Password */}
          <div className={`rounded-xl p-3 ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <span className={`text-xs block mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Пароль</span>
                <span className={`text-sm font-mono font-bold truncate block ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  {visiblePasswords.has(entry.id) ? (entry.password || '••••••••') : '••••••••'}
                </span>
              </div>
              <div className="flex gap-1 ml-2">
                <button
                  onClick={() => togglePasswordVisibility(entry.id)}
                  className={`p-2 rounded-lg transition-all ${
                    isDark
                      ? 'text-slate-400 hover:text-purple-400 hover:bg-purple-500/10'
                      : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  {visiblePasswords.has(entry.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {entry.password && (
                  <button
                    onClick={() => copyToClipboard(entry.password!, entry.id)}
                    className={`p-2 rounded-lg transition-all ${
                      copiedId === entry.id
                        ? 'text-green-600 bg-green-100'
                        : isDark
                          ? 'text-slate-400 hover:text-green-400 hover:bg-green-500/10'
                          : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {copiedId === entry.id ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {entry.notes && (
            <p className={`text-xs mt-3 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{entry.notes}</p>
          )}
        </div>
      ))}
    </div>
  );

  // Table View Component
  const TableView = () => (
    <div className={`rounded-3xl shadow-2xl border overflow-hidden ${
      isDark
        ? 'bg-slate-800/80 border-slate-700/50'
        : 'bg-white/80 backdrop-blur-sm border-gray-200/50'
    }`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`border-b backdrop-blur-sm ${
            isDark
              ? 'bg-slate-700/50 border-slate-600/50'
              : 'bg-gradient-to-r from-gray-50/80 to-blue-50/50 border-gray-200/50'
          }`}>
            <tr>
              <th
                className={`text-left py-6 px-8 font-bold text-sm uppercase tracking-wider min-w-[200px] cursor-pointer transition-colors select-none ${
                  isDark
                    ? 'text-gray-200 hover:bg-slate-600/50'
                    : 'text-gray-800 hover:bg-gray-100/50'
                }`}
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-2">
                  Название
                  <SortIcon field="title" />
                </div>
              </th>
              <th className={`text-left py-6 px-8 font-bold text-sm uppercase tracking-wider min-w-[150px] ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Категория</th>
              <th className={`text-left py-6 px-8 font-bold text-sm uppercase tracking-wider min-w-[250px] ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>URL</th>
              <th
                className={`text-left py-6 px-8 font-bold text-sm uppercase tracking-wider min-w-[200px] cursor-pointer transition-colors select-none ${
                  isDark
                    ? 'text-gray-200 hover:bg-slate-600/50'
                    : 'text-gray-800 hover:bg-gray-100/50'
                }`}
                onClick={() => handleSort('login')}
              >
                <div className="flex items-center gap-2">
                  Логин
                  <SortIcon field="login" />
                </div>
              </th>
              <th className={`text-left py-6 px-8 font-bold text-sm uppercase tracking-wider min-w-[200px] ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Пароль</th>
              <th className={`text-left py-6 px-8 font-bold text-sm uppercase tracking-wider min-w-[300px] ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Описание</th>
              <th className={`text-center py-6 px-8 font-bold text-sm uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {sortedEntries.map((entry) => (
              <tr key={entry.id} className={`transition-all duration-300 group ${
                isDark
                  ? 'border-b border-slate-700/50 hover:bg-slate-700/30'
                  : 'border-b border-gray-100/50 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/30'
              }`}>
                <td className="py-6 px-8">
                  <div className="flex items-center gap-2">
                    {entry.url && (
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${entry.url}&sz=32`}
                        alt=""
                        className="w-5 h-5 rounded"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    <span className={`font-bold transition-colors duration-300 ${
                      isDark
                        ? 'text-gray-200 group-hover:text-blue-400'
                        : 'text-gray-900 group-hover:text-blue-700'
                    }`}>
                      {entry.title ? (entry.title.length > 50 ? entry.title.substring(0, 50) + '...' : entry.title) : '—'}
                    </span>
                  </div>
                </td>
                <td className="py-6 px-8">
                  {entry.category ? (
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {entry.category.name}
                    </span>
                  ) : (
                    <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>—</span>
                  )}
                </td>
                <td className="py-6 px-8">
                  {entry.url ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-full transition-all duration-300 transform hover:scale-105 ${
                          isDark
                            ? 'text-blue-400 bg-blue-900/20 hover:bg-blue-800/30'
                            : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                        }`}
                      >
                        <ExternalLink size={14} />
                        {entry.url.length > 40 ? entry.url.substring(0, 40) + '...' : entry.url}
                      </a>
                    </div>
                  ) : (
                    <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>—</span>
                  )}
                </td>
                <td className="py-6 px-8">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                      {entry.login ? (entry.login.length > 30 ? entry.login.substring(0, 30) + '...' : entry.login) : '—'}
                    </span>
                    {entry.login && (
                      <button
                        onClick={() => copyToClipboard(entry.login!, entry.id + 1000)}
                        className={`p-1 rounded-full transition-all ${
                          copiedId === entry.id + 1000
                            ? 'text-green-600 bg-green-100'
                            : isDark
                              ? 'text-slate-400 hover:text-blue-400 hover:bg-blue-500/10'
                              : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        {copiedId === entry.id + 1000 ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    )}
                  </div>
                </td>
                <td className="py-6 px-8">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                      {visiblePasswords.has(entry.id) ? (entry.password || '••••••••') : '••••••••'}
                    </span>
                    <button
                      onClick={() => togglePasswordVisibility(entry.id)}
                      className={`transition-colors duration-300 p-1 rounded-full transform hover:scale-110 ${
                        isDark
                          ? 'text-slate-400 hover:text-purple-400 hover:bg-purple-500/10'
                          : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'
                      }`}
                    >
                      {visiblePasswords.has(entry.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    {entry.password && (
                      <button
                        onClick={() => copyToClipboard(entry.password!, entry.id)}
                        className={`p-1 rounded-full transition-all ${
                          copiedId === entry.id
                            ? 'text-green-600 bg-green-100'
                            : isDark
                              ? 'text-slate-400 hover:text-green-400 hover:bg-green-500/10'
                              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {copiedId === entry.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    )}
                  </div>
                </td>
                <td className="py-6 px-8">
                  <div className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                    {entry.notes ? (entry.notes.length > 50 ? entry.notes.substring(0, 50) + '...' : entry.notes) : '—'}
                  </div>
                </td>
                <td className="py-6 px-8">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => onEdit(entry)}
                      className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 ${
                        isDark
                          ? 'text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 shadow-lg shadow-slate-900/50 hover:shadow-blue-500/20'
                          : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-blue-200'
                      }`}
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className={`p-2 rounded-lg transition-colors ${deleteConfirm === entry.id
                          ? 'text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-200 transform scale-110'
                          : isDark
                            ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10 transform hover:scale-110 hover:-translate-y-1 shadow-lg shadow-slate-900/50 hover:shadow-red-500/20'
                            : 'text-gray-400 hover:text-red-600 hover:bg-red-50 transform hover:scale-110 hover:-translate-y-1 shadow-lg hover:shadow-red-200'
                        }`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-[400px]">
      {viewMode === 'card' ? <CardView /> : <TableView />}
    </div>
  );
}