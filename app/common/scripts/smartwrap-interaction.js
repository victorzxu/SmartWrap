import jQuery from "jquery";

//TODO: Fix references to smartwrap and logger, try to pass as little info as possible

const Interaction = ((() => {
  let InteractionObj = {};
  InteractionObj.enableDragging = elt => {
    jQuery(elt).data("cached_draggable", elt.draggable);
    elt.draggable = true;
  };
  InteractionObj.disableDragging = elt => {
    elt.draggable = jQuery(elt).data("cached_draggable");
  };

  InteractionObj.BoxIndicator = {
    boxTemplName: "sw_selbox",
    init(params) {
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
      ["bottom", "right", "top", "left"].forEach(key => {
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

      //TODO: TEC - Fix hardcoded settings here
      this.settings = {};
      //this.settings.animateSelector = params.smartwrap && params.smartwrap.getSetting("animateSelector");
      this.settings.animateSelector = false;

      return this;
    },
    handleMouseover(event) {
      // //console.log("mouseOver");
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
        complete() {
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
    handleMouseout(event) {
      ////console.log("mouseOut");
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
    registerListeners() {
      const that = this;
      jQuery(this.doc).bind("mouseover", event => {
        that.handleMouseover(event);
      });
      jQuery(this.doc).bind("mouseout", event => {
        that.handleMouseout(event);
      });
    }
  };

  InteractionObj.SelectTextSelector = {
    init(params) {
      this.doc = params.doc;
      //this.logger = params.logger;
      //this.smartwrap = params.smartwrap;

      return this;
    },
    handleDrop(event) {
      //console.log("drop");
      event.preventDefault();
      const data  = event.dataTransfer.getData("test/uri-list");
      //console.log(data);
    },
    handleDragend(event) {
      //console.log("dragEnd");
      const tgt = event.target;

      const data = dropevent.dataTransfer.getData("text/uri-list");
      //console.log(data);
      //ZD:COMMENTED out since the document should be different NOW
      //if (this.doc !== tgt.ownerDocument) {
        // can ignore mouse/over from other documents
        //return;
      //}

      //if (log) {
      //  log("...DRRAG");
      //}
    },
    handleDragstart(event) {
      //console.log("dragStart");
      const tgt = event.target;
      const i = 0;
      let df;
      let dump;

      if (this.doc !== tgt.ownerDocument) {
        // can ignore mouse/over from other documents
        return;
      }

      //TODO: TEC - Uncomment the following
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
      //console.log("in interaction");
      evt.initCustomEvent("sw_dragstart", true, true, detail);
      this.doc.dispatchEvent(evt);

      //tgt.ownerDocument.defaultView.alert("DRRAG:" + JSON.stringify(Object.keys(detail)));
    },
    registerListeners() {
      const that = this;
      jQuery(this.doc).bind("dragstart", event => {
        //console.log("dragstart");
        that.handleDragstart(event);
      });
      jQuery(this.doc).bind("dragend", event => {
        //console.log("dragend");
        that.handleDragend(event);
      });
      this.doc.addEventListener("drop",this.handleDrop(event));
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
    //console.log(tgt);
    jQuery(this.selectedElt).addClass("sw_selected");
    InteractionObj.enableDragging(this.selectedElt);
    //this.selectedElt.draggable = true;
    //tgt.ownerDocument.defaultView.alert("CLICKED!!");
  };
  InteractionObj.ClickSelector.registerListeners = function () {
    const that = this;
    InteractionObj.SelectTextSelector.registerListeners.call(this);
    jQuery(this.doc).bind("dblclick", event => {
      that.handleDblclick(event);
    });
    jQuery(this.doc).bind("click", event => {
      that.handleClick(event);
    });
  };

  InteractionObj.HoverSelector = Object.create(InteractionObj.SelectTextSelector);
  InteractionObj.HoverSelector.init = function (params) {
    InteractionObj.SelectTextSelector.init.call(this, params);

    return this;
  };
  InteractionObj.HoverSelector.handleMouseover = event => {
    //event.target.draggable = true;
    InteractionObj.enableDragging(event.target);
  };
  InteractionObj.HoverSelector.handleMouseout = event => {
    //event.target.draggable = false;
    InteractionObj.disableDragging(event.target);
  };
  InteractionObj.HoverSelector.registerListeners = function () {
    const that = this;
    InteractionObj.SelectTextSelector.registerListeners.call(this);
    jQuery(this.doc).bind("mouseover", event => {
      that.handleMouseover(event);
    });
    jQuery(this.doc).bind("mouseout", event => {
      that.handleMouseout(event);
    });
  };

  return InteractionObj;
})());

export default Interaction;
