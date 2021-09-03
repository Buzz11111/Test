function checkauthorization(allow_groups_names) {
	var current_user = getcurrentuser();
	
	if (isNullObject(current_user)) {
		return badResp("Неавторизованный пользователь.");
	}

	if (isEmptyOrNullArray(current_user.groups)) {
		return badResp("Нет прав для проведения операции.");
	}

	for (var i = 0; i < current_user.groups.length; i++) {
		if (allow_groups_names.indexOf(current_user.groups[i].recname) != -1) {
			return successResp();
		}
	}

	return badResp("Нет прав для проведения операции.");
}

// API Установить СЧ на вагон
// {
// 	// УИН
// 	"ke_number": "string",
// 	// Номер ТС
// 	"vehicle": "string",
// 	// Дата проведения операции
// 	"operation_date": "string",
// 	// Позиция на вагоне
// 	"vagon_position": "string",
// 	// Год окончания гамма-процентного ресурса детали
// 	"gamma_percent_resource_end_date": "string"
// }
function apiaddkeonwagon(params) {
	var allow_groups_names = ["Ekspluatants", "OTKControllers", "TSControllers"];
	var check_authorization_res = checkauthorization(allow_groups_names);
	if (!check_authorization_res.success) return check_authorization_res;

	if (isNullObject(params)) {
		return badResp("Неверный формат входных параметров.");
	}
	if (isEmptyString(params.ke_number)) {
		return badResp("Необходимо указать обязательный параметр - Номер СЧ.");
	}
	if (isEmptyString(params.vehicle)) {
		return badResp("Необходимо указать обязательный параметр - Номер ТС.");
	}
	if (isEmptyString(params.vagon_position)) {
		return badResp("Необходимо указать обязательный параметр - Позиция на вагоне.");
	}

	var operation_date = null;
	if (isEmptyString(params.operation_date)) {
		operation_date = new Date();
	} 
	else {
		operation_date = new Date(params.operation_date);
	}

	var reestr_key_element_params = {
		"numberke": params.ke_number
	};
	var reestr_key_elements = db.findbyparams("reestr_key_elements", reestr_key_element_params)
	if (isEmptyOrNullArray(reestr_key_elements)) {
		return badResp("составная часть не найден в системе.");
	}
	var reestr_key_element = reestr_key_elements[0];

	// Если Балка надрессорная, Рама боковая, то проверяем наличие параметра "Год окончания гамма-процентного ресурса детали"
	// Если в СЧ не заполнено поле "Год окончания гамма-процентного ресурса детали", оно должно присутствовать во входных данных
	if (reestr_key_element.key_element_code == keyElementCodes.pressure_beam_id
		|| reestr_key_element.key_element_code == keyElementCodes.side_frame_id) {
		if (isEmptyString(reestr_key_element.gamma_percent_resource_end_date)
			&& isEmptyString(params.gamma_percent_resource_end_date)) {
			return badResp("Необходимо заполнить поле - Год окончания гамма-процентного ресурса детали.");
		}
	}

	var reestr_vehicle_params = {
		"manufacturer_number": params.vehicle
	};
	var reestr_vehicles = db.findbyparams("reestr_vehicles", reestr_vehicle_params)
	if (isEmptyOrNullArray(reestr_vehicles)) {
		return badResp("ТС не найдено в системе.");
	}
	var reestr_vehicle = reestr_vehicles[0];

	// Получаем позицию, указанную во входных данных
	var dictionary_positions_on_vagon_params = {
		"recname": params.vagon_position,
		"key_element_code": reestr_key_element.key_element_code
	};
	var vagon_positions = db.findbyparams("dictionary_positions_on_vagon", dictionary_positions_on_vagon_params);
	if (isEmptyOrNullArray(vagon_positions)) {
		return badResp("Позиция на вагоне не найдена в системе.");
	}
	var vagon_position = vagon_positions[0];

	// Проверяем что на указанных вагон можно установить СЧ на указанную позицию
	var vehicle_model = db.findbyrecid("dictionary_models", reestr_vehicle.dictionary_models);
	if (isNullObject(vehicle_model)) {
		return badResp("Модель ТС не найдена в системе.");
	}
	
	if ((vagon_position.key_element_code != reestr_key_element.key_element_code)
		|| (vehicle_model.number_axes == "4" && vagon_position.for_six_axes_vagon == true)) {
		return badResp("СЧ c номером " + reestr_key_element.numberke + " нельзя установить на позицию " + vagon_position.recname + ".");
	}

	// Проверка на то, что среди установленных на вагон СЧ, нет СЧ на позиции, которая указана во входных данных
	var key_elements_on_wagon_params = {
		"vehicle": reestr_vehicle.recid
	};
	var key_elements_on_wagon = db.findbyparams("reestr_key_elements", key_elements_on_wagon_params);

	if (isNotEmptyOrNullArray(key_elements_on_wagon)) {
		for (var i = 0; i < key_elements_on_wagon.length; i++) {
			if (key_elements_on_wagon[i].position_on_vagon == vagon_position.recid) {
				return badResp("На позицию \"" + vagon_position.recname + "\" уже установлен СЧ.")
			}
		}
	}

	var addketowagon_req = {
		"numberke": reestr_key_element.numberke,
		"wagonnumber": reestr_vehicle.vagon_number,
		"wagon_position": vagon_position.recid,
		"manufacturernumber": reestr_vehicle.manufacturer_number,
		"date": operation_date.getUTCFullYear() +
			'-' + (operation_date.getUTCMonth() + 1).toString().padStart(2, 0) +
			'-' + (operation_date.getUTCDate()).toString().padStart(2, 0)
	};

	if (isNotEmptyString(params.gamma_percent_resource_end_date)) {
		addketowagon_req.gamma_percent_resource_end_date = params.gamma_percent_resource_end_date;
	}

	var res = false;

	var kestatus = reestr_key_elements[0].statuske;
	if (kestatus == "c82c2eb8-0cf9-4693-8a2b-c6bf605c97ab") {
  		res = apiaddketowagon(addketowagon_req);;
	} 
	else if (kestatus == "a0b630bc-fbed-4863-9053-6cec9ee3a459") {
		return badResp("СЧ уже установлен на вагон.");
	} 
	else {
		return badResp("СЧ в текущем статусе нельзя установить на вагон.");
	}

	if (res.success) {
		return successResp("СЧ установлен на ТС.");
	} 
	else {
		return badResp(res.message);
	}
}

// API снятие СЧ с ТС
// Актуально на 20.03.20
function apiremovekeonwagon(parameters) {
	var allow_groups_names = ["Ekspluatants", "TSControllers"];
	var check_authorization_res = checkauthorization(allow_groups_names);
	if (!check_authorization_res.success) return check_authorization_res;

	if (isNullObject(parameters)) {
		return badResp("Неверный формат входных параметров.");
	}

	if (isEmptyString(parameters.number)) {
		return badResp("Необходимо указать номер СЧ.");
	}

	var reestr_key_elements_params = {
		"numberke": parameters.number
	};
	var reestr_key_elements = db.findbyparams("reestr_key_elements", reestr_key_elements_params);
	if (isEmptyOrNullArray(reestr_key_elements)) {
		return badResp("составная часть не найден в системе.");
	}

	var params = {
    	"recid": reestr_key_elements[0].recid
	}

  	var res = false;
	var errormessage = "СЧ не снят с ТС.";
  	var successmessage = "СЧ снят с ТС.";

	var kestatus = reestr_key_elements[0].statuske;
  	if (kestatus == "a0b630bc-fbed-4863-9053-6cec9ee3a459") {
    	res = removeke(params);
	} else if (kestatus == "c82c2eb8-0cf9-4693-8a2b-c6bf605c97ab") {
		return badResp("СЧ не установлен на ТС.");
	} else {
		return badResp("СЧ в текущем статусе нельзя снять с ТС.");
	}

	if (res.success) {
		return successResp(successmessage);
	} else {
		return badResp(res.message);
	}
}

// API приостановление эксплуатации СЧ
// params = {
//     "number": string,
//     "reason": string
// }
// Актуально на 13.03.20
function apistopkeusage(parameters) {
	var allow_groups_names = ["Inspectors"];
	var check_authorization_res = checkauthorization(allow_groups_names);
	if (!check_authorization_res.success) return check_authorization_res;

	if (isNullObject(parameters)) {
		return badResp("Неверный формат входных параметров.");
	}

	if (isEmptyString(parameters.number)) {
		return badResp("Необходимо указать номер СЧ.");
	}

	if (isEmptyString(parameters.reason)) {
		return badResp("Необходимо указать причину приостановления эксплуатации СЧ.");
	}

	var reestr_key_elementsTmp_params = {
		"numberke": parameters.number
	};
	var reestr_key_elements = db.findbyparams("reestr_key_elements", reestr_key_elementsTmp_params);
	if (isEmptyOrNullArray(reestr_key_elements)) {
		return badResp("составная часть не найден в системе.");
	}

	var res = false;
	var successmessage = "СЧ запрещен к обращению.";
	var errormessage = "СЧ не может быть запрещен к обращению.";

	var params = {
    	"recid": reestr_key_elements[0].recid,
		"rejection_reason": parameters.reason
	};

	var kestatus = reestr_key_elements[0].statuske;
  	if (kestatus == "c82c2eb8-0cf9-4693-8a2b-c6bf605c97ab") {
    	res = forbidcirculation(params);
	} else if (kestatus == "b9151ccf-bdae-43b4-b660-35cec7abf953") {
		return badResp("СЧ уже запрещен к обращению.");
	} else {
		return badResp("СЧ в текущем статусе нельзя запретить к обращению.");
	}

	if (res) {
		return successResp(successmessage);
	} else {
		return badResp(errormessage);
	}
}

// API возобновление эксплуатации СЧ
// params = {
//     "number": string
// }
// Актуально на 13.03.20
function apirestorekeusage(parameters) {
	var allow_groups_names = ["Inspectors"];
	var check_authorization_res = checkauthorization(allow_groups_names);
	if (!check_authorization_res.success) return check_authorization_res;

	if (isNullObject(parameters)) {
		return badResp("Неверный формат входных параметров.");
	}

	if (isEmptyString(parameters.number)) {
		return badResp("Необходимо указать номер СЧ.");
	}

	var reestr_key_elements_params = {
		"numberke": parameters.number
	};
	var reestr_key_elements = db.findbyparams("reestr_key_elements", reestr_key_elements_params)
	if (isEmptyOrNullArray(reestr_key_elements)) {
		return badResp("составная часть не найден в системе.");
	}

	var res = false;
	var successmessage = "СЧ выпущен в обращение.";
	var errormessage = "СЧ не выпущен в обращение.";

	var params = {
    	"recid": reestr_key_elements[0].recid,
	}

	var kestatus = reestr_key_elements[0].statuske;
  	if (kestatus == "b9151ccf-bdae-43b4-b660-35cec7abf953") {
    	res = returncirculation(params);
	} else if (kestatus == "c82c2eb8-0cf9-4693-8a2b-c6bf605c97ab") {
		return badResp("СЧ уже выпущен в обращение.");
	} else {
		return badResp("СЧ в текущем статусе нельзя выпустить в обращение.");
	}

	if (res) {
		return successResp(successmessage);
	} else {
		return badResp(errormessage);
	}
}

// API Замена СЧ в узле/СЕ
// params = {
//		"node_number": string,
//		"old_ke_number": string,
//		"new_ke_number": string
// }
// Актуально на 13.03.20
function apireplacekeinassemblyelement(params){
	var allow_groups_names = ["KEControllers", "ManufacturerMultipurposeRole"];
	var check_authorization_res = checkauthorization(allow_groups_names);
	if (!check_authorization_res.success) return check_authorization_res;
	
	if (isNullObject(params)) {
		return badResp("Неверный формат входных параметров.");
	}
	
	if(isEmptyString(params.node_number)){
		return badResp("Необходимо указать номер узла, в котором будет производиться замена");
	}
	
	if(isEmptyString(params.old_ke_number)){
		return badResp("Необходимо указать заменяемого СЧ");
	}
	
	if(isEmptyString(params.new_ke_number)){
		return badResp("Необходимо указать номер нового СЧ");
	}
	
	//Проверка существуют ли заданные элементы в системе
	//Проверка узла
	var reestr_ke_nodes_params = {
		"unique_number": params.node_number
	}
	var reestr_ke_nodes = db.findbyparams("reestr_ke_nodes", reestr_ke_nodes_params);
	if(isEmptyOrNullArray(reestr_ke_nodes)){
		return badResp("Узел с номером " + params.node_number + " не найден в системе");
	}

	var node = reestr_ke_nodes[0];

	//Проверка старого СЧ
	var reestr_key_elements_old_ke_params = {
		"numberke": params.old_ke_number
	};
	
	var reestr_key_elements_old_ke = db.findbyparams("reestr_key_elements", reestr_key_elements_old_ke_params);
	if(isEmptyOrNullArray(reestr_key_elements_old_ke)){
		return badResp("СЧ с номером " + params.old_ke_number + " не найден в системе");
	}
	//Проверка нового СЧ
	var reestr_key_elements_new_ke_params = {
		"numberke": params.new_ke_number
	};
	
	var reestr_key_elements_new_ke = db.findbyparams("reestr_key_elements", reestr_key_elements_new_ke_params);
	if(isEmptyOrNullArray(reestr_key_elements_new_ke)){
		return badResp("СЧ с номером " + params.new_ke_number + " не найден в системе");
	}

	// Получаем тип узла
	var node_type = db.findbyrecid("dictionary_ke_node_types", node.ke_node_type);
	if (isNullObject(node_type)){
		return badResp("Тип узла не найден в системе.");
	}

	// Получаем тип сборочного элемента
	var assembly_element_type = db.findbyrecid("dictionary_assembly_element_types", node_type.assembly_element_type);
	if (isNullObject(assembly_element_type)){
		return badResp("Тип сборочного элемента не найден в системе.");
	}
	
	//Замена
	var replacekeinnodeparams = {
		"recid": node.recid,
		"old_key_element": reestr_key_elements_old_ke[0].recid,
		"new_key_element": params.new_ke_number
	};

	var replace_response = null;

	if (assembly_element_type.recid == commonAssemblyElementTypes.node_id) {
		replace_response = replacekeinnode(replacekeinnodeparams);
	}
	else if (assembly_element_type.recid == commonAssemblyElementTypes.assembly_unit_id) {
		replace_response = replacekeinassemblyunit(replacekeinnodeparams);
	}

	if (replace_response.success) {
		return successResp("Замена успешна", params.new_ke_number);
	} else {
		return replace_response;
	}
}

/**
 * API Сгруппировать СЕ
 * @param {*} params {
 * 		"number":string,
 * 		"ke_node_type": string,
 * 		"reestr_ke_node_type": string,
 * 		"ke_numbers": array<"number":string, "position":string>>
 * }
 */
