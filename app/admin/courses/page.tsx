// app/admin/courses/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreateCourseUseCase } from "@/components/Course/application/createCourse.usecase";
import { useAuth } from "@/components/Auth/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

const createCourseUseCase = new CreateCourseUseCase();

type Course = {
  id: string;
  nombre: string;
  paralelo: string;
  gestionId: string;
  turno?: string | null;
  cuposMaximos?: number | null;
};

export default function CreateCoursePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [nombre, setNombre] = useState("");
  const [paralelo, setParalelo] = useState("");
  const [gestionId, setGestionId] = useState("2025");
  const [turno, setTurno] = useState("");
  const [cuposMaximos, setCuposMaximos] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // estado para controlar qué gestiones están abiertas/cerradas
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const roles = user?.roles ?? [];
  const isAdmin = roles.some((r: string) => r.toUpperCase() === "ADMIN");

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (!isAdmin) {
      router.push("/");
      return;
    }
  }, [user, loading, isAdmin, router]);

  // Cargar cursos existentes
  useEffect(() => {
    async function loadCourses() {
      try {
        setLoadingCourses(true);
        const snap = await getDocs(collection(db, "courses"));
        const list: Course[] = [];
        snap.forEach(doc => {
          const d = doc.data() as {
            nombre: string;
            paralelo: string;
            gestionId: string;
            turno?: string | null;
            cuposMaximos?: number | null;
          };
          list.push({
            id: doc.id,
            nombre: d.nombre,
            paralelo: d.paralelo,
            gestionId: d.gestionId,
            turno: d.turno ?? null,
            cuposMaximos: d.cuposMaximos ?? null,
          });
        });
        setCourses(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCourses(false);
      }
    }

    if (user && isAdmin) {
      loadCourses();
    }
  }, [user, isAdmin]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      await createCourseUseCase.execute(user.uid, {
        nombre,
        paralelo,
        gestionId,
        turno: turno || undefined,
        cuposMaximos: cuposMaximos ? Number(cuposMaximos) : undefined,
        createdBy: user.uid,
      });

      // mensaje
      setSuccess("Curso creado correctamente.");
      setNombre("");
      setParalelo("");
      setTurno("");
      setCuposMaximos("");

      // añadir a la lista local y ordenar
      setCourses(prev => {
        const updated: Course[] = [
          ...prev,
          {
            id: crypto.randomUUID(),
            nombre,
            paralelo,
            gestionId,
            turno: turno || null,
            cuposMaximos: cuposMaximos ? Number(cuposMaximos) : null,
          },
        ];
        return updated;
      });

      // asegurarnos de que la gestión del curso recién creado esté desplegada
      setExpanded(prev => ({ ...prev, [gestionId]: true }));
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Error al crear el curso");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return <p className="p-4">Verificando sesión...</p>;
  }

  if (!isAdmin) {
    return <p className="p-4">No autorizado.</p>;
  }

  // ---------- Agrupar y ordenar cursos por gestión ----------

  // agrupar por gestionId
  const coursesByGestion: Record<string, Course[]> = {};
  for (const c of courses) {
    if (!coursesByGestion[c.gestionId]) {
      coursesByGestion[c.gestionId] = [];
    }
    coursesByGestion[c.gestionId].push(c);
  }

  // ordenar gestiones (numérico si se puede, si no, por string)
  const gestionesOrdenadas = Object.keys(coursesByGestion).sort((a, b) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);

    const aIsNum = !isNaN(na);
    const bIsNum = !isNaN(nb);

    if (aIsNum && bIsNum) return na - nb;
    if (aIsNum && !bIsNum) return -1;
    if (!aIsNum && bIsNum) return 1;
    return a.localeCompare(b);
  });

  // función para ordenar cursos dentro de cada gestión
  const sortCourses = (list: Course[]) =>
    [...list].sort((a, b) => {
      const nameComp = a.nombre.localeCompare(b.nombre);
      if (nameComp !== 0) return nameComp;
      return a.paralelo.localeCompare(b.paralelo);
    });

  const toggleGestion = (gid: string) => {
    setExpanded(prev => ({ ...prev, [gid]: !prev[gid] }));
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4 text-slate-900">Crear curso</h1>

      {/* FORMULARIO */}
      <form
        onSubmit={handleCreate}
        className="space-y-4 max-w-xl bg-white border rounded p-6 border-slate-200 mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block text-slate-900">
            <span className="text-sm">Gestión</span>
            <input
              value={gestionId}
              onChange={e => setGestionId(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="Ej: 2025"
              required
            />
          </label>

          <label className="block text-slate-900">
            <span className="text-sm">Paralelo</span>
            <input
              value={paralelo}
              onChange={e => setParalelo(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="Ej: A"
              required
            />
          </label>
        </div>

        <label className="block text-slate-900">
          <span className="text-sm">Nombre del curso</span>
          <input
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Ej: 1ro de secundaria"
            required
          />
        </label>

        <label className="block text-slate-900">
          <span className="text-sm">Turno (opcional)</span>
          <select
            value={turno}
            onChange={e => setTurno(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="">Sin turno</option>
            <option value="Mañana">Mañana</option>
            <option value="Tarde">Tarde</option>
            <option value="Noche">Noche</option>
          </select>
        </label>

        <label className="block text-slate-900">
          <span className="text-sm">Cupos máximos (opcional)</span>
          <input
            type="number"
            min={0}
            value={cuposMaximos}
            onChange={e => setCuposMaximos(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Ej: 30"
          />
        </label>

        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        {success && <p className="text-green-600 text-sm mt-2">{success}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-green-600 text-white px-4 py-2 rounded mt-4"
        >
          {submitting ? "Creando curso..." : "Crear curso"}
        </button>
      </form>

      {/* LISTA AGRUPADA POR GESTIÓN */}
      <h2 className="text-xl font-semibold mb-2 text-slate-900">
        Cursos registrados
      </h2>

      {loadingCourses ? (
        <p className="text-sm text-slate-600">Cargando cursos...</p>
      ) : gestionesOrdenadas.length === 0 ? (
        <p className="text-sm text-slate-600">No hay cursos registrados aún.</p>
      ) : (
        <div className="space-y-3 max-w-xl">
          {gestionesOrdenadas.map(gid => {
            const cursosOrdenados = sortCourses(coursesByGestion[gid]);
            const isOpen = expanded[gid] ?? true; // por defecto abiertos

            return (
              <div key={gid} className="border rounded bg-white">
                {/* Header de gestión, clickable */}
                <button
                  type="button"
                  onClick={() => toggleGestion(gid)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                >
                  <span>Gestión {gid}</span>
                  <span className="text-xs text-slate-600">
                    {cursosOrdenados.length} curso
                    {cursosOrdenados.length !== 1 && "s"}{" "}
                    {isOpen ? "▲" : "▼"}
                  </span>
                </button>

                {/* Lista de cursos de esa gestión */}
                {isOpen && (
                  <div className="border-t border-slate-200 p-2 space-y-2">
                    {cursosOrdenados.map(c => (
                      <div
                        key={c.id}
                        className="border rounded px-3 py-2 text-sm text-slate-900 flex flex-col md:flex-row md:items-center md:justify-between gap-1"
                      >
                        <div>
                          <div className="font-semibold">
                            {c.nombre} — {c.paralelo}
                          </div>
                          <div className="text-xs text-slate-600">
                            {c.turno ? `Turno: ${c.turno}` : "Sin turno"}
                          </div>
                        </div>
                        {typeof c.cuposMaximos === "number" && (
                          <div className="text-xs text-slate-600">
                            Cupos máx: {c.cuposMaximos}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
