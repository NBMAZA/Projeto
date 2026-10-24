import type { ReactNode } from 'react';
import './style.css';
export const metadata = {title:'ERGOBAX | Inteligência Ergonômica',description:'Plataforma de inteligência ergonômica para consultorias, avaliações e gestão de clientes'};
export default function RootLayout({children}:{children:ReactNode}) {return <html lang="pt-BR"><body>{children}</body></html>}
