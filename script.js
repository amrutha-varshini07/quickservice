/**
 * ==============================================================================
 * QuickServe Food Ordering System - Vanilla JavaScript Application
 * ==============================================================================
 * Architecture Highlights:
 * 1. State Management: Single Source of Truth for Menu, Active Filters, and Cart
 * 2. Real-time Calculation: Subtotal, 5% Tax (GST), Dynamic Delivery Fee (Free > ₹500)
 * 3. Client-side Form Validation with instant user feedback
 * 4. Dual UI Cart synchronization (In-page checkout section + Slide-over drawer)
 * 5. Backend-Ready API Integration Service (Seamless Fetch API hookup for Node.js/Express)
 * ==============================================================================
 */

// -----------------------------------------------------------------------------
// 1. Backend Integration Configuration
// -----------------------------------------------------------------------------
const API_CONFIG = {
  // Enabled for direct Express & MongoDB persistence
  USE_BACKEND_API: true,
  BASE_URL: (window.location.port === '5000' || (window.location.origin && window.location.origin.includes(':5000'))) ? '/api' : 'http://localhost:5000/api',
  ENDPOINTS: {
    MENU: '/menu',
    ORDERS: '/orders'
  }
};

// -----------------------------------------------------------------------------
// Reliable Image Mappings & Sensible Fallbacks
// -----------------------------------------------------------------------------
const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

const SVG_FALLBACK_IMAGE = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='46%25' font-family='sans-serif' font-size='22' font-weight='bold' fill='%2394a3b8' text-anchor='middle'%3EQuickServe Delicious Food%3C/text%3E%3Ctext x='50%25' y='56%25' font-family='sans-serif' font-size='15' fill='%23cbd5e1' text-anchor='middle'%3EImage temporarily unavailable%3C/text%3E%3C/svg%3E";

const SAMOSA_AUTHENTIC_IMAGE = 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80';
const GULAB_JAMUN_AUTHENTIC_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Gulab-jamun-wallpaper-1.jpg/800px-Gulab-jamun-wallpaper-1.jpg';

const FOOD_IMAGE_MAP = {
  'Hyderabadi Chicken Biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
  'Paneer Butter Masala': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80',
  'Butter Chicken (Murgh Makhani)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Butter_Chicken_%26_Butter_Naan_-_Home_-_Chandigarh_-_India_-_0006.jpg/800px-Butter_Chicken_%26_Butter_Naan_-_Home_-_Chandigarh_-_India_-_0006.jpg',
  'Crispy Masala Dosa': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80',
  'Farmhouse Margherita Pizza': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80',
  'Crispy Zinger Chicken Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
  'Royal Veg Dum Biryani': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Veg_Biryani.jpg/800px-Veg_Biryani.jpg',
  'Steamed Idli Sambar Platter': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Idli_Sambar.JPG/800px-Idli_Sambar.JPG',
  'Gulab Jamun with Rabdi (2 pcs)': GULAB_JAMUN_AUTHENTIC_IMAGE,
  'Mango Lassi & Refreshing Mint': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Mango-Lassi.jpg/800px-Mango-Lassi.jpg',
  'Crispy Punjabi Samosa (2 pcs)': SAMOSA_AUTHENTIC_IMAGE,
  'Crispy Samosa': SAMOSA_AUTHENTIC_IMAGE,
  'Samosa': SAMOSA_AUTHENTIC_IMAGE
};

/**
 * Returns the verified correct image URL for a food item by name,
 * with fallbacks if missing or unmapped.
 * Enforces that Gulab Jamun ALWAYS shows gulab jamun with rabdi (never samosas),
 * and Samosa cards ALWAYS show samosas.
 */
function getCorrectFoodImage(item) {
  if (!item) return DEFAULT_FALLBACK_IMAGE;
  const name = item.name || '';

  if (/Gulab\s*Jamun/i.test(name)) {
    return GULAB_JAMUN_AUTHENTIC_IMAGE;
  }
  if (/Samosa/i.test(name)) {
    return SAMOSA_AUTHENTIC_IMAGE;
  }
  if (FOOD_IMAGE_MAP[name]) {
    return FOOD_IMAGE_MAP[name];
  }
  // If an item was assigned the samosa image by mistake and is not a samosa, return default fallback
  if (item.image && item.image.includes('1601050690597') && !/Samosa/i.test(name)) {
    return DEFAULT_FALLBACK_IMAGE;
  }
  return (item && item.image) ? item.image : DEFAULT_FALLBACK_IMAGE;
}

/**
 * Sensible image fallback handler: prevents recursive loops and guarantees a visible image
 */
function handleImageError(img) {
  if (!img) return;
  img.onerror = function() {
    this.onerror = null;
    this.src = SVG_FALLBACK_IMAGE;
  };
  img.src = DEFAULT_FALLBACK_IMAGE;
}

