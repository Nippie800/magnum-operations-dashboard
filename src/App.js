import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import InventoryLogger from "./screens/InventoryLogger";
import InventoryDashboard from "./screens/InventoryDashboard";

export default function App() {
  return (
    <Router>
      <nav style={styles.nav}>
        <Link to="/" style={styles.link}>Log Event</Link>
        <Link to="/inventory" style={styles.link}>Inventory Dashboard</Link>
      </nav>

      <Routes>
        <Route path="/" element={<InventoryLogger />} />
        <Route path="/inventory" element={<InventoryDashboard />} />
      </Routes>
    </Router>
  );
}

const styles = {
  nav: {
    display: "flex",
    gap: 16,
    padding: 16,
    background: "#111"
  },
  link: {
    color: "#fff",
    textDecoration: "none",
    fontWeight: 600
  }
};
