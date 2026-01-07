import Link from "next/link";

type Variant = "primary" | "secondary";

export default function ButtonLink({
  href,
  children,
  variant = "secondary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
}) {
  const base =
    "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition " +
    "focus:outline-none focus:ring-2 focus:ring-slate-600";

  const styles =
    variant === "primary"
      ? "bg-blue-600 hover:bg-blue-500 text-white"
      : "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700";

  return (
    <Link href={href} className={`${base} ${styles}`}>
      {children}
    </Link>
  );
}
