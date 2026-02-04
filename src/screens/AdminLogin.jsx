import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig/firebase";
import { BRAND } from "../constants/brand";
import { UI } from "../constants/ui";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" }); // type: "ok" | "err" | ""

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const onSignIn = async () => {
    setMsg({ type: "", text: "" });

    if (!email.trim() || !password) {
      setMsg({ type: "err", text: "Please enter your email and password." });
      return;
    }

    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setMsg({ type: "ok", text: "Signed in successfully. Redirecting to Document Vault…" });

      // small delay so user sees confirmation
      setTimeout(() => navigate("/vault"), 450);
    } catch (e) {
      setMsg({ type: "err", text: e?.message || "Sign-in failed. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const onSignOut = async () => {
    setMsg({ type: "", text: "" });
    setSubmitting(true);
    try {
      await signOut(auth);
      setEmail("");
      setPassword("");
      setMsg({ type: "ok", text: "Signed out." });
    } catch (e) {
      setMsg({ type: "err", text: e?.message || "Sign-out failed." });
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- UI ----------
  if (authLoading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h2 style={styles.title}>🔐 Admin Login</h2>
          <p style={styles.muted}>Checking session…</p>
        </div>
      </div>
    );
  }

  const signedInEmail = user?.email || "";
  const isEmailUser = !!user && !user.isAnonymous && !!user.email;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <h2 style={styles.title}>🔐 Admin Login</h2>
          <span style={{ ...UI.pill, background: BRAND.tealSoft2, color: BRAND.charcoal }}>
            {isEmailUser ? "Signed in" : "Signed out"}
          </span>
        </div>

        {isEmailUser ? (
          <>
            <p style={styles.text}>
              You’re signed in as <strong>{signedInEmail}</strong>.
            </p>

            <div style={styles.actions}>
              <button style={UI.buttonPrimary} onClick={() => navigate("/vault")}>
                Go to Document Vault
              </button>

              <button style={UI.buttonGhost} onClick={onSignOut} disabled={submitting}>
                {submitting ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={styles.text}>
              Sign in with your admin email to unlock uploads + admin tools.
            </p>

            <div style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <input
                  style={UI.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="newadmin@magnum.co.za"
                  autoComplete="email"
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Password</label>
                <input
                  style={UI.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  type="password"
                  autoComplete="current-password"
                />
              </div>

              <button
                style={{ ...UI.buttonPrimary, opacity: submitting ? 0.7 : 1 }}
                onClick={onSignIn}
                disabled={submitting}
              >
                {submitting ? "Signing in…" : "Sign In"}
              </button>
            </div>
          </>
        )}

        {msg.text && (
          <div
            style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 12,
              border: `1px solid ${msg.type === "err" ? "#ffccc7" : "#b7eb8f"}`,
              background: msg.type === "err" ? "#fff2f0" : "#f6ffed",
              color: msg.type === "err" ? "#a8071a" : "#135200",
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            {msg.text}
          </div>
        )}

        <p style={styles.footerHint}>
          Tip: If you accidentally signed in anonymously, just sign out here and sign in again.
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    ...UI.page,
    display: "flex",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    ...UI.card,
    width: "min(520px, 100%)",
    padding: 18,
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  title: { margin: 0, color: BRAND.charcoal, fontWeight: 900, fontSize: 18 },
  text: { marginTop: 10, marginBottom: 14, color: "#444" },
  muted: { color: "#666", marginTop: 10 },
  form: { display: "flex", flexDirection: "column", gap: 12, marginTop: 10 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontWeight: 900, fontSize: 13, color: BRAND.charcoal },
  actions: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 },
  footerHint: { marginTop: 14, fontSize: 12, color: "#666" },
};
