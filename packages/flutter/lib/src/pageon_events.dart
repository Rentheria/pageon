import 'pageon_types.dart';

class PageonLoadedEvent {
  const PageonLoadedEvent({required this.totalPages, required this.currentPage});

  final int totalPages;
  final int currentPage;

  factory PageonLoadedEvent.fromJson(Map<String, dynamic> json) {
    return PageonLoadedEvent(
      totalPages: (json['totalPages'] as num?)?.toInt() ?? 0,
      currentPage: (json['currentPage'] as num?)?.toInt() ?? 1,
    );
  }
}

class PageonPageChangeEvent {
  const PageonPageChangeEvent({required this.currentPage, required this.totalPages});

  final int currentPage;
  final int totalPages;

  factory PageonPageChangeEvent.fromJson(Map<String, dynamic> json) {
    return PageonPageChangeEvent(
      currentPage: (json['currentPage'] as num?)?.toInt() ?? 1,
      totalPages: (json['totalPages'] as num?)?.toInt() ?? 0,
    );
  }
}

class PageonRenderingEvent {
  const PageonRenderingEvent({required this.page, required this.inProgress});

  final int page;
  final bool inProgress;

  factory PageonRenderingEvent.fromJson(Map<String, dynamic> json) {
    return PageonRenderingEvent(
      page: (json['page'] as num?)?.toInt() ?? 1,
      inProgress: json['inProgress'] as bool? ?? false,
    );
  }
}

class PageonZoomChangeEvent {
  const PageonZoomChangeEvent({required this.scale});

  final double scale;

  factory PageonZoomChangeEvent.fromJson(Map<String, dynamic> json) {
    return PageonZoomChangeEvent(
      scale: (json['scale'] as num?)?.toDouble() ?? 1,
    );
  }
}

class PageonFitModeChangeEvent {
  const PageonFitModeChangeEvent({required this.fitMode});

  final PageonFitMode fitMode;

  factory PageonFitModeChangeEvent.fromJson(Map<String, dynamic> json) {
    return PageonFitModeChangeEvent(
      fitMode: pageonFitModeFromWire(json['fitMode'] as String?),
    );
  }
}

class PageonLoadingEvent {
  const PageonLoadingEvent({required this.state});

  final PageonLoadingState state;

  factory PageonLoadingEvent.fromJson(Map<String, dynamic> json) {
    return PageonLoadingEvent(
      state: pageonLoadingStateFromWire(json['state'] as String?),
    );
  }
}

class PageonErrorEvent {
  const PageonErrorEvent({required this.message, this.code});

  final String message;
  final String? code;

  factory PageonErrorEvent.fromJson(Map<String, dynamic> json) {
    return PageonErrorEvent(
      message: json['message'] as String? ?? 'Unknown error',
      code: json['code'] as String?,
    );
  }
}

class PageonBridgeEvent {
  const PageonBridgeEvent({required this.type, required this.payload});

  final String type;
  final Map<String, dynamic> payload;

  factory PageonBridgeEvent.fromJson(Map<String, dynamic> json) {
    return PageonBridgeEvent(
      type: json['type'] as String? ?? '',
      payload: (json['payload'] as Map?)?.cast<String, dynamic>() ??
          <String, dynamic>{},
    );
  }
}
