document.addEventListener("DOMContentLoaded", async ()=>{
  const statusEl=document.getElementById("status");
  const tableEl=document.getElementById("dataTable");
  const searchEl=document.getElementById("search");
  const reloadBtn=document.getElementById("reload");
  const kpiCount=document.getElementById("kpiCount");

  const columns=[{ key:"registered", label:"Date" },
    { key:"meter_number", label:"Meter No" },
    { key:"amount", label:"Amount" },
    { key:"units", label:"Units" },
    { key:"status", label:"Status", badge:true },
    { key:"token_number", label:"Token Number", mono:true },
    { key:"transaction_reference", label:"Transaction Ref", mono:true },
    { key:"token_id", label:"Token ID", mono:true }];
  const formatters = { registered:(v)=>fmtDate(v), amount:(v)=> (v==null? "" : Number(v).toLocaleString()), units:(v)=> (v==null? "" : Number(v).toLocaleString()) };
  let allRows=[];

  function renderNow(q=""){
    const filtered=filterRows(allRows,q);
    kpiCount.textContent = filtered.length.toLocaleString();
    renderTable({ tableEl, rows: filtered, columns, formatters, onRowClick:(r)=>openDetailsModal("Token", r) });
  }

  async function refresh(){
    setStatus(statusEl,"info","Loading...");
    try{
      allRows = await loadTokens();
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