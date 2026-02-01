import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { auth, db } from "../firebaseConfig/firebase";
import { isCurrentUserAdmin } from "../services/adminGate";
import { uploadDocument } from "../services/uploadDocument";
import { BRAND } from "../constants/brand";
import { UI } from "../constants/ui";

const CATEGORY_OPTIONS = [
  { code: "INVOICE", label: "Invoice" },
  { code: "RECEIPT", label: "Receipt" },
  { code: "QUOTE", label: "Quote" },
  { code: "DELIVERY_NOTE", label: "Delivery Note" },
  { code: "POD", label: "Proof of Delivery" },
  { code: "WAYBILL", label: "Waybill" },
  { code: "COMPLIANCE", label: "Compliance" },
  { code: "INDUCTION", label: "Induction" },
  { code: "CONTRACT", label: "Contract / Agreement" },
  { code: "PURCHASE_ORDER", label: "Purchase Order" },
  { code: "BUILDING", label: "Building / Residence" },
];

export default function DocumentVault() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [docs, setDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Upload form
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("INVOICE");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [msg, setMsg] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthLoading(true);
      try {
        const admin = await isCurrentUserAdmin(user);
        setIsAdmin(admin);
      } finally {
        setAuthLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const loadDocs = async () => {
    setLoadingDocs(true);
    try {
      const q = query(
        collection(db, "documents"),
        orderBy("audit.uploadedAt", "desc")
      );
      const snap = await getDocs(q);
      setDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onUpload = async () => {
    setMsg("");

    if (!isAdmin) {
      setMsg("Admin only: you do not have permission to upload.");
      return;
    }
    if (!title.trim()) {
      setMsg("Please enter a document title.");
      return;
    }
    if (!file) {
      setMsg("Please choose a file to upload.");
      return;
    }

    setUploading(true);
    try {
      await uploadDocument({ title: title.trim(), category, file });
      setTitle("");
      setCategory("INVOICE");
      setFile(null);
      setMsg("✅ Uploaded successfully.");
      await loadDocs();
    } catch (e) {
      console.error(e);
      setMsg(`❌ Upload failed: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Vault Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.headerTitle}>Document Vault</h2>
          <p style={styles.headerSub}>Secure documents with audit history</p>
        </div>

        <span style={UI.pill}>
          {authLoading ? "Checking access…" : isAdmin ? "Admin" : "Read-only"}
        </span>
      </div>

      <div style={styles.wrap}>
        <p style={styles.sub}>
          Uploads are <strong>Admin only</strong>. View/download is available to
          everyone who can access the dashboard.
        </p>

        {/* Upload Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={{ margin: 0, color: BRAND.charcoal }}>Upload Document</h3>
            <span style={styles.lockPill}>
              🔒 Admin only (uploads)
            </span>
          </div>

          {!isAdmin && !authLoading && (
            <div style={styles.notice}>
              🔒 Admin only: you can view/download documents, but uploads are disabled.
            </div>
          )}

          <div style={styles.formGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Title</label>
              <input
                style={styles.input}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. AECI Induction Certificate - Caroline"
                disabled={!isAdmin || uploading}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Category</label>
              <select
                style={styles.input}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={!isAdmin || uploading}
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>File</label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={!isAdmin || uploading}
              />
              <p style={styles.help}>
                Tip: PDFs are best for invoices, induction docs, contracts.
              </p>
            </div>
          </div>

          <button
            style={{
              ...styles.btn,
              opacity: !isAdmin || uploading ? 0.6 : 1,
            }}
            onClick={onUpload}
            disabled={!isAdmin || uploading}
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>

          {msg && <p style={styles.msg}>{msg}</p>}
        </div>

        {/* Document List */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={{ margin: 0, color: BRAND.charcoal }}>Recent Documents</h3>
            <button style={styles.smallBtn} onClick={loadDocs}>
              Refresh
            </button>
          </div>

          {loadingDocs ? (
            <p style={styles.muted}>Loading documents…</p>
          ) : docs.length === 0 ? (
            <p style={styles.muted}>No documents yet.</p>
          ) : (
            <div style={styles.table}>
              {docs.slice(0, 15).map((d) => (
                <div key={d.id} style={styles.row}>
                  <div>
                    <div style={styles.docTitle}>{d.title}</div>
                    <div style={styles.docMeta}>
                      {d.category} • {d.audit?.uploadedByEmail || "unknown"}
                    </div>
                  </div>

                  {d.storage?.downloadUrl ? (
                    <a
                      style={styles.link}
                      href={d.storage.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open
                    </a>
                  ) : (
                    <span style={styles.muted}>No link</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <p style={styles.help}>
            Note: delete/edit is disabled to protect audit history.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- STYLES ---------- */

const styles = {
  page: UI.page,

  header: {
    ...UI.headerStrip,
    borderRadius: 0,
    marginBottom: 14,
  },

  headerTitle: {
    color: BRAND.white,
    margin: 0,
    fontWeight: 900,
    fontSize: 18,
  },

  headerSub: {
    color: "rgba(255,255,255,0.85)",
    margin: "4px 0 0",
    fontSize: 12,
  },

  wrap: { ...UI.container, paddingTop: 0 },

  sub: { color: "#555", marginTop: 0 },

  card: {
    ...UI.card,
    padding: 16,
    marginTop: 14,
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },

  lockPill: {
    ...UI.pill,
    background: BRAND.tealSoft2,
  },

  notice: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    background: "#fff7e6",
    border: "1px solid #ffe1a6",
    color: "#7a4f01",
    fontSize: 13,
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 12,
    marginTop: 12,
  },

  field: { display: "flex", flexDirection: "column", gap: 6 },

  label: { fontWeight: 900, fontSize: 13, color: BRAND.charcoal },

  input: UI.input,

  help: { fontSize: 12, color: "#666", margin: "6px 0 0" },

  btn: UI.buttonPrimary,

  msg: { marginTop: 10, fontSize: 13 },

  smallBtn: UI.buttonGhost,

  table: { marginTop: 10 },

  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    padding: "10px 0",
    borderBottom: "1px solid #f0f0f0",
  },

  docTitle: { fontWeight: 900, color: BRAND.charcoal },

  docMeta: { fontSize: 12, color: "#666", marginTop: 2 },

  link: { color: BRAND.teal, fontWeight: 900, textDecoration: "none" },

  muted: UI.muted,
};
