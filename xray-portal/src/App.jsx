import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import "./App.css";

const DEFAULT_CONFIG = {
  proxyUrl:    "https://lucina-inharmonious-rosella.ngrok-free.dev",
  jiraDomain:  "shellyusa.atlassian.net",
  cloudId:     "a45ac4b7-7db8-40a7-a5c6-1713fcbd8751",
  projectKey:  "QAT",
  templateKey: "QAT-118",
};

const SHELLY_LOGO   = "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/shelly.png";
const STORAGE_CREDS = "iot_studio_creds";
const STORAGE_CFG   = "iot_studio_config";
const STORAGE_CATS  = "iot_studio_categories";

// Transition IDs from "Open" state (confirmed via Jira API)
const STATUS_TRANSITION = {
  passed:         "2",
  failed:         "3",
  skipped:        "4",
  not_applicable: "5",
  passed_remarks: "23",
  fixed:          "24",
};

const TEST_STATUSES = [
  { value: "not_applicable",  label: "Not Applicable",    color: "#6b7280", bg: "#f3f4f6", border: "#d1d5db" },
  { value: "failed",          label: "Failed",            color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  { value: "fixed",           label: "Fixed",             color: "#0891b2", bg: "#f0f9ff", border: "#bae6fd" },
  { value: "passed_remarks",  label: "Passed w/ Remarks", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  { value: "skipped",         label: "Skipped",           color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  { value: "passed",          label: "Passed",            color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
];

const CONCLUSIONS = [
  { value: "passed",         label: "✅ QA PASSED" },
  { value: "passed_remarks", label: "✅ QA PASSED with remarks" },
  { value: "failed",         label: "❌ QA FAILED" },
  { value: "in_progress",   label: "🔄 In Progress" },
];

const ALL_TESTS = [
  { key:"QAT-120", summary:"Self-test",                                                     feature:"General" },
  { key:"QAT-121", summary:"Device broadcasts AP",                                          feature:"General" },
  { key:"QAT-123", summary:"Wi-Fi reconnects automatically after reboot",                   feature:"Wi-Fi" },
  { key:"QAT-124", summary:"[Bluetooth] Pair with Blu device",                              feature:"Bluetooth" },
  { key:"QAT-125", summary:"[Matter] can be enabled/disabled",                              feature:"Matter" },
  { key:"QAT-126", summary:"[Matter] Device pairs",                                         feature:"Matter" },
  { key:"QAT-127", summary:"[Matter] Toggle ON/OFF via Matter interface",                   feature:"Matter" },
  { key:"QAT-128", summary:"[Matter] Status update is synchronized",                        feature:"Matter" },
  { key:"QAT-129", summary:"[ZigBee] can be enabled/disabled",                              feature:"ZigBee" },
  { key:"QAT-130", summary:"[ZigBee] Device still connects to AP when ZigBee disabled",     feature:"ZigBee" },
  { key:"QAT-131", summary:"[ZigBee] Device pairs",                                         feature:"ZigBee" },
  { key:"QAT-132", summary:"[ZigBee] Wi-Fi works along with ZigBee connected",              feature:"ZigBee" },
  { key:"QAT-133", summary:"[ZigBee] Toggle ON/OFF via ZigBee",                             feature:"ZigBee" },
  { key:"QAT-134", summary:"[ZigBee] Status update is synchronized",                        feature:"ZigBee" },
  { key:"QAT-135", summary:"[Ethernet] Reconnects automatically after reboot",              feature:"Ethernet" },
  { key:"QAT-136", summary:"Web UI loads",                                                  feature:"Web UI" },
  { key:"QAT-137", summary:"Device name is correct in web UI",                              feature:"Web UI" },
  { key:"QAT-138", summary:"Execute simple webhook",                                        feature:"Web UI" },
  { key:"QAT-139", summary:"Factory reset works",                                           feature:"General" },
  { key:"QAT-140", summary:"Cloud connection is successful",                                feature:"General" },
  { key:"QAT-141", summary:"Verify all fields in shelly.getdeviceinfo",                     feature:"General" },
  { key:"QAT-142", summary:"[Outputs] ON/OFF via Web UI",                                   feature:"Outputs" },
  { key:"QAT-143", summary:"[Outputs] ON/OFF via associated Input",                         feature:"Outputs" },
  { key:"QAT-144", summary:"[Inputs] Button Mode - Single Push",                            feature:"Inputs" },
  { key:"QAT-145", summary:"[Inputs] Button Mode - Double Push",                            feature:"Inputs" },
  { key:"QAT-146", summary:"[Inputs] Button Mode - Triple Push",                            feature:"Inputs" },
  { key:"QAT-147", summary:"[Inputs] Button Mode - Long Push",                              feature:"Inputs" },
  { key:"QAT-148", summary:"[Inputs] Switch Mode - ON/OFF",                                 feature:"Inputs" },
  { key:"QAT-149", summary:"[Power Metering] Voltage, Current, Power readings present",     feature:"Power Metering" },
  { key:"QAT-150", summary:"[Power Metering] Values within expected accuracy range",        feature:"Power Metering" },
  { key:"QAT-151", summary:"[Light/RGB/CCT] Smooth dimming across 0-100%",                  feature:"Light / RGB" },
  { key:"QAT-152", summary:"[Light/RGB/CCT] No flicker or steps",                          feature:"Light / RGB" },
  { key:"QAT-153", summary:"[Light/RGB/CCT] No audible noise",                             feature:"Light / RGB" },
  { key:"QAT-154", summary:"[Light/RGB/CCT] Single input dimming works",                    feature:"Light / RGB" },
  { key:"QAT-155", summary:"[Light/RGB/CCT] Dual input dimming works",                     feature:"Light / RGB" },
  { key:"QAT-156", summary:"[Light/RGB/CCT] Calibration is successful",                     feature:"Light / RGB" },
  { key:"QAT-157", summary:"[Cover] Calibration is successful",                             feature:"Cover Devices" },
  { key:"QAT-158", summary:"[Cover] Go to specific position works",                         feature:"Cover Devices" },
  { key:"QAT-159", summary:"[Cover] Control from inputs work",                              feature:"Cover Devices" },
  { key:"QAT-160", summary:"[Energy] Voltage, Current, Power, Frequency readings present",  feature:"Energy Metering" },
  { key:"QAT-161", summary:"[Energy] Values within expected accuracy range",                feature:"Energy Metering" },
  { key:"QAT-162", summary:"[Energy] Data is stored",                                       feature:"Energy Metering" },
  { key:"QAT-163", summary:"[Energy] Change profiles",                                      feature:"Energy Metering" },
  { key:"QAT-164", summary:"[Energy] Change current transformers CT",                       feature:"Energy Metering" },
  { key:"QAT-165", summary:"[Wiring] Test with/without N wire",                             feature:"Specific Wiring" },
  { key:"QAT-166", summary:"[Add-on] Test with add-on (device-specific)",                   feature:"Add-on" },
  { key:"QAT-167", summary:"[Protocol] Matter to ZigBee via Sys button",                    feature:"Protocol Changing" },
  { key:"QAT-168", summary:"[Protocol] ZigBee to Matter via Sys button",                    feature:"Protocol Changing" },
  { key:"QAT-169", summary:"[Protocol] Matter to ZigBee via WebUI",                         feature:"Protocol Changing" },
  { key:"QAT-170", summary:"[Protocol] ZigBee to Matter via WebUI",                         feature:"Protocol Changing" },
  { key:"QAT-171", summary:"[OTA] Matter enabled - Matter main",                            feature:"OTA Matrix" },
  { key:"QAT-172", summary:"[OTA] Matter enabled - ZigBee main",                            feature:"OTA Matrix" },
  { key:"QAT-173", summary:"[OTA] ZigBee enabled - ZigBee main",                            feature:"OTA Matrix" },
  { key:"QAT-174", summary:"[OTA] ZigBee enabled - Matter main",                            feature:"OTA Matrix" },
  { key:"QAT-175", summary:"OTA - Gen2",                                                    feature:"OTA Matrix" },
  { key:"QAT-176", summary:"DUT data",                                                      feature:"General" },
];

const FEAT_PALETTE = [
  "#1d6ef5","#0891b2","#0d9488","#059669","#7c3aed",
  "#db2777","#ea580c","#ca8a04","#4f46e5","#0369a1",
  "#047857","#b45309","#6d28d9","#be185d","#0e7490","#15803d","#1e40af"
];

function loadStored(k)   { try { const v=localStorage.getItem(k); return v?JSON.parse(v):null; } catch{return null;} }
function saveStored(k,v) { try { localStorage.setItem(k,JSON.stringify(v)); } catch{} }
function clearStored(k)  { try { localStorage.removeItem(k); } catch{} }
function statusInfo(val) { return TEST_STATUSES.find(s=>s.value===val)||TEST_STATUSES[0]; }

function buildReport(conclusion, remarks, dutData, testMeta, chosen, otaSections) {
  try {
    const conclusionLabel = CONCLUSIONS.find(c=>c.value===conclusion)?.label || conclusion;
    const features = [...new Set((chosen||[]).map(t=>t.feature||"General"))];
    const byFeature = {};
    (chosen||[]).forEach(t=>{
      const feat = t.feature || "General";
      if (!byFeature[feat]) byFeature[feat]=[];
      const meta=(testMeta||{})[t.key]||{};
      const st=statusInfo(meta.status||"not_applicable");
      const statusStr = st.value==="passed"        ? "PASSED"
        : st.value==="passed_remarks" ? "PASSED with remarks"
        : st.value==="failed"         ? "FAILED"
        : st.value==="fixed"          ? "FIXED"
        : st.value==="skipped"        ? "SKIPPED"
        : "N/A";
      const reason = meta.reason ? ` -- ${meta.reason}` : "";
      byFeature[feat].push(`** ${t.summary}: *${statusStr}*${reason}`);
    });
    const testSection = features.map(f=>`*${f}*\n${(byFeature[f]||[]).join("\n")}`).join("\n\n");

    const ota = otaSections || {};
    const hasOta = ota.selfTestPassed||ota.selfTestFailed||ota.selfTestUnprovisioned||ota.ota;

    const otaBlock = hasOta ? `
h3. OTA Self-Test Results

*Passed:*
${ota.selfTestPassed||"(no notes)"}

*Failed:*
${ota.selfTestFailed||"(no notes)"}

*Unprovisioned:*
${ota.selfTestUnprovisioned||"(no notes)"}

*OTA:*
${ota.ota||"(no notes)"}` : "";

    return `h2. Test Report

h3. General Test Conclusion
${conclusionLabel}

h3. Test Remarks
${remarks||"No remarks"}

h3. Executed Tests

${testSection||"(no tests selected)"}
${otaBlock}
h3. DUT Data
{noformat}
${dutData||"No DUT data provided"}
{noformat}`;
  } catch(e) {
    return `h2. Test Report\n(Error generating report: ${e.message})`;
  }
}

async function apiGet(path, creds, cfg) {
  const r = await fetch(`${cfg.proxyUrl}${path}${path.includes("?") ? "&" : "?"}ngrok-skip-browser-warning=true`, {
    headers: { "x-jira-email": creds.email, "x-jira-token": creds.token, "ngrok-skip-browser-warning": "true" }
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
  return d;
}
async function apiPost(path, body, creds, cfg) {
  const r = await fetch(`${cfg.proxyUrl}${path}${path.includes("?") ? "&" : "?"}ngrok-skip-browser-warning=true`, {
    method:"POST",
    headers:{"Content-Type":"application/json","x-jira-email":creds.email,"x-jira-token":creds.token,"ngrok-skip-browser-warning":"true"},
    body:JSON.stringify(body)
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error||`HTTP ${r.status}`);
  return d;
}

/* ── SETTINGS MODAL ── */
function SettingsModal({ cfg, creds, onSave, onClose, onReloadTests }) {
  const [form, setForm] = useState({...cfg});
  const [reloading, setReloading] = useState(false);
  const [reloadMsg, setReloadMsg] = useState("");
  const set = (k,v)=>setForm(p=>({...p,[k]:v}));

  const handleReload = async () => {
    if(!form.templateKey.trim()) return;
    setReloading(true); setReloadMsg("");
    try {
      const tempCfg = {...form};
      const r = await fetch(`${tempCfg.proxyUrl}/api/issue/${form.templateKey.trim()}/subtasks?ngrok-skip-browser-warning=true`, {
        headers: { "x-jira-email": creds.email, "x-jira-token": creds.token, "ngrok-skip-browser-warning": "true" }
      });
      const d = await r.json();
      if(!r.ok) throw new Error(d.error||`HTTP ${r.status}`);
      onReloadTests(d.tests||[], form.templateKey.trim());
      setReloadMsg(`✓ Loaded ${(d.tests||[]).length} tests from ${form.templateKey.trim()}`);
    } catch(e) {
      setReloadMsg(`⚠ ${e.message}`);
    }
    setReloading(false);
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box fade-in">
        <div className="modal-header">
          <span className="modal-title">⚙ Settings</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="field-group">
            <label className="field-label">Template key</label>
            <div style={{display:"flex",gap:8}}>
              <input className="field-input" style={{flex:1}} value={form.templateKey} onChange={e=>set("templateKey",e.target.value.toUpperCase())} placeholder="QAT-118"/>
              <button className="btn btn-secondary btn-sm" style={{flexShrink:0}} disabled={reloading||!form.templateKey.trim()} onClick={handleReload}>
                {reloading?<><span className="spin spin-dark"/>Loading…</>:"🔄 Load tests"}
              </button>
            </div>
            {reloadMsg&&<p className="settings-note" style={{color:reloadMsg.startsWith("✓")?"var(--green)":"var(--red)"}}>{reloadMsg}</p>}
          </div>
          <div className="field-group"><label className="field-label">Project key</label><input className="field-input" value={form.projectKey} onChange={e=>set("projectKey",e.target.value)} placeholder="QAT"/></div>
          <div className="field-group"><label className="field-label">Proxy URL</label><input className="field-input" value={form.proxyUrl} onChange={e=>set("proxyUrl",e.target.value)}/></div>
          <div className="field-grid-2">
            <div className="field-group"><label className="field-label">Jira domain</label><input className="field-input" value={form.jiraDomain} onChange={e=>set("jiraDomain",e.target.value)}/></div>
            <div className="field-group"><label className="field-label">Cloud ID</label><input className="field-input" value={form.cloudId} onChange={e=>set("cloudId",e.target.value)}/></div>
          </div>
          <p className="settings-note">💾 Settings saved in your browser and persist across sessions.</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={()=>setForm({...DEFAULT_CONFIG})}>Reset defaults</button>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={()=>{onSave(form);onClose();}}>Save</button>
        </div>
      </div>
    </div>
  );
}

/* ── ADD CUSTOM TEST MODAL ── */
function AddTestModal({ onAdd, onClose, projectKey, extraCategories, onSaveCategory }) {
  const [summary, setSummary]    = useState("");
  const [feature, setFeature]    = useState("General");
  const [addToTemplate, setAddToTemplate] = useState(false);
  const builtInFeatures = [...new Set(ALL_TESTS.map(t=>t.feature))];
  const allFeatures = [...new Set([...builtInFeatures, ...(extraCategories||[])])];
  const [customFeat, setCustomFeat] = useState("");

  const effectiveFeat = feature === "__custom__" ? customFeat : feature;

  const submit = () => {
    if(!summary.trim()) return;
    const finalFeat = effectiveFeat || "General";
    if(feature === "__custom__" && customFeat.trim() && !builtInFeatures.includes(customFeat.trim())) {
      onSaveCategory && onSaveCategory(customFeat.trim());
    }
    onAdd({
      key: `CUSTOM-${Date.now()}`,
      summary: summary.trim(),
      feature: finalFeat,
      isCustom: true,
      addToTemplate,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box fade-in">
        <div className="modal-header">
          <span className="modal-title">➕ Add Custom Test</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="field-group">
            <label className="field-label">Test summary <span style={{color:"#dc2626"}}>*</span></label>
            <input className="field-input" autoFocus value={summary} onChange={e=>setSummary(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="e.g. [Wi-Fi] Check 5GHz band connectivity"/>
          </div>
          <div className="field-group">
            <label className="field-label">Feature / category</label>
            <select className="field-input" value={feature} onChange={e=>setFeature(e.target.value)}>
              {allFeatures.map(f=><option key={f} value={f}>{f}</option>)}
              <option value="__custom__">+ Custom category…</option>
            </select>
          </div>
          {feature==="__custom__"&&(
            <div className="field-group">
              <label className="field-label">Custom category name</label>
              <input className="field-input" value={customFeat} onChange={e=>setCustomFeat(e.target.value)} placeholder="e.g. Bluetooth 5.0"/>
            </div>
          )}
          <div className="add-template-row" onClick={()=>setAddToTemplate(p=>!p)}>
            <div className={`checkbox ${addToTemplate?"on":""}`} style={{flexShrink:0}}>
              {addToTemplate&&<svg width="9" height="7" viewBox="0 0 9 7" fill="none"><polyline points="1,3.5 3.5,6 8,1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:"var(--blue-900)"}}>Add to template ({DEFAULT_CONFIG.templateKey})</div>
              <div style={{fontSize:12,color:"var(--text2)"}}>Also creates this test as a subtask of the template epic — it'll appear in future executions</div>
            </div>
          </div>
          {!addToTemplate&&<div className="alert alert-info" style={{padding:"8px 12px"}}>ℹ This test will only be created for this execution.</div>}
          {addToTemplate&&<div className="alert alert-warning" style={{padding:"8px 12px"}}>⚠ This test will be added to <strong>{DEFAULT_CONFIG.templateKey}</strong> permanently.</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" disabled={!summary.trim()} onClick={submit}>Add test →</button>
        </div>
      </div>
    </div>
  );
}

/* ── LOGIN ── */
function LoginScreen({ onLogin }) {
  const [email,setEmail]=useState(""); const [token,setToken]=useState("");
  const [remember,setRemember]=useState(true); const [busy,setBusy]=useState(false);
  const [err,setErr]=useState(""); const [proxyState,setProxyState]=useState("checking");
  const [proxyMsg,setProxyMsg]=useState("Waking up proxy server…");
  const cfg = loadStored(STORAGE_CFG)||DEFAULT_CONFIG;
  useEffect(()=>{
    let cancelled=false;
    const slow=setTimeout(()=>{ if(!cancelled){setProxyState("slow");setProxyMsg("Proxy is starting up — can take ~30s…");} },5000);
    fetch(`${cfg.proxyUrl}/health?ngrok-skip-browser-warning=true`, { headers: { "ngrok-skip-browser-warning": "true" } })
      .then(r=>r.ok?r.json():Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(d=>{ if(cancelled)return; clearTimeout(slow); setProxyState(d.ok?"ok":"down"); setProxyMsg(d.ok?"Proxy is ready":"Proxy returned unexpected response."); })
      .catch(ex=>{ if(cancelled)return; clearTimeout(slow); setProxyState("down"); setProxyMsg(`Cannot reach proxy — ${ex.message}`); });
    return ()=>{ cancelled=true; clearTimeout(slow); };
  },[cfg.proxyUrl]);
  const submit=async()=>{
    const e=email.trim(),t=token.trim();
    if(!e||!t){setErr("Both fields are required.");return;}
    if(proxyState==="down"){setErr("Proxy unreachable.");return;}
    setBusy(true);setErr("");
    try{
      const creds={email:e,token:t};
      const me=await apiGet("/api/me",creds,cfg);
      const full={...creds,name:me.displayName||me.emailAddress};
      if(remember)saveStored(STORAGE_CREDS,full);
      onLogin(full);
    }catch(ex){
      let msg=ex.message;
      if(msg.includes("Load failed")||msg.includes("NetworkError"))msg="Could not reach proxy. Wait 30s and try again.";
      else if(msg.includes("401")||msg.includes("403"))msg="Invalid credentials.";
      setErr(msg);
    }
    setBusy(false);
  };
  const pc=proxyState==="ok"?"alert-success":proxyState==="down"?"alert-error":"alert-info";
  return (
    <div className="login-root">
      <div className="login-card fade-in">
        <div className="login-logo">
          <img src={SHELLY_LOGO} alt="Shelly" className="login-shelly" onError={e=>{e.target.style.display="none";}}/>
          <span className="login-title">IoT Studio</span>
        </div>
        <p className="login-sub">Sign in with your Atlassian credentials. Sent directly to Jira — never stored on the server.</p>
        <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:18}}>
          <div className="field-group"><label className="field-label">Atlassian email</label><input className="field-input" type="email" placeholder="you@company.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
          <div className="field-group">
            <label className="field-label">API token</label>
            <input className="field-input" type="password" placeholder="ATATT3x…" value={token} onChange={e=>setToken(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
            <p className="field-hint">Generate at <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noreferrer">id.atlassian.com → API tokens</a></p>
          </div>
          <div className="check-row" onClick={()=>setRemember(p=>!p)}>
            <div className={`check-box ${remember?"on":""}`}>{remember&&<svg width="9" height="7" viewBox="0 0 9 7" fill="none"><polyline points="1,3.5 3.5,6 8,1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}</div>
            <span className="check-label">Keep me signed in</span>
          </div>
        </div>
        <div className={`alert ${pc}`} style={{marginBottom:12}}>
          {(proxyState==="checking"||proxyState==="slow")&&<span className="spin spin-dark"/>}
          {proxyState==="ok"&&<span>✓</span>}{proxyState==="down"&&<span>⚠</span>}
          <span style={{flex:1}}>{proxyMsg}</span>
        </div>
        {err&&<div className="alert alert-error" style={{marginBottom:12}}>⚠ {err}</div>}
        <button className="btn btn-primary btn-full" onClick={submit} disabled={busy||proxyState==="checking"||proxyState==="down"}>
          {busy?<><span className="spin"/>Signing in…</>:proxyState==="checking"?<><span className="spin"/>Waiting…</>:proxyState==="down"?"Proxy unreachable":"Sign in →"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════════════════════ */
export default function App() {
  const [cfg,setCfg]                   = useState(()=>({...DEFAULT_CONFIG,...(loadStored(STORAGE_CFG)||{})}));
  const [creds,setCreds]               = useState(()=>loadStored(STORAGE_CREDS));
  const [showSettings,setShowSettings] = useState(false);
  const [showAddTest,setShowAddTest]   = useState(false);
  const [darkMode,setDarkMode]         = useState(()=>{
    try { return localStorage.getItem("iot_theme")==="dark"; } catch { return false; }
  });

  // Apply theme to <html> element
  useEffect(()=>{
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    try { localStorage.setItem("iot_theme", darkMode ? "dark" : "light"); } catch {}
  }, [darkMode]);

  // TABS
  const [tab,setTab] = useState("select");

  // SELECT tab
  const [sel,setSel]           = useState(new Set());
  const [featF,setFeatF]       = useState(null);
  const [srch,setSrch]         = useState("");
  const [customTests,setCustomTests] = useState([]);   // user-added tests
  const [templateTests,setTemplateTests] = useState(ALL_TESTS);  // loaded from template epic
  const [extraCategories,setExtraCategories] = useState(()=>loadStored(STORAGE_CATS)||[]);
  const saveCategory = (cat) => {
    setExtraCategories(p=>{
      if(p.includes(cat)) return p;
      const next=[...p,cat];
      saveStored(STORAGE_CATS,next);
      return next;
    });
  };
  const handleReloadTests = (tests, templateKey) => {
    const mapped = tests.map(t=>({
      key: t.key,
      summary: t.summary,
      feature: t.feature || "General",
    }));
    setTemplateTests(mapped);
    setSel(new Set());
  };
  // Descriptions fetched from Jira {key: string|null}
  const [descriptions,setDescriptions] = useState({});
  const [expandedDesc,setExpandedDesc] = useState(new Set());
  const [fetchingDesc,setFetchingDesc] = useState(new Set());

  // ANNOTATE tab
  const [testMeta,setTestMeta] = useState({});
  const [expandedAnn,setExpandedAnn] = useState(new Set());

  // CONFIGURE tab
  const [editExecKey,setEditExecKey]   = useState("");
  const [isEditMode,setIsEditMode]     = useState(false); // true = editing loaded execution
  const [loadExecInput,setLoadExecInput] = useState("");
  const [loadExecState,setLoadExecState] = useState("idle"); // idle | loading | error
  const [loadExecError,setLoadExecError] = useState("");
  const [execName,setExecName]    = useState("");
  const [execVer,setExecVer]      = useState("");
  const [execDesc,setExecDesc]    = useState("");       // optional description field
  const [conclusion,setConclusion] = useState("passed_remarks");
  const [remarks,setRemarks]      = useState("");
  const [dutData,setDutData]      = useState("");
  const [linkedIssue,setLinkedIssue] = useState("");
  const [otaSections,setOtaSections] = useState({selfTestPassed:"",selfTestFailed:"",selfTestUnprovisioned:"",ota:""});
  const [reportText,setReportText] = useState("");

  // Execution state
  const [phase,setPhase]     = useState("idle");
  const [prog,setProg]       = useState(0);
  const [result,setResult]   = useState(null);
  const [cErr,setCErr]       = useState("");
  const [logLines,setLogLines] = useState([]);
  const [verifyState,setVerifyState] = useState("idle");
  const [verifyMsg,setVerifyMsg]     = useState("");
  const logRef = useRef(null);

  // In edit mode, the "tests" are the actual subtask keys loaded from Jira.
  // customTests holds any tests that aren't in ALL_TESTS (template).
  // In edit mode we replace the displayed list entirely with loadedTests via customTests+sel.
  const allTests = useMemo(()=>{
    if(isEditMode) {
      return customTests;
    }
    return [...templateTests,...customTests];
  },[customTests, isEditMode, templateTests]);
  const features = useMemo(()=>[...new Set(allTests.map(t=>t.feature))],[allTests]);
  const cmap = useMemo(()=>Object.fromEntries(features.map((f,i)=>[f,FEAT_PALETTE[i%FEAT_PALETTE.length]])),[features]);
  const filtered = useMemo(()=>allTests.filter(t=>{
    if(featF&&t.feature!==featF)return false;
    if(srch&&!t.summary.toLowerCase().includes(srch.toLowerCase())&&!t.key.toLowerCase().includes(srch.toLowerCase()))return false;
    return true;
  }),[allTests,featF,srch]);
  const fstats = useMemo(()=>Object.fromEntries(features.map(f=>{
    const all=allTests.filter(t=>t.feature===f);
    return [f,{total:all.length,sel:all.filter(t=>sel.has(t.key)).length}];
  })),[sel,features,allTests]);
  const chosen = allTests.filter(t=>sel.has(t.key));

  useEffect(()=>{
    if(tab==="configure"&&creds&&verifyState==="idle")runVerify();
  },[tab]);
  useEffect(()=>{
    if(tab==="configure"){
      setReportText(buildReport(conclusion,remarks,dutData,testMeta,chosen,otaSections));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[tab, JSON.stringify(chosen.map(t=>t.key)), JSON.stringify(testMeta)]);

  const runVerify = async()=>{
    setVerifyState("checking");setVerifyMsg("Connecting to Jira…");
    try{ const me=await apiGet("/api/me",creds,cfg); setVerifyState("ok");setVerifyMsg(`Connected as ${me.displayName||me.emailAddress}`); }
    catch(e){ setVerifyState("fail");setVerifyMsg(`Connection failed — ${e.message}`); }
  };

  const loadExecution = async () => {
    const key = loadExecInput.trim().toUpperCase();
    if (!key) return;
    setLoadExecState("loading"); setLoadExecError("");
    try {
      const data = await apiGet(`/api/execution/${key}`, creds, cfg);
      // data: { key, summary, fixVersion, tests: [{key, summary, status, reason}] }

      const newSel = new Set();
      const newMeta = {};
      const loadedTests = [];

      data.tests.forEach(t => {
        newSel.add(t.key);
        newMeta[t.key] = { status: t.status, reason: t.reason };
        // Try to find feature from template by matching summary
        const templateMatch = ALL_TESTS.find(at =>
          at.summary.toLowerCase() === t.summary.toLowerCase() ||
          t.summary.toLowerCase().includes(at.summary.toLowerCase().replace(/\[.*?\]\s*/g,"").trim().toLowerCase().slice(0,20))
        );
        loadedTests.push({
          key: t.key,
          summary: t.summary,
          feature: templateMatch?.feature || "General",
          isLoaded: true,
        });
      });

      // In edit mode: allTests = loadedTests (replace everything)
      setCustomTests(loadedTests);
      setSel(newSel);
      setTestMeta(newMeta);
      setExecName(data.summary || "");
      setExecVer(data.fixVersion || "");
      setEditExecKey(key);
      setIsEditMode(true);
      setLoadExecState("idle");
      setLoadExecInput("");

      // Jump straight to Set Results
      setTab("annotate");
    } catch (e) {
      setLoadExecState("error");
      setLoadExecError(e.message);
    }
  };


  const addLog=useCallback((cls,msg)=>{
    setLogLines(p=>[...p,{cls,msg}]);
    setTimeout(()=>logRef.current?.scrollTo(0,99999),40);
  },[]);

  const toggleT=key=>setSel(p=>{const n=new Set(p);n.has(key)?n.delete(key):n.add(key);return n;});
  const toggleF=(f,e)=>{
    e.stopPropagation();
    const ft=allTests.filter(t=>t.feature===f),allOn=ft.every(t=>sel.has(t.key));
    setSel(p=>{const n=new Set(p);ft.forEach(t=>allOn?n.delete(t.key):n.add(t.key));return n;});
  };
  const selectAll=()=>setSel(new Set(allTests.map(t=>t.key)));
  const deselectAll=()=>setSel(new Set());
  const setMeta=(key,field,val)=>setTestMeta(p=>({...p,[key]:{...p[key],[field]:val}}));

  // Fetch description for a single test key
  const fetchDesc = async(key) => {
    if(descriptions[key]!==undefined||fetchingDesc.has(key))return;
    setFetchingDesc(p=>new Set([...p,key]));
    try {
      const d = await apiGet(`/api/issue/${key}`, creds, cfg);
      setDescriptions(p=>({...p,[key]: d.description||"No description available."}));
    } catch(e) {
      setDescriptions(p=>({...p,[key]:`Error: ${e.message}`}));
    } finally {
      setFetchingDesc(p=>{ const n=new Set(p); n.delete(key); return n; });
    }
  };

  const toggleDesc = (key) => {
    const next = new Set(expandedDesc);
    if(next.has(key)) { next.delete(key); setExpandedDesc(next); return; }
    next.add(key); setExpandedDesc(next);
    fetchDesc(key);
  };

  const toggleAnnDesc = (key) => {
    const next = new Set(expandedAnn);
    if(next.has(key)) { next.delete(key); setExpandedAnn(next); return; }
    next.add(key); setExpandedAnn(next);
    fetchDesc(key);
  };

  const handleAddCustomTest = (test) => {
    setCustomTests(p=>[...p,test]);
    setSel(p=>new Set([...p,test.key]));
  };
  const deleteCustomTest = (key) => {
    setCustomTests(p=>p.filter(t=>t.key!==key));
    setSel(p=>{ const n=new Set(p); n.delete(key); return n; });
  };

  const handleCreate=async()=>{
    const name=execName.trim()||`[Test Execution] Bundle — ${new Date().toLocaleDateString()}`;
    const linked=linkedIssue.trim().toUpperCase();
    setPhase("creating");setLogLines([]);setCErr("");setProg(5);
    try{
      if(isEditMode && editExecKey) {
        // ── EDIT MODE: update existing subtasks in-place ──
        addLog("log-accent",`Updating ${chosen.length} tests in ${editExecKey}…`);
        const updateRes = await apiPost(`/api/execution/${editExecKey}/update`, {
          name: execName.trim() || undefined,
          tests: chosen.map(t=>({
            key: t.key,  // the actual Jira subtask key
            status: testMeta[t.key]?.status || "not_applicable",
            reason: testMeta[t.key]?.reason || "",
          })),
        }, creds, cfg);
        addLog("log-ok",`✓ ${updateRes.updated.length} tests updated in ${editExecKey}`);
        updateRes.updated.forEach(k=>addLog("log-ok",`  ✓ ${k}`));
        updateRes.failed?.forEach(f=>addLog("log-warn",`  ⚠ ${f.key}: ${f.error}`));
        setProg(60);

        // Post fresh report comment
        addLog("log-accent",`Posting updated report to ${editExecKey}…`);
        await apiPost("/api/comment",{issueKey:editExecKey,body:reportText},creds,cfg);
        addLog("log-ok",`✓ Report comment added to ${editExecKey}`);
        setProg(80);

        if(linked){
          addLog("log-accent",`Posting report to ${linked}…`);
          await apiPost("/api/comment",{issueKey:linked,body:`Execution ${editExecKey} was updated.\n\n${reportText}`},creds,cfg);
          addLog("log-ok",`✓ Comment added to ${linked}`);
          await apiPost("/api/link",{inwardKey:linked,outwardKey:editExecKey,linkType:"Relates"},creds,cfg);
          addLog("log-ok",`✓ ${linked} relates to ${editExecKey}`);
        }
        setProg(100);
        setResult({
          execKey:editExecKey,
          execUrl:`https://${cfg.jiraDomain}/browse/${editExecKey}`,
          created:updateRes.updated.map(k=>({original:k,created:k})),
          failed:updateRes.failed||[],
          issueKey:linked||null,
          reportText,
          editMode:true,
        });
        setPhase("done");setTab("result");

      } else {
        // ── CREATE MODE ──
        addLog("log-accent",`Creating Test Execution "${name}"…`);
        const execRes=await apiPost("/api/execution",{
          name,
          description: execDesc.trim()||undefined,
          fixVersion:execVer.trim()||undefined,
          projectKey:cfg.projectKey,
          tests:chosen.map(t=>({
            key:t.key, summary:t.summary,
            status:testMeta[t.key]?.status||"not_applicable",
            reason:testMeta[t.key]?.reason||"",
            addToTemplate: t.addToTemplate||false,
            templateKey: cfg.templateKey,
          })),
        },creds,cfg);
        addLog("log-ok",`✓ Test Execution ${execRes.execKey} created`);
        execRes.created.forEach(c=>addLog("log-ok",`  ✓ ${c.created} <- ${c.original}`));
        execRes.failed.forEach(f=>addLog("log-warn",`  ⚠ ${f.original}: ${f.error}`));
        setProg(40);

        addLog("log-accent",`Posting report comment to ${execRes.execKey}…`);
        await apiPost("/api/comment",{issueKey:execRes.execKey,body:reportText},creds,cfg);
        addLog("log-ok",`✓ Comment added to ${execRes.execKey}`);
        setProg(65);

        if(linked){
          addLog("log-accent",`Posting report comment to ${linked}…`);
          await apiPost("/api/comment",{issueKey:linked,body:`Test Execution ${execRes.execKey} was created.\n\n${reportText}`},creds,cfg);
          addLog("log-ok",`✓ Comment added to ${linked}`);
          setProg(82);
          addLog("log-accent",`Linking ${linked} <-> ${execRes.execKey}…`);
          await apiPost("/api/link",{inwardKey:linked,outwardKey:execRes.execKey,linkType:"Relates"},creds,cfg);
          addLog("log-ok",`✓ ${linked} relates to ${execRes.execKey}`);
        }
        setProg(100);
        setResult({...execRes,issueKey:linked||null,reportText});
        setPhase("done");setTab("result");
      }
    }catch(e){
      setCErr(e.message);addLog("log-err",`Error: ${e.message}`);setPhase("error");
    }
  };

  const saveCfg=newCfg=>{setCfg(newCfg);saveStored(STORAGE_CFG,newCfg);setVerifyState("idle");};
  const signOut=()=>{clearStored(STORAGE_CREDS);setCreds(null);};
  const reset=()=>{
    setSel(new Set());setFeatF(null);setSrch("");setTestMeta({});
    setCustomTests([]);setDescriptions({});setExpandedDesc(new Set());setExpandedAnn(new Set());
    setIsEditMode(false);setEditExecKey("");setLoadExecInput("");setLoadExecState("idle");setLoadExecError("");
    setExecName("");setExecVer("");setExecDesc("");setConclusion("passed_remarks");
    setRemarks("");setDutData("");setLinkedIssue("");setReportText("");
    setOtaSections({selfTestPassed:"",selfTestFailed:"",selfTestUnprovisioned:"",ota:""});
    setPhase("idle");setLogLines([]);setResult(null);setCErr("");
    setVerifyState("idle");setVerifyMsg("");setTab("select");
  };

  if(!creds) return (
    <>
      <LoginScreen onLogin={setCreds}/>
      <button
        className="theme-toggle"
        style={{position:"fixed",top:14,right:16,zIndex:100}}
        title={darkMode?"Switch to light mode":"Switch to dark mode"}
        onClick={()=>setDarkMode(p=>!p)}
      >
        {darkMode ? "☀️" : "🌙"}
      </button>
    </>
  );
  const initials=(creds.name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

  const TABS = [
    {id:"select",    label:"1. Select Tests",  badge:sel.size||null, dis:false},
    {id:"annotate",  label:"2. Set Results",    badge:null,           dis:sel.size===0},
    {id:"configure", label:"3. Configure",      badge:null,           dis:sel.size===0},
    {id:"result",    label:"4. Result",         badge:null,           dis:phase!=="done"},
  ];

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      {showSettings&&<SettingsModal cfg={cfg} creds={creds} onSave={saveCfg} onClose={()=>setShowSettings(false)} onReloadTests={handleReloadTests}/>}
      {showAddTest&&<AddTestModal onAdd={handleAddCustomTest} onClose={()=>setShowAddTest(false)} projectKey={cfg.projectKey} extraCategories={extraCategories} onSaveCategory={saveCategory}/>}

      {/* ── TOPBAR ── */}
      <div className="topbar">
        <div className="topbar-logo">
          <img src={SHELLY_LOGO} alt="Shelly" className="topbar-shelly" onError={e=>{e.target.style.display="none";}}/>
          <span className="topbar-name">IoT Studio</span>
        </div>
        <div className="topbar-div"/>
        {TABS.map(t=>(
          <button key={t.id} className={`tab-btn ${tab===t.id?"active":""}`} disabled={t.dis}
            onClick={()=>!t.dis&&setTab(t.id)}>
            {t.label}{t.badge>0&&<span className="tab-badge">{t.badge}</span>}
          </button>
        ))}
        <div className="topbar-fill"/>
        {isEditMode && (
          <div className="edit-mode-pill">
            ✏️ Editing <strong>{editExecKey}</strong>
            <button className="edit-mode-clear" onClick={reset} title="Exit edit mode">×</button>
          </div>
        )}
        <div className="topbar-right">
          {verifyState!=="idle"&&(
            <div className={`status-pill ${verifyState==="ok"?"ok":verifyState==="checking"?"warn":""}`}>
              <div className={`status-dot ${verifyState==="ok"?"ok":verifyState==="checking"?"warn":""}`}/>
              {verifyState==="ok"?"Jira connected":verifyState==="checking"?"Connecting…":"Connection failed"}
            </div>
          )}
          <div className="user-chip"><div className="user-avatar">{initials}</div><span>{creds.name}</span></div>
          <button className="theme-toggle" title={darkMode?"Switch to light mode":"Switch to dark mode"} onClick={()=>setDarkMode(p=>!p)}>
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button className="btn-icon" title="Settings" onClick={()=>setShowSettings(true)}>⚙</button>
          <button className="btn btn-ghost btn-sm" onClick={signOut}>Sign out</button>
        </div>
      </div>

      {/* ══ TAB 1 — SELECT TESTS ══ */}
      {tab==="select"&&(
        <div className="app-layout">
          {/* sidebar */}
          <div className="sidebar">
            <div className="sidebar-section">Features</div>
            <div style={{display:"flex",gap:6,marginBottom:4}}>
              <button className="select-all-btn" style={{flex:1}} onClick={selectAll}>✓ Select All ({allTests.length})</button>
              <button className="select-all-btn" style={{flex:1,opacity:sel.size===0?0.4:1}} disabled={sel.size===0} onClick={deselectAll}>✕ Deselect All</button>
            </div>
            <div className={`feat-row ${!featF?"active":""}`} onClick={()=>setFeatF(null)}>
              <div className="feat-dot" style={{background:"var(--accent)"}}/>
              <span className="feat-name">All features</span>
              <span className={`feat-count ${sel.size>0?"sel":""}`}>{sel.size}/{allTests.length}</span>
            </div>
            <div className="sidebar-div"/>
            {features.map(f=>{
              const c=cmap[f],st=fstats[f]||{total:0,sel:0},pct=st.total?(st.sel/st.total)*100:0;
              return (
                <div key={f}>
                  <div className={`feat-row ${featF===f?"active":""}`} onClick={()=>setFeatF(featF===f?null:f)}>
                    <div className="feat-dot" style={{background:c}}/>
                    <span className="feat-name">{f}</span>
                    <span className={`feat-count ${st.sel>0?"sel":""}`}>{st.sel}/{st.total}</span>
                  </div>
                  <div className="feat-bar"><div className="feat-bar-fill" style={{width:`${pct}%`,background:c}}/></div>
                  <button className="feat-toggle" onClick={e=>toggleF(f,e)}>{st.sel===st.total&&st.total>0?"Deselect all":"Select all"}</button>
                </div>
              );
            })}
          </div>
          {/* list */}
          <div className="list-area">
            {/* Load existing execution banner */}
            <div className="load-exec-bar">
              <span className="load-exec-label">📂 Edit existing execution:</span>
              <input
                className="load-exec-input"
                placeholder="e.g. QAT-1854"
                value={loadExecInput}
                onChange={e=>setLoadExecInput(e.target.value.toUpperCase())}
                onKeyDown={e=>e.key==="Enter"&&loadExecution()}
              />
              <button
                className="btn btn-secondary btn-sm"
                disabled={!loadExecInput.trim()||loadExecState==="loading"}
                onClick={loadExecution}
              >
                {loadExecState==="loading"?<><span className="spin spin-dark"/>Loading…</>:"Load & Edit"}
              </button>
              {loadExecState==="error"&&<span className="load-exec-err">⚠ {loadExecError}</span>}
            </div>
            <div className="list-toolbar">
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input className="search-input" placeholder="Search tests…" value={srch} onChange={e=>setSrch(e.target.value)}/>
              </div>
              <div className="toolbar-right">
                <span className="sel-label"><strong>{sel.size}</strong> selected</span>
                <button className="btn btn-secondary btn-sm" onClick={()=>setSel(p=>new Set([...p,...filtered.map(t=>t.key)]))}>Select visible</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>{const fk=new Set(filtered.map(t=>t.key));setSel(p=>new Set([...p].filter(k=>!fk.has(k))));}}>Clear visible</button>
                <button className="btn btn-accent btn-sm" onClick={()=>setShowAddTest(true)}>＋ Add custom test</button>
                <button className="btn btn-primary btn-sm" disabled={sel.size===0} onClick={()=>setTab("annotate")}>Set Results →</button>
              </div>
            </div>
            <div className="test-list">
              {filtered.length===0
                ?<div className="empty-state"><span className="empty-icon">🔍</span>No tests match your filter.</div>
                :filtered.map(t=>{
                  const isSel=sel.has(t.key),fc=cmap[t.feature];
                  const isExpanded=expandedDesc.has(t.key);
                  const desc=descriptions[t.key];
                  const fetching=fetchingDesc.has(t.key);
                  return (
                    <div key={t.key} className={`test-card ${isSel?"selected":""}`}>
                      <div className="test-row-main" onClick={()=>toggleT(t.key)}>
                        <div className={`checkbox ${isSel?"on":""}`}>{isSel&&<svg width="9" height="7" viewBox="0 0 9 7" fill="none"><polyline points="1,3.5 3.5,6 8,1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}</div>
                        <span className="test-key">{t.isCustom?<span className="custom-badge">CUSTOM</span>:t.key}</span>
                        <span className="test-summary">{t.summary}</span>
                        {t.isCustom&&t.addToTemplate&&<span className="template-badge">+{cfg.templateKey}</span>}
                        <span className="feat-pill" style={{background:`${fc}15`,color:fc,borderColor:`${fc}40`}}>{t.feature}</span>
                        {t.isCustom&&(
                          <button
                            title="Remove this custom test"
                            onClick={e=>{e.stopPropagation();deleteCustomTest(t.key);}}
                            style={{background:"none",border:"none",cursor:"pointer",color:"#dc2626",fontSize:15,padding:"2px 6px",borderRadius:4,lineHeight:1,flexShrink:0}}
                          >✕</button>
                        )}
                        {!t.isCustom&&(
                          <button className={`desc-toggle ${isExpanded?"open":""}`}
                            onClick={e=>{e.stopPropagation();toggleDesc(t.key);}}>
                            {fetching?<span className="spin spin-dark" style={{width:10,height:10}}/>:"▸"}
                          </button>
                        )}
                      </div>
                      {isExpanded&&(
                        <div className="desc-panel">
                          {desc===undefined?<span className="spin spin-dark" style={{width:12,height:12}}/>
                            :<span style={{whiteSpace:"pre-wrap",lineHeight:1.6}}>{desc}</span>}
                        </div>
                      )}
                    </div>
                  );
                })
              }
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB 2 — ANNOTATE ══ */}
      {tab==="annotate"&&(
        <div className="app-layout" style={{flexDirection:"column",overflow:"auto"}}>
          <div className="annotate-header">
            <div>
              <div className="page-eyebrow">Step 2 of 3</div>
              <div style={{fontSize:16,fontWeight:700,color:"var(--blue-900)"}}>Set Test Results</div>
              <div style={{fontSize:13,color:"var(--text2)",marginTop:2}}>{chosen.length} selected tests — set status and optionally add a Reason</div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {TEST_STATUSES.map(s=>(
                  <button key={s.value} className="btn btn-sm"
                    style={{background:s.bg,color:s.color,border:`1.5px solid ${s.border}`,fontWeight:600}}
                    onClick={()=>{
                      const upd={};
                      chosen.forEach(t=>{upd[t.key]={...testMeta[t.key],status:s.value};});
                      setTestMeta(p=>({...p,...upd}));
                    }}>
                    Set all: {s.label}
                  </button>
                ))}
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn btn-ghost btn-sm" onClick={()=>setTab("select")}>← Back</button>
                <button className="btn btn-primary btn-sm" onClick={()=>setTab("configure")}>Configure →</button>
              </div>
            </div>
          </div>

          <div style={{flex:1,overflowY:"auto",padding:"0 0 32px"}}>
            {features.map(f=>{
              const ft=chosen.filter(t=>t.feature===f);
              if(!ft.length)return null;
              return (
                <div key={f} className="annotate-group">
                  <div className="annotate-group-header">
                    <div className="feat-dot" style={{background:cmap[f]}}/>
                    <span>{f}</span>
                    <span style={{marginLeft:"auto",fontSize:12,color:"var(--text3)",fontFamily:"var(--mono)"}}>{ft.length} test{ft.length!==1?"s":""}</span>
                  </div>
                  {ft.map(t=>{
                    const meta=testMeta[t.key]||{};
                    const st=statusInfo(meta.status||"not_applicable");
                    const isExpAnn=expandedAnn.has(t.key);
                    const desc=descriptions[t.key];
                    const fetching=fetchingDesc.has(t.key);
                    return (
                      <div key={t.key}>
                        <div className="annotate-row">
                          <span className="test-key" style={{width:72,flexShrink:0}}>{t.isCustom?"CUSTOM":t.key}</span>
                          <span className="test-summary" style={{flex:1}}>{t.summary}</span>
                          <select className="status-select"
                            style={{background:st.bg,color:st.color,borderColor:st.border}}
                            value={meta.status||"not_applicable"}
                            onChange={e=>setMeta(t.key,"status",e.target.value)}>
                            {TEST_STATUSES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                          <input className="reason-input" placeholder="Reason (optional)"
                            value={meta.reason||""}
                            onChange={e=>setMeta(t.key,"reason",e.target.value)}/>
                          {!t.isCustom&&(
                            <button className={`desc-toggle ${isExpAnn?"open":""}`} title="Show description"
                              onClick={()=>toggleAnnDesc(t.key)}>
                              {fetching?<span className="spin spin-dark" style={{width:10,height:10}}/>:"▸"}
                            </button>
                          )}
                        </div>
                        {isExpAnn&&(
                          <div className="desc-panel" style={{margin:"0 0 0 0",borderTop:"1px solid var(--border)"}}>
                            {desc===undefined?<span className="spin spin-dark" style={{width:12,height:12}}/>
                              :<span style={{whiteSpace:"pre-wrap",lineHeight:1.6}}>{desc}</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ TAB 3 — CONFIGURE ══ */}
      {tab==="configure"&&(
        <div className="config-page">
          <div className="config-inner">
            <div className="fade-in">
              <div className="page-eyebrow">Step 3 of 3</div>
              <div className="page-title">Configure Execution</div>
              <div className="page-sub">{sel.size} tests · {[...new Set(chosen.map(t=>t.feature||"General"))].length} features</div>
            </div>

            {verifyState!=="idle"&&(
              <div className={`verify-banner ${verifyState} fade-in2`}>
                {verifyState==="checking"&&<span className="spin spin-dark"/>}
                {verifyState==="ok"&&"✓"}{verifyState==="fail"&&"⚠"}
                <span style={{flex:1}}>{verifyMsg}</span>
                {verifyState==="fail"&&<button className="btn btn-ghost btn-sm" onClick={runVerify}>Retry</button>}
              </div>
            )}

            {/* Mode indicator */}
            <div className={`card fade-in2 ${isEditMode?"card-edit":""}`}>
              <div className="card-body" style={{padding:"14px 18px"}}>
                {isEditMode ? (
                  <div className="mode-info-row">
                    <span className="mode-info-icon">✏️</span>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:"var(--blue-900)"}}>Editing execution <span style={{fontFamily:"var(--mono)",color:"var(--accent)"}}>{editExecKey}</span></div>
                      <div style={{fontSize:12,color:"var(--text2)"}}>Saving will update the statuses and Reason field of the {chosen.length} existing test subtasks in-place, then post a fresh report comment.</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={reset} style={{marginLeft:"auto",flexShrink:0}}>Cancel edit</button>
                  </div>
                ) : (
                  <div className="mode-info-row">
                    <span className="mode-info-icon">✨</span>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:"var(--blue-900)"}}>Creating new Test Execution</div>
                      <div style={{fontSize:12,color:"var(--text2)"}}>To edit an existing one instead, go to Tab 1 and use the "Load & Edit" bar at the top.</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Execution details */}
            <div className="card fade-in2">
              <div className="card-header"><span className="card-title">Execution details</span></div>
              <div className="card-body" style={{display:"flex",flexDirection:"column",gap:16}}>
                {!isEditMode&&(
                  <>
                    <div className="field-group">
                      <label className="field-label">Execution name</label>
                      <input className="field-input" value={execName} onChange={e=>setExecName(e.target.value)} placeholder={`[Test Execution] Bundle — ${new Date().toLocaleDateString()}`}/>
                    </div>
                    <div className="field-grid-2">
                      <div className="field-group">
                        <label className="field-label">Fix version <span>optional</span></label>
                        <input className="field-input" value={execVer} onChange={e=>setExecVer(e.target.value)} placeholder="e.g. v3.1.0"/>
                      </div>
                      <div className="field-group">
                        <label className="field-label">Description <span>optional</span></label>
                        <input className="field-input" value={execDesc} onChange={e=>setExecDesc(e.target.value)} placeholder="Brief description of this execution…"/>
                      </div>
                    </div>
                  </>
                )}
                <div className="field-grid-2">
                  <div className="field-group">
                    <label className="field-label">General conclusion</label>
                    <select className="field-input" value={conclusion} onChange={e=>{setConclusion(e.target.value);setReportText(buildReport(e.target.value,remarks,dutData,testMeta,chosen,otaSections));}}>
                      {CONCLUSIONS.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Link existing issue <span>optional</span></label>
                    <input className="field-input" value={linkedIssue} onChange={e=>setLinkedIssue(e.target.value.toUpperCase())} placeholder="e.g. QAT-42"/>
                  </div>
                </div>
                <div className="field-group">
                  <label className="field-label">Test remarks</label>
                  <textarea className="field-input field-textarea" rows={3} value={remarks}
                    onChange={e=>{setRemarks(e.target.value);setReportText(buildReport(conclusion,e.target.value,dutData,testMeta,chosen,otaSections));}}
                    placeholder="* AP mode was enabled by following the Confluence instructions"/>
                </div>
                <div className="field-group">
                  <label className="field-label">DUT data <span>optional</span></label>
                  <textarea className="field-input field-textarea field-mono" rows={3} value={dutData}
                    onChange={e=>{setDutData(e.target.value);setReportText(buildReport(conclusion,remarks,e.target.value,testMeta,chosen,otaSections));}}
                    placeholder='{ "id": "shellyduobulbg3-...", "mac": "...", "ver": "..." }'/>
                </div>
              </div>
            </div>

            {/* OTA Self-Test Sections */}
            <div className="card fade-in2">
              <div className="card-header"><span className="card-title">🔬 OTA Self-Test & OTA Results</span><span style={{fontSize:12,color:"var(--text3)"}}>Included in report comment</span></div>
              <div className="card-body" style={{display:"flex",flexDirection:"column",gap:16}}>
                {[
                  {key:"selfTestPassed",   label:"✅ Self-Test — Passed",        placeholder:"Notes on passed self-test scenarios…"},
                  {key:"selfTestFailed",   label:"❌ Self-Test — Failed",         placeholder:"Notes on failed self-test scenarios…"},
                  {key:"selfTestUnprovisioned", label:"⚠️ Self-Test — Unprovisioned", placeholder:"Notes on unprovisioned scenarios…"},
                  {key:"ota",              label:"📦 OTA",                        placeholder:"OTA test notes…"},
                ].map(({key,label,placeholder})=>(
                  <div key={key} className="field-group" style={{borderLeft:"3px solid var(--border)",paddingLeft:12}}>
                    <label className="field-label">{label}</label>
                    <textarea className="field-input field-textarea" rows={2}
                      value={otaSections[key]}
                      onChange={e=>{setOta(key,e.target.value);setReportText(buildReport(conclusion,remarks,dutData,testMeta,chosen,{...otaSections,[key]:e.target.value}));}}
                      placeholder={placeholder}/>
                  </div>
                ))}
              </div>
            </div>


            {/* Editable report */}
            <div className="card fade-in3">
              <div className="card-header">
                <span className="card-title">📋 Test Report</span>
                <span style={{fontSize:12,color:"var(--text3)"}}>Editable — posted as comment to execution{linkedIssue.trim()&&" and linked issue"}</span>
              </div>
              <div className="card-body">
                <textarea className="field-input field-textarea field-mono" rows={18}
                  value={reportText} onChange={e=>setReportText(e.target.value)}
                  style={{fontSize:12,lineHeight:1.7}}/>
              </div>
            </div>

            <div className="alert alert-info fade-in3">
              <span>ℹ</span>
              <span>
                {isEditMode
                  ? <>Updates <strong>{chosen.length} existing test subtasks</strong> in <strong>{editExecKey}</strong>: transitions each to its selected status and updates the Reason field in-place. No new issues will be created.</>
                  : <>Creates: <strong>1 Test Execution</strong> + <strong>{sel.size} Test subtasks</strong>. Each test will be transitioned to its selected status.</>
                }
                {linkedIssue.trim()&&<> Report comment will also be posted to <strong>{linkedIssue.trim().toUpperCase()}</strong>.</>}
              </span>
            </div>

            {phase==="creating"&&(
              <div className="progress-wrap">
                <div className="progress-label"><span>Working…</span><span>{prog}%</span></div>
                <div className="progress-bar"><div className="progress-fill" style={{width:`${prog}%`}}/></div>
              </div>
            )}
            {logLines.length>0&&<div className="log-box" ref={logRef}>{logLines.map((l,i)=><div key={i} className={l.cls}>{l.msg}</div>)}</div>}
            {phase==="error"&&<div className="alert alert-error">⚠ {cErr}</div>}

            <div className="action-row">
              <button className="btn btn-ghost" onClick={()=>setTab("annotate")}>← Back</button>
              <button className="btn btn-success" style={{flex:1}}
                disabled={phase==="creating"||verifyState==="fail"}
                onClick={handleCreate}>
                {phase==="creating"
                  ?<><span className="spin"/>Working…</>
                  :isEditMode
                    ?`✏️ Save changes to ${editExecKey} — ${chosen.length} tests`
                    :`⚡ Create in Jira — ${sel.size} tests`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB 4 — RESULT ══ */}
      {tab==="result"&&result&&(
        <div className="config-page">
          <div className="config-inner">
            <div className="result-hero fade-in">
              <div className="result-badge">{result.editMode?"✓ Tests Added":"✓ Execution Created"}</div>
              <div className="result-key">{result.execKey}</div>
              <div className="result-sub">{result.editMode?"Tests added to existing execution":"Successfully created in Jira"}</div>
              <div className="result-stats">
                <div className="stat-box"><div className="stat-val">{result.created.length}</div><div className="stat-lbl">Tests {result.editMode?"added":"created"}</div></div>
                <div className="stat-box"><div className="stat-val">{[...new Set(chosen.map(t=>t.feature))].length}</div><div className="stat-lbl">Features</div></div>
                <div className="stat-box"><div className={`stat-val ${result.failed?.length>0?"warn":""}`}>{result.failed?.length||0}</div><div className="stat-lbl">Failed</div></div>
              </div>
            </div>
            {result.issueKey&&(
              <div className="card fade-in2">
                <div className="card-header"><span className="card-title">🔗 Linked Issue</span></div>
                <div className="card-body" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                  <div>
                    <div style={{fontFamily:"var(--mono)",fontSize:16,fontWeight:700,color:"var(--accent)"}}>{result.issueKey}</div>
                    <div style={{fontSize:13,color:"var(--text2)",marginTop:2}}>Linked via "Relates to" · Report comment posted to both</div>
                  </div>
                  <a href={`https://${cfg.jiraDomain}/browse/${result.issueKey}`} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}>
                    <button className="btn btn-secondary btn-sm">Open Issue ↗</button>
                  </a>
                </div>
              </div>
            )}
            {result.failed?.length>0&&<div className="alert alert-warning">⚠ Failed: {result.failed.map(f=>f.original).join(", ")}</div>}
            {logLines.length>0&&<div className="log-box" ref={logRef}>{logLines.map((l,i)=><div key={i} className={l.cls}>{l.msg}</div>)}</div>}
            <div className="action-row fade-in2">
              <a href={`https://${cfg.jiraDomain}/browse/${result.execKey}`} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}>
                <button className="btn btn-primary">Open Execution ↗</button>
              </a>
              <button className="btn btn-ghost" onClick={reset}>New Execution</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
