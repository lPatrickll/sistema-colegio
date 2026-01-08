"use client";

import { useMemo, useState } from "react";

export type CursoOption = { id: string; title: string };

export type EstudianteRow = {
  id: string;
  studentId: string;
  courseId: string;
  courseTitle: string;
  nombreCompleto: string;
  nombreCompletoLower: string;
  ci: string;
  codigo: string;
  colegioProcedencia: string;
  fechaNacimientoISO: string;
  estado: "ACTIVO" | "INACTIVO";
  documentosEntregados: {
    fotocopiaCarnet: boolean;
    certificadoNacimiento: boolean;
    boletinAnioPasado: boolean;
  };
  esDeudor: boolean;
};

type SortOrder = "AZ" | "ZA";
type Tri = "ALL" | "YES" | "NO";
type DocsStatus = "ALL" | "COMPLETOS" | "INCOMPLETOS";

type ColumnKey =
  | "nombre"
  | "curso"
  | "ci"
  | "codigo"
  | "colegio"
  | "deudor"
  | "estado"
  | "edad"
  | "fechaNacimiento"
  | "docs";

type Column = {
  key: ColumnKey;
  label: string;
  value: (r: EstudianteRow) => string;
};

function calcAge(iso: string): number | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  if (!Number.isFinite(d.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
  return age;
}

const COLUMNS: Column[] = [
  { key: "nombre", label: "Nombre", value: (r) => r.nombreCompleto || "—" },
  { key: "curso", label: "Curso", value: (r) => r.courseTitle || "—" },
  { key: "ci", label: "CI", value: (r) => r.ci || "—" },
  { key: "codigo", label: "Código", value: (r) => r.codigo || "—" },
  { key: "colegio", label: "Colegio procedencia", value: (r) => r.colegioProcedencia || "—" },
  { key: "deudor", label: "Deudor", value: (r) => (r.esDeudor ? "Sí" : "No") },
  { key: "estado", label: "Estado", value: (r) => r.estado },
  { key: "edad", label: "Edad", value: (r) => String(calcAge(r.fechaNacimientoISO) ?? "—") },
  { key: "fechaNacimiento", label: "F. Nacimiento", value: (r) => r.fechaNacimientoISO || "—" },
  {
    key: "docs",
    label: "Documentos",
    value: (r) => {
      const d = r.documentosEntregados;
      const ok = [d.fotocopiaCarnet, d.certificadoNacimiento, d.boletinAnioPasado].filter(Boolean)
        .length;
      return `${ok}/3`;
    },
  },
];

function norm(str: string) {
  return String(str ?? "").trim().toLowerCase();
}

function docsCompletos(d: EstudianteRow["documentosEntregados"]) {
  return Boolean(d.fotocopiaCarnet && d.certificadoNacimiento && d.boletinAnioPasado);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function EstudiantesGestionClient({
  gestionId,
  gestionTitle,
  courses,
  rows,
}: {
  gestionId: string;
  gestionTitle: string;
  courses: CursoOption[];
  rows: EstudianteRow[];
}) {
  const [q, setQ] = useState("");
  const [courseId, setCourseId] = useState<string>("ALL");
  const [deudor, setDeudor] = useState<Tri>("ALL");
  const [estado, setEstado] = useState<Tri>("ALL");
  const [docsStatus, setDocsStatus] = useState<DocsStatus>("ALL");

  const [fromBirth, setFromBirth] = useState<string>("");
  const [toBirth, setToBirth] = useState<string>("");
  const [colegio, setColegio] = useState<string>("");

  const [reqFotocopia, setReqFotocopia] = useState(false);
  const [reqCert, setReqCert] = useState(false);
  const [reqBoletin, setReqBoletin] = useState(false);

  const [sortOrder, setSortOrder] = useState<SortOrder>("AZ");

  const [selectedCols, setSelectedCols] = useState<ColumnKey[]>([
    "nombre",
    "curso",
    "ci",
    "colegio",
    "deudor",
    "estado",
    "edad",
  ]);

  const selectedColumns = useMemo(() => {
    const set = new Set(selectedCols);
    return COLUMNS.filter((c) => set.has(c.key));
  }, [selectedCols]);

  const filtered = useMemo(() => {
    const needle = norm(q);
    const colegioNeedle = norm(colegio);

    const inBirthRange = (r: EstudianteRow) => {
      if (!fromBirth && !toBirth) return true;
      if (!r.fechaNacimientoISO) return false;
      if (fromBirth && r.fechaNacimientoISO < fromBirth) return false;
      if (toBirth && r.fechaNacimientoISO > toBirth) return false;
      return true;
    };

    const meetsDocsReq = (r: EstudianteRow) => {
      const d = r.documentosEntregados;
      if (reqFotocopia && !d.fotocopiaCarnet) return false;
      if (reqCert && !d.certificadoNacimiento) return false;
      if (reqBoletin && !d.boletinAnioPasado) return false;
      return true;
    };

    return rows
      .filter((r) => {
        if (needle) {
          const matchesName = r.nombreCompletoLower.includes(needle);
          const matchesCi = r.ci.toLowerCase().includes(needle);
          if (!matchesName && !matchesCi) return false;
        }

        if (courseId !== "ALL" && r.courseId !== courseId) return false;

        if (deudor !== "ALL") {
          if (deudor === "YES" && !r.esDeudor) return false;
          if (deudor === "NO" && r.esDeudor) return false;
        }

        if (estado !== "ALL") {
          if (estado === "YES" && r.estado !== "ACTIVO") return false;
          if (estado === "NO" && r.estado !== "INACTIVO") return false;
        }

        if (!inBirthRange(r)) return false;

        if (docsStatus !== "ALL") {
          const completos = docsCompletos(r.documentosEntregados);
          if (docsStatus === "COMPLETOS" && !completos) return false;
          if (docsStatus === "INCOMPLETOS" && completos) return false;
        }

        if (!meetsDocsReq(r)) return false;

        if (colegioNeedle) {
          if (!norm(r.colegioProcedencia).includes(colegioNeedle)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const cmp = (a.nombreCompletoLower || "").localeCompare(
          b.nombreCompletoLower || "",
          "es"
        );
        return sortOrder === "AZ" ? cmp : -cmp;
      });
  }, [
    rows,
    q,
    courseId,
    deudor,
    estado,
    fromBirth,
    toBirth,
    docsStatus,
    reqFotocopia,
    reqCert,
    reqBoletin,
    colegio,
    sortOrder,
  ]);

  const toggleCol = (key: ColumnKey) => {
    setSelectedCols((prev) => {
      const set = new Set(prev);
      if (set.has(key)) set.delete(key);
      else set.add(key);
      const next = Array.from(set);
      return next.length ? next : prev;
    });
  };

  const resetFilters = () => {
    setQ("");
    setCourseId("ALL");
    setDeudor("ALL");
    setEstado("ALL");
    setDocsStatus("ALL");
    setFromBirth("");
    setToBirth("");
    setColegio("");
    setReqFotocopia(false);
    setReqCert(false);
    setReqBoletin(false);
    setSortOrder("AZ");
  };

  const exportExcel = async () => {
    const cols = selectedColumns;
    const { utils, write } = await import("xlsx");

    const data = filtered.map((r) => {
      const o: Record<string, string> = {};
      for (const c of cols) o[c.label] = c.value(r);
      return o;
    });

    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Estudiantes");

    const buf = write(wb, { type: "array", bookType: "xlsx" });
    downloadBlob(
      new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `estudiantes_${gestionId}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const exportPDF = async () => {
    const cols = selectedColumns;
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(12);
    doc.text(`Estudiantes — ${gestionTitle}`, 40, 40);
    doc.setFontSize(9);
    doc.text(`Total: ${filtered.length}`, 40, 60);

    autoTable(doc, {
      head: [cols.map((c) => c.label)],
      body: filtered.map((r) => cols.map((c) => c.value(r))),
      startY: 80,
      styles: { fontSize: 8, cellPadding: 4 },
    });

    doc.save(`estudiantes_${gestionId}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-100">Estudiantes — {gestionTitle}</h1>
        <p className="text-sm text-slate-400">
          Usa buscador + filtros combinables. Orden por defecto alfabético.
        </p>
      </header>

      {/* FILTROS */}
      <section className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-200">
              Buscador (Nombre o CI)
            </label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ej: Juan, 1234567"
              className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-200">Curso</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
            >
              <option value="ALL">Todos</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-200">Deudor</label>
            <select
              value={deudor}
              onChange={(e) => setDeudor(e.target.value as Tri)}
              className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
            >
              <option value="ALL">Todos</option>
              <option value="YES">Solo deudores</option>
              <option value="NO">No deudores</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Nota: tu schema actual no guarda deuda; esto funcionará cuando agregues{" "}
              <code className="px-1">esDeudor</code> o <code className="px-1">saldoPendiente</code>{" "}
              en students.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-200">Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as Tri)}
              className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
            >
              <option value="ALL">Todos</option>
              <option value="YES">Activos</option>
              <option value="NO">Inactivos</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-200">Orden</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
            >
              <option value="AZ">A → Z</option>
              <option value="ZA">Z → A</option>
            </select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-200">
              F. Nacimiento (desde)
            </label>
            <input
              type="date"
              value={fromBirth}
              onChange={(e) => setFromBirth(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-200">
              F. Nacimiento (hasta)
            </label>
            <input
              type="date"
              value={toBirth}
              onChange={(e) => setToBirth(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1 text-slate-200">
              Colegio de procedencia
            </label>
            <input
              value={colegio}
              onChange={(e) => setColegio(e.target.value)}
              placeholder="Ej: U.E. ..."
              className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-200">Documentos</label>
            <select
              value={docsStatus}
              onChange={(e) => setDocsStatus(e.target.value as DocsStatus)}
              className="bg-slate-950 border border-slate-700 rounded p-2 w-full text-slate-100"
            >
              <option value="ALL">Todos</option>
              <option value="COMPLETOS">Completos (3/3)</option>
              <option value="INCOMPLETOS">Incompletos</option>
            </select>

            <div className="mt-2 grid gap-2 md:grid-cols-3">
              <label className="flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={reqFotocopia}
                  onChange={(e) => setReqFotocopia(e.target.checked)}
                />
                Fotocopia CI
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={reqCert}
                  onChange={(e) => setReqCert(e.target.checked)}
                />
                Cert. nacimiento
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={reqBoletin}
                  onChange={(e) => setReqBoletin(e.target.checked)}
                />
                Boletín año pasado
              </label>
            </div>
          </div>

          <div className="flex items-end justify-end gap-2">
            <button
              type="button"
              onClick={resetFilters}
              className="px-3 py-2 rounded border border-slate-700 text-slate-200 hover:bg-slate-800"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </section>

      {/* COLUMNAS + EXPORT */}
      <section className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-300">
            Mostrando <span className="font-semibold text-slate-100">{filtered.length}</span> de{" "}
            {rows.length} estudiantes
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportPDF}
              disabled={filtered.length === 0 || selectedColumns.length === 0}
              className="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 px-3 py-2 rounded disabled:opacity-50"
            >
              Descargar PDF
            </button>
            <button
              type="button"
              onClick={exportExcel}
              disabled={filtered.length === 0 || selectedColumns.length === 0}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded disabled:opacity-50"
            >
              Descargar Excel
            </button>
          </div>
        </div>

        <div className="text-sm font-semibold text-slate-100">Columnas (tabla + descarga)</div>
        <div className="flex flex-wrap gap-3">
          {COLUMNS.map((c) => (
            <label key={c.key} className="flex items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={selectedCols.includes(c.key)}
                onChange={() => toggleCol(c.key)}
              />
              {c.label}
            </label>
          ))}
        </div>

        {/* TABLA */}
        <div className="overflow-auto border border-slate-800 rounded-lg">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-slate-950">
              <tr>
                {selectedColumns.map((c) => (
                  <th
                    key={c.key}
                    className="text-left px-3 py-2 text-slate-200 border-b border-slate-800"
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={Math.max(selectedColumns.length, 1)}
                    className="px-3 py-6 text-center text-slate-400"
                  >
                    No hay resultados con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="odd:bg-slate-900 even:bg-slate-900/60">
                    {selectedColumns.map((c) => (
                      <td
                        key={c.key}
                        className="px-3 py-2 border-b border-slate-800 text-slate-100"
                      >
                        {c.value(r)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
