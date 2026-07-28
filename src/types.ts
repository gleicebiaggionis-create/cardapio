export interface OptionItem {
  id: string;
  name: string;
  price: number;
}

export interface OptionGroup {
  id: string;
  name: string;
  min: number;
  max: number;
  items: OptionItem[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  promoPrice?: number;
  image: string; // Main image
  images?: string[]; // Multiple images support
  videoUrl?: string; // Product video
  categoryId: string;
  subcategory?: string; // Subcategory
  ingredients?: string;
  nutritionalInfo?: string; // Nutritional details
  weight?: string;
  prepTime?: string;
  isAvailable: boolean;
  isBestSeller: boolean;
  isNew: boolean;
  isPromo: boolean;
  isSazonal?: boolean; // Seasonal product
  isSoldOut?: boolean; // Oos / esgotado
  tag?: string; // Custom tag
  sortOrder: number;
  options: OptionGroup[];
  sku?: string; // Stock Keeping Unit
  barcode?: string; // Barcode
  stock?: number; // Stock count
  availableDays?: number[]; // [0, 1, 2, 3, 4, 5, 6] days of week
  availableHours?: { open: string; close: string }[]; // Specific slots
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  isHidden: boolean;
  sortOrder: number;
}

export interface Banner {
  id: string;
  image?: string;
  mobileImage?: string;
  desktopImage?: string;
  title?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  openNewTab?: boolean;
  startDate?: string;
  endDate?: string;
  priority: number;
  isActive: boolean;
  deviceTarget?: 'all' | 'mobile' | 'desktop';
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed' | 'free_shipping';
  value: number;
  minValue?: number;
  maxUsage?: number;
  expiryDate?: string;
  usageCount: number;
  firstOrderOnly: boolean;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  selectedOptions: {
    groupName: string;
    items: { name: string; price: number }[];
  }[];
}

export interface OrderAddress {
  name: string;
  whatsapp: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  cep: string;
  complement?: string;
  reference?: string;
}

export interface Order {
  id: string;
  code: string; // Friendly visible ID (e.g., #1001)
  customerName: string;
  customerPhone: string;
  address: OrderAddress;
  paymentMethod: 'pix' | 'credit' | 'debit' | 'cash' | 'meal_voucher' | 'food_voucher' | 'delivery_payment' | 'online_pix' | 'online_wallet' | string;
  paymentDetails?: {
    cashChange?: number;
    gatewayId?: string;
    paymentUrl?: string;
    isPaidOnline?: boolean;
    pixProofUrl?: string;
    pixProofName?: string;
    pixCopiaECola?: string;
    pixQrCodeUrl?: string;
    isOnlinePaid?: boolean;
  };
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: 'new' | 'preparing' | 'delivery' | 'delivered' | 'canceled';
  isScheduled?: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
  createdAt: string;
  updatedAt: string;
  logs: {
    status: string;
    timestamp: string;
    notes?: string;
  }[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  photo?: string;
  email?: string;
  cpf?: string;
  birthDate?: string;
  address?: OrderAddress;
  addresses?: OrderAddress[];
  ordersCount: number;
  totalSpent: number;
  lastOrderDate?: string;
  isVip: boolean;
  isBlocked: boolean;
  notes?: string;
  tags: string[]; // e.g. "VIP", "Frequent", "Problematic"
  origin?: string; // e.g. "WhatsApp", "Cardápio Digital", "Mesa"
  timeline?: {
    id: string;
    type: 'register' | 'order' | 'coupon' | 'message' | 'occurrence' | 'vip_upgrade' | 'blocked_status' | 'custom';
    title: string;
    description: string;
    date: string;
  }[];
}

export interface FinancialTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string; // Cost center / Category
  date: string;
  paymentMethod?: string;
  reference?: string; // Order ID or other ref
  costCenter?: string; // Centro de custo
  isInstallments?: boolean; // Parcelado
  installmentsCount?: number;
  dueDate?: string; // Contas a pagar/receber
  status?: 'paid' | 'pending'; // Status de pagamento
}

export interface AuditLogEntry {
  id: string;
  user: string;
  action: string;
  details: string;
  timestamp: string;
  ip: string;
  browser: string;
  device: string;
}

export interface PageComponent {
  id: string;
  type: 'banner' | 'carousel' | 'text' | 'button' | 'card' | 'products' | 'combos' | 'categories' | 'video' | 'image' | 'reviews' | 'faq' | 'counter' | 'timer' | 'map' | 'socials' | 'html' | 'form';
  content: any; // Dynamic JSON properties for each component
  sortOrder: number;
}

export interface CustomPage {
  id: string;
  title: string;
  slug: string;
  isActive: boolean;
  components: PageComponent[];
}

export interface Ingredient {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  unit: string; // "kg", "g", "l", "ml", "un"
  supplier: string;
  expiryDate?: string;
  lot?: string;
}

export interface Courier {
  id: string;
  name: string;
  phone: string;
  vehicle: string; // "Moto", "Carro", "Bike"
  status: 'available' | 'delivering' | 'offline';
  activeOrderId?: string;
}

export interface AutomationRule {
  id: string;
  trigger: 'birthday' | 'idle_30_days' | 'vip_spend_500' | 'order_canceled';
  actionType: 'send_coupon' | 'send_promotion' | 'make_vip' | 'create_task';
  actionValue: string; // coupon code or promotional text or task details
  isEnabled: boolean;
}

export interface DeliveryNeighborhood {
  id: string;
  name: string;
  fee: number;
  deliveryTime?: string;
}

export interface PixSettings {
  keyType: 'cpf' | 'cnpj' | 'phone' | 'email' | 'random';
  keyValue: string;
  receiverName: string;
  qrCodeUrl?: string;
  copyPasteText?: string;
}

export interface GatewaySettings {
  id: string;
  name: string;
  isEnabled: boolean;
  apiKey?: string;
  secretKey?: string;
  publicKey?: string;
  webhookUrl?: string;
  isProduction: boolean;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  status?: 'connected' | 'disconnected' | 'testing';
}

export interface LocalPaymentSettings {
  pixActive: boolean;
  cashActive: boolean;
  mealVoucherActive: boolean;
  foodVoucherActive: boolean;
  deliveryPaymentActive: boolean;
}

export interface DeliverySettings {
  radiusKm: number;
  baseFee: number;
  freeDeliveryMinAmount?: number;
  minOrderAmount?: number;
  estimatedTimeMin: number;
  allowPickup: boolean;
  neighborhoods: DeliveryNeighborhood[];
}

export interface OperationalHour {
  dayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
  isOpen: boolean;
  slots: { open: string; close: string }[]; // e.g. [{ open: "18:00", close: "23:30" }]
}

export interface OperationalSettings {
  hours: OperationalHour[];
  closedMessage: string;
  openMessage?: string;
  showClosedMessage?: boolean;
  forceStatus?: 'auto' | 'open' | 'closed';
  holidays: { date: string; isOpen: boolean; closedMessage?: string }[];
}

export interface FloatingButtonSettings {
  whatsapp: {
    number: string;
    message: string;
    icon: string;
    color: string;
    position: 'bottom-right' | 'bottom-left';
    isVisible: boolean;
  };
  instagram: {
    link: string;
    icon: string;
    color: string;
    position: 'bottom-right' | 'bottom-left';
    isVisible: boolean;
  };
}

export interface SEOSettings {
  title: string;
  description: string;
  keywords: string;
  favicon?: string;
  ogImage?: string;
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  facebookPixelId?: string;
  metaPixelId?: string;
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPass?: string;
}

export interface BrandingSettings {
  logo: string;
  bannerImage: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor?: string;
  fontFamily: string;
  theme: 'light' | 'dark' | 'amber' | 'cyber';
  mobileCols?: '1' | '2';
  desktopCols?: '2' | '3' | '4';
  cardStyle?: 'horizontal' | 'vertical' | 'compact' | 'glass' | 'gourmet';
  buttonStyle?: 'solid' | 'outline' | 'gradient' | 'pill';
  categoryStyle?: 'pills' | 'grid' | 'carousel';
  priceStyle?: 'badge' | 'minimal' | 'glow';
  spacingDensity?: 'comfortable' | 'compact' | 'spacious';
  imageFit?: 'contain' | 'cover';
  borderRadius?: 'rounded-none' | 'rounded-xl' | 'rounded-2xl' | 'rounded-3xl' | 'rounded-full';
  headerLayout?: 'banner' | 'compact' | 'centered';
  hoverEffect?: 'shadow' | 'border' | 'scale' | 'none';
}

export interface RestaurantSettings {
  name: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  email: string;
  address: string;
  branding: BrandingSettings;
  delivery: DeliverySettings;
  operational: OperationalSettings;
  pix: PixSettings;
  gateways: GatewaySettings[];
  floatingButtons: FloatingButtonSettings;
  seo: SEOSettings;
  localPayments?: LocalPaymentSettings;
  checkoutTransparenteActive?: boolean;
  selectedGatewayId?: string;
}

export interface ComboItem {
  productId?: string;
  name: string;
  quantity: number;
}

export interface Combo {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  isAvailable: boolean;
  isBestSeller?: boolean;
  isPromo?: boolean;
  tag?: string;
  sortOrder: number;
  items?: ComboItem[];
  options?: OptionGroup[];
}

export interface DatabaseState {
  categories: Category[];
  products: Product[];
  combos?: Combo[];
  banners: Banner[];
  coupons: Coupon[];
  orders: Order[];
  customers: Customer[];
  finance: FinancialTransaction[];
  settings: RestaurantSettings;
  auditLogs?: AuditLogEntry[];
  customPages?: CustomPage[];
  ingredients?: Ingredient[];
  couriers?: Courier[];
  automations?: AutomationRule[];
}
