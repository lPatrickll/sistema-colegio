import ProfesorForm from "@/components/forms/ProfesorForm";
import { getGestionTitle } from "@/lib/displayNames";
import Link from "next/link";

export default async function NuevoProfesorPage({
  params,
}: {
  params: Promise<{ gestionId: string }>;
}) {
  const { gestionId } = await params;

    const gestionTitle = await getGestionTitle(gestionId);


  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">
          Crear profesor — Gestión {gestionTitle}
        </h1>

        <Link
          href={`/admin/gestion/${gestionId}/profesores`}
          className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-4 py-2 rounded border border-slate-700"
        >
          Volver
        </Link>
      </div>

      <ProfesorForm gestionId={gestionId} />
    </div>
  );
}
