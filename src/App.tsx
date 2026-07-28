import React, { useState, useEffect } from 'react';
import { 
  LogIn, Lock, User, RefreshCw, AlertCircle, Check, MapPin, Phone, 
  MessageSquare, Clock, ArrowLeft, ArrowRight, ShieldCheck, Play, X, CheckCircle, Upload, Clipboard, Image
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DatabaseState, Order, RestaurantSettings, Category, Product, Banner, Coupon } from './types';
import OnlineMenu from './components/OnlineMenu';
import AdminPanel from './components/AdminPanel';
import SetupWizard from './components/SetupWizard';
import { signInWithGoogle, handleSignOut, isSupabaseConfigured, supabase } from './lib/supabase';
import { compressImage } from './lib/imageUtils';

export default function App() {
  // Navigation / Custom simple SPA Router
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  
  // API and Database State
  const [dbState, setDbState] = useState<DatabaseState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Authentication Credentials
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Customer placed active order tracking
  const [activeOrder, setActiveOrder] = useState<Order | null>(() => {
    try {
      const saved = localStorage.getItem('activeOrder');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isViewingTracker, setIsViewingTracker] = useState(() => {
    try {
      const saved = localStorage.getItem('isViewingTracker');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Keep localStorage in sync with activeOrder and isViewingTracker
  useEffect(() => {
    if (activeOrder) {
      localStorage.setItem('activeOrder', JSON.stringify(activeOrder));
    } else {
      localStorage.removeItem('activeOrder');
    }
  }, [activeOrder]);

  useEffect(() => {
    localStorage.setItem('isViewingTracker', isViewingTracker ? 'true' : 'false');
  }, [isViewingTracker]);

  // Sync route path changes
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Keyboard shortcut listener for PC (Shift + A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        navigateTo('/admin');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save mobile access token if provided in URL query parameters
  useEffect(() => {
    if (window.location.search.includes('access=celular') || window.location.search.includes('mobile=true')) {
      sessionStorage.setItem('mobile-allowed', 'true');
    }
  }, [currentPath]);

  // Check mobile restriction
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isMobileAllowed = sessionStorage.getItem('mobile-allowed') === 'true';

  // If mobile trying to access admin without the special URL, redirect back to menu
  useEffect(() => {
    if ((currentPath === '/admin' || currentPath === '/painel') && isMobile && !isMobileAllowed) {
      navigateTo('/');
    }
  }, [currentPath, isMobile, isMobileAllowed]);

  // Automatically monitor Supabase Auth status
  useEffect(() => {
    let authListener: any = null;
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session && session.user && session.user.email?.toLowerCase() === 'gleicebiaggionis@gmail.com') {
          sessionStorage.setItem('admin-token', session.access_token);
          setIsAdminLoggedIn(true);
          fetchState(false);
        } else if (!session && !sessionStorage.getItem('admin-token')) {
          setIsAdminLoggedIn(false);
        }
      });
      authListener = data.subscription;
    } else {
      // Check existing admin token in local session
      const existingToken = sessionStorage.getItem('admin-token');
      if (existingToken) {
        setIsAdminLoggedIn(true);
      }
    }

    return () => {
      if (authListener) authListener.unsubscribe();
    };
  }, []);

  // Fetch full state or public menu state
  const fetchState = async (forceLoading = false) => {
    if (forceLoading) setIsLoading(true);
    try {
      const token = sessionStorage.getItem('admin-token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/admin/data', { headers });
      if (res.ok) {
        const data: DatabaseState = await res.json();
        setDbState(data);
        setError(null);
        
        // Sync active order if tracking
        if (activeOrder) {
          try {
            const trackRes = await fetch(`/api/orders/track/${activeOrder.id}`);
            if (trackRes.ok) {
              const trackData = await trackRes.json();
              if (trackData.success && trackData.order) {
                setActiveOrder(trackData.order);
              }
            }
          } catch (trackErr) {
            console.error('Erro ao sincronizar status do pedido:', trackErr);
          }
        }
      } else {
        if (res.status === 401 && token) {
          // Log out if token expired
          sessionStorage.removeItem('admin-token');
          setIsAdminLoggedIn(false);
          navigateTo('/');
        }
        setError('Erro ao carregar dados do servidor.');
      }
    } catch (err) {
      setError('Falha de conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchState(true);
  }, []);

  useEffect(() => {
    // Setup active real-time polling every 8 seconds for new orders and live statuses
    const interval = setInterval(() => {
      fetchState(false);
    }, 8000);

    return () => clearInterval(interval);
  }, [activeOrder]);

  // Sync document title and tab favicon icon automatically with store settings
  useEffect(() => {
    if (dbState?.settings) {
      const storeName = dbState.settings.name || 'Cardapio Brazzuno';
      document.title = storeName;

      const logo = dbState.settings.branding?.logo;
      if (logo) {
        let faviconLink = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
        if (!faviconLink) {
          faviconLink = document.createElement('link');
          faviconLink.rel = 'icon';
          document.head.appendChild(faviconLink);
        }

        if (logo.startsWith('data:image/') || logo.startsWith('http://') || logo.startsWith('https://')) {
          faviconLink.href = logo;
          faviconLink.type = 'image/png';
        } else {
          // If logo is an emoji (e.g. 🔥 or 🍕), turn it into a dynamic SVG data URL favicon
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${logo}</text></svg>`;
          faviconLink.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
          faviconLink.type = 'image/svg+xml';
        }
      }
    }
  }, [dbState?.settings]);

  // Submit Supabase / Google OAuth Login details
  const handleGoogleLogin = async () => {
    setLoginError('');
    setUnauthorizedDomain(null);
    setIsLoggingIn(true);

    try {
      if (isSupabaseConfigured) {
        await signInWithGoogle();
      } else {
        // Direct local admin authentication for initial setup / demo
        const demoToken = 'supabase-demo-token';
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: demoToken })
        });
        const data = await res.json();
        if (data.success) {
          sessionStorage.setItem('admin-token', demoToken);
          setIsAdminLoggedIn(true);
          setLoginError('');
          await fetchState(false);
        } else {
          setLoginError(data.message || 'Falha na autenticação.');
        }
      }
    } catch (err: any) {
      console.error(err);
      setLoginError(err.message || 'Erro de autenticação com o Supabase/Google.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogOut = async () => {
    try {
      await handleSignOut();
    } catch (e) {
      console.warn('Error signing out of Supabase:', e);
    }
    sessionStorage.removeItem('admin-token');
    setIsAdminLoggedIn(false);
    navigateTo('/');
  };

  // Place a new order
  const handlePlaceOrder = async (orderDetails: any): Promise<Order | null> => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderDetails })
      });

      const data = await res.json();
      if (data.success && data.order) {
        // Update local database
        await fetchState(false);
        setActiveOrder(data.order);
        setIsViewingTracker(true);

        // Standard dynamic WhatsApp dispatcher
        const itemsText = orderDetails.items.map((it: any) => {
          let optText = '';
          if (it.selectedOptions && it.selectedOptions.length > 0) {
            optText = '\n   ' + it.selectedOptions.map((g: any) => `${g.groupName}: ${g.items.map((i: any) => i.name).join(', ')}`).join('\n   ');
          }
          const notesText = it.notes ? `\n   OBS: "${it.notes}"` : '';
          return `*${it.quantity}x ${it.name}* - R$ ${(it.price * it.quantity).toFixed(2)}${optText}${notesText}`;
        }).join('\n\n');

        const addressText = orderDetails.address.street === 'Retirada no Balcão'
          ? '🏢 *RETIRADA NO BALCÃO*'
          : `📍 *ENTREGA EM DOMICÍLIO*\nRua: ${orderDetails.address.street}, ${orderDetails.address.number}\nBairro: ${orderDetails.address.neighborhood}\nCEP: ${orderDetails.address.cep}${orderDetails.address.complement ? `\nComp: ${orderDetails.address.complement}` : ''}${orderDetails.address.reference ? `\nRef: ${orderDetails.address.reference}` : ''}`;

        const changeText = orderDetails.paymentDetails?.cashChange 
          ? `\n*Troco solicitado para:* R$ ${orderDetails.paymentDetails.cashChange.toFixed(2)}` 
          : '';

        const whatsappMessage = getShareOrderMessage(data.order);

        const encodedMsg = encodeURIComponent(whatsappMessage);
        const waUrl = `https://api.whatsapp.com/send?phone=55${dbState?.settings.phone?.replace(/\D/g, '')}&text=${encodedMsg}`;
        
        // Open WhatsApp web or application
        window.open(waUrl, '_blank');

        return data.order;
      } else {
        alert(data.message || 'Erro ao processar seu pedido.');
        return null;
      }
    } catch (err) {
      alert('Erro de conexão ao enviar o pedido.');
      return null;
    }
  };

  const getShareOrderMessage = (order: Order) => {
    const itemsText = order.items.map((it: any) => {
      let optText = '';
      if (it.selectedOptions && it.selectedOptions.length > 0) {
        optText = '\n   ' + it.selectedOptions.map((g: any) => `${g.groupName}: ${g.items.map((i: any) => i.name).join(', ')}`).join('\n   ');
      }
      const notesText = it.notes ? `\n   OBS: "${it.notes}"` : '';
      return `*${it.quantity}x ${it.name}* - R$ ${(it.price * it.quantity).toFixed(2)}${optText}${notesText}`;
    }).join('\n\n');

    const addressText = order.address.street === 'Retirada no Balcão'
      ? '🏢 *RETIRADA NO BALCÃO*'
      : `📍 *ENTREGA EM DOMICÍLIO*\nRua: ${order.address.street}, ${order.address.number}\nBairro: ${order.address.neighborhood}\nCEP: ${order.address.cep}${order.address.complement ? `\nComp: ${order.address.complement}` : ''}${order.address.reference ? `\nRef: ${order.address.reference}` : ''}`;

    const changeText = order.paymentDetails?.cashChange 
      ? `\n*Troco solicitado para:* R$ ${order.paymentDetails.cashChange.toFixed(2)}` 
      : '';

    const scheduleInfo = (order.isScheduled && order.scheduledDate && order.scheduledTime)
      ? `📅 *PEDIDO AGENDADO*\nData: *${order.scheduledDate}*\nHorário: *${order.scheduledTime}*\n\n`
      : '';

    return `🍔 *NOVO PEDIDO CONFIRMADO (${order.code})*\n\n` +
      scheduleInfo +
      `👤 *Cliente:* ${order.address.name}\n` +
      `📞 *WhatsApp:* ${order.address.whatsapp}\n\n` +
      `🛒 *Itens do Pedido:*\n${itemsText}\n\n` +
      `----------------------------------\n` +
      `💵 *Subtotal:* R$ ${order.subtotal.toFixed(2)}\n` +
      `🛵 *Taxa de Entrega:* R$ ${order.deliveryFee.toFixed(2)}\n` +
      (order.discount > 0 ? `🏷️ *Desconto:* -R$ ${order.discount.toFixed(2)}\n` : '') +
      `💰 *Total Geral:* R$ ${order.total.toFixed(2)}\n` +
      `💳 *Forma de Pagamento:* ${order.paymentMethod.toUpperCase()}${changeText}\n\n` +
      `${addressText}\n\n` +
      `📱 _Pedido gerado pelo Cardápio Online Brazzuno Level_`;
  };

  // Change active order status in administrative dashboard
  const handleUpdateOrderStatus = async (orderId: string, status: Order['status'], notes?: string): Promise<Order | null> => {
    try {
      const token = sessionStorage.getItem('admin-token') || 'supabase-demo-token';
      const res = await fetch('/api/admin/order-status', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId, status, notes })
      });

      const data = await res.json();
      if (data.success && data.order) {
        await fetchState(false);
        return data.order;
      }
      return null;
    } catch (err) {
      console.error('Erro ao atualizar status do pedido:', err);
      return null;
    }
  };

  // Save full state
  const handleSaveState = async (newState: DatabaseState): Promise<boolean> => {
    try {
      const token = sessionStorage.getItem('admin-token') || 'supabase-demo-token';
      const res = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newState)
      });
      const data = await res.json();
      if (data.success) {
        if (data.db) {
          setDbState(data.db);
        } else {
          setDbState(newState);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao salvar estado:', err);
      return false;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <RefreshCw className="animate-spin text-emerald-600 mb-4 h-10 w-10" />
        <h3 className="font-bold text-slate-700 text-sm">Iniciando Cardápio Digital...</h3>
        <p className="text-xs text-slate-400 mt-1">Carregando cardápio premium nível Brazzuno</p>
      </div>
    );
  }

  if (error || !dbState) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-center">
        <AlertCircle size={44} className="text-emerald-600 mb-4 animate-bounce" />
        <h3 className="font-extrabold text-slate-800 text-base">Ops! Algo deu errado</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">{error || 'Não foi possível carregar os dados. Verifique a conexão do servidor.'}</p>
        <button 
          onClick={() => fetchState(true)}
          className="mt-6 bg-slate-900 text-white hover:bg-slate-850 px-6 py-2.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
        >
          <RefreshCw size={12} /> Tentar Novamente
        </button>
      </div>
    );
  }
  if (currentPath === '/admin' || currentPath === '/painel') {
    if (!isAdminLoggedIn) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200/60 text-slate-800 space-y-6 text-center"
          >
            <div className="space-y-2">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                <ShieldCheck size={32} />
              </div>
              <h2 className="font-extrabold text-xl tracking-tight text-slate-900">Acesso Administrativo Brazzuno</h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Painel do Gestor com backend Supabase (PostgreSQL, Auth e ERP/CRM).
              </p>
            </div>

            <div className="space-y-4 py-2">
              <button 
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3.5 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <RefreshCw size={15} className="animate-spin text-white" />
                ) : (
                  <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.11C18.28 1.845 15.548 1 12.24 1 5.48 1 0 6.48 0 13.24s5.48 12.24 12.24 12.24c7.058 0 11.751-4.966 11.751-11.96 0-.802-.085-1.416-.188-1.782l-11.563-.453z"/>
                  </svg>
                )}
                <span>{isLoggingIn ? 'Autenticando via Supabase Auth...' : 'Entrar como Administrador'}</span>
              </button>

              {loginError && (
                <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl flex items-start gap-2 text-rose-700 text-left font-semibold leading-normal text-[11px]">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">⚡ Backend Supabase Activo</p>
              <p className="text-[11px] text-slate-600 font-bold mt-0.5">gleicebiaggionis@gmail.com</p>
            </div>

            <button 
              onClick={() => navigateTo('/')}
              className="w-full hover:text-emerald-600 text-slate-400 font-bold text-xs flex items-center justify-center gap-1.5 mt-2 transition-colors cursor-pointer"
            >
              <ArrowLeft size={12} /> Voltar para o Cardápio
            </button>
          </motion.div>
        </div>
      );
    }

    const isSetupNeeded = !dbState || !dbState.settings || !dbState.settings.name;

    if (isSetupNeeded) {
      return (
        <SetupWizard 
          dbState={dbState} 
          onSaveState={handleSaveState} 
          onSetupComplete={() => fetchState(true)} 
        />
      );
    }

    return (
      <AdminPanel 
        dbState={dbState}
        onSaveState={handleSaveState}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onLogOut={handleLogOut}
      />
    );
  }

  // CUSTOMER PATH MENU
  const isSetupNeeded = !dbState || !dbState.settings || !dbState.settings.name;
  if (isSetupNeeded) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white font-sans space-y-6 select-none">
        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-3xl shadow-lg border border-slate-800">
          🍔
        </div>
        <div className="space-y-2 max-w-sm">
          <h2 className="font-extrabold text-xl tracking-tight text-white">Cardápio Digital Premium</h2>
          <p className="text-slate-400 text-xs leading-relaxed font-semibold">
            Este estabelecimento está em fase de configuração inicial pela gerência.
          </p>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-[11px] text-slate-500 max-w-xs leading-relaxed">
          Se você é o proprietário, acesse o painel pelo computador e pressione as teclas <span className="text-emerald-400 font-extrabold">SHIFT + A</span> para efetuar login com seu Google Gmail e iniciar o configurador.
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      
      <OnlineMenu 
        settings={dbState.settings}
        categories={dbState.categories}
        products={dbState.products}
        combos={dbState.combos}
        banners={dbState.banners}
        coupons={dbState.coupons}
        onPlaceOrder={handlePlaceOrder}
        activeOrder={activeOrder}
        setActiveOrder={(order) => {
          setActiveOrder(order);
          setIsViewingTracker(true);
        }}
      />

      {/* Interactive Active Order tracking status overlay */}
      <AnimatePresence>
        {isViewingTracker && activeOrder && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans text-slate-800"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50 border-emerald-100/50">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <h3 className="font-extrabold text-sm text-slate-800">Acompanhar Pedido {activeOrder.code}</h3>
                </div>
                <button 
                  onClick={() => setIsViewingTracker(false)}
                  className="bg-white hover:bg-slate-100 text-slate-500 p-1.5 rounded-full shadow-xs border"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Status Stepper Tracker */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="text-center space-y-2 pb-4 border-b">
                  <span className="text-4xl">🛵</span>
                  <h4 className="font-black text-lg text-slate-800">
                    {activeOrder.status === 'new' && 'Seu pedido foi recebido!'}
                    {activeOrder.status === 'preparing' && 'Preparando seu pedido na cozinha!'}
                    {activeOrder.status === 'delivery' && 'O motoboy já saiu para entrega!'}
                    {activeOrder.status === 'delivered' && 'Pedido concluído com sucesso!'}
                    {activeOrder.status === 'canceled' && 'O pedido foi cancelado.'}
                  </h4>
                  {activeOrder.isScheduled && (
                    <div className="bg-amber-100 border border-amber-300/80 text-amber-900 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-2xs mt-2">
                      <span className="text-sm">📅</span>
                      <span>Pedido Agendado para <strong>{activeOrder.scheduledDate}</strong> às <strong>{activeOrder.scheduledTime}hs</strong></span>
                    </div>
                  )}
                  <p className="text-xs text-slate-500">Acompanhe a evolução de status em tempo real.</p>
                </div>

                {/* Vertical Step Timeline */}
                {activeOrder.status !== 'canceled' ? (
                  <div className="relative pl-8 space-y-8 py-2">
                    {/* Progress Bar line */}
                    <div className="absolute left-3.5 top-5 bottom-5 w-0.5 bg-slate-200">
                      <div 
                        className="w-full bg-emerald-600 transition-all duration-500" 
                        style={{ 
                          height: 
                            activeOrder.status === 'new' ? '0%' :
                            activeOrder.status === 'preparing' ? '33%' :
                            activeOrder.status === 'delivery' ? '66%' : '100%',
                          backgroundColor: dbState?.settings?.branding?.primaryColor || '#03d383'
                        }}
                      />
                    </div>

                    {/* Step 1: Received */}
                    <div className="relative flex items-start gap-4">
                      <span className={`absolute -left-8 h-7.5 w-7.5 rounded-full flex items-center justify-center font-bold text-xs border-4 border-white shadow-sm ${activeOrder.status !== 'canceled' ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'}`} style={activeOrder.status !== 'canceled' ? { backgroundColor: dbState?.settings?.branding?.primaryColor || '#03d383' } : {}}>
                        1
                      </span>
                      <div className="text-xs">
                        <h5 className="font-extrabold text-slate-800">Pedido Recebido</h5>
                        <p className="text-slate-500 mt-0.5">Aguardando confirmação do restaurante.</p>
                      </div>
                    </div>

                    {/* Step 2: Preparing */}
                    <div className="relative flex items-start gap-4">
                      <span className={`absolute -left-8 h-7.5 w-7.5 rounded-full flex items-center justify-center font-bold text-xs border-4 border-white shadow-sm ${['preparing', 'delivery', 'delivered'].includes(activeOrder.status) ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`} style={['preparing', 'delivery', 'delivered'].includes(activeOrder.status) ? { backgroundColor: dbState?.settings?.branding?.primaryColor || '#03d383' } : {}}>
                        2
                      </span>
                      <div className="text-xs">
                        <h5 className="font-extrabold text-slate-800">Na Cozinha / Preparando</h5>
                        <p className="text-slate-500 mt-0.5">Seus itens estão sendo preparados com muito carinho por nossos chefs.</p>
                      </div>
                    </div>

                    {/* Step 3: Out for delivery */}
                    <div className="relative flex items-start gap-4">
                      <span className={`absolute -left-8 h-7.5 w-7.5 rounded-full flex items-center justify-center font-bold text-xs border-4 border-white shadow-sm ${['delivery', 'delivered'].includes(activeOrder.status) ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`} style={['delivery', 'delivered'].includes(activeOrder.status) ? { backgroundColor: dbState?.settings?.branding?.primaryColor || '#03d383' } : {}}>
                        3
                      </span>
                      <div className="text-xs">
                        <h5 className="font-extrabold text-slate-800">Saiu para Entrega</h5>
                        <p className="text-slate-500 mt-0.5">Nosso motoboy já recolheu sua encomenda e está a caminho de sua casa.</p>
                      </div>
                    </div>

                    {/* Step 4: Concluded */}
                    <div className="relative flex items-start gap-4">
                      <span className={`absolute -left-8 h-7.5 w-7.5 rounded-full flex items-center justify-center font-bold text-xs border-4 border-white shadow-sm ${activeOrder.status === 'delivered' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        ✓
                      </span>
                      <div className="text-xs">
                        <h5 className="font-extrabold text-slate-800">Pedido Entregue</h5>
                        <p className="text-slate-500 mt-0.5">Aproveite sua refeição e obrigado pela preferência!</p>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 text-center text-xs space-y-1">
                    <h5 className="font-bold text-emerald-800">Seu pedido foi cancelado</h5>
                    <p className="text-slate-500">Entre em contato direto pelo WhatsApp ou telefone do estabelecimento para sanar dúvidas ou reagendar seu pedido.</p>
                  </div>
                )}

                {/* Receipt Details summary list */}
                <div className="bg-slate-50 border p-4 rounded-2xl space-y-3 mt-6 text-xs text-slate-600">
                  <div className="border-b pb-2 flex justify-between">
                    <span className="font-bold text-slate-800">Itens pedidos:</span>
                    <span className="font-bold text-emerald-600">Total: R$ {activeOrder.total.toFixed(2)}</span>
                  </div>
                  
                  <div className="space-y-1">
                    {activeOrder.items.map((item, index) => (
                      <p key={index} className="font-semibold text-slate-700">
                        {item.quantity}x {item.name}
                      </p>
                    ))}
                  </div>

                  <div className="border-t pt-2.5 space-y-1 text-[11px] text-slate-500">
                    <p className="flex items-center gap-1">📍 Entrega: {activeOrder.address.street}, {activeOrder.address.number}</p>
                    <p className="flex items-center gap-1">
                      <span>💳</span> Forma de pagamento:{" "}
                      <span className="uppercase font-extrabold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                        {activeOrder.paymentMethod === 'pix' && '🌀 Pix Manual'}
                        {activeOrder.paymentMethod === 'cash' && '💵 Dinheiro'}
                        {activeOrder.paymentMethod === 'meal_voucher' && '🎫 Vale Refeição (VR)'}
                        {activeOrder.paymentMethod === 'food_voucher' && '🛒 Vale Alimentação (VA)'}
                        {activeOrder.paymentMethod === 'delivery_payment' && '🛵 Cartão na Entrega'}
                        {activeOrder.paymentMethod === 'online_credit' && '💳 Cartão de Crédito (Online)'}
                        {activeOrder.paymentMethod === 'online_debit' && '🏦 Cartão de Débito (Online)'}
                        {activeOrder.paymentMethod === 'online_pix' && '⚡ Pix Online'}
                        {activeOrder.paymentMethod === 'online_wallet' && '📱 Carteira Digital (Online)'}
                        {!['pix', 'cash', 'meal_voucher', 'food_voucher', 'delivery_payment', 'online_credit', 'online_debit', 'online_pix', 'online_wallet'].includes(activeOrder.paymentMethod) && activeOrder.paymentMethod}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Fallback WhatsApp Order Send Button */}
                <div className="mt-4 bg-teal-50 border border-teal-100/60 p-3.5 rounded-2xl space-y-2">
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                    Seu navegador bloqueou a abertura automática do WhatsApp? Clique no botão abaixo para enviar o pedido manualmente ao estabelecimento:
                  </p>
                  <a 
                    href={`https://api.whatsapp.com/send?phone=55${(dbState?.settings?.phone || '11999998888').replace(/\D/g, '')}&text=${encodeURIComponent(getShareOrderMessage(activeOrder))}`}
                    target="_blank"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-xs"
                  >
                    <MessageSquare size={13} /> Enviar Pedido para o WhatsApp
                  </a>
                </div>

                {/* Interactive PIX Payment & Proof Section in Order Tracker */}
                {(activeOrder.paymentMethod === 'pix' || activeOrder.paymentMethod === 'online_pix') && (
                  <div className="bg-emerald-50/80 border border-emerald-200/80 p-4 rounded-2xl text-center space-y-3 mt-4 animate-fadeIn shadow-xs">
                    <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                      <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                        ⚡ PAGAMENTO PIX & COMPROVANTE
                      </span>
                      {activeOrder.paymentDetails?.pixProofUrl && (
                        <span className="text-[9px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-full">
                          Comprovante Enviado ✓
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-600 leading-normal max-w-sm mx-auto">
                      Copie a chave PIX abaixo para pagar no app do seu banco. Ao copiar, você pode ir direto ao WhatsApp enviar o comprovante!
                    </p>

                    <div className="bg-slate-900 text-emerald-300 font-mono text-[9px] p-2.5 rounded-xl break-all select-all leading-normal text-left h-16 overflow-y-auto border border-slate-800">
                      {activeOrder.paymentDetails?.pixCopiaECola || dbState?.settings?.pix?.copyPasteText || dbState?.settings?.pix?.keyValue || 'Chave Pix disponível ao abrir WhatsApp'}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const pixKey = activeOrder.paymentDetails?.pixCopiaECola || dbState?.settings?.pix?.copyPasteText || dbState?.settings?.pix?.keyValue || '';
                        if (pixKey) {
                          navigator.clipboard.writeText(pixKey);
                        }
                        const storePhone = (dbState?.settings?.phone || dbState?.settings?.whatsapp || '11999998888').replace(/\D/g, '');
                        const waMsg = `Olá! Copiei a chave PIX do Pedido *#${activeOrder.code}* (Valor: R$ ${activeOrder.total.toFixed(2)}). Estou enviando o comprovante de pagamento por aqui! 🌀`;
                        const waUrl = `https://api.whatsapp.com/send?phone=55${storePhone}&text=${encodeURIComponent(waMsg)}`;
                        window.open(waUrl, '_blank');
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-xs cursor-pointer"
                    >
                      <Clipboard size={14} /> Copiar Código Pix & Ir para WhatsApp
                    </button>

                    {/* Proof Upload / Display Card */}
                    <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-2 text-left mt-2">
                      <p className="text-[10px] font-bold text-slate-700 flex items-center justify-between">
                        <span>📷 Comprovante de Pagamento PIX</span>
                        {activeOrder.paymentDetails?.pixProofUrl && <span className="text-[9px] text-emerald-600 font-bold">Anexado</span>}
                      </p>

                      {activeOrder.paymentDetails?.pixProofUrl ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                            <img 
                              src={activeOrder.paymentDetails.pixProofUrl} 
                              alt="Comprovante de pagamento" 
                              className="w-14 h-14 object-cover rounded-md border border-slate-300 cursor-pointer" 
                              onClick={() => window.open(activeOrder.paymentDetails?.pixProofUrl, '_blank')}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-slate-800 truncate">
                                {activeOrder.paymentDetails.pixProofName || 'comprovante.jpg'}
                              </p>
                              <p className="text-[9px] text-emerald-600 font-semibold">Comprovante anexado ao pedido ✓</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <label className="w-full bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-dashed border-emerald-300 p-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors">
                          <Upload size={14} /> Anexar Foto do Comprovante
                          <input 
                            type="file" 
                            accept="image/*,.pdf" 
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  let proofDataUrl = '';
                                  if (file.type.startsWith('image/')) {
                                    proofDataUrl = await compressImage(file, 1000, 1000, 0.7);
                                  } else {
                                    proofDataUrl = await new Promise((resolve) => {
                                      const r = new FileReader();
                                      r.onload = (ev) => resolve(ev.target?.result as string);
                                      r.readAsDataURL(file);
                                    });
                                  }

                                  // Upload proof to backend
                                  const res = await fetch(`/api/orders/upload-proof/${activeOrder.id}`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ pixProofUrl: proofDataUrl, pixProofName: file.name })
                                  });
                                  const data = await res.json();
                                  if (data.success && data.order) {
                                    setActiveOrder(data.order);
                                    localStorage.setItem('activeOrder', JSON.stringify(data.order));
                                    alert('Comprovante anexado com sucesso ao pedido! ✓');
                                  }
                                } catch (err) {
                                  alert('Erro ao enviar o comprovante.');
                                }
                              }
                            }}
                          />
                        </label>
                      )}

                      {/* Send via WhatsApp Button */}
                      <a
                        href={`https://api.whatsapp.com/send?phone=55${(dbState?.settings?.phone || dbState?.settings?.whatsapp || '11999998888').replace(/\D/g, '')}&text=${encodeURIComponent(`Olá! Segue o comprovante de pagamento do Pedido *#${activeOrder.code}* (Valor: R$ ${activeOrder.total.toFixed(2)}):`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-[11px] py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors mt-2"
                      >
                        <MessageSquare size={13} /> Enviar Comprovante Direto pelo WhatsApp
                      </a>
                    </div>
                  </div>
                )}

              </div>

              {/* Tracker CTA Footer */}
              <div className="p-4 border-t border-slate-100 bg-white space-y-2">
                {activeOrder.status === 'delivered' ? (
                  <button 
                    onClick={async () => {
                      try {
                        await fetch(`/api/orders/confirm-delivery/${activeOrder.id}`, { method: 'POST' });
                      } catch (e) {
                        console.error(e);
                      }
                      setActiveOrder(null);
                      setIsViewingTracker(false);
                      localStorage.removeItem('activeOrder');
                      alert('Entrega confirmada e pedido finalizado! Obrigado pela preferência! 😊');
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-black text-xs text-center flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                  >
                    <CheckCircle size={16} /> Confirmar Entrega e Concluir Pedido
                  </button>
                ) : activeOrder.status === 'canceled' ? (
                  <button 
                    onClick={() => {
                      setActiveOrder(null);
                      setIsViewingTracker(false);
                      localStorage.removeItem('activeOrder');
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-2xl font-bold text-xs text-center"
                  >
                    Encerrar Acompanhamento
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsViewingTracker(false)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs text-center"
                    >
                      Minimizar
                    </button>
                    <button 
                      onClick={async () => {
                        if (confirm('Confirma que já recebeu o pedido e deseja finalizar o acompanhamento?')) {
                          try {
                            await fetch(`/api/orders/confirm-delivery/${activeOrder.id}`, { method: 'POST' });
                          } catch (e) {
                            console.error(e);
                          }
                          setActiveOrder(null);
                          setIsViewingTracker(false);
                          localStorage.removeItem('activeOrder');
                          alert('Entrega confirmada! Bom apetite! 🍔');
                        }
                      }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs text-center flex items-center justify-center gap-1 shadow-xs"
                    >
                      <CheckCircle size={14} /> Já Recebi o Pedido
                    </button>
                  </div>
                )}

                <a 
                  href={`https://api.whatsapp.com/send?phone=55${(dbState?.settings?.phone || '11999998888').replace(/\D/g, '')}&text=${encodeURIComponent(`Olá! Gostaria de falar sobre o meu pedido ${activeOrder.code}.`)}`}
                  target="_blank"
                  className="w-full bg-teal-50 hover:bg-teal-100 text-teal-800 py-2.5 rounded-xl font-bold text-xs text-center flex items-center justify-center gap-1 border border-teal-200 transition-colors"
                >
                  <MessageSquare size={13} /> Dúvidas? Suporte no WhatsApp
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
