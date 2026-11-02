import express from 'express';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

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
