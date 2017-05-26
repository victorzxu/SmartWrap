import "jquery-ui/themes/base/all.css";
import "jquery-ui/themes/base/theme.css";
import "../styles/smartwrap.css";
import "../styles/sidebar.css";

import React from "react";
import ReactDOM from "react-dom";
import {Frame} from "yxl-sidebar";

let frame;

class App extends React.Component {

  render() {

    const divStyle = {
      resize: 'horizontal',
      overflow: 'auto',
    };

    return (
      <div style={divStyle}
          id="yxl_sidebar">
          <h1> LOADED </h1>
        <Frame url={chrome.extension.getURL("pages/smartwrap.html")}/>
      </div>
    );
  }
}


function main(cb) {

  //TODO: ZD - This is temporary, have to be careful
    "use strict";
    if (Frame.isReady()) {
      Frame.toggle();
    } else {
      console.log('!!!!!');
      boot(cb);
    }

}

function boot(cb) {
  const root = document.createElement('div');
  if (document.body !== null) {
    document.body.appendChild(root);
  }

  ReactDOM.render(<App />, root, ()=>{
    "use strict";
    console.log('?????');
    cb();
  });
}

export default main;
