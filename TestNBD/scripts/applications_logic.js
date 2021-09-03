//Файл с логикой для заявлений

var nomenclature_items = {
	pressure_beam: "Балка надрессорная",
	side_frame: "Рама боковая",
	coupler: "Корпус автосцепки",
	friction_wedge: "Клин фрикционный",
	slider_body: "Корпус скользуна",
	slider_cap: "Колпак скользуна",
	friction_strip: "Планка фрикционная",
	brace: "Скоба",
	wheel: "Колесо",
	lockitem: "Замок",
	elevator_roll: "Валик подъемника",
	bearing_adapter: "Адаптер подшипника",
	removable_railway_carcass: "Сменный железнодорожный кузов",
	clear_axis: "Ось чистовая",
	wedge_pockets: "Пластины в клиновых карманах",
	saddle_ring: "Кольцо в подпятник",
	wedge_pockets_inserts: "Вставки в клиновые карманы",
	saddle_bearing: "Вкладыш подпятника",
	front_rear_detents: "Упоры передний и задний объединенные",
	gondola_hatch: "Крышка люка полувагона",
	vagon_tank_body: "Котел вагона-цистерны",
	spring_otside_after: "Пружина рессорного подвешивания наружная",
	spring_inside_after: "Пружина рессорного подвешивания внутренняя",
	spring_slider_inside: "Пружина скользуна наружная",
	spring_slider_outside: "Пружина скользуна внутренняя",
	bearing_node: "Подшипник буксового узла",
	triangel: "Триангель",
	wheel_pair_without_bearings: "Колесная пара без буксовых узлов",
	autocoupler: "Автосцепка СА-3",
	pressure_beam_node: "Балка надрессорная(Узел)",
	side_frame_node: "Рама боковая(Узел)",
	cart: "Тележка",
	wheelpair: "Колесная пара",
	slider: "Скользун",
	rough_axis: "Ось черновая",
	air_distributor_assembled: "Воздухораспределитель в сборе",
};

/**
 * Подготовка данных для динамической формы
 * @param {*} params 
 */
function prepare_nomenclature_dynamic_form(params){
	var returnmessage = {
		success: true,
		message: "",
		closeForm: false,
		showMessage: false
	};

	var application_record = db.findbyrecid("reestr_applications_for_participation", params.recid);

	var hide_branded_elements = false;
	if(isEmptyString(application_record.branding_code)){
		hide_branded_elements = true;
	}else{
		hide_branded_elements = false;
	}
	if(isEmptyString(application_record.dynamic_form_stringify_formdata)){
		returnmessage.data = {
			recid: application_record.recid,
			hide_branded_elements: hide_branded_elements
		}
		return returnmessage;
	}else{
		var formdata = JSON.parse(application_record.dynamic_form_stringify_formdata);
		formdata.recid = application_record.recid;
		formdata.hide_branded_elements = hide_branded_elements;
		returnmessage.data = formdata;
		return returnmessage;
	}
}

/**
 * Обработка данных с дин. формы простановки номенклатуры
 * @param {*} params 
 */
function process_nomenclature_dynamic_form(params){
	var application_record = db.findbyrecid("reestr_applications_for_participation", params.recid);

	var params_keys = typeof params !== "string" && Object.keys(params);

	var nomenclature_with_scheme_names = [];
	//Проход по всем ключам, пришедшим с формы
	for(var i = 0; i < params_keys.length; i++){
		var param_key = params_keys[i];
		var element = params[param_key];
		if((element === true) && param_key !== "submit" && param_key !== "formparams" && param_key !== "hide_branded_elements"){
			var nomenclature_from_form = get_data_from_nomenclature_form(params, param_key);
			if(!isNullObject(nomenclature_from_form)){
				// Проверка на уникальность значений веденных в поле "Обозначение изделия" при указании номенклатуры
				var documents_names_in_element = nomenclature_from_form.documents_names;

				for (var k = 0; k < documents_names_in_element.length - 1; k++){
					for (var j = k + 1; j < documents_names_in_element.length; j++) {
						if (documents_names_in_element[k] == documents_names_in_element[j]){
							return {
								success: false,
								message: "Номенклатура не сохранена. Найдено дублирование значений.",
								closeForm: false
							};
						}
					}
				}

				nomenclature_with_scheme_names.push(nomenclature_from_form);
				
			} else {
				return {
					success: false,
					message: "Номенклатура не сохранена. Заполнены не все поля.",
					closeForm: false
				};
			}
		}
	}
	//Сохранение данных с формы
	if(!isEmptyOrNullArray(nomenclature_with_scheme_names)){
		application_record.dynamic_form_stringify_formdata = JSON.stringify(params);
	}else{
		application_record.dynamic_form_stringify_formdata = null;
	}
	application_record.nomenclature = JSON.stringify(nomenclature_with_scheme_names)

	//Обновление записи
	db.update("reestr_applications_for_participation", application_record);
	return {
		success: true,
		message: "Номенклатура успешно сохранена",
		data: nomenclature_with_scheme_names,
		closeForm: true
	};
}

/**
 * Получить данные с формы указания номенклатуры
 * @param {*} formdata      //Данные формы
 * @param {*} item_name     //Наименование элемента, для которого произойдет получение данных с формы
 */
function get_data_from_nomenclature_form(formdata, item_name){
	var checkbox_item = formdata[item_name];
	var txt_item = formdata[String().concat(item_name, "_txt")];
	if(!isEmptyOrNullArray(txt_item) && checkbox_item){
		if(checkbox_item){
			var docs_names = [];
			if(isEmptyOrNullArray(txt_item)){
				return null;
			}
			for(var i = 0; i < txt_item.length; i++){
				var txt_item_value = txt_item[i];
				if(!isEmptyString(txt_item_value)){
					docs_names.push(txt_item_value);
				}
			}
			if(isEmptyOrNullArray(docs_names)){
				return null;
			}else{
				return {
					element_name: item_name,
					documents_names: docs_names
				}
			}
		}else{
			return null;
		}
	}else{
		return null;
	}
}

/**
 * Установка чекбоксов номенклатуры
 * @param {*} params 
 */
function setnomenclature(params){
	var application_record = db.findbyrecid("reestr_applications_for_participation", params.recid);

	//Обновление записи в соотвествии с чекбоксами
	application_record.pressure_beam = params.pressure_beam;
	application_record.side_frame = params.side_frame;
	application_record.coupler = params.coupler;
	application_record.friction_wedge = params.friction_wedge;
	application_record.slider_body = params.slider_body;
	application_record.slider_cap = params.slider_cap;
	application_record.friction_strip = params.friction_strip;
	application_record.brace = params.brace;
	application_record.wheel = params.wheel;
	application_record.lockitem = params.lockitem;
	application_record.elevator_roll = params.elevator_roll;
	application_record.bearing_adapter = params.bearing_adapter;
	application_record.removable_railway_carcass = params.removable_railway_carcass;
	application_record.clear_axis = params.clear_axis;
	application_record.wedge_pockets = params.wedge_pockets;
	application_record.saddle_ring = params.saddle_ring;
	application_record.wedge_pockets_inserts = params.wedge_pockets_inserts;
	application_record.saddle_bearing = params.saddle_bearing;
	application_record.front_rear_detents = params.front_rear_detents;
	application_record.gondola_hatch = params.gondola_hatch;
	application_record.vagon_tank_body = params.vagon_tank_body;
	application_record.triangel = params.triangel;
	application_record.wheel_pair_without_bearings = params.wheel_pair_without_bearings;
	application_record.autocoupler = params.autocoupler;
	application_record.pressure_beam_node = params.pressure_beam_node
	application_record.side_frame_node = params.side_frame_node;
	application_record.cart = params.cart;
	application_record.wheelpair = params.wheelpair;
	application_record.slider = params.slider;
	application_record.spring_otside_after = params.spring_otside_after;
	application_record.spring_inside_after = params.spring_inside_after;
	application_record.spring_slider_inside = params.spring_slider_inside;
	application_record.spring_slider_outside = params.spring_slider_outside;
	application_record.bearing_node = params.bearing_node;
	application_record.rough_axis = params.rough_axis;
	application_record.air_distributor_assembled = params.air_distributor_assembled;

	db.update("reestr_applications_for_participation", application_record);
	return successResp("Номенклатура успешно указана");
}


/**
 * Регистрация заявления на участие в паспортизации
 * @param {*} params 
 */
