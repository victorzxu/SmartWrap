const prefutil = (function () {
  "use strict";

  const pu = {};
  const privy = {};
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
