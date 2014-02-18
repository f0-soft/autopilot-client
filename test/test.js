
var autopilotClient = require('./../lib/client.js');

//Переменная для работы с функциями автопилота
var autopilot;

//Тестирование инициализации модуля Autopilot-client
exports.testInit = function(test){
	test.expect( 2 );

	autopilotClient.init( 7000, function( err, reply ){
		test.ifError(err);
		test.strictEqual( Object.keys( reply ).length, 4, 'Не возвращены методы работы с сервером ' +
			'автопилота' );
		autopilot = reply;
		test.done();
	} );
};

//Переменная для хранения времени срабатывания тестового действия
var testStartTimeAction = new Date().getTime();

var CONST = { //Константы
	STAT:{ //Константы статусов действий
		TEST:-1,
		WAIT:0, //Ожидание обработки
		PROCESS:1, //Обработка
		DELETE:2, //Действие удалено (в архиве)
		FINISH:3, //Действие завершено
		ERROR:4 //Действие закончено из-за непредвиденной ошибки
	}
};

//Тестовый объект данных действия
var objTestActionScheme = {
	'idBlock1':{
		name:'actionStart', //Название блока
		idBlock:'idBlock1', //Идентификатор блока
		cssBlock:'', //Положение блока
		param:{
			eventName:'testEvent',
			time:testStartTimeAction,
			action:''
		},
		out:{ //Присоединенные к выходу блоки
			targetId:'idBlock2'
		}
	},
	'idBlock2':{
		name:'timePeriod', //Название блока
		idBlock:'idBlock2', //Идентификатор блока
		cssBlock:'', //Положение блока
		out:{ //Присоединенные к выходу блоки
			targetId:'idBlock3'
		},
		param:{ //Параметры блока
			value:testStartTimeAction - 10000
		}
	},
	'idBlock3':{
		name:'find', //Название блока
		idBlock:'idBlock3', //Идентификатор блока
		cssBlock:'', //Положение блока
		out:{ //Присоединенные к выходу блоки
			targetTrueId:'idBlock4',
			targetFalseId:'idBlock5'
		},
		param:{ //Параметры блока
			essence:'testCollection',
			field:'testField'
		}
	},
	'idBlock4':{
		name:'checkSum', //Название блока
		idBlock:'idBlock4', //Идентификатор блока
		cssBlock:'', //Положение блока
		out:{ //Присоединенные к выходу блоки
			targetTrueId:'idBlock6',
			targetFalseId:'idBlock5'
		},
		param:{ //Параметры блока
			sum:10,
			essence:'testCollection'
		}
	},
	'idBlock5':{
		name:'sendMessage',
		idBlock:'idBlock5', //Идентификатор блока
		cssBlock:'', //Положение блока
		out:{ //Присоединенные к выходу блоки
			targetId:undefined
		},
		param:{ //Параметры блока
			email:'rozaa@yandex.ru',
			text:'Тестовое наполнение письма.'
		}
	},
	'idBlock6':{
		name:'sendSMS',
		idBlock:'idBlock6',
		cssBlock:'', //Положение блока
		out:{ //Присоединенные к выходу блоки
			targetId:'idBlock7'
		},
		param:{ //Параметры блока
			fon:79217894561,
			text:'Тестовое наполнение SMS.'
		}
	},
	'idBlock7':{
		name:'counter',
		idBlock:'idBlock7',
		cssBlock:'', //Положение блока
		out:{ //Присоединенные к выходу блоки
			targetTrueId:'idBlock8',
			targetFalseId:'idBlock9',
			_conditions:[
				['targetTrueId',[['<=',2],['=',3], ['=',4]]],
				['targetFalseId', [['=', 5], ['>=',6]]]
			]
		},
		param:{} //Параметры блока
	},
	'idBlock8':{
		name:'sendSMS',
		idBlock:'idBlock8',
		cssBlock:'', //Положение блока
		out:{ //Присоединенные к выходу блоки
			targetId:'idBlock2'
		},
		param:{ //Параметры блока
			fon:79217894561,
			text:'Тестовое наполнение SMS.'
		}
	},
	'idBlock9':{
		name:'timeExec',
		idBlock:'idBlock9',
		cssBlock:'', //Положение блока
		out:{ //Присоединенные к выходу блоки
			targetId:'idBlock5'
		},
		param:{ //Параметры блока
			delta:10000
		}
	}
};

