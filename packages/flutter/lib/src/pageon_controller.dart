import 'dart:async';
import 'dart:convert';

import 'package:webview_flutter/webview_flutter.dart';

import 'pageon_types.dart';

typedef PageonCommandDispatcher = Future<void> Function(String command);

class PageonController {
  Completer<void> _readyCompleter = Completer<void>();
  PageonCommandDispatcher? _commandDispatcher;
  bool _disposed = false;

  bool get isReady => _readyCompleter.isCompleted;
  bool get isDisposed => _disposed;

  Future<void> attachWebViewController(WebViewController webViewController) async {
    _commandDispatcher = (String command) async {
      await webViewController.runJavaScript(command);
    };
  }

  void attachCommandDispatcher(PageonCommandDispatcher dispatcher) {
    _commandDispatcher = dispatcher;
  }

  void markReady() {
    if (!_readyCompleter.isCompleted) {
      _readyCompleter.complete();
    }
  }

  Future<void> _runCommand(String method, [Map<String, dynamic>? args]) async {
    if (_disposed) return;
    await _readyCompleter.future;
    final dispatcher = _commandDispatcher;
    if (dispatcher == null) return;

    final argsLiteral = args == null ? '' : jsonEncode(args);
    final js = args == null
        ? 'window.PageonBridge.$method();'
        : 'window.PageonBridge.$method($argsLiteral);';
    await dispatcher(js);
  }

  Future<void> nextPage() => _runCommand('nextPage');
  Future<void> prevPage() => _runCommand('prevPage');
  Future<void> goToPage(int page) => _runCommand('goToPage', {'page': page});

  Future<void> zoomIn() => _runCommand('zoomIn');
  Future<void> zoomOut() => _runCommand('zoomOut');
  Future<void> setZoom(double scale) => _runCommand('setZoom', {'scale': scale});
  Future<void> resetZoom() => _runCommand('resetZoom');

  Future<void> fitWidth() => _runCommand('fitWidth');
  Future<void> fitHeight() => _runCommand('fitHeight');
  Future<void> setFitMode(PageonFitMode mode) =>
      _runCommand('setFitMode', {'mode': mode.wireValue});

  Future<void> reload([String? src]) => _runCommand('reload', {'src': src});

  void dispose() {
    _disposed = true;
    _commandDispatcher = null;
    _readyCompleter = Completer<void>();
  }
}
