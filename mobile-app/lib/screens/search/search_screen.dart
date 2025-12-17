import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../services/api_service.dart';
import '../../models/file.dart';
import '../../models/folder.dart';
import '../../utils/performance_optimizer.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _searchController = TextEditingController();
  List<FileItem> _files = [];
  List<FolderItem> _folders = [];
  bool _isLoading = false;
  String? _error;
  String? _selectedType;
  String? _selectedMimeType;
  DateTime? _dateFrom;
  DateTime? _dateTo;
  Timer? _debounceTimer;

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    // Debouncing optimisé avec PerformanceOptimizer
    PerformanceOptimizer.debounce(
      'search',
      const Duration(milliseconds: 500),
      _performSearch,
    );
  }

  Future<void> _performSearch() async {
    if (_searchController.text.trim().isEmpty) {
      setState(() {
        _files = [];
        _folders = [];
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await _apiService.search(
        query: _searchController.text.trim(),
        type: _selectedType,
        mimeType: _selectedMimeType,
        dateFrom: _dateFrom?.toIso8601String(),
        dateTo: _dateTo?.toIso8601String(),
      );

      if (response.statusCode == 200) {
        final data = response.data['data'] ?? {};
        final items = data['items'] ?? [];
        
        setState(() {
          _files = [];
          _folders = [];
          
          for (var item in items) {
            if (item['type'] == 'file' || item['folder_id'] != null) {
              _files.add(FileItem.fromJson(item));
            } else {
              _folders.add(FolderItem.fromJson(item));
            }
          }
          
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: const Text('Recherche'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    labelText: 'Rechercher...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              _performSearch();
                            },
                          )
                        : null,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  onSubmitted: (_) => _performSearch(),
                  onChanged: (_) {
                    // Recherche en temps réel après un délai
                    Future.delayed(const Duration(milliseconds: 500), () {
                      if (_searchController.text.trim().isNotEmpty) {
                        _performSearch();
                      }
                    });
                  },
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _selectedType,
                        decoration: const InputDecoration(
                          labelText: 'Type',
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                        items: const [
                          DropdownMenuItem(value: null, child: Text('Tous')),
                          DropdownMenuItem(value: 'file', child: Text('Fichiers')),
                          DropdownMenuItem(value: 'folder', child: Text('Dossiers')),
                        ],
                        onChanged: (value) {
                          setState(() {
                            _selectedType = value;
                          });
                          _performSearch();
                        },
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _selectedMimeType,
                        decoration: const InputDecoration(
                          labelText: 'Format',
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                        items: const [
                          DropdownMenuItem(value: null, child: Text('Tous')),
                          DropdownMenuItem(value: 'image', child: Text('Images')),
                          DropdownMenuItem(value: 'video', child: Text('Vidéos')),
                          DropdownMenuItem(value: 'audio', child: Text('Audio')),
                          DropdownMenuItem(value: 'application/pdf', child: Text('PDF')),
                          DropdownMenuItem(value: 'text', child: Text('Texte')),
                        ],
                        onChanged: (value) {
                          setState(() {
                            _selectedMimeType = value;
                          });
                          _performSearch();
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                // Filtres par date
                Row(
                  children: [
                    Expanded(
                      child: InkWell(
                        onTap: () async {
                          final date = await showDatePicker(
                            context: context,
                            initialDate: _dateFrom ?? DateTime.now(),
                            firstDate: DateTime(2000),
                            lastDate: DateTime.now(),
                          );
                          if (date != null) {
                            setState(() {
                              _dateFrom = date;
                            });
                            _performSearch();
                          }
                        },
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.calendar_today, size: 20),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _dateFrom != null
                                      ? '${_dateFrom!.day}/${_dateFrom!.month}/${_dateFrom!.year}'
                                      : 'Date début',
                                  style: TextStyle(
                                    color: _dateFrom != null ? Colors.black : Colors.grey,
                                  ),
                                ),
                              ),
                              if (_dateFrom != null)
                                IconButton(
                                  icon: const Icon(Icons.clear, size: 16),
                                  onPressed: () {
                                    setState(() {
                                      _dateFrom = null;
                                    });
                                    _performSearch();
                                  },
                                ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: InkWell(
                        onTap: () async {
                          final date = await showDatePicker(
                            context: context,
                            initialDate: _dateTo ?? DateTime.now(),
                            firstDate: _dateFrom ?? DateTime(2000),
                            lastDate: DateTime.now(),
                          );
                          if (date != null) {
                            setState(() {
                              _dateTo = date;
                            });
                            _performSearch();
                          }
                        },
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.calendar_today, size: 20),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _dateTo != null
                                      ? '${_dateTo!.day}/${_dateTo!.month}/${_dateTo!.year}'
                                      : 'Date fin',
                                  style: TextStyle(
                                    color: _dateTo != null ? Colors.black : Colors.grey,
                                  ),
                                ),
                              ),
                              if (_dateTo != null)
                                IconButton(
                                  icon: const Icon(Icons.clear, size: 16),
                                  onPressed: () {
                                    setState(() {
                                      _dateTo = null;
                                    });
                                    _performSearch();
                                  },
                                ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          if (_isLoading)
            const Expanded(
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_error != null)
            Expanded(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline, size: 64, color: Colors.red),
                    const SizedBox(height: 16),
                    Text(_error!),
                  ],
                ),
              ),
            )
          else if (_files.isEmpty && _folders.isEmpty && _searchController.text.isNotEmpty)
            Expanded(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.search_off, size: 64, color: Colors.grey),
                    const SizedBox(height: 16),
                    const Text('Aucun résultat trouvé'),
                  ],
                ),
              ),
            )
          else
            Expanded(
              child: ListView.builder(
                itemCount: _folders.length + _files.length,
                itemBuilder: (context, index) {
                  // Validation de l'index pour éviter out of bounds
                  if (index < 0 || index >= _folders.length + _files.length) {
                    return const SizedBox.shrink();
                  }
                  
                  if (index < _folders.length) {
                    final folder = _folders[index];
                    // Validation supplémentaire
                    if (folder.id.isEmpty || folder.name.isEmpty) {
                      return const SizedBox.shrink();
                    }
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
                      subtitle: const Text('Dossier'),
                      onTap: () {
                        // TODO: Naviguer vers le dossier
                      },
                    );
                  } else {
                    final fileIndex = index - _folders.length;
                    // Validation de l'index du fichier
                    if (fileIndex < 0 || fileIndex >= _files.length) {
                      return const SizedBox.shrink();
                    }
                    
                    final file = _files[fileIndex];
                    // Validation supplémentaire
                    if (file.id.isEmpty || file.name.isEmpty) {
                      return const SizedBox.shrink();
                    }
                    IconData icon;
                    Color iconColor;
                    
                    if (file.isImage) {
                      icon = Icons.image;
                      iconColor = Colors.green;
                    } else if (file.isVideo) {
                      icon = Icons.video_library;
                      iconColor = Colors.purple;
                    } else if (file.isAudio) {
                      icon = Icons.audiotrack;
                      iconColor = Colors.orange;
                    } else if (file.isPdf) {
                      icon = Icons.picture_as_pdf;
                      iconColor = Colors.red;
                    } else if (file.isText) {
                      icon = Icons.text_snippet;
                      iconColor = Colors.blue;
                    } else {
                      icon = Icons.insert_drive_file;
                      iconColor = Colors.grey;
                    }
                    
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
                        // TODO: Naviguer vers le fichier
                      },
                    );
                  }
                },
              ),
            ),
        ],
      ),
    );
  }
}
