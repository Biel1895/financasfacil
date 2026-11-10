const messages = {
  'not-allowed': 'Permita o uso do microfone no navegador para falar seus lançamentos.',
  'service-not-allowed':
    'O navegador bloqueou o ditado por voz. Verifique as permissões do microfone.',
  'audio-capture': 'Nenhum microfone disponível. Verifique se ele está conectado.',
  'no-speech': 'Não consegui ouvir a fala. Tente novamente ou digite o lançamento.',
  network: 'O ditado por voz precisa de conexão. Verifique a internet ou digite o lançamento.',
};

function createSpeechRecognition() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    return null;
  }
  const recognition = new Recognition();
  recognition.lang = 'pt-BR';
  recognition.continuous = false;
  recognition.interimResults = true;
  return recognition;
}

function speechTranscript(event) {
  return Array.from(event.results, (result) => result[0].transcript.trim()).join(' ');
}

function speechErrorMessage(code) {
  return (
    messages[code] || 'Não foi possível reconhecer o áudio. Tente novamente ou digite o lançamento.'
  );
}

export { createSpeechRecognition, speechErrorMessage, speechTranscript };