// -----------------------------------------------------------------------------
// 2. Sample Food Menu Data (Indian Rupee ₹ Pricing)
// -----------------------------------------------------------------------------
const SAMPLE_MENU_ITEMS = [
  {
    id: 1,
    name: 'Hyderabadi Chicken Biryani',
    category: 'biryani',
    categoryLabel: 'Biryani & Rice',
    price: 299,
    isVeg: false,
    rating: 4.9,
    description: 'Slow-cooked aromatic basmati rice layered with marinated tender chicken and royal Indian spices.',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 2,
    name: 'Paneer Butter Masala',
    category: 'curry',
    categoryLabel: 'Main Curries',
    price: 249,
    isVeg: true,
    rating: 4.8,
    description: 'Fresh cottage cheese cubes simmered in rich, velvety tomato and cashew butter gravy.',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 3,
    name: 'Butter Chicken (Murgh Makhani)',
    category: 'curry',
    categoryLabel: 'Main Curries',
    price: 320,
    isVeg: false,
    rating: 4.9,
    description: 'Tender tandoori chicken cooked in creamy satin-smooth tomato sauce infused with fenugreek.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Butter_Chicken_%26_Butter_Naan_-_Home_-_Chandigarh_-_India_-_0006.jpg/800px-Butter_Chicken_%26_Butter_Naan_-_Home_-_Chandigarh_-_India_-_0006.jpg'
  },
  {
    id: 4,
    name: 'Crispy Masala Dosa',
    category: 'southindian',
    categoryLabel: 'South Indian',
    price: 139,
    isVeg: true,
    rating: 4.7,
    description: 'Crispy golden fermented crepe stuffed with spiced potato mash, served with sambar and fresh coconut chutney.',
    image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 5,
    name: 'Farmhouse Margherita Pizza',
    category: 'fastfood',
    categoryLabel: 'Fast Food',
    price: 279,
    isVeg: true,
    rating: 4.6,
    description: 'Hand-stretched dough topped with San Marzano tomato sauce, fresh mozzarella, and sweet basil.',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 6,
    name: 'Crispy Zinger Chicken Burger',
    category: 'fastfood',
    categoryLabel: 'Fast Food',
    price: 199,
    isVeg: false,
    rating: 4.7,
    description: 'Juicy crumb-fried chicken breast with crunchy lettuce and spicy mayo in a toasted brioche bun.',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 7,
    name: 'Royal Veg Dum Biryani',
    category: 'biryani',
    categoryLabel: 'Biryani & Rice',
    price: 229,
    isVeg: true,
    rating: 4.7,
    description: 'Garden fresh vegetables and fried paneer slow-cooked on dum with fragrant saffron rice.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Veg_Biryani.jpg/800px-Veg_Biryani.jpg'
  },
  {
    id: 8,
    name: 'Steamed Idli Sambar Platter',
    category: 'southindian',
    categoryLabel: 'South Indian',
    price: 99,
    isVeg: true,
    rating: 4.6,
    description: 'Soft pillow-like steamed rice cakes served with piping hot piping lentil sambar & three chutneys.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Idli_Sambar.JPG/800px-Idli_Sambar.JPG'
  },
  {
    id: 9,
    name: 'Gulab Jamun with Rabdi (2 pcs)',
    category: 'desserts',
    categoryLabel: 'Desserts & Drinks',
    price: 119,
    isVeg: true,
    rating: 4.9,
    description: 'Melt-in-mouth milk dumplings soaked in cardamom sugar syrup and garnished with thick malai rabdi.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Gulab-jamun-wallpaper-1.jpg/800px-Gulab-jamun-wallpaper-1.jpg'
  },
  {
    id: 10,
    name: 'Mango Lassi & Refreshing Mint',
    category: 'desserts',
    categoryLabel: 'Desserts & Drinks',
    price: 89,
    isVeg: true,
    rating: 4.8,
    description: 'Creamy Alphonso mango yogurt smoothie churned fresh and topped with chopped pistachios.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Mango-Lassi.jpg/800px-Mango-Lassi.jpg'
  }
];

// -----------------------------------------------------------------------------
// 3. Application State Store
// -----------------------------------------------------------------------------
const State = {
  menuItems: [...SAMPLE_MENU_ITEMS],
  cart: [], // Array of items: { id, name, price, isVeg, image, quantity }
  activeCategory: 'all',
  searchQuery: '',
  vegOnly: false
};

// -----------------------------------------------------------------------------
// 4. DOM Elements Cache
// -----------------------------------------------------------------------------
const DOM = {
  foodGrid: document.getElementById('food-grid'),
  emptyMenuState: document.getElementById('empty-menu-state'),
  categoryPills: document.getElementById('category-pills'),
  myOrdersBtn: document.getElementById('my-orders-btn'),
  myOrdersContainer: document.getElementById('my-orders-container'),
  menuSearchToggle: document.querySelector('.menu-search-toggle'),
  menuSearchInput: document.getElementById('menu-search-input'),
  searchClearBtn: document.getElementById('search-clear-btn'),
  vegOnlyToggle: document.getElementById('veg-only-toggle'),
  resetFiltersBtn: document.getElementById('reset-filters-btn'),

  // In-page Cart
  cartItemsList: document.getElementById('cart-items-list'),
  cartItemsCount: document.getElementById('cart-items-count'),
  navCartCount: document.getElementById('nav-cart-count'),
  clearCartBtn: document.getElementById('clear-cart-btn'),
  summarySubtotal: document.getElementById('summary-subtotal'),
  summaryDelivery: document.getElementById('summary-delivery'),
  freeDeliveryBadge: document.getElementById('free-delivery-badge'),
  summaryTax: document.getElementById('summary-tax'),
  summaryTotal: document.getElementById('summary-total'),
  btnTotalPreview: document.getElementById('btn-total-preview'),

  // Checkout Form
  checkoutForm: document.getElementById('checkout-form'),
  custName: document.getElementById('cust-name'),
  custPhone: document.getElementById('cust-phone'),
  custAddress: document.getElementById('cust-address'),
  custNotes: document.getElementById('cust-notes'),
  nameError: document.getElementById('name-error'),
  phoneError: document.getElementById('phone-error'),
  addressError: document.getElementById('address-error'),
  placeOrderBtn: document.getElementById('place-order-btn'),

  // Drawer
  openCartBtn: document.getElementById('open-cart-btn'),
  cartDrawer: document.getElementById('cart-drawer'),
  drawerOverlay: document.getElementById('drawer-overlay'),
  drawerCloseBtn: document.getElementById('drawer-close-btn'),
  drawerCartCount: document.getElementById('drawer-cart-count'),
  drawerItemsList: document.getElementById('drawer-items-list'),
  drawerGrandTotal: document.getElementById('drawer-grand-total'),
  drawerCheckoutBtn: document.getElementById('drawer-checkout-btn'),

  // Mobile Nav Toggle
  mobileToggle: document.getElementById('mobile-toggle'),
  navLinks: document.getElementById('nav-links'),

  // Order Confirmation Modal
  confirmationModal: document.getElementById('confirmation-modal'),
  modalOrderSummary: document.getElementById('modal-order-summary'),
  modalNewOrderBtn: document.getElementById('modal-new-order-btn'),

  // Toasts
  toastContainer: document.getElementById('toast-container')
};

