"use client";

import { useEffect, useState, type FormEvent } from "react";

import {
  apiFetch,
  atualizarUsuarioSalvo,
  obterUsuario,
  type Usuario,
} from "@/lib/api";

export default function PaginaPerfil() {
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [papel, setPapel] = useState("");
  const [mensagemPerfil, setMensagemPerfil] = useState("");
  const [erroPerfil, setErroPerfil] = useState("");
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [mensagemSenha, setMensagemSenha] = useState("");
  const [erroSenha, setErroSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  useEffect(() => {
    const usuarioLogado = obterUsuario();
    if (usuarioLogado) {
      setNomeCompleto(usuarioLogado.nome_completo);
      setNomeUsuario(usuarioLogado.usuario);
      setPapel(usuarioLogado.papel);
    }
  }, []);

  async function aoSalvarPerfil(evento: FormEvent) {
    evento.preventDefault();
    setErroPerfil("");
    setMensagemPerfil("");
    setSalvandoPerfil(true);
    try {
      const usuarioAtualizado = (await apiFetch("/api/usuarios/perfil", {
        method: "PUT",
        body: JSON.stringify({ nome_completo: nomeCompleto, usuario: nomeUsuario }),
      })) as Usuario;
      atualizarUsuarioSalvo(usuarioAtualizado);
      setMensagemPerfil("Dados atualizados.");
    } catch (erro) {
      setErroPerfil(erro instanceof Error ? erro.message : "Falha ao salvar");
    } finally {
      setSalvandoPerfil(false);
    }
  }

  async function aoTrocarSenha(evento: FormEvent) {
    evento.preventDefault();
    setErroSenha("");
    setMensagemSenha("");
    setSalvandoSenha(true);
    try {
      await apiFetch("/api/usuarios/senha", {
        method: "PUT",
        body: JSON.stringify({
          senha_atual: senhaAtual,
          senha_nova: senhaNova,
        }),
      });
      setSenhaAtual("");
      setSenhaNova("");
      setMensagemSenha("Senha alterada.");
    } catch (erro) {
      setErroSenha(erro instanceof Error ? erro.message : "Falha ao salvar");
    } finally {
      setSalvandoSenha(false);
    }
  }

  return (
    <div className="max-w-md flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold mb-1">Meu perfil</h1>
        <p className="text-sm text-black/60 mb-4">Papel: {papel}</p>

        <form onSubmit={aoSalvarPerfil} className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="nome">
              Nome completo
            </label>
            <input
              id="nome"
              required
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              className="w-full rounded border border-black/15 px-3 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-marca-azul"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="usuario-perfil">
              Usuário
            </label>
            <input
              id="usuario-perfil"
              type="text"
              required
              value={nomeUsuario}
              onChange={(e) => setNomeUsuario(e.target.value)}
              className="w-full rounded border border-black/15 px-3 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-marca-azul"
            />
          </div>

          {erroPerfil && <p className="text-sm text-marca-vermelho">{erroPerfil}</p>}
          {mensagemPerfil && <p className="text-sm text-green-700">{mensagemPerfil}</p>}

          <button
            type="submit"
            disabled={salvandoPerfil}
            className="self-start rounded bg-marca-vermelho text-white font-medium px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
          >
            {salvandoPerfil ? "Salvando..." : "Salvar dados"}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Trocar senha</h2>
        <form onSubmit={aoTrocarSenha} className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="senha-atual">
              Senha atual
            </label>
            <input
              id="senha-atual"
              type="password"
              required
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              className="w-full rounded border border-black/15 px-3 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-marca-azul"
            />
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
              value={senhaNova}
              onChange={(e) => setSenhaNova(e.target.value)}
              className="w-full rounded border border-black/15 px-3 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-marca-azul"
            />
          </div>

          {erroSenha && <p className="text-sm text-marca-vermelho">{erroSenha}</p>}
          {mensagemSenha && <p className="text-sm text-green-700">{mensagemSenha}</p>}

          <button
            type="submit"
            disabled={salvandoSenha}
            className="self-start rounded bg-marca-vermelho text-white font-medium px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
          >
            {salvandoSenha ? "Salvando..." : "Trocar senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
