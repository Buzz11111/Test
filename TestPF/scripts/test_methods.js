
/**
 * Метод для возврата сообщения об успехе
 * @param {string} message сообщение
 * @param {any} data данные
 */
function ok(message, data) {
	return {
		success: true,
		message: message,
		data: data
	};
}

/**
 * Метод для возврата сообщения об ошибке
 * @param {string} message сообщение
 * @param {any} data данные
 */
function badRequest(message, data) {
	return {
		success: false,
		message: message,
		data: data
	};
}

/**
 * Метод для тестирования успешного результата выполнения
 */
function test_success() {
	return ok("Сообщение об успехе из метода");
}

/**
 * Метод для тестирования результата с ошибкой
 */
function test_error() {
	return badRequest("Сообщение об ошибке из метода");
}

/**
 * Метод для тестирования метода с запросом на сторонний ресурс (успех)
 */
function test_request_success() {
	var result = fetch("https://jsonplaceholder.typicode.com/todos/1");

	return ok("Сообщение об успехе из метода: " + JSON.stringify(result.data), result);
}

/**
 * Метод для тестирования метода с запросом на сторонний ресурс (ошибка)
 */
function test_request_error() {
	var result = fetch("https://doesnotexist");

	if (result.success) {
		return ok("Сообщение об успехе из метода", result);
	}

	return badRequest("Сообщение об ошибке из метода: " + result.message, result);
}

/**
 * Метод для тестирования статического метода с запросом на сторонний ресурс (успех)
 */
function test_static_success() {
	var result = fetch("https://jsonplaceholder.typicode.com/todos/1");

	return ok("Сообщение об успехе из метода: " + JSON.stringify(result.data), result);
}

/**
 * Метод для тестирования запроса на удаленный сервер с последующим сохранением записи в бд
 */
function test_request_and_insert() {
	var result = fetch("https://jsonplaceholder.typicode.com/todos/1");

	try {
		db.insert("method_request_test_table", { sysstring_field1: JSON.parse(result.data).title });
	}
	catch (error) {
		return badRequest("Ошибка создания записи: " + error);
	}

	return ok("Запись успешно добавлена", result);
}


/**
 * Метод для тестирования хранимой процедуры обновления записи (с параметрами)
 * @param {object} params Объект, переданный из выбранной строки таблицы, содержащий recid и новые значения полей записи(sysstring_field и sysint_field) .
 */
function test_procedure_update(params) {

	db.execprocedure({
		name: "test_update_record",
		parameters: [
			{
				name: "_recid",
				value: params.recid,
				type: "SysGUID",
			},
			{
				name: "_newstring",
				value: params.sysstring_field,
				type: "SysString",
			},
			{
				name: "_newnumb",
				value: params.sysint_field,
				type: "SysInt",
			}
		]
	})
	return {
		success: true,
		message: "Успешно",
	};
}

/**
 * Тестовый метод для генерации Pdf файла
 * @param {*} params 
 */
function test_method_for_generate_pdf_file(params) {
	var variable = {};
	variable.test_sysfile_table = db.findbyrecid("test_sysfile_table", params.recid);
	var res = reports.generate("Protokol", "docx", "report", "pdf", variable, params.recid, "test_sysfile_table", "test_file1");
	return { "success": true, "message": res.recid };
}

/**
 * Метод для тестирования хранимой процедуры обновления записи (без передачи параметров)
 */
function test_procedure_update2() {

	db.execprocedure({
		name: "test_update_record2",
		parameters: []
	});
	return {
		success: true,
		message: "Успешно",
	};
}

function test_nested_method() {
	return {
		success: true,
		message: "Вызван вложенный метод",
	};
}

/** Метод, вызывающийся из таблицы "Мультивыбор" */
function test_multiselect(params) {
	//return params;
	return {
		success: true,
		message: "Успешно",
	};
}

/**
 * Тестовый метод поииска записи по recid
 * @param {Object} params - объект, который хранит значение recid
 */
function test_findbyrecid_success(params) {
	try {
		var result = db2.findbyrecid("findbyrecid_method_test_table", params.recid);
		return ok("Запись успешно найдена по recid: " + result.recid, result);
	} catch (e) {
		return badRequest("Ошибка при попытке найти запись по RecId. " + params.recid + " " + e, null);
	}
}

