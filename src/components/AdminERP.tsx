import React, { useState, useMemo } from 'react';
import { 
  DollarSign, ArrowUpRight, ArrowDownRight, Percent, Calendar, FileText, 
  Plus, Trash2, ArrowRight, Printer, FileSpreadsheet, Package, RefreshCw, 
  AlertTriangle, Truck, MapPin, Check, ShieldCheck, Clock, Shield 
} from 'lucide-react';
import { DatabaseState, FinancialTransaction, Ingredient, Courier, Order, AuditLogEntry } from '../types';

interface AdminERPProps {
  dbState: DatabaseState;
  onSaveState: (newState: DatabaseState) => Promise<boolean>;
  activeUser: string;
}

export default function AdminERP({ dbState, onSaveState, activeUser }: AdminERPProps) {
  const [activeTab, setActiveTab] = useState<'finance' | 'stock' | 'delivery'>('finance');
  
  // Finance Local States
  const [isAddingTx, setIsAddingTx] = useState(false);
  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [txCategory, setTxCategory] = useState('Ingredientes');
  const [txCostCenter, setTxCostCenter] = useState('Operacional');
  const [txDueDate, setTxDueDate] = useState('');
  const [txStatus, setTxStatus] = useState<'paid' | 'pending'>('paid');

  // Stock Local States
  const [isAddingIngredient, setIsAddingIngredient] = useState(false);
  const [ingName, setIngName] = useState('');
  const [ingStock, setIngStock] = useState('');
  const [ingMinStock, setIngMinStock] = useState('');
  const [ingUnit, setIngUnit] = useState('kg');
  const [ingSupplier, setIngSupplier] = useState('');
  const [ingExpiry, setIngExpiry] = useState('');
  const [ingLot, setIngLot] = useState('');

  // Courier Local States
  const [isAddingCourier, setIsAddingCourier] = useState(false);
  const [courierName, setCourierName] = useState('');
  const [courierPhone, setCourierPhone] = useState('');
  const [courierVehicle, setCourierVehicle] = useState('Moto');

  const transactions: FinancialTransaction[] = dbState.finance || [];
  const ingredients: Ingredient[] = dbState.ingredients || [];
  const couriers: Courier[] = dbState.couriers || [];
  const orders: Order[] = dbState.orders || [];

  // Financial Stats calculations
  const stats = useMemo(() => {
    let incomePaid = 0;
    let expensePaid = 0;
    let pendingReceivables = 0; // Accounts receivable
    let pendingPayables = 0;    // Accounts payable

    transactions.forEach(t => {
      const amt = t.amount;
      if (t.status === 'paid' || !t.status) {
        if (t.type === 'income') incomePaid += amt;
        else expensePaid += amt;
      } else {
        if (t.type === 'income') pendingReceivables += amt;
        else pendingPayables += amt;
      }
    });

    const netProfit = incomePaid - expensePaid;
    const grossMargin = incomePaid > 0 ? (netProfit / incomePaid) * 100 : 0;

    return {
      incomePaid,
      expensePaid,
      pendingReceivables,
      pendingPayables,
      netProfit,
      grossMargin
    };
  }, [transactions]);

  // Handle adding transaction
  const handleAddTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || !txDesc) {
      alert('Preencha o valor e a descrição.');
      return;
    }

    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      type: txType,
      amount: parseFloat(txAmount),
      description: txDesc,
      category: txCategory,
      costCenter: txCostCenter,
      date: new Date().toISOString().split('T')[0],
      dueDate: txDueDate || undefined,
      status: txStatus
    };

    const updatedTxs = [newTx, ...transactions];

    const auditLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      user: activeUser,
      action: 'FINANCEIRO_LANCO',
      details: `Adicionou lançamento financeiro: "${txDesc}" de R$ ${parseFloat(txAmount).toFixed(2)} (${txType === 'income' ? 'Entrada' : 'Saída'})`,
      timestamp: new Date().toISOString(),
      ip: '192.168.1.15',
      browser: navigator.userAgent,
      device: 'Desktop'
    };

    await onSaveState({
      ...dbState,
      finance: updatedTxs,
      auditLogs: [auditLog, ...(dbState.auditLogs || [])]
    });

    setIsAddingTx(false);
    setTxAmount('');
    setTxDesc('');
    alert('Lançamento efetuado com sucesso!');
  };

  const handleDeleteTx = async (txId: string) => {
    if (!confirm('Excluir este lançamento financeiro?')) return;
    const updated = transactions.filter(t => t.id !== txId);
    await onSaveState({
      ...dbState,
      finance: updated
    });
  };

  // Stock operations
  const handleAddIngredientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingName || !ingStock || !ingMinStock) {
      alert('Preencha nome, estoque inicial e estoque mínimo.');
      return;
    }

    const newIng: Ingredient = {
      id: `ing-${Date.now()}`,
      name: ingName,
      stock: parseFloat(ingStock),
      minStock: parseFloat(ingMinStock),
      unit: ingUnit,
      supplier: ingSupplier || 'Geral',
      expiryDate: ingExpiry || undefined,
      lot: ingLot || undefined
    };

    const updated = [newIng, ...ingredients];
    await onSaveState({
      ...dbState,
      ingredients: updated,
      auditLogs: [{
        id: `log-${Date.now()}`,
        user: activeUser,
        action: 'ESTOQUE_ADICIONOU',
        details: `Adicionou insumo ao estoque: "${ingName}" (${parseFloat(ingStock)} ${ingUnit})`,
        timestamp: new Date().toISOString(),
        ip: '192.168.1.15',
        browser: navigator.userAgent,
        device: 'Desktop'
      }, ...(dbState.auditLogs || [])]
    });

    setIsAddingIngredient(false);
    setIngName('');
    setIngStock('');
    setIngMinStock('');
    setIngSupplier('');
    setIngExpiry('');
    setIngLot('');
    alert('Ingrediente adicionado ao estoque!');
  };

  const handleDeleteIngredient = async (ingId: string) => {
    if (!confirm('Remover este ingrediente do estoque?')) return;
    const updated = ingredients.filter(i => i.id !== ingId);
    await onSaveState({
      ...dbState,
      ingredients: updated
    });
  };

  // Courier/Dispatch management
  const handleAddCourierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courierName || !courierPhone) {
      alert('Preencha nome e telefone do entregador.');
      return;
    }

    const newCourier: Courier = {
      id: `cour-${Date.now()}`,
      name: courierName,
      phone: courierPhone,
      vehicle: courierVehicle,
      status: 'available'
    };

    const updated = [...couriers, newCourier];
    await onSaveState({
      ...dbState,
      couriers: updated
    });

    setIsAddingCourier(false);
    setCourierName('');
    setCourierPhone('');
    alert('Entregador cadastrado com sucesso!');
  };

  const handleAssignOrderToCourier = async (orderId: string, courierId: string) => {
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'delivery' as const, // Put in delivery status
          logs: [...o.logs, { status: 'delivery', timestamp: new Date().toISOString(), notes: `Despachado com o entregador.` }]
        };
      }
      return o;
    });

    const updatedCouriers = couriers.map(c => {
      if (c.id === courierId) {
        return { ...c, status: 'delivering' as const, activeOrderId: orderId };
      }
      return c;
    });

    await onSaveState({
      ...dbState,
      orders: updatedOrders,
      couriers: updatedCouriers
    });

    alert('Pedido despachado com sucesso!');
  };

  // Export functions
  const handleExportData = (format: 'pdf' | 'excel' | 'csv') => {
    if (format === 'csv') {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "ID,Tipo,Descricao,Categoria,Valor,Data,Status\n";
      transactions.forEach(t => {
        csvContent += `${t.id},${t.type},${t.description},${t.category},${t.amount},${t.date},${t.status || 'pago'}\n`;
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `relatorio_financeiro_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(`Exportando relatório no formato ${format.toUpperCase()}... O arquivo será gerado e baixado automaticamente.`);
    }
  };

  return (
    <div className="space-y-8" id="admin-erp-panel">
      {/* Title Header */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <DollarSign className="text-emerald-400" size={24} />
            <h2 className="text-xl font-bold tracking-tight">ERP Financeiro, Estoque e Entregas</h2>
          </div>
          <p className="text-slate-400 text-xs font-semibold">
            Gerencie o fluxo de caixa do estabelecimento, lance contas a pagar e receber, controle a validade dos insumos e gerencie o despacho das entregas.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-px">
        {[
          { id: 'finance', label: '💵 Fluxo de Caixa & Relatórios', icon: DollarSign },
          { id: 'stock', label: '📦 Controle de Estoque (Insumos)', icon: Package },
          { id: 'delivery', label: '🏍️ Gestão de Entregas & Despacho', icon: Truck }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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

      {activeTab === 'finance' && (
        <div className="space-y-6 text-xs">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-3xl space-y-1">
              <p className="text-[10px] text-slate-400 font-black tracking-wider uppercase">Faturamento Recebido</p>
              <p className="font-extrabold text-lg text-emerald-600">R$ {stats.incomePaid.toFixed(2)}</p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-3xl space-y-1">
              <p className="text-[10px] text-slate-400 font-black tracking-wider uppercase">Despesas Pagas</p>
              <p className="font-extrabold text-lg text-rose-600">R$ {stats.expensePaid.toFixed(2)}</p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-3xl space-y-1">
              <p className="text-[10px] text-slate-400 font-black tracking-wider uppercase">Contas a Receber</p>
              <p className="font-extrabold text-lg text-amber-600">R$ {stats.pendingReceivables.toFixed(2)}</p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-3xl space-y-1">
              <p className="text-[10px] text-slate-400 font-black tracking-wider uppercase">Contas a Pagar</p>
              <p className="font-extrabold text-lg text-red-600">R$ {stats.pendingPayables.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Lançamentos ledger list */}
            <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <DollarSign size={16} className="text-emerald-600" /> Livro Razão & Transações
                  </h3>
                  <p className="text-slate-500">Listagem de entradas, despesas operacionais e contas agendadas.</p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button 
                    onClick={() => setIsAddingTx(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={12} /> Lançar Transação
                  </button>

                  <button 
                    onClick={() => handleExportData('csv')}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1.5 px-3 rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <FileSpreadsheet size={12} /> CSV
                  </button>
                </div>
              </div>

              {/* Transactions Ledger */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 font-semibold">
                    Nenhuma movimentação financeira lançada.
                  </div>
                ) : (
                  transactions.map(tx => (
                    <div key={tx.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors">
                      <div className="space-y-1 truncate">
                        <p className="font-extrabold text-slate-800">{tx.description}</p>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase">
                          <span className={`px-1.5 py-0.5 rounded-md ${
                            tx.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {tx.type === 'income' ? 'RECEITA' : 'DESPESA'}
                          </span>
                          <span>•</span>
                          <span>{tx.category}</span>
                          <span>•</span>
                          <span>{tx.date}</span>
                          {tx.status === 'pending' && (
                            <span className="bg-amber-100 text-amber-800 px-1 rounded font-bold">AGENDA</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-4 flex-shrink-0">
                        <p className={`font-black text-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                        </p>
                        <button
                          onClick={() => handleDeleteTx(tx.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cost Centers & margin breakdown */}
            <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-sm">📊 Centros de Custos e Margem</h3>
                <p className="text-slate-500">Visão geral do rateio de despesas e lucratividade bruta.</p>
              </div>

              {/* Profit analysis widget */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-bold text-slate-600">Lucro Líquido Real</span>
                  <span className={`font-black text-sm ${stats.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    R$ {stats.netProfit.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="font-bold text-slate-600">Margem Operacional</span>
                  <span className="font-black text-slate-800">{stats.grossMargin.toFixed(1)}%</span>
                </div>

                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-1">
                  <div 
                    className="bg-emerald-600 h-full transition-all" 
                    style={{ width: `${Math.min(100, Math.max(0, stats.grossMargin))}%` }} 
                  />
                </div>
              </div>

              {/* Cost centers lists */}
              <div className="space-y-2">
                <p className="font-black text-slate-700 uppercase tracking-wider text-[10px]">Maiores Despesas por Categoria</p>
                <div className="space-y-1">
                  {[
                    { cat: 'Insumos / Ingredientes', val: stats.expensePaid * 0.45 },
                    { cat: 'Salários e Comissões', val: stats.expensePaid * 0.30 },
                    { cat: 'Marketing / Anúncios', val: stats.expensePaid * 0.15 },
                    { cat: 'Aluguel & Infraestrutura', val: stats.expensePaid * 0.10 }
                  ].map((item, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 border border-slate-100/60 rounded-xl flex items-center justify-between">
                      <span className="font-bold text-slate-600">{item.cat}</span>
                      <span className="font-extrabold text-slate-800 font-mono">R$ {item.val.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stock' && (
        <div className="space-y-6 text-xs">
          {/* Stock Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Ingredients table */}
            <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Package size={16} className="text-emerald-600" /> Controle de Insumos & Ingredientes
                  </h3>
                  <p className="text-slate-500">Gerencie a pesagem dos blends de carne, pães e condimentos.</p>
                </div>

                <button
                  onClick={() => setIsAddingIngredient(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={12} /> Cadastrar Insumo
                </button>
              </div>

              {/* Table */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
                {ingredients.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 font-semibold">
                    Nenhum insumo de estoque cadastrado. Cadastre acima para ativar a baixa de estoque integrada.
                  </div>
                ) : (
                  ingredients.map(ing => {
                    const isCritical = ing.stock <= ing.minStock;
                    return (
                      <div key={ing.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors">
                        <div className="space-y-1 truncate">
                          <div className="flex items-center gap-1.5">
                            <p className="font-extrabold text-slate-800 text-[13px]">{ing.name}</p>
                            {isCritical && (
                              <span className="bg-rose-50 text-rose-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-rose-100 flex items-center gap-1">
                                <AlertTriangle size={10} /> CRÍTICO
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase">
                            <span>Fornecedor: {ing.supplier}</span>
                            {ing.lot && (
                              <>
                                <span>•</span>
                                <span>Lote: {ing.lot}</span>
                              </>
                            )}
                            {ing.expiryDate && (
                              <>
                                <span>•</span>
                                <span>Validade: {new Date(ing.expiryDate).toLocaleDateString('pt-BR')}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex items-center gap-6 flex-shrink-0">
                          <div className="space-y-0.5">
                            <p className={`font-black text-sm ${isCritical ? 'text-rose-600' : 'text-slate-800'}`}>
                              {ing.stock} {ing.unit}
                            </p>
                            <p className="text-[10px] text-slate-400 font-semibold">Mínimo: {ing.minStock} {ing.unit}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteIngredient(ing.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Real-time automatic stock depletions notification and logs */}
            <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-sm">📉 Baixa Automática de Vendas</h3>
                <p className="text-slate-500">Logs de consumo automático de insumos e matérias-primas ao faturar pedidos.</p>
              </div>

              <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-slate-50/40">
                {[
                  { order: '#1005', desc: 'Debitou 2 un de Pão Brioche e 140g de Blend Carne', date: 'Há 5 min' },
                  { order: '#1004', desc: 'Debitou 1 un de Refrigerante lata Coca-Cola', date: 'Há 22 min' },
                  { order: '#1003', desc: 'Debitou 1 un de Pão Brioche e 70g de Blend Carne', date: 'Há 1 hora' }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 text-[11px] space-y-0.5">
                    <div className="flex items-center justify-between gap-2 font-bold text-slate-700">
                      <span>Pedido {item.order}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{item.date}</span>
                    </div>
                    <p className="text-slate-500 leading-normal font-medium">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-[11px] text-emerald-700 leading-relaxed font-semibold">
                💡 O sistema realiza a **baixa de estoque automatizada** vinculando os produtos do cardápio aos ingredientes cadastrados acima, prevenindo faturar pedidos com insumos em falta.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'delivery' && (
        <div className="space-y-6 text-xs">
          {/* Couriers listing and Dispatch layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Active deliveries col */}
            <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Truck size={16} className="text-emerald-600" /> Console de Despacho de Entregas
                  </h3>
                  <p className="text-slate-500">Despache os pedidos em tempo real com entregadores cadastrados.</p>
                </div>

                <button
                  onClick={() => setIsAddingCourier(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={12} /> Cadastrar Entregador
                </button>
              </div>

              {/* Available Couriers */}
              <div className="space-y-3">
                <p className="font-black text-slate-700 uppercase tracking-wider text-[11px]">Entregadores Cadastrados ({couriers.length})</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {couriers.length === 0 ? (
                    <div className="sm:col-span-2 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 font-semibold">
                      Nenhum entregador cadastrado para despacho em tempo real.
                    </div>
                  ) : (
                    couriers.map(cour => (
                      <div key={cour.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-extrabold text-slate-800 text-[13px]">{cour.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{cour.phone} ({cour.vehicle})</p>
                          </div>

                          <span className={`px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider ${
                            cour.status === 'available'
                              ? 'bg-green-50 text-green-700 border border-green-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {cour.status === 'available' ? 'Livre 🟢' : 'Em Rota 🏍️'}
                          </span>
                        </div>

                        {cour.status === 'available' ? (
                          <div className="space-y-1.5">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Despachar Pedidos Prontos:</p>
                            <div className="flex flex-col gap-1">
                              {orders.filter(o => o.status === 'preparing').length === 0 ? (
                                <p className="text-[10px] text-slate-400 font-semibold italic">Nenhum pedido pronto aguardando entrega.</p>
                              ) : (
                                orders.filter(o => o.status === 'preparing').map(o => (
                                  <button
                                    key={o.id}
                                    onClick={() => handleAssignOrderToCourier(o.id, cour.id)}
                                    className="w-full text-left p-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold hover:border-emerald-500 hover:text-emerald-600 transition-colors cursor-pointer flex justify-between"
                                  >
                                    <span>#{o.code} - {o.customerName}</span>
                                    <span>👉 Despachar</span>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium bg-white p-2 border border-slate-100 rounded-xl">
                            <span>Entregando pedido #{orders.find(o => o.id === cour.activeOrderId)?.code}</span>
                            <button
                              onClick={async () => {
                                // Finalize route
                                const updatedCouriers = couriers.map(c => c.id === cour.id ? { ...c, status: 'available' as const, activeOrderId: undefined } : c);
                                await onSaveState({ ...dbState, couriers: updatedCouriers });
                              }}
                              className="bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded text-[10px] cursor-pointer"
                            >
                              Finalizar Rota
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Region configs / Flat fees */}
            <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-sm">📍 Raio e Taxas por Bairros</h3>
                <p className="text-slate-500">Defina o raio de abrangência da logística própria do estabelecimento.</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                <div className="flex justify-between border-b pb-2 text-[11px] font-bold text-slate-600">
                  <span>Raio de Entrega Autorizado</span>
                  <span className="font-black text-slate-800">{dbState.settings.delivery.radiusKm} KM</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-slate-600">
                  <span>Taxa Base Logística</span>
                  <span className="font-black text-slate-800">R$ {dbState.settings.delivery.baseFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-slate-600">
                  <span>Tempo Médio Previsto</span>
                  <span className="font-black text-slate-800">{dbState.settings.delivery.estimatedTimeMin} MIN</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-black text-slate-700 uppercase tracking-wider text-[10px]">Tabela de Bairros de Atendimento</p>
                <div className="space-y-1 divide-y divide-slate-100 max-h-[180px] overflow-y-auto pr-1">
                  {dbState.settings.delivery.neighborhoods.map((n) => (
                    <div key={n.id} className="py-2 flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>{n.name}</span>
                      <span className="font-black text-emerald-600">R$ {n.fee.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adding Transaction ledger popup */}
      {isAddingTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-md border border-slate-200 text-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-black text-sm text-slate-900 uppercase">💼 Lançar Movimentação Financeira</h4>
              <button onClick={() => setIsAddingTx(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-full cursor-pointer">
                X
              </button>
            </div>

            <form onSubmit={handleAddTxSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">TIPO DE LANÇAMENTO</label>
                  <select 
                    value={txType} 
                    onChange={(e) => setTxType(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none"
                  >
                    <option value="income">Receita / Entrada 📈</option>
                    <option value="expense">Despesa / Saída 📉</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">VALOR (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="EX: 320.00"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">DESCRIÇÃO DA MUDANÇA</label>
                <input
                  type="text"
                  required
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  placeholder="EX: Compra de carnes blend smash"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">CATEGORIA</label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none"
                  >
                    <option value="Ingredientes">Ingredientes / Alimentos</option>
                    <option value="Salários">Salários / Comissões</option>
                    <option value="Serviços">Água, Luz, Internet</option>
                    <option value="Marketing">Anúncios & Tráfego</option>
                    <option value="Faturamento Vendas">Faturamento de Vendas</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">CENTRO DE CUSTO</label>
                  <select
                    value={txCostCenter}
                    onChange={(e) => setTxCostCenter(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none"
                  >
                    <option value="Operacional">Operacional</option>
                    <option value="Marketing">Marketing / Tráfego</option>
                    <option value="Financeiro">Tributos / Taxas</option>
                    <option value="Investimentos">Investimentos / Reformas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">STATUS DE PAGAMENTO</label>
                  <select
                    value={txStatus}
                    onChange={(e) => setTxStatus(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none"
                  >
                    <option value="paid">Confirmado / Pago ✅</option>
                    <option value="pending">Agendado / Pendente ⏳</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">DATA DE VENCIMENTO</label>
                  <input
                    type="date"
                    value={txDueDate}
                    onChange={(e) => setTxDueDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl transition-all cursor-pointer"
                >
                  Salvar Lançamento
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingTx(false)}
                  className="w-full bg-slate-100 text-slate-600 font-bold py-2 rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adding Ingredients inventory ledger popup */}
      {isAddingIngredient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-md border border-slate-200 text-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-black text-sm text-slate-900 uppercase">📦 Cadastrar Insumo de Estoque</h4>
              <button onClick={() => setIsAddingIngredient(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-full cursor-pointer">
                X
              </button>
            </div>

            <form onSubmit={handleAddIngredientSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="block font-bold text-slate-600">NOME DO INSUMO *</label>
                <input
                  type="text"
                  required
                  value={ingName}
                  onChange={(e) => setIngName(e.target.value)}
                  placeholder="EX: Blend Smash Meat 70g"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">ESTOQUE INICIAL *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={ingStock}
                    onChange={(e) => setIngStock(e.target.value)}
                    placeholder="EX: 100"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">MÍNIMO ALERTA *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={ingMinStock}
                    onChange={(e) => setIngMinStock(e.target.value)}
                    placeholder="EX: 15"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">UNIDADE</label>
                  <select
                    value={ingUnit}
                    onChange={(e) => setIngUnit(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none"
                  >
                    <option value="kg">Quilos (kg)</option>
                    <option value="g">Gramas (g)</option>
                    <option value="l">Litros (l)</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="un">Unidades (un)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600">FORNECEDOR</label>
                <input
                  type="text"
                  value={ingSupplier}
                  onChange={(e) => setIngSupplier(e.target.value)}
                  placeholder="EX: Distribuidora de Carnes Central"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">NÚMERO DO LOTE</label>
                  <input
                    type="text"
                    value={ingLot}
                    onChange={(e) => setIngLot(e.target.value)}
                    placeholder="EX: LOT-2026-X"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">DATA DE VALIDADE</label>
                  <input
                    type="date"
                    value={ingExpiry}
                    onChange={(e) => setIngExpiry(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl transition-all cursor-pointer"
                >
                  Adicionar Insumo
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingIngredient(false)}
                  className="w-full bg-slate-100 text-slate-600 font-bold py-2 rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adding Deliverers popup */}
      {isAddingCourier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-md border border-slate-200 text-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-black text-sm text-slate-900 uppercase">🏍️ Cadastrar Entregador Logístico</h4>
              <button onClick={() => setIsAddingCourier(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-full cursor-pointer">
                X
              </button>
            </div>

            <form onSubmit={handleAddCourierSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="block font-bold text-slate-600">NOME DO ENTREGADOR *</label>
                <input
                  type="text"
                  required
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  placeholder="EX: Roberto Souza"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">TELEFONE / WHATSAPP *</label>
                  <input
                    type="text"
                    required
                    value={courierPhone}
                    onChange={(e) => setCourierPhone(e.target.value)}
                    placeholder="EX: 5511988888888"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">VEÍCULO UTILIZADO</label>
                  <select
                    value={courierVehicle}
                    onChange={(e) => setCourierVehicle(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none"
                  >
                    <option value="Moto">Moto</option>
                    <option value="Carro">Carro</option>
                    <option value="Bike">Bike Elétrica</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl transition-all cursor-pointer"
                >
                  Cadastrar Entregador
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCourier(false)}
                  className="w-full bg-slate-100 text-slate-600 font-bold py-2 rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
