import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import DashboardTabs from "./screens/DashboardTabs";
import InventoryDashboard from "./screens/InventoryDashboard";
import DocumentVault from "./screens/DocumentVault";
import InventoryLogger from "./screens/InventoryLogger";
import AdminLogin from "./screens/AdminLogin"; // ✅ add this

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to={getLastTabPath()} replace />} />
<Route path="admin-login" element={<AdminLogin />} /> {/* ✅ */}
        <Route path="/" element={<DashboardTabs />}>
          <Route path="inventory" element={<InventoryDashboard />} />
          <Route path="vault" element={<DocumentVault />} />
          <Route path="log" element={<InventoryLogger />} />
          
        </Route>

        <Route path="*" element={<Navigate to={getLastTabPath()} replace />} />
      </Routes>
    </Router>
  );
}

function getLastTabPath() {
  const last = localStorage.getItem("magnum:lastTab");
  if (last === "vault") return "/vault";
  return "/inventory";
}
