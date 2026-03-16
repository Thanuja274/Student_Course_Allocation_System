import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    roll_number: '',
    department_id: '',
    current_year: '',
    cgpa: ''
  });
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        console.log('Fetching departments...');
        const response = await api.get('/auth/departments');
        console.log('Departments response:', response);
        setDepartments(response.data);
        console.log('Departments loaded:', response.data);
      } catch (err) {
        console.error('Failed to fetch departments:', err);
        setError('Failed to load departments');
      } finally {
        setDepartmentsLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    console.log('Form submitted:', form);
    
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting registration with:', {
        name: form.name,
        email: form.email,
        password: form.password,
        roll_number: form.roll_number,
        department_id: parseInt(form.department_id),
        current_year: parseInt(form.current_year),
        cgpa: parseFloat(form.cgpa)
      });
      
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        roll_number: form.roll_number,
        department_id: parseInt(form.department_id),
        current_year: parseInt(form.current_year),
        cgpa: parseFloat(form.cgpa)
      });
      
      console.log('Registration successful!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <nav style={S.nav}>
        <div style={S.navLeft} onClick={() => navigate('/')}>
          <div style={S.logoCircle}>🎓</div>
          <span style={S.logoText}>CourseAllocator</span>
        </div>
        <div style={{ display:'flex', gap:'0.75rem' }}>
          <button onClick={() => navigate('/student-login')} style={S.outlineBtn}>Student Login</button>
          <button onClick={() => navigate('/register')} style={S.activeBtn}>Sign Up</button>
        </div>
      </nav>
      <div style={S.topBar} />

      {error && <div style={{background: '#fef2f2', color: '#dc2626', padding: '10px', margin: '10px', borderRadius: '8px'}}>{error}</div>}

      <div style={S.body}>
        <div style={S.leftPanel}>
          <div style={S.blob1}/><div style={S.blob2}/>
          <div style={S.leftContent}>
            <div style={{ fontSize:64, marginBottom:'1rem' }}>🎓</div>
            <h2 style={S.leftTitle}>Join<br/>Student Portal</h2>
            <p style={S.leftDesc}>Create your account to browse courses, submit preferences, and view your allocation results.</p>
            <div style={S.featureList}>
              {['Browse available courses','Rank up to 8 preferences','Real-time seat availability','Instant allocation results'].map((f,i) => (
                <div key={i} style={S.featureItem}><span style={S.fDot}>✓</span> {f}</div>
              ))}
            </div>
          </div>
        </div>

        <div style={S.rightPanel}>
          <div style={S.formCard}>
            <h1 style={S.formTitle}>Create Account</h1>
            <p style={S.formSub}>Register for a new student account</p>
            <form onSubmit={handleSubmit}>
              <div style={S.row}>
                <div style={S.field}>
                  <label style={S.label}>Full Name</label>
                  <input type="text" required placeholder="John Doe"
                    value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={S.input} />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Email Address</label>
                  <input type="email" required placeholder="you@student.edu"
                    value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} style={S.input} />
                </div>
              </div>

              <div style={S.row}>
                <div style={S.field}>
                  <label style={S.label}>Roll Number</label>
                  <input type="text" required placeholder="CS2024001"
                    value={form.roll_number} onChange={e=>setForm(f=>({...f,roll_number:e.target.value}))} style={S.input} />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Department</label>
                  <select required value={form.department_id} onChange={e=>setForm(f=>({...f,department_id:e.target.value}))} style={S.input} disabled={departmentsLoading}>
                    <option value="">{departmentsLoading ? 'Loading...' : 'Select Department'}</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                  {departments.length === 0 && !departmentsLoading && <div style={{color: 'red', fontSize: '12px', marginTop: '5px'}}>No departments loaded</div>}
                </div>
              </div>

              <div style={S.row}>
                <div style={S.field}>
                  <label style={S.label}>Current Year</label>
                  <select required value={form.current_year} onChange={e=>setForm(f=>({...f,current_year:e.target.value}))} style={S.input}>
                    <option value="">Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                <div style={S.field}>
                  <label style={S.label}>CGPA</label>
                  <input type="number" step="0.01" min="0" max="10" required placeholder="8.5"
                    value={form.cgpa} onChange={e=>setForm(f=>({...f,cgpa:e.target.value}))} style={S.input} />
                </div>
              </div>

              <div style={S.row}>
                <div style={S.field}>
                  <label style={S.label}>Password</label>
                  <input type="password" required placeholder="••••••••"
                    value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} style={S.input} />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Confirm Password</label>
                  <input type="password" required placeholder="••••••••"
                    value={form.confirmPassword} onChange={e=>setForm(f=>({...f,confirmPassword:e.target.value}))} style={S.input} />
                </div>
              </div>

              {error && <div style={S.error}>{error}</div>}
              <button type="submit" disabled={loading} style={S.btn}>
                {loading ? 'Creating Account...' : 'Create Account →'}
              </button>
            </form>
            <p style={S.foot}>Already have an account? <Link to="/student-login" style={S.link}>Sign in</Link></p>
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
  formCard:{ width:'100%', maxWidth:500, background:'#fff', borderRadius:24, padding:'2.5rem', boxShadow:'0 20px 60px rgba(236,72,153,0.1)', border:'1px solid rgba(236,72,153,0.1)' },
  formTitle:{ fontSize:'1.8rem', fontWeight:900, color:'#0f172a', margin:'0 0 0.25rem' },
  formSub: { fontSize:14, color:'#94a3b8', marginBottom:'1.75rem' },
  row:     { display:'flex', gap:'1rem', marginBottom:'1rem' },
  field:   { flex:1, marginBottom:'1rem' },
  label:   { display:'block', fontSize:13, fontWeight:700, marginBottom:6, color:'#374151' },
  input:   { width:'100%', padding:'0.75rem 1rem', borderRadius:12, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box', outline:'none', background:'#fafafa' },
  error:   { background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:10, padding:'0.6rem 1rem', fontSize:13, color:'#dc2626', marginBottom:'0.75rem' },
  btn:     { width:'100%', padding:'0.9rem', background:'linear-gradient(135deg,#ec4899,#f472b6)', color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor:'pointer', boxShadow:'0 8px 25px rgba(236,72,153,0.35)', marginTop:'0.5rem' },
  foot:    { textAlign:'center', marginTop:'1rem', fontSize:13, color:'#64748b' },
  link:    { color:'#ec4899', fontWeight:700 },
};
