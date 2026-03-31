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
const MOCK_USERS = [
  { id:1, name:"Rajesh Kumar",    username:"user",       password:"user123",       role:"user"       },
  { id:2, name:"Priya Sharma",    username:"checker",    password:"checker123",    role:"checker"    },
  { id:3, name:"Mohammed Ali",    username:"maker",      password:"maker123",      role:"maker"      },
  { id:4, name:"Deepansh Gupta",  username:"authorizer", password:"authorizer123", role:"authorizer" },
];



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
function Card({ children, style={} }) {
  return <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray100}`, padding:20, ...style }}>{children}</div>;
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
  const [form, setForm]       = useState({ username:"", password:"" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);

   

       try {
         const res = await fetch("http://localhost:8080/api/auth/login", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ username: form.username, password: form.password })
         });
         if (!res.ok) throw new Error("Invalid credentials");
         const data = await res.json();
         localStorage.setItem("token", data.token);
        const user = {
  name: form.username,
  role: data.role.replace("ROLE_", "").toLowerCase(), // ROLE_ADMIN → admin
  token: data.token
};
       localStorage.setItem("user", JSON.stringify(user));
onLogin(user); 
       } catch (err) {
         setError(err.message || "Login failed. Please try again.");
       } finally { setLoading(false); }


    // MOCK LOGIN — remove this block when Spring Boot is ready
    
  }

  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(135deg, ${C.navy} 0%, ${C.navyLight} 100%)`, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}*{box-sizing:border-box;margin:0;padding:0;font-family:system-ui,sans-serif}input:focus{border-color:#0B1D3A!important;box-shadow:0 0 0 3px rgba(11,29,58,0.1);outline:none}`}</style>

      <div style={{ background:C.white, borderRadius:24, padding:"40px 40px 36px", width:"100%", maxWidth:440, animation:"fadeUp 0.4s ease" }}>
        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ width:64, height:64, background:C.navy, borderRadius:18, display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, margin:"0 auto 16px" }}>🏦</div>
          <h1 style={{ fontSize:24, fontWeight:700, color:C.navy, marginBottom:4 }}>LoanSmart AI</h1>
          <p style={{ color:C.gray500, fontSize:13 }}>Sign in to your portal</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <label style={{ fontSize:13, fontWeight:600, color:C.gray700 }}>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={form.username}
              onChange={e=>set("username",e.target.value)}
              required
              style={{ padding:"12px 14px", borderRadius:10, border:`1.5px solid ${C.gray100}`, fontSize:14, outline:"none", transition:"border-color 0.2s" }}
            />
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <label style={{ fontSize:13, fontWeight:600, color:C.gray700 }}>Password</label>
            <div style={{ position:"relative" }}>
              <input
                type={showPwd?"text":"password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={e=>set("password",e.target.value)}
                required
                style={{ width:"100%", padding:"12px 44px 12px 14px", borderRadius:10, border:`1.5px solid ${C.gray100}`, fontSize:14, outline:"none", transition:"border-color 0.2s" }}
              />
              <button type="button" onClick={()=>setShowPwd(p=>!p)}
                style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:16, color:C.gray500 }}>
                {showPwd?"🙈":"👁️"}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background:C.redBg, border:`1px solid ${C.red}30`, borderRadius:10, padding:"10px 14px", color:C.red, fontSize:13, display:"flex", alignItems:"center", gap:8 }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ padding:"13px", borderRadius:12, background:C.navy, color:C.white, border:"none", cursor:loading?"not-allowed":"pointer", fontWeight:700, fontSize:15, marginTop:4, opacity:loading?0.7:1, transition:"opacity 0.2s" }}>
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>

        {/* Test credentials */}
        <div style={{ marginTop:24, background:C.gray50, borderRadius:12, padding:"14px 16px" }}>
          <div style={{ fontSize:12, fontWeight:600, color:C.gray500, marginBottom:10 }}>🔑 Test Credentials</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[
              { role:"User",       user:"user",       pass:"user123"       },
              { role:"Checker",    user:"checker",    pass:"checker123"    },
              { role:"Maker",      user:"maker",      pass:"maker123"      },
              { role:"Authorizer", user:"authorizer", pass:"authorizer123" },
            ].map(c=>(
              <button key={c.role} type="button"
                onClick={()=>{ setForm({ username:c.user, password:c.pass }); setError(""); }}
                style={{ background:C.white, border:`1px solid ${C.gray100}`, borderRadius:8, padding:"8px 10px", cursor:"pointer", textAlign:"left", transition:"all 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.borderColor=C.navy}
                onMouseLeave={e=>e.currentTarget.style.borderColor=C.gray100}>
                <div style={{ fontSize:11, fontWeight:600, color:C.navy }}>{c.role}</div>
                <div style={{ fontSize:10, color:C.gray500, marginTop:1 }}>{c.user} / {c.pass}</div>
              </button>
            ))}
          </div>
          <p style={{ fontSize:11, color:C.gray300, marginTop:8 }}>Click any card to auto-fill credentials</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   AI CHAT
═══════════════════════════════════════════════════════════════════════ */
function AIChat({ ctx="" }) {
  const [msgs, setMsgs] = useState([{ role:"assistant", text:"Hello! I'm your AI Loan Advisor powered by Claude. I can assess eligibility, calculate EMIs, explain ITR, CIBIL scores and fraud patterns. How can I help?" }]);
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
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json", "x-api-key":process.env.REACT_APP_ANTHROPIC_KEY||"", "anthropic-version":"2023-06-01" },
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system:`You are an expert AI Loan Advisor for an Indian fintech bank. Help with loan eligibility, EMI, ITR, CIBIL, KYC, RBI guidelines. Be concise and friendly. ${ctx}`, messages:msgs.concat({role:"user",text:txt}).map(m=>({role:m.role,content:m.text})) })
      });
      const data = await res.json();
      setMsgs(p=>[...p,{ role:"assistant", text:data.content?.[0]?.text||"Unable to respond. Please check your API key in .env" }]);
    } catch { setMsgs(p=>[...p,{ role:"assistant", text:"Connection error. Add REACT_APP_ANTHROPIC_KEY in .env file." }]); }
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
            <div style={{ maxWidth:"80%", padding:"10px 14px", fontSize:13, lineHeight:1.6, borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px", background:m.role==="user"?C.navy:C.white, color:m.role==="user"?C.white:C.gray700, border:m.role==="assistant"?`1px solid ${C.gray100}`:"none" }}>{m.text}</div>
          </div>
        ))}
        {loading&&<div style={{ display:"flex", gap:5, padding:"10px 14px", background:C.white, borderRadius:"18px 18px 18px 4px", width:"fit-content", border:`1px solid ${C.gray100}` }}>{[0,1,2].map(i=><div key={i} style={{ width:7, height:7, borderRadius:"50%", background:C.gray300, animation:`bounce 1.2s ${i*0.2}s infinite` }} />)}</div>}
        <div ref={endRef} />
      </div>
      <div style={{ padding:"12px 14px", borderTop:`1px solid ${C.gray100}`, display:"flex", gap:8, background:C.white }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask about eligibility, EMI, CIBIL..." style={{ flex:1, padding:"10px 14px", borderRadius:24, border:`1px solid ${C.gray100}`, fontSize:13, outline:"none", background:C.gray50 }} />
        <button onClick={send} disabled={loading||!input.trim()} style={{ width:40, height:40, borderRadius:"50%", background:C.navy, border:"none", cursor:"pointer", color:C.white, fontSize:16, opacity:(!input.trim()||loading)?0.5:1 }}>→</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ANALYTICS
═══════════════════════════════════════════════════════════════════════ */
function Analytics({ apps }) {
  const approved = apps.filter(a=>["approved","disbursed"].includes(a.status)).length;
  const totalAmt = apps.filter(a=>["approved","disbursed"].includes(a.status)).reduce((s,a)=>s+a.amount,0);
  const loanDist = LOAN_TYPES.map(lt=>({ label:lt.label, icon:lt.icon, count:apps.filter(a=>a.type===lt.label).length })).filter(x=>x.count>0);
  const maxCount = Math.max(...loanDist.map(x=>x.count),1);

  return (
    <div>
      <Title sub="Real-time loan portfolio overview">📊 Analytics Dashboard</Title>
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
          {loanDist.map((lt,i)=>(
            <div key={i} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:4 }}><span style={{ color:C.gray700 }}>{lt.icon} {lt.label}</span><span style={{ fontWeight:600, color:C.navy }}>{lt.count}</span></div>
              <div style={{ height:8, background:C.gray100, borderRadius:4, overflow:"hidden" }}><div style={{ height:"100%", width:`${(lt.count/maxCount)*100}%`, background:C.navy, borderRadius:4, transition:"width 0.6s" }} /></div>
            </div>
          ))}
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
              <td style={{ padding:"10px 12px", fontSize:13, fontWeight:600, color:C.navy }}>{fmtINR(a.amount)}</td>
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
function ApplyLoan({ onNotify }) {
  const [step,setStep]     = useState(0);
  const [lt,setLt]         = useState(null);
  const [form,setForm]     = useState({});
  const [tenure,setTenure] = useState(24);
  const [tab,setTab]       = useState("form");
  const [done,setDone]     = useState(false);
  
  const [loanTypes, setLoanTypes] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [emiDone, setEmiDone]   = useState(false);
  const [kycDone, setKycDone]   = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
    useEffect(() => {
    fetch("http://localhost:8080/api/loans/types")
      .then(res => res.json())
      .then(data => {
         const enriched = data.map(lt => ({
    ...lt,
    icon: LOAN_ICONS[lt.id]?.icon || "🏦",   // ← adds icon by id
// ← adds desc by id
  }));
        setLoanTypes(enriched);  // saves loan types from your database
        setLoading(false);
      })
      .catch(err => {
        setError("Could not load loan types.");
        setLoading(false);
      });
    const token = localStorage.getItem("token");
    fetch("http://localhost:8080/api/user/profile", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    })
    .then(res => res.json())
    .then(data => {
      console.log("Profile:", data);
      set("name", data.name.substring(0, data.name.indexOf("@"))); // first name
      set("dob",  data.dob);
    })
    .catch(err => console.error("Profile fetch failed:", err))
  }, []);
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
    emi: emi
  };
  try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/loans/apply", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if(res.ok) {
      setDone(true);
      onNotify?.("🎉 Application submitted successfully!");
    } else {
      alert("Something went wrong!");
    }
  } catch(err) {
    console.error("Submit error:", err);
    alert("Cannot reach server. Is Spring Boot running?");
  }
};
const handleSendOtp = async () => {
  if(!form.mobile || form.mobile.length !== 10) {
    alert("Please enter valid 10 digit mobile number!");
    return;
  }
  try {
    const token = localStorage.getItem("token"); // ← get JWT
    const res = await fetch("http://localhost:8080/api/otp/send", {
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
    const res = await fetch("http://localhost:8080/api/otp/verify", {
      method: "POST",
      headers: { 

        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
       },
      body: JSON.stringify({ mobile: form.mobile, otp: form.otp })
    });
    const data = await res.json();
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
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));
  const ea=(()=>{ if(!lt)return 0; const base=parseFloat(form.income)||0; return ["salary","pension","itr"].includes(lt.id)?base*lt.mult:base*lt.mult/100; })();
  const emi=calcEMI(ea,lt?.rate||10,tenure);
  const loanAmt=parseFloat(form.loanAmt)||ea;
  const cEmi=calcEMI(loanAmt,lt?.rate||10,tenure);

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
                <select value={form.empType||""} onChange={e=>set("empType",e.target.value)} style={{ padding:"10px 12px", borderRadius:10, border:`1px solid ${C.gray100}`, fontSize:14, outline:"none", color:C.gray700 }}>
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
                <input type="number" placeholder="Enter amount" value={form.loanAmt||""} onChange={e=>set("loanAmt",e.target.value)} style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:`1px solid ${C.gray100}`, fontSize:16, outline:"none" }} />
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
              {[{label:"Aadhaar Number",ph:"XXXX XXXX XXXX",k:"aadhaar"},{label:"PAN Number",ph:"ABCDE1234F",k:"panKyc"}].map(f=>(
                <Input key={f.k} label={f.label} placeholder={f.ph} value={form[f.k]||""} onChange={e=>set(f.k,e.target.value)} />
              ))}
              <div style={{ gridColumn:"1/-1" }}>
                <button onClick={async ()=>{
  if(!form.aadhaar || !form.panKyc) {
    alert("Please enter Aadhaar and PAN number!");
    return;
  }
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:8080/api/kyc/verify", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ aadhaar: form.aadhaar, pan: form.panKyc })
    });
    const data = await res.json();
    
    console.log("KYC Response:", data); // ← check F12 console
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
  const flagged = apps.filter(a=>a.flags&&a.flags.length>0);

  async function analyzeAI(app) {
    setSel(app); setAnalysis(""); setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{ "Content-Type":"application/json", "x-api-key":process.env.REACT_APP_ANTHROPIC_KEY||"", "anthropic-version":"2023-06-01" },
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:600, system:"You are a fraud detection AI. Return: 1) Fraud probability %, 2) Risk indicators, 3) Recommended action.", messages:[{role:"user",content:`Fraud check: ${app.applicant}, ${app.type}, ₹${app.amount.toLocaleString("en-IN")}, CIBIL:${app.score}, Flags:${app.flags.join(",")}`}] })
      });
      const data = await res.json(); setAnalysis(data.content?.[0]?.text||"");
    } catch { setAnalysis("Add REACT_APP_ANTHROPIC_KEY in .env for AI analysis."); }
    setLoading(false);
  }

  return (
    <div>
      <Title sub="AI-powered real-time fraud pattern analysis">🚨 Fraud Detection Engine</Title>
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
                  <div><div style={{ fontWeight:600, color:C.navy }}>{app.applicant}</div><div style={{ fontSize:12, color:C.gray500 }}>{app.id} · {app.type}</div></div>
                  <RiskBadge risk={app.risk}/>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:6 }}>{app.flags.map((f,i)=><span key={i} style={{ background:C.redBg, color:C.red, fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:12 }}>⚠ {f}</span>)}</div>
                <div style={{ fontSize:12, color:C.gray500 }}>Amount: {fmtINR(app.amount)} · CIBIL: {app.score}</div>
              </div>
            ))}
          </Card>
        </div>
        <div>
          {sel?(
            <Card><div style={{ fontWeight:600, color:C.navy, fontSize:14, marginBottom:12 }}>🤖 AI Fraud Analysis</div>
              <div style={{ background:C.gray50, borderRadius:10, padding:12, marginBottom:12 }}><div style={{ fontSize:15, fontWeight:600, color:C.navy }}>{sel.applicant}</div><div style={{ fontSize:12, color:C.gray500, marginTop:4 }}>{sel.type} · {fmtINR(sel.amount)}</div></div>
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

/* ═══════════════════════════════════════════════════════════════════════
   APPROVAL WORKFLOW (Checker / Maker / Authorizer)
═══════════════════════════════════════════════════════════════════════ */
function ApprovalWorkflow({ apps, setApps, role, onNotify }) {
  const [sel,setSel]         = useState(null);
  const [insight,setInsight] = useState("");
  const [loading,setLoading] = useState(false);
  const queue = role==="checker"?apps.filter(a=>a.status==="pending"):role==="maker"?apps.filter(a=>a.status==="under_review"):apps.filter(a=>a.status==="approved");

  function update(id,status) {
    setApps(p=>p.map(a=>a.id===id?{...a,status}:a));
    setSel(p=>p?.id===id?{...p,status}:p);
    onNotify?.(`Application ${id} → ${status.replace("_"," ").toUpperCase()}`);
  }

  async function getInsight(app) {
    setSel(app); setInsight(""); setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{ "Content-Type":"application/json", "x-api-key":process.env.REACT_APP_ANTHROPIC_KEY||"", "anthropic-version":"2023-06-01" },
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:600, system:"You are a senior bank loan officer AI. Provide: Credit Rating, Loan-to-Income Ratio, Risk level, Recommendation (Approve/Review/Reject). Be concise.", messages:[{role:"user",content:`Analyze: ${app.applicant}, ${app.type}, ₹${app.amount.toLocaleString("en-IN")}, CIBIL:${app.score}, Income:${app.salary?fmtINR(app.salary):"N/A"}, Risk:${app.risk}, Flags:${app.flags?.join(",")||"None"}`}] })
      });
      const data = await res.json(); setInsight(data.content?.[0]?.text||"");
    } catch { setInsight("Add REACT_APP_ANTHROPIC_KEY in .env for AI assessment."); }
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
                <div><div style={{ fontWeight:600, fontSize:14, color:sel?.id===app.id?C.white:C.navy }}>{app.applicant}</div><div style={{ fontSize:11, color:sel?.id===app.id?"rgba(255,255,255,0.5)":C.gray500 }}>{app.id} · {app.type}</div></div>
                <Badge status={app.status}/>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:15, fontWeight:700, color:sel?.id===app.id?C.gold:C.navy }}>{fmtINR(app.amount)}</span>
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
                {[{label:"Loan Type",value:sel.type},{label:"Amount",value:fmtINR(sel.amount)},{label:"CIBIL Score",value:sel.score},{label:"Income",value:sel.salary?fmtINR(sel.salary):"N/A"},{label:"Risk Level",value:<RiskBadge risk={sel.risk}/>},{label:"Stage",value:STAGES[sel.stage||0]}].map((item,i)=>(
                  <div key={i} style={{ background:C.gray50, borderRadius:8, padding:"10px 12px" }}><div style={{ fontSize:11, color:C.gray500, marginBottom:2 }}>{item.label}</div><div style={{ fontSize:13, fontWeight:600, color:C.navy }}>{item.value}</div></div>
                ))}
              </div>
              <div style={{ background:C.gray50, borderRadius:12, padding:14, marginBottom:16, minHeight:80 }}>
                <div style={{ fontSize:12, fontWeight:600, color:C.navy, marginBottom:8 }}>🤖 AI Risk Assessment</div>
                {loading?<div style={{ color:C.gray500, fontSize:13 }}>Analyzing...</div>:<div style={{ fontSize:13, color:C.gray700, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{insight||"Click an application to analyze"}</div>}
              </div>
              <div style={{ display:"flex", gap:10 }}>
                {role==="checker"&&sel.status==="pending"&&<><button onClick={()=>update(sel.id,"under_review")} style={{ flex:1, padding:"11px", borderRadius:10, background:C.navy, color:C.white, border:"none", cursor:"pointer", fontWeight:600, fontSize:13 }}>Forward to Maker</button><button onClick={()=>update(sel.id,"rejected")} style={{ flex:1, padding:"11px", borderRadius:10, background:C.redBg, color:C.red, border:"none", cursor:"pointer", fontWeight:600, fontSize:13 }}>Reject</button></>}
                {role==="maker"&&sel.status==="under_review"&&<><button onClick={()=>update(sel.id,"approved")} style={{ flex:1, padding:"11px", borderRadius:10, background:C.green, color:C.white, border:"none", cursor:"pointer", fontWeight:600, fontSize:13 }}>✓ Approve</button><button onClick={()=>update(sel.id,"rejected")} style={{ flex:1, padding:"11px", borderRadius:10, background:C.redBg, color:C.red, border:"none", cursor:"pointer", fontWeight:600, fontSize:13 }}>✗ Reject</button></>}
                {role==="authorizer"&&sel.status==="approved"&&<><button onClick={()=>update(sel.id,"disbursed")} style={{ flex:1, padding:"11px", borderRadius:10, background:C.purple, color:C.white, border:"none", cursor:"pointer", fontWeight:600, fontSize:13 }}>💸 Disburse</button><button onClick={()=>update(sel.id,"rejected")} style={{ flex:1, padding:"11px", borderRadius:10, background:C.redBg, color:C.red, border:"none", cursor:"pointer", fontWeight:600, fontSize:13 }}>✗ Reject</button></>}
              </div>
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
      <Title sub="Real-time loan disbursement pipeline with stage-wise tracking">📦 Disbursement Tracker</Title>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <div>
          {active.length===0&&<Card style={{ textAlign:"center", padding:40 }}><div style={{ fontSize:40 }}>📭</div><div style={{ color:C.gray500, fontSize:14, marginTop:8 }}>No loans in disbursement pipeline</div></Card>}
          {active.map(app=>(
            <div key={app.id} onClick={()=>setSel(app)} style={{ background:sel?.id===app.id?C.navy:C.white, borderRadius:14, padding:16, marginBottom:10, border:`1px solid ${sel?.id===app.id?C.navy:C.gray100}`, cursor:"pointer", transition:"all 0.2s" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}><div><div style={{ fontWeight:600, color:sel?.id===app.id?C.white:C.navy }}>{app.applicant}</div><div style={{ fontSize:12, color:sel?.id===app.id?"rgba(255,255,255,0.5)":C.gray500 }}>{app.type}</div></div><Badge status={app.status}/></div>
              <div style={{ fontSize:15, fontWeight:700, color:sel?.id===app.id?C.gold:C.navy, marginBottom:8 }}>{fmtINR(app.amount)}</div>
              <div style={{ display:"flex", gap:3 }}>{STAGES.map((_,i)=><div key={i} style={{ flex:1, height:4, borderRadius:2, background:i<=(app.stage||0)?C.gold:sel?.id===app.id?"rgba(255,255,255,0.15)":C.gray100 }} />)}</div>
              <div style={{ fontSize:11, color:sel?.id===app.id?"rgba(255,255,255,0.5)":C.gray500, marginTop:4 }}>{STAGES[app.stage||0]}</div>
            </div>
          ))}
        </div>
        {sel?(
          <Card>
            <div style={{ fontWeight:700, color:C.navy, fontSize:16, marginBottom:4 }}>{sel.applicant}</div>
            <div style={{ fontSize:13, color:C.gray500, marginBottom:20 }}>{sel.id} · {fmtINR(sel.amount)}</div>
            {STAGES.map((stage,i)=>{
              const done=i<=(sel.stage||0); const cur=i===(sel.stage||0);
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

/* ═══════════════════════════════════════════════════════════════════════
   MY LOANS
═══════════════════════════════════════════════════════════════════════ */
function MyLoans({ apps }) {
  const [sel,setSel]=useState(null);
    if (!Array.isArray(apps)) {
    console.log("apps is not array:", apps);
    return <div>Loading...</div>;
  }

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
              <div><div style={{ fontWeight:600, color:sel?.id===app.id?C.white:C.navy }}>{app.loanName}</div><div style={{ fontSize:12, color:sel?.id===app.id?"rgba(255,255,255,0.5)":C.gray500 }}>{app.id} · {app.date}</div><div style={{ marginTop:6 }}><Badge status={app.status}/></div></div>
              <div style={{ textAlign:"right" }}><div style={{ fontWeight:700, fontSize:20, color:sel?.id===app.id?C.gold:C.navy }}>{fmtINR(app.amount)}</div><div style={{ fontSize:12, color:sel?.id===app.id?"rgba(255,255,255,0.4)":C.gray500, marginTop:4 }}>CIBIL: {app.score}</div></div>
            </div>
          ))}
        </div>
        {sel&&(
          <Card>
            <div style={{ fontWeight:700, color:C.navy, fontSize:16, marginBottom:4 }}>{sel.type}</div>
            <div style={{ fontSize:13, color:C.gray500, marginBottom:20 }}>{sel.id} · {fmtINR(sel.amount)}</div>
            {STAGES.map((stage,i)=>{
              const done=i<=(sel.stage||0); const cur=i===(sel.stage||0);
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
  const notify = msg => setToast(msg);
  
const fetchApps = async () => {
  try {
    const endpoint =
      currentUser?.role === "user"
        ? "/api/loans/my"   // 👤 only user's loans
        : "/api/loans/all"; // 👨‍💼 admin/all roles

    const res = await axios.get(
      `http://localhost:8080${endpoint}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      }
    );

    setApps(res.data);

  } catch (err) {
    console.error("API error:", err);
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
    fetchApps();
  }
}, [currentUser]);

  function handleLogin(user) {
    setCurrentUser(user);
    setPage(user.role==="user"?"apply":"analytics");
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
  };

  // Show login page if not logged in
  if(!currentUser) return <LoginPage onLogin={handleLogin} />;

  const nav = NAV[currentUser.role]||[];
  const roleColors = { user:C.blue, checker:C.amber, maker:C.green, authorizer:C.purple };
  const roleColor  = roleColors[currentUser.role]||C.navy;

  return (
    <div style={{ minHeight:"100vh", background:C.cream }}>
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
        {page==="analytics"  && <Analytics apps={apps}/>}
        {page==="apply"      && <ApplyLoan onNotify={notify}/>}
        {page==="myloans"    && <MyLoans apps={apps}/>}
        {page==="cibil"      && <CIBILSimulator/>}
        {page==="ai"         && <div style={{ maxWidth:700, margin:"0 auto" }}><Title sub="Personalized loan advice powered by Claude AI">🤖 AI Loan Advisor</Title><AIChat/></div>}
        {page==="workflow"   && <ApprovalWorkflow apps={apps} setApps={setApps} role={currentUser.role} onNotify={notify}/>}
        {page==="fraud"      && <FraudPanel apps={apps}/>}
        {page==="disburse"   && <DisbursementTracker apps={apps}/>}
        {page==="redis"      && <RedisPanel/>}
      </main>
    </div>
  );
}
