ConsoleInPage	= function(ctor_opts){
	jQuery("<div>").attr('id', 'consoleOutput').appendTo('body');
	jQuery("<ul>").appendTo("#consoleOutput");
}

//ConsoleInPage.PrevConsole	= window.console ;


ConsoleInPage.prototype.log	= function(){
	var output	= "";
	for(var i = 0; i < arguments.length; i++){
		var arg	= arguments[i];
		if( output.length )		output	+= " ";
		if( typeof arg == 'string' )	output	+= arg;
		else if(typeof arg == 'object')	output	+= "[object]"
	}
	this._appendLine(output);
}

ConsoleInPage.prototype.dir	= function(){
	// TODO	
}

ConsoleInPage.prototype.assert	= function(condition, message){
//	if( condition )	return;
	//ConsoleInPage.PrevConsole.trace();
//	throw "slota";
}

ConsoleInPage.prototype._appendLine	= function(line){
	jQuery('<li>').text(line).appendTo("#consoleOutput");
}


