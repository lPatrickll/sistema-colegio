import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2 text-slate-900">
          Panel de administrador
        </h1>
        <p className="text-sm text-slate-600">
          Elige una opción para gestionar el sistema del colegio.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/teachers"
          className="border bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition block"
        >
          <h2 className="font-semibold mb-1 text-slate-900">Registrar profesor</h2>
          <p className="text-sm text-slate-600">
            Crear cuentas nuevas para profesores del colegio.
          </p>
        </Link>

        <Link
          href="/admin/student"
          className="border bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition block"
        >
          <h2 className="font-semibold mb-1 text-slate-900">Registrar estudiante</h2>
          <p className="text-sm text-slate-600">
            Registrar nuevos estudiantes y sus datos personales.
          </p>
        </Link>

        <Link
          href="/admin/gestion"
          className="border bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition block"
        >
          <h2 className="font-semibold mb-1 text-slate-900">
            Gestión académica (año)
          </h2>
          <p className="text-sm text-slate-600">
            Crear gestiones, configurar cursos, materias, docentes y horarios.
          </p>
        </Link>

        <Link
          href="/admin/inscriptions"
          className="border bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition block"
        >
          <h2 className="font-semibold mb-1 text-slate-900">
            Inscripciones de estudiantes
          </h2>
          <p className="text-sm text-slate-600">
            Asignar estudiantes a cursos dentro de una gestión.
          </p>
        </Link>
      </div>
    </div>
  );
}
