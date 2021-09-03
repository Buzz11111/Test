/**
 * Тестовая задача возвращающая результат "Успех"
 */
function test_success(){
	return ok("Тестовая задача успешно выполнена", "Успех");
}

/**
 * Тестовая задача возвращающая результат "Ошибка"
 */
function test_error(){
	return badRequest("Тестовая задача выполнена с ошибкой", "Ошибка");
}

/**
 * Тестовая задача в которой происходит необработанное исключение
 */
function test_exception(){
	throw new Error("Необработанное исключение в фоновой задаче");
}

/**
 * Тестовая задача возвращающая некорректный результат
 */
function test_badresponse(){
	return 1;
}

/**
 * Тестовая задача возвращающая контент содержащий различные недопустимые символы
 */
function test_invalid_content(){
	return ok("Фоновая задача выполнена успешно", "fdsfsfs 'fdsfsd' fsfdfs - «авилоыва» ! nvjdfvfjnsfl");
}

/**
 * Фоновая задача в которой используется метод fetch
 */
function test_use_fetch(){
	var result = db.find("rdev___shadow_tasks");

	if(result == null){
		return badRequest("Не удалось получить список фоновых задач", "Ошибка");
	}

	return ok("Фоновая задача выполнена успешно, количество фоновых задач: " + result.length, result.length);
}

/**
 * Фоновая задача для обновления записей таблицы
 */
function test_update_field(){
	var records = db.find("test_shadowtask_table");

	if(records == null){
		return ok("Нет записей для обновления", "Нет записей для обновления");
	}

	for(var i = 0; i < records.length; ++i){
		db.update("test_shadowtask_table", {
			recid: records[i].recid,
			test_field2: Math.random() * (100 - 0) + 0,
			reccreated: records[i].reccreated,
			recupdated: records[i].recupdated
		});
	}

	return ok("Записи обновлены", "Записи обновлены");
}