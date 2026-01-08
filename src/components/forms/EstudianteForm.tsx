// src/components/forms/EstudianteForm.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { generateStudentCode } from "@/lib/studentCode";

interface Props {
  gestionId: string;
  cursoId: string;
  onCreated?: () => void;
}

type Docs = {
  fotocopiaCarnet: boolean;
  certificadoNacimiento: boolean;
  boletinAnioPasado: boolean;
};

export default function EstudianteForm({ gestionId, cursoId, onCreated }: Props) {
  const [nombres, setNombres] = useState("");
  const [primerApellido, setPrimerApellido] = useState("");
  const [segundoApellido, setSegundoApellido] = useState("");
  const [ci, setCi] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");

  const [docs, setDocs] = useState<Docs>({
    fotocopiaCarnet: false,
    certificadoNacimiento: false,
    boletinAnioPasado: false,
  });

  const [telefonosTutor, setTelefonosTutor] = useState<string[]>([""]);
  const [telefonoEstudiante, setTelefonoEstudiante] = useState("");

  const [direccion, setDireccion] = useState("");
  const [colegioProcedencia, setColegioProcedencia] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [activo, setActivo] = useState(true);

  const [ciStatus, setCiStatus] = useState<"idle" | "checking" | "ok" | "taken" | "error">(
    "idle"
  );

  const { codigo, anioNacimiento } = useMemo(() => {
    return generateStudentCode({
      nombres,
      primerApellido,
      fechaNacimientoISO: fechaNacimiento,
    });
  }, [nombres, primerApellido, fechaNacimiento]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setCiStatus("idle");
  }, [ci]);

  const addTelefonoTutor = () => setTelefonosTutor((prev) => [...prev, ""]);

  const removeTelefonoTutor = (idx: number) =>
    setTelefonosTutor((prev) => prev.filter((_, i) => i !== idx));

  const updateTelefonoTutor = (idx: number, value: string) =>
    setTelefonosTutor((prev) => prev.map((v, i) => (i === idx ? value : v)));

  const validateCiUniq = async () => {
    const v = ci.trim();
    if (!v) return;

    try {
      setCiStatus("checking");
      const res = await fetch(`/api/students/check-ci?ci=${encodeURIComponent(v)}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo validar el CI");
      setCiStatus(data?.available ? "ok" : "taken");
    } catch {
      setCiStatus("error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!nombres.trim()) return setError("Nombres es obligatorio");
    if (!primerApellido.trim()) return setError("Primer apellido es obligatorio");
    if (!ci.trim()) return setError("CI es obligatorio");
    if (!fechaNacimiento) return setError("Fecha de nacimiento es obligatorio");
    if (!codigo) return setError("No se pudo generar el código (revisa nombres, apellido y fecha)");
    if (!direccion.trim()) return setError("Dirección de vivienda es obligatorio");

    const phones = telefonosTutor.map((t) => t.trim()).filter(Boolean);
    if (phones.length === 0) return setError("Debes registrar al menos un celular del tutor");

    try {
      setLoading(true);

      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gestionId,
          courseId: cursoId,
          nombres: nombres.trim(),
          primerApellido: primerApellido.trim(),
          segundoApellido: segundoApellido.trim() || undefined,
          ci: ci.trim(),
          fechaNacimiento,
          documentosEntregados: docs,
          telefonosTutor: phones,
          telefonoEstudiante: telefonoEstudiante.trim() || undefined,
          direccion: direccion.trim(),
          colegioProcedencia: colegioProcedencia.trim() || undefined,
          observaciones: observaciones.trim() || undefined,
          activo,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Error al guardar el estudiante");

      setSuccess(true);
      setNombres("");
      setPrimerApellido("");
      setSegundoApellido("");
      setCi("");
      setFechaNacimiento("");
      setDocs({ fotocopiaCarnet: false, certificadoNacimiento: false, boletinAnioPasado: false });
      setTelefonosTutor([""]);
      setTelefonoEstudiante("");
      setDireccion("");
      setColegioProcedencia("");
      setObservaciones("");
      setActivo(true);
      setCiStatus("idle");
      onCreated?.();
    } catch (e: any) {
      setError(e?.message ?? "Error al guardar el estudiante");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-950/40 border border-red-900 text-red-200 p-2 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-950/40 border border-emerald-900 text-emerald-200 p-2 rounded">
          Estudiante creado correctamente
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-200">Nombres</label>
          <input
            className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
            value={nombres}
            onChange={(e) => setNombres(e.target.value)}
            placeholder="Ej: Ana María"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-200">CI</label>
          <input
            className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
            value={ci}
            onChange={(e) => setCi(e.target.value)}
            onBlur={validateCiUniq}
            placeholder="Ej: 12345678"
          />
          <div className="mt-1 text-xs">
            {ciStatus === "checking" && <span className="text-slate-400">Validando…</span>}
            {ciStatus === "ok" && <span className="text-emerald-300">CI disponible ✅</span>}
            {ciStatus === "taken" && <span className="text-red-300">CI ya existe ❌</span>}
            {ciStatus === "error" && (
              <span className="text-amber-300">
                No se pudo validar el CI (igual se validará al guardar)
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-200">Primer apellido</label>
          <input
            className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
            value={primerApellido}
            onChange={(e) => setPrimerApellido(e.target.value)}
            placeholder="Ej: Gómez"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-200">
            Segundo apellido <span className="text-slate-500">(opcional)</span>
          </label>
          <input
            className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
            value={segundoApellido}
            onChange={(e) => setSegundoApellido(e.target.value)}
            placeholder="Ej: Rojas"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-200">Fecha de nacimiento</label>
          <input
            type="date"
            className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-200">Código (auto)</label>
          <input
            className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100 opacity-80"
            value={codigo || "—"}
            readOnly
          />
          <p className="mt-1 text-xs text-slate-500">
            {anioNacimiento ? `Año nacimiento: ${anioNacimiento}` : ""}
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-slate-100">Documentos entregados</h3>

        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={docs.fotocopiaCarnet}
            onChange={(e) => setDocs((p) => ({ ...p, fotocopiaCarnet: e.target.checked }))}
          />
          Fotocopia de carnet
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={docs.certificadoNacimiento}
            onChange={(e) => setDocs((p) => ({ ...p, certificadoNacimiento: e.target.checked }))}
          />
          Certificado de nacimiento
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={docs.boletinAnioPasado}
            onChange={(e) => setDocs((p) => ({ ...p, boletinAnioPasado: e.target.checked }))}
          />
          Boletín del año pasado
        </label>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-slate-100">Contactos</h3>

        <div className="space-y-2">
          <div className="text-sm text-slate-300">
            Celular del tutor (padre/madre) — puedes agregar más
          </div>

          {telefonosTutor.map((t, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
                value={t}
                onChange={(e) => updateTelefonoTutor(idx, e.target.value)}
                placeholder="Ej: 7XXXXXXX"
              />
              {telefonosTutor.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTelefonoTutor(idx)}
                  className="px-3 py-2 rounded border border-slate-700 text-slate-200 hover:bg-slate-800"
                  title="Quitar"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addTelefonoTutor}
            className="px-3 py-2 rounded border border-slate-700 text-slate-200 hover:bg-slate-800 text-sm"
          >
            + Agregar otro número
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-200">
            Celular del estudiante <span className="text-slate-500">(opcional)</span>
          </label>
          <input
            className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
            value={telefonoEstudiante}
            onChange={(e) => setTelefonoEstudiante(e.target.value)}
            placeholder="Ej: 7XXXXXXX"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-200">Dirección de vivienda</label>
          <input
            className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Ej: Av. ... #..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-200">
            Colegio de procedencia <span className="text-slate-500">(opcional)</span>
          </label>
          <input
            className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
            value={colegioProcedencia}
            onChange={(e) => setColegioProcedencia(e.target.value)}
            placeholder="Ej: U.E. ..."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-slate-200">Observaciones</label>
        <textarea
          className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100 min-h-24"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Notas adicionales..."
        />
      </div>

      <div className="flex items-center gap-2">
        <input id="activo" type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
        <label htmlFor="activo" className="text-sm text-slate-200">
          Activo
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading || ciStatus === "checking"}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar estudiante"}
        </button>

        <p className="text-xs text-slate-500">
          Gestión: {gestionId} • Curso: {cursoId}
        </p>
      </div>
    </form>
  );
}
