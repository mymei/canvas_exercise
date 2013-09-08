jewel.board = (function() {
    var settings, worker, messageCount, callbacks, jewels, rows, cols;
    function initialize(callback) {
        settings = jewel.settings;
        rows = settings.rows;
        cols = settings.cols;

        messageCount = 0;
        callbacks = [];
        worker = new Worker("scripts/board.worker.js");

        worker.addEventListener("message", messageHandler);

        post("initialize", settings, callback);
    }

    function post(command, data, callback) {
        callbacks[messageCount] = callback;
        worker.postMessage({
            id :messageCount,
            command : command,
            data : data
        });
        messageCount++;
    }

    function swap(x1, y1, x2, y2, callback) {
        post("swap", {
            x1 : x1,
            y1 : y1,
            x2 : x2,
            y2 : y2
        }, callback);
    }

    function messageHandler(event) {
        var message = event.data;
        console.log(message);
        jewels = message.jewels;

        if (callbacks[message.id]) {
            callbacks[message.id](message.data);
            delete callbacks[message.id];
        }
    }

    function getBoard() {
        var copy = [], x;
        if (jewels) {
            for (x = 0; x < cols; x++) {
                copy[x] = jewels[x].slice(0);
            }
        }
        return copy;
    }

    function print() {
        var str = "";
        if (jewels) {
            for (var y = 0; y < rows; y ++) {
                for (var x = 0; x < cols; x ++) {
                    str += jewels[x][y] + " ";
                }
                str += "\r\n";
            }
        }
        console.log(str);
    }

    return {
        initialize : initialize,
        swap : swap,
        getBoard : getBoard,
        print : print
    };
})();