function initInstallApp() {
  // O manifesto é incluído pela publicação. O modo local continua independente.
  if (!document.querySelector('link[rel="manifest"]') || !('serviceWorker' in navigator)) {
    return;
  }
  const panel = document.querySelector('[data-install-panel]');
  const button = panel.querySelector('button');
  const guide = panel.querySelector('[data-install-guide]');
  const standalone = matchMedia('(display-mode: standalone)');
  const appleMobile =
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let installed = false;
  let promptEvent = null;

  function update() {
    panel.hidden =
      installed || standalone.matches || navigator.standalone || (!promptEvent && !appleMobile);
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    promptEvent = event;
    update();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    promptEvent = null;
    update();
  });
  standalone.addEventListener('change', update);

  button.addEventListener('click', async () => {
    if (!promptEvent) {
      guide.hidden = !guide.hidden;
      button.setAttribute('aria-expanded', String(!guide.hidden));
      return;
    }
    const event = promptEvent;
    promptEvent = null;
    button.disabled = true;
    try {
      const choice = await event.prompt();
      installed = choice.outcome === 'accepted';
    } catch (error) {
      console.warn('Não foi possível abrir a instalação:', error);
    } finally {
      button.disabled = false;
      update();
    }
  });

  update();
  void navigator.serviceWorker
    .register('./service-worker.js', { updateViaCache: 'none' })
    .catch((error) => console.warn('Não foi possível preparar o acesso offline:', error));
}

export { initInstallApp };
