import Link from "next/link";
import { ProfesorRepository } from "@/modules/profesor/profesor.repository";

export default async function ProfesoresPage({
  params,
}: {
  params: Promise<{ gestionId: string }>;
}) {
  const { gestionId } = await params;
  const profesores = await ProfesorRepository.listByGestionId(gestionId);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Profesores - Gestión {gestionId}
        </h1>

        <Link
          className="bg-blue-600 text-white px-4 py-2 rounded"
          href={`/admin/gestion/${gestionId}/profesores/nuevo`}
        >
          Nuevo profesor
        </Link>
      </div>

      {profesores.length === 0 ? (
        <p className="text-slate-600">No hay profesores registrados aún.</p>
      ) : (
        <div className="space-y-2">
          {profesores.map((p) => (
            <div key={p.id} className="border rounded p-3">
              <div className="font-semibold">
                {p.nombres} {p.apellidos}
              </div>
              <div className="text-sm text-slate-600">
                CI: {p.ci} {p.telefono ? `• Tel: ${p.telefono}` : ""} •{" "}
                {p.activo ? "Activo" : "Inactivo"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
