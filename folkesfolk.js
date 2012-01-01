// Folkes folk

document.folkesfolk = {};	// App object
ff = document.folkesfolk;

ff.letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", 
	      "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", 
	      "AA", "AE", "OE"];

ff.questions = [
	"A_amanda", 
	"A_anna", 
	"A_arvid", 
	"A_astrid", 
	"B_britta", 
	"D_daniel", 
	"E_elias_k", 
	"E_ellen", 
	"E_emilia", 
	"E_erik", 
	"E_ester", 
	"F_folke", 
	"F_frej", 
	"G_guje", 
	"I_ida", 
	"J_johan", 
	"J_jonas", 
	"J_jon", 
	"L_lina", 
	"M_majken", 
	"N_nisse", 
	"O_otis", 
	"P_paer", 
	"S_sigrid", 
	"S_simon", 
	"S_sixten", 
	"S_soeren", 
	"S_svea", 
	"U_uno", 
	"V_vera", 
	"W_wilhelm", 
	"Z_zackari",
	"AA_aasa"
];

kortversion = false;
//kortversion = true;
if (kortversion) {
	ff.questions = [
		"A_amanda", 
		"A_anna"
	];
}

function load_image(filename) {
	console.log("Let's load " + filename + "...");
	var img = new Image();
	$(img)
		.load(function() {
			$(this).hide();
			console.log("Have now loaded " + filename);
		})
		
		.error(function() {
			console.log("Could not load " + filename + "!");
		})
		
		.attr('src', filename);

	return img;
}

function load_images() {
	ff.images = [];
	for (var i = 0; i < ff.questions.length; i++) {
		ff.images.push(load_image("images/" + ff.questions[i] + ".jpg"));
	}

	ff.letter_images = [];
	ff.letter_select_images = [];
	for (var i = 0; i < ff.letters.length; i++) {
		ff.letter_images.push(load_image("images/letters/" + ff.letters[i] + ".png"));
		ff.letter_select_images.push(load_image("images/letters/" + ff.letters[i] + "_select.png"));
	}
}

function load_audios() {
	ff.audios = [];
	for (var i in ff.questions) {
		var filename = "sound/" + ff.questions[i] + ".ogg";
		ff.audios.push(new Audio(filename));
	}
}

function play_sound(audio) {
	audio.currentTime = 0;
	audio.play();
}

// Various pure javascript helpers

function random_int(max_val) {
	// Return a random integer 0 <= i < max_val
	return Math.floor(Math.random() * max_val);
}

function random_pick(a) {
	// Returns a random element from the array 
	// ASSUMES that the array has indices 0, 1, 2, ..., n-1
	return a[random_int(a.length)];
}

function random_pick_except(a, except) {
	// should really check that the array a does not only consist of "except"
	var p;
	while ((p = random_pick(a)) == except);
	return p;
}

function shuffle(a) {
	// Returns a shuffled version of the array.
	var a2 = a.slice(0);
	var a3 = [];
	while (a2.length > 0) {
		var i = random_int(a2.length);
		a3.push(a2.splice(i, 1)[0]);
	}
	return a3;
}

function range(max) {
	a = [];
	for (var i = 0; i < max; i++) {
		a.push(i);
	}
	return a;
}

function get_answer(s) {
	// "A_amanda" => "A"; "AA_asa" => "AA"
	return /^([A-Z]+)/.exec(s)[0];
}

function next_question() {
	if (ff.order.length < 1) {
		alert("Bra jobbat!");
		return;
	}
	var q = ff.order.shift();
	var answer = get_answer(ff.questions[q]);
	var answer_i = ff.letters.indexOf(answer);

	add_new_image = function() {
		play_sound(ff.audios[q]);
		$("#face").empty();
		ff.current_image = ff.images[q];
		$("#face").append(ff.current_image);
		$(ff.current_image).fadeIn();

		// Set up correct answer image
		$("#alt1").empty();
		var answer_image = ff.letter_images[answer_i];
		$("#alt1").append(answer_image);
		$(answer_image).fadeIn();

		$("#alt2").empty();
		var wrong_image = random_pick_except(ff.letter_images, answer_image);
		$("#alt2").append(wrong_image);
		$(wrong_image).fadeIn();

	}

	if (ff.current_image) {
		console.log("Fading out..");
		$(ff.current_image).fadeOut("slow", add_new_image);
	} else {
		add_new_image();
	}
}

// Init function - run when the DOM is ready

$(function() {
	// Should start by loading in the game metadata using $.get('something.json', callback)

	load_images();
	load_audios();

	ff.order = shuffle(range(ff.questions.length));

	$("#switch_img").click(next_question);
});


