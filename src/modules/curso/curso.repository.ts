// src/modules/curso/curso.repository.ts
export const CursoRepository = {
  async create(input: { gestionId: string; nombre: string; nivel: string }) {
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.error ?? "Error creando curso");
    }

    return data;
  },

  async listByGestion(gestionId: string) {
    const res = await fetch(`/api/courses?gestionId=${encodeURIComponent(gestionId)}`, {
      method: "GET",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.error ?? "Error listando cursos");
    }

    return data.courses as any[];
  },
};
