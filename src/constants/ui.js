import { BRAND } from "./brand";

export const UI = {
  // Layout
  page: {
    background: BRAND.bg,
    minHeight: "100vh",
    fontFamily: "system-ui",
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: 20,
  },

  // Header strip
  headerStrip: {
    background: BRAND.charcoal,
    color: BRAND.white,
    padding: "14px 18px",
    borderBottom: `4px solid ${BRAND.teal}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  // Cards
  card: {
    background: BRAND.white,
    border: `1px solid ${BRAND.border}`,
    borderRadius: 12,
    boxShadow: "0 6px 14px rgba(0,0,0,0.07)",
  },

  // Pills/Tags
  pill: {
    background: BRAND.tealSoft,
    color: BRAND.teal,
    border: `1px solid ${BRAND.border}`,
    padding: "6px 10px",
    borderRadius: 999,
    fontWeight: 900,
    fontSize: 12,
  },
  tag: {
    background: BRAND.tealSoft,
    color: BRAND.teal,
    padding: "4px 8px",
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 800,
  },

  // Inputs
  input: {
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${BRAND.border}`,
    outline: "none",
    background: BRAND.white,
  },

  // Buttons
  buttonPrimary: {
    background: BRAND.teal,
    color: BRAND.white,
    border: "none",
    padding: "10px 14px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 900,
  },

  buttonGhost: {
    background: BRAND.white,
    color: BRAND.teal,
    border: `1px solid ${BRAND.border}`,
    padding: "10px 14px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 900,
  },

  buttonHeader: {
    background: BRAND.white,
    color: BRAND.charcoal,
    border: "none",
    padding: "10px 12px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 900,
  },

  // Text
  muted: { color: "#666" },
};