function accept_application(params){
  
	var date = new Date().toISOString();
	var user = getcurrentuser();
	//Получение заявления
	var application_record = db.findbyrecid("reestr_applications_for_participation", params.recid);
	if(isNullObject(application_record)){
		return badResp("Запись заявления не найдена в системе");
	}

	//Проверка переданных параметров на заполнение 
	var fillingValidateErrors = [];
	//Номер УИП
	if(isEmptyString(application_record.uip_number)){
		fillingValidateErrors.push("\"Номер УИП\"");
	}
	application_record.uip_number = String().concat("УИП/2/", application_record.uip_number);

	//Тип заявителя
	if(application_record.type == null){
		fillingValidateErrors.push("\"Тип заявителя\"");
	}
	
	//Полное наименование
	if(isEmptyString(application_record.fullname)){
		fillingValidateErrors.push("\"Полное наименование\"");
	}
	
	//Сокращенное наименование
	if(isEmptyString(application_record.branding_code_short)){
		fillingValidateErrors.push("\"Сокращенное наименование\"");
	}
	//Фио Заявителя
	if(isEmptyString(application_record.applicant_fio)){
		fillingValidateErrors.push("\"ФИО заявителя\"");
	}
	//ФИО заявителя в дательном падеже
	if(isEmptyString(application_record.applicant_fio_in_dative)){
		fillingValidateErrors.push("\"ФИО заявителя в дательном падеже\"");
	}
	//Юр. адреc
	if(isEmptyString(application_record.legaladress)){
		fillingValidateErrors.push("\"Юр. адреc\"");
	}
	//Местонахождение
	if(isEmptyString(application_record.actualadress)){
		fillingValidateErrors.push("\"Местонахождение\"");
	}
	//Электронная почта
	if(isEmptyString(application_record.email)){
		fillingValidateErrors.push("\"Электронная почта\"");
	}

	 //ОГРН
	if(isEmptyString(application_record.ogrn)){
		fillingValidateErrors.push("\"ОГРН\"");
	} 

	//ИНН
	if(isEmptyString(application_record.inn)){
		fillingValidateErrors.push("\"ИНН\"");
	}
	
	if(isNotEmptyOrNullArray(fillingValidateErrors)){
		return badResp(fillingValidateErrors.length > 1 ? 
			String().concat("Поля ", fillingValidateErrors.join(", "), " не могут быть пустыми") : 
			String().concat("Поле ", fillingValidateErrors.join(", "), " не может быть пустым"));
	}
	
	//Валидация уникальности
	var uniqueValidateErrors = [];
	// Проверка, что в таблице reestr_members 
	// (Участники) нет записи с идентичным fullname
	var reestr_members_fields = db.findbyparams("reestr_members", {
		fullname: application_record.fullname
	});
	// Проверка если найдена запись с таким же fullname
	if (isNotEmptyOrNullArray(reestr_members_fields)){
		uniqueValidateErrors.push("полным наименованием \"" + application_record.fullname + "\"");
	}

	// Проверка, что в таблице reestr_members 
	// (Участники) нет записи с идентичным ogrn
	var reestr_members_fields = db.findbyparams("reestr_members", {
		ogrn: application_record.ogrn
	});
	// Проверка если найдена запись с таким же ogrn
	if (isNotEmptyOrNullArray(reestr_members_fields)){
		uniqueValidateErrors.push("ОГРН \"" + application_record.ogrn + "\"");
	}
	
	// Проверка, что в таблице reestr_members 
	// (Участники) нет записи с идентичным inn
	var reestr_members_fields = db.findbyparams("reestr_members", {
		inn: application_record.inn
	});
	// Проверка если найдена запись с таким же inn
	if (isNotEmptyOrNullArray(reestr_members_fields)){
		uniqueValidateErrors.push("ИНН \"" + application_record.inn + "\"");
	}

	// Код клеймения
	if (isNotEmptyString(application_record.branding_code) && application_record.branding_code != null){
		// Проверка, что в таблице reestr_members 
		// (Участники) нет записи с идентичным кодом клеймения
		var reestr_members_fields = db.findbyparams("reestr_members", {
			branding_code: application_record.branding_code
		});
		var dictionary_branding_codes_fields = db.findbyrecid("dictionary_branding_codes", application_record.branding_code);
		// Проверка если найдена запись с таким же branding_code
		if (isNotEmptyOrNullArray(reestr_members_fields)){
			uniqueValidateErrors.push("кодом клеймения \"" + dictionary_branding_codes_fields.code + ", " + dictionary_branding_codes_fields.recname + "\"");
		}
	}

	//Формирование группы пользователей
	//Формирование имени группы пользователей
	var transliterated_shortname_res = transliterateString(application_record.branding_code_short);
	if(!transliterated_shortname_res.success){
		return transliterated_shortname_res;
	}
	var transliterated_shortname = transliterated_shortname_res.data;
	//Формирование имени группы
	var first_literal = transliterated_shortname[0].toUpperCase();
	var transliterated_shortname_spliced = "";
	for(var i = 1; i < transliterated_shortname.length; i++){
		transliterated_shortname_spliced = String().concat(transliterated_shortname_spliced, transliterated_shortname[i])
	}
	var auth_group_name = String().concat(first_literal, transliterated_shortname_spliced, "Group");
	//Получение группы NBD_APP
	var nbd_app_group_record = db.findbyparams("rdev___auth_groups", {
		recname: "NBDAPP"
	});

	if(isEmptyOrNullArray(nbd_app_group_record)){
		return badResp("Не удалось получить родительскую группу");
	} 

	//Формирование записи в таблицу rdev___auth_groups
	var auth_groups_data = {
		//TODO
		recname: auth_group_name,
		recdescription: application_record.branding_code_short,
		parentgroupid: nbd_app_group_record.recid
	}
   
	//Проверка что в таблице rdev___auth_groups нет записи со схожим recname
	 var auth_groups = db.findbyparams("rdev___auth_groups", {
		recname: auth_group_name
	}) 
	
	var uniqueErrorGroup = "";
	 if(!isEmptyOrNullArray(auth_groups)){
		uniqueErrorGroup = "Группа пользователей с именем \"" + auth_group_name + "\" уже существует!";
	}

	//Если были сообщения о нарушении уникальности - выводим их
	if(isNotEmptyOrNullArray(uniqueValidateErrors)){
		return badResp(String().concat("Участник с ", uniqueValidateErrors.join(", "), " уже существует!", " ", uniqueErrorGroup));
	}

	var auth_groups_record = db.insert("rdev___auth_groups", auth_groups_data);
	 if(isNullObject(auth_groups_record)){
		return badResp("Не удалось создать новую группу");
	} 

	//Получение уникального идентификатора участника
	var getMemberUniqueIdentifierRes = getMemberUniqueIdentifier();
	if(!getMemberUniqueIdentifierRes.success){
		return getMemberUniqueIdentifierRes;
	}
   
	//Формирование записи в Участники
	var reestr_members_data = null;
	
	if(application_record.branding_code != null && !isEmptyString(application_record.branding_code_short)){

		var dictionary_branding_codes_record = db.findbyrecid("dictionary_branding_codes", application_record.branding_code);

		reestr_members_data = {
			type: application_record.type,
			fullname: application_record.fullname,
			legaladress: application_record.legaladress,
			actualadress: application_record.actualadress,
			phone: application_record.phone,
			email: application_record.email,
			ogrn: application_record.ogrn,
			inn: application_record.inn,
			branding_code: dictionary_branding_codes_record.recid,
			branding_code_number: dictionary_branding_codes_record.code,
			branding_code_recname: dictionary_branding_codes_record.recname,
			isvoluntarymarking: application_record.isvoluntarymarking,
			otheinfo: application_record.other_info,
			dateofinclusion: date,
			authgroup: auth_groups_record.recid,
			unique_member_identifier: getMemberUniqueIdentifierRes.identifier,
			application_id: application_record.recid,
			partner_assembly_vehicle: false
		}        
	}else{
		reestr_members_data = {
			type: application_record.type,
			fullname: application_record.fullname,
			legaladress: application_record.legaladress,
			actualadress: application_record.actualadress,
			phone: application_record.phone,
			email: application_record.email,
			ogrn: application_record.ogrn,
			inn: application_record.inn,
			branding_code: null,
			branding_code_number: null,
			branding_code_recname: null,
			isvoluntarymarking: application_record.isvoluntarymarking,
			otheinfo: application_record.other_info,
			dateofinclusion: date,
			authgroup: auth_groups_record.recid,
			unique_member_identifier: getMemberUniqueIdentifierRes.identifier,
			application_id: application_record.recid,
			partner_assembly_vehicle: false
		}        
	} 

	var reestr_members_record = db.insert("reestr_members", reestr_members_data)
	if(isNullObject(reestr_members_record)){
		//Удаляем созданную запись в таблице rdev___auth_groups
		db.delete("rdev___auth_groups", auth_groups_record.recid);
		return badResp("Не удалось создать запись в реестре участников")
	}
	

	//Подготовка записи в таблицу applications_with_nomenclatures
	var stringify_nomenclature = JSON.stringify(application_record.nomenclature);
	var applications_with_nomenclatures_data = {
		application: application_record.recid,
		auth_group: auth_groups_record.recid,
		jsonify_nomenclature: stringify_nomenclature
	}
	 

	var applications_with_nomenclatures_record = db.insert("applications_with_nomenclatures", applications_with_nomenclatures_data);
	if(isNullObject(applications_with_nomenclatures_record)){
		//Удаляем созданную запись в таблице rdev___auth_groups
		db.delete("rdev___auth_groups", auth_groups_record.recid);
		//Удаляем созданную запись в реестре участников
		db.delete("reestr_members", reestr_members_record.recid);
		return badResp("Не удалось привязать номенклатуру к группе пользователей");
	}
	
	application_record.application_number = String().concat(reestr_members_record.unique_member_identifier, "-", get_autoincremented_idx("application_number").toString());
	//Обновление записи заявления
	application_record.date_adding_data_to_reestr = date;
	application_record.output_notice_comment = params.output_notice_comment;
	application_record.user_group = auth_groups_record.recname;
	// application_record.output_notice_date = params.output_notice_date;
	// application_record.output_notice_name = params.output_notice_name;

	var updres = db.update("reestr_applications_for_participation", application_record);
	if(!updres){
		//Удаляем созданную запись в таблице rdev___auth_groups
		db.delete("rdev___auth_groups", auth_groups_record.recid);
		//Удаляем созданную запись в реестре участников
		db.delete("reestr_members", reestr_members_record.recid);
		//Удаляем созданную запись в таблице applications_with_nomenclatures
		db.delete("applications_with_nomenclatures", applications_with_nomenclatures_record.recid);
		return badResp("Не удалось обновить запись заявления");
	}
	
	var nomenclature_string_resp = prepare_nomenclature_string(application_record);
	if(!nomenclature_string_resp.success){
		//Удаляем созданную запись в таблице rdev___auth_groups
		db.delete("rdev___auth_groups", auth_groups_record.recid);
		//Удаляем созданную запись в реестре участников
		db.delete("reestr_members", reestr_members_record.recid);
		//Удаляем созданную запись в таблице applications_with_nomenclatures
		db.delete("applications_with_nomenclatures", applications_with_nomenclatures_record.recid);
		return nomenclature_string_resp
	}
	var nomenclature_objects = nomenclature_string_resp.nomenclature_objects;
	var report_params = {
		"application_id": application_record.recid,
		"notification_date": datetimeToReportDate(date)
	}
	
	//Формирование и прикладывание уведомления
	var add_notice_res = prepare_and_add_notice("reportacceptapplicationform", report_params, "notice_file", "reestr_applications_for_participation", application_record.recid, "Уведомление о регистрации участника");
	if(!add_notice_res.success){
		//Удаляем созданную запись в таблице rdev___auth_groups
		db.delete("rdev___auth_groups", auth_groups_record.recid);
		//Удаляем созданную запись в реестре участников
		db.delete("reestr_members", reestr_members_record.recid);
		//Удаляем созданную запись в таблице applications_with_nomenclatures
		db.delete("applications_with_nomenclatures", applications_with_nomenclatures_record.recid);
		return badResp(add_notice_res.message)
	}

	var current_date = new Date();
	var create_documentation_date = new Date(current_date.getFullYear(), current_date.getMonth(), current_date.getDate());
	
	//Формирование записей в реестр КД
	for(var i = 0; i < nomenclature_objects.length; i++){
		var nomenclature_object = nomenclature_objects[i];
		var element_name = nomenclature_object.element_name;
		
		var create_documentation_resp = null;
		var create_integration_electronic_inspector = null;

		switch (element_name) {
			//Балка надрессорная
			case "pressure_beam":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"477d0c01-84d3-441c-9bb9-15f9d609671d",
					create_documentation_date,
					true,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					"477d0c01-84d3-441c-9bb9-15f9d609671d",
					null,
					false,
					true
					)
				break;
			//Рама боковая
			case "side_frame":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					dictionary_branding_codes_record.code,
					application_record.fullname,
					"b28e1a4f-d340-4ce0-a37a-d84dcfa1b6fb",
					create_documentation_date,
					true,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					"b28e1a4f-d340-4ce0-a37a-d84dcfa1b6fb",
					null,
					false,
					true
					)
				break;
			//Корпус автосцепки
			case "coupler":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"6eab3f2a-03b7-4570-9278-55944ed353d2",
					create_documentation_date,
					true,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					"6eab3f2a-03b7-4570-9278-55944ed353d2",
					null,
					false,
					true
					)
				break;
			//Клин фрикционный
			case "friction_wedge":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"5a912378-16a5-49ed-a3cb-0b8e456a75ee",
					create_documentation_date,
					true,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					"5a912378-16a5-49ed-a3cb-0b8e456a75ee",
					null,
					false,
					true
					)
				break;
			//Корпус скользуна
			case "slider_body":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"34c12f72-eb33-4ab1-ba3e-a80166258e5d",
					create_documentation_date,
					true,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					"34c12f72-eb33-4ab1-ba3e-a80166258e5d",
					null,
					false,
					true
					)
				break;
			//Колпак скользуна
			case "slider_cap":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"ff1d8011-75dc-4d30-832f-f47c3d5ac430",
					create_documentation_date,
					true,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					"ff1d8011-75dc-4d30-832f-f47c3d5ac430",
					null,
					false,
					true
					)
				break;
			//Планка фрикционная
			case "friction_strip":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"fb64a1dc-1a7b-4bb9-9575-d3f47bdf57cf",
					create_documentation_date,
					true,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					"fb64a1dc-1a7b-4bb9-9575-d3f47bdf57cf",
					null,
					false,
					true
					)
				break;
			//Скоба
			case "brace":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"21947b0d-9610-45ec-80ac-6efe7a0f0103",
					create_documentation_date,
					true,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					"21947b0d-9610-45ec-80ac-6efe7a0f0103",
					null,
					false,
					true
					)
				break;
			//Колесо
			case "wheel":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"0813e4cb-5497-400d-9bb2-e309dda359ba",
					create_documentation_date,
					true,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					"0813e4cb-5497-400d-9bb2-e309dda359ba",
					null,
					false,
					true
					)
				break;
			//Замок
			case "lockitem":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"9c60e01e-b4b7-448a-ae1b-7709f55d43a2",
					create_documentation_date,
					true,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					"9c60e01e-b4b7-448a-ae1b-7709f55d43a2",
					null,
					false,
					true
					)
				break;
			//Валик подъемника
			case "elevator_roll":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"966f3039-1528-4af5-9e8e-2378dd738243",
					create_documentation_date,
					true,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					"966f3039-1528-4af5-9e8e-2378dd738243",
					null,
					false,
					true
					)
				break;
			//Адаптер подшипника
			case "bearing_adapter":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"245d3b99-2693-4195-b70a-ff6576b3922b",
					create_documentation_date,
					true,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					"245d3b99-2693-4195-b70a-ff6576b3922b",
					null,
					false,
					true
					)
				break;
			//Сменный железнодорожный кузов
			case "removable_railway_carcass":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"ad836d1b-6ecb-4dce-a508-8e9f42095ba3",
					create_documentation_date,
					true,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					"ad836d1b-6ecb-4dce-a508-8e9f42095ba3",
					null,
					false,
					true
					)
				break;
			//Ось чистовая
			case "clear_axis":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"e4ef0365-0365-40df-ab4e-a77104c352df",
					create_documentation_date,
					true,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					"e4ef0365-0365-40df-ab4e-a77104c352df",
					null,
					false,
					true
					)
				break;
			//Пластины в клиновых карманах
			case "wedge_pockets":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"8d6deb72-5c2e-4294-a289-01bd8a1d7f2f",
					create_documentation_date,
					true,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					"8d6deb72-5c2e-4294-a289-01bd8a1d7f2f",
					null,
					false,
					true
					)
				break;
			//Кольцо в подпятник
			case "saddle_ring":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"8cdec5a2-69ac-4dd9-8568-f53853b55f86",
					create_documentation_date,
					true,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					"8cdec5a2-69ac-4dd9-8568-f53853b55f86",
					null,
					false,
					true
					)
				break;
			//Вставки в клиновые карманы
			case "wedge_pockets_inserts":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"f8f1d758-81a5-493d-8e9d-d5b4166dd34e",
					create_documentation_date,
					true,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					"f8f1d758-81a5-493d-8e9d-d5b4166dd34e",
					null,
					false,
					true
					)
				break;
			//Вкладыш подпятника
			case "saddle_bearing":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"a70ac9bc-3212-4361-9b83-ab36282f7c97",
					create_documentation_date,
					true,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					"a70ac9bc-3212-4361-9b83-ab36282f7c97",
					null,
					false,
					true
					)
				break;
			//Упоры передний и задний объединенные
			case "front_rear_detents":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"cb0c6745-79e1-4f4c-8100-805942413ad5",
					create_documentation_date,
					true,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					"cb0c6745-79e1-4f4c-8100-805942413ad5",
					null,
					false,
					true
					)
				break;
			//Крышка люка полувагона
			case "gondola_hatch":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"12bade5a-a313-4646-8bf8-d260dd287d1c",
					create_documentation_date,
					true,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					"12bade5a-a313-4646-8bf8-d260dd287d1c",
					null,
					false,
					true
					)
				break;
			//Котел вагона-цистерны
			case "vagon_tank_body":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"79ddf686-f26f-4567-97ac-cb18eadd83e9",
					create_documentation_date,
					false,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					null,
					"79ddf686-f26f-4567-97ac-cb18eadd83e9",
					false,
					true
					);
				break;
			//Пружина рессорного подвешивания наружная
			case "spring_otside_after":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"08b8a0fd-c525-4389-9186-18f8bc4a09b4",
					create_documentation_date,
					true,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					"08b8a0fd-c525-4389-9186-18f8bc4a09b4",
					null,
					false,
					true
					)
				break;
			//Пружина рессорного подвешивания внутренняя
			case "spring_inside_after":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"a0bcf214-a48f-4a35-b762-c7b0786c4193",
					create_documentation_date,
					true,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					"a0bcf214-a48f-4a35-b762-c7b0786c4193",
					null,
					false,
					true
					)
				break;
			//Пружина скользуна наружная
			case "spring_slider_inside":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"4aed23f8-9710-4904-a2f5-b89d9bc7c75c",
					create_documentation_date,
					true,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					"4aed23f8-9710-4904-a2f5-b89d9bc7c75c",
					null,
					false,
					true
					)
				break;
			//Пружина скользуна внутренняя
			case "spring_slider_outside":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"975cd310-7675-4436-899f-4c6b84555f6a",
					create_documentation_date,
					true,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					"975cd310-7675-4436-899f-4c6b84555f6a",
					null,
					false,
					true
					)
				break;
			//Подшипник буксового узла
			case "bearing_node":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"556f259c-7a5e-49bb-b156-50f5b0517707",
					create_documentation_date,
					true,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					"556f259c-7a5e-49bb-b156-50f5b0517707",
					null,
					false,
					true
					)
				break;
			//Триангель
			case "triangel":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"c790c624-b93e-498b-97ba-0fb47f8b4b52",
					create_documentation_date,
					false,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					null,
					"c790c624-b93e-498b-97ba-0fb47f8b4b52",
					false,
					true
					);
				break;
			//Колесная пара без буксовых узлов
			case "wheel_pair_without_bearings":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"00b0b326-a67a-4ce2-95af-376fcc9d8355",
					create_documentation_date,
					false,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					null,
					"00b0b326-a67a-4ce2-95af-376fcc9d8355",
					false,
					true
					);
				break;
			//Автосцепка СА-3
			case "autocoupler":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"ae11ae44-1c69-49e0-83a1-4122bb2d80ae",
					create_documentation_date,
					false,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					null,
					"ae11ae44-1c69-49e0-83a1-4122bb2d80ae",
					false,
					true
					);
				break;
			//Тележка
			case "cart":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"cbb9d8cb-89ef-4b99-be77-a7d6e57e388e",
					create_documentation_date,
					false,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					null,
					"cbb9d8cb-89ef-4b99-be77-a7d6e57e388e",
					false,
					true
					);
				break;
			//Колесная пара
			case "wheelpair":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"a3afe986-102a-4a10-aafe-5407134f7c15",
					create_documentation_date,
					false,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					null,
					"a3afe986-102a-4a10-aafe-5407134f7c15",
					false,
					true
					);
				break;
			//Скользун
			case "slider":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"a70bf64c-215b-4d42-9c8e-f8ab4ac9f357",
					create_documentation_date,
					false,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					null,
					"a70bf64c-215b-4d42-9c8e-f8ab4ac9f357",
					false,
					true
					);
				break;
			//Ось черновая
			case "rough_axis":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"a0e6b16a-5fee-4318-a4dc-115ae65d4b09",
					create_documentation_date,
					true,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					"a0e6b16a-5fee-4318-a4dc-115ae65d4b09",
					null,
					false,
					true
					)
				break;
			//Корпус поглощающего аппарата
			case "absorbing_device_body":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"38dd229a-915f-49ef-bba8-a28f055c9962",
					create_documentation_date,
					true,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					"38dd229a-915f-49ef-bba8-a28f055c9962",
					null,
					false,
					true
					)
				break;
			//Хомут тяговый
			case "traction_clamp":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"4ba30e4b-a6e2-4cbd-bab0-ff51c79c7b87",
					create_documentation_date,
					true,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					"4ba30e4b-a6e2-4cbd-bab0-ff51c79c7b87",
					null,
					false,
					true
					)
				break;
			//Авторежим грузовой
			case "auto_mode_cargo":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"c91fe0b9-99c8-4ad4-b504-3bb3d15af749",
					create_documentation_date,
					true,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					"c91fe0b9-99c8-4ad4-b504-3bb3d15af749",
					null,
					false,
					true
					)
				break;
			//Воздухораспределитель в сборе
			case "air_distributor_assembled":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"a6180bfa-368d-4eff-97f2-c4f6c2612bc6",
					create_documentation_date,
					false,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					null,
					"a6180bfa-368d-4eff-97f2-c4f6c2612bc6",
					false,
					true
					);
				break;
			//Поглощающий аппарат
			case "absorbing_device":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"700b86ca-5b88-44d6-a5d3-c2c4e76d96f8",
					create_documentation_date,
					false,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					null,
					"700b86ca-5b88-44d6-a5d3-c2c4e76d96f8",
					false,
					true
					);
				break;
			//Балка надрессорная (сборный узел)
			case "pressure_beam_node":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"c8c2ab90-8d32-41fc-8a4d-a969d13c9f04",
					create_documentation_date,
					false,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					null,
					"c8c2ab90-8d32-41fc-8a4d-a969d13c9f04",
					false,
					true
					);
				break;
			//Рама боковая (сборный узел)
			case "side_frame_node":
				create_documentation_resp = create_documentation_records(
					nomenclature_object.documents_names,
					reestr_members_data.branding_code_number,
					application_record.fullname,
					"22ca1065-868e-4726-8f52-b6a5fdb8dfdc",
					create_documentation_date,
					false,
					reestr_members_record.recid
					);
				//Создание записей в таблице Интеграция ЭИ
				create_integration_electronic_inspector = create_integration_electronic_inspector_records(
					reestr_members_record.recid,
					null,
					"22ca1065-868e-4726-8f52-b6a5fdb8dfdc",
					false,
					true
					);
				break;
		}

		if(!isNullObject(create_documentation_resp)){
			if(!create_documentation_resp.success){
				return create_documentation_resp;
			}
		}
		if(!isNullObject(create_integration_electronic_inspector)){
			if(!create_integration_electronic_inspector.success){
				return create_integration_electronic_inspector;
			}
		}
	}

	//Переносим приложенный скан заявления в основное поле (в которое нельзя добавить/удалить файл)
	var attached_files = getattachedfiles("reestr_applications_for_participation", application_record.recid);

	if (!attached_files.success) {
		return attached_files;
	}

	var files_to_copy = [];
	attached_files = attached_files.data;

	for (var i = 0; i < attached_files.length; i++) {
		//Если есть ранее скопированные документы, удаляем
		if (attached_files[i].columnName == "application_file_unchangeble") {
			delete_files(attached_files[i].recid);
		}

		if (attached_files[i].columnName == "application_file") {
			attached_files[i].columnName = "application_file_unchangeble";

			var fileUrl = String().concat(host, "/api/files/download/", attached_files[i].recId);

			files_to_copy.push({
				entityId: application_record.recid,
				entityName: "reestr_applications_for_participation",
				columnName: attached_files[i].columnName,
				description: attached_files[i].recDescription,
				file: {
					"name": attached_files[i].recName, "url": fileUrl
				}
			});
		}
	}

	if (isNotEmptyOrNullArray(files_to_copy)) {
		let upload_res = file.upload(files_to_copy);

		if (!upload_res.success) {
			return upload_res;
		}
	}

	//Обновление со статусом
	application_record.status = "1a183a58-62cf-482f-b62d-16ef624df06d";
	//дата генерации уведомления
	application_record.notification_date = new Date();
	var updres = db.update("reestr_applications_for_participation", application_record);
	if(!updres){
		//Удаляем созданную запись в таблице rdev___auth_groups
		db.delete("rdev___auth_groups", auth_groups_record.recid);
		//Удаляем созданную запись в реестре участников
		db.delete("reestr_members", reestr_members_record.recid);
		//Удаляем созданную запись в таблице applications_with_nomenclatures
		db.delete("applications_with_nomenclatures", applications_with_nomenclatures_record.recid);
		return badResp("Не удалось обновить запись заявления");
	}

	return successResp("Заявление принято");
}