// Актуально на 13.03.20
function apigroupassemblyunit(params) {
	var allow_groups_names = ["KEControllers", "ManufacturerMultipurposeRole"];
	var check_authorization_res = checkauthorization(allow_groups_names);
	if (!check_authorization_res.success) return check_authorization_res;
	
	if (isNullObject(params)) {
		return badResp("Неверный формат входных параметров.");
	}

	if (isNullObject(params.common_params)) {
		return badResp("Объект \"common_params\" не может быть пустым");
	}

	// Проверяем входные параметры из Группы общих параметров
	// Группа общих параметров
	// {
	// 	// УИН
	// 	"number": "string",
	// 	// Наименование изделия
	// 	"ke_node_type": "string",
	// 	// Способ (тип) маркировки
	// 	"method_of_marking": "string",
	// 	// Способ кодировки
	// 	"method_of_encoding": "string",
	// 	// Обозначение изделия
	// 	"documentation_number": "string",
	// 	// Дата изготовления
	// 	"date_manufacture": "string or null"
	// }

	if (isEmptyString(params.common_params.number)) {
		return badResp("Необходимо указать УИН группируемого СЕ.")
	}

	//Валидация поля number
	var ke_numbers = db.findbyparams("ke_numbers", {
		recname: params.common_params.number
	})
	if(isEmptyOrNullArray(ke_numbers)){
		return badResp("УИН группируемого СЕ не найден в системе");
	}
	//Проверка что уин не занят ключевым элементм
	var key_elements = db.findbyparams("reestr_key_elements", {
		ke_number: ke_numbers[0].recid
	})
	if(isNotEmptyOrNullArray(key_elements)){
		return badResp(String().concat("УИН ", params.common_params.number, " уже занят составной частью"));
	} 
	//Проверка что уин не занят СЕ
	var assembly_units = db.findbyparams("reestr_ke_nodes", {
		unique_number_relation: ke_numbers[0].recid
	})
	if(isNotEmptyOrNullArray(assembly_units)){
		return badResp(String().concat("УИН ", params.common_params.number, " уже занят сборочной единицей"));
	}

	// Наименование изделия
	if (isEmptyString(params.common_params.ke_node_type)) {
		return badResp("Необходимо указать код типа узла.");
	}
	var ke_node_type = null;
	if (isNotEmptyString(params.common_params.ke_node_type)) {
		var ke_node_type_params = { "reccode": params.common_params.ke_node_type };
		var ke_node_types = db.findbyparams("dictionary_ke_node_types", ke_node_type_params);
		if (isEmptyOrNullArray(ke_node_types)) { return badResp("Тип узла не найден в системе."); }
		ke_node_type = ke_node_types[0];
	}

	if (isEmptyString(ke_node_type.assembly_element_type)
		|| ke_node_type.assembly_element_type != commonAssemblyElementTypes.assembly_unit_id) {
		return badResp("Для сканирования узла используйте метод \"apigroupkenode\".");
	}

	// Способ (тип) маркировки
	if (isEmptyString(params.common_params.method_of_marking)) {
		return badResp("Необходимо указать обязательное поле - Способ (тип) маркировки.");
	}

	var method_of_marking = null;
	// Способ (тип) маркировки
	if (isNotEmptyString(params.common_params.method_of_marking)) {
		var method_of_marking_params = { "reccode": params.common_params.method_of_marking };
		var method_of_markings = db.findbyparams("dictionary_method_of_marking", method_of_marking_params);
		if (isEmptyOrNullArray(method_of_markings)) { return badResp("Способ (тип) маркировки не найден в системе."); }
		method_of_marking = method_of_markings[0];
	}

	// Способ кодировки
	if (isEmptyString(params.common_params.method_of_encoding)) {
		return badResp("Необходимо указать обязательное поле - Способ кодировки.");
	}

	var method_of_encoding = null;
	// Способ кодировки
	if (isNotEmptyString(params.common_params.method_of_encoding)) {
		var method_of_encoding_params = { "reccode": params.common_params.method_of_encoding };
		var method_of_encodings = db.findbyparams("dictionary_method_of_encoding", method_of_encoding_params);
		if (isEmptyOrNullArray(method_of_encodings)) { return badResp("Способ кодировки не найден в системе."); }
		method_of_encoding = method_of_encodings[0];
	}

	// Обозначение изделия
	if (isEmptyString(params.common_params.documentation_number)) {
		return badResp("Необходимо указать обязательное поле - Обозначение изделия.");
	}

	var documentation_number = null;
	// Обозначение изделия
	if (isNotEmptyString(params.common_params.documentation_number)) {
		var documentation_number_params = { 
			"detail": params.common_params.documentation_number,
			"ke_node_type": ke_node_type.recid
		};
		var documentation_numbers = db.findbyparams("reestr_documentation", documentation_number_params);
		if (isEmptyOrNullArray(documentation_numbers)) { return badResp("Обозначение изделия не найдено в системе."); }
		documentation_number = documentation_numbers[0];
	}

	var date = new Date();
	var date_manufacture = null;

	// Дата изготовления
	if (isNotEmptyString(params.common_params.date_manufacture)) {
		if (isNaN(Date.parse(params.common_params.date_manufacture.toString()))) {
			return badResp(String().concat("Не удалось распарсить дату ", params.common_params.date_manufacture, ", используйте дату формата \"yyyy-MM-ddThh:mm:ssZ\""));
		}

		date_manufacture = new Date(params.common_params.date_manufacture);
	}
	else {
		date_manufacture = date;
	}

	var reestr_members_owner = getmemberbyuser();
	if (isNullObject(reestr_members_owner)) {
		return badResp("Для текущего пользователя не найдена запись в Реестре участников.");
	}
	var currentownerid = reestr_members_owner.recid;
	// Сведения об изготовителе
	var manufacturer_details = currentownerid;
	


	//Валидация специальных параметров
	if(isNullObject(params.passport_params)){
		return badResp("Объект \"passport_params\" не может быть пустым");
	}
	//Валидация значений в объекте специальных параметров
	var special_params = params.passport_params;
	switch (ke_node_type.recid) {
		//Тестовая СЕ
		case "29682e94-f9e9-4783-ba31-be88a6e5ebc7":
			break;
		//Котел вагона-цистерны
		case "79ddf686-f26f-4567-97ac-cb18eadd83e9":
			//Сведения о сертификате соответствия
			if(isEmptyString(special_params.certificate_number)){
				return badResp("Поле \"certificate_number\" не может быть пустым");
			}
			var reestr_certificates = db.findbyparams("reestr_certificates", {
				ke_node_type: ke_node_type.recid,
				registration_number: special_params.certificate_number
			})
			if(isEmptyOrNullArray(reestr_certificates)){
				return badResp(String().concat("Сведения о сертификате соответствия ", special_params.certificate_number, " не найдены в системе, проверьте параметр \"certificate_number\"" ))
			}
			var certificate = reestr_certificates[0];
			special_params.certificate_number = certificate.recid;
			
			//Срок службы
			if(isEmptyString(special_params.life_time)){
				return badResp("Параметр \"life_time\" не может быть пустым");
			}

			//Номер изделия по системе нумерации предприятия-изготовителя
			if(isEmptyString(special_params.manufacturer_number)){
				return badResp("Параметр \"manufacturer_number\" не может быть пустым");
			}

			//Марка материала
			if(isEmptyString(special_params.steel_grade)){
				return badResp("Параметр \"steel_grade\" не может быть пустым");
			}
			var steel_grades = db.findbyparams("dictionary_steel_grade", {
				recname: special_params.steel_grade
			})
			if(isEmptyOrNullArray(steel_grades)){
				return badResp(String().concat("Марка материала ", special_params.steel_grade, " не найдена в системе"));
			}
			special_params.steel_grade = steel_grades[0].recid;

			//Объем кузова (котла)
			if(isEmptyString(special_params.carcass_volume)){
				return badResp("Поле \"carcass_volume\" не может быть пустым");
			}

			//Рабочее (избыточное) давление при перевозке
			if(isEmptyString(special_params.operating_pressure_transportation)){
				return badResp("Поле \"operating_pressure_transportation\" не может быть пустым"); 
			}

			//Рабочее (избыточное) давление при разгрузке
			if(isEmptyString(special_params.operating_pressure_unloading)){
				return badResp("Поле \"operating_pressure_unloading\" не может быть пустым"); 
			}

			//Расчетное давление
			if(isEmptyString(special_params.design_pressure)){
				return badResp("Поле \"design_pressure\" не может быть пустым"); 
			}

			//Испытательное давление гидравлическое
			if(isEmptyString(special_params.hydraulic_test_pressure)){
				return badResp("Поле \"hydraulic_test_pressure\" не может быть пустым"); 
			}

			// Свидетельство о приемке
			if (isEmptyString(special_params.acceptance_certificate)) {
				return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
			}
			break;
		//Триангель
		case "c790c624-b93e-498b-97ba-0fb47f8b4b52":
			//Сведения о сертификате соответствия
            if(isEmptyString(special_params.certificate_number)){
                return badResp("Поле \"Сведения о сертификате соответствия\" пустое, проверьте параметр \"certificate_number\"")
            }
            var certificate_numbers = db.findbyparams("reestr_certificates", {
                registration_number: special_params.certificate_number,
                ke_node_type: ke_node_type.recid
            })
            if(isEmptyOrNullArray(certificate_numbers)){
                return badResp("Сведения о сертификате соответствия не найдены в системе, проверьте параметр \"Сведения о сертификате соответствия\" ")
            }
            special_params.certificate_number = certificate_numbers[0].recid;

            //Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "ke_node_type": ke_node_type.recid
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;

            //Номер изделия по системе нумерации предприятия-изготовителя
            if(isEmptyString(special_params.manufacturer_number)){
                return badResp("Поле \"Номер изделия по системе нумерации предприятия-изготовителя\" пустое, проверьте поле \"manufacturer_number\"");
			}
			
			// Свидетельство о приемке
			if (isEmptyString(special_params.acceptance_certificate)) {
				return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
			}
			break;
		// Колесная пара без буксовых узлов
		case "00b0b326-a67a-4ce2-95af-376fcc9d8355":
			//Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "ke_node_type": ke_node_type.recid
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;

            //Сведения о сертификате соответствия
            if(isEmptyString(special_params.certificate_number)){
                return badResp("Поле \"Сведения о сертификате соответствия\" пустое, проверьте параметр \"certificate_number\"")
            }
            var certificate_numbers = db.findbyparams("reestr_certificates", {
                registration_number: special_params.certificate_number,
                ke_node_type: ke_node_type.recid
            })
            if(isEmptyOrNullArray(certificate_numbers)){
                return badResp("Сведения о сертификате соответствия не найдены в системе, проверьте параметр \"Сведения о сертификате соответствия\" ")
            }
			special_params.certificate_number = certificate_numbers[0].recid;
			
			// Свидетельство о приемке
			if (isEmptyString(special_params.acceptance_certificate)) {
				return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
			}
			break;
		// Автосцепка СА-3
		case "ae11ae44-1c69-49e0-83a1-4122bb2d80ae":
			//Сведения о сертификате соответствия
            if(isEmptyString(special_params.certificate_number)){
                return badResp("Поле \"Сведения о сертификате соответствия\" пустое, проверьте параметр \"certificate_number\"")
            }
            var certificate_numbers = db.findbyparams("reestr_certificates", {
                registration_number: special_params.certificate_number,
                ke_node_type: ke_node_type.recid
            })
            if(isEmptyOrNullArray(certificate_numbers)){
                return badResp("Сведения о сертификате соответствия не найдены в системе, проверьте параметр \"Сведения о сертификате соответствия\" ")
            }
            special_params.certificate_number = certificate_numbers[0].recid;

            //Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "ke_node_type": ke_node_type.recid
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;

            //Индивидуальные особенности
            if(isEmptyString(special_params.individual_features)){
                return badResp("Поле \"Индивидуальные особенности\" пустое, проверьте параметр \"individual_features\"");
            }

            //Номер изделия по системе нумерации предприятия-изготовителя
            if(isEmptyString(special_params.manufacturer_number)){
                return badResp("Поле \"Номер изделия по системе нумерации предприятия-изготовителя\" пустое, проверьте поле \"manufacturer_number\"");
            }

            //Обозначение модели автосцепки
            if(isEmptyString(special_params.autocoupler_model)){
                return badResp("Поле \"Обозначение модели автосцепки\" пустое, проверьте параметр \"autocoupler_model\"");
            }
            var dictionary_couplings_models = db.findbyparams("dictionary_couplings_models", {
                coupling_name: special_params.autocoupler_model
            })
            if(isEmptyOrNullArray(dictionary_couplings_models)){
                return badResp("Обозначение модели автосцепки не найдено в системе, проверьте параметр \"autocoupler_model\"");
            }
			special_params.autocoupler_model = dictionary_couplings_models[0].recid;
			
			// Свидетельство о приемке
			if (isEmptyString(special_params.acceptance_certificate)) {
				return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
			}
			break;
		// Тележка
		case "cbb9d8cb-89ef-4b99-be77-a7d6e57e388e":
			//Сведения о сертификате соответствия
			if(isEmptyString(special_params.certificate_number)){
				return badResp("Поле \"Сведения о сертификате соответствия\" пустое, проверьте параметр \"certificate_number\"")
			}
			var certificate_numbers = db.findbyparams("reestr_certificates", {
				registration_number: special_params.certificate_number,
				ke_node_type: ke_node_type.recid
			})
			if(isEmptyOrNullArray(certificate_numbers)){
				return badResp("Сведения о сертификате соответствия не найдены в системе, проверьте параметр \"Сведения о сертификате соответствия\" ")
			}
			special_params.certificate_number = certificate_numbers[0].recid;

			//Срок службы
			if(isEmptyString(special_params.life_time)){
				return badResp("Поле \"Срок службы\" пустое, проверьте параметр \"life_time\"")
			}

			//Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
			if(isEmptyString(special_params.ke_manufacturer)){
				return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
			}
			var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
				code: special_params.ke_manufacturer
			})
			if(isEmptyOrNullArray(ke_manufacturer_records)){
				return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
			}
			special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

			//Регистрационный номер свидетельства о присвоении номера для клеймения
			var dictionary_branding_code_certificate_numbers_params = {
				"branding_code": ke_manufacturer_records[0].recid,
				"ke_node_type": ke_node_type.recid
			};
			var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
			
			if(isEmptyOrNullArray(branding_code_certificate_numbers)){
				return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
			}
			special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;

			//Номер изделия по системе нумерации предприятия-изготовителя
			if(isEmptyString(special_params.manufacturer_number)){
				return badResp("Поле \"Номер изделия по системе нумерации предприятия-изготовителя\" пустое, проверьте поле \"manufacturer_number\"");
			}

			//Код государства собственника детали
			if(isEmptyString(special_params.administration_code)){
				return badResp("Поле \"Код государства собственника детали\" пустое, проверьте параметр \"administration_code\"");
			}
			var administration_code_records = db.findbyparams("dictionary_administration_codes", {
				reccode: special_params.administration_code
			});
			if(isEmptyOrNullArray(administration_code_records)){
				return badResp("Код государства собственника детали не найден в системе, проверьте параметр \"administration_code\"");
			}
			special_params.administration_code = administration_code_records[0].recid;

			//Обозначение модели тележки
			if(isEmptyString(special_params.truck_model)){
				return badResp("Поле \"Обозначение модели тележки\" пустое, проверьте параметр \"truck_model\"");
			}
			var dictionary_truck_models = db.findbyparams("dictionary_truck_models", {
				recname: special_params.truck_model
			});
			if(isEmptyOrNullArray(dictionary_truck_models)){
				return badResp("Обозначение модели тележки не найдено в системе, проверьте параметр \"truck_model\"");
			}
			special_params.truck_model = dictionary_truck_models[0].recid;

			//Тип тележки
			if(isEmptyString(special_params.truck_type)){
				return badResp("Поле \"Тип тележки\" пустое, проверьте параметр \"truck_type\"");
			}
			var dictionary_type_carts = db.findbyparams("dictionary_type_cart", {
				recname: special_params.truck_type
			})
			if(isEmptyOrNullArray(dictionary_type_carts)){
				return badResp("Тип тележки не найден в системе, проверьте параметр \"truck_type\"");
			}
			special_params.truck_type = dictionary_type_carts[0].recid;

			//Максимальная расчетная статическая осевая нагрузка
			if(isEmptyString(special_params.max_static_axial_load)){
				return badResp("Поле \"Максимальная расчетная статическая осевая нагрузка\" пустое, проверьте параметр \"max_static_axial_load\"");
			}

			// Свидетельство о приемке
			if (isEmptyString(special_params.acceptance_certificate)) {
				return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
			}
			break;
		// Колесная пара
		case "a3afe986-102a-4a10-aafe-5407134f7c15":
			//Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "ke_node_type": ke_node_type.recid
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;

            //Код государства собственника детали
            if(isEmptyString(special_params.administration_code)){
                return badResp("Поле \"Код государства собственника детали\" пустое, проверьте параметр \"administration_code\"");
            }
            var administration_code_records = db.findbyparams("dictionary_administration_codes", {
                reccode: special_params.administration_code
            });
            if(isEmptyOrNullArray(administration_code_records)){
                return badResp("Код государства собственника детали не найден в системе, проверьте параметр \"administration_code\"");
            }
            special_params.administration_code = administration_code_records[0].recid;

            //Максимальная статическая осевая нагрузка
            if(isEmptyString(special_params.max_static_axial_load)){
                return badResp("Поле \"Максимальная расчетная статическая осевая нагрузка\" пустое, проверьте поле \"max_static_axial_load\"");
			}
			
			// Свидетельство о приемке
			if (isEmptyString(special_params.acceptance_certificate)) {
				return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
			}
			break;

		//Скользун
		case "a70bf64c-215b-4d42-9c8e-f8ab4ac9f357":
			//Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "ke_node_type": ke_node_type.recid
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
			special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;
			
			// Свидетельство о приемке
			if (isEmptyString(special_params.acceptance_certificate)) {
				return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
			}
			break;

		// Поглощающий аппарат
		case "700b86ca-5b88-44d6-a5d3-c2c4e76d96f8":
			//Сведения о сертификате соответствия
			{
				if(isEmptyString(special_params.certificate_number)){
					return badResp("Поле \"Сведения о сертификате соответствия\" пустое, проверьте параметр \"certificate_number\"")
				}
				var certificate_numbers = db.findbyparams("reestr_certificates", {
					registration_number: special_params.certificate_number,
					ke_node_type: ke_node_type.recid
				})
				if(isEmptyOrNullArray(certificate_numbers)){
					return badResp("Сведения о сертификате соответствия не найдены в системе, проверьте параметр \"Сведения о сертификате соответствия\" ")
				}
				special_params.certificate_number = certificate_numbers[0].recid;
			}

			//Срок службы
			if(isEmptyString(special_params.life_time)){
				return badResp("Поле \"Срок службы\" пустое, проверьте параметр \"life_time\"")
			}

			//Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
			{
				if(isEmptyString(special_params.ke_manufacturer)){
					return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
				}
				var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
					code: special_params.ke_manufacturer
				})
				if(isEmptyOrNullArray(ke_manufacturer_records)){
					return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
				}
				special_params.ke_manufacturer = ke_manufacturer_records[0].recid;
			}

			//Регистрационный номер свидетельства о присвоении номера для клеймения
			{
				var dictionary_branding_code_certificate_numbers_params = {
					"branding_code": ke_manufacturer_records[0].recid,
					"ke_node_type": ke_node_type.recid
				};
				var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
				
				if(isEmptyOrNullArray(branding_code_certificate_numbers)){
					return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
				}
				special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;
			}
			
			//Номер изделия по системе нумерации предприятия-изготовителя
			if(isEmptyString(special_params.manufacturer_number)){
				return badResp("Поле \"Номер изделия по системе нумерации предприятия-изготовителя\" пустое, проверьте поле \"manufacturer_number\"");
			}

			//Обозначение модели
			{
				if(isEmptyString(special_params.absorbing_device_model)){
					return badResp("Поле \"Обозначение модели\" пустое, проверьте параметр \"absorbing_device_model\"");
				}
				var dictionary_absorbing_device_body_models = db.findbyparams("dictionary_absorbing_device_body_models", {
					recname: special_params.absorbing_device_model
				});
				if(isEmptyOrNullArray(dictionary_absorbing_device_body_models)){
					return badResp("Обозначение модели не найдено в системе, проверьте параметр \"absorbing_device_model\"");
				}
				special_params.absorbing_device_model = dictionary_absorbing_device_body_models[0].recid;
			}

			//Класс поглощающего аппарата
			{
				if(isEmptyString(special_params.class_absorbing_device)){
					return badResp("Поле \"Класс поглощающего аппарата\" пустое, проверьте параметр \"class_absorbing_device\"");
				}
				var dictionary_class_absorbing_device = db.findbyparams("dictionary_class_absorbing_device", {
					recname: special_params.class_absorbing_device
				});
				if(isEmptyOrNullArray(dictionary_class_absorbing_device)){
					return badResp("Класс поглощающего аппарата не найден в системе, проверьте параметр \"class_absorbing_device\"");
				}
				special_params.class_absorbing_device = dictionary_class_absorbing_device[0].recid;
			}

			//Энергоемкость
			if(isEmptyString(special_params.energy_intensity)){
				return badResp("Поле \"Энергоемкость\" пустое, проверьте параметр \"energy_intensity\"")
			}

			// Свидетельство о приемке
			if (isEmptyString(special_params.acceptance_certificate)) {
				return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
			}
			break;

		//Воздухораспределитель в сборе
		case "a6180bfa-368d-4eff-97f2-c4f6c2612bc6":
			//Сведения о сертификате соответствия
			{
				if(isEmptyString(special_params.certificate_number)){
					return badResp("Поле \"Сведения о сертификате соответствия\" пустое, проверьте параметр \"certificate_number\"")
				}
				var certificate_numbers = db.findbyparams("reestr_certificates", {
					registration_number: special_params.certificate_number,
					ke_node_type: ke_node_type.recid
				})
				if(isEmptyOrNullArray(certificate_numbers)){
					return badResp("Сведения о сертификате соответствия не найдены в системе, проверьте параметр \"Сведения о сертификате соответствия\" ")
				}
				special_params.certificate_number = certificate_numbers[0].recid;
			}

			//Срок службы
			if(isEmptyString(special_params.life_time)){
				return badResp("Поле \"Срок службы\" пустое, проверьте параметр \"life_time\"")
			}

			//Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
			{
				if(isEmptyString(special_params.ke_manufacturer)){
					return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
				}
				var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
					code: special_params.ke_manufacturer
				})
				if(isEmptyOrNullArray(ke_manufacturer_records)){
					return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
				}
				special_params.ke_manufacturer = ke_manufacturer_records[0].recid;
			}

			//Регистрационный номер свидетельства о присвоении номера для клеймения
			{
				var dictionary_branding_code_certificate_numbers_params = {
					"branding_code": ke_manufacturer_records[0].recid,
					"ke_node_type": ke_node_type.recid
				};
				var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
				
				if(isEmptyOrNullArray(branding_code_certificate_numbers)){
					return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
				}
				special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;
			}
			
			//Номер изделия по системе нумерации предприятия-изготовителя
			if(isEmptyString(special_params.manufacturer_number)){
				return badResp("Поле \"Номер изделия по системе нумерации предприятия-изготовителя\" пустое, проверьте поле \"manufacturer_number\"");
			}

			//Обозначение модели
			{
				if(isEmptyString(special_params.air_distributor_model)){
					return badResp("Поле \"Обозначение модели\" пустое, проверьте параметр \"air_distributor_model\"");
				}
				var dictionary_air_distributor_models = db.findbyparams("dictionary_air_distributor_models", {
					recname: special_params.air_distributor_model
				});
				if(isEmptyOrNullArray(dictionary_air_distributor_models)){
					return badResp("Обозначение модели не найдено в системе, проверьте параметр \"air_distributor_model\"");
				}
				special_params.air_distributor_model = dictionary_air_distributor_models[0].recid;
			}

			// Свидетельство о приемке
			if (isEmptyString(special_params.acceptance_certificate)) {
				return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
			}
			break;
	}

	//Валидация поля ke_numbers и замена номеров на uuid
	var ke_numbers_with_ids = [];
	var ke_numbers_for_validation = [];
	var ke_positions_for_validation = [];
	if (isNotEmptyOrNullArray(params.ke_numbers)) {
		for(var i = 0; i < params.ke_numbers.length; i++){
			if(isEmptyString(params.ke_numbers[i].number)){
				return badResp("Не указан номер СЧ для элемента " + i);
			}
			var ke_numbers = db.findbyparams("ke_numbers", {
				recname: params.ke_numbers[i].number
			})
			if(isEmptyOrNullArray(ke_numbers)){
				return badResp(String().concat("УИН ", params.ke_numbers[i].number, " не найден в системе"));
			}
			var ke_number = ke_numbers[0];
			var reestr_key_element_params = {
				"ke_number": ke_number.recid
			};
			
			var reestr_key_elements = db.findbyparams("reestr_key_elements", reestr_key_element_params);
			if(isEmptyOrNullArray(reestr_key_elements)){
				return badResp("Не найдена запись в реестре СЧ с номером " + params.ke_numbers[i].number + ", элемент #" + i);
			}
			var key_element = reestr_key_elements[0];
			ke_numbers_for_validation.push(ke_number.recname);
	
			//Если СЧ имеет позицию в родительском узле
			//Проверка что СЧ имеет позицию в узле
			// var dictionary_positions_on_node = db.findbyparams("dictionary_positions_on_node", {
			// 	key_element_code: key_element.key_element_code,
			// 	node_type: ke_node_type.recid
			// })
			if (isEmptyOrNullArray(dictionary_positions_on_node)) {
				var numbers_struct = {
					"number": key_element.recid,
					"numberValue": key_element.numberke
				};
				ke_numbers_with_ids.push(numbers_struct);
			}
			else {
				if (isEmptyString(params.ke_numbers[i].position)) {
					return badResp("Не указана позиция СЧ для элемента ke_numbers[" + i + "]");
				}
	
				// Если это одиночный СЧ
				if (isEmptyString(key_element.ke_node)) {
					var dictionary_positions_on_node = db.findbyrecid("dictionary_positions_on_node", params.ke_numbers[i].position);
					if (isEmptyString(dictionary_positions_on_node)) {
						return badResp("Не найдена запись в справочнике позиций в узле с id " + params.ke_numbers[i].position + ", элемент #" + i);
					}
	
					ke_positions_for_validation.push(dictionary_positions_on_node.recid);
					var numbers_struct = {
						"number": key_element.recid,
						"position": dictionary_positions_on_node.recid,
						"numberValue": key_element.numberke
					};
	
					ke_numbers_with_ids.push(numbers_struct);
				}
				else { //Если это СЧ в узле
					var parent_node = db.findbyrecid("reestr_ke_nodes", key_element.ke_node);
					if (isNullObject(parent_node)) {
						return badResp(String().concat("Не удалось найти запись родительского узла для СЧ ", ke_number.recname));
					}
	
					var position_on_parent_node = db.findbyrecid("dictionary_positions_on_parent_node", params.ke_numbers[i].position);
					if (isNullObject(position_on_parent_node)) {
						return badResp(String().concat("Не удалось найти позиции в родительском узле для узла, в который включен СЧ ", ke_number.recname));
					}
	
					var numbers_struct = {
						"number": key_element.recid,
						"position": position_on_parent_node.recid,
						"numberValue": key_element.numberke
					};
	
					ke_numbers_with_ids.push(numbers_struct);
					ke_positions_for_validation.push(position_on_parent_node.recid);
				}
			}
		}

		//Проверка повторения элементов 
		//Для номеров
		for(var i = 0; i < ke_numbers_for_validation.length; i++){
			var numbers_entries = 0;
			for(var j = 0; j < ke_numbers_for_validation.length; j++){
				if(ke_numbers_for_validation[i] == ke_numbers_for_validation[j]){
					numbers_entries++;
				}
			}
			if(numbers_entries > 1){
				return badResp("Номер " + ke_numbers_for_validation[i] + " встречаеся " + numbers_entries + " раз");
			}
		}
		
		//Для позиций
		for(var i = 0; i < ke_positions_for_validation.length; i++){
			var positions_entries = 0;
			for(var j = 0; j < ke_positions_for_validation.length; j++){
				if(ke_positions_for_validation[i] == ke_positions_for_validation[j]){
					positions_entries++;
				}
			}
			if(positions_entries > 1){
				return badResp("Позиция " + ke_positions_for_validation[i] + " встречаеся " + positions_entries + " раз");
			}
		}
	}
	
	// Валидация поля ke_numbers и замена номеров на uuid
	var assembly_element_numbers_with_ids = [];
	var assembly_element_numbers_for_validation = [];
	var assembly_element_positions_for_validation = [];
	if (isNotEmptyOrNullArray(params.assembly_element_numbers)) {
		for (var i = 0; i < params.assembly_element_numbers.length; i++) {
			if (isEmptyString(params.assembly_element_numbers[i].number)) {
				return badResp("Не указан номер узла/СЕ для элемента " + i);
			}
	
			var assembly_elements = db.findbyparams("reestr_ke_nodes", {
				unique_number: params.assembly_element_numbers[i].number
			});
			if (isEmptyOrNullArray(assembly_elements)) {
				return badResp("Сборочный элемент с УИН " + params.assembly_element_numbers[i].number + " не найден в системе.");
			}
			var assembly_element = assembly_elements[0];
	
			if (isEmptyString(params.assembly_element_numbers[i].position)) {
				return badResp("Сборочный элемент с УИН " + assembly_element.unique_number + ". " + "Необходимо указать позицию узла/СЕ.");
			}
	
			var assembly_element_position = db.findbyrecid("dictionary_node_positions", params.assembly_element_numbers[i].position);
	
			if (isNullObject(assembly_element_position)) {
				return badResp("Сборочный элемент с УИН " + assembly_element.unique_number + ". " + "Не удалось найти в системе указанную позицию.");
			}
	
			// // Получаем доступные позиции для узла/СЕ в СЕ/узле
			// var assembly_element_available_positions_res = api_get_assembly_element_positions_on_assembly_element({
			// 	"assemblyElementNumber": assembly_element.unique_number,
			// 	"reestrKeNodeType": parent_assembly_element.unique_number
			// });
	
			// if (!assembly_element_available_positions_res.success) {
			// 	return badResp("Сборочный элемент с УИН " + assembly_element.unique_number + ". " + assembly_element_available_positions_res.message);
			// }

			// // Если нет доступных позиций, то возвращаем ошибку
			// if (isEmptyOrNullArray(assembly_element_available_positions_res.data)) {
			// 	return badResp("Сборочный элемент с УИН " + assembly_element.unique_number + ". " + "Нет доступных позиций для установки.");
			// }

			// var assembly_element_available_positions = assembly_element_available_positions_res.data;
	
			// var check_available_positions = false;
	
			// // Если нет доступных позиций, то возвращаем ошибку
			// for (var k = 0; k < assembly_element_available_positions.length; k++) {
			// 	if (assembly_element_available_positions[k].position_id == assembly_element_position.recid) {
			// 		check_available_positions = true;
			// 	}
			// }
	
			// if (!check_available_positions) {
			// 	return badResp("Сборочный элемент с УИН " + assembly_element.unique_number + ". " + "Нельзя установить сборочный элемент на указанную позицию.");
			// }
	
			var numbers_struct = {
				"number": assembly_element.recid,
				"position": assembly_element_position.recid,
				"numberValue": assembly_element.unique_number
			};
	
			assembly_element_numbers_with_ids.push(numbers_struct);
			assembly_element_positions_for_validation.push(assembly_element_position.recid);
			assembly_element_numbers_for_validation.push(assembly_element.unique_number);
		}
	
		// Проверка повторения элементов 
		// Для номеров
		for (var i = 0; i < assembly_element_numbers_for_validation.length; i++) {
			var numbers_entries = 0;
			for (var j = 0; j < assembly_element_numbers_for_validation.length; j++) {
				if(assembly_element_numbers_for_validation[i] == assembly_element_numbers_for_validation[j]) {
					numbers_entries++;
				}
			}
			if (numbers_entries > 1) {
				return badResp("Номер " + assembly_element_numbers_for_validation[i] + " указан более одного раза.");
			}
		}
	}

	var ke_numbers_param = [];
	if (isNotEmptyOrNullArray(ke_numbers_with_ids)) {
		for (var i = 0; i < ke_numbers_with_ids.length; i++) {
			ke_numbers_param.push(ke_numbers_with_ids[i]);
		}
	}
	if (isNotEmptyOrNullArray(assembly_element_numbers_with_ids)) {
		for (var i = 0; i < assembly_element_numbers_with_ids.length; i++) {
			ke_numbers_param.push(assembly_element_numbers_with_ids[i]);
		}
	}

	var insert_res = db.insert("reestr_ke_nodes", {});

	if (insert_res == null || insert_res == "") {
		return badResp("Не удалось создать узел.");
	}

	var kenodescannumbers_params = {
		"ke_node_type": ke_node_type.recid,
		//"reestr_ke_node_type": reestr_ke_node_type.recid,
        "ke_numbers": JSON.stringify(ke_numbers_param),
		"recid": insert_res.recid,
		"unique_number": params.common_params.number,

		"from_api": true,
		"documentation_number": documentation_number.recid
	};
	
	var group_res = assemblyunitscannumbers(kenodescannumbers_params);
	if(!group_res.success){
		return group_res;
	}

	var node = db.findbyrecid("reestr_ke_nodes", insert_res.recid);

	// Способ (тип) маркировки
	node.method_of_marking = method_of_marking.recid;
	// Способ кодировки
	node.method_of_encoding = method_of_encoding.recid;
	// Обозначение изделия
	node.documentation_number = documentation_number.recid;
	// Дата изготовления
	node.formation_date = date_manufacture;
	// Сведения об изготовителе
	node.manufacturer_details = manufacturer_details;

	switch (node.ke_node_type) {
		//Тестовая СЕ
		case "29682e94-f9e9-4783-ba31-be88a6e5ebc7":
			break;
		//Котел вагона-цистерны
		case "79ddf686-f26f-4567-97ac-cb18eadd83e9":
			//Сведения о сертификате соответствия
			node.certificate_number = special_params.certificate_number;

			//Срок службы
			node.life_time = special_params.life_time;

			//Номер изделия по системе нумерации предприятия-изготовителя
			node.manufacturer_number = special_params.manufacturer_number;

			//Марка материала
			node.steel_grade = special_params.steel_grade;

			//Объем кузова (котла)
			node.carcass_volume = special_params.carcass_volume;

			//Рабочее (избыточное) давление при перевозке
			node.operating_pressure_transportation = special_params.operating_pressure_transportation;

			//Рабочее (избыточное) давление при разгрузке
			node.operating_pressure_unloading = special_params.operating_pressure_unloading;

			//Расчетное давление
			node.design_pressure = special_params.design_pressure;

			//Испытательное давление гидравлическое
			node.hydraulic_test_pressure = special_params.hydraulic_test_pressure;

			// Свидетельство о приемке
			node.acceptance_certificate = special_params.acceptance_certificate;
			break;
		//Триангель
		case "c790c624-b93e-498b-97ba-0fb47f8b4b52":
			//Сведения о сертификате соответствия
			node.certificate_number = special_params.certificate_number;

			//Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
			node.manufacturer = special_params.ke_manufacturer;

			//Регистрационный номер свидетельства о присвоении номера для клеймения
			node.branding_code_certificate_number = special_params.branding_code_certificate_number;

			//Номер изделия по системе нумерации предприятия-изготовителя
			node.manufacturer_number = special_params.manufacturer_number;

			// Свидетельство о приемке
			node.acceptance_certificate = special_params.acceptance_certificate;
			break;
		// Колесная пара без буксовых узлов
		case "00b0b326-a67a-4ce2-95af-376fcc9d8355":
			//Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
			node.manufacturer = special_params.ke_manufacturer;

			//Регистрационный номер свидетельства о присвоении номера для клеймения
			node.branding_code_certificate_number = special_params.branding_code_certificate_number;

			//Сведения о сертификате соответствия
			node.certificate_number = special_params.certificate_number;

			// Свидетельство о приемке
			node.acceptance_certificate = special_params.acceptance_certificate;
			break;
		// Автосцепка СА-3
		case "ae11ae44-1c69-49e0-83a1-4122bb2d80ae":
			//Сведения о сертификате соответствия
			node.certificate_number = special_params.certificate_number;

			//Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
			node.manufacturer = special_params.ke_manufacturer;

			//Регистрационный номер свидетельства о присвоении номера для клеймения
			node.branding_code_certificate_number = special_params.branding_code_certificate_number;

			//Индивидуальные особенности
			node.individual_features = special_params.individual_features;

			//Номер изделия по системе нумерации предприятия-изготовителя
			node.manufacturer_number = special_params.manufacturer_number;

			//Обозначение модели автосцепки
			node.autocoupler_model = special_params.autocoupler_model;

			// Свидетельство о приемке
			node.acceptance_certificate = special_params.acceptance_certificate;
			break;
		// Тележка
		case "cbb9d8cb-89ef-4b99-be77-a7d6e57e388e":
			//Сведения о сертификате соответствия
			node.certificate_number = special_params.certificate_number;

			//Срок службы
			node.life_time = special_params.life_time;

			//Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
			node.manufacturer = special_params.ke_manufacturer;

			//Регистрационный номер свидетельства о присвоении номера для клеймения
			node.branding_code_certificate_number = special_params.branding_code_certificate_number;

			//Номер изделия по системе нумерации предприятия-изготовителя
			node.manufacturer_number = special_params.manufacturer_number;

			//Код государства собственника детали
			node.administration_code = special_params.administration_code;

			//Обозначение модели тележки
			node.truck_model = special_params.truck_model;

			//Тип тележки
			node.truck_type = special_params.truck_type;

			//Максимальная расчетная статическая осевая нагрузка
			node.max_static_axial_load = special_params.max_static_axial_load;

			// Свидетельство о приемке
			node.acceptance_certificate = special_params.acceptance_certificate;
			break;

		// Колесная пара
		case "a3afe986-102a-4a10-aafe-5407134f7c15":
			//Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
			node.manufacturer = special_params.ke_manufacturer;

			//Регистрационный номер свидетельства о присвоении номера для клеймения
			node.branding_code_certificate_number = special_params.branding_code_certificate_number;

			//Код государства собственника детали
			node.administration_code = special_params.administration_code;

			//Максимальная статическая осевая нагрузка
			node.max_static_axial_load = special_params.max_static_axial_load;

			// Свидетельство о приемке
			node.acceptance_certificate = special_params.acceptance_certificate;
			break;

		//Скользун
		case "a70bf64c-215b-4d42-9c8e-f8ab4ac9f357":
			//Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
			node.manufacturer = special_params.ke_manufacturer;

			//Регистрационный номер свидетельства о присвоении номера для клеймения
			node.branding_code_certificate_number = special_params.branding_code_certificate_number;

			// Свидетельство о приемке
			node.acceptance_certificate = special_params.acceptance_certificate;
			break;

		// Поглощающий аппарат
		case "700b86ca-5b88-44d6-a5d3-c2c4e76d96f8":
			//Сведения о сертификате соответствия
			node.certificate_number = special_params.certificate_number;

			//Срок службы
			node.life_time = special_params.life_time;

			//Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
			node.manufacturer = special_params.ke_manufacturer;

			//Регистрационный номер свидетельства о присвоении номера для клеймения
			node.branding_code_certificate_number = special_params.branding_code_certificate_number;

			//Номер изделия по системе нумерации предприятия-изготовителя
			node.manufacturer_number = special_params.manufacturer_number;

			//Обозначение модели
			node.absorbing_device_model = special_params.absorbing_device_model;

			//Класс поглощающего аппарата
			node.class_absorbing_device = special_params.class_absorbing_device;

			//Энергоемкость
			node.energy_intensity = special_params.energy_intensity;

			// Свидетельство о приемке
			node.acceptance_certificate = special_params.acceptance_certificate;
			break;
		//Воздухораспределитель в сборе
		case "a6180bfa-368d-4eff-97f2-c4f6c2612bc6":
			//Сведения о сертификате соответствия
			node.certificate_number = special_params.certificate_number;

			//Срок службы
			node.life_time = special_params.life_time;

			//Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
			node.manufacturer = special_params.ke_manufacturer;

			//Регистрационный номер свидетельства о присвоении номера для клеймения
			node.branding_code_certificate_number = special_params.branding_code_certificate_number;

			//Номер изделия по системе нумерации предприятия-изготовителя
			node.manufacturer_number = special_params.manufacturer_number;

			//Обозначение модели
			node.air_distributor_model = special_params.air_distributor_model;

			// Свидетельство о приемке
			node.acceptance_certificate = special_params.acceptance_certificate;
			break;
	}

	var upd_res = db.update("reestr_ke_nodes", node);
	if(!upd_res.success){
		return upd_res;
	}

	return group_res;
}

