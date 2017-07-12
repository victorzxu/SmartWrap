import jQuery from "jquery";
import {Smartwrap} from "./smartwrap";
import "./smartwrap-interpreter";

const program = JSON.parse(jQuery("meta#sw_program").get(0).content);
//alert('hum: ' + JSON.stringify(program));

const interp = Object.create(Smartwrap.Interpreter);
console.log("in annotation");
console.log(document);
interp.setContext(document);

const palette = Palette.mainPalette;

interp.addEventListener("makeCell", params => {
  //alert("CELL: " + JSON.stringify(params));
  if (params.range && params.colid) {
    const color = palette.getColor(params.colid);
    const node = params.range.endContainer;
    jQuery(node).addClass("sw_injected_cell");
    jQuery(node).addClass(params.colid);
  }
});

interp.interpret(program);
//alert("interped");

const css = palette.getCSS();
//alert("CSS: " + css);

const style = document.createElement("style");
style.appendChild(document.createTextNode(css));

document.head.appendChild(style);
