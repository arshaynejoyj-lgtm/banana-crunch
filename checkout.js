/* checkout.js
    Attach to a page that has elements with IDs used below:
    - cartDrawer, cartBackdrop, cartClose
    - checkoutModal, checkoutClose, checkoutForm, checkoutSuccess
    - cartItems, cartTotal
*/

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
         // cache DOM (may be null if elements not present)
         const cartDrawer = document.getElementById('cartDrawer');
         const cartBackdrop = document.getElementById('cartBackdrop');
         const cartClose = document.getElementById('cartClose');
         const checkoutModal = document.getElementById('checkoutModal');
         const checkoutClose = document.getElementById('checkoutClose');
         const checkoutForm = document.getElementById('checkoutForm');
         const checkoutSuccess = document.getElementById('checkoutSuccess');
         const cartItemsEl = document.getElementById('cartItems');
         const cartTotalEl = document.getElementById('cartTotal');

         // Open checkout modal when any element with .checkout is clicked (delegated)
         document.addEventListener('click', (e) => {
                if (e.target.matches && e.target.matches('.checkout')) {
                    if (checkoutModal) checkoutModal.style.display = 'block';
                }
         });

         // close handlers
         cartClose?.addEventListener('click', () => { cartDrawer?.classList.remove('open'); });
         cartBackdrop?.addEventListener('click', () => { cartDrawer?.classList.remove('open'); });
         checkoutClose?.addEventListener('click', () => { if (checkoutModal) checkoutModal.style.display = 'none'; });

         // read cart state from DOM; adapt selectors to your markup
         function readCartFromDOM() {
                if (!cartItemsEl) return { items: [], total: 0 };
                const items = Array.from(cartItemsEl.querySelectorAll('.cart-item')).map(el => {
                    const id = el.dataset.id ?? '';
                    const name = el.querySelector('.name')?.textContent?.trim() ?? '';
                    const price = parseFloat(el.dataset.price ?? '0') || 0;
                    const quantity = parseInt(el.querySelector('.quantity')?.value ?? '1', 10) || 1;
                    return { id, name, price, quantity };
                });
                const total = items.reduce((s, it) => s + it.price * it.quantity, 0);
                return { items, total };
         }

         // format currency (Philippine peso example)
         function formatCurrency(n) {
                return '₱' + Number(n || 0).toFixed(2);
         }

         // clear cart UI and optionally localStorage
         function clearCartUI() {
                if (cartItemsEl) cartItemsEl.innerHTML = '';
                if (cartTotalEl) cartTotalEl.textContent = formatCurrency(0);
                // localStorage.removeItem('cart'); // uncomment if using localStorage
         }

         // mock submit to server — replace with real fetch POST to your API
         async function submitOrder(payload) {
                return new Promise((resolve) => {
                    setTimeout(() => {
                         resolve({ ok: true, orderId: 'ORD' + Date.now() });
                    }, 900);
                });
         }

         // handle checkout submit
         checkoutForm?.addEventListener('submit', async (ev) => {
                ev.preventDefault();

                const paymentMethodEl = document.getElementById('paymentMethod');
                const deliveryAddressEl = document.getElementById('deliveryAddress');

                const paymentMethod = paymentMethodEl?.value ?? '';
                const deliveryAddress = (deliveryAddressEl?.value ?? '').trim();

                if (!paymentMethod || !deliveryAddress) {
                    alert('Please select a payment method and enter a delivery address.');
                    return;
                }

                const cart = readCartFromDOM();
                if (!cart.items.length) {
                    alert('Cart is empty.');
                    return;
                }

                const submitBtn = checkoutForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Processing...';
                }

                const payload = {
                    items: cart.items,
                    total: cart.total,
                    paymentMethod,
                    deliveryAddress,
                    createdAt: new Date().toISOString()
                };

                try {
                    // Replace with real fetch call:
                    const res = await fetch('/api/checkout.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    }).then(r => r.json());

                    if (res && res.ok) {
                         if (checkoutSuccess) {
                                checkoutSuccess.style.display = 'block';
                                checkoutSuccess.textContent = 'Checkout successful! Order ID: ' + (res.orderId || '');
                         }
                         clearCartUI();
                         // close modal after short delay
                         setTimeout(() => {
                                if (checkoutModal) checkoutModal.style.display = 'none';
                                if (checkoutSuccess) checkoutSuccess.style.display = 'none';
                         }, 1500);
                    } else {
                         throw new Error('Checkout failed');
                    }
                } catch (err) {
                    // eslint-disable-next-line no-console
                    console.error(err);
                    alert('Checkout failed. Please try again.');
                } finally {
                    if (submitBtn) {
                         submitBtn.disabled = false;
                         submitBtn.textContent = 'Confirm Checkout';
                    }
                }
         });
    });
})();