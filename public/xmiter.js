// define the namespace
if( typeof RemoteWebEvents === 'undefined' )	RemoteWebEvents	= {};

/**
 * Constructor
*/
RemoteWebEvents.Xmiter	= function(ctor_opts){
	//////////////////////////////////////////////////////////////////////////
	//		class variables						//
	//////////////////////////////////////////////////////////////////////////
	// copy ctor_opts + set default values if needed
	this.destUrl	= ctor_opts.destUrl	|| console.assert(false);
}

RemoteWebEvents.Xmiter.prototype.Dtor	= function(){
}


RemoteWebEvents.Xmiter.prototype.send	= function(msgDest, msgData, succeedCb){
	var msgJson	= JSON.stringify(msgData);
	var url		= this.destUrl + "?data=" + escape(msgJson) + "&dest="+msgDest;
	url	+= "&nocache="+Math.random()+(new Date()).getTime();
	url	+= "&callback=?";
	jQuery.getJSON(url, succeedCb);
	console.log("rout");
}

