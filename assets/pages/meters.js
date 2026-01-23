document.addEventListener("DOMContentLoaded", async ()=>{
  const statusEl=document.getElementById("status");
  const tableEl=document.getElementById("dataTable");
  const searchEl=document.getElementById("search");
  const reloadBtn=document.getElementById("reload");
  const kpiCount=document.getElementById("kpiCount");

  const columns=[
  { key:"meter_number", label:"Meter No" },
  { key:"customer_name", label:"Customer" },
  { key:"phone_number", label:"Phone" },
  { key:"address", label:"Address" },
  { key:"meter_type", label:"Type" },
  { key:"status", label:"Status", badge:true },
  { key:"registered", label:"Registered" },
  { label:"Actions", render:(row)=>`
    <div class="d-flex flex-wrap gap-2">
      <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${row.meter_id}">Edit</button>
      <button class="btn btn-sm btn-outline-danger" data-action="deactivate" data-id="${row.meter_id}">Deactivate</button>
      <button class="btn btn-sm btn-outline-warning" data-action="clear_tamper" data-id="${row.meter_id}">Clear Tamper</button>
      <button class="btn btn-sm btn-outline-success" data-action="clear_credit" data-id="${row.meter_id}">Clear Credit</button>
          <button class="btn btn-sm btn-outline-dark" data-action="vending_token" data-id="${row.meter_id}">Vending Token</button>
    </div>
  ` }
];
  const formatters = { registered:(v)=>fmtDate(v) };
  let allRows=[];

// --- Edit / Deactivate helpers ---
// NOTE: These endpoints are placeholders. Update them to match your backend if different.
const UMEME_API_URL = "https://fxapi.invict.site/api/umeme";

function ensureMeterEditModal() {
  if (document.getElementById("meterEditModal")) return;

  const html = `
  <div class="modal fade" id="meterEditModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Edit Meter</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div id="editStatus"></div>
          <form id="editForm" class="mt-3">
            <input type="hidden" id="edit_meter_id" />
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label">Customer Name</label>
                <input class="form-control" id="edit_customer_name" required />
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label">Phone Number</label>
                <input class="form-control" id="edit_phone_number" required />
              </div>
              <div class="col-12">
                <label class="form-label">Address</label>
                <input class="form-control" id="edit_address" required />
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label">Meter Type</label>
                <select class="form-select" id="edit_meter_type" required>
                  <option value="1">1 — Electricity</option>
                  <option value="2">2 — Water</option>
                </select>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label">Meter Number</label>
                <input class="form-control" id="edit_meter_number" required />
              </div>
            </div>
            <div class="d-flex justify-content-end gap-2 mt-4">
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary" id="saveEditBtn">Save changes</button>
            </div>
          </form>
          <div class="small text-muted mt-3">
            Edit uses <span class="text-mono">POST https://fxapi.invict.site/api/umeme</span> with <span class="text-mono">code=104</span>. Deactivate uses the same endpoint with <span class="text-mono">code=105</span>.</div>
        </div>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", html);
}

// --- Token modal (for clear tamper/credit responses) ---
function ensureTokenModal() {
  if (document.getElementById("tokenModal")) return;

  const html = `
  <div class="modal fade" id="tokenModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="tokenModalTitle">Token</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div id="tokenStatus" class="mb-3"></div>
          <div class="p-3 bg-light border rounded">
            <div class="small text-muted mb-1">Token</div>
            <div class="h4 mb-0 text-mono" id="tokenValue">—</div>
          </div>
          <div class="small text-muted mt-2" id="tokenHint">Use this token on the meter.</div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline-secondary" type="button" id="copyTokenBtn">Copy Token</button>
          <button class="btn btn-primary" data-bs-dismiss="modal" type="button">Close</button>
        </div>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", html);

  document.getElementById("copyTokenBtn").addEventListener("click", async () => {
    const val = document.getElementById("tokenValue").textContent || "";
    if (!val || val === "—") return;
    await navigator.clipboard.writeText(val);
    const btn = document.getElementById("copyTokenBtn");
    const old = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = old), 1200);
  });
}

function showTokenModal({ title, msg, token }) {
  ensureTokenModal();
  document.getElementById("tokenModalTitle").textContent = title || "Token";
  document.getElementById("tokenValue").textContent = token || "—";
  const statusEl = document.getElementById("tokenStatus");
  statusEl.innerHTML = msg ? `<div class="alert alert-success mb-0">${escapeHtml(msg)}</div>` : "";
  const modal = new bootstrap.Modal(document.getElementById("tokenModal"));
  modal.show();
}

