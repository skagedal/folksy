(function () {
	var names = ['log', 'debug', 'info', 'warn', 'error', 'assert', 'dir', 'dirxml', 
		     'group', 'groupEnd', 'time', 'timeEnd', 'count', 'trace', 'profile', 'profileEnd'];

	if (window.console) {
		for (var i = 0; i < names.length; i++) {
			if (!window.console[names[i]]) {
				// window.console[names[i]] = function() {};
				console.log("Replaced: " + names[i]);
			}
		}
	} else {
		window.console = {};
		for (var i = 0; i < names.length; i++) {
			window.console[names[i]] = function() {};
		}
	}
})();


