"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiFetch, obterUsuario } from "@/lib/api";
import type { ItemVendido } from "@/lib/tipos";

function formatarReal(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarQuantidade(valor: number) {
  return valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

export default function PaginaItensVendidos() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);
  const [itens, setItens] = useState<ItemVendido[]>([]);
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
        const dados = (await apiFetch("/api/financeiro/itens-vendidos")) as ItemVendido[];
        setItens(dados);
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

  const totalQuantidade = itens.reduce((soma, i) => soma + i.quantidade, 0);
  const totalValor = itens.reduce((soma, i) => soma + i.total, 0);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Itens vendidos</h1>

      {carregando && <p className="text-sm text-black/60 dark:text-white/60">Carregando...</p>}
      {erro && <p className="text-sm text-marca-vermelho">{erro}</p>}

      {!carregando && !erro && itens.length === 0 && (
        <p className="text-sm text-black/60 dark:text-white/60">Nenhuma venda fechada ainda.</p>
      )}

      {!carregando && !erro && itens.length > 0 && (
        <div className="rounded-lg border border-marca-azul/20 p-4 max-w-2xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/10 dark:border-white/10">
            <div>
              <p className="text-xs text-black/60 dark:text-white/60">Total de itens</p>
              <p className="text-lg font-semibold">{formatarQuantidade(totalQuantidade)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-black/60 dark:text-white/60">Total vendido</p>
              <p className="text-lg font-semibold">{formatarReal(totalValor)}</p>
            </div>
          </div>

          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-black/10 dark:border-white/10">
                <th className="py-2 pr-4">Produto</th>
                <th className="py-2 pr-4 text-right">Quantidade</th>
                <th className="py-2 pr-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => (
                <tr key={item.produto_id} className="border-b border-black/5 dark:border-white/5">
                  <td className="py-2 pr-4">{item.nome}</td>
                  <td className="py-2 pr-4 text-right">{formatarQuantidade(item.quantidade)}</td>
                  <td className="py-2 pr-4 text-right font-medium">{formatarReal(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
