//Максимальное количество СЧ в партии
var batch_max_count_passport = 80;

/**
 * Метод добавления составных частей в партию (из карточки Реестр партии)
 * @param {*} params 
 */
function addkeyelements(params) {
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};

	var input_key_elements = JSON.parse(params.batch_ke_numbers);
	
	var parameters = {
		"element_numbers": input_key_elements,
		"batch_recid": params.recid
	}
	
    //Вызываем метод из плагина
    var res = plugins.callAsMethod("/plugins/nbdlogicplugin/addkeyelementlisttobatch", "post", parameters, null);
    return res;
}

/**
 * Метод "Сформировать партию"
 * @param {*} params 
 */
function toformbatch(params) {
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
	//Вызываем метод из плагина
    var res = plugins.callAsMethod(String().concat("/plugins/nbdlogicplugin/toformbatch/", params.recid), "get", null, null);
	return res;
}

/**
 * Метод подготовки данных в формате JSON для конвертации в XML с сохранением результата в БД
 * 
 * @param {*} batch запись из реестра партии
 * @param {*} is_regeneration флаг, нужно ли перегенировать файл xml и заново приложить файл
 */
function generate_xml(batch, is_regeneration){
	var user = getcurrentuser();

	if(isNullObject(user)){
		return badResp("Невозможно получить текущего пользователя");
	}

	var member = getmemberbyuserwithrecid(user.recid);

	if(isNullObject(member)){
		return badResp("Заявитель не найден в системе");
	}

	var branding_code = db.findbyrecid("dictionary_branding_codes", member.branding_code);
	if(isNullObject(branding_code)){
		return badResp("Код клеймения не найден в системе");
	}

	//ИдФайл формируется по маске: QP__date_code_guid
	var currentDate = new Date();
	var date = formatDate(currentDate).split(".").join("");
	var idFile = String().concat("QP___", date, batch.recid);
	var exchangeparticipantinfoJson = null; //СведенияОбУчастникахОбмена

	if (is_regeneration) {
		// Заполняем блок СведенияОбУчастникахОбмена
		exchangeparticipantinfoJson = {
			"senderinfo": {
				"nameorg": member.fullname,
				"inn": member.inn,
				"kpp": member.kpp
			},
			"recipientinfo":  {
				"nameorg": "ООО ИЦПВК",
				"inn": "7708255506",
				"kpp": "770801001"
			}
		}
	}

	//СертификатСоответствия
	if(isNotEmptyString(batch.certificate)){
		var certificate = db.findbyrecid("reestr_certificates", batch.certificate);
		if(isNullObject(certificate)){
			return badResp("Сертификат соответствия не найден в системе");
		}
		var certificateJson = {
			//ПолноеНаименование
			"fullname": certificate.registration_number,
			//Серия
			"seria": "",
			//Номер
			"number": certificate.registration_number,
			//ДатаВыдан
			"startdate": !!certificate.start_date ? formatDateReverse(new Date(certificate.start_date)).split(".").join("") : "", 
			//ДатаДействителенДоВкл
			"enddate": !!certificate.end_date ? formatDateReverse(new Date(certificate.end_date)).split(".").join("") : ""
		};
	} else {
		var certificateJson = {
			//ПолноеНаименование
			"fullname": "",
			//Серия
			"seria": "",
			//Номер
			"number": "",
			//ДатаВыдан
			"startdate": "", 
			//ДатаДействителенДоВкл
			"enddate": ""
		};
	}

	// В случае балка надрессорная или рама боковая определяем ГПР по справочнику
	if(batch.product_name == '477d0c01-84d3-441c-9bb9-15f9d609671d' || batch.product_name == 'b28e1a4f-d340-4ce0-a37a-d84dcfa1b6fb'){
		var gpr = db.findbyparams("dictionary_gamma_percent_resource", {
			"key_element_code": batch.product_name,
			"scheme": batch.documentation_number
		},
		{
			"reccreated": "DESC"
		});

		if(isEmptyOrNullArray(gpr) || isNullObject(gpr[0])){
			return badResp(String().concat("Гамма-процентный ресурс для изделия \"", batch.product_name_text, "\" (", batch.documentation_number_text, ") отсутствует в справочнике"));
		}
		//т.к. на данный момент (04.06.2020) в справочнике нет проверки на уникальность, берём последнее добавленное значение из найденных
		gpr_value = gpr[0].value.toString() || "";
	} else {
		gpr_value = "";
	}

	var key_elements = db.findbyparams("reestr_key_elements", { "batchid": batch.recid});
	if(isEmptyOrNullArray(key_elements)){
		return badResp("Добавленные в партию СЧ не найдены в системе");
	}

	var elementsXml = [];
	key_elements.forEach(function(element){
		var item = {};
		item["certificate"] = certificateJson;
		//УИН
		item["uin"] =  element.numberke || "";
		//НаименованиеКраткое
		item["shortname"] =  batch.product_name_text || "";
		// ТУГОСТ
		item["tygost"] = batch.technical_conditions_text || "";
		// ИКГОСТ
		item["ikgost"] = batch.gost_inspector_control || "";
		//МаркаСтали
		item["steelgrade"] = element.steel_grade_calculated || "";
		if(isNotEmptyString(batch.climatic_version)){
			var climatic_version = db.findbyrecid("dictionary_climatic_version", batch.climatic_version);
			if(isNullObject(climatic_version)){
				return badResp("Климатическое исполнение не найдено в системе");
			}
			//КлиматическоеИсполнение
			item["climaticversion"] = batch.climatic_version_text || "";

			//КИГОСТ
			item["kigost"] = climatic_version.gost || "";
		} else {
			return badResp("Необходимо заполнить поле \"Климатическое исполнение\"");
		}
		//ГПР
		item["gpr"] = gpr_value || "";
		//Год
		item["year"] = !!element.date_manufacture ? new Date(element.date_manufacture).getFullYear().toString() : "";
		//НомерПлавки
		item["meltnumber"] = element.melt_number || "";
		//ПорядковыйНомерДетали
		item["serialnumber"] = element.manufacturer_number || "";
	   
		elementsXml.push(item);
	});

	var recipientinn = "";
	var recipientkpp = "";
	if(batch.recipient_checkbox && isNotEmptyString(batch.recipient_droplist)){
		var recipient = db.findbyrecid("reestr_members", batch.recipient_droplist);
		if(isNullObject(recipient)){
			return badResp("Грузополучатель не найден в системе");
		}
		recipientinn = recipient.inn;
		recipientkpp = recipient.kpp;
	}

	var batchJson = {
		//ИдФайл
		"idfile": idFile,
		//СведенияОбУчастникахОбмена
		"exchangeparticipantinfo": exchangeparticipantinfoJson,
		// Документ
		"documentinfo": {
			//ДокументНомер
			"docnumber": batch.batch_number,
			//ДокументДата
			"docdate": formatDateReverse(currentDate).split(".").join(""),

			// СведенияОбИзготовителе
			"manufacturerinfo": {
				//НомерКлеймения
				"brandingcode": branding_code.code || "",
				//НаимОрг
				"nameorg": member.fullname || "",
				//ИННЮЛ
				"inn": member.inn || "",
				//КПП
				"kpp": member.kpp || ""
			},
			//СведенияОбИнспекторе
			"inspectorinfo": {
				// НаимОрг
				"nameorg": "ООО ИЦПВК",
				// ИННЮЛ
				"inn": "7708255506",
				// КПП
				"kpp": "770801001"
			},
			//СведенияОГрузополучателе
			"recipientinfo": {
				// НаимОрг
				"nameorg": batch.recipient_calculated,
				// ИННЮЛ
				"inn": recipientinn || "",
				// КПП
				"kpp": recipientkpp || "",
				// ТранспортноеСредство
				"vehicle": batch.vehicle || ""
			}
		},
		//Строки
		"elements": elementsXml
	};

	try {
		var res = rdev.buildXmlFromJson({
			"converterName": "nbd_batch",
			"form": batchJson,
			"format": ".xml"
		});
	}catch(ex){
		return badResp("Произошла ошибка при генерации XML: " + ex, batchJson);
	}

	if(is_regeneration){
		//удаляем ранее приложенный xml
		var files = getattachedfileincolumn("reestr_batch", "draft_batch", batch.recid);
		if(!isEmptyOrNullArray(files)){
			for (var j = 0; j < files.length; j++) {
				var attached_file = files[j];
				delete_files(attached_file.recId); 
			}
		}
	}
	var save_content_as_file_result = SaveContentAsFileAsync("reestr_batch", batch.recid, "draft_batch", idFile, "xml", String().concat("<?xml version=\"1.0\" encoding=\"WINDOWS-1251\"?> \n", res), "Windows-1251");
	if(!save_content_as_file_result.success){
		return save_content_as_file_result;
	}
	return successResp(null, res);
}

