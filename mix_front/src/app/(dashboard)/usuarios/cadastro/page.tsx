"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { apiFetch, obterUsuario } from "@/lib/api";
import { formatarNomeUsuario } from "@/lib/nomeUsuario";

const PAPEIS = [
  { valor: "atendente", label: "Atendente" },
  { valor: "caixa", label: "Caixa" },
  { valor: "bartender", label: "Bartender" },
  { valor: "gerente", label: "Gerente" },
  { valor: "admin", label: "Admin" },
];

const CAMPO_CLASSE =
  "w-full rounded border border-black/15 dark:border-white/15 px-3 py-2 text-sm text-black dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-marca-azul";

export default function PaginaCadastroUsuario() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);

  const [nomeCompleto, setNomeCompleto] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [papel, setPapel] = useState("atendente");
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const usuarioLogado = obterUsuario();
    if (usuarioLogado?.papel !== "admin") {
      router.replace("/");
      return;
    }
    setAutorizado(true);
  }, [router]);

  async function aoCriar(evento: FormEvent) {
    evento.preventDefault();
    setErro("");
    setMensagem("");
    setSalvando(true);
    try {
      await apiFetch("/api/autenticacao/registrar", {
        method: "POST",
        body: JSON.stringify({
          nome_completo: nomeCompleto,
          usuario: nomeUsuario,
          senha,
          papel,
        }),
      });
      setMensagem(`Funcionário "${nomeUsuario}" cadastrado com sucesso.`);
      setNomeCompleto("");
      setNomeUsuario("");
      setSenha("");
      setPapel("atendente");
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao cadastrar");
    } finally {
      setSalvando(false);
    }
  }

  if (!autorizado) {
    return null;
  }

  return (
    <div className="max-w-sm">
      <h1 className="text-xl font-semibold mb-4">Cadastrar funcionário</h1>
      <form onSubmit={aoCriar} className="flex flex-col gap-3">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="novo-nome">
            Nome completo
          </label>
          <input
            id="novo-nome"
            required
            value={nomeCompleto}
            onChange={(e) => setNomeCompleto(e.target.value)}
            className={CAMPO_CLASSE}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="novo-usuario">
            Usuário
          </label>
          <input
            id="novo-usuario"
            type="text"
            required
            value={nomeUsuario}
            onChange={(e) => setNomeUsuario(formatarNomeUsuario(e.target.value))}
            className={CAMPO_CLASSE}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="nova-senha">
            Senha
          </label>
          <input
            id="nova-senha"
            type="password"
            required
            minLength={6}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className={CAMPO_CLASSE}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="novo-papel">
            Papel
          </label>
          <select
            id="novo-papel"
            value={papel}
            onChange={(e) => setPapel(e.target.value)}
            className={CAMPO_CLASSE}
          >
            {PAPEIS.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {erro && <p className="text-sm text-marca-vermelho">{erro}</p>}
        {mensagem && <p className="text-sm text-green-700">{mensagem}</p>}

        <button
          type="submit"
          disabled={salvando}
          className="self-start rounded bg-marca-vermelho text-white font-medium px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
        >
          {salvando ? "Cadastrando..." : "Cadastrar funcionário"}
        </button>
      </form>
    </div>
  );
}
