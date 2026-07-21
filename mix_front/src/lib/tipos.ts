export type Produto = {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  preco: number;
  ativo: boolean;
  grupos_opcao?: { grupo_opcao_id: string; grupo_opcao?: GrupoOpcao }[];
};

export type Insumo = {
  id: string;
  nome: string;
  unidade: string;
  quantidade_estoque: number;
  quantidade_minima: number;
  custo_por_unidade: number;
};

export type Opcao = {
  id: string;
  grupo_opcao_id: string;
  nome: string;
  insumo_id?: string;
  insumo?: Insumo;
  quantidade: number;
};

export type GrupoOpcao = {
  id: string;
  nome: string;
  opcoes: Opcao[];
};

export type Mesa = {
  id: string;
  nome: string;
  status: string;
  criado_em: string;
};

export type Caixa = {
  id: string;
  aberto_por: string;
  aberto_por_nome: string;
  fechado_por?: string;
  fechado_por_nome?: string;
  valor_abertura: number;
  valor_fechamento?: number;
  status: string;
  aberto_em: string;
  fechado_em?: string;
};

export type ItemVenda = {
  id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  opcoes?: { opcao_id: string; opcao?: Opcao & { grupo_opcao?: GrupoOpcao } }[];
};

export type Boleto = {
  id: string;
  descricao: string;
  categoria: string;
  valor: number;
  vencimento: string;
  status: string;
  pago_em?: string;
  criado_em: string;
};

export type ItemVendido = {
  produto_id: string;
  nome: string;
  quantidade: number;
  total: number;
};

export type Venda = {
  id: string;
  caixa_id: string;
  mesa_id?: string;
  mesa?: Mesa;
  nome_comanda?: string;
  total: number;
  forma_pagamento: string;
  status: string;
  criado_em: string;
  fechado_em?: string;
  itens: ItemVenda[];
};