// --- Vending Token (code 109) ---
function ensureVendingModal() {
  if (document.getElementById("vendingModal")) return;

  const html = `
  <div class="modal fade" id="vendingModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Vending Token</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div id="vendingStatus"></div>

          <div class="mb-3">
            <label class="form-label">Meter Number</label>
            <input class="form-control" id="vending_meter_number" disabled />
          </div>

          <div class="mb-3">
            <label class="form-label">Amount</label>
            <input class="form-control" id="vending_amount" type="number" min="1" step="1" placeholder="e.g. 3000" required />
            <div class="form-text">Enter the amount to vend.</div>
          </div>

          <button class="btn btn-dark w-100" id="vendingSubmitBtn">Request Token</button>
        </div>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", html);
}

function showVendingModal(meter) {
  ensureVendingModal();
  document.getElementById("vendingStatus").innerHTML = "";
  document.getElementById("vending_meter_number").value = meter.meter_number || "";
  document.getElementById("vending_amount").value = "";
  const modal = new bootstrap.Modal(document.getElementById("vendingModal"));
  modal.show();

  const btn = document.getElementById("vendingSubmitBtn");
  btn.onclick = async () => {
    const amountRaw = document.getElementById("vending_amount").value;
    const amount = Number(amountRaw);
    if (!amountRaw || !Number.isFinite(amount) || amount <= 0) {
      setStatus(document.getElementById("vendingStatus"), "warning", "Please enter a valid amount.");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Requesting...";
    setStatus(document.getElementById("vendingStatus"), "info", "Requesting vending token...");

    try {
      const res = await fetch(UMEME_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ api: 100, code: 109, data: { meter_number: meter.meter_number, amount } }),
      });

      const data = await res.json().catch(() => null);
      if (!data) throw new Error("Invalid server response");

      if (data.code === 200) {
        const t = data.token || {};
        modal.hide();

        showTokenModal({
          title: "Vending Token",
          msg: `Vending token generated for meter ${escapeHtml(t.meter_number || meter.meter_number)} (Amount: ${escapeHtml(String(t.amount ?? amount))}, Units: ${escapeHtml(String(t.units ?? ""))})`,
          token: t.token || "",
        });
        clearStatus(statusEl);
        return;
      }

      if (data.code === 300) {
        setStatus(document.getElementById("vendingStatus"), "warning", data.msg || "Meter number has no token");
      } else {
        setStatus(document.getElementById("vendingStatus"), "danger", data.msg || `Request failed (code ${data.code})`);
      }

    } catch (err) {
      setStatus(document.getElementById("vendingStatus"), "danger", err?.message || "Request failed");
    } finally {
      btn.disabled = false;
      btn.textContent = "Request Token";
    }
  };
}

async function requestToken({ code, meter }) {
  const actionName = code === 107 ? "Clear Tamper" : "Clear Credit";
  setStatus(statusEl, "info", `${actionName}: requesting token...`);

  try {
    const res = await fetch(UMEME_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ api: 100, code, data: { meter_number: meter.meter_number } }),
    });

    const data = await res.json().catch(() => null);
    if (!data) throw new Error("Invalid server response");

    if (data.code === 200) {
      clearStatus(statusEl);
      showTokenModal({
        title: `${actionName} Token`,
        msg: data.msg || `${actionName} token generated`,
        token: data.token || "",
      });
      return;
    }

    if (data.code === 300) {
      setStatus(statusEl, "warning", data.msg || `${actionName} failed`);
      return;
    }

    setStatus(statusEl, "danger", data.msg || `${actionName} failed (code ${data.code})`);
  } catch (err) {
    setStatus(statusEl, "danger", err?.message || `${actionName} failed`);
  }
}

function openEditModal(meter) {
  ensureMeterEditModal();
  document.getElementById("editStatus").innerHTML = "";
  document.getElementById("edit_meter_id").value = meter.meter_id || "";
  document.getElementById("edit_customer_name").value = meter.customer_name || "";
  document.getElementById("edit_phone_number").value = meter.phone_number || "";
  document.getElementById("edit_address").value = meter.address || "";
  document.getElementById("edit_meter_type").value = String(meter.meter_type ?? "1");
  document.getElementById("edit_meter_number").value = meter.meter_number || "";

  const modal = new bootstrap.Modal(document.getElementById("meterEditModal"));
  modal.show();

  const form = document.getElementById("editForm");
  const saveBtn = document.getElementById("saveEditBtn");

  form.onsubmit = async (e) => {
    e.preventDefault();
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    const payload = {
  api: 100,
  code: 104,
  data: {
    meter_id: document.getElementById("edit_meter_id").value.trim(),
    customer_name: document.getElementById("edit_customer_name").value.trim(),
    address: document.getElementById("edit_address").value.trim(),
    phone_number: document.getElementById("edit_phone_number").value.trim(),
    meter_type: Number(document.getElementById("edit_meter_type").value),
    meter_number: document.getElementById("edit_meter_number").value.trim(),
  }
};

    setStatus(document.getElementById("editStatus"), "info", "Updating meter...");
    try {
      const res = await fetch(UMEME_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!data) throw new Error("Invalid server response");

      if (data.code === 200) {
        setStatus(document.getElementById("editStatus"), "success", data.msg || "Meter updated successfully");
        // refresh list
        await refresh();
        setUpdatedTime();
        setTimeout(() => modal.hide(), 700);
      } else if (data.code === 300) {
        setStatus(document.getElementById("editStatus"), "warning", data.msg || "Update rejected");
      } else {
        setStatus(document.getElementById("editStatus"), "danger", data.msg || `Update failed (code ${data.code})`);
      }
    } catch (err) {
      setStatus(document.getElementById("editStatus"), "danger", err?.message || "Update failed");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save changes";
    }
  };
}

async function deactivateMeter(meter) {
        if (!confirm(`Deactivate meter ${meter.meter_number}?`)) return;

        // Optimistic UI: mark as deactivated immediately
        const previousStatus = meter.status;
        meter.status = "deactivated";
        renderNow(searchEl.value.trim().toLowerCase());
        setStatus(statusEl, "info", "Deactivating...");

        try {
          const res = await fetch(UMEME_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({ api: 100, code: 105, data: { meter_id: meter.meter_id } }),
          });
          const data = await res.json().catch(() => null);
          if (!data) throw new Error("Invalid server response");

          if (data.code === 200) {
            setStatus(statusEl, "success", data.msg || "Meter deactivated");

            // Background refresh (authoritative state)
            setTimeout(() => refresh(), 300);
            setUpdatedTime();
            setTimeout(() => clearStatus(statusEl), 1500);
          } else if (data.code === 300) {
            // Revert optimistic change
            meter.status = previousStatus;
            renderNow(searchEl.value.trim().toLowerCase());
            setStatus(statusEl, "warning", data.msg || "Deactivate rejected");
          } else {
            // Revert optimistic change
            meter.status = previousStatus;
            renderNow(searchEl.value.trim().toLowerCase());
            setStatus(statusEl, "danger", data.msg || `Deactivate failed (code ${data.code})`);
          }
        } catch (err) {
          // Revert optimistic change
          meter.status = previousStatus;
          renderNow(searchEl.value.trim().toLowerCase());
          setStatus(statusEl, "danger", err?.message || "Deactivate failed");
        }
      }

  function renderNow(q=""){
    const filtered=filterRows(allRows,q);
    kpiCount.textContent = filtered.length.toLocaleString();
    renderTable({ tableEl, rows: filtered, columns, formatters, onRowClick:(r)=>openDetailsModal("Meter", r) });
  }

  // action buttons (event delegation)
tableEl.querySelector("tbody").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  const meter = allRows.find(m => String(m.meter_id) === String(id));
  if (!meter) return;

  if (action === "edit") openEditModal(meter);
if (action === "deactivate") deactivateMeter(meter);
if (action === "clear_tamper") requestToken({ code: 107, meter });
if (action === "clear_credit") requestToken({ code: 108, meter });
          if (action === "vending_token") showVendingModal(meter);
});

async function refresh(){

    setStatus(statusEl,"info","Loading...");
    try{
      allRows = await loadMeters();
      renderNow(searchEl.value.trim().toLowerCase());
      setUpdatedTime();
      setStatus(statusEl,"success",`Loaded ${allRows.length} records.`);
      setTimeout(()=>clearStatus(statusEl),900);
    }catch(e){
      setStatus(statusEl,"danger",e.message);
    }
  }

  setupSearch({ inputEl:searchEl, onChange:(q)=>renderNow(q) });
  reloadBtn.addEventListener("click", refresh);

// If coming from register page, show message + refresh
const params = new URLSearchParams(window.location.search);
const shouldRefresh = params.get("refresh") === "1";
const msg = params.get("msg");

if (msg) {
  setStatus(statusEl, "success", decodeURIComponent(msg));
  // remove query params so it doesn't repeat on reload
  window.history.replaceState({}, document.title, "meters.html");
  setTimeout(() => clearStatus(statusEl), 1800);
}

// initial load
refresh();

// optional second refresh shortly after
if (shouldRefresh) {
  setTimeout(() => refresh(), 500);
}
});
