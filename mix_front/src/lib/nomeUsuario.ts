// Deixa o nome de usuário sempre em maiúsculo e remove qualquer
// caractere que não seja letra ou número (sem espaço, acento ou símbolo),
// espelhando a normalização feita no backend.
export function formatarNomeUsuario(bruto: string): string {
  return bruto
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos (marcas de combinação)
    .replace(/[^A-Z0-9]/g, "");
}
