jewel.controller = (function() {

	var score;
	var cursor = {x:0,y:0,selected:false};
	function setCursor(x, y, selected) {
		cursor.x = x;
		cursor.y = y;
		cursor.selected = selected;
	}

	var board, display, ui, audio, gameOver = false;
	function initialize(scope) {
		board = jewel.board;
		display = jewel.display;
		audio = jewel.audio;
		score = 0;
		ui = scope;
		gameOver = false;
		setTimer(true);
	}
	function notifyStart() {		
        var jewels = board.getBoard();
        for (var x=0; x < jewel.settings.cols; x ++) {
            for (var y=0; y < jewel.settings.rows; y ++) {
                display.addSplite(getSpliteName(x, y), jewels[x][y], x, y);
            }
        }
	}
	function selectJewel(x, y) {
        if (gameOver) {
            if (display.canSkip()) {
                ui.moveTo(1);
            }
        } else {

            if (arguments.length == 0) {
                selectJewel(cursor.x, cursor.y);
            }
            if (cursor.selected) {
                var dx = Math.abs(x - cursor.x), dy = Math.abs(y - cursor.y), dist = dx + dy;
                if (dist == 0) {
                    setCursor(x, y, false);
                } else if (dist == 1) {
                    board.swap(cursor.x, cursor.y, x, y, playBoardEvents);
                    setCursor(x, y, false);
                } else {
                    setCursor(x, y, true);
                }
            } else {
                setCursor(x, y, true);
            }
        }
    }

    function getSpliteName(x, y) {
    	return JSON.stringify([x, y]);
    }
    function playBoardEvents(events) {

    	if (events.length > 0) {
    		var boardEvent = events.shift();

    		switch (boardEvent.type) {
    			case "badswap":
    			audio.play("badswap");
    			break;
    			case "remove":
    			audio.play("match");
    			boardEvent.data.forEach(function(e) {
    				display.addAnimation(getSpliteName(e.x, e.y), 400, 
    				{
    					render:function(x, pos){
    						x.scale = 1 - pos;
    						x.rot = pos * Math.PI * 2;
    					}, 
    					done:function(x){
    						display.removeSplite(x);
    					}
    				});
    			});
    			display.addAnimation(undefined, 400, {render:function(x){},done:function(x){playBoardEvents(events)}})
    			break;
    			case "move":
    			var maxDuration = 0;
    			boardEvent.data.forEach(function(e) {
    				var dist = Math.abs(e.toX - e.fromX) + Math.abs(e.toY - e.fromY);
    				var name = getSpliteName(e.fromX, e.fromY);
    				var duration = 200 * dist;
    				maxDuration = Math.max(maxDuration, duration);
    				display.addSplite(name, e.type, e.fromX, e.fromY);
    				display.addAnimation(name, duration, {
    					before:function(x, pos) {
    					},
    					render:function(x, pos, delta){ 
    						pos = Math.sin(pos * Math.PI / 2);
    						display.moveSplite(x, e.fromX * (1 - pos) + e.toX * pos, e.fromY * (1 - pos) + e.toY * pos); 
    					}, 
    					done:function(x){
    						display.moveSplite(x, e.toX, e.toY);
    						x.name = getSpliteName(e.toX, e.toY);
    					}});
    			});
    			display.addAnimation(undefined, maxDuration, {render:function(x){},done:function(x){playBoardEvents(events)}})
    			break;
    			case "refill":
    			console.log('refill');
    			for (var x=0; x < jewel.settings.cols; x ++) {
    				for (var y=0; y < jewel.settings.rows; y ++) {
    					var name = getSpliteName(x, y);
    					display.addAnimation(name, 1000, {
    						before:function(x, pos) {
    						},
    						render:function(splite, pos, delta){ 
    							display.moveSplite(splite, splite.x, splite.y, 1 - pos, pos * Math.PI * 2); 
    						}, 
    						done:function(splite){
    							splite.type = boardEvent.data[splite.x][splite.y];
    						}});
    				}
    			}
    			display.addAnimation(undefined, 1000, {render:function(x){},done:function(x){playBoardEvents(events)}})
    			break;
    			case "score":
    			setUI('score',ui.score + boardEvent.data);
    			display.addAnimation(undefined, 0, {render:function(x){},done:function(x){playBoardEvents(events)}})
    			break;
    			default:
    			display.addAnimation(undefined, 0, {render:function(x){},done:function(x){playBoardEvents(events)}})
    			break;
    		}
    	}
    }

    var timer = 0, endTime, duration = 20000;
    function setTimer(reset) {
    	if (timer) {
    		clearTimeout(timer);
    		timer = 0;
    	}

    	if (reset) {
    		endTime = Date.now() + duration;
    	}

    	var progress = (endTime - Date.now()) / duration * 100;
    	if (progress > 0) {
    		setUI('time', progress);
    		timer = setTimeout(setTimer, 100);
    	} else {
    		gameOver = true;
            audio.play('gameOver');
    		setUI('gameOver', gameOver); 
    	}
    }

    function setUI(key, value) {
    	ui[key] = value;
    	setTimeout(function(){ui.$apply()},0);
    }

	return {
		initialize : initialize,
		selectJewel : selectJewel,
		cursor : cursor,
		notifyStart : notifyStart,
		score : function() {return score;},
		setTimer : setTimer
	}

})();