import jQuery from "jquery";
import {Smartwrap} from "./smartwrap";
import {smartwrapNamespace} from "./smarttable-header";

Smartwrap.SmartTable = (function () {
  "use strict";
  return {
    templates: {},
    viewNames: [
      "debug_controls",
      "controls",
      "maintable",
      "human_program"
    ],
    setTemplate: function (template_id, template_elt) {
      this.templates[template_id] = template_elt;
    },
    setPalette: function (paletteName, palette) {
      this.palettes[paletteName] = palette;
    },
    setContainers: function (containers) {
      if (!this.containers) {
        this.containers = {};
      }
      if (!this.views) {
        this.views = {};
      }
      for (let key in containers) {
        this.containers[key] = containers[key];
        //alert("CONTAINER: " + key + ":: " + new XMLSerializer().serializeToString(containers[key]));
      }

      const that = this;
      if (this.containers["debug_controls"]) {
        jQuery(this.containers["debug_controls"]).find(".noiser").click(function (event) {
          //alert('noise!');
          that.addNoise();
          that.updateViews();
        });
        jQuery(this.containers["debug_controls"]).find(".shower").click(function (event) {
          //alert('noise!');
          alert("TABLE: " + new XMLSerializer().serializeToString(that.views["maintable"]));
        });
        jQuery(this.containers["debug_controls"]).find(".toggler").click(function (event) {
          alert('toggle!');
          jQuery(that.smartwrap.container).toggleClass("disabled");
        });
      }

      //alert("NOW: " + JSON.stringify(this.containers));

      this.updateViews();
    },
    dragInterp: {
      keyName: "swYield",
      init: function () {
        this.yieldmap = {};
      },
      getYield: function (elt) {
        this.putYield(elt);
        return elt.data(this.keyName);
      },
      cacheYield: function (yieldstr, elt) {
        let bucket = this.yieldmap[yieldstr];
        if (!bucket) {
          bucket = [];
          this.yieldmap[yieldstr] = bucket;
        }
        if (elt.get(0).nodeType === 1) {
          bucket.push(elt.get(0));
        }
        //bucket.push(elt.get(0).nodeType);
      },
      putYield: function (elt) {
        //this.logger && this.logger.log({"PUTYIELD": new XMLSerializer().serializeToString(elt.get(0))});
        const cached = elt.data(this.keyName);
        if (cached) {
          //this.logger && this.logger.log({"CACHED": cached});
          this.cacheYield(cached, elt);
          return;
        }
        let accum = "";
        if (elt.contents().length) {
          const that = this;
          elt.contents().each(function (index, kid) {
            that.putYield(jQuery(kid));
            accum += jQuery(kid).data(that.keyName);
          });
        } else {
          accum = this.getLeafYield(elt);
        }
        //this.logger && this.logger.log({"COMPUTEDD": accum});

        this.cacheYield(accum, elt);

        elt.data(this.keyName, accum);
      },
      getLeafYield: function (elt) {
        if (elt.is("img")) {
          return "[[IMG]]";
        }

        return elt.text().trim();
      },
    },
    newDragInterp: function () {
      const dragInterp = Object.create(this.dragInterp);
      dragInterp.init();
      return dragInterp;
    },
    interpretDrag: function (draggedElt) {
      //alert("SHALLOWEST AROUND: " + new XMLSerializer().serializeToString(draggedElt));
      const out = {};

      out.dragged = {
        elt: draggedElt
      };

      const dragInterp = this.newDragInterp();
      //dragInterp.logger = this.smartwrap;
      const draggedYield = dragInterp.getYield(jQuery(draggedElt));

      this.smartwrap.log({
        yield: draggedYield,
        map: dragInterp.yieldmap
      });
      //alert("SHALLOWEST AROUND: " + draggedYield);

      out.deep = {
        elt: (dragInterp.yieldmap && dragInterp.yieldmap[draggedYield] && dragInterp.yieldmap[draggedYield][0])
      };

      let lower = null;
      let upper = draggedElt;
      let upperYield = draggedYield;
      while (draggedYield === upperYield) {
        lower = upper;
        upper = upper.parentNode;
        upperYield = dragInterp.getYield(jQuery(upper));
        //alert("CONTAINER: " + new XMLSerializer().serializeToString(upper));
        //out["CONTAINERYIELD"] = upperYield;
      }

      out.shallow = {
        elt: lower
      };

      /*
       var draggedText = draggedElt.textContent.trim();
       var container = draggedElt;
       while (container.parentNode.textContent.trim() === draggedText) {
       container = container.parentNode;
       }
       if (container.textContent.trim() === draggedText) {
       return container;
       }
       */

      const that = this;
      Object.keys(out).forEach(function (key) {
        out[key].xpath = jQuery(out[key].elt).data("xpath");
        out[key].style = jQuery(out[key].elt).data("style");
        //out[key].yieldkey = dragInterp.keyName;
        //out[key].yield = jQuery(out[key].elt).data(dragInterp.keyName);

        //that.smartwrap.log({OUTKEY: key, OUTPATH: out[key].xpath, OUTSTYLE: out[key].style});
      });

      //this.smartwrap.log({DRAGYIELD: draggedYield, MAP: dragInterp.yieldmap, OUT: out});

      return out;
    },
    moveCell: function (sourceCoords, targetCoords, callback) {
      const st = this;

      const action = Object.create(this.smartwrap.Action);
      action.sourceCoords = sourceCoords;
      action.targetCoords = targetCoords;
      action.oldModel = st.model;
      action.undo = function () {
        st.model = this.oldModel;
        st.updateViews();
      };
      action.dodo = function () {
        st.model = st.model.cloneTable();
        const fields = [
          "contents",
          "facsimile",
          "style",
          "cellSource",
          "imageSource",
          "imageAltText",
          "linkTarget",
          "type",
          "absoluteLocationXPath"
        ];
        const that = this;
        fields.forEach(function (fld) {
          st.model.setCellField(that.targetCoords.rowid,
            that.targetCoords.colid,
            fld,
            that.oldModel.getCellField(that.sourceCoords.rowid,
              that.sourceCoords.colid,
              fld));
        });
        st.model.setColumnField(that.targetCoords.colid,
          "style", that.oldModel.getColumnField(that.sourceCoords.colid, "style"), {
            forceInsert: true
          });
        st.model.setColumnField(that.targetCoords.colid,
          "types", that.oldModel.getColumnField(that.sourceCoords.colid, "types"), {
            forceInsert: true
          });

        st.model.clearCell(that.sourceCoords.rowid, that.sourceCoords.colid, true);
        st.updateViews();

      };
      this.smartwrap.doAction(action);
    },
    handleDrop: function (dragDetail, dropTarget, coords, logger, callback) {
      const updated = false;

      //alert("DROPSY: " + new XMLSerializer().serializeToString(dropTarget));

      try {
        /*
         this.model.metadata.scrapedURL = dragDetail.srcurl;
         this.model.metadata.nonempty = true;
         */

        this.model.setTableField("scrapedURL", dragDetail.srcurl);
        this.model.setTableField("nonempty", true);

        const timestamps = this.model.getTableField("timestamps") || [];
        timestamps.push(new Date());
        this.model.setTableField("timestamps", timestamps);

        const draggedElt = dragDetail.draggedElt;
        const dragTargets = this.interpretDrag(draggedElt);

        let dragKey = "dragged";
        if (this.smartwrap.getSetting("dragInterpretation") === "SHALLOWEST") {
          dragKey = "shallow";
        }
        if (this.smartwrap.getSetting("dragInterpretation") === "DEEPEST") {
          dragKey = "deep";
        }

        const intendedElt = dragTargets[dragKey].elt;
        const xpath = dragTargets[dragKey].xpath || Smartwrap.getAbsoluteLocationXPath(intendedElt, dragDetail.isHTML);

        const tuple = {
          keys: [],
          map: {},
          values: [],
          types: {}
        };

        tuple.absoluteLocationXPath = xpath;
        tuple.style = dragTargets["deep"].style;
        tuple.facsimile = {
          orig: jQuery(intendedElt).clone()
        };
        tuple.facsimile.preview = this.getPreview(tuple.facsimile.orig.clone(), {
          logger: this.smartwrap
        });
        //tuple.facsimile.suffix = tuple.facsimile.orig.clone();

        //this.hyphenateCell(tuple.facsimile.prefix, tuple.facsimile.suffix);

        if (dragDetail.text) {
          tuple.types["text"] = true;
          tuple.map.contents = dragDetail.text;
        }

        if (jQuery(dropTarget).filter(".tablename").length) {

          var params = {
            forceInsert: true,
            logger: this.smartwrap
          };
          this.model.setTableField("absoluteLocationXPath", tuple.absoluteLocationXPath, params);
          this.model.setTableField("label", tuple.map.contents, params);

          this.updateViews();
          //alert("TABNAME");

          return;
        }
        if (jQuery(dropTarget).filter(".colhead").length) {
          var params = {
            forceInsert: true,
            logger: this.smartwrap
          };
          this.model.setColumnField(coords.colid, "absoluteLocationXPath", tuple.absoluteLocationXPath, params);
          this.model.setColumnField(coords.colid, "label", tuple.map.contents, params);

          jQuery(dropTarget).filter("input.colhead").val(tuple.map.contents);

          this.updateViews();

          return;
        }

        jQuery(intendedElt).find("*").addBack().filter("img").each(function (index, elt) {
          //tuple.keys.push("imageSource");
          //tuple.values.push(elt.src);
          tuple.map.imageSource = elt.src;

          const alttext = elt.alt;
          if (alttext) {
            //tuple.keys.push("imageAltText");
            //tuple.values.push(alttext);
            tuple.map.imageAltText = alttext;
          }

          tuple.types["image"] = true;
        });
        jQuery(intendedElt).find("*").addBack().filter("a").each(function (index, elt) {
          //tuple.keys.push("linkTarget");
          //tuple.values.push(elt.href);
          tuple.map.linkTarget = elt.href;

          tuple.types["link"] = true;
        });

        if (coords.foreignKey) {
          tuple.map.foreignKey = coords.foreignKey;
        }

        logger && logger.log({
          STDROP: dragDetail,
          tgts: Object.keys(dragTargets),
          xpaths: Object.keys(dragTargets).map(function (key) {
            return dragTargets[key].xpath;
          }),
          xpath: xpath,
          tuple: tuple,
          coords: coords
        });

        this.model.logger = logger;

        const that = this;

        const newTableCallback = function (model) {
          logger.log({
            CALLBACK: "yep"
          });

          const tableno = that.smartwrap.uidgen();
          const tableid = jQuery.format("smarttable{tableno}", {
            tableno: tableno
          });
          const table = that.smartwrap.newTable(tableid, model);

          const spec = {
            tabno: tableno,
            tabid: tableid
          };
          logger.log({
            SPEC: spec
          });
          that.smartwrap.emit(jQuery(that.containers["maintable"]), "add_table", spec);
        };

        var action = Object.create(this.smartwrap.Action);
        action.oldModel = that.model;
        action.oldTarget = that.smartwrap.scrapeTarget;
        action.undo = function () {
          //alert("UNDO x CLEAR");
          //that.model.clearCell(coords.rowid, coords.colid);
          //alert("UNDONE!");

          that.model = this.oldModel;
          that.smartwrap.scrapeTarget = this.oldTarget;

          that.updateViews();
        };
        action.dodo = function () {
          if (false) {
            var updated = that.model.updateCell(coords.rowid, coords.colid, tuple, {
              newTableCallback: newTableCallback
            });
          } else {
            that.model = that.model.extend(coords.rowid, coords.colid, tuple, {
              newTableCallback: newTableCallback
            });
            var updated = true;
          }

          logger && logger.log({
            STDROPPED: updated,
            DUMP: that.model.dump()
          });

          if (updated) {
            const evt = document.createEvent("CustomEvent");
            const emeta = {};
            emeta.url = dragDetail.srcurl;
            emeta.title = dragDetail.srcTitle;
            emeta.target = dragDetail.target;
            //alert("EMETA: " + JSON.stringify(emeta));
            evt.initCustomEvent("sw_datacell", true, false, emeta);
            dropTarget.dispatchEvent(evt);
          }

          if (!updated) {
            callback(false);
            return;
          }

          that.updateViews();

          callback(true);
        };
        action.redo = function () {
          alert("ACT REDO");

          this.dodo();
          alert("REDID!");
        };
      } catch (ee) {
        logger && logger.log({
          EE: ee,
          msg: ee.message,
          stack: ee.stack
        });
      }

      //this.smartwrap.undoStack.push(action);

      this.smartwrap.doAction(action);
    },
    updateRow: function (rownum, tuple, colonnade) {
      //alert("UPDATE: " + JSON.stringify(tuple) + ":: " + JSON.stringify(colonnade));
      const that = this;
      Object.keys(colonnade).forEach(function (key) {
        let colid = colonnade[key];
        //alert("COLID: " + colid);

        switch (key) {
          case "mainKey":
            colid = colonnade[colonnade.mainKey];
            that.model.setColumnField(colid, "mainKey", colonnade.mainKey, false);
            break;
          case "text":
            that.model.setCellField(rownum, colid, "contents", tuple.map[key]);
            that.model.setCellField(rownum, colid, "style", tuple.css);
            that.model.setCellField(rownum, colid, "absoluteLocationXPath", tuple.absoluteLocationXPath);
            break;
          case "imageSource":
            that.model.setCellField(rownum, colid, "imageSource", tuple.map[key]);
            that.model.setCellField(rownum, colid, "absoluteLocationXPath", tuple.imageXPath + "/@src");
            break;
          case "imageAltText":
            that.model.setCellField(rownum, colid, "contents", tuple.map[key]);
            that.model.setCellField(rownum, colid, "absoluteLocationXPath", tuple.imageXPath + "/@alt");
            break;
          case "linkTarget":
            that.model.setCellField(rownum, colid, "contents", tuple.map[key]);
            that.model.setCellField(rownum, colid, "absoluteLocationXPath", tuple.linkXPath + "/@href");
            break;
        }

        if (key !== "mainKey") {
          that.model.setCellField(rownum, colid, "cellSource", tuple.cellSource || "swUserAction", true);
        }
      });
      //alert("CELLOBJ: " + JSON.stringify(that.model.getCellObject(rownum, colonnade[colonnade.mainKey])));
    },
    loadContents: function (tableContents) {
      //alert("LOADTABLE: " + JSON.stringify(tableContents,null,2));

      this.smartwrap.log({
        LOAD: tableContents
      });

      const dict = {};
      const cols = {};

      const delta = {};

      this.smartwrap.log({
        PRE: this.model.dump()
      });
      this.model.getXPaths().forEach(function (xpath) {
        dict[xpath] = true;
      });
      this.model.clearTuples();
      this.smartwrap.log({
        POST: this.model.dump()
      });

      for (var i = 0; i < tableContents.length; i++) {
        const row = tableContents[i];
        var rowid = this.model.getRowId(i);
        if (!rowid) {
          rowid = this.model.getRowId(-1);
        }
        this.smartwrap.log({
          LOADROW: rowid,
          rowno: i,
          row: row
        });

        for (var j = 0; j < row.length; j++) {
          var cell = row[j];
          var colid = cell.colid;
          delta[i + "__" + colid] = [];
          /*
           var oldCell = this.model.getCellFields(rowid, colid, ["absoluteLocationXPath"]);
           //alert(JSON.stringify(oldCell));
           if (oldCell && oldCell.absoluteLocationXPath && oldCell.absoluteLocationXPath !== "") {
           dict[oldCell.absoluteLocationXPath] = true;
           delta[i + "__" + colid].push(oldCell.absoluteLocationXPath);
           }
           */

          const colObj = this.model.getColumnFields(colid, ["types"]);
          cols[colid] = colObj;

          cell.types = colObj.types;
          cell.map = {};
          ["contents", "imageSource", "imageAltText", "linkTarget"].forEach(function (key) {
            cell.map[key] = cell[key];
          });
          cell.absoluteLocationXPath = cell.absoluteLocationXPath || cell.xpath;
          try {
            this.model.updateCell(rowid, colid, cell);
          } catch (exc) {
            if (exc.name === "CannotOverwriteCell") {
              // ignore, maybe?
              this.smartwrap.log({
                "NoUpdate": {
                  name: exc.name,
                  msg: exc.message,
                  stack: exc.stack
                }
              });
            } else {
              throw exc;
            }
          }

          this.model.setCellField(rowid, colid, "cellSource", "swInferred");
        }
      }
      //alert("COLS:: " + JSON.stringify(cols));

      this.smartwrap.log({
        DICT: dict
      });

      let inferredCount = 0;
      //inferredCount.push({start:true});

      for (var i = 0; i < this.model.nrows(); i++) {
        var rowid = this.model.getRowId(i);
        for (var j = 0; j < this.model.ncols(); j++) {
          var colid = this.model.getColumnId(j);
          var cell = this.model.getCellFields(rowid, colid, ["absoluteLocationXPath"]);
          if (cell && cell.absoluteLocationXPath && dict[cell.absoluteLocationXPath]) {
            this.model.setCellField(rowid, colid, "cellSource", "swUserAction");
          } else {
            //delta[rowid + "__" + colid].push(cell.absoluteLocationXPath);
            inferredCount++;
          }
        }
      }

      //alert("DELTA: " + JSON.stringify(delta, null, 2));
      //this.smartwrap.log({DELTA: delta});

      //alert("INFERREDCOUNT: " + JSON.stringify({inferred:inferredCount}));

      this.updateViews();
      return {
        inferredCount: inferredCount
      };
    },
    removeCell: function (event, ui) {
      if (this.smartwrap) {
        this.smartwrap.log({
          REMOVECELL: ui
        });
      }

      //alert("HERE: " + this.id + ":: " + JSON.stringify(ui));
      //var cellObj = this.model.getCellObject(ui.rowid, ui.colid);
      //if (this.smartwrap) { this.smartwrap.log({REMOVECELLOBJ: cellObj}); }

      //alert("REMOVE: " + JSON.stringify(cellObj));

      const st = this;
      const action = Object.create(this.smartwrap.Action);
      action.oldModel = st.model;
      action.rowid = ui.rowid;
      action.colid = ui.colid;
      action.undo = function () {
        //alert("UNDO x CLEAR");
        //that.model.clearCell(coords.rowid, coords.colid);
        //alert("UNDONE!");

        st.model = this.oldModel;

        st.updateViews();
      };
      action.dodo = function () {
        st.model = st.model.cloneTable();
        st.model.clearCell(this.rowid, this.colid, true);

        st.updateViews();
      };

      this.smartwrap.doAction(action);
    },
    addNoise: function (probs) {
      if (!probs) {
        probs = {};
      }
      const colprob = probs.colprob || 0.7;
      const rowprob = probs.colprob || 0.7;
      const tokenprob = probs.tokenprob || 0.95;
      const emptyprob = probs.tokenprob || 0.2;

      const nrows0 = this.model.nrows();
      let nrows = 1;
      while (Math.random() < rowprob) {
        nrows++;
      }

      nrows += nrows0;

      const colids = [];
      const coords = [];
      let coldraw = 0;
      for (var j = this.model.ncols(); coldraw < colprob; j++) {
        const colid = this.model.getColumnId(j);
        colids.push(j);
        colids.push(colid);
        for (let i = nrows0; i < nrows; i++) {
          if (Math.random() < emptyprob) {
          } else {
            let sentence = "0";
            while (Math.random() < tokenprob) {
              const digit = Math.floor(Math.random() * 10);
              sentence += digit ? digit : " ";
            }
            this.model.setCellField(i, colid, "contents", sentence);
            coords.push(jQuery.format("({i},{j},{colid})", {
              i: i,
              j: j,
              colid: colid
            }));
          }
        }
        coldraw = Math.random();
      }
      //<editor-fold desc="yxl:ifFalseCodeBlock">
      if (false) {
        alert("ROWS: " + nrows0 + " <- " + nrows);
        alert("COLIDS: " + JSON.stringify(colids));
        alert("COORDS: " + JSON.stringify(coords));
        alert("COLS: " + this.model.ncols() + " <- " + j);
      }
      //</editor-fold>
    },
    getRelation: function () {
      const relation = {
        tuples: [],
        columns: []
      };

      const nrows = this.model.nrows();
      const ncols = this.model.ncols();

      for (var j = 0; j < ncols; j++) {
        var colid = this.model.getColumnId(j);
        const colObj = this.model.getColumnObject(colid);

        relation.columns.push(colObj);
      }

      for (let i = 0; i < nrows; i++) {
        const tuple = {};

        for (var j = 0; j < ncols; j++) {
          var colid = this.model.getColumnId(j);
          const cellObj = this.model.getCellObject(i, colid);

          if (cellObj && cellObj.contents) {
            tuple[colid] = jQuery.trim(cellObj.contents);
          }
        }

        relation.tuples.push(tuple);
      }

      return relation;
    },
    getProgram: function (params) {
      const program = ["begin"];

      const nrows = this.model.nrows();
      const ncols = this.model.ncols();
      const tablemeta = {
        tableid: this.id
      };
      //tablemeta.scrapedURL = this.model.metadata.scrapedURL;
      tablemeta.scrapedURL = this.model.getTableField("scrapedURL");
      tablemeta.label = this.model.getTableField("label");
      tablemeta.childtableid = this.model.getTableField("childTable") && this.model.getTableField("childTable").id;
      tablemeta.parenttableid = this.model.getTableField("parentTable") && this.model.getTableField("parentTable").id;
      tablemeta.timestamps = this.model.getTableField("timestamps") || [];
      tablemeta.timestamps.push(new Date());
      program.push(["startTable", tablemeta]);

      params && params.logger && params.logger.log({
        GETPROG: program
      });
      //tablemeta.dump = this.model.dump();

      for (var j = 0; j < ncols; j++) {
        var colid = this.model.getColumnId(j);
        var colObj = this.model.getColumnFields(colid, ["colid", "label"]);
        colObj.colid = colid;
        if (!colObj) {
          colObj = {};
        }
        program.push(["defineColumn", colObj]);
      }
      for (let i = 0; i < nrows; i++) {
        const rowid = this.model.getRowId(i);
        program.push(["startRow"]);
        for (var j = 0; j < ncols; j++) {
          var colid = this.model.getColumnId(j);
          const cellObj = this.model.getCellFields(rowid, colid, ["absoluteLocationXPath"]);
          var colObj = this.model.getColumnFields(colid, ["colid"]);
          //program.push([i,j,cellObj]);
          const step = ["makeCell"];
          if (cellObj && cellObj.absoluteLocationXPath) {
            step.push(["selectNodeContents", ["createRange"],
              ["query", cellObj.absoluteLocationXPath]
            ]);
          }
          const meta = {};
          //meta.column = colObj;
          meta.colid = colid;
          if (cellObj && cellObj.cellSource) {
            meta.cellSource = cellObj.cellSource;
          }
          step.push(meta);
          program.push(step);
        }
        program.push(["endRow"]);
      }
      const nextPage = this.model.getNextPageElement();
      if (nextPage) {
        program.push(["nextPage", ["query", this.model.metadata.nextPage.xpath]]);
      }
      program.push(["endTable"]);

      return program;
    },
    updateViews: function () {
      this.updateMainTableView();

      this.updateHumanProgramView();

      if (this.smartwrap) {
        this.smartwrap.updateViews();
      }
    },
    updateHumanProgramView: function () {
      let container = this.containers["human_program"];
      if (!container) {
        return;
      }
      const doc = container.ownerDocument;

      jQuery(container).empty();
      container.appendChild(doc.createTextNode(JSON.stringify(this.getProgram(), null, 2)));
    },
    updateMainTableView: function (tableData) {
      let container = this.containers["maintable"];
      if (!container) {
        return;
      }
      const doc = container.ownerDocument;

      const self = this;

      if (!tableData) {
        return this.model.getDisplayView(null,
          function (results) {
            self.updateMainTableView(results);
          }, {
            logger: this.smartwrap
          });
      }

      const logger = this.smartwrap;

      const rs = tableData;
      const newTable = jQuery(this.templates["maintable_template"]).clone().get(0);
      jQuery(newTable).addClass("maintable");

      const tableObj = {};
      tableObj.tablename = jQuery(newTable).find(".tablename");
      tableObj.tablename.val(self.model.getTableField("label"));
      this.smartwrap.emit(tableObj.tablename, "rename_table");
      tableObj.tablename.on("change", function (event) {
        //alert("DELTA BRAVO FOXTROT");

        self.model.setTableField("label", tableObj.tablename.val());
        self.smartwrap.emit(tableObj.tablename, "rename_table");

        //self.updateViews();
      });
      tableObj.tablename.on("dragenter", function (event) {
        jQuery(this).select();
      });
      tableObj.tablename.on("dragleave", function (event) {
        jQuery(this).blur();
      });
      tableObj.head = jQuery(newTable).find("thead");
      tableObj.guideRow = jQuery(tableObj.head).find("tr.guide");
      tableObj.headRow = jQuery(tableObj.head).find("tr.header");
      tableObj.guideCell = jQuery(tableObj.guideRow).find("th.colhandle");
      tableObj.headCell = jQuery(tableObj.headRow).find("th.template_glyph");

      tableObj.body = jQuery(newTable).find("tbody");

      tableObj.rowTempl = jQuery(tableObj.body).find("tr.template_glyph");

      tableObj.cellTempl = jQuery(tableObj.rowTempl).find("td.template_glyph");

      const tableid = this.id; //rs.tableid;

      let colno = 0;
      const rows = {};

      const firstcolid = rs.colids[0];
      const lastcolid = rs.colids.slice(-1)[0];

      if (logger) {
        logger.log({
          UPDATEFOXUS: true,
          FOXUSCOLID: self.focuscolid
        });
      }
      rs.colids.forEach(function (colid) {
        const datacol = rs.columns[colid];
        if (logger) {
          logger.log({
            HERE: true,
            COLUMN: datacol,
            COLID: colid
          });
        }

        const newGuide = jQuery(tableObj.guideCell).clone();
        newGuide.insertBefore(tableObj.guideCell);

        if (colid === lastcolid) {
          newGuide.addClass("rightmost");
        }
        if (colid === firstcolid) {
          newGuide.addClass("leftmost");
        }

        newGuide.find("span.label").contents().replaceWith("" + self.model.getColumnLetter(colno));

        const newHead = jQuery(tableObj.headCell).clone();
        newHead.insertBefore(tableObj.headCell);
        newHead.children().addBack().each(function (ix, elt) {
          elt.setAttributeNS(smartwrapNamespace, "colid", colid);
        });

        //newHead.on("click", function(event) { alert("HEADCLICK"); });

        //newHead.find("input").focus(function(event) { alert('ficu3'); });

        const colLabel = self.model.getColumnField(colid, "label");
        newHead.find("input.colhead").val(colLabel || self.model.getColumnLabel(colno));
        newHead.find("input.colhead").on("focus", function (event) {
          logger.log({
            FOXUS: colid
          });
          //self.focuscolid = colid;
          jQuery(this).select();
        });
        newHead.find("input.colhead").on("change", function (event) {
          logger.log({
            DELTAFOXUS: colid
          });
          const params = {
            forceInsert: true,
            logger: this.smartwrap
          };
          self.model.setColumnField(colid, "label", jQuery(event.target).val(), params);
          setTimeout(function () {
            self.updateViews();
          }, 10);
        });
        newHead.find("input.colhead").on("keydown", function (event) {
          const keyCode = event.keyCode || event.which;

          jQuery(doc).find(".sink").val(JSON.stringify({
            key: keyCode
          }));
          if ((keyCode === 13) || (keyCode === 9)) {
            self.focus = {};
            self.focus.origin = colid;
            self.focus.dir = event.shiftKey ? "backward" : "forward";
          }
        });

        newHead.find("input.colhead").on("dragover", function (event) {
          jQuery(this).select();
        });
        newHead.find("input.colhead").on("dragleave", function (event) {
          jQuery(this).blur();
          //jQuery("input.sink").select();
        });

        let rowno = 0;

        rs.rowids.forEach(function (rowid) {
          const datarow = rs.rows[rowid];
          if (logger) {
            logger.log({
              THERE: true,
              COLUMN: datacol,
              ROW: datarow,
              ROWID: rowid
            });
          }

          let row = rows[rowid];
          if (!row) {
            row = jQuery(tableObj.rowTempl).clone();
            row.insertBefore(tableObj.rowTempl);

            row.find("span.label").contents().replaceWith("" + (1 + rowno));

            rows[rowid] = row;
          }

          let datacell = (datarow && datarow[colid]) || {
              isFringeToken: true
            };

          const cell = jQuery(tableObj.cellTempl).clone();
          cell.removeClass("template_glyph");
          const cellPreview = cell.find(".preview").empty();
          const cellSpan = cell.find(".content").empty(); // remove Lorem Ipsum

          const overflowContainer = cell.find(".overflow");
          const previewControl = cell.find(".preview_control");
          previewControl.click(function () {
            overflowContainer.toggleClass("show_preview");
          });

          cell.get(0).addEventListener("click", function (event) {
            const tgt = event.target;
            const clickable = tgt.getAttributeNS(smartwrapNamespace, "clickable") || tgt.getAttribute("sw:clickable");
            if (clickable === "true") {
              return;
            }

            //alert('yep: ' + clickable + ":: " + new XMLSerializer().serializeToString(event.target));

            if (cell.is("*:not(.fringe)")) {
              cell.parents("table").find(".sw_selected").removeClass("sw_selected");
              //alert('cell: ' + new XMLSerializer().serializeToString(cell.get(0)));
              cell.addClass("sw_selected");
              jQuery(".sink").select();
            }

            event.preventDefault();
            event.stopPropagation();
          }, true);


          if (datacell && datacell.rowspan && (datacell.rowspan > 1)) {
            cell.attr("rowspan", datacell.rowspan);
          }

          if (datacell && datacell.isDittoToken) {
          } else {
            cell.appendTo(row);
          }

          //var style = cellFields.style || (coord.nodeinfo && coord.nodeinfo.style) || {};
          //logger && logger.log({STYLE: style});
          //jQuery(cellElt).css(style);

          const rowid1 = datacell.rowid || rowid;
          const colid1 = datacell.colid || colid;

          //var cellSource = cellObj.cellSource;
          const cellSource = datacell.cellSource; //self.model.getCellField(rowid1, colid1, "cellSource");
          if (cellSource) {
            cell.addClass(cellSource);
          }

          const facsimile = datacell.facsimile || {}; //self.model.getCellField(rowid1, colid1, "facsimile") || {};
          if (logger) {
            logger.log({
              YONDER: true,
              TABLEID: tableid,
              COLUMN: datacol,
              ROW: datarow,
              ROWID: rowid,
              CELL: cell,
              DATACELL: datacell,
              FAX: Object.keys(facsimile)
            });
          }
          if (facsimile && facsimile.orig) {
            facsimile.orig.clone().appendTo(cellSpan);
            if (facsimile.preview) {
              facsimile.preview.clone().appendTo(cellPreview);
              overflowContainer.addClass("has_preview");
              overflowContainer.toggleClass("show_preview");
            }
          }
          cellSpan.find("*").removeClass("sw_injected_cell");

          //self.hyphenateCell(cellSpan, cellOverflow);

          cell.each(function (ix, elt) {
            elt.setAttributeNS(smartwrapNamespace, "colid", colid);
          });
          cell.each(function (ix, elt) {
            elt.setAttributeNS(smartwrapNamespace, "rowid", rowid);
          });
          cell.each(function (ix, elt) {
            elt.setAttributeNS(smartwrapNamespace, "stableid", tableid);
          });

          //cell.draggable();

          cell.attr('draggable', 'true');
          cell.on('dragstart', function (event) {
            logger.log('doit');
          });

          if (logger) {
            cell.each(function (ix, elt) {
              logger.log({
                CELLELT: new XMLSerializer().serializeToString(elt)
              });
            });
          }

          if (datarow.foreignKey) {
            cell.each(function (ix, elt) {
              elt.setAttributeNS(smartwrapNamespace, "foreignKey", datarow.foreignKey);
            });
          }

          if ((!datacell) || (datacell.isFringeToken)) {
            cell.addClass("scrim fringe");
          }
          if (datacell && datacell.isNullToken) {
            cell.addClass("missing");
          }

          rowno++;
        });

        colno++;
      });

      if (logger) {
        logger.log({
          NEWTAB: new XMLSerializer().serializeToString(newTable)
        });
      }

      tableObj.guideCell.hide();
      tableObj.headCell.hide();
      tableObj.rowTempl.hide();
      tableObj.body.find("td.template_glyph").hide();

      jQuery(container).empty();
      //alert("NOW");
      jQuery(newTable).appendTo(jQuery(container));
      if (self.focus && self.focus.origin) {
        const headhash = {};
        const heads = jQuery(newTable).find("input.colhead");
        heads.each(function (ix, elt) {
          const id = elt.getAttributeNS(smartwrapNamespace, "colid");
          headhash[id] = ix;
        });
        const origIndex = headhash[self.focus.origin];
        const offset = function (dir) {
          switch (dir) {
            case "forward":
              return 1;
            case "backward":
              return -1;
            default:
              return 0;
          }
        }(self.focus.dir);
        heads.eq(origIndex + offset).select();
        self.focus = {};
      } else {
        jQuery(doc).find(".sink").select();
      }
      const cursors = jQuery(container).find(".cursor");
      if (cursors.length) {
        cursors.get(0).scrollIntoView();
      }
      this.views["maintable"] = newTable;
    },
    getPreview: function (fullContent, spec) {
      const logger = spec.logger;


      let cut = false;

      const fullText = fullContent.text();
      logger.log({
        TXT: fullText,
        TXTLEN: fullText.length
      });

      if (true) { // hack-ish until I figure out proper hyphenation
        if (fullContent.text().length > this.smartwrap.getSetting("maxchars")) {
          fullContent.text(fullText.slice(0, -10 + this.smartwrap.getSetting("maxchars")) + ". . .");
          return fullContent;
        }
        return null;
      }

      while (fullContent.text().length > this.smartwrap.getSetting("maxchars")) {
        if (fullContent.contents().length > 1) {
          fullContent.contents().last().detach();
          cut = true;
        } else {
          fullContent.contents().last().detach();
          cut = true;
          fullContent.text(fullText.slice(0, -10 + this.smartwrap.getSetting("maxchars")) + ". . .");
        }
        logger.log({
          TXT2: fullContent.text(),
          TXTLEN: fullContent.text().length
        });
      }

      if (cut) {
        return fullContent;
      }
      return null;
    },
    hyphenateCell: function (mainContent, suppContent, spec) {
      if (!spec) {
        spec = {};
      }
      const chars = spec.chars || 0;

      if (chars > settings.maxchars) {
        mainContent.hide();
        suppContent.show();
        return;
      }

      const mainKids = mainContent.contents();
      const suppKids = suppContent.contents();

      for (let i = 0; i < mainKids.length; i++) {
        const mainKid = jQuery(mainKids.get(i));
        const suppKid = jQuery(suppKids.get(i));

        if ((i % 2) === 1) {
          mainKid.hide();
          suppKid.show();
        } else {
          mainKid.show();
          suppKid.hide();
        }
      }
    },
    smarttable_styles: [
      "font-family",
      //"font-size",
      "font-style",
      "font-weight",
      "text-transform",
      "text-decoration",
      "color",
    ],
  };
}());
