import { WidgetLauncher } from './launcher';

(function (window, document) {
  'use strict';

  const instances = new Map();
  let instanceCounter = 0;

  function init(config) {
    if (!config || !config.tenantId) {
      console.error('[Echo] tenantId is required');
      return null;
    }

    const instanceId = `echo-${++instanceCounter}`;
    const launcher = new WidgetLauncher(config);
    instances.set(instanceId, launcher);

    return {
      destroy: () => {
        launcher.destroy();
        instances.delete(instanceId);
      },
      update: (newConfig) => {
        launcher.destroy();
        const newLauncher = new WidgetLauncher({ ...config, ...newConfig });
        instances.set(instanceId, newLauncher);
      },
    };
  }

  const EchoWidget = {
    init,
    version: '1.0.0',
  };

  if (typeof window.EchoWidget === 'function') {
    const queue = window.EchoWidget.q || [];
    queue.forEach((args) => {
      const [method, ...params] = args;
      if (method === 'init') {
        EchoWidget.init(...params);
      }
    });
  }

  window.EchoWidget = EchoWidget;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EchoWidget;
  }
})(window, document);
