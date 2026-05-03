import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/models/pending_notification.dart';
import '../../core/state/app_state.dart';
import '../details/notification_detail_screen.dart';

class NotificationInboxScreen extends StatefulWidget {
  const NotificationInboxScreen({super.key});

  @override
  State<NotificationInboxScreen> createState() => _NotificationInboxScreenState();
}

class _NotificationInboxScreenState extends State<NotificationInboxScreen> {
  NotificationType? _selectedType;
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final isCompactScreen = mediaQuery.size.height < 760 || mediaQuery.size.width < 380;
    final textScale = mediaQuery.textScaleFactor.clamp(1.0, 1.3);
    final descriptionMaxLines = isCompactScreen ? 4 : 3;
    final headerTopPadding = mediaQuery.padding.top + kToolbarHeight + 12;
    final estimatedDescriptionHeight = (descriptionMaxLines * 20.0) * textScale;
    final headerExpandedHeight = headerTopPadding + 48 + estimatedDescriptionHeight + 20;

    final state = context.watch<AppState>();
    final notifications = _filteredNotifications(state.notifications);
    final counts = _typeCounts(state.notifications);

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () => context.read<AppState>().refreshNotifications(),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverAppBar(
              pinned: true,
              floating: false,
              expandedHeight: headerExpandedHeight,
              backgroundColor: const Color(0xFF07111D),
              automaticallyImplyLeading: false,
              title: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF62D1FF), Color(0xFF2DD4BF)],
                      ),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(Icons.notifications_rounded, color: Color(0xFF07111D)),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Notification Portal', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
                      Text('${state.totalPendingCount} pending items', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: const Color(0xFF9AA9BD))),
                    ],
                  ),
                ],
              ),
              actions: [
                IconButton(
                  onPressed: state.isLoading ? null : () => context.read<AppState>().refreshNotifications(),
                  icon: const Icon(Icons.refresh_rounded),
                ),
                PopupMenuButton<String>(
                  onSelected: (value) {
                    if (value == 'logout') {
                      context.read<AppState>().logout();
                    }
                  },
                  itemBuilder: (_) => const [
                    PopupMenuItem<String>(value: 'logout', child: Text('Sign out')),
                  ],
                ),
              ],
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFF07111D), Color(0xFF0B1D31), Color(0xFF07111D)],
                    ),
                  ),
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(20, headerTopPadding, 20, 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Pending reviews', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
                        const SizedBox(height: 8),
                        Text(
                          'All pending bus, driver, conductor, lounge, bus owner, and lounge owner submissions are collected here.',
                          maxLines: descriptionMaxLines,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: const Color(0xFF9AA9BD), height: 1.4),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextField(
                      onChanged: (value) => setState(() => _searchQuery = value),
                      decoration: const InputDecoration(
                        hintText: 'Search by title, type, or field value',
                        prefixIcon: Icon(Icons.search_rounded),
                      ),
                    ),
                    if (state.errorMessage != null && state.errorMessage!.trim().isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF3A1020),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0x66F43F5E)),
                        ),
                        child: Text(
                          state.errorMessage!,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(color: const Color(0xFFFECACA)),
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),
                    SizedBox(
                      height: 40,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        children: [
                          Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: FilterChip(
                              selected: _selectedType == null,
                              label: const Text('All'),
                              onSelected: (_) => setState(() => _selectedType = null),
                            ),
                          ),
                          for (final type in NotificationType.values)
                            Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: FilterChip(
                                selected: _selectedType == type,
                                label: Text(type.displayLabel),
                                avatar: Icon(type.icon, size: 18, color: type.color),
                                onSelected: (_) => setState(() => _selectedType = type),
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(child: _SummaryCard(label: 'Pending', value: '${state.totalPendingCount}', accent: const Color(0xFF62D1FF))),
                        const SizedBox(width: 12),
                        Expanded(child: _SummaryCard(label: 'Visible', value: '${notifications.length}', accent: const Color(0xFF2DD4BF))),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: NotificationType.values.map((type) {
                        return _MiniCountPill(
                          label: type.displayLabel,
                          count: counts[type] ?? 0,
                          accent: type.color,
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
            ),
            if (state.isLoading && state.notifications.isEmpty)
              const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              )
            else if (notifications.isEmpty)
              SliverFillRemaining(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 92,
                          height: 92,
                          decoration: BoxDecoration(
                            color: const Color(0xFF13233A),
                            borderRadius: BorderRadius.circular(28),
                          ),
                          child: const Icon(Icons.inbox_rounded, size: 44, color: Color(0xFF62D1FF)),
                        ),
                        const SizedBox(height: 16),
                        Text('No pending notifications', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
                        const SizedBox(height: 8),
                        Text(
                          'When there are submissions waiting for review, they will appear here automatically.',
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: const Color(0xFF9AA9BD)),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                sliver: SliverList.separated(
                  itemCount: notifications.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final item = notifications[index];
                    return _NotificationCard(
                      item: item,
                      onTap: () async {
                        await Navigator.of(context).push(
                          MaterialPageRoute<void>(builder: (_) => NotificationDetailScreen(notification: item)),
                        );
                      },
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }

  List<PendingNotification> _filteredNotifications(List<PendingNotification> notifications) {
    final query = _searchQuery.trim().toLowerCase();
    return notifications.where((item) {
      final matchesType = _selectedType == null || item.type == _selectedType;
      final searchable = <String>[item.title, item.message, item.type.displayLabel, ...item.fields.map((field) => '${field.label} ${field.value}')].join(' ').toLowerCase();
      final matchesQuery = query.isEmpty || searchable.contains(query);
      return matchesType && matchesQuery;
    }).toList();
  }

  Map<NotificationType, int> _typeCounts(List<PendingNotification> notifications) {
    return {
      for (final type in NotificationType.values) type: notifications.where((item) => item.type == type).length,
    };
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.label, required this.value, required this.accent});

  final String label;
  final String value;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0F1B2D),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: const Color(0xFF9AA9BD))),
          const SizedBox(height: 10),
          Text(value, style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800, color: accent)),
        ],
      ),
    );
  }
}

class _MiniCountPill extends StatelessWidget {
  const _MiniCountPill({required this.label, required this.count, required this.accent});

  final String label;
  final int count;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: accent.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: accent.withValues(alpha: 0.24)),
      ),
      child: Text('$label • $count', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: accent, fontWeight: FontWeight.w700)),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({required this.item, required this.onTap});

  final PendingNotification item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: const Color(0xFF0F1B2D),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0x1FFFFFFF)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 54,
              height: 54,
              decoration: BoxDecoration(
                color: item.type.color.withValues(alpha: 0.16),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Icon(item.type.icon, color: item.type.color),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          item.title,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
                        ),
                      ),
                      _TypeChip(type: item.type),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    item.message,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: const Color(0xFF9AA9BD), height: 1.45),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Icon(Icons.schedule_rounded, size: 16, color: const Color(0xFF9AA9BD).withValues(alpha: 0.9)),
                      const SizedBox(width: 6),
                      Text('Loaded just now', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: const Color(0xFF9AA9BD))),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
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