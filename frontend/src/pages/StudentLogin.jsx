import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function StudentLogin() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form,    setForm]    = useState({ email:'', password:'' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role !== 'student') { setError('This login is for students only.'); setLoading(false); return; }
      navigate('/dashboard', { replace: true });
    } catch (err) { setError(err.response?.data?.error || 'Invalid credentials'); }
    finally { setLoading(false); }
  };

  return (
    <div style={S.page}>
      <nav style={S.nav}>
        <div style={S.navLeft} onClick={() => navigate('/')}>
          <div style={S.logoCircle}>🎓</div>
          <span style={S.logoText}>CourseAllocator</span>
        </div>
        <div style={{ display:'flex', gap:'0.75rem' }}>
          <button onClick={() => navigate('/student-login')} style={S.activeBtn}>Student Login</button>
          <button onClick={() => navigate('/admin-login')}   style={S.outlineBtn}>Admin Login</button>
        </div>
      </nav>
      <div style={S.topBar} />

      <div style={S.body}>
        <div style={S.leftPanel}>
          <div style={S.blob1}/><div style={S.blob2}/>
          <div style={S.leftContent}>
            <div style={{ fontSize:64, marginBottom:'1rem' }}>🎓</div>
            <h2 style={S.leftTitle}>Student<br/>Portal</h2>
            <p style={S.leftDesc}>Browse courses, submit preferences, and view your allocation results all in one place.</p>
            <div style={S.featureList}>
              {['Browse available courses','Rank up to 8 preferences','Real-time seat availability','Instant allocation results'].map((f,i) => (
                <div key={i} style={S.featureItem}><span style={S.fDot}>✓</span> {f}</div>
              ))}
            </div>
          </div>
        </div>

        <div style={S.rightPanel}>
          <div style={S.formCard}>
            <h1 style={S.formTitle}>Welcome Back!</h1>
            <p style={S.formSub}>Sign in to your student account</p>
            <form onSubmit={handleSubmit}>
              <div style={S.field}>
                <label style={S.label}>Email Address</label>
                <input type="email" required placeholder="you@student.edu"
                  value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} style={S.input} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Password</label>
                <input type="password" required placeholder="••••••••"
                  value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} style={S.input} />
              </div>
              {error && <div style={S.error}>{error}</div>}
              <button type="submit" disabled={loading} style={S.btn}>
                {loading ? 'Signing in...' : 'Sign In →'}
              </button>
            </form>
            <p style={S.foot}>New student? <Link to="/register" style={S.link}>Create an account</Link></p>
            <div style={S.demo}>
              <div style={S.demoTitle}>DEMO CREDENTIALS</div>
              <div style={S.demoRow}>
                <span style={S.demoTag}>Student</span>
                <span style={S.demoCred}>arjun@student.edu / student123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  page:    { fontFamily:"'Segoe UI',system-ui,sans-serif", minHeight:'100vh', background:'#fff' },
  nav:     { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 3rem', height:68, background:'rgba(255,255,255,0.96)', backdropFilter:'blur(10px)', boxShadow:'0 1px 20px rgba(236,72,153,0.1)', position:'sticky', top:0, zIndex:100 },
  navLeft: { display:'flex', alignItems:'center', gap:'0.75rem', cursor:'pointer' },
  logoCircle:{ fontSize:20, background:'linear-gradient(135deg,#ec4899,#38bdf8)', borderRadius:'50%', width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center' },
  logoText:{ fontSize:'1.2rem', fontWeight:900, background:'linear-gradient(135deg,#ec4899,#38bdf8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' },
  activeBtn: { background:'linear-gradient(135deg,#ec4899,#f472b6)', border:'none', color:'#fff', borderRadius:30, padding:'9px 22px', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 15px rgba(236,72,153,0.3)' },
  outlineBtn:{ background:'transparent', border:'2px solid #38bdf8', color:'#38bdf8', borderRadius:30, padding:'7px 22px', fontSize:13, fontWeight:700, cursor:'pointer' },
  topBar:  { height:4, background:'linear-gradient(90deg,#ec4899,#a855f7,#38bdf8)' },
  body:    { display:'flex', minHeight:'calc(100vh - 72px)' },
  leftPanel:{ flex:'0 0 42%', background:'linear-gradient(135deg,#fdf2f8,#fce7f3)', position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', padding:'3rem' },
  blob1:   { position:'absolute', width:350, height:350, borderRadius:'50%', background:'radial-gradient(circle,rgba(236,72,153,0.15),transparent)', top:-80, right:-80 },
  blob2:   { position:'absolute', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(56,189,248,0.1),transparent)', bottom:-80, left:-80 },
  leftContent:{ position:'relative', zIndex:1, textAlign:'center' },
  leftTitle:{ fontSize:'2rem', fontWeight:900, color:'#0f172a', lineHeight:1.2, margin:'0 0 1rem' },
  leftDesc:{ fontSize:14, color:'#64748b', lineHeight:1.7, marginBottom:'1.5rem' },
  featureList:{ textAlign:'left', display:'inline-block' },
  featureItem:{ fontSize:13, color:'#475569', marginBottom:'0.5rem', display:'flex', alignItems:'center', gap:'0.5rem' },
  fDot:    { color:'#ec4899', fontWeight:700 },
  rightPanel:{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' },
  formCard:{ width:'100%', maxWidth:420, background:'#fff', borderRadius:24, padding:'2.5rem', boxShadow:'0 20px 60px rgba(236,72,153,0.1)', border:'1px solid rgba(236,72,153,0.1)' },
  formTitle:{ fontSize:'1.8rem', fontWeight:900, color:'#0f172a', margin:'0 0 0.25rem' },
  formSub: { fontSize:14, color:'#94a3b8', marginBottom:'1.75rem' },
  field:   { marginBottom:'1rem' },
  label:   { display:'block', fontSize:13, fontWeight:700, marginBottom:6, color:'#374151' },
  input:   { width:'100%', padding:'0.75rem 1rem', borderRadius:12, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box', outline:'none', background:'#fafafa' },
  error:   { background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:10, padding:'0.6rem 1rem', fontSize:13, color:'#dc2626', marginBottom:'0.75rem' },
  btn:     { width:'100%', padding:'0.9rem', background:'linear-gradient(135deg,#ec4899,#f472b6)', color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor:'pointer', boxShadow:'0 8px 25px rgba(236,72,153,0.35)', marginTop:'0.5rem' },
  foot:    { textAlign:'center', marginTop:'1rem', fontSize:13, color:'#64748b' },
  link:    { color:'#ec4899', fontWeight:700 },
  demo:    { marginTop:'1.25rem', padding:'1rem', background:'linear-gradient(135deg,rgba(236,72,153,0.05),rgba(56,189,248,0.05))', borderRadius:12, border:'1px dashed rgba(236,72,153,0.3)' },
  demoTitle:{ fontSize:11, fontWeight:700, color:'#ec4899', marginBottom:'0.5rem', letterSpacing:1 },
  demoRow: { display:'flex', alignItems:'center', gap:'0.5rem' },
  demoTag: { fontSize:11, fontWeight:700, background:'linear-gradient(135deg,#ec4899,#f472b6)', color:'#fff', borderRadius:6, padding:'2px 8px' },
  demoCred:{ fontSize:12, color:'#374151', fontFamily:'monospace' },
};