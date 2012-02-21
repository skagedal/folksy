describe("layout.Box", function () {
    var box = new layout.Box(10, 5, 20, 8, "TEST");
    it("has the right dimensions", function () {
	expect(box.getWidth()).toEqual(20);
	expect(box.getHeight()).toEqual(8);
	expect(box.getLeft()).toEqual(10);
	expect(box.getRight()).toEqual(30);
	expect(box.getTop()).toEqual(5);
	expect(box.getBottom()).toEqual(13);
    });
    it("preserves user data", function () {
	expect(box.getData()).toEqual("TEST");
    });
});

describe("layout.PlaceableBox", function () {
    var box;
    beforeEach(function () {
	box = new layout.PlaceableBox(15, 10, "PLACETEST");
    });
    it("has the right dimensions before placing", function () {
	expect(box.getWidth()).toEqual(15);
	expect(box.getHeight()).toEqual(10);
	expect(box.getLeft()).toEqual(0);
	expect(box.getRight()).toEqual(15);
	expect(box.getTop()).toEqual(0);
	expect(box.getBottom()).toEqual(10);
	expect(box.getOrigWidth()).toEqual(15);
	expect(box.getOrigHeight()).toEqual(10);
    });
    it("has the right dimensions after placing", function () {
	box.place(7, 14, 150, 100);
	
	expect(box.getWidth()).toEqual(150);
	expect(box.getHeight()).toEqual(100);
	expect(box.getLeft()).toEqual(7);
	expect(box.getRight()).toEqual(157);
	expect(box.getTop()).toEqual(14);
	expect(box.getBottom()).toEqual(114);
	expect(box.getOrigWidth()).toEqual(15);
	expect(box.getOrigHeight()).toEqual(10);
    });
    it("preserves user data", function () {
	expect(box.getData()).toEqual("PLACETEST");
    });
});

/*
    it("places a square in a square", function () {
        var placeSpy = spy(this.square, "place");
        layout.layout(20, 20, [this.square], {});
        expect(placeSpy).toHa
*/