/**
 * API Добавить СЧ/узел/СЕ в узел/СЕ
 * @param {*} params {
 * 		"number":string,
 * 		"ke_numbers": array<"number":string, "position":string>>,
 * 		"assembly_element_numbers": array<"number":string, "position":string>>,
 * }
 */
// Актуально на 13.03.20
function api_add_to_assembly_element(params) {
	var allow_groups_names = ["KEControllers", "ManufacturerMultipurposeRole"];
	var check_authorization_res = checkauthorization(allow_groups_names);
	if (!check_authorization_res.success) return check_authorization_res;

	if (isNullObject(params)) {
		return badResp("Неверный формат входных параметров.");
	}

	if (isEmptyString(params.number)){
		return badResp("Необходимо указать УИН родительского СЕ.")
	}

	if (isEmptyOrNullArray(params.ke_numbers) && isEmptyOrNullArray(params.assembly_element_numbers)) {
		return badResp("Необходимо указать УИН группируемых СЧ или узлов/СЕ.")
	}

	// Получаем дочерний узел/СЕ
	var parent_ssembly_elements_params = {
		"unique_number": params.number
	};
	var parent_assembly_elements = db.findbyparams("reestr_ke_nodes", parent_ssembly_elements_params);
	if (isEmptyOrNullArray(parent_assembly_elements)) {
		return badResp("Сборочный элемент с УИН " + params.number + " не найден в системе.");
	}

	var parent_assembly_element = parent_assembly_elements[0];

	var ke_node_type = db.findbyrecid("dictionary_ke_node_types", parent_assembly_element.ke_node_type);
	if (isEmptyString(ke_node_type)) {
		return badResp("Тип узла не найден в системе.");
	}

	var reestr_ke_node_type = db.findbyrecid("reestr_ke_node_types", parent_assembly_element.reestr_ke_node_type);
	if (isNullObject(reestr_ke_node_type)) {
		return badResp("Не найдена запись в Реестре номенклатуры узлов.");
	}

	// Валидация поля ke_numbers и замена номеров на uuid
	var ke_numbers_with_ids = [];
	var ke_numbers_for_validation = [];
	var ke_positions_for_validation = [];
	if (isNotEmptyOrNullArray(params.ke_numbers)) {
		for (var i = 0; i < params.ke_numbers.length; i++) {
			if (isEmptyString(params.ke_numbers[i].number)) {
				return badResp("Не указан номер СЧ для элемента " + i);
			}
			var ke_numbers = db.findbyparams("ke_numbers", {
				recname: params.ke_numbers[i].number
			})
			if (isEmptyOrNullArray(ke_numbers)) {
				return badResp(String().concat("УИН ", params.ke_numbers[i].number, " не найден в системе"));
			}
			var ke_number = ke_numbers[0];
			var reestr_key_element_params = {
				"ke_number": ke_number.recid
			};
			
			var reestr_key_elements = db.findbyparams("reestr_key_elements", reestr_key_element_params);
			if (isEmptyOrNullArray(reestr_key_elements)) {
				return badResp("Не найдена запись в реестре СЧ с номером " + params.ke_numbers[i].number + ", элемент #" + i);
			}
			var key_element = reestr_key_elements[0];
			ke_numbers_for_validation.push(ke_number.recname);
	
			// Если СЧ имеет позицию в родительском узле
			// Проверка что СЧ имеет позицию в узле
			// var dictionary_positions_on_node = db.findbyparams("dictionary_positions_on_node", {
			// 	key_element_code: key_element.key_element_code,
			// 	node_type: ke_node_type.recid
			// })
			if (isEmptyString(params.ke_numbers[i].position)) {
				var numbers_struct = {
					"number": key_element.recid
				};
				ke_numbers_with_ids.push(numbers_struct);
			} 
			else {
				if (isEmptyString(params.ke_numbers[i].position)) {
					return badResp("Не указана позиция СЧ для элемента ke_numbers[" + i + "]");
				}

				//Если это одиночный СЧ
				if (isEmptyString(key_element.ke_node)) {
					var dictionary_positions_on_node = db.findbyrecid("dictionary_positions_on_node", params.ke_numbers[i].position);
					if (isEmptyString(dictionary_positions_on_node)) {
						return badResp("Не найдена запись в справочнике позиций в узле с id " + params.ke_numbers[i].position + ", элемент #" + i);
					}

					ke_positions_for_validation.push(dictionary_positions_on_node.recid);
					var numbers_struct = {
						"number": key_element.recid,
						"position": dictionary_positions_on_node.recid
					};

					ke_numbers_with_ids.push(numbers_struct);
				} 
				else { //Если это СЧ в узле
					var parent_node = db.findbyrecid("reestr_ke_nodes", key_element.ke_node);
					if (isNullObject(parent_node)) {
						return badResp(String().concat("Не удалось найти запись родительского узла для СЧ ", ke_number.recname));
					}

					var position_on_parent_node = db.findbyrecid("dictionary_positions_on_parent_node", params.ke_numbers[i].position);
					if (isNullObject(position_on_parent_node)) {
						return badResp(String().concat("Не удалось найти позиции в родительском узле для узла, в который включен СЧ ", ke_number.recname));
					}

					var numbers_struct = {
						"number": key_element.recid,
						"position": position_on_parent_node.recid
					};

					ke_numbers_with_ids.push(numbers_struct);
					ke_positions_for_validation.push(position_on_parent_node.recid);
				}
			}
		}
	
		// Проверка повторения элементов 
		// Для номеров
		for (var i = 0; i < ke_numbers_for_validation.length; i++) {
			var numbers_entries = 0;
			for (var j = 0; j < ke_numbers_for_validation.length; j++) {
				if (ke_numbers_for_validation[i] == ke_numbers_for_validation[j]) {
					numbers_entries++;
				}
			}
			if (numbers_entries > 1) {
				return badResp("Номер " + ke_numbers_for_validation[i] + " встречаеся " + numbers_entries + " раз");
			}
		}
		
		// Для позиций
		for (var i = 0; i < ke_positions_for_validation.length; i++) {
			var positions_entries = 0;
			for (var j = 0; j < ke_positions_for_validation.length; j++) {
				if (ke_positions_for_validation[i] == ke_positions_for_validation[j]) {
					positions_entries++;
				}
			}
			if (positions_entries > 1) {
				return badResp("Позиция " + ke_positions_for_validation[i] + " встречаеся " + positions_entries + " раз");
			}
		}
	}

	// Валидация поля ke_numbers и замена номеров на uuid
	var assembly_element_numbers_with_ids = [];
	var assembly_element_numbers_for_validation = [];
	var assembly_element_positions_for_validation = [];
	if (isNotEmptyOrNullArray(params.assembly_element_numbers)) {
		for (var i = 0; i < params.assembly_element_numbers.length; i++) {
			if (isEmptyString(params.assembly_element_numbers[i].number)) {
				return badResp("Не указан номер узла/СЕ для элемента " + i);
			}
	
			var assembly_elements = db.findbyparams("reestr_ke_nodes", {
				unique_number: params.assembly_element_numbers[i].number
			});
			if (isEmptyOrNullArray(assembly_elements)) {
				return badResp("Сборочный элемент с УИН " + params.assembly_element_numbers[i].number + " не найден в системе.");
			}
			var assembly_element = assembly_elements[0];
	
			if (isEmptyString(params.assembly_element_numbers[i].position)) {
				return badResp("Сборочный элемент с УИН " + assembly_element.unique_number + ". " + "Необходимо указать позицию узла/СЕ.");
			}
	
			var assembly_element_position = db.findbyrecid("dictionary_node_positions", params.assembly_element_numbers[i].position);
	
			if (isNullObject(assembly_element_position)) {
				return badResp("Сборочный элемент с УИН " + assembly_element.unique_number + ". " + "Не удалось найти в системе указанную позицию.");
			}
	
			// Получаем доступные позиции для узла/СЕ в СЕ/узле
			var assembly_element_available_positions_res = api_get_assembly_element_available_positions_on_assembly_element({
				"assemblyElementNumber": assembly_element.unique_number,
				"parentAssemblyElementNumber": parent_assembly_element.unique_number
			});
	
			if (!assembly_element_available_positions_res.success) {
				return badResp("Сборочный элемент с УИН " + assembly_element.unique_number + ". " + assembly_element_available_positions_res.message);
			}

			// Если нет доступных позиций, то возвращаем ошибку
			if (isEmptyOrNullArray(assembly_element_available_positions_res.data)) {
				return badResp("Сборочный элемент с УИН " + assembly_element.unique_number + ". " + "Нет доступных позиций для установки.");
			}

			var assembly_element_available_positions = assembly_element_available_positions_res.data;
	
			var check_available_positions = false;
	
			// Если нет доступных позиций, то возвращаем ошибку
			for (var k = 0; k < assembly_element_available_positions.length; k++) {
				if (assembly_element_available_positions[k].position_id == assembly_element_position.recid) {
					check_available_positions = true;
				}
			}
	
			if (!check_available_positions) {
				return badResp("Сборочный элемент с УИН " + assembly_element.unique_number + ". " + "Нельзя установить сборочный элемент на указанную позицию.");
			}
	
			var numbers_struct = {
				"number": assembly_element.recid,
				"position": assembly_element_position.recid
			};
	
			assembly_element_numbers_with_ids.push(numbers_struct);
			assembly_element_positions_for_validation.push(assembly_element_position.recid);
			assembly_element_numbers_for_validation.push(assembly_element.unique_number);
		}
	
		// Проверка повторения элементов 
		// Для номеров
		for (var i = 0; i < assembly_element_numbers_for_validation.length; i++) {
			var numbers_entries = 0;
			for (var j = 0; j < assembly_element_numbers_for_validation.length; j++) {
				if(assembly_element_numbers_for_validation[i] == assembly_element_numbers_for_validation[j]) {
					numbers_entries++;
				}
			}
			if (numbers_entries > 1) {
				return badResp("Номер " + assembly_element_numbers_for_validation[i] + " указан более одного раза.");
			}
		}
	}
	

	var ke_numbers_param = [];
	if (isNotEmptyOrNullArray(ke_numbers_with_ids)) {
		for (var i = 0; i < ke_numbers_with_ids.length; i++) {
			ke_numbers_param.push(ke_numbers_with_ids[i]);
		}
	}
	if (isNotEmptyOrNullArray(assembly_element_numbers_with_ids)) {
		for (var i = 0; i < assembly_element_numbers_with_ids.length; i++) {
			ke_numbers_param.push(assembly_element_numbers_with_ids[i]);
		}
	}

	if (ke_node_type.assembly_element_type == commonAssemblyElementTypes.node_id) {
		return addketonode({
			"recid": parent_assembly_element.recid,
			"ke_numbers": JSON.stringify(ke_numbers_param)
		});
	}
	else if (ke_node_type.assembly_element_type == commonAssemblyElementTypes.assembly_unit_id) {
		return addketoassemblyunit({
			"recid": parent_assembly_element.recid,
			"ke_numbers": JSON.stringify(ke_numbers_param)
		});
	}
}


