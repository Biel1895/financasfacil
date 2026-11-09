async function sha256Hash(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function derivePbkdf2Hash(password, saltHex, iterations = 100000) {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(saltHex),
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    256,
  );
  const hashArray = Array.from(new Uint8Array(derivedBits));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function generateRandomSaltHex(byteLength = 16) {
  const randomBytes = new Uint8Array(byteLength);
  crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function passwordMatches(user, password) {
  const hash =
    user.kdf === 'PBKDF2-SHA256'
      ? await derivePbkdf2Hash(password, `${user.accountKey}::${user.salt}`)
      : await sha256Hash(`${user.accountKey}::${password}`);
  return hash === user.passwordHash;
}

export { derivePbkdf2Hash, generateRandomSaltHex, passwordMatches, sha256Hash };
