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

function Folksy(gameURL) {
	var folksy = this;

	// Private items are marked with _. We make them "public" anyway, for ease of debugging .
	this.maxItems = 50;
	this._isInQuestion = false;
	this._gameURL = null;
	this.itemOrder = []

	// TODO should come with the game 
	this.letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", 
			"N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", 
			"AA", "AE", "OE"];

	this.questions = [];

	this.setMaxItems = function(n) {
		this._maxItems = Number(n);
	}
	
	// PRIVATE FUNCTIONS

	function loadImage(filename) {
		folksy.log("Let's load " + filename + "...");
		var img = new Image();

		$(img)
			.load(function() {
					$(this).hide();
					folksy.log("Have now loaded " + filename);
				})
		
			.error(function() {
					folksy.log("Could not load " + filename + "!");
				})
		
			.attr('src', filename);

		return img;
	}

	function loadImages() {
		folksy.images = [];
		for (var i = 0; i < folksy.questions.length; i++) {
			folksy.images.push(loadImage("images/" + folksy.questions[i] + ".jpg"));
		}

		folksy.letter_images = [];
		folksy.letter_select_images = [];
		for (var i = 0; i < folksy.letters.length; i++) {
			folksy.letter_images.push(loadImage("images/letters/" + folksy.letters[i] + ".png"));
			folksy.letter_select_images.push(loadImage("images/letters/" + folksy.letters[i] + "_select.png"));
		}
	}

	function loadAudios() {
		folksy.audios = [];
		for (var i in folksy.questions) {
			var s = folksy.questions[i];
			var sound = soundManager.createSound({
				id: s,
				url: ['sound/' + s + '.mp3', 
				      'sound/' + s + '.ogg'],
				autoLoad: true});
			folksy.audios.push(sound);
		}
	}

	function playSound(audio) {
		//	audio.currentTime = 0;
		audio.play();
	}


	function getAnswer(s) {
		// "A_amanda" => "A"; "AA_asa" => "AA"
		return /^([A-Z]+)/.exec(s)[0];
	}

	function correctAnswer() {
		if (folksy._isInQuestion) {
			folksy._isInQuestion = false;
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
						nextQuestion();
					});
				});
			folksy.log("Whoohooo!");
		}
	}

	function wrongAnswer() {
		if (folksy._isInQuestion) {
			// TODO: sound effect for wrong answer
			folksy.log("Wrong...");
		}
	}

	function nextQuestion() {
		if (folksy._itemOrder.length < 1) {
			alert("Bra jobbat!");
			return;
		}
		var q = folksy._itemOrder.shift();
		var answer = getAnswer(folksy.questions[q]);
		var answer_i = folksy.letters.indexOf(answer);

		add_new_image = function() {
			playSound(folksy.audios[q]);

			folksy.current_image = folksy.images[q];
			var correct_image = folksy.letter_images[answer_i];
			var wrong_image = random_pick_except(folksy.letter_images, correct_image);


			$("#face")[0].src = folksy.current_image.src;
			$("#face").fadeIn();		

			var x_position = shuffle(["28px", "232px"]);
			$("#correct_answer").css({left: x_position[0]});
			$("#wrong_answer").css({left: x_position[1]});
			$("#correct_answer")[0].src = correct_image.src;
			$("#wrong_answer")[0].src = wrong_image.src;
			$(".answers").fadeIn();
			folksy._isInQuestion = true;
		}

		if (folksy.current_image) {
			folksy.log("Fading out..");
			$("#face").fadeOut("slow", add_new_image);
		} else {
			add_new_image();
		}
	}

	function start_game() {
		$("#correct_answer").click(correctAnswer);
		$("#wrong_answer").click(wrongAnswer);
		$("#intro").slideUp("slow", function() { 
			$("#game").fadeIn("slow", nextQuestion); 	
		});
	}

	var _debugMode = false;
	this.setDebugMode = function(b) {
		_debugMode = Boolean(b);
		soundManager.debugMode = _debugMode;
	}
	this.getDebugMode = function() { return _debugMode; }
	this.log = function(s) {
		if (_debugMode) {
			console.log(s);
		}
	}
	
	this.initWithJSON = function(jsonData) {
      		// this.log(jsonData.gameTitle);
		
		// This isn't actually json yet. 
		this.questions = jsonData;
		this._itemOrder = shuffle(range(folksy.questions.length));

		$(document).ready(function() {
			loadImages();
			// TODO: should wait until images (and sound, if possible) are loaded
			$("#start_game").click(start_game);
			$("#switch_img").click(nextQuestion);
		});
		soundManager.onready(function() {
			loadAudios();
		});

		// Start loading images and stuff. 
		// Respect max_items.
	}

	this.initWithURL = function(url) {
		$(document).ready(function() {
	   		$.getJSON(url, this.initWithJSON);
		});
	}

	// Either we specify the game URL at the constructor, in which case things start to happen
	// immediately. Otherwise, the user calles initWithURL or initWithJSON directly.
	if (gameURL !== undefined) {
		this.initWithURL(gameURL);
	}
}

/* 
 * Example usage from HTML head:
 * 

  <script src="js/soundmanager2.js"></script>
  <script src="js/jquery-1.7.1.js"></script>
  <script src="folkesfolk.js"></script>
  <script type="text/javascript">
     $.ready(function() { new Folksy("mygame.json); }
  </script>
 
 */

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



