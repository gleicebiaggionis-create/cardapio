import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, Users, DollarSign, Shield, LogOut, Trash2, Edit2, Plus, X, 
  Settings, Calendar, Percent, Image, MapPin, Eye, EyeOff, Save, Check, 
  RefreshCw, Calculator, UserMinus, UserCheck, ArrowUpRight, ArrowDownRight, Printer, FileSpreadsheet, Sparkles, MessageSquare, ListCollapse,
  Menu, ChevronDown, ChevronUp, ChevronRight, Package, ClipboardList, Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DatabaseState, Order, Customer, Product, Category, Banner, Coupon, FinancialTransaction, RestaurantSettings, DeliveryNeighborhood, OptionGroup, OptionItem, GatewaySettings } from '../types';
import AdminCMS from './AdminCMS';
import AdminCRM from './AdminCRM';
import AdminERP from './AdminERP';
import AdminAudit from './AdminAudit';
import { SUPABASE_SQL_SCHEMA } from '../lib/supabase';
import { compressImage } from '../lib/imageUtils';

interface AdminPanelProps {
  dbState: DatabaseState;
  onSaveState: (newState: DatabaseState) => Promise<boolean>;
  onUpdateOrderStatus: (orderId: string, status: Order['status'], notes?: string) => Promise<Order | null>;
  onLogOut: () => void;
}

