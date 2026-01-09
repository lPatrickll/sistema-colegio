// src/components/auth/AuthContext.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

type AppUser = {
  uid: string;
  email: string | null;
  roles: string[];
};

type AuthContextType = {
  user: AppUser | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      let roles: string[] = [];

      if (userDoc.exists()) {
        const data = userDoc.data() as { roles?: string[]; role?: string };

        if (Array.isArray(data.roles)) {
          roles = data.roles;
        } else if (data.role) {
          roles = [data.role.toUpperCase()];
        }
      }

      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        roles,
      });

      setLoading(false);
    });

    return () => unsub();
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