/**
 * Получить все возможные позиции СЧ в узле/СЕ
 * @param {*} params {
 * 		"keNumber": string, "reestrKeNodeType": string
 * }
 */
// Актуально на 31.03.20
function api_get_key_element_positions_on_assembly_element(params) {
	if (isNullObject(params)) {
		return badResp("Необходимо указать параметры.");
	}

	if (isEmptyString(params.keNumber)) {
		return badResp("Необходимо заполнить \"Номер СЧ\" (keNumber).");
	}

	if (isEmptyString(params.reestrKeNodeType)) {
		return badResp("Необходимо заполнить \"Идентификатор шаблона узла/СЕ\" (reestrKeNodeType).");
	}

	var keyElementsParams = {
		"numberke": params.keNumber
	};
	
	var keyElements = db.findbyparams("reestr_key_elements", keyElementsParams);
	if (isEmptyOrNullArray(keyElements)) {
		return badResp("составная часть с номером " + params.keNumber + " не найден в системе");
	}

	var keyElement = keyElements[0];

	// Получаем шаблон целевого сборочного элемента из таблицы "Шаблоны сборочных единиц"
	var parentNodePattern = db.findbyrecid("reestr_ke_node_types", params.reestrKeNodeType);
	if (isNullObject(parentNodePattern)) {
		return badResp("Шаблон узла/СЕ с идентификатором " + params.reestrKeNodeType + " не найден в системе");
	}

	var allPositionsRes = getAllPositionsOnAssemblyElementByKeyElement(keyElement, parentNodePattern);
	if (!allPositionsRes.success) {
		return badResp(allPositionsRes);
	}

	var allPositions = allPositionsRes.data;

	// Сортируем массив доступных позиций по наименованию
	allPositions.sort(function(a, b) {
		var recnameA = a.recname.toLowerCase();
		var recnameB = b.recname.toLowerCase();

		if (recnameA < recnameB) {
			return -1;
		} else {
			return 1;
		}
	})

	var result = [];

	for (var i = 0; i < allPositions.length; i++) {
		result.push({
			"position_id": allPositions[i].recid,
			"position_name": allPositions[i].recname
		});
	}

	return successResp("", result);
}

