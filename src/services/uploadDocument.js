import { doc, setDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "../firebaseConfig/firebase";

function safeFileName(name = "file") {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.\-_]/g, "");
}

export async function uploadDocument({
  title,
  category,
  file,
  accessLevel = "STAFF_READ",
  tags = [],
  related = null,
}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in.");

  // 1) Pre-generate a Firestore docId (no update needed later)
  const docRef = doc(collection(db, "documents"));
  const docId = docRef.id;

  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");

  const path = `vault/${yyyy}/${mm}/${docId}-${safeFileName(file.name)}`;

  // 2) Upload file to Storage
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);

  // 3) Get download url (optional but useful)
  const downloadUrl = await getDownloadURL(fileRef);

  // 4) Create Firestore metadata ONCE (audit-safe)
  await setDoc(docRef, {
    title,
    category,
    tags,
    related,

    storage: {
      bucketPath: path,
      downloadUrl,
      originalFileName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size || 0,
    },

    access: {
      level: accessLevel,
      allowedUsers: [],
    },

    audit: {
      uploadedByUid: user.uid,
      uploadedByEmail: user.email || "anonymous",
      uploadedAt: serverTimestamp(),
      lastViewedAt: null,
      viewCount: 0,
    },

    status: {
      isArchived: false,
      version: 1,
    },
  });

  return { docId, path, downloadUrl };
}
