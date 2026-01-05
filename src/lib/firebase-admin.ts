// src/lib/firebase-admin.ts
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

function loadServiceAccount(): admin.ServiceAccount {
  const p = path.join(process.cwd(), "serviceAccountKey.json");

  if (!fs.existsSync(p)) {
    throw new Error(
      "No existe serviceAccountKey.json en la raíz del proyecto (al lado de package.json)."
    );
  }

  const raw = fs.readFileSync(p, "utf8");
  const parsed = JSON.parse(raw);

  if (typeof parsed.private_key === "string") {
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  }

  return parsed as admin.ServiceAccount;
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(loadServiceAccount()),
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
