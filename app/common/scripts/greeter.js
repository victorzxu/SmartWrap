// Copyright (c) 2013 Carnegie Mellon University

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/AddonManager.jsm");

// perform a simple check against the Firefox preferences to see if
// the extension has been run before; if it hasn't then open a tab to the
// registration page.

const greeter = (function () {
  "use strict";

  const swg = {};

  const decode = function (pref, key) {
    const prefType = pref.getPrefType(key);
    if (prefType == pref.PREF_STRING) {
      return pref.getCharPref(key);
    }
    if (prefType == pref.PREF_BOOL) {
      return pref.getBoolPref(key);
    }
    if (prefType == pref.PREF_INT) {
      return pref.getIntPref(key);
    }
  };

  swg.branch2json = function (branch) {
    const prefs = {};
    prefs.foo = "bar";

    //var keys = branch.getChildList("",{})
    branch.getChildList("", {}).forEach(function (key) {
      prefs[key] = decode(branch, key);
    });

    return prefs;
  };

  swg.firstRun = function (registeredVersion, installedVersion) {
    Services.console.logStringMessage(JSON.stringify({
      first: "?",
      reg: registeredVersion,
      inst: installedVersion
    }));

    //swg.widget.checked = false;
    if (!registeredVersion) {
      //swg.widget.checked = true;
      //swg.prefs.firstRun = true;
      Services.console.logStringMessage(JSON.stringify({
        first: "+",
        reg: registeredVersion,
        inst: installedVersion
      }));
      return true;
    }

    Services.console.logStringMessage(JSON.stringify({
      first: "!",
      reg: registeredVersion,
      inst: installedVersion
    }));
    return false;
  };

  swg.registerVersion = function (ver) {
    swg.installed = ver.version;
    swg.prefs.via = ver.via;

    if (swg.firstRun(swg.prefs.registeredVersion, swg.installed)) {
      let greeturl = swg.prefs["authbase"] + swg.prefs["greeturl"];
      const greetquery = swg.prefs["greetquery"];
      if (greetquery) {
        greeturl = [greeturl, greetquery].join("?");
      }
      Services.console.logStringMessage(JSON.stringify({
        greeturl: greeturl
      }));

      //jQuery(swg.widget).attr("checked", "true");
      if (swg.widget) {
        swg.widget.setAttribute("checked", "true");
      }
      swg.prefBranch.setCharPref("registeredVersion", swg.installed);
      swg.window = Services.wm.getMostRecentWindow("navigator:browser");
      swg.window.gBrowser.selectedTab = swg.window.gBrowser.addTab(greeturl);
      Services.console.logStringMessage(JSON.stringify({
        greeted: "true",
        greeturl: greeturl
      }));
    }
  };

  swg.owl = function (winn) {
    //alert('ppp');

    swg.window = winn;

    const prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
    swg.prefBranch = prefManager.getBranch("extensions.smartwrapper.");
    swg.prefs = swg.branch2json(swg.prefBranch);
    Services.console.logStringMessage(JSON.stringify({
      prefs: swg.prefs
    }));

    //swg.getVersion("smartwrap@cmu.edu", swg.registerVersion);
    //swg.getVersion("swath@cmu.edu", swg.registerVersion);
    ["smartwrap@cmu.edu", "swath@cmu.edu"].forEach(function (addonid) {
      AddonManager.getAddonByID(addonid, function (addon) {
        if (!addon) {
          return;
        }
        swg.registerVersion({
          version: addon.version
        });
      });
    });
  };

  try {
    if (window) {
      swg.widget = document.getElementById("sw-show-status");
      window.addEventListener("load", function () {
        swg.owl(window);
      }, false);

      alert('hi');
      document.getElementById("smartwrap-toolbar-button-perm").style.display = "none";
      alert('bye');
    }
  } catch (ee) {
    Services.console.logStringMessage(JSON.stringify({
      where: "greeter"
    }));
    Services.console.logStringMessage(JSON.stringify({
      where: "greeter",
      ee: ee
    }));
  }

  return swg;
}());