/**
 * Получить все доступные позиции для СЧ в узле/СЕ
 * @param {*} params {
 * 		"keNumber": string, "assemblyElementNumber": string
 * }
 */
// Актуально на 31.03.20
function api_get_key_element_available_positions_on_assembly_element(params) {
	if (isNullObject(params)) {
		return badResp("Необходимо указать параметры.");
	}

	if (isEmptyString(params.keNumber)) {
		return badResp("Необходимо заполнить \"Номер СЧ\" (keNumber).");
	}

	if (isEmptyString(params.assemblyElementNumber)) {
		return badResp("Необходимо заполнить \"Номер узла/СЕ\" (assemblyElementNumber).");
	}

	// Получаем СЧ
	var keyElementsParams = {
		"numberke": params.keNumber
	};
	
	var keyElements = db.findbyparams("reestr_key_elements", keyElementsParams);
	if (isEmptyOrNullArray(keyElements)) {
		return badResp("составная часть с номером " + params.keNumber + " не найден в системе");
	}

	var keyElement = keyElements[0];

	// Получаем узел/СЕ
	var assemblyElementsParams = {
		"unique_number": params.assemblyElementNumber
	};
	var assemblyElements = db.findbyparams("reestr_ke_nodes", assemblyElementsParams);
	if (isEmptyOrNullArray(assemblyElements)) {
		return badResp("Сборочный элемент с УИН " + params.assemblyElementNumber + " не найден в системе.");
	}

	var assemblyElement = assemblyElements[0];

	// Получаем шаблон целевого сборочного элемента из таблицы "Шаблоны сборочных единиц"
	var parentNodePattern = db.findbyrecid("reestr_ke_node_types", assemblyElement.reestr_ke_node_type);
	if (isNullObject(parentNodePattern)) {
		return badResp("Шаблон узла/СЕ с идентификатором " + assemblyElement.reestr_ke_node_type + " не найден в системе");
	}

	var allPositionsRes = getAllPositionsOnAssemblyElementByKeyElement(keyElement, parentNodePattern);
	if (!allPositionsRes.success) {
		return badResp(allPositionsRes);
	}
	var allPositions = allPositionsRes.data;

	var freePositionsRes = getFreePositionsOnAssemblyElementByKeyElement(keyElement, assemblyElement, allPositions);
	if (!freePositionsRes.success) {
		return badResp(freePositionsRes);
	}
	var freePositions = freePositionsRes.data;

	// Сортируем массив доступных позиций по наименованию
	freePositions.sort(function(a, b) {
		var recnameA = a.recname.toLowerCase();
		var recnameB = b.recname.toLowerCase();

		if (recnameA < recnameB) {
			return -1;
		} else {
			return 1;
		}
	})

	var result = [];

	for (var i = 0; i < freePositions.length; i++) {
		result.push({
			"position_id": freePositions[i].recid,
			"position_name": freePositions[i].recname
		});
	}

	return successResp("", result);
}

/**
 * Получить все возможные позиции для узла/СЕ в узле/СЕ
 * @param {*} params {
 * 		"assemblyElementNumber": string, "reestrKeNodeType": string
 * }
 */
// Актуально на 31.03.20
function api_get_assembly_element_positions_on_assembly_element(params) {
	if (isNullObject(params)) {
		return badResp("Необходимо указать параметры.");
	}

	if (isEmptyString(params.assemblyElementNumber)) {
		return badResp("Необходимо заполнить \"Номер узла/СЕ\" (assemblyElementNumber).");
	}

	if (isEmptyString(params.reestrKeNodeType)) {
		return badResp("Необходимо заполнить \"Идентификатор шаблона узла/СЕ\" (reestrKeNodeType).");
	}

	// Получаем дочерний узел/СЕ
	var assemblyElementsParams = {
		"unique_number": params.assemblyElementNumber
	};
	var assemblyElements = db.findbyparams("reestr_ke_nodes", assemblyElementsParams);
	if (isEmptyOrNullArray(assemblyElements)) {
		return badResp("Сборочный элемент с УИН " + params.assemblyElementNumber + " не найден в системе.");
	}

	var assemblyElement = assemblyElements[0];

	// Получаем тип просканированного сборочного элемента из справочника "Типы узлов/сборочных единиц"
	var assemblyElementType = db.findbyrecid("dictionary_ke_node_types", assemblyElement.ke_node_type);
	if (isNullObject(assemblyElementType)) {
		return badResp("Тип сборочного элемента с УИН " + params.assemblyElementNumber + " не найден в системе.");
	}

	// Проверяем что узел/СЕ не установлен в узел/СЕ
	if(isNotEmptyString(assemblyElement.parent_ke_node)){
		return badResp("Узел/СЕ уже установлен в узел/СЕ.");
	}

	if (assemblyElement.status != "823cc6e9-465b-416e-beda-8a642149c235") {
		return badResp("Нельзя установить узел/СЕ " + assemblyElement.unique_number + " в текущем статусе."); 
	}

	// Если просканирован узел/СЕ, который можно разворачивать при установке, то возвращаем ошибку
	if (assemblyElementType.is_variable)
		return badResp("Для установки данного сборочного элемента необходимо использовать СЧ.");

	// Получаем шаблон целевого сборочного элемента из таблицы "Шаблоны сборочных единиц"
	var parentNodePattern = db.findbyrecid("reestr_ke_node_types", params.reestrKeNodeType);
	if (isNullObject(parentNodePattern)) {
		return badResp("Шаблон узла/СЕ с идентификатором " + params.reestrKeNodeType + " не найден в системе");
	}

	var allPositionsRes = getAllPositionsOnAssemblyElementByAssemblyElement(assemblyElement, parentNodePattern);
	if (!allPositionsRes.success) {
		return badResp(allPositionsRes);
	}
	var allPositions = allPositionsRes.data;

	// Сортируем массив доступных позиций по наименованию
	allPositions.sort(function(a, b) {
		var recnameA = a.recname.toLowerCase();
		var recnameB = b.recname.toLowerCase();

		if (recnameA < recnameB) {
			return -1;
		} else {
			return 1;
		}
	});

	var result = [];

	for (var i = 0; i < allPositions.length; i++) {
		result.push({
			"position_id": allPositions[i].recid,
			"position_name": allPositions[i].recname
		});
	}

	return successResp("", result);
}

/**
 * Получить все доступные позиции для узла/СЕ в узле/СЕ
 * @param {*} params {
 * 		"assemblyElementNumber": string, "parentAssemblyElementNumber": string
 * }
 */
// Актуально на 31.03.20
function api_get_assembly_element_available_positions_on_assembly_element(params) {
	if (isNullObject(params)) {
		return badResp("Необходимо указать параметры.");
	}

	if (isEmptyString(params.assemblyElementNumber)) {
		return badResp("Необходимо заполнить \"Номер узла/СЕ\" (assemblyElementNumber).");
	}

	if (isEmptyString(params.parentAssemblyElementNumber)) {
		return badResp("Необходимо заполнить \"Номер родительского узла/СЕ\" (parentAssemblyElementNumber).");
	}

	// Получаем дочерний узел/СЕ
	var assemblyElementsParams = {
		"unique_number": params.assemblyElementNumber
	};
	var assemblyElements = db.findbyparams("reestr_ke_nodes", assemblyElementsParams);
	if (isEmptyOrNullArray(assemblyElements)) {
		return badResp("Сборочный элемент с УИН " + params.assemblyElementNumber + " не найден в системе.");
	}

	var assemblyElement = assemblyElements[0];

	// Получаем тип просканированного сборочного элемента из справочника "Типы узлов/сборочных единиц"
	var assemblyElementType = db.findbyrecid("dictionary_ke_node_types", assemblyElement.ke_node_type);
	if (isNullObject(assemblyElementType)) {
		return badResp("Тип сборочного элемента с УИН " + params.assemblyElementNumber + " не найден в системе.");
	}

	// Проверяем что узел/СЕ не установлен в узел/СЕ
	if(isNotEmptyString(assemblyElement.parent_ke_node)){
		return badResp("Узел/СЕ уже установлен в узел/СЕ.");
	}

	if (assemblyElement.status != "823cc6e9-465b-416e-beda-8a642149c235") {
		return badResp("Нельзя установить узел/СЕ " + assemblyElement.unique_number + " в текущем статусе."); 
	}

	// Если просканирован узел/СЕ, который можно разворачивать при установке, то возвращаем ошибку
	if (assemblyElementType.is_variable)
		return badResp("Для установки данного сборочного элемента необходимо использовать СЧ.");

	// Получаем родительский узел/СЕ
	var parentAssemblyElementsParams = {
		"unique_number": params.parentAssemblyElementNumber
	};
	var parentAssemblyElements = db.findbyparams("reestr_ke_nodes", parentAssemblyElementsParams);
	if (isEmptyOrNullArray(parentAssemblyElements)) {
		return badResp("Сборочный элемент с УИН " + params.parentAssemblyElementNumber + " не найден в системе.");
	}

	var parentAssemblyElement = parentAssemblyElements[0];

	// Получаем шаблон целевого сборочного элемента из таблицы "Шаблоны сборочных единиц"
	var parentNodePattern = db.findbyrecid("reestr_ke_node_types", parentAssemblyElement.reestr_ke_node_type);
	if (isNullObject(parentNodePattern)) {
		return badResp("Шаблон узла/СЕ с идентификатором " + parentAssemblyElement.reestr_ke_node_type + " не найден в системе");
	}

	var allPositionsRes = getAllPositionsOnAssemblyElementByAssemblyElement(assemblyElement, parentNodePattern);
	if (!allPositionsRes.success) {
		return badResp(allPositionsRes);
	}
	var allPositions = allPositionsRes.data;

	var freePositionsRes = getFreePositionsOnAssemblyElementByAssemblyElement(assemblyElement, parentAssemblyElement, allPositions);
	if (!freePositionsRes.success) {
		return badResp(freePositionsRes);
	}
	var freePositions = freePositionsRes.data;

	// Сортируем массив доступных позиций по наименованию
	freePositions.sort(function(a, b) {
		var recnameA = a.recname.toLowerCase();
		var recnameB = b.recname.toLowerCase();

		if (recnameA < recnameB) {
			return -1;
		} else {
			return 1;
		}
	})

	var result = [];

	for (var i = 0; i < freePositions.length; i++) {
		result.push({
			"position_id": freePositions[i].recid,
			"position_name": freePositions[i].recname
		});
	}

	return successResp("", result);
}

