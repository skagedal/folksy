// Testing the layout code.

var layoutTest = {}

function LayObj(w, h, bg) {
    this.active = true;
    this.isPlaced = false;
    this.w = w;
    this.h = h;
    this.bg = bg;
    this.getWidth = function() { return this.w; }
    this.getHeight = function() { return this.h; }
    this.div = $('<div/>').addClass("elem").hide().appendTo($("#content"));
		    
    this.place = function(X, Y, W, H) { 
	console.log("Getting placed: ", X, Y, W, H);
	console.log("bg: ", this.bg);
	this.div.css({"background-color": this.bg});
	if(!this.isPlaced)
	    this.div.css({opacity: 0}).show();

	this.div.animate({ left: X, top: Y, width: W, height: H, opacity: 1.0});
	this.isPlaced = true;
    }
}

function updateActive(evObject) {
    var LO = evObject.data;
    var doFadeInOut = !!LO.active != !!evObject.target.checked;
    
    LO.active = evObject.target.checked;
    console.log("Update active ", LO.active);
    if (doFadeInOut) {
	if (!LO.active)
	    LO.div.animate({opacity: 0});
    }
    reLayout();
}

function updateWidth(evObject) {
    var LO = evObject.data;
    LO.w = parseInt(evObject.target.value);
    console.log("Update width ", LO.w);
    reLayout();
}

function updateHeight(evObject) {
    var LO = evObject.data;
    LO.h = parseInt(evObject.target.value);
    console.log("Update height ", LO.h);
    reLayout();
}

function updateBG(evObject) {
    var LO = evObject.data;
    LO.bg = evObject.target.value;
    console.log("Update bg ", LO.bg);
    reLayout();
}

function clickPlus(evObj) {
    var input = $(evObj.target).parent().parent().find('input');
    input.val(parseInt(input.val()) + 10)
    input.change();
}

function clickMinus(evObj) {
    var input = $(evObj.target).parent().parent().find('input');
    input.val(parseInt(input.val()) - 10)
    input.change();
}

function plusMinus(LO) {
    var buttonPlus = $('<button>+</button>').click(LO, clickPlus);
    var buttonMinus = $('<button>&minus;</button>').click(LO, clickMinus);
    return $('<div style="float:right"/>').append(buttonPlus, buttonMinus);
}

function addTableRows(layobjs) {
    var b = plusMinus;
    var tbody = $('#ctable > tbody:last');
    for (var i = 0; i < layobjs.length; i++) {
	var tr = tbody.append($('<tr>'));
	var LO = layobjs[i];

	// This is the kind of code that could - should - make you
	// either love or hate jQuery. Or both.
	tr.append($('<td>').append(
	    $('<input type="checkbox">')
		.prop("checked", LO.active)
		.change(LO, updateActive)));
	tr.append($('<td>').append(
	    b(LO), 
	    $('<input type="text">')
		.val(LO.w)
		.change(LO, updateWidth))); 
	tr.append($('<td>').append(
	    b(LO), 
	    $('<input type="text">')
		.val(LO.h)
		.change(LO, updateHeight)));
	tr.append($('<td>').append(
	    $('<input type="text">')
		.val(LO.bg)
		.change(LO, updateBG)));		    
    }
}

function reLayout() {
    var objs = $.grep(layoutTest.objs, function(o) { return o.active; });

    layout.layoutObjects(layoutTest.box, 
			 objs, 
			 {padding: layoutTest.padding});
}

function randVal() { 
    return parseInt(Math.random() * 100 + 10);
}

$(function() {
  // some examples - not used currently
    var o1 = [[10, 10, "red"], [10, 10, "blue"]];
    var o2 = [[20, 10, "#f00"], [10, 10, "#0f0"], [10, 10, "#00f"]];
    var o3 = [[10, 10, "red"], [10, 10, "blue"], [500, 10, "#ff0"]];
    var greedyFail = [[80, 50, "red"], 
		      [70, 50, "blue"], 
		      [20, 50, "red"], 
		      [15, 50, "blue"], 
		      [15, 50, "blue"]];
    // The above example should place the red objects on one row and
    // the blue on the other. But it doesn't.

    colors = ["aqua", "black", "blue", "fuchsia", "grey", "green", 
	      "lime", "maroon", "navy", "olive", "purple", "red", 
	      "silver", "teal", "white", "yellow"]

    var objs = [];
    for (var i = 0; i < colors.length; i++) {
	var lo = new LayObj(randVal(), randVal(), colors[i]);
	lo.active = Math.random() < 0.4;
	objs.push(lo);
    }

    layoutTest.box = layout.Box($("#content").width(),
				$("#content").height());
    layoutTest.objs = objs;
    layoutTest.padding = 20;

    reLayout();

    addTableRows(objs);

    /* We could use jQuery's .data(key, value) to connect the
     * model and the views, so to speak. */

});

