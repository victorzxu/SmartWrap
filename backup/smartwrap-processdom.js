import jQuery from "jquery";
import DocumentMarker from './smartwrap-docmarker';
import Interaction from './smartwrap-interaction';

jQuery(document).ready(function () {
  "use strict";
  //alert("HEY: " + document.documentURI);

  const that = this;

  if (!document.defaultView) {
    return;
  }

  const url = document.documentURI;
  if (url && url.match(/^chrome:/)) {
    return;
    // ignore pages representing FF's internal layout
  }

  //TODO: put logging back in all functions via message passing
  //try {
  //  throw new Error();
  //} catch (ee) {
  //  that.log({
  //    process: url,
  //    stack: ee.stack
  //  });
  //}

  const previouslyProcessed = jQuery(document).data("sw_processed");
  //that.log({prevcheck: true, prev: !!previouslyProcessed, url: doc.documentURI});

  if (previouslyProcessed) {
    return;
  }

  //try {
  //  throw new Error();
  //} catch (ee) {
  //  that.log({
  //    process1: url,
  //    stack: ee.stack
  //  });
  //}

  this.docs.push(document);

  jQuery(document).bind("mouseover", function (event) {
    const tgt = event.target;

    if (that.decommissioned) {
      return;
    }

    if (that.scrapeTarget) {
      const mousedDoc = tgt.ownerDocument;
      const mouseurl = mousedDoc.defaultView.location.href;
      if (mouseurl === that.scrapeTarget.url) {
        //that.log({
        //  BIB: [mouseurl, '===', that.scrapeTarget.url]
        //});

        const evt = document.createEvent("Events");
        evt.initEvent("sw_inbounds", true, false);
        document.dispatchEvent(evt);
      } else {
        //that.log({
        //  OOB: [mouseurl, '!==', that.scrapeTarget.url]
        //});

        const detail = {};
        detail.cause = [mouseurl, '!==', that.scrapeTarget.url];
        detail.observer = that.swid;

        that.emit(jQuery(document), "sw_outofbounds", detail);
        /*
         var evt = document.createEvent("CustomEvent");
         evt.initCustomEvent("sw_outofbounds", true, false, detail);
         doc.dispatchEvent(evt);
         */
        //return;
      }
    }
  });

  jQuery(document).bind("sw_dragstart", function (event) {
    //alert("DRAGGY");
    document.getSelection().removeAllRanges();
  });

  if (that.scrapeTarget) {
    const processurl = document.defaultView.location.href;
    if (processurl !== that.scrapeTarget.url) {
      return;
    }
  }

  const boxer = function (dragIndicator) {
    if (dragIndicator === "BLUEBOX") {
      return Object.create(Interaction.BoxIndicator).init({
        doc: document,
        smartwrap: that
      });
    }

    return null;
  }(that.getSetting("dragIndicator"));

  if (boxer) {
    boxer.registerListeners();
    //that.log({boxing: doc.documentURI});
  }

  const selector = function (dragSelector) {
    if (dragSelector === "CLICK") {
      return Object.create(Interaction.ClickSelector).init({
        doc: document,
        smartwrap: that,
        logger: that
      });
    }
    if (dragSelector === "HOVER") {
      return Object.create(Interaction.HoverSelector).init({
        doc: document,
        smartwrap: that,
        logger: that
      });
    }
    if (dragSelector === "TEXTSELECT") {
      return Object.create(Interaction.SelectTextSelector).init({
        doc: document,
        smartwrap: that,
        logger: that
      });
    }
    return null;
  }(that.getSetting("dragSelector"));

  if (selector) {
    selector.registerListeners();
    //that.log({selecting: doc.documentURI});
  }

  //that.log({SELECTOR: that.getSetting("dragSelector")});

  jQuery(document).bind("click", function (event) {
    const tgt = event.target;
    if (jQuery(tgt).parents().is("a")) {
      //alert("CLICKY");
    }
  });

  jQuery(document).bind("click dragstart mousedown mouseup", function (event) {
    const tgt = event.target;
    const type = event.type;

    // if (document !== tgt.ownerDocument) {
    //   //alert("SKIP!!");
    //   return;
    // }

    //that.log({
    //  happened: type,
    //  //tgt: new XMLSerializer().serializeToString(tgt),
    //  x: event.originalEvent.clientX,
    //  y: event.originalEvent.clientY,
    //  seln: tgt.ownerDocument.defaultView.getSelection().toString()
    //});

  });

  if (target) {
    jQuery(target).mouseover();
  }

  //TODO: Here, "that" should probably refer to ProcessDOM.  Depends on if we want ProcessDOM to call Docmarker or Smartwrap to call Docmarker
  const markParams = {
    smartwrap: that,
    chunkSize: 25,
    chunkDelay: 20
  };
  /*

   Marking the document is done in chunks of nodes.  There is a
   tradeoff between marking speed and browser responsiveness;
   bigger chunks make marking complete faster but a large chunk
   hogs the browser update thread so that nothing else can happen
   while the chunk is being processed.  By processing small chunks
   and leaving a small gap between them we allow other events to
   sneak between the chunks, giving the user a responsive
   experience.

   */
  //var marker = Object.create(that.DocumentMarker);
  //marker.init(doc, markParams);

  const marker = new DocumentMarker({
    doc: document,
    params: markParams
  });
  window.setTimeout(function () {
    marker.mark();
  }, 10);
  //marker.mark();

  //<editor-fold desc="yxl:if false">
  if (false) {
    jQuery(document).bind("dragstart", function (event) {
      const tgt = event.target;

      if (true) {
        return;
      }

      if (event && event.originalEvent) {

        const detail = {};
        detail.metadata = {}; // TODO: recreate getDragData();
        const text = Smartwrap.getVisibleText(tgt);

        if (text.match(/\S/)) {
          event.originalEvent.dataTransfer.setData("text/plain", text);
          detail.metadata.text = text;
        } else {
          //window.setTimeout(function() { alert("NOTEXT"); }, 1000);
          //event.originalEvent.dataTransfer.setData("text/plain", "TEXTLESS");
        }

        //window.setTimeout(function() { alert("DRAG: " + text); }, 1000);

        event.originalEvent.stopPropagation();
        //alert("STOPPED");

        detail.metadata.url = event.target.ownerDocument.defaultView.location.href;
        detail.metadata.title = event.target.ownerDocument.title;
        detail.target = event.target;
        detail.metadata.style = jQuery(event.target).data("style") || marker.getPresentedStyle(event.target);
        detail.metadata.absoluteLocationXPath = Smartwrap.getAbsoluteLocationXPath(event.target, false);

        const evt = document.createEvent("CustomEvent");
        console.log("240");
        evt.initCustomEvent("sw_dragstart", true, true, detail);
        document.dispatchEvent(evt);
      }
    });
  }
  //</editor-fold>

  //that.log({
  //  markdone: true,
  //  uri: document.documentURI
  //});
  jQuery(document).data("sw_processed", true);

});
