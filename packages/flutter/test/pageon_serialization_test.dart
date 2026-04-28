import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:pageon_flutter/src/pageon_events.dart';
import 'package:pageon_flutter/src/pageon_options.dart';
import 'package:pageon_flutter/src/pageon_types.dart';

void main() {
  test('serializa opciones para bridge', () {
    final options = PageonViewerOptions(
      src: 'assets/sample.pdf',
      animation: PageonAnimation.slide,
      fitMode: PageonFitMode.width,
    );

    final json = options.toJson();
    expect(json['animation'], 'slide');
    expect(json['fitMode'], 'width');
    expect(json['sourceType'], 'asset');
  });

  test('parsea eventos JSON', () {
    final raw = jsonDecode('{"type":"pageChange","payload":{"currentPage":2,"totalPages":10}}')
        as Map<String, dynamic>;
    final event = PageonBridgeEvent.fromJson(raw);
    final pageChange = PageonPageChangeEvent.fromJson(event.payload);

    expect(event.type, 'pageChange');
    expect(pageChange.currentPage, 2);
    expect(pageChange.totalPages, 10);
  });

  test('conversión de enums desde wire', () {
    expect(pageonFitModeFromWire('page'), PageonFitMode.page);
    expect(pageonLoadingStateFromWire('renderingPage'), PageonLoadingState.renderingPage);
  });
}
