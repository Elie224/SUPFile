import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../models/file.dart';
import '../../models/folder.dart';

/// Widget optimisé pour les fichiers (réduit les rebuilds)
class _FileItemWidget extends StatelessWidget {
  final FileItem file;
  final IconData icon;
  final Color iconColor;
  
  const _FileItemWidget({
    required this.file,
    required this.icon,
    required this.iconColor,
  });
  
  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: iconColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: iconColor, size: 24),
      ),
      title: Text(file.name),
      subtitle: Text('${file.formattedSize} • ${file.mimeType ?? 'Fichier'}'),
      onTap: () {
        context.go('/preview/${file.id}');
      },
      trailing: PopupMenuButton(
        itemBuilder: (context) => const [
          PopupMenuItem(
            value: 'share',
            child: Row(
              children: [
                Icon(Icons.share, size: 20),
                SizedBox(width: 8),
                Text('Partager'),
              ],
            ),
          ),
          PopupMenuItem(
            value: 'download',
            child: Row(
              children: [
                Icon(Icons.download, size: 20),
                SizedBox(width: 8),
                Text('Télécharger'),
              ],
            ),
          ),
          PopupMenuItem(
            value: 'move',
            child: Row(
              children: [
                Icon(Icons.drive_file_move, size: 20),
                SizedBox(width: 8),
                Text('Déplacer'),
              ],
            ),
          ),
          PopupMenuItem(
            value: 'rename',
            child: Row(
              children: [
                Icon(Icons.edit, size: 20),
                SizedBox(width: 8),
                Text('Renommer'),
              ],
            ),
          ),
          PopupMenuItem(
            value: 'delete',
            child: Row(
              children: [
                Icon(Icons.delete, size: 20, color: Colors.red),
                SizedBox(width: 8),
                Text('Supprimer', style: TextStyle(color: Colors.red)),
              ],
            ),
          ),
        ],
        onSelected: (value) {
          // Les actions sont gérées par le parent
        },
      ),
    );
  }
}

/// Widget optimisé pour les dossiers
class _FolderItemWidget extends StatelessWidget {
  final FolderItem folder;
  
  const _FolderItemWidget({required this.folder});
  
  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.blue.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Icon(Icons.folder, color: Colors.blue, size: 24),
      ),
      title: Text(folder.name),
      subtitle: Text('Dossier'),
      onTap: () {
        context.go('/files?folder=${folder.id}');
      },
      trailing: PopupMenuButton(
        itemBuilder: (context) => const [
          PopupMenuItem(
            value: 'share',
            child: Row(
              children: [
                Icon(Icons.share, size: 20),
                SizedBox(width: 8),
                Text('Partager'),
              ],
            ),
          ),
          PopupMenuItem(
            value: 'download',
            child: Row(
              children: [
                Icon(Icons.download, size: 20),
                SizedBox(width: 8),
                Text('Télécharger (ZIP)'),
              ],
            ),
          ),
          PopupMenuItem(
            value: 'move',
            child: Row(
              children: [
                Icon(Icons.drive_file_move, size: 20),
                SizedBox(width: 8),
                Text('Déplacer'),
              ],
            ),
          ),
          PopupMenuItem(
            value: 'rename',
            child: Row(
              children: [
                Icon(Icons.edit, size: 20),
                SizedBox(width: 8),
                Text('Renommer'),
              ],
            ),
          ),
          PopupMenuItem(
            value: 'delete',
            child: Row(
              children: [
                Icon(Icons.delete, size: 20, color: Colors.red),
                SizedBox(width: 8),
                Text('Supprimer', style: TextStyle(color: Colors.red)),
              ],
            ),
          ),
        ],
        onSelected: (value) {
          // Les actions sont gérées par le parent
        },
      ),
    );
  }
}