/**
 * Тестовый метод поииска записи по recid (Ошибка нет записи с таким идентификатором)
 * @param {Object} params - объект, который хранит значение recid
 */
function test_findbyrecid_error_nonexistent_recid(params) {
	try {
		// При выполнении поиска должны улететь в catch
		var result = db2.findbyrecid("findbyrecid_method_test_table", "5a60bdb3-85b2-4e0e-9870-a704de6e66a0");
		return ok("Запись успешно найдена по recid: 5a60bdb3-85b2-4e0e-9870-a704de6e66a0", result);
	} catch (e) {
		return badRequest("Ошибка при попытке найти запись по recid: " + params.recid + " " + e, null);
	}
}

/**
 * Тестовый метод поииска записи по recid (Ошибка null идентификатор)
 * @param {Object} params - объект, который хранит значение recid
 */
function test_findbyrecid_error_null_recid(params) {
	try {
		// При выполнении поиска должны улететь в catch
		var result = db2.findbyrecid("findbyrecid_method_test_table", null);
		return ok("Запись успешно найдена", result);
	} catch (e) {
		return badRequest("Ошибка при попытке найти запись по recid: NULL. " + e, null);
	}
}

/**
 * Тестовый метод поиска по параметрам MethodProvider.FindByParams
 * @param {Object} params 
 */
function test_findbyparams(params) {
	try {
		delete params.recid; // Исключим recid из поиска
		var result = db2.findbyparams("findbyparams_method_test_table", params);
		return ok("По параметрам: testfield1: " + params.testfield1 + ", testfield2: " + params.testfield2 + ", testfield3: " + params.testfield3 + " успешно найдены записи в количестве: " + result.length, result);
	} catch (e) {
		return badRequest("Ошибка при попытке найти запись по параметрам. " + e, null);
	}
}

/**
 * Тестовый метод поиска по параметрам MethodProvider.FindByParams с сортировкой
 * @param {Object} params 
 */
function test_findbyparams_sorted(params) {
	try {
		delete params.recid; // Исключим recid из поиска

		var sorted = {
			testfield2: null
		};

		var result = db2.findbyparams("findbyparams_method_test_table", params, sorted);

		var sortedList = "";

		for (var i = 0; i < result.length; i++) {
			sortedList += result[i].testfield2 + " ";
		}

		return ok("Записи успешно найдены в количестве: " + result.length + ". Результат сортировки: " + sortedList, result);
	} catch (e) {
		return badRequest("Ошибка при попытке найти запись по параметрам. " + e, null);
	}
}

/**
 * Тестовый метод поиска по параметрам MethodProvider.FindByParams с ограничением выводимых строк
 * @param {Object} params 
 */
function test_findbyparams_limit(params) {
	try {
		delete params.recid; // Исключим recid из поиска
		var result = db2.findbyparams("findbyparams_method_test_table", params, null, 2);
		return ok("По параметрам: testfield1: " + params.testfield1 + " успешно найдены записи в количестве: " + result.length, result);
	} catch (e) {
		return badRequest("Ошибка при попытке найти запись по параметрам. " + e, null);
	}
}

/**
 * Тестовый метод добавления записи через MethodProvider.Insert
 * @param {Object} params 
 */
function test_insert(params) {
	try {
		delete params.recid; // Исключим recid из добавления
		var result = db2.insert("insert_method_test_table", params)
		return ok("Запись успешно добавлена", result);
	} catch (e) {
		return badRequest("Ошибка при добавлении записи. " + e, null);
	}
}

/**
 * Тестовый метод обновления записи через MethodProvider.UpdateByRecid
 * @param {Object} params 
 */
function test_update(params) {
	try {
		var result = db2.update("update_method_test_table", params)
		return ok("Запись успешно обновлена", result);
	} catch (e) {
		return badRequest("Ошибка при обновлении записи. " + e, null);
	}
}

/**
 * Тестовый метод удаления записи через MethodProvider.DeleteByRecid
 * @param {Object} params 
 */
function test_delete(params) {
	try {
		var result = db2.delete("delete_method_test_table", params.recid)
		return ok("Запись успешно удалена", result);
	} catch (e) {
		return badRequest("Ошибка при удалении записи. " + e, null);
	}
}

/**
 * Тестовый метод для запуска статических анонимных методов
 */
