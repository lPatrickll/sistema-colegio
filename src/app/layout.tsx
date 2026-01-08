import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/Auth/AuthContext";

export const metadata: Metadata = {
  title: "Sistema Colegio",
  description: "Gestión académica y administrativa",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
