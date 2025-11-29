// src/Login/repository/login.firebase.repository.ts
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { AuthUser, LoginCredentials } from "../domain/login.types";

export class LoginFirebaseRepository {
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const { email, password } = credentials;

    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;

    const authUser: AuthUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
    };

    return authUser;
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }
}
