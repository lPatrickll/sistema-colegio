"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AsistenciaRepository } from "@/modules/asistencia/asistencia.repository";
import type { EstadoAsistencia, AsistenciaRegistro } from "@/modules/asistencia/asistencia.model";

type Est = { id: string; nombres: string; apellidos: string };

const ESTADOS: { value: EstadoAsistencia; label: string }[] = [
  { value: "PRESENTE", label: "Presente" },
  { value: "FALTA", label: "Falta" },
  { value: "RETRASO", label: "Retraso" },
  { value: "JUSTIFICADO", label: "Justificado" },
];

function hoyISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function AsistenciaCursoClient({
  gestionId,
  cursoId,
}: {
  gestionId: string;
  cursoId: string;
}) {
  const [fecha, setFecha] = useState(hoyISO());

  const [estudiantes, setEstudiantes] = useState<Est[]>([]);
  const [registros, setRegistros] = useState<Record<string, AsistenciaRegistro>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // cargar estudiantes + asistencia existente
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(false);

        // estudiantes del curso
        const estSnap = await getDocs(
          query(
            collection(db, "estudiantes"),
            where("gestionId", "==", gestionId),
            where("cursoId", "==", cursoId),
            orderBy("createdAt", "desc")
          )
        );

        const ests: Est[] = estSnap.docs.map((d) => {
          const data = d.data() as any;
          return { id: d.id, nombres: data.nombres, apellidos: data.apellidos };
        });

        setEstudiantes(ests);

        // asistencia existente del día
        const asistencia = await AsistenciaRepository.getOrNull(gestionId, cursoId, fecha);

        const base: Record<string, AsistenciaRegistro> = {};
        for (const e of ests) {
          base[e.id] = { estudianteId: e.id, estado: "PRESENTE" };
        }

        if (asistencia?.registros?.length) {
          for (const r of asistencia.registros) {
            base[r.estudianteId] = r;
          }
        }

        setRegistros(base);
      } catch {
        setError("No se pudo cargar estudiantes/asistencia");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [gestionId, cursoId, fecha]);

  const total = estudiantes.length;

  const conteo = useMemo(() => {
    const c = { PRESENTE: 0, FALTA: 0, RETRASO: 0, JUSTIFICADO: 0 } as Record<EstadoAsistencia, number>;
    for (const e of estudiantes) {
      const estado = registros[e.id]?.estado ?? "PRESENTE";
      c[estado]++;
    }
    return c;
  }, [estudiantes, registros]);

  const setEstado = (estudianteId: string, estado: EstadoAsistencia) => {
    setRegistros((prev) => ({
      ...prev,
      [estudianteId]: { ...prev[estudianteId], estudianteId, estado },
    }));
  };

  const setObs = (estudianteId: string, observacion: string) => {
    setRegistros((prev) => ({
      ...prev,
      [estudianteId]: { ...prev[estudianteId], estudianteId, observacion },
    }));
  };

  const guardar = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const registrosArr: AsistenciaRegistro[] = estudiantes.map((e) => {
        const r = registros[e.id] ?? { estudianteId: e.id, estado: "PRESENTE" as EstadoAsistencia };
        return {
          estudianteId: e.id,
          estado: r.estado,
          observacion: r.observacion?.trim() ? r.observacion.trim() : undefined,
        };
      });

      const now = new Date().toISOString();

      await AsistenciaRepository.upsert({
        gestionId,
        cursoId,
        fecha,
        registros: registrosArr,
        createdAt: now,
        updatedAt: now,
      });

      setSuccess(true);
    } catch {
      setError("No se pudo guardar la asistencia");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-slate-600">Cargando...</p>;

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-100 text-red-700 p-2 rounded">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-2 rounded">Asistencia guardada</div>}

      <div className="flex flex-col md:flex-row gap-3 md:items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Fecha</label>
          <input
            type="date"
            className="border rounded p-2"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>

        <div className="text-sm text-slate-700">
          Total: {total} • Presente: {conteo.PRESENTE} • Falta: {conteo.FALTA} • Retraso: {conteo.RETRASO} • Just:{" "}
          {conteo.JUSTIFICADO}
        </div>

        <button
          onClick={guardar}
          disabled={saving || total === 0}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar asistencia"}
        </button>
      </div>

      {total === 0 ? (
        <p className="text-slate-600">No hay estudiantes en este curso.</p>
      ) : (
        <div className="space-y-2">
          {estudiantes.map((e) => {
            const r = registros[e.id];
            return (
              <div key={e.id} className="border rounded p-3 space-y-2">
                <div className="font-semibold">
                  {e.nombres} {e.apellidos}
                </div>

                <div className="flex flex-col md:flex-row gap-2 md:items-center">
                  <select
                    className="border rounded p-2"
                    value={r?.estado ?? "PRESENTE"}
                    onChange={(ev) => setEstado(e.id, ev.target.value as EstadoAsistencia)}
                  >
                    {ESTADOS.map((x) => (
                      <option key={x.value} value={x.value}>
                        {x.label}
                      </option>
                    ))}
                  </select>

                  <input
                    className="border rounded p-2 flex-1"
                    placeholder="Observación (opcional)"
                    value={r?.observacion ?? ""}
                    onChange={(ev) => setObs(e.id, ev.target.value)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
