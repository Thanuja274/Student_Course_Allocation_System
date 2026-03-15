import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function StudentDashboard() {
  const { user, logout }  = useAuth();
  const { tab: urlTab }   = useParams();
  const navigate          = useNavigate();
  const [tab, setTab]     = useState(urlTab || 'courses');
  const [courses,     setCourses]     = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [result,      setResult]      = useState({ published:false, results:[] });
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [message,     setMessage]     = useState('');
  const [error,       setError]       = useState('');

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (urlTab) setTab(urlTab); }, [urlTab]);

  const goTab = key => { setTab(key); navigate(`/dashboard/${key}`, { replace:true }); };

  const loadData = async () => {
    setLoading(true);
    try {
      const [cR, pR, rR] = await Promise.all([
        api.get('/courses'),
        api.get('/preferences/mine'),
        api.get('/allocation/my-result'),
      ]);
      setCourses(cR.data);
      setPreferences(pR.data.map(p => ({
        course_id:    p.course_id,
        priority_rank:p.priority_rank,
        name:         p.name,
        code:         p.code,
        credits:      p.credits,
        schedule:     p.schedule,
      })));
      setResult(rR.data);
    } catch {
      setError('Failed to load data. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const addCourse = course => {
    if (preferences.find(p => p.course_id === course.id)) return;
    if (preferences.length >= 8) { setError('Maximum 8 preferences allowed'); return; }
    setError('');
    setPreferences(prev => [...prev, {
      course_id:    course.id,
      name:         course.name,
      code:         course.code,
      credits:      course.credits,
      schedule:     course.schedule,
      priority_rank:prev.length + 1,
    }]);
  };

  const removeCourse = courseId =>
    setPreferences(prev =>
      prev.filter(p => p.course_id !== courseId).map((p,i) => ({...p, priority_rank:i+1}))
    );

  const moveUp = i => {
    if (i === 0) return;
    setPreferences(prev => {
      const a = [...prev];
      [a[i-1], a[i]] = [a[i], a[i-1]];
      return a.map((p,j) => ({...p, priority_rank:j+1}));
    });
  };

  const moveDown = i => {
    setPreferences(prev => {
      if (i === prev.length - 1) return prev;
      const a = [...prev];
      [a[i], a[i+1]] = [a[i+1], a[i]];
      return a.map((p,j) => ({...p, priority_rank:j+1}));
    });
  };

  const handleSubmit = async () => {
    if (!preferences.length) { setError('Add at least one preference'); return; }
    setSaving(true); setError(''); setMessage('');
    try {
      await api.post('/preferences', {
        preferences: preferences.map(p => ({
          course_id:    p.course_id,
          priority_rank:p.priority_rank,
        }))
      });
      setMessage('✅ Preferences saved successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const clearAll = async () => {
    if (!window.confirm('Clear all preferences?')) return;
    try {
      await api.delete('/preferences');
      setPreferences([]);
      setMessage('Preferences cleared.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to clear');
    }
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'linear-gradient(135deg,#fdf2f8,#e0f2fe)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:52, marginBottom:'1rem' }}>🎓</div>
        <div style={{ fontSize:16, fontWeight:700, color:'#ec4899' }}>Loading your dashboard...</div>
        <div style={{ fontSize:13, color:'#94a3b8', marginTop:'0.5rem' }}>Fetching courses and preferences...</div>
      </div>
    </div>
  );

  const statusColor = s => ({
    allocated: '#16a34a',
    waitlisted:'#d97706',
    rejected:  '#dc2626',
  }[s] || '#888');

  const TABS = [
    { key:'courses',     label:'Browse Courses' },
    { key:'preferences', label:`My Preferences (${preferences.length}/8)` },
    { key:'results',     label:'Allocation Result' },
  ];

  return (
    <div style={S.page}>

      {/* ── Navbar ── */}
      <div style={S.nav}>
        <div style={S.navLeft} onClick={() => navigate('/')}>
          <div style={S.logoCircle}>🎓</div>
          <span style={S.navTitle}>CourseAllocator</span>
        </div>
        <div style={S.navCenter}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => goTab(t.key)}
              style={{ ...S.navLink, ...(tab === t.key ? S.navActive : {}) }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={S.navRight}>
          {result.published && <span style={S.publishedBadge}>✓ Results Out</span>}
          <span style={S.navUser}>{user.name}</span>
          <button onClick={() => { logout(); navigate('/'); }} style={S.logoutBtn}>Logout</button>
        </div>
      </div>

      {/* ── Banner ── */}
      <div style={S.banner}>
        <div style={S.bannerInfo}>
          <div style={S.avatar}>{user.name?.charAt(0)}</div>
          <div>
            <div style={S.bannerName}>Welcome back, {user.name} 👋</div>
            <div style={S.bannerSub}>
              {user.roll_number} · {user.department_name} · Year {user.current_year} · CGPA {user.cgpa}
            </div>
          </div>
        </div>
        <div style={S.bannerStats}>
          <div style={S.bStat}>
            <div style={S.bNum}>{preferences.length}</div>
            <div style={S.bLabel}>Preferences</div>
          </div>
          <div style={S.bStat}>
            <div style={S.bNum}>{courses.length}</div>
            <div style={S.bLabel}>Courses</div>
          </div>
          <div style={S.bStat}>
            <div style={{ ...S.bNum, color: result.published ? '#4ade80' : '#fbbf24' }}>
              {result.published ? 'Done' : 'Pending'}
            </div>
            <div style={S.bLabel}>Allocation</div>
          </div>
        </div>
      </div>

      <div style={S.body}>

        {/* ══════════ COURSES TAB ══════════ */}
        {tab === 'courses' && (
          <div>
            <div style={S.pageHeader}>
              <div>
                <h2 style={S.pageTitle}>Available Courses</h2>
                <p style={S.pageDesc}>Click Add to include a course in your preferences</p>
              </div>
              <button onClick={() => goTab('preferences')} style={S.primaryBtn}>
                View My Preferences ({preferences.length}) →
              </button>
            </div>

            {courses.length === 0 ? (
              <div style={S.emptyState}>
                <div style={{ fontSize:48 }}>📚</div>
                <div style={{ marginTop:'0.75rem', fontSize:15, color:'#64748b' }}>No courses available yet.</div>
              </div>
            ) : (
              <div style={S.courseGrid}>
                {courses.map(course => {
                  const added = !!preferences.find(p => p.course_id === course.id);
                  const full  = course.available_seats <= 0;
                  return (
                    <div key={course.id} style={{ ...S.courseCard, opacity: full ? 0.7 : 1 }}>
                      <div style={S.courseTop}>
                        <span style={S.codeTag}>{course.code}</span>
                        <span style={{ ...S.seatPill,
                          background: full ? '#fce7f3' : '#dcfce7',
                          color:      full ? '#be185d' : '#15803d' }}>
                          {full ? '🔒 Full' : `${course.available_seats} seats`}
                        </span>
                      </div>
                      <div style={S.courseName}>{course.name}</div>
                      <div style={S.courseMeta}>{course.credits} credits · {course.instructor}</div>
                      <div style={S.courseSchedule}>{course.schedule || 'Schedule TBD'}</div>
                      <div style={S.deptPill}>{course.department_name}</div>
                      <button
                        onClick={() => addCourse(course)}
                        disabled={added || full}
                        style={{ ...S.addBtn,
                          background: added
                            ? '#dcfce7'
                            : full
                            ? '#f1f5f9'
                            : 'linear-gradient(135deg,#ec4899,#f472b6)',
                          color:  added ? '#15803d' : full ? '#94a3b8' : '#fff',
                          cursor: added || full ? 'default' : 'pointer',
                          boxShadow: added || full ? 'none' : '0 4px 15px rgba(236,72,153,0.3)',
                        }}>
                        {added ? '✓ Added' : full ? 'Course Full' : '+ Add to Preferences'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════ PREFERENCES TAB ══════════ */}
        {tab === 'preferences' && (
          <div style={{ maxWidth:700 }}>
            <div style={S.pageHeader}>
              <div>
                <h2 style={S.pageTitle}>My Preferences</h2>
                <p style={S.pageDesc}>Rank 1 = top choice. Use arrows to reorder.</p>
              </div>
              <div style={{ display:'flex', gap:'0.5rem' }}>
                <button onClick={() => goTab('courses')} style={S.secondaryBtn}>← Browse Courses</button>
                {preferences.length > 0 && (
                  <button onClick={clearAll} style={S.dangerBtn}>Clear All</button>
                )}
              </div>
            </div>

            {preferences.length === 0 ? (
              <div style={S.emptyState}>
                <div style={{ fontSize:52 }}>📋</div>
                <div style={{ marginTop:'0.75rem', fontSize:15, color:'#64748b' }}>No preferences added yet</div>
                <div style={{ fontSize:13, color:'#94a3b8', marginTop:'0.4rem' }}>
                  Go to Browse Courses and click Add
                </div>
                <button onClick={() => goTab('courses')} style={{ ...S.primaryBtn, marginTop:'1rem' }}>
                  Browse Courses →
                </button>
              </div>
            ) : (
              preferences.map((pref, i) => (
                <div key={pref.course_id} style={S.prefRow}>
                  <div style={S.rankCircle}>{i + 1}</div>
                  <div style={{ flex:1 }}>
                    <div style={S.prefName}>{pref.code} — {pref.name}</div>
                    <div style={S.prefMeta}>{pref.credits} credits · {pref.schedule || 'TBD'}</div>
                  </div>
                  <div style={{ display:'flex', gap:4 }}>
                    <button onClick={() => moveUp(i)}   disabled={i === 0}                    style={S.arrowBtn}>↑</button>
                    <button onClick={() => moveDown(i)} disabled={i === preferences.length-1} style={S.arrowBtn}>↓</button>
                    <button onClick={() => removeCourse(pref.course_id)}                      style={S.removeBtn}>✕</button>
                  </div>
                </div>
              ))
            )}

            {error   && <div style={S.errorBox}>{error}</div>}
            {message && <div style={S.successBox}>{message}</div>}

            {preferences.length > 0 && (
              <>
                <button onClick={handleSubmit} disabled={saving}
                  style={{ ...S.primaryBtn, width:'100%', marginTop:'1.25rem', padding:'0.85rem', fontSize:15 }}>
                  {saving ? 'Saving...' : '✓ Submit Preferences'}
                </button>
                <p style={{ fontSize:12, color:'#94a3b8', marginTop:'0.5rem', textAlign:'center' }}>
                  You can re-submit before the deadline to update your choices
                </p>
              </>
            )}
          </div>
        )}

        {/* ══════════ RESULTS TAB ══════════ */}
        {tab === 'results' && (
          <div style={{ maxWidth:700 }}>
            <div style={S.pageHeader}>
              <div>
                <h2 style={S.pageTitle}>Allocation Result</h2>
                <p style={S.pageDesc}>Your course allocation for this semester</p>
              </div>
              <button onClick={loadData} style={S.secondaryBtn}>🔄 Refresh</button>
            </div>

            {!result.published ? (
              <div style={S.emptyState}>
                <div style={{ fontSize:52 }}>⏳</div>
                <div style={{ marginTop:'0.75rem', fontSize:15, color:'#64748b', fontWeight:600 }}>
                  Results not published yet
                </div>
                <div style={{ fontSize:13, color:'#94a3b8', marginTop:'0.4rem' }}>
                  Admin needs to run the allocation engine first
                </div>
                <button onClick={() => goTab('preferences')} style={{ ...S.secondaryBtn, marginTop:'1rem' }}>
                  View My Preferences
                </button>
              </div>
            ) : result.results.length === 0 ? (
              <div style={S.emptyState}>
                <div style={{ fontSize:52 }}>😔</div>
                <div style={{ marginTop:'0.75rem', fontSize:15, color:'#64748b' }}>No allocation found</div>
                <div style={{ fontSize:13, color:'#94a3b8', marginTop:'0.4rem' }}>
                  Please contact the administrator
                </div>
              </div>
            ) : (
              result.results.map((r, i) => (
                <div key={i} style={{ ...S.resultCard, borderLeft:`4px solid ${statusColor(r.status)}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:15, color:'#1e293b' }}>
                        {r.code} — {r.name}
                      </div>
                      <div style={{ fontSize:12, color:'#64748b', marginTop:3 }}>
                        {r.credits} credits · {r.instructor}
                      </div>
                      <div style={{ fontSize:11, color:'#94a3b8', fontFamily:'monospace', marginTop:3 }}>
                        {r.schedule}
                      </div>
                      {r.preference_rank && (
                        <div style={{ fontSize:12, color:'#ec4899', marginTop:5, fontWeight:600 }}>
                          Fulfilled at preference rank #{r.preference_rank}
                          {r.allocated_by === 'admin' && ' · Admin override'}
                        </div>
                      )}
                    </div>
                    <span style={{
                      background: r.status === 'allocated'
                        ? 'linear-gradient(135deg,#dcfce7,#bbf7d0)'
                        : r.status === 'waitlisted'
                        ? 'linear-gradient(135deg,#fef9c3,#fef08a)'
                        : 'linear-gradient(135deg,#fce7f3,#fbcfe8)',
                      color: statusColor(r.status),
                      borderRadius:20, padding:'4px 14px', fontSize:12, fontWeight:700, flexShrink:0,
                      border:`1px solid ${statusColor(r.status)}33`,
                    }}>
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}

const S = {
  page:    { fontFamily:"'Segoe UI',system-ui,sans-serif", minHeight:'100vh', background:'linear-gradient(135deg,#fdf2f8 0%,#e0f2fe 100%)' },

  // Navbar
  nav:     { background:'rgba(255,255,255,0.96)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(236,72,153,0.15)', padding:'0 1.5rem', height:60, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 20px rgba(236,72,153,0.08)' },
  navLeft: { display:'flex', alignItems:'center', gap:'0.6rem', cursor:'pointer' },
  logoCircle:{ fontSize:18, background:'linear-gradient(135deg,#ec4899,#38bdf8)', borderRadius:'50%', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center' },
  navTitle:{ fontSize:15, fontWeight:900, background:'linear-gradient(135deg,#ec4899,#0284c7)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' },
  navCenter:{ display:'flex', gap:'0.25rem' },
  navLink: { background:'none', border:'none', color:'#94a3b8', fontSize:13, cursor:'pointer', padding:'6px 14px', borderRadius:20, fontWeight:500 },
  navActive:{ background:'linear-gradient(135deg,rgba(236,72,153,0.1),rgba(56,189,248,0.1))', color:'#ec4899', fontWeight:700, border:'1px solid rgba(236,72,153,0.2)' },
  navRight:{ display:'flex', alignItems:'center', gap:'0.75rem' },
  navUser: { fontSize:13, color:'#64748b', fontWeight:500 },
  publishedBadge:{ background:'linear-gradient(135deg,#16a34a,#22c55e)', color:'#fff', borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:600 },
  logoutBtn:{ background:'linear-gradient(135deg,rgba(236,72,153,0.1),rgba(56,189,248,0.1))', border:'1px solid rgba(236,72,153,0.25)', color:'#ec4899', borderRadius:20, padding:'5px 14px', cursor:'pointer', fontSize:12, fontWeight:600 },

  // Banner
  banner:    { background:'linear-gradient(135deg,#ec4899,#a855f7,#38bdf8)', color:'#fff', padding:'1.5rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem' },
  bannerInfo:{ display:'flex', alignItems:'center', gap:'1rem' },
  avatar:    { width:48, height:48, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700, flexShrink:0, border:'2px solid rgba(255,255,255,0.4)' },
  bannerName:{ fontSize:'1.1rem', fontWeight:700 },
  bannerSub: { fontSize:13, color:'rgba(255,255,255,0.8)', marginTop:3 },
  bannerStats:{ display:'flex', gap:'1.5rem' },
  bStat:     { textAlign:'center' },
  bNum:      { fontSize:'1.4rem', fontWeight:700 },
  bLabel:    { fontSize:11, color:'rgba(255,255,255,0.7)', marginTop:2 },

  // Body
  body:      { padding:'1.5rem 2rem' },
  pageHeader:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem', flexWrap:'wrap', gap:'0.75rem' },
  pageTitle: { fontSize:'1.1rem', fontWeight:800, color:'#1e293b', margin:0 },
  pageDesc:  { fontSize:13, color:'#64748b', marginTop:3 },

  // Buttons
  primaryBtn:  { background:'linear-gradient(135deg,#ec4899,#f472b6)', color:'#fff', border:'none', borderRadius:25, padding:'0.55rem 1.1rem', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 15px rgba(236,72,153,0.3)' },
  secondaryBtn:{ background:'rgba(255,255,255,0.8)', color:'#475569', border:'1px solid rgba(236,72,153,0.2)', borderRadius:25, padding:'0.5rem 1rem', fontSize:13, cursor:'pointer', fontWeight:500 },
  dangerBtn:   { background:'none', border:'1px solid rgba(236,72,153,0.3)', color:'#ec4899', borderRadius:25, padding:'0.5rem 1rem', fontSize:13, cursor:'pointer' },

  // Course grid
  courseGrid:{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1rem' },
  courseCard:{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(8px)', borderRadius:16, padding:'1.25rem', border:'1px solid rgba(236,72,153,0.1)', display:'flex', flexDirection:'column', gap:'0.45rem', boxShadow:'0 4px 16px rgba(236,72,153,0.06)' },
  courseTop: { display:'flex', justifyContent:'space-between', alignItems:'center' },
  codeTag:   { fontSize:11, fontWeight:700, color:'#ec4899', background:'rgba(236,72,153,0.08)', padding:'2px 8px', borderRadius:6, border:'1px solid rgba(236,72,153,0.15)' },
  seatPill:  { fontSize:11, fontWeight:600, padding:'2px 9px', borderRadius:10 },
  courseName:{ fontSize:15, fontWeight:700, color:'#1e293b', lineHeight:1.3 },
  courseMeta:{ fontSize:12, color:'#64748b' },
  courseSchedule:{ fontSize:11, color:'#94a3b8', fontFamily:'monospace' },
  deptPill:  { fontSize:11, color:'#0284c7', background:'#e0f2fe', padding:'2px 8px', borderRadius:6, alignSelf:'flex-start' },
  addBtn:    { marginTop:'0.4rem', width:'100%', padding:'0.6rem', borderRadius:10, border:'none', fontSize:13, fontWeight:700 },

  // Preferences
  prefRow:   { display:'flex', alignItems:'center', gap:'0.75rem', background:'rgba(255,255,255,0.9)', backdropFilter:'blur(8px)', border:'1px solid rgba(236,72,153,0.1)', borderRadius:12, padding:'0.8rem 1rem', marginBottom:'0.5rem', boxShadow:'0 2px 8px rgba(236,72,153,0.05)' },
  rankCircle:{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#ec4899,#f472b6)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, flexShrink:0 },
  prefName:  { fontWeight:700, fontSize:14, color:'#1e293b' },
  prefMeta:  { fontSize:12, color:'#64748b', marginTop:2 },
  arrowBtn:  { background:'rgba(255,255,255,0.8)', border:'1px solid rgba(236,72,153,0.2)', borderRadius:8, cursor:'pointer', padding:'4px 9px', fontSize:13, color:'#ec4899' },
  removeBtn: { background:'none', border:'1px solid rgba(236,72,153,0.3)', borderRadius:8, cursor:'pointer', padding:'4px 9px', fontSize:13, color:'#ec4899' },

  // Messages
  errorBox:  { background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:10, padding:'0.6rem 0.9rem', fontSize:13, color:'#dc2626', marginTop:'0.75rem' },
  successBox:{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:10, padding:'0.6rem 0.9rem', fontSize:13, color:'#16a34a', marginTop:'0.75rem' },

  // Empty state
  emptyState:{ textAlign:'center', padding:'3.5rem 2rem', background:'rgba(255,255,255,0.8)', backdropFilter:'blur(8px)', borderRadius:16, border:'1px solid rgba(236,72,153,0.1)' },

  // Result cards
  resultCard:{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(8px)', border:'1px solid rgba(236,72,153,0.1)', borderRadius:12, padding:'1.1rem 1.25rem', marginBottom:'0.75rem', boxShadow:'0 4px 16px rgba(236,72,153,0.05)' },
};