/**
 * Метод "Расформировать партию"
 * @param {*} params 
 */
function disbandbatch(params) {
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};

	var parameters = {
		"recid": params.recid
	}
	//Вызываем метод из плагина
    var res = plugins.callAsMethod("/plugins/nbdlogicplugin/disbandbatch", "post", parameters, null);
	return res;
}

/**
 * Метод добавления составных частей в партию (из карточки СЧ)
 * @param {*} params 
 */
function addketobatch(params) {
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};

	var records = [];
	var selected_records = {
		"recid": params.recid
	};
	records.push(selected_records);

	var parameters = {
		"selected_records": records,
		"batch_recid": params.batch_number
	}
	
    //Вызываем метод из плагина
    var res = plugins.callAsMethod("/plugins/nbdlogicplugin/addkeyelementstobatch", "post", parameters, null);
    return res;
}

/**
 * Метод исключения СЧ из партии
 * @param {*} params 
 */
function excludefrombatch(params) {
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};

	var parameters = {
		"recid": params.recid
	}
	//Вызываем метод из плагина
    var res = plugins.callAsMethod("/plugins/nbdlogicplugin/excludefrombatch", "post", parameters, null);
	return res;
}

// Переопредление кнопки Добавить. Данный метод выолпнятеся (в реестре партий), когда нажимаем Добавить
// https://rm.mfc.ru/issues/39172
/**
 * Заполнение номера партии reestr_batch
 * @param {*} data 
 */
