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

// Module

folksy = (function () {

// Constants

    // Since all URLs should be specified in the game json anyway,
    // let's use this hack for now.
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
    }
    
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
	// These things should come with the game.
	this.animals = ["cat", "monkey", "panda", "penguin", 
			"pig", "sheep", "walrus"];
	this.animalImages = [];
	this.soundFX = ["bra_jobbat", "ja_det_var_raett", "fel", "yippie"];
	this.soundFXaudios = [];
    
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

	// Enable "Run" button
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
            stimulus.sound = soundManager.createSound({
                id: stimulus.id,
                url: stimulus.sound_srcs,
                autoLoad: true
            });
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
	if (game._loadingAborted) return;
	
	for (var i = 0; i < game.animals.length; i++) {
	    var filename = HREF_PREFIX + "modules/cute-rewards/images/" + 
		game.animals[i] + ".png";
	    game.animalImages.push(loadImage(game, filename));
	}

	for (var i in game.soundFX) {
	    var s = game.soundFX[i];
	    var sound = soundManager.createSound({
		id: s,
		url: [HREF_PREFIX + 'modules/cute-rewards/sound/' + s + '.mp3',
		      HREF_PREFIX + 'modules/cute-rewards/sound/' + s + '.ogg'],
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
	updateLoading(game);

	loadStimuli(game);
	loadRewards(game);
	game._imageRequestsSent = true;
    }


    function playSound(audio) {
	audio.play();
    }

    function positiveReinforcement(game) {
	var reward = game.$reward;
	reward.css({top: 212, left: 212, width: 0, height: 0, opacity: 1.0});
	reward[0].src = util.pickOneRandom(game.animalImages).src;
	reward.show();
	reward.animate({top: 62, left: 62, width: 300, height: 300}, 
		       function() { 
			   game._isInClickReward = true; 
			   soundManager.play(util.pickOneRandom([
			       "bra_jobbat", "ja_det_var_raett"]));
		       });
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
	    soundManager.play("yippie");
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

	    log("Whoohooo!");
	}
    }

    function incorrectAnswer(game) {
	if (game._isInQuestion) {
	    soundManager.play('fel');
	}
    }

    function clickComparisonImage() {
	var stimulus = $(this).data('stimulus');
	var game = $(this).data('game');
	
	if (game.logic.respond(stimulus.fullID) == gamelogic.CORRECT) {
	    correctAnswer(game, this);
	} else {
	    incorrectAnswer(game);
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
	$.data(image, 'stimulus', stimulus)
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
	    'z-index': '1',
	    'position': 'absolute'});
	game.$comparisons = [];
	for (var i = 0; i < MAX_COMPARISON_STIMULI; i++) {
	    game.$comparisons[i] = $('<img />')
		.css({
		    'display': 'none',
		    'z-index': '1',
		    'position': 'absolute',
		    'cursor': 'pointer'})
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
		'z-index': '2',
		'position': 'absolute',
		'cursor': 'pointer'})
	    .click(clickReward.bind(null, game));
	game.$gameDiv = $(game._gameDiv);
	game.$gameDiv.append(game.$prompt,
			     domComparisons,
			     game.$reward);
    }

    function placeJQuery(x, y, width, height) {
	layout.PlaceableBox.prototype.place.call(this, x, y, width, height);
	console.log("Placing object at ", x, y, width, height);
	this.data.css({left: x,
		       top: y,
		       width: width,
		       height: height});

    }

    // Connect a jQuery'd image and a stimulus and a put it in a 
    // placeable box. 
    function connectAndBoxStimulus($img, stimulus) {
	var box;
	$img[0].src = stimulus.image.src;
	$img.data('stimulus', stimulus);
	box = new layout.PlaceableBox(stimulus.width,
				      stimulus.height,
				      $img);
	box.place = placeJQuery;
	return box;
    }

    // Run whenever we need to redo layout, on new question, on window resize...
    function layoutGame(game) {
	var gameBox, promptBox, comparisonBoxes;
	var gameWidth = game.$gameDiv.width();
	var gameHeight = game.$gameDiv.height();

	gameBox = new layout.Box(0, 0, gameWidth, gameHeight);

	// Set up prompt stimulus
	promptBox = connectAndBoxStimulus(game.$prompt,
					  game.promptStimulus);
	
	// Set up comparison stimuli
	comparisonBoxes = [];
	for (var i = 0; i < game.comparisonStimuli.length; i++) {
	    comparisonBoxes.push(connectAndBoxStimulus(
		game.$comparisons[i],
		game.comparisonStimuli[i]));
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

	if (game.promptStimulus.hasOwnProperty('sound'))
	    playSound(game.promptStimulus.sound);
	
	layoutGame(game);

	game.$prompt.fadeIn();		
	game.$activeComparisons.forEach(function (c) { c.fadeIn(); });
	game._isInQuestion = true;
    }

    function startGame(game) {
	$("#intro").slideUp("slow", function() { 
	    $("#game").fadeIn("slow", nextQuestion.bind(null, game)); 	
	});
    }

  
    
    function showError(s) {
	$("#info").append('<div class="error">' + s + '</div>');
    }
    
    Game.prototype.initWithJSON = function(jsonData) {
	var game = this;
	if (jsonData.format > 1 ||
	    jsonData.gametype != "whatletter" ||
	    jsonData.gametype_format > 1) {
	    this.showError(F_(error_format));
	    return;
	}
	this.stimulusSets = jsonData.stimulus_sets;
	this.relations = jsonData.relations;
	log("The name of the game: " + jsonData.name);

	// We should use content negotiation for this. But, for now.
	initResources(jsonData.lang || "en");

	if (this.stimulusSets.length !== 2 || this.relations.length !== 1) {
	    this.showError(F_(error_format));
	    return;
	}	    

	this.stimulusSets.forEach(setFullStimulusIdentifiers);
	var setA = getStimulusIdentifiers(this.stimulusSets[0]);
	var setB = getStimulusIdentifiers(this.stimulusSets[1]);
	var pairs = getRelationPairs(this.relations[0]);

	this.logic = new gamelogic.SimpleGameLogic(setA, setB, pairs, {
	    // comparison_stimuli: 4
	});
	
	$(document).ready(function() {
            soundManager.onready(function() {
		createElements(game);
		loadGameData(game);
            });
	});
	
    }

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
    }

    // Module exports
    return {
	getResource: getResource,
	setupSoundManager: setupSoundManager,
	setDebugMode: setDebugMode,
	Game: Game
    };

})();

