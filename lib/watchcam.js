var request = require("request");
var MjpegConsumer = require("mjpeg-consumer");
var FileOnWrite = require("file-on-write");
var sio = require('socket.io');

var WatchCam = function (settings,oncapture) {
	
	var me=this;
	
	
/*	if (typeof settings == 'undefined') {
		var settings={};
		settings.webuser = 'admin';
		settings.webpassword = '9999';
		settings.weburl =  "http://192.168.137.168/live/stream2.cgi";
		settings.savedir = "/dev/shm/cam";
		settings.savecount = 100;
	}*/
	this.file_counter=0;
	
	this.consumer = new MjpegConsumer();
	
	
	this.writer = new FileOnWrite({ 
		path: settings.savedir,
		filename: function(data) { 
			if (typeof oncapture == 'function') oncapture(data,me.file_counter);
			cnt="image" + ("000"+ me.file_counter++ % settings.savecount).slice(-4);
			return cnt;
		},
		ext: '.jpg'	
	});
	
	
	this.username = settings.webuser;
	this.password = settings.webpassword ;
	this.options = {
		url: settings.weburl,
		headers: {
		 'Authorization': 'Basic ' + new Buffer(this.username + ':' + this.password).toString('base64')
	   }  
	};
	console.log('Init capture on',this.options.url);
	
}

WatchCam.prototype.start = function () {
	request(this.options).pipe(this.consumer).pipe(this.writer);
	console.log('Started capture on',this.options.url);
//	return this.file_counter;
}

module.exports = WatchCam;
