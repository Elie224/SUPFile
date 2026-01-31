import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/sync_service.dart';
import '../utils/constants.dart';

/// Indicateur de synchronisation : nombre d'opérations en attente + bouton pour lancer la sync.
class SyncIndicator extends StatelessWidget {
  const SyncIndicator({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<SyncService>(
      builder: (context, sync, _) {
        final count = sync.pendingCount;
        if (count == 0) return const SizedBox.shrink();

        return Material(
          elevation: 4,
          borderRadius: BorderRadius.circular(24),
          color: Theme.of(context).colorScheme.surface,
          child: InkWell(
            onTap: sync.isSyncing || !sync.isOnline
                ? null
                : () async {
                    final result = await sync.syncToServer();
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            result.success
                                ? 'Synchronisation terminée (${result.successCount} opération(s))'
                                : 'Synchronisation partielle ou échec',
                          ),
                          backgroundColor:
                              result.success ? AppConstants.successColor : AppConstants.errorColor,
                        ),
                      );
                    }
                  },
            borderRadius: BorderRadius.circular(24),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (sync.isSyncing)
                    const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  else
                    Icon(
                      Icons.sync,
                      size: 20,
                      color: AppConstants.supinfoPurple,
                    ),
                  const SizedBox(width: 8),
                  Text(
                    '$count en attente',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(width: 8),
                  if (!sync.isSyncing && sync.isOnline)
                    Text(
                      'Synchroniser',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppConstants.supinfoPurple,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
