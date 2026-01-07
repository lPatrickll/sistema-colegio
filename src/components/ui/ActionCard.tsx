export default function ActionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
      <div>
        <h2 className="text-base font-semibold text-slate-100">{title}</h2>
        <p className="text-sm text-slate-400">{description}</p>
      </div>

      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}
