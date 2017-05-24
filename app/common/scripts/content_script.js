/**
 * Created by Xiao Liang Yu <me@hiubright.com> Code name: yxl
 */

import jQuery from "jquery";
import {Smartwrap} from './smartwrap';
import prefutil from "./prefutil";
const $ = jQuery;

browser.runtime.onInstalled.addListener(prefutil.initPref);
onReady();


function onReady() {

  console.log('content_script!');



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
      setTimeout(function () {
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
    if (browser && browser.contentDocument) {
      browser.contentDocument.dispatchEvent(evt);
    }
  };

  jQuery(document).bind("DOMContentLoaded mouseover load", function (event) {
    checkLoad(event);
  });
}