// -----------------------------------------------------------------------------
// 5. Cart Logic & Calculations
// -----------------------------------------------------------------------------

/**
 * Load cart from localStorage if available
 */
function loadCartFromStorage() {
  try {
    const saved = localStorage.getItem('quickserve_cart');
    if (saved) {
      State.cart = JSON.parse(saved);
    }
  } catch (err) {
    console.warn('Could not read cart from localStorage', err);
    State.cart = [];
  }
}

/**
 * Save cart to localStorage
 */
function saveCartToStorage() {
  try {
    localStorage.setItem('quickserve_cart', JSON.stringify(State.cart));
  } catch (err) {
    console.warn('Could not save cart to localStorage', err);
  }
}

/**
 * Get pricing figures for the current cart state
 */
function calculateCartTotals() {
  const subtotal = State.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Free delivery if subtotal > ₹500, else ₹40 (or ₹0 if cart is empty)
  let deliveryFee = 0;
  if (subtotal > 0) {
    deliveryFee = subtotal >= 500 ? 0 : 40;
  }
  
  // 5% Restaurant GST
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + deliveryFee + tax;
  const totalItemsCount = State.cart.reduce((sum, item) => sum + item.quantity, 0);

  return { subtotal, deliveryFee, tax, total, totalItemsCount };
}

/**
 * Add an item to the cart or increment its quantity
 */
function addToCart(itemId) {
  const foodItem = State.menuItems.find(item => item.id === itemId);
  if (!foodItem) return;

  const existing = State.cart.find(item => item.id === itemId);
  if (existing) {
    existing.quantity += 1;
  } else {
    State.cart.push({
      id: foodItem.id,
      name: foodItem.name,
      price: foodItem.price,
      isVeg: foodItem.isVeg,
      image: foodItem.image,
      quantity: 1
    });
  }

  saveCartToStorage();
  updateUI();
  showToast(`Added "${foodItem.name}" to cart!`);
}

/**
 * Decrease quantity or remove item if quantity hits 0
 */
function decreaseItemQty(itemId) {
  const itemIndex = State.cart.findIndex(item => item.id === itemId);
  if (itemIndex === -1) return;

  if (State.cart[itemIndex].quantity > 1) {
    State.cart[itemIndex].quantity -= 1;
  } else {
    const removedName = State.cart[itemIndex].name;
    State.cart.splice(itemIndex, 1);
    showToast(`Removed "${removedName}" from cart`, 'remove');
  }

  saveCartToStorage();
  updateUI();
}

/**
 * Increase item quantity directly
 */
function increaseItemQty(itemId) {
  const item = State.cart.find(item => item.id === itemId);
  if (item) {
    item.quantity += 1;
    saveCartToStorage();
    updateUI();
  }
}

/**
 * Remove an item completely from cart
 */
function removeFromCart(itemId) {
  const itemIndex = State.cart.findIndex(item => item.id === itemId);
  if (itemIndex > -1) {
    const removedName = State.cart[itemIndex].name;
    State.cart.splice(itemIndex, 1);
    saveCartToStorage();
    updateUI();
    showToast(`Removed "${removedName}" from cart`, 'remove');
  }
}

/**
 * Empty the shopping cart
 */
function clearCart() {
  if (State.cart.length === 0) return;
  if (confirm('Are you sure you want to clear your cart?')) {
    State.cart = [];
    saveCartToStorage();
    updateUI();
    showToast('Cart cleared', 'remove');
  }
}

/**
 * Direct ordering: ensures the selected item is in the cart (preserving all existing cart items),
 * updates the cart count/totals, closes the drawer if open, and scrolls smoothly to checkout.
 */
function orderNow(itemId) {
  const foodItem = State.menuItems.find(item => item.id === itemId);
  if (!foodItem) return;

  const existing = State.cart.find(item => item.id === itemId);
  if (!existing) {
    State.cart.push({
      id: foodItem.id,
      name: foodItem.name,
      price: foodItem.price,
      isVeg: foodItem.isVeg,
      image: foodItem.image,
      quantity: 1
    });
    saveCartToStorage();
    updateUI();
    showToast(`"${foodItem.name}" added to order! Heading to checkout...`);
  } else {
    showToast(`"${foodItem.name}" ready in your order (Qty: ${existing.quantity}). Heading to checkout...`);
  }

  // Close the slide drawer if open
  closeCartDrawer();

  // Scroll smoothly to checkout section
  const checkoutSection = document.getElementById('checkout-section');
  if (checkoutSection) {
    checkoutSection.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      if (DOM.custName) {
        DOM.custName.focus();
      }
    }, 450);
  }
}

