import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, Search, Plus, Minus, X, ArrowRight, Check, Clock, Phone, 
  MapPin, Clipboard, AlertCircle, RefreshCw, CheckCircle, Sparkles, ArrowLeft, ShoppingCart, HelpCircle,
  Instagram, MessageCircle, Flame, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Category, Product, Banner, Coupon, Order, OrderAddress, OptionGroup, OptionItem, RestaurantSettings } from '../types';

interface OnlineMenuProps {
  settings: RestaurantSettings;
  categories: Category[];
  products: Product[];
  banners: Banner[];
  coupons: Coupon[];
  onPlaceOrder: (orderDetails: any) => Promise<Order | null>;
  activeOrder: Order | null;
  setActiveOrder: (order: Order | null) => void;
}

export default function OnlineMenu({
  settings,
  categories,
  products,
  banners,
  coupons,
  onPlaceOrder,
  activeOrder,
  setActiveOrder
}: OnlineMenuProps) {
  // Defensive fallbacks to prevent crashes if props or sub-objects are undefined
  const safeCategories = categories || [];
  const safeProducts = products || [];
  const safeBanners = banners || [];
  const safeCoupons = coupons || [];

  const safeSettings = {
    name: settings?.name || 'Brazzuno - Hamburgueria & Grelhados',
    phone: settings?.phone || '11999998888',
    whatsapp: settings?.whatsapp || '11999998888',
    instagram: settings?.instagram || 'brazzunoburger',
    email: settings?.email || 'contato@brazzuno.com.br',
    address: settings?.address || 'Av. Paulista, 1200 - Bela Vista, São Paulo - SP',
    branding: {
      logo: settings?.branding?.logo || '🔥',
      bannerImage: settings?.branding?.bannerImage || 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=1200',
      primaryColor: settings?.branding?.primaryColor || '#03d383',
      secondaryColor: settings?.branding?.secondaryColor || '#00df89',
      backgroundColor: settings?.branding?.backgroundColor || '#f8fafc',
      fontFamily: settings?.branding?.fontFamily || 'Inter',
      theme: settings?.branding?.theme || 'light'
    },
    delivery: {
      radiusKm: settings?.delivery?.radiusKm ?? 6,
      baseFee: settings?.delivery?.baseFee ?? 6.50,
      freeDeliveryMinAmount: settings?.delivery?.freeDeliveryMinAmount ?? 75.00,
      minOrderAmount: settings?.delivery?.minOrderAmount ?? 20.00,
      estimatedTimeMin: settings?.delivery?.estimatedTimeMin ?? 35,
      allowPickup: settings?.delivery?.allowPickup ?? true,
      neighborhoods: settings?.delivery?.neighborhoods || [
        { id: 'nh-1', name: 'Bela Vista', fee: 5.00, deliveryTime: '25-35 min' },
        { id: 'nh-2', name: 'Consolação', fee: 6.00, deliveryTime: '30-40 min' },
        { id: 'nh-3', name: 'Jardins', fee: 7.50, deliveryTime: '35-45 min' },
        { id: 'nh-4', name: 'Pinheiros', fee: 9.50, deliveryTime: '40-50 min' }
      ]
    },
    operational: {
      closedMessage: settings?.operational?.closedMessage || '⚠️ Olá! Nosso cardápio está fechado no momento. Nosso horário de funcionamento é de Terça a Domingo das 18h às 23h30.',
      hours: settings?.operational?.hours || [
        { dayOfWeek: 0, isOpen: true, slots: [{ open: '18:00', close: '23:30' }] },
        { dayOfWeek: 1, isOpen: false, slots: [] },
        { dayOfWeek: 2, isOpen: true, slots: [{ open: '18:00', close: '23:30' }] },
        { dayOfWeek: 3, isOpen: true, slots: [{ open: '18:00', close: '23:30' }] },
        { dayOfWeek: 4, isOpen: true, slots: [{ open: '18:00', close: '23:30' }] },
        { dayOfWeek: 5, isOpen: true, slots: [{ open: '18:00', close: '23:30' }] },
        { dayOfWeek: 6, isOpen: true, slots: [{ open: '18:00', close: '23:30' }] }
      ]
    },
    pix: {
      keyType: settings?.pix?.keyType || 'cnpj',
      keyValue: settings?.pix?.keyValue || '12.345.678/0001-90',
      receiverName: settings?.pix?.receiverName || 'Brazzuno Alimentos Ltda',
      copyPasteText: settings?.pix?.copyPasteText || '00020101021126580014br.gov.bcb.pix0118123456780001905204000053039865802BR5922Brazzuno Alimentos Ltda6009Sao Paulo62070503***6304E21D'
    },
    localPayments: settings?.localPayments || {
      pixActive: true,
      cashActive: true,
      mealVoucherActive: false,
      foodVoucherActive: false,
      deliveryPaymentActive: false
    },
    checkoutTransparenteActive: settings?.checkoutTransparenteActive ?? false,
    selectedGatewayId: settings?.selectedGatewayId || 'mercadopago'
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const bannerScrollRef = React.useRef<HTMLDivElement>(null);

  const handleBannerScroll = () => {
    if (bannerScrollRef.current) {
      const el = bannerScrollRef.current;
      const scrollPosition = el.scrollLeft;
      const child = el.firstElementChild as HTMLElement;
      if (child) {
        const itemWidth = child.clientWidth + 12;
        const newIdx = Math.round(scrollPosition / itemWidth);
        if (newIdx !== activeBannerIdx && newIdx >= 0) {
          setActiveBannerIdx(newIdx);
        }
      }
    }
  };

  const scrollToBanner = (index: number) => {
    if (bannerScrollRef.current) {
      const el = bannerScrollRef.current;
      const child = el.children[index] as HTMLElement;
      if (child) {
        child.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
        setActiveBannerIdx(index);
      }
    }
  };
  const [cart, setCart] = useState<{
    id: string; // unique item id including options
    product: Product;
    quantity: number;
    notes: string;
    selectedOptions: {
      groupName: string;
      items: { name: string; price: number }[];
    }[];
    itemPrice: number;
  }[]>([]);
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Custom option selections
  const [tempOptions, setTempOptions] = useState<{ [groupId: string]: OptionItem[] }>({});
  const [tempNotes, setTempNotes] = useState('');
  const [tempQuantity, setTempQuantity] = useState(1);

  // Checkout Form
  const [isCheckout, setIsCheckout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutStreet, setCheckoutStreet] = useState('');
  const [checkoutNumber, setCheckoutNumber] = useState('');
  const [checkoutNeighborhood, setCheckoutNeighborhood] = useState('');
  const [checkoutCity, setCheckoutCity] = useState(safeSettings.address ? (safeSettings.address.split(',').pop()?.trim() || 'São Paulo') : 'São Paulo');
  const [checkoutCep, setCheckoutCep] = useState('');
  const [checkoutComplement, setCheckoutComplement] = useState('');
  const [checkoutReference, setCheckoutReference] = useState('');
  
  const [isPickup, setIsPickup] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('pix');
  const [cashChange, setCashChange] = useState<string>('');

  // Credit/Debit Card Details for Checkout Transparente
  const [ccNumber, setCcNumber] = useState('');
  const [ccName, setCcName] = useState('');
  const [ccExpiry, setCcExpiry] = useState('');
  const [ccCvv, setCcCvv] = useState('');
  const [ccCpf, setCcCpf] = useState('');
  const [ccInstallments, setCcInstallments] = useState('1');

  // Get active payment methods based on settings
  const activePaymentMethods = useMemo(() => {
    const list = [];
    const local = safeSettings.localPayments || {
      pixActive: true,
      cashActive: true,
      mealVoucherActive: false,
      foodVoucherActive: false,
      deliveryPaymentActive: false
    };

    // 1. Native Offline methods
    if (local.pixActive !== false) {
      list.push({ id: 'pix', name: 'PIX (Transferência)', icon: '🌀', type: 'local', desc: 'Transferência direta com envio de comprovante' });
    }
    if (local.cashActive !== false) {
      list.push({ id: 'cash', name: 'Dinheiro', icon: '💵', type: 'local', desc: 'Pague em cédulas na entrega/retirada' });
    }
    if (local.mealVoucherActive) {
      list.push({ id: 'meal_voucher', name: 'Vale Refeição', icon: '🎫', type: 'local', desc: 'Aceitamos Alelo, Sodexo, Ticket e VR' });
    }
    if (local.foodVoucherActive) {
      list.push({ id: 'food_voucher', name: 'Vale Alimentação', icon: '🛒', type: 'local', desc: 'Aceitamos Sodexo e Ticket Alimentação' });
    }
    if (local.deliveryPaymentActive) {
      list.push({ id: 'delivery_payment', name: 'Cartão na Entrega', icon: '🛵', type: 'local', desc: 'Levar maquininha de Crédito/Débito' });
    }

    // 2. Checkout Transparente Online methods (if enabled)
    if (safeSettings.checkoutTransparenteActive) {
      const gwId = safeSettings.selectedGatewayId || 'mercadopago';
      if (gwId === 'openpix' || gwId === 'woovi') {
        list.push({ id: 'online_pix', name: 'PIX Online', icon: '⚡', type: 'online', desc: 'Aprovação imediata via Pix Oficial' });
      } else if (gwId === 'cielo' || gwId === 'rede' || gwId === 'stone') {
        list.push({ id: 'online_credit', name: 'Cartão de Crédito', icon: '💳', type: 'online', desc: 'Pague online em até 12x com segurança' });
        list.push({ id: 'online_debit', name: 'Cartão de Débito', icon: '🏦', type: 'online', desc: 'Pagamento online imediato' });
      } else if (gwId === 'paypal') {
        list.push({ id: 'online_credit', name: 'Cartão de Crédito', icon: '💳', type: 'online', desc: 'Pague online em até 12x com segurança' });
        list.push({ id: 'online_wallet', name: 'Paypal / Carteira', icon: '📱', type: 'online', desc: 'Pague com saldo PayPal ou Venmo' });
      } else {
        list.push({ id: 'online_credit', name: 'Cartão de Crédito', icon: '💳', type: 'online', desc: 'Pague online em até 12x com segurança' });
        list.push({ id: 'online_debit', name: 'Cartão de Débito', icon: '🏦', type: 'online', desc: 'Pagamento online via internet banking' });
        list.push({ id: 'online_pix', name: 'PIX Online', icon: '⚡', type: 'online', desc: 'Aprovação imediata via QR Code dinâmico' });
        list.push({ id: 'online_wallet', name: 'Apple / Google Pay', icon: '📱', type: 'online', desc: 'Pague via carteiras digitais' });
      }
    }

    return list;
  }, [settings]);

  // Dynamically default the payment method if the current one is disabled
  React.useEffect(() => {
    if (isCheckout && activePaymentMethods.length > 0) {
      const isCurrentActive = activePaymentMethods.some(m => m.id === paymentMethod);
      if (!isCurrentActive) {
        setPaymentMethod(activePaymentMethods[0].id);
      }
    }
  }, [isCheckout, activePaymentMethods, paymentMethod]);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Notifications
  const [pixCopied, setPixCopied] = useState(false);

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return safeProducts.filter(p => {
      const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (p.ingredients && p.ingredients.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [safeProducts, selectedCategory, searchTerm]);

  // Active banners
  const sortedBanners = useMemo(() => {
    return [...safeBanners].sort((a, b) => b.priority - a.priority);
  }, [safeBanners]);

  // Subtotal calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.itemPrice * item.quantity), 0);
  }, [cart]);

  // Selected delivery fee
  const currentDeliveryFee = useMemo(() => {
    if (isPickup) return 0;
    
    // If free delivery limit reached
    if (safeSettings.delivery.freeDeliveryMinAmount && cartSubtotal >= safeSettings.delivery.freeDeliveryMinAmount) {
      return 0;
    }

    const neighborhood = safeSettings.delivery.neighborhoods?.find(n => n.name === checkoutNeighborhood);
    return neighborhood ? neighborhood.fee : safeSettings.delivery.baseFee;
  }, [isPickup, checkoutNeighborhood, safeSettings, cartSubtotal]);

  // Discount calculation
  const discountAmount = useMemo(() => {
    if (!activeCoupon) return 0;
    if (activeCoupon.type === 'free_shipping') return 0; // Handled in Delivery Fee representation but let's represent here as dynamic fallback

    if (activeCoupon.type === 'percent') {
      return (cartSubtotal * activeCoupon.value) / 100;
    } else {
      return Math.min(activeCoupon.value, cartSubtotal);
    }
  }, [activeCoupon, cartSubtotal]);

  const totalDeliveryFee = useMemo(() => {
    if (activeCoupon?.type === 'free_shipping') return 0;
    return currentDeliveryFee;
  }, [activeCoupon, currentDeliveryFee]);

  const cartTotal = useMemo(() => {
    return Math.max(0, cartSubtotal + totalDeliveryFee - discountAmount);
  }, [cartSubtotal, totalDeliveryFee, discountAmount]);

  // Open product details options modal
  const handleOpenProduct = (product: Product) => {
    setSelectedProduct(product);
    setTempQuantity(1);
    setTempNotes('');
    
    // Initialize default options
    const initial: { [key: string]: OptionItem[] } = {};
    product.options.forEach(group => {
      // If group requires min === 1, pre-select first item
      if (group.min === 1 && group.items.length > 0) {
        initial[group.id] = [group.items[0]];
      } else {
        initial[group.id] = [];
      }
    });
    setTempOptions(initial);
  };

  const handleToggleOption = (group: OptionGroup, item: OptionItem) => {
    const selected = tempOptions[group.id] || [];
    const exists = selected.some(i => i.id === item.id);

    if (exists) {
      setTempOptions({
        ...tempOptions,
        [group.id]: selected.filter(i => i.id !== item.id)
      });
    } else {
      if (group.max === 1) {
        setTempOptions({
          ...tempOptions,
          [group.id]: [item]
        });
      } else if (selected.length < group.max) {
        setTempOptions({
          ...tempOptions,
          [group.id]: [...selected, item]
        });
      }
    }
  };

  // Calculate current single item price based on selected options
  const currentItemPrice = useMemo(() => {
    if (!selectedProduct) return 0;
    const basePrice = selectedProduct.promoPrice || selectedProduct.price;
    
    let optionsPrice = 0;
    (Object.values(tempOptions) as OptionItem[][]).forEach(items => {
      items.forEach(it => {
        optionsPrice += it.price;
      });
    });

    return basePrice + optionsPrice;
  }, [selectedProduct, tempOptions]);

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    // Validate options min selection requirements
    for (const group of selectedProduct.options) {
      const selected = tempOptions[group.id] || [];
      if (selected.length < group.min) {
        alert(`Por favor, selecione no mínimo ${group.min} opção(ões) de "${group.name}".`);
        return;
      }
    }

    const selectedOptionsList = selectedProduct.options.map(group => ({
      groupName: group.name,
      items: (tempOptions[group.id] || []).map(i => ({ name: i.name, price: i.price }))
    })).filter(g => g.items.length > 0);

    // Create a unique id based on selections
    const selectionString = JSON.stringify(selectedOptionsList);
    const cartItemId = `${selectedProduct.id}-${selectionString}`;

    // Check if identical item is already in cart
    const existingIndex = cart.findIndex(i => i.id === cartItemId);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += tempQuantity;
      setCart(updated);
    } else {
      setCart([...cart, {
        id: cartItemId,
        product: selectedProduct,
        quantity: tempQuantity,
        notes: tempNotes,
        selectedOptions: selectedOptionsList,
        itemPrice: currentItemPrice
      }]);
    }

    setSelectedProduct(null);
  };

  const handleUpdateCartQuantity = (id: string, delta: number) => {
    const updated = cart.map(item => {
      if (item.id === id) {
        const nq = item.quantity + delta;
        return { ...item, quantity: nq > 0 ? nq : 0 };
      }
      return item;
    }).filter(item => item.quantity > 0);
    setCart(updated);
  };

  const handleApplyCoupon = () => {
    setCouponError('');
    setCouponSuccess('');
    
    const target = safeCoupons.find(c => c.code.toUpperCase() === couponCode.trim().toUpperCase());
    
    if (!target) {
      setCouponError('Cupom inválido ou inexistente.');
      setActiveCoupon(null);
      return;
    }

    // Validate minimum purchase
    if (target.minValue && cartSubtotal < target.minValue) {
      setCouponError(`Este cupom exige uma compra mínima de R$ ${target.minValue.toFixed(2)}.`);
      setActiveCoupon(null);
      return;
    }

    // Success
    setActiveCoupon(target);
    if (target.type === 'free_shipping') {
      setCouponSuccess('Cupom aplicado: Frete Grátis ativado! 🎉');
    } else if (target.type === 'percent') {
      setCouponSuccess(`Cupom aplicado: ${target.value}% de desconto! 🏷️`);
    } else {
      setCouponSuccess(`Cupom aplicado: R$ ${target.value.toFixed(2)} de desconto! 🏷️`);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    // Minimum order amount restriction
    if (safeSettings.delivery.minOrderAmount && cartSubtotal < safeSettings.delivery.minOrderAmount) {
      alert(`Valor mínimo para pedido é de R$ ${safeSettings.delivery.minOrderAmount.toFixed(2)}.`);
      return;
    }

    // Mandatory address validation
    if (!checkoutName || !checkoutPhone) {
      alert('Preencha seu nome e telefone.');
      return;
    }

    if (!isPickup && (!checkoutStreet || !checkoutNumber || !checkoutNeighborhood || !checkoutCep)) {
      alert('Todos os campos de endereço são obrigatórios para entrega.');
      return;
    }

    setIsSubmitting(true);

    const addressObj: OrderAddress = {
      name: checkoutName,
      whatsapp: checkoutPhone.replace(/\D/g, ''),
      street: isPickup ? 'Retirada no Balcão' : checkoutStreet,
      number: isPickup ? 'S/N' : checkoutNumber,
      neighborhood: isPickup ? 'Balcão' : checkoutNeighborhood,
      city: isPickup ? '-' : checkoutCity,
      cep: isPickup ? '-' : checkoutCep,
      complement: isPickup ? '' : checkoutComplement,
      reference: isPickup ? '' : checkoutReference
    };

    const orderDetails = {
      address: addressObj,
      items: cart.map(c => ({
        productId: c.product.id,
        name: c.product.name,
        price: c.itemPrice,
        quantity: c.quantity,
        notes: c.notes,
        selectedOptions: c.selectedOptions
      })),
      paymentMethod: paymentMethod,
      paymentDetails: {
        ...(paymentMethod === 'cash' && cashChange ? { cashChange: parseFloat(cashChange) } : {}),
        ...((paymentMethod === 'online_credit' || paymentMethod === 'online_debit') ? {
          cardLastFour: ccNumber.replace(/\s/g, '').slice(-4),
          cardHolderName: ccName,
          cardExpiry: ccExpiry,
          cardInstallments: parseInt(ccInstallments) || 1,
          isOnlinePaid: true,
          gatewayId: safeSettings.selectedGatewayId || 'mercadopago',
          transactionId: `tx_${Math.random().toString(36).substring(2, 11).toUpperCase()}`
        } : {}),
        ...(paymentMethod === 'online_pix' ? {
          isOnlinePaid: false,
          pixQrCodeUrl: `https://vitosburgers.com/qr/dyn_pix_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          pixCopiaECola: `00020101021226830014br.gov.bcb.pix2561api.vitosburgers.com/v2/cob/${Math.random().toString(36).substring(2, 12).toUpperCase()}5204000053039865405${cartTotal.toFixed(2)}5802BR5913Vitos Burgers6009Sao Paulo62070503***6304D23F`
        } : {}),
        ...(paymentMethod === 'online_wallet' ? {
          isOnlinePaid: true,
          walletType: 'gpay',
          transactionId: `wtx_${Math.random().toString(36).substring(2, 11).toUpperCase()}`
        } : {})
      },
      subtotal: cartSubtotal,
      deliveryFee: totalDeliveryFee,
      discount: discountAmount,
      total: cartTotal
    };

    const resOrder = await onPlaceOrder(orderDetails);
    setIsSubmitting(false);

    if (resOrder) {
      // Clear cart
      setCart([]);
      setIsCheckout(false);
      setIsCartOpen(false);
      setActiveCoupon(null);
      setCouponCode('');
    }
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(safeSettings.pix.copyPasteText || '');
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 3000);
  };

  // Double check operation hours
  const isCurrentlyOpen = useMemo(() => {
    const nowLocal = new Date();
    const day = nowLocal.getDay(); // 0 to 6
    const hourSetting = safeSettings.operational.hours.find(h => h.dayOfWeek === day);
    
    if (!hourSetting || !hourSetting.isOpen) return false;
    
    const minutesNow = nowLocal.getHours() * 60 + nowLocal.getMinutes();
    
    return hourSetting.slots.some(slot => {
      const [sh, sm] = slot.open.split(':').map(Number);
      const [eh, em] = slot.close.split(':').map(Number);
      
      const startMinutes = sh * 60 + sm;
      let endMinutes = eh * 60 + em;
      
      // If closing is early next morning (e.g. 02:00)
      if (endMinutes < startMinutes) {
        endMinutes += 24 * 60;
      }
      
      return minutesNow >= startMinutes && minutesNow <= endMinutes;
    });
  }, [safeSettings]);

  const renderLogo = (logo: string, fallbackEmoji: string = '🍔', imgClass: string = 'w-full h-full object-cover') => {
    if (!logo) return <span>{fallbackEmoji}</span>;
    const isImg = logo.startsWith('http://') || logo.startsWith('https://') || logo.startsWith('data:image/');
    if (isImg) {
      return (
        <img
          src={logo}
          alt="Logo do Estabelecimento"
          className={imgClass}
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      );
    }
    return <span>{logo}</span>;
  };

  return (
    <div 
      className="min-h-screen pb-20 font-sans w-full max-w-full overflow-x-hidden transition-colors duration-300" 
      style={{ 
        backgroundColor: safeSettings.branding.backgroundColor || '#f8fafc',
        '--primary': safeSettings.branding.primaryColor 
      } as React.CSSProperties}
    >
      
      {/* Dynamic SEO & Custom branding theme container */}
      <header className="sticky top-0 z-40 bg-white shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 flex items-center justify-center overflow-hidden rounded-full bg-slate-100 flex-shrink-0 text-xl">
              {renderLogo(safeSettings.branding.logo, '🔥')}
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                {safeSettings.name}
              </h1>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Clock size={12} /> {safeSettings.delivery.estimatedTimeMin} min • Fone: {safeSettings.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeOrder && (
              <button 
                onClick={() => setActiveOrder(activeOrder)}
                className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-600 px-2.5 py-1.5 rounded-full font-medium flex items-center gap-1.5 hover:bg-emerald-100 transition-colors animate-pulse"
              >
                <RefreshCw size={12} className="animate-spin" /> Acompanhar Pedido {activeOrder.code}
              </button>
            )}
            
            <button 
              onClick={() => setIsCartOpen(true)}
              className="bg-emerald-600 text-white p-2.5 rounded-full shadow-md flex items-center justify-center relative hover:bg-emerald-700 transition-colors"
              style={{ backgroundColor: safeSettings.branding.primaryColor }}
            >
              <ShoppingBag size={20} />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-slate-900 font-bold text-xs h-5 w-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Operational State Warning */}
      {!isCurrentlyOpen && (
        <div className="bg-amber-500 text-white px-4 py-2.5 text-center text-sm font-medium shadow-xs flex items-center justify-center gap-2">
          <span>⚠️</span> {safeSettings.operational.closedMessage}
        </div>
      )}

      {/* Brand Cover Banner like Anota AI */}
      <div className="w-full h-32 sm:h-40 md:h-52 relative overflow-hidden bg-slate-900 flex-shrink-0">
        <img 
          src={safeSettings.branding.bannerImage || 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=1200'} 
          alt="Capa do Estabelecimento" 
          className="w-full h-full object-cover opacity-80"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=1200';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* Overlapping Restaurant Info Card */}
      <div className="max-w-4xl mx-auto px-4 -mt-12 md:-mt-16 relative z-10 mb-6">
        <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left">
            {/* Round Overlapping Logo */}
            <div className="h-20 w-20 md:h-24 md:w-24 bg-white border-4 border-white rounded-full shadow-md flex items-center justify-center text-3xl md:text-4xl select-none flex-shrink-0 -mt-16 md:-mt-20 overflow-hidden">
              {renderLogo(safeSettings.branding.logo, '🍔')}
            </div>
            
            <div className="space-y-1">
              <div className="flex flex-col md:flex-row items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                  {safeSettings.name}
                </h1>
                {isCurrentlyOpen ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full text-[10px] font-black border border-emerald-200 uppercase animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aberto
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 px-2.5 py-0.5 rounded-full text-[10px] font-black border border-rose-200 uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Fechado
                  </span>
                )}
              </div>
              
              <p className="text-xs text-slate-500 max-w-lg">
                📍 {safeSettings.address}
              </p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2 text-[10px] font-bold text-slate-600">
                <span className="bg-slate-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  ⏱️ {safeSettings.delivery.estimatedTimeMin} min
                </span>
                <span className="bg-slate-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  🏍️ Taxa: R$ {safeSettings.delivery.baseFee.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Virtual Assistant Badge resembling Anota AI */}
          <div className="border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 flex flex-col items-center md:items-start justify-center flex-shrink-0">
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-emerald-200">
              <Sparkles size={12} className="text-emerald-500 animate-spin-slow" /> Atendente Virtual Ativo
            </div>
            <p className="text-[9px] text-slate-400 mt-1 font-medium text-center md:text-left">Cardápio Oficial integrado com WhatsApp</p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4">
        
        {/* Banner Section - iFood Style Carousel */}
        {sortedBanners.length > 0 && !activeOrder && (
          <div className="mb-6 space-y-2">
            <div 
              ref={bannerScrollRef}
              onScroll={handleBannerScroll}
              className="-mx-4 px-4 overflow-x-auto flex gap-3 sm:gap-4 scrollbar-none py-1.5 snap-x snap-mandatory scroll-smooth"
            >
              {sortedBanners.map((banner, index) => (
                <a 
                  key={banner.id || index}
                  href={banner.buttonLink || '#'}
                  target={banner.openNewTab ? '_blank' : '_self'}
                  className="group relative w-[88vw] max-w-[340px] sm:w-[420px] md:w-[500px] h-36 sm:h-44 md:h-52 bg-slate-950 rounded-2xl sm:rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex-shrink-0 snap-center border border-slate-200/60 block select-none"
                >
                  {/* Full Background Image - High Clarity & Vibrancy */}
                  <img 
                    src={banner.image} 
                    alt={banner.title} 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out contrast-[1.06] saturate-[1.08] brightness-[1.02]"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=85&w=1200';
                    }}
                  />

                  {/* Targeted Soft Gradient Overlay - Left side only to keep image 100% visible & bright on right */}
                  <div className="absolute inset-y-0 left-0 w-[62%] sm:w-[55%] bg-gradient-to-r from-slate-950/85 via-slate-950/60 to-transparent z-10 pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent z-10 pointer-events-none sm:hidden" />

                  {/* Content Box */}
                  <div className="relative z-20 h-full p-3.5 sm:p-5 md:p-6 flex flex-col justify-between max-w-[65%] sm:max-w-[58%]">
                    {/* Badge */}
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 bg-red-600 text-white font-black text-[9px] sm:text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md backdrop-blur-xs">
                        <Flame size={11} className="fill-white" /> DESTAQUE
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div className="my-auto space-y-1">
                      <h3 className="font-black text-sm sm:text-base md:text-xl text-white tracking-tight leading-tight drop-shadow-md line-clamp-2">
                        {banner.title}
                      </h3>
                      {banner.description && (
                        <p className="text-[11px] sm:text-xs md:text-sm text-slate-100 line-clamp-2 font-medium leading-snug drop-shadow-sm">
                          {banner.description}
                        </p>
                      )}
                    </div>

                    {/* Button Action */}
                    <div>
                      <span className="inline-flex items-center gap-1.5 bg-red-600 group-hover:bg-red-700 text-white font-extrabold text-[11px] sm:text-xs px-3.5 py-1.5 rounded-full shadow-lg transition-all group-active:scale-95">
                        {banner.buttonText || 'Peça agora'}
                        <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* iFood-style Carousel Dot Indicators */}
            {sortedBanners.length > 1 && (
              <div className="flex justify-center items-center gap-1.5 pt-1">
                {sortedBanners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollToBanner(idx)}
                    aria-label={`Ir para banner ${idx + 1}`}
                    className={`transition-all duration-300 rounded-full ${
                      activeBannerIdx === idx
                        ? 'w-5 sm:w-6 h-2 bg-red-600 shadow-xs'
                        : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search & Categories - Sticky for easy browsing */}
        <div className="bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl shadow-sm mb-6 sticky top-16 z-30 border border-slate-100">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={18} />
            </span>
            <input 
              type="text"
              placeholder="Buscar no cardápio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800 text-sm bg-slate-50/50"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
            <button 
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all snap-start active:scale-95 ${selectedCategory === 'all' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              style={selectedCategory === 'all' ? { backgroundColor: safeSettings.branding.primaryColor } : {}}
            >
              ⭐ Todos
            </button>
            {safeCategories.map((cat) => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all snap-start active:scale-95 flex items-center gap-1 ${selectedCategory === cat.id ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                style={selectedCategory === cat.id ? { backgroundColor: safeSettings.branding.primaryColor } : {}}
              >
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Menu Listings */}
        <div className="space-y-8">
          {safeCategories.filter(c => selectedCategory === 'all' || c.id === selectedCategory).map(cat => {
            const catProducts = filteredProducts.filter(p => p.categoryId === cat.id);
            if (catProducts.length === 0) return null;

            return (
              <div key={cat.id} id={cat.id} className="scroll-mt-36">
                <h2 className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2 mb-3.5 border-b border-slate-200/80 pb-2">
                  {cat.name}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
                  {catProducts.map(product => (
                    <div 
                      key={product.id}
                      onClick={() => handleOpenProduct(product)}
                      className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-2xs border border-slate-100/80 flex gap-3.5 cursor-pointer hover:border-emerald-200 hover:shadow-md transition-all relative overflow-hidden group active:scale-[0.99]"
                    >
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <h3 className="font-bold text-slate-800 text-sm md:text-base group-hover:text-emerald-600 transition-colors line-clamp-1">{product.name}</h3>
                            {product.tag && (
                              <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-md flex-shrink-0">
                                {product.tag}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2 md:line-clamp-3 mb-2 leading-relaxed">{product.description}</p>
                        </div>

                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-baseline gap-1.5">
                            {product.promoPrice ? (
                              <>
                                <span className="font-bold text-emerald-600 text-base" style={{ color: safeSettings.branding.primaryColor }}>
                                  R$ {product.promoPrice.toFixed(2)}
                                </span>
                                <span className="text-xs text-slate-400 line-through">
                                  R$ {product.price.toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span className="font-bold text-slate-800 text-base">
                                R$ {product.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                          
                          <button 
                            className="h-8 w-8 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors flex-shrink-0 shadow-2xs"
                            style={{ color: safeSettings.branding.primaryColor }}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>

                      {product.image && (
                        <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 relative">
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Sticky Floating Bottom Cart Bar (iFood Style) */}
      {cart.length > 0 && !isCartOpen && !selectedProduct && (
        <div className="fixed bottom-4 inset-x-4 max-w-lg mx-auto z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-slate-700/80 active:scale-[0.98] hover:bg-slate-800 transition-all cursor-pointer ring-2 ring-emerald-500/30"
            style={{ backgroundColor: safeSettings.branding.primaryColor || '#0f172a' }}
          >
            <div className="flex items-center gap-3">
              <div className="relative bg-white/20 px-2.5 py-1 rounded-xl text-xs font-black">
                {cart.reduce((s, i) => s + i.quantity, 0)} {cart.reduce((s, i) => s + i.quantity, 0) === 1 ? 'item' : 'itens'}
              </div>
              <span className="font-bold text-xs sm:text-sm">Ver Sacola</span>
            </div>
            <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
              <span>R$ {cartTotal.toFixed(2)}</span>
              <ArrowRight size={16} />
            </div>
          </button>
        </div>
      )}

      {/* Floating Custom Branding Footer bar */}
      <footer className="bg-slate-900 text-slate-400 py-10 mt-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-2">
            <div className="h-10 w-10 flex items-center justify-center text-xl overflow-hidden rounded-full bg-slate-800">
              {renderLogo(safeSettings.branding.logo, '🍔')}
            </div>
          </div>
          <h3 className="font-bold text-white text-base mb-1">{safeSettings.name}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">{safeSettings.address}</p>
          <div className="flex justify-center gap-4 text-slate-400 text-xs mb-6">
            <a href={`https://instagram.com/${safeSettings.instagram}`} className="hover:text-white flex items-center gap-1">Instagram</a>
            <span>•</span>
            <a href={`tel:${safeSettings.phone}`} className="hover:text-white flex items-center gap-1">Telefone</a>
            <span>•</span>
            <a href={`mailto:${safeSettings.email}`} className="hover:text-white flex items-center gap-1">Email</a>
          </div>
          <p className="text-[10px] text-slate-600">Cardápio Online © {new Date().getFullYear()} • iFood Level Premium Setup</p>
        </div>
      </footer>

      {/* Selected Product Addons Modal / Bottom-Sheet */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/50">
            <motion.div 
              initial={{ y: '100%', opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{selectedProduct.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{selectedProduct.description}</p>
                  {selectedProduct.prepTime && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full mt-2">
                      <Clock size={10} /> {selectedProduct.prepTime}
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-1.5 rounded-full"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable addons list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {selectedProduct.image && (
                  <div className="h-44 w-full rounded-2xl overflow-hidden mb-2 bg-slate-50">
                    <img 
                      src={selectedProduct.image} 
                      alt={selectedProduct.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {selectedProduct.options.map((group) => {
                  const selectedCount = (tempOptions[group.id] || []).length;
                  return (
                    <div key={group.id} className="bg-slate-50 p-4 rounded-2xl">
                      <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 pb-1.5">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{group.name}</h4>
                          <p className="text-xs text-slate-500">
                            {group.min > 0 ? `Obrigatório • ` : ''} Selecione de {group.min} a {group.max}
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${selectedCount >= group.min ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {selectedCount}/{group.max}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {group.items.map((item) => {
                          const isSelected = (tempOptions[group.id] || []).some(it => it.id === item.id);
                          return (
                            <div 
                              key={item.id}
                              onClick={() => handleToggleOption(group, item)}
                              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${isSelected ? 'bg-rose-50/60 border-rose-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-300'}`}>
                                  {isSelected && <Check size={12} strokeWidth={3} />}
                                </div>
                                <span className="text-xs font-semibold text-slate-700">{item.name}</span>
                              </div>
                              {item.price > 0 && (
                                <span className="text-xs font-bold text-slate-600">+ R$ {item.price.toFixed(2)}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Notes Input */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 text-sm">Observações</h4>
                  <textarea 
                    placeholder="Ex: Tirar picles, molho à parte, bem passado..."
                    value={tempNotes}
                    onChange={(e) => setTempNotes(e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-xs text-slate-700 h-20 resize-none"
                  />
                </div>
              </div>

              {/* Action purchase bar */}
              <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-4">
                <div className="flex items-center border border-slate-200 rounded-full overflow-hidden">
                  <button 
                    onClick={() => setTempQuantity(q => Math.max(1, q - 1))}
                    className="p-2 px-3 text-slate-500 hover:bg-slate-100"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-bold text-sm text-slate-800 px-2 min-w-[20px] text-center">
                    {tempQuantity}
                  </span>
                  <button 
                    onClick={() => setTempQuantity(q => q + 1)}
                    className="p-2 px-3 text-slate-500 hover:bg-slate-100"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button 
                  onClick={handleAddToCart}
                  className="flex-1 bg-rose-600 text-white py-3 px-4 rounded-full font-bold text-xs md:text-sm flex items-center justify-between hover:bg-rose-700 transition-colors shadow-md"
                  style={{ backgroundColor: safeSettings.branding.primaryColor }}
                >
                  <span>Adicionar ao Carrinho</span>
                  <span>R$ {(currentItemPrice * tempQuantity).toFixed(2)}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cart & Checkout Slide-Over */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
            <div 
              className="absolute inset-0"
              onClick={() => {
                if (!isSubmitting) {
                  setIsCartOpen(false);
                  setIsCheckout(false);
                }
              }}
            />
            
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="bg-white w-full max-w-md h-full flex flex-col relative shadow-2xl z-10"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="text-rose-600" size={20} style={{ color: safeSettings.branding.primaryColor }} />
                  <h3 className="font-bold text-slate-800 text-base">Meu Carrinho</h3>
                </div>
                <button 
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckout(false);
                  }}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-600 p-1.5 rounded-full"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!isCheckout ? (
                  /* Standard Cart Listing View */
                  cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <ShoppingBag size={48} className="text-slate-300 mb-4 animate-bounce" />
                      <h4 className="font-bold text-slate-700 text-sm">Seu carrinho está vazio</h4>
                      <p className="text-xs text-slate-500 max-w-xs mt-1">Navegue pelas deliciosas opções do cardápio e adicione seus itens favoritos!</p>
                      <button 
                        onClick={() => setIsCartOpen(false)}
                        className="bg-rose-600 text-white mt-6 px-5 py-2.5 rounded-full text-xs font-semibold hover:bg-rose-700 transition-all"
                        style={{ backgroundColor: safeSettings.branding.primaryColor }}
                      >
                        Ver Cardápio
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3 relative">
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-800 text-xs md:text-sm">{item.product.name}</h4>
                            
                            {item.selectedOptions.map((g, gi) => (
                              <p key={gi} className="text-[10px] text-slate-500 mt-0.5">
                                <span className="font-medium text-slate-600">{g.groupName}:</span> {g.items.map(i => i.name).join(', ')}
                              </p>
                            ))}

                            {item.notes && (
                              <p className="text-[10px] text-amber-600 italic mt-1 bg-amber-50 p-1.5 rounded-lg border border-amber-100">
                                " {item.notes} "
                              </p>
                            )}

                            <div className="flex items-center justify-between mt-3">
                              <span className="font-bold text-xs text-slate-700">R$ {(item.itemPrice * item.quantity).toFixed(2)}</span>
                              
                              <div className="flex items-center border border-slate-200 rounded-full overflow-hidden bg-white">
                                <button 
                                  onClick={() => handleUpdateCartQuantity(item.id, -1)}
                                  className="p-1 px-2.5 text-slate-500 hover:bg-slate-100"
                                >
                                  <Minus size={11} />
                                </button>
                                <span className="font-bold text-xs text-slate-800 px-1.5">{item.quantity}</span>
                                <button 
                                  onClick={() => handleUpdateCartQuantity(item.id, 1)}
                                  className="p-1 px-2.5 text-slate-500 hover:bg-slate-100"
                                >
                                  <Plus size={11} />
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          {item.product.image && (
                            <div className="h-14 w-14 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                              <img 
                                src={item.product.image} 
                                alt={item.product.name} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Coupon Box */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                        <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <Sparkles size={14} className="text-rose-600" /> Possui Cupom de Desconto?
                        </h4>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Código do Cupom"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            disabled={!!activeCoupon}
                            className="flex-1 bg-white border border-slate-200 px-3 py-1.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 text-xs"
                          />
                          {activeCoupon ? (
                            <button 
                              onClick={() => {
                                setActiveCoupon(null);
                                setCouponCode('');
                                setCouponSuccess('');
                              }}
                              className="bg-slate-200 text-slate-600 hover:bg-slate-300 px-3 rounded-xl text-xs font-bold"
                            >
                              Remover
                            </button>
                          ) : (
                            <button 
                              onClick={handleApplyCoupon}
                              className="bg-slate-800 text-white hover:bg-slate-900 px-4 rounded-xl text-xs font-bold transition-colors"
                            >
                              Aplicar
                            </button>
                          )}
                        </div>
                        {couponError && <p className="text-[10px] text-rose-600 font-semibold">{couponError}</p>}
                        {couponSuccess && <p className="text-[10px] text-emerald-600 font-semibold">{couponSuccess}</p>}
                      </div>
                    </div>
                  )
                ) : (
                  /* Formal Mandatory Fields Checkout View */
                  <form id="checkoutForm" onSubmit={handleCheckoutSubmit} className="space-y-4">
                    <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl">
                      <h4 className="text-xs font-bold text-rose-800">Dados do Pedido</h4>
                      <p className="text-[10px] text-rose-600 mt-0.5">Preencha os dados abaixo obrigatoriamente para concluir seu pedido.</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nome Completo *</label>
                        <input 
                          type="text"
                          required
                          value={checkoutName}
                          onChange={(e) => setCheckoutName(e.target.value)}
                          placeholder="Digite seu nome"
                          className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">WhatsApp (Celular) *</label>
                        <input 
                          type="tel"
                          required
                          value={checkoutPhone}
                          onChange={(e) => setCheckoutPhone(e.target.value)}
                          placeholder="Ex: 11999998888"
                          className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        />
                      </div>

                      {/* Deliver or Pickup Switch */}
                      {safeSettings.delivery.allowPickup && (
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                          <button 
                            type="button"
                            onClick={() => setIsPickup(false)}
                            className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${!isPickup ? 'bg-white shadow-xs text-slate-800' : 'text-slate-500'}`}
                          >
                            🛵 Receber em Casa
                          </button>
                          <button 
                            type="button"
                            onClick={() => setIsPickup(true)}
                            className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${isPickup ? 'bg-white shadow-xs text-slate-800' : 'text-slate-500'}`}
                          >
                            🏢 Retirar no Balcão
                          </button>
                        </div>
                      )}

                      {!isPickup ? (
                        /* Delivery Fields */
                        <div className="space-y-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          <h4 className="text-xs font-bold text-slate-800">Endereço de Entrega</h4>

                          <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2">
                              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Rua / Logradouro *</label>
                              <input 
                                type="text"
                                required={!isPickup}
                                value={checkoutStreet}
                                onChange={(e) => setCheckoutStreet(e.target.value)}
                                placeholder="Digite a rua"
                                className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Número *</label>
                              <input 
                                type="text"
                                required={!isPickup}
                                value={checkoutNumber}
                                onChange={(e) => setCheckoutNumber(e.target.value)}
                                placeholder="Nº"
                                className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Bairro / Região *</label>
                              <select 
                                required={!isPickup}
                                value={checkoutNeighborhood}
                                onChange={(e) => setCheckoutNeighborhood(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                              >
                                <option value="">Selecione...</option>
                                {safeSettings.delivery.neighborhoods.map(n => (
                                  <option key={n.id} value={n.name}>{n.name} (+ R$ {n.fee.toFixed(2)})</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">CEP *</label>
                              <input 
                                type="tel"
                                required={!isPickup}
                                value={checkoutCep}
                                onChange={(e) => setCheckoutCep(e.target.value)}
                                placeholder="00000-000"
                                className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Complemento (Opcional)</label>
                            <input 
                              type="text"
                              value={checkoutComplement}
                              onChange={(e) => setCheckoutComplement(e.target.value)}
                              placeholder="Apto, Bloco, etc."
                              className="w-full border border-slate-200 rounded-xl p-2 text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Ponto de Referência (Opcional)</label>
                            <input 
                              type="text"
                              value={checkoutReference}
                              onChange={(e) => setCheckoutReference(e.target.value)}
                              placeholder="Próximo de onde?"
                              className="w-full border border-slate-200 rounded-xl p-2 text-xs"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200">
                          <h4 className="text-xs font-bold text-amber-800">Endereço para Retirada</h4>
                          <p className="text-[11px] text-amber-700 mt-1 font-semibold">{safeSettings.address}</p>
                          <p className="text-[10px] text-slate-500 mt-1">Sua encomenda estará pronta em aproximadamente {safeSettings.delivery.estimatedTimeMin} minutos.</p>
                        </div>
                      )}

                      {/* Payment Method Selection */}
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-slate-800">Forma de Pagamento</h4>
                          <span className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1">🔒 Ambiente Seguro</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {activePaymentMethods.map((method) => {
                            const isSelected = paymentMethod === method.id;
                            let themeClass = 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50/50';
                            
                            if (isSelected) {
                              if (method.id === 'pix' || method.id === 'online_pix') {
                                themeClass = 'bg-teal-50 border-teal-500 text-teal-800 ring-1 ring-teal-500';
                              } else if (method.id === 'cash') {
                                themeClass = 'bg-amber-50 border-amber-500 text-amber-800 ring-1 ring-amber-500';
                              } else if (method.id === 'meal_voucher' || method.id === 'food_voucher') {
                                themeClass = 'bg-rose-50 border-rose-500 text-rose-800 ring-1 ring-rose-500';
                              } else {
                                themeClass = 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500';
                              }
                            }

                            return (
                              <button 
                                key={method.id}
                                type="button"
                                onClick={() => {
                                  setPaymentMethod(method.id);
                                }}
                                className={`p-2 rounded-xl border flex flex-col items-start gap-0.5 text-left transition-all ${themeClass}`}
                              >
                                <div className="flex items-center gap-1">
                                  <span className="text-xs">{method.icon}</span>
                                  <span className="text-[11px] font-bold leading-none">{method.name}</span>
                                </div>
                                <span className="text-[8px] text-slate-400 font-normal leading-tight">{method.desc}</span>
                              </button>
                            );
                          })}
                        </div>

                        {paymentMethod === 'cash' && (
                          <div className="space-y-1 bg-white p-2 rounded-xl border">
                            <label className="block text-[10px] font-semibold text-slate-500">Troco para quanto? (Deixe em branco se não precisar)</label>
                            <input 
                              type="number"
                              value={cashChange}
                              onChange={(e) => setCashChange(e.target.value)}
                              placeholder="Ex: 50 ou 100"
                              className="w-full border-none p-1 text-xs focus:outline-none focus:ring-0"
                            />
                          </div>
                        )}

                        {paymentMethod === 'pix' && (
                          <div className="bg-teal-900 text-teal-50 p-4 rounded-xl space-y-2 text-center relative overflow-hidden">
                            <h5 className="text-[10px] uppercase font-bold tracking-wider text-teal-300">DADOS PARA PAGAMENTO PIX</h5>
                            <p className="text-xs font-bold">{safeSettings.pix.receiverName}</p>
                            <p className="text-[10px] text-teal-200 break-all bg-teal-950/40 p-2 rounded-lg font-mono leading-tight">{safeSettings.pix.copyPasteText}</p>
                            <button 
                              type="button"
                              onClick={handleCopyPix}
                              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Clipboard size={12} /> {pixCopied ? 'Chave Copiada! ✓' : 'Copiar Código Pix'}
                            </button>
                            <p className="text-[9px] text-teal-300">Conclua a transferência e anexe o comprovante após enviar o pedido se necessário.</p>
                          </div>
                        )}

                        {/* Transparent Checkout Credit/Debit Card Details Form */}
                        {(paymentMethod === 'online_credit' || paymentMethod === 'online_debit') && (
                          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3 animate-fadeIn">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                              <span className="text-[10px] font-bold text-slate-700 uppercase flex items-center gap-1">
                                💳 Dados do Cartão {paymentMethod === 'online_credit' ? 'de Crédito' : 'de Débito'}
                              </span>
                              <span className="text-[8px] bg-emerald-50 text-emerald-600 font-bold px-1.5 py-0.5 rounded border border-emerald-100">
                                Checkout Transparente
                              </span>
                            </div>

                            <div className="space-y-2.5 text-xs">
                              <div>
                                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Número do Cartão</label>
                                <input 
                                  type="tel"
                                  inputMode="numeric"
                                  required
                                  placeholder="0000 0000 0000 0000"
                                  value={ccNumber}
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(/\D/g, '').substring(0, 16);
                                    const masked = raw.match(/.{1,4}/g)?.join(' ') || raw;
                                    setCcNumber(masked);
                                  }}
                                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
                                />
                              </div>

                              <div>
                                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Nome impresso no Cartão</label>
                                <input 
                                  type="text"
                                  required
                                  placeholder="COMO ESTÁ NO CARTÃO"
                                  value={ccName}
                                  onChange={(e) => setCcName(e.target.value.toUpperCase())}
                                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Validade (MM/AA)</label>
                                  <input 
                                    type="tel"
                                    inputMode="numeric"
                                    required
                                    placeholder="MM/AA"
                                    value={ccExpiry}
                                    onChange={(e) => {
                                      const raw = e.target.value.replace(/\D/g, '').substring(0, 4);
                                      const masked = raw.length > 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw;
                                      setCcExpiry(masked);
                                    }}
                                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Código CVV</label>
                                  <input 
                                    type="password"
                                    inputMode="numeric"
                                    required
                                    placeholder="123"
                                    value={ccCvv}
                                    onChange={(e) => setCcCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">CPF do Titular</label>
                                  <input 
                                    type="tel"
                                    inputMode="numeric"
                                    required
                                    placeholder="000.000.000-00"
                                    value={ccCpf}
                                    onChange={(e) => {
                                      const raw = e.target.value.replace(/\D/g, '').substring(0, 11);
                                      let masked = raw;
                                      if (raw.length > 9) {
                                        masked = `${raw.slice(0,3)}.${raw.slice(3,6)}.${raw.slice(6,9)}-${raw.slice(9)}`;
                                      } else if (raw.length > 6) {
                                        masked = `${raw.slice(0,3)}.${raw.slice(3,6)}.${raw.slice(6)}`;
                                      } else if (raw.length > 3) {
                                        masked = `${raw.slice(0,3)}.${raw.slice(3)}`;
                                      }
                                      setCcCpf(masked);
                                    }}
                                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
                                  />
                                </div>
                                
                                {paymentMethod === 'online_credit' ? (
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Parcelamento</label>
                                    <select 
                                      value={ccInstallments}
                                      onChange={(e) => setCcInstallments(e.target.value)}
                                      className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
                                    >
                                      <option value="1">1x sem juros</option>
                                      <option value="2">2x sem juros</option>
                                      <option value="3">3x sem juros</option>
                                      <option value="4">4x com juros</option>
                                      <option value="6">6x com juros</option>
                                      <option value="12">12x com juros</option>
                                    </select>
                                  </div>
                                ) : (
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Modalidade</label>
                                    <input 
                                      type="text" 
                                      readOnly 
                                      value="À vista (Débito)" 
                                      className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-slate-100 text-slate-500 font-semibold focus:outline-none" 
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* PIX Online notice */}
                        {paymentMethod === 'online_pix' && (
                          <div className="bg-emerald-900 text-emerald-50 p-4 rounded-xl space-y-2 text-center relative overflow-hidden animate-fadeIn border border-emerald-800">
                            <h5 className="text-[10px] uppercase font-bold tracking-wider text-emerald-300">PIX ONLINE IMEDIATO</h5>
                            <p className="text-xs font-bold leading-normal">Um QR Code oficial de aprovação instantânea será gerado ao finalizar o pedido.</p>
                            <p className="text-[9px] text-emerald-200">Você poderá ler o QR Code ou copiar a chave "Pix Copia e Cola" oficial direto na tela de acompanhamento.</p>
                          </div>
                        )}

                        {/* Online wallet notice */}
                        {paymentMethod === 'online_wallet' && (
                          <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2.5 text-center relative overflow-hidden animate-fadeIn border border-slate-800">
                            <h5 className="text-[10px] uppercase font-bold tracking-wider text-slate-400">CARTEIRA DIGITAL</h5>
                            <p className="text-xs font-bold leading-normal">Pague com Apple Pay, Google Pay ou carteiras digitais.</p>
                            <button 
                              type="button"
                              className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors focus:outline-none"
                            >
                              <span>📱</span> Pagar com Carteira Rápida
                            </button>
                            <p className="text-[9px] text-slate-400">A autenticação biométrica será solicitada após o envio do pedido.</p>
                          </div>
                        )}

                        {/* Voucher / delivery card notice */}
                        {(paymentMethod === 'meal_voucher' || paymentMethod === 'food_voucher' || paymentMethod === 'delivery_payment') && (
                          <div className="bg-slate-100 text-slate-700 p-3 rounded-xl border border-slate-200 text-center animate-fadeIn">
                            <span className="text-xs font-bold block mb-0.5">💳 Pagamento na Entrega ou Retirada</span>
                            <p className="text-[10px] leading-normal text-slate-500">
                              O entregador levará a máquina de cartões ou receberá o seu vale-alimentação/refeição diretamente com você no ato da entrega.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </form>
                )}
              </div>

              {/* Dynamic Bottom Pricing ledger & CTA */}
              {cart.length > 0 && (
                <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-3">
                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-semibold text-slate-800">R$ {cartSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa de entrega {isPickup ? '(Retirada)' : ''}:</span>
                      <span className="font-semibold text-slate-800">
                        {totalDeliveryFee === 0 ? 'Grátis' : `R$ ${totalDeliveryFee.toFixed(2)}`}
                      </span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Desconto Cupom:</span>
                        <span className="font-bold">- R$ {discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-slate-800 font-bold border-t border-slate-200 pt-2">
                      <span>Total Geral:</span>
                      <span className="text-base text-rose-600" style={{ color: safeSettings.branding.primaryColor }}>
                        R$ {cartTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {!isCheckout ? (
                    <button 
                      onClick={() => setIsCheckout(true)}
                      className="w-full bg-rose-600 text-white py-3.5 rounded-full font-bold text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-rose-700 transition-colors shadow-md"
                      style={{ backgroundColor: safeSettings.branding.primaryColor }}
                    >
                      <span>Prosseguir para a Entrega</span>
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => setIsCheckout(false)}
                        className="bg-slate-200 text-slate-700 font-semibold px-4 rounded-full text-xs hover:bg-slate-300 transition-colors"
                      >
                        Voltar
                      </button>
                      <button 
                        type="submit"
                        form="checkoutForm"
                        disabled={isSubmitting}
                        className="flex-1 bg-rose-600 text-white py-3.5 rounded-full font-bold text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-rose-700 transition-colors shadow-md disabled:opacity-50"
                        style={{ backgroundColor: safeSettings.branding.primaryColor }}
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" /> Processando...
                          </>
                        ) : (
                          <>
                            <span>Enviar Pedido pelo WhatsApp</span>
                            <CheckCircle size={16} />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Sticky Cart Bar like Anota AI */}
      <AnimatePresence>
        {cart.length > 0 && !isCartOpen && !isCheckout && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 inset-x-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl z-45"
          >
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black px-5 py-4 rounded-2xl shadow-xl flex items-center justify-between transition-all active:scale-98 cursor-pointer border border-emerald-400/20"
              style={{ backgroundColor: safeSettings.branding.primaryColor }}
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <ShoppingCart size={18} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-white/80 uppercase tracking-widest font-black">Sacola de Pedidos</p>
                  <p className="text-xs text-white font-bold">{cart.reduce((s, i) => s + i.quantity, 0)} {cart.reduce((s, i) => s + i.quantity, 0) === 1 ? 'item' : 'itens'} adicionado{cart.reduce((s, i) => s + i.quantity, 0) === 1 ? '' : 's'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/90 font-medium">Ver Sacola</span>
                <span className="bg-white/25 px-2.5 py-1 rounded-xl text-sm font-black text-white">R$ {cartTotal.toFixed(2)}</span>
                <ArrowRight size={16} />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Instagram and WhatsApp Buttons like Anota AI */}
      <div className="fixed bottom-24 right-4 flex flex-col gap-3 z-40">
        {safeSettings.instagram && (
          <motion.a
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            href={`https://instagram.com/${safeSettings.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-xl hover:shadow-2xl transition-all border border-white/20 cursor-pointer"
            title="Siga-nos no Instagram"
          >
            <Instagram size={22} />
          </motion.a>
        )}
        {safeSettings.whatsapp && (
          <motion.a
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            href={`https://wa.me/55${safeSettings.whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-xl hover:shadow-2xl transition-all border border-emerald-400 cursor-pointer"
            title="Fale conosco no WhatsApp"
          >
            <MessageCircle size={22} />
          </motion.a>
        )}
      </div>
    </div>
  );
}
