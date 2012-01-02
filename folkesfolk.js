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
	"N_noam",
	"N_nova",
	"O_otis", 
	"P_paer", 
	"S_sigrid", 
	"S_simon", 
	"S_sixten", 
	"S_stella",
	"S_soeren", 
	"S_svea", 
	"U_uno", 
	"V_vera", 
	"W_wilhelm", 
	"Z_zackari",
	"AA_aasa",
	"AE_aerlebrand",
];

kortversion = false;
//kortversion = true;
if (kortversion) {
	ff.questions = [
		"S_stella",
		"AE_aerlebrand",
		"N_noam",
		"N_nova",
		"A_amanda", 
		"F_folke", 
		"S_soeren", 
		"I_ida", 
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

function correct_answer() {
	if (ff.is_in_question) {
		ff.is_in_question = false;
		$("#wrong_answer").fadeOut()
		$("#correct_answer").animate({
			top: 28, 
			left: 28,
			width: 368,
			height: 368,
			opacity: 0.5},
			1000, function() {
				$("#correct_answer").fadeOut(function() {
					$("#correct_answer").css({top: 424, width: 164, height: 164, opacity: 1.0});
					next_question();
				});
			});
		console.log("Whoohooo!");
	
	}
}

function wrong_answer() {
	if (ff.is_in_question) {
		console.log("Wrong...");
	}
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

		ff.current_image = ff.images[q];
		var correct_image = ff.letter_images[answer_i];
		var wrong_image = random_pick_except(ff.letter_images, correct_image);


		$("#face")[0].src = ff.current_image.src;
		$("#face").fadeIn();		

		var x_position = shuffle(["28px", "232px"]);
		$("#correct_answer").css({left: x_position[0]});
		$("#wrong_answer").css({left: x_position[1]});
		$("#correct_answer")[0].src = correct_image.src;
		$("#wrong_answer")[0].src = wrong_image.src;
		$(".answers").fadeIn();
		ff.is_in_question = true;
	}

	if (ff.current_image) {
		console.log("Fading out..");
		$("#face").fadeOut("slow", add_new_image);
	} else {
		add_new_image();
	}
}

function start_game() {
	$("#correct_answer").click(correct_answer);
	$("#wrong_answer").click(wrong_answer);
/*	$(".answers").hover(function() {
				$(this).css({opacity:0.7});
			   },
			   function() {
				$(this).css({opacity:1.0});
			   });
*/
	$("#intro").slideUp("slow", function() { 
		$("#game").fadeIn("slow", next_question); 	
	});
}

// Init function - run when the DOM is ready

$(function() {
	// Should start by loading in the game metadata using $.get('something.json', callback)

	load_images();
	load_audios();

	ff.order = shuffle(range(ff.questions.length));
	ff.is_in_question = false;		// is true when we're waiting for a click on a letter 

	$("#start_game").click(start_game);

	$("#switch_img").click(next_question);

});


