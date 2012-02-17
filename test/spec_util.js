describe("util", function () {
    // just an example test
    it("should have a pickRandom function", function () {
	expect(util.pickRandom).toBeDefined();
    });
});

describe("util.pickRandom", function () {
    var testSet = ['h', 5, null, 60];

    xit("should pick out of the given elements", function () {
        expect(util.pickRandom(testSet, 2)).toBeSubsetOf(this.testSet);
    });

    it("should pick the right number of elements", function () {
        expect(util.pickRandom(testSet, 3).length).toEqual(3);
    });

});