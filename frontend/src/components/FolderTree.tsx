import React, { useState, useEffect } from 'react';
import { FolderPlus, FolderOpen, Folder as FolderIcon, X, ChevronRight, ChevronDown, Edit2, Trash2 } from 'lucide-react';
import { useFolders } from '../hooks/useFolders';
import { Folder, FolderCreate } from '../types/Folder';

interface FolderTreeProps {
  isDark?: boolean;
  onClose?: () => void;
  onSelectFolder?: (folder: Folder | null) => void;
}

export const FolderTree: React.FC<FolderTreeProps> = ({ isDark = false, onClose, onSelectFolder }) => {
  const {
    folders,
    loading,
    error,
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
  } = useFolders();

  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showEditFolder, setShowEditFolder] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [folderData, setFolderData] = useState<FolderCreate>({ name: '', parent_id: undefined, organization_id: undefined });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchFolders();
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCreateFolder = async () => {
    if (!folderData.name.trim()) {
      showMessage('error', 'Название обязательно');
      return;
    }

    const result = await createFolder(folderData);
    if ('error' in result) {
      showMessage('error', result.error);
    } else {
      showMessage('success', 'Папка создана');
      setShowCreateFolder(false);
      setFolderData({ name: '', parent_id: undefined, organization_id: undefined });
    }
  };

  const handleUpdateFolder = async () => {
    if (!editingFolder || !folderData.name.trim()) {
      showMessage('error', 'Название обязательно');
      return;
    }

    const result = await updateFolder(editingFolder.id, folderData);
    if ('error' in result) {
      showMessage('error', result.error);
    } else {
      showMessage('success', 'Папка обновлена');
      setShowEditFolder(false);
      setEditingFolder(null);
      setFolderData({ name: '', parent_id: undefined, organization_id: undefined });
    }
  };

  const handleDeleteFolder = async (folderId: number) => {
    if (!confirm('Вы уверены, что хотите удалить папку?')) return;

    const result = await deleteFolder(folderId);
    if (result.success) {
      showMessage('success', 'Папка удалена');
    } else {
      showMessage('error', result.error || 'Ошибка удаления');
    }
  };

  const handleEditClick = (folder: Folder) => {
    setEditingFolder(folder);
    setFolderData({
      name: folder.name,
      parent_id: folder.parent_id || undefined,
      organization_id: folder.organization_id || undefined,
    });
    setShowEditFolder(true);
  };

  const toggleFolderExpand = (folderId: number) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const buildTree = (parentId: number | null = null): Folder[] => {
    return folders
      .filter(f => f.parent_id === parentId)
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const renderFolder = (folder: Folder, level: number = 0) => {
    const children = buildTree(folder.id);
    const isExpanded = expandedFolders.has(folder.id);

    return (
      <div key={folder.id}>
        <div
          className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all hover:opacity-80 ${
            selectedFolder?.id === folder.id
              ? isDark
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-blue-100 text-blue-600'
              : isDark
                ? 'hover:bg-slate-700/50'
                : 'hover:bg-gray-100'
          }`}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          onClick={() => {
            setSelectedFolder(folder);
            if (onSelectFolder) onSelectFolder(folder);
          }}
        >
          {children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolderExpand(folder.id);
              }}
              className="transition-transform"
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
          {isExpanded ? (
            <FolderOpen className={isDark ? 'text-yellow-400' : 'text-yellow-600'} size={18} />
          ) : (
            <FolderIcon className={isDark ? 'text-yellow-400' : 'text-yellow-600'} size={18} />
          )}
          <span className="flex-1 font-medium">{folder.name}</span>
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(folder);
              }}
              className={`p-1 rounded hover:bg-blue-500/20 ${isDark ? 'text-gray-400 hover:text-blue-400' : 'text-gray-500 hover:text-blue-600'}`}
              title="Редактировать"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteFolder(folder.id);
              }}
              className={`p-1 rounded hover:bg-red-500/20 ${isDark ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-600'}`}
              title="Удалить"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        {isExpanded && children.map(child => renderFolder(child, level + 1))}
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 ${
      isDark ? 'text-white' : 'text-gray-900'
    }`}>
      <div className={`rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border transform animate-scale-in ${
        isDark
          ? 'bg-slate-800/95 backdrop-blur-xl border-slate-700/50'
          : 'bg-white/95 backdrop-blur-xl border-gray-200/50'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r ${
            isDark ? 'from-gray-100 to-blue-400' : 'from-gray-900 to-blue-800'
          }`}>
            Папки
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className={`p-3 transition-all duration-300 rounded-2xl transform hover:scale-110 hover:rotate-90 ${
                isDark
                  ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
            >
              <X size={28} />
            </button>
          )}
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-500/20 text-green-600 dark:text-green-400'
              : 'bg-red-500/20 text-red-600 dark:text-red-400'
          }`}>
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        <button
          onClick={() => setShowCreateFolder(true)}
          className={`w-full px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 mb-4 ${
            isDark
              ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <FolderPlus size={18} />
          Создать папку
        </button>

        {folders.length === 0 ? (
          <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <FolderIcon size={48} className="mx-auto mb-4 opacity-50" />
            <p>Папки не созданы</p>
          </div>
        ) : (
          <div className="space-y-1">
            {buildTree(null).map(folder => renderFolder(folder))}
          </div>
        )}

        {/* Create Folder Modal */}
        {showCreateFolder && (
          <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-60 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            <div className={`rounded-3xl p-6 w-full max-w-md shadow-2xl border ${
              isDark
                ? 'bg-slate-800/95 backdrop-blur-xl border-slate-700/50'
                : 'bg-white/95 backdrop-blur-xl border-gray-200/50'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Создать папку</h3>
                <button onClick={() => setShowCreateFolder(false)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Название</label>
                  <input
                    type="text"
                    value={folderData.name}
                    onChange={(e) => setFolderData({ ...folderData, name: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      isDark
                        ? 'border-slate-600 bg-slate-700/80 text-white'
                        : 'border-gray-200 bg-white/80'
                    }`}
                  />
                </div>
                <button
                  onClick={handleCreateFolder}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50"
                >
                  {loading ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Folder Modal */}
        {showEditFolder && editingFolder && (
          <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-60 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            <div className={`rounded-3xl p-6 w-full max-w-md shadow-2xl border ${
              isDark
                ? 'bg-slate-800/95 backdrop-blur-xl border-slate-700/50'
                : 'bg-white/95 backdrop-blur-xl border-gray-200/50'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Редактировать папку</h3>
                <button onClick={() => { setShowEditFolder(false); setEditingFolder(null); }} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Название</label>
                  <input
                    type="text"
                    value={folderData.name}
                    onChange={(e) => setFolderData({ ...folderData, name: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      isDark
                        ? 'border-slate-600 bg-slate-700/80 text-white'
                        : 'border-gray-200 bg-white/80'
                    }`}
                  />
                </div>
                <button
                  onClick={handleUpdateFolder}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50"
                >
                  {loading ? 'Обновление...' : 'Обновить'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
