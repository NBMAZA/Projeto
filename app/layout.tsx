import type { ReactNode } from 'react';
import './style.css';
import ClienteAtivoCabecalho from './cliente-ativo-cabecalho';
import ProtecaoClienteAtivo from './protecao-cliente-ativo';
export const metadata = {title:'ERGOBAX | Inteligência Ergonômica',description:'Plataforma de inteligência ergonômica para consultorias, avaliações e gestão de clientes'};
export default function RootLayout({children}:{children:ReactNode}) {return <html lang="pt-BR"><body><ClienteAtivoCabecalho/><ProtecaoClienteAtivo>{children}</ProtecaoClienteAtivo></body></html>}
