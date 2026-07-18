"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiFetch, obterUsuario } from "@/lib/api";
import type { Caixa } from "@/lib/tipos";

function formatarReal(valor?: number) {
  if (valor === undefined) return "—";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarHorario(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PaginaFinanceiro() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const usuarioLogado = obterUsuario();
    if (usuarioLogado?.papel !== "admin" && usuarioLogado?.papel !== "gerente") {
      router.replace("/");
      return;
    }
    setAutorizado(true);

    (async () => {
      try {
        const dados = (await apiFetch("/api/caixas")) as Caixa[];
        setCaixas(dados);
      } catch (erroCapturado) {
        setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao carregar");
      } finally {
        setCarregando(false);
      }
    })();
  }, [router]);

  if (!autorizado) {
    return null;
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Financeiro — histórico de caixas</h1>

      {carregando && <p className="text-sm text-black/60 dark:text-white/60">Carregando...</p>}
      {erro && <p className="text-sm text-marca-vermelho">{erro}</p>}

      {!carregando && !erro && caixas.length === 0 && (
        <p className="text-sm text-black/60 dark:text-white/60">Nenhum caixa registrado ainda.</p>
      )}

      {!carregando && !erro && caixas.length > 0 && (
        <div className="overflow-x-auto max-w-3xl">
        <table className="w-full text-sm border-collapse min-w-[640px]">
          <thead>
            <tr className="text-left border-b border-black/10 dark:border-white/10">
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Aberto por</th>
              <th className="py-2 pr-4">Abertura</th>
              <th className="py-2 pr-4">Valor abertura</th>
              <th className="py-2 pr-4">Fechado por</th>
              <th className="py-2 pr-4">Fechamento</th>
              <th className="py-2 pr-4">Valor fechamento</th>
            </tr>
          </thead>
          <tbody>
            {caixas.map((c) => (
              <tr key={c.id} className="border-b border-black/5 dark:border-white/5">
                <td className="py-2 pr-4">
                  <span
                    className={
                      c.status === "aberto"
                        ? "text-green-700 dark:text-green-500"
                        : "text-black/60 dark:text-white/60"
                    }
                  >
                    {c.status === "aberto" ? "Aberto" : "Fechado"}
                  </span>
                </td>
                <td className="py-2 pr-4">{c.aberto_por_nome}</td>
                <td className="py-2 pr-4">{formatarHorario(c.aberto_em)}</td>
                <td className="py-2 pr-4">{formatarReal(c.valor_abertura)}</td>
                <td className="py-2 pr-4">{c.fechado_por_nome || "—"}</td>
                <td className="py-2 pr-4">{formatarHorario(c.fechado_em)}</td>
                <td className="py-2 pr-4">{formatarReal(c.valor_fechamento)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
