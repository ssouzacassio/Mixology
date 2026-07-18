const CHAVE_ORIENTACAO = "mixology_orientacao_menu";
const EVENTO_MUDANCA = "mixology-orientacao-mudou";

export type OrientacaoMenu = "vertical" | "horizontal";

export function obterOrientacaoAtual(): OrientacaoMenu {
  if (typeof window === "undefined") return "vertical";
  return localStorage.getItem(CHAVE_ORIENTACAO) === "horizontal"
    ? "horizontal"
    : "vertical";
}

export function salvarOrientacao(orientacao: OrientacaoMenu) {
  localStorage.setItem(CHAVE_ORIENTACAO, orientacao);
  window.dispatchEvent(new Event(EVENTO_MUDANCA));
}

export function aoMudarOrientacao(callback: () => void) {
  window.addEventListener(EVENTO_MUDANCA, callback);
  return () => window.removeEventListener(EVENTO_MUDANCA, callback);
}
