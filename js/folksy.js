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
    var F_ = getResource;
    
    // TODO: something like this instead:
    // function getResourceGetter(locale) { 
    //   return function(index, args) { 
    //     return getResourceForLocale(locale, index, args); 
    //   }; 
    // }

    function setupSoundManager() {
	soundManager.useHTML5Audio = true;
    }

// Module helpers

    var _debugMode = true;
    function setDebugMode(b) {
	_debugMode = Boolean(b);
	//soundManager.debugMode = _debugMode;
    }
    
    function log(s) {
	if (_debugMode) {
	    if (typeof console !== "undefined" && typeof (console.log) !== "undefined")
		console.log(s);
	}
    }

/***********************************************************************
 * THE GAME CLASS
 ***********************************************************************/

    function Game(gameURL) {

	// Private items are marked with _. We make them "public" anyway, for ease of debugging .
	this._isInQuestion = false;
	this._isInClickReward = false;
	this._gameURL = null;

	// These things should come with the game.
	this.animals = ["cat", "monkey", "panda", "penguin", "pig", "sheep", "walrus"];
	this.animalImages = [];
	this.soundFX = ["bra_jobbat", "ja_det_var_raett", "fel", "yippie"];
	this.soundFXaudios = [];
    
	// For showing progress
	this._loadImagesCount = 0;
	this._loadImagesTotal = 0;

	this._loadingAborted = false;	

	folksy.setupSoundManager();

	// Either we specify the game URL at the constructor, in which case things start to happen
	// immediately. Otherwise, the user calles initWithURL or initWithJSON directly.
	if (gameURL !== undefined) {
	    this.initWithURL(gameURL);
	}
    }

    // gah, fixme
    function loadImageError(event) {
	that.abortLoad(F_("error_load_image", {file: event.data}));
	log("Could not load " + event.data + "!");
    }

    Game.prototype.loadImage = function(filename) {
	this._loadImagesTotal++;
	this.updateLoading();

	//log("Let's load " + filename + "...");
	var img = new Image();

	$(img)
	    .load(function() {
		$(this).hide();
		//log("Have now loaded " + filename);
		that._loadImagesCount++;
		that.updateLoading();
	    })
		
	    .error(filename, loadImageError)
		
	    .attr('src', filename);

	return img;
    }

    Game.prototype.abortLoad = function(s) {
	if (!this._loadingAborted) {
	    this._loadingAborted = true;
	    s += F_("error_report");
	    this.showError(s);
	}
    }

    Game.prototype.updateLoading = function() { 
	$("#img_count").text(String(this._loadImagesCount));
	$("#img_total").text(String(this._loadImagesTotal));
	if (this._loadImagesCount == this._loadImagesTotal) {
	    log("Run!");
	    $("#start_game").click(start_game).show();
	    $("#switch_img").click(nextQuestion);
	}
    }

    function loadStimulus(game, stimulus) {
        function loadIm(imgProp, srcProp) {
            if (stimulus.hasOwnProperty(srcProp)) {
                stimulus[imgProp] = game.loadImage(stimulus[srcProp]);
            }
        }
        loadIm("image", "image_src");
        loadIm("imageSelect", "image_select_src");
    
        if(stimulus.hasOwnProperty("sound_srcs")) {
            stimulus.sound = soundManager.createSound({
                id: stimulus.id,
                url: stimulus.sound_srcs,
                autoLoad: true
            });
        }
    }


    function loadStimuli(game) {
   for (var i = 0; i < game.stimulusSets; i++) {
        var set = game.stimulusSets[i];
        for (var j = 0; j < set.stimuli.length; j++) {
            loadStimulus(game, set.stimuli[j]);
        }
    }


    function loadRewards(game) {
	if (this._loadingAborted) return;
	
	for (var i = 0; i < game.animals.length; i++) {
	    game.animalImages.push(this.loadImage("themes/sunset/rewards/images/" + game.animals[i] + ".png"));
    }

	for (var i in game.soundFX) {
	    var s = game.soundFX[i];
	    var sound = soundManager.createSound({
		id: s,
		url: ['themes/sunset/rewards/sound/' + s + '.mp3',
		      'themes/sunset/rewards/sound/' + s + '.ogg'],
		autoLoad: true});
	    game.soundFXaudios.push(sound);
	}
    
    function loadGameData(game) {
	if (game._loadingAborted) return;

	var progress = sprintf(F_("loading_images"), {'count': '<span id="img_count"></span>',
						      'total': '<span id="img_total"></span>'});
	$("#load_progress").append(progress);
	game.updateLoading();

    loadStimuli(game);
    loadRewards(game);
    }


    Game.prototype.playSound = function(audio) {
	//	audio.currentTime = 0;
	audio.play();
    }

    Game.prototype.positiveReinforcement = function() {
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

    // FIXME
    function clickReward() {
	log("We here");
	if (that._isInClickReward) {
	    that._isInClickReward = false;
	    $("#tip").fadeOut();
	    $("#reward").fadeOut(nextQuestion);
	}
    }

    // FIXME
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
		opacity: 0.5}, 1000, function() {
		    $("#face").fadeOut();
		    $("#correct_answer").fadeOut(function() {
			$("#correct_answer").css({top: 424, width: 164, height: 164, opacity: 1.0});
			positiveReinforcement();
		    });
		});
	    log("Whoohooo!");
	}
    }

    // FIXME
    function wrongAnswer() {
	if (that._isInQuestion) {
	    soundManager.play('fel');
	}
    }

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

    function start_game(game) 
	$("#correct_answer").click(function () { correctAnswer(game); });
	$("#wrong_answer").click(function () { wrongAnswer(game); });
	$("#reward").click(function () { clickReward(game); });
	$("#intro").slideUp("slow", function() { 
	    $("#game").fadeIn("slow", fnextQuestion); 	
	});
    }

  
    

    this.showError = function(s) {
	$("#info").append('<div class="error">' + s + '</div>');
    }
    
    Game.prototype.initWithJSON = function(jsonData) {
    var game = this;
	log("initWithJSON");
      	// log(jsonData.gameTitle);
	if (jsonData.format > 1 ||
	    jsonData.gametype != "whatletter" ||
	    jsonData.gametype_format > 1) {
	    this.showError(F_(error_format));
	    return;
	}
    this.stimulusSets = jsonData.stimulus_sets;
    this.relations = jsonData.relations;
    // FIXME above in python
	log("The name of the game: " + jsonData.name);
	
	$(document).ready(function() {
        soundManager.onready(function() {
            loadGameData(game);
        });
	});
	
    }

    Game.prototype.initWithURL = function(url) {
	log("initWithURL: " + url);

        var game = this;
	$(document).ready(function() {
	    log("ready");
	    $.getJSON(url)
		.success(function (data, textStatus, jqXHR) {
		    game.initWithJSON(data);
		})
		.error(function (jqXHR, textStatus, errorThrown) {
		    game.showError(url + "<p>" + errorThrown + "</p>");
		});
	    
	});
    }

    // Module exports
    return {
	getResource: getResource,
	setupSoundManager: setupSoundManager,
	Game: Game
    };

})();

