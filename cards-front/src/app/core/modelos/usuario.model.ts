/** Endereço salvo no cadastro do usuário */
export interface EnderecoUsuario {
  id: number;
  titulo: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  principal?: boolean;
}

export type PerfilAdmin = 'desenvolvedor' | 'administrador' | 'mantenedor';

export const PERFIS_ADMIN: PerfilAdmin[] = ['desenvolvedor', 'administrador', 'mantenedor'];

export const ROTULOS_PERFIL_ADMIN: Record<PerfilAdmin, string> = {
  desenvolvedor: 'Desenvolvedor',
  administrador: 'Administrador',
  mantenedor: 'Mantenedor',
};

export interface PermissoesAdmin {
  acessoTotal: boolean;
  podeCadastrar: boolean;
  podeEditar: boolean;
  podeExcluir: boolean;
  podeGerenciarAparencia: boolean;
}

export interface UsuarioAdmin {
  id: number;
  nome: string;
  email: string;
  ativo: boolean;
  dataCadastro: string;
  perfil: PerfilAdmin;
  observacao?: string;
  ultimoAcesso?: string;
}

export function obterPermissoesAdmin(perfil: PerfilAdmin): PermissoesAdmin {
  if (perfil === 'desenvolvedor') {
    return {
      acessoTotal: true,
      podeCadastrar: true,
      podeEditar: true,
      podeExcluir: true,
      podeGerenciarAparencia: true,
    };
  }

  if (perfil === 'administrador') {
    return {
      acessoTotal: false,
      podeCadastrar: true,
      podeEditar: true,
      podeExcluir: true,
      podeGerenciarAparencia: false,
    };
  }

  return {
    acessoTotal: false,
    podeCadastrar: true,
    podeEditar: false,
    podeExcluir: false,
    podeGerenciarAparencia: false,
  };
}

/** Interface do usuário comum da loja */
export interface Usuario {
  id: number;
  nome: string;
  email: string;
  ativo: boolean;
  dataCadastro: string;
  totalPedidos?: number;
  enderecos?: EnderecoUsuario[];
}

/** Dados de login do usuário comum */
export interface LoginUsuario {
  email: string;
  senha: string;
}

/** Dados de registro de novo usuário */
export interface RegistroUsuario {
  nome: string;
  email: string;
  senha: string;
}

/** Dados de login do administrador */
export interface LoginAdmin {
  usuario: string;
  senha: string;
}

/** Resposta de autenticação (token JWT) */
export interface RespostaAuth {
  token: string;
  usuario: {
    id: number;
    nome: string;
    email?: string;
    usuario?: string;
    perfil: 'usuario' | PerfilAdmin;
  };
}
