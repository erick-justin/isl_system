var UMEME_API_URL = "https://fxapi.invict.site/api/umeme";

document.addEventListener("DOMContentLoaded", async ()=>{
  const statusEl=document.getElementById("status");
  // --- Token modal (used by Re-Try Token) ---
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
  const el = document.getElementById("tokenStatus");
  el.innerHTML = msg ? `<div class="alert alert-success mb-0">${escapeHtml(msg)}</div>` : "";
  const modal = new bootstrap.Modal(document.getElementById("tokenModal"));
  modal.show();
}

const tableEl=document.getElementById("dataTable");
  const searchEl=document.getElementById("search");
  const reloadBtn=document.getElementById("reload");
  const kpiCount=document.getElementById("kpiCount");

  const columns=[
  { key:"registered", label:"Date" },
  { key:"meter_number", label:"Meter No" },
  { key:"amount", label:"Amount" },
  { key:"payment_status", label:"Payment", badge:true },
  { key:"token_status", label:"Token", badge:true },
  { key:"payment_phone", label:"Pay Phone" },
  { label:"Actions", render:(row)=>`
    <button class="btn btn-sm btn-outline-warning" data-action="retry_token" data-id="${row.transaction_id}">Re-Try Token</button>
  ` }
];
  const formatters = { registered:(v)=>fmtDate(v), amount:(v)=> (v==null? "" : Number(v).toLocaleString()) };
  let allRows=[];

  function renderNow(q=""){
    const filtered=filterRows(allRows,q);
    kpiCount.textContent = filtered.length.toLocaleString();
    renderTable({ tableEl, rows: filtered, columns, formatters, onRowClick:(r)=>openDetailsModal("Transaction", r) });
  }

  // Re-Try Token (code 110)
async function requestRetryToken(tx) {
  setStatus(statusEl, "info", "Re-trying token...");

  try {
    const res = await fetch(UMEME_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ api: 100, code: 110, data: { transaction_id: tx.transaction_id } }),
    });

    const data = await res.json().catch(() => null);
    if (!data) throw new Error("Invalid server response");

    if (data.code === 200) {
      const t = data.token || {};
      clearStatus(statusEl);
      showTokenModal({
        title: "Re-Try Token",
        msg: `Token generated for meter ${escapeHtml(t.meter_number || tx.meter_number)} (Amount: ${escapeHtml(String(t.amount ?? tx.amount ?? ""))}, Units: ${escapeHtml(String(t.units ?? ""))})`,
        token: t.token || "",
      });

      // Refresh transactions list in background (token_status may update)
      setTimeout(() => refresh(), 300);
      return;
    }

    if (data.code === 300) {
      setStatus(statusEl, "warning", data.msg || "Meter number has no token");
      return;
    }

    setStatus(statusEl, "danger", data.msg || `Request failed (code ${data.code})`);
  } catch (err) {
    setStatus(statusEl, "danger", err?.message || "Request failed");
  }
}

// action buttons (event delegation)
tableEl.querySelector("tbody").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;
  if (action !== "retry_token") return;

  const id = btn.dataset.id;
  const tx = allRows.find(t => String(t.transaction_id) === String(id));
  if (!tx) return;

  requestRetryToken(tx);
});

async function refresh(){
    setStatus(statusEl,"info","Loading...");
    try{
      allRows = await loadTransactions();
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
  refresh();
});