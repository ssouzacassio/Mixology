"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutGrid, Martini, Package, ShoppingCart, UserRound, Users } from "lucide-react";

import { encerrarSessao, obterToken, obterUsuario, type Usuario } from "@/lib/api";

const ITENS_NAVEGACAO = [
  { href: "/", label: "Menu", Icone: LayoutGrid },
  { href: "/caixa", label: "Caixa", Icone: ShoppingCart },
  { href: "/produtos", label: "Produtos", Icone: Martini },
  { href: "/estoque", label: "Estoque", Icone: Package },
  { href: "/perfil", label: "Perfil", Icone: UserRound },
];

const ITEM_ADMIN = { href: "/usuarios", label: "Usuários", Icone: Users };

export default function LayoutPainel({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    if (!obterToken()) {
      router.replace("/entrar");
      return;
    }
    setUsuario(obterUsuario());
    setVerificando(false);
  }, [router]);

  function aoSair() {
    encerrarSessao();
    router.replace("/entrar");
  }

  if (verificando) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-marca-azul/20 bg-marca-azul/5 p-4 flex flex-col">
        <Image
          src="/marca/logo-colorida.png"
          alt="Mixology Drinkeria"
          width={180}
          height={52}
          className="mb-8"
          priority
        />
        <nav className="flex flex-col gap-1">
          {ITENS_NAVEGACAO.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-black/70 hover:bg-marca-vermelho/10 hover:text-marca-vermelho transition-colors"
            >
              <item.Icone size={18} strokeWidth={1.75} />
              {item.label}
            </Link>
          ))}
          {usuario?.papel === "admin" && (
            <Link
              href={ITEM_ADMIN.href}
              className="flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-black/70 hover:bg-marca-vermelho/10 hover:text-marca-vermelho transition-colors"
            >
              <ITEM_ADMIN.Icone size={18} strokeWidth={1.75} />
              {ITEM_ADMIN.label}
            </Link>
          )}
        </nav>
        <div className="mt-auto pt-4 border-t border-marca-azul/20">
          {usuario && (
            <Link href="/perfil" className="block text-xs text-black/60 mb-2 hover:underline">
              {usuario.nome_completo} · {usuario.papel}
            </Link>
          )}
          <button
            onClick={aoSair}
            className="text-sm text-marca-vermelho hover:underline"
          >
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 border-t-4 border-marca-laranja">
        {children}
      </main>
    </div>
  );
}