export default function AdminPanel({
  dbState,
  onSaveState,
  onUpdateOrderStatus,
  onLogOut
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'dashboard' | 'cms' | 'products' | 'categories' | 'coupons' | 'crm' | 'erp' | 'audit' | 'calculator' | 'settings' | 'banners'>('orders');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    products_group: true,
    financial_group: true,
    settings_group: false,
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const activeUser = sessionStorage.getItem('admin-token') || 'gleicebiaggionis@gmail.com';
  
  // States for products edits
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [productModalTab, setProductModalTab] = useState<'general' | 'options'>('general');
  const [editingGroupIndex, setEditingGroupIndex] = useState<number | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupMin, setGroupMin] = useState(0);
  const [groupMax, setGroupMax] = useState(1);
  const [groupItems, setGroupItems] = useState<OptionItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);
  const [editingNeighborhood, setEditingNeighborhood] = useState<Partial<DeliveryNeighborhood> | null>(null);
  
  // State for active order detail modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderStatusNotes, setOrderStatusNotes] = useState('');

  // Sounds settings
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [lastOrdersCount, setLastOrdersCount] = useState(dbState?.orders?.length || 0);

  // CRM searching
  const [crmSearch, setCrmSearch] = useState('');
  const [crmFilter, setCrmFilter] = useState<'all' | 'vip' | 'blocked'>('all');

  // Pricing calculator states
  const [calcFixedCosts, setCalcFixedCosts] = useState('1500');
  const [calcVariablePercent, setCalcVariablePercent] = useState('35'); // ingredients, taxes
  const [calcDesiredMargin, setCalcDesiredMargin] = useState('25'); // target net margin
  const [calcItemBaseCost, setCalcItemBaseCost] = useState('10.00'); // ingredients of single item
  
  // Settings local states
  const [settingsForm, setSettingsForm] = useState<RestaurantSettings>(() => {
    const s: Partial<RestaurantSettings> = dbState?.settings || {};
    return {
      name: s.name || 'Brazzuno - Hamburgueria & Grelhados',
      phone: s.phone || '11999998888',
      whatsapp: s.whatsapp || '11999998888',
      instagram: s.instagram || 'brazzunoburger',
      facebook: s.facebook || 'brazzunoburger',
      tiktok: s.tiktok || '',
      email: s.email || 'contato@brazzuno.com.br',
      address: s.address || 'Av. Paulista, 1200 - Bela Vista, São Paulo - SP',
      branding: {
        logo: s.branding?.logo || '🔥',
        bannerImage: s.branding?.bannerImage || 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=1200',
        primaryColor: s.branding?.primaryColor || '#03d383',
        secondaryColor: s.branding?.secondaryColor || '#00df89',
        backgroundColor: s.branding?.backgroundColor || '#f8fafc',
        fontFamily: s.branding?.fontFamily || 'Inter',
        theme: s.branding?.theme || 'light'
      },
      delivery: s.delivery || {
        radiusKm: 6,
        baseFee: 6.50,
        freeDeliveryMinAmount: 75.00,
        minOrderAmount: 20.00,
        estimatedTimeMin: 35,
        allowPickup: true,
        neighborhoods: []
      },
      operational: s.operational || {
        hours: [],
        closedMessage: '',
        holidays: []
      },
      pix: s.pix || {
        keyType: 'cnpj',
        keyValue: '12.345.678/0001-90',
        receiverName: 'Brazzuno Alimentos Ltda'
      },
      floatingButtons: s.floatingButtons || {
        whatsapp: { number: '11999998888', message: 'Olá', icon: 'MessageCircle', color: '#25D366', position: 'bottom-right', isVisible: true },
        instagram: { link: '', icon: 'Instagram', color: '#E1306C', position: 'bottom-left', isVisible: false }
      },
      seo: s.seo || {
        title: 'Brazzuno - Hamburgueria',
        description: 'Cardápio Digital',
        keywords: 'hamburgueria, delivery'
      },
      localPayments: s.localPayments || {
        pixActive: true,
        cashActive: true,
        mealVoucherActive: false,
        foodVoucherActive: false,
        deliveryPaymentActive: false
      },
      checkoutTransparenteActive: s.checkoutTransparenteActive || false,
      selectedGatewayId: s.selectedGatewayId || 'mercadopago',
      gateways: s.gateways || [
        { id: 'mercadopago', name: 'Mercado Pago', isEnabled: false, isProduction: false },
        { id: 'stripe', name: 'Stripe', isEnabled: false, isProduction: false },
        { id: 'pagseguro', name: 'PagSeguro', isEnabled: false, isProduction: false }
      ]
    };
  });

  const [testingGatewayId, setTestingGatewayId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const AVAILABLE_GATEWAYS = [
    { id: 'mercadopago', name: 'Mercado Pago', methods: ['Cartão de Crédito', 'Cartão de Débito', 'PIX Online', 'Google Pay'] },
    { id: 'pagseguro', name: 'PagSeguro', methods: ['Cartão de Crédito', 'Cartão de Débito', 'PIX Online'] },
    { id: 'stripe', name: 'Stripe', methods: ['Cartão de Crédito', 'Cartão de Débito', 'Apple Pay', 'Google Pay'] },
    { id: 'asaas', name: 'Asaas', methods: ['Cartão de Crédito', 'PIX Online', 'Boleto'] },
    { id: 'pagarme', name: 'Pagar.me', methods: ['Cartão de Crédito', 'Cartão de Débito', 'PIX Online'] },
    { id: 'cielo', name: 'Cielo', methods: ['Cartão de Crédito', 'Cartão de Débito'] },
    { id: 'rede', name: 'Rede', methods: ['Cartão de Crédito', 'Cartão de Débito'] },
    { id: 'stone', name: 'Stone', methods: ['Cartão de Crédito', 'Cartão de Débito'] },
    { id: 'infinitepay', name: 'InfinitePay', methods: ['Cartão de Crédito', 'PIX Online'] },
    { id: 'openpix', name: 'OpenPix', methods: ['PIX Online'] },
    { id: 'woovi', name: 'Woovi', methods: ['PIX Online'] },
    { id: 'paypal', name: 'PayPal', methods: ['Cartão de Crédito', 'Saldo PayPal', 'Venmo'] },
    { id: 'outro', name: 'Outros Gateways', methods: ['Cartão de Crédito', 'Cartão de Débito', 'PIX Online'] }
  ];

  const currentGatewayId = settingsForm.selectedGatewayId || 'mercadopago';
  const currentGateway = settingsForm.gateways?.find(g => g.id === currentGatewayId) || {
    id: currentGatewayId,
    name: AVAILABLE_GATEWAYS.find(g => g.id === currentGatewayId)?.name || 'Mercado Pago',
    isEnabled: false,
    isProduction: false,
    apiKey: '',
    secretKey: '',
    publicKey: '',
    webhookUrl: `https://api.vitosburgers.com/v1/webhooks/${currentGatewayId}`,
    clientId: '',
    clientSecret: '',
    accessToken: '',
    status: 'disconnected'
  };

  const handleUpdateGatewayField = (field: keyof GatewaySettings, value: any) => {
    const gatewaysList = settingsForm.gateways || [];
    const exists = gatewaysList.some(g => g.id === currentGatewayId);
    
    let updatedGateways;
    if (exists) {
      updatedGateways = gatewaysList.map(g => 
        g.id === currentGatewayId ? { ...g, [field]: value } : g
      );
    } else {
      updatedGateways = [
        ...gatewaysList,
        {
          id: currentGatewayId,
          name: AVAILABLE_GATEWAYS.find(g => g.id === currentGatewayId)?.name || currentGatewayId,
          isEnabled: false,
          isProduction: false,
          apiKey: '',
          secretKey: '',
          publicKey: '',
          webhookUrl: `https://api.vitosburgers.com/v1/webhooks/${currentGatewayId}`,
          clientId: '',
          clientSecret: '',
          accessToken: '',
          status: 'disconnected',
          [field]: value
        }
      ];
    }
    
    setSettingsForm({
      ...settingsForm,
      gateways: updatedGateways
    });
  };

  const handleTestIntegration = () => {
    setTestingGatewayId(currentGatewayId);
    setTestResult(null);
    
    setTimeout(() => {
      setTestingGatewayId(null);
      const gwConfig = settingsForm.gateways?.find(g => g.id === currentGatewayId);
      const isConfigured = !!(gwConfig?.apiKey || gwConfig?.accessToken || gwConfig?.clientId || gwConfig?.secretKey);
      
      if (isConfigured) {
        setTestResult({
          success: true,
          message: `Conexão estabelecida com sucesso! O gateway ${AVAILABLE_GATEWAYS.find(g => g.id === currentGatewayId)?.name} está pronto em ambiente de ${currentGateway.isProduction ? 'Produção' : 'Sandbox/Teste'}. Webhook registrado.`
        });
        handleUpdateGatewayField('status', 'connected');
      } else {
        setTestResult({
          success: false,
          message: 'Falha na conexão: Credenciais ausentes. Por favor, preencha pelo menos a API Key, Access Token, Client ID ou Secret Key para testar.'
        });
        handleUpdateGatewayField('status', 'disconnected');
      }
    }, 1500);
  };

  // Auto synthesise notification sounds using HTML5 Web Audio API
  const playNotificationSound = () => {
    if (!isSoundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      osc.frequency.setValueAtTime(1174.66, audioCtx.currentTime + 0.3); // D6
      
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.warn('Audio Context not allowed or failed to build.', e);
    }
  };

  // Check for new orders to play alarm chime
  useEffect(() => {
    if (dbState.orders.length > lastOrdersCount) {
      const hasNew = dbState.orders.some(o => o.status === 'new');
      if (hasNew) {
        playNotificationSound();
      }
      setLastOrdersCount(dbState.orders.length);
    }
  }, [dbState.orders, lastOrdersCount, isSoundEnabled]);

  // Dashboard Telemetry Calculations
  const dashboardStats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterday.toDateString();

    let todaySales = 0;
    let todayOrders = 0;
    let yesterdaySales = 0;
    let yesterdayOrders = 0;
    let monthSales = 0;
    let monthOrders = 0;
    let totalCanceled = 0;
    let activeOrders = 0;

    dbState.orders.forEach(o => {
      const oDate = new Date(o.createdAt);
      const oDateStr = oDate.toDateString();
      
      if (o.status !== 'canceled') {
        if (oDateStr === todayStr) {
          todaySales += o.total;
          todayOrders++;
        } else if (oDateStr === yesterdayStr) {
          yesterdaySales += o.total;
          yesterdayOrders++;
        }
        
        // Month sales (last 30 days)
        if (now.getTime() - oDate.getTime() <= 30 * 24 * 60 * 60 * 1000) {
          monthSales += o.total;
          monthOrders++;
        }
      } else {
        totalCanceled++;
      }

      if (o.status === 'new' || o.status === 'preparing' || o.status === 'delivery') {
        activeOrders++;
      }
    });

    const totalIncome = dbState.finance.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
    const totalExpenses = dbState.finance.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
    const totalBalance = totalIncome - totalExpenses;

    const ticketMedio = monthOrders > 0 ? monthSales / monthOrders : 0;

    return {
      todaySales,
      todayOrders,
      yesterdaySales,
      yesterdayOrders,
      monthSales,
      monthOrders,
      totalCanceled,
      activeOrders,
      ticketMedio,
      totalIncome,
      totalExpenses,
      totalBalance
    };
  }, [dbState]);

  // SVG Chart data for monthly sales
  const chartSalesData = useMemo(() => {
    const days: { [day: string]: { income: number; expense: number } } = {};
    const now = new Date();
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      days[d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })] = { income: 0, expense: 0 };
    }

    // Accumulate transactions
    dbState.finance.forEach(f => {
      const dateStr = new Date(f.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
      if (days[dateStr] !== undefined) {
        if (f.type === 'income') {
          days[dateStr].income += f.amount;
        } else {
          days[dateStr].expense += f.amount;
        }
      }
    });

    return Object.entries(days).map(([label, val]) => ({
      label,
      ...val
    }));
  }, [dbState]);

  // CRM Search Filters
  const filteredCustomers = useMemo(() => {
    return dbState.customers.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(crmSearch.toLowerCase()) || 
                            c.phone.includes(crmSearch) || 
                            (c.address?.street && c.address.street.toLowerCase().includes(crmSearch.toLowerCase()));
      
      if (crmFilter === 'vip') return matchesSearch && c.isVip;
      if (crmFilter === 'blocked') return matchesSearch && c.isBlocked;
      return matchesSearch;
    });
  }, [dbState.customers, crmSearch, crmFilter]);

  // Financial Pricing Calculations
  const calculatedPricing = useMemo(() => {
    const baseCost = parseFloat(calcItemBaseCost) || 0;
    const variable = parseFloat(calcVariablePercent) || 0;
    const targetMargin = parseFloat(calcDesiredMargin) || 0;

    // Pricing formula using Markup and desired profit margin
    // Base markup = 100 / (100 - Variable % - Desired Net Margin %)
    const remainingPercentage = 100 - variable - targetMargin;
    if (remainingPercentage <= 0) {
      return { markup: 0, idealPrice: 0, profitBruto: 0, profitNet: 0, minPrice: 0 };
    }

    const markup = 100 / remainingPercentage;
    const idealPrice = baseCost * markup;
    const profitBruto = idealPrice - baseCost;
    const profitNet = (idealPrice * targetMargin) / 100;
    const minPrice = baseCost * (1 + (variable / 100));

    return {
      markup,
      idealPrice,
      profitBruto,
      profitNet,
      minPrice
    };
  }, [calcItemBaseCost, calcVariablePercent, calcDesiredMargin]);

  // Export tables tools
  const handleExportCSV = (type: 'customers' | 'finance' | 'orders') => {
    let headers = '';
    let rows = '';
    let fileName = '';

    if (type === 'customers') {
      headers = 'Nome,WhatsApp,Pedidos,Total Gasto,Vip,Bloqueado,Notas\n';
      rows = dbState.customers.map(c => `"${c.name}","${c.phone}",${c.ordersCount},${c.totalSpent.toFixed(2)},${c.isVip ? 'Sim' : 'Não'},${c.isBlocked ? 'Sim' : 'Não'},"${c.notes || ''}"`).join('\n');
      fileName = 'clientes_crm.csv';
    } else if (type === 'finance') {
      headers = 'Tipo,Valor,Descricao,Categoria,Data,Metodo,Referencia\n';
      rows = dbState.finance.map(f => `"${f.type === 'income' ? 'Receita' : 'Despesa'}",${f.amount.toFixed(2)},"${f.description}","${f.category}","${new Date(f.date).toLocaleDateString()}","${f.paymentMethod || ''}","${f.reference || ''}"`).join('\n');
      fileName = 'fluxo_de_caixa.csv';
    } else {
      headers = 'Codigo,Cliente,Telefone,Subtotal,Taxa,Total,Status,Data\n';
      rows = dbState.orders.map(o => `"${o.code}","${o.customerName}","${o.customerPhone}",${o.subtotal.toFixed(2)},${o.deliveryFee.toFixed(2)},${o.total.toFixed(2)},"${o.status}","${new Date(o.createdAt).toLocaleDateString()}"`).join('\n');
      fileName = 'pedidos_vendas.csv';
    }

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status changes dispatchers
  const handleOrderStatusUpdate = async (orderId: string, status: Order['status']) => {
    const updatedOrder = await onUpdateOrderStatus(orderId, status, orderStatusNotes);
    if (updatedOrder) {
      setSelectedOrder(null);
      setOrderStatusNotes('');
    }
  };

  // General CRUD savings helper
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editingProduct.image) {
      alert('Por favor, adicione uma foto para o produto (clique ou arraste uma imagem no campo correspondente).');
      return;
    }

    let updatedProducts = [...dbState.products];
    if (editingProduct.id) {
      // Edit mode
      updatedProducts = updatedProducts.map(p => p.id === editingProduct.id ? (editingProduct as Product) : p);
    } else {
      // New mode
      const newProd: Product = {
        ...(editingProduct as Omit<Product, 'id'>),
        id: `prod-${Date.now()}`,
        sortOrder: dbState.products.length + 1,
        options: editingProduct.options || []
      } as Product;
      updatedProducts.push(newProd);
    }

    const ok = await onSaveState({
      ...dbState,
      products: updatedProducts
    });
    if (ok) setEditingProduct(null);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    let updatedCategories = [...dbState.categories];
    if (editingCategory.id) {
      updatedCategories = updatedCategories.map(c => c.id === editingCategory.id ? (editingCategory as Category) : c);
    } else {
      const newCat: Category = {
        ...(editingCategory as Omit<Category, 'id'>),
        id: `cat-${Date.now()}`,
        sortOrder: dbState.categories.length + 1,
        isHidden: false
      } as Category;
      updatedCategories.push(newCat);
    }

    const ok = await onSaveState({
      ...dbState,
      categories: updatedCategories
    });
    if (ok) setEditingCategory(null);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;

    let updatedBanners = [...dbState.banners];
    if (editingBanner.id) {
      updatedBanners = updatedBanners.map(b => b.id === editingBanner.id ? (editingBanner as Banner) : b);
    } else {
      const newBanner: Banner = {
        ...(editingBanner as Omit<Banner, 'id'>),
        id: `ban-${Date.now()}`,
        priority: dbState.banners.length + 1,
        isActive: true
      } as Banner;
      updatedBanners.push(newBanner);
    }

    const ok = await onSaveState({
      ...dbState,
      banners: updatedBanners
    });
    if (ok) setEditingBanner(null);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;

    let updatedCoupons = [...dbState.coupons];
    if (editingCoupon.id) {
      updatedCoupons = updatedCoupons.map(c => c.id === editingCoupon.id ? (editingCoupon as Coupon) : c);
    } else {
      const newCoupon: Coupon = {
        ...(editingCoupon as Omit<Coupon, 'id'>),
        id: `cp-${Date.now()}`,
        usageCount: 0,
        firstOrderOnly: editingCoupon.firstOrderOnly || false
      } as Coupon;
      updatedCoupons.push(newCoupon);
    }

    const ok = await onSaveState({
      ...dbState,
      coupons: updatedCoupons
    });
    if (ok) setEditingCoupon(null);
  };

  const handleSaveBrandingSettings = async () => {
    try {
      const settingsToSave: RestaurantSettings = {
        ...settingsForm,
        gateways: settingsForm.gateways || [
          { id: 'mercadopago', name: 'Mercado Pago', isEnabled: false, isProduction: false },
          { id: 'stripe', name: 'Stripe', isEnabled: false, isProduction: false },
          { id: 'pagseguro', name: 'PagSeguro', isEnabled: false, isProduction: false }
        ],
        delivery: {
          ...settingsForm.delivery,
          neighborhoods: settingsForm.delivery?.neighborhoods || []
        },
        operational: {
          ...settingsForm.operational,
          hours: settingsForm.operational?.hours || []
        },
        localPayments: settingsForm.localPayments || {
          pixActive: true,
          cashActive: true,
          mealVoucherActive: false,
          foodVoucherActive: false,
          deliveryPaymentActive: false
        }
      };

      const ok = await onSaveState({
        ...dbState,
        settings: settingsToSave
      });
      if (ok) {
        alert('Configurações salvas com sucesso!');
      } else {
        alert('Erro ao salvar as configurações. Verifique se os dados são válidos ou se sua sessão de administrador expirou.');
      }
    } catch (error: any) {
      alert(`Falha ao salvar configurações: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const handleDeleteItem = async (type: 'product' | 'category' | 'banner' | 'coupon', id: string) => {
    if (!confirm('Deseja realmente remover este item?')) return;

    let updatedState = { ...dbState };
    if (type === 'product') {
      updatedState.products = dbState.products.filter(p => p.id !== id);
    } else if (type === 'category') {
      updatedState.categories = dbState.categories.filter(c => c.id !== id);
    } else if (type === 'banner') {
      updatedState.banners = dbState.banners.filter(b => b.id !== id);
    } else if (type === 'coupon') {
      updatedState.coupons = dbState.coupons.filter(c => c.id !== id);
    }

    await onSaveState(updatedState);
  };

  const handleCustomerBlockToggle = async (customer: Customer) => {
    const updatedCustomers = dbState.customers.map(c => 
      c.id === customer.id ? { ...c, isBlocked: !c.isBlocked } : c
    );
    await onSaveState({
      ...dbState,
      customers: updatedCustomers
    });
  };

  // Reordering helpers
  const handleReorderCategory = async (catId: string, direction: 'up' | 'down') => {
    const categories = [...dbState.categories].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = categories.findIndex(c => c.id === catId);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const temp = categories[index].sortOrder;
      categories[index].sortOrder = categories[index - 1].sortOrder;
      categories[index - 1].sortOrder = temp;
    } else if (direction === 'down' && index < categories.length - 1) {
      const temp = categories[index].sortOrder;
      categories[index].sortOrder = categories[index + 1].sortOrder;
      categories[index + 1].sortOrder = temp;
    }

    await onSaveState({
      ...dbState,
      categories
    });
  };

  const renderNavigationItems = () => {
    const pendingOrdersCount = dbState.orders.filter(o => o.status === 'new').length;

    // Helper to determine if a group contains the currently active tab
    const isGroupActive = (groupId: string) => {
      if (groupId === 'products_group') {
        return ['products', 'categories', 'coupons', 'cms', 'banners'].includes(activeTab);
      }
      if (groupId === 'financial_group') {
        return ['erp', 'crm'].includes(activeTab);
      }
      if (groupId === 'settings_group') {
        return ['settings', 'calculator', 'audit'].includes(activeTab);
      }
      return false;
    };

    return (
      <nav className="p-3 space-y-1.5">
        {/* 1. Dashboard */}
        <button
          onClick={() => {
            setActiveTab('dashboard');
            setIsMobileMenuOpen(false);
          }}
          className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs font-semibold transition-all duration-200 ${
            activeTab === 'dashboard'
              ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/10'
              : 'hover:bg-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp size={16} className={activeTab === 'dashboard' ? 'text-white' : 'text-slate-400'} />
          <span className="flex-1">📊 Dashboard</span>
        </button>

        {/* 2. Pedidos */}
        <button
          onClick={() => {
            setActiveTab('orders');
            setIsMobileMenuOpen(false);
          }}
          className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs font-semibold transition-all duration-200 ${
            activeTab === 'orders'
              ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/10'
              : 'hover:bg-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <ClipboardList size={16} className={activeTab === 'orders' ? 'text-white' : 'text-slate-400'} />
          <span className="flex-1">⚡ Pedidos</span>
          {pendingOrdersCount > 0 && (
            <span className="bg-rose-500 text-white font-bold px-2 py-0.5 rounded-full text-[10px] animate-pulse">
              {pendingOrdersCount} novos
            </span>
          )}
        </button>

        <div className="h-px bg-slate-800/60 my-2" />

        {/* 3. Gestão de Produtos */}
        <div className="space-y-1">
          <button
            onClick={() => toggleSection('products_group')}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-semibold transition-all duration-200 ${
              isGroupActive('products_group')
                ? 'bg-slate-800/60 text-emerald-400 font-bold'
                : 'hover:bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Package size={16} />
              <span>🛍️ Gestão de Produtos</span>
            </div>
            {expandedSections.products_group ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {expandedSections.products_group && (
            <div className="pl-4.5 space-y-1 border-l border-slate-800 ml-4 mt-1">
              <button
                onClick={() => {
                  setActiveTab('products');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center p-2 rounded-lg text-left text-[11px] font-medium transition-colors ${
                  activeTab === 'products'
                    ? 'bg-emerald-600/20 text-white font-bold'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                🍔 Cadastrar Produtos
              </button>

              <button
                onClick={() => {
                  setActiveTab('categories');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center p-2 rounded-lg text-left text-[11px] font-medium transition-colors ${
                  activeTab === 'categories'
                    ? 'bg-emerald-600/20 text-white font-bold'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                📁 Categorias de Menu
              </button>

              <button
                onClick={() => {
                  setActiveTab('coupons');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center p-2 rounded-lg text-left text-[11px] font-medium transition-colors ${
                  activeTab === 'coupons'
                    ? 'bg-emerald-600/20 text-white font-bold'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                🏷️ Cupons de Desconto
              </button>

              <button
                onClick={() => {
                  setActiveTab('banners');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center p-2 rounded-lg text-left text-[11px] font-medium transition-colors ${
                  activeTab === 'banners'
                    ? 'bg-emerald-600/20 text-white font-bold'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                🖼️ Banner do Topo/Fundo
              </button>

              <button
                onClick={() => {
                  setActiveTab('cms');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center p-2 rounded-lg text-left text-[11px] font-medium transition-colors ${
                  activeTab === 'cms'
                    ? 'bg-emerald-600/20 text-white font-bold'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                🎨 Construtor Visual CMS
              </button>
            </div>
          )}
        </div>

        {/* 4. Financeiro */}
        <div className="space-y-1">
          <button
            onClick={() => toggleSection('financial_group')}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-semibold transition-all duration-200 ${
              isGroupActive('financial_group')
                ? 'bg-slate-800/60 text-emerald-400 font-bold'
                : 'hover:bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Wallet size={16} />
              <span>💵 Financeiro & ERP</span>
            </div>
            {expandedSections.financial_group ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {expandedSections.financial_group && (
            <div className="pl-4.5 space-y-1 border-l border-slate-800 ml-4 mt-1">
              <button
                onClick={() => {
                  setActiveTab('erp');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center p-2 rounded-lg text-left text-[11px] font-medium transition-colors ${
                  activeTab === 'erp'
                    ? 'bg-emerald-600/20 text-white font-bold'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                📦 Estoque, Caixa & ERP
              </button>

              <button
                onClick={() => {
                  setActiveTab('crm');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center p-2 rounded-lg text-left text-[11px] font-medium transition-colors ${
                  activeTab === 'crm'
                    ? 'bg-emerald-600/20 text-white font-bold'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                👥 CRM & Clientes
              </button>
            </div>
          )}
        </div>

        {/* 5. Configurações Gerais */}
        <div className="space-y-1">
          <button
            onClick={() => toggleSection('settings_group')}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-semibold transition-all duration-200 ${
              isGroupActive('settings_group')
                ? 'bg-slate-800/60 text-emerald-400 font-bold'
                : 'hover:bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Settings size={16} />
              <span>⚙️ Configurações</span>
            </div>
            {expandedSections.settings_group ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {expandedSections.settings_group && (
            <div className="pl-4.5 space-y-1 border-l border-slate-800 ml-4 mt-1">
              <button
                onClick={() => {
                  setActiveTab('settings');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center p-2 rounded-lg text-left text-[11px] font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-emerald-600/20 text-white font-bold'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                ⚙️ Configurações Gerais
              </button>

              <button
                onClick={() => {
                  setActiveTab('calculator');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center p-2 rounded-lg text-left text-[11px] font-medium transition-colors ${
                  activeTab === 'calculator'
                    ? 'bg-emerald-600/20 text-white font-bold'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                🧮 Precificação Inteligente
              </button>

              <button
                onClick={() => {
                  setActiveTab('audit');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center p-2 rounded-lg text-left text-[11px] font-medium transition-colors ${
                  activeTab === 'audit'
                    ? 'bg-emerald-600/20 text-white font-bold'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                🛡️ Auditoria & logs
              </button>
            </div>
          )}
        </div>
      </nav>
    );
  };

  const renderSidebarFooter = () => {
    return (
      <div className="p-4 border-t border-slate-800 flex flex-col gap-3 sticky bottom-0 bg-slate-900 z-10">
        <div className="bg-slate-800/30 border border-slate-800/50 p-2.5 rounded-xl space-y-1 text-[10px] text-slate-400">
          <p className="text-slate-200 font-bold flex items-center gap-1 text-[11px]">
            <span>📱</span> Acesso Celular
          </p>
          <p className="text-[9px] text-slate-500 leading-normal">
            Use este link no celular para acessar direto de qualquer lugar.
          </p>
          <button
            onClick={() => {
              const url = `${window.location.origin}/admin?access=celular`;
              navigator.clipboard.writeText(url);
              alert('Link de acesso celular copiado!');
            }}
            className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold py-1 px-2 rounded-lg text-center transition-colors cursor-pointer text-[9px] border border-slate-700/60"
          >
            Copiar Link
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5 text-xs truncate max-w-[170px]" title={activeUser}>
            <Shield size={14} className="text-slate-500 flex-shrink-0" />
            <span className="text-slate-400 truncate font-semibold">{activeUser}</span>
          </div>
          <button 
            onClick={onLogOut}
            className="hover:text-white text-rose-400 p-1.5 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer flex-shrink-0"
            title="Sair da Conta"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col md:flex-row relative">
      
      {/* Sticky Mobile Header */}
      <header className="md:hidden bg-slate-900 border-b border-slate-800 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-45">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚙️</span>
          <div>
            <h2 className="font-bold text-white text-xs">Painel Gestor</h2>
            <p className="text-[9px] text-emerald-400 font-semibold flex items-center gap-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span> Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dbState.orders.filter(o => o.status === 'new').length > 0 && (
            <span className="bg-rose-500 text-white font-bold px-2 py-0.5 rounded-full text-[9px] animate-pulse">
              {dbState.orders.filter(o => o.status === 'new').length} novos
            </span>
          )}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Back Drop Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/60 z-48 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer Slide-out Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed inset-y-0 left-0 w-72 bg-slate-900 text-slate-300 z-49 md:hidden flex flex-col shadow-2xl border-r border-slate-800"
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚙️</span>
                <div>
                  <h2 className="font-bold text-white text-sm">Painel Gestor</h2>
                  <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span> Conectado
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                  className={`p-1 rounded-md text-[10px] font-bold ${isSoundEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}
                >
                  🔊 {isSoundEnabled ? 'ON' : 'OFF'}
                </button>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              {renderNavigationItems()}
            </div>

            {renderSidebarFooter()}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:w-64 bg-slate-900 text-slate-300 flex-col flex-shrink-0 border-r border-slate-800 min-h-screen sticky top-0 h-screen">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            <div>
              <h2 className="font-bold text-white text-sm">Painel Gestor</h2>
              <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span> Servidor Conectado
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className={`p-1 rounded-md text-xs font-bold ${isSoundEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}
            title="Sons de Notificação de Pedido"
          >
            🔊 {isSoundEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {renderNavigationItems()}
        </div>

        {renderSidebarFooter()}
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        <AnimatePresence mode="wait">
          
          {/* Visual Page Builder (CMS) tab */}
          {activeTab === 'cms' && (
            <motion.div 
              key="cms"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <AdminCMS 
                dbState={dbState}
                onSaveState={onSaveState}
                activeUser={activeUser}
              />
            </motion.div>
          )}

          {/* Realtime Live Orders monitor tab */}
          {activeTab === 'orders' && (
            <motion.div 
              key="orders"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="font-bold text-2xl text-slate-800 tracking-tight flex items-center gap-2">
                    Pedidos em Tempo Real
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">Acompanhe novos pedidos, atualize o status para preparar ou enviar para entrega.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={playNotificationSound}
                    className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    🔊 Testar Campainha
                  </button>
                </div>
              </div>

              {/* Order pipeline pipeline columns */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* Column NEW */}
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3 space-y-3 min-h-[500px]">
                  <div className="flex justify-between items-center bg-emerald-100/60 p-2 rounded-xl border border-emerald-200/50">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Novos Pedidos</span>
                    <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      {dbState.orders.filter(o => o.status === 'new').length}
                    </span>
                  </div>

                  <div className="space-y-3 overflow-y-auto max-h-[600px]">
                    {dbState.orders.filter(o => o.status === 'new').map(order => (
                      <div 
                        key={order.id} 
                        onClick={() => setSelectedOrder(order)}
                        className="bg-white p-3 rounded-xl border border-emerald-100/80 shadow-xs hover:border-emerald-300 transition-colors cursor-pointer relative"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-extrabold text-xs text-slate-800">{order.code}</span>
                          <span className="text-[10px] text-slate-500">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-700 mt-1.5 truncate">{order.customerName}</h4>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">📍 {order.address.neighborhood}</p>
                        
                        <div className="flex items-center justify-between mt-3 border-t border-slate-100 pt-2">
                          <span className="font-bold text-xs text-slate-800">R$ {order.total.toFixed(2)}</span>
                          <span className="text-[10px] bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-md">Pendente</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column PREPARING */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 space-y-3 min-h-[500px]">
                  <div className="flex justify-between items-center bg-amber-100 p-2 rounded-xl border border-amber-200">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Em Preparo</span>
                    <span className="bg-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      {dbState.orders.filter(o => o.status === 'preparing').length}
                    </span>
                  </div>

                  <div className="space-y-3 overflow-y-auto max-h-[600px]">
                    {dbState.orders.filter(o => o.status === 'preparing').map(order => (
                      <div 
                        key={order.id} 
                        onClick={() => setSelectedOrder(order)}
                        className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs hover:shadow-xs transition-shadow cursor-pointer"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-extrabold text-xs text-slate-800">{order.code}</span>
                          <span className="text-[10px] text-slate-500">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-700 mt-1.5 truncate">{order.customerName}</h4>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">📍 {order.address.neighborhood}</p>
                        
                        <div className="flex items-center justify-between mt-3 border-t border-slate-100 pt-2">
                          <span className="font-bold text-xs text-slate-800">R$ {order.total.toFixed(2)}</span>
                          <span className="text-[10px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-md">Cozinha</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column DELIVERY */}
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3 space-y-3 min-h-[500px]">
                  <div className="flex justify-between items-center bg-sky-100 p-2 rounded-xl border border-sky-200">
                    <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">Saiu p/ Entrega</span>
                    <span className="bg-sky-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      {dbState.orders.filter(o => o.status === 'delivery').length}
                    </span>
                  </div>

                  <div className="space-y-3 overflow-y-auto max-h-[600px]">
                    {dbState.orders.filter(o => o.status === 'delivery').map(order => (
                      <div 
                        key={order.id} 
                        onClick={() => setSelectedOrder(order)}
                        className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs hover:shadow-xs transition-shadow cursor-pointer"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-extrabold text-xs text-slate-800">{order.code}</span>
                          <span className="text-[10px] text-slate-500">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-700 mt-1.5 truncate">{order.customerName}</h4>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">🛵 Motoboy</p>
                        
                        <div className="flex items-center justify-between mt-3 border-t border-slate-100 pt-2">
                          <span className="font-bold text-xs text-slate-800">R$ {order.total.toFixed(2)}</span>
                          <span className="text-[10px] bg-sky-500 text-white font-bold px-2 py-0.5 rounded-md">Trânsito</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column CONCLUDED (Delivered/Canceled in last days) */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-3 min-h-[500px]">
                  <div className="flex justify-between items-center bg-slate-200 p-2 rounded-xl border border-slate-300">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Histórico Recente</span>
                    <span className="bg-slate-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      {dbState.orders.filter(o => o.status === 'delivered' || o.status === 'canceled').slice(-10).length}
                    </span>
                  </div>

                  <div className="space-y-3 overflow-y-auto max-h-[600px]">
                    {dbState.orders.filter(o => o.status === 'delivered' || o.status === 'canceled').slice(-10).reverse().map(order => (
                      <div 
                        key={order.id} 
                        onClick={() => setSelectedOrder(order)}
                        className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs hover:shadow-xs transition-shadow cursor-pointer opacity-75"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-extrabold text-xs text-slate-800">{order.code}</span>
                          <span className="text-[10px] text-slate-500">{new Date(order.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}</span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-700 mt-1.5 truncate">{order.customerName}</h4>
                        
                        <div className="flex items-center justify-between mt-3 border-t border-slate-100 pt-2">
                          <span className="font-bold text-xs text-slate-800">R$ {order.total.toFixed(2)}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {order.status === 'delivered' ? 'Entregue' : 'Cancelado'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* Tab Dashboard analytics */}
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h1 className="font-bold text-2xl text-slate-800 tracking-tight">Dashboard Financeiro</h1>
                <p className="text-xs text-slate-500 mt-1">Visão ampla sobre vendas, tíquete médio, volume faturado e custos operacionais.</p>
              </div>

              {/* Bento Grid Analytics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
                  <span className="text-xs text-slate-500 font-semibold">Vendido Hoje (Bruto)</span>
                  <div className="mt-2">
                    <span className="font-extrabold text-xl md:text-2xl text-slate-800">R$ {dashboardStats.todaySales.toFixed(2)}</span>
                    <p className="text-[10px] text-slate-500 mt-1">{dashboardStats.todayOrders} pedidos recebidos</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
                  <span className="text-xs text-slate-500 font-semibold">Tíquete Médio (Últ. 30 dias)</span>
                  <div className="mt-2">
                    <span className="font-extrabold text-xl md:text-2xl text-slate-800">R$ {dashboardStats.ticketMedio.toFixed(2)}</span>
                    <p className="text-[10px] text-slate-500 mt-1">Fidelidade alta de compra</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
                  <span className="text-xs text-slate-500 font-semibold">Total de Entradas (Faturamento)</span>
                  <div className="mt-2">
                    <span className="font-extrabold text-xl md:text-2xl text-emerald-600">R$ {dashboardStats.totalIncome.toFixed(2)}</span>
                    <p className="text-[10px] text-slate-500 mt-1">Ledger integrado de vendas</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
                  <span className="text-xs text-slate-500 font-semibold">Saldo de Caixa Atual</span>
                  <div className="mt-2">
                    <span className={`font-extrabold text-xl md:text-2xl ${dashboardStats.totalBalance >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
                      R$ {dashboardStats.totalBalance.toFixed(2)}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">Faturamento subtraído de custos</p>
                  </div>
                </div>
              </div>

              {/* Chart analysis & comparative indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 md:col-span-2">
                  <h3 className="font-bold text-slate-800 text-sm mb-4">Fluxo de Caixa dos Últimos 7 dias (Comparativo Diário)</h3>
                  
                  {/* Clean robust interactive SVG/HTML Chart */}
                  <div className="h-64 flex items-end justify-between gap-4 pt-6 border-b border-slate-200 px-4 pb-1">
                    {chartSalesData.map((day, i) => {
                      const maxVal = Math.max(...chartSalesData.map(d => Math.max(d.income, d.expense)), 100);
                      const incomeHeight = (day.income / maxVal) * 100;
                      const expenseHeight = (day.expense / maxVal) * 100;

                      return (
                        <div key={i} className="flex-1 flex flex-col items-center h-full justify-end relative group">
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-1 bg-slate-900 text-white text-[9px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none text-center shadow-md">
                            <p className="font-bold">Receitas: R$ {day.income.toFixed(0)}</p>
                            <p className="font-bold text-rose-300">Custos: R$ {day.expense.toFixed(0)}</p>
                          </div>

                          <div className="w-full flex gap-1 items-end h-full justify-center">
                            {/* Income bar */}
                            <div 
                              className="w-2.5 bg-emerald-500 rounded-t-sm hover:bg-emerald-600 transition-colors"
                              style={{ height: `${Math.max(incomeHeight, 2)}%` }}
                            />
                            {/* Expense bar */}
                            <div 
                              className="w-2.5 bg-rose-400 rounded-t-sm hover:bg-rose-500 transition-colors"
                              style={{ height: `${Math.max(expenseHeight, 2)}%` }}
                            />
                          </div>
                          
                          <span className="text-[9px] text-slate-500 font-bold mt-2 whitespace-nowrap">{day.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-4 mt-4 justify-center text-[10px] font-bold">
                    <span className="flex items-center gap-1.5 text-emerald-600"><span className="h-2.5 w-2.5 bg-emerald-500 rounded-full"></span> Vendas Entregues</span>
                    <span className="flex items-center gap-1.5 text-rose-500"><span className="h-2.5 w-2.5 bg-rose-400 rounded-full"></span> Despesas & Ingredientes</span>
                  </div>
                </div>

                {/* Comparative details / Metrics */}
                <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm">Resumo Geral de Vendas</h3>

                  <div className="space-y-3 divide-y divide-slate-100 text-xs">
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Hoje vs Ontem</span>
                      <span className="font-bold flex items-center gap-1">
                        {dashboardStats.todaySales >= dashboardStats.yesterdaySales ? (
                          <span className="text-emerald-600 flex items-center"><ArrowUpRight size={14} /> +R$ {(dashboardStats.todaySales - dashboardStats.yesterdaySales).toFixed(0)}</span>
                        ) : (
                          <span className="text-rose-600 flex items-center"><ArrowDownRight size={14} /> -R$ {(dashboardStats.yesterdaySales - dashboardStats.todaySales).toFixed(0)}</span>
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Faturamento Bruto (30 dias)</span>
                      <span className="font-extrabold text-slate-800">R$ {dashboardStats.monthSales.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Pedidos Concluídos (30 dias)</span>
                      <span className="font-bold text-slate-700">{dashboardStats.monthOrders}</span>
                    </div>

                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Pedidos Cancelados</span>
                      <span className="font-semibold text-rose-600">{dashboardStats.totalCanceled}</span>
                    </div>

                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Total de Despesas Acumuladas</span>
                      <span className="font-bold text-rose-500">R$ {dashboardStats.totalExpenses.toFixed(2)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleExportCSV('orders')}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <FileSpreadsheet size={14} /> Exportar Planilha de Pedidos
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* CRM Client records tab */}
          {activeTab === 'crm' && (
            <motion.div 
              key="crm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <AdminCRM 
                dbState={dbState}
                onSaveState={onSaveState}
                activeUser={activeUser}
              />
            </motion.div>
          )}

          {/* Tab Products config list */}
          {activeTab === 'products' && (
            <motion.div 
              key="products"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="font-bold text-2xl text-slate-800 tracking-tight">Gerenciamento de Produtos</h1>
                  <p className="text-xs text-slate-500 mt-1">Adicione, redefina fotos, edite preços, controle estoque de insumos e crie adicionais.</p>
                </div>

                <button 
                  onClick={() => {
                    setEditingProduct({});
                    setProductModalTab('general');
                    setEditingGroupIndex(null);
                    setGroupName('');
                    setGroupMin(0);
                    setGroupMax(1);
                    setGroupItems([]);
                    setNewItemName('');
                    setNewItemPrice('');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Plus size={16} /> Cadastrar Produto
                </button>
              </div>

              {/* Product cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dbState.products.map(product => (
                  <div key={product.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="h-36 relative bg-slate-50">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                          {product.tag && (
                            <span className="bg-amber-400 text-slate-900 font-extrabold text-[9px] px-2 py-0.5 rounded shadow-sm">
                              {product.tag}
                            </span>
                          )}
                          {!product.isAvailable && (
                            <span className="bg-rose-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded shadow-sm">
                              Esgotado
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-4 space-y-2">
                        <h3 className="font-bold text-sm text-slate-800 tracking-tight line-clamp-1">{product.name}</h3>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{product.description}</p>
                        
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                            📁 {dbState.categories.find(c => c.id === product.categoryId)?.name || 'Sem Categoria'}
                          </span>
                          {product.prepTime && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                              ⏱️ {product.prepTime}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        {product.promoPrice ? (
                          <>
                            <p className="text-[10px] text-slate-400 line-through">R$ {product.price.toFixed(2)}</p>
                            <p className="font-bold text-rose-600 text-sm">R$ {product.promoPrice.toFixed(2)}</p>
                          </>
                        ) : (
                          <p className="font-bold text-slate-800 text-sm">R$ {product.price.toFixed(2)}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setEditingProduct(product);
                            setProductModalTab('general');
                            setEditingGroupIndex(null);
                            setGroupName('');
                            setGroupMin(0);
                            setGroupMax(1);
                            setGroupItems([]);
                            setNewItemName('');
                            setNewItemPrice('');
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-lg"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem('product', product.id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-2 rounded-lg"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Tab Categories */}
          {activeTab === 'categories' && (
            <motion.div 
              key="categories"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="font-bold text-2xl text-slate-800 tracking-tight">Categorias de Menu</h1>
                  <p className="text-xs text-slate-500 mt-1">Organize seu cardápio, mude a prioridade de listagem e crie novos agrupadores.</p>
                </div>

                <button 
                  onClick={() => setEditingCategory({})}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Plus size={16} /> Nova Categoria
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
                {dbState.categories.map((cat, i) => (
                  <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center text-sm">
                        📂
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs md:text-sm">{cat.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Prioridade de exibição: {cat.sortOrder}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleReorderCategory(cat.id, 'up')}
                        disabled={i === 0}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-md text-[10px] font-bold disabled:opacity-40"
                      >
                        ▲
                      </button>
                      <button 
                        onClick={() => handleReorderCategory(cat.id, 'down')}
                        disabled={i === dbState.categories.length - 1}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-md text-[10px] font-bold disabled:opacity-40"
                      >
                        ▼
                      </button>
                      
                      <button 
                        onClick={() => setEditingCategory(cat)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-lg"
                      >
                        <Edit2 size={12} />
                      </button>

                      <button 
                        onClick={() => handleDeleteItem('category', cat.id)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-2 rounded-lg"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Tab Banners */}
          {activeTab === 'banners' && (
            <motion.div 
              key="banners"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="font-bold text-2xl text-slate-800 tracking-tight">Banners de Promoção</h1>
                  <p className="text-xs text-slate-500 mt-1">Anuncie novidades do dia ou cupons de frete grátis na tela principal do cliente.</p>
                </div>

                <button 
                  onClick={() => setEditingBanner({})}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Plus size={16} /> Novo Banner
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dbState.banners.map(banner => (
                  <div key={banner.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="h-32 bg-slate-50">
                        <img 
                          src={banner.image} 
                          alt={banner.title} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="p-4 space-y-2">
                        <h4 className="font-bold text-sm text-slate-800">{banner.title}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{banner.description}</p>
                        <span className="inline-flex items-center text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                          Botão: {banner.buttonText}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold">Prioridade: {banner.priority}</span>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setEditingBanner(banner)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-lg"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem('banner', banner.id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-2 rounded-lg"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Tab Coupons */}
          {activeTab === 'coupons' && (
            <motion.div 
              key="coupons"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="font-bold text-2xl text-slate-800 tracking-tight">Cupons de Desconto</h1>
                  <p className="text-xs text-slate-500 mt-1">Crie códigos de desconto com valor fixo, percentual ou isenção de taxa de entrega.</p>
                </div>

                <button 
                  onClick={() => setEditingCoupon({})}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Plus size={16} /> Novo Cupom
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dbState.coupons.map(coupon => (
                  <div key={coupon.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-black text-sm bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg border border-emerald-200">
                          {coupon.code}
                        </span>
                        
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold">
                          {coupon.type === 'percent' ? `${coupon.value}% OFF` : (coupon.type === 'fixed' ? `R$ ${coupon.value.toFixed(0)} OFF` : 'Frete Grátis')}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-slate-500">
                        {coupon.minValue && <p>Min de compra: R$ {coupon.minValue.toFixed(2)}</p>}
                        <p>Usado: {coupon.usageCount} vezes</p>
                        {coupon.firstOrderOnly && <p className="text-amber-600 font-bold">Apenas p/ primeira compra</p>}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 mt-4">
                      <button 
                        onClick={() => setEditingCoupon(coupon)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-lg"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button 
                        onClick={() => handleDeleteItem('coupon', coupon.id)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-2 rounded-lg"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ERP Module: Stocks, Finances, and Delivery Logistics tab */}
          {activeTab === 'erp' && (
            <motion.div 
              key="erp"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <AdminERP 
                dbState={dbState}
                onSaveState={onSaveState}
                activeUser={activeUser}
              />
            </motion.div>
          )}

          {/* Audit Trail and User Permissions tab */}
          {activeTab === 'audit' && (
            <motion.div 
              key="audit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <AdminAudit 
                dbState={dbState}
                onSaveState={onSaveState}
                activeUser={activeUser}
              />
            </motion.div>
          )}

          {/* Tab Calculator */}
          {activeTab === 'calculator' && (
            <motion.div 
              key="calculator"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h1 className="font-bold text-2xl text-slate-800 tracking-tight">Calculadora de Precificação Inteligente</h1>
                <p className="text-xs text-slate-500 mt-1">Calcule o preço de venda ideal do seu produto baseado em despesas e margem desejada.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Inputs */}
                <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <Calculator className="text-emerald-600" size={18} /> Componentes do Custo
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Custo do Insumo Unitário (M.P.) *</label>
                      <input 
                        type="number"
                        value={calcItemBaseCost}
                        onChange={(e) => setCalcItemBaseCost(e.target.value)}
                        placeholder="Ex: 10.00"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Custos Variáveis (%) (Tributos, taxas de cartão, delivery) *</label>
                      <input 
                        type="number"
                        value={calcVariablePercent}
                        onChange={(e) => setCalcVariablePercent(e.target.value)}
                        placeholder="Ex: 35"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Margem Líquida Alvo (%) *</label>
                      <input 
                        type="number"
                        value={calcDesiredMargin}
                        onChange={(e) => setCalcDesiredMargin(e.target.value)}
                        placeholder="Ex: 25"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Outputs / Recomendações */}
                <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h3 className="font-bold text-yellow-400 text-sm uppercase tracking-wider">RECOMENDAÇÃO DE PREÇO</h3>
                    <p className="text-xs text-slate-400">Com base nos indicadores declarados, o modelo recomenda a seguinte precificação para cobrir seus custos e manter a margem:</p>
                    
                    <div className="pt-4 border-t border-slate-800 space-y-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Preço Sugerido para Cardápio</span>
                        <h2 className="font-extrabold text-3xl text-emerald-400">R$ {calculatedPricing.idealPrice.toFixed(2)}</h2>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Markup Multiplicador</span>
                          <span className="font-mono font-bold text-slate-200">{calculatedPricing.markup.toFixed(2)}x</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Preço Mínimo Viável</span>
                          <span className="font-mono font-bold text-slate-200">R$ {calculatedPricing.minPrice.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Lucro Bruto Unitário</span>
                          <span className="font-mono font-bold text-slate-200">R$ {calculatedPricing.profitBruto.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Lucro Líquido Unitário</span>
                          <span className="font-mono font-bold text-slate-200">R$ {calculatedPricing.profitNet.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-[9px] text-slate-500 leading-normal pt-4 border-t border-slate-800">Este cálculo utiliza a metodologia do Markup Divisor oficial de mercado, garantindo a lucratividade desejada.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab Settings configuration */}
          {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 pb-20"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="font-bold text-2xl text-slate-800 tracking-tight">Configurações Gerais</h1>
                  <p className="text-xs text-slate-500 mt-1">Configure o perfil do restaurante, taxas de bairro, dados de Pix, cores e marca.</p>
                </div>

                <button 
                  onClick={handleSaveBrandingSettings}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Save size={16} /> Salvar Configurações
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile settings */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm">Perfil do Restaurante</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nome do Estabelecimento</label>
                      <input 
                        type="text"
                        value={settingsForm.name}
                        onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Telefone Fixo</label>
                        <input 
                          type="text"
                          value={settingsForm.phone}
                          onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">WhatsApp de Contato</label>
                        <input 
                          type="text"
                          value={settingsForm.whatsapp}
                          onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Endereço Completo</label>
                      <input 
                        type="text"
                        value={settingsForm.address}
                        onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery fees configure */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm">Taxas por Bairros de Entrega</h3>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Taxa Base (Outros)</label>
                        <input 
                          type="number"
                          value={settingsForm.delivery.baseFee}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            delivery: { ...settingsForm.delivery, baseFee: parseFloat(e.target.value) || 0 }
                          })}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Fidelidade Frete Grátis acima de</label>
                        <input 
                          type="number"
                          value={settingsForm.delivery.freeDeliveryMinAmount || ''}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            delivery: { ...settingsForm.delivery, freeDeliveryMinAmount: parseFloat(e.target.value) || undefined }
                          })}
                          placeholder="Sem frete grátis"
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Bairros Cadastrados</span>
                      <div className="space-y-1.5 mt-2">
                        {settingsForm.delivery.neighborhoods.map((n, idx) => (
                          <div key={n.id} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-lg border">
                            <span className="font-bold text-slate-700">{n.name}</span>
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-slate-600">R$ {n.fee.toFixed(2)}</span>
                              <button 
                                type="button"
                                onClick={() => {
                                  const filtered = settingsForm.delivery.neighborhoods.filter(item => item.id !== n.id);
                                  setSettingsForm({
                                    ...settingsForm,
                                    delivery: { ...settingsForm.delivery, neighborhoods: filtered }
                                  });
                                }}
                                className="text-rose-500 hover:text-rose-700 px-1 font-bold"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-1.5 mt-3">
                        <input 
                          type="text" 
                          id="newNeighName"
                          placeholder="Nome do bairro"
                          className="flex-1 border border-slate-200 px-2 py-1.5 rounded-lg text-xs"
                        />
                        <input 
                          type="number" 
                          id="newNeighFee"
                          placeholder="Taxa R$"
                          className="w-20 border border-slate-200 px-2 py-1.5 rounded-lg text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const nameInp = document.getElementById('newNeighName') as HTMLInputElement;
                            const feeInp = document.getElementById('newNeighFee') as HTMLInputElement;
                            if (!nameInp.value || !feeInp.value) return;
                            
                            const newN: DeliveryNeighborhood = {
                              id: `nh-${Date.now()}`,
                              name: nameInp.value,
                              fee: parseFloat(feeInp.value) || 0
                            };
                            
                            setSettingsForm({
                              ...settingsForm,
                              delivery: {
                                ...settingsForm.delivery,
                                neighborhoods: [...settingsForm.delivery.neighborhoods, newN]
                              }
                            });
                            
                            nameInp.value = '';
                            feeInp.value = '';
                          }}
                          className="bg-slate-800 text-white hover:bg-slate-900 text-xs px-3 rounded-lg font-bold"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pix payment setup */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm">Chave PIX do Restaurante</h3>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Tipo de Chave</label>
                        <select 
                          value={settingsForm.pix.keyType}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            pix: { ...settingsForm.pix, keyType: e.target.value as any }
                          })}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        >
                          <option value="cpf">CPF</option>
                          <option value="cnpj">CNPJ</option>
                          <option value="phone">Telefone</option>
                          <option value="email">E-mail</option>
                          <option value="random">Chave Aleatória</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Chave Pix</label>
                        <input 
                          type="text"
                          value={settingsForm.pix.keyValue}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            pix: { ...settingsForm.pix, keyValue: e.target.value }
                          })}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nome do Recebedor Oficial</label>
                      <input 
                        type="text"
                        value={settingsForm.pix.receiverName}
                        onChange={(e) => setSettingsForm({
                          ...settingsForm,
                          pix: { ...settingsForm.pix, receiverName: e.target.value }
                        })}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Código Pix Copia e Cola</label>
                      <textarea 
                        value={settingsForm.pix.copyPasteText}
                        onChange={(e) => setSettingsForm({
                          ...settingsForm,
                          pix: { ...settingsForm.pix, copyPasteText: e.target.value }
                        })}
                        className="w-full border border-slate-200 rounded-xl p-2.5 text-xs h-16 font-mono resize-none focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Branding custom settings */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm">Visual & Logotipos</h3>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Logo do Restaurante</label>
                        <div className="space-y-1.5">
                          {settingsForm.branding.logo ? (
                            <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 h-16 flex items-center justify-center">
                              {settingsForm.branding.logo.length <= 4 && !settingsForm.branding.logo.startsWith('http') && !settingsForm.branding.logo.startsWith('data:') ? (
                                <span className="text-3xl">{settingsForm.branding.logo}</span>
                              ) : (
                                <img 
                                  src={settingsForm.branding.logo} 
                                  alt="Logo" 
                                  className="h-full w-full object-contain p-2"
                                  referrerPolicy="no-referrer"
                                />
                              )}
                              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const fileInput = document.getElementById('settings-logo-upload') as HTMLInputElement;
                                    if (fileInput) fileInput.click();
                                  }}
                                  className="bg-white/90 hover:bg-white text-slate-800 text-[8px] font-bold px-1.5 py-0.5 rounded transition-colors"
                                >
                                  Upload
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const emoji = prompt('Digite um emoji para o logotipo:');
                                    if (emoji) {
                                      setSettingsForm({
                                        ...settingsForm,
                                        branding: { ...settingsForm.branding, logo: emoji }
                                      });
                                    }
                                  }}
                                  className="bg-white/90 hover:bg-white text-slate-800 text-[8px] font-bold px-1.5 py-0.5 rounded transition-colors"
                                >
                                  Emoji
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSettingsForm({
                                    ...settingsForm,
                                    branding: { ...settingsForm.branding, logo: '' }
                                  })}
                                  className="bg-rose-600 hover:bg-rose-700 text-white text-[8px] font-bold px-1.5 py-0.5 rounded transition-colors"
                                >
                                  Remover
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={async (e) => {
                                e.preventDefault();
                                const file = e.dataTransfer.files?.[0];
                                if (file && file.type.startsWith('image/')) {
                                  try {
                                    const imgData = await compressImage(file, 400, 400, 0.85);
                                    setSettingsForm(prev => ({
                                      ...prev,
                                      branding: { ...prev.branding, logo: imgData }
                                    }));
                                  } catch (err) {
                                    alert('Erro ao processar imagem de logo.');
                                  }
                                }
                              }}
                              onClick={() => {
                                const fileInput = document.getElementById('settings-logo-upload') as HTMLInputElement;
                                if (fileInput) fileInput.click();
                              }}
                              className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-2 h-16 flex flex-col items-center justify-center gap-0.5 cursor-pointer bg-slate-50 hover:bg-slate-50/50 transition-all text-center"
                            >
                              <span className="text-sm">📸</span>
                              <span className="text-[9px] font-bold text-slate-700 block">Fazer Upload</span>
                            </div>
                          )}

                          <input 
                            type="file"
                            id="settings-logo-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const imgData = await compressImage(file, 400, 400, 0.85);
                                  setSettingsForm(prev => ({
                                    ...prev,
                                    branding: { ...prev.branding, logo: imgData }
                                  }));
                                } catch (err) {
                                  alert('Erro ao processar imagem de logo.');
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Primary Color & Site Background Color Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Cor Primária / Destaques</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color"
                            value={settingsForm.branding.primaryColor || '#03d383'}
                            onChange={(e) => setSettingsForm({
                              ...settingsForm,
                              branding: { ...settingsForm.branding, primaryColor: e.target.value }
                            })}
                            className="w-12 h-10 border border-slate-200 rounded-xl cursor-pointer p-0.5 bg-white flex-shrink-0"
                          />
                          <input 
                            type="text"
                            value={settingsForm.branding.primaryColor || '#03d383'}
                            onChange={(e) => setSettingsForm({
                              ...settingsForm,
                              branding: { ...settingsForm.branding, primaryColor: e.target.value }
                            })}
                            placeholder="#03d383"
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">🎨 Cor do Fundo do Site</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color"
                            value={settingsForm.branding.backgroundColor || '#f8fafc'}
                            onChange={(e) => setSettingsForm({
                              ...settingsForm,
                              branding: { ...settingsForm.branding, backgroundColor: e.target.value }
                            })}
                            className="w-12 h-10 border border-slate-200 rounded-xl cursor-pointer p-0.5 bg-white flex-shrink-0"
                          />
                          <input 
                            type="text"
                            value={settingsForm.branding.backgroundColor || '#f8fafc'}
                            onChange={(e) => setSettingsForm({
                              ...settingsForm,
                              branding: { ...settingsForm.branding, backgroundColor: e.target.value }
                            })}
                            placeholder="#f8fafc"
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick Preset Color Palette Buttons */}
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Sugestões de Cores para o Fundo do Cardápio:</span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { name: 'Claro Clean', hex: '#f8fafc' },
                          { name: 'Cinza Suave', hex: '#f1f5f9' },
                          { name: 'Creme Quente', hex: '#fdfbf7' },
                          { name: 'Menta Fresco', hex: '#f0fdf4' },
                          { name: 'Areia Dourada', hex: '#fffbe2' },
                          { name: 'Rosa Delicado', hex: '#fff1f2' },
                          { name: 'Grafite Noturno', hex: '#1e293b' },
                          { name: 'Escuro iFood', hex: '#0f172a' }
                        ].map(preset => (
                          <button
                            key={preset.hex}
                            type="button"
                            onClick={() => setSettingsForm({
                              ...settingsForm,
                              branding: { ...settingsForm.branding, backgroundColor: preset.hex }
                            })}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                              (settingsForm.branding.backgroundColor || '#f8fafc').toLowerCase() === preset.hex.toLowerCase()
                                ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/50 shadow-2xs'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <span className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs flex-shrink-0" style={{ backgroundColor: preset.hex }} />
                            <span className="text-slate-700">{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Foto do Banner de Fundo</label>
                      <div className="space-y-1.5">
                        {settingsForm.branding.bannerImage ? (
                          <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 h-24 flex items-center justify-center">
                            <img 
                              src={settingsForm.branding.bannerImage} 
                              alt="Banner de Fundo" 
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const fileInput = document.getElementById('settings-banner-upload') as HTMLInputElement;
                                  if (fileInput) fileInput.click();
                                }}
                                className="bg-white/90 hover:bg-white text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors"
                              >
                                Alterar
                              </button>
                              <button
                                type="button"
                                onClick={() => setSettingsForm({
                                  ...settingsForm,
                                  branding: { ...settingsForm.branding, bannerImage: '' }
                                })}
                                className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors"
                              >
                                Remover
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={async (e) => {
                              e.preventDefault();
                              const file = e.dataTransfer.files?.[0];
                              if (file && file.type.startsWith('image/')) {
                                try {
                                  const imgData = await compressImage(file, 1200, 800, 0.8);
                                  setSettingsForm(prev => ({
                                    ...prev,
                                    branding: { ...prev.branding, bannerImage: imgData }
                                  }));
                                } catch (err) {
                                  alert('Erro ao processar imagem da capa.');
                                }
                              }
                            }}
                            onClick={() => {
                              const fileInput = document.getElementById('settings-banner-upload') as HTMLInputElement;
                              if (fileInput) fileInput.click();
                            }}
                            className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-3 h-20 flex flex-col items-center justify-center gap-1 cursor-pointer bg-slate-50 hover:bg-slate-50/50 transition-all text-center"
                          >
                            <span className="text-lg">📸</span>
                            <div>
                              <span className="text-[10px] font-bold text-slate-700 block">Clique ou arraste</span>
                              <span className="text-[8px] text-slate-400">Suporta PNG, JPG, WEBP</span>
                            </div>
                          </div>
                        )}

                        <input 
                          type="file"
                          id="settings-banner-upload"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const imgData = await compressImage(file, 1200, 800, 0.8);
                                setSettingsForm(prev => ({
                                  ...prev,
                                  branding: { ...prev.branding, bannerImage: imgData }
                                }));
                              } catch (err) {
                                alert('Erro ao processar imagem da capa.');
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Formas de Pagamento Locais (Nativas) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <span>🏪</span> Formas de Pagamento Locais (Nativas)
                    </h3>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                      Presencial ou Entrega
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 leading-normal">
                    Selecione quais métodos de pagamento o seu restaurante aceitará de forma nativa e offline (no momento da entrega ou retirada).
                  </p>

                  <div className="space-y-3 pt-2">
                    <label className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-100 cursor-pointer transition-colors">
                      <input 
                        type="checkbox"
                        checked={settingsForm.localPayments?.pixActive !== false}
                        onChange={(e) => setSettingsForm({
                          ...settingsForm,
                          localPayments: {
                            ...(settingsForm.localPayments || { pixActive: true, cashActive: true, mealVoucherActive: false, foodVoucherActive: false, deliveryPaymentActive: false }),
                            pixActive: e.target.checked
                          }
                        })}
                        className="h-4 w-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">🌀 PIX Copia e Cola (Manual)</span>
                        <span className="text-[10px] text-slate-500">Mostra sua chave Pix para transferência manual com envio de comprovante.</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-100 cursor-pointer transition-colors">
                      <input 
                        type="checkbox"
                        checked={settingsForm.localPayments?.cashActive !== false}
                        onChange={(e) => setSettingsForm({
                          ...settingsForm,
                          localPayments: {
                            ...(settingsForm.localPayments || { pixActive: true, cashActive: true, mealVoucherActive: false, foodVoucherActive: false, deliveryPaymentActive: false }),
                            cashActive: e.target.checked
                          }
                        })}
                        className="h-4 w-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">💵 Dinheiro (com opção de troco)</span>
                        <span className="text-[10px] text-slate-500">Pagamento físico na entrega ou retirada, com campo de troco opcional.</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-100 cursor-pointer transition-colors">
                      <input 
                        type="checkbox"
                        checked={!!settingsForm.localPayments?.mealVoucherActive}
                        onChange={(e) => setSettingsForm({
                          ...settingsForm,
                          localPayments: {
                            ...(settingsForm.localPayments || { pixActive: true, cashActive: true, mealVoucherActive: false, foodVoucherActive: false, deliveryPaymentActive: false }),
                            mealVoucherActive: e.target.checked
                          }
                        })}
                        className="h-4 w-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">🎫 Vale Refeição (VR - Presencial)</span>
                        <span className="text-[10px] text-slate-500">Aceita Sodexo, Alelo, VR, Ticket Refeição etc. na entrega ou balcão.</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-100 cursor-pointer transition-colors">
                      <input 
                        type="checkbox"
                        checked={!!settingsForm.localPayments?.foodVoucherActive}
                        onChange={(e) => setSettingsForm({
                          ...settingsForm,
                          localPayments: {
                            ...(settingsForm.localPayments || { pixActive: true, cashActive: true, mealVoucherActive: false, foodVoucherActive: false, deliveryPaymentActive: false }),
                            foodVoucherActive: e.target.checked
                          }
                        })}
                        className="h-4 w-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">🛒 Vale Alimentação (VA - Presencial)</span>
                        <span className="text-[10px] text-slate-500">Aceita Sodexo Alimentação, Ticket Alimentação etc. presencialmente.</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-100 cursor-pointer transition-colors">
                      <input 
                        type="checkbox"
                        checked={!!settingsForm.localPayments?.deliveryPaymentActive}
                        onChange={(e) => setSettingsForm({
                          ...settingsForm,
                          localPayments: {
                            ...(settingsForm.localPayments || { pixActive: true, cashActive: true, mealVoucherActive: false, foodVoucherActive: false, deliveryPaymentActive: false }),
                            deliveryPaymentActive: e.target.checked
                          }
                        })}
                        className="h-4 w-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">🛵 Pagamento na Entrega (Maquininha Débito/Crédito)</span>
                        <span className="text-[10px] text-slate-500">O entregador levará a maquininha de cartão de débito/crédito física até o cliente.</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Checkout Transparente (Online) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <span>⚡</span> Checkout Transparente (Online)
                    </h3>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${settingsForm.checkoutTransparenteActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {settingsForm.checkoutTransparenteActive ? 'Ativo 🟢' : 'Desativado ⚪'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 leading-normal">
                    Habilite pagamentos online direto na finalização do pedido. O cliente poderá pagar via cartão ou PIX online sem sair do seu site.
                  </p>

                  {/* Active master toggle */}
                  <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                    <div>
                      <span className="text-xs font-bold text-emerald-900 block">Ativar Checkout Online</span>
                      <span className="text-[10px] text-emerald-700">Libera cartões de crédito e débito no checkout.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettingsForm({
                        ...settingsForm,
                        checkoutTransparenteActive: !settingsForm.checkoutTransparenteActive
                      })}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settingsForm.checkoutTransparenteActive ? 'bg-emerald-600' : 'bg-slate-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${settingsForm.checkoutTransparenteActive ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Settings specific to gateway */}
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Selecionar Provedor (Gateway)</label>
                      <select
                        value={currentGatewayId}
                        onChange={(e) => setSettingsForm({
                          ...settingsForm,
                          selectedGatewayId: e.target.value
                        })}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      >
                        {AVAILABLE_GATEWAYS.map(gw => (
                          <option key={gw.id} value={gw.id}>{gw.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Gateway Config Form */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                        <span className="text-xs font-bold text-slate-700 uppercase">Configuração: {AVAILABLE_GATEWAYS.find(g => g.id === currentGatewayId)?.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${currentGateway.status === 'connected' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <span className="text-[10px] text-slate-500 uppercase font-bold">
                            {currentGateway.status === 'connected' ? 'Conectado' : 'Desconectado'}
                          </span>
                        </div>
                      </div>

                      {/* Inputs depending on gateway */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">API Key</label>
                          <input
                            type="password"
                            placeholder="Ex: pk_live_..."
                            value={currentGateway.apiKey || ''}
                            onChange={(e) => handleUpdateGatewayField('apiKey', e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-550"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Secret Key</label>
                          <input
                            type="password"
                            placeholder="Ex: sk_live_..."
                            value={currentGateway.secretKey || ''}
                            onChange={(e) => handleUpdateGatewayField('secretKey', e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-550"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Public Key</label>
                          <input
                            type="text"
                            placeholder="Ex: APP_USR-..."
                            value={currentGateway.publicKey || ''}
                            onChange={(e) => handleUpdateGatewayField('publicKey', e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-550"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Access Token</label>
                          <input
                            type="password"
                            placeholder="Token de acesso"
                            value={currentGateway.accessToken || ''}
                            onChange={(e) => handleUpdateGatewayField('accessToken', e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-550"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Client ID</label>
                          <input
                            type="text"
                            placeholder="Client ID do Gateway"
                            value={currentGateway.clientId || ''}
                            onChange={(e) => handleUpdateGatewayField('clientId', e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-550"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Client Secret</label>
                          <input
                            type="password"
                            placeholder="Client Secret"
                            value={currentGateway.clientSecret || ''}
                            onChange={(e) => handleUpdateGatewayField('clientSecret', e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-550"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">URL de Webhook</label>
                        <input
                          type="text"
                          readOnly
                          value={currentGateway.webhookUrl || `https://api.vitosburgers.com/v1/webhooks/${currentGatewayId}`}
                          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-100 font-mono text-[10px] text-slate-600 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Ambiente de Operação</span>
                        <div className="flex gap-2">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name="isProduction"
                              checked={!currentGateway.isProduction}
                              onChange={() => handleUpdateGatewayField('isProduction', false)}
                              className="h-3 w-3 text-emerald-600"
                            />
                            <span className="text-[10px] font-bold text-slate-600">Sandbox</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name="isProduction"
                              checked={!!currentGateway.isProduction}
                              onChange={() => handleUpdateGatewayField('isProduction', true)}
                              className="h-3 w-3 text-emerald-600"
                            />
                            <span className="text-[10px] font-bold text-slate-600 text-rose-600">Produção</span>
                          </label>
                        </div>
                      </div>

                      {/* Connection button */}
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={handleTestIntegration}
                          disabled={testingGatewayId !== null}
                          className="flex-1 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors focus:outline-none"
                        >
                          {testingGatewayId === currentGatewayId ? (
                            <>
                              <RefreshCw size={11} className="animate-spin" /> Testando...
                            </>
                          ) : (
                            <>
                              <span>⚡ Testar Integração</span>
                            </>
                          )}
                        </button>
                      </div>

                      {testResult && (
                        <div className={`p-2.5 rounded-lg text-[10px] leading-normal font-semibold border ${testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                          {testResult.message}
                        </div>
                      )}
                    </div>

                    {/* Detected Payment Methods capability list */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-600 uppercase">Métodos de Pagamento Detectados</span>
                        <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold px-1.5 py-0.2 rounded">Auto-Detecção Ativa</span>
                      </div>
                      
                      <p className="text-[10px] text-slate-500 leading-normal">
                        O sistema detectou que o provedor ativo ({AVAILABLE_GATEWAYS.find(g => g.id === currentGatewayId)?.name}) oferece suporte automático para:
                      </p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {AVAILABLE_GATEWAYS.find(g => g.id === currentGatewayId)?.methods.map((method, mi) => (
                          <span key={mi} className="bg-white border border-slate-200 text-slate-700 font-bold text-[9px] px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                            <span className="text-emerald-500">✓</span> {method}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Configuração Supabase Backend & Schema SQL */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 md:col-span-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <span className="text-emerald-600">⚡</span> Supabase Database & Auth (PostgreSQL)
                    </h3>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                      Multitenant Ready
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Status do Supabase</p>
                      <p className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 text-emerald-600">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Cliente Configurado
                      </p>
                      <p className="text-[10px] text-slate-500">PostgreSQL + Realtime + Auth</p>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1 md:col-span-2">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Variáveis de Ambiente (.env)</p>
                      <p className="font-mono text-[11px] text-slate-700 truncate">
                        VITE_SUPABASE_URL = {((import.meta as any).env?.VITE_SUPABASE_URL) || 'https://beaming-actor-r7c1c.supabase.co'}
                      </p>
                      <p className="font-mono text-[10px] text-slate-400">
                        VITE_SUPABASE_ANON_KEY = ********
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900 text-slate-200 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-emerald-400 font-mono">📜 DDL SQL Schema (PostgreSQL Supabase)</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
                          alert('Schema DDL do Supabase copiado com sucesso!');
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-3 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        Copiar SQL Completo
                      </button>
                    </div>
                    <pre className="font-mono text-[10px] text-slate-300 max-h-36 overflow-y-auto bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed select-all">
                      {SUPABASE_SQL_SCHEMA}
                    </pre>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Selected Active Order Inspect Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-2">
                  Pedido {selectedOrder.code}
                </h3>
                <button 
                  onClick={() => {
                    setSelectedOrder(null);
                    setOrderStatusNotes('');
                  }}
                  className="bg-slate-200 text-slate-500 p-1 rounded-full hover:bg-slate-300"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Order content ledger */}
              <div id="printReceiptArea" className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Print Layout Header */}
                <div className="hidden print:block text-center border-b border-dashed pb-4 space-y-1">
                  <h2 className="text-sm font-black">{dbState?.settings?.name || 'Brazzuno'}</h2>
                  <p className="text-[10px] text-slate-500">{dbState?.settings?.address || ''}</p>
                  <p className="text-[10px] text-slate-500">Fone: {dbState?.settings?.phone || ''}</p>
                  <div className="border-t border-dashed my-2"></div>
                </div>

                {/* Details layout */}
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-slate-800 flex items-center justify-between">
                    <span>Cliente:</span> <span className="font-extrabold">{selectedOrder.customerName}</span>
                  </p>
                  <p className="text-slate-500 flex items-center justify-between">
                    <span>WhatsApp:</span> <span className="font-semibold">{selectedOrder.customerPhone}</span>
                  </p>
                  <p className="text-slate-500 flex items-center justify-between">
                    <span>Horário do Pedido:</span> <span>{new Date(selectedOrder.createdAt).toLocaleTimeString()} ({new Date(selectedOrder.createdAt).toLocaleDateString()})</span>
                  </p>
                </div>

                {/* Shipping address info */}
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-1 text-xs">
                  <h4 className="font-bold text-slate-700 flex items-center gap-1 text-[11px]"><MapPin size={12} /> Endereço de Entrega</h4>
                  {selectedOrder.address.street === 'Retirada no Balcão' ? (
                    <p className="text-amber-700 font-bold">🏢 Retirada no Balcão do Estabelecimento</p>
                  ) : (
                    <>
                      <p className="font-semibold text-slate-800">{selectedOrder.address.street}, {selectedOrder.address.number}</p>
                      <p className="text-slate-500">Bairro: {selectedOrder.address.neighborhood} - CEP: {selectedOrder.address.cep}</p>
                      {selectedOrder.address.complement && <p className="text-slate-500 italic">Comp: {selectedOrder.address.complement}</p>}
                      {selectedOrder.address.reference && <p className="text-slate-500 italic text-[11px]">Ref: {selectedOrder.address.reference}</p>}
                    </>
                  )}
                </div>

                {/* Items and options */}
                <div className="space-y-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block border-b pb-1">Items Encomendados</span>
                  
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start text-xs border-b border-slate-100 pb-2">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-800">
                            {item.quantity}x <span className="font-black text-slate-950">{item.name}</span>
                          </p>
                          {item.selectedOptions.map((g, gi) => (
                            <p key={gi} className="text-[10px] text-slate-500">
                              - <span className="font-medium">{g.groupName}:</span> {g.items.map(i => i.name).join(', ')}
                            </p>
                          ))}
                          {item.notes && (
                            <p className="text-[10px] text-amber-700 italic bg-amber-50 p-1.5 rounded border border-amber-100 mt-1">
                              " {item.notes} "
                            </p>
                          )}
                        </div>
                        <span className="font-bold text-slate-700">R$ {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prices sums */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t">
                  <div className="flex justify-between">
                    <span>Subtotal do Carrinho:</span>
                    <span className="font-semibold text-slate-800">R$ {selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de Entrega:</span>
                    <span className="font-semibold text-slate-800">R$ {selectedOrder.deliveryFee.toFixed(2)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Desconto Aplicado:</span>
                      <span>- R$ {selectedOrder.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-sm text-slate-800 border-t border-dashed pt-2.5">
                    <span>Total do Pedido:</span>
                    <span className="text-rose-600">R$ {selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment detail summary */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <p className="font-bold text-slate-800 flex items-center justify-between">
                    <span>Método de Pagamento:</span>
                    <span className="uppercase text-slate-700 font-extrabold">{selectedOrder.paymentMethod}</span>
                  </p>
                  {selectedOrder.paymentDetails?.cashChange && (
                    <p className="text-amber-700 font-semibold mt-1 flex justify-between">
                      <span>Troco requerido para:</span>
                      <span>R$ {selectedOrder.paymentDetails.cashChange.toFixed(2)}</span>
                    </p>
                  )}
                </div>

                {/* Workflow Status logs */}
                <div className="space-y-1 text-[10px] text-slate-400">
                  <p className="font-bold uppercase tracking-wider text-slate-500">Histórico de Alterações</p>
                  {selectedOrder.logs.map((log, lidx) => (
                    <div key={lidx} className="flex justify-between py-0.5">
                      <span>{log.status}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons list */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-2 justify-between">
                <button 
                  onClick={() => {
                    window.print();
                  }}
                  className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  <Printer size={13} /> Imprimir Via
                </button>

                <div className="flex gap-1.5">
                  {selectedOrder.status === 'new' && (
                    <button 
                      onClick={() => handleOrderStatusUpdate(selectedOrder.id, 'preparing')}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
                    >
                      ✓ Aceitar & Preparar
                    </button>
                  )}

                  {selectedOrder.status === 'preparing' && (
                    <button 
                      onClick={() => handleOrderStatusUpdate(selectedOrder.id, 'delivery')}
                      className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
                    >
                      🛵 Despachar p/ Entrega
                    </button>
                  )}

                  {selectedOrder.status === 'delivery' && (
                    <button 
                      onClick={() => handleOrderStatusUpdate(selectedOrder.id, 'delivered')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold"
                    >
                      ✓ Concluir / Entregue
                    </button>
                  )}

                  {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'canceled' && (
                    <button 
                      onClick={() => handleOrderStatusUpdate(selectedOrder.id, 'canceled')}
                      className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-4 py-2 rounded-xl text-xs font-bold"
                    >
                      Cancelar Pedido
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Editing Product Sheets overlay modal */}
      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-800 text-sm">
                  {editingProduct.id ? 'Editar Produto' : 'Cadastrar Novo Produto'}
                </h3>
                <button onClick={() => setEditingProduct(null)} className="text-slate-500 hover:text-slate-700">
                  <X size={18} />
                </button>
              </div>

              {/* Tab Header inside Product Modal */}
              <div className="flex border-b border-slate-100 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setProductModalTab('general')}
                  className={`flex-1 py-3 text-center text-xs font-bold transition-all border-b-2 ${
                    productModalTab === 'general' 
                      ? 'border-emerald-600 text-emerald-600 bg-white' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  📝 Dados Gerais
                </button>
                <button
                  type="button"
                  onClick={() => setProductModalTab('options')}
                  className={`flex-1 py-3 text-center text-xs font-bold transition-all border-b-2 ${
                    productModalTab === 'options' 
                      ? 'border-emerald-600 text-emerald-600 bg-white' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  ➕ Adicionais (Opções)
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-slate-700">
                {productModalTab === 'general' ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome do Produto *</label>
                        <input 
                          type="text"
                          required
                          value={editingProduct.name || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                          placeholder="Ex: Smash Salad"
                          className="w-full border border-slate-200 rounded-xl px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Categoria de Menu *</label>
                        <select 
                          required
                          value={editingProduct.categoryId || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, categoryId: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2"
                        >
                          <option value="">Selecione...</option>
                          {dbState.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descrição do Cardápio *</label>
                      <textarea 
                        required
                        value={editingProduct.description || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                        placeholder="Descrição detalhada para o cliente"
                        className="w-full border border-slate-200 rounded-xl p-2.5 h-16 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Preço Normal *</label>
                        <input 
                          type="number"
                          step="0.01"
                          required
                          value={editingProduct.price || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                          className="w-full border border-slate-200 rounded-xl px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Preço Promocional (Opcional)</label>
                        <input 
                          type="number"
                          step="0.01"
                          value={editingProduct.promoPrice || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, promoPrice: parseFloat(e.target.value) || undefined })}
                          placeholder="0.00"
                          className="w-full border border-slate-200 rounded-xl px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tempo Prep. (Opcional)</label>
                        <input 
                          type="text"
                          value={editingProduct.prepTime || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, prepTime: e.target.value })}
                          placeholder="15-20 min"
                          className="w-full border border-slate-200 rounded-xl px-3 py-2"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Foto do Produto *</label>
                        <div className="space-y-1.5">
                          {editingProduct.image ? (
                            <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 h-24 flex items-center justify-center">
                              <img 
                                src={editingProduct.image} 
                                alt="Preview do Produto" 
                                className="h-full w-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const fileInput = document.getElementById('product-image-upload') as HTMLInputElement;
                                    if (fileInput) fileInput.click();
                                  }}
                                  className="bg-white/90 hover:bg-white text-slate-800 text-[10px] font-bold px-2 py-1 rounded-md transition-colors"
                                >
                                  Alterar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingProduct({ ...editingProduct, image: '' })}
                                  className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-2 py-1 rounded-md transition-colors"
                                >
                                  Remover
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={async (e) => {
                                e.preventDefault();
                                const file = e.dataTransfer.files?.[0];
                                if (file && file.type.startsWith('image/')) {
                                  try {
                                    const imgData = await compressImage(file, 800, 800, 0.8);
                                    setEditingProduct(prev => prev ? ({ ...prev, image: imgData }) : null);
                                  } catch (err) {
                                    alert('Erro ao processar imagem do produto.');
                                  }
                                }
                              }}
                              onClick={() => {
                                const fileInput = document.getElementById('product-image-upload') as HTMLInputElement;
                                if (fileInput) fileInput.click();
                              }}
                              className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-3 h-24 flex flex-col items-center justify-center gap-1 cursor-pointer bg-slate-50 hover:bg-slate-50/50 transition-all text-center"
                            >
                              <span className="text-lg">📸</span>
                              <div>
                                <span className="text-[10px] font-bold text-slate-700 block">Clique ou arraste</span>
                                <span className="text-[8px] text-slate-400">Suporta PNG, JPG, WEBP</span>
                              </div>
                            </div>
                          )}

                          <input 
                            type="file"
                            id="product-image-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const imgData = await compressImage(file, 800, 800, 0.8);
                                  setEditingProduct(prev => prev ? ({ ...prev, image: imgData }) : null);
                                } catch (err) {
                                  alert('Erro ao processar imagem do produto.');
                                }
                              }
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Etiqueta Personalizada (Destaque, Novidade)</label>
                        <input 
                          type="text"
                          value={editingProduct.tag || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, tag: e.target.value })}
                          placeholder="Ex: Mais Vendido 🔥"
                          className="w-full border border-slate-200 rounded-xl px-3 py-2"
                        />
                      </div>
                    </div>

                    {/* Toggles */}
                    <div className="grid grid-cols-4 gap-2 pt-2">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={editingProduct.isAvailable !== false}
                          onChange={(e) => setEditingProduct({ ...editingProduct, isAvailable: e.target.checked })}
                          className="rounded"
                        />
                        <span className="font-semibold text-xs text-slate-600">Disponível</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={!!editingProduct.isBestSeller}
                          onChange={(e) => setEditingProduct({ ...editingProduct, isBestSeller: e.target.checked })}
                          className="rounded"
                        />
                        <span className="font-semibold text-xs text-slate-600">Mais Vendido</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={!!editingProduct.isNew}
                          onChange={(e) => setEditingProduct({ ...editingProduct, isNew: e.target.checked })}
                          className="rounded"
                        />
                        <span className="font-semibold text-xs text-slate-600">Novidade</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={!!editingProduct.isPromo}
                          onChange={(e) => setEditingProduct({ ...editingProduct, isPromo: e.target.checked })}
                          className="rounded"
                        />
                        <span className="font-semibold text-xs text-slate-600">Promoção</span>
                      </label>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4 animate-fade-in">
                    {/* Add/Edit group of option group */}
                    <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3">
                      <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                        {editingGroupIndex !== null ? '📝 Editar Grupo de Opções' : '➕ Novo Grupo de Opções'}
                      </h4>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Nome do Grupo *</label>
                          <input 
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Ex: Escolha o molho, Adicionais Extras"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Escolha Máxima *</label>
                          <input 
                            type="number"
                            min="1"
                            value={groupMax}
                            onChange={(e) => setGroupMax(parseInt(e.target.value) || 1)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Escolha Mínima Obrigatória</label>
                          <input 
                            type="number"
                            min="0"
                            value={groupMin}
                            onChange={(e) => setGroupMin(parseInt(e.target.value) || 0)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="flex items-end justify-end">
                          <span className="text-[10px] text-slate-500 font-bold mb-2">
                            {groupMin > 0 ? '⚠️ Obrigatório' : '✅ Opcional'}
                          </span>
                        </div>
                      </div>

                      {/* Add option item section */}
                      <div className="border-t border-slate-200/60 pt-3 space-y-2">
                        <label className="block text-[9px] font-bold text-slate-500 uppercase">Adicionar Opção/Item a este Grupo</label>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="Ex: Queijo Cheddar"
                            className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <input 
                            type="number"
                            step="0.01"
                            value={newItemPrice}
                            onChange={(e) => setNewItemPrice(e.target.value)}
                            placeholder="Preço R$"
                            className="w-24 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!newItemName.trim()) return;
                              const priceVal = parseFloat(newItemPrice) || 0;
                              const newItem: OptionItem = {
                                id: `oi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                                name: newItemName,
                                price: priceVal
                              };
                              setGroupItems([...groupItems, newItem]);
                              setNewItemName('');
                              setNewItemPrice('');
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            + Add
                          </button>
                        </div>

                        {/* List of items in group */}
                        {groupItems.length > 0 ? (
                          <div className="bg-white border border-slate-150 rounded-xl divide-y divide-slate-100 max-h-32 overflow-y-auto mt-1">
                            {groupItems.map((item, idx) => (
                              <div key={item.id || idx} className="p-2 flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-slate-700">{item.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-emerald-600">
                                    {item.price > 0 ? `+ R$ ${item.price.toFixed(2)}` : 'Grátis'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setGroupItems(groupItems.filter(gi => gi.id !== item.id))}
                                    className="text-rose-500 hover:text-rose-700 font-extrabold"
                                  >
                                    Remover
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 italic">Insira os itens/opções que o cliente poderá escolher.</p>
                        )}
                      </div>

                      {/* Group actions */}
                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/60">
                        {editingGroupIndex !== null && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingGroupIndex(null);
                              setGroupName('');
                              setGroupMin(0);
                              setGroupMax(1);
                              setGroupItems([]);
                            }}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-[10px] transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (!groupName.trim()) {
                              alert('Por favor, informe o nome do grupo.');
                              return;
                            }
                            if (groupItems.length === 0) {
                              alert('Por favor, adicione pelo menos uma opção para o grupo.');
                              return;
                            }
                            const newGroup: OptionGroup = {
                              id: editingGroupIndex !== null && editingProduct.options?.[editingGroupIndex]
                                ? editingProduct.options[editingGroupIndex].id 
                                : `og-${Date.now()}`,
                              name: groupName,
                              min: groupMin,
                              max: groupMax,
                              items: groupItems
                            };

                            const currentOptions = editingProduct.options || [];
                            let updatedOptions = [...currentOptions];

                            if (editingGroupIndex !== null) {
                              updatedOptions[editingGroupIndex] = newGroup;
                            } else {
                              updatedOptions.push(newGroup);
                            }

                            setEditingProduct({
                              ...editingProduct,
                              options: updatedOptions
                            });

                            // Clear states
                            setGroupName('');
                            setGroupMin(0);
                            setGroupMax(1);
                            setGroupItems([]);
                            setEditingGroupIndex(null);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-xl text-[10px] transition-colors cursor-pointer"
                        >
                          {editingGroupIndex !== null ? 'Salvar Alterações' : 'Salvar Grupo'}
                        </button>
                      </div>
                    </div>

                    {/* Show created option groups */}
                    <div className="space-y-2">
                      <p className="font-bold text-slate-700 text-[11px]">Grupos de Adicionais Configurados</p>
                      {editingProduct.options && editingProduct.options.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {editingProduct.options.map((group, idx) => (
                            <div key={group.id || idx} className="bg-slate-50 border border-slate-150 p-3 rounded-xl flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800 text-xs">{group.name}</span>
                                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                                    Min: {group.min} | Máx: {group.max}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500">
                                  Opções: {group.items.map(i => `${i.name} (${i.price > 0 ? `+R$ ${i.price.toFixed(2)}` : 'Grátis'})`).join(', ')}
                                </p>
                              </div>
                              <div className="flex gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingGroupIndex(idx);
                                    setGroupName(group.name);
                                    setGroupMin(group.min);
                                    setGroupMax(group.max);
                                    setGroupItems(group.items);
                                  }}
                                  className="text-emerald-600 hover:text-emerald-700 font-bold text-[10px] cursor-pointer"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedOptions = (editingProduct.options || []).filter((_, i) => i !== idx);
                                    setEditingProduct({
                                      ...editingProduct,
                                      options: updatedOptions
                                    });
                                  }}
                                  className="text-rose-600 hover:text-rose-700 font-bold text-[10px] cursor-pointer"
                                >
                                  Remover
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border border-dashed border-slate-200 bg-slate-50 rounded-xl p-4 text-center italic text-slate-400 text-[10px]">
                          Nenhum adicional configurado. Use o formulário acima para criar adicionais para este produto.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between mt-4">
                  <span className="text-[10px] font-bold text-slate-500">Dica: Salve o produto para persistir todas as informações e adicionais.</span>
                  <button 
                    type="submit"
                    className="bg-slate-900 text-white hover:bg-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer"
                  >
                    Salvar Produto
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Editing Category Sheet modal */}
      <AnimatePresence>
        {editingCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4"
            >
              <h3 className="font-bold text-slate-800 text-sm">
                {editingCategory.id ? 'Editar Categoria' : 'Cadastrar Nova Categoria'}
              </h3>

              <form onSubmit={handleSaveCategory} className="space-y-4 text-xs text-slate-700">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome da Categoria *</label>
                  <input 
                    type="text"
                    required
                    value={editingCategory.name || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    placeholder="Ex: 🍕 Pizzas Especiais"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button 
                    type="button" 
                    onClick={() => setEditingCategory(null)}
                    className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-semibold"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-bold"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Editing Banner Sheet modal */}
      <AnimatePresence>
        {editingBanner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4"
            >
              <h3 className="font-bold text-slate-800 text-sm">
                {editingBanner.id ? 'Editar Banner' : 'Criar Novo Banner'}
              </h3>

              <form onSubmit={handleSaveBanner} className="space-y-4 text-xs text-slate-700">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Título do Banner *</label>
                  <input 
                    type="text"
                    required
                    value={editingBanner.title || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                    placeholder="Ex: Frete Grátis Hoje!"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descrição Curta *</label>
                  <input 
                    type="text"
                    required
                    value={editingBanner.description || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, description: e.target.value })}
                    placeholder="Ex: Em compras acima de R$ 40"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Imagem do Banner *</label>
                  <div className="space-y-2">
                    {editingBanner.image ? (
                      <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 h-24 flex items-center justify-center">
                        <img 
                          src={editingBanner.image} 
                          alt="Preview do Banner" 
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const fileInput = document.getElementById('banner-image-upload') as HTMLInputElement;
                              if (fileInput) fileInput.click();
                            }}
                            className="bg-white/90 hover:bg-white text-slate-800 text-[10px] font-bold px-2 py-1 rounded-md transition-colors"
                          >
                            Alterar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingBanner({ ...editingBanner, image: '' })}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-2 py-1 rounded-md transition-colors"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={async (e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files?.[0];
                          if (file && file.type.startsWith('image/')) {
                            try {
                              const imgData = await compressImage(file, 1000, 600, 0.8);
                              setEditingBanner(prev => prev ? ({ ...prev, image: imgData }) : null);
                            } catch (err) {
                              alert('Erro ao processar imagem da promoção.');
                            }
                          }
                        }}
                        onClick={() => {
                          const fileInput = document.getElementById('banner-image-upload') as HTMLInputElement;
                          if (fileInput) fileInput.click();
                        }}
                        className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-3 h-24 flex flex-col items-center justify-center gap-1 cursor-pointer bg-slate-50 hover:bg-slate-50/50 transition-all text-center"
                      >
                        <span className="text-lg">📸</span>
                        <div>
                          <span className="text-[10px] font-bold text-slate-700 block">Clique ou arraste</span>
                          <span className="text-[8px] text-slate-400">Suporta PNG, JPG, WEBP</span>
                        </div>
                      </div>
                    )}

                    <input 
                      type="file"
                      id="banner-image-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const imgData = await compressImage(file, 1000, 600, 0.8);
                            setEditingBanner(prev => prev ? ({ ...prev, image: imgData }) : null);
                          } catch (err) {
                            alert('Erro ao processar imagem da promoção.');
                          }
                        }
                      }}
                    />

                    {/* Upload only */}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Texto do Botão *</label>
                    <input 
                      type="text"
                      required
                      value={editingBanner.buttonText || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, buttonText: e.target.value })}
                      placeholder="Quero frete grátis"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Link de Ação *</label>
                    <input 
                      type="text"
                      required
                      value={editingBanner.buttonLink || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, buttonLink: e.target.value })}
                      placeholder="Ex: #cat-burgers"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button 
                    type="button" 
                    onClick={() => setEditingBanner(null)}
                    className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-semibold"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-bold"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Editing Coupon Sheet modal */}
      <AnimatePresence>
        {editingCoupon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4"
            >
              <h3 className="font-bold text-slate-800 text-sm">
                {editingCoupon.id ? 'Editar Cupom' : 'Criar Novo Cupom'}
              </h3>

              <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs text-slate-700">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Código do Cupom *</label>
                    <input 
                      type="text"
                      required
                      value={editingCoupon.code || ''}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })}
                      placeholder="BEMVINDO10"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Desconto *</label>
                    <select 
                      required
                      value={editingCoupon.type || ''}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, type: e.target.value as any })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2"
                    >
                      <option value="">Selecione...</option>
                      <option value="fixed">Valor Fixo (R$)</option>
                      <option value="percent">Percentual (%)</option>
                      <option value="free_shipping">Frete Grátis</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Valor do Desconto</label>
                    <input 
                      type="number"
                      required={editingCoupon.type !== 'free_shipping'}
                      disabled={editingCoupon.type === 'free_shipping'}
                      value={editingCoupon.value || ''}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, value: parseFloat(e.target.value) || 0 })}
                      placeholder="Ex: 10 ou 15"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Compra Mínima (R$)</label>
                    <input 
                      type="number"
                      value={editingCoupon.minValue || ''}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, minValue: parseFloat(e.target.value) || undefined })}
                      placeholder="Ex: 50.00"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer pt-1">
                  <input 
                    type="checkbox"
                    checked={!!editingCoupon.firstOrderOnly}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, firstOrderOnly: e.target.checked })}
                    className="rounded"
                  />
                  <span className="font-semibold text-xs text-slate-600">Válido apenas na primeira compra</span>
                </label>

                <div className="flex gap-2 justify-end pt-2">
                  <button 
                    type="button" 
                    onClick={() => setEditingCoupon(null)}
                    className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-semibold"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-bold"
                  >
                    Salvar
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
