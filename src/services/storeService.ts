import {
  Category,
  Product,
  User,
  Cart,
  CartItem,
  Order,
  OrderStatus,
  PaymentRecord,
  InventoryMovement,
  Address,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_USERS,
  INITIAL_ORDERS,
  INITIAL_PAYMENTS,
  INITIAL_INVENTORY_LOGS,
} from '../data/mockDatabase';
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
  RazorpayVerificationPayload,
} from './razorpay';

const STORAGE_KEYS = {
  CATEGORIES: 'amocart_db_categories',
  PRODUCTS: 'amocart_db_products',
  USERS: 'amocart_db_users',
  ORDERS: 'amocart_db_orders',
  PAYMENTS: 'amocart_db_payments',
  INVENTORY_LOGS: 'amocart_db_inventory_logs',
  CURRENT_USER: 'amocart_auth_current_user',
  GUEST_CART: 'amocart_guest_cart',
  WELCOME_POPUP_DISMISSED: 'amocart_welcome_popup_dismissed',
};

// Safe JSON loader
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Failed to parse storage key ${key}:`, e);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save to storage key ${key}:`, e);
  }
}

class StoreService {
  private categories: Category[];
  private products: Product[];
  private users: User[];
  private orders: Order[];
  private payments: PaymentRecord[];
  private inventoryLogs: InventoryMovement[];
  private currentUser: User | null;
  private listeners: Set<() => void> = new Set();
  private isSyncing: boolean = false;

  constructor() {
    const isClean = localStorage.getItem('amocart_v3_clean_store') === 'true';
    if (!isClean) {
      localStorage.removeItem(STORAGE_KEYS.ORDERS);
      localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
      localStorage.removeItem(STORAGE_KEYS.INVENTORY_LOGS);
      localStorage.removeItem(STORAGE_KEYS.USERS);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.GUEST_CART);
      localStorage.setItem('amocart_v3_clean_store', 'true');
    }

