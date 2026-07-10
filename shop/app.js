const WHATSAPP_NUMBER = "9607988774";
const CURRENCY = "MVR";

// SAMPLE PRODUCTS: replace prices, descriptions and image URLs with your own stock.
const products = [
  { id: 1, name: "iPhone 16 Pro Max 256GB", price: 22999, oldPrice: 23999, category: "Phones", description: "Premium smartphone with advanced camera system and titanium design.", image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=900&q=80", badge: "Popular", featured: true, stock: 4 },
  { id: 2, name: "Samsung Galaxy S25 Ultra", price: 21499, category: "Phones", description: "Flagship Android phone with S Pen, bright display and versatile cameras.", image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=900&q=80", badge: "New", featured: true, stock: 5 },
  { id: 3, name: "MacBook Air 13-inch", price: 18999, oldPrice: 19999, category: "Computers", description: "Thin and lightweight laptop for everyday work, study and creative tasks.", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80", badge: "Offer", featured: true, stock: 3 },
  { id: 4, name: "AirPods Pro", price: 4499, category: "Audio", description: "Wireless earbuds with active noise cancellation and charging case.", image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=900&q=80", badge: "Best seller", featured: true, stock: 8 },
  { id: 5, name: "JBL Portable Speaker", price: 3299, oldPrice: 3599, category: "Audio", description: "Powerful portable Bluetooth speaker with durable, travel-friendly design.", image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=80", badge: "Offer", featured: false, stock: 7 },
  { id: 6, name: "Apple Watch", price: 8999, category: "Wearables", description: "Smart watch for activity tracking, notifications and everyday health insights.", image: "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?auto=format&fit=crop&w=900&q=80", badge: "New", featured: true, stock: 6 },
  { id: 7, name: "Eufy Outdoor Security Camera", price: 4999, category: "Security", description: "Wireless outdoor security camera with clear video and smart detection.", image: "https://images.unsplash.com/photo-1557324232-b8917d3c3dcb?auto=format&fit=crop&w=900&q=80", badge: "Smart home", featured: true, stock: 5 },
  { id: 8, name: "Indoor Wi-Fi Camera", price: 1299, oldPrice: 1499, category: "Security", description: "Compact indoor camera with phone monitoring, alerts and night vision.", image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=900&q=80", badge: "Offer", featured: false, stock: 12 },
  { id: 9, name: "UniFi Wi-Fi 7 Access Point", price: 4799, category: "Networking", description: "High-performance ceiling access point for modern homes and businesses.", image: "https://images.unsplash.com/photo-1606420187127-2b39e831cdd0?auto=format&fit=crop&w=900&q=80", badge: "Pro", featured: true, stock: 6 },
  { id: 10, name: "Wi-Fi 6 Router", price: 2199, oldPrice: 2499, category: "Networking", description: "Fast dual-band Wi-Fi router for reliable home internet coverage.", image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=900&q=80", badge: "Offer", featured: false, stock: 9 },
  { id: 11, name: "20,000mAh Power Bank", price: 899, category: "Accessories", description: "Large-capacity portable power bank with multiple charging outputs.", image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=900&q=80", badge: "Essential", featured: false, stock: 15 },
  { id: 12, name: "65W USB-C Fast Charger", price: 699, oldPrice: 799, category: "Accessories", description: "Compact high-power charger for compatible phones, tablets and laptops.", image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=900&q=80", badge: "Offer", featured: false, stock: 20 },
  { id: 13, name: "HDMI 2.1 Cable 2m", price: 299, category: "Accessories", description: "High-speed HDMI cable suitable for 4K displays, consoles and media devices.", image: "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=900&q=80", badge: "Value", featured: false, stock: 25 },
  { id: 14, name: "Mechanical Gaming Keyboard", price: 1299, category: "Computers", description: "Responsive mechanical keyboard with backlighting for work and gaming.", image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80", badge: "Gaming", featured: false, stock: 10 },
  { id: 15, name: "Wireless Mouse", price: 399, category: "Computers", description: "Comfortable wireless mouse with quiet clicks and long battery life.", image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=900&q=80", badge: "Value", featured: false, stock: 18 },
  { id: 16, name: "Smart LED Bulb", price: 180, category: "Smart Home", description: "App-controlled colour LED bulb for convenient home lighting.", image: "https://images.unsplash.com/photo-1550985616-10810253b84d?auto=format&fit=crop&w=900&q=80", badge: "Smart home", featured: false, stock: 30 }
];

let cart = JSON.parse(localStorage.getItem("naskhu-shop-cart") || "[]");
let wishlist = JSON.parse(localStorage.getItem("naskhu-shop-wishlist") || "[]");
let activeCategory = "All";
let wishlistOnly = false;

const $ = selector => document.querySelector(selector);
const productGrid = $("#productGrid");
const cartDrawer = $("#cartDrawer");
const cartItems = $("#cartItems");
const searchInput = $("#searchInput");
const sortSelect = $("#sortSelect");
const toast = $("#toast");

function money(value) { return `${CURRENCY} ${Number(value).toLocaleString("en-US")}`; }
function saveCart() { localStorage.setItem("naskhu-shop-cart", JSON.stringify(cart)); }
function saveWishlist() { localStorage.setItem("naskhu-shop-wishlist", JSON.stringify(wishlist)); }
function showToast(message) { toast.textContent = message; toast.classList.add("show"); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800); }
function productById(id) { return products.find(product => product.id === id); }

function renderCategories() {
  const categories = ["All", ...new Set(products.map(product => product.category))];
  $("#categoryChips").innerHTML = categories.map(category => `<button type="button" class="category-chip ${category === activeCategory ? "active" : ""}" data-category="${category}">${category}</button>`).join("");
}

function renderProducts() {
  const query = searchInput.value.trim().toLowerCase();
  let filtered = products.filter(product => {
    const matchesSearch = `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query);
    const matchesCategory = activeCategory === "All" || product.category === activeCategory;
    const matchesWishlist = !wishlistOnly || wishlist.includes(product.id);
    return matchesSearch && matchesCategory && matchesWishlist;
  });
  const sort = sortSelect.value;
  filtered.sort((a, b) => sort === "price-low" ? a.price - b.price : sort === "price-high" ? b.price - a.price : sort === "name" ? a.name.localeCompare(b.name) : Number(b.featured) - Number(a.featured));
  $("#productCount").textContent = `${filtered.length} product${filtered.length === 1 ? "" : "s"}${wishlistOnly ? " in wishlist" : ""}`;
  productGrid.innerHTML = filtered.length ? filtered.map(product => {
    const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
    return `<article class="product-card">
      <div class="product-image"><img src="${product.image}" alt="${product.name}" loading="lazy"><div class="badge-row"><span class="product-badge">${product.badge}</span>${discount ? `<span class="discount-badge">-${discount}%</span>` : ""}</div><button type="button" class="wish-button ${wishlist.includes(product.id) ? "active" : ""}" data-wish="${product.id}" aria-label="Add ${product.name} to wishlist">${wishlist.includes(product.id) ? "♥" : "♡"}</button></div>
      <div class="product-content"><span class="category-label">${product.category}</span><h3>${product.name}</h3><p>${product.description}</p><div class="stock ${product.stock < 5 ? "low" : ""}">${product.stock < 5 ? `Only ${product.stock} left` : "In stock"}</div><div class="product-footer"><div><strong>${money(product.price)}</strong>${product.oldPrice ? `<del>${money(product.oldPrice)}</del>` : ""}</div><button class="add-button" type="button" data-add="${product.id}">Add</button></div></div>
    </article>`;
  }).join("") : `<div class="empty-state"><span>🔍</span><h3>No products found</h3><p>Try another search or category.</p></div>`;
}

function addToCart(id) {
  const existing = cart.find(item => item.id === id);
  if (existing) existing.quantity += 1; else cart.push({ id, quantity: 1 });
  saveCart(); renderCart(); showToast(`${productById(id).name} added`);
}
function updateQuantity(id, amount) { const item = cart.find(entry => entry.id === id); if (!item) return; item.quantity += amount; if (item.quantity <= 0) cart = cart.filter(entry => entry.id !== id); saveCart(); renderCart(); }
function removeFromCart(id) { cart = cart.filter(item => item.id !== id); saveCart(); renderCart(); }
function toggleWishlist(id) { wishlist = wishlist.includes(id) ? wishlist.filter(item => item !== id) : [...wishlist, id]; saveWishlist(); renderProducts(); updateWishlistCount(); }
function cartDetails() { return cart.map(item => ({ ...productById(item.id), quantity: item.quantity })).filter(item => item.name); }
function deliveryFee() { return Number($("#deliveryArea").selectedOptions[0].dataset.fee || 0); }

function renderCart() {
  const details = cartDetails();
  const count = details.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalValue = details.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const fee = deliveryFee();
  $("#cartCount").textContent = count;
  $("#subtotal").textContent = money(subtotalValue);
  $("#deliveryTotal").textContent = $("#deliveryArea").value === "Other island" ? "Confirm" : money(fee);
  $("#total").textContent = money(subtotalValue + fee);
  cartItems.innerHTML = details.length ? details.map(item => `<div class="cart-item"><img src="${item.image}" alt=""><div><h3>${item.name}</h3><p>${money(item.price)} each</p><div class="quantity-row"><button type="button" data-qty="-1" data-id="${item.id}">−</button><strong>${item.quantity}</strong><button type="button" data-qty="1" data-id="${item.id}">+</button><button type="button" class="remove-button" data-remove="${item.id}">Remove</button></div></div><strong>${money(item.price * item.quantity)}</strong></div>`).join("") : `<div class="cart-empty"><span>🛒</span><h3>Your cart is empty</h3><p>Add products to start an order.</p></div>`;
}
function updateWishlistCount() { $("#wishlistCount").textContent = wishlist.length; }
function openCart() { cartDrawer.classList.add("open"); cartDrawer.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; }
function closeCart() { cartDrawer.classList.remove("open"); cartDrawer.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; }

function checkout() {
  const details = cartDetails();
  if (!details.length) return showToast("Your cart is empty");
  const name = $("#customerName").value.trim(); const phone = $("#customerPhone").value.trim(); const address = $("#customerAddress").value.trim();
  const area = $("#deliveryArea").value; const payment = $("#paymentMethod").value; const note = $("#orderNote").value.trim();
  if (!name || !phone || (!address && area !== "Pickup")) return showToast("Enter your contact and delivery details");
  const subtotalValue = details.reduce((sum, item) => sum + item.price * item.quantity, 0); const fee = deliveryFee(); const orderNumber = `NS-${Date.now().toString().slice(-6)}`;
  const lines = details.map((item, index) => `${index + 1}. ${item.name} × ${item.quantity} — ${money(item.price * item.quantity)}`);
  const message = [`*New Naskhu Store Order — ${orderNumber}*`, "", `*Customer:* ${name}`, `*Phone:* ${phone}`, `*Delivery:* ${area}`, `*Address:* ${address || "Pickup"}`, `*Payment:* ${payment}`, "", "*Items:*", ...lines, "", `*Subtotal:* ${money(subtotalValue)}`, `*Delivery fee:* ${area === "Other island" ? "Please confirm" : money(fee)}`, `*Estimated total:* ${money(subtotalValue + fee)}`, note ? `*Note:* ${note}` : "", "", "Please confirm availability and final total."].filter(Boolean).join("\n");
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
}

productGrid.addEventListener("click", event => { const add = event.target.closest("[data-add]"); const wish = event.target.closest("[data-wish]"); if (add) addToCart(Number(add.dataset.add)); if (wish) toggleWishlist(Number(wish.dataset.wish)); });
$("#categoryChips").addEventListener("click", event => { const button = event.target.closest("[data-category]"); if (!button) return; activeCategory = button.dataset.category; wishlistOnly = false; renderCategories(); renderProducts(); });
cartItems.addEventListener("click", event => { const qty = event.target.closest("[data-qty]"); const remove = event.target.closest("[data-remove]"); if (qty) updateQuantity(Number(qty.dataset.id), Number(qty.dataset.qty)); if (remove) removeFromCart(Number(remove.dataset.remove)); });
$("#cartButton").addEventListener("click", openCart); document.querySelectorAll("[data-close-cart]").forEach(element => element.addEventListener("click", closeCart));
$("#checkoutButton").addEventListener("click", checkout); $("#deliveryArea").addEventListener("change", renderCart); searchInput.addEventListener("input", renderProducts); sortSelect.addEventListener("change", renderProducts);
$("#wishlistButton").addEventListener("click", () => { wishlistOnly = !wishlistOnly; activeCategory = "All"; renderCategories(); renderProducts(); showToast(wishlistOnly ? "Showing wishlist" : "Showing all products"); });
$("#themeButton").addEventListener("click", () => { document.body.classList.toggle("dark"); localStorage.setItem("naskhu-shop-theme", document.body.classList.contains("dark") ? "dark" : "light"); });
document.addEventListener("keydown", event => { if (event.key === "Escape") closeCart(); });
if (localStorage.getItem("naskhu-shop-theme") === "dark") document.body.classList.add("dark");
renderCategories(); renderProducts(); renderCart(); updateWishlistCount();