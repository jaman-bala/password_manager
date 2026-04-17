import React, { useState } from 'react';
import { Eye, EyeOff, Edit, Trash2, ExternalLink, Copy, Shield } from 'lucide-react';
import { PasswordEntry } from '../types/Password';

interface PasswordTableProps {
  entries: PasswordEntry[];
  onEdit: (entry: PasswordEntry) => void;
  onDelete: (id: number) => void;
}

export const PasswordTable: React.FC<PasswordTableProps> = ({
  entries,
  onEdit,
  onDelete
}) => {
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

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

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };


  if (entries.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 p-16 text-center">
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Shield className="text-gray-400" size={48} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl animate-pulse delay-500"></div>
        </div>
        <h3 className="text-2xl font-bold text-gray-700 mb-4">
          Пока нет сохраненных паролей
        </h3>
        <p className="text-gray-500 text-lg">
          Добавьте первую запись, чтобы начать управление паролями
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50/80 to-blue-50/50 border-b border-gray-200/50 backdrop-blur-sm">
            <tr>
              <th className="text-left py-6 px-8 font-bold text-gray-800 text-sm uppercase tracking-wider min-w-[200px]">Название</th>
              <th className="text-left py-6 px-8 font-bold text-gray-800 text-sm uppercase tracking-wider min-w-[150px]">Категория</th>
              <th className="text-left py-6 px-8 font-bold text-gray-800 text-sm uppercase tracking-wider min-w-[250px]">URL</th>
              <th className="text-left py-6 px-8 font-bold text-gray-800 text-sm uppercase tracking-wider min-w-[200px]">Логин</th>
              <th className="text-left py-6 px-8 font-bold text-gray-800 text-sm uppercase tracking-wider min-w-[200px]">Пароль</th>
              <th className="text-left py-6 px-8 font-bold text-gray-800 text-sm uppercase tracking-wider min-w-[300px]">Описание</th>
              <th className="text-center py-6 px-8 font-bold text-gray-800 text-sm uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-gray-100/50 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/30 transition-all duration-300 group">
                <td className="py-6 px-8">
                  <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-300">
                    {entry.title ? (entry.title.length > 50 ? entry.title.substring(0, 50) + '...' : entry.title) : '—'}
                  </div>
                </td>
                <td className="py-6 px-8">
                  {entry.category ? (
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {entry.category.name}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </td>
                <td className="py-6 px-8">
                  {entry.url ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100 transition-all duration-300 transform hover:scale-105"
                      >
                        <ExternalLink size={14} />
                        {entry.url.length > 40 ? entry.url.substring(0, 40) + '...' : entry.url}
                      </a>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </td>
                <td className="py-6 px-8">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-medium">
                      {entry.login ? (entry.login.length > 30 ? entry.login.substring(0, 30) + '...' : entry.login) : '—'}
                    </span>
                    {entry.login && (
                      <button
                        onClick={() => copyToClipboard(entry.login!)}
                        className="text-gray-400 hover:text-blue-600 transition-colors duration-300 p-1 rounded-full hover:bg-blue-50 transform hover:scale-110"
                      >
                        <Copy size={14} />
                      </button>
                    )}
                  </div>
                </td>
                <td className="py-6 px-8">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-mono font-bold">
                      {visiblePasswords.has(entry.id) ? (entry.password || '••••••••') : '••••••••'}
                    </span>
                    <button
                      onClick={() => togglePasswordVisibility(entry.id)}
                      className="text-gray-400 hover:text-purple-600 transition-colors duration-300 p-1 rounded-full hover:bg-purple-50 transform hover:scale-110"
                    >
                      {visiblePasswords.has(entry.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    {entry.password && (
                      <button
                        onClick={() => copyToClipboard(entry.password!)}
                        className="text-gray-400 hover:text-green-600 transition-colors duration-300 p-1 rounded-full hover:bg-green-50 transform hover:scale-110"
                      >
                        <Copy size={14} />
                      </button>
                    )}
                  </div>
                </td>
                <td className="py-6 px-8">
                  <div className="text-gray-600 text-sm font-medium">
                    {entry.notes ? (entry.notes.length > 50 ? entry.notes.substring(0, 50) + '...' : entry.notes) : '—'}
                  </div>
                </td>
                <td className="py-6 px-8">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => onEdit(entry)}
                      className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 shadow-lg hover:shadow-blue-200"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className={`p-2 rounded-lg transition-colors ${deleteConfirm === entry.id
                          ? 'text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-200 transform scale-110'
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
};