/**
 * Создание записей в Конструкторская и эксплуатационная документация
 * @param {*} documents_names           Массив номеров документов, которые будут сгенерены в реестре КД
 * @param {*} branding_code             Код клеймения
 * @param {*} manufactorer_fullname     Полное имя производителя
 * @param {*} element_type              Тип элемента
 * @param {*} creation_date             Дата создания заявления в реестр
 * @param {*} is_key_element            Флаг, определяющий, составная часть это или нет
 */
function create_documentation_records(documents_names, branding_code, manufactorer_fullname, element_type, creation_date, is_key_element, member_recid){
	if(isEmptyOrNullArray(documents_names)){
		return badResp("Массив имен документов не может быть пустым");
	}
	var created_documents = [];
	for(var i = 0; i < documents_names.length; i++){
		var document_name = documents_names[i];
		var inserted_record = null;
		if(is_key_element){
			inserted_record = db.insert("reestr_documentation", {
				recname: manufactorer_fullname,
				member_code: branding_code,
				key_element_code: element_type,
				detail: document_name,
				reestr_include_date: creation_date,
				member_identifier: member_recid
			});
			
		}else{
			inserted_record = db.insert("reestr_documentation", {
				recname: manufactorer_fullname,
				member_code: branding_code,
				ke_node_type: element_type,
				detail: document_name,
				reestr_include_date: creation_date,
				member_identifier: member_recid
			});
		}
		if(!isNullObject(inserted_record)){
			created_documents.push(inserted_record.recid);
		}
	}
	
	if(isEmptyOrNullArray(created_documents)){
		return badResp("Не удалось создать записи в реестр КД")
	}

	return {
		success: true,
		data: created_documents
	}
}



/**
 * Отказ в заявлении на участие в паспортизации
 * @param {*} params 
 */
function decline_application(params){
	//Получение заявления
	var application_record = db.findbyrecid("reestr_applications_for_participation", params.recid);
	if(isNullObject(application_record)){
		fillingValidateErrors.push("Запись заявления не найдена в системе");
	}
	//Валидация входящих параметров
	var fillingValidateErrors = [];
	if(isEmptyString(params.rejection_reason)){
		fillingValidateErrors.push("\"Причина отказа\"");
	}
	
	//Номер УИП
	if(isEmptyString(application_record.uip_number)){
		fillingValidateErrors.push("\"Номер УИП\"");
	}

	//Проверяем Сокращенное наименование, необходимое для отчета
	if(isEmptyString(application_record.branding_code_short)){
		fillingValidateErrors.push("\"Сокращенное наименование\"");
	} 
	
	//сохраняем введенную причину отказа
	application_record.rejection_reason = params.rejection_reason;

	var updres = db.update("reestr_applications_for_participation", application_record);
	if(!updres){
		return badResp("Не удалось обновить запись заявления");
	}

	if(isNotEmptyOrNullArray(fillingValidateErrors)){
		return badResp(fillingValidateErrors.length > 1 ? 
			String().concat("Поля ", fillingValidateErrors.join(", "), " не могут быть пустыми") : 
			String().concat("Поле ", fillingValidateErrors.join(", "), " не может быть пустым"));
	}

	//Получение обновленного заявления
	var application_record = db.findbyrecid("reestr_applications_for_participation", params.recid);
	if(isNullObject(application_record)){
		return badResp("Запись заявления не найдена в системе");
	}

	application_record.application_number = String().concat('A00', "-", get_autoincremented_idx("application_number").toString());
	//Обновление записи заявления
	var date = new Date().toISOString();
	application_record.date_adding_data_to_reestr = date;
	// application_record.output_notice_comment = params.output_notice_comment;
	// application_record.output_notice_date = params.output_notice_date;
	// application_record.output_notice_name = params.output_notice_name;

	var updres = db.update("reestr_applications_for_participation", application_record);
	if(!updres){
		return badResp("Не удалось обновить запись заявления");
	}

	var report_params = {
		"application_id": application_record.recid,
		"notification_date": datetimeToReportDate(date)
	}

	//Формирование и прикладывание уведомления
	var add_notice_res = prepare_and_add_notice("reportdeclineapplicationform", report_params, "notice_file", "reestr_applications_for_participation", application_record.recid, "Уведомление об отказе в регистрации участника");
	if(!add_notice_res.success){
		return badResp(add_notice_res.message)
	}

	//Переносим приложенный скан заявления в основное поле (в которое нельзя добавить/удалить файл)
	var attached_files = getattachedfiles("reestr_applications_for_participation", application_record.recid);

	if (!attached_files.success) {
		return attached_files;
	}

	var files_to_copy = [];
	attached_files = attached_files.data;

	for (var i = 0; i < attached_files.length; i++) {
		//Если есть ранее скопированные документы, удаляем
		if (attached_files[i].columnName == "application_file_unchangeble") {
			delete_files(attached_files[i].recid);
		}

		if (attached_files[i].columnName == "application_file") {
			attached_files[i].columnName = "application_file_unchangeble";

			var fileUrl = String().concat(host, "/api/files/download/", attached_files[i].recId);

			files_to_copy.push({
				entityId: application_record.recid,
				entityName: "reestr_applications_for_participation",
				columnName: attached_files[i].columnName,
				description: attached_files[i].recDescription,
				file: {
					"name": attached_files[i].recName, "url": fileUrl
				}
			});
		}
	}

	if (isNotEmptyOrNullArray(files_to_copy)) {
		let upload_res = file.upload(files_to_copy);

		if (!upload_res.success) {
			return upload_res;
		}
	}

	//Номер УИП
	application_record.uip_number = String().concat("УИП/2/", application_record.uip_number);    
	//дата генерации уведомления
	application_record.notification_date = new Date();
	//Обновление со статусом
	application_record.status = "b35d460c-89db-4119-8852-7acfe31ea16f";
	var updres = db.update("reestr_applications_for_participation", application_record);
	if(!updres){
		return badResp("Не удалось обновить запись заявления");
	}
	
	return successResp("В заявлении отказано");
}

/**
 * Формирование и прикладывание документа
 * @param {*} reportname // название отчета
 * @param {*} report_params // параметры отчета
 * @param {*} columnname  // в какую колонку запишется файл
 * @param {*} entityname // таблица куда запишется файл
 * @param {*} entityid  // recid записи в колонке entityname
 * @param {*} filename  // имя файла
 */
function prepare_and_add_notice(reportname, report_params, columnname, entityname, entityid, filename){
	var generateReportUrl = "/reports/generate/";

	var url = String().concat(host, generateReportUrl, reportname);
	var requestBody = JSON.stringify({
		"colunmname": columnname, //имя поля, к которому прикладывается документ
		"entityname": entityname, //имя таблицы, к записи которой прикладывается документ
		"entityid": entityid, //recid записи, к которой прикладывается документ
		"variables":  report_params, // переменные, которые надо передать в 
		"exportfilename": filename
	});
	var headers = {
		"Content-Type": "application/json",
		"Method": "post"
	};
	headers = addAuthHeader(headers);
	var res = fetch(url, {
		"headers": headers,
		"body": requestBody,
		"Method": "post"
	});
	if (!res.success) {
		event.log(entityname, entityid, "Ошибка при генерации документа по шаблону " + reportname + ": " + res.message/*.replace(/'/g, '/' / '')*/, 4, null);
		return res;
	} else {
		return successResp(res.message);
	}
}

/**
 * Формирование строки с номенклатурными позициями
 * @param {*} application 
 */
function prepare_nomenclature_string(application){
	if(isEmptyString(application.nomenclature)){
		return badResp("В данном заявлении не указана номенклатура");
	}
	var nomenclature = JSON.parse(application.nomenclature);
	
	if(isEmptyOrNullArray(nomenclature)){
		return badResp("В данном заявлении не указана номенклатура, укажите ее кнопкой \"Указать номенклатуру\"");
	}
	var nomenclature_objects = [];
	var nomenclature_string = ""
	//Проход по всем элементам в массиве номенклатуры
	for(var i = 0; i < nomenclature.length; i++){
		var nomenclature_item = nomenclature[i];
		var element_name = nomenclature_items[nomenclature_item.element_name];
		nomenclature_string += String().concat(element_name, ", ");
		nomenclature_objects.push(nomenclature_item)
	}

	if(nomenclature_string.length > 2){
		nomenclature_string = nomenclature_string.substring(0, nomenclature_string.length - 2);
	}

	if(isEmptyOrNullArray(nomenclature_objects)){
		return badResp("Не удалось сформировать строку номенклатуры для заявления");
	}

	return {
		success: true,
		data: nomenclature_string,
		nomenclature_objects: nomenclature_objects
	}

}

/**
 * Генерация заявления на генерацию уин
 * @param {*} params 
 */
//n.borodin убрал в рамках задачи https://rm.mfc.ru/issues/40044
// function generatenumbersapplication(params){
	
// 	//Проверка полученных полей
// 	var fillingValidateErrors = [];
// 	//Количество уин
// 	if (isEmptyString(params.count)) {
// 		fillingValidateErrors.push("\"Количество УИН\"");
// 	}
// 	//Номер исходящего заявления
// 	if (isEmptyString(params.output_application_number)) {
// 		fillingValidateErrors.push("\"Номер исходящего\"");
// 	}
// 	//Дата исходящего заявления
// 	if (isEmptyString(params.output_application_date)) {
// 		fillingValidateErrors.push("\"Дата исходящего\"");
// 	}
// 	if(isNotEmptyOrNullArray(fillingValidateErrors)){
// 		return badResp(fillingValidateErrors.length > 1 ? 
// 			String().concat("Поля ", fillingValidateErrors.join(", "), " не могут быть пустыми") : 
// 			String().concat("Поле ", fillingValidateErrors.join(", "), " не может быть пустым"));
// 	}

// 	//проверка правильности заполения полей
// 	var rightValidateErrors = [];
// 	//проверяем что количество УИН целое положительное число больше 0
// 	if(!/^([1-9]\d*)$/.test(params.count))
// 		rightValidateErrors.push("\"Количество УИН\" должно быть целым положительным числом");
// 	var count = parseFloat(params.count)
// 	if(count > 1000){
// 		rightValidateErrors.push("Невозможно создать заявление на генерацию более 1000 УИН");
// 	}
// 	//Проверяем, что Дата исходящего была не позднее текущей даты
// 	var date = new Date();
// 	date.setHours(date.getUTCHours() + 3);
// 	date.setUTCHours(0, 0, 0, 0);
// 	var application_date = new Date(params.output_application_date);
// 	application_date.setHours(application_date.getUTCHours() + 3);
// 	application_date.setUTCHours(0, 0, 0, 0);
// 	if (application_date.getTime() > date.getTime()) {
// 		rightValidateErrors.push("\"Дата исходящего\" должна быть не позднее текущей даты.");
// 	}

// 	if(isNotEmptyOrNullArray(rightValidateErrors)){
// 		return badResp(rightValidateErrors.join("; "));
// 	}
	
// 	var application_record = db.findbyrecid("rfid_request", params.recid);

// 	var user = getcurrentuser();
// 	var userValidateErrors = [];
// 	if(isEmptyString(user.firstname)){
// 		userValidateErrors.push("\"Имя\" ");
// 	}

// 	if(isEmptyString(user.lastname)){
// 		userValidateErrors.push("\"Фамилия\" ");
// 	}

// 	if(isEmptyString(user.patronymic)){
// 		userValidateErrors.push("\"Отчество\" ");
// 	}

// 	if(isEmptyString(user.phonenumber)){
// 		userValidateErrors.push("\"Телефон\" ");
// 	}
	
// 	if(isNotEmptyOrNullArray(userValidateErrors)){
// 		return badResp(userValidateErrors.length > 1? 
// 			String().concat("Заполните в профиле пользователя поля ", userValidateErrors.join(", ")) :
// 			String().concat("Заполните в профиле пользователя поле ", userValidateErrors.join(", ")) );
// 	}

// 	var user_fullname = String().concat(user.lastname , " ", user.firstname, " ", user.patronymic);

// 	var member = getmemberbyuserwithrecid(user.recid);
// 	if(isNullObject(member)){
// 		return badResp("Не удалось определить владельца пула номеров");
// 	}
// 	var reestr_members_fields = db.findbyrecid("reestr_members", member.recid); 
// 	if(isEmptyString(reestr_members_fields)){
// 		return badResp("Не найден заявитель в системе");
// 	}
// 	var branding_code = db.findbyrecid("dictionary_branding_codes", reestr_members_fields.branding_code);
// 	if(isNullObject(branding_code)){
// 		return badResp("Код клеймения не найден в системе");
// 	}
// 	var report_params = {
// 		"full_name": reestr_members_fields.fullname,
// 		"short_name": String().concat(branding_code.recname, ", ", branding_code.code),
// 		"actual_adress": reestr_members_fields.actualadress,
// 		"email": reestr_members_fields.email,
// 		"inn": reestr_members_fields.inn,
// 		"ogrn": reestr_members_fields.ogrn,
// 		"applicant_name": user_fullname,
// 		"applicant_phone": user.phonenumber,
// 		"uinscount": params.count,
// 		"output_application_number": params.output_application_number,
// 		"output_application_date": params.output_application_date

// 	}

// 	//номер заявления
// 	application_record.application_number = String().concat(member.unique_member_identifier, "-", get_autoincremented_idx("application_number").toString());

//   //  application_record.recname = params.recname;
// 	application_record.count = params.count;
// 	application_record.rfid_request_status = 5;
// 	application_record.requestor_id = member.recid;
// 	application_record.output_application_number = params.output_application_number;
// 	application_record.output_application_date = params.output_application_date;

// 	var updres = db.update("rfid_request", application_record);
// 	if(!updres){
// 		return badResp("Не удалось обновить запись заявления");
// 	}
// 	 //Формирование и прикладывание уведомления
// 	 var add_notice_res = prepare_and_add_notice("reportregisternumbersapplication", report_params, "application_file", "rfid_request", application_record.recid, String().concat("Заявление на генерацию УИН №", application_record.application_number));
// 	 if(!add_notice_res.success){
// 		 return add_notice_res;
// 		 return badResp("Ошибка генерации заявления");
// 	 }
// 	return successResp("Заявление успешно сгенерировано");
// }

/**
 * Отправка заявления на генерацию УИН в Росжелдор
 * @param {*} params 
 */
function sendapplicationtorzd(params){
	var idsArr = JSON.stringify(params.recordIdList);
	var paramteres = {
		"recid_applications": idsArr
	}
	//Вызываем метод из плагина
    var res = plugins.callAsMethod("/plugins/nbdlogicplugin/sign_and_send", "post", paramteres, null);
	return res;
}

/**
 * Отправка заявления на генерацию УИН в Росжелдор(пакетно)
 * @param {*} params 
 */
