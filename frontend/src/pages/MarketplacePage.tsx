import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { useCart } from '../context/CartContext';

// ─── Mock data ────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  store: string;
  storeIcon: string;
  rating: number;
  reviews: number;
  badge?: string;
  color: string;
  icon: string;
}

const STORES = [
  { id: 'all',      name: 'Todas las tiendas' },
  { id: 'petplus',  name: 'PetPlus Vet' },
  { id: 'vetcare',  name: 'VeteCare Store' },
  { id: 'animalco', name: 'AnimalCo' },
  { id: 'drpets',   name: 'Dr. Pets' },
];

const CATEGORIES = [
  { id: 'all',        label: 'Todo',          icon: 'grid_view' },
  { id: 'food',       label: 'Alimentos',     icon: 'restaurant' },
  { id: 'toys',       label: 'Juguetes',      icon: 'sports_soccer' },
  { id: 'medicine',   label: 'Medicamentos',  icon: 'medication' },
  { id: 'hygiene',    label: 'Higiene',       icon: 'soap' },
  { id: 'accesories', label: 'Accesorios',    icon: 'style' },
];

const PRODUCTS: Product[] = [
  { id: '1',  name: 'Royal Canin Adulto 15kg',    price: 185000, originalPrice: 210000, category: 'food',       store: 'PetPlus Vet',    storeIcon: 'storefront', rating: 4.8, reviews: 312, badge: 'Más vendido', color: '#ede9fe', icon: 'restaurant' },
  { id: '2',  name: 'Hills Science Diet Puppy',   price: 95000,                          category: 'food',       store: 'VeteCare Store', storeIcon: 'storefront', rating: 4.7, reviews: 198, badge: '',            color: '#fef3c7', icon: 'restaurant' },
  { id: '3',  name: 'Kong Classic Mediano',       price: 38000,                          category: 'toys',       store: 'AnimalCo',       storeIcon: 'storefront', rating: 4.9, reviews: 540, badge: 'Top rated',   color: '#d1fae5', icon: 'sports_soccer' },
  { id: '4',  name: 'Antiparasitario NexGard L',  price: 62000,                          category: 'medicine',   store: 'Dr. Pets',       storeIcon: 'local_pharmacy', rating: 4.6, reviews: 87, badge: 'Receta no req.', color: '#fee2e2', icon: 'medication' },
  { id: '5',  name: 'Shampoo Veterinario 500ml',  price: 28000,                          category: 'hygiene',    store: 'VeteCare Store', storeIcon: 'storefront', rating: 4.5, reviews: 124, badge: '',            color: '#e0f2fe', icon: 'soap' },
  { id: '6',  name: 'Correa retráctil 5m',        price: 45000, originalPrice: 55000,    category: 'accesories', store: 'AnimalCo',       storeIcon: 'storefront', rating: 4.3, reviews: 76,  badge: 'Oferta',      color: '#f3e8ff', icon: 'style' },
  { id: '7',  name: 'Purina Pro Plan Senior',     price: 78000,                          category: 'food',       store: 'PetPlus Vet',    storeIcon: 'storefront', rating: 4.6, reviews: 231, badge: '',            color: '#fef3c7', icon: 'restaurant' },
  { id: '8',  name: 'Pelota interactiva LED',     price: 32000,                          category: 'toys',       store: 'VeteCare Store', storeIcon: 'storefront', rating: 4.4, reviews: 59,  badge: 'Nuevo',       color: '#d1fae5', icon: 'sports_soccer' },
  { id: '9',  name: 'Vitaminas Omega 3 + 6',      price: 42000,                          category: 'medicine',   store: 'Dr. Pets',       storeIcon: 'local_pharmacy', rating: 4.7, reviews: 145, badge: '',         color: '#fee2e2', icon: 'medication' },
  { id: '10', name: 'Cepillo dental canino',      price: 18000,                          category: 'hygiene',    store: 'AnimalCo',       storeIcon: 'storefront', rating: 4.2, reviews: 43,  badge: '',            color: '#e0f2fe', icon: 'soap' },
  { id: '11', name: 'Comedero automático 2L',     price: 89000, originalPrice: 115000,   category: 'accesories', store: 'PetPlus Vet',    storeIcon: 'storefront', rating: 4.5, reviews: 88,  badge: 'Oferta',      color: '#f3e8ff', icon: 'style' },
  { id: '12', name: 'Pipeta antipulgas Frontline', price: 35000,                         category: 'medicine',   store: 'VeteCare Store', storeIcon: 'local_pharmacy', rating: 4.8, reviews: 267, badge: 'Más vendido', color: '#fee2e2', icon: 'medication' },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="mp-stars">
      {[1,2,3,4,5].map(i => (
        <span key={i} className="material-symbols-rounded mp-star" style={{ fontVariationSettings: `'FILL' ${i <= Math.round(rating) ? 1 : 0}` }}>
          star
        </span>
      ))}
      <span className="mp-rating-num">{rating}</span>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export function MarketplacePage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeStore, setActiveStore]         = useState('all');
  const [search, setSearch]                   = useState('');
  const [addedId, setAddedId]                 = useState<string | null>(null);
  const { addItem, totalItems } = useCart();

  function addToCart(product: Product) {
    addItem({ id: product.id, name: product.name, price: product.price, store: product.store, icon: product.icon, color: product.color });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  }

  const filtered = PRODUCTS.filter(p => {
    const matchCat   = activeCategory === 'all' || p.category === activeCategory;
    const matchStore = activeStore === 'all'     || p.store === STORES.find(s => s.id === activeStore)?.name;
    const matchQ     = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.store.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchStore && matchQ;
  });

  return (
    <AppLayout title="Shop">
      {/* ── Header ── */}
      <div className="mp-header">
        <div className="mp-header__left">
          <h2 className="mp-header__title">Marketplace Veterinario</h2>
          <p className="mp-header__sub">Productos de las mejores clínicas y tiendas veterinarias</p>
        </div>
        <div className="mp-header__right">
          <div className="mp-search-wrap">
            <span className="material-symbols-rounded mp-search-icon">search</span>
            <input
              className="mp-search"
              type="search"
              placeholder="Buscar productos, tiendas…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Link to="/carrito" className="mp-cart-btn" style={{ textDecoration: 'none' }}>
            <span className="material-symbols-rounded">shopping_cart</span>
            {totalItems > 0 && <span className="mp-cart-badge">{totalItems}</span>}
          </Link>
        </div>
      </div>

      {/* ── Filtros de tienda ── */}
      <div className="mp-stores">
        {STORES.map(s => (
          <button
            key={s.id}
            type="button"
            className={`mp-store-chip ${activeStore === s.id ? 'mp-store-chip--active' : ''}`}
            onClick={() => setActiveStore(s.id)}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* ── Categorías ── */}
      <div className="mp-categories">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            type="button"
            className={`mp-cat-btn ${activeCategory === c.id ? 'mp-cat-btn--active' : ''}`}
            onClick={() => setActiveCategory(c.id)}
          >
            <span className="material-symbols-rounded">{c.icon}</span>
            {c.label}
          </button>
        ))}
      </div>

      {/* ── Resultados ── */}
      <p className="mp-count">{filtered.length} productos</p>

      {filtered.length === 0 ? (
        <div className="mp-empty">
          <span className="material-symbols-rounded mp-empty-icon">search_off</span>
          <p>No se encontraron productos</p>
        </div>
      ) : (
        <div className="mp-grid">
          {filtered.map(product => (
            <article key={product.id} className="mp-card">
              <div className="mp-card__img" style={{ background: product.color }}>
                <span className="material-symbols-rounded mp-card__img-icon">{product.icon}</span>
                {product.badge && (
                  <span className="mp-card__badge">{product.badge}</span>
                )}
              </div>

              <div className="mp-card__body">
                <div className="mp-card__store">
                  <span className="material-symbols-rounded" style={{ fontSize: '0.85rem' }}>
                    {product.storeIcon}
                  </span>
                  {product.store}
                </div>

                <h3 className="mp-card__name">{product.name}</h3>
                <Stars rating={product.rating} />
                <span className="mp-card__reviews">({product.reviews} reseñas)</span>

                <div className="mp-card__footer">
                  <div className="mp-card__pricing">
                    <span className="mp-card__price">
                      ${product.price.toLocaleString('es-CO')}
                    </span>
                    {product.originalPrice && (
                      <span className="mp-card__original">
                        ${product.originalPrice.toLocaleString('es-CO')}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className={`mp-add-btn ${addedId === product.id ? 'mp-add-btn--added' : ''}`}
                    onClick={() => addToCart(product)}
                  >
                    <span className="material-symbols-rounded">
                      {addedId === product.id ? 'check' : 'add_shopping_cart'}
                    </span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
