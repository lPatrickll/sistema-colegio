// src/app/teacher/page.tsx
import Link from "next/link";

export default function TeacherHomePage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2 text-slate-900">
          Panel del profesor
        </h1>
        <p className="text-sm text-slate-600">
          Accede a tus cursos, registra asistencia y gestiona tus clases.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/teacher/attendance"
          className="border bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition block"
        >
          <h2 className="font-semibold mb-1 text-slate-900">
            Tomar asistencia
          </h2>
          <p className="text-sm text-slate-600">
            Ver tus grupos de clase y registrar la asistencia de los estudiantes.
          </p>
        </Link>

        {/* Aquí luego puedes agregar más opciones (notas, etc.) */}
      </div>
    </div>
  );
}
