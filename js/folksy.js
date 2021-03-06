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

// DOM globals
/*global Image */

// Other vendor globals
/*global createjs, jQuery, $, sprintf */

// Other Folksy modules
/*global util, gamelogic, layout */

// This module
/*global folksy */

//
// jQuery plugin: make images undraggable and unselectable
//
(function($){
    $.fn.disableDragAndSelect = function() {
	return this
	    .on('dragstart', function(event) {
		event.preventDefault();
	    })
	    .css({
		"-moz-user-select": "none",
		"-khtml-user-select": "none",
		"-webkit-user-select": "none",
		"-ms-user-select": "none",
		"user-select": "none"
	    })
	    .attr("unselectable", "on"); // old IE
    };
})(jQuery);

//
// The main folksy module
//
folksy = (function () {

    // Constants

    // Temporary hack
    var HREF_PREFIX = "/simon/folksy/";

    var MAX_COMPARISON_STIMULI = 8;

    // Internationalization

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

	    // Fallback language for as of yet untranslated entries
	    '_FALLBACK_': 'en'
	}
    };
    
    var resources;

    // TODO: should handle complex language tags. See:
    // http://www.w3.org/International/articles/language-tags/
    function loadResources(lang) {
	if (lang in RESOURCES) {
	    var langRes = RESOURCES[lang];
	    if ('_FALLBACK_' in langRes) {
		var fallback = langRes['_FALLBACK_'];
		var fallbackRes = loadResources(fallback);
		langRes = util.mergeObjects(langRes, fallbackRes);
		delete langRes['_FALLBACK_'];
	    }
	    return langRes;
	} else {
	    return loadResources('en');
	}	
    }

    function initResources(lang) {
	resources = loadResources(lang);
    }

    function getResource(index, args) {
	if (index in resources) {
	    var fmt = resources[index];
	    return args ? sprintf(fmt, args) : fmt;
	}
	return null;
    }
    var F_ = getResource;	
    
// Sound

    function setupSoundManager() {
	// createjs.WebAudioPlugin
        // createjs.FlashPlugin.BASE_PATH = "../swf/"
	createjs.Sound.registerPlugins([
	    createjs.WebAudioPlugin, 
	    createjs.HTMLAudioPlugin /*,
	    createjs.FlashPlugin */]);
        createjs.Sound.alternateExtensions = ["mp3"];
    }

    // Loads a sound resource. "sources" is a list of sources.  We're now
    // using SoundJS, which does not allow multiple alternate sources,
    // so we find the ogg resource if available and set up soundjs to
    // fallback on mp3 file with the same name but different extension.
    //
    // Returns a "details" object. has id as "id".
    function createSound(uniqueId, sources) {
	if (sources.length < 1) {
	    log("createSound: no sources given");
	    return null;
	};
	var src = sources[0], i;
	for (i = 1; i < sources.length; i++) {
	    if (util.getExtension(sources[i]) === "ogg")
		src = sources[i];
	}
	return createjs.Sound.registerSound(src, uniqueId);
    }

    function playSound(sound) {
	createjs.Sound.stop();
	createjs.Sound.play(sound.id);
    }



// Module helpers

    var _debugMode = true;
    function setDebugMode(b) {
	_debugMode = Boolean(b);
    }
    
    function log(s) {
	if (_debugMode) {
	    if (typeof console !== "undefined" && 
		typeof (console.log) !== "undefined") {
		console.log(s);
	    }
	}
    }

// HTML helpers

    function isElement(obj) {
	return !!(obj && obj.nodeType == 1);
    };

    function isElementOfType(obj, type) {
	if (!util.isString(type))
	    throw new TypeError(
		'second argument to isElementOfType should be a string');
	return isElement(obj) && 
	    obj.nodeName.toLowerCase() === type.toLowerCase();
    }

