"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ConciergeBell, Martini, Menu, Package, ShoppingCart, X } from "lucide-react";

import { encerrarSessao, obterToken, obterUsuario, type Usuario } from "@/lib/api";
import { aoMudarOrientacao, obterOrientacaoAtual, type OrientacaoMenu } from "@/lib/layoutPref";
import BarraPesquisa from "@/components/BarraPesquisa";
import MenuUsuarios, { OPCOES_USUARIOS } from "@/components/MenuUsuarios";
import MenuFinanceiro, { OPCOES_FINANCEIRO } from "@/components/MenuFinanceiro";
import IconeNavMenu from "@/components/IconeNavMenu";

const ITENS_NAVEGACAO = [
  { href: "/", label: "Menu", Icone: IconeNavMenu },
  { href: "/caixa", label: "Caixa", Icone: ShoppingCart },
  { href: "/atendimento", label: "Atendimento", Icone: ConciergeBell },
  { href: "/produtos", label: "Produtos", Icone: Martini },
  { href: "/estoque", label: "Estoque", Icone: Package },
];

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
  const [menuMobilAberto, setMenuMobilAberto] = useState(false);

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

  return (
    <div className={orientacao === "horizontal" ? "min-h-screen flex flex-col" : "md:flex min-h-screen"}>
      <header className="md:hidden flex items-center justify-between gap-3 border-b border-marca-azul/20 bg-marca-azul/5 px-4 py-3">
        <Image
          src="/marca/logo-colorida.png"
          alt="Mixology Drinkeria"
          width={120}
          height={34}
          priority
        />
        <button
          onClick={() => setMenuMobilAberto(true)}
          className="p-2 text-black/70 dark:text-white/70"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>
      </header>

      {menuMobilAberto && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMenuMobilAberto(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white dark:bg-zinc-900 p-4 flex flex-col shadow-lg overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <Image
                src="/marca/logo-colorida.png"
                alt="Mixology Drinkeria"
                width={140}
                height={40}
                priority
              />
              <button
                onClick={() => setMenuMobilAberto(false)}
                className="text-black/50 dark:text-white/50 hover:text-marca-vermelho"
                aria-label="Fechar menu"
              >
                <X size={20} />
              </button>
            </div>

            <BarraPesquisa
              valor={buscaMenu}
              aoMudar={setBuscaMenu}
              placeholder="Buscar no menu..."
              className="mb-4"
            />

            <nav className="flex flex-col gap-1">
              {itensVisiveis.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuMobilAberto(false)}
                  className={linkClasse}
                >
                  <item.Icone size={18} strokeWidth={1.75} />
                  {item.label}
                </Link>
              ))}
              {financeiroVisivel && (
                <div className="mt-1">
                  <p className="px-3 pt-2 pb-1 text-xs font-semibold text-black/40 dark:text-white/40 uppercase tracking-wide">
                    Financeiro
                  </p>
                  {OPCOES_FINANCEIRO.map((opcao) => (
                    <Link
                      key={opcao.href}
                      href={opcao.href}
                      onClick={() => setMenuMobilAberto(false)}
                      className={linkClasse}
                    >
                      <opcao.Icone size={18} strokeWidth={1.75} />
                      {opcao.label}
                    </Link>
                  ))}
                </div>
              )}
              {usuariosVisivel && (
                <div className="mt-1">
                  <p className="px-3 pt-2 pb-1 text-xs font-semibold text-black/40 dark:text-white/40 uppercase tracking-wide">
                    Usuários
                  </p>
                  {OPCOES_USUARIOS.map((opcao) => (
                    <Link
                      key={opcao.href}
                      href={opcao.href}
                      onClick={() => setMenuMobilAberto(false)}
                      className={linkClasse}
                    >
                      <opcao.Icone size={18} strokeWidth={1.75} />
                      {opcao.label}
                    </Link>
                  ))}
                </div>
              )}
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
              <button onClick={aoSair} className="text-sm text-marca-vermelho hover:underline">
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {orientacao === "horizontal" ? (
        <header className="hidden md:flex border-b border-marca-azul/20 bg-marca-azul/5 px-4 py-3 items-center gap-6">
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
            {ehFinanceiro && <MenuFinanceiro linkClasse={linkClasse} />}
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
      ) : (
        <aside className="hidden md:flex w-56 shrink-0 border-r border-marca-azul/20 bg-marca-azul/5 p-4 flex-col">
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
            {financeiroVisivel && <MenuFinanceiro linkClasse={linkClasse} />}
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
            <button onClick={aoSair} className="text-sm text-marca-vermelho hover:underline">
              Sair
            </button>
          </div>
        </aside>
      )}

      <main className="flex-1 p-4 md:p-6 border-t-4 border-marca-laranja overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