//Переменная для хранения объекта действия, возвращенного как результат сохранения действия
var resultObjAction;

exports.testInsertActionFromScheme = {
	insert: function(test) {
		test.expect( 1 );

		autopilot.insertAction(objTestActionScheme, function endSaveAction(err, reply){
			if ( err ) console.log(err);
			if ( reply ) resultObjAction = reply;
			test.ifError(err);
			test.done();
		});
	},
	waiting:function( test ){
		test.expect(0);
		setTimeout(function(){
			test.done();
		}, 20000);
	},
	checkResultExecData:function (test){
		test.expect(15);

		var oQuery = {
			selector:{
				_id:resultObjAction._id
			},
			fields:'all'
		};

		autopilot.findAction( oQuery, function( err, resultData ) {
			if ( err ) {
				console.log( err );
			}
			//ToDo:расширить проверку
			test.ifError(err);
			test.strictEqual( resultData._id, resultObjAction._id,
				'Объект действия возвращен с неправильным идентификатором');
			test.strictEqual( resultData.tsCreate, resultObjAction.tsCreate,
				'Объект действия возвращен с неправильным временем создания');
			test.strictEqual( resultData.action.status, CONST.STAT.FINISH,
				'Объект действия возвращен с неправильным статусом действия');
			test.strictEqual( resultData.action.action, resultObjAction.action.action,
				'Объект действия возвращен с неправильным описанием действия');
			test.strictEqual( resultData.action.eventName, resultObjAction.action.eventName,
				'Объект действия возвращен с неправильным названием действия');
			test.ok( resultData.action.condition.log.length,
				'Объект действия возвращен с пустым логом');
			test.ok( resultData.action.condition.childIds.length,
				'Объект действия возвращен с пустым списком порожденных действий');
			//Выводим текст лога действия
			console.log( 'Лог действия: ' + resultData.action.eventName );
			for( var i = 0; i < resultData.action.condition.log.length; i++ ){
				console.log( '- ' + resultData.action.condition.log[i].text);
			}

			//Сохраняем идентификатор дочернего действия
			var childId = resultData.action.condition.childIds[0];

			//Читаем дочернее действие
			var oQuery2 = {
				selector:{
					_id:childId
				},
				fields:'all'
			};

			autopilot.findAction( oQuery2, function( err, resultData2 ) {
				if ( err ) {
					console.log( err );
				}
				test.strictEqual( resultData2._id, childId,
					'Объект действия возвращен с неправильным идентификатором');
				test.strictEqual( resultData2.action.status, CONST.STAT.FINISH,
					'Объект действия возвращен с неправильным статусом действия');
				test.strictEqual( resultData2.action.eventName, resultData.action.eventName + '*',
					'Объект действия возвращен с неправильным названием действия');
				test.strictEqual( resultData2.action.action, resultData.action.action,
					'Объект действия возвращен с неправильным описанием действия');
				test.ok( resultData2.action.condition.log.length,
					'Объект действия возвращен с пустым логом');
				test.strictEqual( resultData2.action.condition.parentId, resultData._id,
					'Объект действия возвращен с неправильным идентификатором родительского ' +
						'действия');
				test.ok( resultData2.action.condition.startPackageData.length,
					'Объект действия возвращен с пустым пакетом данных');

				//Выводим текст лога действия
				console.log( 'Лог действия: ' + resultData2.action.eventName );
				for( var i = 0; i < resultData2.action.condition.log.length; i++ ){
					console.log( '- ' + resultData2.action.condition.log[i].text);
				}

				test.done();
			});
		} );
	}
};

