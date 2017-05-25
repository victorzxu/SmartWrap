import "jquery-ui/themes/base/all.css";
import "jquery-ui/themes/base/theme.css";
import "../styles/smartwrap.css";
import "../styles/sidebar.css";

import React from "react";
import ReactDOM from "react-dom";
import {Frame} from "yxl-sidebar";
import onReady from "./content_script";
main();

function main() {
  if (Frame.isReady()) {
    Frame.toggle();
  } else {
    document.addEventListener('DOMContentLoaded',boot());
  }
}

function boot() {
  const root = document.createElement('div');
  if (document.body !== null) {
    document.body.appendChild(root);
  }

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

  ReactDOM.render(App, root,() => {onReady()});
}
