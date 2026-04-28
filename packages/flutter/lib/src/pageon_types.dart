enum PageonAnimation { none, fade, slide }

enum PageonFitMode { none, width, height, page }

enum PageonLoadingState { idle, loadingDocument, renderingPage, preloading, error }

extension PageonAnimationX on PageonAnimation {
  String get wireValue => name;
}

extension PageonFitModeX on PageonFitMode {
  String get wireValue => name;
}

extension PageonLoadingStateX on PageonLoadingState {
  String get wireValue {
    switch (this) {
      case PageonLoadingState.loadingDocument:
        return 'loadingDocument';
      case PageonLoadingState.renderingPage:
        return 'renderingPage';
      default:
        return name;
    }
  }
}

PageonFitMode pageonFitModeFromWire(String? value) {
  if (value == null) return PageonFitMode.none;
  return PageonFitMode.values.firstWhere(
    (mode) => mode.name == value,
    orElse: () => PageonFitMode.none,
  );
}

PageonLoadingState pageonLoadingStateFromWire(String? value) {
  switch (value) {
    case 'loadingDocument':
      return PageonLoadingState.loadingDocument;
    case 'renderingPage':
      return PageonLoadingState.renderingPage;
    case 'preloading':
      return PageonLoadingState.preloading;
    case 'error':
      return PageonLoadingState.error;
    default:
      return PageonLoadingState.idle;
  }
}
