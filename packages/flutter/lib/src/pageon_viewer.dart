import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';

import 'pageon_controller.dart';
import 'pageon_events.dart';
import 'pageon_options.dart';
import 'pageon_types.dart';

typedef PageonLoadedCallback = void Function(PageonLoadedEvent event);
typedef PageonPageChangeCallback = void Function(PageonPageChangeEvent event);
typedef PageonErrorCallback = void Function(PageonErrorEvent event);
typedef PageonRenderingCallback = void Function(PageonRenderingEvent event);
typedef PageonZoomChangeCallback = void Function(PageonZoomChangeEvent event);
typedef PageonFitModeChangeCallback = void Function(PageonFitModeChangeEvent event);
typedef PageonLoadingCallback = void Function(PageonLoadingEvent event);

class PageonViewer extends StatefulWidget {
  const PageonViewer({
    super.key,
    required this.src,
    this.animation = PageonAnimation.none,
    this.initialPage = 1,
    this.scale = 1,
    this.preload = 1,
    this.fitMode = PageonFitMode.none,
    this.gestures = true,
    this.responsive = true,
    this.showPageIndicator = true,
    this.controller,
    this.onLoaded,
    this.onPageChange,
    this.onError,
    this.onRendering,
    this.onZoomChange,
    this.onFitModeChange,
    this.onLoading,
  });

  final String src;
  final PageonAnimation animation;
  final int initialPage;
  final double scale;
  final int preload;
  final PageonFitMode fitMode;
  final bool gestures;
  final bool responsive;
  final bool showPageIndicator;
  final PageonController? controller;

  final PageonLoadedCallback? onLoaded;
  final PageonPageChangeCallback? onPageChange;
  final PageonErrorCallback? onError;
  final PageonRenderingCallback? onRendering;
  final PageonZoomChangeCallback? onZoomChange;
  final PageonFitModeChangeCallback? onFitModeChange;
  final PageonLoadingCallback? onLoading;

  @override
  State<PageonViewer> createState() => _PageonViewerState();
}

class _PageonViewerState extends State<PageonViewer> {
  late final WebViewController _webViewController;
  late final PageonController _controller;

  int currentPage = 1;
  int totalPages = 0;
  double currentScale = 1;
  PageonFitMode currentFitMode = PageonFitMode.none;
  PageonLoadingState loadingState = PageonLoadingState.idle;
  bool isReady = false;
  bool hasError = false;

  @override
  void initState() {
    super.initState();
    _controller = widget.controller ?? PageonController();
    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..addJavaScriptChannel('PageonChannel', onMessageReceived: _handleBridgeMessage)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (_) => _initializeBridge(),
        ),
      );
    _bootstrapHtml();
  }

  Future<void> _bootstrapHtml() async {
    final html = await rootBundle.loadString('packages/pageon_flutter/assets/pageon/index.html');
    await _webViewController.loadHtmlString(html);
  }

  Future<void> _initializeBridge() async {
    await _controller.attachWebViewController(_webViewController);
    final options = PageonViewerOptions(
      src: widget.src,
      animation: widget.animation,
      initialPage: widget.initialPage,
      scale: widget.scale,
      preload: widget.preload,
      fitMode: widget.fitMode,
      gestures: widget.gestures,
      responsive: widget.responsive,
      showPageIndicator: widget.showPageIndicator,
    );

    final js = 'window.PageonBridge.init(${options.toBridgeJsLiteral()});';
    await _webViewController.runJavaScript(js);
  }

  void _handleBridgeMessage(JavaScriptMessage message) {
    final eventJson = jsonDecode(message.message) as Map<String, dynamic>;
    final event = PageonBridgeEvent.fromJson(eventJson);

    switch (event.type) {
      case 'ready':
        _controller.markReady();
        setState(() {
          isReady = true;
          hasError = false;
        });
        break;
      case 'loaded':
        final parsed = PageonLoadedEvent.fromJson(event.payload);
        setState(() {
          totalPages = parsed.totalPages;
          currentPage = parsed.currentPage;
          loadingState = PageonLoadingState.idle;
        });
        widget.onLoaded?.call(parsed);
        break;
      case 'pageChange':
        final parsed = PageonPageChangeEvent.fromJson(event.payload);
        setState(() {
          currentPage = parsed.currentPage;
          totalPages = parsed.totalPages;
        });
        widget.onPageChange?.call(parsed);
        break;
      case 'rendering':
        final parsed = PageonRenderingEvent.fromJson(event.payload);
        widget.onRendering?.call(parsed);
        break;
      case 'zoomChange':
        final parsed = PageonZoomChangeEvent.fromJson(event.payload);
        setState(() => currentScale = parsed.scale);
        widget.onZoomChange?.call(parsed);
        break;
      case 'fitModeChange':
        final parsed = PageonFitModeChangeEvent.fromJson(event.payload);
        setState(() => currentFitMode = parsed.fitMode);
        widget.onFitModeChange?.call(parsed);
        break;
      case 'loading':
        final parsed = PageonLoadingEvent.fromJson(event.payload);
        setState(() => loadingState = parsed.state);
        widget.onLoading?.call(parsed);
        break;
      case 'error':
        final parsed = PageonErrorEvent.fromJson(event.payload);
        setState(() {
          hasError = true;
          loadingState = PageonLoadingState.error;
        });
        widget.onError?.call(parsed);
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        WebViewWidget(controller: _webViewController),
        if (kDebugMode && hasError)
          const Align(
            alignment: Alignment.topCenter,
            child: ColoredBox(
              color: Colors.red,
              child: Padding(
                padding: EdgeInsets.all(8),
                child: Text('Pageon error', style: TextStyle(color: Colors.white)),
              ),
            ),
          ),
      ],
    );
  }
}
