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
 * MODULE
 ***********************************************************************/

folksy = (function () {

/***********************************************************************
 * INTERNATIONALIZATION
 ***********************************************************************/

    var RESOURCES = {
	'en': {
	    'loading_images': 'Loading images... (%(count)s of %(total)s)',
	    'error_load_image': "Couldn't load image file <tt>%(file)s</tt>. ",
	    'error_report': 'Please report this error to ' +
		' <a href="mailto:simon@kagedal.org">Simon</a>.',
	    'error_format': "Can't read this game format."
	},
	'sv': {
	    'loading_images':	'Laddar bilder... (%(count)s av %(total)s)',

	    '_FALLBACK_': 'en'
	}
    }


    function getResource(index, args) {
	// Rewrite to use _FALLBACK_ 
	var cascade = ['sv', 'en'];
	var res = RESOURCES;
	console.log("getResource");
	console.log(res);
	for (var i = 0; i < cascade.length; i++) { 
	    var lang = cascade[i];
	    if (index in res[lang]) {
		var fmt = res[lang][index];
		return args ? sprintf(fmt, args) : fmt;
	    }
	}
	return null;
    }
    
    // TODO: something like this instead:
    // function getResourceGetter(locale) { 
    //   return function(index, args) { 
    //     return getResourceForLocale(locale, index, args); 
    //   }; 
    // }

    function setupSoundManager() {
	soundManager.useHTML5Audio = true;
    }

    // Module exports
    return {
	getResource: getResource,
	setupSoundManager: setupSoundManager
    };
})();


/***********************************************************************
 * THE FOLKSY CLASSES
 ***********************************************************************/

// This class holds the game data.
function FolksyGame(json) {
	this.id = json.id || "<noname>";
	this.name = json.name || "<noname>";
}

function Folksy(gameURL) {
	var that = this;
	var F_ = folksy.getResource;

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
		that.abortLoad(F_("error_load_image", {file: event.data}));
		that.log("Could not load " + event.data + "!");
	}

	this.loadImage = function(filename) {
		this._loadImagesTotal++;
		this.updateLoading();

		//this.log("Let's load " + filename + "...");
		var img = new Image();

		$(img)
			.load(function() {
					$(this).hide();
					//that.log("Have now loaded " + filename);
					that._loadImagesCount++;
					that.updateLoading();
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
			this.showError(s);
		}
	}

	this.updateLoading = function() { 
		$("#img_count").text(String(this._loadImagesCount));
		$("#img_total").text(String(this._loadImagesTotal));
		if (this._loadImagesCount == this._loadImagesTotal) {
			this.log("Run!");
			$("#start_game").show();
		}
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
		reward[0].src = _.pickRandom(that.animalImages).src;
		reward.show();
		reward.animate({top: 62, left: 62, width: 300, height: 300}, 
			       function() { 
					that._isInClickReward = true; 
					soundManager.play(_.pickRandom(["bra_jobbat", "ja_det_var_raett"]));
				});
		$("#tip").fadeIn();
	}
	function clickReward() {
		that.log("We here");
		if (that._isInClickReward) {
			that._isInClickReward = false;
			$("#tip").fadeOut();
			$("#reward").fadeOut(nextQuestion);
		}
	}

	function correctAnswer() {
		if (that._isInQuestion) {
			that._isInQuestion = false;
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
			that.log("Whoohooo!");
		}
	}

	function wrongAnswer() {
		if (that._isInQuestion) {
			// TODO: sound effect for wrong answer
			soundManager.play('fel');
			that.log("Wrong...");
		}
	}

//	this.currentItemNumber = null;		// index in questions
//	this.currentItemAnswer = 

	function nextQuestion() {
		if (that._itemOrder.length < 1) {
			alert("Bra jobbat!");
			return;
		}
		var q = that._itemOrder.shift();
		var answer = getAnswer(that.questions[q]);
		var answer_i = _.indexOf(that.letters, answer);
		var wrongAnswer = _.pickRandom(_.reject(that.letters, _.isEqualTo(answer)));
		var wrongAnswer_i = _.indexOf(that.letters, wrongAnswer);

		playSound(that.audios[q]);

		// Set up face
		that.current_image = that.images[q];
		$("#face")[0].src = that.current_image.src;
		$("#face").fadeIn();		

		// Set up letters
		var correct_image = that.letter_images[answer_i];
		var correct_image_select = that.letter_select_images[answer_i];
		var wrong_image = that.letter_images[wrongAnswer_i];
		var wrong_image_select = that.letter_select_images[wrongAnswer_i];	

		var x_position = _.shuffle(["28px", "232px"]);
		$("#correct_answer").css({left: x_position[0]});
		$("#wrong_answer").css({left: x_position[1]});
		$("#correct_answer")[0].src = correct_image.src;
		$("#wrong_answer")[0].src = wrong_image.src;
		$("#correct_answer").hover(function () { this.src = correct_image_select.src; },
					   function () { this.src = correct_image.src; });
		$("#wrong_answer").hover  (function () { this.src = wrong_image_select.src; },
					   function () { this.src = wrong_image.src; });
		$(".answers").fadeIn();
		that._isInQuestion = true;
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

	this.showError = function(s) {
		$("#info").append('<div class="error">' + s + '</div>');
	}
	
	this.initWithJSON = function(jsonData) {
		this.log("initWithJSON");
      		// this.log(jsonData.gameTitle);
		if (jsonData.format > 1 ||
		    jsonData.gametype != "whatletter" ||
		    jsonData.gametype_format > 1) {
			this.showError(F_(error_format));
			return;
		}
		this.log("The name of the game: " + jsonData.name);

		// As of yet, this JSON data is just an array of question id:s. 
		this.questions = jsonData;
		this._itemOrder = _.shuffle(_.range(that.questions.length));

		$(document).ready(function() {
			// TODO> Respect max_items.
			that.loadImages();
			// TODO: should wait until images (and sound, if possible) are loaded
			$("#start_game").click(start_game);
			$("#switch_img").click(nextQuestion);
		});
		soundManager.onready(function() {
			that.loadAudios();
		});

		// Start loading images and stuff. 
		// 
	}

	this.initWithURL = function(url) {
		that.log("initWithURL: " + url);
		 //this.initWithJSON
		$(document).ready(function() {
			that.log("ready");
	   		$.getJSON(url)
				.success(function (data, textStatus, jqXHR) {
					that.initWithJSON(data);
				})
				.error(function (jqXHR, textStatus, errorThrown) {
					that.showError(url + "<p>" + errorThrown + "</p>");
				});
			
		});
	}

	folksy.setupSoundManager();

	// Either we specify the game URL at the constructor, in which case things start to happen
	// immediately. Otherwise, the user calles initWithURL or initWithJSON directly.
	if (gameURL !== undefined) {
		this.initWithURL(gameURL);
	}
}


/* 
 * Example usage from HTML head - but use the folksyhtml.py templating instead; this is incomplete:
 * 

  <script src="js/soundmanager2.js"></script>
  <script src="js/jquery-1.7.1.js"></script>
  <script src="folkesfolk.js"></script>
  <script type="text/javascript">
     f = new Folksy("mygame.json");
  </script>
 
 */

