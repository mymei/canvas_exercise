jewel.display = (function() {

	var splites = [];
	var map={};

	function addSplite(name, type, x, y) {
		var splite = findSplite(name);
		if (!splite) {
			var splite = {
				name : name,
				type : type,
				x : x,
				y : y,
				scale : 1,
				rot : 0,
				anims : []
			}
			splites.push(splite);
		} else {
			splite.type = type;
			splite.x = x;
			splite.y = y;
		}
		return splite;
	}
	function removeSplite(x) {
		splites.splice(splites.indexOf(x), 1);
	}
	function moveSplite(x, toX, toY, scale, rot) {
		x.x = toX;
		x.y = toY;
		x.scale = scale || 1;
		x.rot = rot || 0;
	}
	function findSplite(name) {
		return splites.filter(function(x){return x.name == name;})[0];
	}

	var animations = [];

	function addAnimation(name, runTime, fncs) {
		var splite = findSplite(name);
		var anim = {
			splite : splite,
			runTime : runTime,
			startTime : Date.now(),
			pos : 0,
			fncs : fncs
		};
		animations.push(anim);
	}

	function updateAnimation(time, lastTime) {
		var anims = animations.slice(0), n = anims.length, animTime, anim, i;
		for (i=0; i<n; i++) {
			anim = anims[i];
			anim.fncs.before && anim.fncs.before(anim.splite, anim.pos);
			anim.lastPos = anim.pos;
			animTime = (lastTime - anim.startTime);
			anim.pos = animTime / anim.runTime;
			anim.pos = Math.max(0, Math.min(1, anim.pos));
		}

		animations = [];

		for (i=0; i<n; i++) {
			anim = anims[i];
			anim.fncs.render(anim.splite, anim.pos, anim.pos - anim.lastPos);
			if (anim.pos == 1) {
				anim.fncs.done && anim.fncs.done(anim.splite);
			} else {
				animations.push(anim);
			}
		}
	}

	var cursor;
	var jewelBlocks;
	var cols = jewel.settings.cols, rows = jewel.settings.rows, jewelSize = jewel.settings.jewelSize;

    function drawBoard(ctx) {
        ctx.fillStyle = "rgba(255, 235, 255, 0.15)";
        for (var x=0; x < cols; x ++) {
            for (var y=0; y < rows; y ++) {
                if ((x+y)%2) {
                    ctx.fillRect(x * jewelSize, y * jewelSize, jewelSize, jewelSize);
                }
            }
        }
    }

    function drawJewel(ctx, type, x, y, scale, rot) {
        var image = jewel.images["images/jewels"+jewelSize+".png"];
        ctx.save();
        if (scale != undefined && scale > 0) {
        	ctx.translate((x + 0.5) * jewelSize, (y + 0.5) * jewelSize);
        	ctx.scale(scale, scale);
        	if (rot) {
        		ctx.rotate(rot);
        	}
        	ctx.translate((-x - 0.5) * jewelSize, (-y - 0.5) * jewelSize);
        	ctx.drawImage(image, type * jewelSize, 0, jewelSize, jewelSize, x * jewelSize, y * jewelSize, jewelSize, jewelSize);
        }
        ctx.restore();
    }

    function drawJewels(ctx) {
    	var length = splites.length;
    	for (var i = 0; i < length; i ++) {
    		drawJewel(ctx, splites[i].type, splites[i].x, splites[i].y, splites[i].scale, splites[i].rot);
    	}
    }

    function drawCursor(ctx) {
        if (!cursor) {
            return;
        }

        var x = cursor.x, y = cursor.y;
        if (cursor.selected) {
            ctx.save();
            ctx.lineWidth = 0.05 * jewelSize;
            ctx.strokeStyle = "rgba(250, 250, 150, 0.8)";
            ctx.strokeRect((x+0.05) * jewelSize, (y+0.05) * jewelSize, 0.9 * jewelSize, 0.9 * jewelSize);
            ctx.restore();
        }
    }

	function render(ctx) {
		ctx.clearRect(0, 0, 320, 320);
		drawBoard(ctx);
		drawJewels(ctx);
		drawCursor(ctx);
	}
	return {
		addAnimation : addAnimation,
		updateAnimation : updateAnimation,
		render : render,
		addSplite : addSplite,
		removeSplite : removeSplite,
		moveSplite : moveSplite,
		canSkip : function() {return animations.length == 0;},a

		setCursor : function(_cursor) {
			cursor = _cursor;
		}
	}	
})();