function reestr_batch_onadd(data){
	
	var record = null;    

	var user = getcurrentuser();

	if(isNullObject(user)){
		return {
		success: false,
		message: "Невозможно получить текущего пользователя",
		data: null
	};
	}

	var member = getmemberbyuserwithrecid(user.recid);

	if(isNullObject(member)){
		return {
		success: false,
		message: "Заявитель не найден в системе",
		data: null
		};
	}
	var branding_code = db.findbyrecid("dictionary_branding_codes", member.branding_code);

	var batch_statuses = db.findbyparams("dictionary_batch_status", { "reccode": "1" });
	
	if (isEmptyOrNullArray(batch_statuses) || isNullObject(batch_statuses[0])) {
		return {
			success: false,
			message: "Статус партии не найден в системе",
			data: null
			};
	} 
	
	var current_date = new Date();
	record	= db.insert("reestr_batch", 
		{
			batch_number: member.unique_member_identifier + "-P-"+ get_autoincremented_idx("batch_index").toString(),
			manufacturer: branding_code.code + ", " + member.fullname,
			manufacturer_address: member.actualadress,
			batch_status: batch_statuses[0].recid,
			date_passport: new Date(current_date.getFullYear(), current_date.getMonth(), current_date.getDate()), 
			date_shipping: new Date(current_date.getFullYear(), current_date.getMonth(), current_date.getDate()), 
			member: member.recid,
			is_assembly_unit_or_key_element: 0,
			count_passport: 0,
			count_xml_files: 0,
			is_recipient_edit: true
		});

		delete record["@odata.context"];
	 
		record.recstate = 0;    
	   
		db2.update("reestr_batch", record);

	return {
		success: true,
		message: "Новая запись создана",
		data: record
	};
}
/**
 * Отправка на подписание в систему Электронный инспектор
 * @param {*} batch_record  Текущая запись из reestr_batch (Партии)
 * @param {*} xml_data  Приложенный xml
 */
function send_to_sign(batch_record, xml_data) {
	// Получение настроек для вызова методов api внешей системы АС Электронный инспектор
	var settings = get_settgins_for_electronic_inspector();
	if(!settings.success){
		return settings;
	}
	// Формирование запроса
	var url_post =  String().concat(settings.electronic_inspector_url, "putdoc?", "APIKEY=", settings.electronic_inspector_apikey, "&rewrite=true")
	var headers = {
		"Content-Type": "application/xml",
		"Authorization": settings.electronic_inspector_authorization
	}
   
	var requestOptions = {
		"method": "POST",
		"headers": headers,
		"body": xml_data
	};

	// Отправляем запрос
	var sendrequestresult = fetch(url_post, requestOptions);
	
	if (!sendrequestresult.success){
		// если при отправке запроса произошла ошибка, то создаем задачу на повтроную отправку
		create_request_task(batch_record.recid, "POST", url_post, JSON.stringify(requestOptions));
	} else{
		//todo распарсить ответ
		// по описанию к задаче, получим guid и date (уникальный идентификатор и дату формирования документа)
		// запишем в таблицу reestr_batch
	   // var data = JSON.parse(sendrequestresult.data);
		// Распарсить параметры guid из data["Файл"] и date (в каком виде придет, пока неизвестно)
		// return data["Файл"];

		//Если в ответе status=siginsp, то статус партии меняем на “Подписание завершено”.
		var data = JSON.parse(sendrequestresult.data);

		// получим дату формирования запроса данных
		var date = data.date;
		var id_file = data.doc["Файл"]["ИдФайл"];
		var guid = id_file.toString().substring(17)
		batch_record.guid_doc_electronic_inspector = guid; //подставить полученный guid
		batch_record.date_doc_electronic_inspector = date; //Дата формирования документа в АС Цифровой инспектор

		// Промежуточное обновление записи
		var reestr_batch_update_res = db.update("reestr_batch", batch_record);
		if(!reestr_batch_update_res){
			return badResp("Не удалось обновить запись партии");
		}

		// Отправка get запроса будем производиться через 1 час, поэтому сразу создаем задачу в send_request_tasks
		// Формирование запроса
		var url_get = String().concat(settings.electronic_inspector_url, "getdoc?", "APIKEY=", settings.electronic_inspector_apikey, "&guid=", guid)
		//меняем headers для get запроса
		headers["Content-Type"] = "application/json"

		var requestOptions = {
			"method": "GET",
			"headers": headers
		};
		// создаем задачу на отправку
		create_request_task(batch_record.recid, "GET", url_get, JSON.stringify(requestOptions));
	}
	return successResp();
}

