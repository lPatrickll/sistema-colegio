"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { CreateCourseUseCase } from "@/components/Course/application/createCourse.usecase";
import { useAuth } from "@/components/Auth/AuthContext";

const createCourseUseCase = new CreateCourseUseCase();

export default function CreateCoursePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [nombre, setNombre] = useState("");
  const [paralelo, setParalelo] = useState("");

  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [selectedStudents, setSelectedStudents] = useState<any[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<any[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadAll() {
        const usersSnap = await getDocs(collection(db, "users"));
        const studentsList: any[] = [];

        usersSnap.forEach(doc => {
        const d = doc.data();
        if (d.role === "student") {
            studentsList.push({ uid: doc.id, name: d.name, ci: d.ci });
        }
        });

        const teachersSnap = await getDocs(collection(db, "teachers"));
        const teachersList: any[] = [];

        teachersSnap.forEach(doc => {
        const d = doc.data() as {
            uid: string;
            nombreCompleto: string;
            materiaId: string;
            materiaNombre: string;
            materiaSigla: string;
        };

        teachersList.push({
            uid: d.uid,
            name: d.nombreCompleto,
            materiaId: d.materiaId,
            materiaNombre: d.materiaNombre,
            materiaSigla: d.materiaSigla,
        });
        });

        const subjectSnap = await getDocs(collection(db, "subjects"));
        const subjectsList: any[] = [];
        subjectSnap.forEach(doc => {
        subjectsList.push({ id: doc.id, ...doc.data() });
        });

        setTeachers(teachersList);
        setStudents(studentsList);
        setSubjects(subjectsList);
    }

    loadAll();
  }, []);


  useEffect(() => {
    if (loading) return;
    if (!user) router.push("/login");
    if (user?.role !== "admin") router.push("/");
  }, [user, loading, router]);

  const toggleStudent = (std: any) => {
    if (selectedStudents.some(s => s.uid === std.uid)) {
      setSelectedStudents(prev => prev.filter(s => s.uid !== std.uid));
    } else {
      setSelectedStudents(prev => [...prev, std]);
    }
  };

  const addSubjectToCourse = (subject: any, teacher: any) => {
    setSelectedSubjects(prev => [
      ...prev,
      {
        subjectId: subject.id,
        subjectName: subject.nombre,
        subjectSigla: subject.sigla,
        teacherUid: teacher.uid,
        teacherName: teacher.name,
      }
    ]);
  };

  const handleCreate = async (e: any) => {
    e.preventDefault();

    setError(null);
    setSuccess(null);

    try {
      await createCourseUseCase.execute(user!.uid, {
        nombre,
        paralelo,
        materias: selectedSubjects,
        estudiantes: selectedStudents.map(s => ({
          studentUid: s.uid,
          studentName: s.name,
          studentCi: s.ci ?? "",
        })),
        createdBy: user!.uid,
      });

      setSuccess("Curso creado correctamente.");
      setNombre("");
      setParalelo("");
      setSelectedStudents([]);
      setSelectedSubjects([]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4 text-slate-900">Crear curso</h1>

      <form onSubmit={handleCreate} className="space-y-4 max-w-3xl">
        {/* nombre y paralelo */}
        <div>
          <label className="text-slate-900">Nombre del curso</label>
          <input
            className="border rounded p-2 w-full border-slate-900"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
          />
        </div>

        <div>
          <label className="text-slate-900">Paralelo</label>
          <input
            className="border rounded p-2 w-full border-slate-900"
            value={paralelo}
            onChange={e => setParalelo(e.target.value)}
          />
        </div>

        {/* asignar materias + profesores */}
        <h2 className="font-semibold mt-6 text-slate-900">Asignar materias al curso</h2>

        {subjects.map(subj => {
          const prof = teachers.find(t => t.materiaId === subj.id);

          const isSelected = selectedSubjects.some(
            s => s.subjectId === subj.id
          );

          return (
            <div
              key={subj.id}
              onClick={() => {
                if (!prof) {
                  setError(`La materia ${subj.nombre} no tiene profesor asignado`);
                  return;
                }

                setError(null); // opcional: limpiar error

                setSelectedSubjects(prev => {
                  const alreadySelected = prev.some(
                    s => s.subjectId === subj.id
                  );

                  if (alreadySelected) {
                    // quitar la materia
                    return prev.filter(s => s.subjectId !== subj.id);
                  }

                  // agregar la materia
                  return [
                    ...prev,
                    {
                      subjectId: subj.id,
                      subjectName: subj.nombre,
                      subjectSigla: subj.sigla,
                      teacherUid: prof.uid,
                      teacherName: prof.name,
                    },
                  ];
                });
              }}
              className={`p-3 border rounded cursor-pointer mb-2 text-slate-900 ${
                isSelected ? "bg-green-100" : "hover:bg-slate-100"
              }`}
            >
              <div className="font-semibold">
                {subj.sigla} - {subj.nombre}
              </div>
              <div className="text-sm text-slate-600">
                Profesor: {prof ? prof.name : "❌ Ninguno asignado"}
              </div>
            </div>
          );
        })}

        {/* seleccionar estudiantes */}
        <h2 className="font-semibold mt-6 text-slate-900">Agregar estudiantes al curso</h2>

        {students.map(std => (
          <div
            key={std.uid}
            onClick={() => toggleStudent(std)}
            className={`p-2 border cursor-pointer rounded text-slate-900 ${
              selectedStudents.some(s => s.uid === std.uid)
                ? "bg-green-100"
                : ""
            }`}
          >
            {std.name}
          </div>
        ))}

        {error && <p className="text-red-600">{error}</p>}
        {success && <p className="text-green-600">{success}</p>}

        <button className="bg-green-600 text-white px-4 py-2 rounded">
          Crear curso
        </button>
      </form>
    </div>
  );
}
