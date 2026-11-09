import { sanitizeRule, sanitizeTransaction } from '../domain/records.js';
import { account } from '../state/store.js';

function cleanTransaction(raw, key = account()) {
  return sanitizeTransaction(raw, key);
}
function cleanRule(raw, key = account()) {
  return sanitizeRule(raw, key);
}

export { cleanRule, cleanTransaction };
