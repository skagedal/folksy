function Box(width, height) {
    this.width = width;
    this.height = height;
    this.place = function () {};
}  

describe("layout", function () {
    this.square = Box(10, 10);
    it("places a square in a square", function () {
        var placeSpy = spy(this.square, "place");
        layout.layout(20, 20, [this.square], {});
        expect(placeSpy).toHa

// lay should