import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { BRAND } from "../constants/brand";
import { UI } from "../constants/ui";
import magnumLogo from "../assets/magnum-logo.jpg";

export default function DashboardTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  // Determine which tab is active
  const current = path.startsWith("/vault")
    ? "vault"
    : path.startsWith("/admin-login")
    ? "admin"
    : path.startsWith("/log")
    ? "log"
    : "inventory";

  // Tab navigation map (explicit = no surprises)
  const TAB_TO_ROUTE = {
    inventory: "/inventory",
    vault: "/vault",
    admin: "/admin-login",
  };

  const setTab = (tabKey) => {
    // Only remember the "main" tool tabs for owner experience
    if (tabKey === "inventory" || tabKey === "vault") {
      localStorage.setItem("magnum:lastTab", tabKey);
    }
    navigate(TAB_TO_ROUTE[tabKey] || "/inventory");
  };

  const openInNewWindow = () => window.open(window.location.href, "_blank");

  // Active styles helper
  const tabStyle = (tabKey) => ({
    ...styles.tabBtn,
    ...(current === tabKey ? styles.tabBtnActive : {}),
  });

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.brandBlock}>
          <img src={magnumLogo} alt="Magnum logo" style={styles.logo} />
          <div>
            <h2 style={styles.title}>Magnum Operations Dashboard</h2>
            <p style={styles.sub}>Inventory + Document Vault</p>
          </div>
        </div>

        <div style={styles.headerRight}>
          <button style={UI.buttonHeader} onClick={openInNewWindow}>
            Open in new window
          </button>

          {/* Keep Log Event as a link (admin tool) */}
          <Link to="/log" style={styles.loggerLink}>
            Log Event
          </Link>
        </div>
      </div>

      {/* Tabs surface */}
      <div style={styles.tabSurface}>
        <button onClick={() => setTab("inventory")} style={tabStyle("inventory")}>
          📦 Inventory Dashboard
        </button>

        <button onClick={() => setTab("vault")} style={tabStyle("vault")}>
          📁 Document Vault
        </button>

        <button onClick={() => setTab("admin")} style={tabStyle("admin")}>
          🔐 Admin Login
        </button>

        {/* Context hint on admin screens */}
        {(current === "admin" || current === "log") && (
          <span style={styles.logHint}>
            🔒 Admin tools
          </span>
        )}
      </div>

      {/* Content area */}
      <div style={styles.contentWrap}>
        <Outlet />
      </div>
    </div>
  );
}

const styles = {
  page: UI.page,
  header: UI.headerStrip,

  brandBlock: { display: "flex", alignItems: "center", gap: 12 },

  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    objectFit: "cover",
    background: BRAND.white,
  },

  title: { margin: 0, fontSize: 18, fontWeight: 900 },
  sub: { margin: "3px 0 0", fontSize: 12, opacity: 0.88 },

  headerRight: { display: "flex", gap: 10, alignItems: "center" },

  loggerLink: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.55)",
    color: BRAND.white,
    padding: "10px 12px",
    borderRadius: 12,
    textDecoration: "none",
    fontWeight: 900,
  },

  tabSurface: {
    ...UI.card,
    margin: "14px auto 0",
    maxWidth: 1200,
    padding: 12,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
    background: BRAND.white,
  },

  tabBtn: {
    ...UI.buttonGhost,
    color: BRAND.charcoal,
    fontWeight: 900,
  },

  tabBtnActive: {
    background: BRAND.teal,
    color: BRAND.white,
    borderColor: BRAND.teal,
  },

  logHint: {
    marginLeft: "auto",
    fontSize: 12,
    fontWeight: 800,
    color: BRAND.charcoal,
    background: BRAND.tealSoft2,
    padding: "6px 10px",
    borderRadius: 999,
    border: `1px solid ${BRAND.border}`,
  },

  contentWrap: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: 20,
  },
};
