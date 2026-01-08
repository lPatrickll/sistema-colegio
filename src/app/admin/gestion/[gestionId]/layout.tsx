// src/app/admin/gestion/[gestionId]/layout.tsx
import { ReactNode } from "react";
import AdminGestionSidebar from "@/components/layout/AdminGestionSidebar";
import BackButton from "@/components/ui/BackButton";

export default async function AdminGestionLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ gestionId: string }>;
}) {
  const { gestionId } = await params;

  return (
    <div className="flex gap-6">
      <aside className="w-72 shrink-0">
        <div className="sticky top-6">
          <AdminGestionSidebar gestionId={gestionId} />
        </div>
      </aside>

      <section className="flex-1 min-w-0">
        <div className="mb-4">
          <BackButton gestionId={gestionId} />
        </div>

        {children}
      </section>
    </div>
  );
}
