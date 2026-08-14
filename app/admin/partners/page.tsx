"use client"; import { useState, useEffect } from "react";
export default function AdminPartnersPage() {
  const [tab, setTab] = useState("partners"); const [data, setData] = useState<any>({partners:[],leads:[],kpis:{}});
  const [form, setForm] = useState({name:"",email:"",password:""});
  const load = async () => { const r = await fetch("/api/admin/partners").then(r=>r.json()); if (r.success) setData(r.data); };
  useEffect(() => { load(); }, []);
  const add = async (e) => { e.preventDefault(); await fetch("/api/admin/partners",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)}); setForm({name:"",email:"",password:""}); load(); };
  return (<div className="p-6 max-w-6xl mx-auto"><h1 className="text-2xl font-bold text-dark-navy mb-6">Partner Management</h1>
    <div className="flex gap-4 mb-8">
      <button onClick={()=>setTab("partners")} className={"px-6 py-2 rounded-xl font-bold text-sm "+(tab==="partners"?"bg-dark-navy text-white":"bg-gray-100 text-gray-600")}>Partners ({data.partners.length})</button>
      <button onClick={()=>setTab("leads")} className={"px-6 py-2 rounded-xl font-bold text-sm "+(tab==="leads"?"bg-dark-navy text-white":"bg-gray-100 text-gray-600")}>All Leads ({data.leads.length})</button>
    </div>
    {tab === "partners" && <div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border"><div className="text-xs text-gray-500 font-bold uppercase">Active</div><div className="text-2xl font-bold mt-1">{data.kpis.activePipeline||0}</div></div>
        <div className="bg-white p-4 rounded-xl border"><div className="text-xs text-gray-500 font-bold uppercase">Won</div><div className="text-2xl font-bold text-green-600 mt-1">{data.kpis.dealsWon||0}</div></div>
        <div className="bg-white p-4 rounded-xl border"><div className="text-xs text-gray-500 font-bold uppercase">Pipeline Value</div><div className="text-2xl font-bold mt-1">${(data.kpis.pipelineValue||0).toLocaleString()}</div></div>
        <div className="bg-white p-4 rounded-xl border"><div className="text-xs text-gray-500 font-bold uppercase">Partners</div><div className="text-2xl font-bold mt-1">{data.partners.length}</div></div>
      </div>
      <details className="mb-6 bg-slate-50 rounded-xl p-4"><summary className="font-bold text-sm cursor-pointer">+ Add Partner</summary>
      <form onSubmit={add} className="mt-4 grid grid-cols-3 gap-3">
        <input placeholder="Name *" className="p-2.5 rounded-lg border text-sm" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
        <input placeholder="Email *" className="p-2.5 rounded-lg border text-sm" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
        <input placeholder="Password *" className="p-2.5 rounded-lg border text-sm" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
        <button className="px-4 py-2.5 rounded-xl bg-[#A3E635] font-bold text-sm col-span-3">Add Partner</button>
      </form></details>
      <div className="bg-white rounded-xl border overflow-hidden"><table className="w-full text-sm"><thead><tr className="bg-gray-50"><th className="text-left p-3 text-xs font-bold text-gray-500">Name</th><th className="text-left p-3 text-xs font-bold text-gray-500">Email</th><th className="text-left p-3 text-xs font-bold text-gray-500">Created</th></tr></thead><tbody>{data.partners.map(p=><tr key={p.id} className="border-t"><td className="p-3 font-medium">{p.name}</td><td className="p-3 text-gray-500">{p.email}</td><td className="p-3 text-gray-500">{p.created_at}</td></tr>)}</tbody></table></div>
    </div>}
    {tab === "leads" && <div className="bg-white rounded-xl border overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50"><th className="text-left p-3 text-xs font-bold text-gray-500">Company</th><th className="text-left p-3 text-xs font-bold text-gray-500">Contact</th><th className="text-left p-3 text-xs font-bold text-gray-500">Stage</th><th className="text-left p-3 text-xs font-bold text-gray-500">Value</th><th className="text-left p-3 text-xs font-bold text-gray-500">Partner</th></tr></thead><tbody>{data.leads.map(l=><tr key={l.id} className="border-t"><td className="p-3">{l.company}</td><td className="p-3">{l.contact_name}</td><td className="p-3"><span className={"px-2 py-0.5 rounded-full text-xs font-bold "+(l.stage==="Closed Won"?"bg-green-100 text-green-700":l.stage==="Closed Lost"?"bg-red-100 text-red-700":"bg-blue-100 text-blue-700")}>{l.stage}</span></td><td className="p-3">${(l.expected_value_usd||0).toLocaleString()}</td><td className="p-3 text-gray-500">{l.partner_name||""}</td></tr>)}</tbody></table></div>}
  </div>);
}
