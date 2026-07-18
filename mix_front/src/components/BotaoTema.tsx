"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { aplicarTema, obterTemaAtual, type Tema } from "@/lib/tema";

export default function BotaoTema() {
  const [tema, setTema] = useState<Tema>("claro");

  useEffect(() => {
    setTema(obterTemaAtual());
  }, []);

  function alternar() {
    const novoTema: Tema = tema === "claro" ? "escuro" : "claro";
    aplicarTema(novoTema);
    setTema(novoTema);
  }

  return (
    <button
      onClick={alternar}
      className="flex items-center gap-2 rounded-lg border border-marca-azul/20 px-4 py-2 text-sm font-medium text-black/70 dark:text-white/70 hover:bg-marca-vermelho/10 hover:text-marca-vermelho transition-colors"
    >
      {tema === "claro" ? <Moon size={18} /> : <Sun size={18} />}
      {tema === "claro" ? "Modo escuro" : "Modo claro"}
    </button>
  );
}
