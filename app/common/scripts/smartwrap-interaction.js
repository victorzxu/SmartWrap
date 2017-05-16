//TODO: Fix references to smartwrap and logger, try to pass as little info as possible
var ProcessDOM;

if (!ProcessDOM) {
  ProcessDOM = {};
}

ProcessDOM.Interaction = (function() {
  "use strict";

  ProcessDOM.Interaction = {};
  ProcessDOM.Interaction.enableDragging = function(elt) {
    jQuery(elt).data("cached_draggable", elt.draggable);
    elt.draggable = true;
  };
  ProcessDOM.Interaction.disableDragging = function(elt) {
    elt.draggable = jQuery(elt).data("cached_draggable");
  };

  ProcessDOM.Interaction.BoxIndicator = {
    boxTemplName: "sw_selbox",
    init: function(params) {
      this.doc = params.doc;

      var rectboxes = jQuery(this.doc).find(".sw_selbox");
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

      var colors = {
        color: "blue"
      };
      jQuery(this.rectbox).find(".sw_selinner").css({
        "border": jQuery.format("2pt solid {color}", colors)
      });

      jQuery(this.rectbox).find(".content_mockup").hide();
      jQuery(this.rectbox).find(".sw_box_frame").hide();

      this.rectstyle = this.doc.defaultView.getComputedStyle(jQuery(this.rectbox).get(0), ":active");

      var that = this;

      var selboxmodel = {
        opad: {},
        ibord: {},
        owhy: {}
      };
      ["bottom", "right", "top", "left"].forEach(function(key) {
        if (!that.rectstyle) {
          return;
        }
        selboxmodel.opad[key] = parseFloat(that.rectstyle.getPropertyValue("padding-" + key).slice(0, -2));
        selboxmodel.ibord[key] = parseFloat(jQuery(that.rectbox).find(".sw_selinner").css("border-" + key + "-width").slice(0, -2));

        var url = that.rectstyle.getPropertyCSSValue("padding-" + key);

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
    handleMouseover: function(event) {
      var tgt = event.target;

      if (this.doc !== tgt.ownerDocument) {
        // can ignore mouse/over from other documents
        return;
      }

      var marked = jQuery(tgt).data("marked");
      if (!marked) {
        return;
      }

      if (this.framedElt) {
        jQuery(this.framedElt).removeClass("sw_mouseframed");
        this.framedElt = null;
      }

      var that = this;

      jQuery(this.rectbox).show();
      jQuery(tgt).addClass("sw_mouseframed");

      this.framedElt = tgt;

      var rect = tgt.getBoundingClientRect();
      if ((Math.min(rect.height, rect.width)) < 5) {
        return;
      }

      var bounds = {
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

      var ibounds = Object.create(bounds);
      var obounds = Object.create(bounds);

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
        complete: function() {
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
    handleMouseout: function(event) {
      var tgt = event.target;

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
    registerListeners: function() {
      var that = this;
      jQuery(this.doc).bind("mouseover", function(event) {
        that.handleMouseover(event);
      });
      jQuery(this.doc).bind("mouseout", function(event) {
        that.handleMouseout(event);
      });
    }
  };

  ProcessDOM.Interaction.SelectTextSelector = {
    init: function(params) {
      this.doc = params.doc;
      //this.logger = params.logger;
      //this.smartwrap = params.smartwrap;

      return this;
    },
    handleDragend: function(event) {
      var tgt = event.target;

      if (this.doc !== tgt.ownerDocument) {
        // can ignore mouse/over from other documents
        return;
      }

      //if (ProcessDOM.log) {
      //  ProcessDOM.log("...DRRAG");
      //}
    },
    handleDragstart: function(event) {
      var tgt = event.target;
      var i = 0;
      var df, dump;

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

      var detail = {};

      if (this.selectedRange) {
        detail.draggedRange = this.selectedRange;
      }

      detail.dragstartEvent = event;

      //tgt.ownerDocument.defaultView.alert("DRRAG:" + JSON.stringify(Object.keys(detail)));

      //tgt.ownerDocument.defaultView.alert("DRRAG:" + tgt.ownerDocument.defaultView.location.href);

      var evt = document.createEvent("CustomEvent");
      evt.initCustomEvent("sw_dragstart", true, true, detail);
      this.doc.dispatchEvent(evt);

      //tgt.ownerDocument.defaultView.alert("DRRAG:" + JSON.stringify(Object.keys(detail)));
    },
    registerListeners: function() {
      var that = this;
      jQuery(this.doc).bind("dragstart", function(event) {
        that.handleDragstart(event);
      });
      jQuery(this.doc).bind("dragend", function(event) {
        that.handleDragend(event);
      });
    }
  };

  ProcessDOM.Interaction.ClickSelector = Object.create(ProcessDOM.Interaction.SelectTextSelector);
  ProcessDOM.Interaction.ClickSelector.init = function(params) {
    ProcessDOM.Interaction.SelectTextSelector.init.call(this, params);

    return this;
  };
  /*
    Smartwrap.Interaction.ClickSelector.handleDblclick = function (event) {
    event.target.ownerDocument.defaultView.alert("DBLCLICK!!");
    };
  */
  ProcessDOM.Interaction.ClickSelector.handleClick = function(event) {
    var tgt = event.target;

    if (this.doc !== tgt.ownerDocument) {
      // can ignore mouse/over from other documents
      return;
    }
    //tgt.ownerDocument.defaultView.alert("CLICK!!");

    if (this.selectedElt) {
      //this.selectedElt.draggable = false;
      ProcessDOM.Interaction.disableDragging(this.selectedElt);
      jQuery(this.selectedElt).removeClass("sw_selected");
      this.selectedElt = null;
    }

    if (this.selectedRange) {
      this.selectedRange = null;
    }

    var seln = tgt.ownerDocument.getSelection();
    var i = 0;
    for (i = 0; i < seln.rangeCount; i += 1) {
      var selrng = seln.getRangeAt(i);

      var context = tgt.ownerDocument.createRange();
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
    ProcessDOM.Interaction.enableDragging(this.selectedElt);
    //this.selectedElt.draggable = true;
    //tgt.ownerDocument.defaultView.alert("CLICKED!!");
  };
  ProcessDOM.Interaction.ClickSelector.registerListeners = function() {
    var that = this;
    ProcessDOM.Interaction.SelectTextSelector.registerListeners.call(this);
    jQuery(this.doc).bind("dblclick", function(event) {
      that.handleDblclick(event);
    });
    jQuery(this.doc).bind("click", function(event) {
      that.handleClick(event);
    });
  };

  ProcessDOM.Interaction.HoverSelector = Object.create(ProcessDOM.Interaction.SelectTextSelector);
  ProcessDOM.Interaction.HoverSelector.init = function(params) {
    ProcessDOM.Interaction.SelectTextSelector.init.call(this, params);

    return this;
  };
  ProcessDOM.Interaction.HoverSelector.handleMouseover = function(event) {
    //event.target.draggable = true;
    ProcessDOM.Interaction.enableDragging(event.target);
  };
  ProcessDOM.Interaction.HoverSelector.handleMouseout = function(event) {
    //event.target.draggable = false;
    ProcessDOM.Interaction.disableDragging(event.target);
  };
  ProcessDOM.Interaction.HoverSelector.registerListeners = function() {
    var that = this;
    ProcessDOM.Interaction.SelectTextSelector.registerListeners.call(this);
    jQuery(this.doc).bind("mouseover", function(event) {
      that.handleMouseover(event);
    });
    jQuery(this.doc).bind("mouseout", function(event) {
      that.handleMouseout(event);
    });
  };

  return ProcessDOM.Interaction;
}());
