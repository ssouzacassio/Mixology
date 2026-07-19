"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiFetch, obterUsuario } from "@/lib/api";

type TotalMensal = {
  mes: string;
  total: number;
};

function formatarReal(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarMes(mes: string) {
  const [ano, mesNumero] = mes.split("-");
  const data = new Date(Number(ano), Number(mesNumero) - 1, 1);
  const texto = data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default function PaginaTotalMensal() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);
  const [totais, setTotais] = useState<TotalMensal[]>([]);
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
        const dados = (await apiFetch("/api/financeiro/totais-mensais")) as TotalMensal[];
        setTotais(dados);
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

  const mesAtual = new Date().toISOString().slice(0, 7);
  const totalMesAtual = totais.find((t) => t.mes === mesAtual);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Total mês</h1>

      {carregando && <p className="text-sm text-black/60 dark:text-white/60">Carregando...</p>}
      {erro && <p className="text-sm text-marca-vermelho">{erro}</p>}

      {!carregando && !erro && (
        <div className="rounded-lg border border-marca-azul/20 p-4 max-w-xs mb-6">
          <p className="text-xs text-black/60 dark:text-white/60">{formatarMes(mesAtual)}</p>
          <p className="text-2xl font-semibold">{formatarReal(totalMesAtual?.total ?? 0)}</p>
        </div>
      )}

      {!carregando && !erro && totais.length === 0 && (
        <p className="text-sm text-black/60 dark:text-white/60">Nenhuma venda fechada ainda.</p>
      )}

      {!carregando && !erro && totais.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-black/60 dark:text-white/60 mb-2">Histórico</h2>
          <table className="w-full text-sm border-collapse max-w-xs">
            <tbody>
              {totais.map((t) => (
                <tr key={t.mes} className="border-b border-black/5 dark:border-white/5">
                  <td className="py-2 pr-4">{formatarMes(t.mes)}</td>
                  <td className="py-2 pr-4 text-right font-medium">{formatarReal(t.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