// метод Отправить партию если recipient_checkbox(Участник паспортизации) = true 
function send_batch_recipient_checkbox_true(params) {
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};

	//получаем запись партии
	var batch = db.findbyrecid("reestr_batch", params.recid);
	if (isNullObject(batch)) {
		return badResp("Запись о партии не найдена в системе");
	}
	
	//Получение СЧ в партии
	var key_elements = db.findbyparams("reestr_key_elements", {
		batchid: batch.recid
	});

	if(!isEmptyOrNullArray(key_elements)){
		for(var i = 0; i < key_elements.length; i++){
			var key_element = key_elements[i];
			if(key_element.is_registratred_in_rzd != true){
				return badResp("Невозможно передать партию, в которой есть неучтенные СЧ")
			}
		}
	}

	//Получение СЕ в партии
	var assembly_units = db.findbyparams("reestr_ke_nodes", {
		batchid: batch.recid
	});

	if(!isEmptyOrNullArray(assembly_units)){
		for(var i = 0; i < assembly_units.length; i++){
			var assembly_unit = assembly_units[i];
			if(assembly_unit.is_registratred_in_rzd != true){
				return badResp("Невозможно передать партию, в которой есть неучтенные СЕ")
			}
		}
	}

	var transferelementstoanothermember_res = transferelementstoanothermember(batch.recid, batch.is_assembly_unit_or_key_element);
	if(!transferelementstoanothermember_res.success){
		return transferelementstoanothermember_res;
	}

	return successResp(String().concat("Партия <a href=\"/tables/reestr_batch/", batch.recid, "\" target=\"_blank\" class=\"alert-link\"> № ", batch.batch_number, "</a> успешно отправлена"));
}

/**
 * Учет СЧ в партии
 * @param {*} params 
 */
function allow_key_elements_in_batch(params){
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
	
	var parameters = {
        "batch_recid": params.recid,
        "output_application_number": params.output_application_number
    }
    //Вызываем метод из плагина
    var res = plugins.callAsMethod("/plugins/nbdlogicplugin/allow_batch", "post", parameters, null);
    return res;
}

/**
 * Передача СЧ/СЕ другому участнику
 * @param {*} params 
 */
function transferelementstoanothermember(params, is_assembly_unit_or_key_element){
	
	var headers = {
		"Content-Type": "application/json"
	};
	var headers = addAuthHeader(headers);

	var url = null;
	if (is_assembly_unit_or_key_element == 2){
		url = String().concat(host, "/plugins/nbdlogicplugin/transferassemblyunittoanothermember/", params.toString());
	} else{
		url = String().concat(host, "/plugins/nbdlogicplugin/transferelementstoanothermember/", params.toString());
	}

	var res = fetch(url, {
		headers: headers,
		"body": JSON.stringify(params),
		"Method": "post"
	});
	var result_parse = JSON.parse(res.data);

	if (isNotEmptyString(result_parse)){
		if (result_parse.success != true){
			return {
				success: false,
				message: result_parse.message,
				data: result_parse
			};
		} else {
			return {
				success: true,
				message: result_parse.message,
				data: result_parse
			};
		}
	} else {
		return {
			success: false,
			message: "Ошибка передачи СЧ участнику. Не получен ответ на запрос.",
			data: result_parse
		};
	}
}
/**
 * Обновление статуса партии
 * @param {*} batch_recid // recid записи партии
 * @param {*} code_status // код статуса партии
 */
