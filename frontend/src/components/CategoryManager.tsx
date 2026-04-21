import React, { useState } from 'react';
import { FolderPlus, Trash2, X } from 'lucide-react';
import { Category } from '../types/Password';

interface CategoryManagerProps {
    categories: Category[];
    onCreateCategory: (name: string) => Promise<void>;
    onDeleteCategory: (id: number) => Promise<void>;
    onSelectCategory?: (category: Category | null) => void;
    selectedCategoryId?: number | null;
    isDark?: boolean;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
    categories,
    onCreateCategory,
    onDeleteCategory,
    onSelectCategory,
    selectedCategoryId,
    isDark = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        setLoading(true);
        setError(null);
        try {
            await onCreateCategory(newCategoryName);
            setNewCategoryName('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка создания категории');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (window.confirm('Вы уверены? Пароли в этой категории будут перемещены в основное хранилище.')) {
            try {
                await onDeleteCategory(id);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Ошибка удаления категории');
            }
        }
    };

    return (
        <div className="relative">
            {/* Кнопка открытия/закрытия */}
            {/* Кнопка открытия/закрытия */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-3 font-semibold shadow-2xl shadow-blue-600/30 hover:shadow-blue-600/50 transform hover:scale-105 hover:-translate-y-1 min-w-[220px]"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <FolderPlus size={22} className="group-hover:rotate-12 transition-transform duration-300" />
                Категории ({categories.length})
            </button>

            {/* Модальное окно */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className={`${isDark ? 'bg-slate-800/95 border-slate-700/50' : 'bg-white/95 border-gray-200/50'} backdrop-blur-xl rounded-3xl p-8 w-full max-w-md shadow-2xl border transform animate-scale-in`}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className={`text-2xl font-bold bg-gradient-to-r ${isDark ? 'from-white to-blue-400' : 'from-gray-900 to-blue-800'} bg-clip-text text-transparent`}>
                                Категории
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className={`p-2 ${isDark ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'} transition-all duration-300 rounded-xl`}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {error && (
                            <div className={`mb-4 p-3 ${isDark ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-red-50 border-red-200 text-red-700'} border rounded-lg text-sm`}>
                                {error}
                            </div>
                        )}

                        {/* Форма добавления новой категории */}
                        <form onSubmit={handleCreateCategory} className="mb-6">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="Название категории..."
                                    className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400' : 'border-gray-200'}`}
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !newCategoryName.trim()}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 transition-all transform hover:scale-105"
                                >
                                    {loading ? 'Добавление...' : 'Добавить'}
                                </button>
                            </div>
                        </form>

                        {/* Список категорий */}
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {categories.length === 0 ? (
                                <p className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Категории не созданы</p>
                            ) : (
                                categories.map((category) => (
                                    <div
                                        key={category.id}
                                        onClick={() => onSelectCategory?.(category)}
                                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${selectedCategoryId === category.id
                                            ? (isDark ? 'bg-blue-500/20 border-blue-400/50' : 'bg-blue-100 border-blue-300')
                                            : (isDark ? 'bg-slate-700/50 hover:bg-slate-600/50 border-transparent' : 'bg-gray-50 hover:bg-gray-100 border-transparent')
                                            }`}
                                    >
                                        <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{category.name}</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteCategory(category.id);
                                            }}
                                            className={`p-1 ${isDark ? 'text-gray-400 hover:text-red-400' : 'text-gray-400 hover:text-red-500'} transition-colors`}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Кнопка закрытия */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className={`w-full mt-6 px-4 py-2 rounded-lg transition-all font-medium ${isDark ? 'bg-slate-700 text-gray-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                        >
                            Закрыть
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
