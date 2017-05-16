var Smartwrap;

if (!Smartwrap) {
  Smartwrap = {};
}

Smartwrap.Interpreter = (function() {
  "use strict";
  return {
    functions: {
      "begin": function(steps) {
        var that = this;
        var result = null;
        steps.forEach(function(step) {
          result = that.interpret(step);
        });
        return result;
      },
      "startTable": function(args) {
        var tabObj = this.interpret(args[0]);
        var params = {};
        if (tabObj.tableid) {
          params.tableid = tabObj.tableid;
        }
        params.label = tabObj.label;
        params.hidden = tabObj.hidden;
        this.fireEvent("startTable", params);
      },
      "endTable": function() {
        this.fireEvent("endTable");
      },
      "startRow": function() {
        this.fireEvent("startRow");
      },
      "endRow": function() {
        this.fireEvent("endRow");
      },
      "defineColumn": function(args) {
        var colObj = this.interpret(args[0]);
        this.fireEvent("defineColumn", {
          definition: colObj
        });
      },
      "makeCell": function(args) {
        var range0 = this.interpret(args[0]);
        var meta = {};
        if (args.length > 1) {
          meta = this.interpret(args[1]);
        }

        var params = {};
        if (meta && meta.colid) {
          params.colid = meta.colid;
        }
        if (range0) {
          params.range = range0;
          params.selector = range0.selector;
        }

        this.fireEvent("makeCell", params);
      },
      "selectNodeContents": function(args) {
        var range = this.interpret(args[0]);
        var node1 = this.interpret(args[1]);

        if (node1) {
          range.selectNodeContents(node1);
          this.fireEvent("select", {
            range: range
          });
          range.selector = node1.selector;
        } else {}


        return range;
      },
      "createRange": function() {
        if (this.doc) {
          return this.doc.createRange();
        }
        return null;
      },
      "query": function(args) {
        var selector = this.interpret(args[0]);

        var params = {
          xpath: selector
        };

        if (this.doc) {
          var resolver = this.doc.createNSResolver(this.doc);
          var result = this.doc.evaluate(selector, this.doc, resolver, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue;

          if (result) {
            result.selector = selector;
            params.result = result;
          } else {
            var partials = {};
            partials.sels = [];
            var parts = selector.split("/");
            for (var ii = 2; ii <= parts.length; ii++) {
              var sel2 = parts.slice(0, ii).join('/');
              partials.sels.push(sel2);
              try {
                var rel2 = this.doc.evaluate(sel2, this.doc, resolver, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue;
                partials[sel2] = !!rel2;
              } catch (ee) {
                partials[sel2] = {
                  msg: ee.message,
                  stack: ee.stack
                };
              }
            }
            if (Smartwrap.log) {
              Smartwrap.log({
                NONESUCH: selector,
                partials: partials
              });
            }
          }

          this.fireEvent("query", params);

          return result;
        }
        return null;
      },
      "nextPage": function(args) {
        var node = this.interpret(args[0]);
        if (node) {
          this.fireEvent("nextPage", {
            node: node
          });
        }
      }
    },
    addEventListener: function(eventName, listener) {
      if (!this.listeners) {
        this.listeners = {};
      }
      if (!this.listeners[eventName]) {
        this.listeners[eventName] = [];
      }

      this.listeners[eventName].push(listener);
    },
    fireEvent: function(eventName, params) {
      if (!this.listeners) {
        return;
      }
      var that = this;
      if (this.listeners[eventName]) {
        this.listeners[eventName].forEach(function(listener) {
          listener.call(that, params);
        });
      }
    },
    setContext: function(doc) {
      this.doc = doc;
    },
    interpret: function(program) {
      //alert("interp: " + JSON.stringify(program));
      if (Smartwrap.log) {
        Smartwrap.log({
          INTERPRET: program
        });
      }

      var that = this;

      if (jQuery.isArray(program)) {
        var funname = program[0];
        var args = program.slice(1);

        var fun = this.functions[funname];
        if (!fun) {
          if (Smartwrap.log) {
            Smartwrap.log({
              UNIMPLEMENTED: funname
            });
          }
          return;
        }

        return fun.call(that, args);
      }
      return program;
    }
  };
}());

Smartwrap.LoadInterpreter = (function() {
  "use strict";
  var interp = Object.create(Smartwrap.Interpreter);

  interp.addEventListener("startTable", function(params) {
    if (this.logger) {
      this.logger.log({
        "BEGTAB!!": ""
      });
    }
    this.tableid = params.tableid;
    this.tablecontents = [];
  });

  interp.addEventListener("query", function(params) {
    this.querynode = params && params.result;
  });

  interp.addEventListener("startRow", function(params) {
    this.currentRow = [];
  });
  interp.addEventListener("endRow", function(params) {
    this.tablecontents.push(this.currentRow);
  });

  interp.addEventListener("makeCell", function(params) {
    var cell = {};
    cell.colid = params && params.colid;
    var contents = [];
    var images = jQuery();
    var links = jQuery();

    var range = params.range;
    var kid = range.startContainer;

    while (kid !== range.endContainer) {
      contents.push(this.smartwrap.getVisibleText(kid));
      kid = kid.nextSibling;
      images = images.add(jQuery(kid).find("img"));
      links = links.add(jQuery(kid).find("a"));
    }

    contents.push(this.smartwrap.getVisibleText(kid));
    images = images.add(jQuery(kid).find("img"));
    links = links.add(jQuery(kid).find("a"));

    if (this.logger) {
      this.logger.log({
        "CELLCONT": contents,
        "PARAMS": params,
        IMAGES: images,
        IMGCNT: images.length
      });
    }

    cell.contents = contents.join("");

    images.first().each(function(index, img) {
      cell.imageSource = img.src;
      cell.imageAltText = img.alt;
    });
    links.first().each(function(index, link) {
      cell.linkTarget = link.href;
    });

    if (this.querynode) {
      cell.style = jQuery(this.querynode).data("style");
    }

    cell.xpath = range.selector;

    this.currentRow.push(cell);

    if (this.logger) {
      this.logger.log({
        "CELL": cell
      });
    }
  });

  interp.addEventListener("endTable", function(params) {
    if (this.logger) {
      this.logger.log({
        "ENDTAB!!": ""
      });
    }
    var tableid = this.tableid;
    var smarttable = this.smartwrap.getTable(tableid);
    if (!smarttable) {
      throw ("MISSING TABLE: " + tableid);
    }

    try {
      var loaddata = smarttable.loadContents(this.tablecontents);
      this.inferredCount += loaddata.inferredCount;
    } catch (eef) {
      if (this.logger) {
        this.logger.log({
          "EEF": eef.message,
          stack: eef.stack
        });
      }
    }
    //that.log({"LOADDATA": loaddata});
  });
  return interp;
}());

Smartwrap.ReportInterpreter = (function() {
  "use strict";
  var interp = Object.create(Smartwrap.Interpreter);

  interp.tables = {};
  interp.json = {};
  interp.tableStack = [];
  interp.rowStack = [];

  interp.insertStack = [];

  interp.colids = [];

  interp.setTarget = function(target) {
    this.target = target;
    this.targetDoc = target.ownerDocument;

    //this.tableStack.unshift(target);

    this.insertStack.unshift(target);
  };

  interp.addEventListener("startTable", function(params) {
    if (this.logger) {
      this.logger.log({
        "BEGTAB!!": params
      });
    }

    var tableid = params.tableid;
    /*
        if (! tableid) {
          return;
        }
    */

    if (tableid) {
      this.tableid = tableid;
    }
    this.tablecontents = [];
    this.colids = [];

    //alert("TABREP: " + JSON.stringify(params));
    //alert("BEGTAB: " + new XMLSerializer().serializeToString(this.doc));

    var insertPoint = this.insertStack[0];

    var tableElt = this.targetDoc.createElement("table");
    jQuery(tableElt).addClass("swTable");
    if (params.hidden) {
      jQuery(tableElt).addClass("hidden");
    }
    this.tables[this.tableid] = tableElt;
    this.tableStack.unshift(tableElt);

    if (this.logger) {
      this.logger.log({
        INSERTAT: jQuery(insertPoint).is("tr")
      });
    }

    insertPoint.appendChild(tableElt);
    if (jQuery(insertPoint).is("tr")) {
      jQuery(tableElt).wrap("<td/>");
    }

    if (params.label) {
      var caption = this.targetDoc.createElement("caption");
      caption.appendChild(this.targetDoc.createTextNode(params.label));
      tableElt.appendChild(caption);
    }

    var headerRow = this.targetDoc.createElement("tr");
    tableElt.appendChild(headerRow);
    jQuery(headerRow).hide();

    var tabWidget = this.targetDoc.createElement("tbody");
    tableElt.appendChild(tabWidget);
  });
  interp.addEventListener("endTable", function(params) {
    if (this.logger) {
      this.logger.log({
        "ENDTAB!!": params
      });
    }

    var tableElt = jQuery(this.tableStack[0]);
    tableElt.data('json', tableElt.find("tr").map(function(ix, elt) {
      return [jQuery(elt).data('json')];
    }).get());


    this.tablecontents.push(tableElt.data('json'));
    this.json[this.tableid] = tableElt.data('json');

    if (this.logger) {
      this.logger.log({
        "TABJSON!!": tableElt.data('json'),
        json: this.json,
        cont: this.tablecontents
      });
    }

    this.tableStack.shift();
  });
  interp.addEventListener("defineColumn", function(params) {
    if (this.logger) {
      this.logger.log({
        "COLDEF!!": params
      });
    }

    var tableElt = this.tableStack[0];
    var headerRow = jQuery(tableElt).find("tr");
    headerRow.show();

    var headerCell = this.targetDoc.createElement("th");
    headerRow.get(0).appendChild(headerCell);

    var headerText = (params.definition && params.definition.label);

    headerCell.appendChild(this.targetDoc.createTextNode(headerText || " "));
    if (headerText) {
      //var table = this.tables[this.tableid];
      //table.appendChild(this.headerRow);
      headerRow.show();
    }
    var colid = params.definition && params.definition.colid;
    this.colids.push(colid);
    if (this.logger) {
      this.logger.log({
        "COLDEFED!!": this.colids
      });
    }
  });

  interp.addEventListener("startRow", function(params) {
    if (this.logger) {
      this.logger.log({
        "BEGROW!!": ""
      });
    }

    var tableElt = this.tableStack[0];
    var tabWidget = jQuery(tableElt).find("tbody");

    var rowWidget = this.targetDoc.createElement("tr");
    jQuery(rowWidget).addClass("swRow");
    tabWidget.get(0).appendChild(rowWidget);

    this.rowStack.unshift(rowWidget);

    this.insertStack.unshift(rowWidget);

    jQuery(rowWidget).data('cells', {});

    var that = this;
    this.colids.forEach(function(colid) {
      var cellWidget = that.targetDoc.createElement("td");
      jQuery(cellWidget).addClass("swCell");
      jQuery(cellWidget).addClass(colid);
      jQuery(cellWidget).addClass("leer");
      jQuery(cellWidget).data("colid", colid);
      rowWidget.appendChild(cellWidget);
      jQuery(rowWidget).data('cells')[colid] = cellWidget;
    });
    if (false) {
      jQuery(rowWidget).find(".swCell").first().text(JSON.stringify(that.colids));
    }
  });
  interp.addEventListener("endRow", function(params) {
    if (this.logger) {
      this.logger.log({
        "ENDROW!!": ""
      });
    }

    this.insertStack.shift();

    var tableElt = this.tableStack[0];
    var rowWidget = jQuery(tableElt).find("tr").last();
    var prevRow = jQuery(tableElt).find("tr").eq(-2);

    if (prevRow.size()) {
      var that = this;
      rowWidget.find(".swCell.leer").each(function(ix, elt) {
        var elt1 = jQuery(elt);
        var colid = elt1.data("colid");
        elt1.detach();
        var elt0 = jQuery(tableElt).find(["td", ".", colid].join("")).last();
        elt0.attr("rowspan", 1 + 1 * (elt0.attr("rowspan") || 1));
        //elt0.text(JSON.stringify({rowspan:elt0.attr("rowspan"),colid:colid,elt0:elt0.size()}));
      });
    }

    rowWidget.data('json', rowWidget.find("td").map(function(ix, elt) {
      return jQuery(elt).data('json');
    }).get());
    if (this.logger) {
      this.logger.log({
        "ROWJSON!!": rowWidget.data('json')
      });
    }
  });
  interp.addEventListener("makeCell", function(params) {
    if (this.querynode) {
      params.style = jQuery(this.querynode).data("style");
    }

    var tableElt = this.tableStack[0];
    var rowWidget = jQuery(tableElt).find("tr").last();

    if (this.logger) {
      this.logger.log({
        "BEGCELL!!": params
      });
    }

    if (params.colid && true) {
      this.cellWidget = rowWidget.data('cells')[params.colid];
      jQuery(this.cellWidget).removeClass("leer");
    } else {
      this.cellWidget = this.targetDoc.createElement("td");
      jQuery(this.cellWidget).addClass("swCell");
      rowWidget.get(0).appendChild(this.cellWidget);
    }

    if (params.style) {
      //if (this.logger) { this.logger.log({"STYLECELL": params.style}); }
      jQuery(this.cellWidget).css(params.style);
    }

    if (false) {
      jQuery(this.cellWidget).addClass("swUserAction");
    } else {
      jQuery(this.cellWidget).addClass("swInferred");
    }

    // this.cellWidget.appendChild(this.targetDoc.createTextNode("P:"+Math.random()));
  });

  interp.addEventListener("query", function(params) {
    this.querynode = params && params.result;
    if (this.logger) {
      this.logger.log({
        "QUERYNODE": params,
        STYLE: jQuery(this.querynode).data("style")
      });
    }
  });

  interp.addEventListener("makeCell", function(params) {
    var colid = params && params.colid;
    var contents = [];
    var images = jQuery();
    var links = jQuery();
    var linkContents = [];

    var range = params.range;
    var kid = range.startContainer;

    while (kid !== range.endContainer) {
      contents.push(this.smartwrap.getVisibleText(kid));
      kid = kid.nextSibling;
      images = images.add(jQuery(kid).find("img"));
      var klinks = jQuery(kid).find("a");
      if (klinks.length) {
        linkContents.push(this.smartwrap.getVisibleText(klinks.get(0)));
      }
      links = links.add(jQuery(kid).find("a"));
    }

    contents.push(this.smartwrap.getVisibleText(kid));
    images = images.add(jQuery(kid).find("img"));
    links = links.add(jQuery(kid).find("a"));
    var klinks = jQuery(kid).find("a");
    if (klinks.length) {
      linkContents.push(this.smartwrap.getVisibleText(klinks.get(0)));
    }

    if (this.logger) {
      this.logger.log({
        "CELLCONT": contents,
        "PARAMS": params,
        IMAGES: images,
        IMGCNT: images.length,
        links: linkContents
      });
    }


    var cellText = contents.join("");
    /*
    images.first().each(function (index, img) {
      cell.imageSource = img.src;
      cell.imageAltText = img.alt;
    });
    links.first().each(function (index, link) {
      cell.linkTarget = link.href;
    });

    if (this.querynode) {
      cell.style = jQuery(this.querynode).data("style");
    }

    cell.xpath = range.selector;
    */

    if ((images.length == 0)) { // && (links.length == 0)) {
      this.cellWidget.appendChild(this.targetDoc.createTextNode(cellText));
      jQuery(this.cellWidget).data("json", {
        text: cellText
      });
      return;
    }

    var that = this;

    if (images.length > 0) {
      images.first().each(function(index, img) {
        var cellImage = that.targetDoc.createElement("img");
        cellImage.src = img.src;
        cellImage.alt = img.alt;

        that.cellWidget.appendChild(cellImage);
        jQuery(that.cellWidget).data("json", {
          img: {
            src: img.src,
            alt: img.alt
          }
        });
        //that.cellWidget.appendChild(that.targetDoc.createTextNode(img.src));
      });
    }


    //if (this.logger) { this.logger.log({"CELL": cell}); }
  });

  return interp;
}());
