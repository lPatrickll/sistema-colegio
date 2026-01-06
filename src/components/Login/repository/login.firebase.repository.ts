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
      throw new Error("No se pudo crear la sesión (__session).");
    }

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      roles: [],
    };
  }


  async logout(): Promise<void> {
    await fetch("/api/auth/session", { method: "DELETE" });
    await signOut(auth);
  }
}
