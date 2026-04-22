import React, { useState } from 'react';
import { Download, Upload, FileText, X, AlertTriangle, CheckCircle, Copy } from 'lucide-react';
import { ImportData } from '../types/ImportExport';

interface ImportExportProps {
  isDark?: boolean;
  onClose?: () => void;
}

export const ImportExport: React.FC<ImportExportProps> = ({ isDark = false, onClose }) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [importData, setImportData] = useState('');
  const [importFormat, setImportFormat] = useState<'json' | 'csv'>('json');
  const [masterPassword, setMasterPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [exportResult, setExportResult] = useState<{ data: string; count: number } | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleExport = async () => {
    setLoading(true);
    setMessage(null);
    setExportResult(null);

    try {
      const response = await fetch('/api/import-export/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ format: exportFormat }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        showMessage('error', errorData.error || 'Ошибка экспорта');
        return;
      }

      const result = await response.json();
      setExportResult({ data: result.data, count: result.count });
      showMessage('success', `Экспортировано ${result.count} записей`);
    } catch (err) {
      showMessage('error', 'Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExport = () => {
    if (!exportResult) return;

    const blob = new Blob([exportResult.data], {
      type: exportFormat === 'json' ? 'application/json' : 'text/csv',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `passwords_export.${exportFormat}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyExport = () => {
    if (!exportResult) return;
    navigator.clipboard.writeText(exportResult.data);
    showMessage('success', 'Скопировано в буфер обмена');
  };

  const handleImport = async () => {
    setLoading(true);
    setMessage(null);
    setImportResult(null);

    try {
      const data: ImportData = {
        data: importData,
        format: importFormat,
        master_password: masterPassword || undefined,
      };

      const response = await fetch('/api/import-export/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        showMessage('error', result.error || 'Ошибка импорта');
        return;
      }

      setImportResult({ imported: result.imported, errors: result.errors || [] });
      showMessage('success', `Импортировано ${result.imported} записей`);
    } catch (err) {
      showMessage('error', 'Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`/api/import-export/export-template?format=${importFormat}`);
      const result = await response.json();

      const blob = new Blob([result.data], {
        type: importFormat === 'json' ? 'application/json' : 'text/csv',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template.${importFormat}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showMessage('error', 'Ошибка загрузки шаблона');
    }
  };

  return (
    <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 ${
      isDark ? 'text-white' : 'text-gray-900'
    }`}>
      <div className={`rounded-3xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border transform animate-scale-in ${
        isDark
          ? 'bg-slate-800/95 backdrop-blur-xl border-slate-700/50'
          : 'bg-white/95 backdrop-blur-xl border-gray-200/50'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r ${
            isDark ? 'from-gray-100 to-blue-400' : 'from-gray-900 to-blue-800'
          }`}>
            Импорт / Экспорт
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
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'export'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : isDark
                  ? 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Download size={18} className="inline mr-2" />
            Экспорт
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'import'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : isDark
                  ? 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Upload size={18} className="inline mr-2" />
            Импорт
          </button>
        </div>

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <div>
              <label className={`block text-sm font-bold mb-2 uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                Формат экспорта
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setExportFormat('json')}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                    exportFormat === 'json'
                      ? 'bg-blue-600 text-white'
                      : isDark
                        ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  JSON
                </button>
                <button
                  onClick={() => setExportFormat('csv')}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                    exportFormat === 'csv'
                      ? 'bg-blue-600 text-white'
                      : isDark
                        ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  CSV
                </button>
              </div>
            </div>

            <button
              onClick={handleExport}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-3 font-bold shadow-lg disabled:opacity-50"
            >
              <Download size={20} />
              {loading ? 'Экспорт...' : 'Экспортировать пароли'}
            </button>

            {exportResult && (
              <div className={`p-6 rounded-2xl ${
                isDark ? 'bg-slate-700/50' : 'bg-gray-50'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold">Экспортировано {exportResult.count} записей</span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyExport}
                      className={`p-2 rounded-lg transition-all ${
                        isDark ? 'bg-slate-600 hover:bg-slate-500' : 'bg-white hover:bg-gray-100'
                      }`}
                      title="Копировать"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={handleDownloadExport}
                      className={`p-2 rounded-lg transition-all ${
                        isDark ? 'bg-slate-600 hover:bg-slate-500' : 'bg-white hover:bg-gray-100'
                      }`}
                      title="Скачать"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>
                <textarea
                  value={exportResult.data}
                  readOnly
                  rows={10}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-mono resize-none ${
                    isDark ? 'bg-slate-800 text-gray-300' : 'bg-white text-gray-700'
                  }`}
                />
              </div>
            )}
          </div>
        )}

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="space-y-6">
            <div>
              <label className={`block text-sm font-bold mb-2 uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                Формат импорта
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setImportFormat('json')}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                    importFormat === 'json'
                      ? 'bg-blue-600 text-white'
                      : isDark
                        ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  JSON
                </button>
                <button
                  onClick={() => setImportFormat('csv')}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                    importFormat === 'csv'
                      ? 'bg-blue-600 text-white'
                      : isDark
                        ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  CSV
                </button>
              </div>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className={`w-full px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                isDark
                  ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FileText size={18} />
              Скачать шаблон
            </button>

            <div>
              <label className={`block text-sm font-bold mb-2 uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                Данные для импорта
              </label>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                rows={10}
                placeholder={`Вставьте ${importFormat.toUpperCase()} данные...`}
                className={`w-full px-4 py-3 rounded-xl resize-none ${
                  isDark
                    ? 'bg-slate-700/80 text-white placeholder-slate-400'
                    : 'bg-white/80 placeholder-gray-400'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-bold mb-2 uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                Мастер-пароль (если данные зашифрованы)
              </label>
              <input
                type="password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  isDark
                    ? 'border-slate-600 bg-slate-700/80 text-white placeholder-slate-400'
                    : 'border-gray-200 bg-white/80'
                }`}
                placeholder="Опционально"
              />
            </div>

            <button
              onClick={handleImport}
              disabled={loading || !importData}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-3 font-bold shadow-lg disabled:opacity-50"
            >
              <Upload size={20} />
              {loading ? 'Импорт...' : 'Импортировать пароли'}
            </button>

            {importResult && (
              <div className={`p-6 rounded-2xl ${
                isDark ? 'bg-slate-700/50' : 'bg-gray-50'
              }`}>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="text-green-500" size={20} />
                  <span className="font-bold">Импортировано {importResult.imported} записей</span>
                </div>
                {importResult.errors.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="text-yellow-500" size={20} />
                      <span className="font-bold">Ошибки ({importResult.errors.length})</span>
                    </div>
                    <ul className="space-y-1">
                      {importResult.errors.map((error, i) => (
                        <li key={i} className="text-sm text-red-600 dark:text-red-400">
                          • {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
