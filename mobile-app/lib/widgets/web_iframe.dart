import 'web_iframe_stub.dart'
    if (dart.library.html) 'web_iframe_html.dart';

import 'package:flutter/widgets.dart';

/// Cross-platform iframe view.
///
/// - On Web: renders an iframe that navigates to [url].
/// - On non-Web: renders a fallback.
class WebIFrame {
  static Widget build({
    required String url,
  }) {
    return buildIFrameImpl(url: url);
  }
}
