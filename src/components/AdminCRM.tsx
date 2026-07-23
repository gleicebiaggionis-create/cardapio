import React, { useState, useMemo } from 'react';
import { 
  Users, UserCheck, UserX, Star, DollarSign, Calendar, MessageSquare, 
  MapPin, Clock, ArrowRight, Tag, Mail, Search, Award, RefreshCw, 
  Trash2, Plus, Percent, Play, FileText, CheckCircle, Smartphone 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DatabaseState, Customer, Order, Coupon, AuditLogEntry, AutomationRule } from '../types';

interface AdminCRMProps {
  dbState: DatabaseState;
  onSaveState: (newState: DatabaseState) => Promise<boolean>;
  activeUser: string;
}

export default function AdminCRM({ dbState, onSaveState, activeUser }: AdminCRMProps) {
  const [activeTab, setActiveTab] = useState<'customers' | 'automations' | 'campaigns'>('customers');
  const [crmSearch, setCrmSearch] = useState('');
  const [crmFilter, setCrmFilter] = useState<'all' | 'vip' | 'blocked'>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // New customer creation state
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustCpf, setNewCustCpf] = useState('');
  const [newCustBirthDate, setNewCustBirthDate] = useState('');
  const [newCustOrigin, setNewCustOrigin] = useState('Cardápio Digital');

  // Load automation rules from state, or fallback to defaults
  const automations: AutomationRule[] = dbState.automations || [
    { id: 'auto-1', trigger: 'birthday', actionType: 'send_coupon', actionValue: 'NIVER10', isEnabled: true },
    { id: 'auto-2', trigger: 'idle_30_days', actionType: 'send_promotion', actionValue: 'Sentimos sua falta! Use o cupom VOLTEJA e ganhe frete grátis.', isEnabled: true },
    { id: 'auto-3', trigger: 'vip_spend_500', actionType: 'make_vip', actionValue: 'VIP Auto-Upgrade', isEnabled: true },
    { id: 'auto-4', trigger: 'order_canceled', actionType: 'create_task', actionValue: 'Entrar em contato com o cliente para entender o cancelamento.', isEnabled: true }
  ];

  const customers: Customer[] = dbState.customers || [];
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Filter customers list
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(crmSearch.toLowerCase()) || 
                            c.phone.includes(crmSearch) || 
                            (c.email && c.email.toLowerCase().includes(crmSearch.toLowerCase())) ||
                            (c.cpf && c.cpf.includes(crmSearch));
      const matchesFilter = crmFilter === 'all' || 
                            (crmFilter === 'vip' && c.isVip) || 
                            (crmFilter === 'blocked' && c.isBlocked);
      return matchesSearch && matchesFilter;
    });
  }, [customers, crmSearch, crmFilter]);

  // Calculate profiling metrics for the selected customer
  const customerProfile = useMemo(() => {
    if (!selectedCustomer) return null;

    // Get all orders from this phone number
    const custOrders = dbState.orders.filter(o => o.customerPhone === selectedCustomer.phone);
    const completedOrders = custOrders.filter(o => o.status === 'delivered');

    // Totals
    const totalSpent = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const ordersCount = completedOrders.length;
    const ticketMedio = ordersCount > 0 ? totalSpent / ordersCount : 0;

    // Favorite Product & Category
    const productsMap: Record<string, number> = {};
    const categoriesMap: Record<string, number> = {};
    const paymentMethodsMap: Record<string, number> = {};
    const hoursMap: Record<number, number> = {};

    completedOrders.forEach(o => {
      o.items.forEach(item => {
        productsMap[item.name] = (productsMap[item.name] || 0) + item.quantity;
      });

      // Simple heuristic for payment methods
      paymentMethodsMap[o.paymentMethod] = (paymentMethodsMap[o.paymentMethod] || 0) + 1;

      // Extract purchase hour
      const oDate = new Date(o.createdAt);
      const hr = oDate.getHours();
      hoursMap[hr] = (hoursMap[hr] || 0) + 1;
    });

    let favProduct = 'Nenhum pedido';
    let maxProd = 0;
    Object.entries(productsMap).forEach(([p, count]) => {
      if (count > maxProd) {
        favProduct = p;
        maxProd = count;
      }
    });

    let favPayment = 'Nenhum pedido';
    let maxPay = 0;
    Object.entries(paymentMethodsMap).forEach(([pay, count]) => {
      if (count > maxPay) {
        favPayment = pay === 'pix' ? 'PIX ⚡' : pay === 'credit' ? 'Cartão de Crédito 💳' : 'Dinheiro 💵';
        maxPay = count;
      }
    });

    // Idle days calculation
    let idleDays = 0;
    if (selectedCustomer.lastOrderDate) {
      const lastDate = new Date(selectedCustomer.lastOrderDate);
      const diffMs = Date.now() - lastDate.getTime();
      idleDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }

    // Interactive timeline events
    const timeline = selectedCustomer.timeline || [
      { id: 't-1', type: 'register', title: 'Conta Cadastrada', description: `Cliente cadastrado via ${selectedCustomer.origin || 'Cardápio Digital'}`, date: selectedCustomer.lastOrderDate || new Date().toISOString() }
    ];

    return {
      custOrders,
      completedOrders,
      totalSpent,
      ordersCount,
      ticketMedio,
      favProduct,
      favPayment,
      idleDays,
      timeline
    };
  }, [selectedCustomer, dbState.orders]);

  // Handle VIP & Block status changes
  const handleToggleVip = async (cust: Customer) => {
    const updated = customers.map(c => {
      if (c.id === cust.id) {
        const wasVip = c.isVip;
        const newVip = !wasVip;
        
        // Add timeline event
        const timeline = c.timeline || [];
        timeline.push({
          id: `t-${Date.now()}`,
          type: 'vip_upgrade',
          title: newVip ? 'Promovido a VIP ⭐' : 'Removido do Status VIP',
          description: newVip ? 'Cliente alcançou requisitos e virou VIP!' : 'Administrador alterou status VIP',
          date: new Date().toISOString()
        });

        return { ...c, isVip: newVip, timeline };
      }
      return c;
    });

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      user: activeUser,
      action: 'CRM_TOGGLE_VIP',
      details: `Alterou status VIP do cliente "${cust.name}"`,
      timestamp: new Date().toISOString(),
      ip: '192.168.1.15',
      browser: navigator.userAgent,
      device: 'Desktop'
    };

    await onSaveState({
      ...dbState,
      customers: updated,
      auditLogs: [newLog, ...(dbState.auditLogs || [])]
    });
  };

  const handleToggleBlock = async (cust: Customer) => {
    const updated = customers.map(c => {
      if (c.id === cust.id) {
        const wasBlocked = c.isBlocked;
        const newBlock = !wasBlocked;

        const timeline = c.timeline || [];
        timeline.push({
          id: `t-${Date.now()}`,
          type: 'blocked_status',
          title: newBlock ? 'Cliente Bloqueado 🚫' : 'Cliente Desbloqueado ✅',
          description: newBlock ? 'O acesso do cliente foi suspenso.' : 'Acesso reestabelecido pelo gestor.',
          date: new Date().toISOString()
        });

        return { ...c, isBlocked: newBlock, timeline };
      }
      return c;
    });

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      user: activeUser,
      action: 'CRM_TOGGLE_BLOCK',
      details: `Alterou status de bloqueio do cliente "${cust.name}" para ${!cust.isBlocked}`,
      timestamp: new Date().toISOString(),
      ip: '192.168.1.15',
      browser: navigator.userAgent,
      device: 'Desktop'
    };

    await onSaveState({
      ...dbState,
      customers: updated,
      auditLogs: [newLog, ...(dbState.auditLogs || [])]
    });
  };

  // Create new customer
  const handleCreateCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) {
      alert('Preencha nome e WhatsApp do cliente.');
      return;
    }

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustName,
      phone: newCustPhone,
      email: newCustEmail || undefined,
      cpf: newCustCpf || undefined,
      birthDate: newCustBirthDate || undefined,
      ordersCount: 0,
      totalSpent: 0,
      isVip: false,
      isBlocked: false,
      origin: newCustOrigin,
      tags: [newCustOrigin],
      timeline: [
        {
          id: `t-reg-${Date.now()}`,
          type: 'register',
          title: 'Cadastro Efetuado',
          description: `Cliente registrado manualmente no CRM por ${activeUser}.`,
          date: new Date().toISOString()
        }
      ]
    };

    const updated = [newCust, ...customers];
    
    await onSaveState({
      ...dbState,
      customers: updated,
      auditLogs: [{
        id: `log-${Date.now()}`,
        user: activeUser,
        action: 'CRM_CRIAR_CLIENTE',
        details: `Cadastrou novo cliente no CRM: "${newCustName}"`,
        timestamp: new Date().toISOString(),
        ip: '192.168.1.15',
        browser: navigator.userAgent,
        device: 'Desktop'
      }, ...(dbState.auditLogs || [])]
    });

    setIsCreatingCustomer(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustEmail('');
    setNewCustCpf('');
    setNewCustBirthDate('');
    alert('Cliente cadastrado com sucesso!');
  };

  // Enable/disable automated rules
  const handleToggleAutomation = async (ruleId: string) => {
    const updatedRules = automations.map(a => a.id === ruleId ? { ...a, isEnabled: !a.isEnabled } : a);
    await onSaveState({
      ...dbState,
      automations: updatedRules
    });
  };

  return (
    <div className="space-y-8" id="admin-crm-panel">
      {/* Title Header */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="text-emerald-400" size={24} />
            <h2 className="text-xl font-bold tracking-tight">CRM e Automações de Marketing</h2>
          </div>
          <p className="text-slate-400 text-xs font-medium">
            Gerencie perfis, analise o ticket médio, veja gráficos de consumo, configure cashback e configure regras automáticas de reengajamento de clientes.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-px">
        {[
          { id: 'customers', label: '👤 Cadastro Inteligente & Perfis', icon: Users },
          { id: 'automations', label: '⚙️ Automações Inteligentes', icon: RefreshCw },
          { id: 'campaigns', label: '📢 Campanhas & Notificações', icon: Play }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSelectedCustomerId(null);
              }}
              className={`px-4 py-2.5 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-600 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'customers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-xs">
          {/* Customers List Col */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Users size={16} className="text-emerald-600" /> Lista de Clientes ({filteredCustomers.length})
              </h3>
              
              <button
                onClick={() => setIsCreatingCustomer(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus size={12} /> Cadastrar
              </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  value={crmSearch}
                  onChange={(e) => setCrmSearch(e.target.value)}
                  placeholder="Buscar por nome, WhatsApp ou CPF..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                />
              </div>

              <select
                value={crmFilter}
                onChange={(e) => setCrmFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="all">Todos os Status</option>
                <option value="vip">Apenas VIP ⭐</option>
                <option value="blocked">Apenas Bloqueados 🚫</option>
              </select>
            </div>

            {/* Customers list scroll area */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-[460px] overflow-y-auto scrollbar-thin">
              {filteredCustomers.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-semibold">
                  Nenhum cliente cadastrado correspondendo aos filtros.
                </div>
              ) : (
                filteredCustomers.map(cust => (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedCustomerId(cust.id)}
                    className={`p-4 hover:bg-slate-50/50 transition-colors cursor-pointer flex items-center justify-between gap-4 ${
                      selectedCustomerId === cust.id ? 'bg-emerald-50/20 border-l-4 border-emerald-600' : ''
                    }`}
                  >
                    <div className="space-y-1 truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-800 text-[13px]">{cust.name}</span>
                        {cust.isVip && <span className="text-amber-500" title="Cliente VIP">⭐</span>}
                        {cust.isBlocked && <span className="text-rose-500" title="Bloqueado">🚫</span>}
                      </div>
                      <p className="text-slate-500 font-mono text-[11px]">{cust.phone}</p>
                      
                      <div className="flex flex-wrap gap-1 mt-1">
                        {cust.tags.map(t => (
                          <span key={t} className="bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded-md text-[9px]">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <p className="font-black text-slate-900">R$ {cust.totalSpent.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{cust.ordersCount} pedidos</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Customer Advanced Profile & Timeline & Charts Col */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            {!selectedCustomer ? (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-2">
                <Users size={32} className="text-slate-300" />
                <p className="font-bold">Nenhum Cliente Selecionado</p>
                <p className="text-xs text-slate-400">Selecione um cliente na lista lateral para visualizar suas métricas de fidelidade, timeline e emitir cupons ou realizar bloqueios.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Profile Header Card */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 font-black flex items-center justify-center text-lg shadow-inner">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-black text-slate-800 text-[15px] flex items-center gap-1.5">
                        {selectedCustomer.name}
                        {selectedCustomer.isVip && <span className="bg-amber-100 text-amber-800 font-black text-[9px] uppercase px-1.5 py-0.5 rounded-md border border-amber-200">VIP</span>}
                      </h4>
                      <p className="text-slate-500 font-semibold">{selectedCustomer.email || 'Sem e-mail cadastrado'}</p>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleVip(selectedCustomer)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-1 ${
                        selectedCustomer.isVip
                          ? 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Award size={12} />
                      {selectedCustomer.isVip ? 'Remover VIP' : 'Tornar VIP'}
                    </button>

                    <button
                      onClick={() => handleToggleBlock(selectedCustomer)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-1 ${
                        selectedCustomer.isBlocked
                          ? 'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <UserX size={12} />
                      {selectedCustomer.isBlocked ? 'Desbloquear' : 'Bloquear'}
                    </button>
                  </div>
                </div>

                {/* Profiling metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-emerald-50/20 border border-emerald-100/40 rounded-xl space-y-1 text-center">
                    <p className="text-[10px] text-emerald-800 font-black tracking-wider uppercase">Gasto Total</p>
                    <p className="font-extrabold text-[15px] text-slate-900">R$ {customerProfile?.totalSpent.toFixed(2)}</p>
                  </div>

                  <div className="p-3 bg-amber-50/20 border border-amber-100/40 rounded-xl space-y-1 text-center">
                    <p className="text-[10px] text-amber-800 font-black tracking-wider uppercase">Ticket Médio</p>
                    <p className="font-extrabold text-[15px] text-slate-900 font-mono">R$ {customerProfile?.ticketMedio.toFixed(2)}</p>
                  </div>

                  <div className="p-3 bg-teal-50/20 border border-teal-100/40 rounded-xl space-y-1 text-center">
                    <p className="text-[10px] text-teal-800 font-black tracking-wider uppercase">Prato Favorito</p>
                    <p className="font-bold text-[11px] text-slate-700 truncate" title={customerProfile?.favProduct}>{customerProfile?.favProduct}</p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-center">
                    <p className="text-[10px] text-slate-500 font-black tracking-wider uppercase">Tempo Inativo</p>
                    <p className="font-extrabold text-[15px] text-slate-900">{customerProfile?.idleDays} dias</p>
                  </div>
                </div>

                {/* Profiling charts with dynamic SVG graphics */}
                <div className="space-y-2">
                  <p className="font-black text-slate-700 uppercase tracking-wider text-[11px]">Gráfico de Consumo Mensal</p>
                  
                  <div className="h-28 bg-slate-50 border border-slate-100 rounded-2xl flex items-end justify-between p-4 relative overflow-hidden">
                    {/* SVG grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between py-4 pointer-events-none opacity-20">
                      <div className="border-b border-slate-300 w-full"></div>
                      <div className="border-b border-slate-300 w-full"></div>
                      <div className="border-b border-slate-300 w-full"></div>
                    </div>

                    {customerProfile && customerProfile.custOrders.length === 0 ? (
                      <p className="absolute inset-0 flex items-center justify-center text-slate-400">Sem histórico disponível</p>
                    ) : (
                      customerProfile?.custOrders.slice(-6).map((o, idx) => {
                        const h = Math.min(80, Math.max(15, (o.total / 100) * 80));
                        return (
                          <div key={o.id} className="flex flex-col items-center gap-1.5 z-10">
                            <div 
                              className="w-8 bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all relative group"
                              style={{ height: `${h}px` }}
                            >
                              {/* tooltip */}
                              <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                R$ {o.total.toFixed(2)}
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono">#{o.code || idx+1}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Vertical Chronological Timeline */}
                <div className="space-y-4">
                  <p className="font-black text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1">
                    <Clock size={12} className="text-slate-400" /> Linha do Tempo do Cliente
                  </p>

                  <div className="relative border-l border-slate-200 pl-4 ml-2.5 space-y-4">
                    {customerProfile?.timeline.map((item, idx) => (
                      <div key={item.id} className="relative">
                        {/* Bullet point icon */}
                        <span className={`absolute -left-[23px] top-0.5 w-3 h-3 rounded-full border-2 border-white ring-2 ring-emerald-100 ${
                          item.type === 'order' 
                            ? 'bg-green-500' 
                            : item.type === 'vip_upgrade' 
                            ? 'bg-amber-500' 
                            : item.type === 'blocked_status' 
                            ? 'bg-rose-500' 
                            : 'bg-emerald-500'
                        }`} />

                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-extrabold text-slate-800 text-[12px]">{item.title}</p>
                            <span className="text-[10px] text-slate-400 font-bold">{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <p className="text-slate-500 leading-normal text-[11px]">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'automations' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 text-xs">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <RefreshCw size={16} className="text-emerald-600" /> Automações Inteligentes do Sistema
            </h3>
            <p className="text-slate-500">Defina regras que disparam ações automáticas quando as condições de comportamento de clientes forem atingidas.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {automations.map((rule) => (
              <div 
                key={rule.id} 
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  rule.isEnabled 
                    ? 'border-emerald-100 bg-emerald-50/10' 
                    : 'border-slate-100 bg-slate-50/50 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="bg-slate-950 text-white font-black text-[9px] uppercase px-2 py-0.5 rounded-md tracking-wider">
                    Gatilho: {rule.trigger === 'birthday' && '🎂 Aniversário do Cliente'}
                    {rule.trigger === 'idle_30_days' && '⏳ Cliente 30 dias Inativo'}
                    {rule.trigger === 'vip_spend_500' && '⭐ Gasto Maior R$ 500'}
                    {rule.trigger === 'order_canceled' && '❌ Pedido Cancelado'}
                  </span>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={rule.isEnabled} 
                      onChange={() => handleToggleAutomation(rule.id)}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="space-y-1.5">
                  <p className="font-bold text-slate-800 text-xs">Ação Executada:</p>
                  <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100/80 font-medium">
                    {rule.actionType === 'send_coupon' && `🎁 Gerar e enviar cupom automático: "${rule.actionValue}"`}
                    {rule.actionType === 'send_promotion' && `💬 Disparar oferta de resgate: "${rule.actionValue}"`}
                    {rule.actionType === 'make_vip' && `👑 Promover automaticamente a categoria VIP ⭐`}
                    {rule.actionType === 'create_task' && `📋 Criar tarefa no CRM: "${rule.actionValue}"`}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-2 text-blue-700 leading-normal font-semibold">
            <span>ℹ️</span>
            <span>As automações são reavaliadas automaticamente a cada finalização ou cancelamento de pedido, garantindo que o banco de dados dos clientes se mantenha atualizado e responsivo de forma completamente automatizada.</span>
          </div>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 text-xs">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Play size={16} className="text-emerald-600" /> Disparador de Campanhas e Notificações (E-mail & WhatsApp)
            </h3>
            <p className="text-slate-500">Crie listas de e-mails ou números de WhatsApp de forma dinâmica baseada no engajamento dos seus clientes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Setup template */}
            <div className="space-y-4">
              <p className="font-black text-emerald-900 text-xs uppercase tracking-wider border-b pb-1">Compor Mensagem</p>
              
              <div className="space-y-1">
                <label className="block font-bold text-slate-600">CANAL DE DISPARO</label>
                <select className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none">
                  <option value="whatsapp">💬 WhatsApp Oficial (API ou Web)</option>
                  <option value="email">✉️ E-mail Marketing (SMTP)</option>
                  <option value="push">📱 Push Notification do Celular</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600">PÚBLICO-ALVO</label>
                <select className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none">
                  <option value="all">Todos os Clientes ({customers.length})</option>
                  <option value="vip">Apenas Clientes VIP ({customers.filter(c => c.isVip).length})</option>
                  <option value="inactive">Clientes Inativos +30 dias ({customers.filter(c => c.ordersCount > 0).length})</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600">TEXTO DA MENSAGEM / CUPOM</label>
                <textarea
                  rows={4}
                  placeholder="Olá {nome}, preparamos algo incrível para você..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                onClick={() => alert('Campanha de marketing enfileirada para envio! Os clientes receberão as notificações gradativamente.')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                🚀 Iniciar Disparo de Campanha
              </button>
            </div>

            {/* Simulated Live status */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
              <p className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Smartphone size={14} className="text-emerald-600" /> Visualização no Celular do Cliente
              </p>

              <div className="w-full max-w-[240px] mx-auto bg-slate-900 p-3.5 rounded-[32px] border-4 border-slate-850 shadow-md aspect-[9/16] relative flex flex-col justify-between">
                {/* Speaker indicator */}
                <div className="w-16 h-3 bg-slate-800 rounded-full mx-auto mb-2"></div>
                
                {/* Notification Bubble */}
                <div className="bg-white/95 p-3 rounded-2xl shadow-xs space-y-1 border border-slate-100 text-[9px] mt-2">
                  <div className="flex items-center justify-between border-b pb-1 text-slate-400 font-bold uppercase text-[7px]">
                    <span>💬 WhatsApp</span>
                    <span>agora</span>
                  </div>
                  <p className="font-bold text-slate-800">Sua Hamburgueria 🍔</p>
                  <p className="text-slate-500 leading-normal">Olá! Preparamos um presente especial para sua próxima compra: Use o cupom VIP10...</p>
                </div>

                <div className="w-16 h-1 bg-white/40 rounded-full mx-auto mt-auto"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer manual registry modal */}
      <AnimatePresence>
        {isCreatingCustomer && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-md border border-slate-200 text-slate-800 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="font-black text-sm text-slate-900">✏️ Cadastrar Cliente Manualmente</h4>
                <button onClick={() => setIsCreatingCustomer(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer">
                  X
                </button>
              </div>

              <form onSubmit={handleCreateCustomerSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">NOME DO CLIENTE *</label>
                  <input
                    type="text"
                    required
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    placeholder="EX: João Silva"
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">WHATSAPP (NÚMERO) *</label>
                  <input
                    type="text"
                    required
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="EX: 5511999999999"
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">E-MAIL</label>
                  <input
                    type="email"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    placeholder="EX: joao@gmail.com"
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-600">CPF</label>
                    <input
                      type="text"
                      value={newCustCpf}
                      onChange={(e) => setNewCustCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-600">DATA NASCIMENTO</label>
                    <input
                      type="date"
                      value={newCustBirthDate}
                      onChange={(e) => setNewCustBirthDate(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t text-xs">
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl transition-all cursor-pointer"
                  >
                    Salvar Cadastro
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingCustomer(false)}
                    className="w-full bg-slate-100 text-slate-600 font-bold py-2 rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
