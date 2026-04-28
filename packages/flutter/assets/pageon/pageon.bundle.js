(function () {
  if (window.Pageon) return;

  function noop() {}

  function MockPageon(options) {
    this.options = options || {};
    this.state = {
      currentPage: options.initialPage || 1,
      totalPages: 1,
      scale: options.scale || 1,
      fitMode: options.fitMode || 'none'
    };
    this._listeners = {};
    var self = this;
    setTimeout(function () {
      self._emit('loaded', {
        currentPage: self.state.currentPage,
        totalPages: self.state.totalPages
      });
    }, 40);
  }

  MockPageon.prototype.on = function (name, cb) {
    this._listeners[name] = this._listeners[name] || [];
    this._listeners[name].push(cb);
  };

  MockPageon.prototype._emit = function (name, payload) {
    (this._listeners[name] || []).forEach(function (cb) { cb(payload); });
  };

  MockPageon.prototype.nextPage = function () {
    this.state.currentPage += 1;
    this._emit('pageChange', { currentPage: this.state.currentPage, totalPages: this.state.totalPages });
  };
  MockPageon.prototype.prevPage = function () {
    this.state.currentPage = Math.max(1, this.state.currentPage - 1);
    this._emit('pageChange', { currentPage: this.state.currentPage, totalPages: this.state.totalPages });
  };
  MockPageon.prototype.goToPage = function (page) {
    this.state.currentPage = Math.max(1, page || 1);
    this._emit('pageChange', { currentPage: this.state.currentPage, totalPages: this.state.totalPages });
  };
  MockPageon.prototype.zoomIn = function () {
    this.state.scale += 0.1;
    this._emit('zoomChange', { scale: this.state.scale });
  };
  MockPageon.prototype.zoomOut = function () {
    this.state.scale = Math.max(0.1, this.state.scale - 0.1);
    this._emit('zoomChange', { scale: this.state.scale });
  };
  MockPageon.prototype.setZoom = function (scale) {
    this.state.scale = scale;
    this._emit('zoomChange', { scale: this.state.scale });
  };
  MockPageon.prototype.resetZoom = function () {
    this.state.scale = this.options.scale || 1;
    this._emit('zoomChange', { scale: this.state.scale });
  };
  MockPageon.prototype.fitWidth = noop;
  MockPageon.prototype.fitHeight = noop;
  MockPageon.prototype.setFitMode = function (mode) {
    this.state.fitMode = mode;
    this._emit('fitModeChange', { fitMode: mode });
  };
  MockPageon.prototype.reload = noop;

  window.Pageon = MockPageon;
})();
