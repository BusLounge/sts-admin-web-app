import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static const Color _background = Color(0xFF07111D);
  static const Color _surface = Color(0xFF0F1B2D);
  static const Color _surfaceAlt = Color(0xFF13233A);
  static const Color _accent = Color(0xFF62D1FF);
  static const Color _textPrimary = Color(0xFFF3F7FC);
  static const Color _textSecondary = Color(0xFF9AA9BD);

  static ThemeData get darkTheme {
    final base = ThemeData.dark();
    final colorScheme = const ColorScheme.dark(
      primary: _accent,
      secondary: Color(0xFF2DD4BF),
      surface: _surface,
      error: Color(0xFFFF6B6B),
      onPrimary: Color(0xFF07111D),
      onSecondary: Color(0xFF07111D),
      onSurface: _textPrimary,
      onError: Color(0xFF07111D),
      brightness: Brightness.dark,
    );

    return base.copyWith(
      colorScheme: colorScheme,
      scaffoldBackgroundColor: _background,
      textTheme: GoogleFonts.manropeTextTheme(base.textTheme).apply(
        bodyColor: _textPrimary,
        displayColor: _textPrimary,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: _textPrimary,
        centerTitle: false,
        elevation: 0,
      ),
      cardTheme: CardThemeData(
        color: _surface,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: _surfaceAlt,
        labelStyle: const TextStyle(color: _textSecondary),
        hintStyle: const TextStyle(color: _textSecondary),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: const BorderSide(color: Color(0x1FFFFFFF)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: const BorderSide(color: _accent, width: 1.2),
        ),
      ),
      chipTheme: base.chipTheme.copyWith(
        backgroundColor: _surfaceAlt,
        selectedColor: _accent.withValues(alpha: 0.16),
        labelStyle: const TextStyle(color: _textPrimary),
        side: const BorderSide(color: Color(0x1FFFFFFF)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: _accent,
          foregroundColor: _background,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          textStyle: GoogleFonts.manrope(fontWeight: FontWeight.w700),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: _accent,
          textStyle: GoogleFonts.manrope(fontWeight: FontWeight.w700),
        ),
      ),
      dividerTheme: const DividerThemeData(color: Color(0x1FFFFFFF), thickness: 1),
      iconTheme: const IconThemeData(color: _textPrimary),
    );
  }
}