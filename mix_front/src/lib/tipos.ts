export type Produto = {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  preco: number;
  ativo: boolean;
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
