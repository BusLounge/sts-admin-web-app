import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('renders a smoke widget', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: Center(child: Text('Notification Portal')),
        ),
      ),
    );

    expect(find.text('Notification Portal'), findsOneWidget);
  });
}
