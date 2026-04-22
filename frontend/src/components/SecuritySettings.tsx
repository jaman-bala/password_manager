import React, { useState, useEffect } from 'react';
import { Shield, Lock, Key, AlertTriangle, CheckCircle, X, Copy, Download, Eye, EyeOff } from 'lucide-react';
import { useSecurity } from '../hooks/useSecurity';
import { useAuth } from '../hooks/useAuth';

interface SecuritySettingsProps {
  isDark?: boolean;
  onClose?: () => void;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({ isDark = false, onClose }) => {
  const { user } = useAuth();
  const {
    loading,
    setupMasterPassword,
    setupTwoFactor,
    enableTwoFactor,
    disableTwoFactor,
    getTwoFactorStatus,
  } = useSecurity();

  const [activeTab, setActiveTab] = useState<'master' | '2fa'>('master');
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmMasterPassword, setConfirmMasterPassword] = useState('');
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorQr, setTwoFactorQr] = useState<string | null>(null);
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [masterPasswordEnabled, setMasterPasswordEnabled] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSecurityStatus();
  }, []);

  const loadSecurityStatus = async () => {
    const status = await getTwoFactorStatus();
    setTwoFactorEnabled(status.enabled);
    setMasterPasswordEnabled(user?.master_password_enabled || false);
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSetupMasterPassword = async () => {
    if (masterPassword.length < 8) {
      showMessage('error', 'Мастер-пароль должен быть минимум 8 символов');
      return;
    }
    if (masterPassword !== confirmMasterPassword) {
      showMessage('error', 'Пароли не совпадают');
      return;
    }

    const result = await setupMasterPassword({
      master_password: masterPassword,
      confirm_password: confirmMasterPassword,
    });

    if (result.success) {
      showMessage('success', 'Мастер-пароль установлен. Все пароли зашифрованы.');
      setMasterPasswordEnabled(true);
      setMasterPassword('');
      setConfirmMasterPassword('');
    } else {
      showMessage('error', result.error || 'Ошибка');
    }
  };

  const handleSetupTwoFactor = async () => {
    const result = await setupTwoFactor();
    if ('error' in result) {
      showMessage('error', result.error);
    } else {
      setTwoFactorQr(result.qr_code);
      setTwoFactorSecret(result.secret);
    }
  };

  const handleEnableTwoFactor = async () => {
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      showMessage('error', 'Введите 6-значный код');
      return;
    }

    const result = await enableTwoFactor({ code: twoFactorCode });
    if ('error' in result) {
      showMessage('error', result.error);
    } else {
      showMessage('success', '2FA включена. Сохраните резервные коды!');
      setBackupCodes(result.backup_codes);
      setTwoFactorEnabled(true);
      setTwoFactorQr(null);
      setTwoFactorSecret(null);
      setTwoFactorCode('');
    }
  };

  const handleDisableTwoFactor = async () => {
    if (!twoFactorCode) {
      showMessage('error', 'Введите код для отключения');
      return;
    }

    const result = await disableTwoFactor({ code: twoFactorCode });
    if (result.success) {
      showMessage('success', '2FA отключена');
      setTwoFactorEnabled(false);
      setTwoFactorCode('');
    } else {
      showMessage('error', result.error || 'Ошибка');
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    showMessage('success', 'Коды скопированы');
  };

  const downloadBackupCodes = () => {
    const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
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
            Настройки безопасности
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
            onClick={() => setActiveTab('master')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'master'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : isDark
                  ? 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Lock size={18} className="inline mr-2" />
            Мастер-пароль
          </button>
          <button
            onClick={() => setActiveTab('2fa')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === '2fa'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : isDark
                  ? 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Key size={18} className="inline mr-2" />
            2FA
          </button>
        </div>

        {/* Master Password Tab */}
        {activeTab === 'master' && (
          <div className="space-y-6">
            {masterPasswordEnabled ? (
              <div className={`p-6 rounded-2xl ${
                isDark ? 'bg-green-500/10 border border-green-500/30' : 'bg-green-50 border border-green-200'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="text-green-500" size={24} />
                  <span className="font-bold text-green-600 dark:text-green-400">Мастер-пароль установлен</span>
                </div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Все ваши пароли зашифрованы с помощью мастер-пароля.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-bold mb-2 uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Мастер-пароль
                  </label>
                  <div className="relative">
                    <input
                      type={showMasterPassword ? 'text' : 'password'}
                      value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12 ${
                        isDark
                          ? 'border-slate-600 bg-slate-700/80 text-white placeholder-slate-400'
                          : 'border-gray-200 bg-white/80'
                      }`}
                      placeholder="Минимум 8 символов"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMasterPassword(!showMasterPassword)}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-all ${
                        isDark ? 'text-slate-400 hover:text-blue-400' : 'text-gray-400 hover:text-blue-600'
                      }`}
                    >
                      {showMasterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-bold mb-2 uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Подтвердите мастер-пароль
                  </label>
                  <input
                    type="password"
                    value={confirmMasterPassword}
                    onChange={(e) => setConfirmMasterPassword(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDark
                        ? 'border-slate-600 bg-slate-700/80 text-white placeholder-slate-400'
                        : 'border-gray-200 bg-white/80'
                    }`}
                    placeholder="Повторите пароль"
                  />
                </div>
                <button
                  onClick={handleSetupMasterPassword}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-3 font-bold shadow-lg disabled:opacity-50"
                >
                  <Shield size={20} />
                  Установить мастер-пароль
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2FA Tab */}
        {activeTab === '2fa' && (
          <div className="space-y-6">
            {twoFactorEnabled ? (
              <div className="space-y-4">
                <div className={`p-6 rounded-2xl ${
                  isDark ? 'bg-green-500/10 border border-green-500/30' : 'bg-green-50 border border-green-200'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="text-green-500" size={24} />
                    <span className="font-bold text-green-600 dark:text-green-400">2FA включена</span>
                  </div>
                </div>

                {backupCodes.length > 0 && (
                  <div className={`p-6 rounded-2xl ${
                    isDark ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="text-yellow-500" size={20} />
                        <span className="font-bold text-yellow-600 dark:text-yellow-400">Резервные коды</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={copyBackupCodes}
                          className={`p-2 rounded-lg transition-all ${
                            isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                          title="Копировать"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={downloadBackupCodes}
                          className={`p-2 rounded-lg transition-all ${
                            isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                          title="Скачать"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                    {showBackupCodes ? (
                      <div className="grid grid-cols-2 gap-2">
                        {backupCodes.map((code, i) => (
                          <code key={i} className={`p-2 rounded text-center font-mono text-sm ${
                            isDark ? 'bg-slate-800' : 'bg-white'
                          }`}>
                            {code}
                          </code>
                        ))}
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowBackupCodes(true)}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        Показать коды
                      </button>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-bold mb-2 uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      Код для отключения 2FA
                    </label>
                    <input
                      type="text"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      maxLength={6}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-2xl tracking-widest ${
                        isDark
                          ? 'border-slate-600 bg-slate-700/80 text-white placeholder-slate-400'
                          : 'border-gray-200 bg-white/80'
                      }`}
                      placeholder="000000"
                    />
                  </div>
                  <button
                    onClick={handleDisableTwoFactor}
                    disabled={loading}
                    className="w-full bg-red-600 text-white px-6 py-4 rounded-xl hover:bg-red-700 transition-all duration-300 flex items-center justify-center gap-3 font-bold shadow-lg disabled:opacity-50"
                  >
                    <X size={20} />
                    Отключить 2FA
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {!twoFactorQr ? (
                  <div className="text-center space-y-4">
                    <Shield className={`mx-auto ${isDark ? 'text-blue-400' : 'text-blue-600'}`} size={64} />
                    <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Двухфакторная аутентификация добавляет дополнительный уровень защиты вашему аккаунту.
                    </p>
                    <button
                      onClick={handleSetupTwoFactor}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-3 font-bold shadow-lg disabled:opacity-50"
                    >
                      <Key size={20} />
                      Настроить 2FA
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center">
                      <img src={twoFactorQr} alt="QR Code" className="mx-auto mb-4 rounded-xl" />
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Отсканируйте QR код в Google Authenticator или другом приложении 2FA
                      </p>
                    </div>
                    <div>
                      <label className={`block text-sm font-bold mb-2 uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        Или введите код вручную
                      </label>
                      <code className={`block p-3 rounded-xl text-center font-mono text-sm break-all ${
                        isDark ? 'bg-slate-700' : 'bg-gray-100'
                      }`}>
                        {twoFactorSecret}
                      </code>
                    </div>
                    <div>
                      <label className={`block text-sm font-bold mb-2 uppercase tracking-wider ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        Код из приложения
                      </label>
                      <input
                        type="text"
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value)}
                        maxLength={6}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-2xl tracking-widest ${
                          isDark
                            ? 'border-slate-600 bg-slate-700/80 text-white placeholder-slate-400'
                            : 'border-gray-200 bg-white/80'
                        }`}
                        placeholder="000000"
                      />
                    </div>
                    <button
                      onClick={handleEnableTwoFactor}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-3 font-bold shadow-lg disabled:opacity-50"
                    >
                      <CheckCircle size={20} />
                      Включить 2FA
                    </button>
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
