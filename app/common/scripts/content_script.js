/**
 * Created by Xiao Liang Yu <me@hiubright.com> Code name: yxl
 */
import browser from "webextension-polyfill";
import jQuery from "jquery";
import {Smartwrap} from './smartwrap';
import prefutil from "./prefutil";
import main from './sidebar';
import {smartwrapNamespace} from "./smarttable-header";
// import processDOM from "./smartwrap-processdom";
// import Interaction from './smartwrap-interaction';
import $ from 'jquery';
import DocumentMarker from './smartwrap-docmarker';
//
// import swp from './smartwrap-page';




//const $ = jQuery;

localStorage.debug = true;
import bow from 'bows';
const log = bow('content_script');
browser.runtime.sendMessage({eventName : "contentTab"});
var dragTarget;
var prevTarget;
var docDetail;
var docReady = false;
var dummysw = Object.create(Smartwrap);
function onReceiveMessage(event){
  var eEvent;
  console.log("receive message");
   console.log(event);
  // console.log(dragTarget);
  eEvent = new CustomEvent(event.data.eventName,{detail: event.data});
  document.dispatchEvent(eEvent);
}
function handleDocMsg(event) {
  console.log("handleDocMsg event");
  console.log(event);
  docReady = true;
  docDetail = event.detail;
  console.log("docDetail in handleDocMsg");
  console.log(docDetail);
  var docEvent = new CustomEvent("docReady",{detail: docDetail});
  document.dispatchEvent(docEvent);
  browser.runtime.sendMessage(docDetail);

}

function handleBGMsg (message) {
  console.log("receive msg from bg");
  console.log(message);
  if (message.eventName) {
    var eEvent;
    // console.log(event.data);
    // console.log(dragTarget);
    eEvent = new CustomEvent(message.eventName,{detail: message});
    document.dispatchEvent(eEvent);
  }
}
document.addEventListener('docMsg',handleDocMsg);
window.addEventListener('message',onReceiveMessage,false);
const doc = document;
const markParams = {
  smartwrap : dummysw,
  chunkSize : 25,
  chunkDelay : 20,
}
const marker = new DocumentMarker({
  doc,
  params: markParams
});

window.setTimeout(() => {
  marker.mark();
}, 10);
function handleDocReady(event) {
  onReady();
}
document.addEventListener('docReady',handleDocReady);

// processDOM(document);


function handleSwInjectedCell (event) {
  dragTarget.classList.add("sw_injected_cell");
  dragTarget.classList.add(event.detail.colid);

  if (dragTarget.setAttributeNS) {
    dragTarget.setAttributeNS(smartwrapNamespace, "tableid", event.detail.tableid);
    dragTarget.setAttributeNS(smartwrapNamespace, "colid", event.detail.colid);
    dragTarget.setAttributeNS(smartwrapNamespace, "rowid", event.detail.rowid);
  }
}

function handleRemoveTab (event) {
  $('#yxl_sidebar').remove();
}

function handleClick(event) {
  if (prevTarget) {
    // prevTarget.removeAttribute("style","background-color : rgba(200,0,0,0.5)");
  }
  prevTarget = event.target;
  // event.target.setAttribute("style","background-color : rgba(200,0,0,0.5)");
  //event.target.draggable = true;
}
// function handleMouseout(event) {
//   // event.target.removeAttribute("style","background-color: rgba(0,0,200,0.5)");
//   // event.target.style.outline = "none";
// }
function blueboxMouseover (event) {
  // event.target.setAttribute("style","background-color: rgba(0,0,200,0.5)");
  // event.target.style.outline = "thick solid #0000FF";
  // event.target.addEventListener("mouseout",handleMouseout);
  if (typeof InstallTrigger === 'undefined') {
    event.target.setAttribute("draggable",true);
  }
  dragTarget = event.target;
}

function handlePageReady (event) {
  console.log("docDetail in pageReady");
  console.log(docDetail);
  browser.runtime.sendMessage(docDetail);
  console.log("end Marking");
}

function onReady() {
  const frame = $('#yxl_sidebar');
  console.log('content_script!');
  // console.log(document.getElementsByClassName('css-81m66u')[0]);
  // var frameWin = document.getElementsByClassName('css-81m66u')[0];
  document.addEventListener("pageReady",handlePageReady);
  var iframedoc = browser.extension.getURL("pages/smartwrap.html");
  var XMLS = new XMLSerializer();
  jQuery (document).bind("sw_injected_cell",handleSwInjectedCell);
  jQuery(document).bind("sw_inbounds", event => {
    jQuery("#smartwrap").removeClass("disabled");
  });
  browser.runtime.onMessage.addListener(handleBGMsg);
  jQuery(document).bind("click",handleClick);
  jQuery(document).bind("dragstart", event => {
    event.stopPropagation();
    console.log("dragStart");
    console.log(event);
    // console.log(event.target);
    // console.log(dragTarget);
    const iframe  = $('iframe');
    const tgt = event.target;
    dragTarget = tgt;
    var iframedoc = browser.extension.getURL("pages/smartwrap.html");
    var detail = {};
    detail.eventName = "dragstart_msg";
    detail.dragstartEvent = {
      'target': XMLS.serializeToString(tgt),
    };
    detail.metadata = {}; // TODO: recreate getDragData();
    const text = 'Smartwrap.getVisibleText(tgt)';
    //event.originalEvent.dataTransfer.setData("text/plain", text);
    detail.metadata.text = text;
    event.originalEvent.stopPropagation();
    detail.metadata.url = event.target.ownerDocument.defaultView.location.href;
    detail.metadata.title = event.target.ownerDocument.title;
    detail.metadata.absoluteLocationXPath = Smartwrap.getAbsoluteLocationXPath(event.target, false);
    detail.target = XMLS.serializeToString(tgt);
    browser.runtime.sendMessage(detail);

  });

  jQuery(document).bind("mouseover",blueboxMouseover);
  document.addEventListener("removeTab",handleRemoveTab);

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
