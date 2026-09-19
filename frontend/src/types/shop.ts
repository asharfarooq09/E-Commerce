export type Role = "CUSTOMER" | "ADMIN";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  _count?: { products: number };
};

export type HomeCategory = Category & {
  productCount: number;
  products: Product[];
};

export type HomeCatalog = {
  featured: Product[];
  categories: HomeCategory[];
};

export type ProductImage = {
  id: string;
  url: string;
  alt?: string | null;
  isPrimary: boolean;
  sortOrder: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  brand?: string | null;
  rating: number;
  reviewCount: number;
  featured: boolean;
  attributes?: Record<string, unknown> | null;
  category: Pick<Category, "id" | "name" | "slug">;
  images: ProductImage[];
  inventory?: { quantity: number } | null;
};

export type Review = {
  id: string;
  rating: number;
  title?: string | null;
  body: string;
  createdAt: string;
  user: Pick<User, "id" | "name">;
};

export type ProductDetail = Product & {
  reviews: Review[];
};

export type CartItem = {
  id: string;
  quantity: number;
  product: Product;
};

export type Cart = {
  id: string;
  items: CartItem[];
};

export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: string;
  shipping: string;
  total: string;
  shippingAddress: Record<string, string>;
  createdAt: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: string;
  }>;
};
