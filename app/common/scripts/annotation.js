var program = JSON.parse(jQuery("meta#sw_program").get(0).content);
//alert('hum: ' + JSON.stringify(program));

var interp = Object.create(Smartwrap.Interpreter);
interp.setContext(document);

var palette = Palette.mainPalette;

interp.addEventListener("makeCell", function(params) {
  //alert("CELL: " + JSON.stringify(params));
  if (params.range && params.colid) {
    var color = palette.getColor(params.colid);
    var node = params.range.endContainer;
    jQuery(node).addClass("sw_injected_cell");
    jQuery(node).addClass(params.colid);
  }
});

interp.interpret(program);
//alert("interped");

var css = palette.getCSS();
//alert("CSS: " + css);

var style = document.createElement("style");
style.appendChild(document.createTextNode(css));

document.head.appendChild(style);
