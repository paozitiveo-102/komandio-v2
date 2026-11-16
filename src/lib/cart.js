const KEY = 'paozitiveo_panier_v1';

export function readCart() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

export function writeCart(cart) {
  localStorage.setItem(KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event('pao-cart'));
}

export function setQty(productId, qty) {
  const cart = readCart();
  if (qty <= 0) delete cart[productId];
  else cart[productId] = qty;
  writeCart(cart);
  return cart;
}

export function clearCart() {
  writeCart({});
}

export function totalPao(cart) {
  return Object.values(cart || {}).reduce((sum, q) => sum + Number(q || 0), 0);
}