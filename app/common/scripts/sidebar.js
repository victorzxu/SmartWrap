import "jquery-ui/themes/base/all.css";
import "jquery-ui/themes/base/theme.css";
import "../styles/smartwrap.css";
import "../styles/sidebar.css";
import $ from 'jquery';

import React from "react";
import ReactDOM from "react-dom";
import {Frame} from "yxl-sidebar";

let frame;

class App extends React.Component {

  componentDidMount() {
    console.log('mounted');
  }

  render() {

    const divStyle = {
      resize: 'horizontal',
      overflow: 'auto',
    };

    return (
      <div style={divStyle}
          id="yxl_sidebar">
        <Frame id = "my_iframe" url={chrome.extension.getURL("pages/smartwrap.html")}/>
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
      var url = chrome.extension.getURL("pages/smartwrap-inject.html");
      var newDiv = document.createElement('div');
      var script = document.createElement('script');
      script.src = chrome.extension.getURL("scripts/smartwrap-page.html");
      script.type = "text/javascript";
      newDiv.setAttribute("id","newdiv");
      document.body.appendChild(newDiv);
      $('#newdiv').load(url);
      $('#newdiv').ready()
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
    cb();
  });
}

export default main;
