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
    <html lang="es">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
