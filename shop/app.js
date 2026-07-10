const WHATSAPP_NUMBER = "9607988774";
const CURRENCY = "MVR";

// Edit this list to add, remove or change products.
// For product photos, upload images inside shop/images and use: image: "images/photo.jpg"
const products = [
  { id: 1, name: "Wireless Earbuds", price: 450, category: "Electronics", description: "Compact wireless earbuds with charging case.", image: "🎧" },
  { id: 2, name: "USB-C Fast Charger", price: 250, category: "Electronics", description: "Reliable fast charger for compatible phones and tablets.", image: "🔌" },
  { id: 3, name: "Premium Phone Cable", price: 120, category: "Accessories", description: "Durable everyday charging and data cable.", image: "🔋" },
  { id: 4, name: "Smart LED Bulb", price: 180, category: "Home", description: "Energy-efficient lighting for your home or office.", image: "💡" },
  { id: 5, name: "Portable Bluetooth Speaker", price: 650, category: "Electronics", description: "Portable speaker with clear sound and rechargeable battery.", image: "🔊" },
  { id: 6, name: "Multi-purpose Cleaning Set", price: 295, category: "Home", description: "Useful cleaning essentials packed as one convenient set.", image: "🧽" }
];

let cart = JSON.parse(localStorage.getItem("naskhu-shop-cart") || "[]");

const productGrid = document.querySelector("#productGrid");
const productCount = document.querySelector("#productCount");
const searchInput = document.querySelector("#searchInput");
const categoryFilter = document.querySelector("#categoryFilter");
const cartDrawer = document.querySelector("#cartDrawer");
const cartItems = document.querySelector("#cartItems");
const cartCount = document.querySelector("#cartCount");
const subtotal = document.querySelector("#subtotal");
const total = document.querySelector("#total");
const toast = document.querySelector("#toast");

function money(value) {
  return `${CURRENCY} ${Number(value).toLocaleString("en-US")}`;
}

function saveCart() {
  localStorage.setItem("naskhu-shop-cart", JSON.stringify(cart));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function imageMarkup(product) {
  const isPath = /[/.]/.test(product.image);
  return isPath
    ? `<img src="${product.image}" alt="${product.name}" loading="lazy">`
    : `<span aria-hidden="true">${product.image}</span>`;
}

function renderProducts() {
  const query = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const filtered = products.filter(product => {
    const matchesQuery = `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(query);
    const matchesCategory = category === "all" || product.category === category;
    return matchesQuery && matchesCategory;
  });

  productCount.textContent = `${filtered.length} product${filtered.length === 1 ? "" : "s"}`;
  productGrid.innerHTML = filtered.length ? filtered.map(product => `
    <article class="product-card">
      <div class="product-image">${imageMarkup(product)}</div>
      <div class="product-content">
        <span class="category-pill">${product.category}</span>
        <h3>${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <div class="product-footer">
          <strong class="price">${money(product.price)}</strong>
          <button class="add-button" type="button" data-add="${product.id}">Add to cart</button>
        </div>
      </div>
    </article>
  `).join("") : `<div class="empty-state">No products match your search.</div>`;
}

function renderCategories() {
  [...new Set(products.map(product => product.category))].sort().forEach(category => {
    categoryFilter.insertAdjacentHTML("beforeend", `<option value="${category}">${category}</option>`);
  });
}

function addToCart(productId) {
  const existing = cart.find(item => item.id === productId);
  if (existing) existing.quantity += 1;
  else cart.push({ id: productId, quantity: 1 });
  saveCart();
  renderCart();
  showToast("Added to cart");
}

function updateQuantity(productId, amount) {
  const item = cart.find(entry => entry.id === productId);
  if (!item) return;
  item.quantity += amount;
  if (item.quantity <= 0) cart = cart.filter(entry => entry.id !== productId);
  saveCart();
  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
  renderCart();
}

function cartDetails() {
  return cart.map(item => ({ ...products.find(product => product.id === item.id), quantity: item.quantity })).filter(item => item.name);
}

function renderCart() {
  const details = cartDetails();
  const count = details.reduce((sum, item) => sum + item.quantity, 0);
  const amount = details.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartCount.textContent = count;
  subtotal.textContent = money(amount);
  total.textContent = money(amount);

  cartItems.innerHTML = details.length ? details.map(item => `
    <div class="cart-item">
      <div>
        <h3>${item.name}</h3>
        <p>${money(item.price)} each</p>
        <div class="quantity-row">
          <button type="button" data-qty="-1" data-id="${item.id}" aria-label="Reduce quantity">−</button>
          <strong>${item.quantity}</strong>
          <button type="button" data-qty="1" data-id="${item.id}" aria-label="Increase quantity">+</button>
          <button type="button" class="remove-button" data-remove="${item.id}">Remove</button>
        </div>
      </div>
      <div class="item-total">${money(item.price * item.quantity)}</div>
    </div>
  `).join("") : `<div class="cart-empty">Your cart is empty. Add a product to begin.</div>`;
}

function openCart() {
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function checkout() {
  const details = cartDetails();
  if (!details.length) return showToast("Your cart is empty");

  const name = document.querySelector("#customerName").value.trim();
  const phone = document.querySelector("#customerPhone").value.trim();
  const address = document.querySelector("#customerAddress").value.trim();
  const payment = document.querySelector("#paymentMethod").value;
  const note = document.querySelector("#orderNote").value.trim();
  if (!name || !phone || !address) return showToast("Enter name, phone and address");

  const amount = details.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const lines = details.map((item, index) => `${index + 1}. ${item.name} × ${item.quantity} — ${money(item.price * item.quantity)}`);
  const orderNumber = `NS-${Date.now().toString().slice(-6)}`;
  const message = [
    `*New Shop Order — ${orderNumber}*`, "",
    `*Customer:* ${name}`,
    `*Phone:* ${phone}`,
    `*Address:* ${address}`,
    `*Payment:* ${payment}`, "",
    "*Items:*", ...lines, "",
    `*Subtotal:* ${money(amount)}`,
    "*Delivery:* Please confirm",
    `*Total before delivery:* ${money(amount)}`,
    note ? `\n*Note:* ${note}` : "",
    "", "Please confirm availability, delivery fee and final total."
  ].filter(Boolean).join("\n");

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
}

productGrid.addEventListener("click", event => {
  const button = event.target.closest("[data-add]");
  if (button) addToCart(Number(button.dataset.add));
});
cartItems.addEventListener("click", event => {
  const quantityButton = event.target.closest("[data-qty]");
  const removeButton = event.target.closest("[data-remove]");
  if (quantityButton) updateQuantity(Number(quantityButton.dataset.id), Number(quantityButton.dataset.qty));
  if (removeButton) removeFromCart(Number(removeButton.dataset.remove));
});
document.querySelector("#cartButton").addEventListener("click", openCart);
document.querySelectorAll("[data-close-cart]").forEach(element => element.addEventListener("click", closeCart));
document.querySelector("#checkoutButton").addEventListener("click", checkout);
searchInput.addEventListener("input", renderProducts);
categoryFilter.addEventListener("change", renderProducts);
document.addEventListener("keydown", event => { if (event.key === "Escape") closeCart(); });

renderCategories();
renderProducts();
renderCart();
