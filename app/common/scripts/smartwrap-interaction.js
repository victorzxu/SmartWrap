import jQuery from "jquery";

//TODO: Fix references to smartwrap and logger, try to pass as little info as possible

const Interaction = (function () {
  "use strict";

  let InteractionObj = {};
  InteractionObj.enableDragging = function (elt) {
    jQuery(elt).data("cached_draggable", elt.draggable);
    elt.draggable = true;
  };
  InteractionObj.disableDragging = function (elt) {
    elt.draggable = jQuery(elt).data("cached_draggable");
  };

  InteractionObj.BoxIndicator = {
    boxTemplName: "sw_selbox",
    init: function (params) {
      this.doc = params.doc;

      const rectboxes = jQuery(this.doc).find(".sw_selbox");
      if (rectboxes.length) {
        // the rectbox was previously added
        //that.log({box: "use", url: doc.documentURI});
        this.rectbox = rectboxes.get(0);
      } else {
        // no rectbox exists, so we add it
        //that.log({box: "add", url: doc.documentURI});
        this.rectbox = jQuery(params.smartwrap.templates[this.boxTemplName]).clone().get(0);
        if (this.doc.body) {
          this.doc.body.appendChild(this.rectbox);
        }
      }

      this.selbox = this.rectbox;

      const colors = {
        color: "blue"
      };
      jQuery(this.rectbox).find(".sw_selinner").css({
        "border": jQuery.format("2pt solid {color}", colors)
      });

      jQuery(this.rectbox).find(".content_mockup").hide();
      jQuery(this.rectbox).find(".sw_box_frame").hide();

      this.rectstyle = this.doc.defaultView.getComputedStyle(jQuery(this.rectbox).get(0), ":active");

      const that = this;

      const selboxmodel = {
        opad: {},
        ibord: {},
        owhy: {}
      };
      ["bottom", "right", "top", "left"].forEach(function (key) {
        if (!that.rectstyle) {
          return;
        }
        selboxmodel.opad[key] = parseFloat(that.rectstyle.getPropertyValue("padding-" + key).slice(0, -2));
        selboxmodel.ibord[key] = parseFloat(jQuery(that.rectbox).find(".sw_selinner").css("border-" + key + "-width").slice(0, -2));

        const url = that.rectstyle.getPropertyCSSValue("padding-" + key);

        selboxmodel.owhy[key] = url.getFloatValue(url.CSS_PX);
      });
      jQuery(this.rectbox).data("padding", selboxmodel.opad);

      this.selboxmodel = selboxmodel;

      //TODO: Fix hardcoded settings here and everywhere
      this.settings = {};
      //this.settings.animateSelector = params.smartwrap && params.smartwrap.getSetting("animateSelector");
      this.settings.animateSelector = false;

      return this;
    },
    handleMouseover: function (event) {
      const tgt = event.target;

      if (this.doc !== tgt.ownerDocument) {
        // can ignore mouse/over from other documents
        return;
      }

      let marked = jQuery(tgt).data("marked");
      if (!marked) {
        return;
      }

      if (this.framedElt) {
        jQuery(this.framedElt).removeClass("sw_mouseframed");
        this.framedElt = null;
      }

      const that = this;

      jQuery(this.rectbox).show();
      jQuery(tgt).addClass("sw_mouseframed");

      this.framedElt = tgt;

      const rect = tgt.getBoundingClientRect();
      if ((Math.min(rect.height, rect.width)) < 5) {
        return;
      }

      const bounds = {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom
      };

      bounds.width = bounds.right - bounds.left;
      bounds.height = bounds.bottom - bounds.top;

      bounds.bottom += this.doc.defaultView.scrollY;
      bounds.top += this.doc.defaultView.scrollY;
      bounds.left += this.doc.defaultView.scrollX;
      bounds.right += this.doc.defaultView.scrollX;

      const ibounds = Object.create(bounds);
      const obounds = Object.create(bounds);

      ibounds.top = this.selboxmodel.opad.top;
      ibounds.left = this.selboxmodel.opad.left;

      ibounds.width -= this.selboxmodel.ibord.left + this.selboxmodel.ibord.right;
      ibounds.height -= this.selboxmodel.ibord.top + this.selboxmodel.ibord.bottom;

      //jQuery(rectbox).find('.sw_selinner').css('left', ibounds.left + "px");
      //jQuery(rectbox).find('.sw_selinner').css('width', ibounds.width + "px");
      //jQuery(rectbox).find('.sw_selinner').css('height', ibounds.height + "px");

      obounds.top -= this.selboxmodel.opad.top;
      obounds.left -= this.selboxmodel.opad.left;

      obounds.width += this.selboxmodel.opad.left + this.selboxmodel.opad.right;
      obounds.height += this.selboxmodel.opad.top + this.selboxmodel.opad.bottom;

      jQuery(this.rectbox).find('.sw_selinner').hide();

      jQuery(this.rectbox).animate({
        top: obounds.top + "px",
        left: obounds.left + "px",
        width: obounds.width + "px",
        height: obounds.height + "px"
      }, {
        duration: this.settings.animateSelector ? 150 : 0,
        queue: false,
        easing: 'swing',
        complete: function () {
          jQuery(that.rectbox).find('.sw_selinner').css({
            top: ibounds.top + "px",
            left: ibounds.left + "px",
            width: ibounds.width + "px",
            height: ibounds.height + "px"
          });
          jQuery(that.rectbox).find('.sw_selinner').show();
        }
      });

      //that.log({bounds: bounds, obounds: obounds, ibounds: ibounds});

      /*
       jQuery(this.rectbox).find(".sw_box_top, .sw_box_left, .sw_box_right").css('top', bounds.top + "px");
       jQuery(this.rectbox).find(".sw_box_top, .sw_box_left, .sw_box_bottom").css('left', bounds.left + "px");
       jQuery(this.rectbox).find(".sw_box_bottom").css('top', bounds.bottom + "px");
       jQuery(this.rectbox).find(".sw_box_right").css('left', bounds.right + "px");

       jQuery(this.rectbox).find(".horizontal").css('width', bounds.width + "px");
       jQuery(this.rectbox).find(".vertical").css('height', bounds.height + "px");
       */
    },
    handleMouseout: function (event) {
      const tgt = event.target;

      if (this.doc !== tgt.ownerDocument) {
        // can ignore mouse/over from other documents
        return;
      }

      if (this.framedElt) {
        jQuery(this.framedElt).removeClass("sw_mouseframed");
        this.framedElt = null;
        //jQuery(this.rectbox).find('.sw_selinner').hide();
        jQuery(this.rectbox).hide();
      }
    },
    registerListeners: function () {
      const that = this;
      jQuery(this.doc).bind("mouseover", function (event) {
        that.handleMouseover(event);
      });
      jQuery(this.doc).bind("mouseout", function (event) {
        that.handleMouseout(event);
      });
    }
  };

  InteractionObj.SelectTextSelector = {
    init: function (params) {
      this.doc = params.doc;
      //this.logger = params.logger;
      //this.smartwrap = params.smartwrap;

      return this;
    },
    handleDragend: function (event) {
      const tgt = event.target;

      if (this.doc !== tgt.ownerDocument) {
        // can ignore mouse/over from other documents
        return;
      }

      //if (log) {
      //  log("...DRRAG");
      //}
    },
    handleDragstart: function (event) {
      const tgt = event.target;
      const i = 0;
      let df, dump;

      if (this.doc !== tgt.ownerDocument) {
        // can ignore mouse/over from other documents
        return;
      }

      //TODO: Bring this back, probably have to send event in a message but might not be wise due to asynchronity...
      // var url = tgt.ownerDocument.defaultView.location.href;
      // if (this.smartwrap.scrapeTarget) {
      //   if (this.smartwrap.scrapeTarget.url !== url) {
      //     this.smartwrap.emit(jQuery(tgt), "sw_outofbounds", {
      //       url: url
      //     });
      //   }
      // }

      if (event.originalEvent && event.originalEvent.dataTransfer) {
        event.originalEvent.dataTransfer.setData("text/plain", "FOOLERY");
      }
      event.originalEvent.stopPropagation();

      const detail = {};

      if (this.selectedRange) {
        detail.draggedRange = this.selectedRange;
      }

      detail.dragstartEvent = event;

      //tgt.ownerDocument.defaultView.alert("DRRAG:" + JSON.stringify(Object.keys(detail)));

      //tgt.ownerDocument.defaultView.alert("DRRAG:" + tgt.ownerDocument.defaultView.location.href);

      const evt = document.createEvent("CustomEvent");
      evt.initCustomEvent("sw_dragstart", true, true, detail);
      this.doc.dispatchEvent(evt);

      //tgt.ownerDocument.defaultView.alert("DRRAG:" + JSON.stringify(Object.keys(detail)));
    },
    registerListeners: function () {
      const that = this;
      jQuery(this.doc).bind("dragstart", function (event) {
        that.handleDragstart(event);
      });
      jQuery(this.doc).bind("dragend", function (event) {
        that.handleDragend(event);
      });
    }
  };

  InteractionObj.ClickSelector = Object.create(InteractionObj.SelectTextSelector);
  InteractionObj.ClickSelector.init = function (params) {
    InteractionObj.SelectTextSelector.init.call(this, params);

    return this;
  };
  /*
   Smartwrap.Interaction.ClickSelector.handleDblclick = function (event) {
   event.target.ownerDocument.defaultView.alert("DBLCLICK!!");
   };
   */
  InteractionObj.ClickSelector.handleClick = function (event) {
    const tgt = event.target;

    if (this.doc !== tgt.ownerDocument) {
      // can ignore mouse/over from other documents
      return;
    }
    //tgt.ownerDocument.defaultView.alert("CLICK!!");

    if (this.selectedElt) {
      //this.selectedElt.draggable = false;
      InteractionObj.disableDragging(this.selectedElt);
      jQuery(this.selectedElt).removeClass("sw_selected");
      this.selectedElt = null;
    }

    if (this.selectedRange) {
      this.selectedRange = null;
    }

    const seln = tgt.ownerDocument.getSelection();
    let i = 0;
    for (i = 0; i < seln.rangeCount; i += 1) {
      const selrng = seln.getRangeAt(i);

      const context = tgt.ownerDocument.createRange();
      context.selectNodeContents(selrng.startContainer);

      // if (this.logger) {
      //   this.logger.log({
      //     selrng: selrng.toString(),
      //     context: context.toString(),
      //     i: i
      //   });
      // }

      if (selrng.toString().match(/\S/)) {
        this.selectedRange = selrng;
        return;
        // seems like the user made a selection, so we don't click to select
      }
    }

    this.selectedElt = tgt;
    jQuery(this.selectedElt).addClass("sw_selected");
    InteractionObj.enableDragging(this.selectedElt);
    //this.selectedElt.draggable = true;
    //tgt.ownerDocument.defaultView.alert("CLICKED!!");
  };
  InteractionObj.ClickSelector.registerListeners = function () {
    const that = this;
    InteractionObj.SelectTextSelector.registerListeners.call(this);
    jQuery(this.doc).bind("dblclick", function (event) {
      that.handleDblclick(event);
    });
    jQuery(this.doc).bind("click", function (event) {
      that.handleClick(event);
    });
  };

  InteractionObj.HoverSelector = Object.create(InteractionObj.SelectTextSelector);
  InteractionObj.HoverSelector.init = function (params) {
    InteractionObj.SelectTextSelector.init.call(this, params);

    return this;
  };
  InteractionObj.HoverSelector.handleMouseover = function (event) {
    //event.target.draggable = true;
    InteractionObj.enableDragging(event.target);
  };
  InteractionObj.HoverSelector.handleMouseout = function (event) {
    //event.target.draggable = false;
    InteractionObj.disableDragging(event.target);
  };
  InteractionObj.HoverSelector.registerListeners = function () {
    const that = this;
    InteractionObj.SelectTextSelector.registerListeners.call(this);
    jQuery(this.doc).bind("mouseover", function (event) {
      that.handleMouseover(event);
    });
    jQuery(this.doc).bind("mouseout", function (event) {
      that.handleMouseout(event);
    });
  };

  return InteractionObj;
}());

export default Interaction;