// Explicit window bindings for inline onclick attributes
window.addToCart = addToCart;
window.orderNow = orderNow;
window.decreaseItemQty = decreaseItemQty;
window.increaseItemQty = increaseItemQty;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.closeCartDrawer = closeCartDrawer;
window.handleImageError = handleImageError;


// -----------------------------------------------------------------------------
// 6. UI Rendering Functions
// -----------------------------------------------------------------------------

/**
 * Render the filtered food items grid
 */
function renderMenu() {
  // Ensure food grid and search bar are visible, and my-orders container is hidden
  if (DOM.foodGrid) DOM.foodGrid.style.display = 'grid';
  if (DOM.myOrdersContainer) DOM.myOrdersContainer.style.display = 'none';
  if (DOM.menuSearchToggle) DOM.menuSearchToggle.style.display = 'flex';

  const filtered = State.menuItems.filter(item => {
    // Category match
    const categoryMatch = (State.activeCategory === 'all') || (item.category === State.activeCategory);
    
    // Veg-only toggle match
    const vegMatch = !State.vegOnly || item.isVeg;

    // Search query match (name, description, or category label)
    const query = State.searchQuery.toLowerCase().trim();
    const searchMatch = !query || 
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.categoryLabel.toLowerCase().includes(query);

    return categoryMatch && vegMatch && searchMatch;
  });

  if (filtered.length === 0) {
    DOM.foodGrid.innerHTML = '';
    DOM.emptyMenuState.style.display = 'block';
    return;
  }

  DOM.emptyMenuState.style.display = 'none';

  DOM.foodGrid.innerHTML = filtered.map(item => {
    const cartItem = State.cart.find(c => c.id === item.id);
    const qtyInCart = cartItem ? cartItem.quantity : 0;

    const actionButtonHtml = qtyInCart > 0
      ? `
        <div class="card-qty-modifier">
          <button class="card-qty-btn" onclick="decreaseItemQty(${item.id})" aria-label="Decrease quantity">
            <i class="fa-solid fa-minus"></i>
          </button>
          <span class="card-qty-num">${qtyInCart}</span>
          <button class="card-qty-btn" onclick="increaseItemQty(${item.id})" aria-label="Increase quantity">
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>
      `
      : `
        <button class="add-to-cart-btn" onclick="addToCart(${item.id})">
          <i class="fa-solid fa-plus"></i> Add
        </button>
      `;

    return `
      <article class="food-card" data-id="${item.id}">
        <div class="card-media">
          <img 
            src="${item.image}" 
            alt="${escapeHtml(item.name)}" 
            class="food-img" 
            loading="lazy"
            onerror="handleImageError(this)"
          >
          <div class="diet-badge ${item.isVeg ? 'veg' : 'non-veg'}" title="${item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}"></div>
          <div class="rating-badge">
            <i class="fa-solid fa-star"></i> ${item.rating}
          </div>
        </div>

        <div class="card-body">
          <span class="food-category-tag">${item.categoryLabel}</span>
          <h3 class="food-title">${escapeHtml(item.name)}</h3>
          <p class="food-desc">${escapeHtml(item.description)}</p>
          
          <div class="card-footer">
            <div class="price-tag">
              <span class="price-currency">₹</span>${item.price}
            </div>
            <div class="card-actions">
              ${actionButtonHtml}
              <button class="order-now-btn" onclick="orderNow(${item.id})" title="Order directly and go to checkout">
                <i class="fa-solid fa-bolt"></i> Order Now
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

/**
 * Render items inside both the checkout section cart & drawer cart
 */
function renderCart() {
  const totals = calculateCartTotals();

  // Badges and counts
  DOM.cartItemsCount.textContent = totals.totalItemsCount;
  DOM.navCartCount.textContent = totals.totalItemsCount;
  DOM.drawerCartCount.textContent = totals.totalItemsCount;

  // Bill summary breakdown
  DOM.summarySubtotal.textContent = `₹${totals.subtotal}`;
  DOM.summaryDelivery.textContent = totals.subtotal === 0 ? '₹0' : (totals.deliveryFee === 0 ? 'FREE' : `₹${totals.deliveryFee}`);
  DOM.freeDeliveryBadge.style.display = (totals.subtotal >= 500) ? 'block' : 'none';
  DOM.summaryTax.textContent = `₹${totals.tax}`;
  DOM.summaryTotal.textContent = `₹${totals.total}`;
  DOM.btnTotalPreview.textContent = `₹${totals.total}`;
  DOM.drawerGrandTotal.textContent = `₹${totals.total}`;

  // If cart is empty
  if (State.cart.length === 0) {
    const emptyMarkup = `
      <div class="cart-empty-message">
        <i class="fa-solid fa-cart-shopping cart-empty-icon"></i>
        <p>Your shopping cart is empty.</p>
        <a href="#menu" class="btn btn-secondary btn-sm" onclick="closeCartDrawer()">
          <i class="fa-solid fa-utensils"></i> Browse Food Menu
        </a>
      </div>
    `;
    DOM.cartItemsList.innerHTML = emptyMarkup;
    DOM.drawerItemsList.innerHTML = emptyMarkup;
    return;
  }

  // Render cart items
  const itemsMarkup = State.cart.map(item => `
    <div class="cart-item-row" data-id="${item.id}">
      <img src="${item.image}" alt="${escapeHtml(item.name)}" class="cart-item-thumb" onerror="handleImageError(this)">
      
      <div class="cart-item-details">
        <h4 class="cart-item-title">${escapeHtml(item.name)}</h4>
        <div class="cart-item-rate">₹${item.price} each</div>
      </div>

      <div class="cart-item-controls">
        <div class="qty-control">
          <button class="qty-btn" onclick="decreaseItemQty(${item.id})" aria-label="Decrease quantity">
            <i class="fa-solid fa-minus"></i>
          </button>
          <span class="qty-val">${item.quantity}</span>
          <button class="qty-btn" onclick="increaseItemQty(${item.id})" aria-label="Increase quantity">
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>

        <div class="cart-item-subtotal">₹${item.price * item.quantity}</div>

        <button class="cart-remove-btn" onclick="removeFromCart(${item.id})" title="Remove item">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </div>
    </div>
  `).join('');

  DOM.cartItemsList.innerHTML = itemsMarkup;
  DOM.drawerItemsList.innerHTML = itemsMarkup;
}

/**
 * Synchronize UI components
 */
function updateUI() {
  renderMenu();
  renderCart();
}

// -----------------------------------------------------------------------------
// 7. Drawer & Modal Controller
// -----------------------------------------------------------------------------
function openCartDrawer() {
  DOM.cartDrawer.classList.add('active');
  DOM.drawerOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
  DOM.cartDrawer.classList.remove('active');
  DOM.drawerOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

function openConfirmationModal(orderData) {
  const dateFormatted = new Date(orderData.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  DOM.modalOrderSummary.innerHTML = `
    <div class="order-receipt-card">
      <div class="receipt-meta">
        <span class="receipt-id">Order #${orderData.orderId || ('QS-' + Math.floor(100000 + Math.random() * 900000))}</span>
        <span class="receipt-time">${dateFormatted}</span>
      </div>

      <div class="receipt-customer-block">
        <div><strong>Customer:</strong> ${escapeHtml(orderData.customer.name)}</div>
        <div><strong>Phone:</strong> ${escapeHtml(orderData.customer.phone)}</div>
        <div><strong>Address:</strong> ${escapeHtml(orderData.customer.address)}</div>
        ${orderData.customer.notes ? `<div><strong>Notes:</strong> ${escapeHtml(orderData.customer.notes)}</div>` : ''}
        <div><strong>Payment:</strong> <span class="badge-success">${orderData.paymentMethod || 'Cash on Delivery'}</span></div>
      </div>

      <div class="receipt-items-list">
        ${(orderData.items || []).map(i => `
          <div class="receipt-item-row">
            <span>${escapeHtml(i.name)} &times; ${i.quantity}</span>
            <span>₹${i.itemTotal || (i.price * i.quantity)}</span>
          </div>
        `).join('')}
      </div>

      <div class="receipt-pricing-row">
        <span>Subtotal</span>
        <span>₹${orderData.pricing.subtotal}</span>
      </div>
      <div class="receipt-pricing-row">
        <span>Delivery Fee</span>
        <span>${orderData.pricing.deliveryFee === 0 ? 'FREE' : `₹${orderData.pricing.deliveryFee}`}</span>
      </div>
      <div class="receipt-pricing-row">
        <span>Restaurant Tax (GST 5%)</span>
        <span>₹${orderData.pricing.tax}</span>
      </div>
      <div class="receipt-pricing-row total">
        <span>Grand Total</span>
        <span>₹${orderData.pricing.total}</span>
      </div>
    </div>
  `;

  DOM.confirmationModal.style.display = 'flex';
  setTimeout(() => {
    DOM.confirmationModal.classList.add('active');
  }, 10);
  document.body.style.overflow = 'hidden';
}

function closeConfirmationModal() {
  DOM.confirmationModal.classList.remove('active');
  setTimeout(() => {
    DOM.confirmationModal.style.display = 'none';
    document.body.style.overflow = '';
  }, 300);
}

// -----------------------------------------------------------------------------
// 8. Toast Notifications
// -----------------------------------------------------------------------------
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'remove' ? 'toast-remove' : ''}`;
  toast.innerHTML = `
    <i class="fa-solid ${type === 'remove' ? 'fa-circle-xmark' : 'fa-circle-check'}"></i>
    <span>${escapeHtml(message)}</span>
  `;

  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 400);
  }, 2600);
}

