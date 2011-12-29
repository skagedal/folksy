// Folkes folk

document.folkesfolk = {};	// App object
ff = document.folkesfolk;

ff.questions = ["A_amanda", "S_simon"];

function load_images() {
	ff.images = [];
	console.log("Got questions: " + String(ff.questions.length));
	for (var i = 0; i < ff.questions.length; i++) {
		var filename = "images/" + ff.questions[i] + ".jpg";
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

		ff.images.push(img);
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

$(function() {
	// do stuff when DOM is ready

	load_images();
	load_audios();

	$("#switch_img").click(function() {
		var q = Math.floor(Math.random() * ff.questions.length);

		console.log("Got these: " + String(ff.images.length));

		add_new_image = function() {
			play_sound(ff.audios[q]);
			$("#face_div").empty();
			ff.current_image = ff.images[q];
			$("#face_div").append(ff.current_image);
			$(ff.current_image).fadeIn();
		}

		if (ff.current_image) {
			console.log("Fading out..");
			$(ff.current_image).fadeOut("slow", add_new_image);
		} else {
			add_new_image();
		}
		
//		alert("Hello world!");
	});
});


