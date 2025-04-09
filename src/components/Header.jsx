
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';
import CartContext from '../contexts/CartContext';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const { cartCount } = useContext(CartContext);

  return (
    <header className="header">
      <div className="container header-content">
        <Link to="/" className="logo">ShopReact</Link>
        
        {user && (
          <nav className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/cart" className="nav-link cart-icon">
              <i className="fas fa-shopping-cart"></i>
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </Link>
            <div className="user-menu">
              <button onClick={logout} className="nav-link">
                <i className="fas fa-sign-out-alt"></i> Logout
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
