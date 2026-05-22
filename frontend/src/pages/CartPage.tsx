import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { useCart } from '../context/CartContext';

export function CartPage() {
  const { items, subtotal, removeItem, updateQty, clearCart } = useCart();
  const [ordered, setOrdered] = useState(false);

  const shipping = subtotal > 0 ? 8900 : 0;
  const total = subtotal + shipping;

  function handleCheckout() {
    clearCart();
    setOrdered(true);
  }

  if (ordered) {
    return (
      <AppLayout title="Shopping Cart">
        <div className="cart-success">
          <span className="material-symbols-rounded cart-success__icon">check_circle</span>
          <h2>Order placed!</h2>
          <p>Your order has been received. You'll get a confirmation shortly.</p>
          <div className="cart-success__actions">
            <Link to="/marketplace" className="btn-primary">Continue shopping</Link>
            <Link to="/panel/dueno" className="btn-outline">Go to my panel</Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Shopping Cart">
      <div className="cart-page">
        <div className="cart-header">
          <h2 className="cart-header__title">Your Shopping Cart</h2>
          <p className="cart-header__sub">
            Review your items before proceeding to checkout.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <span className="material-symbols-rounded cart-empty__icon">shopping_cart</span>
            <h3>Your cart is empty</h3>
            <p>Browse our marketplace and add products for your pet.</p>
            <Link to="/marketplace" className="btn-primary" style={{ marginTop: 8 }}>
              Go to Marketplace
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            {/* Items */}
            <div className="cart-items">
              {items.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item__img" style={{ background: item.color }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '1.8rem', color: 'var(--color-primary)', opacity: 0.6 }}>
                      {item.icon}
                    </span>
                  </div>

                  <div className="cart-item__info">
                    <p className="cart-item__store">{item.store}</p>
                    <h3 className="cart-item__name">{item.name}</h3>
                    <p className="cart-item__price">${item.price.toLocaleString('es-CO')}</p>
                  </div>

                  <div className="cart-item__controls">
                    <div className="cart-qty">
                      <button type="button" className="cart-qty__btn" onClick={() => updateQty(item.id, item.quantity - 1)}>
                        <span className="material-symbols-rounded">remove</span>
                      </button>
                      <span className="cart-qty__num">{item.quantity}</span>
                      <button type="button" className="cart-qty__btn" onClick={() => updateQty(item.id, item.quantity + 1)}>
                        <span className="material-symbols-rounded">add</span>
                      </button>
                    </div>
                    <button type="button" className="cart-remove" onClick={() => removeItem(item.id)}>
                      <span className="material-symbols-rounded">delete</span>
                      Remove
                    </button>
                  </div>

                  <div className="cart-item__total">
                    ${(item.price * item.quantity).toLocaleString('es-CO')}
                  </div>
                </div>
              ))}

              <Link to="/marketplace" className="cart-continue">
                <span className="material-symbols-rounded">arrow_back</span>
                Continue Shopping
              </Link>
            </div>

            {/* Order summary */}
            <div className="cart-summary">
              <h3 className="cart-summary__title">Order Summary</h3>

              <div className="cart-summary__rows">
                <div className="cart-summary__row">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString('es-CO')}</span>
                </div>
                <div className="cart-summary__row">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `$${shipping.toLocaleString('es-CO')}`}</span>
                </div>
                <div className="cart-summary__row cart-summary__row--total">
                  <span>Total</span>
                  <span>${total.toLocaleString('es-CO')}</span>
                </div>
              </div>

              <p className="cart-summary__note">
                <span className="material-symbols-rounded" style={{ fontSize: '0.9rem', verticalAlign: 'middle' }}>verified_user</span>
                {' '}Estimated Tax: Calculated at checkout
              </p>

              <button type="button" className="cart-checkout-btn" onClick={handleCheckout}>
                Proceed to Checkout
                <span className="material-symbols-rounded">arrow_forward</span>
              </button>

              {/* Recommended */}
              <div className="cart-recommended">
                <p className="cart-recommended__title">Recommended for your Pet</p>
                <p className="cart-recommended__sub">Based on your recent medical records</p>
                <Link to="/marketplace" className="btn-text" style={{ fontSize: '0.82rem' }}>
                  View All →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
