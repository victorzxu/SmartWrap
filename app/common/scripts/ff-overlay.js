import jQuery from "jquery";
import prefutil from "./prefutil";
import {smartwrapNamespace} from "./smarttable-header";


const swo = Smartwrap.overlay;
((() => {
  swo.doit = () => {
    swo.broadcaster = jQuery("#viewSidebar_smartwrap").get(0);
    swo.sidebarURL = swo.broadcaster.getAttribute("sidebarurl");
    jQuery("observes.sidebarWatcher").bind("broadcast", event => {
      const tgt = event.target;
      //alert('DELTA-T: ' +  new XMLSerializer().serializeToString(tgt));
      //alert('DELTA-E: ' + JSON.stringify(event));
      const sidebar = document.getElementById('sidebar');
      //alert('DELTA-O: ' + new XMLSerializer().serializeToString(sidebar));
      const pre = sidebar.contentWindow.location.href;
      if (!swo.broadcaster.getAttribute("checked")) {
        //alert("OUTGOING: " + new XMLSerializer().serializeToString(sidebar.contentWindow.document));

        //alert('hi, deever');

        var evt = document.createEvent("CustomEvent");
        evt.initCustomEvent("hideSidebar", true, false, {
          source: "overlay"
        });
        sidebar.contentWindow.document.dispatchEvent(evt);

        jQuery(jQuery(swo.sidebarDocument).get(0).documentElement).addClass("sidebarHidden");

        //alert('bye, deever: ' + new XMLSerializer().serializeToString(jQuery(swo.sidebarDocument).get(0).documentElement).slice(0,1000));
      } else {
        //alert("INCOMING: " + new XMLSerializer().serializeToString(broadcaster));
        var evt = document.createEvent("CustomEvent");
        evt.initCustomEvent("showSidebar", true, false, {
          source: "overlay"
        });
        sidebar.contentWindow.document.dispatchEvent(evt);
      }
    });

    swo.swToolbar = jQuery(document).find("#smartwrapToolbar");
    swo.swToolbar.get(0).collapsed = true;
    jQuery(document).bind("hideSidebar", event => {
      //alert("swtool: " + new XMLSerializer().serializeToString(swToolbar.get(0)));
      swo.swToolbar.get(0).collapsed = true;
    });
    jQuery(document).bind("showSidebar", event => {
      //alert("swtool: " + new XMLSerializer().serializeToString(swToolbar.get(0)));
      swo.swToolbar.get(0).collapsed = false;
    });
    jQuery(document).bind("hideSidebar", event => {
      if (swo && swo.smartwrap) {
        swo.smartwrap.clearMarking();
      }
      swo.updateStatus({
        scrapeTarget: "NA"
      });
    });
    jQuery(document).bind('swSidebar', event => {
      const detail = event.originalEvent && event.originalEvent.detail;
      swo.sidebarDocument = detail.sidebarDoc;
    });
    swo.permicon = jQuery(document).find("#smartwrap-toolbar-button-perm");
    jQuery(document).bind("sw_newsmartwrap", event => {
      const detail = event.originalEvent && event.originalEvent.detail;
      //alert('ANDONE AND: ' + detail.smartwrap.swid);

      if (swo.smartwrap) {
        swo.smartwrap.decommissioned = true;
      }
      swo.smartwrap = detail.smartwrap;

      swo.smartwrap.observeSetting("developermode", spec => {
        //dump([JSON.stringify({observed: spec}, null, 2), "\n\n"].join(""));
        //alert(JSON.stringify({gotit: swo.permicon.length}));
        swo.devMode = spec.value;
      });

      swo.smartwrap.observeSetting("cssclasses", spec => {
        if (!spec.value) {
          return;
        }
        //alert(JSON.stringify({HEY: spec}));
        if (spec.value === "") {
          return;
        }
        spec.clazzes = JSON.parse(spec.value);
        //alert(JSON.stringify({HEY2: spec}));
        spec.elt = jQuery(document).find("#extraCssContainer");
        spec.elt.removeClass();
        spec.pre = spec.elt.get(0).className;
        spec.clazzes.forEach(clazz => {
          spec.elt.addClass(clazz);
        });
        spec.post = spec.elt.get(0).className;
        delete spec.elt;
        //alert(JSON.stringify({HEY1: spec}));
      });
    });
    prefutil.observeSetting("permicon", spec => {
      if (swo.permicon.data('forceshow')) {
        return;
      }

      if (spec.value) {
        swo.permicon.show(1000);
      } else {
        swo.permicon.hide(100);
      }
    });
    prefutil.observeSetting("cssclasses", spec => {
      if (!spec.value) {
        return;
      }
      if (spec.value.match(/swturk/)) {
        swo.permicon.data('forceshow', true);
        swo.permicon.show(1000);
      }
    });

    swo.sidebar = document.getElementById("sidebar");
    swo.quitObserver = {
      observe(aSubject, aTopic, aData) {
        //alert('buh-bye: ' + sidebar.contentWindow.location.href);
        //alert('burl: ' + broadcaster.getAttribute("sidebarurl"));

        if (swo.sidebar.contentWindow.location.href === swo.sidebarURL) {
          toggleSidebar();
        }
      },
    };
    swo.observerService =
      Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
    swo.observerService.addObserver(swo.quitObserver, "quit-application-requested", false);

    swo.mainButtons = jQuery("#sw_main_button_panel toolbarbutton");
    swo.swDiscard = jQuery("#swDiscardWrapper");
    swo.saveButtons = jQuery(".swSaveWrapper");
    swo.runButton = jQuery("#swRunWrapper");
    swo.annButton = jQuery(document).find("#swAnnotate");
    swo.urlSlot = jQuery(document).find("#wrappedURL");
    swo.wrapperTitle = jQuery(document).find("#wrapperTitle");
    swo.wrapAppl = jQuery(document).find("#appliesTo");

    swo.modeNodes = jQuery(document).find(".sw_mode");

    swo.marksInProgress = {};
    swo.marks = {};
    jQuery(document).bind("sw_markingstatus", event => {
      const detail = event.originalEvent && event.originalEvent.detail;
      const logger = detail && detail.logger;
      detail.logger = null; // prevent circular reference error for logging

      const showhide = () => {
        if (Object.keys(swo.marksInProgress).length) {
          //swo.markWait.show();
          swo.markWait.css("opacity", "1.0");


          //<editor-fold desc="yxl:ifFalseCodeBlock">
          if (false) {
            const max = 1 + (100 * (swo.marks.in || 0));
            swo.analyzing.get(0).max = max;
            const M = swo.marks.in || 0;
            const N = swo.marks.around || 0;
            const Q = Math.exp(Math.log(M) + Math.log(100.0) + N * Math.log(0.99));
            swo.marks.N = N;
            swo.marks.Q = Q;
            swo.marks.M = M;
            const value = 1 + M * 100 - Q;
            swo.analyzing.get(0).value = value;
            setprogress(swo.markWait, [0, 0, (100 * value) / max]);
          }
          //</editor-fold>
        } else {
          //swo.markWait.hide();
          swo.markWait.css("opacity", swo.opaqFloor);
        }
      };

      if (detail && detail.inprogress) {
        const oldcount = swo.marksInProgress[detail.token];
        if (oldcount) {
          window.clearTimeout(oldcount);
          //swo.marks.push({direction:"around"});
          swo.marks.around = 1 + (swo.marks.around || 0);
        } else {
          //swo.marks.push({direction:"in"});
          swo.marks.in = 1 + (swo.marks.in || 0);
        }
        const newcount = window.setTimeout(() => {
          //logger && logger.log({when:"a second later", cancel: detail.token, marks:swo.marksInProgress});
          delete swo.marksInProgress[detail.token];
          //logger && logger.log({when:"a second later", canceled: detail.token});
          showhide();
        }, 1000);
        swo.marksInProgress[detail.token] = newcount;
      }
      if (detail && detail.finished) {
        //swo.marks.push({direction:"out"});
        swo.marks.out = 1 + (swo.marks.out || 0);
        delete swo.marksInProgress[detail.token];
      }

      //swo.wrapperTitle.get(0).value = JSON.stringify(swo.marksInProgress);

      showhide();
      //logger && logger.log({markdetail:detail,inprog:Object.keys(swo.marksInProgress),array:swo.marks});

      //alert("MARKS: " + JSON.stringify({detail:detail,marks:swo.marksInProgress,len:Object.keys(swo.marksInProgress).length}));
    });

    jQuery(document).bind("page_loading", event => {
      const detail = event.originalEvent && event.originalEvent.detail;
      if (detail) {
        if (detail.done) {
          //swo.premarkWait.hide();
          swo.premarkWait.css('opacity', swo.opaqFloor);
        } else {
          //swo.premarkWait.show();
          swo.premarkWait.css('opacity', '1.0');
        }
      }
    });

    swo.updateStatus = event => {
      //alert("ECHO!");
      const detail = event.originalEvent && event.originalEvent.detail;
      if (detail && detail.smartwrap) {
        swo.smartwrap = detail.smartwrap;
      }

      if (!swo.smartwrap) {
        return;
      }


      swo.smartwrap.log({
        refresh: "overlay, smartly"
      });

      var stat = swo.smartwrap.getStatus("preview_ready");
      //alert("STAT: " + stat);
      //console.log(stat);
      swo.runButton.get(0).disabled = !stat;

      var stat = swo.smartwrap.getStatus("pending");
      if (!stat) {
        /*
         swo.serverWait.find("label").css("color", "yellow");
         setTimeout(function() {
         //swo.serverWait.hide();
         swo.serverWait.find("label").css("color", "green");
         }, 3000);
         */
        //swo.serverWait.hide();
        swo.serverControl.css('opacity', swo.opaqFloor);
      }

      stat = swo.smartwrap.getStatus("save_ready");
      swo.saveButtons.each((index, elt) => {
        elt.disabled = !stat;
      });

      stat = swo.smartwrap.getStatus("discard_ready");
      swo.swDiscard.get(0).disabled = !stat;

      stat = swo.smartwrap.getStatus("annotation_ready");
      swo.annButton.get(0).disabled = !stat;

      let scrapeTarget = event.scrapeTarget || swo.smartwrap.getStatus("scrape_target");
      if ((scrapeTarget === "NA") || (!scrapeTarget)) {
        swo.wrapAppl.find("#NA").show();
        swo.wrapAppl.find("#NA").get(0).setAttribute("checked", "true");
        swo.wrapAppl.find("#NA").get(0).checked = true;
        swo.wrapAppl.get(0).selectedIndex = 0;
        swo.wrapAppl.get(0).disabled = true;

        swo.wrapperTitle.get(0).value = "";

        jQuery('#sw_anchored').css('opacity', swo.opaqFloor);

        return;
      }

      jQuery('#sw_anchored').css('opacity', 1.0);
      const scrapeTitle = scrapeTarget.doc.title;
      const location = scrapeTarget.doc.defaultView.location;
      jQuery('#anchoredpage').empty();
      jQuery('#anchoredpage').text("" + location.toString());
      //jQuery('#anchoredpage').get(0).innerHTML = location;
      jQuery('#anchoredpage').css("color", "red");

      //alert("LOC: " + location.href);

      detail.urlparts = {};
      detail.urlparts.fullurl = location.href;
      detail.urlparts.protocol = location.protocol;
      detail.urlparts.host = location.host;
      detail.urlparts.pathname = location.pathname;
      detail.urlparts.siteurl = jQuery.format("{protocol}//{host}", detail.urlparts);
      detail.urlparts.baseurl = jQuery.format("{protocol}//{host}{pathname}", detail.urlparts);
      //alert("URLPARTS: " + JSON.stringify(detail.urlparts));

      detail.selected = false;
      detail.prev = "";
      swo.wrapAppl.find("menuitem").each((index, elt) => {
        let myurl = elt.getAttribute("myurl");
        if (!myurl) {
          return;
        }
        const newurl = jQuery.format(myurl, detail.urlparts);
        detail.urlparts.myurl = newurl;
        let templ = elt.getAttribute("template");
        if (!templ) {
          return;
        }
        let newLabel = jQuery.format(templ, detail.urlparts);
        if (newLabel.length > 80) {
          newLabel = newLabel.substring(0, 40) + "..." + newLabel.substring(newLabel.length - 40);
        }
        if (newurl === detail.prev) {
          jQuery(elt).hide();
        } else {
          elt.label = newLabel;
          detail.prev = newurl;

          if (!detail.selected) {
            elt.checked = true;
            elt.setAttribute("checked", "true");
            detail.selected = 1 + index;
          }
        }
      });
      if (detail.selected) {
        swo.wrapAppl.get(0).disabled = false;
        swo.wrapAppl.find("#NA").hide();
        swo.wrapAppl.get(0).selectedIndex = -1 + detail.selected;
      }

      swo.wrapperTitle.get(0).value = jQuery.format("Wrapper for \"{pageTitle}\"", {
        pageTitle: scrapeTitle
      });
    };
    jQuery(document).bind("sw_status", event => {
      swo.updateStatus(event);
    });

    /*
     swo.runButton.click(function(event) {
     if (swo.runButton.get(0).disabled) {
     return;
     }

     var detail = {};

     var evt = swo.sidebar.contentWindow.document.createEvent("CustomEvent");
     evt.initCustomEvent("swRunWrapper", true, false, detail);
     swo.sidebar.contentWindow.document.dispatchEvent(evt);

     });
     */

    jQuery(document).bind("swDiscardWrapper", event => {
      const detail = event.originalEvent && event.originalEvent.detail || {};

      //alert("DISCARD: " + JSON.stringify(detail));

      swo.swDiscard.get(0).disabled = true;

      toggleSidebar('viewSidebar_smartwrap');
      if (!detail.noRestart) {
        //alert("RESTART!");
        toggleSidebar('viewSidebar_smartwrap', true);
      } else {
        //alert("RESTART0!");
      }
    });
    /*
     swo.swDiscard.click(function(event) {
     var evt = document.createEvent("CustomEvent");
     evt.initCustomEvent("swDiscardWrapper", true, false, {source:"overlay"});
     swo.sidebar.contentWindow.document.dispatchEvent(evt);
     });
     */

    swo.annButton.click(event => {
      const detail = {};

      //detail.annotationLocation = annPath.get(0).value;

      detail.source = "overlay";
      detail.extension = ".html";

      const evt = sidebar.contentWindow.document.createEvent("CustomEvent");
      evt.initCustomEvent("swAnnotate", true, false, detail);
      swo.sidebar.contentWindow.document.dispatchEvent(evt);

    });

    swo.opaqFloor = jQuery("#opaqFloor").css('opacity');
    swo.serverControl = jQuery(".serverControl");
    swo.serverWait = jQuery("#serverWait");
    swo.premarkWait = jQuery("#premarkWait");
    swo.markWait = jQuery("#markWait");

    const swOrange = alpha1 => {
      alpha1 = alpha1 || 0.0;
      return ["rgba", "(", "255", ",", "165", ",", "0", ",", 1 - alpha1, ")"].join("");
    };

    swo.uwaiters = jQuery(".waiter.undetermined");
    var setprogress = (elt, stops) => {
      const bg = [
        "linear-gradient",
        "(",
        "to right", ", ",
        swOrange(1.0),
        " ", stops[0], "%",
        ", ", swOrange(0.0),
        " ", stops[1], "%",
        ", ", swOrange(1.0),
        " ", stops[2], "%",
        //", ", swOrange(1.0),
        ", ", swOrange(1.0),
        ")"
      ].join("");

      //swo.premarkWait.find("label").text(bg);

      jQuery(elt).css('background', bg);

    };
    const advance = (ix, elt) => {
      const waiter = jQuery(elt);
      const opac = waiter.css('opacity');
      if (opac < 0.5) {
        return;
      }

      const width2 = 40;
      let progress = waiter.data('progress') || 0;
      progress += 7;
      while (progress > (100 + width2)) {
        progress -= (100 + 1.5 * width2);
      }
      waiter.data('progress', progress);

      const stop1 = progress - width2;
      const stop2 = progress + width2;

      setprogress(waiter, [stop1, progress, stop2]);
    };
    setInterval(() => {
      swo.uwaiters.each(advance);
    }, 100);

    swo.analyzing = jQuery("#analyzing");
    jQuery(document).bind("swWrapperRequest", event => {
      const detail = event.originalEvent && event.originalEvent.detail;
      if (detail.logger) {
        detail.logger.log({
          REQUEST: "overheard"
        });
      }

      const eventName = event.type;
      //alert("HTTP " + eventName);
      swo.mainButtons.each((index, elt) => {
        elt.disabled = true;
      });
      //swo.runButton.get(0).disabled = true;
      //swo.serverWait.show();
      swo.serverControl.css('opacity', '1.0');
      //swo.serverWait.find("label").css("color", "red");
    });

    jQuery(document).bind("sw_openurl", event => {
      const detail = event.originalEvent && event.originalEvent.detail;
      //alert("URL: " + JSON.stringify(detail));
      swo.openurl(detail);
    });

    jQuery(".sw_button").click(event => {
      //alert('clicky1');
      const elt = event.target;
      if (elt.disabled) {
        return;
      }
      if (jQuery(elt).css("opacity") < 0.5) {
        return;
      }
      //alert('clicky2');
      let eventType = elt.getAttributeNS(smartwrapNamespace, "eventType");
      if (!eventType) {
        return;
      }

      const evt = document.createEvent("CustomEvent");
      evt.initCustomEvent(eventType, true, false, {
        source: "overlay"
      });
      swo.sidebar.contentWindow.document.dispatchEvent(evt);
    });

    //swo.authBase = "http://localhost:8080";
    swo.authBase = "http://sw-auth.appspot.com";

    swo.idcheckdue = true;

    jQuery(document).bind("sw_idcheck", event => {
      if (!swo.idcheckdue) {
        return;
      }

      swo.idcheckdue = false;
      setTimeout(() => {
        swo.idcheckdue = true;
      }, 10000);

      jQuery.ajax({
        url: [swo.authBase, "/whoami"].join(""),
        data: null,
        success(data, status, jqXHR) {
          //alert(JSON.stringify({OUTPUT: data, KEYS: Object.keys(data)}));

          const evt = document.createEvent("CustomEvent");
          evt.initCustomEvent("sw_auth", true, true, data);
          swo.sidebar.contentWindow.document.dispatchEvent(evt);
        },
        dataType: "json"
      });
    });

    //swo.open = window.open;
    swo.open = url => {
      if (!url.startsWith("http")) {
        url = [swo.authBase, url].join("");
      }
      gBrowser.selectedTab = gBrowser.addTab(url);
    };

    jQuery(document).bind("sw_login", event => {
      //alert(JSON.stringify({OPEN: swo.login}));
      swo.open(swo.login);
    });

    jQuery(document).bind("sw_logout", event => {
      //alert(JSON.stringify({OPEN: swo.logout}));
      swo.open(swo.logout);
    });
    jQuery(document).bind("sw_register", event => {
      //alert(JSON.stringify({OPEN: swo.logout}));
      swo.open(["/register.jsp", swo.smartwrap.getSetting("greetquery")].join("?"));
    });
    jQuery(document).bind("sw_login_turk", event => {
      //alert(JSON.stringify({OPEN: swo.logout}));
      swo.open(["/register.jsp", "via=turklogin"].join("?"));
    });


    gBrowser.addTabsProgressListener({
      /*
       onStateChange: function(b,wp,req,sf,status) {
       alert(JSON.stringify({status:status,sf:sf}));
       },
       */
      onProgressChange(b, wp, req, cs, ms, ct, mt) {
        //alert(JSON.stringify({prog:true,cs:cs,ms:ms,ct:ct,mt:mt}));
        if (ct >= mt) {
          //alert('sumpin');
          const evt = document.createEvent("CustomEvent");
          evt.initCustomEvent("sw_idcheck", true, true, {});
          swo.sidebar.contentWindow.document.dispatchEvent(evt);

        }
      },
      /*
       onStatusChange: function(b,wp,req,status,msg) {
       alert(JSON.stringify({status:status,msg:msg}));
       },
       */
    });

    const indicateAuth = spec => {
      const swauth = jQuery(".swauth");

      swauth.removeClass("withid withassn");

      if (spec.auth) {
        swauth.removeClass("unauth");
        swauth.addClass("auth");
      } else {
        swauth.removeClass("auth");
        swauth.addClass("unauth");
      }

      if (spec.how === "assignmentId") {
        swauth.addClass("withassn");
      }
      if (spec.how === "authid") {
        swauth.addClass("withid");
      }
      //alert(JSON.stringify({indic: spec,clazz: swauth.get(0).className}));
    };

    jQuery(document).bind("sw_auth", event => {
      let detail = event.originalEvent && event.originalEvent.detail;
      detail = detail || {};
      if ((typeof detail.requestConsent) !== 'undefined') {
        prefutil.setPrefs({
          requestConsent: detail.requestConsent.toString()
        });
      }
    });
    jQuery(document).bind("sw_auth", event => {
      const eventName = event.type;
      const detail = event.originalEvent && event.originalEvent.detail;

      swo.login = detail.login;
      swo.logout = detail.logout;

      if (detail.assignmentId) {
        jQuery(".assnid").text(detail.assignmentId);
        indicateAuth({
          auth: true,
          how: "assignmentId",
          cred: detail.assignmentId
        });
        return;
      }
      detail.authid = detail.adhocid || detail.nick || detail.turkid;
      if (detail.authid) {
        jQuery(".authid").text(detail.authid);
        indicateAuth({
          auth: true,
          how: "authid",
          cred: detail.authid
        });
        return;
      }
      indicateAuth({
        auth: false
      });
    });

    jQuery("#sw_idcheck").click();

    jQuery(document).bind("sw_dragstart sw_removecell sw_reportSlot", event => {

      const eventName = event.type;
      const detail = event.originalEvent && event.originalEvent.detail;
      //alert("RELAY: " + eventName + ":: " + JSON.stringify(detail, null, 2));

      if (detail.overlay_relayed) {
        return;
      }
      detail.overlay_relayed = true;

      const evt = document.createEvent("CustomEvent");
      evt.initCustomEvent(eventName, true, true, detail);
      swo.sidebar.contentWindow.document.dispatchEvent(evt);

      //alert("RELAYED: " + eventName);
    });

    jQuery(document).bind("sw_configure", event => {
      const detail = event.originalEvent && event.originalEvent.detail;
      //alert("CONFIG: " + JSON.stringify(detail));

      if (detail.config.annotatormode) {
        swo.modeNodes.removeClass("nonAnnotator");
      } else {
        swo.modeNodes.addClass("nonAnnotator");
      }

      if (detail.config.developermode) {
        swo.modeNodes.removeClass("nonDeveloper");
      } else {
        swo.modeNodes.addClass("nonDeveloper");
      }
    });

    swo.contextMenuItems = jQuery("#contentAreaContextMenu .sw_menuitem");
    swo.contextMenuItems.each((index, elt) => {
      const applySelector = elt.getAttributeNS(smartwrapNamespace, "appliesTo");
      const eventType = elt.getAttributeNS(smartwrapNamespace, "eventType");
      //alert(elt.id + " FIRES " + eventType + " ON " + applySelector);

      jQuery("#contentAreaContextMenu").get(0).addEventListener("popupshowing",
        swo.showhide(elt, applySelector),
        false);

      jQuery(elt).click(() => {
        const msgs = [];

        try {
          const tgt = gContextMenu.target;
          const doc = tgt.ownerDocument;

          const detail = {};
          detail.target = tgt;

          if (swo && swo.smartwrap) {
            swo.smartwrap.log({
              FIRES: eventType,
              ELT: elt.id,
              ON: applySelector,
              TGT: tgt
            });
          } else {
            alert("FIRES!!");
          }

          const evt = document.createEvent("CustomEvent");
          evt.initCustomEvent(eventType, true, false, detail);
          tgt.dispatchEvent(evt);
          msgs.push("DISPATCHED: " + eventType);
        } catch (ex) {
          msgs.push(ex.stack);
        }

        //alert("MSGS: " + JSON.stringify(msgs));
      });
    });

    jQuery("#auth").on('click', () => {
      window.open("http://www.google.com");
    });


    //setTimeout(function() { alert('hjihi'); }, 1000);

  };


  window.addEventListener("load", () => {
    swo.doit()
  }, false);
  //jQuery(document).ready(function() { swo.doit(); });

  swo.window = window;
  jQuery(document).bind("sw_log", event => {
    const detail = event.originalEvent && event.originalEvent.detail;
    //alert("LOGG: " + swo.devMode);
    swo.log(detail);
  });

}))();
