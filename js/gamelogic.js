// Module

gamelogic = (function () {
    var RelationPair = {
	stimulusA: {},
	stimulusB: {},
	pStrength: 1,
	introduced: false
    };

    // Smart game logic

    function GameLogic(game, params) {
	this.game = game;
	this.params = {
	    // Are the relation pairs all considered "introduced" already
	    // at game start?
	    introduceAll: params.introduceAll || false,

	    // Do we want to introduce new relation pairs in random order?
	    introduceRandomly: params.introduceRandomly || false,

	    // When "unlearned mass" falls below this value, teach new stuff.
	    // Use lower values for lower cognitive capacity (e.g., kids)
	    teachCutoff: params.teachCutoff || 4,

	    // Power p values with this when picking sample stimuli.
	    // Higher pickStrengthExponent --> 
	    //   well learned relation pairs less likely to appear again
	    pickStrengthExponent: params.pickStrengthExponent || 1
	}
	
	this.currentPair = null;
    }
    
    GameLogic.prototype.initGame = function () {
	this.game.relations[0].pairs.forEach(function (pair) {
	    pair.introduced = self.params.introduceAll;
	    pair.pStrength = 1;
	});
    };

    function unintroducedPairs(relation) {
	return relation.pairs.filter(function (pair) {
	    return pair.introduced === false;
	});
    }

    function introducedPairs(relation) {
	return relation.pairs.filter(function (pair) {
	    return pair.introduced === true;
	});
    }

    function weightGetter(strengthExponent) {
	return function (pair) {
	    return Math.pow(pair.pStrength, strengthExponent);
	};
    }

    GameLogic.prototype.pickRelationPair = function () { 
	var self = this;
	var introduced = introducedPairs(self.relation);
	var unlearnedMass = util.sum(util.pluckMap(introduced, 'pStrength'));

	// Pick a new relation pair to teach?
	if (unlearnedMass < self.params.teachCutoff) {
	    var unintroduced = unintroducedPairs(self.relation);
	    if (unintroduced.length > 0) {
		self.currentPair = self.params.introduceRandomly ?
		    util.pickOneRandom(unintroduced) : unintroduced[0];
		// We call it "introduced" already here, since we're
		// now about to introduce it.
		self.currentPair.introduced = true;
		return self.currentPair;
	    }
	}

	// Otherwise, choose an already introduced relation pair with
	// a weighted random pick.
	self.currentPair = util.pickRandomWeighted(introduced, weightGetter(self.params.pickStrengthExponent));
	return self.currentPair;
    };

    GameLogic.prototype.next = function () {
	this.pickRelationPair();
	this.pickComparisonStimuli();
    }

    GameLogic.prototype.getSampleStimulus = function () {
	return this.currentPair.stimulusA;
    }

    GameLogic.prototype.pickComparisonStimuli = function () { 
    };

    GameLogic.prototype.respond = function (stimulus) {
	return isCorrect;
    };

    // Simple game logic

    function SimpleGameLogic(setA, setB, pairs, params) {
	this.setA = setA;
	this.setB = setB;
	this.origPairs = pairs;
	this.params = {
	    introduce_randomly: params.introduce_randomly || false,
	    comparison_stimuli: params.comparison_stimuli || 2
	};
	this.start();
    }

    SimpleGameLogic.prototype.start = function () {
	if (this.params.introduceRandomly) {
	    this.pairs = util.shuffle(this.origPairs);
	} else {
	    this.pairs = util.copyArray(this.origPairs);
	}
    }

    SimpleGameLogic.prototype.next = function () {
	this.currentPair = util.rotateArray(this.pairs);
	var sampleStimulus = this.currentPair[0];
	var targetStimulus = this.currentPair[1];
	var otherStimuli = this.setB.filter(
	    util.inequalityChecker(targetStimulus));
	var comparisonStimuli = util.pickRandom(otherStimuli,
						this.params.comparison_stimuli - 1);
	comparisonStimuli.push(targetStimulus);
	return [sampleStimulus, comparisonStimuli];
    }

    SimpleGameLogic.prototype.respond = function (stimulus) {
	return stimulus === this.currentPair[1];
    }

    // Exports from module "gamelogic"
    return {
	GameLogic: GameLogic,
	SimpleGameLogic: SimpleGameLogic
    };

})();
