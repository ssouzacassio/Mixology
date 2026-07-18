"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { apiFetch, obterUsuario, type Usuario } from "@/lib/api";

const CAMPO_CLASSE =
  "w-full rounded border border-black/15 dark:border-white/15 px-3 py-2 text-sm text-black dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-marca-azul";

export default function PaginaAlterarSenhaUsuario() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [usuarioId, setUsuarioId] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
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

    (async () => {
      try {
        const dados = (await apiFetch("/api/usuarios")) as Usuario[];
        setUsuarios(dados);
        if (dados.length > 0) setUsuarioId(dados[0].id);
      } catch (erroCapturado) {
        setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao carregar funcionários");
      } finally {
        setCarregando(false);
      }
    })();
  }, [router]);

  async function aoRedefinir(evento: FormEvent) {
    evento.preventDefault();
    setErro("");
    setMensagem("");
    setSalvando(true);
    try {
      await apiFetch(`/api/usuarios/${usuarioId}/senha`, {
        method: "PUT",
        body: JSON.stringify({ senha_nova: novaSenha }),
      });
      setMensagem("Senha redefinida com sucesso.");
      setNovaSenha("");
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : "Falha ao redefinir senha");
    } finally {
      setSalvando(false);
    }
  }

  if (!autorizado) {
    return null;
  }

  return (
    <div className="max-w-sm">
      <h1 className="text-xl font-semibold mb-4">Alterar senha</h1>

      {carregando && <p className="text-sm text-black/60 dark:text-white/60">Carregando...</p>}

      {!carregando && usuarios.length === 0 && (
        <p className="text-sm text-black/60 dark:text-white/60">Nenhum funcionário cadastrado.</p>
      )}

      {!carregando && usuarios.length > 0 && (
        <form onSubmit={aoRedefinir} className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="usuario-alvo">
              Funcionário
            </label>
            <select
              id="usuario-alvo"
              value={usuarioId}
              onChange={(e) => setUsuarioId(e.target.value)}
              className={CAMPO_CLASSE}
            >
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome_completo} ({u.usuario})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="senha-nova">
              Nova senha
            </label>
            <input
              id="senha-nova"
              type="password"
              required
              minLength={6}
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className={CAMPO_CLASSE}
            />
          </div>

          {erro && <p className="text-sm text-marca-vermelho">{erro}</p>}
          {mensagem && <p className="text-sm text-green-700">{mensagem}</p>}

          <button
            type="submit"
            disabled={salvando}
            className="self-start rounded bg-marca-vermelho text-white font-medium px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Redefinir senha"}
          </button>
        </form>
      )}
    </div>
  );
}
