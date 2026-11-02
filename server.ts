import express from 'express';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_USERS,
  INITIAL_ORDERS,
  INITIAL_PAYMENTS,
  INITIAL_INVENTORY_LOGS,
} from './src/data/mockDatabase';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Persistent Cloud Store Database Configuration
const DATA_DIR = path.resolve(__dirname, 'data_storage');
const DB_FILE = path.join(DATA_DIR, 'store_db.json');

interface StoreDatabase {
  version: number;
  lastUpdated: string;
  categories: any[];
  products: any[];
  users: any[];
  orders: any[];
  payments: any[];
  inventoryLogs: any[];
}

function getDatabase(): StoreDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.products) && Array.isArray(parsed.categories)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed reading store DB file, creating default:', err);
  }

  const initialDb: StoreDatabase = {
    version: 1,
    lastUpdated: new Date().toISOString(),
    categories: INITIAL_CATEGORIES,
    products: INITIAL_PRODUCTS,
    users: INITIAL_USERS,
    orders: INITIAL_ORDERS,
    payments: INITIAL_PAYMENTS,
    inventoryLogs: INITIAL_INVENTORY_LOGS,
  };
  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(data: StoreDatabase): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed writing store DB file:', err);
  }
}

// User's Testing Razorpay API Credentials
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_TfJSK4dXeawXyS';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'f20VAC71QdYoKOETLUfPuCgA';

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// Endpoint: Get Public Razorpay Configuration
app.get('/api/razorpay/config', (_req, res) => {
  res.json({
    keyId: RAZORPAY_KEY_ID,
    currency: 'INR',
    merchantName: 'AmoCart',
  });
});

// Endpoint: Create Real Razorpay Order via Official Orders API
app.post('/api/razorpay/create-order', async (req, res) => {
  try {
    const { amount, receipt, notes } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid amount is required.' });
    }

    // Convert amount in INR (Rupees) to subunits (Paise)
    const amountInPaise = Math.round(Number(amount) * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: receipt || `AMO_${Date.now()}`,
      notes: notes || {},
    });

    return res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error('Razorpay Orders API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create order on Razorpay servers',
    });
  }
});

// Endpoint: Server-side Cryptographic Signature Verification
app.post('/api/razorpay/verify-payment', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required signature verification parameters.',
      });
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(payload)
      .digest('hex');

    const isValid = expectedSignature.toLowerCase() === razorpay_signature.toLowerCase();

    if (isValid) {
      return res.json({
        success: true,
        message: 'Razorpay payment signature verified successfully.',
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature. Signature tampering detected.',
      });
    }
  } catch (error: any) {
    console.error('Signature Verification Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal signature verification failed.',
    });
  }
});

// =========================================================================
// STORE DATABASE REST API (Cross-Device Real-Time Sync)
// =========================================================================

