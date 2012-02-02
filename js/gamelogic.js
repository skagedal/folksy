// "Interfaces"

Stimulus = {
    id: "<stimulusID>",
};

StimulusSet = {
    each: function (op) { }
};

Relation = {
    stimulusA: {},
    stimulusB: {},
    pStrength: 1
};

RelationSet = {
    add: function (stimulusA, stimulusB) { }
};

User = {
    getRelation: function (idA, idB) { },
};

// Game logic

GameLogic = {
    newGame: function (user) { 
    },
    pickSampleStimulus: function () { },
    pickComparisonStimuli: function () { },
    respond: function (stimulus) {
	return isCorrect;
    }
}