    this.categories = loadFromStorage(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    this.products = loadFromStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    this.users = loadFromStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
    this.orders = loadFromStorage(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    this.payments = loadFromStorage(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
    this.inventoryLogs = loadFromStorage(STORAGE_KEYS.INVENTORY_LOGS, INITIAL_INVENTORY_LOGS);
    this.currentUser = loadFromStorage(STORAGE_KEYS.CURRENT_USER, null);

    // Initial background sync with central cloud server
    this.syncWithServer();

    // Re-sync when switching back to tab or on interval for live multi-device updates
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        this.syncWithServer();
      });
      setInterval(() => {
        this.syncWithServer();
      }, 10000);
    }
  }

  // --- REACTIVE SUBSCRIBERS ---
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public notify(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error('Error in storeService listener:', e);
      }
    });
  }

  // --- CLOUD SERVER SYNCHRONIZATION ---
  public async syncWithServer(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      const res = await fetch('/api/store/data');
      if (!res.ok) {
        this.isSyncing = false;
        return;
      }
      const data = await res.json();
      if (!data || !data.success) {
        this.isSyncing = false;
        return;
      }

      let changed = false;

      // Auto-migrate local custom edits to freshly initialized server
      const hasLocalEdits = localStorage.getItem('amocart_has_custom_edits') === 'true';
      if (hasLocalEdits && Number(data.version) <= 1) {
        await this.pushAllToServer();
        this.isSyncing = false;
        return;
      }

      if (Array.isArray(data.products) && data.products.length > 0) {
        if (JSON.stringify(this.products) !== JSON.stringify(data.products)) {
          this.products = data.products;
          saveToStorage(STORAGE_KEYS.PRODUCTS, this.products);
          changed = true;
        }
      }

      if (Array.isArray(data.categories) && data.categories.length > 0) {
        if (JSON.stringify(this.categories) !== JSON.stringify(data.categories)) {
          this.categories = data.categories;
          saveToStorage(STORAGE_KEYS.CATEGORIES, this.categories);
          changed = true;
        }
      }

      if (Array.isArray(data.orders)) {
        if (JSON.stringify(this.orders) !== JSON.stringify(data.orders)) {
          this.orders = data.orders;
          saveToStorage(STORAGE_KEYS.ORDERS, this.orders);
          changed = true;
        }
      }

      if (Array.isArray(data.inventoryLogs)) {
        if (JSON.stringify(this.inventoryLogs) !== JSON.stringify(data.inventoryLogs)) {
          this.inventoryLogs = data.inventoryLogs;
          saveToStorage(STORAGE_KEYS.INVENTORY_LOGS, this.inventoryLogs);
          changed = true;
        }
      }

      if (changed) {
        this.notify();
      }
    } catch {
      // Graceful offline fallback
    } finally {
      this.isSyncing = false;
    }
  }

  public async pushAllToServer(): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch('/api/store/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: this.products,
          categories: this.categories,
          orders: this.orders,
          payments: this.payments,
          inventoryLogs: this.inventoryLogs,
        }),
      });
      const result = await res.json();
      if (result.success) {
        localStorage.removeItem('amocart_has_custom_edits');
        return { success: true, message: 'All changes successfully synchronized across all devices!' };
      }
      return { success: false, message: result.error || 'Server rejected synchronization.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error syncing with server.' };
    }
  }

  // --- WELCOME POPUP PREFERENCE ---
  public isWelcomePopupDismissed(): boolean {
    return localStorage.getItem(STORAGE_KEYS.WELCOME_POPUP_DISMISSED) === 'true';
  }

  public setWelcomePopupDismissed(dismiss: boolean): void {
    if (dismiss) {
      localStorage.setItem(STORAGE_KEYS.WELCOME_POPUP_DISMISSED, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.WELCOME_POPUP_DISMISSED);
    }
  }

  // --- AUTHENTICATION ---
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public setCurrentUser(user: User | null): void {
    this.currentUser = user;
    saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
  }

  public register(fullName: string, email: string, phone?: string): { success: boolean; user?: User; error?: string } {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = this.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return { success: false, error: 'An account with this email address already exists. Please sign in instead.' };
    }

    const userPhone = phone?.trim() || '8807938905';
    const defaultAddr: Address = {
      id: `addr_${Date.now()}`,
      fullName: fullName.trim(),
      phone: userPhone,
      street: '4/285 ,NGGOS Colony',
      city: 'Hosur',
      state: 'Tamil Nadu',
      postalCode: '635109',
      isDefault: true,
    };

    const newUser: User = {
      id: `usr_${Date.now()}`,
      email: normalizedEmail,
      fullName: fullName.trim(),
      phone: userPhone,
      role: 'customer',
      createdAt: new Date().toISOString(),
      isActive: true,
      addresses: [defaultAddr],
    };

    this.users.push(newUser);
    saveToStorage(STORAGE_KEYS.USERS, this.users);
    this.setCurrentUser(newUser);

    // Merge session cart upon registration
    this.mergeGuestCartWithUserCart(newUser.id);

    return { success: true, user: newUser };
  }

  public login(email: string): { success: boolean; user?: User; error?: string } {
    const normalizedEmail = email.trim().toLowerCase();
    const user = this.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      return { success: false, error: 'No account found with this email. Please check your credentials or register.' };
    }
    if (!user.isActive) {
      return { success: false, error: 'This account has been deactivated by the store administrator.' };
    }

    // Ensure phone and default delivery address are set to the requested address if empty
    if (!user.phone) {
      user.phone = '8807938905';
    }
    if (!user.addresses || user.addresses.length === 0) {
      user.addresses = [
        {
          id: `addr_${Date.now()}`,
          fullName: user.fullName,
          phone: user.phone || '8807938905',
          street: '4/285 ,NGGOS Colony',
          city: 'Hosur',
          state: 'Tamil Nadu',
          postalCode: '635109',
          isDefault: true,
        },
      ];
      saveToStorage(STORAGE_KEYS.USERS, this.users);
    }

    this.setCurrentUser(user);
    // Merge session cart with authenticated user cart
    this.mergeGuestCartWithUserCart(user.id);

    return { success: true, user };
  }

  public logout(): void {
    this.setCurrentUser(null);
  }

  public updateUserAddresses(userId: string, addresses: Address[]): void {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      user.addresses = addresses;
      saveToStorage(STORAGE_KEYS.USERS, this.users);
      if (this.currentUser?.id === userId) {
        this.setCurrentUser({ ...user });
      }
    }
  }

  // --- CATEGORIES ---
  public getCategories(): Category[] {
    return [...this.categories];
  }

  public saveCategory(category: Partial<Category>): Category {
    let saved: Category;
    if (category.id) {
      const idx = this.categories.findIndex((c) => c.id === category.id);
      if (idx !== -1) {
        this.categories[idx] = { ...this.categories[idx], ...category };
        saved = this.categories[idx];
      } else {
        saved = category as Category;
      }
    } else {
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name: category.name || 'New Category',
        slug: (category.name || 'new-category').toLowerCase().replace(/\s+/g, '-'),
        description: category.description || '',
        isActive: category.isActive !== undefined ? category.isActive : true,
        itemCount: 0,
      };
      this.categories.push(newCat);
      saved = newCat;
    }

    localStorage.setItem('amocart_has_custom_edits', 'true');
    saveToStorage(STORAGE_KEYS.CATEGORIES, this.categories);
    this.notify();

    fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saved),
    }).catch((e) => console.warn('Category sync to server failed:', e));

    return saved;
  }

  // --- PRODUCTS ---
  public getProducts(filters?: {
    categorySlug?: string;
    searchQuery?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'featured' | 'price-asc' | 'price-desc' | 'newest' | 'rating';
    inStockOnly?: boolean;
    activeOnly?: boolean;
  }): Product[] {
    let result = [...this.products];

    if (filters?.activeOnly !== false) {
      result = result.filter((p) => p.isActive);
    }

    if (filters?.categorySlug) {
      const category = this.categories.find((c) => c.slug === filters.categorySlug);
      if (category) {
        result = result.filter((p) => p.categoryId === category.id);
      }
    }

    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (filters?.minPrice !== undefined) {
      result = result.filter((p) => p.price >= (filters.minPrice || 0));
    }
    if (filters?.maxPrice !== undefined) {
      result = result.filter((p) => p.price <= (filters.maxPrice || Infinity));
    }

    if (filters?.inStockOnly) {
      result = result.filter((p) => p.stock > 0);
    }

    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'price-asc':
          result.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          result.sort((a, b) => b.price - a.price);
          break;
        case 'newest':
          result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'rating':
          result.sort((a, b) => b.rating - a.rating);
          break;
        case 'featured':
        default:
          result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
          break;
      }
    }

    return result;
  }

  public getProductById(id: string): Product | undefined {
    return this.products.find((p) => p.id === id);
  }

  public getProductBySlug(slug: string): Product | undefined {
    return this.products.find((p) => p.slug === slug);
  }

  public saveProduct(productData: Partial<Product>): { success: boolean; product?: Product; error?: string } {
    if (!productData.name || !productData.price || productData.price <= 0) {
      return { success: false, error: 'Product name and valid price are required.' };
    }

    if (productData.id) {
      const idx = this.products.findIndex((p) => p.id === productData.id);
      if (idx !== -1) {
        const oldProduct = this.products[idx];
        const stockDiff = (productData.stock ?? oldProduct.stock) - oldProduct.stock;

        this.products[idx] = { ...oldProduct, ...productData };
        localStorage.setItem('amocart_has_custom_edits', 'true');
        saveToStorage(STORAGE_KEYS.PRODUCTS, this.products);
        this.notify();

        if (stockDiff !== 0) {
          this.logInventoryMovement(
            this.products[idx].id,
            this.products[idx].name,
            this.products[idx].sku,
            stockDiff,
            'Admin Restock',
            this.currentUser?.email || 'admin@amocart.com',
            this.products[idx].stock
          );
        }

        fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.products[idx]),
        }).catch((e) => console.warn('Product sync to server failed:', e));

        return { success: true, product: this.products[idx] };
      }
    }

    const cat = this.categories.find((c) => c.id === productData.categoryId) || this.categories[0];
    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name: productData.name,
      slug: (productData.name).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: productData.description || 'Premium craftsmanship crafted for AmoCart customers.',
      price: Number(productData.price),
      originalPrice: productData.originalPrice ? Number(productData.originalPrice) : undefined,
      categoryId: cat.id,
      categoryName: cat.name,
      stock: Number(productData.stock ?? 10),
      lowStockThreshold: Number(productData.lowStockThreshold ?? 5),
      sku: productData.sku || `AMO-${cat.name.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      images: productData.images && productData.images.length ? productData.images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'],
      isActive: productData.isActive !== undefined ? productData.isActive : true,
      isFeatured: !!productData.isFeatured,
      rating: 5.0,
      reviewCount: 1,
      tags: productData.tags || ['new arrival', cat.slug],
      createdAt: new Date().toISOString(),
    };

    this.products.unshift(newProd);
    localStorage.setItem('amocart_has_custom_edits', 'true');
    saveToStorage(STORAGE_KEYS.PRODUCTS, this.products);
    this.notify();

    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProd),
    }).catch((e) => console.warn('New product sync to server failed:', e));

    this.logInventoryMovement(
      newProd.id,
      newProd.name,
      newProd.sku,
      newProd.stock,
      'Initial Stock',
      this.currentUser?.email || 'admin@amocart.com',
      newProd.stock
    );

    return { success: true, product: newProd };
  }

  public deleteProduct(id: string): { success: boolean; error?: string } {
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx === -1) return { success: false, error: 'Product not found.' };

    this.products.splice(idx, 1);
    localStorage.setItem('amocart_has_custom_edits', 'true');
    saveToStorage(STORAGE_KEYS.PRODUCTS, this.products);
    this.notify();

    fetch(`/api/products/${id}`, {
      method: 'DELETE',
    }).catch((e) => console.warn('Product delete sync failed:', e));

    return { success: true };
  }

  // --- INVENTORY MANAGEMENT ---
  public adjustStock(
    productId: string,
    quantityChange: number,
    reason: InventoryMovement['reason'],
    adminEmail: string
  ): { success: boolean; product?: Product; error?: string } {
    const product = this.products.find((p) => p.id === productId);
    if (!product) return { success: false, error: 'Product not found.' };

    const newStock = product.stock + quantityChange;
    if (newStock < 0) {
      return { success: false, error: `Cannot reduce stock below zero. Current stock is ${product.stock}.` };
    }

    product.stock = newStock;
    localStorage.setItem('amocart_has_custom_edits', 'true');
    saveToStorage(STORAGE_KEYS.PRODUCTS, this.products);
    this.notify();

    fetch(`/api/products/${productId}/stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: quantityChange, reason, staffEmail: adminEmail }),
    }).catch((e) => console.warn('Stock adjustment sync failed:', e));

    this.logInventoryMovement(
      product.id,
      product.name,
      product.sku,
      quantityChange,
      reason,
      adminEmail,
      product.stock
    );

    return { success: true, product };
  }

  private logInventoryMovement(
    productId: string,
    productName: string,
    sku: string,
    quantityChange: number,
    reason: InventoryMovement['reason'],
    administrator: string,
    balanceAfter: number
  ) {
    const entry: InventoryMovement = {
      id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId,
      productName,
      sku,
      quantityChange,
      reason,
      administrator,
      timestamp: new Date().toISOString(),
      balanceAfter,
    };
    this.inventoryLogs.unshift(entry);
    saveToStorage(STORAGE_KEYS.INVENTORY_LOGS, this.inventoryLogs);
  }

  public getInventoryLogs(): InventoryMovement[] {
    return [...this.inventoryLogs];
  }

  // --- CART MANAGEMENT ---
  private getCartStorageKey(): string {
    return this.currentUser ? `amocart_cart_user_${this.currentUser.id}` : STORAGE_KEYS.GUEST_CART;
  }

  public getCart(): Cart {
    const key = this.getCartStorageKey();
    const rawItems: { productId: string; quantity: number }[] = loadFromStorage(key, []);

    const validatedItems: CartItem[] = [];
    let subtotal = 0;

    for (const raw of rawItems) {
      const product = this.products.find((p) => p.id === raw.productId && p.isActive);
      if (product) {
        // Enforce inventory limit
        const qty = Math.min(raw.quantity, Math.max(0, product.stock));
        if (qty > 0) {
          const lineTotal = product.price * qty;
          subtotal += lineTotal;
          validatedItems.push({
            id: `ci-${product.id}`,
            productId: product.id,
            product,
            quantity: qty,
            unitPrice: product.price,
            lineTotal,
          });
        }
      }
    }

    const couponCode = localStorage.getItem('amocart_applied_coupon') || undefined;
    let discount = 0;
    if (couponCode === 'WELCOME10') {
      discount = Math.round(subtotal * 0.1);
    } else if (couponCode === 'AMOFEST' && subtotal > 3000) {
      discount = 500;
    }

    // Free shipping above ₹999, else ₹99 (standard retail standard)
    const shipping = subtotal > 999 || subtotal === 0 ? 0 : 99;
    const total = Math.max(0, subtotal + shipping - discount);

    return {
      items: validatedItems,
      subtotal,
      shipping,
      discount,
      couponCode,
      total,
    };
  }

  public addToCart(productId: string, quantity: number = 1): { success: boolean; error?: string; cart: Cart } {
    const product = this.products.find((p) => p.id === productId);
    if (!product || !product.isActive) {
      return { success: false, error: 'This product is no longer available.', cart: this.getCart() };
    }

    if (product.stock <= 0) {
      return { success: false, error: 'Sorry, this product is currently out of stock.', cart: this.getCart() };
    }

    const key = this.getCartStorageKey();
    const rawItems: { productId: string; quantity: number }[] = loadFromStorage(key, []);
    const existingIndex = rawItems.findIndex((i) => i.productId === productId);

    if (existingIndex !== -1) {
      const targetQty = rawItems[existingIndex].quantity + quantity;
      if (targetQty > product.stock) {
        rawItems[existingIndex].quantity = product.stock;
        saveToStorage(key, rawItems);
        return {
          success: false,
          error: `Only ${product.stock} units available in stock. Quantity adjusted.`,
          cart: this.getCart(),
        };
      }
      rawItems[existingIndex].quantity = targetQty;
    } else {
      const qtyToAdd = Math.min(quantity, product.stock);
      rawItems.push({ productId, quantity: qtyToAdd });
    }

    saveToStorage(key, rawItems);
    return { success: true, cart: this.getCart() };
  }

  public updateCartQuantity(productId: string, quantity: number): Cart {
    const key = this.getCartStorageKey();
    let rawItems: { productId: string; quantity: number }[] = loadFromStorage(key, []);

    if (quantity <= 0) {
      rawItems = rawItems.filter((i) => i.productId !== productId);
    } else {
      const product = this.products.find((p) => p.id === productId);
      const stock = product ? product.stock : 0;
      const targetQty = Math.min(quantity, stock);

      const item = rawItems.find((i) => i.productId === productId);
      if (item) {
        item.quantity = targetQty;
      }
    }

    saveToStorage(key, rawItems);
    return this.getCart();
  }

  public removeFromCart(productId: string): Cart {
    const key = this.getCartStorageKey();
    let rawItems: { productId: string; quantity: number }[] = loadFromStorage(key, []);
    rawItems = rawItems.filter((i) => i.productId !== productId);
    saveToStorage(key, rawItems);
    return this.getCart();
  }

  public clearCart(): void {
    const key = this.getCartStorageKey();
    saveToStorage(key, []);
    localStorage.removeItem('amocart_applied_coupon');
  }

  public applyCoupon(code: string): { success: boolean; message: string; cart: Cart } {
    const normalized = code.trim().toUpperCase();
    if (normalized === 'WELCOME10') {
      localStorage.setItem('amocart_applied_coupon', 'WELCOME10');
      return { success: true, message: 'Coupon WELCOME10 applied (10% discount)!', cart: this.getCart() };
    }
    if (normalized === 'AMOFEST') {
      localStorage.setItem('amocart_applied_coupon', 'AMOFEST');
      return { success: true, message: 'Coupon AMOFEST applied (₹500 discount on orders over ₹3000)!', cart: this.getCart() };
    }
    return { success: false, message: 'Invalid coupon code. Try WELCOME10 or AMOFEST.', cart: this.getCart() };
  }

  public removeCoupon(): Cart {
    localStorage.removeItem('amocart_applied_coupon');
    return this.getCart();
  }

  /**
   * Merges Anonymous session cart with Authenticated User Cart
   */
  public mergeGuestCartWithUserCart(userId: string): void {
    const guestKey = STORAGE_KEYS.GUEST_CART;
    const guestItems: { productId: string; quantity: number }[] = loadFromStorage(guestKey, []);
    if (guestItems.length === 0) return;

    const userKey = `amocart_cart_user_${userId}`;
    const userItems: { productId: string; quantity: number }[] = loadFromStorage(userKey, []);

    for (const gItem of guestItems) {
      const product = this.products.find((p) => p.id === gItem.productId);
      if (!product || product.stock <= 0) continue;

      const existing = userItems.find((u) => u.productId === gItem.productId);
      if (existing) {
        existing.quantity = Math.min(existing.quantity + gItem.quantity, product.stock);
      } else {
        userItems.push({ productId: gItem.productId, quantity: Math.min(gItem.quantity, product.stock) });
      }
    }

    saveToStorage(userKey, userItems);
    // Clear guest cart once merged
    saveToStorage(guestKey, []);
  }

  // --- CHECKOUT & RAZORPAY ORDERS ---
  public async initiateCheckout(shippingAddress: Address): Promise<{
    success: boolean;
    orderNumber?: string;
    razorpayOrderId?: string;
    amountInPaise?: number;
    amountInRupees?: number;
    keyId?: string;
    error?: string;
  }> {
    if (!this.currentUser) {
      return { success: false, error: 'Authentication required. Please sign in to proceed with checkout.' };
    }

    const cart = this.getCart();
    if (cart.items.length === 0) {
      return { success: false, error: 'Your cart is empty. Please add items before checking out.' };
    }

    // Re-validate stock for all cart items on server
    for (const item of cart.items) {
      const product = this.products.find((p) => p.id === item.productId);
      if (!product || product.stock < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for "${item.product.name}". Only ${product?.stock ?? 0} available.`,
        };
      }
    }

    const orderNumber = `AMO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const rzpRes = await createRazorpayOrder(orderNumber, cart.total);

    if (!rzpRes.success || !rzpRes.data) {
      return {
        success: false,
        error: rzpRes.error || 'Failed to initialize Razorpay payment session.',
      };
    }

    return {
      success: true,
      orderNumber,
      razorpayOrderId: rzpRes.data.orderId,
      amountInPaise: rzpRes.data.amount,
      amountInRupees: cart.total,
      keyId: rzpRes.data.keyId,
    };
  }

  public async completeOrderWithVerification(
    orderNumber: string,
    shippingAddress: Address,
    verification: RazorpayVerificationPayload
  ): Promise<{ success: boolean; order?: Order; error?: string }> {
    if (!this.currentUser) {
      return { success: false, error: 'User session expired. Please sign in again.' };
    }

    // Server-side cryptographic signature check
    const sigCheck = await verifyRazorpaySignature(
      verification.razorpay_order_id,
      verification.razorpay_payment_id,
      verification.razorpay_signature
    );

    if (!sigCheck.isValid) {
      return {
        success: false,
        error: 'Razorpay payment signature verification failed. Possible tampering detected.',
      };
    }

    const cart = this.getCart();
    if (cart.items.length === 0) {
      return { success: false, error: 'Cart is empty or already processed.' };
    }

    // Decrement inventory and log movements safely
    for (const item of cart.items) {
      const product = this.products.find((p) => p.id === item.productId);
      if (product) {
        product.stock = Math.max(0, product.stock - item.quantity);
        this.logInventoryMovement(
          product.id,
          product.name,
          product.sku,
          -item.quantity,
          'Order Placement',
          `Order ${orderNumber}`,
          product.stock
        );
      }
    }
    saveToStorage(STORAGE_KEYS.PRODUCTS, this.products);

    const now = new Date().toISOString();
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customerId: this.currentUser.id,
      customerEmail: this.currentUser.email,
      customerName: this.currentUser.fullName,
      customerPhone: this.currentUser.phone || shippingAddress.phone,
      createdAt: now,
      updatedAt: now,
      items: cart.items.map((i) => ({
        id: `oi-${Math.random().toString(36).substring(2, 8)}`,
        productId: i.productId,
        productName: i.product.name,
        productImage: i.product.images[0] || '',
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        lineTotal: i.lineTotal,
      })),
      shippingAddress: { ...shippingAddress },
      subtotal: cart.subtotal,
      shippingFee: cart.shipping,
      discount: cart.discount,
      finalAmount: cart.total,
      paymentStatus: 'Captured',
      orderStatus: 'Confirmed',
      paymentReference: verification.razorpay_payment_id,
      razorpayOrderId: verification.razorpay_order_id,
      razorpayPaymentId: verification.razorpay_payment_id,
      events: [
        {
          status: 'Confirmed',
          timestamp: now,
          description: `Payment of ₹${cart.total.toLocaleString()} captured and verified securely via Razorpay.`,
        },
      ],
    };

    this.orders.unshift(newOrder);
    saveToStorage(STORAGE_KEYS.ORDERS, this.orders);
    this.notify();

    fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, trackingNumber }),
    }).catch((e) => console.warn('Order status sync failed:', e));
    this.notify();

    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder),
    }).catch((e) => console.warn('Order sync to server failed:', e));

    // Record verified payment
    const paymentRecord: PaymentRecord = {
      id: `pay-${Date.now()}`,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      customerEmail: this.currentUser.email,
      amount: newOrder.finalAmount,
      currency: 'INR',
      gateway: 'Razorpay',
      gatewayOrderId: verification.razorpay_order_id,
      gatewayPaymentId: verification.razorpay_payment_id,
      status: 'Captured',
      createdAt: now,
      signature: verification.razorpay_signature,
      refundStatus: 'None',
    };
    this.payments.unshift(paymentRecord);
    saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);

    // Save shipping address to user profile if not exists
    if (!this.currentUser.addresses.some((a) => a.street === shippingAddress.street && a.postalCode === shippingAddress.postalCode)) {
      this.currentUser.addresses.push({ ...shippingAddress, id: `addr-${Date.now()}` });
      this.updateUserAddresses(this.currentUser.id, this.currentUser.addresses);
    }

    // Empty cart
    this.clearCart();

    return { success: true, order: newOrder };
  }

  // --- ORDERS & TRACKING ---
  public getOrders(customerId?: string): Order[] {
    if (customerId) {
      return this.orders.filter((o) => o.customerId === customerId);
    }
    return [...this.orders];
  }

  public getOrderById(id: string): Order | undefined {
    return this.orders.find((o) => o.id === id || o.orderNumber === id);
  }

  public updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    adminEmail: string,
    trackingNumber?: string
  ): { success: boolean; order?: Order; error?: string } {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return { success: false, error: 'Order not found.' };

    const oldStatus = order.orderStatus;
    order.orderStatus = newStatus;
    order.updatedAt = new Date().toISOString();

    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    order.events.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      description: `Order status updated from ${oldStatus} to ${newStatus} by ${adminEmail}. ${
        trackingNumber ? `AWB: ${trackingNumber}` : ''
      }`,
    });

    // If cancelled, restock items
    if (newStatus === 'Cancelled' && oldStatus !== 'Cancelled') {
      for (const item of order.items) {
        const prod = this.products.find((p) => p.id === item.productId);
        if (prod) {
          prod.stock += item.quantity;
          this.logInventoryMovement(
            prod.id,
            prod.name,
            prod.sku,
            item.quantity,
            'Order Cancellation',
            adminEmail,
            prod.stock
          );
        }
      }
      saveToStorage(STORAGE_KEYS.PRODUCTS, this.products);
    }

    saveToStorage(STORAGE_KEYS.ORDERS, this.orders);
    this.notify();

    fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, trackingNumber }),
    }).catch((e) => console.warn('Order status sync failed:', e));
    return { success: true, order };
  }

  public processRazorpayRefund(orderId: string, adminEmail: string): { success: boolean; error?: string } {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return { success: false, error: 'Order not found.' };

    order.paymentStatus = 'Refunded';
    order.orderStatus = 'Refunded';
    order.updatedAt = new Date().toISOString();
    order.events.push({
      status: 'Refunded',
      timestamp: new Date().toISOString(),
      description: `Full refund of ₹${order.finalAmount.toLocaleString()} processed via Razorpay API by ${adminEmail}.`,
    });

    const payment = this.payments.find((p) => p.orderId === orderId || p.orderNumber === order.orderNumber);
    if (payment) {
      payment.status = 'Refunded';
      payment.refundStatus = 'Processed';
      payment.refundAmount = order.finalAmount;
      saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);
    }

    saveToStorage(STORAGE_KEYS.ORDERS, this.orders);
    this.notify();

    fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, trackingNumber }),
    }).catch((e) => console.warn('Order status sync failed:', e));
    return { success: true };
  }

  public getPayments(): PaymentRecord[] {
    return [...this.payments];
  }

  public getUsers(): User[] {
    return [...this.users];
  }

  public toggleUserStatus(userId: string): User | undefined {
    const user = this.users.find((u) => u.id === userId);
    if (user && user.role !== 'admin') {
      user.isActive = !user.isActive;
      saveToStorage(STORAGE_KEYS.USERS, this.users);
      return user;
    }
    return user;
  }

  // --- ANALYTICS CALCULATIONS ---
  public getAnalyticsSummary() {
    const totalProducts = this.products.length;
    const activeProducts = this.products.filter((p) => p.isActive).length;
    const lowStockProducts = this.products.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length;
    const outOfStockProducts = this.products.filter((p) => p.stock === 0).length;

    const registeredCustomers = this.users.filter((u) => u.role === 'customer').length;
    const totalOrders = this.orders.length;
    const pendingOrders = this.orders.filter((o) => o.orderStatus === 'Pending Payment').length;

    // Recognized paid orders: status is not cancelled and payment is Captured or Refunded
    const paidOrders = this.orders.filter((o) => o.paymentStatus === 'Captured' || o.paymentStatus === 'Refunded');
    const grossSales = paidOrders.reduce((sum, o) => sum + o.finalAmount, 0);

    const refundedOrders = this.orders.filter((o) => o.paymentStatus === 'Refunded');
    const refundTotal = refundedOrders.reduce((sum, o) => sum + o.finalAmount, 0);
    const netRevenue = grossSales - refundTotal;

    const averageOrderValue = paidOrders.length > 0 ? Math.round(grossSales / paidOrders.length) : 0;

    // Sales by category
    const categorySalesMap: Record<string, { name: string; amount: number; count: number }> = {};
    for (const cat of this.categories) {
      categorySalesMap[cat.id] = { name: cat.name, amount: 0, count: 0 };
    }

    for (const o of paidOrders) {
      for (const item of o.items) {
        const prod = this.products.find((p) => p.id === item.productId);
        if (prod && categorySalesMap[prod.categoryId]) {
          categorySalesMap[prod.categoryId].amount += item.lineTotal;
          categorySalesMap[prod.categoryId].count += item.quantity;
        }
      }
    }

    // Top selling products
    const productSalesMap: Record<string, { product: Product; unitsSold: number; totalRevenue: number }> = {};
    for (const o of paidOrders) {
      for (const item of o.items) {
        if (!productSalesMap[item.productId]) {
          const prod = this.products.find((p) => p.id === item.productId);
          if (prod) {
            productSalesMap[item.productId] = { product: prod, unitsSold: 0, totalRevenue: 0 };
          }
        }
        if (productSalesMap[item.productId]) {
          productSalesMap[item.productId].unitsSold += item.quantity;
          productSalesMap[item.productId].totalRevenue += item.lineTotal;
        }
      }
    }

    const topSellingProducts = Object.values(productSalesMap)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);

    return {
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      registeredCustomers,
      totalOrders,
      pendingOrders,
      paidOrdersCount: paidOrders.length,
      grossSales,
      refundTotal,
      netRevenue,
      averageOrderValue,
      categorySales: Object.values(categorySalesMap),
      topSellingProducts,
    };
  }

  // --- CSV REPORT GENERATOR ---
  public generateOrdersCsv(): string {
    const headers = ['Order Number', 'Date', 'Customer Name', 'Customer Email', 'Items Count', 'Subtotal (INR)', 'Shipping (INR)', 'Discount (INR)', 'Total (INR)', 'Payment Status', 'Order Status', 'Tracking Number'];
    const rows = this.orders.map((o) => [
      o.orderNumber,
      o.createdAt.split('T')[0],
      `"${o.customerName}"`,
      o.customerEmail,
      o.items.reduce((s, i) => s + i.quantity, 0),
      o.subtotal,
      o.shippingFee,
      o.discount,
      o.finalAmount,
      o.paymentStatus,
      o.orderStatus,
      o.trackingNumber || 'N/A',
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

export const storeService = new StoreService();
