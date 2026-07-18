const CHAVE_TEMA = "mixology_tema";

export type Tema = "claro" | "escuro";

export function obterTemaAtual(): Tema {
  if (typeof window === "undefined") return "claro";
  return document.documentElement.classList.contains("dark") ? "escuro" : "claro";
}

export function aplicarTema(tema: Tema) {
  document.documentElement.classList.toggle("dark", tema === "escuro");
  localStorage.setItem(CHAVE_TEMA, tema);
}
