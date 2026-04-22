import React, { useState, useEffect } from 'react';
import { Building2, Users, Lock, Plus, X, UserPlus, UserMinus, Settings, ChevronRight, ChevronDown } from 'lucide-react';
import { useOrganizations } from '../hooks/useOrganizations';
import { Organization, OrganizationCreate, Vault, VaultCreate } from '../types/Organization';

interface OrganizationsProps {
  isDark?: boolean;
  onClose?: () => void;
}

export const Organizations: React.FC<OrganizationsProps> = ({ isDark = false, onClose }) => {
  const {
    organizations,
    vaults,
    loading,
    error,
    fetchOrganizations,
    createOrganization,
    fetchOrganizationMembers,
    addOrganizationMember,
    removeOrganizationMember,
    fetchVaults,
    createVault,
    fetchVaultAccess,
    grantVaultAccess,
    revokeVaultAccess,
  } = useOrganizations();

  const [activeTab, setActiveTab] = useState<'orgs' | 'vaults'>('orgs');
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showCreateVault, setShowCreateVault] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const [expandedOrgs, setExpandedOrgs] = useState<Set<number>>(new Set());
  const [expandedVaults, setExpandedVaults] = useState<Set<number>>(new Set());

  const [orgData, setOrgData] = useState<OrganizationCreate>({ name: '', description: '' });
  const [vaultData, setVaultData] = useState<VaultCreate>({ name: '', description: '', organization_id: 0 });
  const [members, setMembers] = useState<any[]>([]);
  const [vaultAccess, setVaultAccess] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchOrganizations();
    fetchVaults();
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCreateOrganization = async () => {
    if (!orgData.name.trim()) {
      showMessage('error', 'Название обязательно');
      return;
    }

    const result = await createOrganization(orgData);
    if ('error' in result) {
      showMessage('error', result.error);
    } else {
      showMessage('success', 'Организация создана');
      setShowCreateOrg(false);
      setOrgData({ name: '', description: '' });
    }
  };

  const handleCreateVault = async () => {
    if (!vaultData.name.trim() || !vaultData.organization_id) {
      showMessage('error', 'Название и организация обязательны');
      return;
    }

    const result = await createVault(vaultData);
    if ('error' in result) {
      showMessage('error', result.error);
    } else {
      showMessage('success', 'Сейф создан');
      setShowCreateVault(false);
      setVaultData({ name: '', description: '', organization_id: 0 });
    }
  };

  const handleViewMembers = async (org: Organization) => {
    setSelectedOrg(org);
    const result = await fetchOrganizationMembers(org.id);
    if ('error' in result) {
      showMessage('error', result.error);
    } else {
      setMembers(result);
    }
  };

  const handleViewVaultAccess = async (vault: Vault) => {
    setSelectedVault(vault);
    const result = await fetchVaultAccess(vault.id);
    if ('error' in result) {
      showMessage('error', result.error);
    } else {
      setVaultAccess(result);
    }
  };

  const toggleOrgExpand = (orgId: number) => {
    setExpandedOrgs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orgId)) {
        newSet.delete(orgId);
      } else {
        newSet.add(orgId);
      }
      return newSet;
    });
  };

  const toggleVaultExpand = (vaultId: number) => {
    setExpandedVaults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vaultId)) {
        newSet.delete(vaultId);
      } else {
        newSet.add(vaultId);
      }
      return newSet;
    });
  };

  return (
    <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 ${
      isDark ? 'text-white' : 'text-gray-900'
    }`}>
      <div className={`rounded-3xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border transform animate-scale-in ${
        isDark
          ? 'bg-slate-800/95 backdrop-blur-xl border-slate-700/50'
          : 'bg-white/95 backdrop-blur-xl border-gray-200/50'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r ${
            isDark ? 'from-gray-100 to-blue-400' : 'from-gray-900 to-blue-800'
          }`}>
            Организации и команды
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

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('orgs')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'orgs'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : isDark
                  ? 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Building2 size={18} className="inline mr-2" />
            Организации
          </button>
          <button
            onClick={() => setActiveTab('vaults')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'vaults'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : isDark
                  ? 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Lock size={18} className="inline mr-2" />
            Сейфы
          </button>
        </div>

        {/* Organizations Tab */}
        {activeTab === 'orgs' && (
          <div className="space-y-4">
            <button
              onClick={() => setShowCreateOrg(true)}
              className={`w-full px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                isDark
                  ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Plus size={18} />
              Создать организацию
            </button>

            {organizations.length === 0 && (
              <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Building2 size={48} className="mx-auto mb-4 opacity-50" />
                <p>Организации не созданы</p>
              </div>
            )}

            {organizations.map((org) => (
              <div key={org.id} className={`p-4 rounded-xl border ${
                isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleOrgExpand(org.id)} className="transition-transform">
                      {expandedOrgs.has(org.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                    <Building2 className={isDark ? 'text-blue-400' : 'text-blue-600'} size={24} />
                    <div>
                      <h3 className="font-bold">{org.name}</h3>
                      {org.description && <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{org.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewMembers(org)}
                      className={`p-2 rounded-lg transition-all ${
                        isDark ? 'bg-slate-600 hover:bg-slate-500' : 'bg-white hover:bg-gray-100'
                      }`}
                      title="Члены"
                    >
                      <Users size={16} />
                    </button>
                  </div>
                </div>

                {expandedOrgs.has(org.id) && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600">
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <p>ID: {org.id}</p>
                      <p>Владелец: {org.owner_id}</p>
                      <p>Создана: {new Date(org.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Members Modal */}
            {selectedOrg && (
              <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-60 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <div className={`rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border ${
                  isDark
                    ? 'bg-slate-800/95 backdrop-blur-xl border-slate-700/50'
                    : 'bg-white/95 backdrop-blur-xl border-gray-200/50'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Члены: {selectedOrg.name}</h3>
                    <button onClick={() => { setSelectedOrg(null); setMembers([]); }} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
                      <X size={20} />
                    </button>
                  </div>
                  {members.length === 0 ? (
                    <p className={`text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Нет членов</p>
                  ) : (
                    <div className="space-y-2">
                      {members.map((member) => (
                        <div key={member.id} className={`flex items-center justify-between p-3 rounded-lg ${
                          isDark ? 'bg-slate-700/50' : 'bg-gray-50'
                        }`}>
                          <div>
                            <p className="font-medium">{member.username}</p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{member.role}</p>
                          </div>
                          <button
                            onClick={() => removeOrganizationMember(selectedOrg.id, member.id)}
                            className={`p-2 rounded-lg text-red-500 hover:bg-red-500/10`}
                            title="Удалить"
                          >
                            <UserMinus size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Create Org Modal */}
            {showCreateOrg && (
              <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-60 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <div className={`rounded-3xl p-6 w-full max-w-lg shadow-2xl border ${
                  isDark
                    ? 'bg-slate-800/95 backdrop-blur-xl border-slate-700/50'
                    : 'bg-white/95 backdrop-blur-xl border-gray-200/50'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Создать организацию</h3>
                    <button onClick={() => setShowCreateOrg(false)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
                      <X size={20} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Название</label>
                      <input
                        type="text"
                        value={orgData.name}
                        onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border ${
                          isDark
                            ? 'border-slate-600 bg-slate-700/80 text-white'
                            : 'border-gray-200 bg-white/80'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Описание</label>
                      <textarea
                        value={orgData.description || ''}
                        onChange={(e) => setOrgData({ ...orgData, description: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border resize-none ${
                          isDark
                            ? 'border-slate-600 bg-slate-700/80 text-white'
                            : 'border-gray-200 bg-white/80'
                        }`}
                        rows={3}
                      />
                    </div>
                    <button
                      onClick={handleCreateOrganization}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50"
                    >
                      {loading ? 'Создание...' : 'Создать'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vaults Tab */}
        {activeTab === 'vaults' && (
          <div className="space-y-4">
            <button
              onClick={() => setShowCreateVault(true)}
              className={`w-full px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                isDark
                  ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Plus size={18} />
              Создать сейф
            </button>

            {vaults.length === 0 && (
              <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Lock size={48} className="mx-auto mb-4 opacity-50" />
                <p>Сейфы не созданы</p>
              </div>
            )}

            {vaults.map((vault) => (
              <div key={vault.id} className={`p-4 rounded-xl border ${
                isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleVaultExpand(vault.id)} className="transition-transform">
                      {expandedVaults.has(vault.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                    <Lock className={isDark ? 'text-purple-400' : 'text-purple-600'} size={24} />
                    <div>
                      <h3 className="font-bold">{vault.name}</h3>
                      {vault.description && <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{vault.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewVaultAccess(vault)}
                      className={`p-2 rounded-lg transition-all ${
                        isDark ? 'bg-slate-600 hover:bg-slate-500' : 'bg-white hover:bg-gray-100'
                      }`}
                      title="Доступ"
                    >
                      <Users size={16} />
                    </button>
                  </div>
                </div>

                {expandedVaults.has(vault.id) && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600">
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <p>ID: {vault.id}</p>
                      <p>Организация: {vault.organization_id}</p>
                      <p>Создан: {new Date(vault.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Vault Access Modal */}
            {selectedVault && (
              <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-60 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <div className={`rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border ${
                  isDark
                    ? 'bg-slate-800/95 backdrop-blur-xl border-slate-700/50'
                    : 'bg-white/95 backdrop-blur-xl border-gray-200/50'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Доступ к: {selectedVault.name}</h3>
                    <button onClick={() => { setSelectedVault(null); setVaultAccess([]); }} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
                      <X size={20} />
                    </button>
                  </div>
                  {vaultAccess.length === 0 ? (
                    <p className={`text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Нет доступа</p>
                  ) : (
                    <div className="space-y-2">
                      {vaultAccess.map((access) => (
                        <div key={access.id} className={`flex items-center justify-between p-3 rounded-lg ${
                          isDark ? 'bg-slate-700/50' : 'bg-gray-50'
                        }`}>
                          <div>
                            <p className="font-medium">{access.username}</p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{access.permission}</p>
                          </div>
                          <button
                            onClick={() => revokeVaultAccess(selectedVault.id, access.id)}
                            className={`p-2 rounded-lg text-red-500 hover:bg-red-500/10`}
                            title="Отозвать"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Create Vault Modal */}
            {showCreateVault && (
              <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-60 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <div className={`rounded-3xl p-6 w-full max-w-lg shadow-2xl border ${
                  isDark
                    ? 'bg-slate-800/95 backdrop-blur-xl border-slate-700/50'
                    : 'bg-white/95 backdrop-blur-xl border-gray-200/50'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Создать сейф</h3>
                    <button onClick={() => setShowCreateVault(false)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
                      <X size={20} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Название</label>
                      <input
                        type="text"
                        value={vaultData.name}
                        onChange={(e) => setVaultData({ ...vaultData, name: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border ${
                          isDark
                            ? 'border-slate-600 bg-slate-700/80 text-white'
                            : 'border-gray-200 bg-white/80'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Организация</label>
                      <select
                        value={vaultData.organization_id}
                        onChange={(e) => setVaultData({ ...vaultData, organization_id: parseInt(e.target.value) })}
                        className={`w-full px-4 py-3 rounded-xl border ${
                          isDark
                            ? 'border-slate-600 bg-slate-700/80 text-white'
                            : 'border-gray-200 bg-white/80'
                        }`}
                      >
                        <option value={0}>Выберите организацию</option>
                        {organizations.map((org) => (
                          <option key={org.id} value={org.id}>{org.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Описание</label>
                      <textarea
                        value={vaultData.description || ''}
                        onChange={(e) => setVaultData({ ...vaultData, description: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border resize-none ${
                          isDark
                            ? 'border-slate-600 bg-slate-700/80 text-white'
                            : 'border-gray-200 bg-white/80'
                        }`}
                        rows={3}
                      />
                    </div>
                    <button
                      onClick={handleCreateVault}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50"
                    >
                      {loading ? 'Создание...' : 'Создать'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
