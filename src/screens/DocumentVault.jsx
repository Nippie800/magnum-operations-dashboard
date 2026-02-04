import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { auth, db } from "../firebaseConfig/firebase";
import { isCurrentUserAdmin } from "../services/adminGate";
import { uploadDocument } from "../services/uploadDocument";
import { BRAND } from "../constants/brand";
import { UI } from "../constants/ui";

const CATEGORY_OPTIONS = [
  { code: "ALL", label: "All categories" },
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

const SORT_OPTIONS = [
  { code: "DATE_DESC", label: "Newest first" },
  { code: "DATE_ASC", label: "Oldest first" },
  { code: "CATEGORY_AZ", label: "Category A → Z" },
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

  // Browser controls
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [sortMode, setSortMode] = useState("DATE_DESC");

  // Preview state
  const [previewDoc, setPreviewDoc] = useState(null);

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

  /* ---------- Browser helpers ---------- */

  const categoryLabel = (code) =>
    CATEGORY_OPTIONS.find((c) => c.code === code)?.label || code;

  const formatDate = (ts) => {
    const d =
      ts?.toDate?.() || (typeof ts === "number" ? new Date(ts) : null) || null;
    if (!d) return "—";
    return d.toLocaleString();
  };

  const filteredDocs = useMemo(() => {
    const s = search.trim().toLowerCase();

    let arr = docs.filter((d) => {
      const matchesCategory =
        filterCategory === "ALL" ? true : d.category === filterCategory;

      const matchesSearch =
        !s ||
        (d.title || "").toLowerCase().includes(s) ||
        (d.category || "").toLowerCase().includes(s) ||
        (d.audit?.uploadedByEmail || "").toLowerCase().includes(s);

      return matchesCategory && matchesSearch;
    });

    if (sortMode === "DATE_ASC") {
      arr = arr.sort((a, b) => {
        const ad = a.audit?.uploadedAt?.toMillis?.() || 0;
        const bd = b.audit?.uploadedAt?.toMillis?.() || 0;
        return ad - bd;
      });
    } else if (sortMode === "DATE_DESC") {
      arr = arr.sort((a, b) => {
        const ad = a.audit?.uploadedAt?.toMillis?.() || 0;
        const bd = b.audit?.uploadedAt?.toMillis?.() || 0;
        return bd - ad;
      });
    } else if (sortMode === "CATEGORY_AZ") {
      arr = arr.sort((a, b) =>
        (a.category || "").localeCompare(b.category || "")
      );
    }

    return arr;
  }, [docs, search, filterCategory, sortMode]);

  const openPreview = (d) => {
    setPreviewDoc(d);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closePreview = () => setPreviewDoc(null);

  const getFileType = (d) => d.storage?.contentType || d.storage?.fileType || "";
  const isPdf = (d) => (getFileType(d) || "").includes("pdf");
  const isImage = (d) => (getFileType(d) || "").startsWith("image/");

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.headerTitle}>Document Vault</h2>
          <p style={styles.headerSub}>Read-only browser + Admin uploads</p>
        </div>

        <span style={UI.pill}>
          {authLoading ? "Checking access…" : isAdmin ? "Admin" : "Read-only"}
        </span>
      </div>

      <div style={styles.wrap}>
        {/* PREVIEW PANEL */}
        {previewDoc && (
          <div style={{ ...styles.card, marginTop: 0 }}>
            <div style={styles.cardHeader}>
              <div>
                <h3 style={{ margin: 0, color: BRAND.charcoal }}>
                  Preview: {previewDoc.title}
                </h3>
                <div style={styles.previewMeta}>
                  <span style={UI.tag}>{categoryLabel(previewDoc.category)}</span>
                  <span style={styles.previewMetaText}>
                    Uploaded: {formatDate(previewDoc.audit?.uploadedAt)}
                  </span>
                  <span style={styles.previewMetaText}>
                    By: {previewDoc.audit?.uploadedByEmail || "unknown"}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {previewDoc.storage?.downloadUrl && (
                  <a
                    href={previewDoc.storage.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.linkBtn}
                  >
                    Download / Open
                  </a>
                )}
                <button style={UI.buttonGhost} onClick={closePreview}>
                  Close Preview
                </button>
              </div>
            </div>

            <div style={styles.previewBody}>
              {previewDoc.storage?.downloadUrl ? (
                isPdf(previewDoc) ? (
                  <iframe
                    title="pdf-preview"
                    src={previewDoc.storage.downloadUrl}
                    style={styles.iframe}
                  />
                ) : isImage(previewDoc) ? (
                  <img
                    alt="preview"
                    src={previewDoc.storage.downloadUrl}
                    style={styles.previewImg}
                  />
                ) : (
                  <p style={styles.muted}>
                    Preview not available for this file type. Use “Download / Open”.
                  </p>
                )
              ) : (
                <p style={styles.muted}>No download link stored for this file.</p>
              )}
            </div>
          </div>
        )}

        {/* Upload Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={{ margin: 0, color: BRAND.charcoal }}>Upload Document</h3>
            <span style={{ ...UI.pill, background: BRAND.tealSoft2, color: BRAND.charcoal }}>
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
                {CATEGORY_OPTIONS.filter((c) => c.code !== "ALL").map((c) => (
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
            style={{ ...UI.buttonPrimary, opacity: !isAdmin || uploading ? 0.6 : 1 }}
            onClick={onUpload}
            disabled={!isAdmin || uploading}
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>

          {msg && <p style={styles.msg}>{msg}</p>}
        </div>

        {/* Browser Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={{ margin: 0, color: BRAND.charcoal }}>Document Browser</h3>

            <button style={UI.buttonGhost} onClick={loadDocs}>
              Refresh
            </button>
          </div>

          <div style={styles.controls}>
            <input
              style={styles.search}
              placeholder="Search title, category, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              style={styles.select}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>

            <select
              style={styles.select}
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.label}
                </option>
              ))}
            </select>

            <button
              style={UI.buttonGhost}
              onClick={() => {
                setSearch("");
                setFilterCategory("ALL");
                setSortMode("DATE_DESC");
              }}
            >
              Clear
            </button>
          </div>

          {loadingDocs ? (
            <p style={styles.muted}>Loading documents…</p>
          ) : filteredDocs.length === 0 ? (
            <p style={styles.muted}>No documents match your search/filters.</p>
          ) : (
            <div style={styles.table}>
              {filteredDocs.map((d) => (
                <div key={d.id} style={styles.row}>
                  <div style={{ minWidth: 0 }}>
                    <div style={styles.docTitle}>{d.title}</div>
                    <div style={styles.docMeta}>
                      <span style={UI.tag}>{categoryLabel(d.category)}</span>
                      <span style={styles.dot}>•</span>
                      <span>{formatDate(d.audit?.uploadedAt)}</span>
                      <span style={styles.dot}>•</span>
                      <span>{d.audit?.uploadedByEmail || "unknown"}</span>
                    </div>
                  </div>

                  <div style={styles.rowActions}>
                    <button style={UI.buttonGhost} onClick={() => openPreview(d)}>
                      Preview
                    </button>

                    {d.storage?.downloadUrl ? (
                      <a
                        href={d.storage.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.linkBtn}
                      >
                        Download
                      </a>
                    ) : (
                      <span style={styles.muted}>No link</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p style={styles.help}>
            Metadata editing and deletion is disabled to protect audit history.
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

  card: { ...UI.card, padding: 16, marginTop: 14 },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
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

  help: { fontSize: 12, color: "#666", margin: "10px 0 0" },

  msg: { marginTop: 10, fontSize: 13 },

  muted: UI.muted,

  controls: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 12,
    alignItems: "center",
  },

  search: { ...UI.input, flex: "1 1 260px" },
  select: { ...UI.input, padding: "10px 12px" },

  table: { marginTop: 12 },

  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "12px 0",
    borderBottom: "1px solid #f0f0f0",
  },

  docTitle: { fontWeight: 900, color: BRAND.charcoal },

  docMeta: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },

  dot: { opacity: 0.6 },

  rowActions: { display: "flex", gap: 10, alignItems: "center" },

  linkBtn: {
    ...UI.buttonPrimary,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },

  previewMeta: {
    marginTop: 6,
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
  },

  previewMetaText: { fontSize: 12, color: "#666", fontWeight: 700 },

  previewBody: { marginTop: 12 },

  iframe: {
    width: "100%",
    height: 520,
    border: `1px solid ${BRAND.border}`,
    borderRadius: 12,
  },

  previewImg: {
    width: "100%",
    maxHeight: 520,
    objectFit: "contain",
    borderRadius: 12,
    border: `1px solid ${BRAND.border}`,
    background: BRAND.bg,
  },
};
