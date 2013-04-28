var jewel = {};
jewel.settings = {
    rows: 8,
    cols: 8,
    baseScore: 100,
    numJewelTypes: 7,
    jewelSize:40
};
jewel.images = {}
var numPreload = 0, numLoaded = 0;

yepnope.addPrefix("loader", function(resource) {
    var isImage = /.+\.(jpg|png|gif)$/i.test(resource.url);
    resource.noexec = isImage;

    numPreload++;
    resource.autoCallback = function(e) {
        numLoaded++;
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
        load : ['loader!images/jewels'+jewel.settings.jewelSize+'.png']
    }
]);

function testCtrl($scope) {
    $scope.game = 0;
    $scope.moveTo = function(i) {
        $scope.game = i;
    }
    $scope.getProgress = function() {
        return 100 * numLoaded / numPreload;
    }
}

function gameCtrl($scope, $element) {
    var canvas = $('#mycanvas')[0];

    function drawBackground(canvas) {
        var ctx = canvas.getContext('2d'), grad, i;

        ctx.save();
        ctx.scale(canvas.width, canvas.height);
        grad = ctx.createRadialGradient(0.5, 0.5, 0.125, 0.5, 0.5, 0.75);
        grad.addColorStop(0.1, "rgb(170,180,190)");
        grad.addColorStop(0.9, "rgb(50, 60, 70)");
        ctx.fillStyle = grad;
        ctx.fillRect(0,0,1,1);

        ctx.beginPath();
        ctx.translate(0.5, 0.5);
        for (i = 0; i < 60; i ++) {
            ctx.rotate(1 / 60 * Math.PI * 2);
            ctx.lineTo(i % 2 ? 0.15 : 0.75, 0);
        }
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.fill();
        ctx.restore();

    }

    function makePath(ctx, points) {
        ctx.moveTo(points[0][0], points[0][1]);
        for (var i= 1, len = points.length; i <len;i++) {
            ctx.lineTo(points[i][0], points[i][1]);
        }
    }

    function drawLogo(canvas) {
        var logo = [
                [40, 460],
                [0, 0],
                [450, 0],
                [410, 460],
                [225, 512]
            ],
            five0 = [
                [225, 208],
                [225, 265],
                [295, 265],
                [288, 338],
                [225, 355],
                [225, 414],
                [341, 382],
                [357, 208]
            ],
            five1 = [
                [225, 94],
                [225, 150],
                [362, 150],
                [367, 94]
            ],
            five2 = [
                [225, 208],
                [151, 208],
                [146, 150],
                [225, 150],
                [225, 94],
                [84, 94],
                [85, 109],
                [99, 265],
                [225, 265]
            ],
            five3 = [
                [225, 355],
                [162, 338],
                [158, 293],
                [128, 293],
                [102, 293],
                [109, 382],
                [225, 414]
            ];

        var ctx = canvas.getContext('2d'), grad, i;

        ctx.save();

        ctx.translate(-225, -256);

        ctx.beginPath();
        makePath(ctx, logo);
        ctx.fillStyle="#e34c26";
        ctx.fill();

        ctx.save();

        ctx.translate(225, 256);
        ctx.scale(0.8, 0.8);
        ctx.translate(-225, -256);

        ctx.beginPath();
        ctx.rect(225, 0, 225, 512);
        ctx.clip();

        ctx.beginPath();
        makePath(ctx, logo);
        ctx.fillStyle="#f06529";
        ctx.fill();

        ctx.restore();

        ctx.beginPath();
        makePath(ctx, five0);
        makePath(ctx, five1);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        ctx.beginPath();
        makePath(ctx, five2);
        makePath(ctx, five3);
        ctx.fillStyle = "#ebebeb";
        ctx.fill();

        ctx.restore();

    }

    drawBackground(canvas);

    var ctx = canvas.getContext('2d');
    for (var i = 0; i < 20; i ++) {
        ctx.save();

        var x = Math.random() * canvas.width, y = Math.random() * canvas.height,
            angle = (Math.random() - 0.5) * Math.PI,
            scale = 0.05 + Math.random() * 0.1;

        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.rotate(angle);

        drawLogo(canvas);

        ctx.restore();
    }

}