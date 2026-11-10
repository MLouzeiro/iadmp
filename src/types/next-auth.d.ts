import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      role: string;
      id: string;
      ativo: boolean;
      organizacoes: { id: string; nome: string }[];
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    id: string;
    ativo?: boolean;
    organizacoes?: { id: string; nome: string }[];
  }
}
