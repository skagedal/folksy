
function sampleGameLogic() {
    var letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]; 
    var digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    var pairs = util.zip(letters, util.shuffle(digits));

    var logic = gamelogic.SimpleGameLogic(letters, digits, pairs, {});
    return logic;
}
    
function nextQuestion(logic) {
    var q = logic.next();
    console.log("\n          " + q[0] + "\n\n");
    console.log(q[1].join(', '));
}

var logic = sampleGameLogic();
logic.start();
nextQuestion(logic);

