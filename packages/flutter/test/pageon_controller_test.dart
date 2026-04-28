import 'package:flutter_test/flutter_test.dart';
import 'package:pageon_flutter/src/pageon_controller.dart';
import 'package:pageon_flutter/src/pageon_types.dart';

void main() {
  test('PageonController se crea inicialmente no ready', () {
    final controller = PageonController();
    expect(controller.isReady, isFalse);
    expect(controller.isDisposed, isFalse);
  });

  test('queue de comandos espera ready', () async {
    final controller = PageonController();
    final commands = <String>[];
    controller.attachCommandDispatcher((command) async {
      commands.add(command);
    });

    final future = controller.nextPage();
    await Future<void>.delayed(const Duration(milliseconds: 5));
    expect(commands, isEmpty);

    controller.markReady();
    await future;
    expect(commands.single, contains('nextPage'));
  });

  test('setFitMode serializa enum', () async {
    final controller = PageonController();
    final commands = <String>[];
    controller.attachCommandDispatcher((command) async => commands.add(command));
    controller.markReady();

    await controller.setFitMode(PageonFitMode.page);
    expect(commands.single, contains('"mode":"page"'));
  });

  test('dispose evita enviar comandos', () async {
    final controller = PageonController();
    final commands = <String>[];
    controller.attachCommandDispatcher((command) async => commands.add(command));
    controller.markReady();
    controller.dispose();

    await controller.nextPage();
    expect(controller.isDisposed, isTrue);
    expect(commands, isEmpty);
  });
}
