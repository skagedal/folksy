//
//   This file is part of Folksy, a framework for educational games.
//
//   Folksy is free software: you can redistribute it and/or modify
//   it under the terms of the GNU General Public License as published by
//   the Free Software Foundation, either version 3 of the License, or
//   (at your option) any later version.
//
//   Folksy is distributed in the hope that it will be useful,
//   but WITHOUT ANY WARRANTY; without even the implied warranty of
//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//   GNU General Public License for more details.
//
//   You should have received a copy of the GNU General Public License
//   along with Folksy.  If not, see <http://www.gnu.org/licenses/>.
//

/***********************************************************************
 * SETTINGS
 ***********************************************************************/

soundManager.url = '/simon/folkesfolk/swf/';		// HARDCODE

kortversion = false;
//kortversion = true;

/***********************************************************************
 * INTERNATIONALIZATION
 ***********************************************************************/

window.FolksyResources = {
	'en': {
		'loading_images':	'Loading images... (%(count)s of %(total)s)',
		'error_load_image':	"Couldn't load image file <tt>%(file)s</tt>. ",
		'error_report':		'Please report this error to <a href="mailto:simon@kagedal.org">Simon</a>.'
	},
	'sv': {
		'loading_images':	'Laddar bilder... (%(count)s av %(total)s)'
	}
}

function folksyGetResource(index, args) {
	var cascade = ['sv', 'en'];
	var res = window.FolksyResources;
	for (var i = 0; i < cascade.length; i++) { 
		var lang = cascade[i];
		if (index in res[lang]) {
			var fmt = res[lang][index];
			return args ? sprintf(fmt, args) : fmt;
		}
	}
	return null;
}

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

function randomInt(max_val) {
	// Return a random integer 0 <= i < max_val
	return Math.floor(Math.random() * max_val);
}

function randomPick(a, n) {
	// Returns one or many random element from an array.
	// If n is specified, return an array with `n` random uniquely indexed elements  from `a`
	// If n is not specified, return just one random element.

	if (typeof n === "undefined")
		return randomPick(a, 1)[0];
	return a.shuffle().slice(0, n);
}

function randomPickExcept(a, except) {
	return randomPick($.grep(a, function (el, i) { return el != except; }));
}

// From http://stackoverflow.com/questions/962802/is-it-correct-to-use-javascript-array-sort-method-for-shuffling
function shuffleInPlace(array) {
	// Shuffle an array in-place (i.e., mutate the array).
	var tmp, current, top = array.length;      
	if(top) 
		while(--top) {
			current = Math.floor(Math.random() * (top + 1));         
			tmp = array[current];         
			array[current] = array[top];         
			array[top] = tmp;     
		}      
	return array; 
} 

function shuffle(a) {
	// Returns a shuffled version of the array.
	return shuffleInPlace(a.slice(0));
}

function range(max) {
	a = [];
	for (var i = 0; i < max; i++) {
		a.push(i);
	}
	return a;
}

function setup_soundManager() {
	soundManager.debugMode = true;
	soundManager.useHTML5Audio = true;
	/*soundManager.preferFlash = false;
	soundManager.audioFormats = {
		'mp3': {
			'type': ['audio/mpeg; codecs="mp3"', 'audio/mpeg', 'audio/mp3', 'audio/MPA', 'audio/mpa-robust'],
			'required': false
		},
		'ogg': {
			'type': ['audio/ogg; codecs=vorbis'],
			'required': false
		}
	};*/
	
}

/***********************************************************************
 * THE FOLKSY CLASS 
 ***********************************************************************/

