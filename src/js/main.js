/** Composition root: connects storage notifications, rendering and optional cloud sync. */
import { boot } from './application/events.js';
import { installTestAdapter } from './testing/browser-adapter.js';
import { autoSnapshot } from './data/backups.js';
import { onLifecycle } from './infrastructure/lifecycle.js';
import { queueCloudSync } from './services/cloud.js';
import { toast } from './ui/feedback.js';
import { render, renderSettings, renderSync } from './ui/views.js';

onLifecycle('notice', ([message, type]) => toast(message, type));
onLifecycle('save:state', renderSync);
onLifecycle('data:changed', render);
onLifecycle('backups:changed', renderSettings);
onLifecycle('sync:request', queueCloudSync);
onLifecycle('backup:request', () => {
  void autoSnapshot().catch((error) => console.warn('Cópia diária indisponível:', error));
});

// Enabled only by the isolated automated browser tests, before the page loads.
if (window.__FF_ENABLE_TEST_API__ === true) {
  installTestAdapter();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  void boot();
}
