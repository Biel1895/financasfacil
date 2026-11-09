function deadline(promise, ms = 10000) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(
        () => reject(new Error('A conexão demorou. Seus dados continuam salvos neste aparelho.')),
        ms,
      );
    }),
  ]).finally(() => clearTimeout(timer));
}

export { deadline };
