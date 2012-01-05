// Folksy - game engine 
//

/***********************************************************************
 * SETTINGS
 ***********************************************************************/

soundManager.url = '/simon/folkesfolk/swf/';		// HARDCODE

kortversion = false;
//kortversion = true;

/***********************************************************************
 * COMPATIBILITY CODE
 ***********************************************************************/

// From https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/IndexOf

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
        "use strict";
        if (this == null) {
            throw new TypeError();
        }
        var t = Object(this);
        var len = t.length >>> 0;
        if (len === 0) {
            return -1;
        }
        var n = 0;
        if (arguments.length > 0) {
            n = Number(arguments[1]);
            if (n != n) { // shortcut for verifying if it's NaN
                n = 0;
            } else if (n != 0 && n != Infinity && n != -Infinity) {
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
        }
        if (n >= len) {
            return -1;
        }
        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
        for (; k < len; k++) {
            if (k in t && t[k] === searchElement) {
                return k;
            }
        }
        return -1;
    }
}

/***********************************************************************
 * HELPER FUNCTIONS
 ***********************************************************************/ 

function random_int(max_val) {
	// Return a random integer 0 <= i < max_val
	return Math.floor(Math.random() * max_val);
}

function random_pick(a) {
	// Returns a random element from an array 
	// ASSUMES that the array has indices 0, 1, 2, ..., n-1
	return a[random_int(a.length)];
}

function random_pick_except(a, except) {
	return random_pick($.grep(a, function (el, i) { return el != except; }));
}

function shuffle(a) {
	// Returns a shuffled version of the array.
	var a2 = a.slice(0);
	var a3 = [];
	while (a2.length > 0) {
		var i = random_int(a2.length);
		a3.push(a2.splice(i, 1)[0]);
	}
	return a3;
}

function range(max) {
	a = [];
	for (var i = 0; i < max; i++) {
		a.push(i);
	}
	return a;
}

/***********************************************************************
 * THE FOLKSY CLASS 
 ***********************************************************************/

function Folksy(game_url) {
	var _maxItems = 50;
	var _isInQuestion = false;
	var privateVar  =  "foo";
	this.publicVar = "foo";

	// TODO should come with the game 
	this.letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", 
			"N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", 
			"AA", "AE", "OE"];

	this.questions = [];



 	function log( s ) {
 		// TODO: copy ff.log
	}

	function setMaxItems(n) {
		_max_items = Number(n);
	}

	function load_image(filename) {
		var ff = this;
		this.log("Let's load " + filename + "...");
		var img = new Image();

		$(img)
			.load(function() {
					$(this).hide();
					ff.log("Have now loaded " + filename);
				})
		
			.error(function() {
					ff.log("Could not load " + filename + "!");
				})
		
			.attr('src', filename);

		return img;
	}

	function load_images() {
		this.images = [];
		for (var i = 0; i < this.questions.length; i++) {
			this.images.push(load_image("images/" + this.questions[i] + ".jpg"));
		}

		this.letter_images = [];
		this.letter_select_images = [];
		for (var i = 0; i < this.letters.length; i++) {
			this.letter_images.push(load_image("images/letters/" + this.letters[i] + ".png"));
			this.letter_select_images.push(load_image("images/letters/" + this.letters[i] + "_select.png"));
		}
	}

	function load_audios() {
		this.audios = [];
		for (var i in this.questions) {
			var s = this.questions[i];
			var sound = soundManager.createSound({
				id: s,
				url: ['sound/' + s + '.mp3', 
				      'sound/' + s + '.ogg']});
			this.audios.push(sound);
		}
	}

	function play_sound(audio) {
		//	audio.currentTime = 0;
		audio.play();
	}


	function get_answer(s) {
		// "A_amanda" => "A"; "AA_asa" => "AA"
		return /^([A-Z]+)/.exec(s)[0];
	}



	function initWithJSON(jsonData) {
      		// this.log(jsonData.gameTitle);
		
		// This isn't actually json yet. 
		this.questions = jsonData;

		// Start loading images and stuff. 
		// Respect max_items.
	}

	function initWithURL(url) {
   		$.getJSON(url, this.initWithJSON);
	}

	function correct_answer() {
	if (ff.is_in_question) {
		ff.is_in_question = false;
		$("#wrong_answer").fadeOut()
		$("#correct_answer").animate({
			top: 28, 
			left: 28,
			width: 368,
			height: 368,
			opacity: 0.5},
			1000, function() {
				$("#correct_answer").fadeOut(function() {
					$("#correct_answer").css({top: 424, width: 164, height: 164, opacity: 1.0});
					next_question();
				});
			});
		ff.log("Whoohooo!");
	
	}
}

