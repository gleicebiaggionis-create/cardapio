import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShoppingBag, Search, Plus, Minus, X, ArrowRight, Check, Clock, Phone, 
  MapPin, Clipboard, AlertCircle, RefreshCw, CheckCircle, Sparkles, ArrowLeft, ShoppingCart, HelpCircle,
  Instagram, MessageCircle, Flame, Tag, Upload, Camera, FileText, Send, Image, Calendar, ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Category, Product, Banner, Coupon, Order, OrderAddress, OptionGroup, OptionItem, RestaurantSettings, Combo } from '../types';
import { compressImage } from '../lib/imageUtils';

interface OnlineMenuProps {
  settings: RestaurantSettings;
  categories: Category[];
  products: Product[];
  combos?: Combo[];
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
  combos = [],
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
      theme: settings?.branding?.theme || 'light',
      mobileCols: settings?.branding?.mobileCols || '1',
      desktopCols: settings?.branding?.desktopCols || '3',
      cardStyle: settings?.branding?.cardStyle || 'horizontal',
      buttonStyle: settings?.branding?.buttonStyle || 'solid',
      categoryStyle: settings?.branding?.categoryStyle || 'pills',
      priceStyle: settings?.branding?.priceStyle || 'badge',
      spacingDensity: settings?.branding?.spacingDensity || 'comfortable',
      imageFit: settings?.branding?.imageFit || 'contain',
      borderRadius: settings?.branding?.borderRadius || 'rounded-2xl',
      headerLayout: settings?.branding?.headerLayout || 'banner',
      hoverEffect: settings?.branding?.hoverEffect || 'shadow'
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
      openMessage: settings?.operational?.openMessage || '🟢 Estamos abertos! Faça seu pedido online.',
      showClosedMessage: settings?.operational?.showClosedMessage !== false,
      forceStatus: settings?.operational?.forceStatus || 'auto',
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
    floatingButtons: settings?.floatingButtons || {
      whatsapp: { number: settings?.whatsapp || '11999998888', message: '', icon: 'MessageCircle', color: '#25D366', position: 'bottom-right', isVisible: true },
      instagram: { link: settings?.instagram || 'brazzunoburger', icon: 'Instagram', color: '#E1306C', position: 'bottom-left', isVisible: true }
    },
    checkoutTransparenteActive: settings?.checkoutTransparenteActive ?? false,
    selectedGatewayId: settings?.selectedGatewayId || 'mercadopago'
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());
  const bannerScrollRef = React.useRef<HTMLDivElement>(null);

  // Design & Layout preferences
  const mobileCols = safeSettings.branding.mobileCols || '1';
  const desktopCols = safeSettings.branding.desktopCols || '3';
  const cardStyle = safeSettings.branding.cardStyle || 'horizontal';
  const buttonStyle = safeSettings.branding.buttonStyle || 'solid';
  const categoryStyle = safeSettings.branding.categoryStyle || 'pills';
  const priceStyle = safeSettings.branding.priceStyle || 'badge';
  const spacingDensity = safeSettings.branding.spacingDensity || 'comfortable';
  const imageFit = safeSettings.branding.imageFit || 'contain';
  const borderRadius = safeSettings.branding.borderRadius || 'rounded-2xl';
  const hoverEffect = safeSettings.branding.hoverEffect || 'shadow';
  const headerLayout = safeSettings.branding.headerLayout || 'banner';

  const gridGapClass = useMemo(() => {
    if (spacingDensity === 'compact') return 'gap-2 sm:gap-2.5';
    if (spacingDensity === 'spacious') return 'gap-4 sm:gap-6';
    return 'gap-3 sm:gap-4';
  }, [spacingDensity]);

  const gridContainerClass = useMemo(() => {
    const mColClass = mobileCols === '2' ? 'grid-cols-2' : 'grid-cols-1';
    let dColClass = 'md:grid-cols-2 lg:grid-cols-3';
    if (desktopCols === '2') dColClass = 'md:grid-cols-2';
    if (desktopCols === '4') dColClass = 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

    return `grid ${mColClass} ${dColClass} ${gridGapClass}`;
  }, [mobileCols, desktopCols, gridGapClass]);

  const cardStyleClass = useMemo(() => {
    if (cardStyle === 'glass') return 'bg-white/85 backdrop-blur-md border border-white/60 shadow-xs';
    if (cardStyle === 'gourmet') return 'bg-gradient-to-b from-white to-amber-50/30 border border-amber-200/60 shadow-md';
    return 'bg-white shadow-2xs border border-slate-100/80';
  }, [cardStyle]);

  const buttonStyleClass = useMemo(() => {
    if (buttonStyle === 'gradient') return 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs hover:brightness-105';
    if (buttonStyle === 'outline') return 'bg-transparent border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white';
    if (buttonStyle === 'pill') return 'bg-emerald-600 text-white rounded-full px-3 py-1 font-bold shadow-xs';
    return 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white';
  }, [buttonStyle]);

  const hoverClass = useMemo(() => {
    if (hoverEffect === 'border') return 'hover:border-emerald-500 hover:ring-2 hover:ring-emerald-500/20';
    if (hoverEffect === 'scale') return 'hover:scale-[1.02] hover:shadow-md';
    return 'hover:shadow-md hover:border-emerald-200';
  }, [hoverEffect]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

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
        el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: 'smooth' });
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
  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null);
  
  const safeCombos = useMemo(() => (combos || []).filter(c => c.isAvailable), [combos]);
  
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

  // Notifications & Pix Proof
  const [pixCopied, setPixCopied] = useState(false);
  const [pixProofImage, setPixProofImage] = useState<string | null>(null);
  const [pixProofName, setPixProofName] = useState<string>('');

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

  // Cover Banner Deck (Combines main store cover and active promotional banners for header slider)
  const coverBannerDeck = useMemo(() => {
    const list = [];
    if (safeSettings.branding.bannerImage) {
      list.push({
        id: 'cover-main',
        image: safeSettings.branding.bannerImage,
        title: safeSettings.name,
        description: '',
        buttonText: '',
        buttonLink: ''
      });
    }
    sortedBanners.forEach(b => {
      if (b.image !== safeSettings.branding.bannerImage) {
        list.push(b);
      }
    });
    if (list.length === 0) {
      list.push({
        id: 'default-cover',
        image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=1200',
        title: safeSettings.name,
        description: '',
        buttonText: '',
        buttonLink: ''
      });
    }
    return list;
  }, [safeSettings.branding.bannerImage, safeSettings.name, sortedBanners]);

  const [activeCoverIdx, setActiveCoverIdx] = useState(0);
  const [isCoverAutoPlayPaused, setIsCoverAutoPlayPaused] = useState(false);

  // Auto-play interval for top header banner deck (slides every 4 seconds)
  useEffect(() => {
    if (coverBannerDeck.length <= 1 || isCoverAutoPlayPaused) return;

    const interval = setInterval(() => {
      setActiveCoverIdx((prev) => (prev + 1) % coverBannerDeck.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [coverBannerDeck.length, isCoverAutoPlayPaused]);

  // Auto-play interval for main body promotional banners carousel
  const [isBannerAutoPlayPaused, setIsBannerAutoPlayPaused] = useState(false);

  useEffect(() => {
    if (sortedBanners.length <= 1 || isBannerAutoPlayPaused) return;

    const interval = setInterval(() => {
      setActiveBannerIdx((prevIdx) => {
        const nextIdx = (prevIdx + 1) % sortedBanners.length;
        if (bannerScrollRef.current) {
          const el = bannerScrollRef.current;
          const child = el.children[nextIdx] as HTMLElement;
          if (child) {
            el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: 'smooth' });
          }
        }
        return nextIdx;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [sortedBanners.length, isBannerAutoPlayPaused]);

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

  const currentComboPrice = useMemo(() => {
    if (!selectedCombo) return 0;
    let optionsPrice = 0;
    (Object.values(tempOptions) as OptionItem[][]).forEach(items => {
      items.forEach(it => {
        optionsPrice += it.price;
      });
    });

    return selectedCombo.price + optionsPrice;
  }, [selectedCombo, tempOptions]);

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

  const handleOpenCombo = (combo: Combo) => {
    setSelectedCombo(combo);
    setTempQuantity(1);
    setTempNotes('');
    
    const initial: { [key: string]: OptionItem[] } = {};
    if (combo.options) {
      combo.options.forEach(group => {
        if (group.min === 1 && group.items.length > 0) {
          initial[group.id] = [group.items[0]];
        } else {
          initial[group.id] = [];
        }
      });
    }
    setTempOptions(initial);
  };

  const handleAddComboToCart = () => {
    if (!selectedCombo) return;

    if (selectedCombo.options) {
      for (const group of selectedCombo.options) {
        const selected = tempOptions[group.id] || [];
        if (selected.length < group.min) {
          alert(`Por favor, selecione no mínimo ${group.min} opção(ões) de "${group.name}".`);
          return;
        }
      }
    }

    const selectedOptionsList = (selectedCombo.options || []).map(group => ({
      groupName: group.name,
      items: (tempOptions[group.id] || []).map(i => ({ name: i.name, price: i.price }))
    })).filter(g => g.items.length > 0);

    const itemsSummary = selectedCombo.items?.map(i => `${i.quantity}x ${i.name}`).join(', ');

    const selectionString = JSON.stringify(selectedOptionsList);
    const cartItemId = `combo-${selectedCombo.id}-${selectionString}`;

    const comboProduct: Product = {
      id: selectedCombo.id,
      name: `🎁 ${selectedCombo.name}`,
      description: itemsSummary ? `Combo com: ${itemsSummary}` : selectedCombo.description,
      price: selectedCombo.price,
      image: selectedCombo.image,
      categoryId: 'combos',
      isAvailable: true,
      isBestSeller: false,
      isNew: false,
      isPromo: true,
      sortOrder: selectedCombo.sortOrder,
      options: selectedCombo.options || []
    };

    let optionsPrice = 0;
    (Object.values(tempOptions) as OptionItem[][]).forEach(items => {
      items.forEach(it => { optionsPrice += it.price; });
    });
    const comboPrice = selectedCombo.price + optionsPrice;

    const existingIndex = cart.findIndex(i => i.id === cartItemId);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += tempQuantity;
      setCart(updated);
    } else {
      setCart([...cart, {
        id: cartItemId,
        product: comboProduct,
        quantity: tempQuantity,
        notes: tempNotes ? `${itemsSummary ? `[Itens: ${itemsSummary}] ` : ''}${tempNotes}` : (itemsSummary ? `[Itens: ${itemsSummary}]` : ''),
        selectedOptions: selectedOptionsList,
        itemPrice: comboPrice
      }]);
    }

    setSelectedCombo(null);
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
        ...(paymentMethod === 'pix' || paymentMethod === 'online_pix' ? {
          pixProofUrl: pixProofImage || undefined,
          pixProofName: pixProofName || undefined
        } : {}),
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
      total: cartTotal,
      isScheduled: !isCurrentlyOpen || isScheduled,
      scheduledDate: (!isCurrentlyOpen || isScheduled) ? (selectedScheduleDate || availableScheduleDates[0]?.value) : undefined,
      scheduledTime: (!isCurrentlyOpen || isScheduled) ? (selectedScheduleTime || '19:00') : undefined
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
      setPixProofImage(null);
      setPixProofName('');
    }
  };

  const handleCopyPix = (textOverride?: string) => {
    const textToCopy = textOverride || safeSettings.pix.copyPasteText || safeSettings.pix.keyValue || '';
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 3000);

      // Open WhatsApp automatically without refreshing or altering screen state
      const storePhone = (safeSettings.phone || safeSettings.whatsapp || '11999998888').replace(/\D/g, '');
      const clientName = checkoutName?.trim() ? ` (${checkoutName.trim()})` : '';
      const whatsappMsg = `Olá! Copiei a chave PIX para pagamento do meu pedido${clientName}. Já fiz/estou fazendo a transferência e já te mando o comprovante por aqui! 🌀`;
      const waUrl = `https://api.whatsapp.com/send?phone=55${storePhone}&text=${encodeURIComponent(whatsappMsg)}`;
      
      // Open in a new tab without refreshing the current app window
      window.open(waUrl, '_blank');
    }
  };

  // Double check operation hours
  const isCurrentlyOpen = useMemo(() => {
    const force = safeSettings.operational?.forceStatus;
    if (force === 'open') return true;
    if (force === 'closed') return false;

    const nowLocal = new Date();
    const day = nowLocal.getDay(); // 0 to 6
    const minutesNow = nowLocal.getHours() * 60 + nowLocal.getMinutes();

    // 1. Check today's schedule
    const todaySetting = safeSettings.operational?.hours?.find(h => h.dayOfWeek === day);
    if (todaySetting && todaySetting.isOpen && todaySetting.slots) {
      const isTodayOpen = todaySetting.slots.some(slot => {
        if (!slot.open || !slot.close) return false;
        const [sh, sm] = slot.open.split(':').map(Number);
        const [eh, em] = slot.close.split(':').map(Number);
        
        const startMinutes = sh * 60 + sm;
        let endMinutes = eh * 60 + em;
        
        if (endMinutes < startMinutes) {
          // Crosses midnight (e.g. 18:00 to 02:00)
          return minutesNow >= startMinutes;
        }
        
        return minutesNow >= startMinutes && minutesNow <= endMinutes;
      });
      if (isTodayOpen) return true;
    }

    // 2. Check yesterday's schedule for overnight shifts (e.g., 18:00 to 02:00)
    const yesterday = (day + 6) % 7;
    const yesterdaySetting = safeSettings.operational?.hours?.find(h => h.dayOfWeek === yesterday);
    if (yesterdaySetting && yesterdaySetting.isOpen && yesterdaySetting.slots) {
      const isYesterdayShiftActive = yesterdaySetting.slots.some(slot => {
        if (!slot.open || !slot.close) return false;
        const [sh, sm] = slot.open.split(':').map(Number);
        const [eh, em] = slot.close.split(':').map(Number);
        
        const startMinutes = sh * 60 + sm;
        const endMinutes = eh * 60 + em;
        
        if (endMinutes < startMinutes) {
          // Yesterday's shift ended early this morning (e.g., 02:00)
          return minutesNow < endMinutes;
        }
        return false;
      });
      if (isYesterdayShiftActive) return true;
    }

    return false;
  }, [safeSettings, nowTick]);

  // Scheduling state
  const [isScheduled, setIsScheduled] = useState(false);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState('');
  const [selectedScheduleTime, setSelectedScheduleTime] = useState('19:00');

  // Dynamic available schedule dates
  const availableScheduleDates = useMemo(() => {
    const dates = [];
    const now = new Date();
    const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    
    for (let i = 0; i < 4; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const dayName = i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : dayNames[d.getDay()];
      const formattedDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      dates.push({
        value: `${dayName}, ${formattedDate}`,
        label: `${dayName} (${formattedDate})`
      });
    }
    return dates;
  }, []);

  const defaultTimeSlots = useMemo(() => [
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'
  ], []);

  useEffect(() => {
    if (!selectedScheduleDate && availableScheduleDates.length > 0) {
      setSelectedScheduleDate(availableScheduleDates[0].value);
    }
  }, [availableScheduleDates, selectedScheduleDate]);

  useEffect(() => {
    if (!isCurrentlyOpen) {
      setIsScheduled(true);
    }
  }, [isCurrentlyOpen]);

  const renderLogo = (logo: string, fallbackEmoji: string = '🍔', imgClass: string = 'w-full h-full object-contain p-0.5') => {
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
        fontFamily: safeSettings.branding.fontFamily ? `'${safeSettings.branding.fontFamily}', sans-serif` : 'inherit',
        '--primary': safeSettings.branding.primaryColor 
      } as React.CSSProperties}
    >
      
      {/* Dynamic SEO & Custom branding theme container */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs transition-all">
        <div className="max-w-4xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 flex items-center justify-center overflow-hidden rounded-full bg-slate-100 flex-shrink-0 text-xl border border-slate-200/60 shadow-2xs">
              {renderLogo(safeSettings.branding.logo, '🔥')}
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg text-slate-900 flex items-center gap-2 tracking-tight">
                {safeSettings.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeOrder && (
              <button 
                onClick={() => setActiveOrder(activeOrder)}
                className={`text-xs px-3 py-1.5 rounded-full font-extrabold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                  activeOrder.status === 'delivered' 
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 animate-bounce'
                    : 'bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {activeOrder.status === 'delivered' ? (
                  <>🎉 Confirmar Entrega #{activeOrder.code}</>
                ) : (
                  <><RefreshCw size={13} className="animate-spin text-emerald-600" /> Acompanhar Pedido #{activeOrder.code}</>
                )}
              </button>
            )}
            
            <button 
              onClick={() => setIsCartOpen(true)}
              className="bg-emerald-600 text-white p-2.5 rounded-2xl shadow-sm flex items-center justify-center relative hover:bg-emerald-700 transition-all active:scale-95 cursor-pointer"
              style={{ backgroundColor: safeSettings.branding.primaryColor }}
            >
              <ShoppingBag size={20} />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-950 font-black text-[11px] h-5 w-5 flex items-center justify-center rounded-full border-2 border-white shadow-xs">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Operational State Banner */}
      {safeSettings.operational.showClosedMessage !== false && (
        isCurrentlyOpen ? (
          <div className="bg-emerald-600 text-white px-4 py-2 text-center text-xs md:text-sm font-semibold shadow-xs flex items-center justify-center gap-2">
            <span>🟢</span> {safeSettings.operational.openMessage || 'Estamos abertos! Faça seu pedido online agora.'}
          </div>
        ) : (
          <div className="bg-amber-500 text-white px-4 py-2.5 text-center text-xs md:text-sm font-semibold shadow-xs flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3">
            <div className="flex items-center gap-1.5">
              <span>🌙</span>
              <span>{safeSettings.operational.closedMessage || 'Restaurante Fechado no Momento'}</span>
            </div>
            <span className="bg-amber-600/90 text-amber-50 px-2.5 py-0.5 rounded-full text-[11px] font-black border border-amber-300/40 flex items-center gap-1">
              <Calendar size={12} /> Faça seu pedido agora e agende a entrega!
            </span>
          </div>
        )
      )}

      {/* Brand Cover Banner (Auto-Sliding Slider Deck) */}
      <div 
        onMouseEnter={() => setIsCoverAutoPlayPaused(true)}
        onMouseLeave={() => setIsCoverAutoPlayPaused(false)}
        onTouchStart={() => setIsCoverAutoPlayPaused(true)}
        onTouchEnd={() => setIsCoverAutoPlayPaused(false)}
        className="w-full h-44 sm:h-60 md:h-72 lg:h-80 relative overflow-hidden bg-slate-950 flex-shrink-0 border-b border-slate-200/60 group select-none"
      >
        <AnimatePresence mode="wait">
          {coverBannerDeck.map((slide, idx) => {
            if (idx !== activeCoverIdx) return null;
            return (
              <motion.div
                key={slide.id || idx}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="absolute inset-0 w-full h-full"
              >
                <picture className="w-full h-full block">
                  {slide.mobileImage && (
                    <source media="(max-width: 767px)" srcSet={slide.mobileImage} />
                  )}
                  <img 
                    src={slide.image || slide.mobileImage} 
                    alt={slide.title || 'Capa do Estabelecimento'} 
                    className={`w-full h-full ${imageFit === 'contain' ? 'object-contain p-1' : 'object-cover'} opacity-100`}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=1200';
                    }}
                  />
                </picture>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Manual Navigation Controls (< and >) */}
        {coverBannerDeck.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveCoverIdx((prev) => (prev - 1 + coverBannerDeck.length) % coverBannerDeck.length);
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/75 text-white p-2 rounded-full backdrop-blur-xs transition-all opacity-80 group-hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer shadow-lg"
              aria-label="Banner anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveCoverIdx((prev) => (prev + 1) % coverBannerDeck.length);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/75 text-white p-2 rounded-full backdrop-blur-xs transition-all opacity-80 group-hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer shadow-lg"
              aria-label="Próximo banner"
            >
              <ChevronRight size={20} />
            </button>

            {/* Slider Dots */}
            <div className="absolute bottom-3 inset-x-0 z-20 flex justify-center items-center gap-1.5 pointer-events-auto">
              {coverBannerDeck.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveCoverIdx(idx)}
                  aria-label={`Ir para banner ${idx + 1}`}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    activeCoverIdx === idx
                      ? 'w-6 h-2 bg-white shadow-md'
                      : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>


          </>
        )}
      </div>

      {/* Restaurant Info Card (Positioned cleanly below the banner to keep the banner 100% visible and unblocked) */}
      <div className="max-w-4xl mx-auto px-4 mt-3 sm:mt-4 relative z-10 mb-6">
        <div className="bg-white rounded-3xl p-5 md:p-6 shadow-xs border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left">
            {/* Restaurant Logo - Cleanly placed inside the info card without blocking the banner */}
            <div className="h-16 w-16 md:h-20 md:w-20 bg-slate-50 border border-slate-200/80 rounded-2xl shadow-xs flex items-center justify-center text-3xl md:text-4xl select-none flex-shrink-0 overflow-hidden">
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

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                <button 
                  onClick={() => setIsHoursModalOpen(true)}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  📅 Horários & Info
                </button>
              </div>
            </div>
          </div>
          

        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4">
        
        {/* Banner Section - Brazzuno Style Carousel */}
        {sortedBanners.length > 0 && !activeOrder && (
          <div 
            onMouseEnter={() => setIsBannerAutoPlayPaused(true)}
            onMouseLeave={() => setIsBannerAutoPlayPaused(false)}
            onTouchStart={() => setIsBannerAutoPlayPaused(true)}
            onTouchEnd={() => setIsBannerAutoPlayPaused(false)}
            className="mb-6 space-y-2 relative group"
          >
            <div 
              ref={bannerScrollRef}
              onScroll={handleBannerScroll}
              className="-mx-4 px-4 overflow-x-auto flex gap-3 sm:gap-4 scrollbar-none py-1.5 snap-x snap-mandatory scroll-smooth"
            >
              {sortedBanners.map((banner, index) => {
                const hasText = Boolean(banner.title || banner.description || banner.buttonText);
                const hasLink = Boolean(banner.buttonLink && banner.buttonLink.trim().length > 0);
                
                // Responsive device visibility
                const deviceClass = banner.deviceTarget === 'mobile' 
                  ? 'block md:hidden' 
                  : banner.deviceTarget === 'desktop' 
                    ? 'hidden md:block' 
                    : 'block';

                const CardWrapper = hasLink ? 'a' : 'div';
                const wrapperProps = hasLink ? {
                  href: banner.buttonLink,
                  target: banner.openNewTab ? '_blank' : '_self'
                } : {};

                return (
                  <CardWrapper 
                    key={banner.id || index}
                    {...wrapperProps}
                    className={`group relative w-[88vw] max-w-[340px] sm:w-[420px] md:w-[500px] h-36 sm:h-44 md:h-52 bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex-shrink-0 snap-center border border-slate-200/80 select-none ${deviceClass} ${hasLink ? 'cursor-pointer' : ''}`}
                  >
                    {/* Picture Element - Original clean colors */}
                    <picture className="absolute inset-0 w-full h-full block">
                      {banner.mobileImage && (
                        <source media="(max-width: 767px)" srcSet={banner.mobileImage} />
                      )}
                      <img 
                        src={banner.image || banner.mobileImage || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=85&w=1200'} 
                        alt={banner.title || 'Banner Promocional'} 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-102 opacity-100"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=85&w=1200';
                        }}
                      />
                    </picture>
                  </CardWrapper>
                );
              })}
            </div>

            {/* Brazzuno-style Carousel Dot Indicators */}
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

            {safeCombos.length > 0 && (
              <button 
                onClick={() => setSelectedCategory('combos')}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all snap-start active:scale-95 flex items-center gap-1 ${selectedCategory === 'combos' ? 'bg-amber-500 text-white shadow-xs font-black ring-2 ring-amber-300' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`}
              >
                🎁 Combos
              </button>
            )}

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
          {/* Combos Section */}
          {(selectedCategory === 'all' || selectedCategory === 'combos') && safeCombos.length > 0 && (
            <div className="space-y-3 scroll-mt-36 mb-8" id="combos">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <h2 className="font-extrabold text-amber-900 text-base sm:text-lg flex items-center gap-2">
                  🎁 Combos
                </h2>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                  Combo Especial
                </span>
              </div>

              <div className={gridContainerClass}>
                {safeCombos.map(combo => {
                  const isVertical = cardStyle === 'vertical' || (mobileCols === '2' && cardStyle !== 'horizontal');
                  const isCompact = cardStyle === 'compact';

                  return (
                    <div 
                      key={combo.id}
                      onClick={() => handleOpenCombo(combo)}
                      className={`bg-white ${isCompact ? 'p-2.5' : 'p-3.5 sm:p-4'} ${borderRadius} shadow-2xs border border-amber-200/80 cursor-pointer ${hoverClass} hover:border-amber-400 transition-all relative overflow-hidden group active:scale-[0.99] ${
                        isVertical ? 'flex flex-col-reverse justify-between gap-2.5' : 'flex gap-3.5 items-center'
                      }`}
                    >
                      <div className="flex-1 min-w-0 flex flex-col justify-between w-full">
                        <div>
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <h3 className="font-bold text-slate-800 text-sm md:text-base group-hover:text-amber-600 transition-colors">{combo.name}</h3>
                            {combo.tag && (
                              <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-md flex-shrink-0">
                                {combo.tag}
                              </span>
                            )}
                          </div>
                          {!isCompact && (
                            <p className="text-xs text-slate-500 mb-2 leading-relaxed">{combo.description}</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-amber-600 text-base">
                              R$ {combo.price.toFixed(2)}
                            </span>
                            {combo.originalPrice && combo.originalPrice > combo.price ? (
                              <span className="text-xs text-slate-400 line-through">
                                R$ {combo.originalPrice.toFixed(2)}
                              </span>
                            ) : null}
                          </div>
                          
                          <button 
                            className="h-8 w-8 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors flex-shrink-0 shadow-2xs"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>

                      {combo.image && (
                        <div className={`${
                          isVertical ? 'w-full h-32 sm:h-36' : isCompact ? 'h-14 w-14' : 'h-20 w-20 sm:h-24 sm:w-24'
                        } rounded-xl overflow-hidden bg-white border border-slate-200/80 shadow-2xs flex-shrink-0 relative flex items-center justify-center p-0.5`}>
                          <img 
                            src={combo.image} 
                            alt={combo.name} 
                            className="w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=300';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {safeCategories.filter(c => selectedCategory === 'all' || c.id === selectedCategory).map(cat => {
            const catProducts = filteredProducts.filter(p => p.categoryId === cat.id);
            if (catProducts.length === 0) return null;

            return (
              <div key={cat.id} id={cat.id} className="scroll-mt-36">
                <h2 className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2 mb-3.5 border-b border-slate-200/80 pb-2">
                  {cat.name}
                </h2>

                <div className={gridContainerClass}>
                  {catProducts.map(product => {
                    const isVertical = cardStyle === 'vertical' || (mobileCols === '2' && cardStyle !== 'horizontal');
                    const isCompact = cardStyle === 'compact';

                    return (
                      <div 
                        key={product.id}
                        onClick={() => handleOpenProduct(product)}
                        className={`${cardStyleClass} ${isCompact ? 'p-2.5' : 'p-3.5 sm:p-4'} ${borderRadius} cursor-pointer ${hoverClass} transition-all relative overflow-hidden group active:scale-[0.99] ${
                          isVertical ? 'flex flex-col-reverse justify-between gap-2.5' : 'flex gap-3.5 items-center'
                        }`}
                      >
                        <div className="flex-1 min-w-0 flex flex-col justify-between w-full">
                          <div>
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <h3 className="font-bold text-slate-800 text-sm md:text-base group-hover:text-emerald-600 transition-colors">{product.name}</h3>
                              {product.tag && (
                                <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-md flex-shrink-0">
                                  {product.tag}
                                </span>
                              )}
                            </div>
                            {!isCompact && (
                              <p className="text-xs text-slate-500 mb-2 leading-relaxed">{product.description}</p>
                            )}
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
                              className={`h-8 w-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${buttonStyleClass}`}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>

                        {product.image && (
                          <div className={`${
                            isVertical ? 'w-full h-32 sm:h-36' : isCompact ? 'h-14 w-14' : 'h-20 w-20 sm:h-24 sm:w-24'
                          } rounded-xl overflow-hidden bg-white border border-slate-200/80 shadow-2xs flex-shrink-0 relative flex items-center justify-center p-0.5`}>
                            <img 
                              src={product.image} 
                              alt={product.name} 
                              className="w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Sticky Floating Bottom Cart Bar (Brazzuno Style) */}
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
          <p className="text-[10px] text-slate-600">Cardápio Online © {new Date().getFullYear()} • Brazzuno Level Premium Setup</p>
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
                  <div className="h-44 sm:h-52 w-full rounded-2xl overflow-hidden mb-3 bg-slate-50 border border-slate-200/80 shadow-2xs flex items-center justify-center p-2">
                    <img 
                      src={selectedProduct.image} 
                      alt={selectedProduct.name} 
                      className="max-h-full max-w-full object-contain rounded-xl"
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

        {/* Selected Combo Customize Modal */}
        {selectedCombo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Header with clean image */}
              <div className="relative h-48 sm:h-56 bg-slate-50 flex-shrink-0 flex items-center justify-center p-3 border-b border-slate-100 overflow-hidden">
                {selectedCombo.image && (
                  <img 
                    src={selectedCombo.image} 
                    alt={selectedCombo.name} 
                    className="max-h-full max-w-full object-contain rounded-xl opacity-100"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=800';
                    }}
                  />
                )}
                
                <button 
                  onClick={() => setSelectedCombo(null)}
                  className="absolute top-3 right-3 bg-white/90 hover:bg-white text-slate-800 p-2 rounded-full shadow-sm transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable details */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1 text-slate-700 text-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    {selectedCombo.tag && (
                      <span className="bg-amber-500 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {selectedCombo.tag}
                      </span>
                    )}
                    {selectedCombo.originalPrice && selectedCombo.originalPrice > selectedCombo.price && (
                      <span className="bg-emerald-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full">
                        Economize R$ {(selectedCombo.originalPrice - selectedCombo.price).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight">{selectedCombo.name}</h3>
                </div>

                <p className="text-slate-600 leading-relaxed text-sm">{selectedCombo.description}</p>

                {/* Items included */}
                {selectedCombo.items && selectedCombo.items.length > 0 && (
                  <div className="bg-amber-50 rounded-2xl p-3.5 border border-amber-200/80 space-y-2">
                    <p className="font-extrabold text-amber-900 text-xs uppercase tracking-wider">🔥 Itens Inclusos no Combo:</p>
                    <ul className="space-y-1">
                      {selectedCombo.items.map((it, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-slate-800 font-medium">
                          <span className="text-emerald-600 font-bold">✔</span> {it.quantity}x {it.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Option Groups if present */}
                {selectedCombo.options && selectedCombo.options.map((group) => {
                  const selected = tempOptions[group.id] || [];
                  return (
                    <div key={group.id} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs">{group.name}</h4>
                          <p className="text-[10px] text-slate-400">
                            {group.min > 0 ? `Obrigatório • Escolha ${group.min} a ${group.max}` : `Opcional • Escolha até ${group.max}`}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        {group.items.map((item) => {
                          const isChecked = selected.some(i => i.id === item.id);
                          return (
                            <div 
                              key={item.id}
                              onClick={() => handleToggleOption(group, item)}
                              className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                                isChecked 
                                  ? 'bg-amber-50 border-amber-400 text-amber-950 font-medium' 
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                                  isChecked ? 'border-amber-500 bg-amber-500 text-white' : 'border-slate-300'
                                }`}>
                                  {isChecked && <Check size={12} />}
                                </div>
                                <span className="text-xs">{item.name}</span>
                              </div>
                              {item.price > 0 && (
                                <span className="text-xs font-bold text-amber-700">+ R$ {item.price.toFixed(2)}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Notes */}
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Observações do Combo</label>
                  <textarea 
                    placeholder="Ex: Sem picles em um dos lanches, coca sem açúcar..."
                    value={tempNotes}
                    onChange={(e) => setTempNotes(e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs text-slate-700 h-20 resize-none"
                  />
                </div>
              </div>

              {/* Action Bar */}
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
                  onClick={handleAddComboToCart}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 px-4 rounded-full font-bold text-xs md:text-sm flex items-center justify-between transition-colors shadow-md"
                >
                  <span>Adicionar Combo ao Pedido</span>
                  <span>R$ {(currentComboPrice * tempQuantity).toFixed(2)}</span>
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
                            <div className="h-14 w-14 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center p-0.5">
                              <img 
                                src={item.product.image} 
                                alt={item.product.name} 
                                className="w-full h-full object-contain"
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
                          <div className="bg-teal-900 text-teal-50 p-4 rounded-xl space-y-3 text-center relative overflow-hidden shadow-sm">
                            <h5 className="text-[10px] uppercase font-bold tracking-wider text-teal-300">DADOS PARA PAGAMENTO PIX</h5>
                            <p className="text-xs font-bold">{safeSettings.pix.receiverName}</p>
                            <p className="text-[10px] text-teal-200 break-all bg-teal-950/60 p-2.5 rounded-lg font-mono leading-tight select-all">
                              {safeSettings.pix.copyPasteText || safeSettings.pix.keyValue}
                            </p>
                            
                            <button 
                              type="button"
                              onClick={() => handleCopyPix()}
                              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-black text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer shadow-sm"
                            >
                              <Clipboard size={14} /> {pixCopied ? 'Chave Copiada! Abrindo WhatsApp... ✓' : 'Copiar Código Pix & Abrir WhatsApp'}
                            </button>

                            {/* Proof of Payment Upload */}
                            <div className="bg-teal-950/70 p-3 rounded-xl border border-teal-700/60 space-y-2 text-left mt-2">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-teal-200 uppercase flex items-center gap-1">
                                  📷 Anexar Comprovante Pix (Opcional)
                                </label>
                                {pixProofImage && (
                                  <span className="text-[9px] bg-emerald-500 text-white font-black px-2 py-0.5 rounded-full">
                                    Anexado ✓
                                  </span>
                                )}
                              </div>

                              <p className="text-[9px] text-teal-300/80 leading-normal">
                                Você pode anexar a foto do comprovante agora para o restaurante ou enviá-la via WhatsApp após finalizar.
                              </p>

                              {pixProofImage ? (
                                <div className="flex items-center gap-2 bg-teal-900/80 p-2 rounded-lg border border-teal-600">
                                  <img src={pixProofImage} alt="Comprovante Pix" className="w-12 h-12 object-cover rounded-md border border-teal-400 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-teal-100 truncate">{pixProofName || 'comprovante_pix.jpg'}</p>
                                    <p className="text-[9px] text-teal-300">Pronto para envio no pedido</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPixProofImage(null);
                                      setPixProofName('');
                                    }}
                                    className="text-rose-300 hover:text-rose-100 p-1 text-xs font-bold cursor-pointer"
                                    title="Remover comprovante"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <label className="w-full bg-teal-800/80 hover:bg-teal-800 text-teal-100 border border-dashed border-teal-500/70 p-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors">
                                  <Upload size={14} /> Selecionar Foto do Comprovante
                                  <input 
                                    type="file" 
                                    accept="image/*,.pdf" 
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        try {
                                          if (file.type.startsWith('image/')) {
                                            const compressed = await compressImage(file, 1000, 1000, 0.7);
                                            setPixProofImage(compressed);
                                            setPixProofName(file.name);
                                          } else {
                                            const reader = new FileReader();
                                            reader.onload = (ev) => {
                                              setPixProofImage(ev.target?.result as string);
                                              setPixProofName(file.name);
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                        } catch (err) {
                                          alert('Erro ao carregar o comprovante.');
                                        }
                                      }
                                    }}
                                  />
                                </label>
                              )}
                            </div>
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

                      {/* Scheduled Order Option Section */}
                      <div className="bg-gradient-to-br from-amber-50/90 to-amber-100/60 p-3.5 rounded-2xl border border-amber-200/80 space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={16} className="text-amber-700" />
                            <h4 className="text-xs font-black text-amber-900 uppercase tracking-tight">
                              {!isCurrentlyOpen ? '📅 Agendamento de Pedido (Restaurante Fechado)' : '📅 Agendar Horário de Entrega/Retirada'}
                            </h4>
                          </div>
                          {isCurrentlyOpen && (
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={isScheduled} 
                                onChange={(e) => setIsScheduled(e.target.checked)} 
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                            </label>
                          )}
                        </div>

                        {(!isCurrentlyOpen || isScheduled) ? (
                          <div className="space-y-3 pt-1">
                            {!isCurrentlyOpen && (
                              <p className="text-[11px] text-amber-900 leading-normal font-medium bg-amber-200/50 p-2.5 rounded-xl border border-amber-300/50">
                                🌙 No momento o restaurante está fechado. Escolha a data e o horário desejado abaixo para receber ou retirar seu pedido no próximo horário de funcionamento:
                              </p>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-[10px] font-bold text-amber-900 uppercase mb-1">
                                  Data Desejada *
                                </label>
                                <select 
                                  value={selectedScheduleDate} 
                                  onChange={(e) => setSelectedScheduleDate(e.target.value)}
                                  className="w-full bg-white border border-amber-300 rounded-xl p-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-2xs"
                                >
                                  {availableScheduleDates.map((d, idx) => (
                                    <option key={idx} value={d.value}>{d.label}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-amber-900 uppercase mb-1">
                                  Horário Desejado *
                                </label>
                                <select 
                                  value={selectedScheduleTime} 
                                  onChange={(e) => setSelectedScheduleTime(e.target.value)}
                                  className="w-full bg-white border border-amber-300 rounded-xl p-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-2xs"
                                >
                                  {defaultTimeSlots.map((time, idx) => (
                                    <option key={idx} value={time}>{time} hs</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] text-amber-900 font-semibold bg-white/80 p-2 rounded-lg border border-amber-200/80">
                              <Clock size={12} className="text-amber-700 flex-shrink-0" />
                              <span>Seu pedido será registrado como <strong>AGENDADO</strong> para <strong>{selectedScheduleDate || availableScheduleDates[0]?.value} às {selectedScheduleTime}hs</strong>.</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-amber-800/80 leading-tight">
                            Ative a opção acima caso prefira agendar o seu pedido para mais tarde.
                          </p>
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

      {/* Floating Instagram and WhatsApp Buttons with Authentic Brand Styling & Pulsating Effect */}
      <div className="fixed bottom-20 sm:bottom-24 right-4 flex flex-col gap-3.5 z-40">
        {/* Instagram Floating Button */}
        {safeSettings.instagram && (safeSettings.floatingButtons?.instagram?.isVisible !== false) && (
          <div className="relative group flex items-center justify-end">
            {/* Pulsating Ping Aura */}
            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] opacity-60 animate-ping pointer-events-none"></div>
            
            {/* Hover Tooltip Label */}
            <span className="hidden group-hover:flex items-center gap-1 mr-2.5 bg-slate-900/90 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl shadow-lg border border-white/20 backdrop-blur-md whitespace-nowrap animate-in fade-in slide-in-from-right-2">
              <span>Siga no Instagram</span>
            </span>

            <motion.a
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.92 }}
              href={safeSettings.instagram.startsWith('http') ? safeSettings.instagram : `https://instagram.com/${safeSettings.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="relative w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white rounded-full flex items-center justify-center shadow-2xl hover:shadow-pink-500/40 transition-all border-2 border-white/90 cursor-pointer"
              title="Siga-nos no Instagram"
            >
              <svg className="w-6 h-6 sm:w-7 sm:h-7 fill-current drop-shadow-xs" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </motion.a>
          </div>
        )}

        {/* WhatsApp Floating Button */}
        {safeSettings.whatsapp && (safeSettings.floatingButtons?.whatsapp?.isVisible !== false) && (
          <div className="relative group flex items-center justify-end">
            {/* Pulsating Ping Aura */}
            <div className="absolute -inset-1.5 rounded-full bg-[#25D366] opacity-60 animate-ping pointer-events-none"></div>

            {/* Hover Tooltip Label */}
            <span className="hidden group-hover:flex items-center gap-1 mr-2.5 bg-slate-900/90 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl shadow-lg border border-white/20 backdrop-blur-md whitespace-nowrap animate-in fade-in slide-in-from-right-2">
              <span>Atendimento WhatsApp</span>
            </span>

            <motion.a
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.92 }}
              href={`https://wa.me/55${safeSettings.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="relative w-12 h-12 sm:w-14 sm:h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:shadow-emerald-500/40 transition-all border-2 border-white/90 cursor-pointer"
              title="Fale conosco no WhatsApp"
            >
              <svg className="w-7 h-7 sm:w-8 sm:h-8 fill-current drop-shadow-xs" viewBox="0 0 24 24">
                <path d="M12.031 0C5.39 0 0 5.39 0 12.031c0 2.124.553 4.197 1.603 6.018L.062 23.938l6.046-1.585c1.761.96 3.755 1.464 5.923 1.464 6.641 0 12.031-5.39 12.031-12.031C24.062 5.39 18.672 0 12.031 0zm0 22.028c-1.83 0-3.623-.493-5.188-1.423l-.372-.222-3.856 1.011 1.029-3.759-.244-.388c-1.022-1.628-1.562-3.513-1.562-5.466 0-5.525 4.494-10.019 10.019-10.019 5.525 0 10.019 4.494 10.019 10.019 0 5.525-4.494 10.019-10.019 10.019zm5.492-7.502c-.301-.15-1.782-.88-2.057-.98-.276-.099-.477-.15-.678.15s-.779.98-.955 1.18c-.176.2-.352.226-.653.076-.301-.15-1.272-.469-2.423-1.496-.895-.798-1.5-1.784-1.676-2.085-.176-.301-.019-.464.131-.613.135-.134.301-.352.452-.528.15-.176.2-.301.301-.502.101-.201.05-.377-.025-.528-.075-.15-.678-1.633-.93-2.24-.244-.588-.493-.508-.678-.517-.175-.008-.377-.008-.578-.008s-.528.075-.804.377c-.276.301-1.055 1.031-1.055 2.516s1.08 2.918 1.231 3.119c.15.2 2.126 3.247 5.15 4.555 2.527 1.093 3.042.876 3.595.825.553-.05 1.782-.728 2.033-1.432.251-.703.251-1.306.176-1.432-.075-.126-.276-.201-.577-.352z"/>
              </svg>
            </motion.a>
          </div>
        )}
      </div>

      {/* Modal Dias e Horários de Funcionamento */}
      <AnimatePresence>
        {isHoursModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 overflow-hidden relative"
            >
              <button 
                onClick={() => setIsHoursModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl flex-shrink-0">
                  {renderLogo(safeSettings.branding.logo, '🍔')}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">{safeSettings.name}</h3>
                  <p className="text-xs text-slate-500">Informações e Horários de Atendimento</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-2xl space-y-2 border border-slate-100">
                  <p className="flex items-start gap-2 text-slate-700 font-medium">
                    <span className="flex-shrink-0">📍</span> <span><strong>Endereço:</strong> {safeSettings.address}</span>
                  </p>
                  <p className="flex items-center gap-2 text-slate-700 font-medium">
                    <span className="flex-shrink-0">📞</span> <span><strong>Telefone:</strong> {safeSettings.phone}</span>
                  </p>
                  <p className="flex items-center gap-2 text-slate-700 font-medium">
                    <span className="flex-shrink-0">⏱️</span> <span><strong>Tempo Estimado:</strong> {safeSettings.delivery.estimatedTimeMin} minutos</span>
                  </p>
                  <p className="flex items-center gap-2 text-slate-700 font-medium">
                    <span className="flex-shrink-0">🏍️</span> <span><strong>Taxa Base de Entrega:</strong> R$ {safeSettings.delivery.baseFee.toFixed(2)}</span>
                  </p>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-800 text-xs mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📅</span> Dias e Horários de Funcionamento
                  </h4>
                  <div className="space-y-1.5">
                    {[
                      { day: 0, label: 'Domingo' },
                      { day: 1, label: 'Segunda-feira' },
                      { day: 2, label: 'Terça-feira' },
                      { day: 3, label: 'Quarta-feira' },
                      { day: 4, label: 'Quinta-feira' },
                      { day: 5, label: 'Sexta-feira' },
                      { day: 6, label: 'Sábado' },
                    ].map(({ day, label }) => {
                      const daySetting = safeSettings.operational.hours.find(h => h.dayOfWeek === day);
                      const isToday = new Date().getDay() === day;
                      
                      return (
                        <div 
                          key={day} 
                          className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold ${
                            isToday ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            {isToday && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
                            {label} {isToday && <span className="text-[10px] text-emerald-600 font-bold">(Hoje)</span>}
                          </span>
                          {daySetting && daySetting.isOpen && daySetting.slots?.length > 0 ? (
                            <span className="font-mono font-bold text-slate-800">
                              {daySetting.slots[0].open} - {daySetting.slots[0].close}
                            </span>
                          ) : (
                            <span className="text-rose-500 font-bold text-[11px] bg-rose-50 px-2 py-0.5 rounded-md">Fechado</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setIsHoursModalOpen(false)}
                className="w-full mt-5 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-2xl font-bold text-xs transition-colors shadow-sm"
              >
                Fechar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