// -----------------------------------------------------------------------------
// 9. Form Validation & Order Submission (Backend Integration Service)
// -----------------------------------------------------------------------------

/**
 * Validate customer checkout form fields
 */
function validateCheckoutForm() {
  let isValid = true;

  const nameVal = DOM.custName.value.trim();
  const phoneVal = DOM.custPhone.value.trim();
  const addressVal = DOM.custAddress.value.trim();

  // Validate Name (min 3 chars)
  if (nameVal.length < 3) {
    DOM.custName.parentElement.classList.add('error');
    DOM.nameError.classList.add('active');
    isValid = false;
  } else {
    DOM.custName.parentElement.classList.remove('error');
    DOM.nameError.classList.remove('active');
  }

  // Validate Indian Phone Number (10 digits)
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(phoneVal)) {
    DOM.custPhone.parentElement.classList.add('error');
    DOM.phoneError.classList.add('active');
    isValid = false;
  } else {
    DOM.custPhone.parentElement.classList.remove('error');
    DOM.phoneError.classList.remove('active');
  }

  // Validate Address (min 8 chars)
  if (addressVal.length < 8) {
    DOM.custAddress.parentElement.classList.add('error');
    DOM.addressError.classList.add('active');
    isValid = false;
  } else {
    DOM.custAddress.parentElement.classList.remove('error');
    DOM.addressError.classList.remove('active');
  }

  return isValid;
}