//Проверка поисковых запросов
exports.testFind = {
	//Поиск действия по id сохраненного деуствия
	findActionFromIdAction: function(test){
		test.expect( 9 );

		var oQuery = {
			selector:{
				_id:resultObjAction._id
			},
			fields:'all'
		};

		autopilot.findAction( oQuery, function( err, resultData ) {
			if ( err ) {
				console.log( err );
			}
			test.ifError(err);
			test.ok( resultData, 'Не найдено действие по идентификатору' );
			test.strictEqual( resultData._id, resultObjAction._id,
				'Объект действия возвращен с неправильным идентификатором');
			test.strictEqual( resultData.tsCreate, resultObjAction.tsCreate,
				'Объект действия возвращен с неправильным временем создания');
			test.strictEqual( resultData.action.eventStart, resultObjAction.action.eventStart,
				'Объект действия возвращен с неправильным временем выполнения действия');
			test.strictEqual( resultData.action.action, resultObjAction.action.action,
				'Объект действия возвращен с неправильным описанием действия');
			test.strictEqual( resultData.action.eventName, resultObjAction.action.eventName,
				'Объект действия возвращен с неправильным названием действия');
			test.strictEqual( resultData.action.status, CONST.STAT.FINISH,
				'Объект действия возвращен с неправильным статусом действия');
			test.strictEqual( resultData.action.condition.startPlaceIds,
				resultObjAction.action.condition.startPlaceIds, 'Объект действия возвращен ' +
					'с неправильной стартовой точкой');
			if ( resultData ) resultObjAction = resultData;
			test.done();
		} );
	},
	//Поиск действия по временному интервалу
	findActionFromStartTimePeriod: function( test ){
		test.expect( 11 );

		var oQuery = {
			selector:{
				eventStart:{
					min:testStartTimeAction - 1000,
					max:testStartTimeAction + 1000
				}
			},
			fields:'all'
		};

		autopilot.findAction( oQuery, function( err, resultData ) {
			if ( err ) {
				console.log( err );
			}
			test.ifError(err);
			test.ok( resultData, 'Не найдено действие по идентификатору' );
			test.ok( resultData.length, 'Не найдено не одно действие' );
			test.strictEqual( resultData[0]._id, resultObjAction._id,
				'Объект действия возвращен с неправильным идентификатором');
			test.strictEqual( resultData[0].tsUpdate, resultObjAction.tsUpdate,
				'Объект действия возвращен с неправильным временем обновления');
			test.strictEqual( resultData[0].tsCreate, resultObjAction.tsCreate,
				'Объект действия возвращен с неправильным временем создания');
			test.strictEqual( resultData[0].action.eventStart, resultObjAction.action.eventStart,
				'Объект действия возвращен с неправильным временем выполнения действия');
			test.strictEqual( resultData[0].action.action, resultObjAction.action.action,
				'Объект действия возвращен с неправильным описанием действия');
			test.strictEqual( resultData[0].action.status, CONST.STAT.FINISH,
				'Объект действия возвращен с неправильным статусом действия');
			test.strictEqual( resultData[0].action.eventName, resultObjAction.action.eventName,
				'Объект действия возвращен с неправильным названием действия');
			test.strictEqual( resultData[0].action.condition.startPlaceIds,
				resultObjAction.action.condition.startPlaceIds, 'Объект действия возвращен ' +
					'с неправильной стартовой точкой');
			test.done();
		} );
	},
	//Поиск по идентификатору с указанием необходимых возвращаемых полей
	findActionFieldsFromActionId:function( test ){
		test.expect( 8 );

		var oQuery = {
			selector:{
				_id:resultObjAction._id
			},
			fields:['status', 'eventName', 'eventStart', 'action']
		};

		autopilot.findAction( oQuery, function( err, resultData ) {
			if ( err ) {
				console.log( err );
			}
			test.ifError(err);
			test.strictEqual( resultData._id, resultObjAction._id,
				'Объект действия возвращен с неправильным идентификатором');
			test.strictEqual( resultData.tsUpdate, resultObjAction.tsUpdate,
				'Объект действия возвращен с неправильным временем обновления');
			test.strictEqual( resultData.tsCreate, resultObjAction.tsCreate,
				'Объект действия возвращен с неправильным временем создания');
			test.strictEqual( resultData.status, CONST.STAT.FINISH,
				'Объект действия возвращен с неправильным статусом действия');
			test.strictEqual( resultData.eventStart, resultObjAction.action.eventStart,
				'Объект действия возвращен с неправильным временем выполнения действия');
			test.strictEqual( resultData.action, resultObjAction.action.action,
				'Объект действия возвращен с неправильным описанием действия');
			test.strictEqual( resultData.eventName, resultObjAction.action.eventName,
				'Объект действия возвращен с неправильным названием действия');
			test.done();
		} );
	},
	//Поиск по временному интервалу с указанием необходимых возвращаемых полей
	findActionFieldsFromStartTimePeriod:function( test ){
		test.expect( 8 );

		var oQuery = {
			selector:{
				eventStart:{
					min:testStartTimeAction - 1000,
					max:testStartTimeAction + 1000
				}
			},
			fields:['status', 'eventName', 'eventStart', 'action']
		};

		autopilot.findAction( oQuery, function( err, resultData ) {
			if ( err ) {
				console.log( err );
			}
			test.ifError(err);
			test.ok( resultData.length, 'Не найдено не одно действие' );
			test.strictEqual( resultData[0]._id, resultObjAction._id,
				'Объект действия возвращен с неправильным идентификатором');
			test.strictEqual( resultData[0].tsUpdate, resultObjAction.tsUpdate,
				'Объект действия возвращен с неправильным временем обновления');
			test.strictEqual( resultData[0].tsCreate, resultObjAction.tsCreate,
				'Объект действия возвращен с неправильным временем создания');
			test.strictEqual( resultData[0].eventStart, resultObjAction.action.eventStart,
				'Объект действия возвращен с неправильным временем выполнения действия');
			test.strictEqual( resultData[0].action, resultObjAction.action.action,
				'Объект действия возвращен с неправильным описанием действия');
			test.strictEqual( resultData[0].eventName, resultObjAction.action.eventName,
				'Объект действия возвращен с неправильным названием действия');
			test.done();
		} );
	}
};

