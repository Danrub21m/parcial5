let events = eventsData; // Usa la variable del nuevo archivo JS
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
const ITEMS_PER_PAGE = 10;
let currentPage = 1;

// --- Router ---
window.addEventListener('hashchange', router);
window.addEventListener('load', router);

function router() {
  if (events.length === 0) return; // Espera a que cargue el JSON
  const hash = location.hash || '#/catalog';
  const [path] = hash.slice(2).split('?');

  if (path.startsWith('event/')) {
    const id = path.split('/')[1];
    renderEventDetail(id);
  } else if (path === 'cart') {
    renderCart();
  } else if (path === 'favorites') {
    renderFavorites();
  } else {
    renderCatalog();
  }
}

// --- Catálogo con paginación ---
function renderCatalog() {
  const container = document.getElementById('app');
  if (!container) return;
  container.innerHTML = '<div id="event-container"></div><div id="pagination"></div>';
  const grid = document.getElementById('event-container');

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageEvents = events.slice(start, end);

  if (pageEvents.length === 0) {
    grid.innerHTML = '<p>No hay eventos para mostrar.</p>';
    return;
  }

  grid.innerHTML = pageEvents.map(e => `
    <div class="event-card">
      <img src="${e.images[0]}" alt="Imagen de ${e.title}" style="width:100%;height:auto;">
      <h3>${e.title}</h3>
      <p>${e.city} - ${e.venue}</p>
      <p>${new Date(e.datetime).toLocaleString()}</p>
      <p>Desde ${e.priceFrom.toLocaleString('es-CO', { style: 'currency', currency: e.currency })}</p>
      <button onclick="location.hash='#/event/${e.id}'">Ver detalle</button>
      <button onclick="toggleFavorite('${e.id}')">${favorites.includes(e.id) ? 'Quitar Favorito' : 'Agregar Favorito'}</button>
    </div>
  `).join('');

  renderPagination();
}

function renderPagination() {
  const totalPages = Math.ceil(events.length / ITEMS_PER_PAGE);
  const pagination = document.getElementById('pagination');
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }
  let buttons = '';
  for (let i = 1; i <= totalPages; i++) {
    buttons += `<button onclick="goToPage(${i})" ${i === currentPage ? 'disabled' : ''}>${i}</button> `;
  }
  pagination.innerHTML = buttons;
}

function goToPage(page) {
  currentPage = page;
  renderCatalog();
}

// --- Detalle evento ---
function renderEventDetail(id) {
  const e = events.find(ev => ev.id === id);
  const container = document.getElementById('app');
  if (!e || !container) {
    container.innerHTML = '<p>Evento no encontrado.</p>';
    return;
  }
  container.innerHTML = `
    <h2>${e.title}</h2>
    <div class="gallery">
      ${e.images.map((img, i) => `<img src="${img}" alt="Imagen ${i + 1} de ${e.title}">`).join('')}
    </div>
    <p>${e.description}</p>
    <p>Artistas: ${e.artists.join(', ')}</p>
    <p>Venue: ${e.venue}, ${e.city}</p>
    <p>Fecha/Hora: ${new Date(e.datetime).toLocaleString()}</p>
    <p>Políticas: Edad ${e.policies.age}, Reembolso: ${e.policies.refund}</p>
    <p>Cupos disponibles: ${e.stock}</p>
    <label>Cantidad: <input type="number" id="cantidad" min="1" max="${e.stock}" value="1"></label>
    <button onclick="addToCart('${e.id}')">Agregar al carrito</button>
    <button onclick="toggleFavorite('${e.id}')">${favorites.includes(e.id) ? 'Quitar Favorito' : 'Agregar Favorito'}</button>
    <button onclick="copyURL('${e.id}')">Compartir</button>
    <a href="#/catalog">Volver</a>
  `;
}

// --- Carrito ---
function addToCart(id) {
  const e = events.find(ev => ev.id === id);
  const qtyInput = document.getElementById('cantidad');
  const qty = qtyInput ? parseInt(qtyInput.value) : 1;
  if (e.soldOut) {
    alert('Evento agotado');
    return;
  }
  if (qty < 1) {
    alert('Cantidad inválida');
    return;
  }
  if (qty > e.stock) {
    alert('No hay suficientes cupos');
    return;
  }
  const existing = cart.find(item => item.id === id);
  if (existing) {
    if (existing.cantidad + qty > e.stock) {
      alert('No hay suficientes cupos');
      return;
    }
    existing.cantidad += qty;
  } else {
    cart.push({ id: e.id, title: e.title, cantidad: qty, priceFrom: e.priceFrom, currency: e.currency });
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  alert('Añadido al carrito');
}

function renderCart() {
  const container = document.getElementById('app');
  if (!container) return;
  if (cart.length === 0) {
    container.innerHTML = '<h2>Carrito</h2><p>No hay productos en el carrito.</p>';
    return;
  }
  let total = 0;
  container.innerHTML = '<h2>Carrito</h2>' + cart.map(e => {
    const subtotal = e.priceFrom * e.cantidad;
    total += subtotal;
    return `
      <div class="cart-item">
        <h3>${e.title}</h3>
        <p>Cantidad: ${e.cantidad}</p>
        <p>Subtotal: ${subtotal.toLocaleString('es-CO', { style: 'currency', currency: e.currency })}</p>
      </div>
    `;
  }).join('') + `<h3>Total: ${total.toLocaleString('es-CO', { style: 'currency', currency: cart[0].currency })}</h3>
  <a href="#/catalog">Seguir comprando</a>`;
}

// --- Favoritos ---
function toggleFavorite(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(fav => fav !== id);
  } else {
    favorites.push(id);
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
  router();
}

function renderFavorites() {
  const container = document.getElementById('app');
  if (!container) return;
  if (favorites.length === 0) {
    container.innerHTML = '<h2>Favoritos</h2><p>No tienes eventos favoritos.</p>';
    return;
  }
  const favEvents = events.filter(e => favorites.includes(e.id));
  container.innerHTML = '<h2>Favoritos</h2>' + favEvents.map(e => `
    <div class="event-card">
      <img src="${e.images[0]}" alt="Imagen de ${e.title}" style="width:100%;height:auto;">
      <h3>${e.title}</h3>
      <p>${e.city} - ${e.venue}</p>
      <button onclick="location.hash='#/event/${e.id}'">Ver detalle</button>
      <button onclick="toggleFavorite('${e.id}')">Quitar Favorito</button>
    </div>
  `).join('') + `<a href="#/catalog">Volver</a>`;
}

// --- Compartir URL ---
function copyURL(id) {
  const url = `${location.origin}${location.pathname}#/event/${id}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url)
      .then(() => alert('URL copiada al portapapeles'))
      .catch(() => alert('No se pudo copiar la URL'));
  } else {
    alert('Tu navegador no soporta copiar al portapapeles');
  }
}