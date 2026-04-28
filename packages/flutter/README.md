# pageon_flutter

Wrapper de Flutter para Pageon basado en WebView (Fase 5).

## Instalación

```yaml
dependencies:
  pageon_flutter:
    path: ../packages/flutter
```

## Configuración en `pubspec.yaml`

Incluye los assets del PDF y del viewer:

```yaml
flutter:
  assets:
    - assets/sample.pdf
```

El paquete ya expone internamente `assets/pageon/index.html`, `pageon.bundle.js` y `pageon-bridge.js`.

## Uso básico

```dart
PageonViewer(
  src: 'assets/sample.pdf',
  animation: PageonAnimation.slide,
  fitMode: PageonFitMode.width,
  gestures: true,
)
```

## Uso con controller

```dart
final controller = PageonController();

PageonViewer(
  src: 'assets/sample.pdf',
  controller: controller,
);

await controller.nextPage();
await controller.zoomIn();
await controller.setFitMode(PageonFitMode.page);
```

## Carga desde assets

```dart
PageonViewer(src: 'assets/sample.pdf')
```

## Carga desde URL

```dart
PageonViewer(src: 'https://example.com/sample.pdf')
```

## Callbacks disponibles

- `onLoaded`
- `onPageChange`
- `onError`
- `onRendering`
- `onZoomChange`
- `onFitModeChange`
- `onLoading`

## Limitaciones conocidas (Fase 5)

- Integración basada en WebView.
- El rendimiento depende del dispositivo y WebView nativo.
- PDFs muy grandes pueden consumir más memoria.
- URLs remotas pueden fallar por CORS según servidor y plataforma.
- No existe motor PDF nativo en Dart todavía.

## Roadmap

- Motor nativo opcional para Flutter.
- Capas de anotaciones.
- Búsqueda/selección de texto.
- Mejoras de rendimiento y virtualización.
