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

//Components.utils.import("resource://gre/modules/Services.jsm");
//Components.utils.import("resource://gre/modules/AddonManager.jsm");

// perform a simple check against the Firefox preferences to see if
// the extension has been run before; if it hasn't then open a tab to the
// registration page.

const prefutil = (function () {
  "use strict";

  const pu = {};
  const privy = {};

  /*pu.decode = function(pref, key) {
   var prefType = pref.getPrefType(key);
   if (prefType == pref.PREF_STRING) {
   return pref.getCharPref(key);
   }
   if (prefType == pref.PREF_BOOL) {
   return pref.getBoolPref(key);
   }
   if (prefType == pref.PREF_INT) {
   return pref.getIntPref(key);
   }
   };*/

  /*pu.branch2json = function(branch) {
   privy.prefs = {};
   privy.prefs.foo = "bar";

   //var keys = branch.getChildList("",{})
   branch.getChildList("", {}).forEach(function(key) {
   privy.prefs[key] = pu.decode(branch, key);
   });

   return privy.prefs;
   };*/

  pu.firstRun = function (registeredVersion, installedVersion) {
    this.log({
      first: "?",
      reg: registeredVersion,
      inst: installedVersion
    });

    //pu.widget.checked = false;
    if (!registeredVersion) {
      //pu.widget.checked = true;
      //pu.prefs.firstRun = true;
      this.log({
        first: "+",
        reg: registeredVersion,
        inst: installedVersion
      });
      return true;
    }

    this.log({
      first: "!",
      reg: registeredVersion,
      inst: installedVersion
    });
    return false;
  };

  pu.setPrefs = function (spec) {
    this.log({
      spec1: spec
    });
    /*if (!privy.prefManager) {
     privy.prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
     }*/
    if (!privy.prefClear) {
      privy.prefClear = {
        observe: function () {
          privy.prefObject = null;
        }
      };
    }
    /*if (!privy.prefBranch) {
     privy.prefBranch = privy.prefManager.getBranch(spec.prefix || pu.prefix || "extensions.smartwrapper.");
     privy.prefBranch.addObserver("", privy.prefClear, false);
     // simply invalidate cached version whenever something changes.
     }*/
    Object.keys(spec).forEach(function (key) {
      browser.storage.local.set({key: spec[key].toString()});
    });

  };

  pu.getPref = function (spec) {
    if (typeof spec === "string") {
      spec = {
        key: spec
      };
    }
    /*this.log({
     spec1: spec
     });*/
    /*if (!privy.prefManager) {
     privy.prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
     }*/
    if (!privy.prefClear) {
      privy.prefClear = {
        observe: function () {
          privy.prefObject = null;
        }
      };
    }
    /*if (!privy.prefBranch) {
     privy.prefBranch = privy.prefManager.getBranch(spec.prefix || pu.prefix || "extensions.smartwrapper.");
     privy.prefBranch.addObserver("", privy.prefClear, false);
     // simply invalidate cached version whenever something changes.
     }*/
    /*if (!privy.prefObject) {
     privy.prefObject = this.branch2json(privy.prefBranch);
     this.log({
     prefs: privy.prefObject
     });
     //dump(JSON.stringify({regened: privy.prefObject},null,2) + "\n\n");
     }*/
    spec.out = browser.storage.local.get(spec.key);
    //this.log(spec);
    return spec.out;
  };

  pu.observeSetting = function (key, callback, prefix) {
    const value = this.getPref({
      key: key,
      prefix: prefix
    });
    callback({
      key: key,
      value: value
    });
    const self = this;
    const observer = {
      /* weird overly-general API courtesy of
       https://developer.mozilla.org/en-US/docs/Code_snippets/Preferences
       */
      observe: function (aSubject, aTopic, aData) {
        //dump(JSON.stringify({observing: key, saw: {subj:aSubject,top:aTopic,data:aData}}, null, 2) + "\n\n");
        if (aData
          === key) {
          setTimeout(function () {
            callback({
              key: key,
              value: self.getPref({
                key: key,
                prefix: prefix
              })
            });
          }, 25);
// kludge: use timeout to make sure the prefClear listener runs before this one.
        }
      }
    };
    //privy.prefBranch.addObserver("", observer, false);
  };

    pu.registerVersion = function (ver) {
      pu.installed = ver.version;
      pu.via = ver.via;
      const store = browser.storage.local;

      if (pu.firstRun(store.get("registeredVersion"), pu.installed)) {
        let greeturl = store.get("authbase") + store.get("greeturl");
        const greetquery = store.get("greetquery");
        if (greetquery) {
          greeturl = [greeturl, greetquery].join("?");
        }
        /*this.log({
         greeturl: greeturl
         });*/

        //jQuery(pu.widget).attr("checked", "true");
        if (pu.widget) {
          pu.widget.setAttribute("checked", "true");
        }
        store.set("registeredVersion", pu.installed);
        //pu.window = Services.wm.getMostRecentWindow("navigator:browser");
        //pu.window.gBrowser.selectedTab = pu.window.gBrowser.addTab(greeturl);
        /*Services.console.logStringMessage(JSON.stringify({
         greeted: "true",
         greeturl: greeturl
         }));*/
      }
    };

  pu.owl = function (winn, prefix) {
    //alert('ppp');

    pu.window = winn;

    pu.prefix = prefix || pu.prefix || "extensions.smartwrapper.";

    //var prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
    //pu.prefBranch = prefManager.getBranch(pu.prefix);
    //pu.prefs = pu.branch2json(pu.prefBranch);
    //pu.log({prefs:pu.prefs});

    //pu.getVersion("smartwrap@cmu.edu", pu.registerVersion);
    //pu.getVersion("swath@cmu.edu", pu.registerVersion);
    ["smartwrap@cmu.edu", "swath@cmu.edu"].forEach(function (addonid) {
      AddonManager.getAddonByID(addonid, function (addon) {
        if (!addon) {
          return;
        }
        pu.registerVersion({
          version: addon.version
        });
      });
    });
  };

  /*pu.log = function(obj) {
   Services.console.logStringMessage(JSON.stringify(obj));
   //alert(JSON.stringify(obj, null, 2));
   }*/

  return pu;
}());
