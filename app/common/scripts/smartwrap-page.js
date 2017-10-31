//noinspection ES6UnusedImports
import browser from "webextension-polyfill";
import $ from "jquery"; // This if for jquery-ui to inject(add) members to jquery object
import jQuery from "jquery";
//TODO: yxl: Understand why we can't import $,query in one line?
import "jquery-ui/ui/widgets/resizable";
import "jquery-ui/ui/widgets/menu";
import "jquery-ui/ui/widgets/tabs";
import "jquery-ui/ui/widgets/sortable";
import "jquery-ui/ui/widgets/button";
import "./lib/jquery.utils.liter";


// yxl:Smartwrap object and its "plugins"
import {Smartwrap} from "./smartwrap";
import "./smartwrap-interpreter";
import "./smartwrap-smarttable";
import "./smartwrap-model";
import "./smartwrap-palette";
import prefutil from "./prefutil";

import {smartwrapNamespace} from "./smarttable-header";

import processDOM from './smartwrap-processdom';

localStorage.debug = true;
jQuery.ajax.cors = true;

import bow from 'bows';

const log = bow('page');

 $(()=>{setTimeout(swp, 0)});
 function onReceiveMessage(event){
   var eEvent;
   // console.log(event.data);
   // console.log(dragTarget);
   eEvent = new CustomEvent(event.data.eventName,{detail: event.data});
   document.dispatchEvent(eEvent);
 }

 function handleStorage (event) {
   //console.log("in Storage");
   var reportDetail = JSON.parse(localStorage.getItem("sw_reportSlot"));
  //  console.log("reportDetail");
  //  console.log(reportDetail);
   var parser = new DOMParser();
   if (reportDetail) {
     reportDetail.target = parser.parseFromString(reportDetail.target,"text/html");
     reportDetail.target.ownerdocument = parser.parseFromString(reportDetail.ownerDocument,"text/html");
    //  console.log(reportDetail.target);
     var reportEvent = new CustomEvent("sw_reportSlot",{detail: reportDetail});
     localStorage.removeItem("sw_reportSlot");
     document.dispatchEvent(reportEvent);

   }
 }
 window.addEventListener("storage",handleStorage);
 function handleBGMsg (message) {
  //  console.log("receive msg from bg");
  //  console.log(message);
   if (message.eventName) {
     var eEvent;
     // console.log(event.data);
     // console.log(dragTarget);
     eEvent = new CustomEvent(message.eventName,{detail: message});
     document.dispatchEvent(eEvent);
   }
 }
