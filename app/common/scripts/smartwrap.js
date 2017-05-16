//this is initialized as an object in smartwrap-page
var Smartwrap = (function () {
    "use strict";
    var privy = {};
    /*var decode = function(pref, key) {
     var prefType = pref.getPrefType(key);
     if (prefType == pref.PREF_STRING) {
     return pref.getCharPref(key);
     }
     if (prefType == pref.PREF_BOOL) {
     return pref.getBoolPref(key);
     }
     if (prefType == pref.PREF_INT) {
     return pref.getIntPref(key);
     }
     };*/
    /*var branch2json = function(branch) {
     var prefs = {};

     branch.getChildList("", {}).forEach(function(key) {
     prefs[key] = decode(branch, key);
     });

     return prefs;
     };*/
    return {
        seq: 1,
        uidgen: function () {
            return ++this.seq;
        },
        Action: {
            dodo: function () {
                alert("DODO!");
            },
            undo: function () {
                alert("UNDO!");
            },
            redo: function () {
                alert("REDO!");
            }
        },
        undoStack: [],
        redoStack: [],
        pendingRequests: {},
        templates: {},
        settings: {},
        settings2: {
            /*
             SmartWrap code should read configuration parameters from this
             object.  The values here are overwritten by any values in
             defaults/preferences/smartwrapDefaults.js (see
             https://developer.mozilla.org/en/Code_snippets/Preferences#Where_the_default_values_are_read_from
             for details).  If the user sets values in the options.xul
             preference dialog, they should overwrite defaults from the
             default file and from here.
             */
            developermode: false,
            oneDropManyColumns: false,
            paintCells: true,
            paintRowRanges: false,
            paintRowContainers: false,
            paintTableRanges: true,
            paintTableContainers: false,
            serverprepath: "http://localhost:9090",
            _serverpath: "/smartwrap/Wrap",
            serverpath: "/Wrap",
            algorithm: "PREFIX",
            serverquery: "?algorithm={algorithm}",
            servertimeout: 20000, // 2000 milliseconds = 2 seconds
            maxchars: 100,
            minrows: 2, // 1,
            maxrows: 2, // Infinity,
            minfringerows: 0, // 1,
            sendUserData: true,
            sendInferredData: false,
            dragInterpretation: "EXACT",
            annotationTemplate: "{tempDir}{easy_url}",
            annotationDependency: "GLOBAL",
            globalDependencyPrefix: "http://www.cs.cmu.edu/~sgardine/mixer/smartwrap/",
            showAuxiliaryTables: false,
        },
        configure: function (params) {
            //alert("CONFIG: " + JSON.stringify(params));
            var config = params.config;
            //this.log({"PRECONFIG": this.settings, CONFIG: config});
            var deltas = [];
            if (params.delta) {
                deltas.push(params.delta);
            } else {
                deltas = Object.keys(config);
            }

            for (var i = 0; i < deltas.length; i++) {
                var key = deltas[i];
                if (key in this.settings) {
                    this.settings[key] = config[key];
                    //alert("CONFIGSET: " + key + ":: " + config[key]);
                } else {
                    //alert("MISCCONFIG: " + key + ":: " + config[key]);
                }
            }
            //alert("POSTCONFIG: " + JSON.stringify(this.settings));
        },
        annotate: function (detail) {
            //Is this different from analyze?
            this.log({
                "ANNOTATEATE": detail
            });
            ;

            //var outDoc = this.docClone.cloneNode(true);
            var outDoc = document.implementation.createDocument('http://www.w3.org/1999/xhtml', 'html', null);
            //alert("OUTDOC0: " + new XMLSerializer().serializeToString(outDoc));
            jQuery(this.docClone.documentElement).children().each(function (index, elt) {
                //alert("CLONEKID: " + new XMLSerializer().serializeToString(elt));
                try {
                    outDoc.documentElement.appendChild(elt.cloneNode(true));
                } catch (eee) {
                    alert("EEE: " + eee);
                }
            });
            //alert("OUTDOC: " + new XMLSerializer().serializeToString(outDoc));
            var meta = outDoc.createElementNS('http://www.w3.org/1999/xhtml', "meta");
            meta.id = "sw_program";
            meta.name = "program";
            meta.content = JSON.stringify(this.getProgram());
            //alert("OUTDOC1: " + new XMLSerializer().serializeToString(outDoc));
            jQuery(outDoc).find("head").get(0).appendChild(meta);
            //alert("OUTDOC2: " + new XMLSerializer().serializeToString(outDoc));

            var depHandling = this.settings.annotationDependency;

            var prefix = "chrome://smartwrap/content/";
            var dependencies = [
                "jquery-1.7.1.min.js",
                "jquery.xcolor.min.js",
                "jquery.utils.lite.min.js",
                "smartwrap-interpreter.js",
                "swarmature-page.js",
                "annotation.js"
            ];
            var depDetails = [];
            dependencies.forEach(function (depFile) {
                //alert("WRITE: " + depFile);
                var depDetail = {};
                depDetail.basename = depFile;
                depDetail.filedir = detail.annotationLocation;
                depDetail.sourceURL = jQuery.format("{prefix}{basename}", {
                    prefix: prefix,
                    basename: depFile
                });
                //depDetail.successCallback = function() { alert("WROTE: " + depFile); };


                if (depDetail.filedir) {
                } else {
                }

                var script = outDoc.createElementNS('http://www.w3.org/1999/xhtml', "script");
                script.setAttribute("src", depFile);
                script.setAttribute("id", depFile);
                outDoc.documentElement.appendChild(script);
                outDoc.documentElement.appendChild(outDoc.createTextNode("\n"));

                switch (depHandling) {
                    case "INLINE":
                        script.removeAttribute("src");

                        jQuery(script).addClass("swPending");

                        depDetail.element = script;
                        var evt = document.createEvent("CustomEvent");
                        evt.initCustomEvent("sw_urltodom", true, false, depDetail);
                        document.dispatchEvent(evt);
                        break;
                    case "ALONGSIDE":
                        depDetails.push(depDetail);
                        break;
                    case "TMPDIR":
                        depDetail.filedir = null;
                        var evt = document.createEvent("CustomEvent");
                        evt.initCustomEvent("sw_urltofile", true, false, depDetail);
                        document.dispatchEvent(evt);
                        break;
                    case "GLOBAL":
                    default:
                        var globalDependencyPrefix = this.settings.globalDependencyPrefix;
                        script.setAttribute("src", jQuery.format("{prefix}{basename}", {
                            prefix: globalDependencyPrefix,
                            basename: depFile
                        }));
                        break;
                }

            });


            var annTemplate = this.settings.annotationTemplate;

            var table0name = Object.keys(this.tables)[0];
            var url = this.tables[table0name].model.metadata.scrapedURL;

            var subs = {};
            subs.tempDir = "";
            subs["url"] = escape(url);
            subs["easy_url"] = url.replace(/[^\w\.]/g, "_");

            var out = {};
            out.filename = detail.annotationLocation;
            out.extension = detail.extension;
            out.suggestion = detail.suggestion || jQuery.format(annTemplate, subs);
            out.extensions = detail.extensions;
            out.dependencies = depDetails;
            out.successCallback = function (detail) {
                var evt = document.createEvent("CustomEvent");
                evt.initCustomEvent("sw_annotatedfile", true, false, detail);
                document.dispatchEvent(evt);
            }

            //alert("OUT: " + JSON.stringify(out));

            var delays = 0;
            var proceed = function () {
                var pending = jQuery(outDoc).find(".swPending");
                if (pending.length) {
                    delays++;
                    window.setTimeout(function () {
                        proceed()
                    }, 1);
                    return;
                }

                var domstr = "";
                var ser = new XMLSerializer();
                var stream = {
                    write: function (string, count) {
                        domstr += string;
                    }
                };
                ser.serializeToStream(outDoc, stream, "UTF-8");

                out.filecontents = domstr;

                var evt = document.createEvent("CustomEvent");
                evt.initCustomEvent("sw_savelocalfile", true, false, out);
                document.dispatchEvent(evt);
            };

            window.setTimeout(function () {
                proceed()
            }, 0);
        },
        init: function (params) {
            this.tables = {};
            this.handlers = {};
            this.palettes = {};
            this.dialogs = {};
            var table0 = this.newTable(params.table0);
            /*this.mediator = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
             this.currentWindow = this.mediator.getMostRecentWindow("navigator:browser");

             this.mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
             .getInterface(Components.interfaces.nsIWebNavigation)
             .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
             .rootTreeItem
             .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
             .getInterface(Components.interfaces.nsIDOMWindow);*/

            this.status = {};
            this.docs = [];
        },
        rformat: function (templ, subs, lookup) {
            var self = this;
            var parts = templ.split(/({[^{}]+})/);
            var p2 = parts.map(function (part) {
                if (part.match(/^{.+}$/)) {
                    var key = part.slice(1, -1);
                    subs[key] = subs[key] || self.rformat(lookup(key), subs, lookup);
                    return subs[key];
                }

                return part;
            });
            //alert(JSON.stringify({templ:templ,parts:parts,p2:p2,subs:subs}));

            return jQuery.format(templ, subs);
        },
        getSetting: function (key) {
            var out = prefutil.getPref({
                key: key
            });
            this.log({
                getsetting: key,
                value: out
            });
            return out;
        },
        observeSetting: function (key, callback) {
            prefutil.observeSetting(key, callback);
        },
        newTable: function (tableid, model) {
            this.log({
                "NEWTABLE": tableid,
                mod: !!model
            });
            try {
                throw new Error();
            } catch (ee) {
                this.log({
                    EE: true,
                    STACK: ee.stack
                });
            }
            var that = this;
            var newTable = Object.create(this.SmartTable);
            newTable.id = tableid;
            newTable.smartwrap = this;
            newTable.palettes = {};
            newTable.model = model;
            if (!newTable.model) {
                newTable.model = this.newTableModel();
                newTable.model.logger = this;
                newTable.model.init(function (key) {
                    }
                    /*function(key) {
                     return that.getSetting(key);
                     }*/);
            }
            newTable.model.logger = this;

            if (false) {
                // this code creates a proxy for the model, effectively defining
                // the empirical public interface of the model

                newTable.model0 = newTable.model;
                newTable.model = {};
                newTable.model.init = function (settings) {
                    newTable.model0.init(settings);
                    newTable.model.metadata = newTable.model0.metadata;
                };
                newTable.model.getResultSet = function (query, logger) {
                    return newTable.model0.getResultSet(query, logger);
                };
                newTable.model.getColumnLetter = function (colnum) {
                    return newTable.model0.getColumnLetter(colnum);
                };
                newTable.model.getDefaultColumnHead = function (colnum) {
                    return newTable.model0.getDefaultColumnHead(colnum);
                };
                newTable.model.getColumnId = function (colnum) {
                    return newTable.model0.getColumnId(colnum);
                };
                newTable.model.getColumnField = function (colid, fn) {
                    return newTable.model0.getColumnField(colid, fn);
                };
                newTable.model.getColumnObject = function (colid) {
                    return newTable.model0.getColumnObject(colid);
                };
                newTable.model.getCellObject = function (rowid, colid) {
                    return newTable.model0.getCellObject(rowid, colid);
                };
                newTable.model.nrows = function () {
                    return newTable.model0.nrows();
                };
                newTable.model.ncols = function () {
                    return newTable.model0.ncols();
                };
                newTable.model.updateCell = function (rowid, colid, tuple) {
                    return newTable.model0.updateCell(rowid, colid, tuple);
                };
                newTable.model.smartwrap = this;
            }

            newTable.model.id = tableid;

            //newTable.hidden = newTable.model.metadata.hidden;

            //CHANGE BACK
            //newTable.hidden = newTable.model.getTableField("hidden");
            newTable.hidden = false;


            if (this.newTableParams) {
                //alert("NEWTABPARAMS: " + JSON.stringify(this.newTableParams, null, 2));

                if (this.newTableParams.auxiliary) {
                    newTable.auxiliary = true;
                    if (!this.settings.showAuxiliaryTables) {
                        newTable.hidden = true;
                    }
                }

                if (this.newTableParams.sourceTableId) {
                    var droppedon = this.newTableParams.rownum;

                    var sourceTable = this.tables[this.newTableParams.sourceTableId];
                    var sourceColid = this.newTableParams.colid;

                    newTable.referringTableId = this.newTableParams.sourceTableId;
                    newTable.referringColId = sourceColid;

                    var colid = newTable.model.getColumnId(0);
                    var nrows = sourceTable.model.nrows();
                    for (var i = 0; i < nrows; i++) {
                        var sourceCell = sourceTable.model.getCellObject(i, sourceColid);
                        // TODO: add imageSource, linkTarget, etc
                        ["contents", "style", "absoluteLocationXPath", "cellSource"].forEach(function (key) {
                            var sourceCellField = sourceTable.model.getCellField(i, sourceColid, key);
                            newTable.model.setCellField(i, colid, key, sourceCellField);
                            sourceTable.model.setCellField(i, sourceColid, key, null, true);
                            //alert("UNSET: " + JSON.stringify([i,sourceColid]));
                        });
                        var rowid = newTable.model.getRowId(i);
                        sourceTable.model.setCellField(i, sourceColid, "references", [{
                            tableid: tableid,
                            rowid: rowid
                        }]);
                        //sourceTable.model.setCellField(i, sourceColid, "contents", JSON.stringify([{tableid:tableid,rowid:rowid}]));
                        sourceTable.model.setCellField(i, sourceColid, "cellSource", "swExtradition", true);
                        sourceTable.model.setColumnField(sourceColid, "refersTo", {
                            tableid: tableid
                        });
                    }

                    var insertLevel = parseInt(this.newTableParams.rownum) + 1;
                    if (insertLevel < newTable.model.nrows()) {
                        // TODO: insert row
                    }
                    //alert(jQuery.format("insert {rownum} but {nrow}", {rownum: insertLevel, nrow: newTable.model.nrows()}));

                    try {
                        var tuple = this.newTableParams.tuple;
                        //tuple.cellSource = "swExtradition";
                        //colonnade[colonnade.mainKey] = colid;
                        //newTable.updateRow(insertLevel, tuple, colonnade);

                        newTable.updateCell(insertLevel, colid, tuple);

                        var newrowid = newTable.model.getRowId(insertLevel);
                        var refs = sourceTable.model.getCellField(droppedon, sourceColid, "references");
                        refs.push({
                            tableid: tableid,
                            rowid: newrowid
                        });
                        //sourceTable.model.setCellField(droppedon, sourceColid, "contents", JSON.stringify(refs), true);
                        //alert("NOW: " + JSON.stringify({refs:refs,newrowid:newrowid,"do":droppedon,crrr:sourceTable.model.getCellField(droppedon, sourceColid, "references")}));
                    } catch (ee) {
                        alert(jQuery.format("excption: {msg}", {
                            msg: ee.message
                        }));
                    }
                }

                this.newTableParams = null;
            }
            if (this.palette) {
                newTable.setPalette(this.palette);
            }
            if (this.palettes["tablePalette"]) {
                var color = this.palettes["tablePalette"].getColor(newTable.id);
                newTable.color = color;
            }
            Object.keys(this.palettes).forEach(function (key) {
                newTable.setPalette(key, that.palettes[key]);
            });
            this.tables[tableid] = newTable;
            this.newestTable = newTable;
            return newTable;
        },
        getTable: function (tableid) {
            return this.tables[tableid];
        },
        clear: function () {
            this.init({
                table0: "smartwrap0"
            });
        },
        emit: function (target, eventName, detail) {
            var doc = target.get(0);
            if (doc.ownerDocument) {
                doc = doc.ownerDocument;
            }
            var evt = doc.createEvent("CustomEvent");
            evt.initCustomEvent(eventName, true, false, detail);
            setTimeout(function () {
                target.get(0).dispatchEvent(evt);
            }, 0);
            this.log("EMITT: " + eventName);
        },
        getCoords: function (elt) {
            var idBearer = jQuery(elt).parents().andSelf().filter(".hasid").get(0);
            var table = jQuery(elt).parents(".smarttable").get(0);

            var coords = {};

            coords.tableid = (idBearer && idBearer.getAttributeNS(smartwrapNamespace, "tableid")) || table.id;
            coords.colid = idBearer && idBearer.getAttributeNS(smartwrapNamespace, "colid");
            coords.rowid = idBearer && idBearer.getAttributeNS(smartwrapNamespace, "rowid");
            coords.foreignKey = idBearer && idBearer.getAttributeNS(smartwrapNamespace, "foreignKey");

            return coords;
        },
        handleDrop: function (rawdrag, dropTarget) {

            var that = this;

            var idBearer = jQuery(dropTarget).parents().andSelf().filter(".hasid").get(0);
            this.log({
                "SWDROP": dropTarget && new XMLSerializer().serializeToString(dropTarget),
                "ID": idBearer && new XMLSerializer().serializeToString(idBearer)
            });

            var table = jQuery(dropTarget).parents(".smarttable").get(0);

            var coords = this.getCoords(dropTarget);

            /*
             coords.tableid = (idBearer && idBearer.getAttributeNS(smartwrapNamespace, "tableid")) || table.id;
             coords.colid = idBearer && idBearer.getAttributeNS(smartwrapNamespace, "colid");
             coords.rowid = idBearer && idBearer.getAttributeNS(smartwrapNamespace, "rowid");
             coords.foreignKey = idBearer && idBearer.getAttributeNS(smartwrapNamespace, "foreignKey");
             */


            var st = this.tables[coords.tableid];

            var draggedElt = jQuery(rawdrag.dragstartEvent.target).get(0);
            var draggedRange = rawdrag.draggedRange;

            this.log({
                DRAGGEDELT: new XMLSerializer().serializeToString(draggedElt),
                DRAGGEDRANGE: draggedRange && draggedRange.toString()
            });

            var dragDetail = {};

            if (draggedRange) {
                dragDetail.text = draggedRange.toString();
            } else {
                var text = this.getVisibleText(draggedElt);
                this.log({
                    VIZTEXT: text,
                    FULLTEXT: jQuery(draggedElt).text()
                });
                if (text.match(/\S/)) {
                    dragDetail.text = text;
                }
            }
            dragDetail.draggedElt = draggedElt;
            dragDetail.srcurl = draggedElt.ownerDocument.defaultView.location.href;

            if (rawdrag.intratable) {
                this.log({
                    ITDROP: "true",
                    TO: coords,
                    FROM: rawdrag.coords,
                    INPLACE: (coords === rawdrag.coords)
                });

                var inplace = ["tableid", "rowid", "colid"].reduce(function (accum, key) {
                    return accum && (coords[key] === rawdrag.coords[key]);
                }, true);

                if (inplace) {
                    return;
                }

                dragDetail.intratable = true;
                dragDetail.sourceCoords = rawdrag.coords;
            }

            var that = this;
            var callback = function (updated) {
                if (!updated) {
                    return;
                }

                if (rawdrag.intratable) {
                    /*
                     that.emit(jQuery(rawdrag.dragstartEvent.target), "sw_removecell");
                     var event = {};
                     var detail = {};
                     detail.intratable = "yep";
                     event.stopPropagation = function() { that.log("STOPPROP REMOVE") };
                     event.originalEvent = rawdrag.dragstartEvent;
                     event.detail = detail;
                     event.target = rawdrag.dragstartEvent.target;
                     that.getHandler("sw_removecell").call(that, event);
                     */
                }

                var doc = draggedElt.ownerDocument;

                if (!rawdrag.intratable) {
                    that.scrapeTarget = {};
                    that.scrapeTarget.doc = doc;
                    that.scrapeTarget.url = doc.defaultView.location.href;

                    var metadata = jQuery(doc).data("metadata") || {};
                    that.log({
                        USEMETAKEYS: Object.keys(metadata),
                        scrape: that.scrapeTarget
                    });
                    Object.keys(metadata).forEach(function (key) {
                        that[key] = metadata[key];
                    });
                }

                that.status.fresh = false;

                var sdetail = {
                    smartwrap: this
                };
                var sevt = document.createEvent("CustomEvent");
                sevt.initCustomEvent("sw_status", true, true, sdetail);
                that.container.dispatchEvent(sevt);

                that.log("SWDROPPED!");
            };

            if (rawdrag.intratable) {
                st.moveCell(dragDetail.sourceCoords, coords, callback);
            } else {
                st.handleDrop(dragDetail, dropTarget, coords, this, callback);
            }
        },
        getHandler: function (eventName) {
            var that = this;
            if (!this.handlers[eventName]) {
                var listener;
                switch (eventName) {
                    case "drop":
                        listener = function (event) {

                            var dropTarget = event && event.target;

                            var dragDetail = that.dragDetail;
                            //that.log("DROP:" + JSON.stringify(Object.keys(dragDetail)));

                            event.preventDefault();

                            that.handleDrop(dragDetail, dropTarget);

                            that.log("DROPPED!!");
                        };
                        break;
                    case "dragstart":
                        listener = function (event) {
                            //alert("ITDRAG!");

                            var detail = {};
                            detail.intratable = true;
                            detail.coords = that.getCoords(event.target);
                            detail.dragstartEvent = event;
                            that.log({
                                ITDRAG: detail
                            });
                            that.emit(jQuery(event.target), "sw_dragstart", detail);
                        };
                        break;
                    case "drop1":
                        listener = function (event) {
                            var dropTarget = event.target;
                            var dropData = event.dataTransfer;
                            var table = jQuery(dropTarget).parents(".smarttable").get(0);
                            var eventName = event.type;


                            var dragDetail = that.dragDetail;
                            //alert("DRag DETAIL: " + JSON.stringify(dragDetail));

                            if (that.framedElt) {
                                jQuery(that.framedElt).removeClass("sw_mouseframed");
                                jQuery(that.selbox).hide();
                            }

                            for (var j = 0; j < dropData.types.length; j++) {
                                var typ = dropData.types[j];
                                dropData[typ] = dropData.getData(typ);
                            }

                            that.log({
                                'dropped': dropData,
                                types: dropData.types
                            });
                            that.log({
                                'dropped on': new XMLSerializer().serializeToString(dropTarget)
                            });
                            //alert('dropped in: ' + new XMLSerializer().serializeToString(table));
                            event.preventDefault();

                            if (!table) {
                                return;
                            }

                            var metadata = {};
                            if (dragDetail) {
                                metadata = dragDetail.metadata;
                            } else {
                                var json = dropData.getData("application/json");
                                if (json) {
                                    metadata = JSON.parse(json);
                                }
                            }

                            var evt = document.createEvent("CustomEvent");
                            var emeta = {};
                            emeta.url = metadata.url;
                            emeta.title = metadata.title;
                            emeta.target = dragDetail.target;
                            //alert("EMETA: " + JSON.stringify(emeta));
                            evt.initCustomEvent("sw_datacell", true, false, emeta);
                            dropTarget.dispatchEvent(evt);

                            that.scrapeTarget = {};
                            that.scrapeTarget.doc = dragDetail.target.ownerDocument;
                            that.scrapeTarget.url = dragDetail.target.ownerDocument.defaultView.location.href;

                            var doc = dragDetail.target.ownerDocument;

                            //alert("SETSCRAPE!! " + JSON.stringify(Object.keys(jQuery(doc).data())));

                            var metadata = jQuery(doc).data("metadata") || {};
                            Object.keys(metadata).forEach(function (key) {
                                that[key] = metadata[key];
                            });

                            var idBearer = jQuery(dropTarget).parents().andSelf().filter(".hasid").get(0);

                            var tableid = (idBearer && idBearer.getAttributeNS(smartwrapNamespace, "tableid")) || table.id;
                            var colid = idBearer && idBearer.getAttributeNS(smartwrapNamespace, "colid");
                            var rowid = idBearer && idBearer.getAttributeNS(smartwrapNamespace, "rowid");
                            var foreignKey = idBearer && idBearer.getAttributeNS(smartwrapNamespace, "foreignKey");

                            //alert("EVENTNAME: " + eventName);
                            //alert("COLNAME " + tableid + "/" + colid + " <- " + jQuery(tgt).val());
                            //alert("TABLES: " + JSON.stringify(that.tables));
                            var st = that.tables[tableid];
                            if (st) {
                                var ui = {};
                                ui.dropTarget = dropTarget;
                                ui.dropData = dropData;
                                ui.dragDetail = dragDetail;
                                ui.rowid = rowid;
                                ui.colid = colid;
                                ui.foreignKey = foreignKey;
                                ui.url = metadata.url;
                                st.handleDrop(event, ui);
                                st.updateViews();
                            }
                            var st2 = that.tables[table.id];
                            if (st2 && (st2 !== st)) {
                                st2.updateViews();
                            }
                            //that.container.classList.add("backlit");

                            that.status.fresh = false;

                            var sdetail = {
                                smartwrap: that
                            };
                            var sevt = document.createEvent("CustomEvent");
                            sevt.initCustomEvent("sw_status", true, true, sdetail);
                            that.container.dispatchEvent(sevt);
                        };
                        break;
                    case "dragenter":
                    case "dragover":
                        /*
                         This is weird, so here is an explanation.  We want the user
                         to see the elements with class "scrim" if and only the user
                         currently is dragging something onto the table.  When the
                         user begins dragging onto the table, we receive a dragenter
                         event; so far so good.  But we only receive a dragleave
                         event if the user leaves for some places; for some other
                         places no event occurs (not sure why).  Also, when the user
                         drops someplace forbidden, we do not get any event
                         whatsoever AFAIK.  This workaround re-hides the scrim
                         elements half a second after the last dragover event is
                         received.  Each dragover event restarts the clock so when no
                         explicit leaving event is given the planb function will hide
                         if dragover events stop happening.
                         */
                        var planbcount = 0;
                        var planb = function () {
                            //alert("CHECKME: " + planbcount);
                            planbcount--;
                            if (!planbcount) {
                                that.container.classList.remove("backlit");
                                jQuery(that.container).find(".sw_dropsite").removeClass("sw_dropsite");
                            }
                        }
                        var prevTarget = null;
                        var timestamp = null;
                        var edgeTimestamps = {};
                        listener = function (event) {
                            var tgt = event.target;

                            var maxx = tgt.ownerDocument.defaultView.innerWidth;

                            var offset = maxx - event.clientX;
                            if (offset < 50) {
                                if (!edgeTimestamps.right) {
                                    edgeTimestamps.right = new Date().getTime();
                                    setTimeout(function () {
                                        if (edgeTimestamps.right) {
                                            jQuery(tgt.ownerDocument).find(".rightmost").get(0).scrollIntoView();
                                        }
                                    }, 500);
                                }
                            } else {
                                edgeTimestamps.right = null;
                            }
                            if (event.clientX < 50) {
                                if (!edgeTimestamps.left) {
                                    edgeTimestamps.left = new Date().getTime();
                                    setTimeout(function () {
                                        if (edgeTimestamps.left) {
                                            jQuery(tgt.ownerDocument).find(".leftmost").get(0).scrollIntoView();
                                        }
                                    }, 500);
                                }
                            } else {
                                edgeTimestamps.left = null;
                            }


                            var isInside = !!(jQuery(tgt).parents(".smarttable").length);

                            if (!isInside) {
                                return;
                            }

                            that.container.classList.add("backlit");
                            jQuery(tgt).addClass("sw_dropsite");
                            //window.setTimeout(function() { that.container.classList.remove("backlit"); }, 1000);


                            if (!tgt.classList) {
                                return;
                            }

                            var ancestors = jQuery(tgt).parents().andSelf();

                            var candrop = false;
                            candrop = candrop || ancestors.filter(".fringe").length;
                            candrop = candrop || ancestors.filter(".content").length;
                            candrop = candrop || ancestors.filter(".swcell").length;
                            candrop = candrop || ancestors.filter(".missing").length;
                            candrop = candrop && (!ancestors.filter(".unsplittable").length);

                            if (false && candrop) {
                                window.setTimeout(function () {
                                    var msg = "CANDROP: " + candrop;
                                    msg += new XMLSerializer().serializeToString(tgt);
                                    alert(msg);
                                }, 5000);
                            }

                            if (candrop) {
                                //that.log("CANDROP: " + event.dataTransfer.dropEffect);
                                event.dataTransfer.dropEffect = "move";
                                if (jQuery(tgt).parents().andSelf().filter(".swcell.full").length) {
                                    event.dataTransfer.dropEffect = "copy";
                                }
                                //that.log("CANDROP2: " + event.dataTransfer.dropEffect);
                                event.preventDefault(); // key to allowing drag to start
                                // see for example the following page, section titles "Where to Drop"
                                // http://www.w3schools.com/html5/html5_draganddrop.asp
                            }

                            if (event.type === "dragover") {
                                planbcount++;
                                window.setTimeout(function () {
                                    planb()
                                }, 500);
                            }

                            if (tgt === prevTarget) {

                                var elapsed = (new Date().getTime() - timestamp);
                                if (elapsed > 500) {
                                    tgt.scrollIntoView();

                                    //that.log({STILLDRAG: elapsed,before:before, after:after, PATH:path});

                                }
                            } else {
                                //tgt.scrollIntoView();
                                prevTarget = tgt;
                                timestamp = new Date().getTime();
                            }
                        };
                        this.handlers["dragenter"] = listener;
                        this.handlers["dragover"] = listener;
                        break;
                    case "dragleave":
                        listener = function (event) {
                            var tgt = event.target;
                            var rtgt = event.relatedTarget;

                            jQuery(tgt).removeClass("sw_dropsite");

                            var wasInside = !!(jQuery(tgt).parents(".smarttable").length);
                            var isInside = !!(jQuery(rtgt).parents(".smarttable").length);

                            //alert("LEFT: " + new XMLSerializer().serializeToString(tgt) + " FOR: " + new XMLSerializer().serializeToString(rtgt));
                            //alert("LEFT: " + wasInside + ":: " + isInside);

                            if (wasInside && (!isInside)) {
                                //alert("EXPLICIT LEAVE");
                                that.container.classList.remove("backlit");
                            }

                            return true;
                        };
                        break;
                    case "input1":
                    case "change1":
                    case "blur1":
                        listener = function (event) {
                            var tgt = event.target;

                            var table = jQuery(tgt).parents(".smarttable").get(0);
                            var eventName = event.type;

                            if (!table) {
                                return;
                            }

                            var tableid = table.id;

                            var colid = tgt.getAttributeNS(smartwrapNamespace, "colid");
                            var value = jQuery(tgt).val();

                            //alert("EVENTNAME: " + eventName);
                            //alert("COLNAME " + tableid + "/" + colid + " <- " + jQuery(tgt).val());
                            //alert("TABLES: " + JSON.stringify(that.tables));
                            var st = that.tables[tableid];
                            if (st && colid) {
                                var params = {
                                    forceInsert: true,
                                    logger: this.smartwrap
                                };
                                st.model.setColumnField(colid, "label", value, params);
                                st.updateViews();
                            } else {
                                //alert("NONESUCH!");
                                st.model.setTableField("label", value);
                            }

                            //alert("INPUT: " + new XMLSerializer().serializeToString(tgt) + ":: " + jQuery(tgt).val());
                            //alert("WITHIN: " + new XMLSerializer().serializeToString(table));
                        };
                        break;
                    case "dblclick":
                        listener = function (event) {
                            if (true) {
                                return;
                            }

                            alert("REPORT!");
                            //openUILinkIn('chrome://smartwrap/content/smartwrapReport.html', "window");
                            //window.openDialog('chrome://smartwrap/content/smartwrapReport.html');
                            window.open('chrome://smartwrap/content/smartwrapReport.html', 'smartwrapReport');

                            /*
                             var act = Object.create(that.Action);
                             that.undoStack.push(act);
                             */
                            that.log("DBLCLICK");
                            //alert("DBLCLICK");


                            //that.setProgram(that.getProgram());

                            //jQuery(document).find(".cursor").get(0).scrollIntoView();
                        };
                        break;
                    case "contextmenu":
                    case "click":
                        listener = function (event) {

                            var menu = that.templates["smartwrap_contextmenu"];
                            jQuery(menu).hide();
                            jQuery(".contextualized").removeClass("contextualized");

                            if (event.type === "click") {
                                return;
                            }

                            //alert("CONTEXT");

                            var tgt = event.target;
                            var table = jQuery(tgt).parents(".smarttable").get(0);
                            var eventName = event.type;

                            if (!table) {
                                that.log({
                                    NOTABLE: true
                                });
                                return;
                            }

                            var st = that.tables[table.id];
                            if (!st) {
                                that.log({
                                    NOSMARTTABLE: table.id
                                });
                                return;
                            }

                            var showMenu = false;

                            jQuery(menu).find(".sw_menuitem").each(function (index, elt) {

                                //alert("MENUITEM: " + new XMLSerializer().serializeToString(elt));
                                //alert("TARGET: " + new XMLSerializer().serializeToString(tgt));

                                that.log({
                                    MENUITEM: new XMLSerializer().serializeToString(elt)
                                });

                                var applySelector = elt.getAttributeNS(smartwrapNamespace, "appliesTo") || elt.getAttribute("sw:appliesTo");
                                // hack since we seem to have lost namespace somewhere

                                var showItem = jQuery(tgt).parents().andSelf().filter(applySelector).length;
                                //alert("SELECTOR: " + applySelector + ":: " + showItem);
                                if (showItem) {
                                    jQuery(elt).parents().andSelf().show();
                                } else {
                                    jQuery(elt).hide();
                                }
                                showMenu = showMenu || showItem;
                            });

                            //showMenu = showMenu || jQuery(tgt).parents().andSelf().filter(".fringe").length;
                            //showMenu = showMenu || jQuery(tgt).filter(".content").length;
                            //showMenu = showMenu || jQuery(tgt).filter(".missing").length;

                            if (!showMenu) {
                                //alert("DONTSHOW: " + new XMLSerializer().serializeToString(tgt));
                                return;
                            }

                            //alert("OK SHOW: " + new XMLSerializer().serializeToString(menu));

                            event.stopPropagation();
                            event.preventDefault();

                            var ui = {};
                            ui.tableid = table.id;
                            ui.context = jQuery(tgt).parents().andSelf().filter(function (index) {
                                ui.colid = ui.colid || this.getAttributeNS(smartwrapNamespace, "colid");
                                ui.rowid = ui.rowid || this.getAttributeNS(smartwrapNamespace, "rowid");
                                return (ui.colid && ui.rowid);
                            }).get(0);

                            var location = {
                                x: event.pageX,
                                y: event.pageY
                            };
                            //setTimeout(function() { alert(JSON.stringify({location:location})); }, 1000);
                            menu.style.left = jQuery.format("{x}px", location);
                            menu.style.top = jQuery.format("{y}px", location);
                            //menu.style.display = 'block';
                            jQuery(menu).show();
                            //jQuery(menu).focus();

                            jQuery(ui.context).addClass("contextualized");
                            jQuery(menu).data("context", ui.context);

                            return;

                            //alert("OK SHOWED: " + new XMLSerializer().serializeToString(menu));

                            /*var ignore = [];
                             var ummm = {};
                             ummm.id = Math.floor(100 * Math.random());

                             var closer = function(event) {
                             var tgt = event.target;

                             that.log({
                             CLOSER: event.type,
                             ignore: ignore
                             });
                             var obj = {
                             CLOSER: event.type,
                             ignore: ignore,
                             target: new XMLSerializer().serializeToString(tgt)
                             };
                             setTimeout(function() {
                             alert(JSON.stringify(obj));
                             }, 400);

                             if (ignore.length > 0) {
                             return;
                             }

                             if (jQuery(tgt).parents().filter("#smartwrap_contextmenu").length) {
                             ui.choice = tgt;
                             //alert(JSON.stringify({"CHOICE": new XMLSerializer().serializeToString(tgt),ignore:ignore}));
                             var eventType = tgt.getAttributeNS(smartwrapNamespace, "eventType") || tgt.getAttribute("sw:eventType");

                             that.log({
                             PRESSED: eventType,
                             ui: ui,
                             uikeys: Object.keys(ui)
                             });
                             if (true) {
                             var obj = {
                             PRESSED: eventType,
                             ummm: ummm,
                             by: event.type,
                             ignore: ignore,
                             ui: ui,
                             uikeys: Object.keys(ui)
                             };
                             setTimeout(function() {
                             alert(JSON.stringify(obj));
                             }, 400);
                             }

                             var detail = {
                             ui: ui
                             };
                             detail.target = ui.context;
                             detail.via = event.type;

                             ignore.push(event.type);

                             var evt = document.createEvent("CustomEvent");
                             evt.initCustomEvent(eventType, true, false, detail);
                             evt.ui = ui;
                             //evt.detail = detail;
                             ui.context.dispatchEvent(evt);

                             //st.handleContextChoice(event, ui);
                             //st.updateViews();
                             that.log({
                             PRESSED: eventType,
                             ignore: ignore
                             });
                             }


                             menu.style.display = 'none';
                             jQuery(ui.context).removeClass("contextualized");
                             event.stopPropagation();
                             event.preventDefault();

                             var unlisten = function() {
                             document.removeEventListener("mouseup", closer, true);
                             document.removeEventListener("click", closer, true);
                             document.removeEventListener("contextmenu", closer, true);
                             document.removeEventListener("blur", closer, true);
                             };

                             window.setTimeout(function() {
                             unlisten();
                             }, 100);

                             };

                             // TODO: listen for clicks not just in the sidebar, but in the page
                             // TODO: also listen for clicks on other apps, like context in pages
                             window.setTimeout(function() {
                             document.addEventListener("mouseup", closer, true);
                             document.addEventListener("click", closer, true);
                             document.addEventListener("contextmenu", closer, true);
                             document.addEventListener("blur", closer, true);
                             }, 200);*/
                        };
                        break;
                    case "sw_removecell":
                        listener = function (event) {
                            //alert("REMOVE");

                            event.stopPropagation();

                            try {
                                var tgt = event.target;
                                var detail = (event.originalEvent && event.originalEvent.detail) || event.detail || {};
                                var ui = (detail && detail.ui) || {};
                                if (detail && detail.target) {
                                    tgt = detail.target;
                                }

                                if (!tgt) {
                                    return;
                                }

                                //alert("REMOVE: " + new XMLSerializer().serializeToString(tgt));
                                that.log({
                                    REMOVE0: true,
                                    DETAIL: detail,
                                    UI: ui
                                });
                                that.log({
                                    REMOVE1: true,
                                    DETAIL: detail,
                                    TGT: new XMLSerializer().serializeToString(tgt),
                                    UI: ui
                                });

                                ui.rowid = ui.rowid || tgt.getAttributeNS(smartwrapNamespace, "rowid");
                                ui.colid = ui.colid || tgt.getAttributeNS(smartwrapNamespace, "colid");
                                ui.tableid = ui.tableid || tgt.getAttributeNS(smartwrapNamespace, "tableid");
                                that.log({
                                    REMOVE2: true,
                                    DETAIL: detail,
                                    TGT: new XMLSerializer().serializeToString(tgt),
                                    UI: ui
                                });

                                var ref = jQuery(tgt).parents().andSelf().filter(".sw_injected_cell, .swcell").get(0);
                                ui.rowid = ui.rowid || ref.getAttributeNS(smartwrapNamespace, "rowid");
                                ui.colid = ui.colid || ref.getAttributeNS(smartwrapNamespace, "colid");
                                ui.tableid = ui.tableid || ref.getAttributeNS(smartwrapNamespace, "tableid");
                                ui.tableid = ui.tableid || ref.getAttributeNS(smartwrapNamespace, "stableid");
                                that.log({
                                    REMOVE3: true,
                                    DETAIL: detail,
                                    TGT: new XMLSerializer().serializeToString(tgt),
                                    UI: ui
                                });

                                //alert("REMOVE UI: " + JSON.stringify(ui));

                                if (that.tables[ui.tableid]) {
                                    that.tables[ui.tableid].removeCell(event, ui);
                                } else {
                                    //alert("NOTABLE: " + ui.tableid);
                                }
                            } catch (ee) {
                                that.log({
                                    excin: event.type,
                                    ui: ui,
                                    msg: ee.message,
                                    stack: ee.stack
                                });

                                that.log("INDOX: " + new XMLSerializer().serializeToString(tgt.ownerDocument));
                            }


                            /*
                             if (jQuery(tgt).filter(".sw_injected_cell").length) {
                             //alert("UNCLASS: " + new XMLSerializer().serializeToString(tgt));
                             jQuery(tgt).removeClass("sw_injected_cell");
                             jQuery(tgt).removeClass(ui.colid);
                             //alert("UNCLASSED: " + new XMLSerializer().serializeToString(tgt));
                             } else {
                             //alert("NOCLASS: " + new XMLSerializer().serializeToString(tgt));
                             }
                             */
                        };

                        break;
                    case "sw_autodrop":
                        listener = function (event) {
                            alert("AUTODROP!");
                        };

                        break;
                    case "swUndo":
                        listener = function (event) {
                            var undoItem = that.undoStack.pop();
                            if (undoItem) {
                                try {
                                    undoItem.undo();
                                    that.redoStack.push(undoItem);

                                    that.updateViews();

                                    that.status.fresh = false;

                                    var sdetail = {
                                        smartwrap: that
                                    };
                                    var sevt = document.createEvent("CustomEvent");
                                    sevt.initCustomEvent("sw_status", true, true, sdetail);
                                    that.container.dispatchEvent(sevt);

                                    //alert("UNDID!");
                                } catch (ee) {
                                    that.log({
                                        NOBACKSIES: ee,
                                        msg: ee.message,
                                        stack: ee.stack
                                    });
                                }
                            }
                        };

                        break;
                    case "swRedo":
                        listener = function (event) {
                            var redoItem = that.redoStack.pop();
                            if (redoItem) {
                                try {
                                    redoItem.redo();
                                    that.undoStack.push(redoItem);

                                    that.updateViews();

                                    that.status.fresh = false;

                                    var sdetail = {
                                        smartwrap: that
                                    };
                                    var sevt = document.createEvent("CustomEvent");
                                    sevt.initCustomEvent("sw_status", true, true, sdetail);
                                    that.container.dispatchEvent(sevt);

                                    //alert("UNDID!");
                                } catch (ee) {
                                    that.log({
                                        NOBACKSIES: ee,
                                        msg: ee.message,
                                        stack: ee.stack
                                    });
                                }
                            }
                        };

                        break;

                    case "swRunWrapper":
                        listener = function (event) {
                            var detail = event.originalEvent && event.originalEvent.detail || {};

                            that.log({
                                RUNWRAP: "heard"
                            });

                            detail["examples"] = that.getProgram();
                            detail["bwdominfo"] = that.bwdominfo;
                            detail["domxml"] = that.domxml;
                            //alert("RUN: " + JSON.stringify(Object.keys(detail)));
                            detail.consent = that.getSetting("consent");

                            detail.logger = that;

                            var tgt = event.originalEvent && event.originalEvent.target;

                            //alert("TUN: " + new XMLSerializer().serializeToString(tgt).substr(0, 300));

                            var evt = tgt.createEvent("CustomEvent");
                            evt.initCustomEvent("swWrapperRequest", true, true, detail);
                            tgt.dispatchEvent(evt);
                        };

                        break;

                    case "sw_reportSlot":
                        listener = function (event) {
                            var detail = event.originalEvent && event.originalEvent.detail || {};
                            var tgt = detail.target;

                            that.updateViews();

                            //tgt.appendChild(tgt.ownerDocument.createTextNode(JSON.stringify(that.explicitProgram)));

                            var interp = Object.create(Smartwrap.ReportInterpreter);
                            var doc = that.wrapDoc;

                            interp.smartwrap = that;
                            interp.logger = that;
                            interp.setContext(doc);
                            interp.setTarget(tgt);

                            that.pendingRequests.report = true;

                            that.log({
                                slot: "foo",
                                urls: that.download_urls,
                                tgt: new XMLSerializer().serializeToString(jQuery(tgt).get(0))
                            });
                            if (that.download_urls) {
                                var subs = {};
                                var urlmap = that.download_urls;

                                var exportPanel = jQuery(tgt).find("#export");
                                exportPanel.show();

                                exportPanel.find("form input.exportButton").each(function (ix, elt) {
                                    var format = jQuery(elt).attr("name");
                                    subs.url = urlmap[format];

                                    if (subs.url) {
                                        var exportUrl = that.rformat("{serverprepath}{url}", subs, function (key) {
                                            return that.getSetting(key);
                                        });
                                        jQuery(elt).attr('formaction', that.fixurl(exportUrl));
                                    }
                                });
                            } else {
                            }

                            window.setTimeout(function () {
                                that.log({
                                    report: "foobar",
                                    explicitProgram: that.explicitProgram
                                });

                                interp.interpret(that.explicitProgram);
                                delete that.pendingRequests.report;


                                exportPanel.find("form input.json").val(JSON.stringify(interp.json));
                                exportPanel.find("form input.responseid").val(that.response.response_id);
                                exportPanel.find("form input.prepath").val(that.rformat("{serverprepath}", {}, function (key) {
                                    return that.getSetting(key);
                                }));

                                that.status.fresh = false;

                                var sdetail = {
                                    smartwrap: that
                                };
                                var sevt = document.createEvent("CustomEvent");
                                sevt.initCustomEvent("sw_status", true, true, sdetail);
                                that.container.dispatchEvent(sevt);
                            }, 200);

                        };

                        break;
                }

                if (false && (!listener)) {
                    listener = function (event) {
                        alert('WHAT? ' + eventName);
                    };
                }

                if (!listener) {
                    alert('oops: ' + eventName);
                    return;
                }

                this.handlers[eventName] = listener;
            }

            return this.handlers[eventName];
        },
        fixurl: function (url) {
            //url = url.replace(/\/\/+/g, "/");
            return url;
        },
        doAction: function (action) {
            this.redoStack = [];
            this.undoStack.push(action);

            action.dodo();
        },
        //TODO: probably needs to move to content script, look for other functions as well
        updateViews: function () {
            var that = this;
            //alert("PROGRAM: " + JSON.stringify(this.getProgram()));

            if (this.refreshPending) {
                return;
            }

            var refresh = function () {
                that.refreshPending = false;
                //alert("PROGRAM: " + JSON.stringify(that.getProgram()));

                var doc = that.wrapDoc || window.document;

                jQuery(doc).find(".sw_injected_row").removeClass("sw_injected_row");
                jQuery(doc).find(".sw_injected_cell").removeClass("sw_injected_cell");
                jQuery(doc).find(".sw_nextPage").removeClass("sw_nextPage");
                jQuery(doc).find(".sw_rowbox").detach();
                jQuery(doc).find(".sw_tablebox").detach();
                Object.keys(that.palettes).forEach(function (key) {
                    var palette = that.palettes[key];
                    //palette.registerStylesheet();

                    jQuery(doc).find(".sw_injected_cell").removeClass(palette.getClassNames().join(" "));
                });
                if (that.palette) {
                    //that.palette.registerStylesheet();

                    //alert("CLASSES: " + that.palette.getClassNames().join(" "));
                    jQuery(doc).find(".sw_injected_cell").removeClass(that.palette.getClassNames().join(" "));
                }

                //alert("DOC: " + new XMLSerializer().serializeToString(doc).substring(0,1000));

                if (!jQuery(doc).find("meta#sw_instrumented").length) {
                    //alert("DOC: " + new XMLSerializer().serializeToString(doc).substring(0,1000));

                    ["sw_removecell"].forEach(function (eventType) {
                        jQuery(doc).bind(eventType, that.getHandler(eventType));
                    });

                    var meta = doc.createElement("meta");
                    meta.id = "sw_instrumented";
                    meta.content = "";
                    jQuery(doc).find("head").get(0).appendChild(meta);
                }

                var interp = Object.create(Smartwrap.Interpreter);
                interp.setContext(doc);

                var settings = {};
                settings.cache = {};
                settings.names = {};
                interp.getSetting = function (key) {
                    if (!settings.names[key]) {
                        settings.cache[key] = that.getSetting(key);
                        settings.names[key] = true;
                    }
                    return settings.cache[key];
                };

                var win = doc.defaultView;

                var rownum = -1;
                var tableid = "";
                var rowbox = null;
                var rowrange = null;
                var tablerange = null;

                interp.addEventListener("startTable", function (params) {
                    tableid = params.tableid;
                });

                interp.addEventListener("endTable", function (params) {
                    //alert("ENDTABLE: " + tableid);
                    if (tablerange) {
                        if (interp.getSetting("paintTableContainers")) {
                            //alert("PAINTCONT");
                            var tableelt = tablerange.commonAncestorContainer;
                            jQuery(tableelt).addClass("sw_injected_table");

                            var eltbox = paintRowBox(tableelt.getBoundingClientRect(), {
                                templateName: "sw_tablebox",
                                className: tableid
                            });
                            //alert("PAINTELT: " + new XMLSerializer().serializeToString(eltbox));
                        }
                        if (interp.getSetting("paintTableRanges")) {
                            var rangebox = paintRowBox(tablerange.getBoundingClientRect(), {
                                templateName: "sw_tablebox",
                                className: tableid
                            });
                        }
                    }
                    tablerange = null;
                });

                interp.addEventListener("startRow", function () {
                    rownum++;
                });

                var paintRowBox = function (rect, params) {
                    var templateName = params["templateName"] || "sw_rowbox";
                    var className = params["className"];

                    var bounds = {
                        left: rect.left,
                        right: rect.right,
                        top: rect.top,
                        bottom: rect.bottom
                    };

                    bounds.width = bounds.right - bounds.left;
                    bounds.height = bounds.bottom - bounds.top;

                    bounds.bottom += doc.defaultView.scrollY;
                    bounds.top += doc.defaultView.scrollY;
                    bounds.left += doc.defaultView.scrollX;
                    bounds.right += doc.defaultView.scrollX;

                    var rectbox = jQuery(that.templates[templateName]).clone().get(0);
                    jQuery(rectbox).find("*:not(.sw_rowbox_frame)").hide();
                    jQuery(rectbox).find(".sw_box_frame").show();
                    if (className) {
                        jQuery(rectbox).find(".sw_box_frame").addClass(className);
                    }
                    doc.body.appendChild(rectbox);
                    //alert("ROWRECT: " + JSON.stringify(bounds));

                    jQuery(rectbox).find(".sw_box_frame.horizontal").css("width", bounds.width + "px");
                    jQuery(rectbox).find(".sw_box_frame.vertical").css("height", bounds.height + "px");

                    jQuery(rectbox).find(".sw_box_top, .sw_box_left, .sw_box_bottom").css("left", bounds.left);
                    jQuery(rectbox).find(".sw_box_top, .sw_box_left, .sw_box_right").css("top", bounds.top);
                    jQuery(rectbox).find(".sw_box_right").css("left", bounds.right);
                    jQuery(rectbox).find(".sw_box_bottom").css("top", bounds.bottom);
                    return rectbox;
                };

                interp.addEventListener("endRow", function () {
                    //TODO: Fix all settings
                    //if (interp.getSetting("paintRowContainers")) {
                    if (false) {
                        var rowelt = rowrange.commonAncestorContainer;
                        jQuery(rowelt).addClass("sw_injected_row");

                        var eltbox = paintRowBox(rowelt.getBoundingClientRect(), {
                            templateName: "sw_rowbox"
                        });
                    }
                    if (false) {
                        //if (interp.getSetting("paintRowRanges")) {
                        var rangebox = paintRowBox(rowrange.getBoundingClientRect(), {
                            templateName: "sw_rowbox"
                        });
                    }
                    rowrange = null;
                });

                interp.addEventListener("nextPage", function (params) {
                    var node = params.node;

                    jQuery(node).addClass("sw_nextPage");
                });
                interp.addEventListener("makeCell", function (params) {
                    //alert("CELL: " + JSON.stringify(params));

                    if (params.range && params.colid) {
                        var node = params.range.endContainer;

                        if (interp.getSetting("paintCells")) {
                            jQuery(node).addClass("sw_injected_cell");
                            jQuery(node).addClass(params.colid);

                            if (node.setAttributeNS) {
                                node.setAttributeNS(smartwrapNamespace, "tableid", tableid);
                                node.setAttributeNS(smartwrapNamespace, "colid", params.colid);
                                node.setAttributeNS(smartwrapNamespace, "rowid", params.rowid);
                            }

                            //alert("CELL: " + new XMLSerializer().serializeToString(node));
                        }

                        var range0 = doc.createRange();
                        range0.selectNodeContents(node);
                        if (rowrange) {
                            try {
                                if (range0.compareBoundaryPoints(Range.START_TO_START, rowrange) < 0) {
                                    rowrange.setStartBefore(node);
                                }
                                if (range0.compareBoundaryPoints(Range.END_TO_END, rowrange) > 0) {
                                    rowrange.setEndAfter(node);
                                }
                            } catch (ex) {
                                // TODO: put this in the log
                            }
                        } else {
                            rowrange = range0.cloneRange();
                        }
                        if (tablerange) {
                            try {
                                if (range0.compareBoundaryPoints(Range.START_TO_START, tablerange) < 0) {
                                    tablerange.setStartBefore(node);
                                }
                                if (range0.compareBoundaryPoints(Range.END_TO_END, tablerange) > 0) {
                                    tablerange.setEndAfter(node);
                                }
                            } catch (ex) {
                                // TODO: put this in the log
                            }
                        } else {
                            tablerange = range0.cloneRange();
                        }

                        //alert("POSTHOC: " + new XMLSerializer().serializeToString(node));
                    }
                });

                var program = that.getProgram(true);

                that.log({
                    PAINTBY: program
                });

                interp.interpret(program);
            };

            window.setTimeout(function () {
                refresh()
            }, 100);
            this.refreshPending = true;
        },
        extradite: function (rownum, colid, tuple, sourceTable, targetTable) {
            this.log({
                domain: "extradition",
                rownum: rownum,
                colid: colid,
                tuple: tuple,
                source: "",
                target: targetTable
            });

            if (targetTable) {
            } else {
                var params = {};
                params.auxiliary = true;
                params.rownum = rownum;
                params.colid = colid;
                params.tuple = tuple;
                params.sourceTableId = sourceTable.id;

                this.newTableParams = params;

                var evt = document.createEvent("CustomEvent");
                evt.initCustomEvent("sw_addtable", true, false, params);
                document.dispatchEvent(evt);
            }
        },
        extradite_old: function (rownum, tuple, colonnade, sourceTable, targetTable) {
            this.log({
                domain: "extradition",
                rownum: rownum,
                tuple: tuple,
                colonnade: colonnade,
                source: "",
                target: targetTable
            });

            if (targetTable) {
            } else {
                var params = {};
                params.auxiliary = true;
                params.rownum = rownum;
                params.tuple = tuple;
                params.colonnade = colonnade;
                params.sourceTableId = sourceTable.id;

                this.newTableParams = params;

                var evt = document.createEvent("CustomEvent");
                evt.initCustomEvent("sw_addtable", true, false, params);
                document.dispatchEvent(evt);
            }
        },
        setTemplate: function (template_id, template_elt) {
            this.templates[template_id] = template_elt;
        },
        setDialog: function (dialog_id, dialog_elt) {
            //alert("SETDLG!");

            this.dialogs[dialog_id] = dialog_elt;
        },
        tellUser: function (spec) {
            var msgid = spec.msgid;

            var dialogElt = this.dialogs[msgid];
            var eltCopy = jQuery(dialogElt).clone();

            var dialogType = spec.dialogType || dialogElt.getAttributeNS(smartwrapNamespace, "dialogType");
            var eventType = spec.eventType || dialogElt.getAttributeNS(smartwrapNamespace, "eventType");
            var continuation = spec.continuation || function () {
                    var params = {};

                    //alert("AND ONE!");

                    if (!eventType) {
                        return;
                    }

                    var evt = document.createEvent("CustomEvent");
                    evt.initCustomEvent(eventType, true, false, params);
                    document.dispatchEvent(evt);
                };

            var subs = spec.subs || spec;

            var rawtext = jQuery.trim(dialogElt.textContent);
            var text = jQuery.format(rawtext, subs);

            switch (dialogType) {
                case "alert":
                    if (false && (this.getSetting("useJQueryDialog") === false)) {
                        eltCopy.text(text).dialog({
                            buttons: {
                                'OK': function () {
                                    $(this).dialog('close');
                                }
                            }
                        });
                    } else {
                        alert(text);
                    }
                    break;
                case "prompt":
                    prompt(text, spec.promptValue);
                    break;
            }

            continuation.call();
        },
        setContainer: function (container) {
            var that = this;

            var events = ["drop", "dragenter", "dragover", "dragleave", "dragstart", "dblclick", "contextmenu", "click", "sw_autodrop"];

            if (container) {
                this.container = container;
                events.forEach(function (eventName) {
                    that.container.addEventListener(eventName, that.getHandler(eventName), true);
                });
            } else {
                events.forEach(function (eventName) {
                    that.container.removeEventListener(eventName, that.getHandler(eventName), true);
                });

                Object.keys(this.palettes).forEach(function (key) {
                    //alert("KEY: " + key);
                    var palette = that.palettes[key];
                    var doc = that.currentWindow.getBrowser().contentDocument;
                    //palette.unregisterStylesheet();
                    jQuery(doc).find(".sw_injected_cell").removeClass(palette.getClassNames().join(" "));
                    jQuery(doc).find(".sw_injected_cell").removeClass("sw_injected_cell");
                });
                this.container = container;
            }
        },
        getProgram: function (preferExplicit) {
            if (preferExplicit && this.explicitProgram) {
                return this.explicitProgram;
            }

            var program = [];
            var params = {};
            params.logger = this;

            for (var tableName in this.tables) {
                var table = this.tables[tableName];
                var aux = table.model.getTableField('parentTable');
                this.log({
                    pre: program,
                    aux: [!!aux],
                    id: table.id
                });
                if (!!aux) {
                    program.unshift(table.getProgram(params));
                } else {
                    program.push(table.getProgram(params));
                }
                this.log({
                    netnet: program,
                    aux: table.auxiliary
                });
            }
            program.unshift("begin");
            return program;
        },
        setProgram: function (program, meta) {
            alert("SETPROG!!");
            var interp = Object.create(Smartwrap.LoadInterpreter);
            var doc = this.currentWindow.getBrowser().contentDocument;

            interp.setContext(doc);
            interp.inferredCount = 0;
            interp.smartwrap = this;
            interp.logger = this;

            var that = this;

            //alert("SETPROG: " + JSON.stringify(program));

            interp.interpret(program);
            this.log({
                "TABLE": interp.tablecontents
            });

            if (meta && meta.callback) {
                if (interp.inferredCount <= 0) {
                    meta.callback.call(null, "nohelp");
                } else {
                    meta.callback.call(null, "success");
                }
            }
        },
        getRelations: function () {
            var relations = {
                relations: {},
                ids: [],
                names: []
            };
            for (var tableid in this.tables) {
                relations.ids.push(tableid);
                relations.relations[tableid] = this.tables[tableid].getRelation();
            }
            return relations;
        },
        setPalette: function (paletteName, palette) {
            this.palettes[paletteName] = palette;

            for (var tableName in this.tables) {
                this.tables[tableName].setPalette(paletteName, palette);
                if (paletteName === 'tablePalette') {
                    var color = palette.getColor(tableName);
                    this.tables[tableName].color = color;
                }
            }
        },
        clearTables: function () {
            for (var tableName in this.tables) {
                var table = this.tables[tableName];
                table.model = this.newTableModel();
            }
        },
        getStatus: function (key) {
            //alert("ERE: " + JSON.stringify(this.status));
            this.log({
                GSTAT: key,
                allstatus: this.status
            });

            if (!this.status.fresh) {

                this.status.preview_ready = true;
                this.status.preview_ready = this.status.preview_ready && (!!this.bwdominfo);
                this.status.preview_ready = this.status.preview_ready && (!!this.domxml);

                this.status.bwdominfo = !!this.bwdominfo;
                this.status.domxml = !!this.domxml;

                this.status.discard_ready = false;

                this.status.save_ready = !!this.wrapper;

                //alert("ORE: " + JSON.stringify(this.status));
                this.log({
                    statuskey: key,
                    allstatus: this.status,
                    where: "pretable"
                });

                for (var tableName in this.tables) {
                    var table = this.tables[tableName];
                    //alert("TAB: " + tableName);
                    this.status.preview_ready = this.status.preview_ready && (!!table.model.getTableField("nonempty"));
                    this.status.discard_ready = this.status.discard_ready || (!!table.model.getTableField("nonempty"));
                    this.log({
                        statuskey: key,
                        tablename: tableName,
                        meta: table.model.metadata,
                        allstatus: this.status
                    });
                }

                this.status.undo_ready = this.undoStack.length;
                this.status.redo_ready = this.redoStack.length;

                this.status.pending = Object.keys(this.pendingRequests).join("");
                this.log({
                    STATPEND: this.pendingRequests
                });

                //alert("ORE: " + JSON.stringify(this.status));

                this.status.scrape_target = this.scrapeTarget;

                this.status.fresh = true;

                this.log({
                    statuskey: key,
                    allstatus: this.status,
                    returning: this.status[key]
                });
            }
            this.log({
                statuskey: key,
                statusval: this.status[key]
            });
            return this.status[key];
        },
        getAbsoluteLocationXPath: function (elt, isHTML) {
            var xpath = jQuery(elt).data("xpath");
            if (xpath) {
                this.log({
                    cachedXPath: xpath
                });
                return xpath;
            }

            var relPath = "/" + elt.tagName;
            if (isHTML) {
                relPath = relPath.toLowerCase();
            }
            var suffix = "";
            if (false && elt.id) {
                suffix = "[@id='" + elt.id + "']";
            } else {
                var relPos = 0;
                var sib = elt.previousSibling;
                while (sib) {
                    if (sib.tagName === elt.tagName) {
                        relPos++;
                    }
                    sib = sib.previousSibling;
                }
                if (relPos) {
                    relPos++;
                    suffix = "[" + relPos + "]";
                }
            }
            if (elt.parentNode) {
                xpath = this.getAbsoluteLocationXPath(elt.parentNode, isHTML) + relPath + suffix;
                this.log({
                    genXPath: xpath
                });
                return xpath;
            }
            return "";
        },
        log: function (msg) {
            if (false) {
                console.log(JSON.stringify(msg));
                return;
            }

            //alert(JSON.stringify(msg));
            var logevt = document.createEvent("CustomEvent");
            logevt.initCustomEvent("sw_log", true, false, msg);
            document.dispatchEvent(logevt);
        },
        clearMarking: function () {
            this.log({
                CLEAR: "markings",
                ndocs: this.docs.length
            });

            this.docs.forEach(function (doc) {
                jQuery(doc).find(".sw_injected_cell").removeClass("sw_injected_cell");
                jQuery(doc).find(".sw_selbox").detach();
                jQuery(doc).find(".sw_rowbox").detach();
                jQuery(doc).find(".sw_tablebox").detach();
            });
        },
        framedElt: null,
        getVisibleText: function (elt) {
            var jq = jQuery(elt);
            var viz = jq.filter(":visible");

            if (viz.length === 0) {
                return "";
            }

            if (viz.children().length) {
                var accum = "";
                var that = this;
                viz.contents().each(function (ix, kid) {
                    if (kid.nodeType === kid.TEXT_NODE) {
                        accum += jQuery(kid).text();
                    } else {
                        accum += that.getVisibleText(kid);
                    }
                });
                return accum;
            } else {
                return jQuery.format("{f}", {
                    f: viz.text(),
                    uf: jq.text()
                });
            }
        },
    }
})();
