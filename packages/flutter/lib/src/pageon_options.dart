import 'dart:convert';

import 'pageon_types.dart';

class PageonViewerOptions {
  const PageonViewerOptions({
    required this.src,
    this.animation = PageonAnimation.none,
    this.initialPage = 1,
    this.scale = 1,
    this.preload = 1,
    this.fitMode = PageonFitMode.none,
    this.gestures = true,
    this.responsive = true,
    this.showPageIndicator = true,
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

  bool get isRemoteSource =>
      src.startsWith('http://') || src.startsWith('https://');

  Map<String, dynamic> toJson() {
    return {
      'src': src,
      'animation': animation.wireValue,
      'initialPage': initialPage,
      'scale': scale,
      'preload': preload,
      'fitMode': fitMode.wireValue,
      'gestures': gestures,
      'responsive': responsive,
      'showPageIndicator': showPageIndicator,
      'sourceType': isRemoteSource ? 'url' : 'asset',
    };
  }

  String toBridgeJsLiteral() => jsonEncode(toJson());
}
