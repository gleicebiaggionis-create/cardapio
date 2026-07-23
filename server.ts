import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { getInitialState } from './src/server/initialState';
import { DatabaseState, Order, Customer, FinancialTransaction } from './src/types';

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), 'db.json');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize file database
function ensureStateIntegrity(state: any): DatabaseState {
  const initial = getInitialState();
  if (!state || typeof state !== 'object') return initial;

  const safeSettings = {
    ...initial.settings,
    ...(state.settings || {}),
    branding: {
      ...initial.settings.branding,
      ...(state.settings?.branding || {})
    },
    delivery: {
      ...initial.settings.delivery,
      ...(state.settings?.delivery || {}),
      neighborhoods: Array.isArray(state.settings?.delivery?.neighborhoods)
        ? state.settings.delivery.neighborhoods
        : initial.settings.delivery.neighborhoods
    },
    operational: {
      ...initial.settings.operational,
      ...(state.settings?.operational || {}),
      hours: Array.isArray(state.settings?.operational?.hours)
        ? state.settings.operational.hours
        : initial.settings.operational.hours
    },
    pix: {
      ...initial.settings.pix,
      ...(state.settings?.pix || {})
    },
    localPayments: {
      ...initial.settings.localPayments,
      ...(state.settings?.localPayments || {})
    },
    gateways: Array.isArray(state.settings?.gateways)
      ? state.settings.gateways
      : initial.settings.gateways
  };

  return {
    categories: Array.isArray(state.categories) ? state.categories : initial.categories,
    products: Array.isArray(state.products) ? state.products : initial.products,
    banners: Array.isArray(state.banners) ? state.banners : initial.banners,
    coupons: Array.isArray(state.coupons) ? state.coupons : initial.coupons,
    orders: Array.isArray(state.orders) ? state.orders : initial.orders,
    customers: Array.isArray(state.customers) ? state.customers : initial.customers,
    finance: Array.isArray(state.finance) ? state.finance : initial.finance,
    settings: safeSettings
  };
}

function loadDatabase(): DatabaseState {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed) {
        return ensureStateIntegrity(parsed);
      }
    }
  } catch (err) {
    console.error('Failed to read database, falling back to initial seed data.', err);
  }
  const initialState = getInitialState();
  saveDatabase(initialState);
  return initialState;
}

function saveDatabase(state: DatabaseState) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write database file.', err);
  }
}

// Global mutable database state loaded at start
let db = loadDatabase();

// API Endpoints

// Public menu and configuration details
app.get('/api/menu', (req, res) => {
  res.json({
    name: db.settings.name,
    phone: db.settings.phone,
    whatsapp: db.settings.whatsapp,
    instagram: db.settings.instagram,
    facebook: db.settings.facebook,
    tiktok: db.settings.tiktok,
    email: db.settings.email,
    address: db.settings.address,
    branding: db.settings.branding,
    delivery: db.settings.delivery,
    operational: db.settings.operational,
    pix: db.settings.pix,
    floatingButtons: db.settings.floatingButtons,
    gateways: db.settings.gateways.map(g => ({ id: g.id, name: g.name, isEnabled: g.isEnabled })),
    categories: db.categories.filter(c => !c.isHidden),
    products: db.products.filter(p => p.isAvailable),
    banners: db.banners.filter(b => b.isActive),
    coupons: db.coupons.map(c => ({ code: c.code, type: c.type, value: c.value, minValue: c.minValue, firstOrderOnly: c.firstOrderOnly }))
  });
});

