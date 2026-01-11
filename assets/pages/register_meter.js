document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "https://fxapi.invict.site/api/umeme";
  const statusEl = document.getElementById("status");
  const formEl = document.getElementById("meterForm");
  const btn = document.getElementById("submitBtn");

  function setBusy(isBusy) {
    btn.disabled = isBusy;
    btn.textContent = isBusy ? "Registering..." : "Register Meter";
  }

  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      api: 100,
      code: 103,
      data: {
        customer_name: document.getElementById("customer_name").value.trim(),
        address: document.getElementById("address").value.trim(),
        phone_number: document.getElementById("phone_number").value.trim(),
        meter_type: Number(document.getElementById("meter_type").value),
        meter_number: document.getElementById("meter_number").value.trim(),
      }
    };

    setBusy(true);
    setStatus(statusEl, "info", "Sending request...");

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!data) throw new Error("Invalid server response");

      if (data.code === 200) {
        setStatus(statusEl, "success", data.msg || "meter added successfully");
        const msg = encodeURIComponent(data.msg || "meter added successfully");
        setTimeout(() => {
          window.location.href = `meters.html?refresh=1&msg=${msg}`;
        }, 700);
        return;
      }

      if (data.code === 300) {
        setStatus(statusEl, "warning", data.msg || "duplicate meter");
        setBusy(false);
        return;
      }

      setStatus(statusEl, "danger", data.msg || `Request failed (code ${data.code})`);
      setBusy(false);

    } catch (err) {
      setStatus(statusEl, "danger", err?.message || "Request failed");
      setBusy(false);
    }
  });
});
