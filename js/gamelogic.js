// Module

gamelogic = (function () {

    // "Interfaces" -- this is basically just documentation; what this module expects and uses 

    var Game = {
	relation: {},
	stimulusSets: {}
    }
    var Stimulus = {
	id: "<stimulusID>",
    };
    var StimulusSet = {
	id: "<stimlusSetID>",
	each: function (op) { }
    };
    var Relation = {
	setA: "<idA>",
	setB: "<idB>",
	add: function (stimulusA, stimulusB) { }
	each: function (op) { }
	edges: []
    };
    var RelationEdge = {
	stimulusA: {},
	stimulusB: {},
	pStrength: 1,
	taught: false
    };
    var User = {
	getRelation: function (idA, idB) { },
    };

    // Game logic

    function GameLogic(game, params) {
	this.game = game;
	this.params = {
	    // Are the relation edges all considered "taught" already at game start?
	    initTaught: params.initTaught || false,

	    // Do we want to introduce new relation edges in random order?
	    teachInRandomOrder: params.teachInRandomOrder || false,

	    // When "unlearned mass" falls below this value, teach new stuff
	    // Use lower values for lower cognitive capacity (e.g., kids)
	    teachCutoff: params.teachCutoff || 4,

	    // Power p values with this when picking sample stimuli.
	    // Higher pickStrengthExponent --> well learned relation edges less likely to appear again
	    pickStrengthExponent: params.pickStrengthExponent || 1
	}
	
	this.currentEdge = null;
    }
    
    GameLogic.prototype.initGame = function () {
	var self = this;
	_.each(self.game.relation.edges, function (edge) {
	    edge.taught = self.params.initTaught;
	    edge.pStrength = 1;
	});
    };

    function untaughtEdges(relation) {
	return _.filter(relation.edges, function (edge) {
	    return edge.taught === false;
	});
    }

    function taughtEdges(relation) {
	return _.filter(relation.edges, function (edge) {
	    return edge.taught === true;
	});
    }

    function weightGetter(strengthExponent) {
	return function (edge) {
	    return Math.pow(edge.pStrength, strengthExponent);
	};
    }

    GameLogic.prototype.pickRelationEdge = function () { 
	var self = this;
	var taught = taughtEdges(self.relation);
	var unlearnedMass = _.sum(_.pluck(taught, 'pStrength'));

	// Pick a new relation edge to teach?
	if (unlearnedMass < self.params.teachCutoff) {
	    var untaught = untaughtEdges(self.relation);
	    if (untaught.length > 0) {
		self.currentEdge = self.params.teachInRandomOrder ?
		    _.pickRandom(untaught) : untaught[0];
		// We call it "taught" already here, since we're now about to teach it.
		self.currentEdge.taught = true;
		return self.currentEdge;
	    }
	}

	// Otherwise, choose an already taught relation edge with a weighted random pick.
	self.currentEdge = _.pickRandomWeighted(taught, weightGetter(self.params.pickStrengthExponent));
	return self.currentEdge;
    };

    GameLogic.prototype.pickComparisonStimuli = function () { 
    };

    GameLogic.prototype.respond = function (stimulus) {
	return isCorrect;
    };

    // Exports from module "gamelogic"
    return {
	GameLogic: GameLogic
    };

})();
