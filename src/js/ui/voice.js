import { state } from '../state/store.js';
import { icon } from './dom.js';

const Voice = {
  recognition: null,
  setupVoiceRecognition(onToastCallback) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const btnMic = document.getElementById('btnMic');
    const micIcon = document.getElementById('micIcon');
    const banner = document.getElementById('recordingBanner');
    const btnStopBanner = document.getElementById('btnStopVoiceBanner');
    const inputEl = document.getElementById('commandInput');

    if (!SpeechRecognition) {
      btnMic.addEventListener('click', () => {
        onToastCallback(
          'Seu navegador não suporta ditado por voz. Digite no campo de texto!',
          'warning',
        );
      });
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'pt-BR';
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.submitVoiceOnEnd = false;
    this.hasVoiceTranscript = false;

    this.recognition.onstart = () => {
      state.isRecording = true;
      this.submitVoiceOnEnd = true;
      this.hasVoiceTranscript = false;
      btnMic.classList.add('recording');
      micIcon.innerHTML = icon('stop');
      document.getElementById('micButtonLabel').textContent = 'Parar e conferir';
      banner.hidden = false;
    };

    this.recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      this.hasVoiceTranscript = Boolean(transcript.trim());
      inputEl.value = transcript;
    };

    this.recognition.onerror = (event) => {
      this.submitVoiceOnEnd = false;
      this.stopVoiceRecording(false);
      const messages = {
        'not-allowed': 'Permita o uso do microfone no navegador para falar seus lançamentos.',
        'service-not-allowed':
          'O navegador bloqueou o ditado por voz. Verifique as permissões do microfone.',
        'audio-capture': 'Nenhum microfone disponível. Verifique se ele está conectado.',
        'no-speech': 'Não consegui ouvir a fala. Tente novamente ou digite o lançamento.',
        network:
          'O ditado por voz precisa de conexão. Verifique a internet ou digite o lançamento.',
      };
      if (event.error !== 'aborted') {
        onToastCallback(
          messages[event.error] ||
            'Não foi possível reconhecer o áudio. Tente novamente ou digite o lançamento.',
          'warning',
        );
      }
    };

    this.recognition.onend = () => {
      const shouldSubmit = this.submitVoiceOnEnd && this.hasVoiceTranscript;
      this.submitVoiceOnEnd = false;
      this.stopVoiceRecording(false);
      if (shouldSubmit && inputEl.value.trim() && document.getElementById('composerDialog').open) {
        document.getElementById('commandForm').requestSubmit();
      }
    };

    btnMic.addEventListener('click', () => {
      if (state.isRecording) {
        this.stopVoiceRecording(true, true);
      } else {
        try {
          inputEl.value = '';
          this.hasVoiceTranscript = false;
          this.recognition.start();
        } catch (err) {
          console.error(err);
          this.submitVoiceOnEnd = false;
          this.stopVoiceRecording(false);
          onToastCallback(
            'Não foi possível iniciar o microfone. Verifique a permissão e tente novamente.',
            'warning',
          );
        }
      }
    });

    if (btnStopBanner) {
      btnStopBanner.addEventListener('click', () => {
        this.stopVoiceRecording(true, true);
      });
    }
  },
  stopVoiceRecording(shouldStopEngine = true, submitOnEnd = false) {
    if (shouldStopEngine) {
      this.submitVoiceOnEnd = submitOnEnd;
    }
    state.isRecording = false;
    const btnMic = document.getElementById('btnMic');
    const micIcon = document.getElementById('micIcon');
    const banner = document.getElementById('recordingBanner');
    if (btnMic) {
      btnMic.classList.remove('recording');
    }
    if (micIcon) {
      micIcon.innerHTML = icon('mic');
    }
    if (document.getElementById('micButtonLabel')) {
      document.getElementById('micButtonLabel').textContent = 'Usar microfone';
    }
    if (banner) {
      banner.hidden = true;
    }
    if (shouldStopEngine && this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Alguns navegadores já encerraram o reconhecimento antes desta chamada.
      }
    }
  },
};

export { Voice };
