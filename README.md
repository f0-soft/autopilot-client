Autopilot client
=====

Предоставляет доступ к методам сервера автопилота.
Поддерживает соединение с сервером средствами модуля upnode.

## init( port, callback )
Производит инициализацию клиента.

Параметры:
* port - число, порт сервера
* callback( err, container ) - функция обратного вызова
	* container - объект, содержит функции работы с библиотекой
	    * findAction
	    * insertAction
	    * modifyAction
	    * deleteAction
