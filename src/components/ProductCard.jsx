import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import CartContext from "../contexts/CartContext";
import ToastContext from "../contexts/ToastContext";

const ProductCard = ({ product }) => {
  const { addToCart, isProductAdded, markAsAdded } = useContext(CartContext);
  const { showToast } = useContext(ToastContext);

  const handleAddToCart = (e, id) => {
    e.preventDefault();
    markAsAdded(id);
    addToCart(product);
    showToast(`Added ${product.title} to cart`, "success");
  };

  const added = isProductAdded(product.id);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<i key={`full-${i}`} className="fas fa-star"></i>);
    }

    if (hasHalfStar) {
      stars.push(<i key="half" className="fas fa-star-half-alt"></i>);
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<i key={`empty-${i}`} className="far fa-star"></i>);
    }

    return stars;
  };

  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <div className="product-image-container">
        <img
          className="product-image"
          src={product.image}
          alt={product.title}
        />
      </div>
      <div className="product-info">
        <div className="product-category">{product.category}</div>
        <h3 className="product-title">{product.title}</h3>
        <div className="product-rating">
          <div className="stars">{renderStars(product.rating.rate)}</div>
          <span className="rating-count">({product.rating.count})</span>
        </div>
        <div className="product-price">${product.price.toFixed(2)}</div>
        <button
          className="add-to-cart-btn"
          onClick={(e) => handleAddToCart(e, product.id)}
          disabled={added}
        >
          <i className="fas fa-shopping-cart"></i>
          {added ? "Added" : "Add to Cart"}
        </button>
      </div>
    </Link>
  );
};

export default ProductCard;