function sendapplicationtorzd_multiple(params){
	
	/* var applications = db.findbyparams("rfid_request", {
		rfid_request_status: 5
	})
	if(isEmptyOrNullArray(applications)){
		return {
			success: true,
			message: "Не найдено заявлений для отправки в Росжелдор"
		}
	}
 */
	var rfid_request_records = params.recordIdList;
	var rfid_request_arr = [];
	for (let j = 0; j < rfid_request_records.length; j++) {
		var application = db.findbyrecid("rfid_request", rfid_request_records[j]);
		rfid_request_arr.push(application);
	}
	
	/* var applications = db.findbyparams("rfid_request", {
		rfid_request_status: 5
	}) */
	if(isEmptyOrNullArray(rfid_request_arr)){
		return {
			success: true,
			message: "Не найдено заявлений для подписи",
			data: []
		}
	}

	var sending_errors = [];
	var sended_apps = 0;
	for(var i = 0; i < rfid_request_arr.length; i++){
		var application = rfid_request_arr[i];
		var attached_files = getattachedfileincolumn("rfid_request", "application_file", application.recid);
		if(isEmptyOrNullArray(attached_files)){
			continue;
		}
		var need_send = true;
		for(var j = 0; j < attached_files.length; j++){
			var attached_file = attached_files[j];
			if(!attached_file.isVerify){
				need_send = false;
			}
		}

		if(need_send){
			var sendapplicationtorzd_resp = sendapplicationtorzd({
				recid: application.recid
			});
			if(!sendapplicationtorzd_resp.success){
				sending_errors.push(sendapplicationtorzd_resp.message);
			}else{
				sended_apps++;
			}
		}
	}

	if(isNotEmptyOrNullArray(sending_errors)){
		var showerrorsfromarrayres = showerrorsfromarray(sending_errors);
		var returnmessage = String().concat("В Росжелдор отправлено ", sended_apps.toString(), " заявлений, ошибки при отправке: ", showerrorsfromarrayres.message);
		if(sended_apps > 0){
			return {
				success: true,
				message: returnmessage,
				data: []
			}
		}else{
			return {
				success: false,
				message: returnmessage,
				data: []
			}
		}
		
	}

	return {
		success: true,
		message: String().concat("В Росжелдор отправлено ", sended_apps.toString(), " заявлений"),
		data: []
	}

}
// Принятие заявления на генерацию УИН (Оператор РЖД) если заявление было создано под Оператором РЖД
function operatoracceptapplicationwithoutputakudate(params){
	return operatoracceptapplication(params);
}

/**
 * Принятие заявление на генерацию УИН (Оператор РЖД), если заявление создано в numbergenerator1
 * @param {*} params 
 */
function operatoracceptapplication(params){
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
    //Вызываем метод из плагина
    var res = plugins.callAsMethod("/plugins/nbdlogicplugin/accept_rfidrequest_application/"+params.recid, "post", null, null);
    return res;


	// var application_record = db.findbyrecid("rfid_request", params.recid);

	// //todo: Проверяем, если если заявление было создано в АРМ Производтеля 
	// if(application_record.rfid_request_status === 6) 
	// {           
	// 	//Проверка и обновление номера УИП и автоинкрементируемого индекса
	// 	var autoincrement_idx = null;
	// 	var uip_number = null;
	// 	if(isEmptyString(application_record.autoincrement_idx)){
	// 		var autoincrement_idx = get_autoincremented_idx('uip');
	// 		var uip_number = String().concat("УИП/1/", ('0000' + autoincrement_idx.toString()).slice(-5));
	// 		//Обновление записи заявления
	// 		application_record.uip_number = uip_number;
	// 		application_record.autoincrement_idx = autoincrement_idx;
	// 	} 

	// 	//Обновление записи
	// 	var updres = db.update("rfid_request", application_record);
	// 	if(!updres){
	// 		return badResp("Не удалось обновить запись заявления");
	// 	}
	// 	//Получение обновленной записи заявления
	// 	application_record = db.findbyrecid("rfid_request", params.recid);
	// 	if(isNullObject(application_record)){
	// 		return badResp("Не удалось получить запись заявления");
	// 	}
	// }

	// //Получение владельца
	// var member = null;
	// if(isEmptyString(application_record.requestor_id)){
	// 	if(isEmptyString(application_record.requestor_id_from_op)){
	// 		return badResp("Не заполнено обязательное поле \"Заявитель\".");
	// 	}
	// 	member = db.findbyrecid("reestr_members", application_record.requestor_id_from_op);
	// }else{
	// 	member = db.findbyrecid("reestr_members", application_record.requestor_id);
	// }
	// if(isNullObject(member)){
	// 	return badResp("Заявитель не найден в системе");
	// }

	// //Проверяем, если если заявление было создано в АРМ Производтеля 
	// if(application_record.rfid_request_status === 6) 
	// {
	// 	//номер заявления. генерируем, если не заполнено
	// 	if(isEmptyString(application_record.application_number))
	// 		application_record.application_number = member.recname + "-" + get_autoincremented_idx("application_number").toString();
		
	// 	//Проверка и обновление номера УИП и автоинкрементируемого индекса
	// 	if (isEmptyString(application_record.uip_number) || application_record.uip_number.indexOf("УИП/1") == -1){
	// 		var autoincrement_idx = null;
	// 		if(isEmptyString(application_record.autoincrement_idx)){
	// 			autoincrement_idx = get_autoincremented_idx("uip");
	// 		}else{
	// 			autoincrement_idx = application_record.autoincrement_idx;
	// 		}
	// 		var uip_number = String().concat("УИП/1/", ('0000' + autoincrement_idx.toString()).slice(-5));
	// 		//Обновление записи заявления
	// 		application_record.uip_number = uip_number;
	// 		application_record.autoincrement_idx = autoincrement_idx;
	// 	}
 
	// 	//Обновление записи
	// 	var updres = db.update("rfid_request", application_record);
	// 	if(!updres){
	// 		return badResp("Не удалось обновить запись заявления");
	// 	}
	// 	//Получение обновленной записи заявления
	// 	application_record = db.findbyrecid("rfid_request", params.recid);
	// 	if(isNullObject(application_record)){
	// 		return badResp("Не удалось получить запись заявления");
	// 	}
	// }
	
	// //Поле «Краткое наименование» из справочника «Коды клеймения»
	// var applicant_head_string = member.branding_code_recname; // member.fullname + " " + member.head_fio_in_dative;
	// //Получение пользователя (для вывода фио исполнителя)
	// var user = getcurrentuser();
	// var user_fullname = String().concat(user.lastname , " ", user.firstname, " ", user.patronymic);
	// var user_phone = user.phonenumber;

	// //Дата отказа или принятия Заявления на получение перечня УИН
	// application_record.notification_date = new Date();

	// var user_fullname = String().concat(user.lastname , " ", user.firstname, " ", user.patronymic);
	// var report_params = {
	// 	application_number: application_record.output_application_number,
	// 	application_date: datetimeToReportDate(application_record.output_application_date),
	// 	head_name: "",
	// 	uinscount: application_record.count.toString(),
	// 	applicant_head: applicant_head_string,
	// 	pool_id: application_record.recid,
	// 	applicant_phone: "",
	// 	uip_number: application_record.uip_number,
	// 	aku_date: datetimeToReportDate(application_record.aky_date),
	// 	number: application_record.application_number,
	// 	notification_date: datetimeToReportDate(application_record.notification_date),
	// 	fio_executor: user_fullname,
	// 	phone_executor: user_phone
	// };
	
	// //Запись recid исполнителя
	// application_record.executor = user.recid;

	// //Генерация УИН
	// var barcodes_gen_response = generaterfidrequestbarcodes(params);
	// if(!barcodes_gen_response.success){
	// 	return badResp(barcodes_gen_response.message);
	// }
	
	// //Формирование и прикладывание уведомления
	// var add_notice_res = prepare_and_add_notice("reportacceptregisternumbersapplication", report_params, "notification_file", "rfid_request", application_record.recid, "Уведомление о выделении пула УИН");
	// if(!add_notice_res.success){
	// 	return add_notice_res;
	// }


	// //Если запись была создана в АРМ Росжелдора и был приложен скан заявления - переносим файл в основное поле (в которое нельзя добавить/удалить файл)
	// if (application_record.rfid_request_status === 9) {
	// 	var attached_files = getattachedfiles("rfid_request", application_record.recid);
	// 	if (!attached_files.success) {
	// 		return attached_files;
	// 	}

	// 	var files_to_copy = [];
	// 	attached_files = attached_files.data;
	// 	for (var i = 0; i < attached_files.length; i++) {

	// 		if (attached_files[i].columnName == "application_file_from_op") {
	// 			attached_files[i].columnName = "application_file";

	// 			var fileUrl = String().concat(host, "/api/files/download/", attached_files[i].recId);

	// 			files_to_copy.push({
	// 				entityId: application_record.recid,
	// 				entityName: "rfid_request",
	// 				columnName: attached_files[i].columnName,
	// 				description: attached_files[i].recDescription,
	// 				file: {
	// 					"name": attached_files[i].recName, "url": fileUrl
	// 				}
	// 			});
	// 		}
	// 	} 
	// 	if (isNotEmptyOrNullArray(files_to_copy)){
	// 		let upload_res = file.upload(files_to_copy);
	// 		if (!upload_res.success) {
	// 			return upload_res;
	// 		}
	// 	}
	// }

	// //Принято
	// application_record.rfid_request_status = 7;

	// if (application_record.rfid_request_status === 6) { 
	
	// 	// Получение настройки, которая разрешает/запрещает передачу между армами
	// 	var transfer_setting = get_transfer_between_arms_portal_settings();
	// 	if (!transfer_setting.success){
	// 		return transfer_setting;
	// 	}
	// 	// если is_transfer_between_arms=true, то делаем отправку из арма росжелдора в арм производителя
	// 	if (transfer_setting.is_transfer_between_arms){
	// 		// получение адреса арма росжелдора
	// 		var rzd_url = get_rzd_urls_portal_settings();
	// 		if(!rzd_url.success){
	// 			return rzd_url;
	// 		}
	// 		//Отправка файлов в арм производителя
	// 		if(host == rzd_url.rzd_name_url){
	// 			var headers = {
	// 				"Content-Type": "application/json"
	// 			}
				
	// 			//Отправка данных по армам производителя
	// 			//Если в заявлении указан целевой хост, отправка данных туда, иначе рассылка по всем армам из массива армов
	// 			if(isNotEmptyString(application_record.host) && application_record.host != null){
	// 				var arm_host = application_record.host;
	// 				//Обновление записи с заявлением
	// 				var url = String().concat(arm_host, "/api/anonym");
	// 				var update_request_params = {
	// 					method: "update_entity_static",
	// 					fields: {
	// 						table: "rfid_request",
	// 						entity: application_record
	// 					}
	// 				}
					
	// 				var sendrequestresult = sendRequest("POST", headers, url, JSON.stringify(update_request_params));
	// 				if(!sendrequestresult.result.success){
	// 					return sendrequestresult;
	// 				}
	// 			}else{
	// 				return badResp("Не удалось определить производителя - получателя файлов УИН ");
	// 			}
				
	// 		}
	// 	}
	// }
	// var updres = db.update("rfid_request", application_record);
	// if(!updres){
	// 	return badResp("Не удалось обновить запись заявления");
	// }

	// return successResp("Заявление успешно принято");
}

/**
 * Подписать результат заявления на выпуск УИН
 * @param {*} params 
 */
function sign_rfid_request_application_result(params){
	// https://rm.mfc.ru/issues/38786 07.05.2020 imironov 
	// Переделал методы на использование workflow sign_rfid_request_application_result_and_send для таблицы rfid_request
	var recid = null;

	if(params.recid!=null)
	{
		// Если метод вызван по кнопке, то используем params.recid.
		recid = params.recid
	}
	else if(isEmptyOrNullArray(params.recordIdList) == false)
	{
		// Если метод вызван как метод воркфлоу, то recordIdList - массив идентификаторов записей.
		recid = params.recordIdList[0];
	}

	return sign_files_in_field("rfid_request", "notification_file", recid, true);
}

/**
 * Подписать результат учета элементов
 * @param {*} params 
 */
function sign_elements_registration_result(params){
	// https://rm.mfc.ru/issues/38786 06.05.2020 imironov 
	// Переделал методы на использование workflow sign_elements_registration_result_and_send для таблицы reestr_applications_for_key_elements_registration
	var recid = null;

	if(params.recid!=null)
	{
		// Если метод вызван по кнопке, то используем params.recid.
		recid = params.recid
	}
	else if(isEmptyOrNullArray(params.recordIdList) == false)
	{
		// Если метод вызван как метод воркфлоу, то recordIdList - массив идентификаторов записей.
		recid = params.recordIdList[0];
	}

	return sign_files_in_field("reestr_applications_for_key_elements_registration", "result_file", recid, true);
}

/**
 * Подписать файлы в поле таблицы
 * @param {*} table         Таблица
 * @param {*} field         Поле
 * @param {*} entity_id     Идентификатор сущности, в которой нужно подписать файлы
 * @param {*} need_resign   Флаг, определяющий нужно ли переподписывать файлы
 */
function sign_files_in_field(table, field, entity_id, need_resign){    
	var files = getattachedfileincolumn(table, field, entity_id);
	if(isEmptyOrNullArray(files)){        
		errorLog("sign_files_in_field", "Файлы для подписания не найдены files");
		return {
			success: true,
			message: "Файлы для подписания не найдены",
			data: []
		}
	}
	var files_for_sign = [];
	for(var i = 0; i < files.length; i++){
		if(need_resign){
			files_for_sign.push(files[i].recId);
		}else{
			if(!files[i].isVerify){
				files_for_sign.push(files[i].recId);
			}
		}
	}

	if(isEmptyOrNullArray(files_for_sign)){
		errorLog("sign_files_in_field", "Файлы для подписания не найдены sign_files_in_field");
		return {
			success: true,
			message: "Файлы для подписания не найдены",
			data: []
		}
	}else{
		return {
			success: true,
			message: String().concat("Найдено ", files_for_sign.length.toString(), " файлов для подписания"),
			data: files_for_sign
		}
	}
}

/**
 * Отправить результат владельцу (заявление на выпуск пула УИН)
 * @param {*} params 
 */
function send_rfid_request_application_result(params){

   // https://rm.mfc.ru/issues/38786 07.05.2020 imironov 
	// Переделал методы на использование workflow sign_rfid_request_application_result_and_send для таблицы rfid_request
	var recid = null;

	if(params.recid!=null)
	{
		// Если метод вызван по кнопке, то используем params.recid.
		recid = params.recid
	}
	else if(isEmptyOrNullArray(params.recordIdList) == false)
	{
		// Если метод вызван как метод воркфлоу, то recordIdList - массив идентификаторов записей.
		recid = params.recordIdList[0];
	}

	return plugins.callAsMethod(
		"/plugins/nbdlogicplugin/send_results_for_rfid_request/"+recid,
		"post",
		null,
		null
	);
}

/**
 * Отказ в заявлении на генерацию УИН (Оператор РЖД)
 * по причине Отсутствие Заявителя в базе зарегистрированных участников процедур учета составных частей
 * @param {*} params 
 */
function operatordeclineapplicationfileabcent(params){
	return badResp("Приложите файл заявления");
}
/**
 * Отказ в заявлении на генерацию УИН (Оператор РЖД)
 * по причине Отсутствие Заявителя в базе зарегистрированных участников процедур учета составных частей
 * @param {*} params 
 */
function operatordeclineapplicationrequestorempty(params){
	var application_record = db.findbyrecid("rfid_request", params.recid);
	if(isNullObject(application_record)){
		return badResp("Не удалось получить запись заявления");
	}

	//Проверка входящих параметров
	var fillingValidateErrors = [];
	//Краткое наименование заявителя
	if(isEmptyString(params.request_member)){
		fillingValidateErrors.push("\"Краткое наименование заявителя\"");
	}

	if(isEmptyString(params.rejection_reason)){
		fillingValidateErrors.push("\"Причина отказа\"");
	} 
	if(isNotEmptyOrNullArray(fillingValidateErrors)){
		return badResp(fillingValidateErrors.length > 1 ? 
			String().concat("Поля ", fillingValidateErrors.join(", "), " не могут быть пустыми") : 
			String().concat("Поле ", fillingValidateErrors.join(", "), " не может быть пустым"), fillingValidateErrors);
	}

	//Адрес электронной почты заявителя
	if (!isEmptyString(params.requestor_email)) {
		if(!validateEmail(params.requestor_email))
			return badResp("Введите корректный \"Адрес электронной почты заявителя\" (пример: example@mail.ru)");
	}
	
	application_record.request_member = params.request_member;
	application_record.requestor_email = params.requestor_email;
	var updres = db.update("rfid_request", application_record);
	if(!updres){
		return badResp("Не удалось обновить запись заявления");
	}

	return operatordeclineapplication(params);
}

