import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import CartContext from "../contexts/CartContext";
import ToastContext from "../contexts/ToastContext";
import { Check } from "lucide-react";

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart, getCartTotal } =
    useContext(CartContext);
  const { showToast } = useContext(ToastContext);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const handleCheckout = () => {
    clearCart();
    setOrderPlaced(true);
    showToast("Order placed successfully!", "success", 4000);
  };

  if (cartItems.length === 0) {
    return (
      <div className="container cart-container">
        <div className="cart-header">
          <Link to="/" className="continue-shopping">
            <i className="fas fa-arrow-left"></i> Continue Shopping
          </Link>
        </div>

        <h1 className="cart-title">Your Shopping Cart</h1>

        {orderPlaced && (
          <div className="cart-success-message">
            <div className="success-icon">
              <Check className="check-icon" />
            </div>
            <h2>Order placed successfully!</h2>
            <p>Thank you for your purchase.</p>
          </div>
        )}

        <div className="cart-empty">
          <div className="empty-cart-icon">
            <i className="fas fa-shopping-cart"></i>
          </div>
          <h2 className="empty-cart-title">Your cart is empty</h2>
          <p className="empty-cart-message">
            Looks like you haven't added anything to your cart yet.
          </p>
          <Link to="/" className="start-shopping-btn">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container cart-container">
      <div className="cart-header">
        <Link to="/" className="continue-shopping">
          <i className="fas fa-arrow-left"></i> Continue Shopping
        </Link>
      </div>

      <h1 className="cart-title">Your Shopping Cart</h1>

      <div className="cart-content">
        <div className="cart-items-container">
          <div className="cart-items-header">
            <h2>Cart Items ({cartItems.length})</h2>
          </div>

          <div className="cart-items-list">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item-card">
                <div className="cart-item-image">
                  <img src={item.image} alt={item.title} />
                </div>

                <div className="cart-item-details">
                  <h3 className="cart-item-title">{item.title}</h3>
                  <p className="cart-item-price">${item.price.toFixed(2)}</p>

                  <div className="cart-item-actions">
                    <div className="quantity-controls">
                      <button
                        className="quantity-btn minus"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                      >
                        −
                      </button>
                      <input
                        type="text"
                        className="quantity-input"
                        value={item.quantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value)) {
                            updateQuantity(item.id, value);
                          }
                        }}
                        min="1"
                      />
                      <button
                        className="quantity-btn plus"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>

                    <button
                      className="remove-btn"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>

                <div className="cart-item-subtotal">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="order-summary">
          <h2 className="summary-title">Order Summary</h2>

          <div className="summary-details">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${getCartTotal().toFixed(2)}</span>
            </div>

            <div className="summary-row">
              <span>Shipping</span>
              <span className="shipping-free">Free</span>
            </div>

            <div className="summary-row total">
              <span>Total</span>
              <span>${getCartTotal().toFixed(2)}</span>
            </div>
          </div>

          <button className="checkout-btn" onClick={handleCheckout}>
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
