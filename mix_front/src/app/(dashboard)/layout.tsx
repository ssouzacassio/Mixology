"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutGrid, Martini, Package, ShoppingCart, Wallet } from "lucide-react";

import { encerrarSessao, obterToken, obterUsuario, type Usuario } from "@/lib/api";
import { aoMudarOrientacao, obterOrientacaoAtual, type OrientacaoMenu } from "@/lib/layoutPref";
import BarraPesquisa from "@/components/BarraPesquisa";
import MenuUsuarios from "@/components/MenuUsuarios";

const ITENS_NAVEGACAO = [
  { href: "/", label: "Menu", Icone: LayoutGrid },
  { href: "/caixa", label: "Caixa", Icone: ShoppingCart },
  { href: "/produtos", label: "Produtos", Icone: Martini },
  { href: "/estoque", label: "Estoque", Icone: Package },
];

const ITEM_FINANCEIRO = { href: "/financeiro", label: "Financeiro", Icone: Wallet };

export default function LayoutPainel({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [verificando, setVerificando] = useState(true);
  const [orientacao, setOrientacao] = useState<OrientacaoMenu>("vertical");
  const [buscaMenu, setBuscaMenu] = useState("");

  useEffect(() => {
    if (!obterToken()) {
      router.replace("/entrar");
      return;
    }
    setUsuario(obterUsuario());
    setOrientacao(obterOrientacaoAtual());
    setVerificando(false);
  }, [router]);

  useEffect(() => {
    return aoMudarOrientacao(() => setOrientacao(obterOrientacaoAtual()));
  }, []);

  function aoSair() {
    encerrarSessao();
    router.replace("/entrar");
  }

  if (verificando) {
    return null;
  }

  const ehAdmin = usuario?.papel === "admin";
  const ehFinanceiro = usuario?.papel === "admin" || usuario?.papel === "gerente";
  const alvoBusca = buscaMenu.trim().toLowerCase();
  const itensVisiveis = ITENS_NAVEGACAO.filter((item) =>
    item.label.toLowerCase().includes(alvoBusca)
  );
  const usuariosVisivel = ehAdmin && "usuários".includes(alvoBusca);
  const financeiroVisivel = ehFinanceiro && "financeiro".includes(alvoBusca);

  const linkClasse =
    "flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-black/70 dark:text-white/70 hover:bg-marca-vermelho/10 hover:text-marca-vermelho transition-colors";

  if (orientacao === "horizontal") {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-marca-azul/20 bg-marca-azul/5 px-4 py-3 flex items-center gap-6">
          <Image
            src="/marca/logo-colorida.png"
            alt="Mixology Drinkeria"
            width={140}
            height={40}
            priority
          />
          <nav className="flex items-center gap-1 flex-1 flex-wrap">
            {ITENS_NAVEGACAO.map((item) => (
              <Link key={item.href} href={item.href} className={linkClasse}>
                <item.Icone size={16} strokeWidth={1.75} />
                {item.label}
              </Link>
            ))}
            {ehFinanceiro && (
              <Link href={ITEM_FINANCEIRO.href} className={linkClasse}>
                <ITEM_FINANCEIRO.Icone size={16} strokeWidth={1.75} />
                {ITEM_FINANCEIRO.label}
              </Link>
            )}
            {ehAdmin && <MenuUsuarios linkClasse={linkClasse} />}
          </nav>
          {usuario && (
            <span className="text-xs text-black/60 dark:text-white/60 whitespace-nowrap">
              {usuario.nome_completo} · {usuario.papel}
            </span>
          )}
          <button onClick={aoSair} className="text-sm text-marca-vermelho hover:underline">
            Sair
          </button>
        </header>
        <main className="flex-1 p-6 border-t-4 border-marca-laranja">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-marca-azul/20 bg-marca-azul/5 p-4 flex flex-col">
        <Image
          src="/marca/logo-colorida.png"
          alt="Mixology Drinkeria"
          width={180}
          height={52}
          className="mb-4"
          priority
        />
        <BarraPesquisa
          valor={buscaMenu}
          aoMudar={setBuscaMenu}
          placeholder="Buscar no menu..."
          className="mb-4"
        />
        <nav className="flex flex-col gap-1">
          {itensVisiveis.map((item) => (
            <Link key={item.href} href={item.href} className={linkClasse}>
              <item.Icone size={18} strokeWidth={1.75} />
              {item.label}
            </Link>
          ))}
          {financeiroVisivel && (
            <Link href={ITEM_FINANCEIRO.href} className={linkClasse}>
              <ITEM_FINANCEIRO.Icone size={18} strokeWidth={1.75} />
              {ITEM_FINANCEIRO.label}
            </Link>
          )}
          {usuariosVisivel && <MenuUsuarios linkClasse={linkClasse} />}
          {itensVisiveis.length === 0 && !usuariosVisivel && !financeiroVisivel && (
            <p className="text-xs text-black/50 dark:text-white/50 px-3 py-2">
              Nada encontrado.
            </p>
          )}
        </nav>
        <div className="mt-auto pt-4 border-t border-marca-azul/20">
          {usuario && (
            <p className="text-xs text-black/60 dark:text-white/60 mb-2">
              {usuario.nome_completo} · {usuario.papel}
            </p>
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