function Folksy(gameURL) {
	var folksy = this;
	var F_ = folksyGetResource;

	// Private items are marked with _. We make them "public" anyway, for ease of debugging .
	this.maxItems = 50;
	this._isInQuestion = false;
	this._isInClickReward = false;
	this._gameURL = null;
	this.itemOrder = []

	this.images = [];		// faces
	this.audios = [];		// corresponding sound

	this.letter_images = [];
	this.letter_select_images = [];

	this.animalImages = [];
	this.soundFXaudios = [];

	// TODO should come with the game 
	this.letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", 
			"N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", 
			"AA", "AE", "OE"];
	this.animals = ["cat", "monkey", "panda", "penguin", "pig", "sheep", "walrus"];
	this.soundFX = ["bra_jobbat", "ja_det_var_raett", "fel", "yippie"];

	this.questions = [];

	this.setMaxItems = function(n) {
		this._maxItems = Number(n);
	}

	this._loadImagesCount = 0;
	this._loadImagesTotal = 0;
	
	function loadImageError(event) {
		folksy.abortLoad(F_("error_load_image", {file: event.data}));
		folksy.log("Could not load " + event.data + "!");
	}

	this.loadImage = function(filename) {
		this._loadImagesTotal++;
		this.updateLoading();

		this.log("Let's load " + filename + "...");
		var img = new Image();

		$(img)
			.load(function() {
					$(this).hide();
					folksy._loadImagesCount++;
					folksy.updateLoading();
					folksy.log("Have now loaded " + filename);
				})
		
			.error(filename, loadImageError)
		
			.attr('src', filename);

		return img;
	}

	this._loadingAborted = false;	
	this.abortLoad = function(s) {
		if (!this._loadingAborted) {
			this._loadingAborted = true;
			s += F_("error_report");
			$("#info").append('<div class="error">' + s + '</div>');
		}
	}

	this.updateLoading = function() { 
		$("#img_count").text(String(this._loadImagesCount));
		$("#img_total").text(String(this._loadImagesTotal));
	}

	this.loadImages = function() {
		if (this._loadingAborted) return;

		var progress = sprintf(F_("loading_images"), {'count': '<span id="img_count"></span>',
							      'total': '<span id="img_total"></span>'});
		$("#load_progress").append(progress);
		this.updateLoading();

		for (var i = 0; i < this.questions.length; i++) {
			this.images.push(this.loadImage("images/" + this.questions[i] + ".jpg"));
		}

		for (var i = 0; i < this.letters.length; i++) {
			this.letter_images.push(this.loadImage("themes/sunset/letters/" + this.letters[i] + ".png"));
			this.letter_select_images.push(this.loadImage("themes/sunset/letters/" + this.letters[i] + "_select.png"));
		}

		for (var i = 0; i < this.animals.length; i++) {
			this.animalImages.push(this.loadImage("themes/sunset/rewards/images/" + this.animals[i] + ".png"));
		}
	}

	this.loadAudios = function() {
		if (this._loadingAborted) return;

		for (var i in this.questions) {
			var s = this.questions[i];
			var sound = soundManager.createSound({
				id: s,
				url: ['sound/' + s + '.mp3', 
				      'sound/' + s + '.ogg'],
				autoLoad: true});
			this.audios.push(sound);
		}
		for (var i in this.soundFX) {
			var s = this.soundFX[i];
			var sound = soundManager.createSound({
				id: s,
				url: ['themes/sunset/rewards/sound/' + s + '.mp3',
				      'themes/sunset/rewards/sound/' + s + '.ogg'],
				autoLoad: true});
			this.soundFXaudios.push(sound);
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

	function positiveReinforcement() {
		var reward = $("#reward");
		reward.css({top: 212, left: 212, width: 0, height: 0, opacity: 1.0});
		reward[0].src = randomPick(folksy.animalImages).src;
		reward.show();
		reward.animate({top: 62, left: 62, width: 300, height: 300}, 
			       function() { 
					folksy._isInClickReward = true; 
					soundManager.play(randomPick(["bra_jobbat", "ja_det_var_raett"]));
				});
		$("#tip").fadeIn();
	}
	function clickReward() {
		folksy.log("We here");
		if (folksy._isInClickReward) {
			folksy._isInClickReward = false;
			$("#tip").fadeOut();
			$("#reward").fadeOut(nextQuestion);
		}
	}

	function correctAnswer() {
		if (folksy._isInQuestion) {
			folksy._isInQuestion = false;
			soundManager.play("yippie");
			$("#wrong_answer").fadeOut();
			$("#correct_answer").animate({
				top: 28, 
				left: 28,
				width: 368,
				height: 368,
				opacity: 0.5},
				1000, function() {
					$("#face").fadeOut();
					$("#correct_answer").fadeOut(function() {
						$("#correct_answer").css({top: 424, width: 164, height: 164, opacity: 1.0});
						positiveReinforcement();
					});
				});
			folksy.log("Whoohooo!");
		}
	}

	function wrongAnswer() {
		if (folksy._isInQuestion) {
			// TODO: sound effect for wrong answer
			soundManager.play('fel');
			folksy.log("Wrong...");
		}
	}

//	this.currentItemNumber = null;		// index in questions
//	this.currentItemAnswer = 

	function nextQuestion() {
		if (folksy._itemOrder.length < 1) {
			alert("Bra jobbat!");
			return;
		}
		var q = folksy._itemOrder.shift();
		var answer = getAnswer(folksy.questions[q]);
		var answer_i = folksy.letters.indexOf(answer);
		var wrongAnswer = randomPickExcept(folksy.letters, answer);
		var wrongAnswer_i = folksy.letters.indexOf(wrongAnswer);

		playSound(folksy.audios[q]);

		// Set up face
		folksy.current_image = folksy.images[q];
		$("#face")[0].src = folksy.current_image.src;
		$("#face").fadeIn();		

		// Set up letters
		var correct_image = folksy.letter_images[answer_i];
		var correct_image_select = folksy.letter_select_images[answer_i];
		var wrong_image = folksy.letter_images[wrongAnswer_i];
		var wrong_image_select = folksy.letter_select_images[wrongAnswer_i];	

		var x_position = shuffle(["28px", "232px"]);
		$("#correct_answer").css({left: x_position[0]});
		$("#wrong_answer").css({left: x_position[1]});
		$("#correct_answer")[0].src = correct_image.src;
		$("#wrong_answer")[0].src = wrong_image.src;
		$("#correct_answer").hover(function () { this.src = correct_image_select.src; },
					   function () { this.src = correct_image.src; });
		$("#wrong_answer").hover  (function () { this.src = wrong_image_select.src; },
					   function () { this.src = wrong_image.src; });
		$(".answers").fadeIn();
		folksy._isInQuestion = true;
	}

	function start_game() {
		$("#correct_answer").click(correctAnswer);
		$("#wrong_answer").click(wrongAnswer);
		$("#reward").click(clickReward);
		$("#intro").slideUp("slow", function() { 
			$("#game").fadeIn("slow", nextQuestion); 	
		});
	}

	var _debugMode = true;
	this.setDebugMode = function(b) {
		_debugMode = Boolean(b);
		//soundManager.debugMode = _debugMode;
	}
	this.getDebugMode = function() { return _debugMode; }
	this.log = function(s) {
		if (_debugMode) {
			if (typeof console !== "undefined" && typeof (console.log) !== "undefined")
				console.log(s);
		}
	}
	
	this.initWithJSON = function(jsonData) {
      		// this.log(jsonData.gameTitle);
		
		// As of yet, this JSON data is just an array of question id:s. 
		this.questions = jsonData;
		this._itemOrder = shuffle(range(folksy.questions.length));

		$(document).ready(function() {
			// TODO> Respect max_items.
			folksy.loadImages();
			// TODO: should wait until images (and sound, if possible) are loaded
			$("#start_game").click(start_game);
			$("#switch_img").click(nextQuestion);
		});
		soundManager.onready(function() {
			folksy.loadAudios();
		});

		// Start loading images and stuff. 
		// 
	}

	this.initWithURL = function(url) {
		$(document).ready(function() {
	   		$.getJSON(url, this.initWithJSON);
		});
	}

	setup_soundManager();

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

setup_soundManager();
folksy = new Folksy();
folksy.setDebugMode(true);
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



