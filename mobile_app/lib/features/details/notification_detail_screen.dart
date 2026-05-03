import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/models/pending_notification.dart';
import '../../core/state/app_state.dart';

class NotificationDetailScreen extends StatefulWidget {
  const NotificationDetailScreen({super.key, required this.notification});

  final PendingNotification notification;

  @override
  State<NotificationDetailScreen> createState() => _NotificationDetailScreenState();
}

class _NotificationDetailScreenState extends State<NotificationDetailScreen> {
  final _documentsController = TextEditingController();

  @override
  void dispose() {
    _documentsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final notification = widget.notification;
    final state = context.watch<AppState>();

    return Scaffold(
      body: Stack(
        children: [
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF07111D), Color(0xFF0B1D31), Color(0xFF07111D)],
              ),
            ),
          ),
          SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: () => Navigator.of(context).pop(),
                        icon: const Icon(Icons.arrow_back_rounded),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(notification.title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
                            Text('${notification.type.displayLabel} review', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: const Color(0xFF9AA9BD))),
                          ],
                        ),
                      ),
                      _TypeChip(type: notification.type),
                    ],
                  ),
                ),
                Expanded(
                  child: Container(
                    decoration: const BoxDecoration(
                      color: Color(0xFF07111D),
                      borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
                    ),
                    child: ListView(
                      padding: const EdgeInsets.fromLTRB(20, 24, 20, 28),
                      children: [
                        _HeroCard(notification: notification),
                        const SizedBox(height: 18),
                        _SectionCard(
                          title: 'Request Message',
                          child: Text(
                            notification.message,
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: const Color(0xFFD9E1EC), height: 1.55),
                          ),
                        ),
                        const SizedBox(height: 18),
                        _SectionCard(
                          title: 'Details',
                          child: LayoutBuilder(
                            builder: (context, constraints) {
                              final columns = constraints.maxWidth >= 720 ? 2 : 1;
                              return GridView.builder(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: notification.fields.length,
                                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: columns,
                                  mainAxisSpacing: 12,
                                  crossAxisSpacing: 12,
                                  childAspectRatio: columns == 1 ? 2.9 : 3.4,
                                ),
                                itemBuilder: (context, index) {
                                  final field = notification.fields[index];
                                  return _FieldTile(field: field);
                                },
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 18),
                        _SectionCard(
                          title: 'Documents',
                          subtitle: 'Add approval documents, links, or verification notes before approving this request.',
                          child: TextField(
                            controller: _documentsController,
                            maxLines: 4,
                            decoration: const InputDecoration(
                              hintText: 'Enter document details, links, or verification notes here...',
                              alignLabelWithHint: true,
                            ),
                          ),
                        ),
                        const SizedBox(height: 18),
                        _ActionBar(
                          isLoading: state.isLoading,
                          onReject: () => _openRejectSheet(context, notification),
                          onApprove: () => _handleApprove(context, notification),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleApprove(BuildContext context, PendingNotification notification) async {
    final state = context.read<AppState>();
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    try {
      await state.approve(notification, _documentsController.text);
      if (!mounted) {
        return;
      }
      messenger.showSnackBar(const SnackBar(content: Text('Request approved')));
      navigator.pop();
    } catch (error) {
      if (!mounted) {
        return;
      }
      messenger.showSnackBar(SnackBar(content: Text(error.toString())));
    }
  }

  Future<void> _openRejectSheet(BuildContext context, PendingNotification notification) async {
    final reasons = <String>[
      'Details were missing or incorrect.',
      'A duplicate request already exists.',
      'The request was not approved by the authorities.',
      'System could not process this request.',
    ];

    final selectedReasons = <String>{};
    final otherController = TextEditingController();
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    final state = context.read<AppState>();

    try {
      final result = await showModalBottomSheet<String>(
        context: context,
        isScrollControlled: true,
        backgroundColor: const Color(0xFF0F1B2D),
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
        builder: (sheetContext) {
          return Padding(
            padding: EdgeInsets.only(
              left: 20,
              right: 20,
              top: 20,
              bottom: MediaQuery.of(sheetContext).viewInsets.bottom + 20,
            ),
            child: StatefulBuilder(
              builder: (context, setState) {
                final combinedReasons = <String>[...selectedReasons];
                if (otherController.text.trim().isNotEmpty) {
                  combinedReasons.add(otherController.text.trim());
                }

                return SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Center(
                        child: Container(
                          width: 48,
                          height: 5,
                          decoration: BoxDecoration(
                            color: const Color(0xFF9AA9BD).withValues(alpha: 0.4),
                            borderRadius: BorderRadius.circular(999),
                          ),
                        ),
                      ),
                      const SizedBox(height: 18),
                      Text('Reject request', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
                      const SizedBox(height: 8),
                      Text('Choose one or more reasons, or add a custom note before rejecting this ${notification.type.displayLabel.toLowerCase()} request.', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: const Color(0xFF9AA9BD), height: 1.45)),
                      const SizedBox(height: 16),
                      ...reasons.map((reason) {
                        final selected = selectedReasons.contains(reason);
                        return CheckboxListTile(
                          value: selected,
                          onChanged: (value) {
                            setState(() {
                              if (value == true) {
                                selectedReasons.add(reason);
                              } else {
                                selectedReasons.remove(reason);
                              }
                            });
                          },
                          title: Text(reason),
                          controlAffinity: ListTileControlAffinity.leading,
                          contentPadding: EdgeInsets.zero,
                        );
                      }),
                      const SizedBox(height: 8),
                      TextField(
                        controller: otherController,
                        maxLines: 3,
                        decoration: const InputDecoration(
                          labelText: 'Other note',
                          hintText: 'Add a custom rejection note',
                        ),
                      ),
                      const SizedBox(height: 20),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => Navigator.of(sheetContext).pop(),
                              child: const Text('Cancel'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () {
                                if (combinedReasons.isEmpty) {
                                  Navigator.of(sheetContext).pop('');
                                  return;
                                }
                                Navigator.of(sheetContext).pop(combinedReasons.join(' | '));
                              },
                              child: const Text('Send'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
          );
        },
      );

      if (result == null) {
        return;
      }

      await state.reject(notification, result);
      if (!mounted) {
        return;
      }
      messenger.showSnackBar(const SnackBar(content: Text('Request rejected')));
      navigator.pop();
    } finally {
      otherController.dispose();
    }
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({required this.notification});

  final PendingNotification notification;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF0F1B2D),
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Row(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: notification.type.color.withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Icon(notification.type.icon, color: notification.type.color, size: 30),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(notification.title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 6),
                Text('Pending review from the Go backend', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: const Color(0xFF9AA9BD))),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.child, this.subtitle});

  final String title;
  final String? subtitle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFF0F1B2D),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
          if (subtitle != null) ...[
            const SizedBox(height: 6),
            Text(subtitle!, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: const Color(0xFF9AA9BD), height: 1.45)),
          ],
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }
}

class _FieldTile extends StatelessWidget {
  const _FieldTile({required this.field});

  final NotificationField field;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF13233A),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(field.label, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: const Color(0xFF9AA9BD))),
          const SizedBox(height: 8),
          Text(
            field.value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700, height: 1.4),
            maxLines: field.multiline ? 4 : 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _ActionBar extends StatelessWidget {
  const _ActionBar({required this.isLoading, required this.onReject, required this.onApprove});

  final bool isLoading;
  final VoidCallback onReject;
  final VoidCallback onApprove;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton.icon(
            onPressed: isLoading ? null : onReject,
            icon: const Icon(Icons.close_rounded),
            label: const Text('Reject'),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton.icon(
            onPressed: isLoading ? null : onApprove,
            icon: const Icon(Icons.check_rounded),
            label: isLoading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF07111D)),
                  )
                : const Text('Approve'),
          ),
        ),
      ],
    );
  }
}

class _TypeChip extends StatelessWidget {
  const _TypeChip({required this.type});

  final NotificationType type;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: type.color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        type.displayLabel,
        style: TextStyle(color: type.color, fontSize: 12, fontWeight: FontWeight.w800),
      ),
    );
  }
}