//Проверка запросов на модификацию
exports.testModify = {
	modifyAction:function ( test ){
		test.expect( 19 );

		var oQuery = {
			selector:{
				_id:resultObjAction._id,
				tsUpdate:resultObjAction.tsUpdate
			},
			properties:{
				eventName:'testEvent2',
				action:'testDescription'
			}
		};

		autopilot.modifyAction( oQuery, function( err, resultData ) {
			if ( err ) {
				console.log( err );
			}
			test.ifError(err);
			test.ok( resultData, 'Не найдено действие по идентификатору' );
			test.strictEqual( resultData._id, resultObjAction._id,
				'Объект действия возвращен с неправильным идентификатором');
			test.notStrictEqual( resultData.tsUpdate, resultObjAction.tsUpdate,
				'Объект действия возвращен с неправильным временем обновления');
			test.strictEqual( resultData.tsCreate, resultObjAction.tsCreate,
				'Объект действия возвращен с неправильным временем создания');
			test.strictEqual( resultData.action.status, resultObjAction.action.status,
				'Объект действия возвращен с неправильным статусом действия');
			test.strictEqual( resultData.action.eventStart, resultObjAction.action.eventStart,
				'Объект действия возвращен с неправильным временем выполнения действия');
			test.strictEqual( resultData.action.action, oQuery.properties.action,
				'Объект действия возвращен с неправильным описанием действия');
			test.strictEqual( resultData.action.eventName, oQuery.properties.eventName,
				'Объект действия возвращен с неправильным названием действия');
			test.strictEqual( resultData.action.condition.startPlaceIds,
				resultObjAction.action.condition.startPlaceIds, 'Объект действия возвращен ' +
					'с неправильной стартовой точкой');

			//Делаем контрольный запрос на чтение по идентификатору
			var oQuery2 = {
				selector:{
					_id:resultObjAction._id
				},
				fields:'all'
			};

			autopilot.findAction( oQuery2, function( err, resultData2 ) {
				if ( err ) {
					console.log( err );
				}
				test.ifError(err);
				test.strictEqual( resultData2._id, resultObjAction._id,
					'Объект действия возвращен с неправильным идентификатором');
				test.strictEqual( resultData2.tsUpdate, resultData.tsUpdate,
					'Объект действия возвращен с неправильным временем обновления');
				test.strictEqual( resultData2.tsCreate, resultObjAction.tsCreate,
					'Объект действия возвращен с неправильным временем создания');
				test.strictEqual( resultData2.action.status, resultObjAction.action.status,
					'Объект действия возвращен с неправильным статусом действия');
				test.strictEqual( resultData2.action.eventStart, resultObjAction.action.eventStart,
					'Объект действия возвращен с неправильным временем выполнения действия');
				test.strictEqual( resultData2.action.action, oQuery.properties.action,
					'Объект действия возвращен с неправильным описанием действия');
				test.strictEqual( resultData2.action.eventName, oQuery.properties.eventName,
					'Объект действия возвращен с неправильным названием действия');
				test.strictEqual( resultData2.action.condition.startPlaceIds,
					resultObjAction.action.condition.startPlaceIds, 'Объект действия возвращен ' +
						'с неправильной стартовой точкой');

				resultObjAction = resultData2;
				test.done();
			} );
		} );
	}
};

