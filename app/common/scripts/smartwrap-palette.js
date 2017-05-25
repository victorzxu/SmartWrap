
import jQuery from "jquery";
import "./lib/jquery.xcolor";
import {Smartwrap} from "./smartwrap";


//var Components;


Smartwrap.Palette = (function () {
  "use strict";
  return {
    init: function (params) {
      if (!params) {
        params = {};
      }

      const that = this;

      this.colors = [];
      this.baseColors = [];
      this.settings = {
        recycle: true
      };

      if (params.settings) {
        Object.keys(params.settings).forEach(function (key) {
          that.settings[key] = params.settings[key];
        });
      }

      if (params.colors) {
        this.colors = this.colors.concat(params.colors);
      }
      if (params.baseColor) {
        this.baseColor = params.baseColor;
      } else {
        if (!this.colors.length) {
          this.baseColor = jQuery.xcolor.random();
        }
      }
      if (this.baseColor) {
        jQuery.xcolor.tetrad(this.baseColor).forEach(function (newColor) {
          that.baseColors.push(newColor);
        });
      }
      if (this.baseColors.length) {
        const lol = [];
        this.baseColors.forEach(function (color) {
          lol.push(jQuery.xcolor.analogous(color));
        });
        while (lol.length) {
          const list1 = lol.shift();
          this.colors.push(list1.shift());
          if (list1.length) {
            lol.push(list1);
          }
        }
      }
      /*
       this.colors.forEach(function(color) {
       color.foo = "bar";
       color.css = color.getCSS();
       });
       */
      this.colorMap = {};
      this.counter = 0;
      //alert("OFFSET: " + JSON.stringify(this.settings));
      if (this.settings.offset) {
        this.counter += this.settings.offset;
      }
      this.classes = {};

      let className;
      const oldPalette = params.oldPalette;
      if (oldPalette) {
        Object.keys(oldPalette.colorMap).forEach(function (className) {
          that.getColor(className);
        });
        this.uri = oldPalette.uri;
      }
    },
    getColor: function (alias) {
      if (!this.colorMap[alias]) {
        this.colorMap[alias] = this.colors[this.counter];
        this.counter += 1;
        if (this.counter >= this.colors.length) {
          if (this.settings.recycle) {
            this.counter = 0;
          }
        }
      }
      if (!this.colorMap[alias]) {
        return "transparent";
      }
      //alert(jQuery.format("{alias} -> {color}", {alias:alias, color:this.colorMap[alias]}));
      return this.colorMap[alias];
    },
    getCSS: function () {
      //alert("COLORS: " + JSON.stringify(this.colors));
      //alert("MAP: " + JSON.stringify(this.colorMap));

      const that = this;

      const lines = [];
      Object.keys(this.colorMap).forEach(function (className) {
        const color = that.colorMap[className];
        lines.push(jQuery.format(".{className} {open} background-color: {colorCss} !important {close}", {
          className: className,
          colorCss: color.getCSS(),
          open: "{", // workaround bugs in format method
          close: "}"
        }));
      });
      //alert("LINES: " + JSON.stringify(lines));
      return lines.join(" ");
    },
    getURI: function () {
      return jQuery.format("data:text/css,{css}", {
        css: this.getCSS()
      });
    },
	//TODO:  TEC - uncomment following section
    /*unregisterStylesheet: function() {
     this.registerStylesheet({
     unregister: true
     });
     },
     registerStylesheet: function(params) {
     if (!params) {
     params = {};
     }
     if (!this.services.sss) {
     this.services.sss = Components.classes["@mozilla.org/content/style-sheet-service;1"]
     .getService(Components.interfaces.nsIStyleSheetService);
     }
     if (!this.services.ios) {
     this.services.ios = Components.classes["@mozilla.org/network/io-service;1"]
     .getService(Components.interfaces.nsIIOService);
     }
     var sss = this.services.sss;
     var ios = this.services.ios;
     if (this.uri) {
     if (!params.unregister) {
     if (this.uri.spec === this.getURI()) {
     return false;
     }
     }
     //this.log.push("HAD");
     if (sss.sheetRegistered(this.uri, sss.AGENT_SHEET)) {
     //this.log.push("UNREG");
     sss.unregisterSheet(this.uri, sss.AGENT_SHEET);
     }
     }
     if (params.unregister) {
     return;
     }
     this.uri = ios.newURI(this.getURI(), null, null);
     if (!sss.sheetRegistered(this.uri, sss.AGENT_SHEET)) {
     //this.log.push("REG");
     sss.loadAndRegisterSheet(this.uri, sss.AGENT_SHEET);
     }
     return true;
     },*/
    getClassNames: function () {
      return Object.keys(this.colorMap);
    },
    log: [],
    services: {}
  };
}());

Smartwrap.mainPalette = Object.create(Smartwrap.Palette);
//Smartwrap.mainSmartwrap.init({"colors":["red","green","blue"]});
//Smartwrap.mainSmartwrap.init({"baseColor": "green"});
Smartwrap.mainPalette.init({
  baseColor: "#FF9F00",
  settings: {
    offset: 2
  }
});

Smartwrap.monoPalette = Object.create(Smartwrap.Palette);
Smartwrap.monoPalette.init({
  colors: [jQuery.xcolor.test("FF9F00")]
});
