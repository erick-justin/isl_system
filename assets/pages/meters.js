document.addEventListener("DOMContentLoaded", async ()=>{
  const statusEl=document.getElementById("status");
  const tableEl=document.getElementById("dataTable");
  const searchEl=document.getElementById("search");
  const reloadBtn=document.getElementById("reload");
  const kpiCount=document.getElementById("kpiCount");

  const columns=[{ key:"meter_number", label:"Meter No" },
    { key:"customer_name", label:"Customer" },
    { key:"phone_number", label:"Phone" },
    { key:"address", label:"Address" },
    { key:"meter_type", label:"Type" },
    { key:"status", label:"Status", badge:true },
    { key:"registered", label:"Registered" },
    { key:"meter_id", label:"Meter ID", mono:true }];
  const formatters = { registered:(v)=>fmtDate(v) };
  let allRows=[];

  function renderNow(q=""){
    const filtered=filterRows(allRows,q);
    kpiCount.textContent = filtered.length.toLocaleString();
    renderTable({ tableEl, rows: filtered, columns, formatters, onRowClick:(r)=>openDetailsModal("Meter", r) });
  }

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
  refresh();
});