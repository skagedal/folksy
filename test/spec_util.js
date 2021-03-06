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

describe("util.mergeObjects", function () {
    it("should override properties giving preference to earlier arguments",
       function () {
	   var obj = util.mergeObjects({a: "A"},
				       {a: "never seen",
					b: "B"},
				       {a: "don't see this",
					b: "or this",
					c: "C"});
	   expect(obj.a).toEqual("A");
	   expect(obj.b).toEqual("B");
	   expect(obj.c).toEqual("C");
       });
});

describe("util.getExtension", function () {
    it("should return the lower-cased extension of a filename", function () {
	expect(util.getExtension("foo.bar")).toEqual("bar");
	expect(util.getExtension("test://long/silly.string.ext")).toEqual("ext");
	expect(util.getExtension("foo.BAZ")).toEqual("baz");
    });
    it("should return the empty string when there is no extension", function () {
	expect(util.getExtension("foobar")).toEqual("");
    });
});