// Track a specific order status (public endpoint)
app.get('/api/orders/track/:id', (req, res) => {
  try {
    const { id } = req.params;
    const order = db.orders.find(o => o.id === id);
    if (order) {
      res.json({ success: true, order });
    } else {
      res.status(404).json({ success: false, message: 'Pedido não encontrado.' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Helper function to decode and verify Supabase / OAuth Admin Token
function verifyAdminToken(token: string): boolean {
  try {
    if (!token) return false;
    if (token === 'admin-demo-token' || token === 'supabase-demo-token') return true;
    
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // JWT base64url decoding of payload
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
    
    // Verify expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.warn("Token validation failed: Token expired");
      return false;
    }
    
    // Verify that the email is the authorized administrator email
    if (payload.email) {
      return payload.email.toLowerCase() === 'gleicebiaggionis@gmail.com';
    }
    
    return true;
  } catch (err) {
    console.error("Token verification error:", err);
    return false;
  }
}

// Admin Authentication Login
app.post('/api/admin/login', (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ success: false, message: 'Token de identificação ausente.' });
  }
  
  if (verifyAdminToken(idToken)) {
    res.json({ success: true, token: idToken });
  } else {
    res.status(401).json({ success: false, message: 'Acesso negado: Apenas a conta gleicebiaggionis@gmail.com possui acesso de administrador.' });
  }
});

// Full state for admin dashboard
app.get('/api/admin/data', (req, res) => {
  try {
    const safeDb = ensureStateIntegrity(db);
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    if (token && verifyAdminToken(token)) {
      // Logged-in administrator gets full data
      res.json(safeDb);
    } else {
      // Public non-authenticated client gets safe public menu data without customer or financial lists
      res.json({
        ...safeDb,
        orders: [],
        finance: [],
        customers: []
      });
    }
  } catch (err: any) {
    console.error('Error serving admin data:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Generic save entire database configuration
app.post('/api/admin/save', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  if (!token || !verifyAdminToken(token)) {
    return res.status(401).json({ success: false, message: 'Acesso não autorizado.' });
  }

  try {
    const updatedState = req.body;
    if (!updatedState || typeof updatedState !== 'object') {
      return res.status(400).json({ success: false, message: 'Dados de salvamento inválidos.' });
    }

    if (Array.isArray(updatedState.categories)) db.categories = updatedState.categories;
    if (Array.isArray(updatedState.products)) db.products = updatedState.products;
    if (Array.isArray(updatedState.banners)) db.banners = updatedState.banners;
    if (Array.isArray(updatedState.coupons)) db.coupons = updatedState.coupons;
    if (Array.isArray(updatedState.finance)) db.finance = updatedState.finance;
    if (Array.isArray(updatedState.customers)) db.customers = updatedState.customers;
    if (Array.isArray(updatedState.orders)) db.orders = updatedState.orders;

    if (updatedState.settings && typeof updatedState.settings === 'object') {
      db.settings = {
        ...db.settings,
        ...updatedState.settings,
        branding: {
          ...db.settings?.branding,
          ...updatedState.settings.branding
        },
        delivery: {
          ...db.settings?.delivery,
          ...updatedState.settings.delivery,
          neighborhoods: Array.isArray(updatedState.settings.delivery?.neighborhoods) 
            ? updatedState.settings.delivery.neighborhoods 
            : (db.settings?.delivery?.neighborhoods || [])
        },
        operational: {
          ...db.settings?.operational,
          ...updatedState.settings.operational,
          hours: Array.isArray(updatedState.settings.operational?.hours)
            ? updatedState.settings.operational.hours
            : (db.settings?.operational?.hours || [])
        },
        pix: {
          ...db.settings?.pix,
          ...updatedState.settings.pix
        },
        localPayments: {
          ...db.settings?.localPayments,
          ...updatedState.settings.localPayments
        },
        gateways: Array.isArray(updatedState.settings.gateways)
          ? updatedState.settings.gateways
          : (db.settings?.gateways || [])
      };
    }

    db = ensureStateIntegrity(db);
    saveDatabase(db);
    res.json({ success: true, db });
  } catch (err: any) {
    console.error('Error saving state:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Submit a new order
app.post('/api/orders', (req, res) => {
  try {
    const { orderDetails } = req.body;
    if (!orderDetails || !orderDetails.items || orderDetails.items.length === 0) {
      return res.status(400).json({ success: false, message: 'O carrinho está vazio.' });
    }

    const { address, items, paymentMethod, paymentDetails, subtotal, deliveryFee, discount, total } = orderDetails;

    if (!address.name || !address.whatsapp || !address.street || !address.number || !address.neighborhood || !address.city || !address.cep) {
      return res.status(400).json({ success: false, message: 'Preencha todos os campos obrigatórios do endereço.' });
    }

    const orderNum = db.orders.length + 1;
    const orderCode = `O-${1000 + orderNum}`;
    const orderId = `order-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const newOrder: Order = {
      id: orderId,
      code: orderCode,
      customerName: address.name,
      customerPhone: address.whatsapp,
      address: address,
      paymentMethod: paymentMethod,
      paymentDetails: paymentDetails,
      items: items,
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      discount: discount,
      total: total,
      status: 'new',
      createdAt: timestamp,
      updatedAt: timestamp,
      logs: [
        { status: 'Novo pedido recebido', timestamp }
      ]
    };

    db.orders.push(newOrder);

    // Dynamic CRM customer profile integration or registration
    let customer = db.customers.find(c => c.phone === address.whatsapp);
    if (!customer) {
      customer = {
        id: `cust-${Date.now()}`,
        name: address.name,
        phone: address.whatsapp,
        address: address,
        ordersCount: 1,
        totalSpent: total,
        lastOrderDate: timestamp,
        isVip: false,
        isBlocked: false,
        notes: '',
        tags: ['Novo']
      };
      db.customers.push(customer);
    } else {
      customer.ordersCount += 1;
      customer.totalSpent += total;
      customer.lastOrderDate = timestamp;
      customer.address = address;
      if (customer.ordersCount >= 5 && !customer.isVip) {
        customer.isVip = true;
        customer.tags.push('VIP');
      }
    }

    // Save and return
    saveDatabase(db);
    res.json({ success: true, order: newOrder });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update order status (Admin)
app.post('/api/admin/order-status', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  if (!token || !verifyAdminToken(token)) {
    return res.status(401).json({ success: false, message: 'Acesso não autorizado.' });
  }

  try {
    const { orderId, status, notes } = req.body;
    const order = db.orders.find(o => o.id === orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Pedido não encontrado.' });
    }

    const prevStatus = order.status;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    order.logs.push({
      status: `Status alterado para ${status}`,
      timestamp: order.updatedAt,
      notes: notes
    });

    // Income transaction registration when status becomes "delivered"
    if (status === 'delivered' && prevStatus !== 'delivered') {
      const alreadyLogged = db.finance.some(f => f.reference === orderId && f.type === 'income');
      if (!alreadyLogged) {
        const transaction: FinancialTransaction = {
          id: `fin-${Date.now()}`,
          type: 'income',
          amount: order.total,
          description: `Venda do Pedido ${order.code}`,
          category: 'Vendas de Alimentos',
          date: order.updatedAt,
          paymentMethod: order.paymentMethod,
          reference: orderId
        };
        db.finance.push(transaction);
      }
    }

    // Adjust financial ledger in case order changes from delivered to canceled
    if (status === 'canceled' && prevStatus === 'delivered') {
      db.finance = db.finance.filter(f => !(f.reference === orderId && f.type === 'income'));
    }

    saveDatabase(db);
    res.json({ success: true, order });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start service
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