function validateEmail(email) {
   // var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	var re = /\S+@\S+\.\S+/;
	return re.test(email);
  }

// Отказ в заявлении на генерацию УИН (Оператор РЖД) если заявление было создано под Оператором РЖД
function operatordeclineapplicationwithoutputakudate(params){
	return operatordeclineapplication(params);
}  

/**
 * Отказ в заявлении на генерацию УИН (Оператор РЖД), если заявление создано в numbergenerator1
 * @param {*} params 
 */
function operatordeclineapplication(params){
	var application_record = db.findbyrecid("rfid_request", params.recid);
	//Проверка входящих параметров
	if(isEmptyString(params.rejection_reason)){
		return badResp("Поле \"Причина отказа\" не может быть пустым");
	} 
	var reject_reason_record = db.findbyrecid("dictionary_reject_reasons", params.rejection_reason);
	if(isNullObject(reject_reason_record)){
		return badResp("Причина отказа не найдена в справочнике");
	}
	application_record.rejection_reason = params.rejection_reason;

	 //Обновление записи
	 var updres = db.update("rfid_request", application_record);
	 if(!updres){
		 return badResp("Не удалось обновить запись заявления");
	 }
	 //Получение обновленной записи заявления
	 application_record = db.findbyrecid("rfid_request", params.recid);
	 if(isNullObject(application_record)){
		 return badResp("Не удалось получить запись заявления");
	 }
	 
	//Проверка, приложен ли файл заявления при создании в АРМ Росжделдор
	if(application_record.rfid_request_status === 9 && !application_record.application_file_from_op_exist_calculated){
		return badResp("Приложите файл заявления");
	}

	//Получение владельца
	var member = null;
	var applicant_head_string = null;
	if(isEmptyString(application_record.requestor_id)){
		if(isEmptyString(application_record.requestor_id_from_op)){
			if(isNotEmptyString(application_record.request_member)){
				applicant_head_string = application_record.request_member;
			}
			else
				return badResp("Не заполнена информация о заявителе.");
		} else {
			member = db.findbyrecid("reestr_members", application_record.requestor_id_from_op);
		}
	}else{
		member = db.findbyrecid("reestr_members", application_record.requestor_id);
	}

	if(isNullObject(member) && isEmptyString(applicant_head_string)){
		return badResp("Заявитель не найден в системе");
	}

	//Проверяем, если если заявление было создано в АРМ Производителя - автоинкремент для УИП
	if(application_record.rfid_request_status === 6) 
	{
		//номер заявления. генерируем, если не заполнено
		if(isEmptyString(application_record.application_number))
			application_record.application_number = member.recname + "-" + get_autoincremented_idx("application_number").toString();
		
		//Проверка и обновление номера УИП и автоинкрементируемого индекса
		var autoincrement_idx = null;
		if(isEmptyString(application_record.autoincrement_idx)){
			autoincrement_idx = get_autoincremented_idx("uip");
		}else{
			autoincrement_idx = application_record.autoincrement_idx;
		}
		var uip_number = String().concat("УИП/1/", ('0000' + autoincrement_idx.toString()).slice(-5));
		//Обновление записи заявления
		application_record.uip_number = uip_number;
		application_record.autoincrement_idx = autoincrement_idx;
   
		//Обновление записи
		var updres = db.update("rfid_request", application_record);
		if(!updres){
			return badResp("Не удалось обновить запись заявления");
		}
		//Получение обновленной записи заявления
		application_record = db.findbyrecid("rfid_request", params.recid);
		if(isNullObject(application_record)){
			return badResp("Не удалось получить запись заявления");
		}
		
		//Обновление записи
		var updres = db.update("rfid_request", application_record);
		if(!updres){
			return badResp("Не удалось обновить запись заявления");
		}
		//Получение обновленной записи заявления
		application_record = db.findbyrecid("rfid_request", params.recid);
		if(isNullObject(application_record)){
			return badResp("Не удалось получить запись заявления");
		}
	}

	//Поле «Краткое наименование» из справочника «Коды клеймения»
	if(isNotNullObject(member)) {
		applicant_head_string = member.branding_code_recname; // member.fullname + " " + member.head_fio_in_dative;
	}
	
	//Дата отказа или принятия Заявления на получение перечня УИН
	application_record.notification_date = new Date();

	//Получение пользователя (для вывода фио начальника)
	var user = getcurrentuser();
	var user_fullname = String().concat(user.lastname , " ", user.firstname, " ", user.patronymic);
	var user_phone = user.phonenumber;
	
	//recid исполнителя
	application_record.executor = user.recid;

	var report_params = {
		application_number: application_record.output_application_number,
		application_date: datetimeToReportDate(application_record.output_application_date),
		head_name: "",
		uinscount: application_record.count.toString(),
		uip_number: application_record.uip_number,
		applicant_head_name: applicant_head_string,
		rejection_reason: reject_reason_record.recname,
		aku_date: datetimeToReportDate(application_record.aky_date),
		number: application_record.application_number,
		notification_date: datetimeToReportDate(application_record.notification_date),
		fio_executor: user_fullname,
		phone_executor: user_phone
	};

	//Формирование и прикладывание уведомления
	var add_notice_res = prepare_and_add_notice("reportdeclineregisternumbersapplication", report_params, "notification_file", "rfid_request", application_record.recid, "Уведомление об отказе в выделении пула УИН");
	if(!add_notice_res.success){
		return add_notice_res;
	}
	
	//Если запись была создана в АРМ Росжелдора и был приложен скан заявления - переносим файл в основное поле (в которое нельзя добавить/удалить файл)
	if (application_record.rfid_request_status === 9) {

		var attached_files = getattachedfiles("rfid_request", application_record.recid);
		if (!attached_files.success) {
			return attached_files;
		}

		var files_to_copy = [];
		attached_files = attached_files.data;
		for (var i = 0; i < attached_files.length; i++) {

			if (attached_files[i].columnName == "application_file_from_op") {
				attached_files[i].columnName = "application_file";

				var fileUrl = String().concat(host, "/api/files/download/", attached_files[i].recId);

				files_to_copy.push({
					entityId: application_record.recid,
					entityName: "rfid_request",
					columnName: attached_files[i].columnName,
					description: attached_files[i].recDescription,
					file: {
						"name": attached_files[i].recName, "url": fileUrl
					}
				});
			}
		} 
		if (isNotEmptyOrNullArray(files_to_copy)){
			let upload_res = file.upload(files_to_copy);
			if (!upload_res.success) {
				return upload_res;
			}
		}
	}

	//Отказано
	application_record.rfid_request_status = 8;
	
	// Получение настройки, которая разрешает/запрещает передачу между армами
	var transfer_setting = get_transfer_between_arms_portal_settings();
	if (!transfer_setting.success){
		return transfer_setting;
	}
	if (transfer_setting.is_transfer_between_arms){
		// получение адреса росжелдора
		var rzd_url = get_rzd_urls_portal_settings();
		if(!rzd_url.success){
			return rzd_url;
		}
		//Отправка файлов в арм производителя
		if(host == rzd_url.rzd_ip_url || host == rzd_url.rzd_name_url){
			var headers = {
				"Content-Type": "application/json"
			}
			//Отправка файла с результатом в арм производителя
			var files_to_upload = [];

			var all_attached_files = getattachedfiles("rfid_request", application_record.recid);
			if(!all_attached_files.success){
				return all_attached_files;
			}
	
			var all_attached_files = all_attached_files.data;
			for(var i = 0; i < all_attached_files.length; i++){
				if(all_attached_files[i].columnName == "barcodes"){
					var fileUrl = String().concat(host, "/api/files/download/", all_attached_files[i].recId);
					files_to_upload.push({
						entityId: application_record.recid,
						entityName: "rfid_request",
						columnName: all_attached_files[i].columnName,
						description: all_attached_files[i].recDescription,
						file: {
							"name": all_attached_files[i].recName, "url": fileUrl   
						}
					});
				}
			}
			//Отправка данных по армам производителя
			//Если хост заполнен в заявлении, файлы отправляются в него, иначе идет рассылка по армам в массиве
			if(files_to_upload.length > 0){
				if(isEmptyString(application_record.host)){
					return badResp("Не удалось определить адрес получателя файлов")
				}else{
					//Отправка файлов в арм производителя
					var files_upload_res = upload_files_to_outer_rdev(application_record.host, files_to_upload);
					if(!files_upload_res.success){
						return files_upload_res;
					}
			
					//Обновление записи с заявлением
					var url = String().concat(application_record.host, "/api/anonym");
					var update_request_params = {
						method: "update_entity_static",
						fields: {
							table: "rfid_request",
							entity: application_record
						}
					}
					
					var sendrequestresult = sendRequest("POST", headers, url, JSON.stringify(update_request_params));
					if(!sendrequestresult.result.success){
						return sendrequestresult;
					}
				}
			}
		}
	}
	

	var updres = db.update("rfid_request", application_record);
	if(!updres){
		return badResp("Не удалось обновить запись заявления");
	}

	return successResp("В принятии заявления успешно отказано");
}

/**
 * Создание заявления (Оператор РЖД)
 * @param {*} params 
 */
//n.borodin убрал в рамках задачи https://rm.mfc.ru/issues/40044
// function rzdopgeneratenumbersapplication(params){
	 
// 	//Проверка полученных полей
// 	var fillingValidateErrors = [];
// 	//Номер УИП - префикс УИП/2/
// 	if(isEmptyString(params.uip_number)){
// 		fillingValidateErrors.push("\"Номер УИП\"");
// 	}
// 	//Количество уин
// 	if(isEmptyString(params.count)){
// 		fillingValidateErrors.push("\"Количество УИН\"");
// 	} 
// 	if(isNotEmptyOrNullArray(fillingValidateErrors)){
// 		return badResp(fillingValidateErrors.length > 1 ? 
// 			String().concat("Поля ", fillingValidateErrors.join(", "), " не могут быть пустыми") : 
// 			String().concat("Поле ", fillingValidateErrors.join(", "), " не может быть пустым"), fillingValidateErrors);
// 	}

// 	//проверка правильности заполения полей
// 	var rightValidateErrors = [];
// 	if(params.uip_number.toUpperCase().indexOf("УИП/") != -1){
// 		rightValidateErrors.push("Поле \"Номер УИП\" должно содержать только номер, префикс добавится автоматически");
// 	}
// 	//Проверяем введенное значение УИП на уникальность (с учетом префикса)
// 	var uip_validate = validationnumberunic(String().concat("УИП/2/", params.uip_number), "uip_number", "Номер УИП");
// 	if(!uip_validate.success){
// 		rightValidateErrors.push(uip_validate.message);
// 	}

// 	//проверяем что количество УИН целое положительное число больше 0
// 	if(!/^([1-9]\d*)$/.test(params.count))
// 		rightValidateErrors.push("\"Количество УИН\" должно быть целым положительным числом");
   
// 	var count = parseFloat(params.count)
// 	if(count > 1000){
// 		rightValidateErrors.push("Невозможно создать заявление на генерацию более 1000 УИН");
// 	}

// 	//Проверяем, что Дата исходящего была не позднее текущей даты
// 	var date = new Date();
// 	date.setHours(date.getUTCHours() + 3);
// 	date.setUTCHours(0, 0, 0, 0);
// 	var application_date = new Date(params.output_application_date);
// 	application_date.setHours(application_date.getUTCHours() + 3);
// 	application_date.setUTCHours(0, 0, 0, 0);
// 	if (application_date.getTime() > date.getTime()) {
// 		rightValidateErrors.push("\"Дата исходящего\" должна быть не позднее текущей даты.");
// 	}
	
// 	//Проверка формата телефона
// 	if(isNotEmptyString(params.phone)){
// 		let regexp = "^\\+?[78][-\\(]?\\d{3}\\)?-?\\d{3}-?\\d{2}-?\\d{2}$";
// 		if(params.phone.match(regexp)){
// 			// var phone = params.phone.match(regexp)[0];
// 		}
// 		else {
// 			rightValidateErrors.push("Проверьте поле \"Телефон контактного лица\". Поддерживаются форматы: 81234567890, +7-123-456-78-90, +7(123)-456-78-90");
// 		}
// 	}

// 	if(isNotEmptyOrNullArray(rightValidateErrors)){
// 		return badResp(rightValidateErrors.join("; "));
// 	}

// 	var application_record = db.findbyrecid("rfid_request", params.recid);

// 	if(isNotEmptyString(params.member)){
// 		var reestr_members_fields = db.findbyrecid("reestr_members", params.member); 
// 		if(isEmptyString(reestr_members_fields)){
// 			return badResp("Не найден заявитель в системе");
// 		}
// 		//номер заявления. генерируем, если не заполнено
// 		if(isEmptyString(application_record.application_number))
// 			application_record.application_number = String().concat(reestr_members_fields.unique_member_identifier, "-", get_autoincremented_idx("application_number").toString())
// 	} else {
// 		//номер заявления. генерируем, если не заполнено
// 		if(isEmptyString(application_record.application_number))
// 		application_record.application_number = String().concat("A00", "-", get_autoincremented_idx("application_number").toString())
// 	}
   
// 	//Генерируем номер АКУ
// 	var newValueResult = rdev.generateSerial("AkuNumbers");
// 	if (!newValueResult.success)
// 	return badResp("Номер АКУ не сгенерирован");
	 
// 	application_record.aky_date = new Date();
// 	application_record.aky_number = String().concat("АКУ/2/", newValueResult.data);
// 	application_record.uip_number = String().concat("УИП/2/", params.uip_number);
// 	application_record.count = params.count;
// 	application_record.contact_fio = params.contact_fio;
// 	application_record.phone = params.phone;
// 	//Сгенерировано оператором Росжелдора
// 	application_record.rfid_request_status = 9;
// 	application_record.requestor_id_from_op = params.member;
// 	application_record.output_application_number = params.output_application_number;
// 	if(isNotEmptyString(params.output_application_date))
// 		application_record.output_application_date = new Date(params.output_application_date).toISOString();


// 	var updres = db.update("rfid_request", application_record);
// 	if(!updres){
// 		return badResp("Не удалось обновить запись заявления");
// 	}
// 	return successResp("Заявление успешно сгенерировано");
// }

/**
 * Создание заявления на учет СЧ
 * @param {*} params 
 */
function acceptelementregistrationapplicationwithoutputakudate(params){
	// var application_record = db.findbyrecid("reestr_applications_for_key_elements_registration", params.recid);
	// if(isNullObject(application_record)){
	//     return badResp("Запись заявления не найдена в системе");
	// }

	// //Валидации входящих значений
	// if(isEmptyString(params.output_application_number)){
	//     return badResp("Поле \"Номер исходящего заявления\" не может быть пустым");
	// }

	// if(isEmptyString(params.output_application_date)){
	//     return badResp("Поле \"Дата исходящего заявления\" не может быть пустым")
	// }

	// application_record.output_application_number = params.output_application_number;
	// application_record.output_application_date = params.output_application_date;
	// db.update("reestr_applications_for_key_elements_registration", application_record);

	return acceptelementregistrationapplication(params);
}

/**
 * Проверка на уникальность полей типа УИП, АКУ для всех типов заявлений
 * 
 * @param {номер с префиксом} number_with_prefix 
 * @param {наименование поля номера в таблице} field 
 * @param {наименование поля номера в интерфейсе} fieldName 
 */
function validationnumberunic(number_with_prefix, field, fieldName){
	var json = {};
	json[field] = number_with_prefix;

	//Заявления на участие в паспортизации
	if (field != "uip_number") {
		var number_exist = db.findbyparams("reestr_applications_for_participation", json);
		if (!isEmptyOrNullArray(number_exist))
			return badResp(String().concat("Введенный \"", fieldName, "\" уже занят."));
		}
	
	// Заявления на регистрацию элементов
	number_exist = db.findbyparams("reestr_applications_for_key_elements_registration", json);
	if (!isEmptyOrNullArray(number_exist))
		return badResp(String().concat("Введенный \"", fieldName, "\" уже занят."));

	// Заявления на регистрацию УИН
	// Костыль, т.к. в этой таблице поле называется не как в остальных. Можно исправить в ПФ и БД
	if (field == "aku_number") {
		json = {};
		json["aky_number"] = number_with_prefix;
	}
	number_exist = db.findbyparams("rfid_request", json);
	if (!isEmptyOrNullArray(number_exist))
	return badResp(String().concat("Введенный \"", fieldName, "\" уже занят."));
	return successResp(1);
}

