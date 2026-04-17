import axios from "axios";
import { useState, useEffect, useRef } from "react";


/* ─── THEME ──────────────────────────────────────────────────────────── */
const C = {
  navy:"#0B1D3A", navyLight:"#162D58", gold:"#C8952A", cream:"#FAF8F3",
  white:"#FFFFFF", gray50:"#F7F6F2", gray100:"#EDEDEA", gray300:"#BDBDBD",
  gray500:"#737373", gray700:"#404040",
  green:"#1A7F5A", greenBg:"#E6F4EE", red:"#C0392B", redBg:"#FDECEA",
  amber:"#B45309", amberBg:"#FEF3C7", blue:"#1D4ED8", blueBg:"#EFF6FF",
  purple:"#7C3AED", purpleBg:"#F5F3FF", teal:"#0F766E", tealBg:"#F0FDFA",
};

/* ─── MOCK USERS — replace with real API call to Spring Boot ──────────
   POST /api/auth/login  { username, password }
   Returns: { token, user: { id, name, username, role } }
   ────────────────────────────────────────────────────────────────────── */


const STAGES = [
  "Application Received",
  "Document Verification",
  "Credit Assessment",
  "Sanction Letter Issued",
  "Agreement Signed",
  "Amount Disbursed",
];
const LOAN_ICONS = {
  salary:  { icon:"💼"},
  itr:     { icon:"📄"},
  pension: { icon:"🏛️"},
  agri:    { icon:"🌾"},
  housing: { icon:"🏠"},
  car:     { icon:"🚗"},
  bike:    { icon:"🏍️"},
  gold:    { icon:"✨"},
};


const REDIS_KEYS = [
  { key:"cibil:LN2024001",          value:"742",                        ttl:"3580s", type:"STRING",  hit:true  },
  { key:"cibil:LN2024002",          value:"801",                        ttl:"3490s", type:"STRING",  hit:true  },
  { key:"eligibility:salary:45000", value:'{"max":900000,"emi":19800}', ttl:"1800s", type:"JSON",    hit:true  },
  { key:"rateLimit:192.168.1.10",   value:"4/5 requests",               ttl:"55s",   type:"COUNTER", hit:false },
  { key:"session:user:deepansh",    value:"JWT_TOKEN_CACHED",           ttl:"900s",  type:"STRING",  hit:true  },
  { key:"fraud:blacklist:PAN001",   value:"BLACKLISTED",                ttl:"86400s",type:"STRING",  hit:true  },
];

/* ─── HELPERS ────────────────────────────────────────────────────────── */
function fmtINR(v) { return v ? "₹" + Number(v).toLocaleString("en-IN") : "₹0"; }
function calcEMI(p, r, t) {
  const mr = r / 1200;
  if (!p || !t || !mr) return 0;
  return Math.round(p * mr * Math.pow(1+mr,t) / (Math.pow(1+mr,t)-1));
}

/* ─── SHARED UI ──────────────────────────────────────────────────────── */
function Toast({ msg, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position:"fixed", bottom:24, right:24, background:C.navy, color:C.white, padding:"14px 20px", borderRadius:12, fontSize:14, zIndex:9999, boxShadow:"0 4px 24px rgba(0,0,0,0.25)", display:"flex", alignItems:"center", gap:10, maxWidth:360 }}>
      <span style={{ fontSize:18 }}>🔔</span><span style={{ flex:1 }}>{msg}</span>
      <button onClick={onClose} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:18 }}>×</button>
    </div>
  );
}
function Card({ children, style={}, onClick }) {  // ✅ add onClick
  return (
    <div 
      onClick={onClick}   // ✅ add onClick
      style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray100}`, padding:20, ...style }}>
      {children}
    </div>
  );
}
function Badge({ status }) {
  const m = { pending:{bg:C.amberBg,color:C.amber,label:"Pending"}, under_review:{bg:C.blueBg,color:C.blue,label:"Under Review"}, approved:{bg:C.greenBg,color:C.green,label:"Approved"}, rejected:{bg:C.redBg,color:C.red,label:"Rejected"}, disbursed:{bg:C.purpleBg,color:C.purple,label:"Disbursed"} };
  const s = m[status]||m.pending;
  return <span style={{ background:s.bg, color:s.color, fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:20 }}>{s.label}</span>;
}
function RiskBadge({ risk }) {
  const m = { Low:{bg:C.greenBg,color:C.green}, Medium:{bg:C.amberBg,color:C.amber}, High:{bg:C.redBg,color:C.red} };
  const s = m[risk]||m.Medium;
  return <span style={{ background:s.bg, color:s.color, fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:20 }}>⚡ {risk} Risk</span>;
}
function Title({ children, sub }) {
  return <div style={{ marginBottom:24 }}><h2 style={{ fontSize:22, fontWeight:700, color:C.navy }}>{children}</h2>{sub&&<p style={{ color:C.gray500, fontSize:13, marginTop:4 }}>{sub}</p>}</div>;
}
function Field({ label, children }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={{ fontSize:12, fontWeight:600, color:C.gray500 }}>{label}</label>
      {children}
    </div>
  );
}
function Input({ label, ...props }) {
  return (
    <Field label={label}>
      <input {...props} style={{ padding:"10px 12px", borderRadius:10, border:`1px solid ${C.gray100}`, fontSize:14, outline:"none", color:C.gray700, background:C.white, ...props.style }} />
    </Field>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   LOGIN PAGE
═══════════════════════════════════════════════════════════════════════ */
function LoginPage({ onLogin }) {
  const [duplicateErrors, setDuplicateErrors] = useState({ email: "", aadhaar: "", pan: ""});
  const [mode, setMode]       = useState("login"); // "login" or "signup"
  const [step, setStep]       = useState(1);        // 1, 2, 3
  const [form, setForm]       = useState({});
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  // ── LOGIN ──────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.username, password: form.password })
      });
     
      if(!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      localStorage.setItem("token", data.token);
      const user = {
        name: data.name || form.username,
        role: data.role.replace("ROLE_", "").toLowerCase(),
        token: data.token
      };
      localStorage.setItem("user", JSON.stringify(user));
      onLogin(user);
    } catch(err) {
      setError(err.message || "Login failed!");
    } finally { setLoading(false); }
  }
 async function handleStep1Next() {
  setError(""); setLoading(true);
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/check-duplicate?email=${form.username}&aadhaar=&pan=`);
    const data = await res.json();
    if (data.emailExists) {
      setDuplicateErrors(prev => ({ ...prev, email: "Email already registered." }));
      setLoading(false);
      return; // ⛔ stay on step 1
    }
  } catch (err) {
    setError("Could not verify. Try again.");
    setLoading(false);
    return;
  }
  setLoading(false);
  setStep(2); // ✅ move to step 2
}
async function handleStep2Next() {
  setError(""); setLoading(true);
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/check-duplicate?email=&aadhaar=${form.aadhaar}&pan=${form.pan}`);
    const data = await res.json();
    if (data.aadhaarExists || data.panExists) {
      setDuplicateErrors(prev => ({
        ...prev,
        aadhaar: data.aadhaarExists ? "Aadhaar already registered." : "",
        pan:     data.panExists     ? "PAN already registered."     : "",
      }));
      setLoading(false);
      return; // ⛔ stay on step 2
    }
  } catch (err) {
    setError("Could not verify. Try again.");
    setLoading(false);
    return;
  }
  setLoading(false);
  setStep(3); // ✅ move to step 3
}
  // ── SIGNUP ─────────────────────────────────────
  async function handleSignup() {
    setError(""); setLoading(true);

    try {
      
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      //  console.log("Login response:", res.json());
      const data = await res.json();
      
      if(!res.ok) {
        
        setError(data.message || "Signup failed!");
        setLoading(false);
        return;
      }
      // console.log("Login response:", res);
      alert("✅ Registration successful! Please login.");
      setMode("login");
      setStep(1);
      setForm({});
    } catch(err) {
      setError("Cannot reach server!");
    } finally { setLoading(false); }
  }

  // ── NEXT STEP ──────────────────────────────────
  function handleNext() {
    setError("");

    if(step === 1 ) {
      if(!form.name)     return setError("Name is required!");
      if(!form.username) return setError("Email is required!");
      if(!form.username.includes("@")) return setError("Enter valid email!");
      if(!form.password) return setError("Password is required!");
      if(!form.dob)      return setError("Date of Birth is required!");
      if(duplicateErrors.email) return;
      setStep(2);
    }

    else if(step === 2) {
      if(!form.aadhaar || form.aadhaar.length > 14|| form.aadhaar.length<14) return setError("Enter valid 12 digit Aadhaar!");
      if(!form.pan || form.pan.length !== 10)          return setError("Enter valid 10 digit PAN!");
      if(duplicateErrors.aadhaar || duplicateErrors.pan) return;
      setStep(3);
    }

    else if(step === 3) {
      if(!form.cibilScore) return setError("CIBIL Score is required!");
      if(form.cibilScore < 300 || form.cibilScore > 900) return setError("CIBIL Score must be between 300-900!");
      handleSignup();
    }
  }

  // ── RENDER ─────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:C.cream, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:"100%", maxWidth:420, padding:"0 16px" }}>

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:40, marginBottom:8 }}>🏦</div>
          <div style={{ fontSize:22, fontWeight:700, color:C.navy }}>LoanSmart AI</div>
          <div style={{ fontSize:13, color:C.gray500, marginTop:4 }}>
            {mode==="login" ? "Sign in to your account" : `Step ${step} of 3 — ${step===1?"Personal Info":step===2?"Documents":"CIBIL Score"}`}
          </div>
        </div>

        {/* Progress bar for signup */}
        {mode==="signup" && (
          <div style={{ display:"flex", gap:6, marginBottom:20 }}>
            {[1,2,3].map(s=>(
              <div key={s} style={{ flex:1, height:4, borderRadius:2, background:s<=step?C.navy:C.gray100, transition:"all 0.3s" }} />
            ))}
          </div>
        )}

        <div style={{ background:C.white, borderRadius:16, padding:28, border:`1px solid ${C.gray100}` }}>

          {/* ── LOGIN FORM ── */}
          {mode==="login" && (
            <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:C.gray500, display:"block", marginBottom:6 }}>Email</label>
                <input 
                  type="email"
                  placeholder="Enter your email"
                  value={form.username||""} 
                  onChange={e=>set("username",e.target.value)}
                  style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1px solid ${C.gray100}`,background: "#fff", fontSize:14, outline:"none", color:C.gray700, boxSizing:"border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:C.gray500, display:"block", marginBottom:6 }}>Password</label>
                <input 
                  type="password"
                  placeholder="Enter your password"
                  value={form.password||""} 
                  onChange={e=>set("password",e.target.value)}
                  style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1px solid ${C.gray100}`,background: "#fff", fontSize:14, outline:"none", color:C.gray700, boxSizing:"border-box" }}
                />
              </div>
              {error && <div style={{ color:C.red, fontSize:13 }}>❌ {error}</div>}
              <button type="submit" disabled={loading} style={{ padding:"12px", borderRadius:10, background:C.navy, color:C.white, border:"none", cursor:"pointer", fontWeight:700, fontSize:14, opacity:loading?0.6:1 }}>
                {loading ? "Signing in..." : "Sign In →"}
              </button>
              <div style={{ textAlign:"center", fontSize:13, color:C.gray500 }}>
                Don't have account?{" "}
                <span onClick={()=>{setMode("signup");setStep(1);setForm({});setError("");}} style={{ color:C.navy, fontWeight:600, cursor:"pointer" }}>
                  Sign Up
                </span>
              </div>
            </form>
          )}

          {/* ── SIGNUP STEP 1 — Personal Info ── */}
          {mode==="signup" && step===1 && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:C.gray500, display:"block", marginBottom:6 }}>Full Name *</label>
                <input placeholder="As per Aadhaar" value={form.name||""} onChange={e=>set("name",e.target.value)}
                  style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1px solid ${C.gray100}`, fontSize:14, outline:"none", color:C.white,backgroundColor:C.gray700, boxSizing:"border-box" }} />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:C.gray500, display:"block", marginBottom:6 }}>Email *</label>
                <input type="email" placeholder="yourname@email.com" value={form.username||""} onChange={e=>set("username",e.target.value)}
                onBlur={async (e) => {                                              // ✅ add this
               if(!e.target.value) return;
               const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/check-duplicate?field=email&value=${e.target.value}`);
               const data = await res.json();
               setDuplicateErrors(prev => ({ ...prev, email: data.exists ? "Email already registered." : "" }));
               }}
                style={{ width:"100%", padding:"11px 14px", borderRadius:10,  border:`1px solid ${duplicateErrors.email ? "#e53e3e" : C.gray100}`, fontSize:14, outline:"none", color:C.white,backgroundColor:C.gray700, boxSizing:"border-box" }} />
                {duplicateErrors.email && (
                <p style={{ color:"#e53e3e", fontSize:11, marginTop:4, marginBottom:0 }}>
                  ⚠ {duplicateErrors.email}
               </p>
                 )}
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:C.gray500, display:"block", marginBottom:6 }}>Password *</label>
                <input type="password" placeholder="Min 8 characters" value={form.password||""} onChange={e=>set("password",e.target.value)}
                  style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1px solid ${C.gray100}`, fontSize:14, outline:"none", color:C.white,backgroundColor:C.gray700, boxSizing:"border-box" }} />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:C.gray500, display:"block", marginBottom:6 }}>Date of Birth *</label>
               <input   type="date"   value={form.dob||""} 
                onChange={e=>set("dob",e.target.value)}   min="1924-01-01"     
                max="2006-12-31" style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1px solid ${C.gray100}`, fontSize:14, outline:"none", color:C.white,backgroundColor:C.gray700, boxSizing:"border-box" }} />
               </div>
              {error && <div style={{ color:C.red, fontSize:13 }}>❌ {error}</div>}
              <button onClick={handleNext} disabled={loading} style={{ padding:"12px", borderRadius:10, background:C.navy, color:C.white, border:"none", cursor:"pointer", fontWeight:700, fontSize:14 }}>
                Next → Documents
              </button>
              <div style={{ textAlign:"center", fontSize:13, color:C.gray500 }}>
                Already have account?{" "}
                <span onClick={()=>{setMode("login");setStep(1);setForm({});setError("");}} style={{ color:C.navy, fontWeight:600, cursor:"pointer" }}>
                  Sign In
                </span>
              </div>
            </div>
          )}

          {/* ── SIGNUP STEP 2 — Documents ── */}
          {mode==="signup" && step===2 && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ background:C.blueBg, borderRadius:10, padding:12, fontSize:12, color:C.blue, fontWeight:500 }}>
                🔐 Your documents are encrypted and stored securely
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:C.gray500, display:"block", marginBottom:6 }}>Aadhaar Number *</label>
                <input 
  placeholder="XXXX XXXX XXXX" 
  maxLength={14}
  value={form.aadhaar||""} 
  onChange={e => {
    const raw = e.target.value.replace(/\s/g, "");  // remove spaces
    if(!/^\d*$/.test(raw)) return;                   // only numbers
    const formatted = raw.match(/.{1,4}/g)?.join(" ") || raw;  // add space every 4
    set("aadhaar", formatted);
  }}
  onBlur={async (e) => {
    const clean = e.target;
    
    if(clean.value.length !== 14) return;
    console.log(clean.value.length);
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/check-duplicate?field=aadhaar&value=${clean.value}`);
    const data = await res.json();
    setDuplicateErrors(prev => ({ ...prev, aadhaar: data.exists ? "Aadhaar already registered." : "" }));
  }}
  style={{ width:"100%", padding:"11px 14px", borderRadius:10,
    border:`1px solid ${duplicateErrors.aadhaar ? "#e53e3e" : C.gray100}`, 
    fontSize:14, outline:"none", color:C.white, backgroundColor:C.gray700, boxSizing:"border-box" }} 