function wrong_answer() {
	if (ff.is_in_question) {
		ff.log("Wrong...");
	}
}

function next_question() {
	if (ff.order.length < 1) {
		alert("Bra jobbat!");
		return;
	}
	var q = ff.order.shift();
	var answer = get_answer(ff.questions[q]);
	var answer_i = ff.letters.indexOf(answer);

	add_new_image = function() {
		play_sound(ff.audios[q]);

		ff.current_image = ff.images[q];
		var correct_image = ff.letter_images[answer_i];
		var wrong_image = random_pick_except(ff.letter_images, correct_image);


		$("#face")[0].src = ff.current_image.src;
		$("#face").fadeIn();		

		var x_position = shuffle(["28px", "232px"]);
		$("#correct_answer").css({left: x_position[0]});
		$("#wrong_answer").css({left: x_position[1]});
		$("#correct_answer")[0].src = correct_image.src;
		$("#wrong_answer")[0].src = wrong_image.src;
		$(".answers").fadeIn();
		ff.is_in_question = true;
	}

	if (ff.current_image) {
		ff.log("Fading out..");
		$("#face").fadeOut("slow", add_new_image);
	} else {
		add_new_image();
	}
}

function start_game() {
	$("#correct_answer").click(correct_answer);
	$("#wrong_answer").click(wrong_answer);
	$("#intro").slideUp("slow", function() { 
		$("#game").fadeIn("slow", next_question); 	
	});
}

function init_debug() {
    if (typeof folkeDebug === 'undefined') {
	ff.debugMode = false;
    } else {
	ff.debugMode = folkeDebug;
    }
    if (ff.debugMode && console && console.log) {
	ff.log = function(s) { console.log(s); } 
    } else { 
	ff.log = function(s) { }
    }
    soundManager.debugMode = ff.debugMode;
}

// Init function - run when the DOM is ready

$(function() {
	init_debug();

	// Should start by loading in the game metadata using $.get('something.json', callback)

	load_images();

	ff.order = shuffle(range(ff.questions.length));
	ff.is_in_question = false;		// is true when we're waiting for a click on a letter 

	$("#start_game").click(start_game);

	$("#switch_img").click(next_question);

});

// Run when soundManager is ready

soundManager.onready(function() {
	load_audios();
});



	if (game_url !== undefined) {
		initWithURL(game_url);
   	}


}

/***********************************************************************
 * TEST STUFF
 ***********************************************************************/

folksy = new Folksy();
if (kortversion) 
	folksy.setMaxItems(5);
folksy.initWithJSON(["A_amanda", "A_anna", "A_arvid", "A_astrid", "B_britta", 
		     "D_daniel", "E_elias_k", "E_ellen", "E_emilia", "E_erik", 
		     "E_ester", "F_folke", "F_frej", "G_guje", "I_ida", "J_johan", 
		     "J_jonas", "J_jon", "L_lina", "M_majken", "N_nisse", 
		     "N_noam", "N_nova", "O_otis", "P_paer", "S_sigrid", 
		     "S_simon", "S_sixten", "S_stella", "S_soeren", "S_svea", 
		     "T_tord", "U_uno", "V_vera", "W_wilhelm", "Z_zackari",
		     "AA_aasa", "AE_aerlebrand"]);


/***********************************************************************
 * OLD SHIT - MOVE INTO FOLKSY CLASS
 ***********************************************************************/
