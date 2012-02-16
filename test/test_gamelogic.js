function stringStimulus(s) {
    return {id: s, text: s};
}

function stringStimulusSet(id, stimuliStrings) {
    return {id: id,
            stimuli: stimuliStrings.map(stringStimulus)};
}

function findStimulusById(set, id) {
    // Raises IndexError
    return set.stimuli.filter(function (stimulus) {
        return stimulus.id === id;
    })[0];
}

function sampleGame() {
    var letters = "A B C D E F G H I J".split(" ");
    var digits = "0 1 2 3 4 5 6 7 8 9".split(" ");
    var letterSet = stringStimulusSet("letters", letters);
    var digitSet = stringStimulusSet("digits", digits);
 
    util.zip(letterSet.s
    