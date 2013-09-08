angular.module('myApp', [])
    .run(function ($rootScope) {
        $rootScope.numPreload = 0;
        $rootScope.numLoaded = 0;
        yepnope.addPrefix("loader", function (resource) {
            var isImage = /.+\.(jpg|png|gif)$/i.test(resource.url);
            resource.noexec = isImage;

            $rootScope.numPreload++;
            resource.autoCallback = function (e) {
                $rootScope.numLoaded++;
                !$rootScope.$$phase && $rootScope.$apply();
                if (isImage) {
                    var image = new Image();
                    image.src = resource.url;
                    jewel.images[resource.url] = image;
                }
            }
            return resource;
        });

        yepnope([
            {
                load: ['loader!images/jewels' + jewel.settings.jewelSize + '.png']
            }
        ]);

//        $rootScope.$on('requestInit', function() {
//            jewel.board.initialize(function(){console.log('finished')});
//            $rootScope.$broadcast('init', jewel.jewels);
//        })
    });

function testCtrl($scope, $element) {
    $scope.game = 0;
    $scope.moveTo = function(i) {
        $scope.game = i;
    }
    $scope.getProgress = function() {
        console.log(100 * $scope.numLoaded / $scope.numPreload);
        return 100 * $scope.numLoaded / $scope.numPreload;
    }

    var canvas = $('.background canvas', $element)[0];
    function createBackground(canvas) {
        var ctx = canvas.getContext("2d");
        canvas.width = $element.width();
        canvas.height = $element.height();

        ctx.scale(canvas.width, canvas.height);
        var gradient = ctx.createRadialGradient(0.25, 0.15, 0.5, 0.25, 0.15, 1);
        gradient.addColorStop(0, "rgb(55,65,50)");
        gradient.addColorStop(1, "rgb(0, 0, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1, 1);

        ctx.strokeStyle = "rgba(255, 255, 255, 0.02";
        ctx.lineWidth = 0.008;
        ctx.beginPath();
        for (var i = 0; i < 2; i += 0.020) {
            ctx.moveTo(i, 0);
            ctx.lineTo(i - 1, 1);
        }
        ctx.stroke();
    };
    createBackground(canvas);
}

function gameCtrl($scope, $element) {
    var canvasJQ = $('#mycanvas');
    var canvas = canvasJQ[0];
    canvas.width = jewel.settings.jewelSize * jewel.settings.cols;
    canvas.height = jewel.settings.jewelSize * jewel.settings.rows;
    var jewelSize = jewel.settings.jewelSize;

    var ctx = canvas.getContext('2d');

    jewel.board.initialize(function() {jewel.controller.notifyStart();}); 
    jewel.input.initialize();
    jewel.audio.initialize();
    jewel.controller.initialize($scope);
    jewel.input.bind('selectJewel', jewel.controller.selectJewel);

    $scope.controller = jewel.controller;

    $scope.score = 0;
    $scope.time = 22;
    $scope.level = 1;

    $scope.click = function($event) {
        var rect = canvas.getBoundingClientRect();
        var x = ($event.clientX - rect.left) / rect.width, 
        y = ($event.clientY - rect.top) / rect.height;
        jewel.input.click(x, y);
    }

    $scope.announcement = function() {
        return $scope.gameOver?"Game Over":"";
    }

    var previousTime = Date.now();
    function cycle(time) {
        jewel.display.updateAnimation(time, previousTime);
        previousTime = time;
        jewel.display.setCursor(jewel.controller.cursor);
        jewel.display.render(ctx);
        webkitRequestAnimationFrame(cycle);
    }
    var id = webkitRequestAnimationFrame(cycle);
    $scope.$on("$destroy", function() {
        webkitCancelRequestAnimationFrame(id);
    })
}