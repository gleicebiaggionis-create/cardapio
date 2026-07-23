import { DatabaseState, RestaurantSettings, DeliveryNeighborhood } from '../types';

export const getInitialState = (): DatabaseState => {
  const orders: any[] = [];
  const finance: any[] = [];
  const customers: any[] = [];

  const categories = [
    { id: 'cat-burgers', name: '🍔 Hambúrgueres Artesanais', icon: 'Sparkles', isHidden: false, sortOrder: 1 },
    { id: 'cat-sides', name: '🍟 Acompanhamentos', icon: 'Beef', isHidden: false, sortOrder: 2 },
    { id: 'cat-drinks', name: '🥤 Bebidas Geladas', icon: 'CupSoda', isHidden: false, sortOrder: 3 },
    { id: 'cat-desserts', name: '🍰 Sobremesas Incríveis', icon: 'Cookie', isHidden: false, sortOrder: 4 }
  ];

  const products = [
    {
      id: 'p-1',
      name: 'Smash Bacon Monster',
      description: 'Dois suculentos hambúrgueres Smash (70g cada) grelhados na chapa, queijo cheddar derretido, tiras crocantes de bacon premium, cebola caramelizada e maionese artesanal da casa em um pão de brioche super macio tostado na manteiga.',
      price: 32.90,
      promoPrice: 29.90,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800',
      categoryId: 'cat-burgers',
      ingredients: '2 blend smash (70g cada), bacon, cheddar, cebola caramelizada, maionese, pão brioche.',
      weight: '320g',
      prepTime: '15-20 min',
      isAvailable: true,
      isBestSeller: true,
      isNew: false,
      isPromo: true,
      tag: 'Mais Vendido 🏆',
      sortOrder: 1,
      options: [
        {
          id: 'optg-1',
          name: 'Ponto da Carne',
          min: 1,
          max: 1,
          items: [
            { id: 'opti-1', name: 'Ao Ponto (rosadinho no centro)', price: 0 },
            { id: 'opti-2', name: 'Bem Passado', price: 0 },
            { id: 'opti-3', name: 'Mal Passado', price: 0 }
          ]
        },
        {
          id: 'optg-2',
          name: 'Adicionais de Proteína',
          min: 0,
          max: 3,
          items: [
            { id: 'opti-4', name: 'Hambúrguer extra (70g)', price: 6.00 },
            { id: 'opti-5', name: 'Bacon Extra crocante', price: 4.50 },
            { id: 'opti-6', name: 'Ovo na chapa', price: 3.00 }
          ]
        },
        {
          id: 'optg-3',
          name: 'Molhos Especiais',
          min: 0,
          max: 4,
          items: [
            { id: 'opti-7', name: 'Maionese Verde Artesanal', price: 2.50 },
            { id: 'opti-8', name: 'Geleia de Pimenta Defumada', price: 3.50 },
            { id: 'opti-9', name: 'Molho Barbecue Caseiro', price: 2.00 }
          ]
        }
      ]
    },
    {
      id: 'p-2',
      name: 'Vito´s Triple Cheddar Combo',
      description: 'Três suculentos hambúrgueres de 90g de blend bovino premium, tripla camada de cheddar fatiado cremoso, picles artesanal crocante, maionese trufada e cebola picadinha no pão australiano tostado.',
      price: 42.00,
      image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&q=80&w=800',
      categoryId: 'cat-burgers',
      ingredients: '3 blend de 90g, triplo cheddar fatiado, picles, maionese trufada, cebola, pão australiano.',
      weight: '450g',
      prepTime: '20-25 min',
      isAvailable: true,
      isBestSeller: false,
      isNew: true,
      isPromo: false,
      tag: 'Novidade 🔥',
      sortOrder: 2,
      options: [
        {
          id: 'optg-4',
          name: 'Ponto da Carne',
          min: 1,
          max: 1,
          items: [
            { id: 'opti-10', name: 'Ao Ponto (Sugerido)', price: 0 },
            { id: 'opti-11', name: 'Bem Passado', price: 0 }
          ]
        }
      ]
    },
    {
      id: 'p-3',
      name: 'Batata Rústica Especial',
      description: 'Batatas rústicas com corte artesanal especial, fritas em imersão com casca até ficarem super crocantes por fora e macias por dentro. Salpicadas com páprica defumada, alecrim fresco e acompanhadas de um pote generoso de molho barbecue.',
      price: 18.00,
      image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=800',
      categoryId: 'cat-sides',
      ingredients: 'Batatas rústicas fritas, páprica defumada, alecrim fresco, molho barbecue.',
      weight: '250g',
      prepTime: '10 min',
      isAvailable: true,
      isBestSeller: true,
      isNew: false,
      isPromo: false,
      sortOrder: 3,
      options: [
        {
          id: 'optg-5',
          name: 'Acompanhamento Extra',
          min: 0,
          max: 2,
          items: [
            { id: 'opti-12', name: 'Molho de Alho Extra', price: 2.00 },
            { id: 'opti-13', name: 'Molho Cheddar Cremoso no Pote', price: 5.00 }
          ]
        }
      ]
    },
    {
      id: 'p-4',
      name: 'Coca-Cola Zero 350ml',
      description: 'Lata de 350ml super gelada para refrescar e acompanhar seu hambúrguer artesanal.',
      price: 6.00,
      image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800',
      categoryId: 'cat-drinks',
      isAvailable: true,
      isBestSeller: false,
      isNew: false,
      isPromo: false,
      sortOrder: 4,
      options: []
    },
    {
      id: 'p-5',
      name: 'Guaraná Antarctica 350ml',
      description: 'Guaraná Antarctica lata de 350ml bem gelado.',
      price: 6.00,
      image: 'https://images.unsplash.com/photo-1527960656366-ee2a38b8779f?auto=format&fit=crop&q=80&w=800',
      categoryId: 'cat-drinks',
      isAvailable: true,
      isBestSeller: false,
      isNew: false,
      isPromo: false,
      sortOrder: 5,
      options: []
    },
    {
      id: 'p-6',
      name: 'Nutella Brownie',
      description: 'Fatia generosa de brownie de chocolate belga recheado de gotas de chocolate, servido levemente aquecido com uma cobertura farta de Nutella pura cremosa e morangos frescos picados.',
      price: 21.00,
      promoPrice: 17.90,
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=800',
      categoryId: 'cat-desserts',
      ingredients: 'Chocolate, açúcar, farinha de trigo, morangos frescos, Nutella original.',
      weight: '150g',
      prepTime: '5 min',
      isAvailable: true,
      isBestSeller: true,
      isNew: false,
      isPromo: true,
      tag: 'Sensação 🍫',
      sortOrder: 6,
      options: [
        {
          id: 'optg-6',
          name: 'Calda Adicional',
          min: 0,
          max: 1,
          items: [
            { id: 'opti-14', name: 'Bola de Sorvete de Creme', price: 6.00 },
            { id: 'opti-15', name: 'Ninho em pó salpicado', price: 2.00 }
          ]
        }
      ]
    }
  ];

  const banners = [
    {
      id: 'b-1',
      image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=1200',
      title: 'Hoje com Frete Grátis!',
      description: 'Use o cupom FRETEGRATIS e garanta entrega grátis em pedidos acima de R$ 40,00.',
      buttonText: 'Aproveitar Cupom',
      buttonLink: '#',
      openNewTab: false,
      priority: 1,
      isActive: true
    },
    {
      id: 'b-2',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=1200',
      title: 'Combo Smash Double Bacon',
      description: 'Experimente a nossa novidade do mês com 10% de desconto promocional por tempo limitado!',
      buttonText: 'Comprar Agora',
      buttonLink: '#cat-burgers',
      openNewTab: false,
      priority: 2,
      isActive: true
    }
  ];

  const coupons = [
    { id: 'cp-1', code: 'BEMVINDO10', type: 'fixed' as const, value: 10.00, minValue: 50.00, maxUsage: 100, usageCount: 22, firstOrderOnly: true },
    { id: 'cp-2', code: 'FRETEGRATIS', type: 'free_shipping' as const, value: 0, minValue: 40.00, maxUsage: 200, usageCount: 45, firstOrderOnly: false },
    { id: 'cp-3', code: 'MASTER30', type: 'percent' as const, value: 30.00, minValue: 80.00, maxUsage: 50, usageCount: 8, firstOrderOnly: false }
  ];

  const settings: RestaurantSettings = {
    name: 'Brazzuno - Hamburgueria & Grelhados',
    phone: '11999998888',
    whatsapp: '11999998888',
    instagram: 'brazzunoburger',
    facebook: 'brazzunoburger',
    tiktok: 'brazzunoburger',
    email: 'contato@brazzuno.com.br',
    address: 'Av. Paulista, 1200 - Bela Vista, São Paulo - SP',
    branding: {
      logo: '🔥',
      bannerImage: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=1200',
      primaryColor: '#03d383', // Brazzuno Emerald Green
      secondaryColor: '#00df89',
      fontFamily: 'Inter',
      theme: 'light'
    },
    delivery: {
      radiusKm: 6,
      baseFee: 6.50,
      freeDeliveryMinAmount: 75.00,
      minOrderAmount: 20.00,
      estimatedTimeMin: 35,
      allowPickup: true,
      neighborhoods: [
        { id: 'nh-1', name: 'Bela Vista', fee: 5.00, deliveryTime: '25-35 min' },
        { id: 'nh-2', name: 'Consolação', fee: 6.00, deliveryTime: '30-40 min' },
        { id: 'nh-3', name: 'Jardins', fee: 7.50, deliveryTime: '35-45 min' },
        { id: 'nh-4', name: 'Pinheiros', fee: 9.50, deliveryTime: '40-50 min' }
      ]
    },
    operational: {
      closedMessage: '⚠️ Olá! Nosso cardápio está fechado no momento. Nosso horário de funcionamento é de Terça a Domingo das 18h às 23h30. Deixe sua mensagem no WhatsApp!',
      hours: [
        { dayOfWeek: 0, isOpen: true, slots: [{ open: '18:00', close: '23:30' }] },
        { dayOfWeek: 1, isOpen: false, slots: [] }, // Segunda fechado
        { dayOfWeek: 2, isOpen: true, slots: [{ open: '18:00', close: '23:30' }] },
        { dayOfWeek: 3, isOpen: true, slots: [{ open: '18:00', close: '23:30' }] },
        { dayOfWeek: 4, isOpen: true, slots: [{ open: '18:00', close: '23:30' }] },
        { dayOfWeek: 5, isOpen: true, slots: [{ open: '18:00', close: '23:30' }] },
        { dayOfWeek: 6, isOpen: true, slots: [{ open: '18:00', close: '23:30' }] }
      ],
      holidays: []
    },
    pix: {
      keyType: 'cnpj',
      keyValue: '12.345.678/0001-90',
      receiverName: 'Brazzuno Alimentos Ltda',
      copyPasteText: '00020101021126580014br.gov.bcb.pix0118123456780001905204000053039865802BR5922Brazzuno Alimentos Ltda6009Sao Paulo62070503***6304E21D'
    },
    gateways: [
      { id: 'mercadopago', name: 'Mercado Pago', isEnabled: false, isProduction: false },
      { id: 'stripe', name: 'Stripe', isEnabled: false, isProduction: false },
      { id: 'pagseguro', name: 'PagSeguro', isEnabled: false, isProduction: false }
    ],
    floatingButtons: {
      whatsapp: {
        number: '11999998888',
        message: 'Olá! Gostaria de tirar uma dúvida sobre o cardápio do Brazzuno.',
        icon: 'MessageSquare',
        color: '#22c55e',
        position: 'bottom-right',
        isVisible: true
      },
      instagram: {
        link: 'https://instagram.com/brazzunoburger',
        icon: 'Instagram',
        color: '#e1306c',
        position: 'bottom-right',
        isVisible: true
      }
    },
    seo: {
      title: 'Brazzuno | Cardápio Online Oficial & Delivery',
      description: 'Peça online no Brazzuno os melhores hambúrgueres artesanais, picanha grelhada e porções especiais com entrega rápida!',
      keywords: 'brazzuno, hamburgueria, delivery, cardapio online, sp, grelhados, comida'
    }
  };

  return {
    categories,
    products,
    banners,
    coupons,
    orders,
    customers,
    finance,
    settings
  };
};