function swp () {
  // console.log("page window");
  // console.log(window);
  browser.runtime.onMessage.addListener(handleBGMsg);
  var getFirstTime = browser.storage.local.get("isFirstTime");
  getFirstTime.then(
    item => {
      if (Object.keys(item).length === 0) {
        //console.log("first time");
        prefutil.initPref();
        browser.storage.local.set({isFirstTime:false});
      }
      else {
        //console.log("not first time");
      }
    },
    error => {
      console.log("error when getting isFirstTime");
    }
  );
  console.log("We're in!");
  //window.scrollbars.visible = false;
  // added this line per
  //http://old.nabble.com/Re%3A-Disable-scrollbars-in-browser-control-within-XUL-application-p5112444.html
  // since the browser now scrolls for itself in the #smarttables
  // div


  $("#smarttables").resizable({
    animate: true,
    grid: [30, 5],
    handles: "s",
    stop() {
      setTimeout(() => {
        jQuery("#smarttables").animate({
          width: "50%"
        });
      }, 0);
    },
  });
  const sw = Object.create(Smartwrap);
  function handleDragstartMsg (event) {
    sw.dragDetail  = event.detail;
  }
  function handleDocMsg(event) {
    // console.log("in handleDocMsg");
    // console.log(event);
    sw.docClone = event.detail.docClone;
    sw.domxml = event.detail.domxml;
    sw.bwdominfo = event.detail.bwdominfo;
    sw.nodemap = event.detail.nodemap;
    $("#loading_wrap").remove();
  }
  window.addEventListener("message",onReceiveMessage,false);
  document.addEventListener("dragstart_msg",handleDragstartMsg);
  document.addEventListener("docMsg",handleDocMsg);
  browser.runtime.sendMessage({
    'eventName' : 'pageReady'
  });
  sw.contextmenu = jQuery("ul#smartwrap_contextmenu");
  sw.contextmenu.menu({
    select(event, ui) {
      event.stopPropagation();
      event.preventDefault();

      sw.contextmenu.hide();
      jQuery(".contextualized").removeClass("contextualized");
      setTimeout(() => {
        const item = jQuery(ui.item).find(".sw_menuitem").get(0);
        const eventType = item.getAttributeNS(smartwrapNamespace, "eventType") || item.getAttribute("sw:eventType");

        const context = jQuery(sw.contextmenu.data("context"));

        const detail = {};

        //alert(JSON.stringify({SELECT: Object.keys(event), UI: Object.keys(ui), ITEM: new XMLSerializer().serializeToString(item), CTXT: new XMLSerializer().serializeToString(context.get(0)), EVENT: eventType}, null, 2));

        const evt = document.createEvent("CustomEvent");
        evt.initCustomEvent(eventType, true, false, detail);
        //evt.ui = ui;
        //evt.detail = detail;
        jQuery(context).get(0).dispatchEvent(evt);

      }, 10);
    },
    blur2() {
      setTimeout(() => {
        sw.contextmenu.hide();
      }, 1200);
    },
  });
  jQuery("#templates .template").each((index, elt) => {
    //alert("TEMPLATE: " + new XMLSerializer().serializeToString(elt));
    Smartwrap.setTemplate(elt.id, elt);
    Smartwrap.SmartTable.setTemplate(elt.id, elt);
  });
  const st0 = jQuery("#smarttable0");
  const st0copy = jQuery("#smarttable0").clone();

  jQuery("#smarttables").on("add_table", event => {
    const spec = (event && event.originalEvent && event.originalEvent.detail) || {};
    event.spec2 = Object.create(spec);
    if (!event.spec2.tabno) {
      event.spec2.tabno = sw.uidgen();
    }
    if (!event.spec2.index) {
      //event.spec2.index = -1 + swTabs.tabs("length");
    }
    const iii = 0;
    const jjj = 1200;

    event.spec2.tabid = jQuery.format("smarttable{tabno}", event.spec2);
    const href = jQuery.format("#{tabid}", event.spec2);
    const label = event.spec2.labelText = jQuery.format("Table {tabno}", event.spec2);

    const pTempl = swTabs.tabs('widget').data('panelTemplate');
    event.spec2.panel = jQuery(pTempl).clone().appendTo(swTabs.tabs('widget'));
    event.spec2.panel.attr('id', event.spec2.tabid);

    const tTempl = swTabs.tabs('widget').data('tabTemplate');
    //var tabElt = jQuery(tTempl).clone().appendTo(swTabs.tabs('widget').find("ul"));
    const tabElt = event.spec2.tab = jQuery(tTempl).clone().insertBefore(swTabs.tabs('widget').find("ul li").last());
    tabElt.find("a").first().attr("href", href);
    tabElt.find("a .label").first().text(label);

    log('p1');
    sw.emit(jQuery("#smarttables"), "bind_table", event.spec2);

    swTabs.tabs('refresh');

    tabElt.find("a").first().click();

    sw.log({
      STADDTAB: event.spec2
    });
  });
  jQuery(document).on("bind_table", event => {
    const spec = (event && event.originalEvent && event.originalEvent.detail) || {};
    event.spec2 = Object.create(spec);
    sw.log({
      STBINDTAB: spec
    });
    event.spec2.table = sw.tables[event.spec2.tabid];
    if (!event.spec2.table) {
      event.spec2.table = sw.newTable(event.spec2.tabid);
      event.spec2.table.model.setTableField("label", event.spec2.labelText);
    }

    event.spec2.containers = {};
    event.spec2.table.viewNames.forEach(key => {
      event.spec2.containers[key] = jQuery(event.spec2.panel).find("." + key).get(0);
    });
    event.spec2.table.setContainers(event.spec2.containers);

    //event.spec2.panel.find(".tablename").val(event.spec2.labelText);
    event.spec2.panel.find(".tablename").val(event.spec2.labelText);

    event.spec2.panel.on("rename_table", delta => {
      //setTimeout(function() { alert('RDELTA'); }, 1200);
      event.spec2.tab.find("a .label").first().text(event.spec2.panel.find(".tablename").val().slice(0, 20));
    });

    sw.log({
      STBINDTAB: Object.keys(event.spec2)
    });
  });
  jQuery(document).on("rename_table", event => {
    const spec = (event && event.originalEvent && event.originalEvent.detail) || {};
    sw.log({
      RENAME_TABLE: event,
      SPEC: spec
    });
  });

  jQuery(document).on("consent", event => {
    setTimeout(() => {
      //alert("HIHITELLUSER");
      //sw.tellUser({msgid: "msg_consent"});
      window.open('chrome://smartwrap/content/consent.html');
      //alert("HIHITELLUSER2");
    }, 100);
  });

  const sink = jQuery(".sink");
  const getKeyString = charCode => {
    if (charCode === 46) {
      return "del";
    }
    if (charCode === 8) {
      return "\\b";
    }
    return String.fromCharCode(charCode);
  };
  jQuery(".sink").on("keypress", event => {
    const key = [
      typeof event.shiftKey !== 'undefined' ? "shift-" : "",
      typeof event.ctrlKey !== 'undefined' ? "ctrl-" : "",
      typeof event.metaKey !== 'undefined' ? "meta-" : "",
      typeof event.altKey !== 'undefined' ? "alt-" : "",
      getKeyString(Math.max(event.which, event.keyCode)),
      //Math.max(event.which,event.keyCode),
      ""
    ].join("");

    sink.val(JSON.stringify({
      key,
      code: Math.max(event.which, event.keyCode),
      cb: !!sw.shortcuts[key]
    }));
    //sink.select();

    const callback = sw.shortcuts[key];

    if (callback) {
      callback.call();
      event.preventDefault();
    }
  });

  var swTabs = jQuery("#smarttables").tabs({ //collapsible: true,
    active: false,
    activate(event, ui) {
      //alert("NOW: " + new XMLSerializer().serializeToString(ui.tab.parentNode));
      let newtab = (ui.tab && (ui.tab.id === 'newtab'));
      if (ui.newTab && (jQuery(ui.newTab).find("a#newtab").length > 0)) {
        newtab = true;
      }
      if (newtab) {

        const spec = {};
        spec.callback = newid => {
          swTabs.tabs('activate', '#' + newid);
        };
        sw.emit(jQuery("#smarttables"), "add_table", spec);

        /*
         var next = uidgen();
         var href = jQuery.format("#smarttable{tabno}", {tabno: next});
         var label = jQuery.format("Table {tableno}", {tableno: next});
         event.preventDefault();
         swTabs.tabs('add',href,label,ui.index);
         */

        event.preventDefault();
        return false;
      }
      // alert("NOW: " + ui.panel.id);
    },
    add(event, ui) {
      const newtab = ui.tab;
      const label = jQuery(newtab).find(".label").get(0);

      const labelText = jQuery(label).text(); // label.inner//HTML;

      //jQuery(newtab).find("input").bind("change", labelSync(label));
      //swTabs.tabs('select', "#"+ui.panel.id);
      swTabs.tabs('option', 'panelTemplate', st0copy.clone().get(0));
      swTabs.tabs('widget').data('panelTemplate', st0copy.clone().get(0));

      jQuery(ui.panel).find(".tablename").val(labelText);
      jQuery(ui.panel).find(".tablename").bind("change", event => {
        //alert("CHANGED0");
        //label.innerHTML = jQuery(event.target).val();
        //alert("CHANGED");

        sw.emit(jQuery(event.target), "rename_table", {
          to: jQuery(event.target).val()
        });
      });

      jQuery(ui.panel).on("rename_table", event => {
        //alert(JSON.stringify({RENAME:2,html:label.innerHTML, text: jQuery(label).text()}));

        jQuery(label).text(jQuery(ui.panel).find(".tablename").val());
      });

      const spec = swTabs.tabs('option', 'spec') || {};
      spec.id = ui.panel.id;
      spec.panel = ui.panel;
      spec.labelText = labelText;
      if (true) {
        log('p2');
        sw.emit(jQuery("#smarttables"), "bind_table", spec);

        if (spec.callback) {
          //alert('luvya');
          spec.callback.call(null, spec.id);
        }
      } else {
        const stN = sw.newTable(ui.panel.id);
        ui.containers = {};
        stN.viewNames.forEach(key => {
          ui.containers[key] = jQuery(ui.panel).find("." + key).get(0);
        });
        //alert("PANEL N: " + new XMLSerializer().serializeToString(ui.panel));
        //alert("PANELID N: " + ui.panel.id);
        sw.log({
          "CONTAINERS N": Object.keys(ui.containers)
        });
        stN.setContainers(ui.containers);
        //stN.panel = ui.panel;
        stN.model.setTableField("label", labelText);

        if (stN.hidden) {
          //alert("HIDEME");
          //jQuery(ui.panel).hide();
          jQuery(ui.tab).parents("li").hide();
        }
      }

      swTabs.tabs('option', 'spec', null);

    },
  });
  swTabs.tabs('option', 'panelTemplate', st0copy.clone().get(0));
  swTabs.tabs('widget').data('panelTemplate', st0copy.clone());
  swTabs.find(".ui-tabs-nav").sortable({
    axis: "x"
  });
  swTabs.tabs('option', 'tabTemplate', '<li><a refid="#{href}" href="#{href}"><!--<input value="#{label}"/>--><span class="label">#{label}</span></a><span class="ui-icon ui-icon-close">X</span></li>');
  swTabs.tabs('widget').data('tabTemplate', jQuery("#smarttables ul li").first().clone());

  jQuery(document).bind("sw_addtable", event => {
    const detail = event.originalEvent && event.originalEvent.detail;

    try {
      const curr = swTabs.tabs("option", "selected");
      detail.curr = curr;
      //alert("ADDTABLE: " + JSON.stringify(detail));

      swTabs.tabs("select", '#addtab');
      swTabs.tabs("select", curr);
    } catch (e) {
      sw.log({
        domain: "addtableHandler",
        exception: e,
        msg: e.message,
        name: e.name
      });
    }
  });

  const label0 = jQuery("#tab0").find(".label").get(0);

  jQuery("#smarttable0").on("rename_table", event => {
    //alert(JSON.stringify({RENAME: 1, html: label0.innerHTML, text: jQuery(label0).text()}));

    jQuery(label0).text(jQuery("#smarttable0").find(".tablename").val().slice(0, 20));
  });

  jQuery("#smarttables").on("click", ".ui-icon-close", event => {
    console.log("close clicked");

    const target = event.target;
    const tab = target.parentNode;
    const href = jQuery(tab).find("a").get(0).getAttribute("refid");
    //alert("HI: " + new XMLSerializer().serializeToString(tab) + ":: " + href);
    tab.remove();
    swTabs.tabs("refresh");
  });
  sw.init({
    "table0": st0.get(0).id
  });
  sw.setPalette("columnPalette", Smartwrap.monoPalette);
  sw.setPalette("tablePalette", Smartwrap.mainPalette);
  sw.containers = {};
  sw.tables[st0.get(0).id].viewNames.forEach(key => {
    sw.containers[key] = st0.find("." + key).get(0);
  });
  sw.tables[st0.get(0).id].model.setTableField("label", "Table 1");
  sw.tables[st0.get(0).id].setContainers(sw.containers);
  //sw.tables[st0.get(0).id].addNoise();
  //sw.tables[st0.get(0).id].updateViews();
  //alert('ok');

  if (true) {
    sw.setContainer(jQuery("#smartwrap").get(0));
  } else {
    sw.setContainer(jQuery("#smarttables").get(0));
  }

  sw.swid = Math.random();

  sw.detail = {
    smartwrap: sw
  };
  var evt = document.createEvent("CustomEvent");
  evt.initCustomEvent("sw_newsmartwrap", true, true, sw.detail);
  document.dispatchEvent(evt);


  const activate = widget => {
    if (widget.disabled) {
      return;
    }

    //alert("BUTTON: " + new XMLSerializer().serializeToString(widget));

    let eventType = widget.getAttributeNS(smartwrapNamespace, "eventType") || widget.getAttribute("sw:eventType");
    if (!eventType) {
      return;
    }

    //alert("BUTTON: " + eventType);

    widget.detail = {
      source: "page"
    };
    widget.detail.target = jQuery(widget).parents("html").find(".sw_selected").get(0);
    //alert('selection: ' + JSON.stringify(detail))

    const evt = document.createEvent("CustomEvent");
    evt.initCustomEvent(eventType, true, false, widget.detail);
    document.dispatchEvent(evt);
  };
  jQuery(".sw_button").click(event => {
    const widget = event.target;
    activate(widget);
    //sw.getHandler(eventType).call(sw, evt);
  });
  sw.shortcuts = {};
  jQuery(".sw_button, .sw_menuitem").each((ix, elt) => {
    const button = jQuery(elt);
    const shortcut = elt.getAttributeNS(smartwrapNamespace, "shortcut") || elt.getAttribute("sw:shortcut");
    if (shortcut) {
      shortcut.split(/\s+/).forEach(key => {
        sw.shortcuts[key] = () => {
          //alert('click: ' + button.is(":disabled"));
          if (!button.is(":disabled")) {
            activate(button.get(0));
          }
        };
      });
    }
  });

  jQuery(".sink").val(JSON.stringify(Object.keys(sw.shortcuts)));

  jQuery("#testarea ul").menu();

  jQuery(document).bind("sw_removecell", sw.getHandler("sw_removecell"));

  jQuery(document).bind("hideSidebar", event => {
    alert("HIDEY!");
    sw.setContainer(null);

    jQuery(sw.selbox).hide();

    alert("PREHIDE: " + JSON.stringify(Object.keys(sw), null, 2));
    delete sw["scrapeTarget"];
    alert("POSTHIDE: " + JSON.stringify(Object.keys(sw), null, 2));

    sw.status.fresh = false;

    //var detail = {};
    //detail.smartwrap = sw;

    jQuery("#smartwrap").removeClass("disabled");

    const evt = document.createEvent("CustomEvent");
    evt.initCustomEvent("sw_status", true, true, {
      smartwrap: sw
    });
    document.dispatchEvent(evt);
  });

  jQuery(document).bind("sw_targetdocument", event => {
    const detail = event.originalEvent && event.originalEvent.detail;
    if (detail && detail.document) {
      log('processDOM');
      processDOM(sw,detail.document, detail.target);
    }
  });

  jQuery(document).bind("sw_outofbounds", event => {
    const detail = event.originalEvent && event.originalEvent.detail;
    sw.log({
      OOB: "received",
      detail
    });

    jQuery("#smartwrap").addClass("disabled");
  });

  jQuery(document).bind("sw_inbounds", event => {
    jQuery("#smartwrap").removeClass("disabled");
  });

  jQuery(document).bind("sw_configure", event => {
    //alert("SWCONFIG!");
    const detail = event.originalEvent && event.originalEvent.detail;
    if (detail.config.developermode) {
      jQuery(".sw_mode").removeClass("nonDeveloper");
    } else {
      jQuery(".sw_mode").addClass("nonDeveloper");
    }


    if (event && event.originalEvent) {
      sw.configure(event.originalEvent.detail);
    }
  });
  jQuery(document).bind("sw_autodrop", event => {
    alert("HTMLAUTODROP!");
  });

  jQuery(document).bind("sw_dom", event => {
    // console.log("sw_dom detected");
    const detail = event.originalEvent && event.originalEvent.detail;
    //sw.log({"SWDOM": Object.keys(detail)});
    if (detail.bwdominfo) {
      sw.bwdominfo = detail.bwdominfo;
    }
    if (detail.domxml) {
      sw.domxml = detail.domxml;
    }
    if (detail.docClone) {
      sw.docClone = detail.docClone;
    }
  });

  const annLink = jQuery(document).find("#handyLink a");
  jQuery(document).bind("sw_annotatedfile", event => {
    const detail = event.originalEvent && event.originalEvent.detail;
    sw.log({
      "ANNOTATED": detail
    });

    const dependencies = detail.dependencies;

    dependencies.forEach(depDetail => {
      depDetail.filedir = detail.filename;

      //alert("DEPDETAIL: " + JSON.stringify(depDetail));

      const evt = document.createEvent("CustomEvent");
      evt.initCustomEvent("sw_urltofile", true, false, depDetail);
      document.dispatchEvent(evt);
    });

    annLink.get(0).href = detail.fileurl;
    //annLink.addClass("text-link");

    annLink.parents().addBack().show();

    //alert("ANNLINK: " + new XMLSerializer().serializeToString(annLink.get(0)));
  });

  jQuery(document).bind("swAnnotate", event => {
    const detail = event.originalEvent && event.originalEvent.detail;
    sw.annotate(detail);
  });
  jQuery(document).bind("sw_dragstart", event => {
    //sw.log("HTMLDRAGSTART!");
    const detail = event.originalEvent && event.originalEvent.detail;
    //console.log('got sw_dragstart');
    sw.dragDetail = detail;
  });
  let body;
  //TODO: ZD:Check Needed
  prefutil.observeSetting("buttonstyle", function(spec) {
   //alert("BUTT!");
   jQuery("#smartwrap").removeClass("sw_icononly sw_noicon");

   if (spec.value === 'iconsonly') {
   jQuery("#smartwrap").addClass("sw_icononly");
   }
   if (spec.value === 'noicons') {
   jQuery("#smartwrap").addClass("sw_noicon");
   }
   });

  jQuery(document).bind("swWrapperResponse swServerError swServerTimeout swServerCancel", event => {
    //var detail = {};
    //detail.smartwrap = sw;

    sw.status.fresh = false;

    const evt = document.createEvent("CustomEvent");
    evt.initCustomEvent("sw_status", true, true, {
      smartwrap: sw
    });
    document.dispatchEvent(evt);
  });
  jQuery(document).bind("swWrapperResponse", event => {
    const detail = event.originalEvent.detail;

    if (detail && detail.responseText && (!detail.response)) {
      try {
        detail.response = JSON.parse(detail.responseText);
      } catch (ee) {
        sw.log({
          BADRESP: detail.responseText,
          ERROR: ee
        });
      }
    }

    sw.log({
      "WRAPPER RESPONSE": detail,
      response: detail.response,
      contents: detail.response.contents,
      responseKeys: Object.keys(detail.response)
    });

    if (!detail.response) {
      throw "GARBLED RESPONSE TO WRAPPER REQUEST";
    }

    if (!detail.response.contents) {
      throw "MISSING ACTIONABLE CONTENTS IN WRAPPER RESPONSE";
    }


    //alert("CONTENTS: " + JSON.stringify(contents));

    const program = detail.response.explicitProgram;
    //alert("PROGRAM: " + JSON.stringify(program));

    sw.download_urls = detail.response.download_urls;
    sw.response = detail.response;

    // if (sw.getSetting("reportMode") === "MERGE") {
      // var wrapper = detail.response.wrapper;
      // const callback = msg => {
      //   switch (msg) {
      //     case "success":
      //       sw.wrapper = wrapper;
      //
      //       const evt = document.createEvent("CustomEvent");
      //       evt.initCustomEvent("swWrapperReady", true, true, {
      //         wrapper
      //       });
      //       document.dispatchEvent(evt);
      //       break;
      //     case "nohelp":
      //       sw.tellUser({
      //         msgid: "msg_serverNoHelp"
      //       });
      //       break;
      //   }
      // };
      //
      // sw.setProgram(program, {
      //   callback
      // });

    // }
    // if (sw.getSetting("reportMode") === "REPORT") {

      var wrapper = detail.response.wrapper;
      sw.wrapper = wrapper;
      sw.explicitProgram = program;

      const tabs = browser.tabs;
      sw.wrapDoc = ((() => {
        // for (let tabno = 0; tabno < tabs.length; tabno++) {
        //   const browser = tabs[tabno].linkedBrowser;
        //   const taburl = browser.contentDocument.defaultView.location.href;
        //   if (taburl === detail.response.scrapedURL) {
        //     return browser.contentDocument;
        //   }
        // }
        var parser = new DOMParser();

        return parser.parseFromString(sw.docClone,"text/html");
      }))();
      var dummyDetail = {};
      var reportEvent = new CustomEvent("startReport",dummyDetail);
      document.dispatchEvent(reportEvent);

    // }

    /*
     sw.status.fresh = false;

     var evt = document.createEvent("CustomEvent");
     evt.initCustomEvent("sw_status", true, true, detail);
     document.dispatchEvent(evt);
     */

  });
  jQuery(document).bind("sw_status", event => {
    // console.log("in sw_status");
    jQuery(".swUndo").attr('disabled', !sw.getStatus("undo_ready"));
    jQuery("#smarttables").toggleClass("undo_ready", !!sw.getStatus("undo_ready"));

    jQuery(".swRedo").attr('disabled', !sw.getStatus("redo_ready"));
    jQuery(".swRunWrapper").attr('disabled', !sw.getStatus("preview_ready"));
    jQuery(".swSaveWrapper").attr('disabled', !sw.getStatus("save_ready"));
    jQuery(".swSaveCloseWrapper").attr('disabled', !sw.getStatus("save_ready"));
    jQuery(".swDiscardWrapper").attr('disabled', !sw.getStatus("discard_ready"));
  });

  jQuery(document).bind("swWrapperReady", event => {
    const detail = event.originalEvent.detail;


    const wrapper = detail.wrapper;
    sw.wrapper = wrapper;

    sw.log({
      wrapperis: "ready",
      wrapper
    });

    sw.status.fresh = false;

    const evt = document.createEvent("CustomEvent");
    evt.initCustomEvent("sw_status", true, true, detail);
    document.dispatchEvent(evt);
  });

  jQuery("document").bind("swServerReady swServerError swBadResponse", event => {
    const detail = event.originalEvent.detail;
    //alert("SERVER: " + event.type + ":: " + JSON.stringify(detail));
    // console.log("detail status" + detail.status)
    if ((detail.status >= 400) && (detail.status < 600)) {
      sw.tellUser({
        msgid: "msg_serverError"
      });
    }

    sw.log({
      "server event": event.type,
      detail
    });
  });

  jQuery(document).bind("swBadResponse", event => {
    const detail = event.originalEvent.detail;
    //alert("SERVER: " + event.type + ":: " + JSON.stringify(detail));
    //console.log("swBadResponse");
    if (true) {
      sw.tellUser({
        msgid: "msg_serverError"
      });
    }

    sw.log({
      "server event": event.type,
      detail
    });
  });

  jQuery(document).bind("swServerTimeout", event => {
    const detail = event.originalEvent.detail;
    //alert("SERVER: " + event.type + ":: " + JSON.stringify(detail));

    if (true) {
      sw.tellUser({
        msgid: "msg_serverTimeout"
      });
    }

    sw.log({
      "server event": event.type,
      detail
    });
  });

  jQuery(document).bind("swBadRequest", event => {
    let detail = event.originalEvent.detail;
    if (!detail) {
      return;
    }
    alert("MALFORMED HTTP REQUEST: " + JSON.stringify(detail));
  });
  jQuery(document).bind("swUnexpectedResponse", event => {
    let detail = event.originalEvent.detail;
    if (!detail) {
      return;
    }
    alert("UNEXPECTED HTTP RESPONSE: " + JSON.stringify(detail));
  });
  jQuery(document).bind("swServerError", event => {
    let detail = event.originalEvent.detail;
    if (!detail) {
      return;
    }
    if (!detail.url) {
      return;
    }
    //if (detail.status >= 100) { return; }
    //alert("SERVER: " + detail.url + " IS NOT RESPONDING; MAY NOT BE RUNNING");

    //alert(JSON.stringify({status: detail.status}));

    const msgid = (status => {
      console.log("swServerError");
      if (status === 404) {
        return "msg_serverNotResponding";
      }
      return "msg_serverError";
    })(detail.status);

    const tellDetail = {
      msgid,
      serverurl: detail.url
    };

    tellDetail.serverMessage = (text => {
      if (text === '') {
        return null;
      }
      if (text.match(/SmartwrapServlet.java/i)) {
        return null;
      }

      return text;
    })(detail.statusText);


    if (tellDetail.serverMessage) {
      tellDetail.dialogType = "prompt";
      tellDetail.promptValue = tellDetail.serverMessage;
      tellDetail.serverMessage = "Sorry about that.";
    } else {
      tellDetail.serverMessage = "Sorry about that."
    }

    sw.tellUser(tellDetail);
  });

  jQuery(document).bind("dblclick", event => {
    //sw.tellUser({msgid: "msg_dislike", name: "billy"});
  });

  jQuery(document).bind("sw_dialogs", event => {
    let detail = event.originalEvent.detail;
    if (!detail) {
      return;
    }

    //alert("DIALOGS: " + JSON.stringify(detail));

    jQuery(detail.dialogs).each((index, elt) => {
      //alert("DIALOG: " + new XMLSerializer().serializeToString(elt));
      sw.setDialog(elt.id, elt);
    });

    //sw.setDialog();
  });

  jQuery(document).bind("swWrapperRequest", event => {
    // console.log("got wrapper Request");
    //alert(JSON.stringify({req:'wrapper'}));
    const detail = Object.create(event.originalEvent.detail);
    // console.log("examples");
    // console.log(detail.examples);
    try {
      detail.subs = {};
      detail.url = sw.rformat("{serverprepath}{serverpath}{serverquery}", detail.subs, key => sw.getSetting(key));
      // console.log("detail.url: " + detail.url);
      detail.params = {};
      //detail.params["consent"] = detail.consent;
      detail.params["examples"] = JSON.stringify(detail.examples);
      detail.params["domxml"] = detail.domxml;
      if (sw.getSetting("algorithm") === "LIBSVM") {
        detail.params["dominfo"] = detail.bwdominfo;
      }
      detail.params["doctring"] = detail.docstring;
      detail.params["config"] = JSON.stringify({
        url: detail.url
      });
      //alert(JSON.stringify({req:'wrapper', url: detail.url}));

      detail.callbacks = {};
      detail.callbacks.success = (data, textStatus, jqXHR) => {
        //alert(JSON.stringify({resp:'wrapper'}));

        const detail2 = Object.create(detail);
        detail2.response = data;

        const evt = document.createEvent("CustomEvent");
        evt.initCustomEvent("swWrapperResponse", true, true, detail2);
        document.dispatchEvent(evt);

      };
      detail.callbacks.error = (jqHXR, textStatus, errorThrown) => {
        //alert(JSON.stringify({error:'wrapper',stat: textStatus, thrown: errorThrown}));

        const detail2 = Object.create(detail);
        //detail2.status = textStatus;
        detail2.thrown = errorThrown;
        //detail2.status2 = jqHXR.status;
        detail2.status = jqHXR.statusCode().status;
        detail2.statusText = jqHXR.statusCode().statusText;

        detail2.eventName = ((status => {
          if (status === "timeout") {
            return "swServerTimeout";
          }
          return "swServerError";
        })(textStatus));

        const evt = document.createEvent("CustomEvent");
        evt.initCustomEvent(detail2.eventName, true, true, detail2);
        document.dispatchEvent(evt);
      };
      sw.pendingRequests[detail.url] = true;
      detail.callbacks.complete = () => {
        delete sw.pendingRequests[detail.url];
      };
      // console.log("detail.params");
      // console.log(detail.params);
      sw.examples = detail.params.examples;
      detail.jqXHR = jQuery.ajax({
        url: detail.url,
        type: 'POST',
        data: detail.params,
        complete: detail.callbacks.complete,
        success: detail.callbacks.success,
        error: detail.callbacks.error,
        timeout: 20000,
        dataType: "json"
      });
      jQuery(document).unbind("swCancelRequest"); // unbind previous listeners, if any
      jQuery(document).bind("swCancelRequest", event => {
        if (detail.jqXHR.cancelled) {
          return; // a cancelled request need not be aborted again
        }
        detail.jqXHR.cancelled = true;
        detail.jqXHR.abort();
        //alert("ABORT!");
      });

      if (!detail.params.dominfo) {
        const metaurl = sw.rformat("{serverprepath}/smartwrap/Meta", detail.subs, key => sw.getSetting(key));
        // console.log("metaurl: "+metaurl);
        // console.log("swdominfo");
        // console.log(sw);
        console.log("sw-page: print detail.docstring");
        // console.log(detail.docstring);
        const metaload = jQuery.ajax({
          url: metaurl,
          type: 'POST',
          data: {
            domxml: detail.params.domxml,
            dominfo: detail.bwdominfo,
            //dominfo: detail.docstring,
          },
          dataType: "json"
        });

      }
    } catch (ee) {
      detail.logged = {
        "EXCEPTION": ee.message,
        stack: ee.stack,
        "whence": event.type
      };
      alert(JSON.stringify(detail.logged));
      sw.log(detail.logged);
    }

  });

  const pendingRequests = {};

  const badRequest = detail => {
    const evt = document.createEvent("CustomEvent");
    evt.initCustomEvent("swBadRequest", true, true, detail);
    document.dispatchEvent(evt);
  };
  const badResponse = detail => {
    const evt = document.createEvent("CustomEvent");
    evt.initCustomEvent("swUnexpectedResponse", true, true, detail);
    document.dispatchEvent(evt);
  };
  jQuery(document).bind("swHttpRequest", event => {
    try {
      const detail = event.originalEvent && event.originalEvent.detail;

      sw.log({
        domain: "httpRequest",
        detail
      });

      if (!detail.url) {
        return badRequest({
          msg: "missing url",
          detail
        });
      }
      if (!detail.method) {
        detail.method = "POST";
      }
      if (!detail.paramString) {
        if (detail.params) {
          const paramStrings = [];
          for (var key in detail.params) {
            if (detail.params.hasOwnProperty(key)) {
              const val = detail.params[key];
              const pkey = key;
              const pval = escape(val);
              paramStrings.push([pkey, pval].join('='));
            }
          }
          detail.paramString = paramStrings.join('&');
        }
      }
      if ((detail.method === 'POST') && (!detail.paramString)) {
        return badRequest({
          msg: "missing POST params",
          detail
        });
      }

      //alert("HTTPREQ: " + JSON.stringify(detail));

      detail.output = {
        url: detail.url
      };
      detail.output.continuation = detail.continuation;
      const http = new XMLHttpRequest();
      http.addEventListener("error", () => {
        //alert("ERROR!");
        detail.output.readyState = http.readyState;
        detail.output.status = http.status;
        detail.output.statusText = http.statusText;
        detail.output.source = "http error listener";

        const evt = document.createEvent("CustomEvent");
        evt.initCustomEvent("swServerError", true, true, detail.output);
        document.dispatchEvent(evt);

      }, false);

      if (true) {
        http.timeout = detail.timeout;
      } else {
        const timer = window.setTimeout(() => {
          alert("TIMEOUT!");
          http.abort();
          const evt = document.createEvent("CustomEvent");
          evt.initCustomEvent("swServerTimeout", true, true, detail.output);
          document.dispatchEvent(evt);
        }, detail.timeout);
      }

      http.addEventListener("load", () => {

        detail.output.readyState = http.readyState;
        detail.output.status = http.status;
        detail.output.statusText = http.statusText;

        if (http.readyState !== 4) {
          return;
        }
        if (http.status !== 200) {
          detail.output.source = "http load listener";

          var evt = document.createEvent("CustomEvent");
          evt.initCustomEvent("swServerError", true, true, detail.output);
          document.dispatchEvent(evt);

          return;
        }

        //window.clearTimeout(time);
        //alert("TIMEIN!");

        const contentType = http.getResponseHeader("Content-Type");

        detail.output.responseType = contentType;
        ["Content-Disposition"].forEach(key => {
          detail.output[key] = http.getResponseHeader(key);
        });
        if (http.responseType) {
          detail.output.rawResponse = http.response;
        } else {
          detail.output.responseText = http.responseText;
        }
        if (contentType.match(/^application\/json/)) {
          detail.output.response = JSON.parse(http.responseText);
        }
        if (contentType.match(/^text\/plain/)) {
          detail.output.responseLines = http.responseText.split("\n");
        }

        sw.log({
          domain: "httpRequest",
          output: detail.output,
          status: detail.output.statusText,
          eventName: detail.eventName,
          detail
        });

        var evt = document.createEvent("CustomEvent");
        evt.initCustomEvent(detail.eventName, true, true, detail.output);
        document.dispatchEvent(evt);
      }, false);

      http.open(detail.method, detail.url, true);
      if (detail.responseType) {
        http.responseType = detail.responseType;
      }
      //Send the proper header information along with the request
      http.setRequestHeader("Connection", "close");
      if (detail.method === "POST") {
        http.setRequestHeader("Content-type", "application/x-www-form-urlencoded;charset=UTF-8");
        http.setRequestHeader("Content-length", detail.paramString.length);
        http.send(detail.paramString);
      } else {
        http.send(null);
      }
    } catch (exc) {
      alert("EXCEPTION: " + exc);
    }

  });
  jQuery(document).bind("swExportRequest", event => {
    const detail = event.originalEvent && event.originalEvent.detail;

    const settings = {}; // sw.settings;

    const subs = {};
    const httpDetail = {};
    httpDetail.eventName = "swExportResponse";
    httpDetail.url = sw.rformat("{serverprepath}/Export", subs, key => sw.getSetting(key));
    httpDetail.timeout = sw.getSetting("serverTimeout");
    httpDetail.params = {};
    httpDetail.params.format = detail.format;
    httpDetail.params.relations = JSON.stringify(detail.relations);
    httpDetail.params.target = detail.format;

    if (!httpDetail.params.format) {
      return badRequest({
        msg: "format required for export",
        detail: httpDetail
      });
    }
    if (!httpDetail.params.relations) {
      return badRequest({
        msg: "relations required for export",
        detail: httpDetail
      });
    }

    if (httpDetail.params.format === "xls") {
      httpDetail.responseType = "arraybuffer";
    }

    const evt = document.createEvent("CustomEvent");
    evt.initCustomEvent("swHttpRequest", true, true, httpDetail);
    document.dispatchEvent(evt);
  });

  jQuery(document).bind("swExportResponse", event => {
    //alert("IMPORT: " + JSON.stringify(event.originalEvent.detail,null,2));

    const detail = event.originalEvent && event.originalEvent.detail;

    detail.fileDetail = {};

    let response = detail.response;
    const responseType = detail.responseType;
    if (detail["Content-Disposition"]) {
      const arrayBuffer = detail.rawResponse;
      if (arrayBuffer) {
        const byteArray = new Uint8Array(arrayBuffer);
        const i = 0;

        detail.fileDetail.bytes = byteArray;

        var evt = document.createEvent("CustomEvent");
        evt.initCustomEvent("sw_savelocalfile", true, true, detail.fileDetail);
        exportButton.get(0).dispatchEvent(evt);
        return;
      }
    }
    if (!response) {
      badResponse({
        msg: "no object in response",
        detail
      });
    }

    if (response.redirect) {
      //alert("OPEN RESOURCE: " + JSON.stringify(response));

      var evt = document.createEvent("CustomEvent");
      evt.initCustomEvent("sw_openurl", true, true, response);
      document.dispatchEvent(evt);

      return;
    }

    detail.fileDetail.filecontents = response.contents;

    //alert("FILEDETAIL: |" + JSON.stringify(fileDetail));

    var evt = document.createEvent("CustomEvent");
    evt.initCustomEvent("sw_savelocalfile", true, true, fileDetail);
    exportButton.get(0).dispatchEvent(evt);


  });

  jQuery(document).bind("swPing", event => {
    alert("SWECHO: " + JSON.stringify(event.originalEvent.detail));
  });

  jQuery(document).bind("swSaveResponse", function (event) {
    const detail = event.originalEvent && event.originalEvent.detail;
    //alert("SAVED: " + detail.continuation);
    sw.log({
      SAVED: detail
    });
    if (detail.continuation) {
      detail.continuation.call(this, detail);
    }
  });

  jQuery(document).bind("swRunWrapper swUndo sw_reportSlot", event => {
    const eventType = event.type;
    //<editor-fold desc="yxl:ifFalseCodeBlock">
    if (false) {
      const obj = {
        "PROXY": eventType,
        keys: JSON.stringify(Object.keys(event)),
        via: event.originalEvent.detail.via
      };
      setTimeout(() => {
        alert(JSON.stringify(obj));
      }, 800);
    }
    //</editor-fold>

    sw.getHandler(eventType).call(sw, event);

    event.stopPropagation();
    event.preventDefault();

    sw.status.fresh = false;
    const evt = document.createEvent("CustomEvent");
    evt.initCustomEvent("sw_status", true, true, {
      smartwrap: sw
    });
    document.dispatchEvent(evt);
  });

  /*
   jQuery(document).bind("swRunWrapper", function(event) {
   var detail = event.originalEvent.detail;

   detail["examples"] = sw.getProgram();
   detail["bwdominfo"] = sw.bwdominfo;
   detail["domxml"] = sw.domxml;
   //alert("RUN: " + JSON.stringify(Object.keys(detail)));

   var evt = document.createEvent("CustomEvent");
   evt.initCustomEvent("swWrapperRequest", true, true, detail);
   document.dispatchEvent(evt);
   });
   */

  jQuery(document).bind("swSaveWrapper", event => {
    try {
      const detail = event.originalEvent && event.originalEvent.detail;

      sw.log({
        domain: "saveWrapper",
        detail,
        continuation: detail.continuation
      });

      const settings = {}; // sw.settings;
      const subs = {};
      const httpDetail = {};
      httpDetail.eventName = "swSaveResponse";
      httpDetail.url = sw.rformat("{serverprepath}/Persist", subs, key => sw.getSetting(key));
      httpDetail.timeout = sw.getSetting("serverTimeout");
      httpDetail.params = {};
      // console.log("inSave");
      // console.log(JSON.stringify(sw.getProgram()));
      httpDetail.params.wrapper = JSON.stringify(sw.getProgram());
      httpDetail.continuation = detail.continuation || (() => {
          alert("The wrapper was saved");
        });

      sw.log({
        domain: "saveWrapper",
        http: httpDetail
      });

      if (!httpDetail.params.wrapper) {
        return badRequest({
          msg: "wrapper required for saving",
          detail: httpDetail
        });
      }

      if (true) {
        const evt = document.createEvent("CustomEvent");
        evt.initCustomEvent("swHttpRequest", true, true, httpDetail);
        document.dispatchEvent(evt);
      } else {
        sw.log({
          POOF: true,
          SAVE: event.type,
          wrapper: sw.wrapper
        });
        if (httpDetail && httpDetail.continuation) {
          httpDetail.continuation.call(null, {});
        } else {
          alert("The wrapper was saved, ya bastard");
        }
      }
    } catch (ee) {
      sw.log({
        "EXCEPTION": ee.message,
        stack: ee.stack,
        "whence": event.type
      });
    }
  });

  jQuery(document).bind("swSaveCloseWrapper", event => {
    const detail = event.originalEvent && event.originalEvent.detail;

    const saveDetail = {
      source: "smartwrap"
    };
    saveDetail.continuation = () => {
      const evt = document.createEvent("CustomEvent");
      evt.initCustomEvent("swDiscardWrapper", true, true, {
        noRestart: true
      });
      document.dispatchEvent(evt);
    };

    var evt = document.createEvent("CustomEvent");
    evt.initCustomEvent("swSaveWrapper", true, true, saveDetail);
    document.dispatchEvent(evt);
  });

  jQuery(document).bind("swDiscardWrapper", event => {
    //alert("DISCARD: " + JSON.stringify(Object.keys(pendingRequests)));

    Object.keys(pendingRequests).forEach(url => {
      const reqObj = pendingRequests[url];
      //alert("URL: " + url);
      try {
        if (reqObj !== null) {
          reqObj.req.abort();
        }
        //alert("ABORTED: " + url);
      } catch (ee) {
        alert("PROB: " + ee.message);
      }
    });

    sw.wrapper = null;
    sw.clearTables();

    sw.status.fresh = false;
    const evt = document.createEvent("CustomEvent");
    evt.initCustomEvent("sw_status", true, true, {
      smartwrap: sw
    });
    document.dispatchEvent(evt);

    sw.log({
      POOF: true,
      DISCARD: event.type,
      wrapper: sw.wrapper
    });
  });


  const exportForm = jQuery("#exportForm");
  var exportButton = jQuery("#exporter");
  const exportFormatField = exportForm.find("#format");
  exportForm.find('[name="format"]').change(event => {
    const target = event.target;
    //alert("DELTA: " + target.value + ":: " + target.checked);
    if (target.checked) {
      exportFormatField.get(0).value = target.value;
    }
  });
  jQuery("#exporter").click(event => {
    //alert("FORM: " + new XMLSerializer().serializeToString(exportForm.get(0)));
    const exportDetail = {};
    exportDetail.format = exportFormatField.get(0).value;
    exportDetail.relations = sw.getRelations();

    const evt = document.createEvent("CustomEvent");
    evt.initCustomEvent("swExportRequest", true, true, exportDetail);
    exportButton.get(0).dispatchEvent(evt);
  });
  jQuery("#exportJSON").click(event => {
    exportForm.find("#format_json").click();
    exportButton.click();
  });

  exportButton = jQuery("#exportExecute");
  jQuery("#exportExecute").button({
    disabled: true
  });
  /*
   jQuery("#exportPicker").button({
   icons: {
   secondary: "ui-icon-triangle-1-s"
   }
   });
   */
  const formatPicker = jQuery("#exportPicker");
  jQuery("#exportExecute").parent().buttonset();
  jQuery("#exportExecute").click(event => {
    //alert("EXPORT: " + new XMLSerializer().serializeToString(formatPicker.get(0)));

    const chosenOption = formatPicker.find("option").filter(":selected");
    //alert("CHOICE: " + new XMLSerializer().serializeToString(chosenOption.get(0)));
    const format = chosenOption.get(0).value;

    const exportDetail = {};
    exportDetail.format = format;

    alert("FORMAT: " + format);
    if (format === "annotation") {
      exportDetail.source = "smartwrap";
      exportDetail.extension = ".html";
      //exportDetail.suggestion = "annotation.html";

      var evt = document.createEvent("CustomEvent");
      evt.initCustomEvent("swAnnotate", true, true, exportDetail);
      exportButton.get(0).dispatchEvent(evt);

      return;
    }

    exportDetail.relations = sw.getRelations();

    var evt = document.createEvent("CustomEvent");
    evt.initCustomEvent("swExportRequest", true, true, exportDetail);
    exportButton.get(0).dispatchEvent(evt);
  });
  jQuery(document).bind("sw_datacell", event => {
    exportButton.button("option", "disabled", false);
  });

}

export default swp;