// API Сгруппировать узел
// params = {
//     "ke_node_type": string,
//     "reestr_ke_node_type": string,
//     "ke_numbers": array<"number":string, "position":string>>
// }
// Актуально на 13.03.20
function apigroupkenode(params) {
	var allow_groups_names = ["KEControllers", "ManufacturerMultipurposeRole"];
	var check_authorization_res = checkauthorization(allow_groups_names);
	if (!check_authorization_res.success) return check_authorization_res;

	if (isNullObject(params)) {
		return badResp("Неверный формат входных параметров.");
	}

	if (isEmptyString(params.ke_node_type)) {
		return badResp("Необходимо указать код типа узла.");
	}

	var ke_node_type = null;
	if (isNotEmptyString(params.ke_node_type)) {
		var ke_node_type_params = { "reccode": params.ke_node_type };
		var ke_node_types = db.findbyparams("dictionary_ke_node_types", ke_node_type_params);
		if (isEmptyOrNullArray(ke_node_types)) { return badResp("Тип узла не найден в системе."); }
		ke_node_type = ke_node_types[0];
	}

	if (isEmptyString(ke_node_type.assembly_element_type)
		|| ke_node_type.assembly_element_type != commonAssemblyElementTypes.node_id) {
		return badResp("Для сканирования СЕ используйте метод \"apigroupassemblyunit\".");
	}

	// if (isEmptyString(params.reestr_ke_node_type)) {
	// 	return badResp("Необходимо указать код записи из Реестра номенклатуры узлов.");
	// }

	if (isEmptyOrNullArray(params.ke_numbers)) {
		return badResp("Необходимо указать список номеров СЧ.");
	}


	//Валидация поля ke_numbers и замена номеров на uuid
	var ke_numbers_with_ids = [];
	var ke_numbers_for_validation = [];
	var ke_positions_for_validation = [];
	for (var i = 0; i < params.ke_numbers.length; i++) {
		if (isEmptyString(params.ke_numbers[i].number)) {
			return badResp("Не указан номер СЧ для элемента " + i);
		}

		var reestr_key_element_params = {
			"numberke": params.ke_numbers[i].number
		};

		var reestr_key_elements = db.findbyparams("reestr_key_elements", reestr_key_element_params);
		if (isEmptyOrNullArray(reestr_key_elements)) {
			return badResp("Не найдена запись в реестре СЧ с номером " + params.ke_numbers[i].number + ", элемент #" + i);
		}
		ke_numbers_for_validation.push(params.ke_numbers[i].number);
		//Если СЧ имеет позицию в родительском узле
		if (reestr_key_elements[0].key_element_code != keyElementCodes.pressure_beam_id &&
			reestr_key_elements[0].key_element_code != keyElementCodes.side_frame_id &&
			reestr_key_elements[0].key_element_code != keyElementCodes.saddle_ring_id) {
			if (isEmptyString(params.ke_numbers[i].position)) {
				return badResp("Не указана позиция СЧ для элемента ke_numbers[" + i + "]");
			}

			var dictionary_positions_on_node = db.findbyrecid("dictionary_positions_on_node", params.ke_numbers[i].position);
			if (isEmptyString(dictionary_positions_on_node)) {
				return badResp("Не найдена запись в справочнике позиций в узле с id " + params.ke_numbers[i].position + ", элемент #" + i);
			}
			ke_positions_for_validation.push(params.ke_numbers[i].position);
			var numbers_struct = {
				"number": reestr_key_elements[0].recid,
				"numberValue": reestr_key_elements[0].numberke,
				"position": params.ke_numbers[i].position
			};
			ke_numbers_with_ids.push(numbers_struct);
		} else {
			var numbers_struct = {
				"number": reestr_key_elements[0].recid,
				"numberValue": reestr_key_elements[0].numberke
			};
			ke_numbers_with_ids.push(numbers_struct);
		}
	}

	//Проверка повторения элементов 
	//Для номеров
	for (var i = 0; i < ke_numbers_for_validation.length; i++) {
		var numbers_entries = 0;
		for (var j = 0; j < ke_numbers_for_validation.length; j++) {
			if (ke_numbers_for_validation[i] == ke_numbers_for_validation[j]) {
				numbers_entries++;
			}
		}
		if (numbers_entries > 1) {
			return badResp("Номер " + ke_numbers_for_validation[i] + " встречаеся " + numbers_entries + " раз");
		}
	}

	//Для позиций
	for (var i = 0; i < ke_positions_for_validation.length; i++) {
		var positions_entries = 0;
		for (var j = 0; j < ke_positions_for_validation.length; j++) {
			if (ke_positions_for_validation[i] == ke_positions_for_validation[j]) {
				positions_entries++;
			}
		}
		if (positions_entries > 1) {
			return badResp("Позиция " + ke_positions_for_validation[i] + " встречаеся " + positions_entries + " раз");
		}
	}

	var insert_res = db.insert("reestr_ke_nodes", {});

	if (insert_res == null || insert_res == "") {
		return badResp("Не удалось создать узел.");
	}

	var documentation_number = null;
	// Обозначение изделия
	if (isNotEmptyString(params.documentation_number)) {
		var documentation_number_params = {
			"detail": params.documentation_number,
			"ke_node_type": ke_node_type.recid
		};
		var documentation_numbers = db.findbyparams("reestr_documentation", documentation_number_params);
		if (isEmptyOrNullArray(documentation_numbers)) { return badResp("Обозначение изделия не найдено в системе."); }
		documentation_number = documentation_numbers[0];
	}

	var date = new Date();
	var date_manufacture = null;

	// Дата изготовления
	if (isNotEmptyString(params.date_manufacture)) {
		if (isNaN(Date.parse(params.date_manufacture.toString()))) {
			return badResp(String().concat("Не удалось распарсить дату ", params.date_manufacture, ", используйте дату формата \"yyyy-MM-ddThh:mm:ssZ\""));
		}

		date_manufacture = new Date(params.date_manufacture);
	}
	else {
		date_manufacture = date;
	}

	var kenodescannumbers_params = {
		"ke_node_type": ke_node_type.recid,
		//"reestr_ke_node_type": reestr_ke_node_type.recid,
		"ke_numbers": JSON.stringify(ke_numbers_with_ids),
		"recid": insert_res.recid,

		"from_api": true,
		"documentation_number": documentation_number.recid
	};

	var group_res = kenodescannumbers(kenodescannumbers_params);

	if (!group_res.success) {
		return group_res;
	}

	var node = db.findbyrecid("reestr_ke_nodes", insert_res.recid);

	// Обозначение изделия
	node.documentation_number = documentation_number.recid;
	// Дата изготовления
	node.formation_date = date_manufacture;

	var upd_res = db.update("reestr_ke_nodes", node);
	if (!upd_res.success) {
		return upd_res;
	}

	return group_res;
}

// API Разгруппировать узел/СЕ
// params = {
//     "node_number": string
// }
// Актуально на 13.03.20
function apiungroupassemblyelement(params) {
	var allow_groups_names = ["KEControllers", "ManufacturerMultipurposeRole"];
	var check_authorization_res = checkauthorization(allow_groups_names);
	if (!check_authorization_res.success) return check_authorization_res;

	if (isNullObject(params)) {
		return badResp("Неверный формат входных параметров.");
	}

	if (isEmptyString(params.node_number)) {
		return badResp("Необходимо указать номер узла.");
	}
	
	//Получение узла для разгруппировки
	var ke_numbers = db.findbyparams("ke_numbers", {
		recname: params.node_number
	});
	if (isEmptyOrNullArray(ke_numbers)) {
		return badResp("УИН узла не найден в системе");
	}
	var ke_number = ke_numbers[0];

	var nodes = db.findbyparams("reestr_ke_nodes", {
		unique_number_relation: ke_number.recid
	});
	if (isEmptyOrNullArray(nodes)) {
		return badResp(String().concat("Узел ", params.node_number, " не найден в системе"));
	}

	var node = nodes[0];

	// Получаем тип узла
	var node_type = db.findbyrecid("dictionary_ke_node_types", node.ke_node_type);
	if (isNullObject(node_type)){
		return badResp("Тип узла не найден в системе.");
	}

	// Получаем тип сборочного элемента
	var assembly_element_type = db.findbyrecid("dictionary_assembly_element_types", node_type.assembly_element_type);
	if (isNullObject(assembly_element_type)){
		return badResp("Тип сборочного элемента не найден в системе.");
	}

    var ungroupkenode_params = {
        "recid": node.recid
	};

	var ungroup_res = null;

	if (assembly_element_type.recid == commonAssemblyElementTypes.node_id) {
		ungroup_res = ungroupkenode(ungroupkenode_params);
	}
	else if (assembly_element_type.recid == commonAssemblyElementTypes.assembly_unit_id) {
		ungroup_res = ungroupassemblyunit(ungroupkenode_params);
	}

	return ungroup_res;
}


// API Получить записи таблицы "Реестр узлов" (reestr_ke_nodes)
// Актуально на 13.03.20
function apigetreestrkenodes() {
    var res_array = [];

	// Получаем все записи таблицы
	var records = db.find("reestr_ke_nodes");

	if (isEmptyOrNullArray(records)) {
		return badResp("Записи не найдены в системе.");
	}

	for (var i = 0; i < records.length; i++) {
		var record = records[i];
		var node_type_recname = ""
		if(isNotEmptyString(record.ke_node_type)){
			var node_type = db.findbyrecid("dictionary_ke_node_types", record.ke_node_type);
			if(isNotNullObject(node_type)){
				node_type_recname = node_type.recname;
			}
		}
		
		var unique_node_number = "";
		
		if(isNotEmptyString(record.unique_number)){
			unique_node_number = record.unique_number;
		}
		
		res_array.push({
			"node_type": node_type_recname,
			"number": unique_node_number,
			"id": record.recid
		});
	}

	return successResp(null, res_array);
}


// API Получить записи таблицы  "Позиции в узле" (dictionary_positions_on_node)
// Актуально на 13.03.20
function apigetpositionsonnodetypes(){
	var res_array = [];
	
	//Получаем все записи таблицы
	var records = db.find("dictionary_positions_on_node");
	
	if(isEmptyOrNullArray(records)){
		return badResp("Записи о позициях в узле не найдены в системе");
	}
	
	for (var i = 0; i < records.length; i++) {
		var record = records[i];
		var ke_type = db.findbyrecid("dictionary_key_elements_codes", record.key_element_code);
		var ke_node_type_name = "";
		if(isNotEmptyString(record.node_type)){
			var ke_node_type = db.findbyrecid("dictionary_ke_node_types", record.node_type);
			if(isNotNullObject(ke_node_type)){
				ke_node_type_name = ke_node_type.recname;
			}
		}
		res_array.push({
			"ke_node_type": ke_node_type_name,
			"ke_name": ke_type.recname,
			"name": record.recname,
			"id": record.recid
		});
	}
	
	return successResp(null, res_array);
	
}


// API Получить записи таблицы "Позиции на вагоне" (dictionary_positions_on_vagon)
// Актуально на 13.03.20
function apigetdictionarypositionsonwagon() {
	var res_array = [];

	// Получаем все записи таблицы
	var records = db.find("dictionary_positions_on_vagon");

	if (isEmptyOrNullArray(records)) {
		return badResp("Записи не найдены в системе.");
	}

	for (var i = 0; i < records.length; i++) {
		var record = records[i];

		var key_element_recname = null;
		var assembly_element_recname = null;

		if (isNotEmptyString(record.key_element_code)) {
			var key_element_code = db.findbyrecid("dictionary_key_elements_codes", record.key_element_code);
			key_element_recname = key_element_code.recname;
		}
		else if (isNotEmptyString(record.child_node_type)) {
			var assembly_element_type = db.findbyrecid("dictionary_ke_node_types", record.child_node_type);
			assembly_element_recname = assembly_element_type.recname;
		}

		res_array.push({
			"key_element_code": key_element_recname,
			"assembly_element": assembly_element_recname,
			"recname": record.recname
		});
	}

	return successResp(null, res_array);
}

// API Получить отфильтрованные записи таблицы "Позиции на вагоне" по Заводскому номеру ТС
// и УИН СЧ (dictionary_positions_on_vagon)
// {
// 	// УИН СЧ
// 	"ke_number": "string",
// 	// Заводской номер ТС
// 	"vehicle": "string"
// }
// Актуально на 20.03.20
function api_get_key_element_positions_on_vagon(params) {
	var res_array = [];

	if (isNullObject(params)) {
		return badResp("Неверный формат входных параметров.");
	}

	// Проверяем наличие обязательных параметров
	// УИН
	if (isEmptyString(params.ke_number)) {
		return badResp("Необходимо указать обязательное поле - УИН СЧ.");
	}
	// Наименование изделия
	if (isEmptyString(params.vehicle)) {
		return badResp("Необходимо указать обязательное поле - Заводской номер ТС.");
	}

	var reestr_key_element_params = {
		"numberke": params.ke_number
	};
	var reestr_key_elements = db.findbyparams("reestr_key_elements", reestr_key_element_params)
	if (isEmptyOrNullArray(reestr_key_elements)) {
		return badResp("составная часть не найден в системе.");
	}
	var reestr_key_element = reestr_key_elements[0];

	var reestr_vehicle_params = {
		"manufacturer_number": params.vehicle
	};
	var reestr_vehicles = db.findbyparams("reestr_vehicles", reestr_vehicle_params)
	if (isEmptyOrNullArray(reestr_vehicles)) {
		return badResp("ТС не найдено в системе.");
	}
	var reestr_vehicle = reestr_vehicles[0];

	var vehicle_model = db.findbyrecid("dictionary_models", reestr_vehicle.dictionary_models);
	if (isNullObject(vehicle_model)) {
		return badResp("Модель вагона не найдена в системе.");
	}
	var vehicle_model_number_axes = vehicle_model.number_axes;
	if (vehicle_model_number_axes != "4" && vehicle_model_number_axes != "6") {
		return badResp("Для указанного ТС не найдены записи в таблице \"Позиции на вагоне\".");
	}

	var records = [];

	if (vehicle_model_number_axes == "4") {
		var dictionary_positions_on_vagon_params = {
			"key_element_code": reestr_key_element.key_element_code,
			"for_four_axes_vagon": true
		};

		records = db.findbyparams("dictionary_positions_on_vagon", dictionary_positions_on_vagon_params);
	}
	else {
		var dictionary_positions_on_vagon_params = {
			"key_element_code": reestr_key_element.key_element_code,
			"for_six_axes_vagon": true
		};

		records = db.findbyparams("dictionary_positions_on_vagon", dictionary_positions_on_vagon_params);
	}

	if (isEmptyOrNullArray(records)) {
		return badResp("Записи не найдены в системе.");
	}

	for (var i = 0; i < records.length; i++) {
		var record = records[i];

		var key_element_code = db.findbyrecid("dictionary_key_elements_codes", record.key_element_code);

		res_array.push({
			"key_element_code": key_element_code.recname,
			"recname": record.recname
		});
	}

	return successResp(null, res_array);
}


// Получение моделей автосцепок
// Актуально на 13.03.20
function api_get_autocoupler_models(params){
	var result = [];

	var records = db.find("dictionary_couplings_models");

	if (isEmptyOrNullArray(records)) {
		return badResp("Записи не найдены в системе.");
	}

	for(var i = 0; i < records.length; i++){
		result.push({
			"uuid": records[i].recid,
			"name": records[i].coupling_name,
			"code": records[i].coupling_code
		});
	}
	return successResp(result);
}

