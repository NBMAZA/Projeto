import type { ReactNode } from 'react';
import './style.css';
export const metadata = {title:'Portal NR-17',description:'Gestão de consultorias e avaliações ergonômicas'};
export default function RootLayout({children}:{children:ReactNode}) {return <html lang="pt-BR"><body>{children}</body></html>}
