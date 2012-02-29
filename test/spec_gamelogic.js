describe("gamelogic.SimpleGameLogic", function () {
    var logic;
    beforeEach(function () {
	logic = new gamelogic.SimpleGameLogic(
	    ["a", "b", "c"],
	    ["1", "2", "3"],
	    [["a", "1"], ["b", "2"], ["c", "3"]],
	    {
		introduce_randomly: false,
		comparison_stimuli: 2,
		round_increase: 1,
		max_comparison_stimuli: 3
	    });
    });
    it("introduces prompt stimuli in the given order and loops", function () {
	expect(logic.next()[0]).toEqual("a");
	expect(logic.next()[0]).toEqual("b");
	expect(logic.next()[0]).toEqual("c");
	expect(logic.next()[0]).toEqual("a");
    });
    it("returns an increasing number of comparison stimuli", function () {
	expect(logic.next()[1].length).toEqual(2);
	expect(logic.next()[1].length).toEqual(2);
	expect(logic.next()[1].length).toEqual(2);
	expect(logic.next()[1].length).toEqual(3);
	expect(logic.next()[1].length).toEqual(3);
	expect(logic.next()[1].length).toEqual(3);
	expect(logic.next()[1].length).toEqual(3);
    });
});

