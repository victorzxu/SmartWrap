import jQuery from "jquery";
import prefutil from "./prefutil";
console.log(document);
document.addEventListener ("startReport",doReport);
function doReport() {
  console.log("in smartwrapReport");
  const detail = {
    source: "report"
  };
  detail.target = jQuery("#report").get(0);

  var evt = document.createEvent("CustomEvent");
  evt.initCustomEvent("sw_reportSlot", true, false, detail);
  detail.target.dispatchEvent(evt);

  jQuery(".dismissal").on("click", () => {
    jQuery('#export').toggleClass("dismissed");
  });

  if (window.location.toString().match(/\?sample/)) {
    const sample = jQuery("#sample .swTable").clone();
    sample.attr('id', 'sample2');
    sample.appendTo(jQuery('#report'));

    jQuery("#export").show();
  }


  jQuery("#confirmCode").on("click", () => {
    const code = jQuery("#responseid").val();
    jQuery("#ersatzClipboard").get(0).src = [
      [jQuery("#prepath").val(), "/clip/put"].join(""), ["ersatz_clipboard_text", code].join("=")
    ].join("?");

    let affirm = window.prompt("Below is the code,\nwould you like to copy it into the clipboard?", code);
    if (!affirm) {
      return;
    }
    const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
      .getService(Components.interfaces.nsIClipboardHelper);
    gClipboardHelper.copyString(" " + code + " ");
  });

  prefutil.observeSetting("cssclasses", spec => {
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
    spec.clazzes.forEach(clazz => {
      spec.elt.addClass(clazz);
    });
    spec.post = spec.elt.get(0).className;
    delete spec.elt;
  });

  const params = {};
  const query = window.location.toString().split('?')[1];
  const kvs = (query && query.split('&')) || [];
  kvs.forEach(kv => {
    const kvv = kv.split("=");
    if (kvv.length === 2) {
      params[kvv[0]] = kvv[1];
    } else {
      params[kv] = true;
    }
  });

  if (params.NOISE) {
    let N = params.NOISE;
    const row1 = jQuery('#sample2 .swRow').first();
    while (N > 0) {
      N--;
      const copy = row1.clone();
      copy.appendTo(jQuery('#sample2 tbody'));
    }
  }


  //alert(JSON.stringify({query:query,kvs:kvs,params:params}));
};
