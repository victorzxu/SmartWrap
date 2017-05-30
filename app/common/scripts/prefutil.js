/*
  The new perferences will be stored in local and has
  the following keys:
    pref_permicon: show Icon in Toolbar
      val:true,false
    pref_animateselector: Animate Selector Movement
      val:true,false
    pref_maxchars: maximum characters to show in cells
      val:int
    pref_buttonstyle: button Style
      val:"both","noicons","iconsonly"
    pref_algorithm: algorithm
      val:"AUTO","LIBSVM","PREFIX"
    pref_dragselect: Drag Selection Mode
      val:"HOVER","CLICK","TEXTSELECT"
    pref_dragindic: Drag Indication Mode
      val:"NONE","BLUEBOX"
*/


const prefutil = (function () {
  "use strict";

  const pu = {};
  var privy = {};
  /*DECODE: decode the preferences according to its typeof
    Might be Deprecated
    pu.decode = function(pref, key) {
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
    };
    */
  /*branch2json:convert the preference branch structure
    to an array of objects.
    Might be Deprecated
    pu.branch2json = function(branch) {
    privy.prefs = {};
    privy.prefs.foo = "bar";

    //var keys = branch.getChildList("",{})
    branch.getChildList("", {}).forEach(function(key) {
    privy.prefs[key] = pu.decode(branch, key);
    });

    return privy.prefs;
    };
  */
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
  /*set the preferences.
    spec is an object of
  */
  pu.setPrefs = function (spec) {
    this.log({
      spec1: spec
    });
    browser.storage.local.set(spec);
  }
  /*get a set of preferences.
    take in the keys
  */
  pu.getPref = function (spec) {
    browser.storage.local.get(spec.key)
    return res;
  }
  pu.initPref = function (details) {
    console.log("initPref");
    const initOptions = {
      pref_permicon: true,
      pref_animateselector: true,
      pref_maxchars: 400,
      pref_buttonstyle: "both",
      pref_algorithm: "AUTO",
      pref_dragselect: "HOVER",
      pref_dragindic: "BLUEBOX",
      consent: true,
      developermode: false,
      onDropManyColumns: false,
      paintCells: true,
      paintRowRanges: false,
      paintRowContainers: false,
      paintTableRanges: true,
      paintTableContainers: false,
      serverprepath: "http://localhost:9090",
      _serverpath: "/smartwrap/Wrap",
      serverpath: "/Wrap",
      serverquery: "?algorithm={algorithm}",
      servertimeout: 20000, // 2000 milliseconds = 2 seconds
      maxchars: 100,
      minrows: 2, // 1,
      maxrows: 2, // Infinity,
      minfringerows: 0, // 1,
      sendUserData: true,
      sendInferredData: false,
      dragInterpretation: "EXACT",
      annotationTemplate: "{tempDir}{easy_url}",
      annotationDependency: "GLOBAL",
      globalDependencyPrefix: "http://www.cs.cmu.edu/~sgardine/mixer/smartwrap/",
      showAuxiliaryTables: false,    
    }
    browser.storage.local.set(initOptions);
  }
  pu.observeSetting = function (key, callback, prefix) {
    const value = this.getPref(key);
    browser.storage.onChanged.addListener(
      function (changes,area) {
        var changedItems = Object.keys(changes);
        for (var item of ChangedItems) {
          if ((item ===  "key") && (area === "local")) {
            callback({key:value});
          }
        }
      });
    }

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
  /*pu.owl = function (winn, prefix) {
    pu.window = winn;
    pu.prefix = prefix || pu.prefix || "extensions.smartwrapper.";
    //TODO: TEC - Uncomment down to pu.prefs
    var prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
    pu.prefBranch = prefManager.getBranch(pu.prefix);
    pu.prefs = pu.branch2json(pu.prefBranch);
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

}*/
  return pu;
}());

export default prefutil;
