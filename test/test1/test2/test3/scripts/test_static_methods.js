/**
 * Тестовый статический метод возвращающий успех
 */
function test_static_method_success(){
	return ok("Статический метод успешно выполнен", "Успех");
}

/**
 * Статический метод не являющийся анонимным (требующий авторизованного запроса)
 */
function test_static_method_is_not_anonym(){
	return badRequest("Ошибка, выполнять данный метод без авторизации запрещено!", "Ошибка");
}

/**
 * Тест метод, который не является ни статическим, ни анонимным
 */
function test_ghost_method(){
	return badRequest("Выполнен метод, который не был определен как статический анонимный!", "Ошибка");
}

/**
 * Тестовый статический метод с использованием внутреннего запроса
 * Для теста получаем список используемых фоновых задач
 */
function test_static_method_fetch(){
	var result = db.find("rdev___shadow_tasks");

	if(result != null){
		return ok(JSON.stringify(result), result);
	}

	return ok("В данном проекте отсутствуют фоновые задачи.", null);
}

/**
 * тестовый метод для установки значений с формы
 * @param {Object} data 
 */
function test_set_form_data(data){
	db.update("test_form_table_fias", data);
	return {
		success: true,
		message: "Данные сохранены успешно",
		data: data,
		closeForm: true
	};
}

function test_get_form_data(data){
	
	// получим новое значение из номерной серии "dogovorNumbers"
	var newValueResult = rdev.generateSerial("dogovorNumbers");

	if (newValueResult.success)
		data.autoSerialField = newValueResult.data;
	
	return {
		success: true,
		message: "Данные получены  успешно",
		data: data,
		closeForm: false
	};
}

function method_request_test_table_onadd(data){
	
	var record	= db.insert("method_request_test_table", 
			{ 
				recname: "Добавлено из статического метода", 
				sysstring_field1: 1000 
			});
			
	// db.insert возвращает запись со всеми свойствами
    // и первым идет лишнее свойство "@odata.context" - удалим его из объекта, если мы хотим
	// направить объект записи примяком в db2.update
	delete record["@odata.context"];
	
	// db.insert возвращает recstate = 1, что говорит о том что запись актуальна
	// если мы хотим, чтобы пользователь мог отказаться от такой записи
	// мы можем выставить recstate = 0
	record.recstate = 0;
	
	// обновим запись
	db2.update("method_request_test_table", record);
	
	// вернем результат
	return {
		success: true,
		message: "Новая запись создана - " + JSON.stringify(record),
		data: record
	};
}

