import jQuery from "jquery";
 //TODO:  TEC - Uncomment block below, leave comments on individual lines
/*Components.utils.import("resource://gre/modules/FileUtils.jsm");

 //document.getElementById("test-button2").label = "HARUP";
 var sss = Components.classes["@mozilla.org/content/style-sheet-service;1"]
 .getService(Components.interfaces.nsIStyleSheetService);
 var ios = Components.classes["@mozilla.org/network/io-service;1"]
 .getService(Components.interfaces.nsIIOService);
 var uri = ios.newURI("chrome://smartwrap/content/smartwrap.css", null, null);
 if (!sss.sheetRegistered(uri, sss.AGENT_SHEET)) {
 //document.getElementById("test-button2").label = "LOADED";
 sss.loadAndRegisterSheet(uri, sss.AGENT_SHEET);
 } else {
 //document.getElementById("test-button2").label = "WASLOADED";
 }*/

//var currentWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("navigator:browser");
//var main = currentWindow.getBrowser().contentDocument;//content.document;
//TODO: TEC - uncomment
//var main = currentWindow.document.getElementById("appcontent");
//var main = document.getElementById("main");
//TODO: TEC - was if(main)
if (true) {
  //alert('sidebar');

  //PageManip.window = currentWindow;

  //var doc = currentWindow.getBrowser().contentDocument;

  //Swarmature.setContainer(document.getElementById('smartwrap-browser'));
  //Components.utils.import("resource://gre/modules/FileUtils.jsm");
  //Components.utils.import("resource://gre/modules/NetUtil.jsm");

  /*
   var loadListener = function(event) { PageManip.annotateDocument(event.target); };
   main.addEventListener("DOMContentLoaded", loadListener);
   main.addEventListener("mouseover", PageManip.getMouseOverListener(), true);
   main.addEventListener("mouseout", PageManip.getMouseOutListener());
   main.addEventListener("dragstart", PageManip.getDragStartListener());

   jQuery(document).bind("hideSidebar", function(event) {
   main.removeEventListener("DOMContentLoaded", loadListener);
   main.removeEventListener("mouseover", PageManip.getMouseOverListener());
   main.removeEventListener("mouseout", PageManip.getMouseOutListener());
   main.removeEventListener("dragstart", PageManip.getDragStartListener());

   if(sss.sheetRegistered(uri, sss.AGENT_SHEET)) {
   sss.unregisterSheet(uri, sss.AGENT_SHEET);
   }
   });

   document.getElementById('smartwrap-browser')
   .addEventListener("DOMContentLoaded", function(event) {
   var doc = event.target;
   var root = doc.documentElement;
   root.setAttributeNS(smartwrapNamespace, "devMode", devMode);
   root.setAttributeNS(smartwrapNamespace, "annotatorMode", annotatorMode);
   //alert('hey: ' + new XMLSerializer().serializeToString(event.target));
   });
   */

   //TODO: TEC - Uncomment block
  /*var fileioHandler = {
   writeStreamToFile: function(istream, filename, callback) {
   var file = Components.classes["@mozilla.org/file/local;1"]
   //.createInstance(Components.interfaces.nsI//LocalFile);
   .createInstance(Components.interfaces.nsIFile);
   file.initWithPath(filename);

   // file is nsIFile, str is a string

   if (!callback) {
   callback = function(status) {
   if (!Components.isSuccessCode(status)) {
   // Handle error!
   return;
   }

   // Data has been written to the file.
   }
   }

   // You can also optionally pass a flags parameter here. It defaults to
   // FileUtils.MODE_WRONLY | FileUtils.MODE_CREATE | FileUtils.MODE_TRUNCATE;
   var ostream = FileUtils.openSafeFileOutputStream(file);

   // The last argument (the callback) is optional.
   NetUtil.asyncCopy(istream, ostream, callback);
   },
   writeStringToFile: function(str, filename, callback) {
   var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
   createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
   converter.charset = "UTF-8";
   var istream = converter.convertToInputStream(str);

   this.writeStreamToFile(istream, filename, callback);
   },
   dumpURLToFile: function(chromeURL, filename, callback) {

   var file = Components.classes["@mozilla.org/file/local;1"]
   //.createInstance(Components.interfaces.nsI//LocalFile);
   .createInstance(Components.interfaces.nsIFile);
   file.initWithPath(filename);

   var wbp = Components.classes['@mozilla.org/embedding/browser/nsWebBrowserPersist;1']
   .createInstance(Components.interfaces.nsIWebBrowserPersist);
   var ios = Components.classes['@mozilla.org/network/io-service;1']
   .getService(Components.interfaces.nsIIOService);
   var uri = ios.newURI(chromeURL, null, null);
   //wbp.persistFlags &= ~Components.interfaces.nsIWebBrowserPersist.PERSIST_FLAGS_NO_CONVERSION; // don't save gzipped
   //wbp.save_URI(uri, null, null, null, null, file);

   // todo: implement callback via wbp.progressListener
   // see also:
   //
   // https://developer.mozilla.org/en/Code_snippets/Downloading_Files
   },
   };*/

    //TODO: TEC - Uncomment block
  /*jQuery(document).bind("sw_urltofile", function(event) {
   var detail = event.originalEvent && event.originalEvent.detail;

   var basename = detail.basename;
   var filedir = new FileUtils.File(detail.filedir).parent;

   var fileLoc = filedir.clone();
   fileLoc.append(basename);
   if (fileLoc.exists() && fileLoc.isFile()) {
   return;
   }

   var url = detail.sourceURL;

   fileioHandler.dumpURLToFile(url, fileLoc.path, function(status) {
   detail.status = status;
   if (status) {
   if (detail.failureCallback) {
   detail.failureCallback(detail);
   } else {
   alert(jQuery.format("could not write {filename}", {
   filename: fileLoc.path
   }));
   }
   } else {
   if (detail.successCallback) {
   detail.successCallback(detail);
   }
   }
   });

   });*/

  //TODO: TEC - Uncomment block
  /*jQuery(document).bind("sw_urltodom", function(event) {
   var detail = event.originalEvent && event.originalEvent.detail;

   var url = detail.sourceURL;
   var container = detail.element;
   var doc = container.ownerDocument;

   //alert("URLTODOM: " + url);

   NetUtil.asyncFetch(url, function(istream, aResult, aRequest) {
   //alert("FETCHED: " + url + ":: " + aResult + ":: " + Components.isSuccessCode(aResult));

   // Need to find out what the character encoding is. Using UTF-8 for this example:
   var charset = "UTF-8";
   const replacementChar = Components.interfaces.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER;
   var is = Components.classes["@mozilla.org/intl/converter-input-stream;1"]
   .createInstance(Components.interfaces.nsIConverterInputStream);
   is.init(istream, charset, 1024, replacementChar);

   //container.innerHTML = "";
   var str = {};
   var text = "";
   while (is.readString(4096, str) != 0) {
   var block = str.value;
   text += block;
   //container.innerHTML += block;
   //processData(str.value);
   }
   container.appendChild(doc.createTextNode("\n"));
   container.appendChild(doc.createCDATASection(jQuery.format("\n{text}\n", {
   text: text
   })));
   container.appendChild(doc.createTextNode("\n"));
   jQuery(container).removeClass("swPending");
   });


   });*/

  //TODO: TEC - Uncomment block
  /*jQuery(document).bind("sw_savelocalfile", function(event) {
   var detail = event.originalEvent && event.originalEvent.detail;

   //alert("LOCAL: " + JSON.stringify(Object.keys(detail)));

   var filename = detail.filename;

   if (!filename) {
   var nsIFilePicker = Components.interfaces.nsIFilePicker;
   var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
   fp.init(window, "Select a File", nsIFilePicker.modeSave);
   if (detail.extension) {
   fp.defaultExtension = detail.extension;
   fp.appendFilter(jQuery.format("{ext}", {
   ext: detail.extension
   }),
   jQuery.format("*.{ext}", {
   ext: detail.extension
   }));
   }
   if (detail.extensions) {
   Object.keys(detail.extensions).forEach(function(key) {
   fp.appendFilter(key, detail.extensions[key]);
   });
   }
   //fp.appendFilter("html", "*.html");
   if (detail.suggestion) {
   fp.defaultString = detail.suggestion;
   }
   var res = fp.show();
   if (res === nsIFilePicker.returnCancel) {
   return;
   } else {
   filename = fp.file.path;
   // --- do something with the file here ---
   if (fp.file.exists()) {
   detail.overwrite = true;
   }
   }
   }
   if (!filename) {
   alert("CANNOT SAVE FILE!!!");
   return;
   }

   detail.filename = filename;
   var file = Components.classes["@mozilla.org/file/local;1"]
   //.createInstance(Components.interfaces.nsI//LocalFile);
   .createInstance(Components.interfaces.nsIFile);
   file.initWithPath(filename);

   if (file.exists()) {
   var overwrite = false;
   overwrite = overwrite || detail.overwrite;
   overwrite = overwrite || confirm(jQuery.format("{filename} exists; overwrite?", {
   filename: filename
   }));

   if (!overwrite) {
   return;
   }
   }

   var URL = ios.newFileURI(file);
   detail.fileurl = URL.spec;

   var callback = function(status) {
   detail.status = status;
   if (status) {
   if (detail.failureCallback) {
   detail.failureCallback(detail);
   } else {
   alert(jQuery.format("could not write {filename}", {
   filename: filename
   }));
   }
   } else {
   if (detail.successCallback) {
   detail.successCallback(detail);
   }
   }
   }

   if (detail.filecontents) {
   var str = detail.filecontents;
   fileioHandler.writeStringToFile(str, filename, callback);
   return;
   }

   if (detail.bytes) {
   //Swarmature._writeStreamToFile(detail.bytes, filename, callback);
   var file = Components.classes["@mozilla.org/file/local;1"]
   .createInstance(Components.interfaces.nsIFile);
   //.createInstance(Components.interfaces.nsI//LocalFile);
   file.initWithPath(filename);

   var ostream = FileUtils.openSafeFileOutputStream(file);

   var data = detail.bytes;

   var binaryStream = Components.classes["@mozilla.org/binaryoutputstream;1"]
   .createInstance(Components.interfaces.nsIBinaryOutputStream);
   binaryStream.setOutputStream(ostream);
   binaryStream.writeByteArray(data, data.length);

   FileUtils.closeSafeFileOutputStream(ostream);

   return;
   }


   });*/

  let ignorable = null;
  const browser = jQuery("#smartwrap-browser").get(0);
  jQuery(document).bind("hideSidebar swRunWrapper swSaveWrapper swSaveCloseWrapper swDiscardWrapper swPing sw_autodrop sw_dragstart sw_removecell swAnnotate sw_dom swCancelRequest sw_reportSlot swUndo swRunWrapper swSidebar consent", function (event) {
    const detail = event.originalEvent && event.originalEvent.detail;
    //Smartwrap.log({"RELAY?": detail});
    if (detail.sidebar_relayed) {
      return;
    }
    if (detail.source === "smartwrap") {
      return;
    }
    if (detail.source === "page") {
      return;
    }

    //alert('OUTGOING: ' + new XMLSerializer().serializeToString(browser.contentDocument));

    //PageManip.fixed_url = currentWindow.getBrowser().contentDocument.defaultView.location;

    detail.sidebar_relayed = true;

    Smartwrap.log('OUTGOING: ' + event.type + ":: " + JSON.stringify(Object.keys(detail)));
    const evt = document.createEvent("CustomEvent");
    evt.initCustomEvent(event.type, true, false, detail);
    ignorable = evt;
    browser.contentDocument.dispatchEvent(evt);
    Smartwrap.log('OUTGONE: ' + event.type);
  });

  window.setTimeout(function () {
    const evt = document.createEvent("CustomEvent");
    evt.initCustomEvent("swSidebar", true, false, {
      sidebarDoc: jQuery(document),
      sir: "iexist"
    });
    document.dispatchEvent(evt);
  }, 100);

  jQuery(document).bind("sw_configure", function (event) {
    //alert("CONFIG1: " + new XMLSerializer().serializeToString(event.target));

    if (event.target !== jQuery(document).get(0)) {
      return;
    }

    const detail = event.originalEvent.detail;
    let config = {};
    if (detail.config) {
      config = detail.config;
    }

    //alert("ICU: " + JSON.stringify(detail));

    if (config.developermode) {
      jQuery(document).find("#loadTarget").addClass("devMode");
    } else {
      jQuery(document).find("#loadTarget").removeClass("devMode");
    }

    if (config.annotatormode) {
      jQuery(document).find("#loadTarget").addClass("annotatorMode");
    } else {
      jQuery(document).find("#loadTarget").removeClass("annotatorMode");
    }

    const browser = jQuery("#smartwrap-browser").get(0);
    const evt = document.createEvent("CustomEvent");
    evt.initCustomEvent("sw_configure", true, false, detail);
    browser.contentDocument.dispatchEvent(evt);
  });

  jQuery(document).bind("sw_outofbounds sw_inbounds", function (event) {
    //alert("OOB0: " + JSON.stringify(event));

    let detail = {};
    if (event && event.originalEvent) {
      detail = event.originalEvent.detail;
    }

    const eventName = event.type;
    const browser = jQuery("#smartwrap-browser").get(0);
    //alert('OUTGOING: ' + new XMLSerializer().serializeToString(browser.contentDocument));

    const evt = document.createEvent("CustomEvent");
    evt.initCustomEvent(eventName, true, false, detail);
    browser.contentDocument.dispatchEvent(evt);
  });

  const logP = Math.log(0.99);
  const logO = Math.log(0.6);
  const checkLoad = function (event, detail) {
    if (!detail) {
      detail = {};

      detail.target = event.target;
      detail.cause = event.type;
      detail.document = (!!event.target.ownerDocument) ? event.target.ownerDocument : event.target;
    }

    const root = document.documentElement;
    if (jQuery(root).hasClass("sidebarHidden")) {
      return;
    }

    //event.originalEvent.originalTarget.defaultView.addEventListener("load", function() { alert("um"); }, true);

    //setTimeout(function() { alert("LOADED: " +  detail.document.documentURI); }, 5000);

    detail.readyState = detail.document.readyState;

    const body = jQuery(detail.document).find("body");
    const t = 1 + (body.data("iters") || 0);
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
      const dim = 0.8 - Math.exp(logO + t * logP);
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

    //TODO: This is a problem area due to the discrepancy between xul and the document
    const evt = document.createEvent("CustomEvent");
    evt.initCustomEvent("sw_targetdocument", true, false, detail);
    if (browser && browser.contentDocument) {
      browser.contentDocument.dispatchEvent(evt);
    }
  };
  jQuery(document).bind("DOMContentLoaded mouseover load", function (event) {
    checkLoad(event);
  });

  const dialogs = jQuery("#dialog_templates .dialog_template");
  jQuery(browser).bind("DOMContentLoaded", function (event) {
    const detail = {};

    detail.dialogs = dialogs;

    const evt = document.createEvent("CustomEvent");
    evt.initCustomEvent("sw_dialogs", true, false, detail);
    browser.contentDocument.dispatchEvent(evt);
  });


  const devMode = false;
  const annotatorMode = false;

  jQuery(document).bind("showSidebar", function (event) {
    setTimeout(function () {
      const reqConsent = Smartwrap.getSetting('requestConsent');
      let consent = Smartwrap.getSetting('consent');
      //alert(JSON.stringify({jsconsent: true, consent: consent, consent2: (typeof consent)}));
      if (reqConsent !== 'true') {

        /*setTimeout(function() {
         alert('reqConsent not required: ' + reqConsent);
         }, 2000);*/
        return;
      }
      if (typeof consent === 'undefined') {
        Smartwrap.emit(jQuery(document), "consent", {});
        //window.open('chrome://smartwrap/content/consent.html');
      }
      //Smartwrap.emit(jQuery(document), "tellUser", {msgid: "msg_consent"});
      //alert(JSON.stringify({jsconsent2: true, consent: Smartwrap.getSetting('consent')}));
      //jQuery('#irbConsent2').dialog();
    }, 100);
  });

  window.setTimeout(function () {
    //alert('hi: 10');
    document.getElementById('loadTarget').classList.add('loaded');
    document.getElementById('loadTarget').classList.remove('notloaded');

    //alert('hi: ' + Swarmature.foo);
  }, 20);

  var evt = document.createEvent("CustomEvent");
  evt.initCustomEvent("showSidebar", true, false, {
    source: "sidebar"
  });
  document.dispatchEvent(evt);
}

/*
 window.setTimeout(function() {
 alert("NOW: " + new XMLSerializer().serializeToString(document));

 jQuery(document).ready(function() { alert("FREDDY"); });
 jQuery(document).load(function() { alert("FREELOAD"); });
 jQuery(document).unload(function() { alert("FREON"); });
 jQuery(document).blur(function() { alert("FREONIC"); });
 jQuery(document).click(function() { alert("FREAK"); });
 }, 2000);
 */
