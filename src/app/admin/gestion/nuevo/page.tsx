// src/app/admin/gestion/nuevo/page.tsx
import GestionForm from "./ui/GestionForm";
import BackButtonGeneric from "@/components/ui/BackButtonGeneric";

export const runtime = "nodejs";

export default function NuevaGestionPage() {
  return (
    <div className="p-6 space-y-4 text-slate-100">
      <BackButtonGeneric fallbackHref="/admin/gestion" />

      <h1 className="text-2xl font-bold text-slate-100">Nueva gestión</h1>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <GestionForm />
      </div>
    </div>
  );
}