/**
 * Handles order submission via Express REST API and saves to MongoDB.
 * Never claims an order was successful unless confirmed by the backend!
 */
async function handleCheckoutSubmit(e) {
  e.preventDefault();

  // 1. Verify Cart is not empty
  if (State.cart.length === 0) {
    showToast('Your cart is empty! Please add items first.', 'remove');
    document.getElementById('menu').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  // 2. Validate Form fields
  if (!validateCheckoutForm()) {
    showToast('Please fix the errors in the delivery form.', 'remove');
    return;
  }

  // 3. Assemble Order Payload (matches MongoDB/Express Order Schema)
  const totals = calculateCartTotals();
  const orderId = 'QS-' + Math.floor(100000 + Math.random() * 900000);

  const orderPayload = {
    orderId: orderId,
    customer: {
      name: DOM.custName.value.trim(),
      phone: DOM.custPhone.value.trim(),
      address: DOM.custAddress.value.trim(),
      notes: DOM.custNotes.value.trim() || null
    },
    items: State.cart.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      itemTotal: item.price * item.quantity
    })),
    pricing: {
      subtotal: totals.subtotal,
      deliveryFee: totals.deliveryFee,
      tax: totals.tax,
      total: totals.total
    },
    paymentMethod: 'Cash on Delivery',
    status: 'Order Received',
    createdAt: new Date().toISOString()
  };

  DOM.placeOrderBtn.disabled = true;
  DOM.placeOrderBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Placing Order...';

  try {
    // Submit order payload to backend
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ORDERS}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    const responseData = await response.json().catch(() => null);

    // Strictly check for backend confirmation
    if (!response.ok || !responseData || !responseData.success) {
      const errorMsg = (responseData && responseData.message)
        ? responseData.message
        : `Backend error (${response.status}: ${response.statusText || 'Unable to place order'})`;
      throw new Error(errorMsg);
    }

    console.log('Order successfully confirmed and saved to MongoDB:', responseData);

    // The backend confirmed the order! Extract the saved order document
    const confirmedOrder = responseData.order || { ...orderPayload, orderId: responseData.orderId || orderPayload.orderId };

    // Record order locally for customer identification & "My Orders" retrieval
    recordCustomerOrder(confirmedOrder);

    // Display the user-friendly confirmation modal with ordered items & totals
    openConfirmationModal(confirmedOrder);

    // Reset Form & Empty Cart only after confirmed backend success
    DOM.checkoutForm.reset();
    State.cart = [];
    saveCartToStorage();
    updateUI();
    showToast('Order placed successfully!');

  } catch (error) {
    console.error('Order submission failed:', error);
    // Do NOT claim order was placed successfully! Keep cart intact for the user
    showToast(`Order submission failed: ${error.message}`, 'remove');
    alert(`Could not place order: ${error.message}\n\nPlease verify that your Node.js backend server and MongoDB database are active.`);
  } finally {
    DOM.placeOrderBtn.disabled = false;
    const currentTotals = calculateCartTotals();
    DOM.placeOrderBtn.innerHTML = `<i class="fa-solid fa-check"></i> Place Food Order (<span id="btn-total-preview">₹${currentTotals.total}</span>)`;
  }
}

// -----------------------------------------------------------------------------
// 9.1 Customer Orders History (My Orders Feature)
// -----------------------------------------------------------------------------

/**
 * Saves placed order information to localStorage for customer identification
 */
function recordCustomerOrder(order) {
  if (!order) return;
  try {
    const rawOrders = localStorage.getItem('quickserve_my_orders');
    const orders = rawOrders ? JSON.parse(rawOrders) : [];
    const updated = [order, ...orders.filter(o => o.orderId !== order.orderId)];
    localStorage.setItem('quickserve_my_orders', JSON.stringify(updated));

    if (order.orderId) {
      const rawIds = localStorage.getItem('quickserve_my_order_ids');
      const ids = rawIds ? JSON.parse(rawIds) : [];
      if (!ids.includes(order.orderId)) {
        ids.unshift(order.orderId);
        localStorage.setItem('quickserve_my_order_ids', JSON.stringify(ids));
      }
    }

    if (order.customer && order.customer.phone) {
      localStorage.setItem('quickserve_customer_phone', order.customer.phone);
    }
  } catch (err) {
    console.warn('Could not record customer order to localStorage:', err);
  }
}

/**
 * Switch active category tab or switch to "My Orders" view
 */
function switchToCategory(category) {
  State.activeCategory = category;

  document.querySelectorAll('.filter-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === category);
  });

  if (category === 'my-orders') {
    renderMyOrders();
  } else {
    renderMenu();
  }
}
window.switchToCategory = switchToCategory;

/**
 * Render customer's previously placed orders in the My Orders tab.
 * Queries GET /api/orders from Express backend & MongoDB.
 */
