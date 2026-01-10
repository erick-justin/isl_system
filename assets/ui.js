function escapeHtml(str){return String(str??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
function setStatus(el,type,message){el.innerHTML=`<div class="alert alert-${type} mb-0" role="alert">${escapeHtml(message)}</div>`;}
function clearStatus(el){el.innerHTML="";}
function fmtDate(iso){if(!iso) return ""; const d=new Date(iso); if(Number.isNaN(d.getTime())) return iso; return d.toLocaleString();}
function badgeClass(value){const v=String(value||"").toLowerCase(); if(v.includes("pending")) return "warning"; if(v.includes("registered")||v.includes("success")||v.includes("received")) return "success"; if(v.includes("fail")||v.includes("error")) return "danger"; if(!v) return "secondary"; return "secondary";}
function renderTable({tableEl,rows,columns,formatters={},onRowClick}){
  const thead=tableEl.querySelector("thead"); 
  const tbody=tableEl.querySelector("tbody");
  thead.innerHTML=`<tr>${columns.map(c=>`<th>${escapeHtml(c.label)}</th>`).join("")}</tr>`;
  tbody.innerHTML=rows.map((row,idx)=>`<tr data-row-index="${idx}" style="${onRowClick?'cursor:pointer':''}">${
    columns.map(c=>{
      // custom renderer (returns HTML string)
      if(typeof c.render === "function"){
        const html = c.render(row);
        return `<td>${html ?? ""}</td>`;
      }
      let value=row?.[c.key];
      if(formatters[c.key]) value=formatters[c.key](value,row);
      if(c.badge){
        const cls=badgeClass(value);
        return `<td><span class="badge text-bg-${cls}">${escapeHtml(value)}</span></td>`;
      }
      const text=value??"";
      const mono=c.mono?"text-mono":"";
      return `<td class="text-truncate ${mono}" style="max-width:380px" title="${escapeHtml(text)}">${escapeHtml(text)}</td>`;
    }).join("")
  }</tr>`).join("");

  if(onRowClick){
    tbody.querySelectorAll("tr").forEach(tr=>tr.addEventListener("click", (e)=>{
      // if clicking an action button, don't open row modal
      if(e.target.closest("[data-action]")) return;
      const i=Number(tr.dataset.rowIndex);
      onRowClick(rows[i]);
    }));
  }
}
function filterRows(rows,q){if(!q) return rows; return rows.filter(r=>JSON.stringify(r).toLowerCase().includes(q));}
function setupSearch({inputEl,onChange}){inputEl.addEventListener("input",()=>onChange(inputEl.value.trim().toLowerCase()));}
function sumBy(rows,key){return rows.reduce((a,r)=>a+(Number(r?.[key])||0),0);}
function countBy(rows,key,valLower){return rows.filter(r=>String(r?.[key]??"").toLowerCase()===valLower).length;}
