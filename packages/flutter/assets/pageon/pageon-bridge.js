(function () {
  var viewer = null;

  function post(type, payload) {
    var event = JSON.stringify({ type: type, payload: payload || {} });
    if (window.PageonChannel && typeof window.PageonChannel.postMessage === 'function') {
      window.PageonChannel.postMessage(event);
    }
  }

  function safe(method, payload) {
    try {
      return method(payload);
    } catch (error) {
      post('error', {
        code: 'bridge_error',
        message: error && error.message ? error.message : 'Unknown bridge error'
      });
      return null;
    }
  }

  function subscribeEvents(instance) {
    instance.on('loaded', function (payload) { post('loaded', payload); });
    instance.on('pageChange', function (payload) { post('pageChange', payload); });
    instance.on('rendering', function (payload) { post('rendering', payload); });
    instance.on('zoomChange', function (payload) { post('zoomChange', payload); });
    instance.on('fitModeChange', function (payload) { post('fitModeChange', payload); });
    instance.on('loading', function (payload) { post('loading', payload); });
    instance.on('error', function (payload) { post('error', payload); });
  }

  window.PageonBridge = {
    init: function (options) {
      safe(function () {
        if (!window.Pageon) {
          throw new Error('window.Pageon is not available in WebView context');
        }
        post('loading', { state: 'loadingDocument' });
        viewer = new window.Pageon(Object.assign({}, options, { container: '#app' }));
        subscribeEvents(viewer);
        post('ready', {});
      });
    },
    nextPage: function () { return safe(function () { return viewer && viewer.nextPage(); }); },
    prevPage: function () { return safe(function () { return viewer && viewer.prevPage(); }); },
    goToPage: function (args) { return safe(function () { return viewer && viewer.goToPage(args.page); }); },
    zoomIn: function () { return safe(function () { return viewer && viewer.zoomIn(); }); },
    zoomOut: function () { return safe(function () { return viewer && viewer.zoomOut(); }); },
    setZoom: function (args) { return safe(function () { return viewer && viewer.setZoom(args.scale); }); },
    resetZoom: function () { return safe(function () { return viewer && viewer.resetZoom(); }); },
    fitWidth: function () { return safe(function () { return viewer && viewer.fitWidth(); }); },
    fitHeight: function () { return safe(function () { return viewer && viewer.fitHeight(); }); },
    setFitMode: function (args) { return safe(function () { return viewer && viewer.setFitMode(args.mode); }); },
    reload: function (args) { return safe(function () { return viewer && viewer.reload(args ? args.src : undefined); }); }
  };
})();
