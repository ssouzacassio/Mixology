import Image from "next/image";
import Link from "next/link";

const ITENS_NAVEGACAO = [
  { href: "/caixa", label: "Caixa" },
  { href: "/produtos", label: "Produtos" },
  { href: "/estoque", label: "Estoque" },
];

export default function LayoutPainel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-marca-azul/20 bg-marca-azul/5 p-4">
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
              className="rounded px-3 py-2 text-sm font-medium text-black/70 hover:bg-marca-vermelho/10 hover:text-marca-vermelho transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6 border-t-4 border-marca-laranja">
        {children}
      </main>
    </div>
  );
}
