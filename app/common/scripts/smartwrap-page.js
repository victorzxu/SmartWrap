//TODO:  What functions in here need to be moved to a sidebar script, or a content script?
jQuery(document).ready(function() {
  "use strict";

  console.log("We're in!");
  window.scrollbars.visible = false;
  // added this line per
  //http://old.nabble.com/Re%3A-Disable-scrollbars-in-browser-control-within-XUL-application-p5112444.html
  // since the browser now scrolls for itself in the #smarttables
  // div

  //this is in the sidebar
  jQuery("#smarttables").resizable({
    animate: true,
    grid: [50, 5],
    handles: "s",
    stop: function() {
      setTimeout(function() {
        jQuery("#smarttables").animate({
          width: "100%"
        });
      }, 0);
    },
  });

  var sw = Object.create(Smartwrap);

  sw.contextmenu = jQuery("ul#smartwrap_contextmenu");
  sw.contextmenu.menu({
    select: function(event, ui) {
      event.stopPropagation();
      event.preventDefault();

      sw.contextmenu.hide();
      jQuery(".contextualized").removeClass("contextualized");
      setTimeout(function() {
        var item = jQuery(ui.item).find(".sw_menuitem").get(0);
        var eventType = item.getAttributeNS(smartwrapNamespace, "eventType") || item.getAttribute("sw:eventType");

        var context = jQuery(sw.contextmenu.data("context"));

        var detail = {};

        //alert(JSON.stringify({SELECT: Object.keys(event), UI: Object.keys(ui), ITEM: new XMLSerializer().serializeToString(item), CTXT: new XMLSerializer().serializeToString(context.get(0)), EVENT: eventType}, null, 2));

        var evt = document.createEvent("CustomEvent");
        evt.initCustomEvent(eventType, true, false, detail);
        //evt.ui = ui;
        //evt.detail = detail;
        jQuery(context).get(0).dispatchEvent(evt);

      }, 10);
    },
    blur2: function() {
      setTimeout(function() {
        sw.contextmenu.hide();
      }, 1200);
    },
  });
  jQuery("#templates .template").each(function(index, elt) {
    //alert("TEMPLATE: " + new XMLSerializer().serializeToString(elt));
    Smartwrap.setTemplate(elt.id, elt);
    Smartwrap.SmartTable.setTemplate(elt.id, elt);
  });

  var st0 = jQuery("#smarttable0");
  var st0copy = jQuery("#smarttable0").clone();

  jQuery("#smarttables").on("add_table", function(event) {
    var spec = (event && event.originalEvent && event.originalEvent.detail) || {};
    event.spec2 = Object.create(spec);
    if (!event.spec2.tabno) {
      event.spec2.tabno = sw.uidgen();
    }
    if (!event.spec2.index) {
      //event.spec2.index = -1 + swTabs.tabs("length");
    }
    var iii = 0;
    var jjj = 1200;

    event.spec2.tabid = jQuery.format("smarttable{tabno}", event.spec2);
    var href = jQuery.format("#{tabid}", event.spec2);
    var label = event.spec2.labelText = jQuery.format("Table {tabno}", event.spec2);

    var pTempl = swTabs.tabs('widget').data('panelTemplate');
    event.spec2.panel = jQuery(pTempl).clone().appendTo(swTabs.tabs('widget'));
    event.spec2.panel.attr('id', event.spec2.tabid);

    var tTempl = swTabs.tabs('widget').data('tabTemplate');
    //var tabElt = jQuery(tTempl).clone().appendTo(swTabs.tabs('widget').find("ul"));
    var tabElt = event.spec2.tab = jQuery(tTempl).clone().insertBefore(swTabs.tabs('widget').find("ul li").last());
    tabElt.find("a").first().attr("href", href);
    tabElt.find("a .label").first().text(label);

    sw.emit(jQuery("#smarttables"), "bind_table", event.spec2);

    swTabs.tabs('refresh');

    tabElt.find("a").first().click();

    sw.log({
      STADDTAB: event.spec2
    });
  });
  jQuery(document).on("bind_table", function(event) {
    var spec = (event && event.originalEvent && event.originalEvent.detail) || {};
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
    event.spec2.table.viewNames.forEach(function(key) {
      event.spec2.containers[key] = jQuery(event.spec2.panel).find("." + key).get(0);
    });
    event.spec2.table.setContainers(event.spec2.containers);

    //event.spec2.panel.find(".tablename").val(event.spec2.labelText);
    event.spec2.panel.find(".tablename").val(event.spec2.labelText);

    event.spec2.panel.on("rename_table", function(delta) {
      //setTimeout(function() { alert('RDELTA'); }, 1200);
      event.spec2.tab.find("a .label").first().text(event.spec2.panel.find(".tablename").val().slice(0, 20));
    });

    sw.log({
      STBINDTAB: Object.keys(event.spec2)
    });
  });
  jQuery(document).on("rename_table", function(event) {
    var spec = (event && event.originalEvent && event.originalEvent.detail) || {};
    sw.log({
      RENAME_TABLE: event,
      SPEC: spec
    });
  });

  jQuery(document).on("consent", function(event) {
    setTimeout(function() {
      //alert("HIHITELLUSER");
      //sw.tellUser({msgid: "msg_consent"});
      window.open('chrome://smartwrap/content/consent.html');
      //alert("HIHITELLUSER2");
    }, 100);
  });

  var sink = jQuery(".sink");
  var getKeyString = function(charCode) {
    if (charCode === 46) {
      return "del";
    }
    if (charCode === 8) {
      return "\\b";
    }
    return String.fromCharCode(charCode);
  };
  jQuery(".sink").on("keypress", function(event) {
    var key = [
      event.shiftKey ? "shift-" : "",
      event.ctrlKey ? "ctrl-" : "",
      event.metaKey ? "meta-" : "",
      event.altKey ? "alt-" : "",
      getKeyString(Math.max(event.which, event.keyCode)),
      //Math.max(event.which,event.keyCode),
      ""
    ].join("");

    sink.val(JSON.stringify({
      key: key,
      code: Math.max(event.which, event.keyCode),
      cb: !!sw.shortcuts[key]
    }));
    //sink.select();

    var callback = sw.shortcuts[key];

    if (callback) {
      callback.call();
      event.preventDefault();
    }
  });

  var swTabs = jQuery("#smarttables").tabs({ //collapsible: true,
    active: false,
    activate: function(event, ui) {
      //alert("NOW: " + new XMLSerializer().serializeToString(ui.tab.parentNode));
      var newtab = (ui.tab && (ui.tab.id === 'newtab'));
      if (ui.newTab && (jQuery(ui.newTab).find("a#newtab").length > 0)) {
        newtab = true;
      }
      if (newtab) {

        var spec = {};
        spec.callback = function(newid) {
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
    add: function(event, ui) {
      var newtab = ui.tab;
      var label = jQuery(newtab).find(".label").get(0);

      var labelText = jQuery(label).text(); // label.inner//HTML;

      //jQuery(newtab).find("input").bind("change", labelSync(label));
      //swTabs.tabs('select', "#"+ui.panel.id);
      swTabs.tabs('option', 'panelTemplate', st0copy.clone().get(0));
      swTabs.tabs('widget').data('panelTemplate', st0copy.clone().get(0));

      jQuery(ui.panel).find(".tablename").val(labelText);
      jQuery(ui.panel).find(".tablename").bind("change", function(event) {
        //alert("CHANGED0");
        //label.innerHTML = jQuery(event.target).val();
        //alert("CHANGED");

        sw.emit(jQuery(event.target), "rename_table", {
          to: jQuery(event.target).val()
        });
      });

      jQuery(ui.panel).on("rename_table", function(event) {
        //alert(JSON.stringify({RENAME:2,html:label.innerHTML, text: jQuery(label).text()}));

        jQuery(label).text(jQuery(ui.panel).find(".tablename").val());
      });

      var spec = swTabs.tabs('option', 'spec') || {};
      spec.id = ui.panel.id;
      spec.panel = ui.panel;
      spec.labelText = labelText;
      if (true) {
        sw.emit(jQuery("#smarttables"), "bind_table", spec);

        if (spec.callback) {
          //alert('luvya');
          spec.callback.call(null, spec.id);
        }
      } else {
        var stN = sw.newTable(ui.panel.id);
        ui.containers = {};
        stN.viewNames.forEach(function(key) {
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

  jQuery(document).bind("sw_addtable", function(event) {
    var detail = event.originalEvent && event.originalEvent.detail;

    try {
      var curr = swTabs.tabs("option", "selected");
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

  var label0 = jQuery("#tab0").find(".label").get(0);

  jQuery("#smarttable0").on("rename_table", function(event) {
    //alert(JSON.stringify({RENAME: 1, html: label0.innerHTML, text: jQuery(label0).text()}));

    jQuery(label0).text(jQuery("#smarttable0").find(".tablename").val().slice(0, 20));
  });

  jQuery("#smarttables").on("click", ".ui-icon-close", function(event) {
    var target = event.target;
    var tab = target.parentNode;
    var href = jQuery(tab).find("a").get(0).getAttribute("refid");
    //alert("HI: " + new XMLSerializer().serializeToString(tab) + ":: " + href);
    swTabs.tabs("remove", href);
  });

  sw.init({
    "table0": st0.get(0).id
  });
  sw.setPalette("columnPalette", Smartwrap.monoPalette);
  sw.setPalette("tablePalette", Smartwrap.mainPalette);
  sw.containers = {};
  sw.tables[st0.get(0).id].viewNames.forEach(function(key) {
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


  var activate = function(widget) {
    if (widget.disabled) {
      return;
    }

    //alert("BUTTON: " + new XMLSerializer().serializeToString(widget));

    var eventType = widget.getAttributeNS(smartwrapNamespace, "eventType") || widget.getAttribute("sw:eventType");
    if (!eventType) {
      return;
    }

    //alert("BUTTON: " + eventType);

    widget.detail = {
      source: "page"
    };
    widget.detail.target = jQuery(widget).parents("html").find(".sw_selected").get(0);
    //alert('selection: ' + JSON.stringify(detail))

    var evt = document.createEvent("CustomEvent");
    evt.initCustomEvent(eventType, true, false, widget.detail);
    document.dispatchEvent(evt);
  };
  jQuery(".sw_button").click(function(event) {
    var widget = event.target;
    activate(widget);
    //sw.getHandler(eventType).call(sw, evt);
  });
  sw.shortcuts = {};
  jQuery(".sw_button, .sw_menuitem").each(function(ix, elt) {
    var button = jQuery(elt);
    var shortcut = elt.getAttributeNS(smartwrapNamespace, "shortcut") || elt.getAttribute("sw:shortcut");
    if (shortcut) {
      shortcut.split(/\s+/).forEach(function(key) {
        sw.shortcuts[key] = function() {
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

  jQuery(document).bind("hideSidebar", function(event) {
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

    var evt = document.createEvent("CustomEvent");
    evt.initCustomEvent("sw_status", true, true, {
      smartwrap: sw
    });
    document.dispatchEvent(evt);
  });

  jQuery(document).bind("sw_targetdocument", function(event) {
    var detail = event.originalEvent && event.originalEvent.detail;

    if (detail && detail.document) {
      sw.processDOM(detail.document, detail.target);
    }
  });

  jQuery(document).bind("sw_outofbounds", function(event) {
    var detail = event.originalEvent && event.originalEvent.detail;
    sw.log({
      OOB: "received",
      detail: detail
    });

    jQuery("#smartwrap").addClass("disabled");
  });

  jQuery(document).bind("sw_inbounds", function(event) {
    jQuery("#smartwrap").removeClass("disabled");
  });

  jQuery(document).bind("sw_configure", function(event) {
    //alert("SWCONFIG!");
    var detail = event.originalEvent && event.originalEvent.detail;
    if (detail.config.developermode) {
      jQuery(".sw_mode").removeClass("nonDeveloper");
    } else {
      jQuery(".sw_mode").addClass("nonDeveloper");
    }


    if (event && event.originalEvent) {
      sw.configure(event.originalEvent.detail);
    }
  });
  jQuery(document).bind("sw_autodrop", function(event) {
    alert("HTMLAUTODROP!");
  });

  jQuery(document).bind("sw_dom", function(event) {
    var detail = event.originalEvent && event.originalEvent.detail;
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

  var annLink = jQuery(document).find("#handyLink a");
  jQuery(document).bind("sw_annotatedfile", function(event) {
    var detail = event.originalEvent && event.originalEvent.detail;
    sw.log({
      "ANNOTATED": detail
    });

    var dependencies = detail.dependencies;

    dependencies.forEach(function(depDetail) {
      depDetail.filedir = detail.filename;

      //alert("DEPDETAIL: " + JSON.stringify(depDetail));

      var evt = document.createEvent("CustomEvent");
      evt.initCustomEvent("sw_urltofile", true, false, depDetail);
      document.dispatchEvent(evt);
    });

    annLink.get(0).href = detail.fileurl;
    //annLink.addClass("text-link");

    annLink.parents().andSelf().show();

    //alert("ANNLINK: " + new XMLSerializer().serializeToString(annLink.get(0)));
  });

  jQuery(document).bind("swAnnotate", function(event) {
    var detail = event.originalEvent && event.originalEvent.detail;
    sw.annotate(detail);
  });
  jQuery(document).bind("sw_dragstart", function(event) {
    //sw.log("HTMLDRAGSTART!");
    var detail = event.originalEvent && event.originalEvent.detail;
    sw.dragDetail = detail;
  });

  var body
  /*prefutil.observeSetting("buttonstyle", function(spec) {
    //alert("BUTT!");
    jQuery("#smartwrap").removeClass("sw_icononly sw_noicon");

    if (spec.value === 'iconsonly') {
      jQuery("#smartwrap").addClass("sw_icononly");
    }
    if (spec.value === 'noicons') {
      jQuery("#smartwrap").addClass("sw_noicon");
    }
  });*/

  jQuery(document).bind("swWrapperResponse swServerError swServerTimeout swServerCancel", function(event) {
    //var detail = {};
    //detail.smartwrap = sw;

    sw.status.fresh = false;

    var evt = document.createEvent("CustomEvent");
    evt.initCustomEvent("sw_status", true, true, {
      smartwrap: sw
    });
    document.dispatchEvent(evt);
  });
  jQuery(document).bind("swWrapperResponse", function(event) {
    var detail = event.originalEvent.detail;

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

    var contents = detail.response.contents;

    //alert("CONTENTS: " + JSON.stringify(contents));

    var program = detail.response.explicitProgram;
    //alert("PROGRAM: " + JSON.stringify(program));

    sw.download_urls = detail.response.download_urls;
    sw.response = detail.response;

    if (sw.getSetting("reportMode") === "MERGE") {
      var wrapper = detail.response.wrapper;
      var callback = function(msg) {
        switch (msg) {
          case "success":
            sw.wrapper = wrapper;

            var evt = document.createEvent("CustomEvent");
            evt.initCustomEvent("swWrapperReady", true, true, {
              wrapper: wrapper
            });
            document.dispatchEvent(evt);
            break;
          case "nohelp":
            sw.tellUser({
              msgid: "msg_serverNoHelp"
            });
            break;
        }
      }

      sw.setProgram(program, {
        callback: callback
      });

    }
    if (sw.getSetting("reportMode") === "REPORT") {
      var wrapper = detail.response.wrapper;
      sw.wrapper = wrapper;
      sw.explicitProgram = program;

      var tabs = browser.tabs;
      sw.wrapDoc = (function() {
        for (var tabno = 0; tabno < tabs.length; tabno++) {
          var browser = tabs[tabno].linkedBrowser;
          var taburl = browser.contentDocument.defaultView.location.href;
          if (taburl === detail.response.scrapedURL) {
            return browser.contentDocument;
          }
        }
        return sw.currentWindow.getBrowser().contentDocument;
      })();

      window.open('chrome://smartwrap/content/smartwrapReport.html');
    }

    /*
sw.status.fresh = false;

var evt = document.createEvent("CustomEvent");
evt.initCustomEvent("sw_status", true, true, detail);
document.dispatchEvent(evt);
      */

  });
  jQuery(document).bind("sw_status", function(event) {
    jQuery(".swUndo").attr('disabled', !sw.getStatus("undo_ready"));
    jQuery("#smarttables").toggleClass("undo_ready", !!sw.getStatus("undo_ready"));

    jQuery(".swRedo").attr('disabled', !sw.getStatus("redo_ready"));

    jQuery(".swRunWrapper").attr('disabled', !sw.getStatus("preview_ready"));
    jQuery(".swSaveWrapper").attr('disabled', !sw.getStatus("save_ready"));
    jQuery(".swSaveCloseWrapper").attr('disabled', !sw.getStatus("save_ready"));
    jQuery(".swDiscardWrapper").attr('disabled', !sw.getStatus("discard_ready"));
  });

  jQuery(document).bind("swWrapperReady", function(event) {
    var detail = event.originalEvent.detail;


    var wrapper = detail.wrapper;
    sw.wrapper = wrapper;

    sw.log({
      wrapperis: "ready",
      wrapper: wrapper
    });

    sw.status.fresh = false;

    var evt = document.createEvent("CustomEvent");
    evt.initCustomEvent("sw_status", true, true, detail);
    document.dispatchEvent(evt);
  });

  jQuery("document").bind("swServerReady swServerError swBadResponse", function(event) {
    var detail = event.originalEvent.detail;
    //alert("SERVER: " + event.type + ":: " + JSON.stringify(detail));

    if ((detail.status >= 400) && (detail.status < 600)) {
      sw.tellUser({
        msgid: "msg_serverError"
      });
    }

    sw.log({
      "server event": event.type,
      detail: detail
    });
  });

  jQuery(document).bind("swBadResponse", function(event) {
    var detail = event.originalEvent.detail;
    //alert("SERVER: " + event.type + ":: " + JSON.stringify(detail));

    if (true) {
      sw.tellUser({
        msgid: "msg_serverError"
      });
    }

    sw.log({
      "server event": event.type,
      detail: detail
    });
  });

  jQuery(document).bind("swServerTimeout", function(event) {
    var detail = event.originalEvent.detail;
    //alert("SERVER: " + event.type + ":: " + JSON.stringify(detail));

    if (true) {
      sw.tellUser({
        msgid: "msg_serverTimeout"
      });
    }

    sw.log({
      "server event": event.type,
      detail: detail
    });
  });

  jQuery(document).bind("swBadRequest", function(event) {
    var detail = event.originalEvent.detail;
    if (!detail) {
      return;
    }
    alert("MALFORMED HTTP REQUEST: " + JSON.stringify(detail));
  });
  jQuery(document).bind("swUnexpectedResponse", function(event) {
    var detail = event.originalEvent.detail;
    if (!detail) {
      return;
    }
    alert("UNEXPECTED HTTP RESPONSE: " + JSON.stringify(detail));
  });
  jQuery(document).bind("swServerError", function(event) {
    var detail = event.originalEvent.detail;
    if (!detail) {
      return;
    }
    if (!detail.url) {
      return;
    }
    //if (detail.status >= 100) { return; }
    //alert("SERVER: " + detail.url + " IS NOT RESPONDING; MAY NOT BE RUNNING");

    //alert(JSON.stringify({status: detail.status}));

    var msgid = function(status) {
      if (status == 404) {
        return "msg_serverNotResponding";
      }
      return "msg_serverError";
    }(detail.status);

    var tellDetail = {
      msgid: msgid,
      serverurl: detail.url
    };

    tellDetail.serverMessage = function(text) {
      if (text === '') {
        return null;
      }
      if (text.match(/SmartwrapServlet.java/i)) {
        return null;
      }

      return text;
    }(detail.statusText);

    if (tellDetail.serverMessage) {
      tellDetail.dialogType = "prompt";
      tellDetail.promptValue = tellDetail.serverMessage;
      tellDetail.serverMessage = "Sorry about that.";
    } else {
      tellDetail.serverMessage = "Sorry about that."
    }

    sw.tellUser(tellDetail);
  });

  jQuery(document).bind("dblclick", function(event) {
    //sw.tellUser({msgid: "msg_dislike", name: "billy"});
  });

  jQuery(document).bind("sw_dialogs", function(event) {
    var detail = event.originalEvent.detail;
    if (!detail) {
      return;
    }

    //alert("DIALOGS: " + JSON.stringify(detail));

    jQuery(detail.dialogs).each(function(index, elt) {
      //alert("DIALOG: " + new XMLSerializer().serializeToString(elt));
      sw.setDialog(elt.id, elt);
    });

    //sw.setDialog();
  });

  jQuery(document).bind("swWrapperRequest", function(event) {
    //alert(JSON.stringify({req:'wrapper'}));
    var detail = Object.create(event.originalEvent.detail);

    try {
      detail.subs = {};
      detail.url = sw.rformat("{serverprepath}{serverpath}{serverquery}", detail.subs, function(key) {
        return sw.getSetting(key);
      });
      detail.params = {};
      detail.params["consent"] = detail.consent;
      detail.params["examples"] = JSON.stringify(detail.examples);
      detail.params["domxml"] = encodeURIComponent(detail.domxml);
      if (sw.getSetting("algorithm") === "LIBSVM") {
        detail.params["dominfo"] = encodeURIComponent(JSON.stringify(detail.bwdominfo));
      }
      detail.params["config"] = JSON.stringify({
        url: detail.url
      });
      //alert(JSON.stringify({req:'wrapper', url: detail.url}));

      detail.callbacks = {};
      detail.callbacks.success = function(data, textStatus, jqXHR) {
        //alert(JSON.stringify({resp:'wrapper'}));

        var detail2 = Object.create(detail);
        detail2.response = data;

        var evt = document.createEvent("CustomEvent");
        evt.initCustomEvent("swWrapperResponse", true, true, detail2);
        document.dispatchEvent(evt);

      };
      detail.callbacks.error = function(jqHXR, textStatus, errorThrown) {
        //alert(JSON.stringify({error:'wrapper',stat: textStatus, thrown: errorThrown}));

        var detail2 = Object.create(detail);
        //detail2.status = textStatus;
        detail2.thrown = errorThrown;
        //detail2.status2 = jqHXR.status;
        detail2.status = jqHXR.statusCode().status;
        detail2.statusText = jqHXR.statusCode().statusText;

        detail2.eventName = (function(status) {
          if (status === "timeout") {
            return "swServerTimeout";
          }
          return "swServerError";
        }(textStatus));

        var evt = document.createEvent("CustomEvent");
        evt.initCustomEvent(detail2.eventName, true, true, detail2);
        document.dispatchEvent(evt);
      };
      sw.pendingRequests[detail.url] = true;
      detail.callbacks.complete = function() {
        delete sw.pendingRequests[detail.url];
      };

      detail.jqXHR = jQuery.ajax({
        url: detail.url,
        type: 'POST',
        data: detail.params,
        complete: detail.callbacks.complete,
        success: detail.callbacks.success,
        error: detail.callbacks.error,
        timeout: sw.getSetting("servertimeout"),
        dataType: "json"
      });
      jQuery(document).unbind("swCancelRequest"); // unbind previous listeners, if any
      jQuery(document).bind("swCancelRequest", function(event) {
        if (detail.jqXHR.cancelled) {
          return; // a cancelled request need not be aborted again
        }
        detail.jqXHR.cancelled = true;
        detail.jqXHR.abort();
        //alert("ABORT!");
      });

      if (!detail.params.dominfo) {
        var metaurl = sw.rformat("{serverprepath}/smartwrap/Meta", detail.subs, function(key) {
          return sw.getSetting(key);
        });
        var metaload = jQuery.ajax({
          url: metaurl,
          type: 'POST',
          data: {
            domxml: detail.params.domxml,
            dominfo: encodeURIComponent(JSON.stringify(detail.bwdominfo))
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

  var pendingRequests = {};

  var badRequest = function(detail) {
    var evt = document.createEvent("CustomEvent");
    evt.initCustomEvent("swBadRequest", true, true, detail);
    document.dispatchEvent(evt);
  };
  var badResponse = function(detail) {
    var evt = document.createEvent("CustomEvent");
    evt.initCustomEvent("swUnexpectedResponse", true, true, detail);
    document.dispatchEvent(evt);
  };
  jQuery(document).bind("swHttpRequest", function(event) {
    try {
      var detail = event.originalEvent && event.originalEvent.detail;

      sw.log({
        domain: "httpRequest",
        detail: detail
      });

      if (!detail.url) {
        return badRequest({
          msg: "missing url",
          detail: detail
        });
      }
      if (!detail.method) {
        detail.method = "POST";
      }
      if (!detail.paramString) {
        if (detail.params) {
          var paramStrings = [];
          for (var key in detail.params) {
            if (detail.params.hasOwnProperty(key)) {
              var val = detail.params[key];
              var pkey = key;
              var pval = escape(val);
              paramStrings.push([pkey, pval].join('='));
            }
          }
          detail.paramString = paramStrings.join('&');
        }
      }
      if ((detail.method === 'POST') && (!detail.paramString)) {
        return badRequest({
          msg: "missing POST params",
          detail: detail
        });
      }

      //alert("HTTPREQ: " + JSON.stringify(detail));

      detail.output = {
        url: detail.url
      };
      detail.output.continuation = detail.continuation;
      var http = new XMLHttpRequest();
      http.addEventListener("error", function() {
        //alert("ERROR!");
        detail.output.readyState = http.readyState;
        detail.output.status = http.status;
        detail.output.statusText = http.statusText;
        detail.output.source = "http error listener";

        var evt = document.createEvent("CustomEvent");
        evt.initCustomEvent("swServerError", true, true, detail.output);
        document.dispatchEvent(evt);

      }, false);

      if (true) {
        http.timeout = detail.timeout;
      } else {
        var timer = window.setTimeout(function() {
          alert("TIMEOUT!");
          http.abort();
          var evt = document.createEvent("CustomEvent");
          evt.initCustomEvent("swServerTimeout", true, true, detail.output);
          document.dispatchEvent(evt);
        }, detail.timeout);
      }

      http.addEventListener("load", function() {

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

        var contentType = http.getResponseHeader("Content-Type");

        detail.output.responseType = contentType;
        ["Content-Disposition"].forEach(function(key) {
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
          detail: detail
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
  jQuery(document).bind("swExportRequest", function(event) {
    var detail = event.originalEvent && event.originalEvent.detail;

    var settings = {}; // sw.settings;

    var subs = {};
    var httpDetail = {};
    httpDetail.eventName = "swExportResponse";
    httpDetail.url = sw.rformat("{serverprepath}/Export", subs, function(key) {
      return sw.getSetting(key);
    });
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

    var evt = document.createEvent("CustomEvent");
    evt.initCustomEvent("swHttpRequest", true, true, httpDetail);
    document.dispatchEvent(evt);
  });

  jQuery(document).bind("swExportResponse", function(event) {
    //alert("IMPORT: " + JSON.stringify(event.originalEvent.detail,null,2));

    var detail = event.originalEvent && event.originalEvent.detail;

    detail.fileDetail = {};

    var response = detail.response;
    var responseType = detail.responseType;
    if (detail["Content-Disposition"]) {
      var arrayBuffer = detail.rawResponse
      if (arrayBuffer) {
        var byteArray = new Uint8Array(arrayBuffer);
        var i = 0;

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
        detail: detail
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

  jQuery(document).bind("swPing", function(event) {
    alert("SWECHO: " + JSON.stringify(event.originalEvent.detail));
  });

  jQuery(document).bind("swSaveResponse", function(event) {
    var detail = event.originalEvent && event.originalEvent.detail;
    //alert("SAVED: " + detail.continuation);
    sw.log({
      SAVED: detail
    });
    if (detail.continuation) {
      detail.continuation.call(this, detail);
    }
  });

  jQuery(document).bind("swRunWrapper swUndo sw_reportSlot", function(event) {
    var eventType = event.type;
    if (false) {
      var obj = {
        "PROXY": eventType,
        keys: JSON.stringify(Object.keys(event)),
        via: event.originalEvent.detail.via
      };
      setTimeout(function() {
        alert(JSON.stringify(obj));
      }, 800);
    }

    sw.getHandler(eventType).call(sw, event);

    event.stopPropagation();
    event.preventDefault();

    sw.status.fresh = false;
    var evt = document.createEvent("CustomEvent");
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

  jQuery(document).bind("swSaveWrapper", function(event) {
    try {
      var detail = event.originalEvent && event.originalEvent.detail;

      sw.log({
        domain: "saveWrapper",
        detail: detail,
        continuation: detail.continuation
      });

      var settings = {}; // sw.settings;
      var subs = {};
      var httpDetail = {};
      httpDetail.eventName = "swSaveResponse";
      httpDetail.url = sw.rformat("{serverprepath}/Persist", subs, function(key) {
        return sw.getSetting(key);
      });
      httpDetail.timeout = sw.getSetting("serverTimeout");
      httpDetail.params = {};
      httpDetail.params.wrapper = JSON.stringify(sw.wrapper);
      httpDetail.continuation = detail.continuation || function() {
        alert("The wrapper was saved");
      };

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
        var evt = document.createEvent("CustomEvent");
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

  jQuery(document).bind("swSaveCloseWrapper", function(event) {
    var detail = event.originalEvent && event.originalEvent.detail;

    var saveDetail = {
      source: "smartwrap"
    };
    saveDetail.continuation = function() {
      var evt = document.createEvent("CustomEvent");
      evt.initCustomEvent("swDiscardWrapper", true, true, {
        noRestart: true
      });
      document.dispatchEvent(evt);
    };

    var evt = document.createEvent("CustomEvent");
    evt.initCustomEvent("swSaveWrapper", true, true, saveDetail);
    document.dispatchEvent(evt);
  });

  jQuery(document).bind("swDiscardWrapper", function(event) {
    //alert("DISCARD: " + JSON.stringify(Object.keys(pendingRequests)));

    Object.keys(pendingRequests).forEach(function(url) {
      var reqObj = pendingRequests[url];
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
    var evt = document.createEvent("CustomEvent");
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



  var exportForm = jQuery("#exportForm");
  var exportButton = jQuery("#exporter");
  var exportFormatField = exportForm.find("#format");
  exportForm.find('[name="format"]').change(function(event) {
    var target = event.target;
    //alert("DELTA: " + target.value + ":: " + target.checked);
    if (target.checked) {
      exportFormatField.get(0).value = target.value;
    }
  });
  jQuery("#exporter").click(function(event) {
    //alert("FORM: " + new XMLSerializer().serializeToString(exportForm.get(0)));
    var exportDetail = {};
    exportDetail.format = exportFormatField.get(0).value;
    exportDetail.relations = sw.getRelations();

    var evt = document.createEvent("CustomEvent");
    evt.initCustomEvent("swExportRequest", true, true, exportDetail);
    exportButton.get(0).dispatchEvent(evt);
  });
  jQuery("#exportJSON").click(function(event) {
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
  var formatPicker = jQuery("#exportPicker");
  jQuery("#exportExecute").parent().buttonset();
  jQuery("#exportExecute").click(function(event) {
    //alert("EXPORT: " + new XMLSerializer().serializeToString(formatPicker.get(0)));

    var chosenOption = formatPicker.find("option").filter(":selected");
    //alert("CHOICE: " + new XMLSerializer().serializeToString(chosenOption.get(0)));
    var format = chosenOption.get(0).value;

    var exportDetail = {};
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
  jQuery(document).bind("sw_datacell", function(event) {
    exportButton.button("option", "disabled", false);
  });
});
