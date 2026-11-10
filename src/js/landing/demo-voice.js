import {
  createSpeechRecognition,
  speechErrorMessage,
  speechTranscript,
} from '../services/speech-recognition.js';

function initDemoVoice(form, input, preview) {
  const button = document.getElementById('demoMic');
  const label = button.querySelector('span');
  const status = document.getElementById('demoMicStatus');
  const submit = form.querySelector('[type="submit"]');
  const recognition = createSpeechRecognition();
  let active = false;
  let transcript = '';
  let failed = false;

  function announce(message, error = false) {
    status.textContent = message;
    status.hidden = !message;
    status.classList.toggle('expense-text', error);
  }

  if (!recognition) {
    button.addEventListener('click', () => {
      announce(
        'O ditado por voz está indisponível neste navegador. Digite para testar o comando.',
        true,
      );
    });
    return;
  }

  function finish() {
    active = false;
    button.disabled = false;
    input.readOnly = false;
    submit.disabled = false;
    button.setAttribute('aria-pressed', 'false');
    label.textContent = 'Usar microfone';
  }

  recognition.onstart = () => {
    if (!active || failed) {
      return;
    }
    button.disabled = false;
    button.setAttribute('aria-pressed', 'true');
    label.textContent = 'Parar e conferir';
    announce('Ouvindo… Fale o seu lançamento.');
  };
  recognition.onresult = (event) => {
    if (active && !failed) {
      transcript = speechTranscript(event);
      input.value = transcript;
    }
  };
  recognition.onerror = (event) => {
    failed = true;
    announce(
      event.error === 'aborted' ? '' : speechErrorMessage(event.error),
      event.error !== 'aborted',
    );
  };
  recognition.onend = () => {
    if (!active) {
      return;
    }
    finish();
    if (failed) {
      return;
    }
    if (!transcript) {
      announce(speechErrorMessage('no-speech'), true);
      return;
    }
    announce('Ditado concluído. Você pode editar a frase e gerar outra prévia.');
    preview();
  };

  button.addEventListener('click', () => {
    button.disabled = true;
    try {
      if (active) {
        announce('Concluindo o ditado…');
        recognition.stop();
        return;
      }
      active = true;
      failed = false;
      transcript = '';
      input.readOnly = true;
      submit.disabled = true;
      announce('Aguardando acesso ao microfone…');
      recognition.start();
    } catch {
      failed = true;
      finish();
      announce('Não foi possível usar o microfone. Verifique a permissão e tente novamente.', true);
    }
  });

  window.addEventListener('pagehide', () => {
    if (active) {
      failed = true;
      recognition.abort();
      finish();
    }
  });
}

export { initDemoVoice };
