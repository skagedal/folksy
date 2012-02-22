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

describe("layout.layoutObjects", function () {
    it("places a square in a square", function () {
	var box = new layout.Box(0, 0, 50, 50);
	var square = new layout.PlaceableBox(10, 10);
	layout.layoutObjects(box, [square], { padding: 0 });
	expect(square.getTop()).toEqual(0);
	expect(square.getLeft()).toEqual(0);
	expect(square.getWidth()).toEqual(50);
	expect(square.getHeight()).toEqual(50);
    });

    it("respects bounding box offset", function () {
	var box = new layout.Box(10, 20, 50, 50);
	var square = new layout.PlaceableBox(10, 10);
	layout.layoutObjects(box, [square], { padding: 0 });
	expect(square.getLeft()).toEqual(10);
	expect(square.getTop()).toEqual(20);
    });

    it("uses padding", function () {
	var box = new layout.Box(0, 0, 50, 50);
	var square = new layout.PlaceableBox(10, 10);
	layout.layoutObjects(box, [square], { padding: 10 });
	expect(square.getTop()).toEqual(10);
	expect(square.getLeft()).toEqual(10);
	expect(square.getBottom()).toEqual(40);
	expect(square.getRight()).toEqual(40);
    });	
});

