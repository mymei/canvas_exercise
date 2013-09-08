jewel.audio = (function() {

	var extension, sounds, activeSounds;
	function initialize() {
		extension = formatTest();
		if (!extension) {
			return;
		}
		sounds={};
		activeSounds=[];
	}

	function formatTest() {
		return 'mp3';
		var exts = [ "ogg", "mp3" ], i;
		for (i=0; i<exts.length; i++) {
			if (Modernizr.audio[exts[i]] == "probably") {
				return exts[i];
			}
		}
		for (i=0; i<exts.length; i++) {
			if (Modernizr.audio[exts[i]] == "maybe") {
				return exts[i];
			}
		}
	}

	function createAudio(name) {
		var el = new Audio("sounds/"+name+"."+extension);
		el.addEventListener('ended', cleanActive, false);

		sounds[name] = sounds[name] || [];
		sounds[name].push(el);
		return el;
	}

	function getAudioElement(name) {
		if (sounds[name]) {
			for (var i = 0; i<sounds[name].length; i++) {
				if (sounds[name][i].ended) {
					return sounds[name][i];
				}
			}
		}
		return createAudio(name);
	}

	function play(name) {
		var audio = getAudioElement(name);
		audio.play();
		activeSounds.push(audio);
	}

	function stop() {
		for (var i=activeSounds.length-1; i>=0; i--) {
			activeSounds[i].stop();
		}
		activeSounds = [];
	}

	function cleanActive() {
		for (var i=0; i<activeSounds.length; i++) {
			if (activeSounds[i].ended) {
				activeSounds.splice(i, 1);
			}
		}
	}

	return {
		initialize : initialize,
		play : play,
		stop : stop
	};
})()