//Тестирование удаления действия изменения статуса на удаленный (ахрхивный)
exports.testDelete = {
	deleteAction:function ( test ){
		test.expect( 19 );
		debugger;
		var oQuery = {
			selector:{
				_id:resultObjAction._id,
				tsUpdate:resultObjAction.tsUpdate
			}
		};

		autopilot.deleteAction( oQuery, function( err, resultData ) {
			if ( err ) {
				console.log( err );
			}
			test.ifError(err);
			test.ok( resultData, 'Не найдено действие по идентификатору' );
			test.strictEqual( resultData._id, resultObjAction._id,
				'Объект действия возвращен с неправильным идентификатором');
			test.notStrictEqual( resultData.tsUpdate, resultObjAction.tsUpdate,
				'Объект действия возвращен с неправильным временем обновления');
			test.strictEqual( resultData.tsCreate, resultObjAction.tsCreate,
				'Объект действия возвращен с неправильным временем создания');
			test.notStrictEqual( resultData.action.status, resultObjAction.action.status,
				'Объект действия возвращен с неправильным статусом действия');
			test.strictEqual( resultData.action.eventStart, resultObjAction.action.eventStart,
				'Объект действия возвращен с неправильным временем выполнения действия');
			test.strictEqual( resultData.action.action, resultObjAction.action.action,
				'Объект действия возвращен с неправильным описанием действия');
			test.strictEqual( resultData.action.eventName, resultObjAction.action.eventName,
				'Объект действия возвращен с неправильным названием действия');
			test.strictEqual( resultData.action.condition.startPlaceIds,
				resultObjAction.action.condition.startPlaceIds, 'Объект действия возвращен ' +
					'с неправильной стартовой точкой');

			//Делаем контрольный запрос на чнение с указанием фильтрации по статусу
			var oQuery2 = {
				selector:{
					_id:resultObjAction._id,
					status:CONST.STAT.DELETE
				},
				fields:'all'
			};

			autopilot.findAction( oQuery2, function( err, resultData2 ) {
				if ( err ) {
					console.log( err );
				}
				test.ifError(err);
				test.strictEqual( resultData2._id, resultObjAction._id,
					'Объект действия возвращен с неправильным идентификатором');
				test.strictEqual( resultData2.tsUpdate, resultData.tsUpdate,
					'Объект действия возвращен с неправильным временем обновления');
				test.strictEqual( resultData2.tsCreate, resultObjAction.tsCreate,
					'Объект действия возвращен с неправильным временем создания');
				test.strictEqual( resultData2.action.status, oQuery2.selector.status,
					'Объект действия возвращен с неправильным статусом действия');
				test.strictEqual( resultData2.action.eventStart, resultObjAction.action.eventStart,
					'Объект действия возвращен с неправильным временем выполнения действия');
				test.strictEqual( resultData2.action.action, resultObjAction.action.action,
					'Объект действия возвращен с неправильным описанием действия');
				test.strictEqual( resultData2.action.eventName, resultObjAction.action.eventName,
					'Объект действия возвращен с неправильным названием действия');
				test.strictEqual( resultData2.action.condition.startPlaceIds,
					resultObjAction.action.condition.startPlaceIds, 'Объект действия возвращен ' +
						'с неправильной стартовой точкой');

				resultObjAction = resultData2;
				test.done();
			} );

		});

	}
};