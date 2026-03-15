import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user, logout }   = useAuth();
  const { tab: urlTab }    = useParams();
  const navigate           = useNavigate();
  const [tab, setTab]      = useState(urlTab || 'overview');
  const [stats,        setStats]       = useState(null);
  const [report,       setReport]      = useState([]);
  const [unallocated,  setUnallocated] = useState([]);
  const [allocations,  setAllocations] = useState([]);
  const [students,     setStudents]    = useState([]);
  const [courses,      setCourses]     = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [running,      setRunning]     = useState(false);
  const [msg,          setMsg]         = useState({ text:'', type:'' });
  const [showOverride, setShowOverride]= useState(false);
  const [oForm,        setOForm]       = useState({ student_id:'', course_id:'', note:'' });
  const [reportData,   setReportData]  = useState(null);
  const [reportType,   setReportType]  = useState('');
  const [reportLoading,setReportLoading]=useState(false);

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { if (urlTab) setTab(urlTab); }, [urlTab]);

  const goTab = key => { setTab(key); navigate(`/admin/${key}`, { replace: true }); };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, r, u, a, st, co] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/enrollment-report'),
        api.get('/admin/unallocated'),
        api.get('/allocation/all'),
        api.get('/admin/students'),
        api.get('/courses'),
      ]);
      setStats(s.data); setReport(r.data); setUnallocated(u.data);
      setAllocations(a.data); setStudents(st.data); setCourses(co.data);
    } catch (err) {
      flash(err.response?.data?.error || 'Failed to load data', 'error');
    } finally { setLoading(false); }
  };

  const flash = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text:'', type:'' }), 6000);
  };

  const runAllocation = async () => {
    if (!window.confirm('Run allocation engine? This replaces all existing results.')) return;
    setRunning(true);
    try {
      const { data } = await api.post('/allocation/run');
      flash(`✅ Done! Allocated: ${data.totalAllocated} · Waitlisted: ${data.totalWaitlisted} · Rate: ${data.allocationRate}`);
      await loadAll();
    } catch (err) { flash(err.response?.data?.error || 'Allocation failed', 'error'); }
    finally { setRunning(false); }
  };

  const resetAllocation = async () => {
    if (!window.confirm('Reset allocation? You can re-run after.')) return;
    try {
      await api.post('/admin/semester/reset');
      flash('Allocation reset. Ready to re-run.');
      await loadAll();
    } catch (err) { flash(err.response?.data?.error || 'Reset failed', 'error'); }
  };

  const removeAlloc = async (studentId, courseId) => {
    if (!window.confirm('Remove this allocation?')) return;
    try {
      await api.delete(`/allocation/${studentId}/${courseId}`);
      flash('Allocation removed successfully.');
      await loadAll();
    } catch (err) { flash(err.response?.data?.error || 'Failed to remove', 'error'); }
  };

  const handleOverride = async () => {
    if (!oForm.student_id || !oForm.course_id) { flash('Please select both student and course', 'error'); return; }
    try {
      await api.post('/allocation/override', {
        student_id: parseInt(oForm.student_id),
        course_id:  parseInt(oForm.course_id),
        note:       oForm.note,
      });
      flash('Manual override successful');
      setShowOverride(false);
      setOForm({ student_id:'', course_id:'', note:'' });
      await loadAll();
    } catch (err) { flash(err.response?.data?.error || 'Override failed', 'error'); }
  };

  // ── Load a specific report ──
  const loadReport = async (type) => {
    setReportLoading(true);
    setReportType(type);
    setReportData(null);
    try {
      const endpoints = {
        enrollment:    '/admin/report/enrollment',
        utilization:   '/admin/report/seat-utilization',
        unallocated:   '/admin/report/unallocated-students',
        popularity:    '/admin/report/course-popularity',
      };
      const { data } = await api.get(endpoints[type]);
      setReportData(data);
    } catch (err) { flash('Failed to load report', 'error'); }
    finally { setReportLoading(false); }
  };

  // ── Generate and download PDF ──
  const downloadPDF = () => {
    if (!reportData) return;
    const titles = {
      enrollment:  'Course Enrollment Report',
      utilization: 'Seat Utilization Report',
      unallocated: 'Unallocated Students Report',
      popularity:  'Course Popularity Analysis',
    };
    const semName = reportData.semester?.name || 'Current Semester';
    const now = new Date().toLocaleString();

    let tableHTML = '';

    if (reportType === 'enrollment') {
      tableHTML = `
        <table>
          <thead><tr>
            <th>Code</th><th>Course</th><th>Department</th><th>Instructor</th>
            <th>Capacity</th><th>Enrolled</th><th>Waitlisted</th><th>Available</th><th>Preferences</th><th>Utilization</th>
          </tr></thead>
          <tbody>
            ${reportData.data.map(r => `<tr>
              <td><b>${r.code}</b></td><td>${r.name}</td><td>${r.department}</td><td>${r.instructor}</td>
              <td>${r.max_seats}</td>
              <td style="color:#16a34a;font-weight:bold">${r.enrolled}</td>
              <td style="color:#d97706">${r.waitlisted}</td>
              <td>${r.available}</td><td>${r.total_preferences}</td>
              <td><b>${r.utilization_pct}%</b></td>
            </tr>`).join('')}
          </tbody>
        </table>`;
    } else if (reportType === 'utilization') {
      tableHTML = `
        <div class="summary-box">
          <div class="summary-item"><div class="summary-num">${reportData.summary?.total_seats}</div><div>Total Seats</div></div>
          <div class="summary-item"><div class="summary-num">${reportData.summary?.total_allocated}</div><div>Total Allocated</div></div>
          <div class="summary-item"><div class="summary-num">${reportData.summary?.overall_utilization}%</div><div>Overall Utilization</div></div>
        </div>
        <table>
          <thead><tr>
            <th>Code</th><th>Course</th><th>Department</th>
            <th>Capacity</th><th>Allocated</th><th>Waitlisted</th><th>Remaining</th><th>Utilization</th><th>Demand</th>
          </tr></thead>
          <tbody>
            ${reportData.data.map(r => `<tr>
              <td><b>${r.code}</b></td><td>${r.name}</td><td>${r.department}</td>
              <td>${r.max_seats}</td>
              <td style="color:#16a34a;font-weight:bold">${r.allocated}</td>
              <td style="color:#d97706">${r.waitlisted}</td>
              <td>${r.remaining}</td>
              <td><b>${r.utilization_pct}%</b></td>
              <td><span class="badge ${r.demand_level.toLowerCase()}">${r.demand_level}</span></td>
            </tr>`).join('')}
          </tbody>
        </table>`;
    } else if (reportType === 'unallocated') {
      tableHTML = `
        <div class="summary-box">
          <div class="summary-item"><div class="summary-num">${reportData.totalStudents}</div><div>Total Students</div></div>
          <div class="summary-item"><div class="summary-num">${reportData.data.length}</div><div>Unallocated</div></div>
          <div class="summary-item"><div class="summary-num">${reportData.totalStudents > 0 ? ((reportData.data.length/reportData.totalStudents)*100).toFixed(1) : 0}%</div><div>Unallocated Rate</div></div>
        </div>
        <table>
          <thead><tr>
            <th>Roll No</th><th>Name</th><th>Email</th><th>Department</th>
            <th>Year</th><th>CGPA</th><th>Preferences</th><th>Preferred Courses</th>
          </tr></thead>
          <tbody>
            ${reportData.data.map(r => `<tr>
              <td><b>${r.roll_number}</b></td><td>${r.name}</td><td>${r.email}</td>
              <td>${r.department}</td><td>${r.current_year}</td><td>${r.cgpa}</td>
              <td>${r.preferences_submitted}</td><td>${r.preferred_courses||'—'}</td>
            </tr>`).join('')}
          </tbody>
        </table>`;
    } else if (reportType === 'popularity') {
      tableHTML = `
        <table>
          <thead><tr>
            <th>Code</th><th>Course</th><th>Department</th><th>Capacity</th>
            <th>Total Prefs</th><th>1st Choice</th><th>Top 3</th><th>Demand Ratio</th><th>Allocated</th><th>% Students</th>
          </tr></thead>
          <tbody>
            ${reportData.data.map((r,i) => `<tr>
              <td><b>${r.code}</b></td><td>${r.name}</td><td>${r.department}</td>
              <td>${r.max_seats}</td>
              <td style="color:#ec4899;font-weight:bold">${r.total_preferences}</td>
              <td>${r.first_choice_count}</td><td>${r.top3_count}</td>
              <td><b>${r.demand_ratio}x</b></td>
              <td style="color:#16a34a">${r.allocated}</td>
              <td>${r.preference_pct}%</td>
            </tr>`).join('')}
          </tbody>
        </table>`;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${titles[reportType]}</title>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family: Arial, sans-serif; font-size: 12px; color: #1e293b; padding: 30px; }
          .header { text-align:center; margin-bottom:24px; border-bottom: 3px solid #ec4899; padding-bottom:16px; }
          .header h1 { font-size:22px; color:#ec4899; margin-bottom:4px; }
          .header p  { font-size:12px; color:#64748b; }
          .meta { display:flex; justify-content:space-between; margin-bottom:20px; font-size:11px; color:#64748b; }
          table { width:100%; border-collapse:collapse; margin-top:12px; }
          th { background:linear-gradient(135deg,#ec4899,#38bdf8); color:#fff; padding:8px 10px; text-align:left; font-size:11px; }
          td { padding:7px 10px; border-bottom:1px solid #f1f5f9; font-size:11px; }
          tr:nth-child(even) td { background:#fdf2f8; }
          tr:hover td { background:#fce7f3; }
          .summary-box { display:flex; gap:16px; margin-bottom:20px; }
          .summary-item { flex:1; text-align:center; background:linear-gradient(135deg,rgba(236,72,153,0.08),rgba(56,189,248,0.08)); border-radius:10px; padding:14px; border:1px solid rgba(236,72,153,0.2); }
          .summary-num { font-size:24px; font-weight:900; color:#ec4899; }
          .badge { padding:2px 8px; border-radius:10px; font-size:10px; font-weight:bold; }
          .badge.high   { background:#fce7f3; color:#be185d; }
          .badge.medium { background:#fef9c3; color:#854d0e; }
          .badge.low    { background:#dcfce7; color:#15803d; }
          .footer { margin-top:24px; text-align:center; font-size:10px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:12px; }
          @media print {
            body { padding: 15px; }
            button { display:none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎓 ${titles[reportType]}</h1>
          <p>CourseAllocator — University Course Allocation System</p>
        </div>
        <div class="meta">
          <span>📅 Semester: <b>${semName}</b></span>
          <span>🕐 Generated: <b>${now}</b></span>
          <span>📊 Records: <b>${reportData.data.length}</b></span>
        </div>
        ${tableHTML}
        <div class="footer">
          This report was automatically generated by CourseAllocator System · ${now}
        </div>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'linear-gradient(135deg,#fdf2f8,#e0f2fe)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:52, marginBottom:'1rem' }}>🎓</div>
        <div style={{ fontSize:16, fontWeight:700, color:'#ec4899' }}>Loading admin panel...</div>
      </div>
    </div>
  );

  const TABS = [
    { key:'overview',    label:'📊 Overview' },
    { key:'enrollment',  label:'📋 Enrollment' },
    { key:'allocations', label:'✅ Allocations' },
    { key:'unallocated', label:`⚠️ Unallocated (${unallocated.length})` },
    { key:'students',    label:'👥 Students' },
    { key:'reports',     label:'📄 Reports' },
  ];

  const REPORT_CARDS = [
    {
      type:'enrollment', icon:'📋', title:'Course Enrollment Report',
      desc:'Full breakdown of enrollment per course with capacity, enrolled, waitlisted and available seats.',
      color:'#ec4899', bg:'#fce7f3',
    },
    {
      type:'utilization', icon:'📊', title:'Seat Utilization Report',
      desc:'Seat utilization percentages across all courses with demand level classification (High/Medium/Low).',
      color:'#0284c7', bg:'#e0f2fe',
    },
    {
      type:'unallocated', icon:'⚠️', title:'Unallocated Students List',
      desc:'List of all students who submitted preferences but were not allocated to any course.',
      color:'#d97706', bg:'#fef9c3',
    },
    {
      type:'popularity', icon:'🔥', title:'Course Popularity Analysis',
      desc:'Ranking of courses by student demand, first-choice count, top-3 preferences and demand ratio.',
      color:'#a855f7', bg:'#ede9fe',
    },
  ];

  return (
    <div style={S.page}>

      {/* Navbar */}
      <div style={S.nav}>
        <div style={S.navLeft} onClick={() => navigate('/')}>
          <div style={S.logoCircle}>🎓</div>
          <span style={S.navTitle}>CourseAllocator</span>
          <span style={S.adminBadge}>Admin</span>
        </div>
        <div style={S.navCenter}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => goTab(t.key)}
              style={{ ...S.navLink, ...(tab === t.key ? S.navLinkActive : {}) }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={S.navRight}>
          <span style={S.navUser}>{user.name}</span>
          <button onClick={() => { logout(); navigate('/'); }} style={S.logoutBtn}>Logout</button>
        </div>
      </div>

      {/* Flash */}
      {msg.text && (
        <div style={{ ...S.flash,
          background:  msg.type==='error' ? '#fef2f2' : 'linear-gradient(135deg,rgba(236,72,153,0.08),rgba(56,189,248,0.08))',
          borderColor: msg.type==='error' ? '#fca5a5' : 'rgba(236,72,153,0.3)',
          color:       msg.type==='error' ? '#dc2626' : '#ec4899' }}>
          {msg.text}
        </div>
      )}

      <div style={S.body}>

        {/* OVERVIEW */}
        {tab === 'overview' && stats && (
          <div>
            {stats.currentSemester && (
              <div style={S.semCard}>
                <div>
                  <div style={S.semName}>{stats.currentSemester.name}</div>
                  <div style={S.semDl}>📅 Deadline: {new Date(stats.currentSemester.preference_deadline).toLocaleString()}</div>
                </div>
                <span style={{ ...S.semBadge,
                  background: stats.currentSemester.allocation_done ? 'linear-gradient(135deg,#dcfce7,#bbf7d0)' : 'linear-gradient(135deg,#fef9c3,#fef08a)',
                  color: stats.currentSemester.allocation_done ? '#16a34a' : '#854d0e' }}>
                  {stats.currentSemester.allocation_done ? '✓ Allocation Complete' : '⏳ Pending'}
                </span>
              </div>
            )}
            <div style={S.statGrid}>
              {[
                { label:'Total Students',        value:stats.totalStudents,           color:'#0284c7', bg:'#e0f2fe', icon:'👥' },
                { label:'Total Courses',          value:stats.totalCourses,            color:'#a855f7', bg:'#ede9fe', icon:'📚' },
                { label:'Submitted Preferences',  value:stats.studentsWithPreferences, color:'#f97316', bg:'#ffedd5', icon:'📝' },
                { label:'Allocated',              value:stats.allocated,               color:'#16a34a', bg:'#dcfce7', icon:'✅' },
                { label:'Waitlisted',             value:stats.waitlisted,              color:'#d97706', bg:'#fef9c3', icon:'⏳' },
                { label:'Unallocated',            value:unallocated.length,            color:'#ec4899', bg:'#fce7f3', icon:'❌' },
              ].map(c => (
                <div key={c.label} style={{ ...S.statCard, background:c.bg, border:`1.5px solid ${c.color}25` }}>
                  <div style={{ fontSize:28, marginBottom:'0.25rem' }}>{c.icon}</div>
                  <div style={{ fontSize:28, fontWeight:900, color:c.color }}>{c.value}</div>
                  <div style={{ fontSize:12, color:'#64748b', marginTop:2, fontWeight:500 }}>{c.label}</div>
                </div>
              ))}
            </div>
            <div style={S.actionRow}>
              <button onClick={runAllocation} disabled={running} style={S.runBtn}>{running ? '⚙️ Running...' : '🚀 Run Allocation Engine'}</button>
              <button onClick={resetAllocation} style={S.resetBtn}>🔄 Reset</button>
              <button onClick={() => setShowOverride(true)} style={S.overrideBtn}>✏️ Override</button>
              <button onClick={() => goTab('unallocated')} style={S.warnBtn}>⚠️ Unallocated ({unallocated.length})</button>
              <button onClick={() => goTab('reports')} style={S.reportBtn}>📄 Download Reports</button>
            </div>
            <div style={S.section}>
              <div style={S.sectionTitle}>🔥 Most Preferred Courses</div>
              {stats.topCourses.length === 0 ? (
                <div style={{ color:'#94a3b8', fontSize:13, padding:'0.5rem 0' }}>No preferences yet.</div>
              ) : stats.topCourses.map((c, i) => (
                <div key={i} style={S.topRow}>
                  <div style={{ ...S.topRank,
                    background: i===0 ? 'linear-gradient(135deg,#ec4899,#f472b6)' : i===1 ? 'linear-gradient(135deg,#38bdf8,#7dd3fc)' : 'linear-gradient(135deg,#a855f7,#c084fc)',
                    color:'#fff' }}>{i+1}</div>
                  <div style={{ flex:1 }}>
                    <span style={{ fontWeight:700, color:'#1e293b' }}>{c.code}</span>
                    <span style={{ color:'#64748b' }}> — {c.name}</span>
                  </div>
                  <div style={{ fontSize:12, color:'#64748b' }}>{c.preference_count} prefs · {c.allocated_seats}/{c.max_seats} filled</div>
                  <div style={S.miniBar}><div style={{ ...S.miniBarFill, background:'linear-gradient(90deg,#ec4899,#38bdf8)', width:`${Math.min((c.allocated_seats/c.max_seats)*100,100)}%` }}/></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ENROLLMENT */}
        {tab === 'enrollment' && (
          <div>
            <div style={S.pageHeader}>
              <div><h2 style={S.pageTitle}>Course Enrollment Report</h2><p style={S.pageDesc}>Seat utilization across all courses</p></div>
            </div>
            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead><tr style={S.thead}>
                  {['Code','Course','Dept','Capacity','Enrolled','Waitlisted','Preferences','Utilization'].map(h=><th key={h} style={S.th}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {report.map((r,i) => (
                    <tr key={i} style={i%2===0 ? S.trEven : S.trOdd}>
                      <td style={S.td}><span style={S.codeTag}>{r.code}</span></td>
                      <td style={S.td}>{r.name}</td><td style={S.td}>{r.department}</td>
                      <td style={S.td}>{r.max_seats}</td>
                      <td style={{...S.td,color:'#16a34a',fontWeight:700}}>{r.enrolled}</td>
                      <td style={{...S.td,color:'#d97706'}}>{r.waitlisted}</td>
                      <td style={S.td}>{r.total_preferences}</td>
                      <td style={S.td}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div style={{ background:'#f1f5f9', borderRadius:20, height:8, width:80, overflow:'hidden' }}>
                            <div style={{ width:`${Math.min(r.utilization_pct,100)}%`, height:'100%',
                              background: r.utilization_pct>=90 ? 'linear-gradient(90deg,#ec4899,#f472b6)' : r.utilization_pct>=60 ? 'linear-gradient(90deg,#f97316,#fb923c)' : 'linear-gradient(90deg,#38bdf8,#7dd3fc)' }} />
                          </div>
                          <span style={{ fontSize:11, color:'#64748b', fontWeight:600 }}>{r.utilization_pct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ALLOCATIONS */}
        {tab === 'allocations' && (
          <div>
            <div style={S.pageHeader}>
              <div><h2 style={S.pageTitle}>All Allocations ({allocations.length})</h2><p style={S.pageDesc}>Every student's allocation status</p></div>
              <button onClick={() => setShowOverride(true)} style={S.overrideBtn}>✏️ Manual Override</button>
            </div>
            {allocations.length === 0 ? (
              <div style={S.emptyBox}>No allocations yet. Run the allocation engine first.</div>
            ) : (
              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead><tr style={S.thead}>
                    {['Roll No','Student','Dept','CGPA','Course','Rank','Status','By','Action'].map(h=><th key={h} style={S.th}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {allocations.map((a,i) => (
                      <tr key={i} style={i%2===0 ? S.trEven : S.trOdd}>
                        <td style={S.td}>{a.roll_number}</td><td style={S.td}>{a.student_name}</td>
                        <td style={S.td}>{a.department}</td><td style={S.td}>{a.cgpa}</td>
                        <td style={S.td}><span style={S.codeTag}>{a.course_code}</span> {a.course_name}</td>
                        <td style={S.td}>{a.preference_rank||'—'}</td>
                        <td style={S.td}>
                          <span style={{ background:a.status==='allocated'?'linear-gradient(135deg,#dcfce7,#bbf7d0)':'linear-gradient(135deg,#fef9c3,#fef08a)', color:a.status==='allocated'?'#16a34a':'#854d0e', borderRadius:20, padding:'3px 12px', fontSize:11, fontWeight:700 }}>
                            {a.status}
                          </span>
                        </td>
                        <td style={S.td}>{a.allocated_by}</td>
                        <td style={S.td}><button onClick={() => removeAlloc(a.student_id, a.course_id)} style={S.removeSmall}>Remove</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* UNALLOCATED */}
        {tab === 'unallocated' && (
          <div>
            <div style={S.pageHeader}>
              <div><h2 style={S.pageTitle}>Unallocated Students ({unallocated.length})</h2><p style={S.pageDesc}>Students who submitted preferences but got no course</p></div>
              <div style={{ display:'flex', gap:'0.5rem' }}>
                <button onClick={runAllocation} disabled={running} style={S.runBtn}>{running?'Running...':'🚀 Re-run'}</button>
                <button onClick={() => setShowOverride(true)} style={S.overrideBtn}>✏️ Override</button>
              </div>
            </div>
            {unallocated.length === 0 ? (
              <div style={S.allGood}>🎉 All students with preferences have been successfully allocated!</div>
            ) : (
              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead><tr style={S.thead}>
                    {['Roll No','Name','Department','Year','CGPA','Preferences','Action'].map(h=><th key={h} style={S.th}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {unallocated.map((s,i) => (
                      <tr key={i} style={i%2===0 ? S.trEven : S.trOdd}>
                        <td style={S.td}>{s.roll_number}</td><td style={S.td}>{s.name}</td>
                        <td style={S.td}>{s.department}</td><td style={S.td}>{s.current_year}</td>
                        <td style={S.td}>{s.cgpa}</td><td style={S.td}>{s.preference_count}</td>
                        <td style={S.td}><button onClick={() => { setOForm(f=>({...f,student_id:s.id})); setShowOverride(true); }} style={S.overrideSmall}>Override</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* STUDENTS */}
        {tab === 'students' && (
          <div>
            <div style={S.pageHeader}>
              <div><h2 style={S.pageTitle}>All Students ({students.length})</h2><p style={S.pageDesc}>Registered students in the system</p></div>
            </div>
            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead><tr style={S.thead}>
                  {['Roll No','Name','Email','Department','Year','CGPA','Status'].map(h=><th key={h} style={S.th}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {students.map((s,i) => (
                    <tr key={i} style={i%2===0 ? S.trEven : S.trOdd}>
                      <td style={S.td}>{s.roll_number}</td><td style={S.td}>{s.name}</td>
                      <td style={S.td}>{s.email}</td><td style={S.td}>{s.department}</td>
                      <td style={S.td}>{s.current_year}</td><td style={S.td}>{s.cgpa}</td>
                      <td style={S.td}>
                        <span style={{ background:s.is_active?'linear-gradient(135deg,#dcfce7,#bbf7d0)':'linear-gradient(135deg,#fce7f3,#fbcfe8)', color:s.is_active?'#16a34a':'#ec4899', borderRadius:20, padding:'3px 12px', fontSize:11, fontWeight:700 }}>
                          {s.is_active?'Active':'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════ REPORTS TAB ══════════ */}
        {tab === 'reports' && (
          <div>
            <div style={S.pageHeader}>
              <div>
                <h2 style={S.pageTitle}>📄 Reports & Analytics</h2>
                <p style={S.pageDesc}>Generate and download detailed reports as PDF</p>
              </div>
            </div>

            {/* Report Cards */}
            <div style={S.reportGrid}>
              {REPORT_CARDS.map(rc => (
                <div key={rc.type} style={{ ...S.reportCard, border:`1.5px solid ${rc.color}25` }}>
                  <div style={{ ...S.reportCardIcon, background:rc.bg, color:rc.color }}>
                    {rc.icon}
                  </div>
                  <div style={S.reportCardTitle}>{rc.title}</div>
                  <div style={S.reportCardDesc}>{rc.desc}</div>
                  <button
                    onClick={() => loadReport(rc.type)}
                    disabled={reportLoading && reportType===rc.type}
                    style={{ ...S.reportLoadBtn, background:`linear-gradient(135deg,${rc.color},${rc.color}cc)` }}>
                    {reportLoading && reportType===rc.type ? '⏳ Loading...' : '👁 Preview Report'}
                  </button>
                </div>
              ))}
            </div>

            {/* Report Preview */}
            {reportLoading && (
              <div style={S.reportLoading}>
                <div style={{ fontSize:36, marginBottom:'0.75rem' }}>⏳</div>
                <div style={{ fontWeight:600, color:'#ec4899' }}>Generating report...</div>
              </div>
            )}

            {reportData && !reportLoading && (
              <div style={S.reportPreview}>
                <div style={S.reportPreviewHeader}>
                  <div>
                    <div style={S.reportPreviewTitle}>
                      {REPORT_CARDS.find(r=>r.type===reportType)?.icon}{' '}
                      {REPORT_CARDS.find(r=>r.type===reportType)?.title}
                    </div>
                    <div style={{ fontSize:12, color:'#64748b', marginTop:3 }}>
                      Semester: {reportData.semester?.name} · {reportData.data.length} records
                    </div>
                  </div>
                  <button onClick={downloadPDF} style={S.pdfBtn}>
                    ⬇️ Download PDF
                  </button>
                </div>

                {/* Summary for utilization & unallocated */}
                {reportType === 'utilization' && reportData.summary && (
                  <div style={S.summaryRow}>
                    {[
                      { label:'Total Seats',       value:reportData.summary.total_seats,        color:'#0284c7' },
                      { label:'Total Allocated',   value:reportData.summary.total_allocated,    color:'#16a34a' },
                      { label:'Overall Utilization',value:`${reportData.summary.overall_utilization}%`, color:'#ec4899' },
                    ].map(s => (
                      <div key={s.label} style={S.summaryCard}>
                        <div style={{ fontSize:22, fontWeight:900, color:s.color }}>{s.value}</div>
                        <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {reportType === 'unallocated' && (
                  <div style={S.summaryRow}>
                    {[
                      { label:'Total Students',   value:reportData.totalStudents, color:'#0284c7' },
                      { label:'Unallocated',      value:reportData.data.length,   color:'#ec4899' },
                      { label:'Unallocated Rate', value:`${reportData.totalStudents > 0 ? ((reportData.data.length/reportData.totalStudents)*100).toFixed(1) : 0}%`, color:'#d97706' },
                    ].map(s => (
                      <div key={s.label} style={S.summaryCard}>
                        <div style={{ fontSize:22, fontWeight:900, color:s.color }}>{s.value}</div>
                        <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Preview Table */}
                <div style={S.tableWrap}>
                  <table style={S.table}>
                    <thead>
                      <tr style={S.thead}>
                        {reportType === 'enrollment'  && ['Code','Course','Dept','Capacity','Enrolled','Waitlisted','Available','Preferences','Utilization'].map(h=><th key={h} style={S.th}>{h}</th>)}
                        {reportType === 'utilization' && ['Code','Course','Department','Capacity','Allocated','Waitlisted','Remaining','Utilization %','Demand'].map(h=><th key={h} style={S.th}>{h}</th>)}
                        {reportType === 'unallocated' && ['Roll No','Name','Department','Year','CGPA','Preferences','Preferred Courses'].map(h=><th key={h} style={S.th}>{h}</th>)}
                        {reportType === 'popularity'  && ['#','Code','Course','Dept','Total Prefs','1st Choice','Top 3','Demand Ratio','Allocated','% Students'].map(h=><th key={h} style={S.th}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {reportType === 'enrollment' && reportData.data.map((r,i) => (
                        <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                          <td style={S.td}><span style={S.codeTag}>{r.code}</span></td>
                          <td style={S.td}>{r.name}</td><td style={S.td}>{r.department}</td>
                          <td style={S.td}>{r.max_seats}</td>
                          <td style={{...S.td,color:'#16a34a',fontWeight:700}}>{r.enrolled}</td>
                          <td style={{...S.td,color:'#d97706'}}>{r.waitlisted}</td>
                          <td style={S.td}>{r.available}</td>
                          <td style={S.td}>{r.total_preferences}</td>
                          <td style={S.td}>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <div style={{ background:'#f1f5f9', borderRadius:20, height:7, width:60, overflow:'hidden' }}>
                                <div style={{ width:`${Math.min(r.utilization_pct,100)}%`, height:'100%', background:'linear-gradient(90deg,#ec4899,#38bdf8)' }}/>
                              </div>
                              <span style={{ fontSize:11, fontWeight:600, color:'#ec4899' }}>{r.utilization_pct}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {reportType === 'utilization' && reportData.data.map((r,i) => (
                        <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                          <td style={S.td}><span style={S.codeTag}>{r.code}</span></td>
                          <td style={S.td}>{r.name}</td><td style={S.td}>{r.department}</td>
                          <td style={S.td}>{r.max_seats}</td>
                          <td style={{...S.td,color:'#16a34a',fontWeight:700}}>{r.allocated}</td>
                          <td style={{...S.td,color:'#d97706'}}>{r.waitlisted}</td>
                          <td style={S.td}>{r.remaining}</td>
                          <td style={S.td}><b style={{ color:'#ec4899' }}>{r.utilization_pct}%</b></td>
                          <td style={S.td}>
                            <span style={{
                              background: r.demand_level==='High'?'#fce7f3':r.demand_level==='Medium'?'#fef9c3':'#dcfce7',
                              color: r.demand_level==='High'?'#be185d':r.demand_level==='Medium'?'#854d0e':'#15803d',
                              borderRadius:20, padding:'2px 10px', fontSize:11, fontWeight:700 }}>
                              {r.demand_level}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {reportType === 'unallocated' && reportData.data.map((r,i) => (
                        <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                          <td style={S.td}><b>{r.roll_number}</b></td>
                          <td style={S.td}>{r.name}</td><td style={S.td}>{r.department}</td>
                          <td style={S.td}>{r.current_year}</td><td style={S.td}>{r.cgpa}</td>
                          <td style={S.td}>{r.preferences_submitted}</td>
                          <td style={{...S.td,fontSize:11,color:'#64748b'}}>{r.preferred_courses||'—'}</td>
                        </tr>
                      ))}
                      {reportType === 'popularity' && reportData.data.map((r,i) => (
                        <tr key={i} style={i%2===0?S.trEven:S.trOdd}>
                          <td style={{...S.td,fontWeight:700,color:'#ec4899'}}>#{i+1}</td>
                          <td style={S.td}><span style={S.codeTag}>{r.code}</span></td>
                          <td style={S.td}>{r.name}</td><td style={S.td}>{r.department}</td>
                          <td style={{...S.td,color:'#ec4899',fontWeight:700}}>{r.total_preferences}</td>
                          <td style={S.td}>{r.first_choice_count}</td>
                          <td style={S.td}>{r.top3_count}</td>
                          <td style={S.td}><b>{r.demand_ratio}x</b></td>
                          <td style={{...S.td,color:'#16a34a'}}>{r.allocated}</td>
                          <td style={S.td}>{r.preference_pct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Override Modal */}
      {showOverride && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:'0.75rem', marginBottom:'1.25rem' }}>
              <span style={{ fontSize:32 }}>✏️</span>
              <div>
                <h3 style={{ margin:0, fontSize:'1.1rem', fontWeight:800, color:'#1e293b' }}>Manual Override</h3>
                <p style={{ margin:'4px 0 0', fontSize:13, color:'#64748b' }}>Force-allocate a student to a course, bypassing the algorithm.</p>
              </div>
            </div>
            <div style={{ marginBottom:'0.9rem' }}>
              <label style={S.mLabel}>Student</label>
              <select value={oForm.student_id} onChange={e=>setOForm(o=>({...o,student_id:e.target.value}))} style={S.mSelect}>
                <option value="">Select a student</option>
                {students.map(s=><option key={s.id} value={s.id}>{s.roll_number} — {s.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:'0.9rem' }}>
              <label style={S.mLabel}>Course</label>
              <select value={oForm.course_id} onChange={e=>setOForm(o=>({...o,course_id:e.target.value}))} style={S.mSelect}>
                <option value="">Select a course</option>
                {courses.map(c=><option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:'0.9rem' }}>
              <label style={S.mLabel}>Admin Note (optional)</label>
              <input type="text" value={oForm.note} onChange={e=>setOForm(o=>({...o,note:e.target.value}))} placeholder="Reason for override..." style={S.mInput}/>
            </div>
            <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.25rem' }}>
              <button onClick={handleOverride} style={S.runBtn}>Confirm Override</button>
              <button onClick={() => { setShowOverride(false); setOForm({student_id:'',course_id:'',note:''}); }} style={S.cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const S = {
  page:    { fontFamily:"'Segoe UI',system-ui,sans-serif", minHeight:'100vh', background:'linear-gradient(135deg,#fdf2f8 0%,#e0f2fe 100%)' },
  nav:     { background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(236,72,153,0.15)', padding:'0 1.5rem', height:60, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 20px rgba(236,72,153,0.08)' },
  navLeft: { display:'flex', alignItems:'center', gap:'0.6rem', cursor:'pointer' },
  logoCircle:   { fontSize:20, background:'linear-gradient(135deg,#ec4899,#38bdf8)', borderRadius:'50%', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center' },
  navTitle:     { fontSize:15, fontWeight:900, background:'linear-gradient(135deg,#ec4899,#0284c7)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' },
  adminBadge:   { background:'linear-gradient(135deg,#ec4899,#f472b6)', color:'#fff', borderRadius:20, padding:'2px 10px', fontSize:11, fontWeight:700 },
  navCenter:    { display:'flex', gap:'0.2rem' },
  navLink:      { background:'none', border:'none', color:'#94a3b8', fontSize:12, cursor:'pointer', padding:'6px 12px', borderRadius:20, fontWeight:500 },
  navLinkActive:{ background:'linear-gradient(135deg,rgba(236,72,153,0.12),rgba(56,189,248,0.12))', color:'#ec4899', fontWeight:700, border:'1px solid rgba(236,72,153,0.2)' },
  navRight:     { display:'flex', alignItems:'center', gap:'0.75rem' },
  navUser:      { fontSize:13, color:'#64748b', fontWeight:500 },
  logoutBtn:    { background:'linear-gradient(135deg,rgba(236,72,153,0.1),rgba(56,189,248,0.1))', border:'1px solid rgba(236,72,153,0.25)', color:'#ec4899', borderRadius:20, padding:'5px 16px', cursor:'pointer', fontSize:12, fontWeight:600 },
  flash:        { margin:'0.75rem 2rem', padding:'0.85rem 1.1rem', border:'1px solid', borderRadius:12, fontSize:13, fontWeight:500 },
  body:         { padding:'1.5rem 2rem' },
  semCard:      { background:'rgba(255,255,255,0.8)', backdropFilter:'blur(8px)', border:'1px solid rgba(236,72,153,0.15)', borderRadius:16, padding:'1rem 1.5rem', marginBottom:'1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.75rem', boxShadow:'0 4px 16px rgba(236,72,153,0.06)' },
  semName:      { fontSize:15, fontWeight:700, color:'#1e293b' },
  semDl:        { fontSize:12, color:'#64748b', marginTop:3 },
  semBadge:     { borderRadius:20, padding:'5px 16px', fontSize:12, fontWeight:700 },
  statGrid:     { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:'1rem', marginBottom:'1.5rem' },
  statCard:     { borderRadius:16, padding:'1.25rem 1rem', textAlign:'center', boxShadow:'0 4px 16px rgba(0,0,0,0.04)' },
  actionRow:    { display:'flex', gap:'0.6rem', flexWrap:'wrap', marginBottom:'1.5rem' },
  runBtn:       { background:'linear-gradient(135deg,#ec4899,#f472b6)', color:'#fff', border:'none', borderRadius:25, padding:'0.6rem 1.25rem', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 12px rgba(236,72,153,0.3)' },
  resetBtn:     { background:'linear-gradient(135deg,#38bdf8,#7dd3fc)', color:'#fff', border:'none', borderRadius:25, padding:'0.6rem 1.25rem', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 12px rgba(56,189,248,0.3)' },
  overrideBtn:  { background:'linear-gradient(135deg,#a855f7,#c084fc)', color:'#fff', border:'none', borderRadius:25, padding:'0.6rem 1.25rem', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 12px rgba(168,85,247,0.3)' },
  warnBtn:      { background:'linear-gradient(135deg,#f97316,#fb923c)', color:'#fff', border:'none', borderRadius:25, padding:'0.6rem 1.25rem', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 12px rgba(249,115,22,0.3)' },
  reportBtn:    { background:'linear-gradient(135deg,#0ea5e9,#38bdf8)', color:'#fff', border:'none', borderRadius:25, padding:'0.6rem 1.25rem', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 12px rgba(14,165,233,0.3)' },
  overrideSmall:{ background:'linear-gradient(135deg,#a855f7,#c084fc)', color:'#fff', border:'none', borderRadius:15, padding:'4px 12px', fontSize:11, cursor:'pointer', fontWeight:600 },
  cancelBtn:    { background:'#f8fafc', color:'#64748b', border:'1px solid #e2e8f0', borderRadius:25, padding:'0.6rem 1.25rem', fontSize:13, cursor:'pointer', fontWeight:500 },
  removeSmall:  { background:'linear-gradient(135deg,#fce7f3,#fbcfe8)', color:'#ec4899', border:'1px solid rgba(236,72,153,0.2)', borderRadius:15, padding:'4px 12px', fontSize:11, cursor:'pointer', fontWeight:600 },
  section:      { background:'rgba(255,255,255,0.8)', backdropFilter:'blur(8px)', border:'1px solid rgba(236,72,153,0.12)', borderRadius:16, padding:'1.25rem 1.5rem', boxShadow:'0 4px 16px rgba(236,72,153,0.06)' },
  sectionTitle: { fontSize:'0.95rem', fontWeight:800, color:'#1e293b', marginBottom:'0.85rem' },
  topRow:       { display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.65rem 0', borderBottom:'1px solid rgba(236,72,153,0.06)', fontSize:13 },
  topRank:      { width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, flexShrink:0 },
  miniBar:      { width:70, height:7, background:'#f1f5f9', borderRadius:20, overflow:'hidden', flexShrink:0 },
  miniBarFill:  { height:'100%', borderRadius:20 },
  pageHeader:   { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem', flexWrap:'wrap', gap:'0.75rem' },
  pageTitle:    { fontSize:'1.1rem', fontWeight:800, color:'#1e293b', margin:0 },
  pageDesc:     { fontSize:13, color:'#64748b', marginTop:3 },
  tableWrap:    { background:'rgba(255,255,255,0.9)', backdropFilter:'blur(8px)', borderRadius:16, border:'1px solid rgba(236,72,153,0.1)', overflow:'auto', boxShadow:'0 4px 16px rgba(236,72,153,0.06)' },
  table:        { width:'100%', borderCollapse:'collapse', fontSize:13 },
  thead:        { background:'linear-gradient(135deg,rgba(236,72,153,0.06),rgba(56,189,248,0.06))' },
  th:           { padding:'12px 14px', textAlign:'left', fontWeight:700, color:'#475569', borderBottom:'1px solid rgba(236,72,153,0.1)', whiteSpace:'nowrap' },
  td:           { padding:'11px 14px', color:'#334155', verticalAlign:'middle' },
  trEven:       { background:'rgba(255,255,255,0.6)' },
  trOdd:        { background:'rgba(236,72,153,0.02)' },
  codeTag:      { background:'linear-gradient(135deg,rgba(56,189,248,0.12),rgba(56,189,248,0.06))', color:'#0284c7', borderRadius:8, padding:'2px 8px', fontSize:11, fontWeight:700, border:'1px solid rgba(56,189,248,0.2)' },
  emptyBox:     { textAlign:'center', padding:'3rem', background:'rgba(255,255,255,0.7)', borderRadius:16, color:'#94a3b8', fontSize:14, border:'1px solid rgba(236,72,153,0.1)' },
  allGood:      { textAlign:'center', padding:'3rem', background:'linear-gradient(135deg,rgba(236,72,153,0.05),rgba(56,189,248,0.05))', borderRadius:16, color:'#ec4899', fontSize:15, fontWeight:700, border:'1px solid rgba(236,72,153,0.15)' },
  overlay:      { position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999 },
  modal:        { background:'#fff', borderRadius:20, padding:'2rem', width:480, boxShadow:'0 20px 60px rgba(236,72,153,0.2)', maxHeight:'90vh', overflowY:'auto', border:'1px solid rgba(236,72,153,0.15)' },
  mLabel:       { display:'block', fontSize:13, fontWeight:700, marginBottom:5, color:'#374151' },
  mSelect:      { width:'100%', padding:'0.65rem 0.9rem', borderRadius:10, border:'1.5px solid rgba(236,72,153,0.2)', fontSize:13, boxSizing:'border-box', background:'#fff', outline:'none' },
  mInput:       { width:'100%', padding:'0.65rem 0.9rem', borderRadius:10, border:'1.5px solid rgba(236,72,153,0.2)', fontSize:13, boxSizing:'border-box', outline:'none' },

  // Reports tab styles
  reportGrid:        { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'1.25rem', marginBottom:'2rem' },
  reportCard:        { background:'rgba(255,255,255,0.9)', backdropFilter:'blur(8px)', borderRadius:16, padding:'1.5rem', boxShadow:'0 4px 16px rgba(236,72,153,0.06)', display:'flex', flexDirection:'column', gap:'0.6rem' },
  reportCardIcon:    { fontSize:32, width:60, height:60, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center' },
  reportCardTitle:   { fontSize:'0.95rem', fontWeight:800, color:'#1e293b' },
  reportCardDesc:    { fontSize:12, color:'#64748b', lineHeight:1.6, flex:1 },
  reportLoadBtn:     { color:'#fff', border:'none', borderRadius:20, padding:'0.6rem 1rem', fontSize:13, fontWeight:600, cursor:'pointer', marginTop:'0.5rem' },
  reportLoading:     { textAlign:'center', padding:'3rem', background:'rgba(255,255,255,0.8)', borderRadius:16, border:'1px solid rgba(236,72,153,0.1)' },
  reportPreview:     { background:'rgba(255,255,255,0.9)', backdropFilter:'blur(8px)', borderRadius:16, border:'1px solid rgba(236,72,153,0.1)', overflow:'hidden', boxShadow:'0 4px 16px rgba(236,72,153,0.06)' },
  reportPreviewHeader:{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1.25rem 1.5rem', borderBottom:'1px solid rgba(236,72,153,0.1)', flexWrap:'wrap', gap:'0.75rem' },
  reportPreviewTitle: { fontSize:'1rem', fontWeight:800, color:'#1e293b' },
  pdfBtn:            { background:'linear-gradient(135deg,#ec4899,#f472b6)', color:'#fff', border:'none', borderRadius:25, padding:'0.65rem 1.5rem', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 15px rgba(236,72,153,0.35)' },
  summaryRow:        { display:'flex', gap:'1rem', padding:'1rem 1.5rem', borderBottom:'1px solid rgba(236,72,153,0.08)' },
  summaryCard:       { flex:1, textAlign:'center', background:'linear-gradient(135deg,rgba(236,72,153,0.05),rgba(56,189,248,0.05))', borderRadius:10, padding:'0.85rem', border:'1px solid rgba(236,72,153,0.1)' },
};