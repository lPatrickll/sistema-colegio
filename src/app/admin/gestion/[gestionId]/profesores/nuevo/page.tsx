// src/app/admin/gestion/[gestionId]/profesores/nuevo/page.tsx
import ProfesorForm from "@/components/forms/ProfesorForm";
import Link from "next/link";

export default async function NuevoProfesorPage({
  params,
}: {
  params: Promise<{ gestionId: string }>;
}) {
  const { gestionId } = await params;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Crear profesor — Gestión {gestionId}
        </h1>

        <Link
          href={`/admin/gestion/${gestionId}/profesores`}
          className="bg-slate-900 text-white px-4 py-2 rounded"
        >
          Volver
        </Link>
      </div>

      <ProfesorForm gestionId={gestionId} />
    </div>
  );
}
