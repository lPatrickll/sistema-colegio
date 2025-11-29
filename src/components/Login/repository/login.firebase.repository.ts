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

    let role: string | undefined = undefined;

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data() as { role?: string };
      role = data.role;
    }

    const authUser: AuthUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role,
    };

    return authUser;
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }
}
