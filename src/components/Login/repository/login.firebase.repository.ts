// src/Login/repository/login.firebase.repository.ts
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { AuthUser, LoginCredentials } from "../domain/login.types";

export class LoginFirebaseRepository {
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const { email, password } = credentials;

    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;

    const idToken = await user.getIdToken();

    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    if (!res.ok) {
      await signOut(auth);
      throw new Error("No se pudo crear la sesión (__session). Revisa firebase-admin.");
    }

    let roles: string[] = [];

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data() as { roles?: string[]; role?: string };

      if (Array.isArray(data.roles)) {
        roles = data.roles.map((r) => String(r).toUpperCase());
      } else if (data.role) {
        roles = [String(data.role).toUpperCase()];
      }
    }

    const authUser: AuthUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      roles,
    };

    return authUser;
  }

  async logout(): Promise<void> {
    await fetch("/api/auth/session", { method: "DELETE" });
    await signOut(auth);
  }
}