function update_batch_status(batch_recid, code_status){

	//получаем запись партии
	var batch = db.findbyrecid("reestr_batch", batch_recid);
	if (isNullObject(batch)) {
		return badResp("Запись о партии не найдена в системе");
	}

	// Получаем статус из справочника dictionary_batch_status (Статусы партий)
	var batch_statuses_form = db.findbyparams("dictionary_batch_status", { "reccode": code_status.toString() });
	if (isEmptyOrNullArray(batch_statuses_form) || isNullObject(batch_statuses_form[0])) {
		return badResp(String().concat("Статус партии <a href=\"/tables/reestr_batch/", batch.recid, "\" target=\"_blank\" class=\"alert-link\"> № ", batch.batch_number, "</a> не найден в системе"));
	} 
	batch.batch_status = batch_statuses_form[0].recid;

	var res = db.update("reestr_batch", batch);
	if(!res.success){
		return badResp(String().concat("Произошла ошибка при сохранении записи партии <a href=\"/tables/reestr_batch/", batch.recid, "\" target=\"_blank\" class=\"alert-link\"> № ", batch.batch_number, "</a>: ", res.message));
	} else {
		return {
			success: true,
			message: "Статус партии успешно обновлен.",
			data: null
		};
	}
}

/**
 * Метод подтверждения партии
 * @param {*} params 
 */
function confirm_acceptance(params) {
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
	
	// Проверяем на наличие просканированных УИН
	var ke_numbers_arr = JSON.parse(params.confirm_ke_numbers);
	if (ke_numbers_arr.length == 0){
		return badResp("Не были просканированы УИН СЧ");
	}

	// УИН СЧ
	var ke_number = ke_numbers_arr[0].numberValue;

	var parameters = {
		"ke_number": ke_number,
		"recid": params.recid
	}

	//Вызываем метод из плагина
    var res = plugins.callAsMethod("/plugins/nbdlogicplugin/confirmbatch", "post", parameters, null);
	return res;
}

/**
 * Метод добавления СЕ в партию (из карточки СЕ)
 * @param {*} params 
 */
function addassemblyunittobatch(params) {
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
	var parameters = {
		"batch_recid": params.batch_number,
		"assembly_unit_recid": params.recid
	}
	//Вызываем метод из плагина
    var res = plugins.callAsMethod("/plugins/nbdlogicplugin/addassemblyunittobatch", "post", parameters, null);
	return res;
}

/**
 * Метод исключения СЕ из партии
 * @param {*} params 
 */
function excludeassemblyunitfrombatch(params) {
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
	var parameters = {
		"recid": params.recid, 
		"selected_records": params.selectedRecords
	}
	//Вызываем метод из плагина
    var res = plugins.callAsMethod("/plugins/nbdlogicplugin/excludeassemblyunitfrombatch", "post", parameters, null);
	return res;
}

function excludeassemblyunitfrombatchmulty(params){
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
	};
	var parameters = {
		"recid": params.recid, 
        "selected_records": params.selectedRecords
    }

	//Вызываем метод из плагина
    var res = plugins.callAsMethod("/plugins/nbdlogicplugin/excludeassemblyunitfrombatchmulty", "post", parameters, null);
	return res;
}

/**
 * Метод отклонения партии
 * @param {*} params
 */
function rejectbatch(params){
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
	var parameters = {
		"recid": params.recid
	}
	//Вызываем метод из плагина
    var res = plugins.callAsMethod("/plugins/nbdlogicplugin/rejectbatch", "post", parameters, null);
	return res;
}

function addketobatchmulty(params){
    var parameters = {
        "selected_records": params.selectedRecords,
        "batch_recid": params.values.batch_number
    }
    //Вызываем метод из плагина
    var res = plugins.callAsMethod("/plugins/nbdlogicplugin/addkeyelementstobatch", "post", parameters, null);
    return res;
}

function addassemblyunittobatchmulty(params){
	var parameters = {
        "selected_records": params.selectedRecords,
        "batch_recid": params.values.batch_number
    }
    //Вызываем метод из плагина
    var res = plugins.callAsMethod("/plugins/nbdlogicplugin/addassemblyunitstobatch", "post", parameters, null);
    return res;
}

function sendbatchtosign(params){
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
	var parameters = {
		"recid": params.recid
	}
	//Вызываем метод из плагина
    var res = plugins.callAsMethod(String().concat("/plugins/nbdlogicplugin/sendbatchtosign/", params.recid), "get", parameters, null);
	return res;
}