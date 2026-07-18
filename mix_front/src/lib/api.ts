const URL_API = process.env.NEXT_PUBLIC_URL_API ?? "http://localhost:8080";

const CHAVE_TOKEN = "mixology_token";
const CHAVE_USUARIO = "mixology_usuario";

export type Usuario = {
  id: string;
  nome_completo: string;
  usuario: string;
  papel: string;
  criado_em: string;
};

export function obterToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CHAVE_TOKEN);
}

export function obterUsuario(): Usuario | null {
  if (typeof window === "undefined") return null;
  const bruto = localStorage.getItem(CHAVE_USUARIO);
  return bruto ? JSON.parse(bruto) : null;
}

export function salvarSessao(token: string, usuario: Usuario) {
  localStorage.setItem(CHAVE_TOKEN, token);
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
}

export function encerrarSessao() {
  localStorage.removeItem(CHAVE_TOKEN);
  localStorage.removeItem(CHAVE_USUARIO);
}

export function atualizarUsuarioSalvo(usuario: Usuario) {
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
}

export async function apiFetch(caminho: string, opcoes: RequestInit = {}) {
  const token = obterToken();
  const cabecalhos = new Headers(opcoes.headers);
  cabecalhos.set("Content-Type", "application/json");
  if (token) cabecalhos.set("Authorization", `Bearer ${token}`);

  const resposta = await fetch(`${URL_API}${caminho}`, {
    ...opcoes,
    headers: cabecalhos,
  });

  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => ({}));
    throw new Error(corpo.error ?? `Erro ${resposta.status}`);
  }

  if (resposta.status === 204) return null;
  return resposta.json();
}
