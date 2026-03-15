import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={S.page}>
      
      {/* Navbar */}
      <nav style={S.nav}>
        <div style={S.navLeft}>
          <div style={S.logoCircle}>🎓</div>
          <span style={S.logoText}>CourseAllocator</span>
        </div>

        <div style={S.navLinks}>
          <span onClick={() => navigate("/")} style={S.navLink}>Home</span>
          <span onClick={() => navigate("/register")} style={S.navLink}>Register</span>
          <span onClick={() => navigate("/student-login")} style={S.navLink}>Students</span>
        </div>

        <div style={S.navRight}>
          <button onClick={() => navigate("/student-login")} style={S.studentBtn}>
            Student Login
          </button>
          <button onClick={() => navigate("/admin-login")} style={S.adminBtn}>
            Admin Login
          </button>
        </div>
      </nav>

      <div style={S.topBar} />

      {/* Hero Section */}
      <div style={S.hero}>
        <div style={S.heroLeft}>
          <h1 style={S.heroTitle}>
            Intelligent Course <br />
            <span style={{ color: "#ec4899" }}>Allocation</span> System
          </h1>

          <p style={S.heroDesc}>
            Our smart platform transforms the way universities manage elective
            course allocation. Students can easily choose and prioritize their
            preferred subjects while the system automatically evaluates
            prerequisites, seat availability, and academic eligibility.
            The result is a transparent, fair, and efficient allocation process
            that ensures students receive the best possible courses based on
            their preferences and institutional policies.
          </p>

          <div style={S.heroBtns}>
            <button
              onClick={() => navigate("/student-login")}
              style={S.primaryBtn}
            >
              Get Started
            </button>

            <button
              onClick={() => navigate("/register")}
              style={S.secondaryBtn}
            >
              Register
            </button>
          </div>
        </div>

        <div style={S.heroRight}>
          <div style={S.card}>
            <h3 style={S.cardTitle}>Live Allocation Status</h3>

            <div style={S.courseRow}>
              <span>Machine Learning</span>
              <span style={S.badgeSuccess}>Allocated</span>
            </div>

            <div style={S.courseRow}>
              <span>Cloud Computing</span>
              <span style={S.badgeSuccess}>Allocated</span>
            </div>

            <div style={S.courseRow}>
              <span>Cyber Security</span>
              <span style={S.badgeWait}>Waitlisted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={S.statsBanner}>
        <div style={S.statItem}>
          <div style={S.statNumber}>10,000+</div>
          <div>Successful Allocations</div>
        </div>

        <div style={S.statItem}>
          <div style={S.statNumber}>98%</div>
          <div>Student Satisfaction</div>
        </div>

        <div style={S.statItem}>
          <div style={S.statNumber}>50+</div>
          <div>Available Courses</div>
        </div>

        <div style={S.statItem}>
          <div style={S.statNumber}>24/7</div>
          <div>System Availability</div>
        </div>
      </div>

      {/* Features */}
      <div style={S.features}>
        <h2 style={S.sectionTitle}>Key Features</h2>

        <div style={S.featureGrid}>
          
          <div style={S.featureCard}>
            <h3>⚡ Automated Allocation</h3>
            <p>
              A powerful allocation algorithm analyzes thousands of student
              preferences and assigns courses instantly while respecting
              seat limits, eligibility rules, and institutional policies.
            </p>
          </div>

          <div style={S.featureCard}>
            <h3>🔒 Conflict Detection</h3>
            <p>
              Automatically detects timetable clashes and prevents
              overlapping course selections to ensure students
              have a smooth and manageable academic schedule.
            </p>
          </div>

          <div style={S.featureCard}>
            <h3>📊 Fair Distribution</h3>
            <p>
              Guarantees fair and transparent allocation by balancing
              enrollment across courses while respecting student
              preference rankings and department requirements.
            </p>
          </div>

          <div style={S.featureCard}>
            <h3>📄 Smart Reports</h3>
            <p>
              Generate course popularity insights, seat utilization
              statistics, and allocation reports that help universities
              improve academic planning and decision making.
            </p>
          </div>

        </div>
      </div>

      {/* Why Choose Section */}
      <div style={S.whySection}>
        <h2 style={S.sectionTitle}>Why Choose Our System?</h2>

        <p style={S.whyText}>
          Traditional course allocation systems are often time-consuming,
          complex, and prone to errors. Our intelligent course allocation
          platform eliminates manual effort and ensures fairness,
          transparency, and efficiency. With automated decision making,
          real-time seat tracking, and conflict detection, universities
          can provide a better academic experience for students while
          reducing administrative workload.
        </p>
      </div>

      {/* Footer */}
      <div style={S.footer}>
        <h3>CourseAllocator</h3>
        <p>
          A modern platform designed to make course selection simple,
          fair, and efficient for both students and administrators.
        </p>
        <p>© 2024 All rights reserved</p>
      </div>

    </div>
  );
}

