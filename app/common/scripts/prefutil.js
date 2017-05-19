const prefutil = (function () {
  "use strict";

  const pu = {};
  const privy = {};
<<<<<<< HEAD
<<<<<<< HEAD
=======
=======
>>>>>>> 4cad7b8f4f1ba8cb99e81dbae2ab8eddcb8d86f2
  //TODO: TEC - uncomment block
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
  //TODO - TEC - uncomment block
  /*pu.branch2json = function(branch) {
   privy.prefs = {};
   privy.prefs.foo = "bar";

   //var keys = branch.getChildList("",{})
   branch.getChildList("", {}).forEach(function(key) {
   privy.prefs[key] = pu.decode(branch, key);
   });

   return privy.prefs;
   };*/

>>>>>>> 4cad7b8f4f1ba8cb99e81dbae2ab8eddcb8d86f2
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
<<<<<<< HEAD
=======

  pu.setPrefs = function (spec) {
    this.log({
      spec1: spec
    });
    //TODO: TEC - Uncomment
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
    //TODO - TEC - uncomment                     
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
    //TODO: TEC - Uncomment these two blocks                            
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
    //TODO: TEC - Uncomment this line
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
    //TODO: TEC - Uncomment down to pu.prefs
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

export default prefutil;
>>>>>>> 4cad7b8f4f1ba8cb99e81dbae2ab8eddcb8d86f2