// The Game class

    function Game(gameDiv, gameURL) {

	// Private items are marked with _.
	this._isInQuestion = false;
	this._isInClickReward = false;
	this._gameURL = null;
        this._gameDiv = gameDiv;
        if (!isElementOfType(gameDiv, 'div'))
            throw new TypeError('gameDiv argument is not a div');
    
	// For showing progress
	this._loadImagesCount = 0;
	this._loadImagesTotal = 0;
	this._imageRequestsSent = false;

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

    function onLoaded(game) {
	// Save original dimensions of images
	forEachStimulus(game, function (stim) {
	    if (stim.image) {
		stim.width = stim.image.width;
		stim.height = stim.image.height;
	    }
	});

	// Hide load progress, enable "Run" button
	$("#load_progress").hide();
	$("#start_game").click(startGame.bind(null, game)).show();
    }

    function updateLoading(game) { 
	$("#img_count").text(String(game._loadImagesCount));
	$("#img_total").text(String(game._loadImagesTotal));
	if (game._imageRequestsSent && 
	    game._loadImagesCount == game._loadImagesTotal) {
	    onLoaded(game);
	}
    }

    function loadStimulus(game, stimulus) {
        function loadIm(imgProp, srcProp) {
            if (stimulus.hasOwnProperty(srcProp)) {
                stimulus[imgProp] = loadImage(game, stimulus[srcProp]);
            }
        }
        loadIm("image", "image_src");
        loadIm("imageSelect", "image_select_src");
    
        if(stimulus.hasOwnProperty("sound_srcs")) {
            stimulus.sound = createSound(stimulus.id, stimulus.sound_srcs);
        }
    }


    function loadStimuli(game) {
	for (var i = 0; i < game.stimulusSets.length; i++) {
            var set = game.stimulusSets[i];
            for (var j = 0; j < set.stimuli.length; j++) {
		loadStimulus(game, set.stimuli[j]);
            }
	}
    }

    function loadRewards(game) {
	var i;
	if (game._loadingAborted) return;

	for (i = 0; i < game.rewards.images.length; i++) {
	    var image = game.rewards.images[i];
	    var filename = HREF_PREFIX + image.image_src;
	    image.image = loadImage(game, filename);
	}
	for (i = 0; i < game.rewards.sounds.length; i++) {
	    var sound = game.rewards.sounds[i];
	    for (var j = 0; j < sound.sound_srcs.length; j++) {
		sound.sound_srcs[j] = HREF_PREFIX + sound.sound_srcs[j];
	    }
	    sound.sound = createSound(sound.sound_srcs[0], sound.sound_srcs);

	}
    }

    // Starts loading of all the game data
    function loadGameData(game) {
	if (game._loadingAborted) return;

	var progress = sprintf(F_("loading_images"), 
			       {'count': '<span id="img_count"></span>',
				'total': '<span id="img_total"></span>'});
	$("#load_progress").append(progress);
	updateLoading(game);

	loadStimuli(game);
	loadRewards(game);
	game._imageRequestsSent = true;
    }


    function rewardImages(game) {
	return util.pluck(game.rewards.images, 'image');
    }

    function rewardSounds(game) {
	return util.pluck(game.rewards.sounds, 'sound');
    }

    function positiveReinforcement(game) {
	var reward = game.$reward;
	reward.css({top: 212, left: 212, width: 0, height: 0, opacity: 1.0});
	reward[0].src = util.pickOneRandom(rewardImages(game)).src;
	reward.show();
	reward.animate({top: 62, left: 62, width: 300, height: 300}, 
		       function() { 
			   game._isInClickReward = true; 
		       });
	playSound(util.pickOneRandom(rewardSounds(game)));
	$("#tip").fadeIn();
    }

    function clickReward(game) {
	log("We here");
	if (game._isInClickReward) {
	    game._isInClickReward = false;
	    $("#tip").fadeOut();
	    game.$reward.fadeOut(function() { nextQuestion(game); });
	}
    }

    function correctAnswer(game, correctImage) {
	if (game._isInQuestion) {
	    var uiCorrectImage = $(correctImage);
	    game._isInQuestion = false;
	    game.$activeComparisons.forEach(function ($image) {
		if ($image[0] !== correctImage)
		    $image.fadeOut();
	    });
	    uiCorrectImage.animate({
		top: game.$prompt.css('top'), 
		left: game.$prompt.css('left'),
		width: game.$prompt.css('width'),
		height: game.$prompt.css('height'),
		opacity: 0.5}, 1000, function() {
		    game.$prompt.fadeOut();
		    uiCorrectImage.fadeOut(function () {
			uiCorrectImage.css({opacity: 1.0});
			positiveReinforcement(game);
		    });
		});
	}
    }

    function incorrectAnswer(game, clickedImage) {
	if (game._isInQuestion) {
	    var stimulus = $(clickedImage).data('stimulus');
	    game.alreadyTried.push(stimulus.fullID);
	    $(clickedImage)
		.css({
		    "z-index": 5
		})
		.animate({
		    opacity: 0,
		    transform: "translate(20px, 70px) rotate(20deg) scale(0.1)"
		}, function() { $(this).hide(); });
	    layoutGame(game, true);
	}
    }

    function clickComparisonImage() {
	var stimulus = $(this).data('stimulus');
	var game = $(this).data('game');
	
	if (game.logic.respond(stimulus.fullID) == gamelogic.CORRECT) {
	    correctAnswer(game, this);
	} else {
	    incorrectAnswer(game, this);
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

    function setFullStimulusIdentifiers(stimulusSet) {
	stimulusSet.stimuli.forEach(function (stim) {
	    stim.fullID = stimulusSet.id + ":" + stim.id;
	});
    }
    
    function getStimulusIdentifiers(stimulusSet) {
	return util.pluck(stimulusSet.stimuli, 'fullID');
    }

    function getRelationPairs(relation) {
	return relation.pairs.map(function (pair) {
	    return [relation["A"] + ":" + pair["A"],
		    relation["B"] + ":" + pair["B"]];
	});
    }

    function getStimulusSetById(game, id) {
	for (var i = 0; i < game.stimulusSets.length; i++) {
	    if (game.stimulusSets[i].id === id) 
		return game.stimulusSets[i];
	}
	return null;
    }

    function getStimulusById(stimulusSet, id) {
	for (var i = 0; i < stimulusSet.stimuli.length; i++) {
	    if (stimulusSet.stimuli[i].id === id)
		return stimulusSet.stimuli[i];
	}
	return null;
    }

    function getStimulusByFullId(game, fullId) {
	var id = fullId.split(":");
	var set = getStimulusSetById(game, id[0]);
	return getStimulusById(set, id[1]);
    }

    function getStimuliByFullId(game, fullIds) {
	return fullIds.map(getStimulusByFullId.bind(null, game));
    }				

    function forEachStimulus(game, fun) {
	game.stimulusSets.forEach(function (set) {
	    set.stimuli.forEach(fun);
	});
    }

    // Create all the DOM elements (keep as jQuery objects for convenience)
    function createElements(game) {
	console.log("Creating elements.");
        game.$prompt = $('<img />').css({
	    'display': 'none',
	    'z-index': '10',
	    'position': 'absolute'})
	    .disableDragAndSelect();

	game.$comparisons = [];
	for (var i = 0; i < MAX_COMPARISON_STIMULI; i++) {
	    game.$comparisons[i] = $('<img />')
		.css({
		    'display': 'none',
		    'z-index': '10',
		    'position': 'absolute',
		    'cursor': 'pointer'})
		.disableDragAndSelect()
		.click(clickComparisonImage)
		.hover(hoverComparisonImageIn, hoverComparisonImageOut)
		.data('game', game);
	}
	var domComparisons = game.$comparisons.map(function (jqObj) {
	    return jqObj[0];
	});
	game.$reward = $('<img />')
	    .css({
		'display': 'none',
		'z-index': '20',
		'position': 'absolute',
		'cursor': 'pointer'})
	    .disableDragAndSelect()
	    .click(clickReward.bind(null, game));
	game.$gameDiv = $(game._gameDiv);
	game.$gameDiv.append(game.$prompt,
			     domComparisons,
			     game.$reward);
    }

    // method is either "css" or "animate"
    function placeWithMethod(method) {
	return (function(x, y, width, height) {
	    layout.PlaceableBox.prototype.place.call(this, x, y, 
						     width, height);
	    this.data
		.css({opacity: 1.0,
		      transform: "",
		      "z-index": 10})
		.show()
	        [method]({left: x,
			  top: y,
			  width: width,
			  height: height});
	});
    }
    var placeWithCSS = placeWithMethod("css");
    var placeWithAnimate = placeWithMethod("animate");

    // Connect a jQuery'd image and a stimulus and a put it in a 
    // placeable box. 
    function connectAndBoxStimulus($img, stimulus, animate) {
	var box;
	$img[0].src = stimulus.image.src;
	$img.data('stimulus', stimulus);
	box = new layout.PlaceableBox(stimulus.width,
				      stimulus.height,
				      $img);
	box.place = animate ? placeWithAnimate : placeWithCSS;
	return box;
    }

    // Run whenever we need to redo layout, on new question, on window resize...
    function layoutGame(game, animate) {
	var gameBox, promptBox, comparisonBoxes;
	var gameWidth = game.$gameDiv.width();
	var gameHeight = game.$gameDiv.height();
	if (typeof(animate) === "undefined")
	    animate = false;

	gameBox = new layout.Box(0, 0, gameWidth, gameHeight);

	// Set up prompt stimulus
	promptBox = connectAndBoxStimulus(game.$prompt,
					  game.promptStimulus,
					  animate);
	
	// Set up comparison stimuli
	comparisonBoxes = [];
	for (var i = 0; i < game.comparisonStimuli.length; i++) {
	    var stimulus = game.comparisonStimuli[i];
	    var fullID = stimulus.fullID;
	    if (game.alreadyTried.indexOf(fullID) === -1) {
		comparisonBoxes.push(connectAndBoxStimulus(
		    game.$comparisons[i],
		    game.comparisonStimuli[i],
		    animate));
	    }
	}
	game.$activeComparisons = 
	    game.$comparisons.slice(0, game.comparisonStimuli.length);

	layout.layoutMatchingGame(gameBox,
				  promptBox,
				  comparisonBoxes);
    }

    function nextQuestion(game) {
	var next = game.logic.next();

	game.promptStimulus = getStimulusByFullId(game, next[0]);
	game.comparisonStimuli = getStimuliByFullId(game, next[1]);
	game.alreadyTried = [];

	if (game.promptStimulus.hasOwnProperty('sound'))
	    playSound(game.promptStimulus.sound);
	
	layoutGame(game);

	game.$prompt.fadeIn();		
	game.$activeComparisons.forEach(function (c) { c.fadeIn(); });
	game._isInQuestion = true;
    }

    function startGame(game) {
	$("#credits").fadeOut();
	$("#intro").slideUp("slow", function() { 
	    $("#game").fadeIn("slow", nextQuestion.bind(null, game)); 	
	});
    }

  
    
    function showError(s) {
	$("#info").append('<div class="error">' + s + '</div>');
    }
    
    // Loads a game from JSON data that describes the resources.
    Game.prototype.initWithJSON = function(jsonData) {
	var game = this;
	game.jsonData = jsonData;
	if (jsonData.format > 1 ||
	    jsonData.gametype != "whatletter" ||
	    jsonData.gametype_format > 1) {
	    this.showError(F_("error_format"));
	    return;
	}
	this.stimulusSets = jsonData.stimulus_sets;
	this.rewards = jsonData.rewards;
	this.relations = jsonData.relations;
	log("The name of the game: " + jsonData.name);

	// We should use content negotiation for this. But, for now.
	initResources(jsonData.lang || "en");

	if (this.stimulusSets.length !== 2 || this.relations.length !== 1) {
	    this.showError(F_("error_format"));
	    return;
	}	    

	this.stimulusSets.forEach(setFullStimulusIdentifiers);
	var setA = getStimulusIdentifiers(this.stimulusSets[0]);
	var setB = getStimulusIdentifiers(this.stimulusSets[1]);
	var pairs = getRelationPairs(this.relations[0]);

	this.logic = new gamelogic.SimpleGameLogic(setA, setB, pairs, {
	    comparison_stimuli: 4
	});
	
	$(document).ready(function() {
	    createElements(game);
	    loadGameData(game);
	    $("#credits").append(jsonData.credits || '');
	});
	
    };

    // Loads a game. `url` is a an URL pointing to a JSON file
    // with the game description.
    Game.prototype.initWithURL = function(url) {
	log("initWithURL: " + url);

        var game = this;
	$(document).ready(function() {
	    $.getJSON(url)
		.success(function (data, textStatus, jqXHR) {
		    game.initWithJSON(data);
		})
		.error(function (jqXHR, textStatus, errorThrown) {
		    game.showError(url + "<p>" + errorThrown + "</p>");
		});
	    
	});
    };

    // Module exports
    return {
	getResource: getResource,
	setupSoundManager: setupSoundManager,
	setDebugMode: setDebugMode,
	Game: Game
    };

})();

