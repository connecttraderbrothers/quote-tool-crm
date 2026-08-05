import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth, logout } from './lib/auth.js';
import { IS_DEMO } from './lib/pb.js';
import Login from './screens/Login.jsx';
import Dashboard from './screens/Dashboard.jsx';
import Customers from './screens/Customers.jsx';
import CustomerProfile from './screens/CustomerProfile.jsx';
import Pipeline from './screens/Pipeline.jsx';
import DocumentList from './screens/DocumentList.jsx';
import DocumentEditor from './screens/DocumentEditor.jsx';

export default function App() {
  const { user, ready, company } = useAuth();

  if (!ready) return <div className="spinner">Loading…</div>;
  if (!user) return <Login />;

  return (
    <div className="app-shell">
      {IS_DEMO && (
        <div className="demo-banner">
          Standalone mode — sample data held in memory. Nothing is saved, and a refresh resets it.
        </div>
      )}
      <TopBar user={user} company={company} />
      <main className="page">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerProfile />} />
          <Route path="/documents/:type" element={<DocumentList />} />
          <Route path="/document/:id" element={<DocumentEditor />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function TopBar({ user, company }) {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="topbar">
      <div className="topbar-brand">OMEGA</div>
      <nav className="topbar-nav">
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/pipeline">Pipeline</NavLink>
        <NavLink to="/customers">Customers</NavLink>
        <NavLink to="/documents/estimate">Estimates</NavLink>
        <NavLink to="/documents/invoice">Invoices</NavLink>
        <NavLink to="/documents/statement">Statements</NavLink>
      </nav>
      <div className="topbar-user">
        <span className="nowrap">{company?.name || user.full_name}</span>
        <button className="btn btn-sm btn-secondary" onClick={handleLogout}>Sign out</button>
      </div>
    </header>
  );
}
