importScripts('shared-worker.js');
addEventListener('message', function(event) {
    var res=isPrime(event.data);
    postMessage(res);
},false);