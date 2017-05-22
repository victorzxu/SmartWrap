import "jquery-ui/themes/base/all.css";
import "jquery-ui/themes/base/theme.css";
import "../styles/smartwrap.css";
import "../styles/sidebar.css";

import React from "react";
import ReactDOM from "react-dom";
import {Frame} from "yxl-sidebar";

main();

function main() {
  if (Frame.isReady()) {
    Frame.toggle();
  } else {
    boot();
  }
}

function boot() {
  const root = document.createElement('div');
  document.body.appendChild(root);

  const divStyle = {
    resize: 'horizontal',
    overflow: 'auto',
  };

  //noinspection HtmlDeprecatedTag
  const App = (
    <div style={divStyle}>
    <Frame url={chrome.extension.getURL("pages/smartwrap.html")}/>
    </div>
  );

  ReactDOM.render(App, root)
}
