import 'package:flutter/material.dart';
import 'package:pageon_flutter/pageon_flutter.dart';

void main() {
  runApp(const DemoApp());
}

class DemoApp extends StatelessWidget {
  const DemoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(home: DemoScreen());
  }
}

class DemoScreen extends StatefulWidget {
  const DemoScreen({super.key});

  @override
  State<DemoScreen> createState() => _DemoScreenState();
}

class _DemoScreenState extends State<DemoScreen> {
  final controller = PageonController();
  int currentPage = 1;
  int totalPages = 0;
  double zoom = 1;
  PageonLoadingState loadingState = PageonLoadingState.idle;
  String? errorMessage;

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pageon Flutter Demo')),
      body: Column(
        children: [
          Expanded(
            child: PageonViewer(
              src: 'assets/sample.pdf',
              controller: controller,
              animation: PageonAnimation.slide,
              fitMode: PageonFitMode.width,
              onLoaded: (e) => setState(() {
                totalPages = e.totalPages;
                currentPage = e.currentPage;
              }),
              onPageChange: (e) => setState(() {
                totalPages = e.totalPages;
                currentPage = e.currentPage;
              }),
              onZoomChange: (e) => setState(() => zoom = e.scale),
              onLoading: (e) => setState(() => loadingState = e.state),
              onError: (e) => setState(() => errorMessage = e.message),
            ),
          ),
          if (errorMessage != null)
            Padding(
              padding: const EdgeInsets.all(8),
              child: Text(errorMessage!, style: const TextStyle(color: Colors.red)),
            ),
          Padding(
            padding: const EdgeInsets.all(8),
            child: Column(
              children: [
                Text('Página: $currentPage / $totalPages'),
                Text('Zoom: ${zoom.toStringAsFixed(2)}x'),
                Text('Loading: ${loadingState.name}'),
              ],
            ),
          ),
          Wrap(
            spacing: 8,
            children: [
              ElevatedButton(onPressed: controller.prevPage, child: const Text('Anterior')),
              ElevatedButton(onPressed: controller.nextPage, child: const Text('Siguiente')),
              ElevatedButton(onPressed: controller.zoomIn, child: const Text('Zoom In')),
              ElevatedButton(onPressed: controller.zoomOut, child: const Text('Zoom Out')),
              ElevatedButton(onPressed: controller.fitWidth, child: const Text('Fit Width')),
              ElevatedButton(
                onPressed: () => controller.setFitMode(PageonFitMode.page),
                child: const Text('Fit Page'),
              ),
            ],
          ),
          const SizedBox(height: 12),
        ],
      ),
    );
  }
}