/**
 * Конвертор даты из формата системы в  требуемый для отчета
 * @param {строка даты в формате RDEV} datetime 
 */
function datetimeToReportDate(datetime){
	if(isNotEmptyString(datetime)){
		var date = new Date(datetime);
		date.setHours(date.getUTCHours() + 3);
		return String().concat(date.getDate().toString().padStart(2, "0"), ".", (date.getMonth() + 1).toString().padStart(2, "0"), ".", date.getFullYear().toString().padStart(2, "0"));
	} else 
	  return "";
}


/**
 * Проверка заполнения обязательных полей заявления на учет СЧ
 * @param {*} params 
 */
function validationfieldselementregistrationapplication(params){

	var application_record = db.findbyrecid("reestr_applications_for_key_elements_registration", params.recid);
	if(isNullObject(application_record)){
		return badResp("Не удалось получить запись заявления");
	}

	//Валидация заполенности полей в записи
	var fillingValidateErrors = [];
	//Заявитель
	if(isEmptyString(application_record.member)){
		fillingValidateErrors.push("\"Заявитель\"");
	}

	//Если заявление создано в АРМ Росжедор
	if (isEmptyString(application_record.status_calculated)) {
		//Номер УИП
		if(isEmptyString(application_record.uip_number)){
			fillingValidateErrors.push("\"Номер УИП\"");
		}
	} else {
		//Если заявление создано в АРМ производителя
		//Проверка и обновление номера УИП и автоинкрементируемого индекса
		var autoincrement_idx = null;
		if(isEmptyString(application_record.autoincrement_idx)){
			autoincrement_idx = get_autoincremented_idx("uip");
		}else{
			autoincrement_idx = application_record.autoincrement_idx;
		}
		if (isEmptyString(application_record.uip_number) || application_record.uip_number.indexOf("УИП/1") == -1){
			var uip_number = String().concat("УИП/1/", ('0000' + autoincrement_idx.toString()).slice(-5));
			application_record.uip_number = uip_number;
		}
		application_record.autoincrement_idx = autoincrement_idx;        
	}

	//Проверяем что выбрано хотя бы одно основание  для учета
	if(application_record.status != "20b9d598-ea5b-4508-b0ce-c13d54d65944"){
		if((application_record.reason1 == null || !application_record.reason1) && (application_record.reason2 == null || !application_record.reason2)){
			fillingValidateErrors.push("\"Основание для учета СЧ\"");
		}
	}
	//Количество СЧ/СЕ к учету
	if(isEmptyString(application_record.count_ke_ce)){
		fillingValidateErrors.push("\"Количество СЧ/СЕ к учету\"");
	}
	//ФИО
	if(isEmptyString(application_record.fio)){
		fillingValidateErrors.push("\"Фамилия, имя, отчество\"");
	}

	if(isNotEmptyOrNullArray(fillingValidateErrors)){
		return badResp(fillingValidateErrors.length > 1 ? 
			String().concat("Поля ", fillingValidateErrors.join(", "), " не могут быть пустыми") : 
			String().concat("Поле ", fillingValidateErrors.join(", "), " не может быть пустым"));
	}

	//Получаем заявителя
	var member = db.findbyrecid("reestr_members", application_record.member);
	if(isNullObject(member)){
		return badResp("Заявитель не найден в системе");
	}

	//Дата исходящего (не обязательный параметр)
	//если заполнена - проверяем что Дата исходящего была не позднее текущей даты)
	if(isNotEmptyString(application_record.output_application_date)){
		var date = new Date();
		date.setHours(date.getUTCHours() + 3);
		date.setUTCHours(0, 0, 0, 0);
		var application_date = new Date(application_record.output_application_date);
		application_date.setHours(application_date.getUTCHours() + 3);
		application_date.setUTCHours(0, 0, 0, 0);
		if (application_date.getTime() > date.getTime()) {
			return badResp("\"Дата исходящего\" должна быть не позднее текущей даты.");
		}
	}

	//Если заявление создано в АРМ Росжедор
	if (isEmptyString(application_record.status_calculated)) {
		//Проверяем введенное значение УИП на уникальность (с учетом префикса)
		if(application_record.uip_number.indexOf("УИП/2/") == -1){
			var uip_validate = validationnumberunic(String().concat("УИП/2/", application_record.uip_number), "uip_number", "Номер УИП");
			if(!uip_validate.success){
				return uip_validate;
			}
			application_record.uip_number = "УИП/2/" + application_record.uip_number;
		}
		//номер заявления. генерируем, если не заполнено
		if(isEmptyString(application_record.recname))
			application_record.recname = String().concat(member.unique_member_identifier, "-", get_autoincremented_idx("application_number").toString());
		else {
			application_record.recname = String().concat(member.unique_member_identifier, "-", application_record.recname.substring(application_record.recname.indexOf("-") + 1, application_record.recname.length));
		}
	} else {
		//Если заявление создано в АРМ производителя
		//номер заявления. генерируем, если не заполнено
		if(isEmptyString(application_record.recname))
			application_record.recname = member.unique_member_identifier + "-" + get_autoincremented_idx("application_number").toString();
		
	}

	//Переносим Основание для учета СЧ из вычисляемого в текстовое
	application_record.reason = application_record.reason_calculated;
	
	//Обновление записи заявления
	var updres = db.update("reestr_applications_for_key_elements_registration", application_record);
	if(!updres){
		return badResp("Не удалось обновить запись заявления");
	}

	return successResp();
}
/**
 * Проверка, что файл приложен в заявлении (таблица reestr_applications_for_key_elements_registration)
 * @param {*} application_record Запись заявления
 */
function checkattachedfiles(application_record){
	//Проверяем что приложен файл заявления
	var attached_files = getattachedfileincolumn("reestr_applications_for_key_elements_registration", "notice_file", application_record.recid);
	if((attached_files.hasOwnProperty('success') && !attached_files.success) || attached_files.length <=0){
		var attached_files_rzd = getattachedfileincolumn("reestr_applications_for_key_elements_registration", "notice_file_rzd", application_record.recid);
		if((attached_files_rzd.hasOwnProperty('success') && !attached_files_rzd.success) || attached_files_rzd.length <=0){
			return badResp("Приложите файл заявления");
		}
		else {
			var files_to_copy = [];
			for (let i = 0; i < attached_files_rzd.length; i++) {
				attached_files_rzd[i].columnName = "notice_file";
				var fileUrl = String().concat(host, "/api/files/download/", attached_files_rzd[i].recId);

				files_to_copy.push({
					entityId: application_record.recid,
					entityName: "reestr_applications_for_key_elements_registration",
					columnName: attached_files_rzd[i].columnName,
					description: attached_files_rzd[i].recDescription,
					file: {
						"name": attached_files_rzd[i].recName, "url": fileUrl
					}
				});
			}
			if (isNotEmptyOrNullArray(files_to_copy)){
				let upload_res = file.upload(files_to_copy);
				if (!upload_res.success) {
					return upload_res;
				}
			}
			//Удаляем файл
			delete_files(attached_files_rzd[0].recId);
		}
	}
}

/**
 * Прикладывание файлов на регистрацию СЧ
 * @param {*} params 
 */
function acceptelementregistrationapplication(params){
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
	var parameters = {
		"application_recid": params.recid,
		"attachment_files": params.files
	}

	//Вызываем метод из плагина
	var res = plugins.callAsMethod("/plugins/nbdlogicplugin/acceptapplicationsforelementsregistration", "post", parameters, null);
	return res;
}

/**
 * Отказ в регистрации элемента (с вводом данных о номере заявления)
 * @param {*} params 
 */
function declineelementregistrationapplicationwithoutputakudate(params){
	//Валидации
	
	// //Причина отказа
	// if(isEmptyString(params.rejection_reason)){
	//     return badResp("Причина отказа не может быть пустой");
	// }

	// var record = db.findbyrecid("reestr_applications_for_key_elements_registration", params.recid);
	// if(isNullObject(record)){
	//     return badResp("Запись заявления не найдена в системе");
	// }

	// record.rejection_reason = params.rejection_reason;
	// db.update("reestr_applications_for_key_elements_registration", record);

	return declineelementregistrationapplication(params);
}

/**
 * Отказ в регистрации элемента
 * @param {*} params 
 */
function declineelementregistrationapplication(params){
	//Получение записи заявления
	var application_record = db.findbyrecid("reestr_applications_for_key_elements_registration", params.recid);
	if(isNullObject(application_record)){
		return badResp("Не удалось получить запись заявления");
	}

	//Проверяем, выбрана ли Причина отказа
	if(isEmptyString(params.rejection_reason)){
		return badResp("Причина отказа не может быть пустой");
	}
	var reject_reason_record = db.findbyrecid("dictionary_reject_reasons", params.rejection_reason);
	if(isNullObject(reject_reason_record)){
		return badResp("Причина отказа не найдена в справочнике");
	}

	application_record.rejection_reason = params.rejection_reason;
	db.update("reestr_applications_for_key_elements_registration", application_record);

	//проверяем обязательные поля записи
	var fields_validated = validationfieldselementregistrationapplication(params);
	if(!fields_validated.success)
		return fields_validated;
	
	//Проверка, что файл приложен в запись
	if(isEmptyString(application_record.status_calculated)){
		checkattachedfiles(application_record);
	}
	//В процессе валидации заполняется часть полей, поэтому получаем обновленную запись
	application_record = db.findbyrecid("reestr_applications_for_key_elements_registration", params.recid);
	if(isNullObject(application_record)){
		return badResp("Не удалось получить запись заявления");
	}

	var member = db.findbyrecid("reestr_members", application_record.member);
	if(isNullObject(member)){
		return badResp("Заявитель не найден в системе");
	}

	//Поле «Краткое наименование» из справочника «Коды клеймения»
	var applicant_head_string = member.branding_code_recname; //member.fullname + isNotEmptyString(member.head_fio_in_dative)? " " + member.head_fio_in_dative:"";

	//Получение пользователя (для вывода фио начальника)
	var user = getcurrentuser();
	var user_fullname = String().concat(user.lastname , " ", user.firstname, " ", user.patronymic);
	var user_phone = user.phonenumber;
	//Дата генерации уведомления
	application_record.notification_date = new Date();
	//recid исполнителя 
	application_record.executor = user.recid;

	var report_params = {
		application_number: application_record.output_application_number,
		application_date: datetimeToReportDate(application_record.output_application_date),
		uip_number: application_record.uip_number,
		plural_names: true,
		rejection_reason: reject_reason_record.recname,
		applicant_head: applicant_head_string,
		aku_date: datetimeToReportDate(application_record.aku_date),
		number: application_record.recname,
		notification_date: datetimeToReportDate(application_record.notification_date),
		fio_executor: user_fullname,
		phone_executor: user_phone
	};
	
	if(isEmptyString(application_record.registered_entity_type)){
		var add_notice_res = prepare_and_add_notice("reportdeclineregisterelementapplication", report_params, "result_file", "reestr_applications_for_key_elements_registration", application_record.recid, "Уведомление о принятии решения по заявлению на учет №" + application_record.recname);
		if(!add_notice_res.success){
			return add_notice_res;
		}
	}else{
		
		if(application_record.registered_entity_type == "key_element" || application_record.registered_entity_type == "key_elements_archive"){
			var add_notice_res = prepare_and_add_notice("reportdeclineregisterelementapplication", report_params, "result_file", "reestr_applications_for_key_elements_registration", application_record.recid, "Уведомление о принятии решения по заявлению на учет №" + application_record.recname);
			if(!add_notice_res.success){
				return add_notice_res;
			}
		}else if(application_record.registered_entity_type == "node" || application_record.registered_entity_type == "nodes_archive"){
			var add_notice_res = prepare_and_add_notice("reportdeclineregisterelementapplication", report_params, "result_file", "reestr_applications_for_key_elements_registration", application_record.recid, "Уведомление о принятии решения по заявлению на учет №" + application_record.recname);
			if(!add_notice_res.success){
				return add_notice_res;
			}
		}else if(application_record.registered_entity_type == "assembly_unit" || application_record.registered_entity_type == "assembly_units_archive"){
			var add_notice_res = prepare_and_add_notice("reportdeclineregisterelementapplication", report_params, "result_file", "reestr_applications_for_key_elements_registration", application_record.recid, "Уведомление о принятии решения по заявлению на учет №" + application_record.recname);
			if(!add_notice_res.success){
				return add_notice_res;
			}
		}else if(application_record.registered_entity_type == "vehicle" || application_record.registered_entity_type == "vehicles_archive"){
			var vehicle = db.findbyrecid("reestr_vehicles", application_record.registered_entity_id);
			if(isNullObject(vehicle)){
				return badResp("Запись с ТС не найдена в системе")
			}
			var report_params = {
				application_number: application_record.output_application_number,
				application_date: datetimeToReportDate(application_record.output_application_date),
				uip_number: application_record.uip_number,
				rejection_reason: reject_reason_record.recname.toString(),
				applicant_head: applicant_head_string,
				aku_date: datetimeToReportDate(application_record.aku_date),
				number: application_record.recname,
				notification_date: datetimeToReportDate(application_record.notification_date),
				fio_executor: user_fullname,
				phone_executor: user_phone
			};
			var add_notice_res = prepare_and_add_notice("reportdeclineregisterelementsonvagonapplication", report_params, "result_file", "reestr_applications_for_key_elements_registration", application_record.recid, "Уведомление о принятии решения по заявлению на учет №" + application_record.recname);
			if(!add_notice_res.success){
				return add_notice_res;
			}
		}
	}
	
	application_record.status = "d5d55ee5-97b3-4653-9a0c-a2be12682b01";
	db.update("reestr_applications_for_key_elements_registration", application_record)
	return successResp("В регистрации элемента отказано")

}

/**
 * Формирует строку из текстов ошибок и возвращает badResp
 * @param {*} errors_array Массив текстов ошибок
 */
function showerrorsfromarray(errors_array){
	var message = "";
	for(var i = 0; i < errors_array.length; i++){
		if(i < errors_array.length - 1){
			message += errors_array[i] + ', '
		}else{
			message += errors_array[i]
		}
	}
	return badResp(message);
}

/**
 * Метод установки флагов Учет изготовления и Учет установки в АРМ производителя
 * В момент отправки результата владельцу
 * (workflow)
 * https://rm.mfc.ru/issues/41231 27.07.2020 a.polunina
 * перенос в плагин https://rm.mfc.ru/issues/57151 n.borodin
 * @param {*} params 
 */
function send_allows_flags_to_arm_manufacturer(params){
	var recid = null;

	if(params.recid!=null)
	{
		// Если метод вызван по кнопке, то используем params.recid.
		recid = params.recid
	}
	else if(isEmptyOrNullArray(params.recordIdList) == false)
	{
		// Если метод вызван как метод воркфлоу, то recordIdList - массив идентификаторов записей.
		recid = params.recordIdList[0];
	}
	
	var paramteres = {
		"recid": recid
	}

	//Вызываем метод из плагина
    var res = plugins.callAsMethod("/plugins/nbdlogicplugin/send_allows_flags_to_arm_manufacturer", "post", paramteres, null);
	return res;   
}

/**
 * Отправка сообщения о результате на почту владельцу
 * @param {*} params 
 */
function send_application_result(params){
	// https://rm.mfc.ru/issues/38786 06.05.2020 imironov 
	// Переделал методы на использование workflow sign_elements_registration_result_and_send для таблицы reestr_applications_for_key_elements_registration
	var recid = null;

	if(params.recid!=null)
	{
		// Если метод вызван по кнопке, то используем params.recid.
		recid = params.recid
	}
	else if(isEmptyOrNullArray(params.recordIdList) == false)
	{
		// Если метод вызван как метод воркфлоу, то recordIdList - массив идентификаторов записей.
		recid = params.recordIdList[0];
	}

	var paramteres = {
		"recid": recid
	}

	//Вызываем метод из плагина
    var res = plugins.callAsMethod("/plugins/nbdlogicplugin/send_application_result", "post", paramteres, null);
	return res; 
}

/**
 * Отправка письма на почту
 * @param {*} email         Почта
 * @param {*} title         Тема
 * @param {*} message       Сообщение
 * @param {*} attachments    Файлы в приложения
 */
function send_email(email, title, message, attachments) {
	try {
		var send_mail_result = mail.send(email, title, message, attachments);
		return send_mail_result;
	} catch (e) {
		return badResp("Ошибка при отправке сообщения: " + e);
	}
}

/**
 * Массовая подпись неподписанных заявлений паспортгенератором
 * Возвращает идентификаторы файлов для подписания
 */
