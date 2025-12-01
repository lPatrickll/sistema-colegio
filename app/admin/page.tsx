import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Panel de administrador</h1>
      <p className="text-sm text-slate-600 mb-6">
        Elige una opción para gestionar usuarios del sistema.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Registrar profesor */}
        <Link
          href="/admin/teachers"
          className="border bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition block"
        >
          <h2 className="font-semibold mb-1">Registrar profesor</h2>
          <p className="text-sm text-slate-600">
            Crear cuentas nuevas para profesores del colegio.
          </p>
        </Link>

        {/* Registrar estudiante */}
        <Link
          href="/admin/student"
          className="border bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition block"
        >
          <h2 className="font-semibold mb-1">Registrar estudiante</h2>
          <p className="text-sm text-slate-600">
            Registrar estudiantes y generar sus cuentas de acceso.
          </p>
        </Link>

        {/* Lista de profesores */}
        <Link
          href="/admin/teachers/list"
          className="border bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition block"
        >
          <h2 className="font-semibold mb-1">Lista de profesores</h2>
          <p className="text-sm text-slate-600">
            Ver y administrar todos los profesores registrados.
          </p>
        </Link>

        {/* Lista de estudiantes */}
        <Link
          href="/admin/student/list"
          className="border bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition block"
        >
          <h2 className="font-semibold mb-1">Lista de estudiantes</h2>
          <p className="text-sm text-slate-600">
            Ver y administrar todos los estudiantes registrados.
          </p>
        </Link>
      </div>
    </div>
  );
}
