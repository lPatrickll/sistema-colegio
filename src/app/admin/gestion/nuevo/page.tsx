import GestionForm from "./ui/GestionForm";

export const runtime = "nodejs";

export default function NuevaGestionPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Nueva gestión</h1>
      <GestionForm />
    </div>
  );
}
