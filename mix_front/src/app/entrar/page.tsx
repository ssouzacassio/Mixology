"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { apiFetch, salvarSessao, type Usuario } from "@/lib/api";

export default function PaginaEntrar() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const dados = await apiFetch("/api/autenticacao/entrar", {
        method: "POST",
        body: JSON.stringify({ usuario, senha }),
      });
      salvarSessao(dados.token, dados.usuario as Usuario);
      router.replace("/");
    } catch (erroCapturado) {
      setErro(
        erroCapturado instanceof Error
          ? erroCapturado.message
          : "Falha ao entrar"
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-marca-azul/5 p-4">
      <form
        onSubmit={aoEnviar}
        className="w-full max-w-sm bg-white text-black rounded-lg shadow p-8 flex flex-col gap-4"
      >
        <Image
          src="/marca/logo-colorida.png"
          alt="Mixology Drinkeria"
          width={200}
          height={58}
          className="mx-auto mb-2"
          priority
        />

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="usuario">
            Usuário
          </label>
          <input
            id="usuario"
            type="text"
            autoComplete="username"
            required
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            className="w-full rounded border border-black/15 px-3 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-marca-azul"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="senha">
            Senha
          </label>
          <input
            id="senha"
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full rounded border border-black/15 px-3 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-marca-azul"
          />
        </div>

        {erro && <p className="text-sm text-marca-vermelho">{erro}</p>}

        <button
          type="submit"
          disabled={carregando}
          className="rounded bg-marca-vermelho text-white font-medium py-2 text-sm hover:opacity-90 disabled:opacity-50"
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
