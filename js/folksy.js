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
	    if (typeof console !== "undefined" && 
		typeof (console.log) !== "undefined") {
		console.log(s);
	    }
	}
    }

/***********************************************************************
 * THE GAME CLASS
 ***********************************************************************/

    function Game(gameURL) {

	// Private items are marked with _. 
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

	// Either we specify the game URL at the constructor, in which
	// case things start to happen immediately. Otherwise, the
	// user calles initWithURL or initWithJSON directly.

	if (gameURL !== undefined) {
	    this.initWithURL(gameURL);
	}
    }

    function loadImageError(event) {
	var game = event.data.game;
	game.abortLoad(F_("error_load_image", {file: event.data.filename}));
	log("Could not load " + event.data.filename + "!");
    }

    function loadImage(game, filename) {
	game._loadImagesTotal++;
	updateLoading(game);

	//log("Let's load " + filename + "...");
	var img = new Image();

	$(img)
	    .load(function() {
		$(this).hide();
		game._loadImagesCount++;
		updateLoading(game);
	    })
		
	    .error({filename: filename, game: game}, loadImageError)
		
	    .attr('src', filename);

	return img;
    }

    function abortLoad(game, s) {
	if (!game._loadingAborted) {
	    game._loadingAborted = true;
	    s += F_("error_report");
	    showError(game, s);
	}
    }

    function updateLoading(game) { 
	$("#img_count").text(String(game._loadImagesCount));
	$("#img_total").text(String(game._loadImagesTotal));
	if (game._loadImagesCount == game._loadImagesTotal) {
	    log("Run!");
	    $("#start_game").click(start_game).show();
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
    }

    function loadRewards(game) {
	if (game._loadingAborted) return;
	
	for (var i = 0; i < game.animals.length; i++) {
	    var filename = "themes/sunset/rewards/images/" + 
		game.animals[i] + ".png";
	    game.animalImages.push(loadImage(game, filename));
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
    }

    function loadGameData(game) {
	if (game._loadingAborted) return;

	var progress = sprintf(F_("loading_images"), 
			       {'count': '<span id="img_count"></span>',
				'total': '<span id="img_total"></span>'});
	$("#load_progress").append(progress);
	game.updateLoading();

	loadStimuli(game);
	loadRewards(game);
    }


    function playSound(audio) {
	audio.play();
    }

    function positiveReinforcement(game) {
	var reward = $("#reward");
	reward.css({top: 212, left: 212, width: 0, height: 0, opacity: 1.0});
	reward[0].src = util.pickOneRandom(game.animalImages).src;
	reward.show();
	reward.animate({top: 62, left: 62, width: 300, height: 300}, 
		       function() { 
			   game._isInClickReward = true; 
			   soundManager.play(util.pickOneRandom(["bra_jobbat", "ja_det_var_raett"]));
		       });
	$("#tip").fadeIn();
    }

    function clickReward(game) {
	log("We here");
	if (game._isInClickReward) {
	    game._isInClickReward = false;
	    $("#tip").fadeOut();
	    $("#reward").fadeOut(function() { nextQuestion(game); });
	}
    }

    function correctAnswer(game) {
	if (game._isInQuestion) {
	    game._isInQuestion = false;
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
			positiveReinforcement(game);
		    });
		});
	    log("Whoohooo!");
	}
    }

    function wrongAnswer(game) {
	if (game._isInQuestion) {
	    soundManager.play('fel');
	}
    }

    function hoverComparisonImageIn() {
	var stimulus = $(this).data('stimulus');
	this.src = stimulus.imageSelect.src;
    }

    function hoverComparisonImageOut() {
	var stimulus = $(this).data('stimulus');
	this.src = stimulus.image.src;
    }

    function setupComparisonImage(game, index, stimulus) {
	var image = game._comparisonImages[index];
	if (!image) {
	    image = new Image();
	    $(image).addClass('answers');
	    $(image).click(function () { clickComparisonImage(game, i); });
	    $(image).hover(hoverComparisonImageIn, hoverComparisonImageOut);
	    $("#game").append(image);
	    game._comparisonImages[index] = image;
	}
	$.data(image, 'stimulus', stimulus)
    }

    function nextQuestion(game) {
	if (game._itemOrder.length < 1) {
	    alert("Bra jobbat!");
	    return;
	}

	game.logic.next();
	var sampleStimulus = game.logic.getSampleStimulus();
	var comparisonStimuli = game.logic.getComparisonStimuli();

	if (sampleStimulus.hasOwnProperty('sound'))
	    playSound(sampleStimulus.sound);
	
	// Set up face (sample stimulus)
	game.current_image = sampleStimulus.image;
	$("#face")[0].src = game.current_image.src;
	$("#face").fadeIn();		
	
	// Set up letters (comparison stimuli)
	uiInitComparisonImages(comparisonStimuli.length);
	for (var i = 0; i < comparisonStimuli.length; i++) {
	    setupComparisonImage(game, i, comparisonStimuli[i]);
	}

	layout.layout();

	$(".answers").fadeIn();
	game._isInQuestion = true;
    }

    function start_game(game) 
	$("#correct_answer").click(function () { correctAnswer(game); });
	$("#wrong_answer").click(function () { wrongAnswer(game); });
	$("#reward").click(function () { clickReward(game); });
	$("#intro").slideUp("slow", function() { 
	    $("#game").fadeIn("slow", fnextQuestion); 	
	});
    }

  
    
    function showError(s) {
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

