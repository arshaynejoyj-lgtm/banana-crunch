(function () {
  var CART_KEY = "bc_cart_items";
  var ORDERS_KEY = "bc_orders"; // new key for saving orders

  // --- Helpers ---
  function onReady(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  function loadCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(items) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items || []));
    } catch (e) { }
  }

  function saveOrder(order) {
    try {
      var raw = localStorage.getItem(ORDERS_KEY);
      var orders = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(orders)) orders = [];
      orders.push(order);
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    } catch (e) { }
  }

  function addItem(productId, name, price) {
    var items = loadCart();
    var found = items.find(function (i) {
      return i.id === productId;
    });
    if (found) {
      found.qty += 1;
    } else {
      items.push({ id: productId, name: name, price: Number(price), qty: 1 });
    }
    saveCart(items);
    updateCartCount();
    renderCartItems();
  }

  function updateQty(productId, delta) {
    var items = loadCart();
    var idx = items.findIndex(function (i) {
      return i.id === productId;
    });
    if (idx >= 0) {
      items[idx].qty += delta;
      if (items[idx].qty <= 0) items.splice(idx, 1);
      saveCart(items);
      updateCartCount();
      renderCartItems();
    }
  }

  function calcTotal(items) {
    return items.reduce(function (sum, i) {
      return sum + i.price * i.qty;
    }, 0);
  }

  function formatPHP(n) {
    return "₱" + Number(n).toFixed(2);
  }

  function updateCartCount() {
    var items = loadCart();
    var count = items.reduce(function (c, i) {
      return c + i.qty;
    }, 0);
    var el = document.querySelector(".cart-count");
    if (el) el.textContent = String(count);
  }

  function openDrawer() {
    var backdrop = document.getElementById("cartBackdrop");
    var drawer = document.getElementById("cartDrawer");
    if (backdrop) backdrop.classList.add("open");
    if (drawer) drawer.classList.add("open");
    renderCartItems();
  }

  function closeDrawer() {
    var backdrop = document.getElementById("cartBackdrop");
    var drawer = document.getElementById("cartDrawer");
    if (backdrop) backdrop.classList.remove("open");
    if (drawer) drawer.classList.remove("open");
  }

  function renderCartItems() {
    var container = document.getElementById("cartItems");
    var totalEl = document.getElementById("cartTotal");
    if (!container || !totalEl) return;
    var items = loadCart();
    container.innerHTML = items
      .map(function (i) {
        return (
          '<div class="cart-item">' +
          "<div>" +
          "<h4>" +
          i.name +
          "</h4>" +
          '<div class="meta">' +
          formatPHP(i.price) +
          " · x" +
          i.qty +
          "</div>" +
          "</div>" +
          '<div class="cart-qty">' +
          '<button data-cart-dec="' +
          i.id +
          '">-</button>' +
          '<button data-cart-inc="' +
          i.id +
          '">+</button>' +
          "</div>" +
          "</div>"
        );
      })
      .join("");
    totalEl.textContent = formatPHP(calcTotal(items));

    // Bind qty buttons
    Array.prototype.slice
      .call(document.querySelectorAll("[data-cart-inc]"))
      .forEach(function (btn) {
        btn.addEventListener("click", function () {
          updateQty(btn.getAttribute("data-cart-inc"), +1);
        });
      });
    Array.prototype.slice
      .call(document.querySelectorAll("[data-cart-dec]"))
      .forEach(function (btn) {
        btn.addEventListener("click", function () {
          updateQty(btn.getAttribute("data-cart-dec"), -1);
        });
      });
  }

  function generateTrackingNumber() {
    var rand = Math.floor(10000 + Math.random() * 90000);
    return (
      "BC-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + rand
    );
  }

  function checkout() {
    var items = loadCart();
    if (items.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    document.getElementById("checkoutModal").style.display = "block";
  }

  function closeCheckoutModal() {
    document.getElementById("checkoutModal").style.display = "none";
  }

  // --- Init ---
  onReady(function () {
    // Format product prices
    Array.prototype.slice
      .call(document.querySelectorAll(".product-card"))
      .forEach(function (card) {
        var priceEl = card.querySelector(".price");
        var btn = card.querySelector(".add-to-cart");
        if (!priceEl || !btn) return;
        var php = parseFloat(priceEl.textContent || "");
        if (!isNaN(php)) {
          priceEl.setAttribute("data-php", String(php));
          priceEl.textContent = formatPHP(php);
        }
        var btnPhp = parseFloat(btn.getAttribute("data-price"));
        if (isNaN(btnPhp) && !isNaN(php)) {
          btn.setAttribute("data-price", String(php));
        }
      });

    // Hook add-to-cart buttons
    Array.prototype.slice
      .call(document.querySelectorAll(".add-to-cart"))
      .forEach(function (btn) {
        btn.addEventListener("click", function () {
          var productId = btn.getAttribute("data-product");
          var price = btn.getAttribute("data-price");
          var card = btn.closest(".product-card");
          var name = card
            ? (card.querySelector("h3") || {}).textContent
            : productId;
          addItem(productId, name, price);
        });
      });

    // Hook cart icon
    var cartIcon = document.querySelector(".cart-icon");
    if (cartIcon) cartIcon.addEventListener("click", openDrawer);

    // Hook drawer close
    var closeBtn = document.getElementById("cartClose");
    var backdrop = document.getElementById("cartBackdrop");
    if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
    if (backdrop) backdrop.addEventListener("click", closeDrawer);

    var checkoutBtn = document.querySelector(".checkout");
    if (checkoutBtn) checkoutBtn.addEventListener("click", checkout);

    var closeModalBtn = document.getElementById("checkoutClose");
    if (closeModalBtn) closeModalBtn.addEventListener("click", closeCheckoutModal);
    window.addEventListener("click", function (e) {
      var modal = document.getElementById("checkoutModal");
      if (e.target === modal) closeCheckoutModal();
    });

    var checkoutForm = document.getElementById("checkoutForm");
    if (checkoutForm) {
      checkoutForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var payment = document.getElementById("paymentMethod").value;
        var address = document.getElementById("deliveryAddress").value.trim();

        if (!payment) {
          alert("Please select a payment method");
          return;
        }
        if (!address) {
          alert("Delivery address is required");
          return;
        }

        var trackingNumber = generateTrackingNumber();
        var items = loadCart();

        var currentUser = null;
        try {
          var rawUser = localStorage.getItem("bc_current_user");
          currentUser = rawUser ? JSON.parse(rawUser) : null;
        } catch (err) {
          currentUser = null;
        }

        var order = {
          trackingNumber: trackingNumber,
          payment: payment,
          address: address,
          items: items,
          total: calcTotal(items),
          status: "Processing",
          date: new Date().toLocaleString(),
          user: currentUser ? { name: currentUser.name, email: currentUser.email } : null,
        };
        saveOrder(order);

        saveCart([]);
        updateCartCount();
        renderCartItems();
        closeDrawer();

        var modalContent = document.querySelector(".checkout-modal-content");
        modalContent.innerHTML = `
          <span id="checkoutClose" class="checkout-close">&times;</span>
          <h3>✅ Checkout Successful!</h3>
          <p><strong>Payment Method:</strong> ${payment}</p>
          <p><strong>Delivery Address:</strong> ${address}</p>
          <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
          ${currentUser ? `<p><strong>Ordered By:</strong> ${currentUser.name} (${currentUser.email})</p>` : ""}
          <p class="note">⚠️ Please save this tracking number to track your order later.</p>
          <button id="closeSuccess" class="confirm-checkout">Close</button>
        `;

        document.getElementById("checkoutClose").addEventListener("click", closeCheckoutModal);
        document.getElementById("closeSuccess").addEventListener("click", closeCheckoutModal);
      });
    }

    updateCartCount();
  });
})();