function sign_multiple_applications(params){
	//Получение всех записей
	/* var all_records = db.findbyparams("reestr_applications_for_key_elements_registration", {
		recstate: 1,
		status: "c63d14c0-3464-4849-af6b-7446b4129dd9"
	})
	
	if(isEmptyOrNullArray(all_records)){
		return {
			success: true,
			message: "Не найдено файлов для подписи",
			data: []
		}
	} */

	var reestr_applications_for_key_elements_registration_records = params.recordIdList;
	var reestr_applications_for_key_elements_registration_arr = [];
	for (let j = 0; j < reestr_applications_for_key_elements_registration_records.length; j++) {
		var reestr_applications_for_key_elements_registration_record = db.findbyrecid("reestr_applications_for_key_elements_registration", reestr_applications_for_key_elements_registration_records[j]);
		reestr_applications_for_key_elements_registration_arr.push(reestr_applications_for_key_elements_registration_record);
	}
	
	/* var applications = db.findbyparams("rfid_request", {
		rfid_request_status: 5
	}) */
	if(isEmptyOrNullArray(reestr_applications_for_key_elements_registration_arr)){
		return {
			success: true,
			message: "Не найдено заявлений для подписи",
			data: []
		}
	}

	var files_to_sign = [];
	
	//Получение файлов для подписи
	for(var i = 0; i < reestr_applications_for_key_elements_registration_arr.length; i++){
		var record = reestr_applications_for_key_elements_registration_arr[i];

		var attached_files = getattachedfileincolumn("reestr_applications_for_key_elements_registration", "notice_file", record.recid);
		if(!isEmptyOrNullArray(attached_files)){
			//Добавление неподписанных файлов в массив
			for(var j = 0; j < attached_files.length; j++){
				var attached_file = attached_files[j];
				files_to_sign.push(attached_file.recId);
			}
		}
	}

	//Если файлов для подписания не найдено, выводим сообщение
	if(files_to_sign.length <= 0){
		return {
			success: true,
			message: "Не найдено файлов для подписания",
			data: []
		}
	}

	return {
		success: true,
		message: String().concat("Найдено файлов для подписания: ", files_to_sign.length),
		data: files_to_sign
	}
}

/**
 * Выделить номера под Data-matrix маркировку
 * @param {*} params 
 */
function create_pool_for_datamatrix(params){
	//Валидация
	if(isEmptyString(params.pool_numbers_count)){
		return badResp("Поле \"Количество выделяемых УИН\" не может быть пустым");
	}
	var pool_numbers_count = parseInt(params.pool_numbers_count);

	var app_record = db.findbyrecid("rfid_request", params.recid);
	if(isNullObject(app_record)){
		return badResp("Запись заявления не найдена в системе");
	}

	//Получение номеров в пуле
	var ke_numbers = db.findbyparams("ke_numbers", {
		rfid_request: app_record.recid
	});
	if(isEmptyOrNullArray(ke_numbers)){
		return badResp("Не найдено номеров, принадлежащих текущему пулу")
	}

	//Получение не использованых номеров
	var not_used_ke_numbers = [];
	for(var i = 0; i < ke_numbers.length; i++){
		var ke_number = ke_numbers[i];
		if(isEmptyString(ke_number.marking_method) && ke_number.number_status == 'f0849fb8-def2-405d-9166-d4c8866202b6'){
			not_used_ke_numbers.push(ke_number);
		}
	}
	
	if(isEmptyOrNullArray(not_used_ke_numbers)){
		return badResp("Не найдено номеров, свободных для выделения")
	}

	//Проверка что количество не использованных номеров не меньше количества запрашиваемых номеров
	if(pool_numbers_count > not_used_ke_numbers.length){
		return badResp(String().concat("Невозможно выделить запрашиваемое количество номеров. Свободно номеров - ", not_used_ke_numbers.length))
	}

	//Получение способа маркировки из таблицы (reccode 2, т.к. это Data-matrix маркировка)
	var marking_methods = db.findbyparams("dictionary_method_of_marking", {
		reccode: "2"
	});
	if(isEmptyOrNullArray(marking_methods)){
		return badResp("Способ маркировки не найден в системе.");
	}
	var marking_method = marking_methods[0];

	//Обновление записей с номерами
	for(var i = 0; i < pool_numbers_count; i++){
		var not_used_ke_number = not_used_ke_numbers[i];
		not_used_ke_number.marking_method = marking_method.recid;
		db.update("ke_numbers", not_used_ke_number);
	}
	return successResp(String().concat("Успешно выделено ", pool_numbers_count.toString(), " номеров под Data-matrix маркировку"));
}

/**
 * Выделить номера под ударно-точечный метод маркировки
 * @param {*} params 
 */
function create_pool_for_shockpoint(params){
	//Валидация
	if(isEmptyString(params.pool_numbers_count)){
		return badResp("Поле \"Количество выделяемых УИН\" не может быть пустым");
	}
	var pool_numbers_count = parseInt(params.pool_numbers_count);

	var app_record = db.findbyrecid("rfid_request", params.recid);
	if(isNullObject(app_record)){
		return badResp("Запись заявления не найдена в системе");
	}

	//Получение номеров в пуле
	var ke_numbers = db.findbyparams("ke_numbers", {
		rfid_request: app_record.recid
	});
	if(isEmptyOrNullArray(ke_numbers)){
		return badResp("Не найдено номеров, принадлежащих текущему пулу")
	}

	//Получение не использованых номеров
	var not_used_ke_numbers = [];
	for(var i = 0; i < ke_numbers.length; i++){
		var ke_number = ke_numbers[i];
		if(isEmptyString(ke_number.marking_method) && ke_number.number_status == 'f0849fb8-def2-405d-9166-d4c8866202b6'){
			not_used_ke_numbers.push(ke_number);
		}
	}
	
	if(isEmptyOrNullArray(not_used_ke_numbers)){
		return badResp("Не найдено номеров, свободных для выделения")
	}

	//Проверка что количество не использованных номеров не меньше количества запрашиваемых номеров
	if(pool_numbers_count > not_used_ke_numbers.length){
		return badResp(String().concat("Невозможно выделить запрашиваемое количество номеров. Свободно номеров - ", not_used_ke_numbers.length))
	}

	//Получение способа маркировки из таблицы (reccode 3, т.к. это маркировка ударно-точечным методом)
	var marking_methods = db.findbyparams("dictionary_method_of_marking", {
		reccode: "3"
	});
	if(isEmptyOrNullArray(marking_methods)){
		return badResp("Способ маркировки не найден в системе.");
	}
	var marking_method = marking_methods[0];

	//Обновление записей с номерами
	for(var i = 0; i < pool_numbers_count; i++){
		var not_used_ke_number = not_used_ke_numbers[i];
		not_used_ke_number.marking_method = marking_method.recid;
		db.update("ke_numbers", not_used_ke_number);
	}
	return successResp(String().concat("Успешно выделено ", pool_numbers_count.toString(), " номеров под маркировку ударно-точечным методом"));
}

/**
 * Подписать заявления на выпуск УИН (workflow)
 * @param {*} params 
 */
function sign_rfid_request_applications(params){

	var applications_recid = JSON.stringify(params.recordIdList);
	var paramteres = {
		"recid_applications": applications_recid,
		"table_name": "rfid_request",
		"field_name_file": "application_file"
	}
	//Вызываем метод из плагина
    var res = plugins.callAsMethod("/plugins/nbdlogicplugin/sign_applications", "post", paramteres, null);
	return res;
}

/**
 * Подписать заявления на выпуск УИН (пакетно)
 * @param {*} params 
 */
function sign_rfid_request_applications_multiple(params){
	var rfid_request_records = params.recordIdList;
	var rfid_request_arr = [];
	for (let j = 0; j < rfid_request_records.length; j++) {
		var application = db.findbyrecid("rfid_request", rfid_request_records[j]);
		rfid_request_arr.push(application);
	}
	
	/* var applications = db.findbyparams("rfid_request", {
		rfid_request_status: 5
	}) */
	if(isEmptyOrNullArray(rfid_request_arr)){
		return {
			success: true,
			message: "Не найдено заявлений для подписи",
			data: []
		}
	}

	//Получение приложенных файлов
	var files_to_sign = [];
	for(var i = 0; i < rfid_request_arr.length; i++){
		var application = rfid_request_arr[i];
		var files_in_applications = getattachedfileincolumn("rfid_request", "application_file", application.recid);
		if(isEmptyOrNullArray(files_in_applications)){
			files_in_applications = [];
		}
		for(var j = 0; j < files_in_applications.length; j++){
			var file_in_application = files_in_applications[j];
			files_to_sign.push(file_in_application.recId);
		}
	}
	if(isEmptyOrNullArray(files_to_sign)){
		return {
			success: true,
			message: "Не найдено файлов для подписи",
			data: []
		}
	}else{
		return {
			success: true,
			message: String().concat("Найдено ", files_to_sign.length.toString(), " файлов для подписи"),
			data: files_to_sign
		}
	}
}

/**
 * Создать и привязать узел распределенного хранилища данных
 * @param {*} params 
 */
function process_form_and_create_blockchain_node(params){
	var member = db.findbyrecid("reestr_members", params.recid);
	if(isNullObject(member)){
		return badResp("Не удалось получить запись участника")
	}
	//Валидация обязательных входящих параметров
	//Узел распределенной сети 
	if(isEmptyString(params.node_ip)){
		return {
			success: false,
			message: "Поле \"Узел распределенной сети\" не может быть пустым",
			closeForm: false
		}
	}
	//ID узла 
	if(isEmptyString(params.node_id)){
		return {
			success: false,
			message: "Поле \"ID узла\" не может быть пустым",
			closeForm: false
		}
	}

	//Создание записи в Узлы блокчейна
	var reestr_nodes_params = {
		node_id: params.node_id,
		recdescription: params.node_description,
		ip_address: params.node_ip,
		reg_date: new Date(),
		is_actual: true
	}

	var reestr_nodes_record = db.insert("reestr_nodes", reestr_nodes_params);
	if(isNullObject(reestr_nodes_params)){
		return {
			success: false,
			message: "Не удалось создать запись в Узлы блокчейна",
			closeForm: false
		}
	}

	//Обновление участника
	member.idclientnode = reestr_nodes_record.recid;

	//Обновление заявления
	if(!isEmptyString(member.application_id)){
		var application = db.findbyrecid("reestr_applications_for_participation", member.application_id);
		if(!isNullObject(application)){
			application.blockchain_node = reestr_nodes_record.recid;
			db.update("reestr_applications_for_participation", application);
		}
	}

	var reestr_members_updres = db.update("reestr_members", member);
	if(!reestr_members_updres){
		return {
			success: false,
			message: "Не удалось обновить узел в записи участника",
			closeForm: false
		} 
	}

	return {
		success: true,
		message: "Узел распределенной сети успешно создан и привязан к участнику",
		closeForm: true
	}  
}

/**
 * Заполнение номера партии reestr_batch
 * @param {*} params 
 */
function reestr_batch_getnumber_method(params){
	
	var application_record = db.findbyrecid("reestr_batch", params.recid);

		if(isNullObject(application_record)){
			return badResp("Невозможно получить текущую запись");
		}

		//Получение владельца
		var user = getcurrentuser();

		if(isNullObject(user)){
			return badResp("Невозможно получить текущего пользователя");
		}

		var member = getmemberbyuserwithrecid(user.recid);
	  
		if(isNullObject(member)){
			return badResp("Заявитель не найден в системе");
		}

	 //номер заявления. генерируем, если не заполнено
	 if(isEmptyString(application_record.batch_number))
	 application_record.batch_number = member.unique_member_identifier + "-P-"+ get_autoincremented_idx("batch_index").toString();
 
	 var updres = db.update("reestr_batch", application_record);
	if(!updres){
		return badResp("Не удалось обновить запись заявления");
	}

	return successResp("Номер успешно присвоен");
}

// Переопредление кнопки Добавить. Данный метод выолпнятеся (в справочнике климотических исполнений), когда нажимаем Добавить
// https://rm.mfc.ru/issues/39191
/**
 * Заполнение кода dictionary_climatic_version
 * @param {*} data 
 */
function dictionary_climatic_version_onadd(data){
	
	var record = null;      
	
	record	= db.insert("dictionary_climatic_version", 
		{              
			reccode: get_autoincremented_idx("reccode")          
		});    

		delete record["@odata.context"];
	 
		record.recstate = 0;    
	   
		db2.update("dictionary_climatic_version", record);

	return {
		success: true,
		message: "Новая запись создана",
		data: record
	};
}

// Переопредление кнопки Добавить. Данный метод выолпнятеся (в Реестре заявлений на паспортизацию), когда нажимаем Добавить
// https://rm.mfc.ru/issues/39690
/**
 * Заполнение кода reestr_applications_for_participation
 * @param {*} data 
 */
function reestr_applications_for_participation_onadd(data){
	
	var record = null;      
	var newValueResult = rdev.generateSerial("AkuNumbers");
	if (!newValueResult.success)
	return {
		success: false,
		message: "Номер не сгенерирован",
		data: null
	}; 
 
	record	= db.insert("reestr_applications_for_participation", 
		{              
			aku_number: String().concat("АКУ/2/", newValueResult.data),
			aku_date: new Date()
		});    

		delete record["@odata.context"];
	 
		record.recstate = 0;    
	   
		db2.update("reestr_applications_for_participation", record);

	return {
		success: true,
		message: "Новая запись создана",
		data: record
	};
}

// Переопредление кнопки Добавить. Данный метод выолпнятеся (в Реестре заявлений на регистрацию КЭ), когда нажимаем Добавить
// https://rm.mfc.ru/issues/39690
/**
 * Заполнение кода reestr_applications_for_key_elements_registration
 * @param {*} data 
 */
function reestr_applications_for_key_elements_registration_onadd(data){
	
	var record = null;      
	var newValueResult = rdev.generateSerial("AkuNumbers");
	if (!newValueResult.success)
	return {
		success: false,
		message: "Номер не сгенерирован",
		data: null
	}; 
 
	record	= db.insert("reestr_applications_for_key_elements_registration", 
		{              
			aku_number: String().concat("АКУ/2/", newValueResult.data),
			aku_date: new Date()
		});    

		delete record["@odata.context"];
	 
		record.recstate = 0;    
	   
		db2.update("reestr_applications_for_key_elements_registration", record);

	return {
		success: true,
		message: "Новая запись создана",
		data: record
	};
}

// Переопредление кнопки Добавить. Данный метод выполняется (в заявлениях на регистрацию УИН), когда нажимаем Добавить 
// https://rm.mfc.ru/issues/40044
/**
 * Заполнение кода rfid_request
 * @param {*} params 
 */
