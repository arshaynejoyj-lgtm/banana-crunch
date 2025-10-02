(function () {
  var ORDERS_KEY = "bc_orders";

  function loadOrders() {
    try {
      var raw = localStorage.getItem(ORDERS_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function trackOrder() {
    var input = document.getElementById("trackingNumber");
    var results = document.getElementById("trackingResults");
    if (!input || !results) return;

    var tracking = input.value.trim();
    if (!tracking) {
      results.textContent = "❌ Please enter a tracking number.";
      return;
    }

    var orders = loadOrders();
    var found = orders.find(function (o) {
      return o.trackingNumber === tracking;
    });

    if (found) {
      results.innerHTML = `
        <h4>📦 Order Found</h4>
        <p><b>Tracking Number:</b> ${found.trackingNumber}</p>
        <p><b>Status:</b> ${found.status}</p>
        <p><b>Payment:</b> ${found.payment}</p>
        <p><b>Address:</b> ${found.address}</p>
        <p><b>Date:</b> ${found.date}</p>
        <p><b>Total:</b> ₱${Number(found.total).toFixed(2)}</p>
        ${
          found.user
            ? `<p><b>Ordered By:</b> ${found.user.name} (${found.user.email})</p>`
            : ""
        }
      `;
    } else {
      results.textContent = "❌ No order found with this tracking number.";
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var trackBtn = document.querySelector("#tracking .tracking-form button");
    if (trackBtn) trackBtn.addEventListener("click", trackOrder);
  });
})();