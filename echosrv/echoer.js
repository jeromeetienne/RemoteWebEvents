/**
 * Echoer is the server which ensure communication between Recver and Xmiter
 * - 
*/

// system dependancies
var http	= require('http');
var socket_io	= require('../vendor/socket.io-node');

//////////////////////////////////////////////////////////////////////////////////
//		Recver Class							//
//////////////////////////////////////////////////////////////////////////////////

/**
 * Constructor
*/
var Recver	= function(ctor_opts){
	var self	= this;
	//////////////////////////////////////////////////////////////////////////
	//		class variables						//
	//////////////////////////////////////////////////////////////////////////
	// copy ctor_opts + set default values if needed
	this.ioClient	= ctor_opts.ioClient	|| console.assert(false);
	this.callback	= ctor_opts.callback	|| console.assert(false);
	// define the private properties
	this._uuid	= null
	// hook the ioClient	
	this.ioClient.on('message', function(message){
		self._onMessage(message);
	});
	this.ioClient.on('disconnect', function(){
		self._onDisconnect();
	});
}

/**
 * Destructor
*/
Recver.prototype.Dtor	= function(){
	// disconnect ioClient if needed
	if(this.ioClient.connected)	this.ioClient.connection.end();
}

/**
 * @returns {boolean} true if otherUuid matches this Recver uuid, false otherwise
*/
Recver.prototype.match	= function(otherUuid){
	// log to debug
	console.log("match _uuid", this._uuid, "otherUuid", otherUuid)
	return this._uuid == otherUuid;
}

Recver.prototype.send	= function(mesg){
	this.ioClient.send(mesg);	
}

Recver.prototype._onMessage	= function(mesg){
	var type	= mesg.type;
	var data	= mesg.data;
	// log to debug
	console.log("received message");
	console.dir(mesg);
	// handle the event according to their type
	if( type == "connect" ){
		// copying uuid
		console.assert(!this._uuid);
		this._uuid	= data.uuid;
	}
}

Recver.prototype._onDisconnect	= function(){
	console.log("receiver disconnected")
	this.callback("disconnect");
}

//////////////////////////////////////////////////////////////////////////////////
//		Recvers Class							//
//////////////////////////////////////////////////////////////////////////////////

/**
 * Constructor to handle array of Recver
*/
var Recvers	= function(){
	this.items	= [];
}

/**
 * Push a new Recver into this Recvers
*/
Recvers.prototype.push	= function(ioClient){
	var self	= this;
	var recver	= new Recver({
		ioClient	: ioClient,
		callback	: function(eventType, eventData){
			if(eventType == "disconnect")	self.remove(recver);
		}
	});
	this.items.push(recver);
	// log to debug
	console.log("Recvers are", this.items.length, "now.");
}

/**
 * Remove a Recver from Recvers
*/
Recvers.prototype.remove= function(recver){
	for(var i = 0; i < this.items.length; i++){
		if( recver === this.items[i] ){
			recver.Dtor();
			this.items.splice(i, 1);
			break;
		}
	}
}

/**
 * dispatch the message to the proper Recver destination
*/
Recvers.prototype.dispatch	= function(dest, data){
	console.log("dispatching ", data, "for", dest);
	this.items.forEach(function(recver){
		if( recver.match(dest) )	recver.send(data);
	})
}

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
//	Main code								//
//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

cmdline_opts	= {
	socketPort	: 8080,
	xmiterPort	: 8081
};

//////////////////////////////////////////////////////////////////////////////////
//	parse cmdline								//
//////////////////////////////////////////////////////////////////////////////////
var disp_usage	= function(prefix){
	if(prefix)	console.log(prefix + "\n");
	console.log("usage: echoer.js [-s port] [-x port]");
	console.log("");
	console.log("Run a RemoteWebEvents echoer");
	console.log("");
	console.log("-s|--socketPort PORT\n\t\tSet the port for the websocket. default to "+cmdline_opts.socketPort);
	console.log("-x|--xmiterPort PORT\n\t\tSet the port for the xmiter. default to "+cmdline_opts.xmiterPort);
	console.log("-h|--help\tDisplay the inline help.");
}
var optind	= 2;
for(;optind < process.argv.length; optind++){
	var key	= process.argv[optind];
	var val	= process.argv[optind+1];
	//console.log("key="+key+" val="+val);
	if( key == "-s" || key == "--socketPort" ){
		cmdline_opts.socketPort	= val;
		optind		+= 1;
	}else if( key == "-x" || key == "--xmiterPort" ){
		cmdline_opts.xmiterPort	= val;
		optind		+= 1;
	}else if( key == "-h" || key == "--help" ){
		disp_usage();
		process.exit(0);
	}else{
		// if the option doesnt exist, consider it is the first non-option parameters
		break;
	}
}

//////////////////////////////////////////////////////////////////////////////////
//		revcers Connection						//
//////////////////////////////////////////////////////////////////////////////////

var recvers	= new Recvers();
// socket.io listener to accept websocket
var server = http.createServer(function(req, res){});
server.listen(cmdline_opts.socketPort);
var io_listener	= socket_io.listen(server, {});
//var io_listener	= io.listen(server, {log : function(msg){}});		
io_listener.on('connection', function(ioClient){
	console.log("Connected");
	//console.dir(ioClient);
	recvers.push(ioClient);
});

console.log("socket.io is listening on "+cmdline_opts.socketPort)

//////////////////////////////////////////////////////////////////////////////////
//		xmiter Reception						//
//////////////////////////////////////////////////////////////////////////////////

/**
 * to receive message from xmiters
*/
http.createServer(function(request, response){
	function serverError(serverResp, statusCode, reasonPhrase){
		if( typeof reasonPhrase == 'undefined' )	reasonPhrase	= "error "+statusCode;
		serverResp.writeHead(statusCode, reasonPhrase, {"Content-Type": "text/plain"});  
		serverResp.write(reasonPhrase+"\n");  
		serverResp.end();  
	}
	// parse the url
	var parsedUrl	= require('url').parse(request.url);
	var query	= {}
	parsedUrl.query.split('&').forEach(function(item){
		var arr	= item.split("=");
		if( arr.length != 2 )	return;
		query[arr[0]]	= unescape(arr[1]);
	});
	if( !query.data || !query.dest ){
		serverError(response, 400, "missing url var. data and dest are required")
		return;
	}
	// dispatch mesg
	recvers.dispatch(query.dest, query.data);

	// return noerror
	response.writeHead(200, {'Content-Type': 'text/javascript'});
	response.end(query.callback+'(true);');
}).listen(cmdline_opts.xmiterPort);

console.log("xmiter event is listening on "+cmdline_opts.xmiterPort)
