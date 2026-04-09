/** Vantagem exibida na seção "Por que escolher" da página Sobre */
export interface VantagemSobre {
  icone: string;
  titulo: string;
  descricao: string;
}

/** Número/estatística exibida na seção de números da página Sobre */
export interface NumeroSobre {
  valor: string;
  rotulo: string;
}

/** Informações de contato da página Sobre */
export interface ContatoSobre {
  email: string;
  telefone: string;
  horario: string;
}

/** Conteúdo completo e editável da página Sobre */
export interface SobreConteudo {
  titulo: string;
  subtitulo: string;
  missao: string;
  vantagens: VantagemSobre[];
  numeros: NumeroSobre[];
  contato: ContatoSobre;
}