async function renderMyOrders() {
  if (!DOM.myOrdersContainer) return;

  // Toggle container visibility
  if (DOM.foodGrid) DOM.foodGrid.style.display = 'none';
  if (DOM.emptyMenuState) DOM.emptyMenuState.style.display = 'none';
  if (DOM.menuSearchToggle) DOM.menuSearchToggle.style.display = 'none';
  DOM.myOrdersContainer.style.display = 'flex';

  DOM.myOrdersContainer.innerHTML = `
    <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted); width: 100%;">
      <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary-color); margin-bottom: 1rem;"></i>
      <p style="font-size: 1rem; font-weight: 600;">Loading order history from database...</p>
    </div>
  `;

  let orders = [];
  const customerPhone = localStorage.getItem('quickserve_customer_phone') || '';
  let savedIds = [];
  try {
    const rawIds = localStorage.getItem('quickserve_my_order_ids');
    if (rawIds) savedIds = JSON.parse(rawIds);
  } catch (e) {
    savedIds = [];
  }

  // 1. Fetch from Express backend /api/orders
  try {
    let url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ORDERS}`;
    if (customerPhone) {
      url += `?phone=${encodeURIComponent(customerPhone)}`;
    }
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        if (customerPhone) {
          orders = data;
        } else if (savedIds.length > 0) {
          orders = data.filter(o => savedIds.includes(o.orderId));
        } else {
          // If no specific customer identified on this device, show recent database orders
          orders = data;
        }
      }
    }
  } catch (err) {
    console.warn('Could not fetch orders from backend, checking local storage:', err);
  }

  // 2. Fallback to localStorage if backend returned empty or was unreachable
  if (orders.length === 0) {
    try {
      const localOrders = localStorage.getItem('quickserve_my_orders');
      if (localOrders) {
        orders = JSON.parse(localOrders);
      }
    } catch (err) {
      console.warn('Could not parse local orders:', err);
    }
  }

  // 3. Render Empty State if no orders exist
  if (!orders || orders.length === 0) {
    DOM.myOrdersContainer.innerHTML = `
      <div class="orders-empty-state" style="width: 100%;">
        <i class="fa-solid fa-receipt empty-icon" style="color: var(--primary-color); font-size: 3rem; margin-bottom: 1rem;"></i>
        <h3 style="font-family: var(--font-heading); font-size: 1.35rem; font-weight: 700; margin-bottom: 0.5rem;">No Orders Placed Yet</h3>
        <p style="color: var(--text-muted); margin-bottom: 1.25rem;">You haven't placed any orders yet. Explore our delicious menu and place your first order!</p>
        <button class="btn btn-primary" onclick="switchToCategory('all')">
          <i class="fa-solid fa-utensils"></i> Browse Food Menu
        </button>
      </div>
    `;
    return;
  }

  // 4. Render Orders List
  DOM.myOrdersContainer.innerHTML = orders.map(order => {
    const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
    const formattedDate = orderDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    const formattedTime = orderDate.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const items = order.items || [];
    const totalAmount = (order.pricing && order.pricing.total != null)
      ? order.pricing.total
      : (order.totalAmount != null ? order.totalAmount : 0);
    const orderStatus = order.status || 'Order Received';

    return `
      <article class="order-card" data-order-id="${escapeHtml(order.orderId || '')}">
        <div class="order-card-header">
          <div class="order-id-group">
            <div class="order-badge-icon">
              <i class="fa-solid fa-bag-shopping"></i>
            </div>
            <div>
              <div class="order-card-id">Order #${escapeHtml(order.orderId || 'QS-Order')}</div>
              <div class="order-card-time">
                <i class="fa-regular fa-clock"></i> Placed on ${formattedDate} at ${formattedTime}
              </div>
            </div>
          </div>
          <span class="order-status-badge">
            <i class="fa-solid fa-circle-check"></i> ${escapeHtml(orderStatus)}
          </span>
        </div>

        ${order.customer ? `
          <div class="order-card-customer">
            <span><i class="fa-solid fa-user"></i> ${escapeHtml(order.customer.name || '')}</span>
            ${order.customer.phone ? `<span><i class="fa-solid fa-phone"></i> ${escapeHtml(order.customer.phone)}</span>` : ''}
            ${order.customer.address ? `<span><i class="fa-solid fa-location-dot"></i> ${escapeHtml(order.customer.address)}</span>` : ''}
          </div>
        ` : ''}

        <div class="order-card-items">
          <h4>Items Ordered (${items.reduce((s, i) => s + (i.quantity || 1), 0)} items)</h4>
          <div class="order-items-grid">
            ${items.map(i => `
              <div class="order-item-chip">
                <span class="item-name">${escapeHtml(i.name)} &times; ${i.quantity || 1}</span>
                <span class="item-price">₹${i.itemTotal || (i.price * (i.quantity || 1))}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="order-card-footer">
          <div class="order-payment-method">
            <i class="fa-solid fa-money-bill-wave"></i> Payment: ${escapeHtml(order.paymentMethod || 'Cash on Delivery')}
          </div>
          <div class="order-total-price">
            Total Amount: <strong>₹${totalAmount}</strong>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// -----------------------------------------------------------------------------
// 10. Fetch Menu from Backend
// -----------------------------------------------------------------------------
async function fetchMenuFromBackend() {
  if (!API_CONFIG.USE_BACKEND_API) return;

  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MENU}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        State.menuItems = data.map(item => ({
          ...item,
          image: getCorrectFoodImage(item)
        }));
        renderMenu();
        console.log('Loaded food menu from backend with verified images.');
      }
    }
  } catch (err) {
    console.warn('Backend API offline or unreachable. Using built-in sample menu items.', err);
  }
}

// -----------------------------------------------------------------------------
// 11. Helper Utilities
// -----------------------------------------------------------------------------
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// -----------------------------------------------------------------------------
// 12. Event Listeners Setup
// -----------------------------------------------------------------------------
function setupEventListeners() {
  // Category Filter Pills & My Orders
  DOM.categoryPills.addEventListener('click', (e) => {
    const pill = e.target.closest('.filter-pill');
    if (!pill) return;
    switchToCategory(pill.dataset.category);
  });

  // Search Input
  DOM.menuSearchInput.addEventListener('input', (e) => {
    State.searchQuery = e.target.value;
    DOM.searchClearBtn.classList.toggle('active', State.searchQuery.length > 0);
    renderMenu();
  });

  // Search Clear Button
  DOM.searchClearBtn.addEventListener('click', () => {
    DOM.menuSearchInput.value = '';
    State.searchQuery = '';
    DOM.searchClearBtn.classList.remove('active');
    renderMenu();
  });

  // Veg Only Toggle Switch
  DOM.vegOnlyToggle.addEventListener('change', (e) => {
    State.vegOnly = e.target.checked;
    renderMenu();
  });

  // Reset Filters Button
  DOM.resetFiltersBtn.addEventListener('click', () => {
    State.searchQuery = '';
    State.vegOnly = false;
    DOM.menuSearchInput.value = '';
    DOM.vegOnlyToggle.checked = false;
    DOM.searchClearBtn.classList.remove('active');
    switchToCategory('all');
  });

  // Drawer Open / Close
  DOM.openCartBtn.addEventListener('click', openCartDrawer);
  DOM.drawerCloseBtn.addEventListener('click', closeCartDrawer);
  DOM.drawerOverlay.addEventListener('click', closeCartDrawer);
  DOM.drawerCheckoutBtn.addEventListener('click', closeCartDrawer);

  // Clear Cart Button
  DOM.clearCartBtn.addEventListener('click', clearCart);

  // Real-time Form Validation clearing on input
  DOM.custName.addEventListener('input', () => {
    if (DOM.custName.value.trim().length >= 3) {
      DOM.custName.parentElement.classList.remove('error');
      DOM.nameError.classList.remove('active');
    }
  });

  DOM.custPhone.addEventListener('input', () => {
    if (/^[6-9]\d{9}$/.test(DOM.custPhone.value.trim())) {
      DOM.custPhone.parentElement.classList.remove('error');
      DOM.phoneError.classList.remove('active');
    }
  });

  DOM.custAddress.addEventListener('input', () => {
    if (DOM.custAddress.value.trim().length >= 8) {
      DOM.custAddress.parentElement.classList.remove('error');
      DOM.addressError.classList.remove('active');
    }
  });

  // Checkout Form Submission
  DOM.checkoutForm.addEventListener('submit', handleCheckoutSubmit);

  // Order Confirmation Modal close
  DOM.modalNewOrderBtn.addEventListener('click', () => {
    closeConfirmationModal();
    document.getElementById('menu').scrollIntoView({ behavior: 'smooth' });
  });

  // Mobile Nav Toggle
  DOM.mobileToggle.addEventListener('click', () => {
    DOM.navLinks.classList.toggle('active');
  });

  // Close Mobile Nav when clicking any link & immediate active highlight
  DOM.navLinks.addEventListener('click', (e) => {
    const link = e.target.closest('.nav-link');
    if (link) {
      DOM.navLinks.classList.remove('active');
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    }
  });

  // Keyboard accessibility (ESC closes modals and drawers)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCartDrawer();
      if (DOM.confirmationModal.classList.contains('active')) {
        closeConfirmationModal();
      }
    }
  });
}

// -----------------------------------------------------------------------------
// 13. ScrollSpy Navigation Highlighting
// -----------------------------------------------------------------------------
function setupScrollSpy() {
  const sections = [
    document.getElementById('home'),
    document.getElementById('menu'),
    document.getElementById('features'),
    document.getElementById('checkout-section')
  ].filter(Boolean);

  const navLinks = document.querySelectorAll('.nav-links .nav-link');
  if (navLinks.length === 0 || sections.length === 0) return;

  function setActiveLinkById(targetId) {
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === `#${targetId}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  function handleScroll() {
    const scrollPosition = window.scrollY;
    const navbarOffset = 95; // Accounts for 72px navbar height + margin

    // If near the bottom of the page, activate the Checkout link
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    if (windowHeight + scrollPosition >= docHeight - 80) {
      setActiveLinkById('checkout-section');
      return;
    }

    // Identify which section is currently in view
    let currentId = 'home';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - navbarOffset;
      if (scrollPosition >= sectionTop) {
        currentId = section.getAttribute('id');
      }
    });

    setActiveLinkById(currentId);
  }

  let isTicking = false;
  window.addEventListener('scroll', () => {
    if (!isTicking) {
      window.requestAnimationFrame(() => {
        handleScroll();
        isTicking = false;
      });
      isTicking = true;
    }
  }, { passive: true });

  // Update immediately
  handleScroll();
}

// -----------------------------------------------------------------------------
// 14. Application Initialization
// -----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  loadCartFromStorage();
  updateUI();
  setupEventListeners();
  setupScrollSpy();
  fetchMenuFromBackend();
});

