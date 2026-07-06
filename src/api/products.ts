import { type APIRequestContext, type APIResponse } from '@playwright/test';

/** The shape of a product as returned by GET /api/products. */
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

/**
 * Typed client for the products endpoint - the single place that knows the route
 * and the response shape. Functions take the narrow `APIRequestContext` (not the
 * whole App), so they depend on exactly what they use.
 */
export function fetchProducts(request: APIRequestContext): Promise<APIResponse> {
  return request.get('/api/products');
}

export async function readProducts(response: APIResponse): Promise<Product[]> {
  const body = (await response.json()) as { products: Product[] };
  return body.products;
}
