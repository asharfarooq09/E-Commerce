import { toast } from "sonner";

/**
 * Colors: success → green; error → theme indigo; info/warning → theme indigo.
 * Descriptions use a consistent one-line pattern so toast height stays uniform.
 */
function productLine(name: string | undefined, suffix: string, fallback: string) {
  return name ? `${name} — ${suffix}` : fallback;
}

export const shopToast = {
  addedToCart(productName?: string) {
    toast.success("Added to cart", {
      description: productLine(productName, "added to your cart", "Item added to your cart."),
    });
  },
  removedFromCart() {
    toast.success("Removed from cart", {
      description: "Your cart was updated.",
    });
  },

  addedToWishlist(productName?: string) {
    toast.success("Saved to wishlist", {
      description: productLine(productName, "saved to your wishlist", "Item saved to your wishlist."),
    });
  },
  removedFromWishlist() {
    toast.success("Removed from wishlist", {
      description: "Your wishlist was updated.",
    });
  },

  orderPlaced(orderNumber?: string) {
    toast.success("Order placed", {
      description: orderNumber ? `Order ${orderNumber} is confirmed.` : "Thank you for your purchase.",
    });
  },

  loggedIn() {
    toast.success("Welcome back", { description: "You are signed in." });
  },
  accountCreated() {
    toast.success("Account created", { description: "You can start shopping now." });
  },

  reviewSubmitted() {
    toast.success("Review submitted", { description: "Thanks for your feedback." });
  },
  saved(title = "Saved") {
    toast.success(title, { description: "Changes were saved successfully." });
  },

  success(title: string, description?: string) {
    toast.success(title, description ? { description } : undefined);
  },
  info(title: string, description?: string) {
    toast.info(title, description ? { description } : undefined);
  },
  warning(title: string, description?: string) {
    toast.warning(title, description ? { description } : undefined);
  },
  error(message: string, title = "Something went wrong") {
    toast.error(title, { description: message });
  },
};
