import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CartContext from "../contexts/CartContext";
import ToastContext from "../contexts/ToastContext";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, isProductAdded, markAsAdded } = useContext(CartContext);

  const { showToast } = useContext(ToastContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`https://fakestoreapi.com/products/${id}`);
        if (!response.ok) {
          throw new Error("Product not found");
        }
        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error("Error fetching product:", error);
        setError("Product not found or failed to load.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    markAsAdded(product.id);
    addToCart(product);
    showToast(`Added ${product.title} to cart`, "success");
    setIsAdded(true);
  };

  const renderStars = (rating) => {
    if (!rating) return null;

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

  if (loading) {
    return (
      <div className="container">
        <div>Loading product details...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container">
        <div>{error || "Product not found"}</div>
        <button onClick={() => navigate("/")} className="product-detail-btn">
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="container product-detail-container">
      <div className="product-detail">
        <div className="product-detail-image">
          <img src={product.image} alt={product.title} />
        </div>

        <div className="product-detail-info">
          <div className="product-detail-category">{product.category}</div>
          <h1 className="product-detail-title">{product.title}</h1>

          <div className="product-detail-price">
            ${product.price.toFixed(2)}
          </div>

          <div className="product-detail-rating">
            <div className="stars">{renderStars(product.rating.rate)}</div>
            <span className="rating-count">
              ({product.rating.count} reviews)
            </span>
          </div>

          <p className="product-detail-description">{product.description}</p>

          <button
            className="product-detail-btn"
            onClick={handleAddToCart}
            disabled={isProductAdded(product.id)}
          >
            <i className="fas fa-shopping-cart"></i>{" "}
            {isProductAdded(product.id) ? "Added" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
