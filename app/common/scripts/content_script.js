/**
 * Created by Xiao Liang Yu <me@hiubright.com> Code name: yxl
 */

import jQuery from "jquery";
import {Smartwrap} from './smartwrap';
import prefutil from "./prefutil";
import main from './sidebar';
import Interaction from './smartwrap-interaction';

// import swp from './smartwrap-page';




const $ = jQuery;

localStorage.debug = true;
import bow from 'bows';
const log = bow('content_script');

main(onReady);

function onReady() {

  const frame = $('#yxl_sidebar');
  console.log('content_script!');
  jQuery(document).bind("dragstart", event => {
    console.log("dragstart");
    console.log(Interaction.SelectTextSelector.registerListeners.call(document));
    //interaction.SelectTextSelector(event);
  });
  frame.find('iframe').on('load',()=>{
    function checkLoad(event, detail) {
      if (!detail) {
        detail = {};

        detail.target = event.target;
        detail.cause = event.type;
        detail.document = (!!event.target.ownerDocument) ? event.target.ownerDocument : event.target;
      }

      var root = document.documentElement;

      // yxl: Not always inject content_script anymore so this is useless
      // if (jQuery(root).hasClass("sidebarHidden")) {
      //   return;
      // }

      //event.originalEvent.originalTarget.defaultView.addEventListener("load", function() { alert("um"); }, true);

      //setTimeout(function() { alert("LOADED: " +  detail.document.documentURI); }, 5000);

      detail.readyState = detail.document.readyState;

      const body = jQuery(detail.document).find("body");
      var t = 1 + (body.data("iters") || 0);
      Smartwrap.log({
        ITERS: body.data("iters"),
        T: t
      });
      body.data("iters", t);

      Smartwrap.log({
        FOO: "bar",
        CALLS: t,
        DATA: body.data("opacity"),
        CSS: body.css("opacity"),
        URL: detail.document.documentURI
      });

      body.data("opacity", body.data("opacity") || body.css("opacity"));

      if (!(detail.readyState === "complete")) {
        var dim = 0.8 - Math.exp(logO + t * logP);
        body.css("opacity", dim);
        Smartwrap.emit(jQuery(detail.target), "page_loading", {
          readyState: detail.readyState,
          done: false
        });
        setTimeout(() => {
          checkLoad(event, detail);
        }, 1000);
        return;
      }
      //jQuery("#msg").text(JSON.stringify({UNDIM: body.data("opacity")}));;
      //body.css("opacity", body.data("opacity"));
      if (false) {
        body.animate({
          "opacity": 1
        }, 1000);
      } else {
        body.css("opacity", 1);
      }
      Smartwrap.emit(jQuery(detail.target), "page_loading", {
        readyState: detail.readyState,
        done: true
      });

      Smartwrap.log({
        TGTEVENT: 2,
        TYPE: event.type,
        KEYS: Object.keys(detail),
        READY: detail.document.readyState,
        HASBODY: !!detail.document.body,
        HASDOC: !!detail.target.ownerDocument
      });
      var evt = document.createEvent("CustomEvent");
      evt.initCustomEvent("sw_targetdocument", true, false, detail);
      document.dispatchEvent(evt);
    };

    jQuery(frame).bind("DOMContentLoaded mouseover load", event => {
      checkLoad(event);
    });
  });


}

export default onReady;