// Endpoint: Get full store catalog and state for any visitor/device
app.get('/api/store/data', (_req, res) => {
  try {
    const db = getDatabase();
    return res.json({
      success: true,
      version: db.version,
      lastUpdated: db.lastUpdated,
      categories: db.categories,
      products: db.products,
      orders: db.orders,
      payments: db.payments,
      inventoryLogs: db.inventoryLogs,
      users: db.users,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint: Full sync upload from admin device
app.post('/api/store/sync-all', (req, res) => {
  try {
    const { products, categories, orders, payments, inventoryLogs } = req.body;
    const db = getDatabase();

    if (Array.isArray(products) && products.length > 0) {
      db.products = products;
    }
    if (Array.isArray(categories) && categories.length > 0) {
      db.categories = categories;
    }
    if (Array.isArray(orders)) {
      db.orders = orders;
    }
    if (Array.isArray(payments)) {
      db.payments = payments;
    }
    if (Array.isArray(inventoryLogs)) {
      db.inventoryLogs = inventoryLogs;
    }

    db.version = (db.version || 1) + 1;
    saveDatabase(db);
    return res.json({
      success: true,
      version: db.version,
      message: 'Store database successfully synchronized to server.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint: Create or Update a single Product
app.post('/api/products', (req, res) => {
  try {
    const productData = req.body;
    if (!productData.name || !productData.price) {
      return res.status(400).json({ success: false, error: 'Product name and price are required.' });
    }

    const db = getDatabase();

    if (productData.id) {
      const idx = db.products.findIndex((p: any) => p.id === productData.id);
      if (idx !== -1) {
        db.products[idx] = { ...db.products[idx], ...productData };
        db.version = (db.version || 1) + 1;
        saveDatabase(db);
        return res.json({ success: true, product: db.products[idx] });
      }
    }

    const newProd = {
      id: productData.id || `prod-${Date.now()}`,
      name: productData.name,
      slug: productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: productData.description || 'Premium craftsmanship crafted for AmoCart customers.',
      price: Number(productData.price),
      originalPrice: productData.originalPrice ? Number(productData.originalPrice) : undefined,
      categoryId: productData.categoryId,
      categoryName: productData.categoryName || 'General',
      stock: Number(productData.stock ?? 10),
      lowStockThreshold: Number(productData.lowStockThreshold ?? 5),
      sku: productData.sku || `AMO-PRD-${Math.floor(100 + Math.random() * 900)}`,
      images:
        productData.images && productData.images.length
          ? productData.images
          : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'],
      isActive: productData.isActive !== undefined ? productData.isActive : true,
      isFeatured: !!productData.isFeatured,
      rating: 5.0,
      reviewCount: 1,
      tags: productData.tags || ['new arrival'],
      createdAt: new Date().toISOString(),
    };

    db.products.unshift(newProd);
    db.version = (db.version || 1) + 1;
    saveDatabase(db);
    return res.json({ success: true, product: newProd });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint: Delete a Product
app.delete('/api/products/:id', (req, res) => {
  try {
    const db = getDatabase();
    db.products = db.products.filter((p: any) => p.id !== req.params.id);
    db.version = (db.version || 1) + 1;
    saveDatabase(db);
    return res.json({ success: true, message: 'Product removed.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint: Adjust Product Stock & Log Movement
app.post('/api/products/:id/stock', (req, res) => {
  try {
    const { amount, reason, staffEmail } = req.body;
    const db = getDatabase();
    const prod = db.products.find((p: any) => p.id === req.params.id);
    if (!prod) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    prod.stock = Math.max(0, prod.stock + Number(amount));
    db.inventoryLogs.unshift({
      id: `inv-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      changeAmount: Number(amount),
      reason: reason || 'Stock Adjustment',
      performedBy: staffEmail || 'admin@amocart.com',
      timestamp: new Date().toISOString(),
      resultingStock: prod.stock,
    });

    db.version = (db.version || 1) + 1;
    saveDatabase(db);
    return res.json({ success: true, stock: prod.stock });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint: Add or update Category
app.post('/api/categories', (req, res) => {
  try {
    const catData = req.body;
    const db = getDatabase();
    const idx = db.categories.findIndex((c: any) => c.id === catData.id);
    if (idx !== -1) {
      db.categories[idx] = { ...db.categories[idx], ...catData };
    } else {
      db.categories.push({
        id: catData.id || `cat-${Date.now()}`,
        name: catData.name,
        slug: catData.slug || catData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: catData.description || '',
        isActive: catData.isActive !== false,
        itemCount: catData.itemCount || 0,
      });
    }
    db.version = (db.version || 1) + 1;
    saveDatabase(db);
    return res.json({ success: true, category: catData });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint: Create / Save Order from Customer
app.post('/api/orders', (req, res) => {
  try {
    const orderData = req.body;
    const db = getDatabase();
    db.orders.unshift(orderData);
    db.version = (db.version || 1) + 1;
    saveDatabase(db);
    return res.json({ success: true, order: orderData });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint: Update Order Status
app.patch('/api/orders/:id/status', (req, res) => {
  try {
    const { status, trackingNumber } = req.body;
    const db = getDatabase();
    const order = db.orders.find((o: any) => o.id === req.params.id);
    if (order) {
      order.status = status;
      if (trackingNumber) order.trackingNumber = trackingNumber;
      db.version = (db.version || 1) + 1;
      saveDatabase(db);
      return res.json({ success: true, order });
    }
    return res.status(404).json({ success: false, error: 'Order not found.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Mount Vite or static server
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AmoCart Server active on port ${PORT}`);
  });
}

startServer();