function rfid_request_onadd(params){
	//Проверка полученных полей
	var fillingValidateErrors = [];
	//Количество уин
	if (isEmptyString(params.count)) {
		fillingValidateErrors.push("\"Количество УИН\"");
	}
	//Номер исходящего заявления
	if (isEmptyString(params.output_application_number)) {
		fillingValidateErrors.push("\"Номер исходящего\"");
	}

	if(isNotEmptyOrNullArray(fillingValidateErrors)){
		return badResp(fillingValidateErrors.length > 1 ? 
			String().concat("Поля ", fillingValidateErrors.join(", "), " не могут быть пустыми") : 
			String().concat("Поле ", fillingValidateErrors.join(", "), " не может быть пустым"));
	}

	//проверка правильности заполения полей
	var rightValidateErrors = [];

	//проверяем что количество УИН целое положительное число больше 0
	if(!/^([1-9]\d*)$/.test(params.count))
		rightValidateErrors.push("\"Количество УИН\" должно быть целым положительным числом");
	var count = parseFloat(params.count)
	if(count > 1000){
		rightValidateErrors.push("Невозможно создать заявление на генерацию более 1000 УИН");
	}

	if(isNotEmptyOrNullArray(rightValidateErrors)){
		return badResp(rightValidateErrors.join("; "));
	}
	
	var user = getcurrentuser();
	if (ischeckfields()){
		var userValidateErrors = [];
		if(isEmptyString(user.firstname)){
			userValidateErrors.push("\"Имя\" ");
		}

		if(isEmptyString(user.lastname)){
			userValidateErrors.push("\"Фамилия\" ");
		}

		if(isEmptyString(user.patronymic)){
			userValidateErrors.push("\"Отчество\" ");
		}

		if(isEmptyString(user.email)){
			userValidateErrors.push("\"Электронная почта\" ");
		}
		
		if(isNotEmptyOrNullArray(userValidateErrors)){
			return badResp(userValidateErrors.length > 1? 
				String().concat("Заполните в профиле пользователя поля ", userValidateErrors.join(", ")) :
				String().concat("Заполните в профиле пользователя поле ", userValidateErrors.join(", ")) );
		}
	}

	var user_fullname = String().concat(user.lastname , " ", user.firstname, " ", user.patronymic);

	var member = getmemberbyuserwithrecid(user.recid);
	if(isNullObject(member)){
		return badResp("Не удалось определить владельца пула номеров");
	}
	var reestr_members_fields = db.findbyrecid("reestr_members", member.recid); 
	if(isEmptyString(reestr_members_fields)){
		return badResp("Не найден заявитель в системе");
	}
	var branding_code = db.findbyrecid("dictionary_branding_codes", reestr_members_fields.branding_code);
	if(isNullObject(branding_code)){
		return badResp("Код клеймения не найден в системе");
	}
	
	// Создание новой записи
	var application_record = db.insert("rfid_request", {});
	// Получим теекщее значение даты и установим время и дату UTC+0
	var current_date = new Date();

	var report_params = {
		"full_name": reestr_members_fields.fullname,
		"short_name": String().concat(branding_code.recname, ", ", branding_code.code),
		"actual_adress": reestr_members_fields.actualadress,
		"email": reestr_members_fields.email,
		"inn": reestr_members_fields.inn,
		"ogrn": reestr_members_fields.ogrn,
		"applicant_name": user_fullname,
		"applicant_phone": user.phonenumber,
		"uinscount": params.count,
		"output_application_number": params.output_application_number,
		"output_application_date": current_date
	}

	//номер заявления
	application_record.application_number = String().concat(member.unique_member_identifier, "-", get_autoincremented_idx("application_number").toString());

	application_record.count = params.count;
	application_record.rfid_request_status = 5;
	application_record.requestor_id = member.recid;
	application_record.output_application_number = params.output_application_number;
	application_record.output_application_date = current_date;

	var updres = db.update("rfid_request", application_record);
	if(!updres){
		return badResp("Не удалось обновить запись заявления");
	}
	 //Формирование и прикладывание уведомления
	 var add_notice_res = prepare_and_add_notice("reportregisternumbersapplication", report_params, "application_file", "rfid_request", application_record.recid, String().concat("Заявление на генерацию УИН №", application_record.application_number));
	 if(!add_notice_res.success){
		 return add_notice_res;
	 }

	 return {
		success: true,
		message: "Заявление успешно сгенерировано",
		data: application_record
	};
}



/**
 * Обработка события OnOpen (переопределение события открытие записи)
 * Ссылка на задачу, в рамках которой была выполнена правка https://rm.mfc.ru/issues/40043
 * на 2020.06.23 реализовано для
 * Составные части
 * Сборочные единицы
 * Шаблоны составных частей 
 * Шаблоны сборочных единиц
 * Подсказка (искать в usr.json "events" после группы fields)
 * @param {Object} params {
 * 		tableName: "", наименование таблицы
 * 		recId: "" recid записи
 * }
 */
function onopen_event_override_method(params){
   
	// Параметры, которых будем отслеживать изменения 
	var params_arr = [
		"steel_grade",
		"autocoupler_model",
		"absorbing_device_body_model",
		"auto_mode_cargo_model",
		"specialization",
		"method_of_marking",
		"truck_model",
		"air_distributor_model",
		"truck_type",
		"class_absorbing_device"
	];

	// Т.к. необходимо информировать пользователя какие поля подвергнулись изменению
	// пришлось создать массив с расшифровкой наименований полей
	var name_params_arr = {
		"steel_grade" : "Марка материала",
		"autocoupler_model" : "Модель автосцепки",
		"absorbing_device_body_model" : "Модель корпуса поглощающего аппарата",
		"auto_mode_cargo_model": "Модель авторежим грузовой",
		"specialization": "Специализация",
		"method_of_marking": "Способ (тип) маркировки",
		"truck_model": "Модель тележки",
		"air_distributor_model": "Модель воздухораспределителя в сборе",
		"truck_type": "Тип тележки",
		"class_absorbing_device": "Класс поглощающего аппарата"
	}
	
	// Получаем текущую запись из текущей таблицы
	var current_table_fields = db.findbyrecid(params.tableName, params.recid);
	if (params.tableName == "reestr_key_elements") {
		// делаем проверку по статусу СЧ
		if (current_table_fields.statuske != "52c7de6f-1bc2-48a7-90b4-1b14264a01ab"){
			return {
				success: true,
				message: "СЧ не в статусе Готов к регистрации",
				data: null
			}
		}
	}
	if (params.tableName == "reestr_ke_nodes") {
		// делаем проверку по статусу СЕ
		if (current_table_fields.status != "a4b6de4f-828a-46a3-b272-73a1c345ae44"){
			return {
				success: true,
				message: "СЕ не в статусе Готов к регистрации",
				data: null
			}
		}
	}
	if (isNotNullObject(current_table_fields)){
		// Получаем recupdated из текущей записи
		var recupdated_current_table_fields_date = new Date(current_table_fields.recupdated);
		// Создаем пустой массив, куда будем записывать recupdated записей из справочника
		var recupdated_dictionary_date_arr = [];
		// Создаем пустой масси, куда будем записывать наименования справочников, где произошло изменение
		var name_dict_arr = [];
	   
		// Перебираем в цикле параметры, которые нужно отслеживать на изменение
		for (var i = 0; i < params_arr.length; i++) {
			var param_recid;    // recid параметра в справочнике
			var dictionary_param;   // в эту перемменную записываем запрос к соответствующему справочнику
			var recupdated_dictionary_date; // Сюда записываем дату последнего изменения параметра в справочнике
			var name_param = name_params_arr[params_arr[i]]; // Получаем наименование параметра
			var name_dict; // Сюда записываем наименование справочника
			if (current_table_fields[params_arr[i]]){
				switch (params_arr[i]) {
					// Марка материала
					case "steel_grade":
						param_recid = current_table_fields.steel_grade;
						dictionary_param = db.findbyrecid("dictionary_steel_grade", param_recid);
						name_dict = "Марка материала"
						break;
					// Модели автосцепки
					case "autocoupler_model":
						param_recid = current_table_fields.autocoupler_model;
						dictionary_param = db.findbyrecid("dictionary_couplings_models", param_recid);
						name_dict = "Модели автосцепки"
						break;
					// Модель корпуса поглощающего аппарата
					case "absorbing_device_body_model":
						param_recid = current_table_fields.absorbing_device_body_model;
						dictionary_param = db.findbyrecid("dictionary_absorbing_device_body_models", param_recid);
						name_dict = "Модели корпуса поглощающего аппарата"
						break;
					// Модель авторежим грузовой
					case "auto_mode_cargo_model":
						param_recid = current_table_fields.auto_mode_cargo_model;
						dictionary_param = db.findbyrecid("dictionary_auto_mode_cargo_models", param_recid);
						name_dict = "Модели авторежим грузовой"
						break;
					// Специализация 
					case "specialization":
						param_recid = current_table_fields.specialization;
						dictionary_param = db.findbyrecid("dictionary_specializations", param_recid);
						name_dict = "Специализация"
						break;
					// Способ (тип) маркировки
					case "method_of_marking":
						param_recid = current_table_fields.method_of_marking;
						dictionary_param = db.findbyrecid("dictionary_method_of_marking", param_recid);
						name_dict = "Способ маркировки"
						break;
					// Модели тележек
					case "truck_model":
						param_recid = current_table_fields.truck_model;
						dictionary_param = db.findbyrecid("dictionary_truck_models", param_recid);
						name_dict = "Модели тележек"
						break;
					// Модели воздухораспределителя в сборе
					case "air_distributor_model":
						param_recid = current_table_fields.air_distributor_model;
						dictionary_param = db.findbyrecid("dictionary_air_distributor_models", param_recid);
						name_dict = "Модели воздухораспределителя в сборе"
						break;
					// Типы тележек
					case "truck_type":
						param_recid = current_table_fields.truck_type;
						dictionary_param = db.findbyrecid("dictionary_type_cart", param_recid);
						name_dict = "Типы тележек"
						break;
					 // Класс поглощающего аппарата
					 case "class_absorbing_device":
						param_recid = current_table_fields.class_absorbing_device;
						dictionary_param = db.findbyrecid("dictionary_class_absorbing_device", param_recid);
						name_dict = "Класс поглощающего аппарата"
						break;
				
					default:
						break;
				}
				recupdated_dictionary_date = new Date(dictionary_param.recupdated);
				// Сравниваем даты последнего изменения в справочнике с датой последного изменения текущей записи
				// Если recupdated в справочнике > чем recupdated в текущей записи, то значит в справочнике параметр был изменене,
				// то и соответствено изменился в текущей записи 
				if (recupdated_dictionary_date.getTime() > recupdated_current_table_fields_date.getTime()) {
					recupdated_dictionary_date_arr.push(name_param); // записываем в массив наименование параметра который был изменен
					name_dict_arr.push(name_dict);  // записываем в массив наименование справочника, где был изменен параметр
				}
			}
		}

		if ((params.tableName == "reestr_parts_type" || params.tableName == "reestr_ke_node_types") && !current_table_fields.is_autoincrement_number)
		{
			current_table_fields.start_value = 1;
			current_table_fields.step = 1;
			current_table_fields.add_branding_code = false;
			current_table_fields.add_manufacture_year = false;
			current_table_fields.separator = null;

			db.update(params.tableName, current_table_fields);
		}

		if (recupdated_dictionary_date_arr.length > 0) {
			return {
				success: false,
				message: "Записи в справочниках \"" + name_dict_arr.toString() + "\" были изменены, в связи с чем могли быть обновлены значения параметров: \"" + recupdated_dictionary_date_arr.toString() + "\"",
				data: null
			}
		}  
	}
	return {
		success: true,
		message: "Изменений нет",
		data: null
	}
}
// инициализация значений default в реестре составных частей при нажатии Добавить
function init_params_scunnumber_oninit() {
	var params = {};
	params.reestr_parts_type = null;
	var reestr_key_elements_records = db.findbyparams("reestr_key_elements", {recstate: 1}, {reccreated: "DESC"},10);
	//выбираем последний созданный СЧ, у которого заполнен part_type 
	if(isNotEmptyOrNullArray(reestr_key_elements_records)){
		for(var i = 0; i< reestr_key_elements_records.length; i++){
			if(isNotEmptyString(reestr_key_elements_records[i].part_type)){
				params.reestr_parts_type = reestr_key_elements_records[i].part_type.toString();
				break;
			}
		}
	}
	return successResp( "Успешло выполнено", params);
}
/**
 * Создание записей в таблице Интеграция ЭИ
 * @param {*} reestr_members_recid      recid записи по новому участнику в реестре участников
 * @param {*} key_element_type          Тип СЧ
 * @param {*} assembly_unit_type		Тип СЕ
 * @param {*} is_integration            Признак интеграции с ЭИ, по умолчанию ставим false у всех
 * @param {*} is_consignee				Грузополучатель, при принятии заявления на участие в паспортизации ставим true
 */
function create_integration_electronic_inspector_records(reestr_members_recid, key_element_type, assembly_unit_type,  is_integration, is_consignee){

	var insert_record = db.insert("integration_electronic_inspector", {
		recstate: 1,
		member_identifier: reestr_members_recid,
		fullname_member: reestr_members_recid,
		key_element_code: key_element_type,
		is_integration: is_integration,
		ke_node_type: assembly_unit_type,
		is_consignee: is_consignee,
		xml_for_each_key_element: false
	})

	if(isNullObject(insert_record)){
		return badResp("Не удалось создать запись в таблице Интеграция ЭИ")
	}

	return {
		success: true,
		data: insert_record
	}
}

/**
 * Массовая подпись неподписанных архивов паспортгенератором
 * Возвращает идентификаторы файлов для подписания
 */
function sign_arhive_multiple_applications(params){
	//Получение всех записей
	/* var all_records = db.findbyparams("reestr_applications_for_key_elements_registration", {
		recstate: 1,
		status: "c63d14c0-3464-4849-af6b-7446b4129dd9"
	})
	
	if(isEmptyOrNullArray(all_records)){
		return {
			success: true,
			message: "Не найдено файлов для подписи",
			data: []
		}
	} */

	var reestr_applications_for_key_elements_registration_records = params.recordIdList;
	var reestr_applications_for_key_elements_registration_arr = [];
	for (let j = 0; j < reestr_applications_for_key_elements_registration_records.length; j++) {
		var reestr_applications_for_key_elements_registration_record = db.findbyrecid("reestr_applications_for_key_elements_registration", reestr_applications_for_key_elements_registration_records[j]);
		reestr_applications_for_key_elements_registration_arr.push(reestr_applications_for_key_elements_registration_record);
	}
	
	/* var applications = db.findbyparams("rfid_request", {
		rfid_request_status: 5
	}) */
	if(isEmptyOrNullArray(reestr_applications_for_key_elements_registration_arr)){
		return {
			success: true,
			message: "Не найдено заявлений для подписи",
			data: []
		}
	}

	var files_to_sign = [];
	
	//Получение файлов для подписи
	for(var i = 0; i < reestr_applications_for_key_elements_registration_arr.length; i++){
		var record = reestr_applications_for_key_elements_registration_arr[i];

		var attached_files = getattachedfileincolumn("reestr_applications_for_key_elements_registration", "generated_application_file", record.recid);
		if(!isEmptyOrNullArray(attached_files)){
			//Добавление неподписанных файлов в массив
			for(var j = 0; j < attached_files.length; j++){
				var attached_file = attached_files[j];
				files_to_sign.push(attached_file.recId);
			}
		}
	}

	//Если файлов для подписания не найдено, выводим сообщение
	if(files_to_sign.length <= 0){
		return {
			success: true,
			message: "Не найдено файлов для подписания",
			data: []
		}
	}

	return {
		success: true,
		message: String().concat("Найдено файлов для подписания: ", files_to_sign.length),
		data: files_to_sign
	}
}

//Перестать учитывать как участника вагоносборки
function set_partner_assembly_vehicle_false(params){
	params.partner_assembly_vehicle = false;
	//Вызываем метод из плагина
	var res = plugins.callAsMethod("/plugins/nbdlogicplugin/setpartnerassemblyvehicle", "post", params, null);
	return res;
}

//Сделать участником вагоносборки
function set_partner_assembly_vehicle_true(params){
	params.partner_assembly_vehicle = true;
	//Вызываем метод из плагина
	var res = plugins.callAsMethod("/plugins/nbdlogicplugin/setpartnerassemblyvehicle", "post", params, null);
	return res;
}
/**
 * Отправить результат владельцу пакетно (заявление на выпуск пула УИН)
 * @param {*} params 
 */
function send_rfid_request_application_result_multy(params){

	// https://rm.mfc.ru/issues/38786 07.05.2020 imironov 
	 // Переделал методы на использование workflow sign_rfid_request_application_result_and_send для таблицы rfid_request
	 var recid = null;
 
	 if(params.recid!=null)
	 {
		 // Если метод вызван по кнопке, то используем params.recid.
		 recid = params.recid
	 }
	 else if(isEmptyOrNullArray(params.recordIdList) == false)
	 {
		 // Если метод вызван как метод воркфлоу, то recordIdList - массив идентификаторов записей.
		 recid = params.recordIdList[0];
	 }
 
	 return plugins.callAsMethod(
		 "/plugins/nbdlogicplugin/send_results_for_rfid_request/"+recid,
		 "post",
		 null,
		 null
	 );
 }

 /**
 * Метод установки флагов Учет изготовления и Учет установки в АРМ производителя пакетно
 * В момент отправки результата владельцу
 * (workflow)
 * https://rm.mfc.ru/issues/41231 27.07.2020 a.polunina
 * перенос в плагин https://rm.mfc.ru/issues/57151 n.borodin
 * @param {*} params 
 */
function send_allows_flags_to_arm_manufacturer_multy(params){
	//Вызываем метод из плагина
	var res = plugins.callAsMethod("/plugins/nbdlogicplugin/send_allows_flags_to_arm_manufacturer_multy", "post", params, null);
	return res;   
}

function send_application_result_multy(params){
	//Вызываем метод из плагина
	var res = plugins.callAsMethod("/plugins/nbdlogicplugin/send_application_result_multy", "post", params, null);
	return res;  
}

function add_xml_file(params){

	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
	var parameters = {
		"file_recid": params.files[0]
	}
	
    //Вызываем метод из плагина
    var res = plugins.callAsMethod("/plugins/nbdlogicplugin/addxmlfilefrominterface", "post", parameters, null);
    return res;
	
}