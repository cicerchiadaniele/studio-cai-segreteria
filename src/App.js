import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle2, AlertCircle, Building2, Mail, Phone, Shield, Loader2, ChevronDown, Paperclip } from "lucide-react";

// Helpers
const cn = (...cls) => cls.filter(Boolean).join(" ");
const load = (k, fallback) => {
  try { const v = JSON.parse(localStorage.getItem(k) || ""); return v ?? fallback; } catch { return fallback; }
};

export default function CondoMessenger() {
  // Brand / theme / endpoint
  const [brandName] = useState(load("cm_brand", "Studio CAI"));
  const [logoUrl] = useState(load("cm_logo", "/logo.jpg"));
  const [primary] = useState(load("cm_primary", "#16a34a"));
  const [webhook] = useState(load("cm_webhook", "https://hook.eu1.make.com/b2z7y28x5nyinnq0i5h6o9l14166paf3"));

  // Form
  const [form, setForm] = useState({
    condominio: "",
    condomino: "",
    telefono: "",
    operatore: "",
    categoria: "Interventi di Manutenzione",
    subcategoria: "",
    messaggio: ""
  });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  React.useEffect(() => {
    if (!cooldown) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const cssVars = useMemo(() => ({ "--brand": primary }), [primary]);
  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const validate = () => {
    const errs = [];
    if (!form.condominio) errs.push("Indica il condominio");
    if (!form.nome) errs.push("Inserisci il tuo nome");
    
    if (!form.telefono) errs.push("Inserisci il tuo telefono");
    if (!form.categoria) errs.push("Seleziona una categoria");
    if (form.categoria === "Interventi di Manutenzione" && !form.subcategoria) errs.push("Seleziona una sottocategoria di manutenzione");
    if (form.categoria === "Invio Documenti" && !form.subcategoria) errs.push("Seleziona il tipo di documento");
    if (!form.messaggio || form.messaggio.trim().length < 3) errs.push("Messaggio troppo breve");
    
    return errs;
  };

  const submit = async () => {
    if (cooldown) return;
    const errs = validate();
    if (errs.length) {
      setResult({ ok: false, error: errs.join(" • ") });
      return;
    }
    setSending(true);
    setResult(null);
    const ticket = `CM-${new Date().toISOString().slice(0,10).replaceAll("-","")}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;

    try {
      const fd = new FormData();
      const payload = { ...form, ticket, timestamp: new Date().toISOString() };
      Object.entries(payload).forEach(([k, v]) => { if (k !== "file") fd.append(k, String(v)); });
      if (form.file) fd.append("file1", form.file, form.file.name); // single file
      const res = await fetch(webhook, { method: "POST", body: fd });
      if (!res.ok) throw new Error(`Errore invio: ${res.status}`);

      setResult({ ok: true, ticket });
      setCooldown(8);
      setForm((s) => ({ ...s, categoria: "", subcategoria: "", messaggio: "", file: null, consenso: s.consenso }));
    } catch (e) {
      setResult({ ok: false, error: e.message || "Invio non riuscito" });
    } finally {
      setSending(false);
    }
  };

  const categorie = ["Interventi di Manutenzione"];
  const subCategorieManut = [
    "Ascensore","Cancelli Elettrici","Disinfestazioni/Derattizzazioni","Edilizia","Elettricista","Fabbro","Giardinaggio","Idraulico","Impianto di Riscaldamento","Montascale"
  ];
  const subCategorieDoc = ["Documenti PDF","Foto","Autoletture dei contatori"];

  return (
    <div className="min-h-screen w-full bg-neutral-50 text-neutral-900" style={cssVars}>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[var(--brand)]/10 flex items-center justify-center">
            {logoUrl ? (<img src={logoUrl} alt="logo" className="w-full h-full object-contain"/>) : (<Building2 className="w-8 h-8" />)}
          </div>
          <div className="flex-1">
            <div className="font-semibold leading-5 text-lg">{brandName}</div>
            <div className="text-xs text-neutral-500">Sportello segnalazioni condominiali</div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <motion.div layout className="bg-white rounded-2xl shadow p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[var(--brand)]/10 flex items-center justify-center"><Shield className="w-4 h-4"/></div>
            <h2 className="font-semibold text-lg">Invia segnalazione</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextField label="Condominio" placeholder="Es. Via Roma 23" value={form.condominio} onChange={(v)=>update("condominio",v)} required />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Scala" placeholder="Es. A" value={form.scala} onChange={(v)=>update("scala",v)} />
              <TextField label="Interno" placeholder="Es. 12" value={form.interno} onChange={(v)=>update("interno",v)} />
            </div>
            <TextField label="Nome e Cognome" placeholder="Il tuo nome" value={form.nome} onChange={(v)=>update("nome",v)} required />
            <TextField label="Email" type="email" placeholder="nome@email.it" value={form.email} onChange={(v)=>update("email",v)} icon={<Mail className="w-4 h-4"/>} required />
            <TextField label="Telefono" placeholder="Es. 333 123 4567" value={form.telefono} onChange={(v)=>update("telefono",v)} icon={<Phone className="w-4 h-4"/>} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <SelectField label="Categoria" value={form.categoria} onChange={(v)=>update("categoria",v)} options={categorie} required />
            {form.categoria === "Interventi di Manutenzione" && (
              <SelectField label="Sottocategoria" value={form.subcategoria} onChange={(v)=>update("subcategoria",v)} options={subCategorieManut} required />
            )}
            {form.categoria === "Invio Documenti" && (
              <SelectField label="Tipo di Documento" value={form.subcategoria} onChange={(v)=>update("subcategoria",v)} options={subCategorieDoc} required />
            )}
          </div>

          {form.categoria === "Invio Documenti" && (
            <div className="mt-3">
              <label className="text-sm font-medium flex items-center gap-2"><Paperclip className="w-4 h-4"/>Carica un file (PDF o immagine)</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e)=>update("file", e.target.files[0])}
                className="mt-1 block w-full text-sm text-neutral-700 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--brand)]/10 file:text-[var(--brand)] hover:file:bg-[var(--brand)]/20"
              />
              {form.file && (
                <div className="mt-2 text-xs text-neutral-600">File selezionato: {form.file.name}</div>
              )}
            </div>
          )}

          <div className="mt-3">
            <label className="text-sm font-medium">Messaggio</label>
            <textarea
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)] min-h-[120px]"
              placeholder="Scrivi il messaggio..."
              value={form.messaggio}
              onChange={(e)=>update("messaggio", e.target.value)}
            />
          </div>

          <div className="mt-4 flex items-start gap-2">
            <input id="cons" type="checkbox" checked={form.consenso} onChange={(e)=>update("consenso", e.target.checked)} className="mt-1"/>
            <label htmlFor="cons" className="text-sm text-neutral-700">Ho letto e accetto l’<a className="underline" href="https://www.dropbox.com/scl/fi/pg39geu63s5o2gtq04oq5/INFORMATIVA-SUL-TRATTAMENTO-DEI-DATI-PERSONALI.pdf?rlkey=7zzihoi92roiiqkydn9frt1p9&dl=0" target="_blank" rel="noopener noreferrer">informativa privacy</a>.</label>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              disabled={sending || cooldown>0}
              onClick={submit}
              className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white", sending||cooldown?"bg-neutral-400":"bg-[var(--brand)] hover:opacity-90")}
            >
              {sending ? (<><Loader2 className="w-4 h-4 animate-spin"/> Invio…</>) : (<><Send className="w-4 h-4"/> Invia segnalazione</>)}
            </button>
            {cooldown>0 && <span className="text-xs text-neutral-500">Puoi inviare un’altra segnalazione tra {cooldown}s</span>}
          </div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className={cn("mt-4 rounded-xl border p-3 text-sm flex items-start gap-2", result.ok?"bg-green-50 border-green-200":"bg-red-50 border-red-200")}
              >
                {result.ok ? <CheckCircle2 className="w-4 h-4 mt-0.5"/> : <AlertCircle className="w-4 h-4 mt-0.5"/>}
                <div>
                  {result.ok ? (
                    <div>
                      <div className="font-medium">Segnalazione inviata correttamente.</div>
                      {result.ticket && <div className="text-xs text-neutral-600">Numero ticket: <span className="font-mono font-semibold">{result.ticket}</span></div>}
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium">Invio non riuscito</div>
                      <div className="text-xs text-neutral-600">{result.error}</div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

                  <footer className="max-w-4xl mx-auto px-4 pb-8 text-xs text-neutral-500 bg-red-100 border-t">
        <div className="flex items-center justify-between gap-3">
          <div>© 2025 Studio CAI – Versione Segreteria v1</div>
          <div className="text-right">Ultimo aggiornamento: 02/10/2025</div>
        </div>
      </footer>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, type = "text", icon, required }) {
  return (
    <div>
      <label className="text-sm font-medium flex items-center gap-2">{icon}{label}{required && <span className="text-red-600">*</span>}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options = [], required }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}{required && <span className="text-red-600">*</span>}</label>
      <div className="mt-1 relative">
        <select
          value={value}
          onChange={(e)=>onChange(e.target.value)}
          className="appearance-none w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)] bg-white"
          required={required}
        >
          <option value="">-- Seleziona --</option>
          {options.map((o)=> <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"/>
      </div>
    </div>
  );
}
