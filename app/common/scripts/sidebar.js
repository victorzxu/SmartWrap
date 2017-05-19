import "jquery-ui/themes/base/all.css";
import "jquery-ui/themes/base/theme.css";
import "../styles/smartwrap.css";
import "../styles/sidebar.css";

import React from 'react'
import ReactDOM from 'react-dom'
import { Frame } from 'yxl-sidebar'

if (Frame.isReady()) {
  Frame.toggle();
} else {
  boot()
}

function boot() {
  const root = document.createElement('div');
  document.body.appendChild(root);

  const App = (
    <Frame url={"about:blank"} />
  );

  ReactDOM.render(App, root)
}


