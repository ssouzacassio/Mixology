const CORES_SINAL: Record<string, string> = {
  livre: "bg-green-500",
  ocupada: "bg-amber-500",
  consumacao: "bg-marca-vermelho animate-pulse",
  finalizada: "bg-marca-azul",
};

export default function SinalMesa({ status }: { status: string }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${
        CORES_SINAL[status] ?? "bg-black/30"
      }`}
    />
  );
}
