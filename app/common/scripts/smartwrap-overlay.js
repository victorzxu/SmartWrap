let Smartwrap;

if (!Smartwrap) {
  Smartwrap = {};
}

Smartwrap.overlay = (function () {
  "use strict";
  //alert('define');


  const swo = {
    showhide: function (widget, selector) {
      return function (event) {
        const tgt = gContextMenu.target;

        let show = false;

        if (selector) {
          show = show || !!(jQuery(tgt).parents().andSelf().filter(selector).length);
        }

        //var x = Math.random();
        //alert("SHOWER: " + x);
        //alert("SHOWER: " + show);
        if (show) {
          jQuery(widget).show();
        } else {
          jQuery(widget).hide();
        }
      };
    },
    openurl: function (detail) {
      const url = detail.url || detail.redirect;
      window.open(url);
    },
    log: function (detail) {
      if (this.devMode) {
        try {
          const domain = detail.domain || "";
          if ((this.alertDomains === null) || (this.alertDomains.indexOf(domain) > 0)) {
            alert("LOG: " + JSON.stringify(detail));
          }
          if ((this.dumpDomains === null) || (this.dumpDomains.indexOf(domain) > 0)) {
            dump(JSON.stringify(detail, null, 2));
            dump("\n\n");
          }
        } catch (logex) {
          this.log({
            logex: logex.name,
            message: logex.message,
            stack: logex.stack
          });
        }
      }
    },
    devMode: true,
    alertDomains: [],
    dumpDomains: null
  };

  return swo;
}());
