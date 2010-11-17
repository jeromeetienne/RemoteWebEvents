// define the namespace
if( typeof RemoteWebEvents === 'undefined' )	RemoteWebEvents	= {};

//////////////////////////////////////////////////////////////////////////////////
//		ctor/dtor							//
//////////////////////////////////////////////////////////////////////////////////

/**
 * Constructor
*/
RemoteWebEvents.Recver	= function(ctor_opts){
	//////////////////////////////////////////////////////////////////////////
	//		class variables						//
	//////////////////////////////////////////////////////////////////////////
	// copy ctor_opts + set default values if needed
	this.srvHost	= ctor_opts.srvHost	|| console.assert(false);
	this.srvPort	= ctor_opts.srvPort	|| console.assert(false);
	this.callback	= ctor_opts.callback	|| console.assert(false);
	this.uuid	= ctor_opts.uuid	|| this._generateUUID();
	// init private members
	this.socket	= null;
	// launch other contructore
	this.socketCtor();
}

/**
 * Destructor
*/
RemoteWebEvents.Recver.prototype.Dtor	= function(){
	this.socketDtor();
}

//////////////////////////////////////////////////////////////////////////////////
//		Misc								//
//////////////////////////////////////////////////////////////////////////////////

/**
 * Generate UUID
*/
RemoteWebEvents.Recver.prototype._generateUUID	= function(){
	function S4() {
		return( ((1+Math.random())*0x10000)|0 ).toString(16).substring(1);
	}
	return( S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4() );
}

RemoteWebEvents.Recver.prototype._notify	= function(eventType, eventData){
	this.callback(eventType, eventData);
}

//////////////////////////////////////////////////////////////////////////////////
//		Socket								//
//////////////////////////////////////////////////////////////////////////////////

RemoteWebEvents.Recver.prototype.socketCtor	= function(){
	var self	= this;
	this.socket	= new io.Socket(this.srvHost, {port: this.srvPort});
	this.socket.on('connect', function(){
		// log to debug
		console.log("Websocket Connected to server");
		//console.dir(self.socket)
		// send the connect_msg
		self.socket.send({
			type	: "connect",
			data	: {
				uuid	: self.uuid
			}
		});
		// notify the caller
		self._notify("connect");
	});
	this.socket.on('message', function(mesg){
		//console.log("received message", mesg);
		self._notify("message", mesg)
	})
	this.socket.on('disconnect', function(){
		//console.log("disconnected server");
		self._notify("disconnect");
	})
	this.socket.connect();	
}

RemoteWebEvents.Recver.prototype.socketDtor	= function(){
	//console.assert(false);
}

