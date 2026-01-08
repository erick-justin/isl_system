document.addEventListener("DOMContentLoaded", async ()=>{
  const statusEl = document.getElementById("status");
  const searchEl = document.getElementById("globalSearch");
  const reloadBtn = document.getElementById("reloadAll");
  const tMeters = document.getElementById("tMeters");
  const tTx = document.getElementById("tTx");
  const tTokens = document.getElementById("tTokens");

  const metersCols = [{ key:"meter_number", label:"Meter" },{ key:"customer_name", label:"Customer" },{ key:"status", label:"Status", badge:true }];
  const txCols = [{ key:"meter_number", label:"Meter" },{ key:"amount", label:"Amount" },{ key:"payment_status", label:"Payment", badge:true }];
  const tokenCols = [{ key:"meter_number", label:"Meter" },{ key:"amount", label:"Amount" },{ key:"status", label:"Status", badge:true }];
  const fmt = { amount:(v)=>(v==null? "" : Number(v).toLocaleString()) };

  let meters=[], tx=[], tokens=[];
  function updateKpis(){
    document.getElementById("kpiMeters").textContent = meters.length.toLocaleString();
    document.getElementById("kpiMetersRegistered").textContent = countBy(meters,"status","registered").toLocaleString();
    document.getElementById("kpiTx").textContent = tx.length.toLocaleString();
    document.getElementById("kpiTxPending").textContent = countBy(tx,"payment_status","pending").toLocaleString();
    document.getElementById("kpiTxAmount").textContent = sumBy(tx,"amount").toLocaleString();
    document.getElementById("kpiTokens").textContent = tokens.length.toLocaleString();
    document.getElementById("kpiUnits").textContent = sumBy(tokens,"units").toLocaleString();
    document.getElementById("kpiTokenAmount").textContent = sumBy(tokens,"amount").toLocaleString();
  }
  function renderAll(q=""){
    renderTable({ tableEl:tMeters, rows:filterRows(meters,q).slice(0,10), columns:metersCols, onRowClick:(r)=>openDetailsModal("Meter",r) });
    renderTable({ tableEl:tTx, rows:filterRows(tx,q).slice(0,10), columns:txCols, formatters:fmt, onRowClick:(r)=>openDetailsModal("Transaction",r) });
    renderTable({ tableEl:tTokens, rows:filterRows(tokens,q).slice(0,10), columns:tokenCols, formatters:fmt, onRowClick:(r)=>openDetailsModal("Token",r) });
  }
  async function refresh(){
    setStatus(statusEl,"info","Loading dashboard data...");
    try{
      const [m,t,k] = await Promise.all([loadMeters(), loadTransactions(), loadTokens()]);
      meters=m; tx=t; tokens=k;
      updateKpis();
      renderAll(searchEl.value.trim().toLowerCase());
      setUpdatedTime();
      setStatus(statusEl,"success","Loaded successfully.");
      setTimeout(()=>clearStatus(statusEl),900);
    }catch(e){
      setStatus(statusEl,"danger",e.message);
    }
  }
  setupSearch({ inputEl:searchEl, onChange:(q)=>renderAll(q) });
  reloadBtn.addEventListener("click", refresh);
  refresh();
});