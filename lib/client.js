//Для организации клиент серверного взаимодействия
var upnode = require( 'upnode' );

var CLIENT; //Переменная для хранения экземпляра upnode

var container = {};

container.findAction = function() {
	var args = arguments;
	CLIENT( function( s ) {
		s.findAction.apply( s, args );
	} );
};
container.insertAction = function() {
	var args = arguments;
	CLIENT( function( s ) {
		s.insertAction.apply( CLIENT, args );
	} );
};
container.modifyAction = function() {
	var args = arguments;
	CLIENT( function( s ) {
		s.modifyAction.apply( CLIENT, args );
	} );
};
container.deleteAction = function() {
	var args = arguments;
	CLIENT( function( s ) {
		s.deleteAction.apply( CLIENT, args );
	} );
};

exports.init = function( serverPort, callback ) {

	// singleton
	if ( CLIENT ) {
		callback( null, container );
	}

	CLIENT = upnode.connect( serverPort );

	callback( null, container );
};
