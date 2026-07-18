"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConciergeBell, Martini, Package, ShoppingCart, Users } from "lucide-react";

import { obterUsuario } from "@/lib/api";
import BotaoTema from "@/components/BotaoTema";
import BotaoOrientacao from "@/components/BotaoOrientacao";

const SECOES = [
  {
    href: "/caixa",
    label: "Caixa",
    descricao: "Abrir/fechar o caixa e ver o resumo por pagamento",
    Icone: ShoppingCart,
  },
  {
    href: "/atendimento",
    label: "Atendimento",
    descricao: "Mesas e registro de vendas pros clientes",
    Icone: ConciergeBell,
  },
  {
    href: "/produtos",
    label: "Produtos",
    descricao: "Cadastrar drinks e a ficha técnica de cada um",
    Icone: Martini,
  },
  {
    href: "/estoque",
    label: "Estoque",
    descricao: "Insumos, quantidades e movimentações",
    Icone: Package,
  },
];

const SECAO_ADMIN = {
  href: "/usuarios",
  label: "Usuários",
  descricao: "Cadastrar e listar funcionários",
  Icone: Users,
};

export default function PaginaMenu() {
  const [ehAdmin, setEhAdmin] = useState(false);

  useEffect(() => {
    setEhAdmin(obterUsuario()?.papel === "admin");
  }, []);

  const secoes = ehAdmin ? [...SECOES, SECAO_ADMIN] : SECOES;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-xl font-semibold">Menu</h1>
        <div className="flex items-center gap-2">
          <BotaoOrientacao />
          <BotaoTema />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {secoes.map((secao) => (
          <Link
            key={secao.href}
            href={secao.href}
            className="rounded-lg border border-marca-azul/20 p-3 flex flex-col items-start gap-1.5 hover:border-marca-vermelho/40 hover:shadow-sm transition-all"
          >
            <secao.Icone size={20} strokeWidth={1.5} className="text-marca-vermelho" />
            <div>
              <p className="text-sm font-medium">{secao.label}</p>
              <p className="text-xs text-black/60 dark:text-white/60">{secao.descricao}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
