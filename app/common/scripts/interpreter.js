Pallette = {
  _colors: ["red", "green", "blue"],
  _index: 0,
  getNewColor: function() {
    var color = this._colors[this._index];
    this._index++;
    return color;
  }
}

SmartwrapInterpreter0 = {
  doc: null,
  clientModel: null,
  colwise: null,
  explicitProgram: null,
  currentRow: null,
  currentCell: null,
  rownum: -1,
  _env: {},
  _noop: function() {},
  _functions: {
    "begin": function(steps) {
      var that = this;
      steps.forEach(function(step) {
        that.interpret(step);
      });

      if (false) {
        var Ci = Components.interfaces;

        /* Took this code from Migemo, would have never found it without */
        var selCon = window
          .QueryInterface(Ci.nsIInterfaceRequestor)
          .getInterface(Ci.nsIWebNavigation)
          .QueryInterface(Ci.nsIDocShell)
          .QueryInterface(Ci.nsIInterfaceRequestor)
          .getInterface(Ci.nsISelectionDisplay)
          .QueryInterface(Ci.nsISelectionController);

        selCon.setDisplaySelection(selCon.SELECTION_ATTENTION);
        selCon.repaintSelection(selCon.SELECTION_NORMAL);
      }
    },
    "startTable": function() {
      this.table = ["table"];

      this.colwise = {
        "columns": []
      };

      this.cells = [];

      this.explicitProgram.push(["startTable"]);
    },
    "endTable": function() {
      this.explicitProgram.push(["endTable"]);
    },
    "startRow": function() {
      this.currentRow = ["row"];
      this.table.push(this.currentRow);
      this.explicitProgram.push(["startRow"]);

      this.rownum++;
    },
    "endRow": function() {
      this.currentRow = null;
      this.explicitProgram.push(["endRow"]);
    },
    "makeCell": function(args) {
      this.currentCell = {};

      var range0 = this.interpret(args[0]);
      var meta = args[1];
      if (args.length > 1) {
        meta = this.interpret(args[1]);
      }

      var cell = ["cell"];
      if (range0) {
        cell.push(range0.toString());
      }
      this.currentRow.push(cell);

      if (meta) {
        var colid = meta.colid;
        var colnum = 0;

        var coldata = this.colwise.columns;
        var column = coldata[colnum];
        var nodes = column["nodes"];

        nodes[this.rownum] = this.currentCell;
      }

      this.cells.push(this.currentCell);

      var makeStep = ["makeCell", "select etc"];
      if (meta) {
        makeStep.push(meta);
      }
      this.explicitProgram.push(makeStep);

      var styled = false;

      if (meta && meta.colid) {
        //alert("META: " + JSON.stringify(meta));
        //alert("ENV: " + JSON.stringify(this._env));
        var colid = meta.colid;
        var colObj = this._env.columns[colid];
        //alert('COL: ' + JSON.stringify(colObj));

        if (colObj.color) {
          //alert("COLOR: " + colObj.color + ":: " + seln.toString());
          var node = range0.endContainer;
          jQuery(node).css({
            "color": colObj.color
          });
          styled = true;
        }
      }

      if (!styled) {
        if (range0) {
          var seln = window.getSelection();
          //seln.removeAllRanges();
          seln.addRange(range0);
          //alert("SELTED: " + seln.toString());
        }
      }
    },
    "selectNodeContents": function(args) {
      var range = this.interpret(args[0]);
      var node1 = this.interpret(args[1]);

      //jQuery(node1).css({"color": "green"});

      if (node1) {
        range.selectNodeContents(node1);
      }

      return range;
    },
    "createRange": function() {
      if (this.doc) {
        return this.doc.createRange();
      }
      return null;
    },
    "jquery": function(args) {
      var selector = this.interpret(args[0]);

      this.currentCell.xpath = selector;

      //selector = "td";
      //return jQuery(selector);
      //alert("SELECT: " + selector);
      //selector = selector.toLowerCase();
      //alert("SELECT1: " + selector);
      if (this.doc) {
        var resolver = this.doc.createNSResolver(this.doc);
        var result = this.doc.evaluate(selector, this.doc, resolver, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue;
        //alert("REZ: " + result);
        //alert("REZ: " + new XMLSerializer().serializeToString(result));

        if (!result) {
          alert('no element found: ' + selector);
        }

        return result;
      }
      return null;
    },
    "defineColumn": function(args) {
      var colObj = this.interpret(args[0]);
      if (!this._env.columns) {
        this._env.columns = {};
      }

      if (this.doc) {
        if (!colObj.color) {
          colObj.color = Pallette.getNewColor();
        }
      }
      var colno = this._env.columns.length;
      colObj.index = colno;
      this._env.columns[colObj.colid] = colObj;

      var colsdata = this.colwise.columns;
      var coldata = {};
      coldata.label = colObj.label;
      coldata.colid = colObj.colid;
      coldata.nodes = [];
      colsdata.push(coldata);

      var defStep = ["defineColumn", colObj];
      this.explicitProgram.push(defStep);

      //alert("COLUMNS: " + JSON.stringify(this._env.columns));
    },
  },
  getColumnObject: function(colid) {
    return this._env.columns[colid];
  },
  interpret: function(program) {
    var that = this;

    if (!this.explicitProgram) {
      this.explicitProgram = ["begin"];
    }
    if (!this.clientModel) {
      this.clientModel = {
        contents: []
      };
    }

    //alert("PROGRAM: " + JSON.stringify(program));
    if (jQuery.isArray(program)) {
      //alert("ARRAY!");

      var funname = program[0];
      var args = program.slice(1);

      var fun = this._functions[funname];
      if (!fun) {
        alert("unimplemented function: " + funname);
        return;
      }

      //alert("EVAL: " + JSON.stringify({funname: funname, args: args}));

      return fun.call(that, args);
    }
    if (typeof program == "string") {
      return program;
    }
    if (typeof program == "object") {
      return program;
    }

    alert("NONARRAY: " + (typeof program));

  }
};

SmartwrapInterpreter = Object.create(SmartwrapInterpreter0);
SmartwrapInterpreter.doc = document;
