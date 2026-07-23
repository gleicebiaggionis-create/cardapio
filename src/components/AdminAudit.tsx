import React, { useState } from 'react';
import { Shield, Eye, Lock, RefreshCw, Smartphone, Monitor, Globe, FileText, Search } from 'lucide-react';
import { DatabaseState, AuditLogEntry } from '../types';

interface AdminAuditProps {
  dbState: DatabaseState;
  onSaveState: (newState: DatabaseState) => Promise<boolean>;
  activeUser: string;
}

export type UserRole = 'admin' | 'manager' | 'attendant' | 'cashier' | 'kitchen' | 'deliverer';

export default function AdminAudit({ dbState, onSaveState, activeUser }: AdminAuditProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('manager');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const logs: AuditLogEntry[] = dbState.auditLogs || [];

  // Default permissions if not present
  const [permissions, setPermissions] = useState<Record<UserRole, Record<string, 'view' | 'edit' | 'none'>>>({
    admin: {
      cms: 'edit',
      products: 'edit',
      crm: 'edit',
      finance: 'edit',
      stock: 'edit',
      delivery: 'edit',
      settings: 'edit',
      audit: 'edit'
    },
    manager: {
      cms: 'view',
      products: 'edit',
      crm: 'edit',
      finance: 'edit',
      stock: 'edit',
      delivery: 'edit',
      settings: 'view',
      audit: 'view'
    },
    attendant: {
      cms: 'none',
      products: 'view',
      crm: 'view',
      finance: 'none',
      stock: 'none',
      delivery: 'edit',
      settings: 'none',
      audit: 'none'
    },
    cashier: {
      cms: 'none',
      products: 'view',
      crm: 'view',
      finance: 'edit',
      stock: 'none',
      delivery: 'view',
      settings: 'none',
      audit: 'none'
    },
    kitchen: {
      cms: 'none',
      products: 'view',
      crm: 'none',
      finance: 'none',
      stock: 'view',
      delivery: 'none',
      settings: 'none',
      audit: 'none'
    },
    deliverer: {
      cms: 'none',
      products: 'none',
      crm: 'none',
      finance: 'none',
      stock: 'none',
      delivery: 'view',
      settings: 'none',
      audit: 'none'
    }
  });

  const handlePermissionChange = async (role: UserRole, module: string, level: 'view' | 'edit' | 'none') => {
    if (role === 'admin') return; // Admin is always edit
    const updated = {
      ...permissions,
      [role]: {
        ...permissions[role],
        [module]: level
      }
    };
    setPermissions(updated);
    
    // Add audit log
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      user: activeUser,
      action: 'ALTERACAO_PERMISSOES',
      details: `Alterou permissões do cargo ${role} no módulo ${module} para ${level}`,
      timestamp: new Date().toISOString(),
      ip: '192.168.1.15',
      browser: navigator.userAgent,
      device: window.innerWidth < 768 ? 'Mobile' : 'Desktop'
    };

    const updatedLogs = [newLog, ...(dbState.auditLogs || [])];
    await onSaveState({
      ...dbState,
      auditLogs: updatedLogs
    });
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.action.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));

  return (
    <div className="space-y-8" id="admin-audit-panel">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="text-emerald-400" size={24} />
            <h2 className="text-xl font-bold tracking-tight">Segurança, Cargos e Auditoria</h2>
          </div>
          <p className="text-slate-400 text-xs">
            Gerencie as permissões de acesso do estabelecimento e audite absolutamente todas as modificações realizadas no sistema.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Role Permission Matrix */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-xs border border-slate-200/80 space-y-6">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Lock size={16} className="text-emerald-600" /> Matriz de Permissões de Acesso
            </h3>
            <p className="text-xs text-slate-500">Selecione um cargo e defina suas permissões em cada módulo do sistema.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(['admin', 'manager', 'attendant', 'cashier', 'kitchen', 'deliverer'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRole(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all uppercase cursor-pointer ${
                  selectedRole === r 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {r === 'admin' && '🔑 Admin'}
                {r === 'manager' && '💼 Gerente'}
                {r === 'attendant' && '📣 Atendente'}
                {r === 'cashier' && '💵 Caixa'}
                {r === 'kitchen' && '🍳 Cozinha'}
                {r === 'deliverer' && '🏍️ Entregador'}
              </button>
            ))}
          </div>

          <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
            {[
              { id: 'cms', name: 'Gestor de Site & Construtor (CMS)' },
              { id: 'products', name: 'Gestor de Cardápio & Produtos' },
              { id: 'crm', name: 'CRM de Clientes & Marketing' },
              { id: 'finance', name: 'ERP Financeiro & Fluxo de Caixa' },
              { id: 'stock', name: 'Gestor de Estoque / Ingredientes' },
              { id: 'delivery', name: 'Gestor de Entregas & Entregadores' },
              { id: 'settings', name: 'Configurações do Sistema' },
              { id: 'audit', name: 'Logs de Auditoria & Segurança' }
            ].map((mod) => {
              const currentLvl = permissions[selectedRole]?.[mod.id] || 'none';
              return (
                <div key={mod.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50/30">
                  <span className="font-bold text-slate-700">{mod.name}</span>
                  <div className="flex items-center gap-1">
                    {[
                      { val: 'none', label: 'Nenhum', color: 'hover:bg-rose-100 hover:text-rose-700' },
                      { val: 'view', label: 'Apenas Ver', color: 'hover:bg-amber-100 hover:text-amber-700' },
                      { val: 'edit', label: 'Ver e Editar', color: 'hover:bg-green-100 hover:text-green-700' }
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        disabled={selectedRole === 'admin'}
                        onClick={() => handlePermissionChange(selectedRole, mod.id, opt.val as any)}
                        className={`px-2.5 py-1.2 rounded-lg font-bold transition-all text-[10px] ${
                          currentLvl === opt.val
                            ? currentLvl === 'none'
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : currentLvl === 'view'
                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                              : 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 cursor-pointer disabled:opacity-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl text-[11px] text-blue-700 leading-relaxed font-semibold">
            ℹ️ O cargo de <strong className="font-extrabold uppercase">Administrador</strong> possui acesso irrestrito a todos os módulos e suas permissões não podem ser alteradas por motivos de segurança do sistema.
          </div>
        </div>

        {/* Right: Detailed Audit Log Table */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl shadow-xs border border-slate-200/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <FileText size={16} className="text-emerald-600" /> Livro de Auditoria do Sistema
              </h3>
              <p className="text-xs text-slate-500">Registro em tempo real de absolutamente todas as operações administrativas.</p>
            </div>
            
            <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto">
              Total: {logs.length} Registros
            </span>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por usuário, ação ou detalhe..."
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="all">Todas as Ações</option>
              {uniqueActions.map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>

          {/* Audit Trail List */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <div className="max-h-[460px] overflow-y-auto divide-y divide-slate-100 scrollbar-thin">
              {filteredLogs.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                  Nenhum registro de auditoria encontrado para os filtros selecionados.
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const isMobile = log.device === 'Mobile';
                  return (
                    <div key={log.id} className="p-4 hover:bg-slate-50/50 transition-colors space-y-2.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider ${
                            log.action.includes('EXCLUSAO') || log.action.includes('DELE')
                              ? 'bg-rose-50 text-rose-700 border border-rose-100'
                              : log.action.includes('LOGIN')
                              ? 'bg-green-50 text-green-700 border border-green-100'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            {log.action}
                          </span>
                          <span className="font-bold text-slate-800">{log.user}</span>
                        </div>
                        <span className="text-slate-400 text-[10px] font-semibold">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>

                      <p className="text-slate-600 leading-normal text-[11px] font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100/40">
                        {log.details}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 font-semibold">
                        <span className="flex items-center gap-1">
                          <Globe size={11} className="text-slate-300" /> IP: {log.ip}
                        </span>
                        <span className="flex items-center gap-1 truncate max-w-[180px]">
                          <Globe size={11} className="text-slate-300" /> {log.browser.split(' ')[0] || 'Browser'}
                        </span>
                        <span className="flex items-center gap-1">
                          {isMobile ? <Smartphone size={11} className="text-slate-300" /> : <Monitor size={11} className="text-slate-300" />} {log.device}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