/>
{duplicateErrors.aadhaar && <p style={{ color:"red", fontSize:"12px" }}>{duplicateErrors.aadhaar}</p>}
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:C.gray500, display:"block", marginBottom:6 }}>PAN Number *</label>
                <input placeholder="ABCDE1234F" maxLength={10} value={form.pan||""} onChange={e=>set("pan",e.target.value.toUpperCase())}
                  onBlur={async (e) => {
    if(e.target.value.length !== 10) return; // only check if valid length
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/check-duplicate?field=pan&value=${e.target.value}`);
    const data = await res.json();
    setDuplicateErrors(prev => ({ ...prev, pan: data.exists ? "PAN already registered." : "" }));
  }}
                  style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1px solid ${duplicateErrors.pan ? "#e53e3e" : C.gray100}`, fontSize:14, outline:"none", color:C.white,backgroundColor:C.gray700, boxSizing:"border-box" }} />
                {duplicateErrors.pan && <p style={{ color:"#e53e3e", fontSize:11, marginTop:4, marginBottom:0 }}>⚠ {duplicateErrors.pan}</p>} {/* ✅ added */}
              </div>
              {error && <div style={{ color:C.red, fontSize:13 }}>❌ {error}</div>}
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={()=>setStep(1)} style={{ flex:1, padding:"12px", borderRadius:10, background:C.gray100, color:C.gray700, border:"none", cursor:"pointer", fontWeight:600, fontSize:14 }}>
                  ← Back
                </button>
                <button onClick={handleNext} style={{ flex:2, padding:"12px", borderRadius:10, background:C.navy, color:C.white, border:"none", cursor:"pointer", fontWeight:700, fontSize:14 }}>
                  Next → CIBIL Score
                </button>
              </div>
            </div>
          )}

          {/* ── SIGNUP STEP 3 — CIBIL ── */}
          {mode==="signup" && step===3 && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ background:C.amberBg, borderRadius:10, padding:12, fontSize:12, color:C.amber, fontWeight:500 }}>
                ⚠️ In real world CIBIL is fetched automatically. Enter your score for demo purposes.
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:C.gray500, display:"block", marginBottom:6 }}>CIBIL Score * (300-900)</label>
                <input type="number" min={300} max={900} placeholder="Enter your CIBIL score" value={form.cibilScore||""} onChange={e=>set("cibilScore",+e.target.value)}
                  style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1px solid ${C.gray100}`, fontSize:14, outline:"none", color:C.gray700, boxSizing:"border-box" }} />
              </div>
              {/* Score indicator */}
              {form.cibilScore>0 && (
                <div style={{ background:form.cibilScore>=750?C.greenBg:form.cibilScore>=650?C.amberBg:C.redBg, borderRadius:10, padding:12, textAlign:"center" }}>
                  <div style={{ fontSize:28, fontWeight:700, color:form.cibilScore>=750?C.green:form.cibilScore>=650?C.amber:C.red }}>{form.cibilScore}</div>
                  <div style={{ fontSize:12, color:form.cibilScore>=750?C.green:form.cibilScore>=650?C.amber:C.red, fontWeight:600 }}>
                    {form.cibilScore>=750?"Excellent ✅":form.cibilScore>=700?"Good 👍":form.cibilScore>=650?"Fair ⚠️":"Poor ❌"}
                  </div>
                </div>
              )}
              {error && <div style={{ color:C.red, fontSize:13 }}>❌ {error}</div>}
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={()=>setStep(2)} style={{ flex:1, padding:"12px", borderRadius:10, background:C.gray100, color:C.gray700, border:"none", cursor:"pointer", fontWeight:600, fontSize:14 }}>
                  ← Back
                </button>
                <button onClick={handleNext} disabled={loading} style={{ flex:2, padding:"12px", borderRadius:10, background:C.green, color:C.white, border:"none", cursor:"pointer", fontWeight:700, fontSize:14, opacity:loading?0.6:1 }}>
                  {loading ? "Registering..." : "✅ Complete Registration"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
/* ═══════════════════════════════════════════════════════════════════════
   AI CHAT
═══════════════════════════════════════════════════════════════════════ */
function AIChat({ ctx="" }) {
  const [msgs, setMsgs] = useState([{ role:"assistant", text: "Hi! I'm your Loan Advisor 👋 What kind of loan are you looking for today?"  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  useEffect(()=>{ endRef.current?.scrollIntoView({ behavior:"smooth" }); },[msgs]);

async function send() {
  if (!input.trim()) return;
  const txt = input.trim(); setInput("");
  setMsgs(p=>[...p,{ role:"user", text:txt }]);
  setLoading(true);
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai/chat`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        prompt: txt  ,
        history:msgs// ← sends prompt to Spring Boot
      })
    });
    const data = await res.json();
    setMsgs(p=>[...p,{ role:"assistant", text:data.text||"Unable to respond." }]);
  } catch { 
    setMsgs(p=>[...p,{ role:"assistant", text:"Connection error. Is Spring Boot running?" }]); 
  }
  setLoading(false);
}
  return (
    <div style={{ display:"flex", flexDirection:"column", height:440, background:C.white, borderRadius:16, border:`1px solid ${C.gray100}`, overflow:"hidden" }}>
      <div style={{ background:C.navy, padding:"14px 18px", display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:36, height:36, borderRadius:"50%", background:C.gold, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🤖</div>
        <div><div style={{ color:C.white, fontWeight:600, fontSize:14 }}>AI Loan Advisor</div><div style={{ color:"rgba(255,255,255,0.6)", fontSize:11 }}>Powered by Claude AI</div></div>
        <div style={{ marginLeft:"auto", width:8, height:8, borderRadius:"50%", background:"#22c55e" }} />
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:16, display:"flex", flexDirection:"column", gap:12, background:C.gray50 }}>
        {msgs.map((m,i)=>(
          <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
            <div style={{ flex:1, padding:"10px 14px", borderRadius:24, border:`1px solid ${C.gray100}`, fontSize:13, outline:"none", background:C.gray50, color:C.gray700 }}>{m.text}</div>
          </div>
        ))}
        {loading&&<div style={{ display:"flex", gap:5, padding:"10px 14px", background:C.white, borderRadius:"18px 18px 18px 4px", width:"fit-content", border:`1px solid ${C.gray100}` }}>{[0,1,2].map(i=><div key={i} style={{ width:7, height:7, borderRadius:"50%", background:C.gray300, animation:`bounce 1.2s ${i*0.2}s infinite` }} />)}</div>}
        <div ref={endRef} />
      </div>
      <div style={{ padding:"12px 14px", borderTop:`1px solid ${C.gray100}`, display:"flex", gap:8, background:C.white }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask about eligibility, EMI, CIBIL..." style={{ flex:1, padding:"10px 14px", borderRadius:24, border:`1px solid ${C.gray100}`, fontSize:13, outline:"none", background:C.gray50, color:C.gray700 }} />
        <button onClick={send} disabled={loading||!input.trim()} style={{ width:40, height:40, borderRadius:"50%", background:C.navy, border:"none", cursor:"pointer", color:C.white, fontSize:16, opacity:(!input.trim()||loading)?0.5:1 }}>→</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ANALYTICS
═══════════════════════════════════════════════════════════════════════ */
function Analytics({ apps,loanTypes }) {
  const approved = apps.filter(a=>["approved","disbursed"].includes(a.status)).length;
  const totalAmt = apps.filter(a=>["approved","disbursed"].includes(a.status)).reduce((s,a)=>s+a.amount,0);
  const loanDist = (loanTypes||[]).map(lt=>({ label:lt.label, icon:lt.icon, count:apps.filter(a=>a.type===lt.label).length })).filter(x=>x.count>0); 
  const maxCount = Math.max(...loanDist.map(x=>x.count),1);

  return (
    <div>
      <Title >📊 Analytics Dashboard</Title>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:24 }}>
        {[
          { icon:"📁", label:"Total Applications", value:apps.length,                                   color:C.navy   },
          { icon:"✅", label:"Approved/Disbursed",  value:approved,                                     color:C.green  },
          { icon:"⏳", label:"Pending Review",       value:apps.filter(a=>a.status==="pending").length, color:C.amber  },
          { icon:"🚨", label:"High Risk Flagged",    value:apps.filter(a=>a.risk==="High").length,      color:C.red    },
          { icon:"💰", label:"Total Sanctioned",     value:fmtINR(totalAmt),                            color:C.purple },
        ].map((s,i)=>(
          <Card key={i} style={{ padding:"16px 18px" }}>
            <div style={{ fontSize:22, marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontSize:20, fontWeight:700, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:C.gray500, marginTop:2 }}>{s.label}</div>
          </Card>
        ))}
      </div>
     <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
  <Card>
    <div style={{ fontWeight:600, color:C.navy, fontSize:14, marginBottom:16 }}>📈 Loan Distribution</div>
    {loanDist.length === 0 
      ? <div style={{ color:C.gray500, fontSize:13 }}>No loan data yet</div>
      : loanDist.map((lt,i)=>(
          <div key={i} style={{ marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:4 }}>
              <span style={{ color:C.gray700 }}>{lt.icon} {lt.label}</span>
              <span style={{ fontWeight:600, color:C.navy }}>{lt.count}</span>
            </div>
            <div style={{ height:8, background:C.gray100, borderRadius:4, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${(lt.count/maxCount)*100}%`, background:C.navy, borderRadius:4, transition:"width 0.6s" }} />
            </div>
          </div>
        ))
    }
  </Card>
        <Card>
          <div style={{ fontWeight:600, color:C.navy, fontSize:14, marginBottom:16 }}>📋 Status Pipeline</div>
          {[
            { label:"Pending",      count:apps.filter(a=>a.status==="pending").length,      color:C.amber,  bg:C.amberBg  },
            { label:"Under Review", count:apps.filter(a=>a.status==="under_review").length, color:C.blue,   bg:C.blueBg   },
            { label:"Approved",     count:apps.filter(a=>a.status==="approved").length,     color:C.green,  bg:C.greenBg  },
            { label:"Disbursed",    count:apps.filter(a=>a.status==="disbursed").length,    color:C.purple, bg:C.purpleBg },
            { label:"Rejected",     count:apps.filter(a=>a.status==="rejected").length,     color:C.red,    bg:C.redBg    },
          ].map((s,i)=>(
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", background:s.bg, borderRadius:10, marginBottom:8 }}>
              <span style={{ fontSize:13, color:s.color, fontWeight:500 }}>{s.label}</span>
              <span style={{ fontSize:18, fontWeight:700, color:s.color }}>{s.count}</span>
            </div>
          ))}
        </Card>
      </div>
      <Card>
        <div style={{ fontWeight:600, color:C.navy, fontSize:14, marginBottom:14 }}>🕐 Recent Applications</div>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr style={{ background:C.gray50 }}>{["App ID","Applicant","Type","Amount","CIBIL","Risk","Status"].map(h=><th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:11, fontWeight:600, color:C.gray500, borderBottom:`1px solid ${C.gray100}` }}>{h}</th>)}</tr></thead>
          <tbody>{apps.slice(0,6).map((a,i)=>(
            <tr key={a.id} style={{ borderBottom:`1px solid ${C.gray50}` }}>
              <td style={{ padding:"10px 12px", fontSize:12, color:C.navy, fontWeight:500 }}>{a.id}</td>
              <td style={{ padding:"10px 12px", fontSize:13, color:C.gray700 }}>{a.applicant}</td>
              <td style={{ padding:"10px 12px", fontSize:12, color:C.gray500 }}>{a.type}</td>
              <td style={{ padding:"10px 12px", fontSize:13, fontWeight:600, color:C.navy }}>{fmtINR(a.appliedAmt)}</td>
              <td style={{ padding:"10px 12px", fontSize:13, fontWeight:600, color:a.score>=750?C.green:a.score>=650?C.amber:C.red }}>{a.score}</td>
              <td style={{ padding:"10px 12px" }}><RiskBadge risk={a.risk}/></td>
              <td style={{ padding:"10px 12px" }}><Badge status={a.status}/></td>
            </tr>
          ))}</tbody>
        </table>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   APPLY LOAN
═══════════════════════════════════════════════════════════════════════ */

function getMaxAmount(loanType, income) {
  const inc = Number(income);
  switch(loanType) {
    case "salary"  : return inc * 60;
    case "itr"     : return inc * 30;
    case "pension" : return inc * 40;
    case "agri"    : return inc * 10;
    case "housing" : return inc * 80;
    case "car"     : return inc * 90;  // 90% of vehicle price
    case "bike"    : return inc * 85;
    case "gold"    : return inc * 75;
    default        : return 0;
  }
}

function ApplyLoan({ onNotify ,loanTypes}) {
  const [loading, setLoading] = useState(false);
  const [step,setStep]     = useState(0);
  const [lt,setLt]         = useState(null);
  const [form,setForm]     = useState({});
  const [tenure,setTenure] = useState(24);
  const [tab,setTab]       = useState("form");
  const [done,setDone]     = useState(false);
  const [error, setError]         = useState(null);
  const [emiDone, setEmiDone]   = useState(false);
  const [kycDone, setKycDone]   = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
    useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/user/profile`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    })
    .then(res => res.json())
    .then(data => {
      // console.log("Profile:", data);
      set("name", data.name.substring(0, data.name.indexOf("@"))); // first name
      set("dob",  data.dob);
    })
    .catch(err => console.error("Profile fetch failed:", err))
  }, []);
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));
  // console.log(form.income, lt); // ← ADD
  const ea=(()=>{ if(!lt)return 0;
  const base=parseFloat(form.income)||0; 
  return ["salary","pension","itr","agri"].includes(lt.id)
  ?base*lt.mult
  :base*lt.mult/100; 
   })();
  // console.log("Eligible Amount (ea):", ea); // ← ADD
  const emi=calcEMI(ea,lt?.rate||10,tenure);
  const loanAmt=parseFloat(form.appliedAmt)||ea;
  const cEmi=calcEMI(loanAmt,lt?.rate||10,tenure);
  const handleSubmit = async () => {
  
    if(!form.name || !form.mobile || !form.panKyc || !form.income) {
      alert("Please fill Name, Mobile, PAN and Income!");
      return;
    }
    if(!emiDone) {
      alert("Please calculate EMI first! Go to 🧮 EMI Calc tab.");
      return;
    }
    if(!kycDone) {
      alert("Please complete KYC verification first! Go to 🪪 KYC tab.");
      return;
    }
    const maxAmt = getMaxAmount(lt.id, form.income);
    if(Number(form.loanAmt) > maxAmt) {
      alert(`Loan amount exceeds maximum eligible amount of ₹${maxAmt.toLocaleString("en-IN")}!`);
      return;
    }
  const payload = {
    loanTypeId: lt.id,
    applicantName: form.name,
    mobile: form.mobile,
    pan: form.panKyc,
    dob: form.dob,
    income: form.income,
    employer: form.employer,
    empType: form.empType,
    tenure: tenure,
    eligibleAmount: ea,
    appliedAmt: form.loanAmt,
    emi: emi
  };
  try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/loans/apply`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`,
                 "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if(res.ok) {
      setDone(true);
      onNotify?.("🎉 Application submitted successfully!");
    } else {
      alert("Loan Type is already applied by you earlier.");
    }
  } catch(err) {
    console.error("Submit error:", err);
    alert("Cannot reach server. Is Spring Boot running?");
  }
};
const handleSendOtp = async () => {
  // console.log("form.mobile:", form.mobile); // ← ADD
  // console.log("full form:", form);
  if(!form.mobile || form.mobile.length !== 10) {
    alert("Please enter valid 10 digit mobile number!");
    return;
  }
  try {
    const token = localStorage.getItem("token"); // ← get JWT
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/otp/send`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" ,
        "Authorization": `Bearer ${token}`},
      body: JSON.stringify({ mobile: form.mobile })
    });
    const data = await res.json();
    if(res.ok) {
      set("otpSent", true);
      alert("OTP sent! Check your Spring Boot console.");
    } else {
      alert(data.message);
    }
  } catch(err) {
    alert("Cannot reach server. Is Spring Boot running?");
  }
};

const handleVerifyOtp = async () => {
  if(!form.otp) {
    alert("Please enter OTP!");
    return;
  }
  try {
    const token = localStorage.getItem("token"); // ← get JWT
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/otp/verify`, {
      method: "POST",
      headers: { 

        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
       },
      body: JSON.stringify({ mobile: form.mobile, otp: form.otp })
    });
    const data = await res.json();
    // console.log(data);
    if(data.verified) {
      setMobileVerified(true);
      set("otpSent", false);
      alert("✅ Mobile verified successfully!");
    } else {
      alert("❌ " + data.message);
    }
  } catch(err) {
    alert("Cannot reach server!");
  }
};

