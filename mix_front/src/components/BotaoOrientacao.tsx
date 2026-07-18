"use client";

import { useEffect, useState } from "react";
import { PanelLeft, PanelTop } from "lucide-react";

import {
  obterOrientacaoAtual,
  salvarOrientacao,
  type OrientacaoMenu,
} from "@/lib/layoutPref";

export default function BotaoOrientacao() {
  const [orientacao, setOrientacao] = useState<OrientacaoMenu>("vertical");

  useEffect(() => {
    setOrientacao(obterOrientacaoAtual());
  }, []);

  function alternar() {
    const nova: OrientacaoMenu = orientacao === "vertical" ? "horizontal" : "vertical";
    salvarOrientacao(nova);
    setOrientacao(nova);
  }

  return (
    <button
      onClick={alternar}
      className="flex items-center gap-2 rounded-lg border border-marca-azul/20 px-4 py-2 text-sm font-medium text-black/70 dark:text-white/70 hover:bg-marca-vermelho/10 hover:text-marca-vermelho transition-colors"
    >
      {orientacao === "vertical" ? <PanelTop size={18} /> : <PanelLeft size={18} />}
      Menu {orientacao === "vertical" ? "horizontal" : "vertical"}
    </button>
  );
}
