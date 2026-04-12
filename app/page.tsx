import { redirect } from 'next/navigation'

// La raíz redirige a la pantalla principal del sistema clínico.
// El chat ya no es la pantalla de entrada.
export default function Home() {
    redirect('/analizar')
}
