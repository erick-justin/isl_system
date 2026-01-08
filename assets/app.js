// assets/app.js
// Updated API base (HTTPS) to avoid mixed-content and reduce CORS issues
const API_BASE = "https://fxapi.invict.site/api";

async function apiGet(path) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${text || "Request failed"}`);
  }
  return res.json();
}

// Each API returns: { code: 200, meters/tokens/transactions: [...] }
async function loadMeters() {
  const data = await apiGet("/meters");
  if (data?.code !== 200) throw new Error(`Meters API returned code ${data?.code}`);
  return data.meters ?? [];
}
async function loadTokens() {
  const data = await apiGet("/tokens");
  if (data?.code !== 200) throw new Error(`Tokens API returned code ${data?.code}`);
  return data.tokens ?? [];
}
async function loadTransactions() {
  const data = await apiGet("/transactions");
  if (data?.code !== 200) throw new Error(`Transactions API returned code ${data?.code}`);
  return data.transactions ?? [];
}
