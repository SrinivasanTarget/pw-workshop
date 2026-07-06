import { test, expect } from './fixtures';
import { fetchProducts, readProducts } from '../src/api/products';

/**
 * The same App, a different surface - here we skip the browser and call the API
 * directly through the typed client. One model, UI or API: the principles don't
 * change, only the collaborator does. See the `test-craftsmanship` skill.
 */
test.describe('Products API', () => {
  test('returns a catalog of six products', async ({ app }) => {
    const response = await fetchProducts(app.request);

    expect(response.status()).toBe(200);
    expect(await readProducts(response)).toHaveLength(6);
  });
});