//24.07.2019 #27726
//Получение доступных позиций для СЧ
// "fields": {
// 	//Номер СЧ
// 	"kenumber": "string",
// 	//Номер вагона
// 	"vagonnumber": "string"
// }
// Актуально на 20.03.20
function api_get_key_element_available_positions_on_vagon(params){
	if(isEmptyString(params.kenumber)){
		return badResp("Номер СЧ(kenumber) не может быть пустым");
	}

	if(isEmptyString(params.vagonnumber)){
		return badResp("Номер вагона(vagonnumber) не может быть пустым");
	}

	//Запрос записи из реестра СЧ
	var requestdata = {
		"numberke": params.kenumber
	};
	var reestr_key_elements = db.findbyparams("reestr_key_elements", requestdata);

	if(isEmptyOrNullArray(reestr_key_elements)){
		return badResp("Номер СЧ не найден в системе");
	}

	var key_element = reestr_key_elements[0];
	//Проверяем что СЧ не установлен на вагон
	if(isNotEmptyString(key_element.vehicle) || isNotEmptyString(key_element.vehicle_manufacturer_number) ){
		return(badResp("СЧ уже установлен на вагон"));
	}

	//Запрос записи о вагоне
	var reestr_vehicles_requestdata = {
		"manufacturer_number": params.vagonnumber
	}
	var reestr_vehicles = db.findbyparams("reestr_vehicles", reestr_vehicles_requestdata);

	if(isEmptyOrNullArray(reestr_vehicles)){
		return badResp("Вагон не найден в системе");
	}
	var vehicle_record = reestr_vehicles[0];

	//Запрос установленных СЧ на вагоне и получение их позиций
	var reestr_key_elements_requestdata = {
		"vehicle": vehicle_record.recid,
		"vehicle_manufacturer_number": vehicle_record.manufacturer_number
	}
	var reestr_key_elements = db.findbyparams("reestr_key_elements", reestr_key_elements_requestdata);
	var engaged_positions = []
	if(isNotEmptyOrNullArray(reestr_key_elements)){
		for(var i = 0; i < reestr_key_elements.length; i++){
			engaged_positions.push(reestr_key_elements[i].position_on_vagon);
		}
	}
	//Получение позиций по типу СЧ
	var positions_on_vagon_requestdata = null;
	//Если нет позиции в узле, строим запрос без позиции в узле
	if(isEmptyString(key_element.position_on_node)){
		positions_on_vagon_requestdata = {
			// "position_on_node": key_element.position_on_node,
			"key_element_code": key_element.key_element_code
		}
		if(vehicle_record.model_axes_calculated == 4){
			positions_on_vagon_requestdata.for_four_axes_vagon = true;
		}else if(vehicle_record.model_axes_calculated == 6){
			positions_on_vagon_requestdata.for_six_axes_vagon = true;
		}
	}else{	
		positions_on_vagon_requestdata = {
			"position_on_node": key_element.position_on_node,
			"key_element_code": key_element.key_element_code
		}
		if(vehicle_record.model_axes_calculated == 4){
			positions_on_vagon_requestdata.for_four_axes_vagon = true;
		}else if(vehicle_record.model_axes_calculated == 6){
			positions_on_vagon_requestdata.for_six_axes_vagon = true;
		}
	}
	
	var positions_on_vagon = db.findbyparams("dictionary_positions_on_vagon", positions_on_vagon_requestdata);
	if(isEmptyOrNullArray(positions_on_vagon)){
		return successResp("Для данного СЧ нет допустимых позиций на вагоне")
	}

	var available_positions = [];
	var positions_ids = [];
	//Получение основных позиций
	for(var i = 0; i < positions_on_vagon.length; i++){
		if(engaged_positions.indexOf(positions_on_vagon[i].recid) < 0){
			if(positions_ids.indexOf(positions_on_vagon[i].recid) < 0){
				available_positions.push({
					"position_id": positions_on_vagon[i].recid,
					"position_name": positions_on_vagon[i].recname,
					"ke_code": positions_on_vagon[i].key_element_code,
					"position_node_on_vagon": positions_on_vagon[i].position_node_on_vagon,
					"position_node_on_vagon_name": positions_on_vagon[i].position_node_on_vagon___value,
					"position_on_node": positions_on_vagon[i].position_on_node,
					"position_on_node_name": positions_on_vagon[i].position_on_node___value
				});
				positions_ids.push(positions_on_vagon[i].recid);
			}
		}
		//Получение альтернативной позиции
		var get_alt_pos_params = {
			"recname": positions_on_vagon[i].alternative_position,
			"key_element_code": positions_on_vagon[i].key_element_code,
			"alternative_position": positions_on_vagon[i].recname
		}
		if(vehicle_record.model_axes_calculated == 4){
			get_alt_pos_params.for_four_axes_vagon = true;
		}else if(vehicle_record.model_axes_calculated == 6){
			get_alt_pos_params.for_six_axes_vagon = true;
		}
		var get_alt_pos_result = db.findbyparams("dictionary_positions_on_vagon", get_alt_pos_params);
		
		if(isNotEmptyOrNullArray(get_alt_pos_result)){
			if(positions_ids.indexOf(get_alt_pos_result[0].recid) < 0 && engaged_positions.indexOf(get_alt_pos_result[0].recid) < 0){
				available_positions.push({
					"position_id": get_alt_pos_result[0].recid,
					"position_name": get_alt_pos_result[0].recname,
					"ke_code": get_alt_pos_result[0].key_element_code,
					"position_node_on_vagon": get_alt_pos_result[0].position_node_on_vagon,
					"position_node_on_vagon_name": get_alt_pos_result[0].position_node_on_vagon___value,
					"position_on_node": get_alt_pos_result[0].position_on_node,
					"position_on_node_name": get_alt_pos_result[0].position_on_node___value
				});
				positions_ids.push(get_alt_pos_result[0].recid);
			}
		}
	}
	
	if(available_positions.length == 0){
		return successResp("Для данного СЧ нет допустимых позиций на вагоне");
	}

	var return_value = {
		"axis_on_vagon": vehicle_record.model_axes_calculated,
		"available_positions": available_positions
	}
	return successResp(return_value);
}

// Получение всех возможных позиций для узла/СЕ на вагоне
// "fields": {
// 	// Номер узла/СЕ
// 	"assemblyElementNumber": "string",
// 	// Номер вагона
// 	"vagonNumber": "string"
// }
// Актуально на 26.03.20
function api_get_assembly_element_positions_on_vagon(params) {
	if (isEmptyString(params.assemblyElementNumber)) {
		return badResp("Номер узла/СЕ (assemblyElementNumber) не может быть пустым.");
	}

	if (isEmptyString(params.vagonNumber)) {
		return badResp("Номер вагона (vagonNumber) не может быть пустым.");
	}

	// Получаем узел/СЕ
	var assemblyElementsParams = {
		"unique_number": params.assemblyElementNumber
	};
	var assemblyElements = db.findbyparams("reestr_ke_nodes", assemblyElementsParams);
	if (isEmptyOrNullArray(assemblyElements)) {
		return badResp("Сборочный элемент с УИН " + params.assemblyElementNumber + " не найден в системе.");
	}

	var assemblyElement = assemblyElements[0];

	// Получаем тип просканированного сборочного элемента из справочника "Типы узлов/сборочных единиц"
	var assemblyElementType = db.findbyrecid("dictionary_ke_node_types", assemblyElement.ke_node_type);
	if (isNullObject(assemblyElementType)) {
		return badResp("Тип сборочного элемента с УИН " + params.assemblyElementNumber + " не найден в системе.");
	}

	// Если просканирован узел/СЕ, который можно разворачивать при установке, то возвращаем ошибку
	if (assemblyElementType.is_variable)
		return badResp("Для установки данного сборочного элемента необходимо использовать СЧ.");

	// Проверяем что узел/СЕ не установлен на вагон
	if(isNotEmptyString(assemblyElement.vehicle) || isNotEmptyString(assemblyElement.vehicle_manufacturer_number) ){
		return(badResp("Узел/СЕ уже установлен на вагон."));
	}

	if (assemblyElement.status != "823cc6e9-465b-416e-beda-8a642149c235") {
		return badResp("Нельзя установить узел/СЕ " + assemblyElement.unique_number + " в текущем статусе."); 
	}

	// Проверка состава вагона (можно ли включить указанный СЕ на вагон)
	var checkVagonCompositionRes = checkVagonCompositionByAssemblyElement(assemblyElement);
	if (!checkVagonCompositionRes.success) {
		return badResp(checkVagonCompositionRes.message);
	}

	//Запрос записи о вагоне
	var vehiclesParams = {
		"manufacturer_number": params.vagonNumber
	};
	var vehicles = db.findbyparams("reestr_vehicles", vehiclesParams);

	if(isEmptyOrNullArray(vehicles)){
		return badResp("Вагон не найден в системе");
	}
	var vehicle = vehicles[0];

	// Получаем все возможные позиции узла/СЕ на вагоне
	var allPositions = getAllPositionsOnVagonByAssemblyElement(vehicle.model_axes_calculated, assemblyElement);

	if (isEmptyOrNullArray(allPositions)) {
		return badResp("Нет доступных позиций для установки.");
	}

	var result = [];

	for (var i = 0; i < allPositions.length; i++) {
		result.push({
			"position_id": allPositions[i].recid,
			"position_name": allPositions[i].recname
		});
	}

	return result;
}

// Получение доступных позиций для узла/СЕ на вагоне
// "fields": {
// 	// Номер узла/СЕ
// 	"assemblyElementNumber": "string",
// 	// Номер вагона
// 	"vagonNumber": "string"
// }
// Актуально на 26.03.20
function api_get_assembly_element_available_positions_on_vagon(params) {
	if (isEmptyString(params.assemblyElementNumber)) {
		return badResp("Номер узла/СЕ (assemblyElementNumber) не может быть пустым.");
	}

	if (isEmptyString(params.vagonNumber)) {
		return badResp("Номер вагона (vagonNumber) не может быть пустым.");
	}

	// Получаем узел/СЕ
	var assemblyElementsParams = {
		"unique_number": params.assemblyElementNumber
	};
	var assemblyElements = db.findbyparams("reestr_ke_nodes", assemblyElementsParams);
	if (isEmptyOrNullArray(assemblyElements)) {
		return badResp("Сборочный элемент с УИН " + params.assemblyElementNumber + " не найден в системе.");
	}

	var assemblyElement = assemblyElements[0];

	// Получаем тип просканированного сборочного элемента из справочника "Типы узлов/сборочных единиц"
	var assemblyElementType = db.findbyrecid("dictionary_ke_node_types", assemblyElement.ke_node_type);
	if (isNullObject(assemblyElementType)) {
		return badResp("Тип сборочного элемента с УИН " + params.assemblyElementNumber + " не найден в системе.");
	}

	// Если просканирован узел/СЕ, который можно разворачивать при установке, то возвращаем ошибку
	if (assemblyElementType.is_variable)
		return badResp("Для установки данного сборочного элемента необходимо использовать СЧ.");

	// Проверяем что узел/СЕ не установлен на вагон
	if(isNotEmptyString(assemblyElement.vehicle) || isNotEmptyString(assemblyElement.vehicle_manufacturer_number) ){
		return(badResp("Узел/СЕ уже установлен на вагон."));
	}

	if (assemblyElement.status != "823cc6e9-465b-416e-beda-8a642149c235") {
		return badResp("Нельзя установить узел/СЕ " + assemblyElement.unique_number + " в текущем статусе."); 
	}

	// Проверка состава вагона (можно ли включить указанный СЕ на вагон)
	var checkVagonCompositionRes = checkVagonCompositionByAssemblyElement(assemblyElement);
	if (!checkVagonCompositionRes.success) {
		return badResp(checkVagonCompositionRes.message);
	}

	//Запрос записи о вагоне
	var vehiclesParams = {
		"manufacturer_number": params.vagonNumber
	};
	var vehicles = db.findbyparams("reestr_vehicles", vehiclesParams);

	if(isEmptyOrNullArray(vehicles)){
		return badResp("Вагон не найден в системе");
	}
	var vehicle = vehicles[0];

	// Получаем все возможные позиции узла/СЕ на вагоне
	var allPositions = getAllPositionsOnVagonByAssemblyElement(vehicle.model_axes_calculated, assemblyElement);

	if (isEmptyOrNullArray(allPositions)) {
		return badResp("Нет доступных позиций для установки.");
	}

	var freePositions = getFreePositionsOnVagonByAssemblyUnit(vehicle.recid, assemblyElement, allPositions);

	if (isEmptyOrNullArray(freePositions)) {
		return badResp("Нет доступных позиций для установки.");
	}

	var result = [];

	for (var i = 0; i < freePositions.length; i++) {
		result.push({
			"position_id": freePositions[i].recid,
			"position_name": freePositions[i].recname
		});
	}

	return result;
}

// Получение инфы о вагонах из реестра ТС
// Актуально на 13.03.20
function api_get_reestr_vagons(params){
	var all_vagons_records = db.find("reestr_vehicles");
	
	if(isEmptyOrNullArray(all_vagons_records)){
		return badResp("Информация о вагонах не найдена в Реестре ТС");
	}

	var vagons = [];
	for(var i = 0; i < all_vagons_records.length; i++){
		vagons.push({
			"vagonid": all_vagons_records[i].recid,
			"manufacturer_number": all_vagons_records[i].manufacturer_number,
			"model_axes_calculated": all_vagons_records[i].model_axes_calculated
		});
	}

	var return_value = {
		"count": all_vagons_records.length,
		"vagons": vagons
	}

	return successResp(return_value);
}

// Установка СЧ на вагон
// "fields": {
// 	"vagonnumber": "string",
// 	"setdate": "string"
// 	"kenumbers": [
// 		{
// 			"number": "string",
// 			"position": "string"
// 		}
// 	]
// }
// Актуально на 20.03.20
function api_set_ke_on_vagon(params){
	var allow_groups_names = ["TSControllers"];
	var check_authorization_res = checkauthorization(allow_groups_names);
	if (!check_authorization_res.success) return check_authorization_res;

	if(isEmptyString(params.vagonnumber)){
		return badResp("Номер вагона (vagonnumber) не может быть пустым");
	}
	//Проверка что вагон существует
	var reestr_vehicles_requestdata = {
		"manufacturer_number": params.vagonnumber
	}
	var reestr_vehicles = db.findbyparams("reestr_vehicles", reestr_vehicles_requestdata);
	if(isEmptyOrNullArray(reestr_vehicles)){
		return badResp("Номер вагона не найден в системе");
	}
	var vehicle_record = reestr_vehicles[0];

	if(isEmptyString(params.setdate)){
		return badResp("Дата установки на вагон (setdate) не может быть пустой");
	}
	var set_on_vagon_date = new Date(params.setdate);
	if(isEmptyString(set_on_vagon_date)){
		return badResp("Дата установки на вагон (setdate) имеет неверный формат");
	}

	//Проверка массива с номерами для установки
	if(isEmptyOrNullArray(params.kenumbers)){
		return("Номера устанавливаемых СЧ (kenumbers) не могут быть пустыми");
	}

	var positions_and_ke = [];
	for(var i = 0; i < params.kenumbers.length; i++){
		var kenumber = params.kenumbers[i];
		if(isEmptyString(kenumber.number)){
			return badResp("Номер СЧ (number) не может быть пустым, позиция kenumber[" + i.toString() + "]");
		}

		//Проверка что СЧ существует в системе
		var reestr_key_elements_requestdata = {
			"numberke": kenumber.number
		}
		var reestr_key_elements = db.findbyparams("reestr_key_elements", reestr_key_elements_requestdata);
		if(isEmptyOrNullArray(reestr_key_elements)){
			return badResp("Номер СЧ не найден в системе, позиция kenumber[" + i.toString() + "]");
		}
		var key_element = reestr_key_elements[0];
		//Если СЧ имеет позицию впринципе
		var position_record = null;
		if(key_element.key_element_code != keyElementCodes.removable_railway_carcass_id){
			if(isEmptyString(kenumber.position)){
				return badResp("Позиция (position) не может быть пустым, позиция kenumber[" + i.toString() + "]");
			}
			//Проверка что позиция существует в системе
			position_record = db.findbyrecid("dictionary_positions_on_vagon", kenumber.position.toString());
			if(isNullObject(position_record)){
				return badResp("Позиция не найдена в системе, позиция kenumber[" + i.toString() + "]");
			}

			//Получение доступных позиций для вагона, если их нет, ошибка
			var available_positions = api_get_key_element_available_positions_on_vagon({
				"kenumber":kenumber.number,
				"vagonnumber": params.vagonnumber
			});
			if(isNullObject(available_positions.message)){
				return badResp("Не найдено доступных позиций на вагоне " + params.vagonnumber + " для СЧ " + kenumber.number);
			}

			available_positions = available_positions.message.available_positions;

			//Сравнение доступных позиций и полученной позиции
			var finded_positions = [];
			for(var posid = 0; posid < available_positions.length; posid++){
				if(available_positions[posid].position_id == position_record.recid){
					finded_positions.push(available_positions[posid]);
				}
			}
			
			if(isEmptyOrNullArray(finded_positions)){
				return badResp("Позиция " + position_record.recid + " не подходит для вагона " + params.vagonnumber + " и СЧ " + kenumber.number);
			}
		}
		// Если Балка надрессорная, Рама боковая, то проверяем наличие параметра "Год окончания гамма-процентного ресурса детали"
		if(key_element.key_element_code == keyElementCodes.pressure_beam_id ||
			key_element.key_element_code == keyElementCodes.side_frame_id){
				if(isEmptyString(kenumber.gamma_percent_resource_end)){
					return badResp("Необходимо указать поле Год окончания гамма-процентного ресурса детали, позиция kenumber[" + i.toString() + "]");
				}

				//Проверка что СЧ находится в узле, если находится, обновляем все СЧ в узле
				var update_kes = []
				if(isNotEmptyString(key_element.ke_node)){
					var select_ke_by_nodeid_params = {
						"ke_node": key_element.ke_node
					}
					//Выборка СЧ с таким же узлом
					var reestr_key_elements_by_nodeid = db.findbyparams("reestr_key_elements", select_ke_by_nodeid_params);
					if(isEmptyOrNullArray(reestr_key_elements_by_nodeid)){
						return badResp("Не найдено СЧ с узлом как у заданного СЧ в позиции kenumber[" + i.toString() + "]");
					}
					else{
						for(var keid = 0; keid < reestr_key_elements_by_nodeid.length; keid++){
							//Если Балка надрессорная, Рама боковая, то добавляем в массив СЧ для проверки
							if(reestr_key_elements_by_nodeid[keid].key_element_code == keyElementCodes.pressure_beam_id ||
								reestr_key_elements_by_nodeid[keid].key_element_code == keyElementCodes.side_frame_id ){
									if(reestr_key_elements_by_nodeid[keid].gamma_percent_resource_end_date != kenumber.gamma_percent_resource_end){
										reestr_key_elements_by_nodeid[keid].gamma_percent_resource_end_date = kenumber.gamma_percent_resource_end;
										update_kes.push(reestr_key_elements_by_nodeid[keid]);
									}
									
								}
						}
					}
				}else{
					if(key_element.gamma_percent_resource_end_date != kenumber.gamma_percent_resource_end){
						key_element.gamma_percent_resource_end_date = kenumber.gamma_percent_resource_end;
						update_kes.push(key_element);
					}
				}
				//Если массив для обновления не пустой, то обновляем год окончания гамма-процентного ресурса детали и запрашиваем СЧ снова
				if(isNotEmptyOrNullArray(update_kes)){
					for(var upd_id = 0; upd_id < update_kes.length; upd_id++){
						var r = db.update("reestr_key_elements", update_kes[upd_id]);
					}
					var reestr_key_elements_requestdata = {
						"numberke": kenumber.number
					}
					var reestr_key_elements = db.findbyparams("reestr_key_elements", reestr_key_elements_requestdata);
					if(isEmptyOrNullArray(reestr_key_elements)){
						return badResp("Номер СЧ не найден в системе, позиция kenumber[" + i.toString() + "]");
					}
					key_element = reestr_key_elements[0];
				}
			}

		
		if(isNullObject(position_record)){
			positions_and_ke.push({
				"number": key_element.recid
			});
		}else{
			positions_and_ke.push({
				"number": key_element.recid,
				"position": position_record.recid
			});
		}
		
	}

	if(isEmptyOrNullArray(positions_and_ke)){
		return badResp("Не найдено ниодной подходящей позиции")
	}
	var setup_on_vagon_request = {
		"ke_numbers": JSON.stringify(positions_and_ke),
		"operationdate": set_on_vagon_date,
		"recid": vehicle_record.recid
	}

	return setupkeonvagon(setup_on_vagon_request);
}