function test_static_methods_execute() {

	var successResult = false;
	var notAnonymResult = false;
	var ghostResult = false;
	var fetchResult = false;

	// Метод возвращает успех
	var successResult = executeStaticMethod("test_static_method_success");
	if (successResult.result.success)
		successResult = true;

	try {
		// Метод должен вернуть ошибку
		executeStaticMethod("test_static_method_is_not_anonym");
	} catch (e) {
		notAnonymResult = true;
	}

	try {
		// Метод должен вернуть ошибку
		executeStaticMethod("test_ghost_method");
	} catch (e) {
		ghostResult = true;
	}

	try {
		// Метод возвращает успех
		executeStaticMethod("test_static_method_fetch");
		fetchResult = true;
	} catch (e) {
		fetchResult = false;
	}

	// Если вернулся ожидаемый результат - ок
	if (successResult && notAnonymResult && ghostResult && fetchResult)
		return ok("Все статические методы вернули ожидаемый результат", "Все статические методы вернули ожидаемый результат");

	// Если что-то пошло не так
	return badRequest("Не все методы вернули ожидаемый результат", "Не все методы вернули ожидаемый результат");
}

/**
 * Метод выполняет статический метод
 * @param {string} methodParam название метода
 */
function executeStaticMethod(methodParam) {
	var request = {
		method: methodParam,
		fields: {}
	};

	var result = fetch(host + "/api/anonym", {
		method: "POST",
		headers: {},
		body: JSON.stringify(request)
	});

	if (result.success == false)
		throw new Error(result.message);

	var data = result.data;

	if (data == null || data == "")
		return null;

	data = JSON.parse(data);

	return (Object.keys(data).length > 0) ? data : null;
}

/**
 * Тестовый метод вызываемый модальным окном с приложенным файлом
 * @param {*} params 
 */
function test_method_for_sysfile_in_modal_screen(params) {
	return {
		success: true,
		message: JSON.stringify(params)
	}
}

/**
 * Тестовый метод для формирования архива из приложенных файлов
 * @param {*} param 
 */
function test_method_for_form_zip_file(params) {
	var attachedfiles = getattachedfileincolumn("test_sysfile_table", "test_file1", params.recid);
	if (attachedfiles == null) {
		attachedfiles = [];
	}
	if (attachedfiles.length <= 0) {
		return {
			success: false,
			message: "Приложите хотя-бы один файл"
		}
	}
	var filesForPack = [];
	for (var i = 0; i < attachedfiles.length; i++) {
		filesForPack.push(attachedfiles[i].recId);
	}

	var packRes = PackFileToZipArchive("archive", "test_sysfile_table", params.recid, "zip_file_result", filesForPack, true)
	return packRes
}

/**
 * Тестовый метод для распаковки приложенного архива
 * @param {*} params 
 */
function test_method_for_unpack_zip_file(params) {
	if (params.zip_files_for_unpack.length <= 0) {
		return {
			success: false,
			message: "Приложите хотя-бы один архив на форму"
		}
	}

	for (var i = 0; i < params.zip_files_for_unpack.length; i++) {
		var zip_file = params.zip_files_for_unpack[i];
		var unpackres = UnpackFilesFromZipArchive(zip_file, "test_sysfile_table", params.recid, "unpacked_zip_file_result");
		if (!unpackres.success) {
			return unpackres;
		}
	}
	return {
		success: true,
		message: "Архивы успешно распакованы"
	}

}

/**
 * Тестовый	метод для генерации файла с содержимым
 * @param {*} params 
 */
function test_method_for_generate_file_with_content(params) {
	var save_content_as_file_result = SaveContentAsFileAsync("test_sysfile_table", params.recid, "test_file3", "generated_file", "txt", params.file_content);
	if (!save_content_as_file_result.success) {
		return save_content_as_file_result;
	}
	return {
		success: true,
		message: "Файл успешно сгенерирован"
	}
}

/**
 * Тестовый метод для пакетного подписания файлов
 * @param {*} params 
 */