// ← already exists

 

  if(done) return (
    <div style={{ textAlign:"center", padding:"60px 20px" }}>
      <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
      <h2 style={{ fontSize:24, fontWeight:700, color:C.navy, marginBottom:8 }}>Application Submitted!</h2>
      <p style={{ color:C.gray500, marginBottom:6 }}>Your application is under review.</p>
      <p style={{ color:C.gray500, fontSize:13, marginBottom:24 }}>Checker will review within 24 hours. You'll receive SMS + Email updates at each stage.</p>
      <button onClick={()=>{setDone(false);setStep(0);setLt(null);setForm({});}} style={{ padding:"12px 28px", borderRadius:12, background:C.navy, color:C.white, border:"none", cursor:"pointer", fontWeight:600, fontSize:14 }}>Apply Another Loan</button>
    </div>
  );

  return (
    <div>
      <Title >📝 Apply for a Loan</Title>
      {step===0&&(
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
          {loading && <p>Loading loan types...</p>}
          {loanTypes.map(item=>(
            <div key={item.id} onClick={()=>{setLt(item);setStep(1);}} style={{ background:C.white, borderRadius:16, padding:20, border:`1px solid ${C.gray100}`, cursor:"pointer", transition:"all 0.2s" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.navy;e.currentTarget.style.transform="translateY(-3px)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.gray100;e.currentTarget.style.transform="none";}}>
              <div style={{ fontSize:34, marginBottom:10 }}>{item.icon}</div>
              <div style={{ fontWeight:600, color:C.navy, fontSize:14, marginBottom:4 }}>{item.lable}</div>
              <div style={{ fontSize:11, color:C.gray500, marginBottom:8 }}>{item.description}</div>
              <div style={{ fontSize:11, color:C.gold, fontWeight:600 }}>{item.rate}% p.a.</div>
            </div>
          ))}
        </div>
      )}
      {step===1&&lt&&(
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
            <button onClick={()=>setStep(0)} style={{ background:"none", border:`1px solid ${C.gray100}`, borderRadius:8, padding:"6px 14px", cursor:"pointer", fontSize:13, color:C.gray500 }}>← Back</button>
            <span style={{ fontSize:24 }}>{lt.icon}</span>
            <div><div style={{ fontWeight:700, color:C.navy, fontSize:16 }}>{lt.label}</div><div style={{ fontSize:12, color:C.gray500 }}>{lt.rate}% p.a.</div></div>
          </div>
          <div style={{ display:"flex", gap:8, marginBottom:20 }}>
            {["form","calculator","kyc"].map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{ padding:"8px 18px", borderRadius:20, border:"none", cursor:"pointer", fontSize:13, fontWeight:500, background:tab===t?C.navy:C.gray100, color:tab===t?C.white:C.gray700, transition:"all 0.2s" }}>
                {t==="form"?"📝 Application":t==="calculator"?"🧮 EMI Calc":"🪪 KYC"}
              </button>
            ))}
          </div>
          {tab==="form"&&(
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <Input label="Full Name" placeholder="As per Aadhaar" value={form.name||""} onChange={e=>set("name",e.target.value)} disabled={true} style={{ background:"#f5f5f5", cursor:"not-allowed" }} />
              <div>
  <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
    <Input 
      label="Mobile Number" 
      placeholder="10-digit number" 
      value={form.mobile||""} 
      onChange={e=>{ set("mobile",e.target.value); setMobileVerified(false); }} 
    />
    <button onClick={handleSendOtp} style={{ padding:"10px 16px", borderRadius:10, background:mobileVerified?C.green:C.navy, color:C.white, border:"none", cursor:"pointer", fontWeight:600, fontSize:13, whiteSpace:"nowrap" }}>
      {mobileVerified?"✅ Verified":"Send OTP"}
    </button>
  </div>

  {/* OTP input appears after Send OTP clicked */}
  {form.otpSent && !mobileVerified &&(
    <div style={{ display:"flex", gap:8, marginTop:8 }}>
      <Input 
        label="Enter OTP" 
        placeholder="Check Spring Boot console" 
        value={form.otp||""} 
        onChange={e=>set("otp",e.target.value)} 
      />
      <button onClick={handleVerifyOtp} style={{ padding:"10px 16px", borderRadius:10, background:C.navy, color:C.white, border:"none", cursor:"pointer", fontWeight:600, fontSize:13 }}>
        Verify
      </button>
    </div>
  )}
</div>
              <Input label="Date of Birth" placeholder="DD/MM/YYYY" value={form.dob||""} onChange={e=>set("dob",e.target.value)} disabled={true} style={{ background:"#f5f5f5", cursor:"not-allowed" }} />
              <Input label={lt.id==="pension"?"Monthly Pension (₹)":lt.id==="itr"?"Annual Income (₹)":"Monthly Salary (₹)"} type="number" placeholder="Amount in ₹" value={form.income||""} onChange={e=>set("income",e.target.value)} />
              <Input label="Employer / Business" placeholder="Organisation name" value={form.employer||""} onChange={e=>set("employer",e.target.value)} />
              <Field label={`Loan Tenure: ${tenure} months`}>
                <input type="range" min={6} max={360} step={6} value={tenure} onChange={e=>setTenure(+e.target.value)} style={{ accentColor:C.navy }} />
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.gray300 }}><span>6 months</span><span>30 years</span></div>
              </Field>
              <Field label="Employment Type">
                <select value={form.empType||""} onChange={e=>set("empType",e.target.value)} style={{ padding:"10px 12px", borderRadius:10, border:`1px solid ${C.gray100}`, fontSize:14, outline:"none", color:C.gray100  }}>
                  <option value="">Select...</option><option>Salaried</option><option>Self-Employed</option><option>Pensioner</option><option>Farmer</option>
                </select>
              </Field>
              {ea>0&&(
                <div style={{ gridColumn:"1/-1", background:C.greenBg, borderRadius:12, padding:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div><div style={{ fontSize:12, color:C.green, fontWeight:500 }}>Eligible Loan Amount</div><div style={{ fontSize:26, fontWeight:700, color:C.green }}>{fmtINR(ea)}</div></div>
                  <div style={{ textAlign:"right" }}><div style={{ fontSize:12, color:C.green }}>Monthly EMI</div><div style={{ fontSize:20, fontWeight:700, color:C.green }}>{fmtINR(emi)}</div></div>
                </div>
              )}
             
            </div>
          )}
          {tab==="calculator"&&(
            <div style={{ display:"flex", flexDirection:"column", gap:16, maxWidth:600 }}>
            <Card>
  <label style={{ fontSize:13, fontWeight:600, color:C.gray500, display:"block", marginBottom:8 }}>Loan Amount (₹)</label>
  <input     type="number" placeholder="Enter amount" value={form.loanAmt||""} onChange={e => {
      console.log(e.target.value);
      set("loanAmt", e.target.value);
    }}
    style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:`1px solid ${C.gray100}`, fontSize:16, outline:"none" }} 
  />
 
  {form.loanAmt && form.income && lt && (() => {
    // console.log(form.loanAmt, form.income, lt);
    const maxAmt = getMaxAmount(lt.id, form.income);
    if(Number(form.loanAmt) > maxAmt) {
      return <p style={{ color:"#e53e3e", fontSize:12, marginTop:4 }}>
        ⚠ Max eligible amount is ₹{maxAmt.toLocaleString("en-IN")}
      </p>
    }
  })()}
</Card>
              <Card>
                <label style={{ fontSize:13, fontWeight:600, color:C.gray500, display:"block", marginBottom:8 }}>Tenure: {tenure} months</label>
                <input type="range" min={6} max={360} step={6} value={tenure} onChange={e=>setTenure(+e.target.value)} style={{ width:"100%", accentColor:C.navy }} />
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.gray300, marginTop:4 }}><span>6 months</span><span>30 years</span></div>
              </Card>
              {cEmi>0&&(
                <>
                {!emiDone && setEmiDone(true)}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                  {[{label:"Monthly EMI",value:fmtINR(cEmi),h:true},{label:"Total Payable",value:fmtINR(cEmi*tenure)},{label:"Total Interest",value:fmtINR(cEmi*tenure-loanAmt)}].map((c,i)=>(
                    <div key={i} style={{ background:c.h?C.navy:C.gray50, borderRadius:12, padding:16, textAlign:"center" }}>
                      <div style={{ fontSize:11, color:c.h?"rgba(255,255,255,0.6)":C.gray500, marginBottom:4 }}>{c.label}</div>
                      <div style={{ fontSize:16, fontWeight:700, color:c.h?C.gold:C.navy }}>{c.value}</div>
                    </div>
                  ))}
                </div>
                </>
              )}
              <div style={{ background:C.amberBg, borderRadius:10, padding:12, fontSize:12, color:C.amber }}>⚠️ Rate: {lt.rate}% p.a. — Final rate subject to CIBIL score and RBI guidelines.</div>
            </div>
          )}
          {tab==="kyc"&&(
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, maxWidth:700 }}>
              <Card style={{ gridColumn:"1/-1", background:C.blueBg, border:`1px solid ${C.blue}30` }}>
                <div style={{ fontSize:13, color:C.blue, fontWeight:600, marginBottom:4 }}>🔐 KYC Verification</div>
              </Card>
              <div>
  <label style={{ fontSize:13, fontWeight:600, color:C.gray500, display:"block", marginBottom:6 }}>Aadhaar Number</label>
  <input
    placeholder="XXXX XXXX XXXX"
    maxLength={14}
    value={form.aadhaar||""}
    onChange={e => {
      const raw = e.target.value.replace(/\s/g, "");
      if(!/^\d*$/.test(raw)) return;
      const formatted = raw.match(/.{1,4}/g)?.join(" ") || raw;
      set("aadhaar", formatted);
    }}
    style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:`1px solid ${C.gray100}`, fontSize:14, outline:"none", boxSizing:"border-box" }}
  />
