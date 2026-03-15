import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing          from './pages/Landing';
import StudentLogin     from './pages/StudentLogin';
import AdminLogin       from './pages/AdminLogin';
import Register         from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard   from './pages/AdminDashboard';

function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'linear-gradient(135deg,#fce7f3,#e0f2fe)', fontFamily:'system-ui' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:'1rem' }}>🎓</div>
        <div style={{ color:'#db2777', fontWeight:600 }}>Loading...</div>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role)
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"               element={<PublicRoute><Landing /></PublicRoute>} />
      <Route path="/student-login"  element={<PublicRoute><StudentLogin /></PublicRoute>} />
      <Route path="/admin-login"    element={<PublicRoute><AdminLogin /></PublicRoute>} />
      <Route path="/login"          element={<Navigate to="/student-login" replace />} />
      <Route path="/register"       element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/dashboard"      element={<PrivateRoute role="student"><StudentDashboard /></PrivateRoute>} />
      <Route path="/dashboard/:tab" element={<PrivateRoute role="student"><StudentDashboard /></PrivateRoute>} />
      <Route path="/admin"          element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
      <Route path="/admin/:tab"     element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
      <Route path="*"               element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
