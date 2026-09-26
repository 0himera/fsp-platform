import 'package:flutter/material.dart';

class EmptyNotice extends StatelessWidget {
  const EmptyNotice({super.key, required this.text, this.icon});

  final String text;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 48),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: const Color(0xFF161920),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFF272B35)),
                ),
                child: Icon(
                  icon,
                  size: 28,
                  color: const Color(0xFF9AA2B1),
                ),
              ),
              const SizedBox(height: 18),
            ],
            Text(
              text,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 14.5,
                fontWeight: FontWeight.w400,
                color: Color(0xFF9AA2B1),
                height: 1.45,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