</div>

<div>
  <label style={{ fontSize:13, fontWeight:600, color:C.gray500, display:"block", marginBottom:6 }}>PAN Number</label>
  <input
    placeholder="ABCDE1234F"
    maxLength={10}
    value={form.panKyc||""}
    onChange={e => set("panKyc", e.target.value.toUpperCase())}
    style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:`1px solid ${C.gray100}`, fontSize:14, outline:"none", boxSizing:"border-box" }}
  />
</div>
              <div style={{ gridColumn:"1/-1" }}>
                <button onClick={async ()=>{
  if(!form.aadhaar || !form.panKyc) {
    alert("Please enter Aadhaar and PAN number!");
    return;
  }
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/kyc/verify`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ aadhaar: form.aadhaar, pan: form.panKyc })
    });
    const data = await res.json();
    
    // console.log("KYC Response:", data); // ← check F12 console
    if(data.verified) {
      set("kycDone", true);
      setKycDone(true);
      alert("✅ " + data.message);
    } else {
      alert("❌ " + data.message);
    }
  } catch(err) {
    alert("Cannot reach server. Is Spring Boot running?");
  }
}} style={{ width:"100%", padding:12, borderRadius:12, background:form.kycDone?C.green:C.navy, color:C.white, border:"none", cursor:"pointer", fontWeight:600, fontSize:14 }}>
  {form.kycDone?"✅ KYC Verified!":"Verify via Aadhaar OTP →"}
</button>
              </div>
              {form.kycDone&&(
                <>
                 <div style={{ gridColumn:"1/-1", background:C.greenBg, borderRadius:12, padding:14, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
      {["Aadhaar Verified ✅","PAN Linked ✅","Mobile Verified ✅"].map((t,i)=><div key={i} style={{ fontSize:12, color:C.green, fontWeight:500 }}>{t}</div>)}
    </div>

    {/* ← ADD THIS SUBMIT BUTTON */}
    <div style={{ gridColumn:"1/-1", marginTop:8 }}>
      <button onClick={handleSubmit} style={{ width:"100%", padding:14, borderRadius:12, background:C.navy, color:C.white, border:"none", cursor:"pointer", fontWeight:700, fontSize:15 }}>
        Submit Application →
      </button>
    </div>
    </>
               
              )}
            </div>
          )}
         
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CIBIL SIMULATOR
═══════════════════════════════════════════════════════════════════════ */
function CIBILSimulator() {
  const [f,setF]           = useState({ payment:85, utilization:40, age:5, inquiries:2, mix:3 });
  const [aiTip,setAiTip]   = useState("");
  const [loading,setLoading] = useState(false);
  const score = Math.min(900,Math.max(300,Math.round(300+(f.payment/100)*250+((100-f.utilization)/100)*150+Math.min(f.age/10,1)*100+Math.max(0,(5-f.inquiries)/5)*100+Math.min(f.mix/5,1)*100)));
  const sc = score>=750?C.green:score>=650?C.amber:C.red;
  const sl = score>=750?"Excellent":score>=700?"Good":score>=650?"Fair":"Poor";

  async function getAITip() {
    setLoading(true); setAiTip("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{ "Content-Type":"application/json", "x-api-key":process.env.REACT_APP_ANTHROPIC_KEY||"", "anthropic-version":"2023-06-01" },
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:400, system:"You are a CIBIL expert for India. Give 3 specific bullet-point tips to improve the credit score.", messages:[{role:"user",content:`CIBIL: ${score} (${sl}). Payment: ${f.payment}%, Utilization: ${f.utilization}%, Age: ${f.age}yr, Inquiries: ${f.inquiries}, Mix: ${f.mix}.`}] })
      });
      const data = await res.json(); setAiTip(data.content?.[0]?.text||"");
    } catch { setAiTip("Add REACT_APP_ANTHROPIC_KEY in .env to get AI tips."); }
    setLoading(false);
  }

  return (
    <div>
      <Title sub="Simulate how financial decisions impact your CIBIL score">📊 CIBIL Score Simulator</Title>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {[{k:"payment",label:"Payment History",min:0,max:100,unit:"%"},{k:"utilization",label:"Credit Utilization",min:0,max:100,unit:"%"},{k:"age",label:"Credit Age (years)",min:0,max:20,unit:"yr"},{k:"inquiries",label:"Recent Inquiries",min:0,max:10,unit:""},{k:"mix",label:"Credit Mix Types",min:1,max:5,unit:""}].map(item=>(
            <Card key={item.k} style={{ padding:"14px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, fontWeight:500, color:C.gray700, marginBottom:8 }}><span>{item.label}</span><span style={{ fontWeight:700, color:C.navy }}>{f[item.k]}{item.unit}</span></div>
              <input type="range" min={item.min} max={item.max} value={f[item.k]} onChange={e=>setF(p=>({...p,[item.k]:+e.target.value}))} style={{ width:"100%", accentColor:C.navy }} />
            </Card>
          ))}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <Card style={{ textAlign:"center", padding:32 }}>
            <div style={{ fontSize:13, color:C.gray500, marginBottom:8 }}>Your CIBIL Score</div>
            <div style={{ fontSize:80, fontWeight:700, color:sc, lineHeight:1 }}>{score}</div>
            <div style={{ fontSize:16, fontWeight:600, color:sc, marginTop:8 }}>{sl}</div>
            <div style={{ marginTop:16, height:12, background:C.gray100, borderRadius:6, overflow:"hidden" }}><div style={{ height:"100%", width:`${((score-300)/600)*100}%`, background:sc, borderRadius:6, transition:"width 0.4s" }} /></div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.gray300, marginTop:4 }}><span>300</span><span>900</span></div>
          </Card>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[{label:"Home Loan",ok:score>=650,rate:score>=750?"8.5%":score>=650?"9.2%":"N/A"},{label:"Car Loan",ok:score>=620,rate:score>=750?"9.0%":score>=620?"10.5%":"N/A"},{label:"Personal",ok:score>=700,rate:score>=750?"10.5%":score>=700?"13%":"N/A"},{label:"Gold Loan",ok:true,rate:"8.0%"}].map((l,i)=>(
              <div key={i} style={{ background:l.ok?C.greenBg:C.redBg, borderRadius:10, padding:"10px 12px" }}>
                <div style={{ fontSize:12, fontWeight:600, color:l.ok?C.green:C.red }}>{l.ok?"✅":"❌"} {l.label}</div>
                <div style={{ fontSize:11, color:l.ok?C.green:C.red, marginTop:2 }}>{l.rate}</div>
              </div>
            ))}
          </div>
          <button onClick={getAITip} disabled={loading} style={{ padding:"12px 20px", borderRadius:12, background:C.navy, color:C.white, border:"none", cursor:"pointer", fontWeight:600, fontSize:14, opacity:loading?0.6:1 }}>{loading?"Analyzing...":"🤖 Get AI Improvement Tips"}</button>
          {aiTip&&<Card style={{ background:C.purpleBg, border:`1px solid ${C.purple}30` }}><div style={{ fontSize:12, fontWeight:600, color:C.purple, marginBottom:8 }}>🤖 AI Recommendations</div><div style={{ fontSize:13, color:C.gray700, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{aiTip}</div></Card>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   FRAUD PANEL
═══════════════════════════════════════════════════════════════════════ */
function FraudPanel({ apps }) {
  const [sel,setSel]           = useState(null);
  const [analysis,setAnalysis] = useState("");
  const [loading,setLoading]   = useState(false);
  // Generate fraud flags from real data
const withFlags = apps.map(app => {
  const flags = [];
  if(app.score < 600)                           flags.push("Low CIBIL");
  if(app.appliedAmt > (app.income * 12 * 5))   flags.push("High Amount vs Income");
  if(app.score < 650 && app.appliedAmt > 500000) flags.push("High Risk Application");
  if(!app.employer)                              flags.push("No Employer Info");
  return { ...app, flags };
});

const flagged = withFlags.filter(a => a.flags.length > 0);

async function analyzeAI(app) {
  setSel(app); setAnalysis(""); setLoading(true);
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai/chat`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        prompt: `You are a fraud detection AI for an Indian bank. Analyze this loan application:

Applicant: ${app.applicant}
Loan Type: ${app.type}
Amount: ₹${app.appliedAmt?.toLocaleString("en-IN")}
CIBIL Score: ${app.score}
Monthly Income: ${app.income ? fmtINR(app.income) : "N/A"}
Fraud Flags: ${app.flags?.join(", ") || "None"}

Please provide in EXACT format:
🚨 FRAUD PROBABILITY: [X%]
⚠️ RISK INDICATORS:
- [Indicator 1]
- [Indicator 2]
✅ RECOMMENDED ACTION: [Approve/Review/Reject/Investigate]
📋 REASON: [Brief explanation]`
      })
    });
    const data = await res.json();
    setAnalysis(data.text || "No response from AI");
  } catch { 
    setAnalysis("Cannot reach server. Is Spring Boot running?"); 
  }
  setLoading(false);
}

  return (
    <div>
      <Title>🚨 Fraud Detection Engine</Title>
      <div style={{ display:"grid", gridTemplateColumns:"3fr 2fr", gap:20 }}>
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:20 }}>
            {[{label:"Flagged",value:flagged.length,color:C.red,icon:"🚩"},{label:"High Risk",value:apps.filter(a=>a.risk==="High").length,color:C.amber,icon:"⚠️"},{label:"Clean",value:apps.filter(a=>!a.flags?.length).length,color:C.green,icon:"✅"}].map((s,i)=>(
              <Card key={i} style={{ padding:"14px", textAlign:"center" }}><div style={{ fontSize:22, marginBottom:6 }}>{s.icon}</div><div style={{ fontSize:22, fontWeight:700, color:s.color }}>{s.value}</div><div style={{ fontSize:11, color:C.gray500 }}>{s.label}</div></Card>
            ))}
          </div>
          <Card>
            <div style={{ fontWeight:600, color:C.navy, fontSize:14, marginBottom:14 }}>🚩 Flagged Applications</div>
            {flagged.map(app=>(
              <div key={app.id} onClick={()=>analyzeAI(app)} style={{ padding:14, borderRadius:12, border:`1.5px solid ${sel?.id===app.id?C.red:C.gray100}`, marginBottom:10, cursor:"pointer", background:sel?.id===app.id?C.redBg:C.white, transition:"all 0.2s" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                  <div><div style={{ fontWeight:600, color:C.navy }}>{app.applicant}</div><div style={{ fontSize:12, color:C.gray500 }}>{app.id} · {app.loanType}</div></div>
                  <RiskBadge risk={app.risk}/>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:6 }}>{app.flags.map((f,i)=><span key={i} style={{ background:C.redBg, color:C.red, fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:12 }}>⚠ {f}</span>)}</div>
                <div style={{ fontSize:12, color:C.gray500 }}>Amount: {fmtINR(app.appliedAmt)} · CIBIL: {app.score}</div>
              </div>
            ))}
          </Card>
        </div>
        <div>
          {sel?(
            <Card><div style={{ fontWeight:600, color:C.navy, fontSize:14, marginBottom:12 }}>🤖 AI Fraud Analysis</div>
              <div style={{ background:C.gray50, borderRadius:10, padding:12, marginBottom:12 }}><div style={{ fontSize:15, fontWeight:600, color:C.navy }}>{sel.applicant}</div><div style={{ fontSize:12, color:C.gray500, marginTop:4 }}>{sel.type} · {fmtINR(sel.appliedAmt)}</div></div>
              {loading?<div style={{ textAlign:"center", padding:24, color:C.gray500 }}>Analyzing fraud patterns...</div>:<div style={{ fontSize:13, color:C.gray700, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{analysis}</div>}
            </Card>
          ):(
            <Card style={{ textAlign:"center", padding:40 }}><div style={{ fontSize:48, marginBottom:12 }}>🔍</div><div style={{ fontSize:14, color:C.gray500 }}>Click a flagged application for AI fraud analysis</div></Card>
          )}
        </div>
      </div>
    </div>
  );
}
function getLoanStage(status) {
  switch(status?.toLowerCase()) {
    case "pending":      return 0; // Application Received
    case "under_review": return 1; // Document Verification
    case "approved":     return 2; // Credit Assessment
    case "disbursed":    return 5; // Amount Disbursed
    case "rejected":     return -1; // Rejected
    default:             return 0;
  }
}
/* ═══════════════════════════════════════════════════════════════════════
   APPROVAL WORKFLOW (Checker / Maker / Authorizer)
═══════════════════════════════════════════════════════════════════════ */
function ApprovalWorkflow({ apps, setApps, role, onNotify }) {
  const [sel,setSel]         = useState(null);
  const [insight,setInsight] = useState("");
  const [loading,setLoading] = useState(false);
  const [rejectReason, setRejectReason]       = useState("");      // ✅ add
  const [showRejectInput, setShowRejectInput] = useState(false);   
  // console.log("role:", role);
  // console.log("apps statuses:", apps.map(a=>a.status));
  const queue = role==="checker"?apps.filter(a=>a.status==="pending"):role==="maker"?apps.filter(a=>a.status==="under_review"):apps.filter(a=>a.status==="approved");
//  console.log("queue:", queue);
 async function update(id, status,reason="") {
  try {
    const token = localStorage.getItem("token");
    await axios.put(
      `${import.meta.env.VITE_API_BASE_URL}/api/loans/${id}/status`,
      { role,status,rejectReason:reason },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setApps(p=>p.map(a=>a.id===id?{...a,status}:a));
    setSel(p=>p?.id===id?{...p,status}:p);
    onNotify?.(`Application ${id} → ${status.replace("_"," ").toUpperCase()}`);
  } catch(err) {
    console.error("Update failed:", err);
    alert("Failed to update status!");
  }
}
function extractRisk(insight) {
  if(!insight) return "unknown";
  const lower = insight.toLowerCase();
  if(lower.includes("high risk") || lower.includes("🔴")) return "high";
  if(lower.includes("medium risk") || lower.includes("🟡")) return "medium";
  if(lower.includes("low risk") || lower.includes("🟢")) return "low";
  return "unknown";
}


async function getInsight(app) {
  setSel(app); setInsight(""); setLoading(true);
  // console.log("App data sent to AI:", app);
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai/chat`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
      prompt: `You are a senior Indian bank loan officer. Analyze this loan application and respond in this EXACT format:

📊 CREDIT RATING: [Excellent/Good/Fair/Poor]
📉 LOAN-TO-INCOME RATIO: [X%]
⚠️ RISK LEVEL: [🟢 Low / 🟡 Medium / 🔴 High]
✅ RECOMMENDATION: [APPROVE / REVIEW / REJECT]

📋 KEY REASONS:
- [Reason 1]
- [Reason 2]
- [Reason 3]

💡 SUGGESTIONS:
- [Suggestion 1]
- [Suggestion 2]

Application Details:
Applicant: ${app.applicant}
Loan Type: ${app.type}
Amount: ₹${app.appliedAmt?.toLocaleString("en-IN")}
CIBIL Score: ${app.score}
Monthly Income: ${app.income ? fmtINR(app.income) : "N/A"}
Employer: ${app.employer}
Employment Type: ${app.empType}
Tenure: ${app.tenure} months
EMI: ${app.emi ? fmtINR(app.emi) : "N/A"}`
      })
    });
   const data = await res.json();
// console.log("AI Response:", data);
const aiText = data.text || "No response from AI";
setInsight(aiText);

// ← ADD THESE 2 LINES
const risk = extractRisk(aiText);
setSel(p => ({...p, risk}));
    
  } catch { 
    setInsight("Cannot reach server. Is Spring Boot running?"); 
  }
  setLoading(false);
}
  return (
    <div>
      <Title sub={`${role==="checker"?"First-level review":role==="maker"?"Second-level approval":"Final sanction"} — AI-assisted`}>
        {role==="checker"?"🔍 Checker Review":role==="maker"?"✍️ Maker Approval":"🔐 Authorizer Panel"}
      </Title>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:C.gray500, marginBottom:12 }}>Queue ({queue.length})</div>
          {queue.length===0&&<Card style={{ textAlign:"center", padding:40 }}><div style={{ fontSize:40 }}>🎉</div><div style={{ color:C.gray500, fontSize:14, marginTop:8 }}>Queue is empty!</div></Card>}
          {queue.map(app=>(
            <div key={app.id} onClick={()=>getInsight(app)} style={{ background:sel?.id===app.id?C.navy:C.white, borderRadius:14, padding:16, marginBottom:10, border:`1px solid ${sel?.id===app.id?C.navy:C.gray100}`, cursor:"pointer", transition:"all 0.2s" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <div><div style={{ fontWeight:600, fontSize:14, color:sel?.id===app.id?C.white:C.navy }}>{app.applicant}</div><div style={{ fontSize:11, color:sel?.id===app.id?"rgba(255,255,255,0.5)":C.gray500 }}>{app.type}</div></div>
                <Badge status={app.status}/>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:15, fontWeight:700, color:sel?.id===app.id?C.gold:C.navy }}>{fmtINR(app.appliedAmt)}</span>
                <span style={{ fontSize:12, color:sel?.id===app.id?"rgba(255,255,255,0.4)":C.gray300 }}>CIBIL: {app.score}</span>
              </div>
              {app.flags?.length>0&&<div style={{ marginTop:8, display:"flex", flexWrap:"wrap", gap:4 }}>{app.flags.slice(0,2).map((f,i)=><span key={i} style={{ background:C.redBg, color:C.red, fontSize:9, fontWeight:600, padding:"2px 6px", borderRadius:10 }}>⚠ {f}</span>)}</div>}
            </div>
          ))}
        </div>
        <div>
          {sel?(
            <Card>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
                <div><div style={{ fontSize:16, fontWeight:700, color:C.navy }}>{sel.applicant}</div><div style={{ fontSize:12, color:C.gray500 }}>{sel.id} · {sel.date}</div></div>
                <Badge status={sel.status}/>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                {[{label:"Loan Type",value:sel.type},{label:"Amount",value:fmtINR(sel.appliedAmt)},{label:"CIBIL Score",value:sel.score},{label:"Income",value:sel.income?fmtINR(sel.income):"N/A"},{label:"Risk Level",value:<RiskBadge risk={sel.risk}/>},{label:"Stage", value:STAGES[getLoanStage(sel.status)]}].map((item,i)=>(
                  <div key={i} style={{ background:C.gray50, borderRadius:8, padding:"10px 12px" }}><div style={{ fontSize:11, color:C.gray500, marginBottom:2 }}>{item.label}</div><div style={{ fontSize:13, fontWeight:600, color:C.navy }}>{item.value}</div></div>
                ))}
              </div>
              <div style={{ background:C.gray50, borderRadius:12, padding:14, marginBottom:16, minHeight:80 }}>
                <div style={{ fontSize:12, fontWeight:600, color:C.navy, marginBottom:8 }}>🤖 AI Risk Assessment</div>
                {loading?<div style={{ color:C.gray500, fontSize:13 }}>Analyzing...</div>:<div style={{ fontSize:13, color:C.gray700, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{insight||"Click an application to analyze"}</div>}
              </div>
              <div style={{ display:"flex", gap:10 }}>
                {role==="checker"&&sel.status==="pending"&&<><button onClick={()=>update(sel.id,"under_review")} style={{ flex:1, padding:"11px", borderRadius:10, background:C.navy, color:C.white, border:"none", cursor:"pointer", fontWeight:600, fontSize:13 }}>Forward to Maker</button><button onClick={()=>setShowRejectInput(true)} 
                style={{ flex:1, padding:"11px", borderRadius:10, background:C.redBg, color:C.red, border:"none", cursor:"pointer", fontWeight:600, fontSize:13 }}>✗ Reject</button></>}
                {role==="maker"&&sel.status==="under_review"&&<><button onClick={()=>update(sel.id,"approved")} style={{ flex:1, padding:"11px", borderRadius:10, background:C.green, color:C.white, border:"none", cursor:"pointer", fontWeight:600, fontSize:13 }}>✓ Approve</button><button onClick={()=>setShowRejectInput(true)} 
                style={{ flex:1, padding:"11px", borderRadius:10, background:C.redBg, color:C.red, border:"none", cursor:"pointer", fontWeight:600, fontSize:13 }}>✗ Reject</button></>}
                {role==="authorizer"&&sel.status==="approved"&&<><button onClick={()=>update(sel.id,"disbursed")} style={{ flex:1, padding:"11px", borderRadius:10, background:C.purple, color:C.white, border:"none", cursor:"pointer", fontWeight:600, fontSize:13 }}>💸 Disburse</button><button onClick={()=>setShowRejectInput(true)} 
                style={{ flex:1, padding:"11px", borderRadius:10, background:C.redBg, color:C.red, border:"none", cursor:"pointer", fontWeight:600, fontSize:13 }}>✗ Reject</button></>}
              </div>
               {showRejectInput && (
                <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:8 }}>
                  <input
                    placeholder="Enter rejection reason..."
                    value={rejectReason}
                    onChange={e=>setRejectReason(e.target.value)}
                    style={{ padding:"10px 14px", borderRadius:10, border:`1px solid ${C.red}`, fontSize:13, outline:"none" }}
                  />
                  <div style={{ display:"flex", gap:8 }}>
                    <button 
                      onClick={()=>{ 
                        if(!rejectReason.trim()) return alert("Please enter rejection reason!");
                        update(sel.id, "rejected", rejectReason); 
                        setShowRejectInput(false); 
                        setRejectReason("");
                      }}
                      style={{ flex:1, padding:"10px", borderRadius:10, background:C.red, color:C.white, border:"none", cursor:"pointer", fontWeight:600 }}>
                      Confirm Reject
                    </button>
                    <button 
                      onClick={()=>{ setShowRejectInput(false); setRejectReason(""); }}
                      style={{ flex:1, padding:"10px", borderRadius:10, background:C.gray100, color:C.gray700, border:"none", cursor:"pointer", fontWeight:600 }}>
                      Cancel
                    </button>
                  </div>
                </div>
               )}
            </Card>
          ):(
            <Card style={{ textAlign:"center", padding:60 }}><div style={{ fontSize:48, marginBottom:12 }}>📋</div><div style={{ color:C.gray500, fontSize:14 }}>Select an application to review with AI insights</div></Card>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   DISBURSEMENT TRACKER
═══════════════════════════════════════════════════════════════════════ */
function DisbursementTracker({ apps }) {
  const [sel,setSel] = useState(null);
  const active = apps.filter(a=>["approved","disbursed"].includes(a.status));
  return (
    <div>
      <Title >📦 Disbursement Tracker</Title>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <div>
          {active.length===0&&<Card style={{ textAlign:"center", padding:40 }}><div style={{ fontSize:40 }}>📭</div><div style={{ color:C.gray500, fontSize:14, marginTop:8 }}>No loans in disbursement pipeline</div></Card>}
          {active.map(app=>(
            <div key={app.id} onClick={()=>setSel(app)} style={{ background:sel?.id===app.id?C.navy:C.white, borderRadius:14, padding:16, marginBottom:10, border:`1px solid ${sel?.id===app.id?C.navy:C.gray100}`, cursor:"pointer", transition:"all 0.2s" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}><div><div style={{ fontWeight:600, color:sel?.id===app.id?C.white:C.navy }}>{app.applicant}</div><div style={{ fontSize:12, color:sel?.id===app.id?"rgba(255,255,255,0.5)":C.gray500 }}>{app.type}</div></div><Badge status={app.status}/></div>
              <div style={{ fontSize:15, fontWeight:700, color:sel?.id===app.id?C.gold:C.navy, marginBottom:8 }}>{fmtINR(app.appliedAmt)}</div>
              <div style={{ display:"flex", gap:3 }}>{STAGES.map((_,i)=><div key={i} style={{ flex:1, height:4, borderRadius:2, background:i<=getLoanStage(app.status)?C.gold:sel?.id===app.id?"rgba(255,255,255,0.15)":C.gray100 }} />)}</div>
              <div style={{ fontSize:11, color:sel?.id===app.id?"rgba(255,255,255,0.5)":C.gray500, marginTop:4 }}>{STAGES[getLoanStage(app.status)]}</div>
            </div>
          ))}
        </div>
        {sel?(
          <Card>
            <div style={{ fontWeight:700, color:C.navy, fontSize:16, marginBottom:4 }}>{sel.applicant}</div>
            <div style={{ fontSize:13, color:C.gray500, marginBottom:20 }}>{sel.id} · {fmtINR(sel.appliedAmt)}</div>
            {STAGES.map((stage,i)=>{
             const done=i<=getLoanStage(sel.status); const cur=i===getLoanStage(sel.status);
              return (
                <div key={i} style={{ display:"flex", gap:14 }}>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                    <div style={{ width:32, height:32, borderRadius:"50%", background:done?C.green:C.gray100, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:done?C.white:C.gray300, flexShrink:0, border:cur?`3px solid ${C.gold}`:"none" }}>{done?"✓":i+1}</div>
                    {i<STAGES.length-1&&<div style={{ width:2, height:28, background:done?C.green:C.gray100 }} />}
                  </div>
                  <div style={{ paddingBottom:24 }}>
                    <div style={{ fontWeight:600, fontSize:14, color:done?C.navy:C.gray300 }}>{stage}</div>
                    {done&&!cur&&<div style={{ fontSize:11, color:C.green, marginTop:2 }}>✓ Completed</div>}
                    {cur&&<div style={{ fontSize:11, color:C.amber, marginTop:2 }}>⏳ In Progress</div>}
                  </div>
                </div>
              );
            })}
          </Card>
        ):(
          <Card style={{ textAlign:"center", padding:60 }}><div style={{ fontSize:48, marginBottom:12 }}>📦</div><div style={{ color:C.gray500, fontSize:14 }}>Select a loan to view disbursement stages</div></Card>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   REDIS PANEL (Authorizer only)
═══════════════════════════════════════════════════════════════════════ */
function RedisPanel() {
  const [keys,setKeys] = useState(REDIS_KEYS);
  const [nk,setNk]     = useState(""); const [nv,setNv]=useState("");
  const hits=keys.filter(k=>k.hit).length; const hitRate=Math.round((hits/keys.length)*100);
  return (
    <div>
      <Title sub="In-memory caching for credit scores, sessions, rate limiting and fraud lists">🗄️ Redis Cache Monitor</Title>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:12, marginBottom:20 }}>
        {[{label:"Total Keys",value:keys.length,color:C.navy},{label:"Cache Hits",value:hits,color:C.green},{label:"Cache Misses",value:keys.length-hits,color:C.red},{label:"Hit Rate",value:`${hitRate}%`,color:C.purple}].map((s,i)=>(
          <Card key={i} style={{ textAlign:"center", padding:16 }}><div style={{ fontSize:22, fontWeight:700, color:s.color }}>{s.value}</div><div style={{ fontSize:11, color:C.gray500, marginTop:2 }}>{s.label}</div></Card>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:20 }}>
        <Card>
          <div style={{ fontWeight:600, color:C.navy, fontSize:14, marginBottom:14 }}>🔑 Cached Keys</div>
          <div style={{ fontFamily:"monospace", fontSize:12 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 65px 75px 55px", gap:8, padding:"8px 12px", background:C.navy, borderRadius:"8px 8px 0 0", color:"rgba(255,255,255,0.7)", fontSize:11, fontWeight:600 }}><span>KEY</span><span>VALUE</span><span>TTL</span><span>TYPE</span><span>HIT</span></div>
            {keys.map((k,i)=>(
              <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 65px 75px 55px", gap:8, padding:"8px 12px", background:i%2===0?C.gray50:C.white, borderBottom:`1px solid ${C.gray100}`, alignItems:"center" }}>
                <span style={{ color:C.navy, fontWeight:500, wordBreak:"break-all" }}>{k.key}</span>
                <span style={{ color:C.teal }}>{k.value.length>16?k.value.slice(0,16)+"...":k.value}</span>
                <span style={{ color:C.amber }}>{k.ttl}</span><span style={{ color:C.purple }}>{k.type}</span>
                <span style={{ color:k.hit?C.green:C.red, fontWeight:700 }}>{k.hit?"HIT":"MISS"}</span>
              </div>
            ))}
          </div>
        </Card>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <Card>
            <div style={{ fontWeight:600, color:C.navy, fontSize:14, marginBottom:12 }}>➕ Set New Key</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <input placeholder="Key name" value={nk} onChange={e=>setNk(e.target.value)} style={{ padding:"9px 12px", borderRadius:8, border:`1px solid ${C.gray100}`, fontSize:13, outline:"none", fontFamily:"monospace" }} />
              <input placeholder="Value" value={nv} onChange={e=>setNv(e.target.value)} style={{ padding:"9px 12px", borderRadius:8, border:`1px solid ${C.gray100}`, fontSize:13, outline:"none", fontFamily:"monospace" }} />
              <button onClick={()=>{if(nk&&nv){setKeys(p=>[{key:nk,value:nv,ttl:"3600s",type:"STRING",hit:false},...p]);setNk("");setNv("");}}} style={{ padding:"9px", borderRadius:8, background:C.navy, color:C.white, border:"none", cursor:"pointer", fontWeight:600 }}>SET Key</button>
            </div>
          </Card>
          <Card style={{ background:C.tealBg, border:`1px solid ${C.teal}30` }}>
            <div style={{ fontWeight:600, color:C.teal, fontSize:13, marginBottom:8 }}>Cache Strategy</div>
            {["CIBIL scores → 1hr TTL","Session tokens → 15min TTL","Rate limits → 1min TTL","Fraud blacklist → 24hr TTL","Eligibility calc → 30min TTL"].map((t,i)=>(
              <div key={i} style={{ fontSize:12, color:C.gray700, padding:"4px 0", borderBottom:i<4?`1px solid ${C.teal}20`:"none" }}>• {t}</div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
function AuditPanel({ apps }) {
  const [searchType, setSearchType] = useState("username"); // "username" or "loantype"
  const [searchValue, setSearchValue] = useState("");
  const [results, setResults] = useState([]);
  const [sel, setSel] = useState(null);
  const [analysis, setAnalysis] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [flag, setFlag] = useState("COMPLIANT");
  const [saved, setSaved] = useState(false);
//  console.log(apps);
  // ✅ search loans
function handleSearch() {
    if (!searchValue.trim()) return;
    // console.log("all fields:", Object.keys(apps[0]));
    // console.log("first app fields:", apps[0]);  // ✅ add this
    // console.log("applicantName:", apps[0]?.applicant);  // ✅ add this

    let filtered;
    if (searchType === "username") {
      filtered = apps.filter(a =>
        a.applicant?.toLowerCase().includes(searchValue.toLowerCase())
      );
    } else {
      filtered = apps.filter(a =>
        a.type?.toLowerCase().includes(searchValue.toLowerCase())
      );
    }
    
    // 
    setResults(filtered);
    setSel(null);
    setAnalysis("");
}

  // ✅ calculate TAT
  function calcTAT(from, to) {
    if (!from || !to) return "Pending";
    const diff = new Date(to) - new Date(from);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    return days > 0 ? `${days}d ${hours % 24}h` : `${hours}h`;
  }

  // ✅ AI analyze
  async function analyzeWithAI(loan) {
    setSel(loan);
    setAnalysis("");
    setLoadingAI(true);
    setRemarks("");
    setSaved(false);
    
    const token = localStorage.getItem("token");
    const prompt = `You are a compliance checker for loan processing. 
Given loan application data, evaluate the following:
    
Loan Type: ${loan.type}
Applied Amount: ₹${loan.appliedAmt?.toLocaleString("en-IN")}
Eligible Amount: ₹${loan.eligibleAmount?.toLocaleString("en-IN")}
CIBIL Score: ${loan.score || "N/A"}
Status: ${loan.status}
Rejection Reason: ${loan.rejectionReason || "N/A"}

Timeline:
Applied:   ${loan.createdAt || "N/A"}
Checked:   ${loan.checkedAt || "Pending"} (TAT: ${calcTAT(loan.createdAt, loan.checkedAt)})
Approved:  ${loan.makedAt|| "Pending"} (TAT: ${calcTAT(loan.checkedAt, loan.makedAt)})
Disbursed: ${loan.authorizedAt || "Pending"} (TAT: ${calcTAT(loan.makedAt, loan.authorizedAt)})
Total TAT: ${calcTAT(loan.createdAt, loan.authorizedAt || loan.makedAt || loan.checkedAt)}

Checked By:   ${loan.checkedBy || "N/A"}
Approved By:  ${loan.makedBy || "N/A"}
Disbursed By: ${loan.authorizedBy || "N/A"}

1. Turnaround Time (TAT): Is it within RBI limits? 
   - Personal/Salary loans: ≤ 3 days 
   - Home loans: ≤ 7 days
2. Sanctioned Amount: Is it within the eligible limit?
3. Rejection Reason: If rejected, was a valid reason provided?
4. Workflow: Was the proper workflow followed?
5. Compliance: Any compliance issues observed?

Output a SHORT compliance report with:
- A one‑line summary for each check (e.g., "TAT compliant", "Sanctioned amount exceeds limit").
- A final flag at the end: COMPLIANT / WARNING / NON_COMPLIANT`;
 console.log("calling AI for loan:", loan.id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ prompt, role: "auditor" })
      });
      const data = await res.json();
      setAnalysis(data.text || "No response");

      // auto detect flag from AI response
      const txt = data.text?.toUpperCase() || "";
      if (txt.includes("NON_COMPLIANT") || txt.includes("NON COMPLIANT")) setFlag("NON_COMPLIANT");
      else if (txt.includes("WARNING")) setFlag("WARNING");
      else setFlag("COMPLIANT");

    } catch (err) {
      setAnalysis("Error connecting to AI.");
    }
    setLoadingAI(false);
  }

  // ✅ save audit
  async function saveAudit() {
    if (!remarks.trim()) return alert("Please add remarks before saving!");
    try {
      const token = localStorage.getItem("token");
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/audit/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          loanId: sel.id,
          loanType: sel.type,
          status: sel.status,
          createdBy:sel.applicant,
          createdAt:sel.createdAt,
          checkedBy:sel.checkedBy,
          checkedAt:sel.checkedAt,
          approvedBy:sel.makedBy,
          approvedAt:sel.makedAt,
          disbursedBy:sel.disbursedBy,
          disbursedAt:sel.disbursedAt,
          eligibleAmt: sel.eligibleAmount,
          sanctionedAmt: sel.appliedAmt,
          cibil: sel.score,
          rejectedBy:sel.rejectedBy,
          reason: sel.rejectionReason,
          remarks,
          flag
        })
      });
      setSaved(true);
    } catch (err) {
      alert("Failed to save audit!");
    }
  }

  const flagColors = {
    COMPLIANT:     { bg: C.greenBg,  color: C.green,  icon: "✅" },
    WARNING:       { bg: C.amberBg,  color: C.amber,  icon: "⚠️" },
    NON_COMPLIANT: { bg: C.redBg,    color: C.red,    icon: "❌" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Header */}
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.navy }}>🔎 Audit Trail</div>
        <div style={{ fontSize: 13, color: C.gray500, marginTop: 4 }}>
          Search and analyze loan compliance
        </div>
      </div>

      {/* ── Search */}
      <Card>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>

          {/* search type toggle */}
          <div style={{ display: "flex", gap: 8 }}>
            {["username", "loantype"].map(t => (
              <button key={t} onClick={() => { setSearchType(t); setSearchValue(""); setResults([]); setSel(null); }}
                style={{ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13,
                  background: searchType === t ? C.navy : C.gray100,
                  color: searchType === t ? C.white : C.gray700 }}>
                {t === "username" ? "👤 By Username" : "🏦 By Loan Type"}
              </button>
            ))}
          </div>

          {/* search input */}
          <div style={{ display: "flex", gap: 8, flex: 1 }}>
            <input
              placeholder={searchType === "username" ? "Enter applicant name..." : "Enter loan type (salary, car, housing...)"}
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.gray100}`, fontSize: 14, outline: "none" }}
            />
            <button onClick={handleSearch}
              style={{ padding: "10px 20px", borderRadius: 10, background: C.navy, color: C.white, border: "none", cursor: "pointer", fontWeight: 600 }}>
              Search
            </button>
          </div>
        </div>
      </Card>

      {/* ── Results + Detail */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 16 }}>

        {/* results list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {results.length === 0 && (
            <Card style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
              <div style={{ color: C.gray500, fontSize: 13 }}>Search to see loans</div>
            </Card>
          )}
         
          {results.map(a => (
            <Card key={a.id} style={{ cursor: "pointer", border: `1px solid ${sel?.id === a.id ? C.navy : C.gray100}`, transition: "all 0.2s" }}
              onClick={() => analyzeWithAI(a)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, color: C.navy, fontSize: 14 }}>{a.applicant}</div>
                  <div style={{ fontSize: 12, color: C.gray500, marginTop: 2 }}>{a.type} · ₹{a.appliedAmt?.toLocaleString("en-IN")}</div>
                </div>
                <div style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: a.status === "approved" || a.status === "disbursed" ? C.greenBg :
                              a.status === "rejected" ? C.redBg : C.amberBg,
                  color: a.status === "approved" || a.status === "disbursed" ? C.green :
                         a.status === "rejected" ? C.red : C.amber }}>
                  {a.status?.toUpperCase()}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* detail + AI analysis */}
        {sel ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* loan timeline */}
            <Card>
              <div style={{ fontWeight: 700, color: C.navy, fontSize: 15, marginBottom: 12 }}>
                📋 Loan Timeline — {sel.applicantName}
              </div>
              {[
                { label: "Applied",   by: sel.createdBy  || sel.applicantName, at: sel.createdAt,   tat: null },
                { label: "Checked",   by: sel.checkedBy  || "Pending",         at: sel.checkedAt,   tat: calcTAT(sel.createdAt, sel.checkedAt) },
                { label: "Approved",  by: sel.makedBy    || "Pending",         at: sel.makedAt,  tat: calcTAT(sel.checkedAt, sel.makedAt) },
                { label: "Disbursed", by: sel.authorizedBy|| "Pending",         at: sel.authorizedAt, tat: calcTAT(sel.makedAt, sel.authorizedAt) },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700,
                    background: s.at ? C.green : C.gray100,
                    color: s.at ? C.white : C.gray300 }}>
                    {s.at ? "✓" : i + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: s.at ? C.navy : C.gray300 }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: C.gray500 }}>{s.by} {s.at ? `· ${s.at}` : ""}</div>
                    {s.tat && s.tat !== "Pending" && (
                      <div style={{ fontSize: 11, color: C.blue }}>TAT: {s.tat}</div>
                    )}
                  </div>
                </div>
              ))}

              {sel.status === "rejected" && sel.rejectionReason && (
                <div style={{ background: C.redBg, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: C.red, marginTop: 8 }}>
                  ❌ Rejection Reason: {sel.rejectionReason}
                </div>
              )}
            </Card>

            {/* AI analysis */}
            <Card>
              <div style={{ fontWeight: 700, color: C.navy, fontSize: 15, marginBottom: 8 }}>🤖 AI Compliance Analysis</div>
              {loadingAI ? (
                <div style={{ color: C.gray500, fontSize: 13 }}>Analyzing...</div>
              ) : analysis ? (
                <div style={{ fontSize: 13, color: C.gray700, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{analysis}</div>
              ) : (
                <div style={{ color: C.gray500, fontSize: 13 }}>Click a loan to analyze</div>
              )}
            </Card>

            {/* auditor remarks + flag */}
            {analysis && !loadingAI && (
              <Card>
                <div style={{ fontWeight: 700, color: C.navy, fontSize: 15, marginBottom: 12 }}>📝 Auditor Remarks</div>

                {/* flag selector */}
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  {["COMPLIANT", "WARNING", "NON_COMPLIANT"].map(f => (
                    <button key={f} onClick={() => setFlag(f)}
                      style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12,
                        background: flag === f ? flagColors[f].bg : C.gray100,
                        color: flag === f ? flagColors[f].color : C.gray500 }}>
                      {flagColors[f].icon} {f.replace("_", " ")}
                    </button>
                  ))}
                </div>

                {/* remarks input */}
                <textarea
                  placeholder="Add your audit observations..."
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  rows={3}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.gray100}`, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }}
                />

                <button onClick={saveAudit}
                  style={{ width: "100%", marginTop: 10, padding: 12, borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14,
                    background: saved ? C.green : C.navy,
                    color: C.white }}>
                  {saved ? "✅ Audit Saved!" : "💾 Save Audit"}
                </button>
              </Card>
            )}
          </div>
        ) : (
          <Card style={{ textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
            <div style={{ color: C.gray500, fontSize: 14 }}>Select a loan to see timeline and AI analysis</div>
          </Card>
        )}
      </div>
    </div>
  );
}
/* ═══════════════════════════════════════════════════════════════════════
   MY LOANS
═══════════════════════════════════════════════════════════════════════ */
function MyLoans({ apps }) {
  const [sel,setSel]=useState(null);
  // console.log("Rendering MyLoans with apps:", apps);
    if (!Array.isArray(apps)) {
    // console.log("apps is not array:", apps);
    return <div>Loading...</div>;
  }
  // console.log(apps);
  if (apps.length === 0) {
    return <div>No loans found</div>;
  }
  return (
    <div>
      <Title sub="Track all your submitted loan applications in real-time">📋 My Applications</Title>
      <div style={{ display:"grid", gridTemplateColumns:sel?"1fr 1fr":"1fr", gap:20 }}>
        <div>
          {apps.slice(0,4).map(app=>(
            <div key={app.id} onClick={()=>setSel(sel?.id===app.id?null:app)}
              style={{ background:sel?.id===app.id?C.navy:C.white, borderRadius:14, padding:16, marginBottom:12, border:`1px solid ${sel?.id===app.id?C.navy:C.gray100}`, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", transition:"all 0.2s" }}>
              <div><div style={{ fontWeight:600, color:sel?.id===app.id?C.white:C.navy }}>{app.type}</div><div style={{ fontSize:12, color:sel?.id===app.id?"rgba(255,255,255,0.5)":C.gray500 }}>{app.id} · {app.date}</div><div style={{ marginTop:6 }}>{app.status}</div></div>
              <div style={{ textAlign:"right" }}><div style={{ fontWeight:700, fontSize:20, color:sel?.id===app.id?C.gold:C.navy }}>{fmtINR(app.appliedAmt)}</div><div style={{ fontSize:12, color:sel?.id===app.id?"rgba(255,255,255,0.4)":C.gray500, marginTop:4 }}>CIBIL: {app.score}</div></div>
            </div>
          ))}
        </div>
        {sel&&(
          <Card>
            <div style={{ fontWeight:700, color:C.navy, fontSize:16, marginBottom:4 }}>{sel.type}</div>
            <div style={{ fontSize:13, color:C.gray500, marginBottom:20 }}>{sel.id} · {fmtINR(sel.appliedAmt)}</div>
            {sel.status === "rejected" && sel.rejectionReason && (
  <div style={{ 
    background:"#fff5f5", 
    border:"1px solid #feb2b2", 
    borderRadius:10, 
    padding:"10px 14px", 
    marginBottom:16,
    fontSize:13 
  }}>
    <span style={{ color:C.red, fontWeight:700 }}>❌ Rejected: </span>
    <span style={{ color:C.red }}>{sel.rejectionReason}</span>
  </div>
)}
            {STAGES.map((stage,i)=>{
             const done=i<=getLoanStage(sel.status); const cur=i===getLoanStage(sel.status);
              return (
                <div key={i} style={{ display:"flex", gap:14 }}>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                    <div style={{ width:32, height:32, borderRadius:"50%", background:done?C.green:C.gray100, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:done?C.white:C.gray300, flexShrink:0, border:cur?`3px solid ${C.gold}`:"none" }}>{done?"✓":i+1}</div>
                    {i<STAGES.length-1&&<div style={{ width:2, height:28, background:done?C.green:C.gray100 }} />}
                  </div>
                  <div style={{ paddingBottom:24 }}>
                    <div style={{ fontWeight:600, fontSize:14, color:done?C.navy:C.gray300 }}>{stage}</div>
                    {done&&!cur&&<div style={{ fontSize:11, color:C.green, marginTop:2 }}>✓ Completed</div>}
                    {cur&&<div style={{ fontSize:11, color:C.amber, marginTop:2 }}>⏳ In Progress</div>}
                  </div>
                </div>
              );
            })}
          </Card>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [page,setPage]               = useState("analytics");
  const [apps,setApps]               = useState([]);
  const [toast,setToast]             = useState(null);
  const [loanTypes, setLoanTypes]    = useState([]);
  const notify = msg => setToast(msg);
  
const fetchApps = async (loadedLoanTypes) => {
  try {
    const endpoint =
      currentUser?.role === "user"
        ? "/api/loans/my"   // 👤 only user's loans
        : "/api/loans/all"; // 👨‍💼 admin/all roles
    //  console.log("Fetching from endpoint:", endpoint); // ← ADD THIS
    //  console.log("Current role:", currentUser?.role);
    const res = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}${endpoint}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      }
    );
  console.log("Raw apps from backend:", res.data);
   
  const mapped = res.data.map(loan => ({
  id:        loan.id,
  applicant: loan.applicantName || loan.applicant,  // ← handles both
  type:      loan.loanType?.label || loan.loanName || loan.type, // ← handles both
  appliedAmt:loan.appliedAmt, // ← handles both
  score:     loan.score,
  income:    loan.income,
  status:    loan.status,
  date:      loan.createdAt,
  mobile:    loan.mobile,
  pan:       loan.pan,
  dob:       loan.dob,
  employer:  loan.employer,
  empType:   loan.empType,
  tenure:    loan.tenure,
  emi:       loan.emi,
  rejectionReason: loan.rejectReason,
  eligibleAmount:loan.eligibleAmount,
  createdAt:loan.createdAt,
  craetedBy:loan.createdBy,
  checkedAt:loan.checkedAt,
  checkedBy:loan.checkedBy,
  makedBy:loan.makedBy,
  makedAt:loan.makedAt,
  authorizedBy:loan.authorizedBy,
  authorizedAt:loan.authorizedAt,
  auditRemarks:loan.auditRemarks,
  auditFlag:loan.auditFlag,
  createdAt:loan.createdAt,
}));
    // console.log("Raw first loan:", res.data[0]);
    // console.log("First mapped app:", mapped[0]);
    // console.log("loanTypes:", loanTypes.map(lt=>lt.label));
    setApps(mapped);

  } catch (err) {
    console.error("API error:", err);
  }
};
const fetchLoanTypes = async () => {
  // console.log("Fetching loan types from backend...");
  try {
    const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/loans/types`);
    const enriched = res.data.map(lt => ({
      ...lt,
      icon: LOAN_ICONS[lt.id]?.icon || "🏦",
    }));
    // console.log("Raw data from backend:", res.data[0]); // ← ADD
    // console.log("Enriched:", enriched[0]); 
    setLoanTypes(enriched);
    {page==="analytics" && <Analytics apps={apps} loanTypes={loanTypes.length>0?loanTypes:JSON.parse(localStorage.getItem("loanTypes")||"[]")}/>}
    return enriched;
  } catch(err) {
    console.error("Loan types error:", err);
  }
};
   
  // Restore session on reload
  useEffect(()=>{
    const saved = localStorage.getItem("user");
    if(saved) {
      const u = JSON.parse(saved);
      setCurrentUser(u);
      setPage(u.role==="user"?"apply":"analytics");
    }
  },[]);
