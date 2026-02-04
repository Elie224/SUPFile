// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use

import 'dart:html' as html;
import 'dart:ui_web' as ui_web;

import 'package:flutter/widgets.dart';

class _WebIFrameView extends StatefulWidget {
  final String url;
  const _WebIFrameView({required this.url});

  @override
  State<_WebIFrameView> createState() => _WebIFrameViewState();
}

class _WebIFrameViewState extends State<_WebIFrameView> {
  static int _seq = 0;
  late final String _viewType;

  @override
  void initState() {
    super.initState();
    _viewType = 'supfile-iframe-${_seq++}';

    ui_web.platformViewRegistry.registerViewFactory(_viewType, (int viewId) {
      final element = html.IFrameElement()
        ..src = widget.url
        ..style.border = 'none'
        ..style.width = '100%'
        ..style.height = '100%'
        ..setAttribute('allow', 'fullscreen');
      return element;
    });
  }

  @override
  Widget build(BuildContext context) {
    return HtmlElementView(viewType: _viewType);
  }
}

Widget buildIFrameImpl({required String url}) {
  return _WebIFrameView(url: url);
}
