import jQuery from "jquery";
const $ = jQuery;

//TODO: Fix logging since reference to smartwrap was taken out

const DocumentMarker = ((() => {
  return spec => {
    let self = {};
    self.spec = spec || {};

    self.init = function (doc, params) {
      //alert("HOK");
      this.doc = doc;
      this.token = doc.defaultView.location.href;
      /*
       this.walker = doc.createTreeWalker(doc.documentElement,
       NodeFilter.SHOW_ALL,
       null,
       true);
       */

      this.params = params || {};
      this.params.chunkSize = this.params.chunkSize || 200;
      this.params.chunkDelay = this.params.chunkDelay || 10;

      this.nodes = jQuery(doc).find("*:not(iframe)");

      //this.nodes.addClass("marking");
      this.offset = 0;
      this.checklist = {};
      this.nodelist = [];
      this.nodemap = {};
      this.styleids = {};
      //TODO: TEC - either fix by refactoring, or uncomment the following
      //this.smartwrap = this.params.smartwrap;
      //this.logger = this.params.logger || this.smartwrap;
      this.chunkCount = 0;
      this.nodeCount = 0;

      this.callbacks = {};
      this.callbacks.finish = this.params.finishCallback;

      this.marktimes = [];

      const that = this;
      //TODO: Fix these references to smartwrap and try to refer to only the settings
      this.settings = (params => {
        if (params.settings) {
          return params.settings;
        }
        const settings = {};
        ["fixComments", "fixAttributes", "fixLinebreaks", "fixEltnames", "computeFeatures"].forEach(key => {
          //TODO: Fix these hardcoded settings
          settings[key] = true;
          //settings[key] = (that.smartwrap && that.smartwrap.getSetting(key)) || true;
        });
        return settings;
      })(params);

      this.fixstimuli = [];
      this.fixresponses = [];

      if (this.settings.fixComments) {
        this.fixstimuli.push(function () {
          return this.nodeType === this.COMMENT_NODE;
        });
        this.fixresponses.push(node => {
          node.textContent = node.textContent.replace(/\-/g, "- ");
        });
      }

      if (this.settings.fixAttributes) {
        const fixAtts = node => {
          const atts = node.attributes;

          const attnames = [];
          let i = 0;
          for (i = 0; i < atts.length; i += 1) {
            const attname = atts.item(i).localName;
            attnames.push(attname);

            if (!attname.match(/^[A-Za-z: _]/)) {
              node.removeAttribute(attname);
              //this.logger.log({
              //  TRIMATT: attname,
              //  url: this.doc.documentURI
              //});
              i -= 1; // atts is a live list, because the DOM is terrible
            } else if (attname.match(/[\",\';]/)) {
              node.removeAttribute(attname);
              //this.logger.log({
              //  TRIMATT2: attname,
              //  url: this.doc.documentURI
              //});
              i -= 1; // atts is a live list, because the DOM is terrible
            } else if (attname.match(/^onsubmit/)) {
              node.removeAttribute(attname);
              //this.logger.log({
              //  TRIMATT3: attname,
              //  url: this.doc.documentURI
              // });
              i -= 1; // atts is a live list, because the DOM is terrible
            } //else {
            //this.logger.log({KEEPATT: attname});
            // }

            const attval = atts.item(i).value;
            if (attval.match(/[<>]/)) {
              node.removeAttribute(attname);
              i -= 1;
              //setTimeout(function() { alert(JSON.stringify({badatt:'bad',key:attname,val:attval})); }, 1000);
            }
          }
          //alert("ATTS: " + JSON.stringify(attnames));
        };

        this.fixstimuli.push(function () {
          return this.nodeType === this.ELEMENT_NODE;
        });
        this.fixresponses.push(fixAtts);
      }

      if (this.settings.fixLinebreaks1) {
        var fixLinebreaks = function (node) {
          const kids = jQuery(node).contents();
          let newSpan = node.ownerDocument.createElement("span");
          newSpan.setAttribute("class", "sw_inserted");

          let i = 0;
          for (i = 0; i < kids.length; i += 1) {
            const kid = kids.get(i);
            if (jQuery(kid).filter("br").length) {
              node.appendChild(newSpan);
              node.appendChild(kid);
              this.markNode(newSpan);
              newSpan = node.ownerDocument.createElement("span");
              newSpan.setAttribute("class", "sw_inserted");
            } else {
              newSpan.appendChild(kid);
            }
          }
          node.appendChild(newSpan);
          this.markNode(newSpan);
        };

        this.fixstimuli.push(function () {
          return jQuery(this).children("br").length;
        });
        this.fixresponses.push(fixLinebreaks);
      }

      if (this.settings.fixLinebreaks) {
        var fixLinebreaks = function (node) {
          const kids = jQuery(node).contents();
          let newSpan = node.ownerDocument.createElement("span");
          newSpan.setAttribute("class", "sw_inserted");

          let i = 0;
          for (i = 0; i < kids.length; i += 1) {
            const kid = kids.get(i);
            if (jQuery(kid).filter("br").length) {
              node.appendChild(newSpan);
              node.appendChild(kid);
              this.markNode(newSpan);
              newSpan = node.ownerDocument.createElement("span");
              newSpan.setAttribute("class", "sw_inserted");
            } else {
              newSpan.appendChild(kid);
            }
          }
          node.appendChild(newSpan);
          this.markNode(newSpan);
        };

        const nontrivWhitespace = function (node) {
          if (this.nodeType !== this.TEXT_NODE) {
            return false;
          }
          const txt = jQuery(this).text();
          if ((/^\s*$/).test(txt)) {
            return false;
          }

          return true;
        };

        this.fixstimuli.push(function () {
          return jQuery(this).contents().filter(nontrivWhitespace).siblings("br").length
        });
        this.fixresponses.push(fixLinebreaks);
      }

      if (this.settings.fixEltnames) {
        this.fixstimuli.push(function () {
          return (this.nodeType === this.ELEMENT_NODE) && (this.nodeName.match(/[^a-zA-Z0-9]/));
        });
        this.fixresponses.push(node => {
          const nodeName = node.nodeName.replace(/[^a-zA-Z0-9]/g, '');
          // this.logger.log({
          //   PREFIX: node.nodeName,
          //   POSTFIX: nodeName
          // });
          jQuery(node).contents().unwrap().wrapAll("<" + nodeName + "/>");
        });
      }
    };
    self.fixNode1 = function () {
      self.fixNode(this);
    };
    self.mark = function () {
      try {
        // this.logger.log({
        //   MARKTIMES0: this.marktimes
        // });
        this.marktimes.push(new Date());
        this.mark0();
        this.offset += this.params.chunkSize;
        this.marktimes.push(new Date());

        //this.logger.log({MARKTIMES: this.marktimes});
      } catch (exception) {
        // this.logger.log({
        //   exception: {
        //     name: exception.name,
        //     message: exception.message,
        //     stack: exception.stack
        //   },
        //   context: "marking doc",
        //   nodeCount: this.nodeCount,
        //   url: this.doc.documentURI
        // });
        console.log(exception);
      }
    };
    self.mark0 = function () {
      this.chunkCount += 1;
      // this.logger.log({
      //   chunkNo: this.chunkCount,
      //   nodeCount: this.nodeCount,
      //   url: this.doc.documentURI
      // });

      const that = this;

      const detail = {};
      detail.inprogress = true;
      detail.token = this.token;
      //detail.logger = this.smartwrap;
      detail.offset = this.offset;
      detail.ub = this.nodes.length;

      const evt = this.doc.createEvent("CustomEvent");
      evt.initCustomEvent("sw_markingstatus", true, true, detail);
      this.doc.dispatchEvent(evt);

      //this.logger.log({post:"markingstat", token: detail.token});

      let i = 0;
      while (i < this.params.chunkSize) {
        //this.logger.log({where: "prexpath", nodeCount: this.nodeCount, i: i, url: this.doc.documentURI});
        //var node = this.walker.currentNode;
        if ((this.offset + i) >= this.nodes.length) {
          // this.logger.log({
          //   lastxpath: this.xpath,
          //   nodeCount: this.nodeCount,
          //   i: i,
          //   offset: this.offset,
          //   ll: this.nodes.length,
          //   url: this.doc.documentURI,
          //   checklist: this.checklist
          // });
          if (Object.keys(this.checklist).length) {
            // this.logger.log({
            //   leftbehind: Object.keys(this.checklist)
            // });
          }

          this.finish();

          return;
        }
        const node = this.nodes.get(this.offset + i);
        //this.logger.log({where: "postnode", nodeCount: this.nodeCount, i: i, url: this.doc.documentURI});

        this.markNode(node);

        try {
          /*
           if (node.nodeName.match(/[^a-zA-Z0-9]/)) {
           this.logger.log({PREFIX: node.nodeName});
           jQuery(node).contents().unwrap().wrapAll("<li/>");
           //node = newNode.get(0);
           this.logger.log({POSTFIX: node.nodeName});
           }
           */
          this.fixNode(node);
          //this.markElement(node);

          const nonelts = jQuery(node).contents().filter(this.isNonElt);

          nonelts.each(this.fixNode1);

          /*
           this.wrapKids(node);
           this.wrapKeyedValues(node);
           */
        } catch (exception) {
          // this.logger.log({
          //   exception: {
          //     name: exception.name,
          //     message: exception.message,
          //     stack: exception.stack
          //   },
          //   context: "processing node",
          //   nodeCount: this.nodeCount,
          //   i,
          //   url: this.doc.documentURI,
          //   node
          // });
          console.log(exception);
          //continue;
        }

//this.logger.log({markedxpath: xpath, nodeCount: this.nodeCount, i: i, url: this.doc.documentURI});

        this.nodeCount += 1;

        /*
         try {
         var nextNode = this.walker.nextNode();
         if (nextNode === null) {
         this.logger.log({lastxpath: this.xpath, nodeCount: this.nodeCount, i: i, url: this.doc.documentURI, checklist: this.checklist});
         if (Object.keys(this.checklist).length) {
         this.logger.log({leftbehind: Object.keys(this.checklist)});
         }

         this.finish();

         return;
         }
         } catch (exception2) {
         this.logger.log({
         exception: {name: exception2.name, message: exception2.message, stack: exception2.stack},
         context: "finishingdom",
         nodeCount: this.nodeCount,
         i: i,
         url: this.doc.documentURI,
         node: node
         });
         }
         */

        i += 1;
      }

      window.setTimeout(() => {
        that.mark();
      }, this.params.chunkDelay);
    };
    self.markNode = function (node) {
      //<editor-fold desc="yxl:ifFalseCodeBlock">
      if (false) {
        return;
      }
      //</editor-fold>

      if (node.localName) {
        const tag = node.localName.toLowerCase();
        //this.logger.log({MARKTAG: tag});

        if (tag.match(/\:/)) {
          return;
        }
        if (tag.match(/[^A-Za-z0-9]/)) {
          return;
        }

        const ord = 1 + jQuery(node).prevAll(tag).length;
        const xpathParts = {
          prefix: (jQuery(node.parentNode).data("xpath") || ""),
          lname: tag,
          ord
        };
        const xpath0 = [xpathParts.prefix, xpathParts.lname].join("/");
        this.xpath = [xpath0,
          (ord ? ["[", xpathParts.ord, "]"].join("") : "")
        ].join("");

        jQuery(node).data("xpath", this.xpath);
        //this.logger.log({MARKTAG: tag, PREFIX: node.prefix, NS: node.namespaceURI, xpath: this.xpath});

        //node.setAttribute("MARKED", "true");

        this.checklist[this.xpath] = node;

        const nodeinfo = {};
        this.nodelist.push(nodeinfo);
        this.nodemap[this.xpath] = nodeinfo;

        nodeinfo.xpath = this.xpath;
        nodeinfo.node = node;

        this.markElement(node);
      }
    };
    self.markElement = function (node) {
      if (node.nodeType !== node.ELEMENT_NODE) {
        return;
      }

      let xpath = jQuery(node).data("xpath");

      if (!xpath) {
        return;
      }

      if (this.settings.computeFeatures) {
        const depth = 1 + (jQuery(node.parentNode).data("treedepth") || 0);
        jQuery(node).data("treedepth", depth);
        const taglen = 1 + node.localName.length + (jQuery(node.parentNode).data("taglen") || 0);
        jQuery(node).data("taglen", taglen);

        //alert("STYLES: " + JSON.stringify(this.styles));

        //this.logger.log({MARKELT: xpath + "!!"});

        const features = {};
        features.depth = jQuery(node).data("treedepth");
        features.taglen = jQuery(node).data("taglen");
        features.child_count = node.childNodes.length;
        features.attr_count = node.attributes.length;

        const style = this.getPresentedStyle(node);

        const position = this.getLayoutPosition(node);

        this.nodemap[xpath].position = position;
        this.nodemap[xpath].style = style;
        this.nodemap[xpath].features = features;

        jQuery(node).data("style", style);
      }

      /*
       var bfg = jQuery(node).css("backgroundColor");
       jQuery(node).data("bg", bfg);
       jQuery(node).css({backgroundColor: "green"});
       window.setTimeout(function () {
       jQuery(node).css({backgroundColor: bfg});
       }, 50);
       */

      window.setTimeout(() => {
        jQuery(node).removeClass("marking");
      }, 1000);
      jQuery(node).data("marked", true);

      delete this.checklist[xpath];
    };
    self.getLayoutPosition = node => {
      const crect = node.getBoundingClientRect();
      const position = {};

      position.relx = Math.round(crect.x);
      position.rely = Math.round(crect.y);
      position.width = Math.round(crect.width);
      position.height = Math.round(crect.height);

      position.absx = 1 * position.relx + Math.round(window.scrollX);
      position.absy = 1 * position.rely + Math.round(window.scrollY);

      return position;
    };
    self.getPresentedStyle = function (node) {
      const cStyle = window.getComputedStyle(node);
      const summ = {};
      let i = 0;
      for (i = 0; i < this.styles.length; i += 1) {
        const attr = this.styles[i];
        const val = cStyle.getPropertyValue(attr);
        summ[attr] = val;

        if (!this.params.noids) {
          if (!this.styleids[attr]) {
            this.styleids[attr] = {};
          }
          const idmap = this.styleids[attr];
          const styleid = idmap[val] || Object.keys(idmap).length;
          summ[attr + "_id"] = styleid;
        }
      }
      return summ;
    };

    self.styles = ["font-size", "color", "background-color", "font-family",
      "text-align", "text-transform", "font-style",
      "word-spacing", "font-weight"
    ];
    self.isNonElt = function () {
      return this.nodeType !== this.ELEMENT_NODE;
    };

    self.fixNode = function (node) {

      let i = 0;
      for (i = 0; i < this.fixstimuli.length; i++) {
        const stimulus = this.fixstimuli[i];

        if (jQuery(node).filter(stimulus).length) {
          const response = this.fixresponses[i];

          response.call(this, node);
        }
      }
    };

    self.finish = function () {
      //alert("DONEDONEDONE!");

      const that = this;

      that.marktimes.push(new Date());
      // that.logger.log({
      //   FINISHDOM: new Date() - that.marktimes[0],
      //   url: that.doc.documentURI
      // });

      try {

        const metadata = {};

        var doc1 = this.doc.cloneNode(true);
        const doctype = doc1.doctype;
        if (doctype) {
          doctype.parentNode.removeChild(doctype);
        }
        var domstr = "";
        // if (true) {
        //   var stream = {
        //     write : function(string, count) {
        //       domstr += string;
        //     }
        //   };
        //   var ser = new XMLSerializer();
        //   console.log(ser.serializeToSteam);
        //   new XMLSerializer().serializeToStream(doc1,stream,"UTF-8");
        // }
        var XMLS = new XMLSerializer();
        metadata.docClone = doc1;
        metadata.domxml = XMLS.serializeToString(doc1);
        // console.log("nodelist");
        // console.log(this.nodelist);
        metadata.bwdominfo = this.nodelist;
        metadata.nodemap = this.nodemap;
        var msgDetail = {
          'eventName' : 'docMsg',
          'docClone' : XMLS.serializeToString(metadata.docClone),
          'domxml' : encodeURIComponent(metadata.domxml),
          'bwdominfo' : encodeURIComponent(JSON.stringify(metadata.bwdominfo)),
          'nodemap' : JSON.stringify(metadata.nodemap),
        }
        window.postMessage(msgDetail,'*');
        console.log('message Posted');

        // that.logger.log({
        //   "METAKEYS": Object.keys(metadata)
        // });

        //TODO: TEC - uncomment the following or fix by refactoring
        //if (this.smartwrap && this.smartwrap.scrapeTarget) {
        // that.logger.log({
        //   "USEMETAKEYS": Object.keys(metadata)
        // });
        Object.keys(metadata).forEach(function(key) {
          that.params.smartwrap[key] = metadata[key];
        });

        //alert("SETDOM: " + JSON.stringify({url: this.doc.defaultView.location.href, tgt: this.smartwrap.scrapeTarget}));
        //} else {
        //alert("SQUIRRELDOM: " + JSON.stringify({url: this.doc.defaultView.location.href, tgt: this.smartwrap.scrapeTarget}));
        // that.logger.log({
        //   "UNUSEMETAKEYS": Object.keys(metadata)
        // });
        //}

        jQuery(this.doc).data("metadata", metadata);

        let detail = {};

        if (this.smartwrap) {
          detail.smartwrap = this.smartwrap;
          this.smartwrap.status.fresh = false;
        }

        let evt = document.createEvent("CustomEvent");
        evt.initCustomEvent("sw_status", true, false, detail);
        document.dispatchEvent(evt);
        detail = {};
        detail.inprogress = false;
        detail.finished = true;
        detail.token = this.token;
        //detail.logger = this.logger || this.smartwrap;

        evt = document.createEvent("CustomEvent");
        evt.initCustomEvent("sw_markingstatus", true, true, detail);
        this.doc.dispatchEvent(evt);

        if (this.callbacks.finish) {
          this.callbacks.finish.call(null, detail);
        }
      } catch (exception) {
        // this.logger.log({
        //   exception: {
        //     name: exception.name,
        //     message: exception.message,
        //     stack: exception.stack
        //   },
        //   context: "finish dom",
        //   nodeCount: this.nodeCount,
        //   url: this.doc.documentURI
        // });
        console.log(exception);
      }

// this.logger.log({
//   finisheddom: true,
//   nodeCount: this.nodeCount,
//   url: this.doc.documentURI
// });
//alert("DIDDONE: " + JSON.stringify(this.nodelist));
    };

    self.init(self.spec.doc, self.spec.params);
//console.log(self);
    console.log("INITTED marker");
    return self;
  };
})());

export default DocumentMarker;