/**
 * Обновление сущности
 * @param {*} params 
 */
function update_entity_static(params){
	//Проверка что название таблицы заполнено
	if(isEmptyString(params.table)){
		return badResp("Параметр 'table' не может быть пустым");
	}
	//Проверка что объект сущности был передан
	if(isNullObject(params.entity)){
		return badResp("Параметр 'entity' не может быть пустым")
	}
	
	try{
		var upd_res = db.update(params.table, params.entity);
		if(!upd_res){
			return badResp("Не удалось обновить запись '" + JSON.stringify(params.entity) + "' в таблице '" + params.table + "'");
		}
		return upd_res;
	}catch(e){
		return badResp(e.message);
	}
}

/**
 * Добавление записей	 
 * @param {*} params 
 */
function insert_entity_static(params){
	//Проверка что название таблицы заполнено
	if(isEmptyString(params.table)){
		return badResp("Параметр 'table' не может быть пустым");
	}

	//Проверка что объект сущности был передан
	if(isNullObject(params.entity)){
		return badResp("Параметр 'entity' не может быть пустым")
	}

	try{
		var ins_res = db.insert(params.table, params.entity);
		if(isNullObject(ins_res)){
			return badResp(String().concat("Не удалось создать запись в таблице", params.table));
		}else{
			return ins_res;
		}
	}catch(e){
		return badResp(e.message);
	}
}

/**
 * Удаление записей	 
 * @param {*} params 
 */
function delete_entity_static(params){
	//Проверка что название таблицы заполнено
	if(isEmptyString(params.table)){
		return badResp("Параметр 'table' не может быть пустым");
	}

	//Проверка что объект сущности был передан
	if(isNullObject(params.recid)){
		return badResp("Параметр 'recid' не может быть пустым")
	}

	try{
		var ins_res = db.delete(params.table, params.recid);
		if(isNullObject(ins_res)){
			return badResp(String().concat("Не удалось удалить запись в таблице ", params.table));
		}else{
			return ins_res;
		}
	}catch(e){
		return badResp(e.message);
	}
}

/**
 * Создать заявления на выпуск пула УИН
 * @param {*} params 
 */
function api_create_pool_application(params){
	var allow_groups_names = ["NumberGenerators1" /*, "NumberGenerators2", "NumberGenerators3"*/];
	var check_authorization_res = checkauthorization(allow_groups_names);
	if (!check_authorization_res.success) return check_authorization_res;

	//Количество УИН
	if(isEmptyString(params.uins_count)){
		return badResp("Параметр \"Количество УИН\" не может быть пустым, проверьте параметр \"uins_count\"");
	}

	//Номер исходящего
	if(isEmptyString(params.output_number)){
		return badResp("Параметр \"Номер исходящего\" не может быть пустым, проверьте параметр \"output_number\"");
	}

	//Дата исходящего заявления
	if(isEmptyString(params.output_date)){
		return badResp("Параметр \"Дата исходящего заявления\" не может быть пустым, проверьте параметр \"output_date\"");
	}


	//Создание пустого заявления
	var insert_res = db.insert("rfid_request", {});
	if(isNullObject(insert_res)){
        return badResp("Не удалось создать заявление на регистрацию пула УИН");
    }

	var generatenumbersapplicationparams = {
		recid: insert_res.recid,
		count: params.uins_count,
		output_application_number: params.output_number,
		output_application_date: params.output_date
	}

	var generatenumbersapplicationresp = generatenumbersapplication(generatenumbersapplicationparams);
	return generatenumbersapplicationresp;
}

/**
 * Учесть СЧ
 * @param {*} params 
 */
function api_allow_key_element(params){
	var allow_groups_names = ["Pasportgenerators"];
	var check_authorization_res = checkauthorization(allow_groups_names);
	if (!check_authorization_res.success) return check_authorization_res;

	//Валидация входящих параметров
	//Номер исходящего заявления
	if(isEmptyString(params.output_number)){
		return badResp("Номер исходящего заявления не может быть пустым, проверьте параметр \"output_number\"");
	}

	//Дата исходящего заявления
	if(isEmptyString(params.output_date)){
		return badResp("Дата исходящего заявления не может быть пустым, проверьте параметр \"output_date\"");
	}

	//УИН СЧ
	if(isEmptyOrNullArray(params.uin) || !Array.isArray(params.uin)){
		return badResp("Не указан массив УИН учитываемых СЧ, проверьте параметр \"uin\"");
	}
	//выбираем уникальные УИН, на случай, если будут дублированные
	params.uin = params.uin.filter(onlyUnique);

	var key_elements_out = [];
	for(var i = 0; i<params.uin.length; i++){
		//Получение номера СЧ
		var ke_numbers = db.findbyparams("ke_numbers", {
			recname: params.uin[i]
		});
		if(isEmptyOrNullArray(ke_numbers)){
			return badResp(String().concat("УИН ", params.uin[i], " не найден в системе"));
		}

		var ke_number = ke_numbers[0];

		//Получение записи СЧ
		var key_elements = db.findbyparams("reestr_key_elements", {
			ke_number: ke_number.recid
		});
		if(isEmptyOrNullArray(key_elements)){
			return badResp(String().concat("СЧ с УИН ", params.uin[i], " не найден в системе"));
		}

		//Проверка статуса СЧ
		if(isEmptyString(key_elements[0].statuske)){
			return badResp(String().concat("У СЧ с УИН ", params.uin[i], " не указан статус, проверьте паспорт СЧ"));
		}

		if(key_elements[0].statuske != 'c82c2eb8-0cf9-4693-8a2b-c6bf605c97ab'){
			return badResp(String().concat("Заявление на учет не создано, так как СЧ ", params.uin[i], " находится не в статусе \"Выпущен в обращение\""));
		}

		//Проверка был ли элемент уже учтен 
		if(key_elements[0].is_allow_key_element == true){
			return badResp(String().concat("Для СЧ ", params.uin[i], " ранее уже было создано заявление на учет"));
		}

		key_elements_out.push(key_elements[0]);
	}

	var allow_key_element_params = {
		key_elements: key_elements_out,
		output_application_number: params.output_number,
		output_application_date: params.output_date
	}

	var allow_key_element_res = allow_key_element_array(allow_key_element_params);
	return allow_key_element_res;
}

//Функция фильтрации массивов по уникальности
function onlyUnique(value, index, self) {
	return self.indexOf(value) === index;
}

/**
 * Учесть узел/СЕ
 * @param {*} params 
 */
function api_allow_node(params){
	var allow_groups_names = ["Pasportgenerators"];
	var check_authorization_res = checkauthorization(allow_groups_names);
	if (!check_authorization_res.success) return check_authorization_res;

	//Валидация входящих параметров
	//Номер исходящего заявления
	if(isEmptyString(params.output_number)){
		return badResp("Номер исходящего заявления не может быть пустым, проверьте параметр \"output_number\"");
	}

	//Дата исходящего заявления
	if(isEmptyString(params.output_date)){
		return badResp("Дата исходящего заявления не может быть пустым, проверьте параметр \"output_date\"");
	}

	//УИН узла
	if(isEmptyOrNullArray(params.uin) || !Array.isArray(params.uin)){
		return badResp("Не указан массив УИН учитываемых узлов, проверьте параметр \"uin\"");
	}

	//выбираем уникальные УИН, на случай, если будут дублированные
	params.uin = params.uin.filter(onlyUnique);

	var nodes_out = [];
	for(var i = 0; i<params.uin.length; i++){

		//Получение номера узла
		var ke_numbers = db.findbyparams("ke_numbers", {
			recname: params.uin[i]
		});
		if(isEmptyOrNullArray(ke_numbers)){
			return badResp(String().concat("УИН ", params.uin[i], " не найден в системе"));
		}

		var ke_number = ke_numbers[0];

		//Получение записи узла
		var nodes = db.findbyparams("reestr_ke_nodes", {
			unique_number_relation: ke_number.recid
		});
		if(isEmptyOrNullArray(nodes)){
			return badResp(String().concat("СЕ ", params.uin[i], " не найден в системе"));
		}

		if(isEmptyString(nodes[0].status)){
			return badResp(String().concat("СЕ ", params.uin[i], " не указан статус, проверьте паспорт узла"));
		}
		//Проверка статуса узла
		if(nodes[0].status != '823cc6e9-465b-416e-beda-8a642149c235'){
			return badResp(String().concat("Заявление на учет не создано, так как СЕ ", params.uin[i], " находится не в статусе \"Выпущен в обращение\""));
		}

		//Проверка был ли СЕ уже учтен 
		if(nodes[0].is_allow_ce_element == true){
			return badResp(String().concat("Для СЕ ", params.uin[i], " ранее уже было создано заявление на учет"));
		}

		nodes_out.push(nodes[0]);
	}

	var allow_node_params = {
		nodes: nodes_out,
		output_application_number: params.output_number,
		output_application_date: params.output_date
	}

	var allow_ce_element_res = allow_ce_element_array(allow_node_params);
	return allow_ce_element_res;
}

/**
 * Учесть ТС
 * @param {*} params 
 */
function api_allow_vehicle(params){
	var allow_groups_names = ["Pasportgenerators"];
	var check_authorization_res = checkauthorization(allow_groups_names);
	if (!check_authorization_res.success) return check_authorization_res;

	//Валидация входящих параметров
	//Номер исходящего заявления
	if(isEmptyString(params.output_number)){
		return badResp("Номер исходящего заявления не может быть пустым, проверьте параметр \"output_number\"");
	}

	//Дата исходящего заявления
	if(isEmptyString(params.output_date)){
		return badResp("Дата исходящего заявления не может быть пустым, проверьте параметр \"output_date\"");
	}

	//Заводской номер вагона
	if(isEmptyString(params.manufacturer_number)){
		return badResp("Не указан заводской номер вагона, проверьте параметр \"manufacturer_number\"");
	}

	//Получение записи ТС
	var vehicles = db.findbyparams("reestr_vehicles", {
		manufacturer_number: params.manufacturer_number
	})
	if(isEmptyOrNullArray(vehicles)){
		return badResp(String().concat("ТС с заводским номером ", params.manufacturer_number, " не найден в системе"));
	}
	var vehicle = vehicles[0];

	var allow_vehicle_params = {
		recid: vehicle.recid,
		output_application_number: params.output_number,
		output_application_date: params.output_date
	}

	var allow_vagon_complectation_res = allow_vagon_complectation(allow_vehicle_params);
	return allow_vagon_complectation_res;
}

/**
 * Метод для простановки уникальных идентификаторов участника
 * @param {*} params 
 */
function api_set_unique_member_identifier(params){
	var allow_groups_names = ["Administrators"];
	var check_authorization_res = checkauthorization(allow_groups_names);
	if (!check_authorization_res.success) return check_authorization_res;

	var members = db.findbyparams("reestr_members", {recstate: 1});
	if(isEmptyOrNullArray(members)){
		return successResp("Не найдено участников для обработки")
	}else{
		var processed_records_count = 0;
		for(var i = 0; i < members.length; i++){
			var member = members[i];
			if(isEmptyString(member.unique_member_identifier)){
				//Получение уникального идентификатора участника
				var getMemberUniqueIdentifierRes = getMemberUniqueIdentifier();
				if(!getMemberUniqueIdentifierRes.success){
					return getMemberUniqueIdentifierRes;
				}
				member.unique_member_identifier = getMemberUniqueIdentifierRes.identifier;
				db.update("reestr_members", member);
				processed_records_count++;
			}
		}
		return successResp(String().concat("Обработано ", processed_records_count.toString(), " записей"));
	}
}

function remote_executejs(params){
	var rzd_url = get_rzd_urls_portal_settings();
	if(!rzd_url.success){
		return badResp("Не удалось получить адрес АРМ Росжелдора");
	}
	var headers = {
        "Content-Type": "application/json"
    }
	var url = String().concat(rzd_url.rzd_name_url, "/api/anonym");

	var request_params = {
		method: params.name_method,
		fields: {
			table: params.name_table,
			filter_parameters: params.options
		}
	}
	var sendrequestresult = sendRequest("POST", headers, url, JSON.stringify(request_params));
	return sendrequestresult;
}

/**
 * Получение сущности
 * @param {*} params 
 */
function get_entity_static(params){
	//Проверка что название таблицы заполнено
	if(isEmptyString(params.table)){
		return badResp("Параметр 'table' не может быть пустым");
	}
	//Проверка что объект сущности был передан
	if(isNullObject(params.filter_parameters)){
		return badResp("Параметр 'filter_parameters' не может быть пустым")
	}

	try{
		var get_res = db.findbyparams(params.table, params.filter_parameters);
		if (isEmptyOrNullArray(get_res)) {
			return badResp("Записи не найдены.", get_res);
		}
		return successResp("Записи получены успешно", get_res);
	}catch(e){
		return badResp(e.message);
	}
}