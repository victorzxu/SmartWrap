import jQuery from "jquery";

Pallette = {
  _colors: ["red", "green", "blue"],
  _index: 0,
  getNewColor() {
    const color = this._colors[this._index];
    this._index++;
    return color;
  }
};

SmartwrapInterpreter0 = {
  doc: null,
  clientModel: null,
  colwise: null,
  explicitProgram: null,
  currentRow: null,
  currentCell: null,
  rownum: -1,
  _env: {},
  _noop() {
  },
  _functions: {
    "begin": function (steps) {
      const that = this;
      steps.forEach(step => {
        that.interpret(step);
      });

      //<editor-fold desc="yxl:ifFalseCodeBlock">
      if (false) {
        const Ci = Components.interfaces;

        /* Took this code from Migemo, would have never found it without */
        const selCon = window
          .QueryInterface(Ci.nsIInterfaceRequestor)
          .getInterface(Ci.nsIWebNavigation)
          .QueryInterface(Ci.nsIDocShell)
          .QueryInterface(Ci.nsIInterfaceRequestor)
          .getInterface(Ci.nsISelectionDisplay)
          .QueryInterface(Ci.nsISelectionController);

        selCon.setDisplaySelection(selCon.SELECTION_ATTENTION);
        selCon.repaintSelection(selCon.SELECTION_NORMAL);
      }
      //</editor-fold>
    },
    "startTable": function () {
      this.table = ["table"];

      this.colwise = {
        "columns": []
      };

      this.cells = [];

      this.explicitProgram.push(["startTable"]);
    },
    "endTable": function () {
      this.explicitProgram.push(["endTable"]);
    },
    "startRow": function () {
      this.currentRow = ["row"];
      this.table.push(this.currentRow);
      this.explicitProgram.push(["startRow"]);

      this.rownum++;
    },
    "endRow": function () {
      this.currentRow = null;
      this.explicitProgram.push(["endRow"]);
    },
    "makeCell": function (args) {
      this.currentCell = {};

      const range0 = this.interpret(args[0]);
      let meta = args[1];
      if (args.length > 1) {
        meta = this.interpret(args[1]);
      }

      const cell = ["cell"];
      if (range0) {
        cell.push(range0.toString());
      }
      this.currentRow.push(cell);

      if (meta) {
        var colid = meta.colid;
        const colnum = 0;

        const coldata = this.colwise.columns;
        const column = coldata[colnum];
        const nodes = column["nodes"];

        nodes[this.rownum] = this.currentCell;
      }

      this.cells.push(this.currentCell);

      const makeStep = ["makeCell", "select etc"];
      if (meta) {
        makeStep.push(meta);
      }
      this.explicitProgram.push(makeStep);

      let styled = false;

      if (meta && meta.colid) {
        //alert("META: " + JSON.stringify(meta));
        //alert("ENV: " + JSON.stringify(this._env));
        var colid = meta.colid;
        const colObj = this._env.columns[colid];
        //alert('COL: ' + JSON.stringify(colObj));

        if (colObj.color) {
          //alert("COLOR: " + colObj.color + ":: " + seln.toString());
          const node = range0.endContainer;
          jQuery(node).css({
            "color": colObj.color
          });
          styled = true;
        }
      }

      if (!styled) {
        if (range0) {
          const seln = window.getSelection();
          //seln.removeAllRanges();
          seln.addRange(range0);
          //alert("SELTED: " + seln.toString());
        }
      }
    },
    "selectNodeContents": function (args) {
      const range = this.interpret(args[0]);
      const node1 = this.interpret(args[1]);

      //jQuery(node1).css({"color": "green"});

      if (node1) {
        range.selectNodeContents(node1);
      }

      return range;
    },
    "createRange": function () {
      if (this.doc) {
        return this.doc.createRange();
      }
      return null;
    },
    "jquery": function (args) {
      const selector = this.interpret(args[0]);

      this.currentCell.xpath = selector;

      //selector = "td";
      //return jQuery(selector);
      //alert("SELECT: " + selector);
      //selector = selector.toLowerCase();
      //alert("SELECT1: " + selector);
      if (this.doc) {
        const resolver = this.doc.createNSResolver(this.doc);
        let result = this.doc.evaluate(selector, this.doc, resolver, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue;
        //alert("REZ: " + result);
        //alert("REZ: " + new XMLSerializer().serializeToString(result));

        if (!result) {
          alert('no element found: ' + selector);
        }

        return result;
      }
      return null;
    },
    "defineColumn": function (args) {
      const colObj = this.interpret(args[0]);
      if (!this._env.columns) {
        this._env.columns = {};
      }

      if (this.doc) {
        if (!colObj.color) {
          colObj.color = Pallette.getNewColor();
        }
      }
      const colno = this._env.columns.length;
      colObj.index = colno;
      this._env.columns[colObj.colid] = colObj;

      const colsdata = this.colwise.columns;
      const coldata = {};
      coldata.label = colObj.label;
      coldata.colid = colObj.colid;
      coldata.nodes = [];
      colsdata.push(coldata);

      const defStep = ["defineColumn", colObj];
      this.explicitProgram.push(defStep);

      //alert("COLUMNS: " + JSON.stringify(this._env.columns));
    },
  },
  getColumnObject(colid) {
    return this._env.columns[colid];
  },
  interpret(program) {
    const that = this;

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

      const funname = program[0];
      const args = program.slice(1);

      let fun = this._functions[funname];
      if (!fun) {
        alert("unimplemented function: " + funname);
        return;
      }

      //alert("EVAL: " + JSON.stringify({funname: funname, args: args}));

      return fun.call(that, args);
    }
    if (typeof program === "string") {
      return program;
    }
    if (typeof program === "object") {
      return program;
    }

    alert("NONARRAY: " + (typeof program));

  }
};

SmartwrapInterpreter = Object.create(SmartwrapInterpreter0);
SmartwrapInterpreter.doc = document;