const S = {

page:{
fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
minHeight:'100vh',
background:'#ffffff',
color:'#1e293b'
},

nav:{
display:'flex',
alignItems:'center',
justifyContent:'space-between',
padding:'0 3rem',
height:70,
background:'#fff',
boxShadow:'0 2px 10px rgba(0,0,0,0.05)',
position:'sticky',
top:0
},

navLeft:{display:'flex',alignItems:'center',gap:10},

logoCircle:{
width:40,
height:40,
borderRadius:'50%',
display:'flex',
alignItems:'center',
justifyContent:'center',
background:'linear-gradient(135deg,#ec4899,#38bdf8)',
color:'#fff'
},

logoText:{
fontWeight:700,
fontSize:18
},

navLinks:{
display:'flex',
gap:25
},

navLink:{
cursor:'pointer',
color:'#475569',
fontWeight:500
},

navRight:{
display:'flex',
gap:10
},

studentBtn:{
padding:'8px 18px',
border:'2px solid #ec4899',
background:'#fff',
color:'#ec4899',
borderRadius:6,
cursor:'pointer'
},

adminBtn:{
padding:'8px 18px',
border:'none',
background:'linear-gradient(135deg,#ec4899,#38bdf8)',
color:'#fff',
borderRadius:6,
cursor:'pointer'
},

topBar:{
height:3,
background:'linear-gradient(90deg,#ec4899,#38bdf8)'
},

hero:{
display:'flex',
alignItems:'center',
justifyContent:'space-between',
padding:'4rem',
background:'linear-gradient(135deg,#fdf2f8,#f0f9ff)'
},

heroLeft:{maxWidth:500},

heroTitle:{
fontSize:'3rem',
fontWeight:800,
lineHeight:1.2
},

heroDesc:{
color:'#64748b',
marginTop:15,
marginBottom:25,
lineHeight:1.6
},

heroBtns:{display:'flex',gap:15},

primaryBtn:{
background:'linear-gradient(135deg,#ec4899,#38bdf8)',
border:'none',
color:'#fff',
padding:'12px 25px',
borderRadius:8,
cursor:'pointer',
fontWeight:600
},

secondaryBtn:{
border:'2px solid #38bdf8',
background:'#fff',
color:'#0284c7',
padding:'12px 25px',
borderRadius:8,
cursor:'pointer'
},

heroRight:{width:350},

card:{
background:'#fff',
borderRadius:12,
padding:20,
boxShadow:'0 10px 25px rgba(0,0,0,0.08)'
},

cardTitle:{
marginBottom:15
},

courseRow:{
display:'flex',
justifyContent:'space-between',
marginBottom:10
},

badgeSuccess:{
background:'#dcfce7',
color:'#16a34a',
padding:'3px 10px',
borderRadius:6
},

badgeWait:{
background:'#fef3c7',
color:'#d97706',
padding:'3px 10px',
borderRadius:6
},

statsBanner:{
display:'flex',
justifyContent:'space-around',
padding:'2rem',
background:'linear-gradient(135deg,#ec4899,#38bdf8)',
color:'#fff'
},

statItem:{textAlign:'center'},

statNumber:{
fontSize:24,
fontWeight:700
},

features:{
padding:'4rem',
textAlign:'center'
},

sectionTitle:{
fontSize:'2rem',
marginBottom:40
},

featureGrid:{
display:'grid',
gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',
gap:20
},

featureCard:{
background:'#f8fafc',
padding:20,
borderRadius:10
},

whySection:{
padding:'3rem',
textAlign:'center',
background:'#f8fafc'
},

whyText:{
maxWidth:700,
margin:'auto',
color:'#475569',
lineHeight:1.7
},

footer:{
background:'#0f172a',
color:'#fff',
padding:'2rem',
textAlign:'center'
}

};