useEffect(() => {
  if (currentUser) {
    const init = async () => {
      const loadedLoanTypes = await fetchLoanTypes(); // ← get return value
      await fetchApps(loadedLoanTypes);               // ← pass directly
    };
    init();
  }
}, [currentUser]);

  function handleLogin(user) {
    setCurrentUser(user);
    setPage(
    user.role === "user"    ? "apply":
    user.role === "auditor" ? "analytics" :  "analytics");
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    setPage("analytics");
  }

  const NAV = {
    user:       [{id:"apply",label:"Apply Loan",icon:"📝"},{id:"myloans",label:"My Loans",icon:"📋"},{id:"cibil",label:"CIBIL Sim",icon:"📊"},{id:"ai",label:"AI Advisor",icon:"🤖"}],
    checker:    [{id:"analytics",label:"Dashboard",icon:"📊"},{id:"workflow",label:"Review Queue",icon:"🔍"},{id:"fraud",label:"Fraud",icon:"🚨"}],
    maker:      [{id:"analytics",label:"Dashboard",icon:"📊"},{id:"workflow",label:"Approve",icon:"✍️"},{id:"fraud",label:"Fraud",icon:"🚨"},{id:"disburse",label:"Disburse",icon:"📦"}],
    authorizer: [{id:"analytics",label:"Dashboard",icon:"📊"},{id:"workflow",label:"Final Approve",icon:"🔐"},{id:"disburse",label:"Disburse",icon:"📦"},{id:"redis",label:"Redis",icon:"🗄️"}],
    auditor:    [{id:"analytics", label:"Analytics", icon:"📊"},{id:"audit",     label:"Audit",     icon:"🔎"}],
   };

  // Show login page if not logged in
  if(!currentUser) return <LoginPage onLogin={handleLogin} />;

  const nav = NAV[currentUser.role]||[];
  const roleColors = { user:C.blue, checker:C.amber, maker:C.green, authorizer:C.purple };
  const roleColor  = roleColors[currentUser.role]||C.navy;

  return (
    <div style={{ minHeight:"100vh",width: "100%", background:C.cream }}>
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}*{box-sizing:border-box;margin:0;padding:0;font-family:system-ui,sans-serif}input:focus,select:focus{border-color:#0B1D3A!important;outline:none}`}</style>
      {toast&&<Toast msg={toast} onClose={()=>setToast(null)} />}

      {/* Navbar */}
      <div style={{ background:C.navy, padding:"0 28px", display:"flex", alignItems:"center", height:58, gap:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:20 }}>🏦</span>
          <span style={{ color:C.white, fontWeight:700, fontSize:17 }}>LoanSmart AI</span>
        </div>
        <nav style={{ display:"flex", gap:2 }}>
          {nav.map(n=>(
            <button key={n.id} onClick={()=>setPage(n.id)} style={{ padding:"6px 14px", borderRadius:8, border:"none", cursor:"pointer", fontSize:13, fontWeight:500, background:page===n.id?"rgba(255,255,255,0.15)":"transparent", color:page===n.id?C.white:"rgba(255,255,255,0.55)", transition:"all 0.2s" }}>
              {n.icon} {n.label}
            </button>
          ))}
        </nav>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
          {/* User avatar */}
          <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.08)", padding:"5px 12px 5px 6px", borderRadius:20 }}>
            <div style={{ width:26, height:26, borderRadius:"50%", background:roleColor, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:C.white }}>
              {currentUser.name.charAt(0)}
            </div>
            <span style={{ fontSize:12, color:C.white, fontWeight:500 }}>{currentUser.name}</span>
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.5)", textTransform:"capitalize", background:"rgba(255,255,255,0.1)", padding:"2px 6px", borderRadius:10 }}>{currentUser.role}</span>
          </div>
          <button onClick={handleLogout} style={{ padding:"6px 14px", borderRadius:8, background:"rgba(255,255,255,0.08)", border:`1px solid rgba(255,255,255,0.15)`, color:"rgba(255,255,255,0.7)", fontSize:12, cursor:"pointer", fontWeight:500 }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Page content */}
      <main style={{ padding:"28px 32px", maxWidth:1180, margin:"0 auto", animation:"fadeUp 0.3s ease" }} key={page}>
        {page==="analytics" && <Analytics apps={apps} loanTypes={loanTypes.length>0?loanTypes:JSON.parse(localStorage.getItem("loanTypes")||"[]")}/>}
        {page==="apply"     && <ApplyLoan onNotify={notify} loanTypes={loanTypes}/>}
        {page==="myloans"    && <MyLoans apps={apps}/>}
        {page==="cibil"      && <CIBILSimulator/>}
        {page==="ai"         && <div style={{ maxWidth:700, margin:"0 auto" }}><Title sub="Personalized loan advice powered by Groq">🤖 AI Loan Advisor</Title><AIChat/></div>}
        {page==="workflow"   && <ApprovalWorkflow apps={apps} setApps={setApps} role={currentUser.role} onNotify={notify}/>}
        {page==="fraud"      && <FraudPanel apps={apps}/>}
        {page==="disburse"   && <DisbursementTracker apps={apps}/>}
        {page==="redis"      && <RedisPanel/>}
        {page==="audit" && <AuditPanel apps={apps} />}
      </main>
    </div>
  );
}
