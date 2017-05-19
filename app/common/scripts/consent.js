import jQuery from "jquery";
import prefutil from "./prefutil";
import {decrypt_string} from "./lib/appleman";


jQuery(document).on('ready', function () {
  jQuery(".decryptHere").each(function (ix, elt) {
    const index = jQuery(elt).attr("decryptIndex");
    const decrypted_string = decrypt_string(index, 0, 0, true);
    jQuery(elt).text(decrypted_string);
  });


  const spec = {};
  spec.url = window.location.href;
  spec.urlparts = spec.url.split(/\?/);
  if (spec.urlparts.length > 1) {
    spec.querystr = spec.urlparts[1];
    spec.kv = spec.querystr.split(/\&/);
    spec.params = spec.kv.reduce(function (accum, pair) {
      const keyval = pair.split('=');
      const key = keyval.shift();
      const val = keyval.shift();
      accum[key] = val;
      return accum;
    }, {});

  }

  spec.invalid = {};
  spec.optout = {};
  spec.widgets = {};
  ['age', 'informed', 'willing'].forEach(function (key) {
    if (spec.params && spec.params[key]) {
      const widgetid = ['#', key, spec.params[key]].join("");
      spec.widgets[widgetid] = [jQuery(widgetid).length];
      jQuery(widgetid).attr('checked', true);
      if (spec.params[key] === 'No') {
        spec.optout[key] = spec.params[key];
      }
    } else {
      spec.invalid[key] = 'unset';
    }
    //spec.invalid[key] = (spec.params && spec.params[key]) ? undefined : 'unset';
  });
  spec.posted = (spec.params && spec.params.submit);

  spec.flaws = Object.keys(spec.invalid);
  spec.flawcount = Object.keys(spec.invalid).length;
  spec.done = (!!spec.posted) && (Object.keys(spec.invalid).length === 0);

  jQuery('#request').toggle(!spec.done);
  jQuery('#thanks').toggle(!!spec.done);

  if ((!!spec.posted) && (!spec.done)) {
    jQuery('#invalid').show();
    //alert('INVALID '+ JSON.stringify(spec));
  }

  if (!!spec.done) {
    spec.consented = (Object.keys(spec.optout).length === 0);

    prefutil.setPrefs({
      consent: (spec.consented ? "true" : "false")
    });
    //alert('SET AMTCH! '+ JSON.stringify(spec));
  }


  jQuery('#formSubmit').on('click', function (event) {
    //prefutil.setPrefs({consent: "false"});

    return true;
  });
});
