import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      {
        name: 'suppress-vite-hmr-ws',
        transformIndexHtml() {
          return [
            {
              tag: 'script',
              injectTo: 'head-prepend',
              children: `
(function() {
  function isWs(err) {
    if (!err) return false;
    var msg = (typeof err === 'string' ? err : (err.message || (err.reason && (err.reason.message || err.reason)))) || '';
    if (typeof msg !== 'string') return false;
    return msg.toLowerCase().indexOf('websocket') !== -1 || msg.indexOf('[vite]') !== -1;
  }
  window.addEventListener('unhandledrejection', function(e) {
    if (isWs(e.reason) || isWs(e)) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);
  window.addEventListener('error', function(e) {
    if (isWs(e.error) || isWs(e.message) || isWs(e)) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);
  if (typeof window !== 'undefined' && window.WebSocket) {
    var NativeWs = window.WebSocket;
    window.WebSocket = function(url, proto) {
      var isHmr = (typeof proto === 'string' && proto.indexOf('vite') !== -1) ||
                  (Array.isArray(proto) && proto.some(function(p) { return typeof p === 'string' && p.indexOf('vite') !== -1; })) ||
                  (typeof url === 'string' && (url.indexOf('vite') !== -1 || url.indexOf('localhost') !== -1 || url.indexOf('ais-') !== -1));
      if (isHmr) {
        var dummy = {
          binaryType: 'blob',
          bufferedAmount: 0,
          extensions: '',
          protocol: 'vite-hmr',
          readyState: 1,
          url: url,
          onopen: null,
          onclose: null,
          onerror: null,
          onmessage: null,
          send: function() {},
          close: function() {},
          addEventListener: function(evt, fn) {
            if (evt === 'open' && typeof fn === 'function') setTimeout(fn, 5);
          },
          removeEventListener: function() {},
          dispatchEvent: function() { return true; }
        };
        setTimeout(function() {
          if (typeof dummy.onopen === 'function') dummy.onopen({ type: 'open' });
        }, 5);
        return dummy;
      }
      return new NativeWs(url, proto);
    };
    window.WebSocket.prototype = NativeWs.prototype;
    window.WebSocket.CONNECTING = 0;
    window.WebSocket.OPEN = 1;
    window.WebSocket.CLOSING = 2;
    window.WebSocket.CLOSED = 3;
  }
})();
`,
            },
          ];
        },
      },
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: false,
      watch: null,
    },
  };
});

