import jQuery from "jquery";
import {Smartwrap} from "./smartwrap";

let module;

Smartwrap.getUID = function (uidprefix, uidwidth) {
  if (!this.getUID.seq) {
    this.getUID.seq = 0;
  }
  this.getUID.seq += 1;
  let sliceAmt = uidwidth || 8;
  const uidsubs = {};
  uidsubs.prefix = uidprefix || "UID";
  uidsubs.seq = ("00000000" + (this.getUID.seq)).slice(-sliceAmt);
  return jQuery.format("{prefix}{seq}", uidsubs);
};

Smartwrap.newTableModel = spec => {
  if (!spec) {
    spec = {};
  }

  const tabledata = spec.tabledata || {};
  const columns = spec.columns || {};
  let colids = spec.colids || [];
  const rows = spec.rows || {};
  let rowids = spec.rowids || [];

  const privy = {};
  const defaultSettings = {
    minrows: 1,
    maxrows: Infinity,
    minfringerows: 1,
    minfringecols: 1
  };

  /* PRIVATE FUNCTIONS */
  const createColumn = colid => ({
    colid,
    fringe: true
  });
  const createRow = rowid => ({
    metadata: {
      rowid,
      fringe: true
    }
  });
  const createCell = cellid => ({
    cellid,

    metadata: {
      fringe: true
    }
  });

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const basealpha = n => {
    if (n < alphabet.length) {
      return alphabet.slice(n, n + 1);
    }
    const dividend = Math.floor(n / (alphabet.length));
    const remainder = n % (alphabet.length);

    return [basealpha(dividend - 1), basealpha(remainder)].join("");
  };


  const newCannotOverwriteError = message => {
    const exc = new Error(message);
    exc.name = "CannotOverwriteCell";
    return exc;
  };

  const getCellSchematic = (self, rowid, colid, extra) => {
    if (!extra) {
      extra = {};
    }

    const logger = extra.logger;
    delete extra.logger;
    //if (logger) { logger.log({CELLSCHEM: extra}); }

    let ret;
    const emptyrow = (!rows[rowid]);

    if (extra && extra.rowno && (extra.rowno > 0)) {
      ret = Object.create(self.dittoToken);
      ret.comments = ["DITTO"];
      return ret;
    }

    if (extra && extra.fringecol) {
      ret = Object.create(self.fringeToken);
      ret.comments = ["FRINGECOL"];
      if (emptyrow) {
        ret.lowerright = true;
        ret.comments.push("LOWERRIGHT");
      }
      return ret;
    }
    if (emptyrow) {
      ret = Object.create(self.fringeToken);
      ret.comments = ["EMPTYROW"];
      return ret;
    }
    if (rows[rowid][colid]) {
      ret = {
        type: "CELL"
      };
      ret.rowid = rowid;
      ret.colid = colid;
      ret.cellSource = self.getCellField(rowid, colid, "cellSource");
      ret.facsimile = self.getCellField(rowid, colid, "facsimile");
      return ret;
    }
    ret = Object.create(self.nullToken);
    ret.comments = ["NULL"];
    return ret;
  };


  const model = {
    getUID(uidprefix, uidwidth) {
      return Smartwrap.getUID(uidprefix, uidwidth);
    },
    dump() {
      return {
        columns,
        colids,
        rows,
        rowids,
        tabledata: Object.keys(tabledata),
        kid: tabledata.childTable && tabledata.childTable.dump(),
        fringe: tabledata.fringerowmap
      };
    },
    init(settingFun) {
      privy.settings = {};
      if (this.logger) {
        this.logger.log({
          INITSET0: privy.settings
        });
      }
      jQuery.extend(privy.settings, defaultSettings);
      if (this.logger) {
        this.logger.log({
          INITSET1: privy.settings
        });
      }
      //jQuery.extend(privy.settings, settings || {});

      Object.keys(privy.settings).forEach(key => {
        privy.settings[key] = settingFun(key) || privy.settings[key];
      });

      this.uidwidth = privy.settings.uidwidth || 8;

      if (this.logger) {
        this.logger.log({
          INITSET: privy.settings
        });
      }

      /*
       var colid0 = this.getUID("COL", this.uidwidth);
       colids.push(colid0);
       columns[colid0] = createColumn.call(this, colid0);

       var rowid0 = this.getUID("ROW", this.uidwidth);
       rowids.push(rowid0);
       rows[rowid0] = createRow.call(this, rowid0);

       var cellid00 = this.getUID("CELL", this.uidwidth);
       rows[rowid0][colid0] = createCell.call(this, cellid00);
       */

      if (!
          rowids.length) {
        const rowid0 = this.getUID(
          "ROW", this.uidwidth);
        rowids.push(
          rowid0
        );
        rows[rowid0] = {};
      }

      if (!tabledata.fringeColid) {
        tabledata.fringeColid = this.getUID("COL", this.uidwidth);
      }
      //tabledata.fringeRowids = [];
      if
      (!
          tabledata.fringerowmap
      ) {
        tabledata.fringerowmap = {};
      }
      this.checkConstraints();
    },
    checkConstraints() {
      /*
       while (rowids.length < privy.settings.minrows) {
       var rowid = this.getUID("ROW", this.uidwidth);
       rowids.push(rowid);
       rows[rowid] = {};
       }
       */
      /*
       while (tabledata.fringeRowids.length < Math.max(privy.settings.minrows, privy.settings.minfringerows)) {
       tabledata.fringeRowids.push(this.getUID("ROW", this.uidwidth));
       }
       */
    },
    getXPaths() {
      const xpaths = [];
      let
        row = {};
      const
        extractFromField = colid => {
          xpaths.push(row[colid].absoluteLocationXPath
          );
        };
      rowids.forEach(rowid => {
          row = rows[
            rowid];
          colids.forEach(extractFromField);
        }
      );
      return xpaths;
    },
    clearTuples() {
      while (rowids.length) {
        const rowid =
          rowids.pop();
        rows[
          rowid] = undefined;
      }
    },
    getTableField(key) {
      return tabledata[key];
    },
    setTableField(key, value) {
      tabledata[
        key] = value;
    },
    getNextPageElement() {
      return null;
    },
    fringeToken: {
      specialToken: true,
      isFringeToken: true,
    },
    nullToken: {
      specialToken: true,
      isNullToken: true,
    },
    dittoToken: {
      specialToken: true,
      isDittoToken: true,
    },

    getDisplayView(query, callback, extras) {
      const
        logger =

          extras.logger || this.logger

      ;
      const self = this;
      if (
        logger) {
        logger.log({
          QRY: query,
          DUMP: this.dump()
        });
      }

      const view = {
        rows: {},
        columns: {},
        rowids: [],
        colids: []
      };

      //view.tableid = this.id;

      let kidview = {
        rows: {},
        columns: {},
        rowids: [],
        colids: []
      };

      if (
        tabledata.childTable) {
        const kext = Object.create(extras);
        kext.subview = true;
        kidview = tabledata.childTable.getDisplayView(
          rowids[0], null, kext);
      }

      if (logger) {
        logger.log({
          EMPTY: view,
          nrows: this.nrows(),
          ncols: this.ncols()
        });
      }

      const vrowcount
        = {};

      let i;
      let j = 0;
      let colid;
      for (j = 0; j < this.ncols(); j += 1) {
        colid =

          this.getColId(j);
        view.colids[j] = view.colids[j] || colid;
        view.columns[colid] = view.columns[colid] || {};
      }

      view.colids
        .push(
          tabledata.fringeColid);

      view.colids = view

        .colids.concat(kidview.colids);
      kidview.colids.forEach(colid => {
        view.columns[colid] =
          kidview.columns[colid];
      });
      const invmap = Object.keys(tabledata.fringerowmap).reduce(
        (accum, key) => {
          const value = tabledata.fringerowmap[key];
          accum[value] = key;
          return accum;
        }, {});
      //tabledata.fringerowmap = {};

      let
        mainrowids = rowids.slice(0);
      if

      (query) {
        mainrowids =
          mainrowids.reduce((accum, rowid) => {
            if (rows[rowid].foreignKey === query) {
              return accum.concat([rowid]);
            }
            return accum;
          }, []);
      } else {
        mainrowids =
          mainrowids.slice(0,
            Math.min(rowids.length, privy.settings.maxrows))

        ;
      }
      if (logger) {
        logger.log({
          MIDS: mainrowids
        });
      }

      const outrows = {};

      mainrowids.forEach(rowid => {
        //view.rows[rowid] = {};

        if (tabledata.childTable) {
          const
            kidview1 = tabledata.childTable.getDisplayView(rowid, null, kext);
          view.rowids = view.rowids.concat(kidview1
            .rowids);

          if (logger) {
            logger.log({
              RECURSE: rowid,
              kidview: kidview1
            });
          }

          let rowno = 0;
          const
            rowcount = kidview1.rowids.length;
          let rowspan = 0;
          kidview1.rowids.forEach(
            kidrowid => {
              outrows[kidrowid]
                =
                {};
              let kidspan = 1;
              kidview1.colids.forEach(kidcolid => {
                outrows[
                  kidrowid][
                  kidcolid] = kidview1.rows
                  [kidrowid][
                  kidcolid];
                outrows[

                  kidrowid].foreignKey =
                  rowid;
                kidspan = Math.max(kidspan, ((outrows[kidrowid] && outrows[kidrowid]
                      [kidcolid] && outrows[kidrowid][kidcolid].rowspan) || 1
                  )
                );
              });
              colids.forEach
              (maincolid => {
                outrows[kidrowid][
                  maincolid] =
                  getCellSchematic(self
                    , rowid,
                    maincolid, {
                      rowno,
                      rowcount,

                      logger
                    });
              });
              outrows[
                kidrowid][
                tabledata.fringeColid] = getCellSchematic(self, rowid, tabledata.fringeColid, {
                rowno,
                rowcount
                ,
                fringecol: true,
                logger
              });
              rowspan += kidspan;
              rowno++;
            });

          colids.concat([
            tabledata.fringeColid]).forEach(
            maincolid => {
              outrows[
                kidview1.rowids
                  [0]][maincolid].rowspan = rowspan;
            });
        } else {
          view.rowids.push(rowid);
          outrows[rowid] = {};
          view.colids.forEach(colid => {
            if (logger) {
              logger.log({
                LOADCELL: {
                  rowid,
                  colid
                }
              });
            }

            outrows[rowid]
              [colid] = getCellSchematic(
              self,
              rowid
              , colid);
          });
          outrows[rowid][tabledata.fringeColid] =

            getCellSchematic(self, rowid,
              tabledata.fringeColid, {
                fringecol: true
              });
        }
      });

      if (

        logger) {
        logger.log({
          MAIN: view,
          OUTROWS: outrows,
          nrows: this.nrows(),
          ncols: this.ncols(),
          INVMAP: invmap
        });
      }

      let frowcount =
        (() => {
          //privy.settings.minfringerows;
          if (query) {
            return 1;
          }
          return Math.max(privy.settings.minfringerows
            ,

            (privy.settings
              .minrows -
            view.rowids.length)
          );
        })();

      while (
      frowcount

      > 0
        ) {
        const refid = query || view.rowids.slice(-1)[0];
        const
          frowid = invmap[refid] || this.getUID("VROW"
              , this.uidwidth);
        tabledata.fringerowmap[frowid] = refid
        ;
        if (logger) {
          logger.log({
            NEWFIE: frowid,
            MAP: tabledata.fringerowmap,
            REF: refid
          });
        }
        view.rowids.push(frowid);
        outrows[frowid] = {};

        frowcount--;
      }

      view.rows = outrows;
      /*
       view.rowids.forEach(function(rowid) {
       view.rows[rowid] = view.rows[rowid] || {};

       var emptyrow = (! rows[rowid]);

       view.colids.forEach(function(colid) {
       if (logger) { logger.log({LOADCELL: {rowid:rowid, colid:colid}}); }

       view.rows[rowid][colid] = getCellSchematic(self, rowid, colid);
       });
       view.rows[rowid][tabledata.fringeColid] = getCellSchematic(self, rowid, tabledata.fringeColid, {fringecol: true});
       });
       */

      if (
        logger) {
        logger.log
        ({
          DATAONLY: view,
          settings: privy.settings
        });
      }
      /*
       view.rowids.push(tabledata.fringeRowid);
       view.rows[tabledata.fringeRowid] = {};
       view.colids.push(tabledata.fringeColid);
       for (j = 0; j < this.ncols(); j += 1) {
       colid = this.getColId(j);
       view.rows[tabledata.fringeRowid][colid] = Object.create(this.fringeToken);
       view.rows[tabledata.fringeRowid][colid].comment = "FRINGEROW";
       }
       view.rows[tabledata.fringeRowid][tabledata.fringeColid] = Object.create(this.fringeToken);
       view.rows[tabledata.fringeRowid][tabledata.fringeColid].lowerright = true;
       */


      if (
        logger) {
        logger.log({
          VIEW: view
        });
      }

      if (callback) {
        callback(view);
      }
      return view;
    },
    nrows() {
      return rowids.length;
    },
    ncols() {
      return colids.length;
    },
    getRowId(rowno) {
      if
      (rowno < 0) {
        return tabledata.fringeRowid;
      }
      return rowids[rowno];
    },
    getColId(colno) {
      if (colno >=
        colids.length) {
        return tabledata.fringeColid;
      }
      return colids[colno];
    },
    getColumnId(colno) {
      if (this.logger) {
        this.logger.log({
          "DEPRECATED": "getColumnId"
        });
      }
      return this.getColId(colno);
    },
    getColumnLetter(colno) {
      const colid = this.getColId(
        colno);
      if (colid) {
        const colLetter = this.getColumnField(
          colid,
          "columnLetter");
        if (
          colLetter) {
          return colLetter;
        }
      }
      if (colno > 25) {
        throw "too many columns";
      }
      return basealpha(colno);
    },
    getColumnLabel(colno) {
      const colid =
        this.getColId(
          colno);
      if (colid) {
        const label = this.getColumnField(colid,
          "label")
        ;
        if (label) {
          return label;
        }
      }
      return jQuery.format(
        "COLUMN {let}", {
          let: this.getColumnLetter(colno)
        });
    },
    setColumnField(colid, key, value, params) {
      params = params
        || {};
      const logger = this.logger && params.logger;
      params.logger =
        undefined;
      let colinfo = columns[colid];
      if (!colinfo) {
        if (logger) {
          logger.log({
            "SCF": params
          });
        }
        if (params
            .forceInsert) {
          if (colid ===
            tabledata.fringeColid) {
            colids.push(colid);
            tabledata.fringeColid = this.getUID("COL", this.uidwidth);
            colinfo = {};
            columns[colid] = colinfo;
          } //else {
          //alert(JSON.stringify([colid, '!==', tabledata.fringeColid]));
          //}
        } else {
          if (params.tolerateNoop) {
            colinfo = {};
          } else {
            throw "setting field of nonextant column: " + colid;
          }
        }
      }
      colinfo[key] = value;
    },

    getColumnField(colid, fieldName) {
      const
        colinfo = columns[colid] || {};
      return colinfo[fieldName];
    },
    getColumnFields(colid, keys) {
      const colinfo =

        columns[colid] || {};
      const out = {};
      keys.forEach(key => {
        out[key] = colinfo[key];
      });
      return out;
    },
    setCellField(rowid, colid, key, value, params) {
      console.log(rows);
      console.log(rowid);
      console.log(colid);
      let cellObj = rows[rowid][colid];
      if (!cellObj) {
        cellObj = {
          cellid: this.getUID("CELL", this.uidwidth)
        };
        rows[

          rowid][colid] = cellObj;
      }
      cellObj[key] = value;
    },
    getCellField(rowid, colid, key) {
      if (!rows[rowid]) {
        return undefined;
      }
      let cellObj = rows[rowid][colid

        ];
      if (!
          cellObj) {
        return undefined;
      }
      return cellObj[key];
    },
    getCellFields(rowid, colid, keys) {
      if (!
          rows[rowid]) {
        return undefined;
      }
      let
        cellObj = rows[rowid][colid];
      if (!cellObj) {
        return {};
      }
      const out
        =
        {};
      keys.forEach(key => {
        out[
          key] = cellObj[key];
      });
      return out;
    },
    clearCell(rowid, colid) {
      if (this.logger) {
        this.logger.log({
            PRECLEAR: rows,
            rowid,
            colid
          }
        );
      }

      let row = rows[rowid];
      if (!row) {
        return;
      }
      let
        cellObj = rows[
          rowid][
          colid];
      if (!cellObj) {
        return;
      }

      delete rows[rowid][
        colid];
      this.removeRow(
        rowid, {
          forceRemoveNonEmpty: false
        });
      this.removeColumn(colid, {
        forceRemoveNonEmpty: false
      });

      this.checkConstraints();

      if (this
          .logger) {
        this.logger.log({
          POSTCLEAR: rows
        });
      }
    },
    removeRow(rowid, params) {
      let force = params &&
        params.forceRemoveNonEmpty;

      let row = rows[rowid];
      if (!row) {
        return;
      }
      if (Object.keys(row).length) {
        if (!force) {
          // the row is nonempty so we bail out
          return;
        }
      }
      delete rows[rowid];
      rowids = rowids.filter(listing => listing
      !== rowid);
    },
    removeColumn(colid, params) {
      let force = params &&
        params.forceRemoveNonEmpty;

      let empty = true;
      rowids.forEach(
        rowid => {
          if (rows[rowid][
              colid]) {
            empty = false;
          }
        });

      if (!empty) {
        if (!force) {
          // the column is nonempty so we bail out
          return;
        }
      }

      colids =
        colids.filter(listing => listing !== colid);
    },
    cloneTable() {
      const newrows = {};
      rowids.forEach(rowid => {
        newrows[rowid] = {};
        // Object.create(rows[rowid]);
        Object.keys(
          rows[rowid]).forEach(
          key => {
            //if (logger) { logger.log({EXTENDKEY: key, VALUE: rows[rowid][key]}); }
            if (rows[rowid][key]) {
              newrows[rowid][key] = Object.create(rows[rowid][key]);
            }
          });
      });
      const spec = {
        tabledata: Object.create(tabledata),
        columns: Object.create(columns
        ),
        colids: Object.create(colids),
        rows: newrows,
        rowids: Object.create(rowids)
      };
      const

        newmodel = Smartwrap.newTableModel(spec);
      newmodel.logger = this.logger;
      newmodel.init(key => privy.settings[key]);
      return newmodel;
    },
    extend(rowid, colid, tuple, extra) {
      const logger = this.logger;
      if (this.logger) {
        this.logger.log({
          "EXTEND": {
            rowid,
            colid,
            tuple,
            rowids,
            dump: this.dump(),
            fringex: tabledata.fringeRowids,
            fringey: tabledata.fringeColid
          }
        });
      }
      const
        newmodel = this.cloneTable();
      newmodel.updateCell
      (rowid, colid,
        tuple, extra);
      return newmodel;
    },
    updateCell(rowid, colid, tuple, extra) {
      const self = this;
      if (
        this.logger) {
        this.logger.log({
          "UPDATE": {
            rowid,
            colid,
            tuple,
            rowids,
            dump: this.dump(),
            hasrow: rows[rowid],
            fringex: tabledata.fringeRowids,
            fringey: tabledata.fringeColid
          }
        });
      }

      /*
       var fno = tabledata.fringeRowids.indexOf(rowid);
       if (this.logger) { this.logger.log({fno:fno}); }
       if (fno >= 0) {
       rowids.push(rowid);
       tabledata.fringeRowids.splice(fno, 1, this.getUID("ROW", this.uidwidth));
       rows[rowid] = {};
       }
       */
      // TODO: redo this!

      if (!rows[rowid
          ]) {
        let
          baseid = tabledata.fringerowmap[rowid];
        if (!baseid) {
          if (tabledata.childTable) {
            tabledata.childTable.setTableField(
              "nonempty", true);
            return tabledata.childTable.updateCell(rowid, colid, tuple);
          }

          if (this.logger) {
            this.logger.log({
              UNREC: rowid,
              IN: tabledata.fringerowmap
            });
          }
          throw "unrecognized fringe row " + rowid;
        }

        const baseix = rowids.indexOf(baseid);

        rowid = this.getUID(
          "ROW", this.uidwidth);
        //rowids.push(rowid); // if rows are ordered, we should insert rowid after baseid
        if (baseix > 0) {
          if (this.logger) {
            this.logger.log({
              INSERTROWID: rowid,
              AT: baseix
            });
          }
          rowids.splice
          (1 + baseix, 0, rowid);
        }
        else {
          rowids.push(rowid);
        }
        rows[rowid] = {};
      }

      if (this.logger) {
        this.logger.log({
            COLID: colid,
            EQ: (
              colid === tabledata.fringeColid ?
                "===" : "!==")
            ,
            FRINGECOLL: tabledata.fringeColid
          }
        );
      }

      if (colid === tabledata.fringeColid) {
        colids.push(colid);
        tabledata.fringeColid =
          this.getUID("COL",
            this.uidwidth);
        columns[colid] = {};
      }

      if (!columns[colid]) {
        if (this.logger) {
          this.logger.log({
            NONLOCALCOL: colid,
            columns
          });
        }
        // pass to subtable, if there is one
      }

      rows
        [rowid].foreignKey = tuple.map.foreignKey;

      const currObj = rows[rowid][colid];
      if (false && currObj) {
        // HACK-ish change to dropover as OVERWRITE
        if (this.logger) {
          this
            .logger.log({
            OVERWRITE: {
              rowid,
              colid,
              currObj,
              rowids,
              colids

            }
          });
        }


        if (colids.length === 1) {
          if (this.logger) {

            var rowid0 = this.getUID("ROW", this.uidwidth);
            rows[rowid0] =
              {};
            rowids.push(rowid0);

            this.logger.log({
              ONLY: {
                rowid,
                colid,
                currObj,
                rowids,
                colids
              }
            });

            return this.updateCell(rowid0, colid, tuple);
          }

        }

        if (tabledata.childTable) {
          const exception =
            new Error(
              "multibranch nesting not supported");
          exception.name = "OperationUnsupported";
          throw exception;
        }

        const coldata =
          columns[colid];
        const kidrowids = [];
        const kidrows = {};
        var rowid0 = rowid;
        let kidrowid0;
        rowids.forEach(
          rowid => {
            if (rows[rowid] && rows[rowid][colid]) {
              const kidrowid = self
                .getUID("ROW", privy.settings.uidwidth);
              kidrowids.push(kidrowid);
              kidrows[kidrowid] = {};
              kidrows[kidrowid][colid] = rows[rowid][colid];
              kidrows[kidrowid].foreignKey = rowid;
            }

            if (rowid === rowid0) {
              kidrowid0 = self.getUID("ROW", privy.settings.uidwidth);
              kidrowids.push(kidrowid0);

              kidrows[kidrowid0] = {};
              kidrows[kidrowid0].foreignKey =
                rowid;
            }
          });
        const kidcols = {};
        kidcols[colid
          ] = coldata;
        tabledata.childTable =

          Smartwrap.newTableModel({
            tabledata: {
              parentTable: self
            },
            rows: kidrows,
            rowids: kidrowids,
            columns: kidcols,
            colids: [colid]
          });
        tabledata.childTable.init();
        tabledata.childTable.setTableField(
          "nonempty",
          true)

        ;
        tabledata.childTable.setTableField("parentTable", self);
        tabledata.childTable.logger = self.logger;
        /*
         Object.keys(coldata).forEach(function(key) {
         tabledata.childTable.setColumnField(colid, key, coldata[key], {tolerateNoop: true});
         self.logger.log({KEY: key, VALUE: coldata[key]});
         });
         */
        if (this.logger) {
          this.logger.log({
            EXTRADITE: coldata,
            //INTO: tabledata.childTable,
            DUMP: tabledata.childTable.dump()
          });
        }

        colids.splice(colids.indexOf(colid), 1);
        delete columns[colid];

        if (extra.newTableCallback) {
          extra.newTableCallback.call(null, tabledata.childTable);
        }

        tuple.map.foreignKey = rowid0;
        return tabledata.childTable.updateCell(kidrowid0, colid, tuple, {});

        throw newCannotOverwriteError("cannot overwrite cell data");

        /*
         alert("EXTRADITE!!");

         this.breakOutColumn(colid, tuple, rownum);
         this.setColumnField(colid, "multiple", true, true);
         //this.setColumnField(colid, "sourceTable", this);

         return true;
         */
      }

      this.setCellField(rowid, colid, "facsimile", tuple.facsimile);
      this.setCellField(rowid, colid, "absoluteLocationXPath", tuple.absoluteLocationXPath);
      this.setCellField(rowid, colid, "style", tuple.style);
      this.setCellField(rowid, colid, "cellSource", tuple.cellSource || "swUserAction");
      if (tuple.types.text) {
        this.setCellField(rowid, colid, "contents", tuple.map.contents, false);
      }
      if (tuple.types.image) {
        this.setCellField(rowid, colid, "imageSource", tuple.map.imageSource);
        this.setCellField(rowid, colid, "imageAltText", tuple.map.imageAltText);
      }
      if (tuple.types.link) {
        this.setCellField(rowid, colid, "linkTarget", tuple.map.linkTarget);
      }

      if (this.logger) {
        this.logger.log({
          "INUPDATE": this.dump()
        });
      }

      const colStyle = this.getColumnField(colid, "style");
      this.setColumnField(colid, "style", this.mergeStyles(colStyle, tuple.style));
      this.setColumnField(colid, "types", tuple.types);

      this.checkConstraints();

      if (this.logger) {
        this.logger.log({
          "POSTUPDATE": {
            rowid,
            colid,
            tuple,
            rowids,
            dump: this.dump(),
            fringex: tabledata.fringeRowids,
            fringey: tabledata.fringeColid
          }
        });
      }

      return true;
    },
    mergeStyles(oldStyle, newStyle) {
      return newStyle;
    },
    moveColumnAfter(moved, pred) {
      const movix = colids.indexOf(moved);
      if (movix === -1) {
        return;
      }

      colids.splice(movix, 1);
      const predix = (pred === null) ? -1 : colids.indexOf(pred);
      colids.splice(1 + predix, 0, moved);
    },
  };
  return model;
};

if (!module) {
  module = {};
}
module.exports = Smartwrap.newTableModel;
