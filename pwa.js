if ('serviceWorker' in navigator && window.isSecureContext && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(function (error) {
      console.warn('Не удалось включить офлайн-режим Никтона:', error);
    });
  });
}