function test_method_for_packet_sign_files(params) {
	var records = db.findbyparams("test_sysfile_table", {
		recstate: 1
	})

	if (records == null || records.length <= 0) {
		return {
			success: false,
			message: "Не найдено записей для подписания"
		};
	}

	var recids = records.map(function (record) {
		return record.recid;
	});


	//Получение файлов в карточке
	var attached_files = [];
	recids.forEach(function (elem) {
		var attachedfiles = getattachedfileincolumn("test_sysfile_table", "test_file1", elem);
		if (attachedfiles.length > 0) {
			for (var i = 0; i < attachedfiles.length; i++) {
				attached_files.push(attachedfiles[i].recId);
			}
		}
	})

	if (attached_files.length > 0) {
		return {
			success: true,
			message: "Найдено файлов " + attached_files.length,
			data: attached_files
		}
	} else {
		return {
			success: false,
			message: "Не найдено файлов для подписи"
		}
	}
}

/**
 * Получение приложенных файлов в таблице по наименованию таблицы и идентификатору записи
 * @param {*} tableName Имя таблицы
 * @param {*} recid     Идентификатор записи, в которой искать файл
 */
function getattachedfiles(tableName, recid) {
	if (tableName == "" || tableName == null)
		throw new Error("Ошибка, значение tableName не может быть равно Null или Empty.");

	if (recid == "" || recid == null)
		throw new Error("Ошибка, значение recid не может быть равно Null или Empty.");

	var url = String().concat(host, "/api/files/list/", tableName, "/", recid);
	return sendRequest("GET", null, url, null);
}

/**
 * Получение приложенных файлов в таблице по наименованию таблицы, колонки и идентификатору записи, в которой нужно искать приложенный файл
 * @param {*} table_name        Наименование таблицы
 * @param {*} column_name       Наименование колонки с файлом
 * @param {*} recid             Идентификатор записи
 */
function getattachedfileincolumn(table_name, column_name, recid) {

	var files_record = getattachedfiles(table_name, recid);
	var files_records_data = files_record.data;
	if (files_records_data == null) {
		return []
	} else if (files_records_data.length <= 0) {
		return []
	}

	var attached_files = [];
	for (var i = 0; i < files_records_data.length; i++) {
		var file_record = files_records_data[i];
		if (file_record.columnName == column_name) {
			attached_files.push(file_record);
		}
	}
	return attached_files;
}

/**
 * Подписать файлы в поле 'Тестовый файл 1'
 * @param {*} params 
 */
function test_method_for_sign_files_in_field(params) {
	var files_in_field = getattachedfileincolumn("test_sysfile_table", "test_file1", params.recid);
	if (files_in_field == null) {
		return {
			success: true,
			message: "Нет файлов для подписи",
			data: []
		}
	}

	if (files_in_field.length == 0) {
		return {
			success: true,
			message: "Нет файлов для подписи",
			data: []
		}
	}

	var files_to_sign = [];
	for (var i = 0; i < files_in_field.length; i++) {
		var file_in_field = files_in_field[i];
		if (file_in_field.isVerify != true) {
			files_to_sign.push(file_in_field.recId);
		}
	}
	return {
		success: true,
		message: String().concat("Найдено файлов для подписи: ", files_to_sign.length),
		data: files_to_sign
	}
}

/**
 * Метод проверки часовых поясов
 * @param {*} params
 */
function test_method_for_timezones_check(params) {

	db.insert("date_testing_table", { systimedate_field: params.test_systimedate_field, sysdate_field: params.test_sysdate_field })

	return {
		success: true,
		message: "Новая запись создана",
		data: params
	}
}

/**
 * Метод для проверки валидаций на форме
 * @param {*} params 
 */
function test_check_validation_method(params) {
	return params;
}

/**
 * Тестовый метод генерации файла
 * @param {Object} params 
 */
function generate_files(params) {
	try {
		var fileIdList = [];

		if (params.recordIdList == null) {
			var recordList = db.find("test_workflow_method_table");

			if (recordList && recordList.length > 0) {
				for (var i = 0; i < recordList.length; i++) {
					var fileRecords = getattachedfileincolumn("test_workflow_method_table", "testfilefield", recordList[i].recid);

					if (fileRecords && fileRecords.length > 0) {
						for (var j = 0; j < fileRecords.length; j++) {
							fileIdList.push(fileRecords[j].recId);
						}
					}
				}
			}
		} else {
			for (var i = 0; i < params.recordIdList.length; i++) {
				var fileRecords = getattachedfileincolumn("test_workflow_method_table", "testfilefield", params.recordIdList[i]);

				if (fileRecords && fileRecords.length > 0) {
					for (var j = 0; j < fileRecords.length; j++) {
						fileIdList.push(fileRecords[j].recId);
					}
				}
			}
		}

		return { success: true, message: "Complete generate files", data: fileIdList };
	} catch (ex) {
		return { success: false, message: "Ошибка получения файлов: " + ex, data: null };
	}
}

