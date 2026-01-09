// src/app/admin/gestion/layout.tsx
import AdminTopbar from "@/components/layout/AdminTopbar";
import { ReactNode } from "react";

export default function GestionLayout({ children }: { children: ReactNode }) {
  return <>
    <AdminTopbar />
    {children}
  </>;
}