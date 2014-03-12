var request = require("request");
var str = require("stream");
var sio = require('socket.io');
var static = require('node-static'),path = require('path');
var app = require('http').createServer(webhandler);
var wcam = require('../lib/watchcam');

process.on('uncaughtException', function (err) {
    console.log('HOPPHOPP:'+err);
});

app.listen(8000);
console.log('Listening on port 8000');

var io = sio.listen(app, { log: false });



var cameras=[];

function send(sender,data,counter,id) {
	if (counter % 10 ==0) {
		console.log('sending ',id,counter);
		io.sockets.emit('user image'+id, 'server', data.toString('base64'));
	}
	else
		console.log('writing ',id,counter);
}

cameras.push(new wcam({
			weburl :  "http://192.168.137.168/live/stream2.cgi",
			webuser : 'admin',webpassword : '9999',
			savedir : "/dev/shm/cam",savecount : 100
		},
		function(data,counter) {
			send(this,data,counter,1);
		}
	) 
)


cameras.push(new wcam({
			weburl :  "http://192.168.137.169/live/stream2.cgi",
			webuser : 'admin',webpassword : '9999',
			savedir : "/dev/shm/cam2",savecount : 100
		},
		function(data,counter) {
			send(this,data,counter,2);
		}
	)
);

cameras.forEach(function(item) {
	item.start();
});

var file = new static.Server(path.join(__dirname, 'public'));

function webhandler(req, res) {
	file.serve(req, res);
}

var nicknames = {};

io.sockets.on('connection', function (socket) {
	socket.on('user message', function (msg) {
      socket.broadcast.emit('user message', socket.nickname, msg);
    });

    socket.on('user image', function (msg) {
      //console.log(msg);
      socket.broadcast.emit('user image', socket.nickname, msg);
    });

    socket.on('nickname', function (nick, fn) {
      if (nicknames[nick]) {
        fn(true);
      }
      else {
        fn(false);
        nicknames[nick] = socket.nickname = nick;
        socket.broadcast.emit('announcement', nick + ' connected');
        io.sockets.emit('nicknames', nicknames);
      }
    });

    socket.on('disconnect', function () {
      if (!socket.nickname) {
        return;
      }
      delete nicknames[socket.nickname];
      socket.broadcast.emit('announcement', socket.nickname + ' disconnected');
      socket.broadcast.emit('nicknames', nicknames);
    });
	
});