/**
 * Метод отправки файла
 * @param {Object} params 
 */
function send_data_file(params) {
	// Искусственная задержка
	for (var i = 0; i < 5000000; i++) { }
	return { success: true, message: "send_data_file", data: params };
}

/**
 * Проверка подписи для файлов
 * @param {*} fileIdList 
 */
function check_sign_exists(fileIdList) {
	return { success: true, message: "", data: true };
}

/**
 * Метод построения XML для СМЭВ3
 * @param {*} params 
 */
function buildxml(params) {
	try {
		var recId = params.recordIdList[0]; // получили recid текущей записи
		var record = db.findbyrecid("test_workflow_method_rsmev_sendxml", recId); // из нужной таблицы или таблиц получим все данные для построения XML;

		record.vibor = "ogrn";
		record.num = "БН";

		var request = {
			converterName: params.data.convertername, //"VS00051v003-FNS001",
			format: "xml",
			form: record,
			isBuildEnvelope: true,
			isProviderResponse: params.data.isproviderresponse, //false,
			isTest: params.data.isemulator
		};

		// отправим эти данные для построения запроса в т.н. конвертор на шлюзе внутри RDEV
		var xml = rdev.buildXmlFromJson(request); // создадим необходимую обертку в MethodProvider

		// теперь в xml - запрос без подписей вообще - отправим его дальше по бизнес-процессу
		return { success: true, message: "Запрос для СМЭВ успешно построен", data: xml };
	} catch (ex) {
		return { success: false, message: ex, data: null };
	}
}

/**
 * Метод отправки запроса в СМЭВ
 * @param {any} params
 */
function sendsmevrequest(params) {
	try {
		var reqDescriptor = "urn:SendRequest";
		rdev.sendSoapToSmev(params.data, reqDescriptor);
		return { success: true, message: "Запрос успешно отправлен", data: params.data };
	} catch (ex) {
		return { success: false, message: ex, data: null };
	}
}

/**
 * Проверка построения XML
 * @param {Object} params 
 */
function buildxmlfromjson(params){
	var xml = rdev.buildXmlFromJson(params);
	return xml;
}

/**
 * Метод для проверки генерации QR кодов и встраивания их в документ
 * @param {Object} params 
 */
function createqrcodeinsidedocument(params) {
	try {
		var variable = {};
		// информация о документе-шаблоне
		var templateFileName = params.templateFileName;
		var templateFileFormat = params.templateFileFormat;
		// информация о документе, который сформируем на выходе
		var outputFileName = params.outputFileName;
		var outputFileFormat = params.outputFileFormat;

		var images = [];
		for (var i = 0; i < params.qrInfo.length; ++i) {
			images.push({
				name: params.qrInfo[i].name,
				content: rdev.generateQrCode(params.qrInfo[i].encodeData),
				dpi: params.qrInfo[i].dpi
			});
		}

		// заглушки
		var entityId = "ed2167bd-3bdb-4919-93d8-faa675547a4b";
		var entityName = "testEntityName";
		var columnName = "testColumnName";

		// генерируем документ
		return reports.generate(templateFileName, templateFileFormat, outputFileName
			, outputFileFormat
			, variable
			, entityId
			, entityName
			, columnName
			, images
		);
	} catch (ex) {
		return ex.message;
	}
}

/**
 * Обработка события OnOpen
 * @param {Object} params {
 * 		tableName: "",
 * 		recId: ""
 * }
 */
function onopen_test_method(params){
	for(var i = 0; i < 50000; i++) {} // delay
	return { success: true, message: "Метод-обработчик события вернул положительный результат", data: params };
}

function onopen_test_method_error(params){
	for(var i = 0; i < 50000; i++) {} // delay
	return { success: false, message: "Метод-обработчик события вернул ошибку", data: params };
}

/**
 * Тестовый метод для компонента динамической формы
 */
function form_in(data) {
	return [
		{
			"label": "Uno",
			"value": "1"
		},
		{
			"label": "Duos",
			"value": "2"
		}
	];
}