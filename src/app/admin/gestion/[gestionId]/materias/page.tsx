import Link from "next/link";
import { MateriaRepository } from "@/modules/materia/materia.repository";

export default async function MateriasPage({
  params,
}: {
  params: Promise<{ gestionId: string }>;
}) {
  const { gestionId } = await params;
  const materias = await MateriaRepository.listByGestionId(gestionId);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Materias - Gestión {gestionId}
        </h1>

        <Link
          className="bg-blue-600 text-white px-4 py-2 rounded"
          href={`/admin/gestion/${gestionId}/materias/nuevo`}
        >
          Nueva materia
        </Link>
      </div>

      {materias.length === 0 ? (
        <p className="text-slate-600">No hay materias registradas aún.</p>
      ) : (
        <div className="space-y-2">
          {materias.map((m) => (
            <div key={m.id} className="border rounded p-3">
              <div className="font-semibold">{m.nombre}</div>
              <div className="text-sm text-slate-600">
                {m.nivel} • {m.activa ? "Activa" : "Inactiva"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
