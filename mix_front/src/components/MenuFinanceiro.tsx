"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown, Receipt, ShoppingBag, Wallet } from "lucide-react";

export const OPCOES_FINANCEIRO = [
  { href: "/financeiro", label: "Fechamento de caixa", Icone: Wallet },
  { href: "/financeiro/boletos", label: "Boletos a pagar", Icone: Receipt },
  { href: "/financeiro/mensal", label: "Total mês", Icone: CalendarDays },
  { href: "/financeiro/itens", label: "Itens vendidos", Icone: ShoppingBag },
];

export default function MenuFinanceiro({ linkClasse }: { linkClasse: string }) {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function aoClicarFora(evento: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(evento.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setAberto((valor) => !valor)}
        className={`${linkClasse} w-full justify-between`}
      >
        <span className="flex items-center gap-2">
          <Wallet size={18} strokeWidth={1.75} />
          Financeiro
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform ${aberto ? "rotate-180" : ""}`}
        />
      </button>

      {aberto && (
        <div className="absolute left-0 top-full mt-1 w-56 rounded-lg border border-marca-azul/20 bg-white dark:bg-zinc-900 shadow-lg py-1 z-20">
          {OPCOES_FINANCEIRO.map((opcao) => (
            <Link
              key={opcao.href}
              href={opcao.href}
              onClick={() => setAberto(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-black/70 dark:text-white/70 hover:bg-marca-vermelho/10 hover:text-marca-vermelho transition-colors"
            >
              <opcao.Icone size={16} strokeWidth={1.75} />
              {opcao.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
