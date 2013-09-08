jewel.input = (function() {
	function initialize() {
		inputHandlers = {};
	}

	function bind(action, handler) {
		if (!inputHandlers[action]) {
			inputHandlers[action] = [];
		}
		inputHandlers[action].push(handler);
	}

	function trigger(action) {
		var handlers = inputHandlers[action], args = Array.prototype.slice.call(arguments, 1);

		if (handlers) {
			for (var i = 0; i < handlers.length; i++) {
				handlers[i].apply(null, args);
			}
		}
	}

	function handleClick(x, y) {
		var action = jewel.settings.controls['CLICK'];
		if (action) {
			var jewelX = Math.floor(x * jewel.settings.cols), 
			jewelY = Math.floor(y * jewel.settings.rows);
			trigger(action, jewelX, jewelY);
		}
	}

	return {
		initialize : initialize,
		click : handleClick,
		bind : bind
	}

})();