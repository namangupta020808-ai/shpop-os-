import { useEffect, useMemo, useState } from "react";
import { Package, Plus, Search, ShoppingCart, Download, AlertTriangle, Boxes, ReceiptText } from "lucide-react";

type Product = {
  id: string; sku: string; name: string; category: string; brand: string;
  cost: number; price: number; qty: number; reorder: number;
};
type Sale = { id: string; date: string; productId: string; productName: string; qty: number; total: number; billNo: string };
const categories = ["Refrigerators", "Washing machines", "Air conditioners", "Televisions", "Fans", "Mixers and small appliances"];
const seed: Product[] = [
  { id: "p1", sku: "FR-001", name: "Double-door refrigerator", category: "Refrigerators", brand: "Demo Brand", cost: 22000, price: 25900, qty: 4, reorder: 2 },
  { id: "p2", sku: "WM-001", name: "Front-load washing machine", category: "Washing machines", brand: "Demo Brand", cost: 18000, price: 21900, qty: 3, reorder: 2 },
  { id: "p3", sku: "FN-001", name: "Ceiling fan", category: "Fans", brand: "Demo Brand", cost: 1400, price: 1890, qty: 8, reorder: 3 }
];
const money = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function App() {
  const [products, setProducts] = useState<Product[]>(() => JSON.parse(localStorage.getItem("shopos-products") || "null") || seed);
  const [sales, setSales] = useState<Sale[]>(() => JSON.parse(localStorage.getItem("shopos-sales") || "[]"));
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"inventory" | "sales">("inventory");
  const [showAdd, setShowAdd] = useState(false);
  const [showSale, setShowSale] = useState(false);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ sku: "", name: "", category: categories[0], brand: "", cost: "", price: "", qty: "", reorder: "2" });
  const [saleForm, setSaleForm] = useState({ productId: "", qty: "1" });

  useEffect(() => { localStorage.setItem("shopos-products", JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem("shopos-sales", JSON.stringify(sales)); }, [sales]);

  const filtered = useMemo(() => products.filter(p => `${p.sku} ${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(search.toLowerCase())), [products, search]);
  const totalUnits = products.reduce((a, p) => a + p.qty, 0);
  const stockValue = products.reduce((a, p) => a + p.qty * p.cost, 0);
  const lowStock = products.filter(p => p.qty <= p.reorder).length;

  function addProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!form.sku.trim() || !form.name.trim()) return;
    if (products.some(p => p.sku.toLowerCase() === form.sku.toLowerCase())) { setNotice("SKU already exists. Use a unique SKU."); return; }
    setProducts([...products, { id: crypto.randomUUID(), sku: form.sku.trim(), name: form.name.trim(), category: form.category, brand: form.brand.trim(), cost: Number(form.cost), price: Number(form.price), qty: Number(form.qty), reorder: Number(form.reorder) }]);
    setForm({ sku: "", name: "", category: categories[0], brand: "", cost: "", price: "", qty: "", reorder: "2" });
    setShowAdd(false); setNotice("Product added to this device.");
  }
  function recordSale(e: React.FormEvent) {
    e.preventDefault();
    const p = products.find(x => x.id === saleForm.productId);
    const qty = Number(saleForm.qty);
    if (!p || !Number.isInteger(qty) || qty < 1) return;
    if (qty > p.qty) { setNotice("Not enough available stock. Sale was not recorded."); return; }
    const billNo = `BOS-${new Date().getFullYear()}-${String(sales.length + 1).padStart(4, "0")}`;
    const sale: Sale = { id: crypto.randomUUID(), date: new Date().toISOString(), productId: p.id, productName: p.name, qty, total: qty * p.price, billNo };
    setProducts(products.map(x => x.id === p.id ? { ...x, qty: x.qty - qty } : x));
    setSales([sale, ...sales]); setShowSale(false); setSaleForm({ productId: "", qty: "1" });
    setNotice("Demo sale recorded locally. This is not a GST-compliant bill of supply.");
  }
  function exportExcelCsv() {
    const rows = [["SKU","Product","Category","Brand","Cost price","Selling price","Quantity","Reorder level"], ...products.map(p => [p.sku,p.name,p.category,p.brand,p.cost,p.price,p.qty,p.reorder])];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "shopos-inventory-export.csv"; a.click(); URL.revokeObjectURL(url);
  }

  return <main className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brandIcon"><Boxes size={22}/></div><div><b>ShopOS</b><small>HOME APPLIANCES</small></div></div>
      <div className="sideLabel">WORKSPACE</div>
      <button className={tab === "inventory" ? "nav active" : "nav"} onClick={() => setTab("inventory")}><Package size={18}/> Inventory</button>
      <button className={tab === "sales" ? "nav active" : "nav"} onClick={() => setTab("sales")}><ReceiptText size={18}/> Sales register</button>
      <div className="sideNote"><b>Prototype mode</b><p>Data is stored only in this browser on this device. Cloud sync and staff accounts are not connected.</p></div>
    </aside>
    <section className="content">
      <header><div><div className="eyebrow">SHOP MANAGEMENT / {tab === "inventory" ? "INVENTORY" : "SALES"}</div><h1>{tab === "inventory" ? "Inventory overview" : "Sales register"}</h1><p className="muted">A first working prototype for your appliance shop.</p></div><div className="headerActions"><button className="outline" onClick={exportExcelCsv}><Download size={16}/> Export CSV</button><button className="primary" onClick={() => tab === "inventory" ? setShowAdd(true) : setShowSale(true)}><Plus size={17}/>{tab === "inventory" ? "Add product" : "Record sale"}</button></div></header>
      {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice("")}>×</button></div>}
      {tab === "inventory" ? <>
        <div className="stats">
          <div className="stat"><span>Total products</span><strong>{products.length}</strong><small>Unique SKUs</small></div>
          <div className="stat"><span>Units in stock</span><strong>{totalUnits}</strong><small>Across all products</small></div>
          <div className="stat"><span>Stock value</span><strong>{money(stockValue)}</strong><small>At recorded cost price</small></div>
          <div className="stat warning"><span>Low-stock products</span><strong>{lowStock}</strong><small>At or below reorder level</small></div>
        </div>
        <div className="panel">
          <div className="panelHead"><div><h2>Product catalogue</h2><p>Search by SKU, product, brand or category.</p></div><div className="search"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search inventory"/></div></div>
          <div className="tableWrap"><table><thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>COST</th><th>SELLING PRICE</th><th>STOCK</th><th>STATUS</th></tr></thead><tbody>
            {filtered.map(p => <tr key={p.id}><td><b>{p.name}</b><small>{p.sku} · {p.brand || "No brand"}</small></td><td>{p.category}</td><td>{money(p.cost)}</td><td>{money(p.price)}</td><td><b>{p.qty}</b></td><td>{p.qty <= p.reorder ? <span className="pill low"><AlertTriangle size={12}/> Reorder</span> : <span className="pill good">In stock</span>}</td></tr>)}
            {filtered.length === 0 && <tr><td colSpan={6} className="empty">No products match your search.</td></tr>}
          </tbody></table></div>
        </div>
        <div className="gstNote"><ReceiptText size={18}/><div><b>Billing configuration: Composition Scheme</b><p>Production billing must generate a Bill of Supply with the prescribed composition declaration. This prototype does not generate customer bills or calculate GST.</p></div></div>
      </> : <div className="panel">
        <div className="panelHead"><div><h2>Recent sales</h2><p>Prototype sales recorded on this device.</p></div><button className="primary" onClick={() => setShowSale(true)}><ShoppingCart size={16}/> Record sale</button></div>
        <div className="tableWrap"><table><thead><tr><th>REFERENCE</th><th>DATE</th><th>PRODUCT</th><th>QTY</th><th>TOTAL</th></tr></thead><tbody>
          {sales.map(s => <tr key={s.id}><td><b>{s.billNo}</b></td><td>{new Date(s.date).toLocaleString("en-IN")}</td><td>{s.productName}</td><td>{s.qty}</td><td><b>{money(s.total)}</b></td></tr>)}
          {sales.length === 0 && <tr><td colSpan={5} className="empty">No demo sales yet.</td></tr>}
        </tbody></table></div>
      </div>}
      <footer>ShopOS prototype · Not yet connected to cloud, printer, WhatsApp or GST filing systems.</footer>
    </section>
    {showAdd && <div className="backdrop"><form className="modal" onSubmit={addProduct}><div className="modalHead"><h2>Add product</h2><button type="button" onClick={() => setShowAdd(false)}>×</button></div>
      <label>SKU / item code<input required value={form.sku} onChange={e => setForm({...form, sku:e.target.value})}/></label>
      <label>Product name<input required value={form.name} onChange={e => setForm({...form, name:e.target.value})}/></label>
      <label>Category<select value={form.category} onChange={e => setForm({...form, category:e.target.value})}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
      <label>Brand / model<input value={form.brand} onChange={e => setForm({...form, brand:e.target.value})}/></label>
      <div className="two"><label>Cost price (₹)<input type="number" min="0" required value={form.cost} onChange={e => setForm({...form, cost:e.target.value})}/></label><label>Selling price (₹)<input type="number" min="0" required value={form.price} onChange={e => setForm({...form, price:e.target.value})}/></label></div>
      <div className="two"><label>Opening stock<input type="number" min="0" step="1" required value={form.qty} onChange={e => setForm({...form, qty:e.target.value})}/></label><label>Reorder level<input type="number" min="0" step="1" value={form.reorder} onChange={e => setForm({...form, reorder:e.target.value})}/></label></div>
      <div className="modalActions"><button type="button" className="outline" onClick={() => setShowAdd(false)}>Cancel</button><button className="primary">Save product</button></div>
    </form></div>}
    {showSale && <div className="backdrop"><form className="modal" onSubmit={recordSale}><div className="modalHead"><h2>Record demo sale</h2><button type="button" onClick={() => setShowSale(false)}>×</button></div>
      <label>Product<select required value={saleForm.productId} onChange={e => setSaleForm({...saleForm, productId:e.target.value})}><option value="">Choose product</option>{products.filter(p => p.qty > 0).map(p => <option key={p.id} value={p.id}>{p.name} — {p.qty} available</option>)}</select></label>
      <label>Quantity<input type="number" min="1" step="1" required value={saleForm.qty} onChange={e => setSaleForm({...saleForm, qty:e.target.value})}/></label>
      <p className="formWarning">This records a local stock deduction only. It does not issue a Bill of Supply.</p>
      <div className="modalActions"><button type="button" className="outline" onClick={() => setShowSale(false)}>Cancel</button><button className="primary">Record sale</button></div>
    </form></div>}
  </main>;
}