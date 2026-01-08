// src/lib/studentCode.ts
function stripAccents(input: string) {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^A-Za-z\s]/g, "")
    .trim();
}

function take2(input: string) {
  const s = stripAccents(input).replace(/\s+/g, " ");
  const firstWord = s.split(" ")[0] ?? "";
  return firstWord.slice(0, 2).toUpperCase();
}

export function getBirthYearFromISO(isoDate: string) {
  const year = Number(String(isoDate ?? "").slice(0, 4));
  return Number.isFinite(year) && year > 1900 ? year : null;
}

export function generateStudentCode(opts: {
  nombres: string;
  primerApellido: string;
  fechaNacimientoISO: string;
}) {
  const anio = getBirthYearFromISO(opts.fechaNacimientoISO);
  if (!anio) return { codigo: "", anioNacimiento: null as number | null };

  const p1 = take2(opts.nombres);
  const p2 = take2(opts.primerApellido);
  if (!p1 || !p2) return { codigo: "", anioNacimiento: anio };

  return { codigo: `${p1}${p2}${anio}`, anioNacimiento: anio };
}
