function testPickRandomWeighted () {
    // We use the values themselves as weight.
    var one = [5];
    var three = [2, 3, 5];
    
    equal(pickRandomWeighted(one, _.identity), 5, "correctly picks one element");
    var ans = pickRandomWeighted(three, _.identity, 3);
    ans.sort();
    equal(ans.join(","), "2,3,5", "correctly picks all elements");
}

