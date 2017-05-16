    jQuery(document).ready(function() {
      var detail = {
        source: "report"
      };
      detail.target = jQuery("#report").get(0);

      var evt = document.createEvent("CustomEvent");
      evt.initCustomEvent("sw_reportSlot", true, false, detail);
      detail.target.dispatchEvent(evt);

      jQuery(".dismissal").on("click", function() {
        jQuery('#export').toggleClass("dismissed");
      });

      if (window.location.toString().match(/\?sample/)) {
        var sample = jQuery("#sample .swTable").clone();
        sample.attr('id', 'sample2');
        sample.appendTo(jQuery('#report'));

        jQuery("#export").show();
      }


      jQuery("#confirmCode").on("click", function() {
        var code = jQuery("#responseid").val();
        jQuery("#ersatzClipboard").get(0).src = [
          [jQuery("#prepath").val(), "/clip/put"].join(""), ["ersatz_clipboard_text", code].join("=")
        ].join("?");

        var affirm = window.prompt("Below is the code,\nwould you like to copy it into the clipboard?", code);
        if (!affirm) {
          return;
        }
        const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
          .getService(Components.interfaces.nsIClipboardHelper);
        gClipboardHelper.copyString(" " + code + " ");
      });

      prefutil.observeSetting("cssclasses", function(spec) {
        if (!spec.value) {
          return;
        }
        if (spec.value === "") {
          return;
        }
        spec.clazzes = JSON.parse(spec.value);
        spec.elt = jQuery(document).find("#extraCssContainer");
        spec.elt.removeClass();
        spec.pre = spec.elt.get(0).className;
        spec.clazzes.forEach(function(clazz) {
          spec.elt.addClass(clazz);
        });
        spec.post = spec.elt.get(0).className;
        delete spec.elt;
      });

      var params = {};
      var query = window.location.toString().split('?')[1];
      var kvs = (query && query.split('&')) || [];
      kvs.forEach(function(kv) {
        var kvv = kv.split("=");
        if (kvv.length == 2) {
          params[kvv[0]] = kvv[1];
        } else {
          params[kv] = true;
        }
      });

      if (params.NOISE) {
        var N = params.NOISE;
        var row1 = jQuery('#sample2 .swRow').first();
        while (N > 0) {
          N--;
          var copy = row1.clone();
          copy.appendTo(jQuery('#sample2 tbody'));
        }
      }


      //alert(JSON.stringify({query:query,kvs:kvs,params:params}));
    });
