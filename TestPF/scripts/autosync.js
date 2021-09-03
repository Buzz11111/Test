/**
 * Объект-обертка возвращаемого результата выполнения фоновой задачи в нужном формате
 */
autosyncresult = {
	/**
	 * Метод возвращающий успешный результат выполнения фоновой задачи
	 * @param {*} data - данные которые необходимо вернуть из фоновой задачи. 
	 * Попадают в rdev___shadow_tasks.content
	 */
	success: function(data){
		event.log("autosync", null, "Фоновая задача выполнена успешно", 1, data);
		return {
			success: true,
			message: "",
			data: data
		};
	},
	/**
	 * Метод возвращающий результат с ошибкой выполнения фоновой задачи
	 * @param {*} message - сообщение об ошибке
	 */
	error: function(message){
		event.log("autosync", null, "Фоновая задача выполнена с ошибкой", 4, message);
		return {
			success: false,
			message: message,
			data: null
		};
	}
};

/**
 * Объект отвечающий за запросы к API синхронизации на RDEV
 */
syncapi = {
	/**
	 * Метод затягивает изменения из удаленного узла синхронизации
	 * @param {*} id - идентификатор настройки узла синхронизации
	 */
	pull: function(id){
		var url = String().concat(host, "/pull/", id);

		var result = fetch(url, {
			method: "GET",
			headers: addAuthHeader(null),
			body: null
		});

		if(!result.Success){
			throw new Error(result.Message);
		}

		return JSON.parse(result.Data);
	}
};

/**
 * Фоновая задача для выполнения автоматической синхронизации
 */
function autosync(){
	var logObjectName = "autosync";
	try{
		event.log(logObjectName, null, "Выполняем фоновую задачу по автоматической синхронизации", 1, null);
		event.log(logObjectName, null, "Получаем список узлов синхронизации", 1, null);

		// Получаем список узлов синхронизации
		var syncNodes = db.findbyparams("rdev___sync_nodes", { recstate: 1 });

		event.log(logObjectName, null, "Метод получения списка успешно выполнен", 1, syncNodes);

		// Если отсутствуют узлы синхронизации
		if(syncNodes == null){
			return autosyncresult.success("Отсутствуют узлы синхронизации. Фоновая задача была завершена.");
		}

		event.log(logObjectName, null, "Выполняем синхронизацию с каждым из полученных узлов", 1, null);

		// Выполняем цикл по перебору всех узлов синхронизации, затягивая изменения
		for(var i = 0; i < syncNodes.length; ++i){
			var syncNode = syncNodes[i];
			event.log(logObjectName, null, "Синхронизируем с узлом", 1, syncNode);
			var pullResult = syncapi.pull(syncNode.recid);
			event.log(logObjectName, null, "Результат синхронизации", 1, pullResult);

			var messageResult = "";
			
			if (!pullResult.success) {
				messageResult = pullResult.message;
				event.log(logObjectName, null, "Ошибка при попытке синхронизировать таблицу " + syncNode.synctable + ". " + pullResult.message, 1, null);
			} else {
				messageResult = "Синхронизация выполнена успешно";
				event.log(logObjectName, null, "Процесс синхронизации выполнен успешно", 1, syncNode);
			}
			
			db.update("rdev___sync_nodes", {
				recid: syncNode.recid,
				recdescription: messageResult,
				reccreated: syncNode.reccreated,
				recupdated: syncNode.recupdated
			});
		}

		return autosyncresult.success("Фоновая задача по автосинхронизации выполнена успешно.");
	}catch(e){
		return autosyncresult.error("Ошибка при выполнении фоновой задачи по авто синхронизации: " + e + ".");
	}
}
