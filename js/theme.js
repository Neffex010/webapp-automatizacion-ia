// Tema visual claro/oscuro: persistencia local + preferencia del sistema.
const CLAVE_TEMA = 'nb-tema';

export function temaGuardado() {
    const valor = localStorage.getItem(CLAVE_TEMA);
    return valor === 'claro' || valor === 'oscuro' ? valor : null;
}

export function temaInicial() {
    return temaGuardado()
        ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro');
}

export function aplicarTema(tema) {
    document.documentElement.dataset.tema = tema;
    actualizarBotonTema();
}

export function alternarTema() {
    const nuevo = document.documentElement.dataset.tema === 'oscuro' ? 'claro' : 'oscuro';
    localStorage.setItem(CLAVE_TEMA, nuevo);
    document.documentElement.dataset.tema = nuevo;
    actualizarBotonTema();
}

// Sincroniza etiquetas y estado del botón conmutador
export function actualizarBotonTema() {
    const boton = document.getElementById('btn-theme');
    if (!boton) return;
    const oscuro = document.documentElement.dataset.tema === 'oscuro';
    boton.setAttribute('aria-pressed', String(oscuro));
    boton.setAttribute('aria-label', oscuro ? 'Activar modo claro' : 'Activar modo oscuro');
    boton.title = oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
}

// Sigue la preferencia del sistema solo mientras el usuario no elija manualmente
export function sincronizarConPreferenciaSistema() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (evento) => {
        if (temaGuardado()) return;
        aplicarTema(evento.matches ? 'oscuro' : 'claro');
    });
}
