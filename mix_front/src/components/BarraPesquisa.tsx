"use client";

import { Search } from "lucide-react";

type Props = {
  valor: string;
  aoMudar: (valor: string) => void;
  placeholder?: string;
  className?: string;
};

export default function BarraPesquisa({
  valor,
  aoMudar,
  placeholder = "Buscar...",
  className = "",
}: Props) {
  return (
    <div className={`relative ${className}`}>
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40 pointer-events-none"
      />
      <input
        type="text"
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded border border-black/15 dark:border-white/15 pl-9 pr-3 py-2 text-sm text-black dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-marca-azul"
      />
    </div>
  );
}
