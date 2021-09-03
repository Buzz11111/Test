var commonAssemblyElementTypes = {
	node_id: "3607f67c-c619-43bd-bd9c-90acff9a5f28",
	assembly_unit_id: "62b3559e-10da-4189-8b25-d558ba451ac8"
};

var eventTypeEnum = {
	"Info": 1,
	"Debug": 2,
	"Warning": 3,
	"Error": 4
};

/**
 * Сборка СЕ (Оператор ржд)
 * @param {*} params 
 */
function rzd_op_assemblyunitscannumbers(params){
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
	//Проверка поля "Владелец".
	if(isEmptyString(params.member)){
		return badResp("Поле \"Владелец\" не может быть пустым");
	}
	var member = db.findbyrecid("reestr_members", params.member);
	if(isNullObject(member)){
		return badResp("Владелец не найден в системе");
	}
	params.member = null;
	params.memberid = member.recid;

	return assemblyunitscannumbers(params);
}

function assemblyunitscannumbers(params) {
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
	var headers = {
		"Content-Type": "application/json"
	};
	var headers = addAuthHeader(headers);
	var url = String().concat(host, "/plugins/nbdlogicplugin/groupassemblyunit/", params.recid.toString())
	var res = fetch(url, {
		headers: headers,
		"body": JSON.stringify(params),
		"Method": "post"
	});
	if(isNotEmptyString(res.data)){
		return JSON.parse(res.data)
	}else{
		return res;
	}
}

/**
 * Копирование datamatrix из карточки ke_numbers в reestr_ke_nodes
 * @param {*} uinid recid УИН узла
 * @param {*} nodeid recid узла
 */
function copybarcodetonode(uinid, nodeid){
		var attached_files = getattachedfiles("ke_numbers", uinid);
		if (!attached_files.success) {
			return attached_files;
		}
		
		var files_to_copy = [];
		attached_files = attached_files.data;
		for (var i = 0; i < attached_files.length; i++) {
	
			if (attached_files[i].columnName == "barcode") {
				var fileUrl = String().concat(host, "/api/files/download/", attached_files[i].recId);
	
				files_to_copy.push({
					entityId: nodeid,
					entityName: "reestr_ke_nodes",
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

/**
 * Проверка состава(комплектации) СЕ
 * @param {*} key_elements	 Массив СЧ входящих в СЕ
 * @param {*} assembly_unit		Объект СЕ
 * @param {*} check_less 	Флаг, указывающий на то, что нужно проверять комплектацию на меньшее число
 */
function checkAssemblyUnitComposition(key_elements, assembly_unit, check_less) {
	var dictionary_count_key_elements_by_node_type_records = db.findbyparams("dictionary_count_key_elements_by_node_type", {
		"ke_node_type": assembly_unit.ke_node_type,
		"scheme": assembly_unit.documentation_number
	});
	if (isEmptyOrNullArray(dictionary_count_key_elements_by_node_type_records)) {
		return {
			"success": false,
			"message": "Для чертежа, указанного в шаблоне узла/СЕ, не найдена запись в справочнике Кол-во СЧ/СЕ в СЕ/узле"
		};
	}
	var dictionary_count_key_elements_by_node_type_record = dictionary_count_key_elements_by_node_type_records[0];
	var side_frame_count = 0;
	var pressure_beam_count = 0;
	var wheel_count = 0;
	var friction_strip_count = 0;
	var brace_count = 0;
	var bearing_adapter_count = 0;
	var friction_wedge_count = 0;
	var slider_body_count = 0;
	var slider_cap_count = 0
	var clear_axis_count = 0;
	var wedge_pockets_count = 0
	var saddle_ring_count = 0;
	var wedge_pockets_inserts_count = 0;
	var saddle_bearing_count = 0;
	var elevator_roll_count = 0;
	var auto_coupler_count = 0;
	var lock_count = 0;
	var bearing_node_count = 0;
	var spring_slider_inside_count = 0;
	var spring_slider_outside_count = 0;
	var spring_otside_after_count = 0;
	var spring_inside_after_count = 0;
	var rough_axis_count = 0;


	var errors = []
	for (var i = 0; i < key_elements.length; i++) {
		var reestr_key_element = key_elements[i];
		// //Eсли Балка надрессорная, Рама боковая, то проверяем наличие параметра "Год окончания гамма-процентного ресурса детали"
		// if(reestr_key_element.key_element_code == "477d0c01-84d3-441c-9bb9-15f9d609671d" || reestr_key_element.key_element_code == "b28e1a4f-d340-4ce0-a37a-d84dcfa1b6fb"){
		// 	if(isEmptyString(reestr_key_element.gamma_percent_resource_end_date)){
		// 		errors.push("Необходимо заполнить поле \"Год окончания гамма-процентного ресурса детали\", УИН: " + reestr_key_element.numberke)
		// 	}
		// }
		// Подсчет типов элементов
		event.log("reestr_ke_nodes",
			assembly_unit.recid,
			"Сканирование СЧ в СЕ Подсчет типов элементов",
			eventTypeEnum.Info,
			assembly_unit);
		var dictionary_key_elements_code = db.findbyrecid("dictionary_key_elements_codes", reestr_key_element.key_element_code);
		if (dictionary_key_elements_code != null) {
			switch (dictionary_key_elements_code.reccode) {
				case keyElementCodes.wheel_code:
					wheel_count++;
					break;
				case keyElementCodes.side_frame_code:
					side_frame_count++;
					break;
				case keyElementCodes.friction_strip_code:
					friction_strip_count++;
					break;
				case keyElementCodes.brace_code:
					brace_count++;
					break;
				case keyElementCodes.pressure_beam_code:
					pressure_beam_count++;
					break;
				case keyElementCodes.slider_body_code:
					slider_body_count++;
					break;
				case keyElementCodes.slider_cap_code:
					slider_cap_count++;
					break;
				case keyElementCodes.friction_wedge_code:
					friction_wedge_count++;
					break;
				case keyElementCodes.bearing_adapter_code:
					bearing_adapter_count++;
					break;
				case keyElementCodes.clear_axis_code:
					clear_axis_count++;
					break;
				case keyElementCodes.wedge_pockets_code:
					wedge_pockets_count++;
					break;
				case keyElementCodes.saddle_ring_code:
					saddle_ring_count++;
					break;
				case keyElementCodes.wedge_pockets_inserts_code:
					wedge_pockets_inserts_count++;
					break;
				case keyElementCodes.saddle_bearing_code:
					saddle_bearing_count++;
					break;
				case keyElementCodes.elevator_roll_code:
					elevator_roll_count++;
					break;
				case keyElementCodes.auto_coupler_code:
					auto_coupler_count++;
					break;
				case keyElementCodes.lock_code:
					lock_count++;
					break;
				case keyElementCodes.bearing_node_code:
					bearing_node_count++;
					break
				case keyElementCodes.spring_slider_inside_code:
					spring_slider_inside_count++;
					break
				case keyElementCodes.spring_slider_outside_code:
					spring_slider_outside_count++;
					break
				case keyElementCodes.spring_outside_code:
					spring_otside_after_count++;
					break
				case keyElementCodes.spring_inside_code:
					spring_inside_after_count++;
					break
				case keyElementCodes.rough_axis_code:
					rough_axis_count++;
					break;
			}
		} else {
			return badResp("Код СЧ не найден в справочнике условных кодов деталей");
		}
	}

	//Сравнение полученного количества СЧ с максимально возможным
	event.log("reestr_ke_nodes",
		assembly_unit.recid,
		"Сканирование СЧ в СЕ Сравнение полученного количества СЧ с максимально возможным",
		eventTypeEnum.Info,
		assembly_unit);

	if (dictionary_count_key_elements_by_node_type_record.wheel_count < wheel_count) {
		errors.push("Превышено количество колес, максимум " + dictionary_count_key_elements_by_node_type_record.wheel_count);
	} else if (dictionary_count_key_elements_by_node_type_record.wheel_count > wheel_count && check_less) {
		errors.push("Количество колес меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.wheel_count);
	}

	if (dictionary_count_key_elements_by_node_type_record.side_frame_count < side_frame_count) {
		errors.push("Превышено количество боковых рам, максимум " + dictionary_count_key_elements_by_node_type_record.side_frame_count)
	} else if (dictionary_count_key_elements_by_node_type_record.side_frame_count > side_frame_count && check_less) {
		errors.push("Количество боковых рам меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.side_frame_count)
	}

	if (dictionary_count_key_elements_by_node_type_record.friction_strip_count < friction_strip_count) {
		errors.push("Превышено количество фрикционных планок, максимум " + dictionary_count_key_elements_by_node_type_record.friction_strip_count)
	} else if (dictionary_count_key_elements_by_node_type_record.friction_strip_count > friction_strip_count && check_less) {
		errors.push("Количество фрикционных планок меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.friction_strip_count)
	}

	if (dictionary_count_key_elements_by_node_type_record.brace_count < brace_count) {
		errors.push("Превышено количество скоб, максимум " + dictionary_count_key_elements_by_node_type_record.brace_count);
	} else if (dictionary_count_key_elements_by_node_type_record.brace_count > brace_count && check_less) {
		errors.push("Количество скоб меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.brace_count);
	}

	if (dictionary_count_key_elements_by_node_type_record.pressure_beam_count < pressure_beam_count) {
		errors.push("Превышено количество балок надрессорных, максимум " + dictionary_count_key_elements_by_node_type_record.pressure_beam_count);
	} else if (dictionary_count_key_elements_by_node_type_record.pressure_beam_count > pressure_beam_count && check_less) {
		errors.push("Количество балок надрессорных меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.pressure_beam_count);
	}

	if (dictionary_count_key_elements_by_node_type_record.slider_body_count < slider_body_count) {
		errors.push("Превышено количество корпусов скользуна, максимум " + dictionary_count_key_elements_by_node_type_record.slider_body_count);
	} else if (dictionary_count_key_elements_by_node_type_record.slider_body_count > slider_body_count && check_less) {
		errors.push("Количество корпусов скользуна меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.slider_body_count);
	}

	if (dictionary_count_key_elements_by_node_type_record.slider_cap_count < slider_cap_count) {
		errors.push("Превышено количество колпаков скользуна, максимум " + dictionary_count_key_elements_by_node_type_record.slider_cap_count);
	} else if (dictionary_count_key_elements_by_node_type_record.slider_cap_count > slider_cap_count && check_less) {
		errors.push("Количество колпаков скользуна меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.slider_cap_count);
	}

	if (dictionary_count_key_elements_by_node_type_record.friction_wedge_count < friction_wedge_count) {
		errors.push("Превышено количество фрикционных клинов, максимум " + dictionary_count_key_elements_by_node_type_record.friction_wedge_count);
	} else if (dictionary_count_key_elements_by_node_type_record.friction_wedge_count > friction_wedge_count && check_less) {
		errors.push("Количество фрикционных клинов меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.friction_wedge_count);
	}

	if (dictionary_count_key_elements_by_node_type_record.bearing_adapter_count < bearing_adapter_count) {
		errors.push("Превышено количество адаптеров подшипника, максимум " + dictionary_count_key_elements_by_node_type_record.bearing_adapter_count);
	} else if (dictionary_count_key_elements_by_node_type_record.bearing_adapter_count > bearing_adapter_count && check_less) {
		errors.push("Количество адаптеров подшипника меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.bearing_adapter_count);
	}

	if (dictionary_count_key_elements_by_node_type_record.clear_axis_count < clear_axis_count) {
		errors.push("Превышено количество чистовых осей, максимум " + dictionary_count_key_elements_by_node_type_record.clear_axis_count);
	} else if (dictionary_count_key_elements_by_node_type_record.clear_axis_count > clear_axis_count && check_less) {
		errors.push("Количество чистовых осей меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.clear_axis_count);
	}

	if (dictionary_count_key_elements_by_node_type_record.wedge_pockets_count < wedge_pockets_count) {
		errors.push("Превышено количество пластин в клиновых карманах, максимум " + dictionary_count_key_elements_by_node_type_record.wedge_pockets_count);
	} else if (dictionary_count_key_elements_by_node_type_record.wedge_pockets_count > wedge_pockets_count && check_less) {
		errors.push("Количество пластин в клиновых карманах меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.wedge_pockets_count);
	}

	if (dictionary_count_key_elements_by_node_type_record.saddle_ring_count < saddle_ring_count) {
		errors.push("Превышено количество колец в подпятник, максимум " + dictionary_count_key_elements_by_node_type_record.saddle_ring_count);
	} else if (dictionary_count_key_elements_by_node_type_record.saddle_ring_count > saddle_ring_count && check_less) {
		errors.push("Количество колец в подпятник меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.saddle_ring_count);
	}

	if (dictionary_count_key_elements_by_node_type_record.wedge_pockets_inserts_count < wedge_pockets_inserts_count) {
		errors.push("Превышено количество вставок в клиновые карманы, максимум " + dictionary_count_key_elements_by_node_type_record.wedge_pockets_inserts_count);
	} else if (dictionary_count_key_elements_by_node_type_record.wedge_pockets_inserts_count > wedge_pockets_inserts_count && check_less) {
		errors.push("Количество вставок в клиновые карманы меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.wedge_pockets_inserts_count);
	}

	if (dictionary_count_key_elements_by_node_type_record.saddle_bushing_count < saddle_bearing_count) {
		errors.push("Превышено количество вкладышей подпятника, максимум " + dictionary_count_key_elements_by_node_type_record.saddle_bushing_count);
	} else if (dictionary_count_key_elements_by_node_type_record.saddle_bushing_count > saddle_bearing_count && check_less) {
		errors.push("Количество вкладышей подпятника меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.saddle_bushing_count);
	}


	if (dictionary_count_key_elements_by_node_type_record.elevator_roll_count < elevator_roll_count) {
		errors.push("Превышено количество валиков подъемника, максимум " + dictionary_count_key_elements_by_node_type_record.elevator_roll_count);
	} else if (dictionary_count_key_elements_by_node_type_record.elevator_roll_count > elevator_roll_count && check_less) {
		errors.push("Количество валиков подъемника меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.elevator_roll_count);
	}

	if (dictionary_count_key_elements_by_node_type_record.auto_coupler_count < auto_coupler_count) {
		errors.push("Превышено количество корпусов автосцепки, максимум " + dictionary_count_key_elements_by_node_type_record.auto_coupler_count);
	} else if (dictionary_count_key_elements_by_node_type_record.auto_coupler_count > auto_coupler_count && check_less) {
		errors.push("Количество корпусов автосцепки меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.auto_coupler_count);
	}

	if (dictionary_count_key_elements_by_node_type_record.lock_count < lock_count) {
		errors.push("Превышено количество замков, максимум  " + dictionary_count_key_elements_by_node_type_record.lock_count);
	} else if (dictionary_count_key_elements_by_node_type_record.lock_count > lock_count && check_less) {
		errors.push("Количество замков меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.lock_count);
	}

	if (dictionary_count_key_elements_by_node_type_record.bearing_node < bearing_node_count) {
		errors.push("Превышено количество подшипников буксового узла, максимум " + dictionary_count_key_elements_by_node_type_record.bearing_node);
	} else if (dictionary_count_key_elements_by_node_type_record.bearing_node > bearing_node_count && check_less) {
		errors.push("Количество подшипников буксового узла меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.bearing_node);
	}

	if (dictionary_count_key_elements_by_node_type_record.spring_slider_inside < spring_slider_inside_count) {
		errors.push("Превышено количество пружин скользуна внутренних, максимум " + dictionary_count_key_elements_by_node_type_record.spring_slider_inside);
	} else if (dictionary_count_key_elements_by_node_type_record.spring_slider_inside > spring_slider_inside_count && check_less) {
		errors.push("Количество пружин скользуна внутренних меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.spring_slider_inside);
	}

	if (dictionary_count_key_elements_by_node_type_record.spring_slider_outside < spring_slider_outside_count) {
		errors.push("Превышено пружин скользуна наружних, максимум " + dictionary_count_key_elements_by_node_type_record.spring_slider_outside);
	} else if (dictionary_count_key_elements_by_node_type_record.spring_slider_outside > spring_slider_outside_count && check_less) {
		errors.push("Количество пружин скользуна наружних меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.spring_slider_outside);
	}

	if (dictionary_count_key_elements_by_node_type_record.spring_otside_after < spring_otside_after_count) {
		errors.push("Превышено пружин рессорного подвешивания наружних, максимум " + dictionary_count_key_elements_by_node_type_record.spring_otside_after);
	} else if (dictionary_count_key_elements_by_node_type_record.spring_otside_after > spring_otside_after_count && check_less) {
		errors.push("Количество пружин рессорного подвешивания наружних меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.spring_otside_after);
	}

	if (dictionary_count_key_elements_by_node_type_record.spring_inside_after < spring_inside_after_count) {
		errors.push("Превышено пружин рессорного подвешивания внутренних, максимум " + dictionary_count_key_elements_by_node_type_record.spring_inside_after);
	} else if (dictionary_count_key_elements_by_node_type_record.spring_inside_after > spring_inside_after_count && check_less) {
		errors.push("Количество пружин рессорного подвешивания внутренних меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.spring_inside_after);
	}

	if (dictionary_count_key_elements_by_node_type_record.rough_axis_count < rough_axis_count) {
		errors.push("Превышено количество черновых осей, максимум " + dictionary_count_key_elements_by_node_type_record.rough_axis_count);
	} else if (dictionary_count_key_elements_by_node_type_record.rough_axis_count > rough_axis_count && check_less) {
		errors.push("Количество черновых осей меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.rough_axis_count);
	}

	if (errors.length == 0) {
		return {
			"success": true
		}
	} else {
		var error_message = errors.join(";<br>");
		
		return {
			"success": false,
			"message": error_message
		}
	}
}

/**
 * Валидация сборочной единицы на уникальность по параметрам
 * manufacturer_details Сведения об изготовителе
 * manufacturer_number Номер по системе предприятия изготовителя
 * formation_date Дата изготовления
 * ke_node_type тип СЕ
 * Среди тех, что уже выпущены в обращение
 * @param {*} params 
 */
function validate_dublicate_nodes(params){
	//выбираем все СЕ с набором одинаковых параметров, которые корректно обрабатывает findbyparams
	//остальные проверяем далее
	var dublicate_key_elements = db.findbyparams("reestr_ke_nodes", {
			"manufacturer_details": params.manufacturer_details,
			//"manufacturer_number": params.manufacturer_number,
			"ke_node_type": params.ke_node_type
		});
	if(isNotEmptyOrNullArray(dublicate_key_elements)){
		for (let i = 0; i < dublicate_key_elements.length; i++) {
			//Проверяем что совпадают номера по системе предприятия изготовителя
			if (dublicate_key_elements[i].manufacturer_number == params.manufacturer_number) {
				//Проверяем что узел выпущен в обращение
				//"Выпущен в обращение", "Установлен на ТС", "Перенесен в родительский узел"
				if(dublicate_key_elements[i].status == "823cc6e9-465b-416e-beda-8a642149c235" //Выпущен в обращение
					|| dublicate_key_elements[i].status == "01d8f0ce-28db-4d3d-a956-38bb26260437" //Перенесен в родительский узел
					|| dublicate_key_elements[i].status == "f831cffa-e2ce-417f-8b4f-1645715bd454" //Установлен на ТС
					|| dublicate_key_elements[i].status == "25d67987-0cd4-404a-85d7-847d142af11f" //Снят с ТС
					){
					var date_params = new Date(params.formation_date);
					date_params.setHours(date_params.getUTCHours() + 3);
					date_params.setUTCHours(0, 0, 0, 0);
					var date_exist = new Date(dublicate_key_elements[i].formation_date);
					date_exist.setHours(date_exist.getUTCHours() + 3);
					date_exist.setUTCHours(0, 0, 0, 0);

					if (date_params.getTime() == date_exist.getTime()){
						return badResp("В системе уже зарегистрирована СЕ такого типа с указанными  \"Дата изготовления\", \"Номер по системе предприятия изготовителя\", \"Сведения об изготовителе\" ")
					}
				}
			}
		}
	}
	return successResp();
}

/**
 * Выпуск сборочной единицы в обращение (Оператор РЖД)
 * @param {*} params 
 */
function rzd_op_registerassemblyunitasgood(params){
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
	var assembly_unit = db.findbyrecid("reestr_ke_nodes", params.recid);
	if(isNullObject(assembly_unit)){
		return badResp("Сборочная единица не найдена в системе");
	}
	if(isEmptyString(assembly_unit.manufacturer_details)){
		return badResp("В паспорте сборочной единицы не указаны сведения об изготовителе");
	}
	var member = db.findbyrecid("reestr_members", assembly_unit.manufacturer_details);
	if(isNullObject(member)){
		return badResp("Изготовитель не найден в системе");
	}
	params.memberid = member.recid;
	return registerassemblyunitasgood(params);
}

/**
 * (Выпуск СЕ в обращение) формирование электронного паспорта
 * @param {*} params 
 */
function formnodepassportfile(params){
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
	var error_message_arr = []; //Создаем пустой массив, куда будем записывать ошибки при формировании запроса и json паспорта
	var success_message_arr = []; //Создаем пустой массив, куда будем записывать успешные операции
	var result_arr = []; //Массив с результатами выполнения по каждому элементу для передачи в следующий метод (registerasgoodpassportfile)
	if(params.recordIdList != null){
		for(var i = 0; i < params.recordIdList.length; i++){
			var headers = {
				"Content-Type": "application/json"
			};
			var headers = addAuthHeader(headers);
			var url = String().concat(host, "/plugins/nbdlogicplugin/createassemblyunitpassport/", params.recordIdList[i].toString())
			var res = fetch(url, {
				headers: headers,
				"body": JSON.stringify(params),
				"Method": "post"
			});

			// Получаем ЭП СЕ, для получения его УИН
			var reestr_ke_nodes_fields = db.findbyrecid("reestr_ke_nodes", params.recordIdList[i]);
			// Формирования УИН в виде гиперссылки
			var enum_uin_key_element = "<a href=\"/tables/reestr_ke_nodes/"+  params.recordIdList[i] +"\" target=\"_blank\" class=\"alert-link\">"+ reestr_ke_nodes_fields.unique_number +"</a>";

			var result_parse = JSON.parse(res.data);

			if(isNotEmptyString(result_parse)){
				var replace_str = "СЕ";
				var new_str = replace_str + " " + enum_uin_key_element;
				if (result_parse.success != false){
					success_message_arr.push(result_parse.message.replace(replace_str, new_str));
				} else {
					error_message_arr.push(result_parse.message.replace(replace_str, new_str));
				}

				result_parse.recid = params.recordIdList[i].toString();
				result_arr.push(result_parse);

			} else{
				return res;
			}
		}
		// Добавляем разделитель ";" между сообщениями
		var success_message = success_message_arr.join("; "); 
		var error_message = error_message_arr.join("; "); 
		//Если при обработке всех выбранных записей были получены ошибки, выдаём сообщение об этом
		if (error_message_arr.length == params.recordIdList.length){
			return badResp(error_message);
		} else {
			//В случае одного элемента - выводим сообщение как есть
			if(params.recordIdList.length == 1){
				return successResp(success_message, result_arr);
			} else {
			// иначе - выводим сообщения о количестве успешно обработанных элементов и тексты ошибок, плюс информацию об ошибках и успешных операциях - возвращаем для следующего метода
			var message_text = String().concat(success_message_arr.length, " из ", params.recordIdList.length, " действий выполнено. ", error_message);
			return successResp(message_text, result_arr);
			}
		}
	}else{
		return badResp("Массив идентификаторов равен null")
	}
}

/**
 * (Выпуск СЕ в обращение) Выпуск сформированного паспорта в обращение
 * @param {*} params 
 */
function registerasgoodpassportfile(params){
	// if (typeof params.values != 'undefined' && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
	// 	params.values.recid = params.recid
	// 	params = params.values;
	// 	};
	var error_message_arr = []; //Создаем пустой массив, куда будем записывать ошибки при формировании запроса и json паспорта
	var success_message_arr = []; //Создаем пустой массив, куда будем записывать успешные операции
	//т.к. метод вызывается из списка задач workflow, обрабатываем не params.recordIdList, а специально подготовленный объект params.data из метода formnodepassportfile
	if(params.data != null){
		for(var i = 0; i < params.data.length; i++){
			if(params.data[i].success){
				var headers = {
					"Content-Type": "application/json"
				};
				var headers = addAuthHeader(headers);
				var url = String().concat(host, "/plugins/nbdlogicplugin/registersignedassemblyunitpassport/", params.data[i].recid.toString())
				var res = fetch(url, {
					headers: headers,
					"body": JSON.stringify(params),
					"Method": "post"
				});

				// Получаем ЭП СЕ, для получения его УИН
				var reestr_ke_nodes_fields = db.findbyrecid("reestr_ke_nodes", params.data[i].recid);
				// Формирования УИН в виде гиперссылки
				var enum_uin_key_element = "<a href=\"/tables/reestr_ke_nodes/"+  params.data[i].recid +"\" target=\"_blank\" class=\"alert-link\">"+ reestr_ke_nodes_fields.unique_number +"</a>";

				var result_parse = JSON.parse(res.data);
				
				if(isNotEmptyString(result_parse)){
					var replace_str = "СЕ";
					var new_str = replace_str + " " + enum_uin_key_element;
					if (result_parse.success != false){
						success_message_arr.push(result_parse.message.replace(replace_str, new_str));
					} else {
						error_message_arr.push(result_parse.message.replace(replace_str, new_str));
					}
				} else{
					return res;
				}
			}
		}
		if (error_message_arr.length > 0){
			var error_message = error_message_arr.join("; "); // Добавляем разделитель ";" между сообщениями
			var message_text = success_message_arr.length>0 ? String().concat(success_message_arr.length, " из ", params.recordIdList.length, " действий выполнено. ", error_message) : error_message; //Указываем количество успешных действий, если они были
			return badResp(message_text);
		} else {
			var success_message = success_message_arr.join("; "); // Добавляем разделитель ";" между сообщениями
			return successResp(success_message);
		}
	}else{
		return badResp("Массив идентификаторов равен null")
	}
}

/**
 * Выпуск СЕ в обращение
 * @param {*} params 
 */
function registerassemblyunitasgood(params) {
	var headers = {
		"Content-Type": "application/json"
	};
	var headers = addAuthHeader(headers);
	var url = String().concat(host, "/plugins/nbdlogicplugin/registeassemblyunitasgood/", params.recid.toString())
	var res = fetch(url, {
		headers: headers,
		"body": JSON.stringify(params),
		"Method": "post"
	});
	if(isNotEmptyString(res.data)){
		return JSON.parse(res.data)
	}else{
		return res;
	}
}

/**
 * Добавление СЧ к узлу
 * @param {*} params 
 */
function addketonode(params) {	
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
	//Получение узла, в который сканируем СЧ
	var node = db.findbyrecid("reestr_ke_nodes", params.recid);
	if (isNullObject(node)) {
		return badResp("Не удалось получить запись узла");
	}

	var all_scanned_key_elements = [];
	var all_scanned_nodes = [];
	if (isEmptyString(params.ke_numbers)) {
		return badResp("Не просканировано ни одного СЧ");
	}
	var ke_numbers = JSON.parse(params.ke_numbers)

	var rzd_url = get_rzd_urls_portal_settings();
	if(!rzd_url.success){
		return badResp("Не удалось получить адрес АРМ Росжелдора");
	}

	//Лист ошибок
	var errors = [];
	//Сообщение об ошибках
	var error_message = "";

	//Получение всех СЧ и наполнение ими массива all_scanned_key_elements, так же, если указана позиция, проставление позиции
	for (var i = 0; i < ke_numbers.length; i++) {
		var current_param = ke_numbers[i];

		//обнуляем список ошибок для текущего сканируемого номера
		errors = [];

		//Номер сканируемого элемента. Если элемент найден - записывается ссылкой. 
		var scannedElementLink = current_param.number;

		if (isNotEmptyString(current_param.number)) {
			var key_element = db.findbyrecid("reestr_key_elements", current_param.number);
			//Если запись найдена в реестре СЧ, обрабатываем ее дальше, иначе пробуем получить запись как СЕ
			if (isNotNullObject(key_element)) {
				scannedElementLink = "<a href=\"/tables/reestr_key_elements/" + key_element.recid + "\" target=\"_blank\" class=\"alert-link\">" + key_element.numberke + "</a >";
			
				//Проверка статуса
				if (key_element.statuske != "c82c2eb8-0cf9-4693-8a2b-c6bf605c97ab" && key_element.statuske != "259762d5-2ee4-4acb-a2c7-18593cb6cc4f") {
					errors.push("Невозможно установить СЧ в текущем статусе");
				} else {
					all_scanned_key_elements.push(key_element);
				}

				if (isEmptyString(current_param.position)) {
					return badResp("Для СЧ " + current_param.numberValue + " не указана позиция.");
				}else{
					key_element.position_on_node = current_param.position;
				}
				var position_on_node = db.findbyrecid("dictionary_positions_on_node", current_param.position);
				if (isNullObject(position_on_node)) {
					return badResp("Для СЧ " + current_param.numberValue + " не удалось определить позицию в узле.");
				}
			} else {
				var scanned_node = db.findbyrecid("reestr_ke_nodes", current_param.number);
				if (isNotNullObject(scanned_node)) {
					scannedElementLink = "<a href=\"/tables/reestr_key_elements/" + scanned_node.recid + "\" target=\"_blank\" class=\"alert-link\">" + scanned_node.readonly_ke_node + "</a>";
					if (isNotEmptyString(current_param.position)) {
						scanned_node.position_on_assembly_element = current_param.position
					}
					if (scanned_node.status != "823cc6e9-465b-416e-beda-8a642149c235" && scanned_node.status != "25d67987-0cd4-404a-85d7-847d142af11f") {
						errors.push("Невозможно установить узел в текущем статусе");
					} else {
						all_scanned_nodes.push(scanned_node);
					}
				}else {
					errors.push("Не удалось найти запись данного элемента в системе");
				}
			}
		}

		if(errors.length > 0) {
			error_message += "При сканировании "+ scannedElementLink +" обнаружены следующие ошибки:<br>" + errors.join(";<br>") + ".<br>";			
		}
	}

	//Вывод ошибок
	if (isNotEmptyString(error_message) && isNullObject(all_scanned_key_elements) && isNullObject(all_scanned_nodes) ) {		
		return badResp("Не найдено СЧ или СЕ пригодных для установки.<br>" + error_message);		
	}	

	//Получение уже установленных СЧ и СЕ
	var already_installed_key_elements = db.findbyparams("reestr_key_elements", {
		"ke_node": node.recid
	});
	var already_installed_nodes = db.findbyparams("reestr_ke_nodes", {
		"parent_ke_node": node.recid
	});

	if (isEmptyOrNullArray(already_installed_key_elements)) {
		already_installed_key_elements = [];
	} else if (isEmptyOrNullArray(already_installed_nodes)) {
		already_installed_nodes = [];
	}

	//Получение использованых позиций
	var used_ke_positions = [];
	var used_node_positions = [];
	//Получение использованых позиций СЧ
	for (var i = 0; i < already_installed_key_elements.length; i++) {
		var key_element = already_installed_key_elements[i];
		if (isNotEmptyString(key_element.position_on_node)) {
			used_ke_positions.push(key_element.position_on_node);
		}
	}
	//Получение использованых позиций узлов
	for (var i = 0; i < already_installed_nodes.length; i++) {
		var used_node = already_installed_nodes[i];
		if (isNotEmptyString(used_node.position_on_assembly_element)) {
			used_node_positions.push(used_node.position_on_assembly_element);
		}
	}

	//Проверка что нет попыток установить новый СЧ занятую позицию
	var errors = [];
	for (var i = 0; i < all_scanned_key_elements.length; i++) {
		var scanned_ke = all_scanned_key_elements[i];
		if (isNotEmptyString(scanned_ke.position_on_node)) {
			if (used_ke_positions.indexOf(scanned_ke.position_on_node) != -1) {
				var position_record = db.findbyrecid("dictionary_positions_on_node", scanned_ke.position_on_node);
				errors.push("На позицию " + position_record.recname + " претендует более одного СЧ.");
			}
		}
	}

	//Проверка что нет попыток установить новый СЕ занятую позицию
	for (var i = 0; i < all_scanned_nodes.length; i++) {
		var scanned_node = all_scanned_nodes[i];
		if (isNotEmptyString(scanned_node.position_on_assembly_element)) {
			if (used_node_positions.indexOf(scanned_node.position_on_assembly_element) != -1) {
				var position_record = db.findbyrecid("dictionary_node_positions", scanned_node.position_on_assembly_element);
				errors.push("На позицию " + position_record.recname + " претендует более одного узла.");
			}
		}
	}

	if (errors.length > 0) {
		error_message = errors.join(";<br>");
		return badResp(error_message)
	}

	//Сборка всех СЧ и узлов в массивы для проверки комплектации
	var all_key_elements = already_installed_key_elements.concat(all_scanned_key_elements);
	var all_nodes = already_installed_nodes.concat(all_scanned_nodes);

	//Запись обновленного количества дочерних элементов
	node.child_count = all_nodes.length + all_key_elements.length;	
	var update_res = db.update("reestr_ke_nodes", node);
		if (!update_res) {
			return badResp("Ошибка при обновлении узла " + update_res.readonly_ke_node + ".<br>" + error_message);
		}

	var checkNodeCompositionRes = checkNodeComposition(all_key_elements, node, false);
	if (!checkNodeCompositionRes.success) {
		return badResp(checkNodeCompositionRes.message + ".<br>" + error_message);
	}
	//Генерим исторические записи
	var node_assembly_history_records_res = generateNodeAssemblyHistoryRecords(node, all_scanned_key_elements);
	if (!node_assembly_history_records_res.success) {
		return badResp("Произошла ошибка в процессе обработки указанных составных частей. " + node_assembly_history_records_res.message + ".<br>" + error_message);
	}
	var node_assembly_history_records = node_assembly_history_records_res.data;
	//Все прошло успешно, обновляем записи установленных СЧ и узлов
	for (var i = 0; i < all_scanned_key_elements.length; i++) {
		var scanned_ke = all_scanned_key_elements[i];
		scanned_ke.ke_node = node.recid;
		db.update("reestr_key_elements", scanned_ke);

		// Действие - Группировка
		var log_item = set_ke_log(scanned_ke, "e935eefb-3f88-4576-b43a-275dbf4dc787", node.recid, node.ke_node_type);
		//db.insert("log", log_item);
		// Отправка записи истории 29.09.2020 amaslov 44458
		MakeLogRecord("log", log_item, rzd_url.rzd_name_url);
	}

	for (var i = 0; i < node_assembly_history_records.length; i++) {
		var sendRes = InsertRecordToOuterRdev("nodes_assembly_history", node_assembly_history_records[i], rzd_url.rzd_name_url);
		if(!sendRes.success){
			return sendRes;
		}
	}
	// Всем дочерним СЧ указываем родительский узел и позицию в узле

	//Прописываем историю в таблицу node_log
	var node_log_actions = db.findbyparams("dictionary_node_actions", { "code": 5 });
	//Добавление элемента
	var node_log_record = set_node_log(node, node_log_actions[0].recid, "");

	if (isNotEmptyOrNullArray(all_scanned_key_elements)) {
		// Прописываем содержимое узла
		for (var i = 0; i < all_scanned_key_elements.length; i++) {
			var key_element_type_record = db.findbyrecid("dictionary_key_elements_codes", all_scanned_key_elements[i].key_element_code)
			if (isNotNullObject(key_element_type_record)) {
				if (i < all_scanned_key_elements.length - 1) {
					node_log_record.node_content += all_scanned_key_elements[i].numberke + '(' + key_element_type_record.recname + ')' + ", ";
				} else {
					node_log_record.node_content += all_scanned_key_elements[i].numberke + '(' + key_element_type_record.recname + ')'
				}
			} else {
				if (i < all_scanned_key_elements.length - 1) {
					node_log_record.node_content += all_scanned_key_elements[i].numberke + ", ";
				} else {
					node_log_record.node_content += all_scanned_key_elements[i].numberke
				}
			}
		}
	}

	// Отправка записи истории 29.09.2020 amaslov 44458
	MakeLogRecord("node_log", node_log_record, rzd_url.rzd_name_url);

	if (isEmptyString(error_message))
		return successResp("Узел успешно обновлен");
	else
		return successResp("Узел обновлен с ошибками:<br>" + error_message);
}

/**
 * Добавление СЧ к СЕ и присвоение УИНа пользователем MassController
 * @param {*} params 
 */
function adduinketoassemblyunit(params){
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
	return plugins.callAsMethod("/plugins/nbdlogicplugin/adduinketoassemblyunit/" + params.recid.toString(), "post", params, null);
}

/**
 * Добавление СЧ к СЕ (KeControllers)
 * @param {*} params 
 */
function addketoassemblyunit(params) {
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
	return plugins.callAsMethod("/plugins/nbdlogicplugin/addketoassemblyunit/" + params.recid.toString(), "post", params, null);
}

/**
 * Проверка количества устанавливаемых СЕ (в частности триангелей, воздухораспределителей в сборе)
 * @param {*} assembly_units 	Проверяемые узлы
 * @param {*} node 			 	Узел в котором проверять
 * @param {*} check_less 		Флаг, указывающий, стоит ли проверять на меньшее количество
 */
function checkAssemblyUnitsCountLimitationOnNode(assembly_units, node, check_less) {
	//Проверка количества устанавливаемых СЕ
	var triangels_count = 0;
	var air_distributors_count = 0;

	//Наполнение переменных
	for (var i = 0; i < assembly_units.length; i++) {
		var assembly_unit = db.findbyrecid("reestr_ke_nodes", assembly_units[i].recid);


		if (assembly_unit.ke_node_type == "c790c624-b93e-498b-97ba-0fb47f8b4b52") {
			triangels_count += 1;
		}

		if (assembly_unit.ke_node_type == "a6180bfa-368d-4eff-97f2-c4f6c2612bc6") {
			air_distributors_count += 1;
		}
	}
	var errors = []
	//Проверка количества
	for (var i = 0; i < assembly_units.length; i++) {
		var assembly_unit = db.findbyrecid("reestr_ke_nodes", assembly_units[i].recid);
		var dictionary_count_key_elements_by_node_type_params = {
			"ke_node_type": node.ke_node_type,
			"scheme": node.documentation_number
		}
		var dictionary_count_key_elements_by_node_types = db.findbyparams("dictionary_count_key_elements_by_node_type", dictionary_count_key_elements_by_node_type_params);
		if (isEmptyOrNullArray(dictionary_count_key_elements_by_node_types)) {
			errors.push("Не найдена запись в таблице \"Количество СЧ по наименованию в сборочной единице/узле\" для собираемого СЕ");
		}
		var dictionary_count_key_elements_in_node = dictionary_count_key_elements_by_node_types[0];

		//Количество триангелей
		if (triangels_count > dictionary_count_key_elements_in_node.triangel_count) {
			if (errors.indexOf("Количество сканируемых триангелей больше чем требуется, требуется " + dictionary_count_key_elements_in_node.triangel_count) == -1) {
				errors.push("Количество сканируемых триангелей больше чем требуется, требуется " + dictionary_count_key_elements_in_node.triangel_count)
			}
		}
		//Количество триангелей
		if (triangels_count < dictionary_count_key_elements_in_node.triangel_count && check_less) {
			if (errors.indexOf("Количество сканируемых триангелей меньше чем требуется, требуется " + dictionary_count_key_elements_in_node.triangel_count) == -1) {
				errors.push("Количество сканируемых триангелей меньше чем требуется, требуется " + dictionary_count_key_elements_in_node.triangel_count)
			}
		}

		//Количество воздухораспределителей в сборе
		if (air_distributors_count > dictionary_count_key_elements_in_node.air_distributor_count) {
			if (errors.indexOf("Количество сканируемых воздухораспределителей в сборе больше чем требуется, требуется " + dictionary_count_key_elements_in_node.air_distributors_count) == -1) {
				errors.push("Количество сканируемых воздухораспределителей в сборе больше чем требуется, требуется " + dictionary_count_key_elements_in_node.air_distributors_count)
			}
		}
		//Количество воздухораспределителей в сборе
		if (air_distributors_count < dictionary_count_key_elements_in_node.air_distributor_count && check_less) {
			if (errors.indexOf("Количество сканируемых воздухораспределителей в сборе меньше чем требуется, требуется " + dictionary_count_key_elements_in_node.air_distributors_count) == -1) {
				errors.push("Количество сканируемых воздухораспределителей в сборе меньше чем требуется, требуется " + dictionary_count_key_elements_in_node.air_distributors_count)
			}
		}
	}

	if (errors.length <= 0) {
		return {
			"success": true
		}
	} else {
		var error_message = errors.join(";<br>");		
		return {
			"success": false,
			"message": error_message
		}
	}
}

/**
 * Запрос в блокчейн на проверку статуса СЕ
 * @param {*} assembly_unit 
 * @param {*} nodeip 
 */
function checkAssemblyUnitLabelStatus(assembly_unit, nodeip) {
	var request = {
		"method": {
			"package": "NBD",
			"function": "object_show_status"
		},
		"object_link": {
			"hash": assembly_unit.blockchainhash,
			"node": assembly_unit.blockchainnode,
			"recn": assembly_unit.blockchainrecn,
			"tn": assembly_unit.blockchaintn
		}
	}
	var response = sendrequestNoThrow(request, nodeip);

	if (response.success) {
		if (isNotNullObject(response.data.result)) {
			if (isNotEmptyString(response.data.result.has_label)) {
				if (response.data.result.has_label) {
					return {
						"success": true
					};
				} else {
					return {
						"success": false,
						"message": "group not labeled"
					}
				}
			} else {
				return {
					"success": false,
					"message": "has_label is empty",
					"data": response.data
				}
			}
		} else {
			return {
				"success": false,
				"message": "object_show_status response not success",
				"data": response.data
			}
		}
	} else {
		if (isNotEmptyString(response.data.toString().match('event is not applied yet'))) {
			return {
				"success": false,
				"message": "event is not applied yet"
			}
		}
		else {
			return {
				"success": false,
				"message": "wrong_error",
				"data": response.data
			}
		}
	}
}

function assemblyUnitAddObject(assembly_unit) {
	// unique_number (УИН)
	if (isEmptyString(assembly_unit.unique_number_relation)) {
		return badResp("Требуется заполнить обязательное поле - УИН.");
	}
	var unique_number = db.findbyrecid("ke_numbers", assembly_unit.unique_number_relation);
	if (isNullObject(unique_number)) {
		return badResp("УИН не найден в системе.");
	}

	// method_of_marking (Способ (тип) маркировки)
	if (isEmptyString(assembly_unit.method_of_marking)) {
		return badResp("Требуется заполнить обязательное поле - Способ (тип) маркировки.");
	}
	var dictionary_method_of_marking = db.findbyrecid("dictionary_method_of_marking", assembly_unit.method_of_marking);
	if (isNullObject(dictionary_method_of_marking)) {
		return badResp("Способ (тип) маркировки СЧ не найден в системе.");
	}

	// ke_node_type (Тип узла)
	if (isEmptyString(assembly_unit.ke_node_type)) {
		return badResp("Требуется заполнить обязательное поле - Тип узла.");
	}
	var dictionary_ke_node_types = db.findbyrecid("dictionary_ke_node_types", assembly_unit.ke_node_type);
	if (isNullObject(dictionary_ke_node_types)) {
		return badResp("Тип узла не найден в системе.");
	}

	// documentation_number (Обозначение изделия)
	if (isEmptyString(assembly_unit.documentation_number)) {
		return badResp("Требуется заполнить обязательное поле - Обозначение изделия.");
	}
	var reestr_documentation = db.findbyrecid("reestr_documentation", assembly_unit.documentation_number);
	if (isNullObject(reestr_documentation)) {
		return badResp("Обозначение изделия не найдено в системе.");
	}

	// formation_date (Дата изготовления)
	if (isEmptyString(assembly_unit.formation_date)) {
		return badResp("Требуется заполнить обязательное поле - Дата изготовления.");
	}

	// manufacturer_details (Сведения об изготовителе)
	if (isEmptyString(assembly_unit.manufacturer_details)) {
		return badResp("Требуется заполнить обязательное поле - Сведения об изготовителе.");
	}
	var manufacturer_details = db.findbyrecid("reestr_members", assembly_unit.manufacturer_details);
	if (isNullObject(manufacturer_details)) {
		return badResp("Сведения об изготовителе не найдены в системе.");
	}

	var member = null;

	if (isEmptyString(assembly_unit.memberid)) {
		member = getmemberbyuser()
	} else {
		member = db.findbyrecid("reestr_members", assembly_unit.memberid);
	}

	if (isNullObject(member)) {
		return badResp("Не удалось определить участника для текущего пользователя.");
	}
	var nodeip = getnodeipbymember(member.recid);
	if (isEmptyString(nodeip)) {
		return badResp("Не удалось определить IP адрес блокчейна.");
	}

	var date_manufacture = new Date(assembly_unit.formation_date);

	var date = new Date();

	var assembly_unit_type = db.findbyrecid("dictionary_ke_node_types", assembly_unit.ke_node_type);

	var add_object_blockchain = {
		"nodeip": nodeip,
		// Тип СЕ
		"assembly_unit_type": assembly_unit_type,
		// УИН
		"unique_number": unique_number.recname,
		// Способ (тип) маркировки
		"method_of_marking": dictionary_method_of_marking.reccode,
		// Обозначение изделия
		"documentation_number": reestr_documentation.detail,
		// Дата изготовления
		"date_manufacture": date_manufacture.getUTCFullYear() +
			'-' + (date_manufacture.getUTCMonth() + 1).toString().padStart(2, 0) +
			'-' + (date_manufacture.getUTCDate()).toString().padStart(2, 0),
		// Сведения об изготовителе
		"manufacturer_details": manufacturer_details.fullname,
	};

	// Тележка
	if (assembly_unit_type.recid == "cbb9d8cb-89ef-4b99-be77-a7d6e57e388e") {
		// certificate_number (Сведения о сертификате соответствия)
		if (isEmptyString(assembly_unit.certificate_number)) {
			return badResp("Требуется заполнить обязательное поле - Сведения о сертификате соответствия.");
		}
		var reestr_certificates = db.findbyrecid("reestr_certificates", assembly_unit.certificate_number);
		if (isNullObject(reestr_certificates)) {
			return badResp("Сведения о сертификате соответствия не найдены в системе.");
		}

		// life_time (Срок службы)
		if (isEmptyString(assembly_unit.life_time)) {
			return badResp("Требуется заполнить обязательное поле - Срок службы.");
		}

		// ke_manufacturer (Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя)
		if (isEmptyString(assembly_unit.manufacturer)) {
			return badResp("Требуется заполнить обязательное поле - Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя.");
		}
		var manufacturer = db.findbyrecid("dictionary_branding_codes", assembly_unit.manufacturer);
		if (isNullObject(manufacturer)) {
			return badResp("Предприятие-изготовитель не найден в системе.");
		}

		// branding_code_certificate_number (Регистрационный номер свидетельства о присвоении номера для клеймения)
		if (isEmptyString(assembly_unit.branding_code_certificate_number)) {
			return badResp("Требуется заполнить обязательное поле - Регистрационный номер свидетельства о присвоении номера для клеймения.");
		}

		// manufacturer_number (Номер изделия по системе нумерации предприятия-изготовителя)
		if (isEmptyString(assembly_unit.manufacturer_number)) {
			return badResp("Требуется заполнить обязательное поле - Номер изделия по системе нумерации предприятия-изготовителя.");
		}

		//проверка на уникальность по дате, номеру, заводу, типу
		var validate_dublicate = validate_dublicate_nodes(assembly_unit);
		if(!validate_dublicate.success)
			return validate_dublicate;

		// administration_code (Код государства собственника детали)
		if (isEmptyString(assembly_unit.administration_code)) {
			return badResp("Требуется заполнить обязательное поле - Код государства собственника детали.");
		}
		var dictionary_administration_codes = db.findbyrecid("dictionary_administration_codes", assembly_unit.administration_code);
		if (isNullObject(dictionary_administration_codes)) {
			return badResp("Код государства собственника детали не найден в системе.");
		}

		// truck_model (Обозначение модели)
		if (isEmptyString(assembly_unit.truck_model)) {
			return badResp("Требуется заполнить обязательное поле - Обозначение модели.");
		}
		var dictionary_truck_models = db.findbyrecid("dictionary_truck_models", assembly_unit.truck_model);
		if (isNullObject(dictionary_truck_models)) {
			return badResp("Обозначение модели не найдены в системе.");
		}

		// truck_type (Тип тележки)
		if (isEmptyString(assembly_unit.truck_type)) {
			return badResp("Требуется заполнить обязательное поле - Тип тележки.");
		}
		var dictionary_type_cart = db.findbyrecid("dictionary_type_cart", assembly_unit.truck_type);
		if (isNullObject(dictionary_type_cart)) {
			return badResp("Тип тележки не найден в системе.");
		}

		// max_static_axial_load (Максимальная расчетная статическая осевая нагрузка)
		if (isEmptyString(assembly_unit.max_static_axial_load)) {
			return badResp("Требуется заполнить обязательное поле - Максимальная расчетная статическая осевая нагрузка.");
		}

		// technical_conditions (Технические условия)
		var reestr_documentation_fields = db.findbyrecid("reestr_documentation", assembly_unit.documentation_number);
		if (isNullObject(reestr_documentation_fields)) {
			return badResp(error_message_head + "Запись в реестре документации не найдена.");
		}
		var dictionary_technical_conditions = db.findbyparams("dictionary_technical_conditions", {
			recname: assembly_unit.technical_conditions
		});
		if (isEmptyOrNullArray(dictionary_technical_conditions)) {
			return badResp(error_message_head + "Запись в справочнике Технические условия не найдена.");
		}


		// Сведения о сертификате соответствия
		add_object_blockchain.certificate_number = reestr_certificates.registration_number;
		// Срок службы
		add_object_blockchain.life_time = assembly_unit.life_time;
		// Условный номер для клеймения продукции вагоностроения
		add_object_blockchain.manufacturer_code = manufacturer.code;
		// Сокращенное наименование предприятия-изготовителя
		add_object_blockchain.manufacturer_name = manufacturer.recname;
		// Регистрационный номер свидетельства о присвоении номера для клеймения
		add_object_blockchain.branding_code_certificate_number = assembly_unit.branding_code_certificate_number;
		// Номер изделия по системе нумерации предприятия-изготовителя
		add_object_blockchain.manufacturer_number = assembly_unit.manufacturer_number;
		// Код государства собственника детали
		add_object_blockchain.administration_code = dictionary_administration_codes.reccode;
		// Обозначение модели
		add_object_blockchain.truck_model = dictionary_truck_models.recname;
		// Тип тележки
		add_object_blockchain.truck_type = dictionary_type_cart.recname;
		// Максимальная расчетная статическая осевая нагрузка
		add_object_blockchain.max_static_axial_load = assembly_unit.max_static_axial_load;
		// Технические условия
		add_object_blockchain.technical_conditions = dictionary_technical_conditions[0].recname;
	}

	// Колесная пара
	if (assembly_unit_type.recid == "a3afe986-102a-4a10-aafe-5407134f7c15") {

		// ke_manufacturer (Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя)
		if (isEmptyString(assembly_unit.manufacturer)) {
			return badResp("Требуется заполнить обязательное поле - Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя.");
		}
		var manufacturer = db.findbyrecid("dictionary_branding_codes", assembly_unit.manufacturer);
		if (isNullObject(manufacturer)) {
			return badResp("Предприятие-изготовитель не найден в системе.");
		}

		// branding_code_certificate_number (Регистрационный номер свидетельства о присвоении номера для клеймения)
		if (isEmptyString(assembly_unit.branding_code_certificate_number)) {
			return badResp("Требуется заполнить обязательное поле - Регистрационный номер свидетельства о присвоении номера для клеймения.");
		}

		// administration_code (Код государства собственника детали)
		if (isEmptyString(assembly_unit.administration_code)) {
			return badResp("Требуется заполнить обязательное поле - Код государства собственника детали.");
		}
		var dictionary_administration_codes = db.findbyrecid("dictionary_administration_codes", assembly_unit.administration_code);
		if (isNullObject(dictionary_administration_codes)) {
			return badResp("Код государства собственника детали не найден в системе.");
		}

		// max_static_axial_load (Максимальная расчетная статическая осевая нагрузка)
		if (isEmptyString(assembly_unit.max_static_axial_load)) {
			return badResp("Требуется заполнить обязательное поле - Максимальная расчетная статическая осевая нагрузка.");
		}

		// technical_conditions (Технические условия)
		var reestr_documentation_fields = db.findbyrecid("reestr_documentation", assembly_unit.documentation_number);
		if (isNullObject(reestr_documentation_fields)) {
			return badResp(error_message_head + "Запись в реестре документации не найдена.");
		}
		var dictionary_technical_conditions = db.findbyparams("dictionary_technical_conditions", {
			recname: assembly_unit.technical_conditions
		});
		if (isEmptyOrNullArray(dictionary_technical_conditions)) {
			return badResp(error_message_head + "Запись в справочнике Технические условия не найдена.");
		}

		// Условный номер для клеймения продукции вагоностроения
		add_object_blockchain.manufacturer_code = manufacturer.code;
		// Сокращенное наименование предприятия-изготовителя
		add_object_blockchain.manufacturer_name = manufacturer.recname;
		// Регистрационный номер свидетельства о присвоении номера для клеймения
		add_object_blockchain.branding_code_certificate_number = assembly_unit.branding_code_certificate_number;
		// Код государства собственника детали
		add_object_blockchain.administration_code = dictionary_administration_codes.reccode;
		// Максимальная расчетная статическая осевая нагрузка
		add_object_blockchain.max_static_axial_load = assembly_unit.max_static_axial_load;
		// Технические условия
		add_object_blockchain.technical_conditions = dictionary_technical_conditions[0].recname;
	}

	// Колесная пара без буксовых узлов
	if (assembly_unit_type.recid == "00b0b326-a67a-4ce2-95af-376fcc9d8355") {

		// ke_manufacturer (Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя)
		if (isEmptyString(assembly_unit.manufacturer)) {
			return badResp("Требуется заполнить обязательное поле - Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя.");
		}
		var manufacturer = db.findbyrecid("dictionary_branding_codes", assembly_unit.manufacturer);
		if (isNullObject(manufacturer)) {
			return badResp("Предприятие-изготовитель не найден в системе.");
		}

		// branding_code_certificate_number (Регистрационный номер свидетельства о присвоении номера для клеймения)
		if (isEmptyString(assembly_unit.branding_code_certificate_number)) {
			return badResp("Требуется заполнить обязательное поле - Регистрационный номер свидетельства о присвоении номера для клеймения.");
		}

		// certificate_number (Сведения о сертификате соотвествия)
		if (isEmptyString(assembly_unit.certificate_number)) {
			return badResp("Требуется заполнить обязательное поле - Сведения о сертификате соотвествия");
		}
		var reestr_certificates = db.findbyrecid("reestr_certificates", assembly_unit.certificate_number);
		if (isNullObject(reestr_certificates)) {
			return badResp("Сведения о сертификате соответствия не найдены в системе.");
		}

		// technical_conditions (Технические условия)
		var reestr_documentation_fields = db.findbyrecid("reestr_documentation", assembly_unit.documentation_number);
		if (isNullObject(reestr_documentation_fields)) {
			return badResp(error_message_head + "Запись в реестре документации не найдена.");
		}
		var dictionary_technical_conditions = db.findbyparams("dictionary_technical_conditions", {
			recname: assembly_unit.technical_conditions
		});
		if (isEmptyOrNullArray(dictionary_technical_conditions)) {
			return badResp(error_message_head + "Запись в справочнике Технические условия не найдена.");
		}

		// Условный номер для клеймения продукции вагоностроения
		add_object_blockchain.manufacturer_code = manufacturer.code;
		// Сокращенное наименование предприятия-изготовителя
		add_object_blockchain.manufacturer_name = manufacturer.recname;
		// Регистрационный номер свидетельства о присвоении номера для клеймения
		add_object_blockchain.branding_code_certificate_number = assembly_unit.branding_code_certificate_number;
		//Обозначение сертификата
		add_object_blockchain.certificate_number = assembly_unit.certificate_number;
		// Технические условия
		add_object_blockchain.technical_conditions = dictionary_technical_conditions[0].recname;
	}

	// Скользун
	if (assembly_unit_type.recid == "a70bf64c-215b-4d42-9c8e-f8ab4ac9f357") {

		// ke_manufacturer (Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя)
		if (isEmptyString(assembly_unit.manufacturer)) {
			return badResp("Требуется заполнить обязательное поле - Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя.");
		}
		var manufacturer = db.findbyrecid("dictionary_branding_codes", assembly_unit.manufacturer);
		if (isNullObject(manufacturer)) {
			return badResp("Предприятие-изготовитель не найден в системе.");
		}

		// branding_code_certificate_number (Регистрационный номер свидетельства о присвоении номера для клеймения)
		if (isEmptyString(assembly_unit.branding_code_certificate_number)) {
			return badResp("Требуется заполнить обязательное поле - Регистрационный номер свидетельства о присвоении номера для клеймения.");
		}

		// Условный номер для клеймения продукции вагоностроения
		add_object_blockchain.manufacturer_code = manufacturer.code;
		// Сокращенное наименование предприятия-изготовителя
		add_object_blockchain.manufacturer_name = manufacturer.recname;
		// Регистрационный номер свидетельства о присвоении номера для клеймения
		add_object_blockchain.branding_code_certificate_number = assembly_unit.branding_code_certificate_number;
	}

	// Триангель
	if (assembly_unit_type.recid == "c790c624-b93e-498b-97ba-0fb47f8b4b52") {
		// certificate_number (Сведения о сертификате соответствия)
		if (isEmptyString(assembly_unit.certificate_number)) {
			return badResp("Требуется заполнить обязательное поле - Сведения о сертификате соответствия.");
		}
		var reestr_certificates = db.findbyrecid("reestr_certificates", assembly_unit.certificate_number);
		if (isNullObject(reestr_certificates)) {
			return badResp("Сведения о сертификате соответствия не найдены в системе.");
		}


		// ke_manufacturer (Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя)
		if (isEmptyString(assembly_unit.manufacturer)) {
			return badResp("Требуется заполнить обязательное поле - Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя.");
		}
		var manufacturer = db.findbyrecid("dictionary_branding_codes", assembly_unit.manufacturer);
		if (isNullObject(manufacturer)) {
			return badResp("Предприятие-изготовитель не найден в системе.");
		}

		// branding_code_certificate_number (Регистрационный номер свидетельства о присвоении номера для клеймения)
		if (isEmptyString(assembly_unit.branding_code_certificate_number)) {
			return badResp("Требуется заполнить обязательное поле - Регистрационный номер свидетельства о присвоении номера для клеймения.");
		}

		// manufacturer_number (Номер изделия по системе нумерации предприятия-изготовителя)
		if (isEmptyString(assembly_unit.manufacturer_number)) {
			return badResp("Требуется заполнить обязательное поле - Номер изделия по системе нумерации предприятия-изготовителя.");
		}

		//проверка на уникальность по дате, номеру, заводу, типу
		var validate_dublicate = validate_dublicate_nodes(assembly_unit);
		if(!validate_dublicate.success)
			return validate_dublicate;
		
		// Сведения о сертификате соответствия
		add_object_blockchain.certificate_number = reestr_certificates.registration_number;
		// Условный номер для клеймения продукции вагоностроения
		add_object_blockchain.manufacturer_code = manufacturer.code;
		// Сокращенное наименование предприятия-изготовителя
		add_object_blockchain.manufacturer_name = manufacturer.recname;
		// Регистрационный номер свидетельства о присвоении номера для клеймения
		add_object_blockchain.branding_code_certificate_number = assembly_unit.branding_code_certificate_number;
		// Номер изделия по системе нумерации предприятия-изготовителя
		add_object_blockchain.manufacturer_number = assembly_unit.manufacturer_number;
	}

	// Автосцепка
	if (assembly_unit_type.recid == "ae11ae44-1c69-49e0-83a1-4122bb2d80ae") {
		// certificate_number (Сведения о сертификате соответствия)
		if (isEmptyString(assembly_unit.certificate_number)) {
			return badResp("Требуется заполнить обязательное поле - Сведения о сертификате соответствия.");
		}
		var reestr_certificates = db.findbyrecid("reestr_certificates", assembly_unit.certificate_number);
		if (isNullObject(reestr_certificates)) {
			return badResp("Сведения о сертификате соответствия не найдены в системе.");
		}

		// ke_manufacturer (Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя)
		if (isEmptyString(assembly_unit.manufacturer)) {
			return badResp("Требуется заполнить обязательное поле - Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя.");
		}
		var manufacturer = db.findbyrecid("dictionary_branding_codes", assembly_unit.manufacturer);
		if (isNullObject(manufacturer)) {
			return badResp("Предприятие-изготовитель не найден в системе.");
		}

		// branding_code_certificate_number (Регистрационный номер свидетельства о присвоении номера для клеймения)
		if (isEmptyString(assembly_unit.branding_code_certificate_number)) {
			return badResp("Требуется заполнить обязательное поле - Регистрационный номер свидетельства о присвоении номера для клеймения.");
		}

		//	individual_features (Индивидуальные особенности)
		if (isEmptyString(assembly_unit.individual_features)) {
			return badResp("Требуется заполнить обязательное поле - Индивидуальные особенности");
		}

		// manufacturer_number (Номер изделия по системе нумерации предприятия-изготовителя)
		if (isEmptyString(assembly_unit.manufacturer_number)) {
			return badResp("Требуется заполнить обязательное поле - Номер изделия по системе нумерации предприятия-изготовителя.");
		}

		//проверка на уникальность по дате, номеру, заводу, типу
		var validate_dublicate = validate_dublicate_nodes(assembly_unit);
		if(!validate_dublicate.success)
			return validate_dublicate;
			
		// autocoupler_model (Обозначение модели автосцепки)
		if (isEmptyString(assembly_unit.autocoupler_model)) {
			return badResp("Требуется заполнить обязательное поле - Обозначение модели автосцепки.");
		}
		var dictionary_autocoupler_model = db.findbyrecid("dictionary_couplings_models", assembly_unit.autocoupler_model);
		if (isNullObject(dictionary_autocoupler_model)) {
			return badResp("Модель автосцепки не найдена в системе");
		}

		// technical_conditions (Технические условия)
		var reestr_documentation_fields = db.findbyrecid("reestr_documentation", assembly_unit.documentation_number);
		if (isNullObject(reestr_documentation_fields)) {
			return badResp(error_message_head + "Запись в реестре документации не найдена.");
		}
		var dictionary_technical_conditions = db.findbyparams("dictionary_technical_conditions", {
			recname: assembly_unit.technical_conditions
		});
		if (isEmptyOrNullArray(dictionary_technical_conditions)) {
			return badResp(error_message_head + "Запись в справочнике Технические условия не найдена.");
		}

		// Сведения о сертификате соответствия
		add_object_blockchain.certificate_number = reestr_certificates.registration_number;
		// Условный номер для клеймения продукции вагоностроения
		add_object_blockchain.manufacturer_code = manufacturer.code;
		// Сокращенное наименование предприятия-изготовителя
		add_object_blockchain.manufacturer_name = manufacturer.recname;
		// Регистрационный номер свидетельства о присвоении номера для клеймения
		add_object_blockchain.branding_code_certificate_number = assembly_unit.branding_code_certificate_number;
		// Индивидуальные особенности
		add_object_blockchain.individual_features = assembly_unit.individual_features;
		// Номер изделия по системе нумерации предприятия-изготовителя
		add_object_blockchain.manufacturer_number = assembly_unit.manufacturer_number;
		// Обозначение модели автосцепки 
		add_object_blockchain.autocoupler_model = dictionary_autocoupler_model.coupling_name;
		// Технические условия
		add_object_blockchain.technical_conditions = dictionary_technical_conditions[0].recname;
	}

	// Котел вагона-цистерны
	if (assembly_unit_type.recid == "79ddf686-f26f-4567-97ac-cb18eadd83e9") {
		// certificate_number (Сведения о сертификате соответствия)
		if (isEmptyString(assembly_unit.certificate_number)) {
			return badResp("Требуется заполнить обязательное поле - Сведения о сертификате соответствия.");
		}
		var reestr_certificates = db.findbyrecid("reestr_certificates", assembly_unit.certificate_number);
		if (isNullObject(reestr_certificates)) {
			return badResp("Сведения о сертификате соответствия не найдены в системе.");
		}

		// life_time (Срок службы)
		if (isEmptyString(assembly_unit.life_time)) {
			return badResp("Требуется заполнить обязательное поле - Срок службы.");
		}

		// manufacturer_number (Номер изделия по системе нумерации предприятия-изготовителя)
		if (isEmptyString(assembly_unit.manufacturer_number)) {
			return badResp("Требуется заполнить обязательное поле - Номер изделия по системе нумерации предприятия-изготовителя.");
		}

		//проверка на уникальность по дате, номеру, заводу, типу
		var validate_dublicate = validate_dublicate_nodes(assembly_unit);
		if(!validate_dublicate.success)
			return validate_dublicate;

		// steel_grade (Марка материала)
		if (isEmptyString(assembly_unit.steel_grade)) {
			return badResp("Требуется заполнить обязательное поле - Марка материала");
		}
		var steel_grade_record_params = {
			"recid": assembly_unit.steel_grade,
			"ke_node_type": assembly_unit_type.recid
		}
		var steel_grade_records = db.findbyparams("dictionary_steel_grade", steel_grade_record_params);
		if (isEmptyOrNullArray(steel_grade_records)) {
			return badResp("Сведения о марке материала не найдены в системе")
		}
		var steel_grade = steel_grade_records[0]

		// carcass_volume (Объем кузова (котла))
		if (isEmptyString(assembly_unit.carcass_volume)) {
			return badResp("Требуется заполнить обязательное поле - Объем кузова-котла");
		}

		// operating_pressure_transportation (Рабочее (избытычное) давление при перевозке)
		if (isEmptyString(assembly_unit.operating_pressure_transportation)) {
			return badResp("Требуется заполнить обязательное поле - Рабочее (избытычное) давление при перевозке");
		}

		// operating_pressure_unloading (Рабочее (избыточное) давление при разгрузке)
		if (isEmptyString(assembly_unit.operating_pressure_unloading)) {
			return badResp("Требуется заполнить обязательное поле - Рабочее (избыточное) давление при разгрузке");
		}

		// design_pressure (Расчетное давление)
		if (isEmptyString(assembly_unit.design_pressure)) {
			return badResp("Требуется заполнить обязательное поле - Расчетное давление");
		}

		// hydraulic_test_pressure (Испытательное давление гидравлическое)
		if (isEmptyString(assembly_unit.hydraulic_test_pressure)) {
			return badResp("Требуется заполнить обязательное поле - Испытательное давление гидравлическое");
		}
		
		// technical_conditions (Технические условия)
		var reestr_documentation_fields = db.findbyrecid("reestr_documentation", assembly_unit.documentation_number);
		if (isNullObject(reestr_documentation_fields)) {
			return badResp(error_message_head + "Запись в реестре документации не найдена.");
		}
		var dictionary_technical_conditions = db.findbyparams("dictionary_technical_conditions", {
			recname: assembly_unit.technical_conditions
		});
		if (isEmptyOrNullArray(dictionary_technical_conditions)) {
			return badResp(error_message_head + "Запись в справочнике Технические условия не найдена.");
		}

		// Сведения о сертификате соответствия
		add_object_blockchain.certificate_number = reestr_certificates.registration_number;
		// Срок службы
		add_object_blockchain.life_time = assembly_unit.life_time;
		// Номер изделия по системе нумерации предприятия-изготовителя
		add_object_blockchain.manufacturer_number = assembly_unit.manufacturer_number;
		// Марка материала
		add_object_blockchain.steel_grade = steel_grade.recname;
		// Объем кузова (котла)
		add_object_blockchain.carcass_volume = assembly_unit.carcass_volume;
		// Рабочее (избыточное) давление при перевозке
		add_object_blockchain.operating_pressure_transportation = assembly_unit.operating_pressure_transportation;
		// Рабочее (избыточное) давление при разгрузке
		add_object_blockchain.operating_pressure_unloading = assembly_unit.operating_pressure_unloading;
		// Расчетное давление
		add_object_blockchain.design_pressure = assembly_unit.design_pressure
		// Испытательное давление гидравлическое
		add_object_blockchain.hydraulic_test_pressure = assembly_unit.hydraulic_test_pressure;
		// Технические условия
		add_object_blockchain.technical_conditions = dictionary_technical_conditions.recname;
	}

	// Поглощающий аппарат
	if (assembly_unit_type.recid == "700b86ca-5b88-44d6-a5d3-c2c4e76d96f8") {
		// certificate_number (Сведения о сертификате соответствия)
		if (isEmptyString(assembly_unit.certificate_number)) {
			return badResp("Требуется заполнить обязательное поле - Сведения о сертификате соответствия.");
		}
		var reestr_certificates = db.findbyrecid("reestr_certificates", assembly_unit.certificate_number);
		if (isNullObject(reestr_certificates)) {
			return badResp("Сведения о сертификате соответствия не найдены в системе.");
		}

		// ke_manufacturer (Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя)
		if (isEmptyString(assembly_unit.manufacturer)) {
			return badResp("Требуется заполнить обязательное поле - Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя.");
		}
		var manufacturer = db.findbyrecid("dictionary_branding_codes", assembly_unit.manufacturer);
		if (isNullObject(manufacturer)) {
			return badResp("Предприятие-изготовитель не найден в системе.");
		}

		// branding_code_certificate_number (Регистрационный номер свидетельства о присвоении номера для клеймения)
		if (isEmptyString(assembly_unit.branding_code_certificate_number)) {
			return badResp("Требуется заполнить обязательное поле - Регистрационный номер свидетельства о присвоении номера для клеймения.");
		}

		// manufacturer_number (Номер изделия по системе нумерации предприятия-изготовителя)
		if (isEmptyString(assembly_unit.manufacturer_number)) {
			return badResp("Требуется заполнить обязательное поле - Номер изделия по системе нумерации предприятия-изготовителя.");
		}

		//проверка на уникальность по дате, номеру, заводу, типу
		var validate_dublicate = validate_dublicate_nodes(assembly_unit);
		if(!validate_dublicate.success)
			return validate_dublicate;
			
		// absorbing_device_model (Обозначение модели поглощающего аппарата)
		if (isEmptyString(assembly_unit.absorbing_device_model)) {
			return badResp("Требуется заполнить обязательное поле - Обозначение модели поглощающего аппарата.");
		}
		var dictionary_absorbing_device_model = db.findbyrecid("dictionary_absorbing_device_body_models", assembly_unit.absorbing_device_model);
		if (isNullObject(dictionary_absorbing_device_model)) {
			return badResp("Модель поглощающего аппарата не найдена в системе");
		}

		// technical_conditions (Технические условия)
		var reestr_documentation_fields = db.findbyrecid("reestr_documentation", assembly_unit.documentation_number);
		if (isNullObject(reestr_documentation_fields)) {
			return badResp(error_message_head + "Запись в реестре документации не найдена.");
		}
		var dictionary_technical_conditions = db.findbyparams("dictionary_technical_conditions", {
			recname: assembly_unit.technical_conditions
		});
		if (isEmptyOrNullArray(dictionary_technical_conditions)) {
			return badResp(error_message_head + "Запись в справочнике Технические условия не найдена.");
		}

		// absorbing_device_body_model (Класс поглощающего аппарата)
		if (isEmptyString(assembly_unit.class_absorbing_device)) {
			return badResp("Требуется заполнить обязательное поле - Класс поглощающего аппарата.");
		}
		var dictionary_class_absorbing_device = db.findbyrecid("dictionary_class_absorbing_device", assembly_unit.class_absorbing_device);
		if (isNullObject(dictionary_class_absorbing_device)) {
			return badResp("Класс поглощающего аппарата не найдена в системе");
		}

		// energy_intensity (Энергоемкость)
		if (isEmptyString(assembly_unit.energy_intensity)) {
			return badResp("Требуется заполнить обязательное поле - Энергоемкость.");
		}

		// life_time (Срок службы)
		if (isEmptyString(assembly_unit.life_time)) {
			return badResp("Требуется заполнить обязательное поле - Срок службы.");
		}

		// Сведения о сертификате соответствия
		add_object_blockchain.certificate_number = reestr_certificates.registration_number;
		// Условный номер для клеймения продукции вагоностроения
		add_object_blockchain.manufacturer_code = manufacturer.code;
		// Сокращенное наименование предприятия-изготовителя
		add_object_blockchain.manufacturer_name = manufacturer.recname;
		// Регистрационный номер свидетельства о присвоении номера для клеймения
		add_object_blockchain.branding_code_certificate_number = assembly_unit.branding_code_certificate_number;
		// Номер изделия по системе нумерации предприятия-изготовителя
		add_object_blockchain.manufacturer_number = assembly_unit.manufacturer_number;
		// Обозначение модели  
		add_object_blockchain.absorbing_device_model = dictionary_absorbing_device_model.recname;
		// Технические условия
		add_object_blockchain.technical_conditions = dictionary_technical_conditions[0].recname;
		// Срок службы
		add_object_blockchain.life_time = assembly_unit.life_time;
		// Класс поглащающего аппарата 
		add_object_blockchain.class_absorbing_device = dictionary_class_absorbing_device.recname;
		// Энергоемкость
		add_object_blockchain.energy_intensity = assembly_unit.energy_intensity;
	}

	// Воздухораспределитель в сборе
	if (assembly_unit_type.recid == "a6180bfa-368d-4eff-97f2-c4f6c2612bc6") {
		// certificate_number (Сведения о сертификате соответствия)
		if (isEmptyString(assembly_unit.certificate_number)) {
			return badResp("Требуется заполнить обязательное поле - Сведения о сертификате соответствия.");
		}
		var reestr_certificates = db.findbyrecid("reestr_certificates", assembly_unit.certificate_number);
		if (isNullObject(reestr_certificates)) {
			return badResp("Сведения о сертификате соответствия не найдены в системе.");
		}

		// life_time (Срок службы)
		if (isEmptyString(assembly_unit.life_time)) {
			return badResp("Требуется заполнить обязательное поле - Срок службы.");
		}

		// ke_manufacturer (Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя)
		if (isEmptyString(assembly_unit.manufacturer)) {
			return badResp("Требуется заполнить обязательное поле - Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя.");
		}
		var manufacturer = db.findbyrecid("dictionary_branding_codes", assembly_unit.manufacturer);
		if (isNullObject(manufacturer)) {
			return badResp("Предприятие-изготовитель не найден в системе.");
		}

		// branding_code_certificate_number (Регистрационный номер свидетельства о присвоении номера для клеймения)
		if (isEmptyString(assembly_unit.branding_code_certificate_number)) {
			return badResp("Требуется заполнить обязательное поле - Регистрационный номер свидетельства о присвоении номера для клеймения.");
		}

		// technical_conditions (Технические условия)
		var reestr_documentation_fields = db.findbyrecid("reestr_documentation", assembly_unit.documentation_number);
		if (isNullObject(reestr_documentation_fields)) {
			return badResp(error_message_head + "Запись в реестре документации не найдена.");
		}
		var dictionary_technical_conditions = db.findbyparams("dictionary_technical_conditions", {
			recname: assembly_unit.technical_conditions
		});
		if (isEmptyOrNullArray(dictionary_technical_conditions)) {
			return badResp(error_message_head + "Запись в справочнике Технические условия не найдена.");
		}

		// manufacturer_number (Номер изделия по системе нумерации предприятия-изготовителя)
		if (isEmptyString(assembly_unit.manufacturer_number)) {
			return badResp("Требуется заполнить обязательное поле - Номер изделия по системе нумерации предприятия-изготовителя.");
		}

		// air_distributor_model (Обозначение модели воздухораспределителя)
		if (isEmptyString(assembly_unit.air_distributor_model)) {
			return badResp("Требуется заполнить обязательное поле - Обозначение модели воздухораспределителя.");
		}
		var dictionary_air_distributor_model = db.findbyrecid("dictionary_air_distributor_models", assembly_unit.air_distributor_model);
		if (isNullObject(dictionary_air_distributor_model)) {
			return badResp("Модель воздухораспределителя не найдена в системе");
		}

		//проверка на уникальность по дате, номеру, заводу, типу
		var validate_dublicate = validate_dublicate_nodes(assembly_unit);
		if(!validate_dublicate.success)
			return validate_dublicate;
		
		// Сведения о сертификате соответствия
		add_object_blockchain.certificate_number = reestr_certificates.registration_number;
		// Условный номер для клеймения продукции вагоностроения
		add_object_blockchain.manufacturer_code = manufacturer.code;
		// Сокращенное наименование предприятия-изготовителя
		add_object_blockchain.manufacturer_name = manufacturer.recname;
		// Регистрационный номер свидетельства о присвоении номера для клеймения
		add_object_blockchain.branding_code_certificate_number = assembly_unit.branding_code_certificate_number;
		// Номер изделия по системе нумерации предприятия-изготовителя
		add_object_blockchain.manufacturer_number = assembly_unit.manufacturer_number;
		// Обозначение модели  
		add_object_blockchain.air_distributor_model = dictionary_air_distributor_model.recname;
		// Технические условия
		add_object_blockchain.technical_conditions = dictionary_technical_conditions[0].recname;
		// Срок службы
		add_object_blockchain.life_time = assembly_unit.life_time;
	}
	
	// Воздухораспределитель (сборочная единица)
	if (assembly_unit_type.recid == "a6180bfa-368d-4eff-97f2-c4f6c2612bc6") {
		
		// manufacturer_number (Номер изделия по системе нумерации предприятия-изготовителя)
		if (isEmptyString(assembly_unit.manufacturer_number)) {
			return badResp("Требуется заполнить обязательное поле - Номер изделия по системе нумерации предприятия-изготовителя.");
		}

		//проверка на уникальность по дате, номеру, заводу, типу
		var validate_dublicate = validate_dublicate_nodes(assembly_unit);
		if(!validate_dublicate.success)
			return validate_dublicate;
	}
	
	// Поглощающий аппарат (сборочная единица)
	if (assembly_unit_type.recid == "700b86ca-5b88-44d6-a5d3-c2c4e76d96f8") {
		
		// manufacturer_number (Номер изделия по системе нумерации предприятия-изготовителя)
		if (isEmptyString(assembly_unit.manufacturer_number)) {
			return badResp("Требуется заполнить обязательное поле - Номер изделия по системе нумерации предприятия-изготовителя.");
		}

		//проверка на уникальность по дате, номеру, заводу, типу
		var validate_dublicate = validate_dublicate_nodes(assembly_unit);
		if(!validate_dublicate.success)
			return validate_dublicate;
	}

	var add_object_blockchain_resp = assemblyUnitAddObjectBlockchain(add_object_blockchain);

	if (!!add_object_blockchain_resp.result) {
		assembly_unit.blockchainhash = add_object_blockchain_resp.result.hash;
		assembly_unit.blockchainnode = add_object_blockchain_resp.result.node;
		assembly_unit.blockchainrecn = add_object_blockchain_resp.result.recn;
		assembly_unit.blockchaintn = add_object_blockchain_resp.result.tn;
	}
	else {
		return badResp(add_object_blockchain_resp);
	}

	// Установка метки на СЕ в блокчейне
	if (!!assembly_unit.blockchainhash) {
		var initial_release_date = date.toISOString();

		var set_label_blockchain = {
			"nodeip": nodeip,

			"hash": assembly_unit.blockchainhash,
			"node": assembly_unit.blockchainnode,
			"recn": assembly_unit.blockchainrecn,
			"tn": assembly_unit.blockchaintn,

			"tid": null,
			"unique_number": unique_number.recname,

			"initial_release": initial_release_date
		};

		var set_label_blockchain_resp = assemblyUnitSetLabelBlockchain(set_label_blockchain);

		if (isNullObject(set_label_blockchain_resp.result)) {
			return badResp(set_label_blockchain_resp);
		}
	}

	return successResp("", assembly_unit);
}

function assemblyUnitAddObjectBlockchain(params) {
	var request =
	{
		"method": {
			"function": "add_object",
			"package": "NBD"
		},
		"object_class": params.assembly_unit_type.recname,
		"object_data": {
			"common": {
				"Способ (тип) маркировки": params.method_of_marking.trim(),
				"Наименование изделия по НД": params.assembly_unit_type.normative_name.trim(),
				"Обозначение изделия": params.documentation_number.trim(),
				"Дата изготовления": params.date_manufacture.trim(),
				"Сведения об изготовителе": params.manufacturer_details.trim()
			},
			"specific": null
		}
	};

	// Тележка
	if (params.assembly_unit_type.recid == "cbb9d8cb-89ef-4b99-be77-a7d6e57e388e") {
		request.object_data.specific =
			{
				"Технические условия": params.technical_conditions,
				"Сведения о сертификате соответствия": params.certificate_number.trim(),
				"Срок службы": params.life_time.trim(),
				"Условный номер для клеймения продукции вагоностроения (по справочнику СЖА 1001 17)": params.manufacturer_code.trim(),
				"Сокращенное наименование предприятия-изготовителя (по справочнику СЖА 1001 17)": params.manufacturer_name.trim(),
				"Регистрационный номер свидетельства о присвоении номера для клеймения": params.branding_code_certificate_number.trim(),
				"Номер изделия по системе нумерации предприятия-изготовителя": params.manufacturer_number.trim(),
				"Код государства собственника детали (значение из классификатора КЖА 1001 15)": params.administration_code.trim(),
				"Обозначение модели": params.truck_model.trim(),
				"Тип тележки": params.truck_type.trim(),
				"Максимальная расчетная статическая осевая нагрузка": params.max_static_axial_load.trim()
			};
	}

	// Колесная пара
	if (params.assembly_unit_type.recid == "a3afe986-102a-4a10-aafe-5407134f7c15") {
		request.object_data.specific =
			{
				"Технические условия": params.technical_conditions,
				"Условный номер для клеймения продукции вагоностроения (по справочнику СЖА 1001 17)": params.manufacturer_code.trim(),
				"Сокращенное наименование предприятия-изготовителя (по справочнику СЖА 1001 17)": params.manufacturer_name.trim(),
				"Регистрационный номер свидетельства о присвоении номера для клеймения": params.branding_code_certificate_number.trim(),
				"Код государства собственника детали (значение из классификатора КЖА 1001 15)": params.administration_code.trim(),
				"Максимальная расчетная статическая осевая нагрузка": params.max_static_axial_load.trim()
			};
	}

	// Колесная пара без буксовых узлов
	if (params.assembly_unit_type.recid == "00b0b326-a67a-4ce2-95af-376fcc9d8355") {
		request.object_data.specific =
			{
				"Технические условия": params.technical_conditions,
				"Сведения о сертификате соответствия": params.certificate_number.trim(),
				"Условный номер для клеймения продукции вагоностроения (по справочнику СЖА 1001 17)": params.manufacturer_code.trim(),
				"Сокращенное наименование предприятия-изготовителя (по справочнику СЖА 1001 17)": params.manufacturer_name.trim(),
				"Регистрационный номер свидетельства о присвоении номера для клеймения": params.branding_code_certificate_number.trim()
			};
	}

	// Скользун
	if (params.assembly_unit_type.recid == "a70bf64c-215b-4d42-9c8e-f8ab4ac9f357") {
		request.object_data.specific =
			{
				"Условный номер для клеймения продукции вагоностроения (по справочнику СЖА 1001 17)": params.manufacturer_code.trim(),
				"Сокращенное наименование предприятия-изготовителя (по справочнику СЖА 1001 17)": params.manufacturer_name.trim(),
				"Регистрационный номер свидетельства о присвоении номера для клеймения": params.branding_code_certificate_number.trim()
			};
	}

	// Триангель
	if (params.assembly_unit_type.recid == "c790c624-b93e-498b-97ba-0fb47f8b4b52") {
		request.object_data.specific =
			{
				"Сведения о сертификате соответствия": params.certificate_number,
				"Условный номер для клеймения продукции вагоностроения (по справочнику СЖА 1001 17)": params.manufacturer_code.trim(),
				"Сокращенное наименование предприятия-изготовителя (по справочнику СЖА 1001 17)": params.manufacturer_name.trim(),
				"Регистрационный номер свидетельства о присвоении номера для клеймения": params.branding_code_certificate_number.trim(),
				"Номер изделия по системе нумерации предприятия-изготовителя": params.manufacturer_number.trim()
			};
	}

	//Автосцепка
	if (params.assembly_unit_type.recid == "ae11ae44-1c69-49e0-83a1-4122bb2d80ae") {
		request.object_data.specific =
			{
				"Технические условия": params.technical_conditions,
				"Сведения о сертификате соответствия": params.certificate_number,
				"Условный номер для клеймения продукции вагоностроения (по справочнику СЖА 1001 17)": params.manufacturer_code.trim(),
				"Сокращенное наименование предприятия-изготовителя (по справочнику СЖА 1001 17)": params.manufacturer_name.trim(),
				"Регистрационный номер свидетельства о присвоении номера для клеймения": params.branding_code_certificate_number.trim(),
				"Номер изделия по системе нумерации предприятия-изготовителя": params.manufacturer_number.trim(),
				"Индивидуальные особенности": params.individual_features.trim(),
				"Обозначение модели": params.autocoupler_model.trim()
			};
	}

	//Котел вагона-цистерны 
	if (params.assembly_unit_type.recid == "79ddf686-f26f-4567-97ac-cb18eadd83e9") {
		request.object_data.specific =
			{
				"Сведения о сертификате соответствия": params.certificate_number.trim(),
				"Срок службы": params.life_time.trim(),
				"Номер изделия по системе нумерации предприятия-изготовителя": params.manufacturer_number.trim(),
				"Марка материала": params.steel_grade.trim(),
				"Объем кузова (котла)": params.carcass_volume.trim(),
				"Рабочее (избыточное) давление при перевозке": params.operating_pressure_transportation.trim(),
				"Рабочее (избыточное) давление при разгрузке": params.operating_pressure_unloading.trim(),
				"Расчетное давление": params.design_pressure.trim(),
				"Испытательное давление гидравлическое": params.hydraulic_test_pressure.trim()
			};
	}

	//Поглощающий аппарат
	if (params.assembly_unit_type.recid == "700b86ca-5b88-44d6-a5d3-c2c4e76d96f8") {
		request.object_data.specific =
			{
				"Технические условия": params.technical_conditions,
				"Сведения о сертификате соответствия": params.certificate_number,
				"Срок службы": params.life_time.trim(),
				"Условный номер для клеймения продукции вагоностроения (по справочнику СЖА 1001 17)": params.manufacturer_code.trim(),
				"Сокращенное наименование предприятия-изготовителя (по справочнику СЖА 1001 17)": params.manufacturer_name.trim(),
				"Регистрационный номер свидетельства о присвоении номера для клеймения": params.branding_code_certificate_number.trim(),
				"Номер изделия по системе нумерации предприятия-изготовителя": params.manufacturer_number.trim(),
				"Обозначение модели": params.absorbing_device_model.trim(),
				"Класс поглощающего аппарата": params.class_absorbing_device.trim(),
				"Энергоемкость": params.energy_intensity.trim(),
			};
	}

	// Воздухораспределитель в сборе
	if (params.assembly_unit_type.recid == "a6180bfa-368d-4eff-97f2-c4f6c2612bc6") {
		request.object_data.specific =
			{
				"Технические условия": params.technical_conditions,
				"Сведения о сертификате соответствия": params.certificate_number,
				"Срок службы": params.life_time.trim(),
				"Условный номер для клеймения продукции вагоностроения (по справочнику СЖА 1001 17)": params.manufacturer_code.trim(),
				"Сокращенное наименование предприятия-изготовителя (по справочнику СЖА 1001 17)": params.manufacturer_name.trim(),
				"Регистрационный номер свидетельства о присвоении номера для клеймения": params.branding_code_certificate_number.trim(),
				"Номер изделия по системе нумерации предприятия-изготовителя": params.manufacturer_number.trim(),
				"Обозначение модели": params.air_distributor_model.trim()
			};
	}
	
	return sendrequest(request, params.nodeip);
}

function assemblyUnitSetLabelBlockchain(params) {
	// {
	// 	"method": {
	// 		"package":"NBD",
	// 		"function":"object_set_label"
	// 	},
	// 	"object_link": <object link structure>,
	// 	"label": {
	// 		"tid": <string>,
	// 		"UIN": <string>
	// 	},
	// 	"info": {
	// 		"Сведения о первичном вводе в обращение": <string>
	// 	}
	// }

	var request = {
		"method": {
			"function": "object_set_label",
			"package": "NBD"
		},
		"object_link": {
			"hash": params.hash,
			"node": params.node,
			"recn": params.recn,
			"tn": params.tn
		},
		"label": {
			"tid": null,
			"UIN": params.unique_number
		},
		"info": {
			"Сведения о первичном вводе в обращение": params.initial_release
		}
	};

	if (!!params.tid) {
		request.label.tid = params.tid;
	}

	return sendrequest(request, params.nodeip);
}

/**
 * Генерация исторических записей (для сборки узлов при разгруппировке)
 * @param {*} parent_node   			Родительский узел
 * @param {*} child_key_elements 		Дочерние составные части узла
 */
function generateNodeAssemblyHistoryRecords(parent_node, child_key_elements) {
	var records = [];

	for (var i = 0; i < child_key_elements.length; i++) {
		var processed_key_element = child_key_elements[i];

		var assembly_record = {
			// Родительский узел
			parent_node: parent_node.recid,
			// Дочерний СЧ
			child_key_element: processed_key_element.recid,
			// Владелец СЕ
			node_owner: parent_node.node_owner
		};

		// Позиция в родительском узле
		if (isNotEmptyString(processed_key_element.position_on_node)) {
			assembly_record.parent_position_on_node = processed_key_element.position_on_node;
		}

		// // Получаем СЧ, который в данный момент хранится в бд еще со старым узлом и позицией
		// var key_element = db.findbyrecid("reestr_key_elements", processed_key_element.recid);

		if (isNotEmptyString(processed_key_element.ke_node) && parent_node_id != processed_key_element.ke_node) {
			// Дочерний узел
			assembly_record.child_node = processed_key_element.ke_node;

			// Позиция в дочернем узле
			if (isNotEmptyString(processed_key_element.position_on_node)) {
				assembly_record.child_position_on_node = processed_key_element.position_on_node;
			}
		}

		records.push(assembly_record);
	}

	return successResp("", records);
}

/**
 * Заполнение полей карточки узла из шаблона
 * @param {*} assembly_element 		шаблон
 */
function getValuesFromAssemblyElementPattern(assembly_element) {
	// Получение номенклатуры текущего узла
	var reestr_ke_node_type = db.findbyrecid("reestr_ke_node_types", assembly_element.reestr_ke_node_type);

	var date = new Date();

	var currentownerid;
	var reestr_members_owner = null;

	if (isEmptyString(assembly_element.memberid)) {
		reestr_members_owner = getmemberbyuser();
	} else {
		reestr_members_owner = db.findbyrecid("reestr_members", assembly_element.memberid);
	}

	if (!!reestr_members_owner) {
		currentownerid = reestr_members_owner.recid;
	}

	// Способ (тип) маркировки
	assembly_element.method_of_marking = reestr_ke_node_type.method_of_marking;
	// Способ кодировки
	assembly_element.method_of_encoding = reestr_ke_node_type.method_of_encoding;
	// Обозначение изделия
	assembly_element.documentation_number = reestr_ke_node_type.documentation;
	// Сведения об изготовителе
	if(isEmptyString(reestr_ke_node_type.manufacturer_details)){
		assembly_element.manufacturer_details = currentownerid;
	}else{
		assembly_element.manufacturer_details = reestr_ke_node_type.manufacturer_details;
	}
	// Дата изготовления
	assembly_element.formation_date = reestr_ke_node_type.date_manufacture;
	// Сведения об изготовителе заготовки
	var manufacturer_factory = db.findbyrecid("reestr_members", assembly_element.manufacturer_details);
	//Если в шаблоне указан изготовитель заготовки, прописываем его, иначе пишем туда инфу о заводе-изготовителе
	if (isNotEmptyString(reestr_ke_node_type.billet_manufacturer_info)) {
		var dict_billet_manufactorer_details = db.findbyrecid("dictionary_billet_manufacturer_details", reestr_ke_node_type.billet_manufacturer_info);
		if (isNotNullObject(dict_billet_manufactorer_details)) {
			if (isNotEmptyString(dict_billet_manufactorer_details.billet_manufacturer_name)) {
				assembly_element.billet_manufacturer_info = dict_billet_manufactorer_details.billet_manufacturer_name;
			} else {
				assembly_element.billet_manufacturer_info = manufacturer_factory.fullname;
			}
		} else {
			assembly_element.billet_manufacturer_info = manufacturer_factory.fullname;
		}
	} else {
		assembly_element.billet_manufacturer_info = manufacturer_factory.fullname;
	}

	// Сведения о сертификате соответствия
	assembly_element.certificate_number = reestr_ke_node_type.certificate_number;
	// Срок службы
	assembly_element.life_time = reestr_ke_node_type.life_time;
	// Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
	assembly_element.manufacturer = reestr_ke_node_type.manufacturer;

	var manufacturer_branding_code = null;
	// Если в шаблоне указан Завод изготовитель и он есть в системе, то в СЧ прописываем его,
	// иначе определяем код клеймения участника текущего пользователя и прописываем его 
	if (isNotEmptyString(reestr_ke_node_type.manufacturer)) {
		// Проверяем, что указанное в шаблоне предприятие есть в системе
		manufacturer_branding_code = db.findbyrecid("dictionary_branding_codes", reestr_ke_node_type.manufacturer);
		if (isNotNullObject(manufacturer_branding_code)) {
			assembly_element.manufacturer = reestr_ke_node_type.manufacturer;
		}
	}
	if (isEmptyString(assembly_element.manufacturer)) {
		manufacturer_branding_code = db.findbyrecid("dictionary_branding_codes", reestr_members_owner.branding_code);
		if (isNullObject(manufacturer_branding_code)) {
			return badResp("Условный код владельца не найден в системе.");
		}

		assembly_element.manufacturer = manufacturer_branding_code.recid;
	}

	// Регистрационный номер свидетельства о присвоении номера для клеймения
	if (isNotNullObject(manufacturer_branding_code) && isNotEmptyString(assembly_element.ke_node_type)) {
		// Регистрационный номер свидетельства о присвоении условного номера для клеймения
		var dictionary_branding_code_certificate_numbers_params = {
			"branding_code": manufacturer_branding_code.recid,
			"ke_node_type": assembly_element.ke_node_type
		};
		var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);

		var branding_code_certificate_number = null;
		if (isNotEmptyOrNullArray(branding_code_certificate_numbers)) {
			branding_code_certificate_number = branding_code_certificate_numbers[0];
			assembly_element.branding_code_certificate_number = branding_code_certificate_number.recname;
		}
	}

	// Индивидуальные особенности
	assembly_element.individual_features = reestr_ke_node_type.individual_features;
	// Номер изделия по системе нумерации предприятия-изготовителя
	assembly_element.manufacturer_number = reestr_ke_node_type.manufacturer_number;
	// Марка материала
	assembly_element.steel_grade = reestr_ke_node_type.steel_grade;
	// Код государства собственника детали
	assembly_element.administration_code = reestr_ke_node_type.administration_code;
	// Обозначение модели (автосцепки)
	assembly_element.autocoupler_model = reestr_ke_node_type.autocoupler_model;
	// Обозначение модели (тележки)
	assembly_element.truck_model = reestr_ke_node_type.truck_model;

	// Объем кузова (котла)
	if (isNotEmptyString(reestr_ke_node_type.carcass_volume)) {
		reestr_ke_node_type.carcass_volume = reestr_ke_node_type.carcass_volume.replace(",", "\.");
		if (isNaN(reestr_ke_node_type.carcass_volume)) {
			return badResp("Объем кузова не число, требуется исправить шаблон");
		}
		var carcass_volume_parsed = parseFloat(reestr_ke_node_type.carcass_volume, 10);
		if (carcass_volume_parsed < 0) {
			return badResp("Объем кузова отрицателен, требуется исправить шаблон");
		}
		assembly_element.carcass_volume = reestr_ke_node_type.carcass_volume;
	}

	// Тип тележки
	assembly_element.truck_type = reestr_ke_node_type.truck_type;

	// Максимальная расчетная статическая осевая нагрузка
	if (isNotEmptyString(reestr_ke_node_type.max_static_axial_load)) {
		reestr_ke_node_type.max_static_axial_load = reestr_ke_node_type.max_static_axial_load.replace(",", "\.");
		if (isNaN(reestr_ke_node_type.max_static_axial_load)) {
			return badResp("Максимальная расчетная статическая осевая нагрузка не число, требуется исправить шаблон");
		}
		var max_static_axial_load_parsed = parseFloat(reestr_ke_node_type.max_static_axial_load, 10);
		if (max_static_axial_load_parsed < 0) {
			return badResp("Максимальная расчетная статическая осевая нагрузка отрицательна, требуется исправить шаблон");
		}
		assembly_element.max_static_axial_load = reestr_ke_node_type.max_static_axial_load;
	}

	// Рабочее (избыточное) давление при перевозке
	if (isNotEmptyString(reestr_ke_node_type.operating_pressure_transportation)) {
		reestr_ke_node_type.operating_pressure_transportation = reestr_ke_node_type.operating_pressure_transportation.replace(",", "\.");
		if (isNaN(reestr_ke_node_type.operating_pressure_transportation)) {
			return badResp("Рабочее (избыточное) давление при перевозке не число, требуется исправить шаблон");
		}
		var operating_pressure_transportation_parsed = parseFloat(reestr_ke_node_type.operating_pressure_transportation, 10);
		if (operating_pressure_transportation_parsed < 0) {
			return badResp("Рабочее (избыточное) давление при перевозке отрицательно, требуется исправить шаблон");
		}
		assembly_element.operating_pressure_transportation = reestr_ke_node_type.operating_pressure_transportation;
	}

	// Рабочее (избыточное) давление при разгрузке
	if (isNotEmptyString(reestr_ke_node_type.operating_pressure_unloading)) {
		reestr_ke_node_type.operating_pressure_unloading = reestr_ke_node_type.operating_pressure_unloading.replace(",", "\.");
		if (isNaN(reestr_ke_node_type.operating_pressure_unloading)) {
			return badResp("Рабочее (избыточное) давление при разгрузке не число, требуется исправить шаблон");
		}
		var operating_pressure_unloading_parsed = parseFloat(reestr_ke_node_type.operating_pressure_unloading, 10);
		if (operating_pressure_unloading_parsed < 0) {
			return badResp("Рабочее (избыточное) давление при разгрузке отрицательно, требуется исправить шаблон");
		}
		assembly_element.operating_pressure_unloading = reestr_ke_node_type.operating_pressure_unloading;
	}

	// Расчетное давление
	if (isNotEmptyString(reestr_ke_node_type.design_pressure)) {
		reestr_ke_node_type.design_pressure = reestr_ke_node_type.design_pressure.replace(",", "\.");
		if (isNaN(reestr_ke_node_type.design_pressure)) {
			return badResp("Расчетное давление не число, требуется исправить шаблон");
		}
		var design_pressure_parsed = parseFloat(reestr_ke_node_type.design_pressure, 10);
		if (design_pressure_parsed < 0) {
			return badResp("Расчетное давление отрицательно, требуется исправить шаблон");
		}
		assembly_element.design_pressure = reestr_ke_node_type.design_pressure;
	}

	// Испытательное давление гидравлическое
	if (isNotEmptyString(reestr_ke_node_type.hydraulic_test_pressure)) {
		reestr_ke_node_type.hydraulic_test_pressure = reestr_ke_node_type.hydraulic_test_pressure.replace(",", "\.");
		if (isNaN(reestr_ke_node_type.hydraulic_test_pressure)) {
			return badResp("Испытательное давление гидравлическое не число, требуется исправить шаблон");
		}
		var hydraulic_test_pressure_parsed = parseFloat(reestr_ke_node_type.hydraulic_test_pressure, 10);
		if (hydraulic_test_pressure_parsed < 0) {
			return badResp("Испытательное давление гидравлическое отрицательно, требуется исправить шаблон");
		}
		assembly_element.hydraulic_test_pressure = reestr_ke_node_type.hydraulic_test_pressure;
	}

	// Сведения о первичном вводе в обращение
	if (isNotEmptyString(reestr_ke_node_type.initial_release)) {
		assembly_element.initial_release = reestr_ke_node_type.initial_release;
	}
	else {
		var initial_release_date = date.toISOString();
		assembly_element.initial_release = initial_release_date;
	}

	// Свидетельство о приемке
	assembly_element.acceptance_certificate = reestr_ke_node_type.acceptance_certificate;
	// Свидетельство об упаковывании
	assembly_element.packing_certificate = reestr_ke_node_type.packing_certificate;

	return successResp("", assembly_element);
}

// Блокчейн - Группировать СЧ в СЕ.
function groupAssemblyUnitBlockchain(params) {

	var request = null;

	var objects = [];

	if (isNotEmptyOrNullArray(params.reestr_key_elements)) {
		for (var i = 0; i < params.reestr_key_elements.length; i++) {
			var link_struct = {
				"hash": params.reestr_key_elements[i].blockchainhash,
				"node": params.reestr_key_elements[i].blockchainnode,
				"recn": params.reestr_key_elements[i].blockchainrecn,
				"tn": params.reestr_key_elements[i].blockchaintn
			};

			var info_struct = {};
			if (isNotEmptyString(params.reestr_key_elements[i].position_on_node___value)) {
				info_struct = {
					"Позиция в узле": params.reestr_key_elements[i].position_on_node___value
				}
			} else {
				info_struct = {
					"Позиция в узле": "null"
				}
			}

			objects.push({
				"link": link_struct,
				"info": info_struct
			})
		}
	}

	request =
		{
			"method":
			{
				"function": "object_make_group",
				"package": "NBD"
			},
			"object_link":
			{
				"node": params.node,
				"tn": params.tn,
				"hash": params.hash,
				"recn": params.recn
			},
			"objects": objects
		};

	var blockchainResponse = sendrequest(request, params.nodeip);
	blockchainResponse.request = request;
	return blockchainResponse;
}

// Сканировать номера СЧ и создать узел
function kenodescannumbers(params) {
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
	var headers = {
		"Content-Type": "application/json"
	};
	var headers = addAuthHeader(headers);
	var url = String().concat(host, "/plugins/nbdlogicplugin/nodescannumbers/", params.recid.toString())
	var res = fetch(url, {
		headers: headers,
		"body": JSON.stringify(params),
		"Method": "post"
	});
	if(isNotEmptyString(res.data)){
		return JSON.parse(res.data)
	}else{
		return res;
	}
	// var res = true;

	// params.reestr_ke_node_type = isNotEmptyString(params.reestr_ke_node_type) ? params.reestr_ke_node_type : null;
	// params.ke_numbers = isNotEmptyString(params.ke_numbers) ? params.ke_numbers : null;

	// if (isEmptyString(params.reestr_ke_node_type)) {
	// 	return badResp("Необходимо указать \"Шаблон СЕ\"");
	// }

	// if (isEmptyString(params.ke_numbers)) {
	// 	return badResp("Необходимо указать \"Номера СЧ\"");
	// }

	// // Получение номенклатуры текущего узла
	// var reestr_ke_node_type_record = db.findbyrecid("reestr_ke_node_types", params.reestr_ke_node_type);

	// if(reestr_ke_node_type_record.ke_node_type != "c8c2ab90-8d32-41fc-8a4d-a969d13c9f04"){
	// 	// Проверяем тип сборочного элемента
	// 	var dictionary_ke_node_type = db.findbyrecid("dictionary_ke_node_types", reestr_ke_node_type_record.ke_node_type);
	// 	if (isNotEmptyString(dictionary_ke_node_type.assembly_element_type)) {
	// 		if (dictionary_ke_node_type.assembly_element_type != commonAssemblyElementTypes.node_id) {
	// 			return badResp("Для сканирования СЕ нажмите кнопку \"Сканировать номера в СЕ\".");
	// 		}
	// 		else {
	// 			params.assembly_element_type = dictionary_ke_node_type.assembly_element_type;
	// 		}
	// 	}
	// 	else {
	// 		params.assembly_element_type = commonAssemblyElementTypes.node_id;
	// 	}
	// 	// Получение номенклатуры текущего узла
	// 	var reestr_ke_node_type_record = db.findbyrecid("reestr_ke_node_types", params.reestr_ke_node_type);
	// 	if (isNullObject(reestr_ke_node_type_record)) {
	// 		return badResp("Не удалось найти номенклатуру для узла");
	// 	}
	// 	if (isEmptyString(reestr_ke_node_type_record.documentation)) {
	// 		return badResp("Невозможно определить комплектацию узла, заполните поле \"Обозначение по КД\" в шаблоне узла");
	// 	}
	// 	var dictionary_count_key_elements_by_node_type_records = db.findbyparams("dictionary_count_key_elements_by_node_type", {
	// 		"ke_node_type": reestr_ke_node_type_record.ke_node_type,
	// 		"scheme": reestr_ke_node_type_record.documentation
	// 	})
	// 	if (isEmptyOrNullArray(dictionary_count_key_elements_by_node_type_records)) {
	// 		return badResp("Для чертежа, указанного в шаблоне узла/СЕ, не найдена запись в справочнике Кол-во СЧ/СЕ в СЕ/узле");
	// 	}
	// 	var dictionary_count_key_elements_by_node_type_record = dictionary_count_key_elements_by_node_type_records[0];

	// 	var input_key_elements = JSON.parse(params.ke_numbers);

	// 	var key_elements_obj = [];
	// 	// Получаем полные объекты СЧ по идентификаторам из входных данных
	// 	var reestr_key_elements = [];
	// 	for (var i = 0; i < input_key_elements.length; i++) {
	// 		//key_elements_obj.push({
	// 		//	"number": input_key_elements[i].number,
	// 		//	"reestr_key_element": null,
	// 		//	"hasError": false,
	// 		//	"message": null
	// 		//});


	// 		var key_element = db.findbyrecid("reestr_key_elements", input_key_elements[i].number);
	// 		if (isNullObject(key_element)) {
	// 			key_elements_obj.push({
	// 				"number": input_key_elements[i].number,
	// 				"reestr_key_element": null,
	// 				"hasError": true,
	// 				"message": "составная часть не найден в системе."
	// 			});
	// 			continue;
	// 			//return badResp("составная часть не найден в системе.");
	// 		}


	// 		//Проверяем что СЧ не используется в других узлах
	// 		if (isNotEmptyString(key_element.ke_node)) {
	// 			var used_node = db.findbyrecid("reestr_ke_nodes", key_element.ke_node);

	// 			if (isNotNullObject(used_node)) {
	// 				key_elements_obj.push({
	// 					"number": input_key_elements[i].number,
	// 					"reestr_key_element": null,
	// 					"hasError": true,
	// 					"message": "СЧ " + key_element.numberke + " уже установлен в узел " + used_node.readonly_ke_node
	// 				});
	// 				//return badResp("СЧ " + key_element.numberke + " уже установлен в узел " + used_node.readonly_ke_node);
	// 			} else {
	// 				key_elements_obj.push({
	// 					"number": input_key_elements[i].number,
	// 					"reestr_key_element": null,
	// 					"hasError": true,
	// 					"message": "СЧ " + key_element.numberke + " уже установлен в другой узел"
	// 				});
	// 				//return badResp("СЧ " + key_element.numberke + " уже установлен в другой узел");
	// 			}
	// 			continue;
	// 		}

	// 		// Если сканируем СЧ из дочернего узла
	// 		if (isNotEmptyString(key_element.ke_node)) {
	// 			// Балка надрессорная, Ось чистовая, Ось черновая Рама боковая, Кольцо в подпятник, 
	// 			// Замок, Валик подъемника, Корпус автосцепки, Вкладыш подпятника
	// 			if (key_element.key_element_code == "477d0c01-84d3-441c-9bb9-15f9d609671d"
	// 				|| key_element.key_element_code == "e4ef0365-0365-40df-ab4e-a77104c352df"
	// 				|| key_element.key_element_code == "b28e1a4f-d340-4ce0-a37a-d84dcfa1b6fb"
	// 				|| key_element.key_element_code == "8cdec5a2-69ac-4dd9-8568-f53853b55f86"
	// 				|| key_element.key_element_code == "9c60e01e-b4b7-448a-ae1b-7709f55d43a2"
	// 				|| key_element.key_element_code == "966f3039-1528-4af5-9e8e-2378dd738243"
	// 				|| key_element.key_element_code == "6eab3f2a-03b7-4570-9278-55944ed353d2"
	// 				|| key_element.key_element_code == "a70ac9bc-3212-4361-9b83-ab36282f7c97"
	// 				|| key_element.key_element_code == "a0e6b16a-5fee-4318-a4dc-115ae65d4b09") {
	// 				key_elements_obj.push({
	// 					"number": input_key_elements[i].number,
	// 					"reestr_key_element": null,
	// 					"hasError": true,
	// 					"message": "Для установки узла нельзя использовать составная часть с типами: Балка надрессорная, Ось чистовая, Ось черновая, Рама боковая, Кольцо в подпятник, Замок, Валик подъемника, Корпус автосцепки, Вкладыш подпятника."
	// 				});
	// 				continue;
	// 				//return badResp("Для установки узла нельзя использовать составная часть с типами: Балка надрессорная, Ось чистовая, Ось черновая, Рама боковая, Кольцо в подпятник, Замок, Валик подъемника, Корпус автосцепки, Вкладыш подпятника.");
	// 			}

	// 			var assembly_element = db.findbyrecid("reestr_ke_nodes", key_element.ke_node);
	// 			if (isNullObject(assembly_element)) {
	// 				key_elements_obj.push({
	// 					"number": input_key_elements[i].number,
	// 					"reestr_key_element": null,
	// 					"hasError": true,
	// 					"message": "Сборочный элемент не найден в системе."
	// 				});
	// 				continue;
	// 				//return badResp("Сборочный элемент не найден в системе.");
	// 			}

	// 			if (assembly_element.status != "823cc6e9-465b-416e-beda-8a642149c235") {
	// 				key_elements_obj.push({
	// 					"number": input_key_elements[i].number,
	// 					"reestr_key_element": null,
	// 					"hasError": true,
	// 					"message": "Нельзя установить сборочный элемент " + assembly_element.unique_number + " в текущем статусе."
	// 				});
	// 				continue;
	// 				//return badResp("Нельзя установить СЕ " + assembly_element.unique_number + " в текущем статусе.");
	// 			}

	// 			if (isEmptyString(input_key_elements[i].position)) {
	// 				key_elements_obj.push({
	// 					"number": input_key_elements[i].number,
	// 					"reestr_key_element": null,
	// 					"hasError": true,
	// 					"message": "Для одного из составных частей не указана позиция."
	// 				});
	// 				continue;
	// 				//return badResp("Для одного из составных частей не указана позиция.");
	// 			}

	// 			var position_on_parent_node = db.findbyrecid("dictionary_positions_on_parent_node", input_key_elements[i].position);
	// 			if (isNullObject(position_on_parent_node)) {
	// 				key_elements_obj.push({
	// 					"number": input_key_elements[i].number,
	// 					"reestr_key_element": null,
	// 					"hasError": true,
	// 					"message": "Не удалось определить одну из позиций СЧ в узле."
	// 				});
	// 				continue;
	// 				//return badResp("Не удалось определить одну из позиций СЧ в узле.");
	// 			}

	// 			key_element.position_on_parent_node = position_on_parent_node.recid;
	// 			key_element.position_on_parent_node___value = position_on_parent_node.recname;

	// 			key_elements_obj.push({
	// 				"number": input_key_elements[i].number,
	// 				"reestr_key_element": key_element,
	// 				"hasError": false,
	// 				"message": null
	// 			});
	// 			reestr_key_elements.push(key_element);
	// 		}
	// 		// Если сканируем СЧ
	// 		else {
	// 			var key_element_node_positions_params = {
	// 				key_element_code: key_element.key_element_code,
	// 				node_type: dictionary_ke_node_type.recid
	// 			};

	// 			var key_element_node_positions = db.findbyparams("dictionary_positions_on_node", key_element_node_positions_params);

	// 			if (isNotEmptyOrNullArray(key_element_node_positions)) {
	// 				if (isEmptyString(input_key_elements[i].position)) {
	// 					key_elements_obj.push({
	// 						"number": input_key_elements[i].number,
	// 						"reestr_key_element": null,
	// 						"hasError": true,
	// 						"message": "Для одного из составных частей не указана позиция."
	// 					});
	// 					continue;
	// 					//return badResp("Для одного из составных частей не указана позиция.");
	// 				}

	// 				var position_on_node = db.findbyrecid("dictionary_positions_on_node", input_key_elements[i].position);
	// 				if (isNullObject(position_on_node)) {
	// 					key_elements_obj.push({
	// 						"number": input_key_elements[i].number,
	// 						"reestr_key_element": null,
	// 						"hasError": true,
	// 						"message": "Не удалось определить одну из позиций СЧ в узле."
	// 					});
	// 					continue;
	// 					//return badResp("Не удалось определить одну из позиций СЧ в узле.");
	// 				}

	// 				key_element.position_on_node = position_on_node.recid;
	// 				key_element.position_on_node___value = position_on_node.recname;
	// 			}

	// 			key_elements_obj.push({
	// 				"number": input_key_elements[i].number,
	// 				"reestr_key_element": key_element,
	// 				"hasError": false,
	// 				"message": null
	// 			});
	// 			reestr_key_elements.push(key_element);
	// 		}
	// 	}

	// 	// Проверяем общее количество отсканированных элементов
	// 	if (reestr_key_elements.length == 0 && isEmptyString(reestr_key_elements[0].ke_node)) {
	// 		return badResp("составных частей в узле должно быть минимум 1");
	// 	}
	// 	//if (key_element_obj.filter(x => x.hasError == false).length == 0 && isEmptyString(reestr_key_elements[0].ke_node)) {
	// 	//	return badResp("составных частей в узле должно быть минимум 1");
	// 	//}

	// 	//todo input_key_elements. такое вообще может быть?
	// 	// Проверка на то что в форме для номеров СЧ указаны разные позиции
	// 	for (var i = 0; i < input_key_elements.length; i++) {
	// 		for (var j = 0; j < input_key_elements.length; j++) {
	// 			if (isNotEmptyString(input_key_elements[j].position)
	// 				&& input_key_elements[j].position == input_key_elements[i].position
	// 				&& input_key_elements[j].number != input_key_elements[i].number) {
	// 				return badResp("На позицию можно установить только один СЧ.");
	// 			}
	// 		}
	// 	}

	// 	// Проводим проверку, что в узел не ставят узлы и СЧ, которые уже установлены на ТС
	// 	for (let i = 0; i < key_elements_obj.length; i++) {
	// 		if (!key_elements_obj[i].hasError) {
	// 			if (isNotEmptyString(key_elements_obj[i].reestr_key_element.ke_node)) {
	// 				var ke_node = db.findbyrecid("reestr_ke_nodes", key_elements_obj[i].reestr_key_element.ke_node);
	// 				// Если у узла или у СЧ статус "Установлен на ТС", то возвращаем ошибку
	// 				if (ke_node.status == "f831cffa-e2ce-417f-8b4f-1645715bd454"
	// 					|| key_elements_obj[i].reestr_key_element.statuske == commonConst.UstanovlenId) {

	// 					key_elements_obj[i].hasError = true;
	// 					key_elements_obj[i].message = "Узел " + ke_node.unique_number + " уже установлен на вагон.";
	// 					//return badResp("Узел " + ke_node.unique_number + " уже установлен на вагон.");
	// 				}
	// 			}
	// 			else {
	// 				// Если у СЧ статус "Установлен на ТС", то возвращаем ошибку
	// 				if (key_elements_obj[i].reestr_key_element.statuske == commonConst.UstanovlenId) {
	// 					key_elements_obj[i].hasError = true;
	// 					key_elements_obj[i].message = "составная часть " + key_elements_obj[i].reestr_key_element.numberke + " уже установлен на вагон.";
	// 					//return badResp("составная часть " + key_elements_obj[i].reestr_key_element.numberke + " уже установлен на вагон.");
	// 				}
	// 			}
	// 		}
	// 	}

	// 	var all_key_elements_obj = key_elements_obj.filter(function (element) { return element.hasError === true; });

	// 	//todo
	// 	// Проводим проверку состава устанавливаемых узлов/СЕ и СЧ
	// 	//var all_key_elements_obj = [];
	// 	//var key_elements_without_error = key_elements_obj.filter(function (element) { return element.hasError === false; });
	// 	////return badResp("", key_elements_without_error);
	// 	//for (let i = 0; i < all_key_elements.length; i++) {
	// 	//	if (key_elements_obj[i].hasError)
	// 	//		continue;

	// 	//		let check_res = checkAssemblyElementCompositionForKeyElements(dictionary_ke_node_type, key_elements_obj[i]);
	// 	//		key_elements_obj.push({
	// 	//			"key_element": all_key_elements[i],
	// 	//			"hasError": !check_res.success,
	// 	//			"message": check_res.message
	// 	//		});

	// 	//		if (!check_res.success)
	// 	//			continue;
	// 	//		let check_res2 = getAllKeyElementsWithPositionsOnNode(all_key_elements[i], null, dictionary_ke_node_type.recid, reestr_ke_node_type_record.documentation);
	// 	//		all_key_elements_obj.push({
	// 	//			"key_element": all_key_elements[i],
	// 	//			"hasError": !check_res2.success,
	// 	//			"message": check_res2.message
	// 	//		});
	// 	//	}
	// 	var check_assembly_element_composition_res = checkAssemblyElementCompositionForKeyElements(dictionary_ke_node_type, reestr_key_elements);
	// 	if (!check_assembly_element_composition_res.success) {
	// 		return check_assembly_element_composition_res;
	// 	}

	// 	//todo
	// 	var all_key_elements_res = getAllKeyElementsWithPositionsOnNode(reestr_key_elements, null, dictionary_ke_node_type.recid, reestr_ke_node_type_record.documentation);
	// 	if (!all_key_elements_res.success) {
	// 		return badResp("Произошла ошибка в процессе обработки указанных составных частей. " + all_key_elements_res.message);
	// 	}

	// 	var all_key_elements = all_key_elements_res.data;

	// 	// Проводим проверку, что все полученные СЧ будут установлены на разные позиции
	// 	var key_elements_positions = [];
	// 	for (var i = 0; i < all_key_elements.length; i++) {
	// 		if (isNotEmptyString(all_key_elements[i].position_on_node)) {
	// 			if (key_elements_positions.indexOf(all_key_elements[i].position_on_node) == -1) {
	// 				key_elements_positions.push(all_key_elements[i].position_on_node);
	// 			}
	// 			else {
	// 				return badResp(
	// 					"На позицию "
	// 					+ all_key_elements[i].position_on_node___value
	// 					+ " (" + all_key_elements[i].key_element_code___value + ")"
	// 					+ " претендует более одного СЧ. Проверьте введенные данные.");
	// 			}
	// 		}
	// 	}

	// 	var node_assembly_history_records_res = generateNodeAssemblyHistoryRecords(params, all_key_elements);
	// 	if (!node_assembly_history_records_res.success) {
	// 		return badResp("Произошла ошибка в процессе обработки указанных составных частей. " + node_assembly_history_records_res.message);
	// 	}

	// 	var node_assembly_history_records = node_assembly_history_records_res.data;

	// 	if (true) {
	// 		for (let i = 0; i < all_key_elements.length; i++) {
	// 			if (isEmptyString(all_key_elements[i].blockchainhash)) {
	// 				all_key_elements_obj.push({
	// 					"reestr_key_element": all_key_elements[i],
	// 					"hasError": true,
	// 					"message": "Для составной части <a href=\"/tables/reestr_key_elements/" + all_key_elements[i].recid +
	// 						"\" target=\"_blank\" class=\"alert-link\">" + all_key_elements[i].numberke + "</a> нельзя установить узел, т.к. он еще не был выпущен в обращение. "
	// 				});
	// 			} else {
	// 				all_key_elements_obj.push({
	// 					"reestr_key_element": all_key_elements[i],
	// 					"hasError": false,
	// 					"message": null
	// 				});
	// 			}
	// 		}
	// 		var date = new Date();

	// 		//Количества типов отсканированных элементов

	// 		var side_frame_count = 0;
	// 		var pressure_beam_count = 0;
	// 		var wheel_count = 0;
	// 		var friction_strip_count = 0;
	// 		var brace_count = 0;
	// 		var bearing_adapter_count = 0;
	// 		var friction_wedge_count = 0;
	// 		var slider_body_count = 0;
	// 		var slider_cap_count = 0;
	// 		var clear_axis_count = 0;
	// 		var wedge_pockets_count = 0;
	// 		var saddle_ring_count = 0;
	// 		var wedge_pockets_inserts_count = 0;
	// 		var saddle_bearing_count = 0;
	// 		var elevator_roll_count = 0;
	// 		var auto_coupler_count = 0;
	// 		var lock_count = 0;
	// 		var rough_axis_count = 0;

	// 		for (let i = 0; i < all_key_elements_obj.length; i++) {
	// 			if (all_key_elements_obj[i].hasError)
	// 				continue;

	// 			var reestr_key_element = all_key_elements_obj[i].reestr_key_element;

	// 			// Подсчет типов элементов
	// 			var dictionary_key_elements_code = db.findbyrecid("dictionary_key_elements_codes", reestr_key_element.key_element_code);
	// 			if (dictionary_key_elements_code != null) {
	// 				switch (dictionary_key_elements_code.reccode) {
	// 					case keyElementCodes.wheel_code:
	// 						wheel_count++;
	// 						break;
	// 					case keyElementCodes.side_frame_code:
	// 						side_frame_count++;
	// 						break;
	// 					case keyElementCodes.friction_strip_code:
	// 						friction_strip_count++;
	// 						break;
	// 					case keyElementCodes.brace_code:
	// 						brace_count++;
	// 						break;
	// 					case keyElementCodes.pressure_beam_code:
	// 						pressure_beam_count++;
	// 						break;
	// 					case keyElementCodes.slider_body_code:
	// 						slider_body_count++;
	// 						break;
	// 					case keyElementCodes.slider_cap_code:
	// 						slider_cap_count++;
	// 						break;
	// 					case keyElementCodes.friction_wedge_code:
	// 						friction_wedge_count++;
	// 						break;
	// 					case keyElementCodes.bearing_adapter_code:
	// 						bearing_adapter_count++;
	// 						break;
	// 					case keyElementCodes.clear_axis_code:
	// 						clear_axis_count++;
	// 						break;
	// 					case keyElementCodes.wedge_pockets_code:
	// 						wedge_pockets_count++;
	// 						break;
	// 					case keyElementCodes.saddle_ring_code:
	// 						saddle_ring_count++;
	// 						break;
	// 					case keyElementCodes.wedge_pockets_inserts_code:
	// 						wedge_pockets_inserts_count++;
	// 						break;
	// 					case keyElementCodes.saddle_bearing_code:
	// 						saddle_bearing_count++;
	// 						break;
	// 					case keyElementCodes.elevator_roll_code:
	// 						elevator_roll_count++;
	// 						break;
	// 					case keyElementCodes.auto_coupler_code:
	// 						auto_coupler_count++;
	// 						break;
	// 					case keyElementCodes.lock_code:
	// 						lock_count++;
	// 						break;
	// 					case keyElementCodes.rough_axis_code:
	// 						rough_axis_count++;
	// 						break;
	// 				}
	// 			} else {
	// 				all_key_elements_obj[i].hasError = true;
	// 				all_key_elements_obj[i].message = "Код СЧ не найден в справочнике условных кодов деталей";
	// 				//return badResp("Код СЧ не найден в справочнике условных кодов деталей");
	// 			}
	// 		}

	// 		//Сравнение полученного количества СЧ с максимально возможным
	// 		if (dictionary_count_key_elements_by_node_type_record.wheel_count < wheel_count) {
	// 			all_key_elements_obj[i].hasError = true;
	// 			all_key_elements_obj[i].message = "Превышено количество колес, максимум " + dictionary_count_key_elements_by_node_type_record.wheel_count;
	// 			//return badResp("Превышено количество колес, максимум " + dictionary_count_key_elements_by_node_type_record.wheel_count);
	// 		}

	// 		if (dictionary_count_key_elements_by_node_type_record.side_frame_count < side_frame_count) {
	// 			all_key_elements_obj[i].hasError = true;
	// 			all_key_elements_obj[i].message = "Превышено количество боковых рам, максимум " + dictionary_count_key_elements_by_node_type_record.side_frame_count;
	// 			//return badResp("Превышено количество боковых рам, максимум " + dictionary_count_key_elements_by_node_type_record.side_frame_count);
	// 		}

	// 		if (dictionary_count_key_elements_by_node_type_record.friction_strip_count < friction_strip_count) {
	// 			all_key_elements_obj[i].hasError = true;
	// 			all_key_elements_obj[i].message = "Превышено количество фрикционных планок, максимум " + dictionary_count_key_elements_by_node_type_record.friction_strip_count;
	// 			//return badResp("Превышено количество фрикционных планок, максимум " + dictionary_count_key_elements_by_node_type_record.friction_strip_count);
	// 		}

	// 		if (dictionary_count_key_elements_by_node_type_record.brace_count < brace_count) {
	// 			all_key_elements_obj[i].hasError = true;
	// 			all_key_elements_obj[i].message = "Превышено количество скоб, максимум " + dictionary_count_key_elements_by_node_type_record.brace_count;
	// 			//return badResp("Превышено количество скоб, максимум " + dictionary_count_key_elements_by_node_type_record.brace_count);
	// 		}

	// 		if (dictionary_count_key_elements_by_node_type_record.pressure_beam_count < pressure_beam_count) {
	// 			all_key_elements_obj[i].hasError = true;
	// 			all_key_elements_obj[i].message = "Превышено количество балок надрессорных, максимум " + dictionary_count_key_elements_by_node_type_record.pressure_beam_count;
	// 			//return badResp("Превышено количество балок надрессорных, максимум " + dictionary_count_key_elements_by_node_type_record.pressure_beam_count);
	// 		}

	// 		if (dictionary_count_key_elements_by_node_type_record.slider_body_count < slider_body_count) {
	// 			all_key_elements_obj[i].hasError = true;
	// 			all_key_elements_obj[i].message = "Превышено количество корпусов скользуна, максимум " + dictionary_count_key_elements_by_node_type_record.slider_body_count;
	// 			//return badResp("Превышено количество корпусов скользуна, максимум " + dictionary_count_key_elements_by_node_type_record.slider_body_count);
	// 		}

	// 		if (dictionary_count_key_elements_by_node_type_record.slider_cap_count < slider_cap_count) {
	// 			all_key_elements_obj[i].hasError = true;
	// 			all_key_elements_obj[i].message = "Превышено количество колпаков скользуна, максимум " + dictionary_count_key_elements_by_node_type_record.slider_cap_count;
	// 			//return badResp("Превышено количество колпаков скользуна, максимум " + dictionary_count_key_elements_by_node_type_record.slider_cap_count);
	// 		}

	// 		if (dictionary_count_key_elements_by_node_type_record.friction_wedge_count < friction_wedge_count) {
	// 			all_key_elements_obj[i].hasError = true;
	// 			all_key_elements_obj[i].message = "Превышено количество фрикционных клинов, максимум " + dictionary_count_key_elements_by_node_type_record.friction_wedge_count;
	// 			//return badResp("Превышено количество фрикционных клинов, максимум " + dictionary_count_key_elements_by_node_type_record.friction_wedge_count);
	// 		}

	// 		if (dictionary_count_key_elements_by_node_type_record.bearing_adapter_count < bearing_adapter_count) {
	// 			all_key_elements_obj[i].hasError = true;
	// 			all_key_elements_obj[i].message = "Превышено количество адаптеров подшипника, максимум " + dictionary_count_key_elements_by_node_type_record.bearing_adapter_count;
	// 			//return badResp("Превышено количество адаптеров подшипника, максимум " + dictionary_count_key_elements_by_node_type_record.bearing_adapter_count);
	// 		}

	// 		if (dictionary_count_key_elements_by_node_type_record.clear_axis_count < clear_axis_count) {
	// 			all_key_elements_obj[i].hasError = true;
	// 			all_key_elements_obj[i].message = "Превышено количество чистовых осей, максимум " + dictionary_count_key_elements_by_node_type_record.clear_axis_count;
	// 			//return badResp("Превышено количество чистовых осей, максимум " + dictionary_count_key_elements_by_node_type_record.clear_axis_count);
	// 		}

	// 		if (dictionary_count_key_elements_by_node_type_record.wedge_pockets_count < wedge_pockets_count) {
	// 			all_key_elements_obj[i].hasError = true;
	// 			all_key_elements_obj[i].message = "Превышено количество пластин в клиновых карманах, максимум " + dictionary_count_key_elements_by_node_type_record.wedge_pockets_count;
	// 			//return badResp("Превышено количество пластин в клиновых карманах, максимум " + dictionary_count_key_elements_by_node_type_record.wedge_pockets_count);
	// 		}

	// 		if (dictionary_count_key_elements_by_node_type_record.saddle_ring_count < saddle_ring_count) {
	// 			all_key_elements_obj[i].hasError = true;
	// 			all_key_elements_obj[i].message = "Превышено количество колец в подпятник, максимум " + dictionary_count_key_elements_by_node_type_record.saddle_ring_count;
	// 			//return badResp("Превышено количество колец в подпятник, максимум " + dictionary_count_key_elements_by_node_type_record.saddle_ring_count);
	// 		}

	// 		if (dictionary_count_key_elements_by_node_type_record.wedge_pockets_inserts_count < wedge_pockets_inserts_count) {
	// 			all_key_elements_obj[i].hasError = true;
	// 			all_key_elements_obj[i].message = "Превышено количество вставок в клиновые карманы, максимум " + dictionary_count_key_elements_by_node_type_record.wedge_pockets_inserts_count;
	// 			//return badResp("Превышено количество вставок в клиновые карманы, максимум " + dictionary_count_key_elements_by_node_type_record.wedge_pockets_inserts_count);
	// 		}

	// 		if (dictionary_count_key_elements_by_node_type_record.saddle_bearing_count < saddle_bearing_count) {
	// 			all_key_elements_obj[i].hasError = true;
	// 			all_key_elements_obj[i].message = "Превышено количество вкладышей подпятника, максимум " + dictionary_count_key_elements_by_node_type_record.saddle_bearing_count;
	// 			//return badResp("Превышено количество вкладышей подпятника, максимум " + dictionary_count_key_elements_by_node_type_record.saddle_bearing_count);
	// 		}


	// 		if (dictionary_count_key_elements_by_node_type_record.elevator_roll_count < elevator_roll_count) {
	// 			all_key_elements_obj[i].hasError = true;
	// 			all_key_elements_obj[i].message = "Превышено количество валиков подъемника, максимум " + dictionary_count_key_elements_by_node_type_record.elevator_roll_count;
	// 			//return badResp("Превышено количество валиков подъемника, максимум " + dictionary_count_key_elements_by_node_type_record.elevator_roll_count);
	// 		}

	// 		if (dictionary_count_key_elements_by_node_type_record.auto_coupler_count < auto_coupler_count) {
	// 			all_key_elements_obj[i].hasError = true;
	// 			all_key_elements_obj[i].message = "Превышено количество корпусов автосцепки " + dictionary_count_key_elements_by_node_type_record.auto_coupler_count;
	// 			//return badResp("Превышено количество корпусов автосцепки " + dictionary_count_key_elements_by_node_type_record.auto_coupler_count);
	// 		}

	// 		if (dictionary_count_key_elements_by_node_type_record.lock_count < lock_count) {
	// 			all_key_elements_obj[i].hasError = true;
	// 			all_key_elements_obj[i].message = "Превышено количество замков " + dictionary_count_key_elements_by_node_type_record.lock_count;
	// 			//return badResp("Превышено количество замков " + dictionary_count_key_elements_by_node_type_record.lock_count);
	// 		}

	// 		if (dictionary_count_key_elements_by_node_type_record.rough_axis_count < rough_axis_count) {
	// 			all_key_elements_obj[i].hasError = true;
	// 			all_key_elements_obj[i].message = "Превышено количество черновых осей, максимум " + dictionary_count_key_elements_by_node_type_record.rough_axis_count;
	// 			//return badResp("Превышено количество черновых осей, максимум " + dictionary_count_key_elements_by_node_type_record.rough_axis_count);
	// 		}
	// 	}


	// 	var child_node_ids = [];
	// 	var child_key_element_ids = [];

	// 	var child_nodes = [];
	// 	var child_key_elements = [];

	// 	for (let i = 0; i < all_key_elements_obj.length; i++) {
	// 		if (all_key_elements_obj[i].hasError)
	// 			continue;

	// 		if (isNotEmptyString(all_key_elements_obj[i].reestr_key_element.ke_node) && child_node_ids.indexOf(all_key_elements_obj[i].reestr_key_element.ke_node) == -1) {
	// 			var child_node = db.findbyrecid("reestr_ke_nodes", all_key_elements_obj[i].reestr_key_element.ke_node);

	// 			child_node_ids.push(all_key_elements_obj[i].reestr_key_element.ke_node);
	// 			child_nodes.push(child_node);
	// 		}
	// 		else if (isEmptyString(all_key_elements_obj[i].reestr_key_element.ke_node) && child_key_element_ids.indexOf(all_key_elements_obj[i].reestr_key_element.recid) == -1) {
	// 			child_key_element_ids.push(all_key_elements_obj[i].reestr_key_element.recid);
	// 			child_key_elements.push(all_key_elements_obj[i].reestr_key_element);
	// 		}
	// 	}

	// 	var elementsWithoutError = all_key_elements_obj.find(function (element) { return element.hasError === false; });
	// 	if (isEmptyOrNullArray(elementsWithoutError)) {
	// 		var errorMessage = "";
	// 		all_key_elements_obj.forEach(function (element) {
	// 			if (element.hasError)
	// 				errorMessage = String().concat(errorMessage, " ", element.message);
	// 		});

	// 		return successResp(errorMessage);
	// 	}

	// 	// Если были просканированы дочерние узлы
	// 	if (isNotEmptyOrNullArray(child_nodes)) {
	// 		// Необходимо разгруппировать дочерние узлы
	// 		for (let i = 0; i < child_nodes.length; i++) {
	// 			var ungroup_res = ungroupchildnode(child_nodes[i].recid);

	// 			if (!ungroup_res.success) {
	// 				return successResp(String().concat(errorMessage, " ", "Произошла ошибка в процессе разгруппировки узла " + child_nodes[i].unique_number + ". " + ungroup_res.message));
	// 				//return badResp("Произошла ошибка в процессе разгруппировки узла " + child_nodes[i].unique_number + ". " + ungroup_res.message);
	// 			}
	// 		}
	// 	}
	// 	var node = db.findbyrecid("reestr_ke_nodes", params.recid);
	// 	// Дочерним узлам указывем родительский узел и меняем статус 
	// 	for (let i = 0; i < child_nodes.length; i++) {
	// 		var child_node = db.findbyrecid("reestr_ke_nodes", child_nodes[i].recid);
	// 		child_node.parent_ke_node = node.recid;
	// 		// Тип родительского узла
	// 		child_node.parent_node_type = node.ke_node_type;
	// 		// Статус - Перенесен в родительский узел
	// 		child_node.status = "01d8f0ce-28db-4d3d-a956-38bb26260437";

	// 		var update_res = db.update("reestr_ke_nodes", child_node);

	// 		if (!update_res) {
	// 			return successResp(String().concat(errorMessage, " ", "Ошибка при сохранении записи в Реестре узлов."));
	// 			//badResp("Ошибка при сохранении записи в Реестре узлов.");
	// 		}
	// 	}


	// 	var numberke = null;
	// 	// Всем дочерним СЧ указываем родительский узел и позицию в узле
	// 	for (let i = 0; i < all_key_elements_obj.length; i++) {

	// 		if (all_key_elements_obj[i].hasError)
	// 			continue;

	// 		all_key_elements_obj[i].reestr_key_element.ke_node = node.recid;

	// 		update_res = db.update("reestr_key_elements", all_key_elements_obj[i].reestr_key_element);
	// 		if (!update_res) {
	// 			all_key_elements_obj[i].hasError = true;
	// 			all_key_elements_obj[i].message = "Ошибка при сохранении СЧ с номером " + all_key_elements_obj[i].reestr_key_element.numberke + ".";
	// 		} else {
	// 			numberke = numberke == null ? all_key_elements_obj[i].reestr_key_element.numberke : numberke;
	// 			//return badResp(all_key_elements_obj[i].reestr_key_element.numberke);

	// 		}
	// 	}
	// 	//Обновляем запись с узлом
	// 	var node = db.findbyrecid("reestr_ke_nodes", params.recid);

	// 	node.ke_node_type = dictionary_ke_node_type.recid;
	// 	node.reestr_ke_node_type = params.reestr_ke_node_type;
	// 	node.formation_date = (date).toISOString();
	// 	// Статус - готов к регистрации
	// 	node.status = "a4b6de4f-828a-46a3-b272-73a1c345ae44";
	// 	node.assembly_element_type = params.assembly_element_type;
	// 	node.documentation_number = reestr_ke_node_type_record.documentation;

	// 	node.unique_number = numberke;
	// 	//node.unique_number = all_key_elements_obj[0].numberke;
	// 	node.is_allow_ce_element = false;
	// 	node.is_registratred_in_rzd = false;

	// 	node.unique_number = all_key_elements[0].numberke;
	// 	node.unique_number_relation = all_key_elements[0].ke_number;
	// 	var update_res = db.update("reestr_ke_nodes", node);

	// 	for (let i = 0; i < all_key_elements_obj.length; i++) {
	// 		if (all_key_elements_obj[i].hasError)
	// 			continue;
	// 		var log_item = {
	// 			"reged_key_element": all_key_elements_obj[i].reestr_key_element.recid,
	// 			// Действие - Группировка
	// 			"ke_action": "e935eefb-3f88-4576-b43a-275dbf4dc787",
	// 			"operation_date": date.toISOString(),
	// 			"node_unique_number": node.unique_number,
	// 			"node_type": node.ke_node_type
	// 		};
	// 		db.insert("log", log_item);
	// 	}

	// 	if (!update_res) {
	// 		let errorMessage = "";
	// 		all_key_elements_obj.forEach(function (element) {
	// 			if (element.hasError)
	// 				errorMessage = String().concat(errorMessage, " ", element.message);
	// 		});
	// 		return successResp(String().concat(errorMessage, " ", "Ошибка при сохранении записи в Реестре узлов."));
	// 		//return badResp("Ошибка при сохранении записи в Реестре узлов.");
	// 	}

	// 	// Удаляем родительский узел
	// 	// db.delete("reestr_ke_nodes", node.recid);

	// 	//Прописываем историю в таблицу node_log
	// 	var node_log_actions = db.findbyparams("dictionary_node_actions", { "code": 1 });
	// 	var node_log_record = {
	// 		"nodeid": node.recid,
	// 		"number": node.unique_number,
	// 		"type": node.ke_node_type,
	// 		"action_date": new Date(),
	// 		//Группировка
	// 		"action": node_log_actions[0].recid,
	// 		"node_content": ""
	// 	}
	// 	//Прописываем содержимое узла
	// 	for (let i = 0; i < all_key_elements_obj.length; i++) {
	// 		if (all_key_elements_obj[i].hasError)
	// 			continue;
	// 		var key_element_type_record = db.findbyrecid("dictionary_key_elements_codes", all_key_elements_obj[i].reestr_key_element.key_element_code);
	// 		if (isNotNullObject(key_element_type_record)) {
	// 			if (i < all_key_elements_obj.length - 1) {
	// 				node_log_record.node_content += all_key_elements_obj[i].reestr_key_element.numberke + '(' + key_element_type_record.recname + ')' + ", ";
	// 			} else {
	// 				node_log_record.node_content += all_key_elements_obj[i].reestr_key_element.numberke + '(' + key_element_type_record.recname + ')';
	// 			}
	// 		} else {
	// 			if (i < all_key_elements_obj.length - 1) {
	// 				node_log_record.node_content += all_key_elements_obj[i].reestr_key_element.numberke + ", ";
	// 			} else {
	// 				node_log_record.node_content += all_key_elements_obj[i].reestr_key_element.numberke;
	// 			}
	// 		}

	// 	}
	// 	db.insert("node_log", node_log_record);

	// 	for (var i = 0; i < node_assembly_history_records.length; i++) {
	// 		db.insert("nodes_assembly_history", node_assembly_history_records[i]);
	// 	}

	// 	errorMessage = "";
	// 	all_key_elements_obj.forEach(function (element) {
	// 		if (element.hasError)
	// 			errorMessage = String().concat(errorMessage, " ", element.message);
	// 	});
	// 	elementsWithoutError = all_key_elements_obj.find(function (element) { return element.hasError === false; });
	// 	if (isEmptyOrNullArray(elementsWithoutError))
	// 		return successResp(String().concat("Узел не сгруппирован. ", errorMessage));
	// 	if (isNotEmptyString(errorMessage))
	// 		return successResp(String().concat("Узел ", node.unique_number, " собран частично: ", errorMessage));
	// 	else
	// 		return successResp("Узел успешно сгруппирован.", node.unique_number);
	// }else{
	// 	var headers = {
	// 		"Content-Type": "application/json"
	// 	};
	// 	var headers = addAuthHeader(headers);
	// 	var url = String().concat(host, "/plugins/nbdlogicplugin/nodescannumbers/", params.recid.toString())
	// 	var res = fetch(url, {
	// 		headers: headers,
	// 		"body": JSON.stringify(params),
	// 		"Method": "post"
	// 	});
	// 	if(isNotEmptyString(res.data)){
	// 		return JSON.parse(res.data)
	// 	}else{
	// 		return res;
	// 	}
	// }
	
}


/**
 * Проверка количества установленных СЧ
 * @param {*} key_elements составные части
 * @param {*} node узел
 * @param {*} check_less флаг, указывающий, нужно ли проверять меньшее количество СЧ
 */
function checkNodeComposition(key_elements, node, check_less) {

	var dictionary_count_key_elements_by_node_type_records = db.findbyparams("dictionary_count_key_elements_by_node_type", {
		"ke_node_type": node.ke_node_type,
		"scheme": node.documentation_number
	})
	if (isEmptyOrNullArray(dictionary_count_key_elements_by_node_type_records)) {
		return {
			"success": false,
			"message": "Для чертежа, указанного в шаблоне узла/СЕ, не найдена запись в справочнике Кол-во СЧ/СЕ в СЕ/узле"
		};
	}
	var dictionary_count_key_elements_by_node_type_record = dictionary_count_key_elements_by_node_type_records[0];

	//Количества типов отсканированных элементов

	var side_frame_count = 0;
	var pressure_beam_count = 0;
	var wheel_count = 0;
	var friction_strip_count = 0;
	var brace_count = 0;
	var bearing_adapter_count = 0;
	var friction_wedge_count = 0;
	var slider_body_count = 0;
	var slider_cap_count = 0
	var clear_axis_count = 0;
	var wedge_pockets_count = 0
	var saddle_ring_count = 0;
	var wedge_pockets_inserts_count = 0;
	var saddle_bearing_count = 0;
	var elevator_roll_count = 0;
	var auto_coupler_count = 0;
	var lock_count = 0;
	var rough_axis_count = 0;

	var errors = []

	for (var i = 0; i < key_elements.length; i++) {
		var reestr_key_element = key_elements[i];
		// //Eсли Балка надрессорная, Рама боковая, то проверяем наличие параметра "Год окончания гамма-процентного ресурса детали"
		// if(reestr_key_element.key_element_code == "477d0c01-84d3-441c-9bb9-15f9d609671d" || reestr_key_element.key_element_code == "b28e1a4f-d340-4ce0-a37a-d84dcfa1b6fb"){
		// 	if(isEmptyString(reestr_key_element.gamma_percent_resource_end_date)){
		// 		errors.push("Необходимо заполнить поле \"Год окончания гамма-процентного ресурса детали\", УИН: " + reestr_key_element.numberke)
		// 	}
		// }
		// Подсчет типов элементов
		var dictionary_key_elements_code = db.findbyrecid("dictionary_key_elements_codes", reestr_key_element.key_element_code);
		if (dictionary_key_elements_code != null) {
			switch (dictionary_key_elements_code.reccode) {
				case keyElementCodes.wheel_code:
					wheel_count++;
					break;
				case keyElementCodes.side_frame_code:
					side_frame_count++;
					break;
				case keyElementCodes.friction_strip_code:
					friction_strip_count++;
					break;
				case keyElementCodes.brace_code:
					brace_count++;
					break;
				case keyElementCodes.pressure_beam_code:
					pressure_beam_count++;
					break;
				case keyElementCodes.slider_body_code:
					slider_body_count++;
					break;
				case keyElementCodes.slider_cap_code:
					slider_cap_count++;
					break;
				case keyElementCodes.friction_wedge_code:
					friction_wedge_count++;
					break;
				case keyElementCodes.bearing_adapter_code:
					bearing_adapter_count++;
					break;
				case keyElementCodes.clear_axis_code:
					clear_axis_count++;
					break;
				case keyElementCodes.wedge_pockets_code:
					wedge_pockets_count++;
					break;
				case keyElementCodes.saddle_ring_code:
					saddle_ring_count++;
					break;
				case keyElementCodes.wedge_pockets_inserts_code:
					wedge_pockets_inserts_count++;
					break;
				case keyElementCodes.saddle_bearing_code:
					saddle_bearing_count++;
					break;
				case keyElementCodes.elevator_roll_code:
					elevator_roll_count++;
					break;
				case keyElementCodes.auto_coupler_code:
					auto_coupler_count++;
					break;
				case keyElementCodes.lock_code:
					lock_count++;
					break;
				case keyElementCodes.rough_axis_code:
					rough_axis_count++;
					break;
			}
		} else {
			return {
				"success": false,
				"message": "Код СЧ не найден в справочнике условных кодов деталей"
			};
		}
	}

	//Сравнение полученного количества СЧ с максимально возможным
	if (dictionary_count_key_elements_by_node_type_record.wheel_count < wheel_count) {
		errors.push("Превышено количество колес, максимум " + dictionary_count_key_elements_by_node_type_record.wheel_count);
	} else if (dictionary_count_key_elements_by_node_type_record.wheel_count > wheel_count && check_less) {
		errors.push("Количество колес меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.wheel_count);
	}

	if (dictionary_count_key_elements_by_node_type_record.side_frame_count < side_frame_count) {
		errors.push("Превышено количество боковых рам, максимум " + dictionary_count_key_elements_by_node_type_record.side_frame_count);
	} else if (dictionary_count_key_elements_by_node_type_record.side_frame_count > side_frame_count && check_less) {
		errors.push("Количество боковых рам меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.side_frame_count);
	}

	if (dictionary_count_key_elements_by_node_type_record.friction_strip_count < friction_strip_count) {
		errors.push("Превышено количество фрикционных планок, максимум " + dictionary_count_key_elements_by_node_type_record.friction_strip_count);
	} else if (dictionary_count_key_elements_by_node_type_record.friction_strip_count > friction_strip_count && check_less) {
		errors.push("Количество фрикционных планок меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.friction_strip_count);
	}

	if (dictionary_count_key_elements_by_node_type_record.brace_count < brace_count) {
		errors.push("Превышено количество скоб, максимум " + dictionary_count_key_elements_by_node_type_record.brace_count);
	} else if (dictionary_count_key_elements_by_node_type_record.brace_count > brace_count && check_less) {
		errors.push("Количество скоб меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.brace_count);
	}

	if (dictionary_count_key_elements_by_node_type_record.pressure_beam_count < pressure_beam_count) {
		errors.push("Превышено количество балок надрессорных, максимум " + dictionary_count_key_elements_by_node_type_record.pressure_beam_count);
	} else if (dictionary_count_key_elements_by_node_type_record.pressure_beam_count > pressure_beam_count && check_less) {
		errors.push("Количество балок надрессорных меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.pressure_beam_count);
	}

	if (dictionary_count_key_elements_by_node_type_record.slider_body_count < slider_body_count) {
		errors.push("Превышено количество корпусов скользуна, максимум " + dictionary_count_key_elements_by_node_type_record.slider_body_count);
	} else if (dictionary_count_key_elements_by_node_type_record.slider_body_count > slider_body_count && check_less) {
		errors.push("Количество корпусов скользуна меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.slider_body_count);
	}

	if (dictionary_count_key_elements_by_node_type_record.slider_cap_count < slider_cap_count) {
		errors.push("Превышено количество колпаков скользуна, максимум " + dictionary_count_key_elements_by_node_type_record.slider_cap_count);
	} else if (dictionary_count_key_elements_by_node_type_record.slider_cap_count > slider_cap_count && check_less) {
		errors.push("Количество колпаков скользуна меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.slider_cap_count);
	}

	if (dictionary_count_key_elements_by_node_type_record.friction_wedge_count < friction_wedge_count) {
		errors.push("Превышено количество фрикционных клинов, максимум " + dictionary_count_key_elements_by_node_type_record.friction_wedge_count);
	} else if (dictionary_count_key_elements_by_node_type_record.friction_wedge_count > friction_wedge_count && check_less) {
		errors.push("Количество фрикционных клинов меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.friction_wedge_count);
	}

	if (dictionary_count_key_elements_by_node_type_record.bearing_adapter_count < bearing_adapter_count) {
		errors.push("Превышено количество адаптеров подшипника, максимум " + dictionary_count_key_elements_by_node_type_record.bearing_adapter_count);
	} else if (dictionary_count_key_elements_by_node_type_record.bearing_adapter_count > bearing_adapter_count && check_less) {
		errors.push("Количество адаптеров подшипника меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.bearing_adapter_count);
	}

	if (dictionary_count_key_elements_by_node_type_record.clear_axis_count < clear_axis_count) {
		errors.push("Превышено количество чистовых осей, максимум " + dictionary_count_key_elements_by_node_type_record.clear_axis_count);
	} else if (dictionary_count_key_elements_by_node_type_record.clear_axis_count > clear_axis_count && check_less) {
		errors.push("Количество чистовых осей меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.clear_axis_count);
	}

	if (dictionary_count_key_elements_by_node_type_record.wedge_pockets_count < wedge_pockets_count) {
		errors.push("Превышено количество пластин в клиновых карманах, максимум " + dictionary_count_key_elements_by_node_type_record.wedge_pockets_count);
	} else if (dictionary_count_key_elements_by_node_type_record.wedge_pockets_count > wedge_pockets_count && check_less) {
		errors.push("Количество пластин в клиновых карманах меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.wedge_pockets_count);
	}

	if (dictionary_count_key_elements_by_node_type_record.saddle_ring_count < saddle_ring_count) {
		errors.push("Превышено количество колец в подпятник, максимум " + dictionary_count_key_elements_by_node_type_record.saddle_ring_count);
	} else if (dictionary_count_key_elements_by_node_type_record.saddle_ring_count > saddle_ring_count && check_less) {
		errors.push("Количество колец в подпятник меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.saddle_ring_count);
	}

	if (dictionary_count_key_elements_by_node_type_record.wedge_pockets_inserts_count < wedge_pockets_inserts_count) {
		errors.push("Превышено количество вставок в клиновые карманы, максимум " + dictionary_count_key_elements_by_node_type_record.wedge_pockets_inserts_count);
	} else if (dictionary_count_key_elements_by_node_type_record.wedge_pockets_inserts_count > wedge_pockets_inserts_count && check_less) {
		errors.push("Количество вставок в клиновые карманы меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.wedge_pockets_inserts_count);
	}

	if (dictionary_count_key_elements_by_node_type_record.saddle_bearing_count < saddle_bearing_count) {
		errors.push("Превышено количество вкладышей подпятника, максимум " + dictionary_count_key_elements_by_node_type_record.saddle_bearing_count);
	} else if (dictionary_count_key_elements_by_node_type_record.saddle_bearing_count > saddle_bearing_count && check_less) {
		errors.push("Количество вкладышей подпятника меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.saddle_bearing_count);
	}


	if (dictionary_count_key_elements_by_node_type_record.elevator_roll_count < elevator_roll_count) {
		errors.push("Превышено количество валиков подъемника, максимум " + dictionary_count_key_elements_by_node_type_record.elevator_roll_count);
	} else if (dictionary_count_key_elements_by_node_type_record.elevator_roll_count > elevator_roll_count && check_less) {
		errors.push("Количество валиков подъемника меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.elevator_roll_count);
	}

	if (dictionary_count_key_elements_by_node_type_record.auto_coupler_count < auto_coupler_count) {
		errors.push("Превышено количество корпусов автосцепки " + dictionary_count_key_elements_by_node_type_record.auto_coupler_count);
	} else if (dictionary_count_key_elements_by_node_type_record.auto_coupler_count > auto_coupler_count && check_less) {
		errors.push("Количество корпусов автосцепки меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.auto_coupler_count);
	}

	if (dictionary_count_key_elements_by_node_type_record.lock_count < lock_count) {
		errors.push("Превышено количество замков " + dictionary_count_key_elements_by_node_type_record.lock_count);
	} else if (dictionary_count_key_elements_by_node_type_record.lock_count > lock_count && check_less) {
		errors.push("Количество замков меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.lock_count);
	}

	if (dictionary_count_key_elements_by_node_type_record.rough_axis_count < rough_axis_count) {
		errors.push("Превышено количество черновых осей, максимум " + dictionary_count_key_elements_by_node_type_record.rough_axis_count);
	} else if (dictionary_count_key_elements_by_node_type_record.rough_axis_count > rough_axis_count && check_less) {
		errors.push("Количество черновых осей меньше чем нужно, требуется " + dictionary_count_key_elements_by_node_type_record.rough_axis_count);
	}

	if (errors.length == 0) {
		return {
			"success": true,
			"message": ""
		};
	} else {
		var error_message = errors.join(";<br>");		
		return {
			"success": false,
			"message": error_message
		}
	}
}

/**
 * Выпуск узла в обращение (оператор РЖД)
 * @param {*} params 
 */
function rzd_op_registernodeasgood(params){
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
	//Проверка параметра "Владелец"
	if(isEmptyString(params.member)){
		return badResp("Поле \"Владелец\" не может быть пустым");
	}
	var member = db.findbyrecid("reestr_members", params.member);
	if(isNullObject(member)){
		return badResp("Владелец не найден в системе")
	}
	return registernodeasgood(params);
}

/**
 * Выпуск в обращение для узла
 * @param {*} params	Параметры узла
 */
function registernodeasgood(params) {
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
	var headers = {
		"Content-Type": "application/json"
	};
	var headers = addAuthHeader(headers);
	var url = String().concat(host, "/plugins/nbdlogicplugin/registernodeasgood/", params.recid.toString())
	var res = fetch(url, {
		headers: headers,
		"body": JSON.stringify(params),
		"Method": "post"
	});
	if(isNotEmptyString(res.data)){
		return JSON.parse(res.data)
	}else{
		return res;
	}
}



// Блокчейн - Группировать СЧ в узел.
function groupNodeBlockchain(params) {

	var request = null;

	var objects = [];

	for (var i = 0; i < params.reestr_key_elements.length; i++) {
		var link_struct = {
			"hash": params.reestr_key_elements[i].blockchainhash,
			"node": params.reestr_key_elements[i].blockchainnode,
			"recn": params.reestr_key_elements[i].blockchainrecn,
			"tn": params.reestr_key_elements[i].blockchaintn
		};

		var info_struct = {};
		if (isNotEmptyString(params.reestr_key_elements[i].position_on_node___value)) {
			info_struct = {
				"Позиция в узле": params.reestr_key_elements[i].position_on_node___value
			}
		} else {
			info_struct = {
				"Позиция в узле": "null"
			}
		}

		objects.push({
			"link": link_struct,
			"info": info_struct
		})
	}

	request =
		{
			"method":
			{
				"function": "group_objects",
				"package": "NBD"
			},
			"objects": objects,
			"тип": params.type,
			"предприятие": params.manufacturer,
			"дата": params.date,
			"номер": params.number
		};

	var blockchainResponse = sendrequest(request, params.nodeip);
	blockchainResponse.request = request;
	return blockchainResponse;
}

/**
 * Проставление позиций дочерним СЧ в родительском узле.
 * @param {*} input_key_elements 			Массив составных частей			
 * @param {*} input_assembly_units 			Массив узлов/СЕ
 * @param {*} parent_node_type 				Идентификатор типа родительского узла
 * @param {*} parent_node_documentation 	Идентификатор чертежа родительского узла из реестра конструкторской и эксплуатационной документации (reestr_documentation)
 */
function getAllKeyElementsWithPositionsOnNode(input_key_elements, input_assembly_units, parent_node_type, parent_node_documentation) {
	// Массив, который содержит входные СЧ + СЧ полученные из узлов/СЕ
	var all_key_elements = [];
	// Массив, который содержит идентификаторы всех СЧ из all_key_elements
	var all_key_element_ids = [];
	// Массив идентификаторов всех обработанных узлов
	var ke_node_ids = [];

	if (input_assembly_units != null && input_assembly_units.length > 0) {
		for (var i = 0; i < input_assembly_units.length; i++) {
			var input_assembly_unit = input_assembly_units[i];

			// Ищем все СЧ, которые относятся к данному СЕ
			var assembly_unit_key_elements_params = {
				ke_node: input_assembly_unit.recid
			};
			var assembly_unit_key_elements = db.findbyparams("reestr_key_elements", assembly_unit_key_elements_params);

			if (assembly_unit_key_elements == null || assembly_unit_key_elements.length == 0)
				continue;



			// Получаем список позиций в родительском узле для установки всех элементов СЕ
			var assembly_unit_positions_on_parent_node_params = {
				// Тип родительского узла
				parent_node_type: parent_node_type,
				child_node_type: input_assembly_unit.ke_node_type
			};

			var parent_node_count_ke_on_node_records = db.findbyparams("dictionary_count_key_elements_by_node_type", {
				ke_node_type: parent_node_type,
				scheme: parent_node_documentation
			})

			if (isEmptyOrNullArray(parent_node_count_ke_on_node_records)) {
				return badResp("Не удалось получить количество СЧ в узле");
			}
			var parent_node_count_ke_on_node = parent_node_count_ke_on_node_records[0];

			if (parent_node_count_ke_on_node.slider_body_count > 2 && parent_node_count_ke_on_node.slider_cap_count > 2) {
				assembly_unit_positions_on_parent_node_params.for_six_axis_vagon = true;
			} else {
				assembly_unit_positions_on_parent_node_params.for_four_axis_vagon = true;
			}


			if (isNotEmptyString(input_assembly_unit.position_on_assembly_element)) {
				// Позиция СЕ в родительском узле
				assembly_unit_positions_on_parent_node_params.node_position = input_assembly_unit.position_on_assembly_element;
			}

			var assembly_unit_positions_on_parent_node = db.findbyparams("dictionary_positions_on_parent_node", assembly_unit_positions_on_parent_node_params);
			for (var j = 0; j < assembly_unit_key_elements.length; j++) {
				var key_element = assembly_unit_key_elements[j];
				var key_element_position = null;

				for (var k = 0; k < assembly_unit_positions_on_parent_node.length; k++) {
					if (assembly_unit_positions_on_parent_node[k].key_element_code == key_element.key_element_code) {
						/**
						 * Если у записи из справочника позиций в дочернем узле поле "Позиция в дочернем узле" пустое и у составной части
						 * не проставлена позиция в родительском узле, то заполняем переменную key_element_position
						 */
						if (assembly_unit_positions_on_parent_node[k].position_on_node == null
							&& key_element.position_on_node == null) {
							key_element_position = assembly_unit_positions_on_parent_node[k];
						}
						/**
						 * Иначе если у записи из справочника позиций в дочернем узле поле "Позиция в дочернем узле" заполнено
						 * и у записи составной части проставлена позиция в родительском узле
						 * и эти две позиции совпадают, то заполняем переменную key_element_position
						 */
						else if (assembly_unit_positions_on_parent_node[k].position_on_node != null
							&& key_element.position_on_node != null
							&& assembly_unit_positions_on_parent_node[k].position_on_node == key_element.position_on_node) {
							key_element_position = assembly_unit_positions_on_parent_node[k];
						}
						// /**
						//  * Иначе выводим ошибку 
						//  */
						// else {
						// 	return badResp("Для СЧ " + key_element.numberke + " из СЕ " + input_assembly_unit.unique_number + " не удалось определить позицию в родительском сборочном элементе.");
						// }
					}
					//Получение позиции составной части
					if (isNotNullObject(key_element_position)) {
						var position_on_node_params = {
							// Наименование СЧ
							"key_element_code": key_element_position.key_element_code,
							// Тип узла
							"node_type": key_element_position.parent_node_type,
							// Наименование позиции
							"recname": key_element_position.recname
						}
						var position_on_node = db.findbyparams("dictionary_positions_on_node", position_on_node_params);
						if (isNotEmptyOrNullArray(position_on_node)) {
							key_element.position_on_node = position_on_node[0].recid;
							key_element.position_on_node___value = position_on_node[0].recname;
							key_element.assembly_element_position_on_assembly_element = input_assembly_unit.position_on_assembly_element;

							break;
						}
					}
				}

				all_key_element_ids.push(key_element.recid);
				all_key_elements.push(key_element);
			}
		}
	}

	// Проходим в цикле по объектам СЧ
	for (var i = 0; i < input_key_elements.length; i++) {
		var input_key_element = input_key_elements[i];
		// Если еще не обрабатывали текущий СЧ
		if (all_key_element_ids.indexOf(input_key_element.recid) == -1) {
			// Если СЧ относится к узлу
			if (isNotEmptyString(input_key_element.ke_node)) {
				// Находим узел по идентификатору 
				var reestr_ke_node = db.findbyrecid("reestr_ke_nodes", input_key_element.ke_node);
				if (isNullObject(reestr_ke_node)) {
					return badResp("Узел '" + input_key_element.ke_node + "' не найден в системе.");
				}

				// Если мы еще не обрабатывали найденный узел
				if (ke_node_ids.indexOf(reestr_ke_node.recid) == -1) {
					// Добавляем найденный узел в массив обработанных узлов
					ke_node_ids.push(reestr_ke_node.recid);

					var node_key_elements_params = {
						"ke_node": reestr_ke_node.recid
					};
					// По идентификатору узла находим все СЧ, которые связаны с ним
					var node_key_elements = db.findbyparams("reestr_key_elements", node_key_elements_params);

					if (!!node_key_elements) {
						// Проверяем, что для СЧ указана "Позиция в узле"
						if (isEmptyString(input_key_element.position_on_node) && isEmptyString(input_key_element.position_on_parent_node)) {
							return badResp("Для составной части с номером " + input_key_element.numberke + " не указана позиция в узле.");
						}

						// Проводим проверку для входящего СЧ, что его можно установить на указанную позицию в родительском узле
						// Получаем все доступные позиции в родительском узле для текущего входного СЧ
						var positions_on_parent_node_by_input_key_element_params = null;
						if (isEmptyString(input_key_element.ke_node_type)) {
							positions_on_parent_node_by_input_key_element_params = {
								// Наименование СЧ
								"key_element_code": input_key_element.key_element_code,
								// Тип родительского узла
								"parent_node_type": parent_node_type
							};
						} else {
							positions_on_parent_node_by_input_key_element_params = {
								// Наименование СЧ
								"key_element_code": input_key_element.key_element_code,
								// Тип родительского узла
								"parent_node_type": parent_node_type,
								//Тип дочернего узла
								"child_node_type": input_key_element.ke_node_type
							};
						}


						if (isNotEmptyString(input_key_element.position_on_node)) {
							// Позиция в узле
							positions_on_parent_node_by_input_key_element_params.position_on_node = input_key_element.position_on_node;
						}

						// Определяем список доступных позиций в родительском узле для текущего входного СЧ
						var positions_on_parent_node_by_input_key_element = db.findbyparams("dictionary_positions_on_parent_node", positions_on_parent_node_by_input_key_element_params);

						var input_key_element_position_on_parent_node = null;

						// Если не удалось определить список доступных позиций в родительском узле, возвращаем ошибку
						if (isEmptyOrNullArray(positions_on_parent_node_by_input_key_element)) {
							return badResp("составная часть с номером " + input_key_element.numberke + " нельзя установить на указанную позицию на вагоне.");
						}

						// Пытаемся в списке доступных позиций в родительском узле найти позицию, 
						// которая была указана для текущего входного СЧ. Поиск проводится с учетом того, 
						// что у узла НЕ БЫЛА ИЗМЕНЕНА ОРИЕНТАЦИЯ
						for (var j = 0; j < positions_on_parent_node_by_input_key_element.length; j++) {
							if (positions_on_parent_node_by_input_key_element[j].recid == input_key_element.position_on_parent_node) {
								input_key_element_position_on_parent_node = positions_on_parent_node_by_input_key_element[j];
								break;
							}
						}

						// Если в списке доступных позиций в родительском узле не удалось найти указанную позицию
						if (isNullObject(input_key_element_position_on_parent_node)) {
							// Формируем альтернативный список доступных позиций в родительском узле 
							// (с учетом того, что БЫЛА ИЗМЕНЕНА ОРИЕНТАЦИЯ УЗЛА)
							var alternative_positions_on_parent_node_by_input_key_element = [];
							for (var j = 0; j < positions_on_parent_node_by_input_key_element.length; j++) {
								var alternative_position_on_parent_node_params = {
									// Наименование СЧ
									"key_element_code": input_key_element.key_element_code,
									// Тип родительского узла
									"parent_node_type": parent_node_type,
									// Наименование позиции
									"recname": positions_on_parent_node_by_input_key_element[j].alternative_position
								};

								var alternative_positions_on_parent_node = db.findbyparams("dictionary_positions_on_parent_node", alternative_position_on_parent_node_params);
								if (isEmptyOrNullArray(alternative_positions_on_parent_node)) {
									return badResp("Для позиции " + positions_on_parent_node_by_input_key_element[j].recname + " не удалось определить обратную позицию.");
								}

								alternative_positions_on_parent_node_by_input_key_element.push(alternative_positions_on_parent_node[0]);
							}

							// Пытаемся в АЛЬТЕРНАТИВНОМ списке доступных позиций в родительском узле найти позицию, 
							// которая была указана для текущего входного СЧ. Поиск проводится с учетом того, 
							// что у узла БЫЛА ИЗМЕНЕНА ОРИЕНТАЦИЯ
							for (var j = 0; j < alternative_positions_on_parent_node_by_input_key_element.length; j++) {
								if (alternative_positions_on_parent_node_by_input_key_element[j].recid == input_key_element.position_on_parent_node) {
									input_key_element_position_on_parent_node = alternative_positions_on_parent_node_by_input_key_element[j];
									break;
								}
							}

							// Если в списке доступных позиций в родительском узле не удалось найти указанную позицию
							if (isNullObject(input_key_element_position_on_parent_node)) {
								return badResp("составная часть с номером " + input_key_element.numberke + " нельзя установить на указанную позицию в родительском узле.");
							}
						}
						// Конец проверки на то, что входящий СЧ можно установить на указанную позицию в родительском узле

						var orientation_changed = false;

						// Если у СЧ поле "Позиция в узле" не соответствует полю "Позиция в узле" для выбранной позиции в родительском узле,
						// значит изменена ориентация узла
						if (input_key_element_position_on_parent_node.position_on_node != input_key_element.position_on_node) {
							orientation_changed = true;
						}

						// Получаем список позиций в родительском узле для установки всех элементов узла
						var node_positions_on_parent_node_params = {
							// Тип родительского узла
							"parent_node_type": parent_node_type
						};
						if (isNotEmptyString(input_key_element_position_on_parent_node.node_position)) {
							// Позиция узла в родительском узле
							node_positions_on_parent_node_params.node_position = input_key_element_position_on_parent_node.node_position;
						}

						var node_positions_on_parent_node = db.findbyparams("dictionary_positions_on_parent_node", node_positions_on_parent_node_params);

						// Если изменена ориентация узла
						if (orientation_changed) {
							// Проходим в цикле по всем СЧ из узла
							for (var j = 0; j < node_key_elements.length; j++) {
								var node_key_element = node_key_elements[j];
								// Определяем позицию в родительском узле для текущего СЧ из узла
								for (var k = 0; k < node_positions_on_parent_node.length; k++) {
									// Если у текущей позиции в родительском узле значение поля "Позиция в узле" равно значению поля
									// "Позиция в узле" у текущего СЧ из узла 
									if (node_positions_on_parent_node[k].position_on_node == node_key_element.position_on_node
										&& node_positions_on_parent_node[k].key_element_code == node_key_element.key_element_code) {
										// Необходимо определить обратную позицию в родительском узле
										var alternative_position_on_parent_node_params = {
											// Наименование СЧ
											"key_element_code": node_key_element.key_element_code,
											// Тип родительского узла
											"parent_node_type": parent_node_type
										};

										// Если у записи позиции в родительском узле не указана обратная позиция, то берем основную позицию
										alternative_position_on_parent_node_params.recname = isEmptyString(node_positions_on_parent_node[k].alternative_position)
											? node_positions_on_parent_node[k].recname
											: node_positions_on_parent_node[k].alternative_position;

										// Определяем обратную позицию в родительском узле для текущего СЧ
										var alternative_positions_on_parent_node = db.findbyparams("dictionary_positions_on_parent_node", alternative_position_on_parent_node_params);

										var position_on_node_params = {
											// Наименование СЧ
											"key_element_code": alternative_positions_on_parent_node[0].key_element_code,
											// Тип узла
											"node_type": alternative_positions_on_parent_node[0].parent_node_type,
											// Наименование позиции
											"recname": alternative_positions_on_parent_node[0].recname
										}
										var position_on_node = db.findbyparams("dictionary_positions_on_node", position_on_node_params);
										if (isEmptyOrNullArray(position_on_node)) {
											return badResp("Не удалось определить позицию для СЧ " + node_key_element.numberke)
										}
										node_key_element.position_on_node = position_on_node[0].recid;
										node_key_element.position_on_node___value = position_on_node[0].recname;

										node_key_element.assembly_element_position_on_assembly_element = alternative_positions_on_parent_node[0].node_position;

										break;
									}
								}

								all_key_elements.push(node_key_element);
								all_key_element_ids.push(node_key_element.recid);
							}
						}
						// Иначе, если ориентация не была изменена
						else {
							// Проходим в цикле по всем СЧ из узла
							for (var j = 0; j < node_key_elements.length; j++) {
								var node_key_element = node_key_elements[j];
								// Определяем позицию в родительском узле для текущего СЧ из узла
								for (var k = 0; k < node_positions_on_parent_node.length; k++) {
									if (node_positions_on_parent_node[k].position_on_node == node_key_element.position_on_node
										&& node_positions_on_parent_node[k].key_element_code == node_key_element.key_element_code) {
										var position_on_node_params = {
											// Наименование СЧ
											"key_element_code": node_positions_on_parent_node[k].key_element_code,
											// Тип узла
											"node_type": node_positions_on_parent_node[k].parent_node_type,
											// Наименование позиции
											"recname": node_positions_on_parent_node[k].recname
										}
										var position_on_node = db.findbyparams("dictionary_positions_on_node", position_on_node_params);

										node_key_element.position_on_node = position_on_node[0].recid;
										node_key_element.position_on_node___value = position_on_node[0].recname;

										node_key_element.assembly_element_position_on_assembly_element = node_positions_on_parent_node[k].node_position;

										break;
									}
								}

								all_key_elements.push(node_key_element);
								all_key_element_ids.push(node_key_element.recid);
							}
						}
					}
				}
			}
			else {
				// Обрабатываем ситуацию, когда просканирована Ось чистовая и у нее есть ссылка на Ось черновую
				// Обязательное условие: в справочнике "Кол-во СЧ/СЕ в СЕ/узле" количество Оси черновой > 0
				// Необходимо автоматически добавить Ось черновую в узел
				if (input_key_element.key_element_code == keyElementCodes.clear_axis_id) {
					var scan_rough_axis_res = autoscanroughaxis(input_key_element, parent_node_type, parent_node_documentation);
					if (!scan_rough_axis_res.success) {
						return scan_rough_axis_res;
					}

					if (isNotNullObject(scan_rough_axis_res.data)) {
						var rough_axis = scan_rough_axis_res.data;

						// Если Ось чистовая выпущена в обращение, а связанная с ней Ось черновая не выпущена в обращение, то возвращаем ошибку 
						if (isNotEmptyString(input_key_element.blockchainhash) && isEmptyString(rough_axis.blockchainhash)) {
							return badResp("Нельзя просканировать Ось чистовую с УИН " + input_key_element.numberke + ", потому что связанная с ней Ось черновая с УИН " + rough_axis.numberke + " не выпущена в обращение.");
						}

						// Сканируем Ось черновую, только если обе оси выпущены в обращение
						if (isNotEmptyString(input_key_element.blockchainhash) && isNotEmptyString(rough_axis.blockchainhash)) {
							all_key_elements.push(rough_axis);
							all_key_element_ids.push(rough_axis.recid);
						}
					}
				}

				all_key_elements.push(input_key_element);
				all_key_element_ids.push(input_key_element.recid);
			}
		}
	}

	return successResp("", all_key_elements);
}

// Метод для автоматического сканирования Оси черновой по Оси чистовой
function autoscanroughaxis(clear_axis, parent_node_type, parent_node_documentation) {
	var rough_axis = null;

	// Если у Оси чистовой указан флаг "Есть номер черновой оси", то проверяем поле с ссылкой на Ось черновую
	if (clear_axis.has_rough_axis_number) {
		if (isEmptyString(clear_axis.rough_axis)) {
			return badResp("Для Оси чистовой не указана ссылка на Ось черновую");
		}

		rough_axis = db.findbyrecid("reestr_key_elements", clear_axis.rough_axis);
		if (isNullObject(rough_axis)) {
			return badResp("Ось черновая, указанная в оси чистовой, не найдена в системе.");
		}
	}
	
	var dictionary_count_params = {
		"ke_node_type": parent_node_type,
		"scheme": parent_node_documentation
	};

	var dictionary_count_records = db.findbyparams("dictionary_count_key_elements_by_node_type", dictionary_count_params);
	if (isEmptyOrNullArray(dictionary_count_records)) {
		return badResp("Для родительского узла/СЕ не найдена запись в справонике \"Кол-во СЧ/СЕ в СЕ/узле\"");
	}

	var dictionary_count_record = dictionary_count_records[0];

	// Обязательное условие: в справочнике "Кол-во СЧ/СЕ в СЕ/узле" количество Оси черновой > 0
	if (dictionary_count_record.rough_axis_count == null || dictionary_count_record.rough_axis_count == 0) {
		if (isNotNullObject(rough_axis)) {
			return badResp("С Осью чистовой связана Ось черновая. Превышено кол-во Осей черновых.");
		}
		return successResp();
	}
	else if (dictionary_count_record.rough_axis_count > 0) {
		if (isNullObject(rough_axis)) {
			return badResp("Требуется установка Оси черновой в составе Оси чистовой.");
		}
	}

	return successResp("", rough_axis);
}

// 13.03.2020 Вроде, все проверки отсюда есть в других местах. Если не ничего не отвалится, можно удалить.
// Метод для предварительных проверок перед сканированием СЧ в узел (для одного СЧ за раз)
function checkreestrkenodetypelimitations(key_elements, reestr_ke_node_type_recid, reestr_ke_node_recid) {
	var res = true;
	var errormessage = "";

	var input_wheel_pair_count = 0;
	var input_side_frame_count = 0;
	var input_pressure_beam_count = 0;
	var input_air_distributor_count = 0;
	var input_absorbing_device_count = 0;
	var input_coupler_count = 0;
	var input_auto_mode_count = 0;
	var input_friction_wedge_count = 0;
	var input_slider_body_count = 0;
	var input_slider_cap_count = 0;
	var input_wheel_adapter_count = 0;
	var input_brake_cylinder_count = 0;
	var input_spring_suspension_under_wedge_external_count = 0;
	var input_spring_suspension_under_wedge_internal_count = 0;
	var input_spring_suspension_external_count = 0;
	var input_spring_suspension_internal_count = 0;
	var input_spring_slider_external_count = 0;
	var input_spring_slider_internal_count = 0;
	var input_air_tank_auto_brakes_count = 0;
	var input_traction_clamp_count = 0;
	var input_triangel_count = 0;
	var input_trunk_part_air_distributor_count = 0;

	var reestr_key_element = key_elements;

	if (isEmptyString(reestr_key_element.blockchainhash)) {
		res = false;
		return badResp("Для составной части <a href=\"/tables/reestr_key_elements/" + reestr_key_element.recid +
			"\" target=\"_blank\" class=\"alert-link\">" + reestr_key_element.numberke + "</a> нельзя установить узел, т.к. она еще не была выпущена в обращение. ");
	}

	// Балка надрессорная
	if (reestr_key_element.key_element_code == keyElementCodes.pressure_beam_id) {
		input_pressure_beam_count++;
	}
	// Рама боковая
	if (reestr_key_element.key_element_code == keyElementCodes.side_frame_id) {
		input_side_frame_count++
	}
	// Колесная пара в сборе
	if (reestr_key_element.key_element_code == keyElementCodes.wheel_pair_id) {
		input_wheel_pair_count++;
	}
	// Главная часть воздухораспределителя
	if (reestr_key_element.key_element_code == keyElementCodes.main_part_air_distributor_id) {
		input_air_distributor_count++;
	}
	// Поглощающий аппарат
	if (reestr_key_element.key_element_code == keyElementCodes.absorbing_device_id) {
		input_absorbing_device_count++;
	}
	// Корпус автосцепки
	if (reestr_key_element.key_element_code == keyElementCodes.coupler_id) {
		input_coupler_count++;
	}
	// Авторежим
	if (reestr_key_element.key_element_code == keyElementCodes.auto_mode_id) {
		input_auto_mode_count++;
	}
	// Клин фрикционный
	if (reestr_key_element.key_element_code == keyElementCodes.friction_wedge_id) {
		input_friction_wedge_count++;
	}
	// Корпус скользуна
	if (reestr_key_element.key_element_code == keyElementCodes.slider_body_id) {
		input_slider_body_count++;
	}
	// Колпак скользуна
	if (reestr_key_element.key_element_code == keyElementCodes.slider_cap_id) {
		input_slider_cap_count++;
	}
	// Адаптер колеса
	if (reestr_key_element.key_element_code == keyElementCodes.wheel_adapter_id) {
		input_wheel_adapter_count++;
	}
	// Тормозной цилиндр
	if (reestr_key_element.key_element_code == keyElementCodes.brake_cylinder_id) {
		input_brake_cylinder_count++;
	}
	// Пружины рессорного подвешивания подклиновая наружная
	if (reestr_key_element.key_element_code == keyElementCodes.spring_suspension_under_wedge_external_id) {
		input_spring_suspension_under_wedge_external_count++;
	}
	// Пружины рессорного подвешивания подклиновая внутренняя
	if (reestr_key_element.key_element_code == keyElementCodes.spring_suspension_under_wedge_internal_id) {
		input_spring_suspension_under_wedge_internal_count++;
	}
	// Пружины рессорного подвешивания наружная
	if (reestr_key_element.key_element_code == keyElementCodes.spring_suspension_external_id) {
		input_spring_suspension_external_count++;
	}
	// Пружины рессорного подвешивания внутренняя
	if (reestr_key_element.key_element_code == keyElementCodes.spring_suspension_internal_id) {
		input_spring_suspension_internal_count++;
	}
	// Пружины скользуна наружная
	if (reestr_key_element.key_element_code == keyElementCodes.spring_slider_external_id) {
		input_spring_slider_external_count++;
	}
	// Пружины скользуна внутренняя
	if (reestr_key_element.key_element_code == keyElementCodes.spring_slider_internal_id) {
		input_spring_slider_internal_count++;
	}
	// Резервуары воздушные для автотормозов
	if (reestr_key_element.key_element_code == keyElementCodes.air_tank_auto_brakes_id) {
		input_air_tank_auto_brakes_count++;
	}
	// Тяговый хомут автосцепки
	if (reestr_key_element.key_element_code == keyElementCodes.traction_clamp_coupling_id) {
		input_traction_clamp_count++;
	}
	// Триангель
	if (reestr_key_element.key_element_code == keyElementCodes.triangel_id) {
		input_triangel_count++;
	}
	// Магистральная часть воздухораспределителя
	if (reestr_key_element.key_element_code == keyElementCodes.trunk_part_air_distributor_id) {
		input_trunk_part_air_distributor_count++;
	}

	if (!res) {
		return badResp(errormessage);
	}

	var input_counts = [];
	input_counts.push({ name: "input_wheel_pair_count", count: input_wheel_pair_count });
	input_counts.push({ name: "input_side_frame_count", count: input_side_frame_count });
	input_counts.push({ name: "input_pressure_beam_count", count: input_pressure_beam_count });
	input_counts.push({ name: "input_air_distributor_count", count: input_air_distributor_count });
	input_counts.push({ name: "input_absorbing_device_count", count: input_absorbing_device_count });
	input_counts.push({ name: "input_coupler_count", count: input_coupler_count });
	input_counts.push({ name: "input_auto_mode_count", count: input_auto_mode_count });
	input_counts.push({ name: "input_friction_wedge_count", count: input_friction_wedge_count });
	input_counts.push({ name: "input_slider_body_count", count: input_slider_body_count });
	input_counts.push({ name: "input_slider_cap_count", count: input_slider_cap_count });
	input_counts.push({ name: "input_wheel_adapter_count", count: input_wheel_adapter_count });
	input_counts.push({ name: "input_brake_cylinder_count", count: input_brake_cylinder_count });
	input_counts.push({ name: "input_spring_suspension_under_wedge_external_count", count: input_spring_suspension_under_wedge_external_count });
	input_counts.push({ name: "input_spring_suspension_under_wedge_internal_count", count: input_spring_suspension_under_wedge_internal_count });
	input_counts.push({ name: "input_spring_suspension_external_count", count: input_spring_suspension_external_count });
	input_counts.push({ name: "input_spring_suspension_internal_count", count: input_spring_suspension_internal_count });
	input_counts.push({ name: "input_spring_slider_external_count", count: input_spring_slider_external_count });
	input_counts.push({ name: "input_spring_slider_internal_count", count: input_spring_slider_internal_count });
	input_counts.push({ name: "input_air_tank_auto_brakes_count", count: input_air_tank_auto_brakes_count });
	input_counts.push({ name: "input_traction_clamp_count", count: input_traction_clamp_count });
	input_counts.push({ name: "input_triangel_count", count: input_triangel_count });
	input_counts.push({ name: "input_trunk_part_air_distributor_count", count: input_trunk_part_air_distributor_count });

	var node_wheel_pair_count = 0;
	var node_side_frame_count = 0;
	var node_pressure_beam_count = 0;
	var node_air_distributor_count = 0;
	var node_absorbing_device_count = 0;
	var node_coupler_count = 0;
	var node_auto_mode_count = 0;
	var node_friction_wedge_count = 0;
	var node_slider_body_count = 0;
	var node_slider_cap_count = 0;
	var node_wheel_adapter_count = 0;
	var node_brake_cylinder_count = 0;
	var node_spring_suspension_under_wedge_external_count = 0;
	var node_spring_suspension_under_wedge_internal_count = 0;
	var node_spring_suspension_external_count = 0;
	var node_spring_suspension_internal_count = 0;
	var node_spring_slider_external_count = 0;
	var node_spring_slider_internal_count = 0;
	var node_air_tank_auto_brakes_count = 0;
	var node_traction_clamp_count = 0;
	var node_triangel_count = 0;
	var node_trunk_part_air_distributor_count = 0;

	// Если не указано, для какого узла проводятся проверки, то учитываем только количество входящих СЧ
	if (reestr_ke_node_recid == null) {
		var reestr_ke_node_type = db.findbyrecid("reestr_ke_node_types", reestr_ke_node_type_recid);

		if (!!reestr_ke_node_type) {
			// Колесная пара
			if (reestr_ke_node_type.ke_node_type == dictionary_ke_node_types.wheel_pair) {
				for (var i = 0; i < input_counts.length; i++) {
					if (input_counts[i].name == "input_wheel_pair_count") {
						if (input_counts[i].count > reestr_ke_node_type.wheel_pair_count) {
							return badResp("С узлом нельзя связать элемент типа \"Колесная пара в сборе\" в количестве " + input_counts[i].count + " пожалуйста проверьте введенные данные.");
						}
					}
					else if (input_counts[i].count > 0) {
						return badResp("С данным узлом можно связать только СЧ, которые указаны в типе узла \"Колесная пара\"");
					}
				}
			}
			// Передача тормозная рычажная
			else if (reestr_ke_node_type.ke_node_type == dictionary_ke_node_types.brake_transmission_group) {
				for (var i = 0; i < input_counts.length; i++) {
					if (input_counts[i].name == "input_triangel_count") {
						if (input_counts[i].count > reestr_ke_node_type.triangel_count) {
							return badResp("С узлом нельзя связать элемент типа \"Триангель\" в количестве " + input_counts[i].count + ", пожалуйста проверьте введенные данные.");
						}
					}
					else if (input_counts[i].count > 0) {
						return badResp("С данным узлом можно связать только СЧ, которые указаны в типе узла \"Передача тормозная рычажная\"");
					}
				}
			}
			// Комплект пружин
			else if (reestr_ke_node_type.ke_node_type == dictionary_ke_node_types.spring_group) {
				for (var i = 0; i < input_counts.length; i++) {
					if (input_counts[i].name == "input_spring_suspension_under_wedge_external_count") {
						if (input_counts[i].count > reestr_ke_node_type.spring_suspension_under_wedge_external_count) {
							return badResp("С узлом нельзя связать элемент типа \"Пружины рессорного подвешивания подклиновая наружная\" в количестве " + input_counts[i].count + ", пожалуйста проверьте введенные данные.");
						}
					}
					else if (input_counts[i].name == "input_spring_suspension_under_wedge_internal_count") {
						if (input_counts[i].count > reestr_ke_node_type.spring_suspension_under_wedge_internal_count) {
							return badResp("С узлом нельзя связать элемент типа \"Пружины рессорного подвешивания подклиновая внутренняя\" в количестве " + input_counts[i].count + ", пожалуйста проверьте введенные данные.");
						}
					}
					else if (input_counts[i].name == "input_spring_suspension_external_count") {
						if (input_counts[i].count > reestr_ke_node_type.spring_suspension_external_count) {
							return badResp("С узлом нельзя связать элемент типа \"Пружины рессорного подвешивания наружная\" в количестве " + input_counts[i].count + ", пожалуйста проверьте введенные данные.");
						}
					}
					else if (input_counts[i].name == "input_spring_suspension_internal_count") {
						if (input_counts[i].count > reestr_ke_node_type.spring_suspension_internal_count) {
							return badResp("С узлом нельзя связать элемент типа \"Пружины рессорного подвешивания внутренняя\" в количестве " + input_counts[i].count + ", пожалуйста проверьте введенные данные.");
						}
					}
					else if (input_counts[i].count > 0) {
						return badResp("С данным узлом можно связать только СЧ, которые указаны в типе узла \"Комплект пружин\"");
					}
				}
			}
			// Скользун
			else if (reestr_ke_node_type.ke_node_type == dictionary_ke_node_types.slider_group) {
				for (var i = 0; i < input_counts.length; i++) {
					if (input_counts[i].name == "input_slider_body_count") {
						if (input_counts[i].count > reestr_ke_node_type.slider_body_count) {
							return badResp("С узлом нельзя связать элемент типа \"Корпус скользуна\" в количестве " + input_counts[i].count + ", пожалуйста проверьте введенные данные.");
						}
					}
					else if (input_counts[i].name == "input_slider_cap_count") {
						if (input_counts[i].count > reestr_ke_node_type.slider_cap_count) {
							return badResp("С узлом нельзя связать элемент типа \"Колпак скользуна\" в количестве " + input_counts[i].count + ", пожалуйста проверьте введенные данные.");
						}
					}
					else if (input_counts[i].name == "input_spring_slider_external_count") {
						if (input_counts[i].count > reestr_ke_node_type.spring_slider_external_count) {
							return badResp("С узлом нельзя связать элемент типа \"Пружины скользуна наружная\" в количестве " + input_counts[i].count + ", пожалуйста проверьте введенные данные.");
						}
					}
					else if (input_counts[i].name == "input_spring_slider_internal_count") {
						if (input_counts[i].count > reestr_ke_node_type.spring_slider_internal_count) {
							return badResp("С узлом нельзя связать элемент типа \"\Пружины скользуна внутренняя\" в количестве " + input_counts[i].count + ", пожалуйста проверьте введенные данные.");
						}
					}
					else if (input_counts[i].count > 0) {
						return badResp("С данным узлом можно связать только СЧ, которые указаны в типе узла \"Скользун\"");
					}
				}
			}
			// Хомут в сборе в поглощающим аппаратом
			else if (reestr_ke_node_type.ke_node_type == dictionary_ke_node_types.clamp_with_absorbing_device_group) {
				for (var i = 0; i < input_counts.length; i++) {
					if (input_counts[i].name == "input_traction_clamp_count") {
						if (input_counts[i].count > reestr_ke_node_type.traction_clamp_count) {
							return badResp("С узлом нельзя связать элемент типа \"Тяговый хомут автосцепки\" в количестве " + input_counts[i].count + ", пожалуйста проверьте введенные данные.");
						}
					}
					else if (input_counts[i].name == "input_absorbing_device_count") {
						if (input_counts[i].count > reestr_ke_node_type.absorbing_device_count) {
							return badResp("С узлом нельзя связать элемент типа \"Поглощающий аппарат\" в количестве " + input_counts[i].count + ", пожалуйста проверьте введенные данные.");
						}
					}
					else if (input_counts[i].count > 0) {
						return badResp("С данным узлом можно связать только СЧ, которые указаны в типе узла \"Хомут в сборе в поглощающим аппаратом\"");
					}
				}
			}
			// Воздухораспределитель
			else if (reestr_ke_node_type.ke_node_type == dictionary_ke_node_types.air_distributor_group) {
				for (var i = 0; i < input_counts.length; i++) {
					if (input_counts[i].name == "input_air_distributor_count") {
						if (input_counts[i].count > reestr_ke_node_type.air_distributor_count) {
							return badResp("С узлом нельзя связать элемент типа \"Главная часть воздухораспределителя\" в количестве " + input_counts[i].count + ", пожалуйста проверьте введенные данные.");
						}
					}
					else if (input_counts[i].name == "input_trunk_part_air_distributor_count") {
						if (input_counts[i].count > reestr_ke_node_type.trunk_part_air_distributor_count) {
							return badResp("С узлом нельзя связать элемент типа \"Магистральная часть воздухораспределителя\" в количестве " + input_counts[i].count + ", пожалуйста проверьте введенные данные.");
						}
					}
					else if (input_counts[i].count > 0) {
						return badResp("С данным узлом можно связать только СЧ, которые указаны в типе узла \"Воздухораспределитель\"");
					}
				}
			}
		}
		else {
			return badResp("Не найдена запись в Реестре номенклатуры узлов");
		}
	}
	// Если указано для какого узла проводятся проверки, то учитываем суммы количества входящих СЧ и уже связанных с узлом СЧ
	else {
		var reestr_ke_node = db.findbyrecid("reestr_ke_nodes", reestr_ke_node_recid);

		if (!!reestr_ke_node) {
			var reestr_key_elements_by_node_params = {
				"ke_node": reestr_ke_node.recid
			};
			var reestr_key_elements_by_node = db.findbyparams("reestr_key_elements", reestr_key_elements_by_node_params);

			// Считаем СЧ уже связанные с данным узлом
			if (!!reestr_key_elements_by_node) {
				for (var i = 0; i < reestr_key_elements_by_node.length; i++) {
					var reestr_key_element_by_node = reestr_key_elements_by_node[i];

					// Балка надрессорная
					if (reestr_key_element_by_node.key_element_code == keyElementCodes.pressure_beam_id) {
						node_pressure_beam_count++;
					}
					// Рама боковая
					if (reestr_key_element_by_node.key_element_code == keyElementCodes.side_frame_id) {
						node_side_frame_count++
					}
					// Колесная пара в сборе
					if (reestr_key_element_by_node.key_element_code == keyElementCodes.wheel_pair_id) {
						node_wheel_pair_count++;
					}
					// Главная часть воздухораспределителя
					if (reestr_key_element_by_node.key_element_code == keyElementCodes.main_part_air_distributor_id) {
						node_air_distributor_count++;
					}
					// Поглощающий аппарат
					if (reestr_key_element_by_node.key_element_code == keyElementCodes.absorbing_device_id) {
						node_absorbing_device_count++;
					}
					// Корпус автосцепки
					if (reestr_key_element_by_node.key_element_code == keyElementCodes.coupler_id) {
						node_coupler_count++;
					}
					// Авторежим
					if (reestr_key_element_by_node.key_element_code == keyElementCodes.auto_mode_id) {
						node_auto_mode_count++;
					}
					// Клин фрикционный
					if (reestr_key_element_by_node.key_element_code == keyElementCodes.friction_wedge_id) {
						node_friction_wedge_count++;
					}
					// Корпус скользуна
					if (reestr_key_element_by_node.key_element_code == keyElementCodes.slider_body_id) {
						node_slider_body_count++;
					}
					// Колпак скользуна
					if (reestr_key_element_by_node.key_element_code == keyElementCodes.slider_cap_id) {
						node_slider_cap_count++;
					}
					// Адаптер колеса
					if (reestr_key_element_by_node.key_element_code == keyElementCodes.wheel_adapter_id) {
						node_wheel_adapter_count++;
					}
					// Тормозной цилиндр
					if (reestr_key_element_by_node.key_element_code == keyElementCodes.brake_cylinder_id) {
						node_brake_cylinder_count++;
					}
					// Пружины рессорного подвешивания подклиновая наружная
					if (reestr_key_element_by_node.key_element_code == keyElementCodes.spring_suspension_under_wedge_external_id) {
						node_spring_suspension_under_wedge_external_count++;
					}
					// Пружины рессорного подвешивания подклиновая внутренняя
					if (reestr_key_element_by_node.key_element_code == keyElementCodes.spring_suspension_under_wedge_internal_id) {
						node_spring_suspension_under_wedge_internal_count++;
					}
					// Пружины рессорного подвешивания наружная
					if (reestr_key_element_by_node.key_element_code == keyElementCodes.spring_suspension_external_id) {
						node_spring_suspension_external_count++;
					}
					// Пружины рессорного подвешивания внутренняя
					if (reestr_key_element_by_node.key_element_code == keyElementCodes.spring_suspension_internal_id) {
						node_spring_suspension_internal_count++;
					}
					// Пружины скользуна наружная
					if (reestr_key_element_by_node.key_element_code == keyElementCodes.spring_slider_external_id) {
						node_spring_slider_external_count++;
					}
					// Пружины скользуна внутренняя
					if (reestr_key_element_by_node.key_element_code == keyElementCodes.spring_slider_internal_id) {
						node_spring_slider_internal_count++;
					}
					// Резервуары воздушные для автотормозов
					if (reestr_key_element_by_node.key_element_code == keyElementCodes.air_tank_auto_brakes_id) {
						node_air_tank_auto_brakes_count++;
					}
					// Тяговый хомут автосцепки
					if (reestr_key_element_by_node.key_element_code == keyElementCodes.traction_clamp_coupling_id) {
						node_traction_clamp_coupling_count++;
					}
					// Триангель
					if (reestr_key_element_by_node.key_element_code == keyElementCodes.triangel_id) {
						node_triangel_count++;
					}
					// Магистральная часть воздухораспределителя
					if (reestr_key_element_by_node.key_element_code == keyElementCodes.trunk_part_air_distributor_id) {
						node_trunk_part_air_distributor_count++;
					}
				}
			}

			var reestr_ke_node_type = db.findbyrecid("reestr_ke_node_types", reestr_ke_node_type_recid);

			// Проверяем ограничения по количеству СЧ по реестру номенклатуры узлов
			if (!!reestr_ke_node_type) {
				// Колесная пара
				if (reestr_ke_node_type.ke_node_type == dictionary_ke_node_types.wheel_pair) {
					for (var i = 0; i < input_counts.length; i++) {
						if (input_counts[i].name == "input_wheel_pair_count") {
							if (input_counts[i].count + node_wheel_pair_count > reestr_ke_node_type.wheel_pair_count) {
								return badResp("С узлом нельзя связать элемент типа \"Колесная пара в сборе\" в количестве " + input_counts[i].count + ", пожалуйста проверьте введенные данные.");
							}
						}
						else if (input_counts[i].count > 0) {
							return badResp("С данным узлом можно связать только СЧ, которые указаны в типе узла \"Колесная пара\".");
						}
					}
				}
				// Передача тормозная рычажная
				else if (reestr_ke_node_type.ke_node_type == dictionary_ke_node_types.brake_transmission_group) {
					for (var i = 0; i < input_counts.length; i++) {
						if (input_counts[i].name == "input_triangel_count") {
							if (input_counts[i].count + node_triangel_count > reestr_ke_node_type.triangel_count) {
								return badResp("С узлом нельзя связать элемент типа \"Триангель\" в количестве " + input_counts[i].count + ", пожалуйста проверьте введенные данные.");
							}
						}
						else if (input_counts[i].count > 0) {
							return badResp("С данным узлом можно связать только СЧ, которые указаны в типе узла \"Передача тормозная рычажная\".");
						}
					}
				}
				// Комплект пружин
				else if (reestr_ke_node_type.ke_node_type == dictionary_ke_node_types.spring_group) {
					for (var i = 0; i < input_counts.length; i++) {
						if (input_counts[i].name == "input_spring_suspension_under_wedge_external_count") {
							if (input_counts[i].count + node_spring_suspension_under_wedge_external_count
								> reestr_ke_node_type.spring_suspension_under_wedge_external_count) {
								return badResp("С узлом нельзя связать элемент типа \"Пружины рессорного подвешивания подклиновая наружная\" в количестве " + input_counts[i].count + ", пожалуйста проверьте введенные данные.");
							}
						}
						else if (input_counts[i].name == "input_spring_suspension_under_wedge_internal_count") {
							if (input_counts[i].count + node_spring_suspension_under_wedge_internal_count
								> reestr_ke_node_type.spring_suspension_under_wedge_internal_count) {
								return badResp("С узлом нельзя связать элемент типа \"Пружины рессорного подвешивания подклиновая внутренняя\" в количестве " + input_counts[i].count + ", пожалуйста проверьте введенные данные.");
							}
						}
						else if (input_counts[i].name == "input_spring_suspension_external_count") {
							if (input_counts[i].count + node_spring_suspension_external_count
								> reestr_ke_node_type.spring_suspension_external_count) {
								return badResp("С узлом нельзя связать элемент типа \"Пружины рессорного подвешивания наружная\" в количестве " + input_counts[i].count + ", пожалуйста проверьте введенные данные.");
							}
						}
						else if (input_counts[i].name == "input_spring_suspension_internal_count") {
							if (input_counts[i].count + node_spring_suspension_internal_count
								> reestr_ke_node_type.spring_suspension_internal_count) {
								return badResp("С узлом нельзя связать элемент типа \"Пружины рессорного подвешивания внутренняя\" в количестве " + input_counts[i].count + ", пожалуйста проверьте введенные данные.");
							}
						}
						else if (input_counts[i].count > 0) {
							return badResp("С данным узлом можно связать только СЧ, которые указаны в типе узла \"Комплект пружин\".");
						}
					}
				}
				// Скользун
				else if (reestr_ke_node_type.ke_node_type == dictionary_ke_node_types.slider_group) {
					for (var i = 0; i < input_counts.length; i++) {
						if (input_counts[i].name == "input_slider_body_count") {
							if (input_counts[i].count + node_slider_body_count
								> reestr_ke_node_type.slider_body_count) {
								return badResp("С узлом нельзя связать элемент типа \"Корпус скользуна\" в количестве " + input_counts[i].count + ", пожалуйста проверьте введенные данные.");
							}
						}
						else if (input_counts[i].name == "input_slider_cap_count") {
							if (input_counts[i].count + node_slider_cap_count
								> reestr_ke_node_type.slider_cap_count) {
								return badResp("С узлом нельзя связать элемент типа \"Колпак скользуна\" в количестве " + input_counts[i].count + ", пожалуйста проверьте введенные данные.");
							}
						}
						else if (input_counts[i].name == "input_spring_slider_external_count") {
							if (input_counts[i].count + node_spring_slider_external_count
								> reestr_ke_node_type.spring_slider_external_count) {
								return badResp("С узлом нельзя связать элемент типа \"Пружины скользуна наружная\" в количестве " + input_counts[i].count + ", пожалуйста проверьте введенные данные.");
							}
						}
						else if (input_counts[i].name == "input_spring_slider_internal_count") {
							if (input_counts[i].count + node_spring_slider_internal_count
								> reestr_ke_node_type.spring_slider_internal_count) {
								return badResp("С узлом нельзя связать элемент типа \"\Пружины скользуна внутренняя\" в количестве " + input_counts[i].count + ", пожалуйста проверьте введенные данные.");
							}
						}
						else if (input_counts[i].count > 0) {
							return badResp("С данным узлом можно связать только СЧ, которые указаны в типе узла \"Скользун\".");
						}
					}
				}
				// Хомут в сборе в поглощающим аппаратом
				else if (reestr_ke_node_type.ke_node_type == dictionary_ke_node_types.clamp_with_absorbing_device_group) {
					for (var i = 0; i < input_counts.length; i++) {
						if (input_counts[i].name == "input_traction_clamp_count") {
							if (input_counts[i].count + node_traction_clamp_count
								> reestr_ke_node_type.traction_clamp_count) {
								return badResp("С узлом нельзя связать элемент типа \"Тяговый хомут автосцепки\" в количестве " + input_counts[i].count + ", пожалуйста проверьте введенные данные.");
							}
						}
						else if (input_counts[i].name == "input_absorbing_device_count") {
							if (input_counts[i].count + node_absorbing_device_count
								> reestr_ke_node_type.absorbing_device_count) {
								return badResp("С узлом нельзя связать элемент типа \"Поглощающий аппарат\" в количестве " + input_counts[i].count + ", пожалуйста проверьте введенные данные.");
							}
						}
						else if (input_counts[i].count > 0) {
							return badResp("С данным узлом можно связать только СЧ, которые указаны в типе узла \"Хомут в сборе в поглощающим аппаратом\".");
						}
					}
				}
				// Воздухораспределитель
				else if (reestr_ke_node_type.ke_node_type == dictionary_ke_node_types.air_distributor_group) {
					for (var i = 0; i < input_counts.length; i++) {
						if (input_counts[i].name == "input_air_distributor_count") {
							if (input_counts[i].count + node_air_distributor_count
								> reestr_ke_node_type.air_distributor_count) {
								return badResp("С узлом нельзя связать элемент типа \"Главная часть воздухораспределителя\" в количестве " + input_counts[i].count + ", пожалуйста проверьте введенные данные.");
							}
						}
						else if (input_counts[i].name == "input_trunk_part_air_distributor_count") {
							if (input_counts[i].count + node_trunk_part_air_distributor_count
								> reestr_ke_node_type.trunk_part_air_distributor_count) {
								return badResp("С узлом нельзя связать элемент типа \"Магистральная часть воздухораспределителя\" в количестве " + input_counts[i].count + ", пожалуйста проверьте введенные данные.");
							}
						}
						else if (input_counts[i].count > 0) {
							return badResp("С данным узлом можно связать только СЧ, которые указаны в типе узла \"Воздухораспределитель\".");
						}
					}
				}
			}
			else {
				return badResp("Не найдена запись в Реестре номенклатуры узлов.");
			}
		}
		else {
			return badResp("Не найдена запись в Реестре узлов.");
		}
	}

	return successResp();
}

/**
 * Проверка состава узла/СЕ(По составным частям)
 * @param {*} ke_node_type 		Объект из справочника "Типы узлов/сборочных единиц"
 * @param {*} key_elements 		Массив составных частей для проверки
 */
function checkAssemblyElementCompositionForKeyElements(ke_node_type, key_elements) {
	var child_node_ids = [];
	var child_key_element_ids = [];

	var child_nodes = [];
	var child_key_elements = [];

	for (var i = 0; i < key_elements.length; i++) {
		if (isNotEmptyString(key_elements[i].ke_node) && child_node_ids.indexOf(key_elements[i].ke_node) == -1) {
			var child_node = db.findbyrecid("reestr_ke_nodes", key_elements[i].ke_node);

			child_node_ids.push(key_elements[i].ke_node);
			child_nodes.push(child_node);
		}
		else if (isEmptyString(key_elements[i].ke_node) && child_key_element_ids.indexOf(key_elements[i].recid) == -1) {
			child_key_element_ids.push(key_elements[i].recid);
			child_key_elements.push(key_elements[i]);
		}
	}

	for (var i = 0; i < child_nodes.length; i++) {
		var assembly_element_composition_record_params = {
			parent_assembly_element: ke_node_type.recid,
			child_assembly_element: child_nodes[i].ke_node_type
		}

		var assembly_element_composition_record = db.findbyparams("dictionary_assembly_element_composition", assembly_element_composition_record_params);

		if (isNullObject(assembly_element_composition_record)) {
			return badResp("Сборочный элемент "
				+ child_nodes[i].unique_number
				+ " (" + child_nodes[i].ke_node_type___value + ")"
				+ " не может быть включен в состав сборочного элемента "
				+ ke_node_type.recname
				+ ".");
		}
	}

	for (var i = 0; i < child_key_elements.length; i++) {
		var assembly_element_composition_record_params = {
			parent_assembly_element: ke_node_type.recid,
			child_key_element: child_key_elements[i].key_element_code
		}

		var assembly_element_composition_record = db.findbyparams("dictionary_assembly_element_composition", assembly_element_composition_record_params);

		if (isNullObject(assembly_element_composition_record)) {
			return badResp("составная часть "
				+ child_key_elements[i].numberke
				+ " (" + child_key_elements[i].key_element_code___value + ")"
				+ " не может быть включен в состав сборочного элемента "
				+ ke_node_type.recname
				+ ".");
		}
	}

	return successResp();
}

/**
 * Проверка состава узла/СЕ
 * @param {*} ke_node_type		Объект из справочника "Типы узлов/сборочных единиц"
 * @param {*} assembly_units 	Массив узлов/СЕ
 */
function checkAssemblyElementCompositionForAssemblyUnits(ke_node_type, assembly_units) {
	for (var i = 0; i < assembly_units.length; i++) {
		var assembly_element_composition_record_params = {
			parent_assembly_element: ke_node_type.recid,
			child_assembly_element: assembly_units[i].ke_node_type
		}

		var assembly_element_composition_record = db.findbyparams("dictionary_assembly_element_composition", assembly_element_composition_record_params);

		if (isNullObject(assembly_element_composition_record)) {
			return badResp("Сборочный элемент "
				+ assembly_units[i].unique_number
				+ " (" + assembly_units[i].ke_node_type___value + ")"
				+ " не может быть включен в состав сборочного элемента "
				+ ke_node_type.recname
				+ ".");
		}
	}

	return successResp();
}

/**
 * Разгруппировка узла/СЕ
 * @param {*} node_id 	Идентификатор разгруппировываемого узла
 */
function ungroupchildnode(node_id) {
	var res = true;
	var errormessage = "Узел не разгруппирован. ";
	var date = new Date();

	var node = db.findbyrecid("reestr_ke_nodes", node_id);
	if (isNullObject(node)) {
		return badResp("Узел не найден в системе.");
	}

	var rzd_url = get_rzd_urls_portal_settings();
	if(!rzd_url.success){
		return badResp("Не удалось получить адрес АРМ Росжелдора");
	}

	var reestr_key_element_params = {
		"ke_node": node.recid
	};
	var reestr_key_elements = db.findbyparams("reestr_key_elements", reestr_key_element_params);
	if (isEmptyOrNullArray(reestr_key_elements)) {
		return badResp("Не найдены СЧ, связанные с узлом.");
	}

	var member = getmemberbyuser();
	if (isNullObject(member)) {
		return badResp("Не удалось определить участника для текущего пользователя.");
	}

	var nodeip = getnodeipbymember(member.recid);
	if (isEmptyString(nodeip)) {
		return badResp("Не удалось определить IP адрес блокчейна.");
	}

	var manufacturer = db.findbyrecid("dictionary_branding_codes", member.branding_code);
	if (isNullObject(manufacturer)) {
		return badResp("Условный код клеймения участника текущего пользователя не найден в системе.");
	}

	var blockchainResponse = {};

	if (node.assembly_element_type == commonAssemblyElementTypes.node_id) {
		var ungroupobjectsbch = {
			"nodeip": nodeip,
			"hash": node.blockchainhash,
			"node": node.blockchainnode,
			"recn": node.blockchainrecn,
			"tn": node.blockchaintn,
			"manufacturer": manufacturer.full_name,
			"date": date.getUTCFullYear() +
				'-' + (date.getUTCMonth() + 1).toString().padStart(2, 0) +
				'-' + (date.getUTCDate()).toString().padStart(2, 0)
		};

		blockchainResponse = ungroupNodeBlockchain(ungroupobjectsbch);
		node.blockchain_request_body = JSON.stringify(blockchainResponse.request);
	}
	else {
		var ungroupobjectsbch = {
			"nodeip": nodeip,
			"hash": node.blockchainhash,
			"node": node.blockchainnode,
			"recn": node.blockchainrecn,
			"tn": node.blockchaintn
		};

		blockchainResponse = ungroupAssemblyUnitBlockchain(ungroupobjectsbch);
		node.blockchain_request_body = JSON.stringify(blockchainResponse.request);
	}

	if (!!blockchainResponse.result) {
		var update_res = null;

		for (var i = 0; i < reestr_key_elements.length; i++) {
			var reestr_key_element = reestr_key_elements[i];
			
			// Действие - Разгруппировка
			var log_item = set_ke_log(reestr_key_element, "29bba961-5aa4-4690-a459-49bcdbaf502f", node.recid, node.ke_node_type);

			//db.insert("log", log_item);
			// Отправка записи истории 29.09.2020 amaslov 44458
			MakeLogRecord("log", log_item, rzd_url.rzd_name_url);

			reestr_key_element.ke_node = null;
			reestr_key_element.position_on_node = null;
			update_res = db.update("reestr_key_elements", reestr_key_element);

			if (!update_res) {
				res = false;
				errormessage += "Ошибка при обновлении СЧ с номером " + reestr_key_element.ke_number + ". ";

				break;
			}
		}

		// Статус - Разгруппирован
		node.status = "0dae0f67-de52-4d13-9984-3297d3bc958a";
		node.blockchain_request_body = JSON.stringify(blockchainResponse.request);
		update_res = db.update("reestr_ke_nodes", node);

		if (!update_res) {
			res = false;
			errormessage += "Ошибка при обновлении узла с номером " + node.unique_number + ". ";
		}
	}

	if (!res) {
		return badResp(errormessage);
	}

	return successResp("Узел успешно разгруппирован.");
}

// Разгруппировать узел
function ungroupkenode(params) {
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
	var date = new Date();

	var node = db.findbyrecid("reestr_ke_nodes", params.recid);
	if (isNullObject(node)) {
		return badResp("Узел не найден в системе.");
	}
	var rzd_url = get_rzd_urls_portal_settings();
	if(!rzd_url.success){
		return badResp("Не удалось получить адрес АРМ Росжелдора");
	}
	
	// Получаем все СЧ, входящие в узел
	var key_element_params = {
		"ke_node": node.recid
	};
	var key_elements = db.findbyparams("reestr_key_elements", key_element_params);
	if (isEmptyOrNullArray(key_elements)) {
		return badResp("Не найдены СЧ, связанные с узлом.");
	}

	// Если узел Установлен на ТС, то возвращаем ошибку
	if (node.status == "f831cffa-e2ce-417f-8b4f-1645715bd454"
		|| key_elements[0].statuske == commonConst.UstanovlenId) {
		return badResp("Нельзя разгруппировать узел, т.к. он установлен на вагон.");
	}

	// Получаем текущего участника
	var user = getcurrentuser();
	if(isNullObject(user)){
		return badResp("Невозможно получить текущего пользователя");
	}

	var member = getmemberbyuserwithrecid(user.recid);
	if(isNullObject(member)){
		return badResp("Получатель не найден в системе");
	}

	// Проверка наличии партии у СЧ
	for (let k = 0; k < key_elements.length; k++) {
		var key_elem = key_elements[k];
		if (key_elem.batchid != null && key_elem.batchid !=""){
			//получаем запись партии
			var batch = db.findbyrecid("reestr_batch", key_elem.batchid);
			if (isNullObject(batch)) {
				return badResp("Запись о партии не найдена в системе");
			}
			if (member.recid == batch.recipient_droplist){
				if (batch.batch_status != "ef519ef4-ec73-4776-9295-2d007bb32907"){
					return badResp("Невозможно разгруппировать узел, в который входит СЧ, входящий в партию не в статусе - Получена.")
				}
			}
		}
	}

	var node_assembly_history_records_array = [];

	// Прописываем для всех дочерних СЧ предыдущий узел и позицию в узле
	for (var i = 0; i < key_elements.length; i++) {
		var node_assembly_history_record_params = {
			// Родительский узел
			parent_node: node.recid,
			// Дочерний СЧ
			child_key_element: key_elements[i].recid
		};
		// Получаем запись из таблицы "История сборки узлов" по номеру текущего СЧ и родительскому узлу
		var node_assembly_history_records = db.findbyparams("nodes_assembly_history", node_assembly_history_record_params);
		if (isEmptyOrNullArray(node_assembly_history_records)) {
			return badResp("Не удалось найти запись в таблице \"История сборки узлов\" для составной части " + key_elements[i].numberke + " в узле " + node.unique_number + ".");
		}

		var node_assembly_history_record = node_assembly_history_records[0];

		// Если в исторической записи указан дочерний узел
		if (isNotEmptyString(node_assembly_history_record.child_node)) {
			// Узел
			key_elements[i].ke_node = node_assembly_history_record.child_node;

			// Позиция в узле
			key_elements[i].position_on_node = isNotEmptyString(node_assembly_history_record.child_position_on_node)
				? node_assembly_history_record.child_position_on_node
				: null;
		} else {
			// Узел
			key_elements[i].ke_node = null;
			// Позиция в узле
			key_elements[i].position_on_node = null;
		}

		node_assembly_history_records_array.push(node_assembly_history_record);
	}

	var member = getmemberbyuser();
	if (isNullObject(member)) {
		member = db.findbyrecid("reestr_members", node.manufacturer_details);
		if(isNullObject(member)){
			return badResp("Не удалось определить участника для текущего пользователя.");
		}
	}

	var nodeip = getnodeipbymember(member.recid);
	if (isEmptyString(nodeip)) {
		return badResp("Не удалось определить IP адрес блокчейна.");
	}

	var manufacturer = db.findbyrecid("dictionary_branding_codes", member.branding_code);
	if (isNullObject(manufacturer)) {
		return badResp("Условный код клеймения участника текущего пользователя не найден в системе.");
	}

	var ungroupobjectsblockchainresp = {};

	// Разгруппировываем родительский узел в блокчейне
	// Если статус выпущен в обращение, отправляем в блокчейн
	if (node.status == "823cc6e9-465b-416e-beda-8a642149c235" || node.status == "25d67987-0cd4-404a-85d7-847d142af11f") {
		var ungroupobjectsbch = {
			"nodeip": nodeip,
			"hash": node.blockchainhash,
			"node": node.blockchainnode,
			"recn": node.blockchainrecn,
			"tn": node.blockchaintn,
			"manufacturer": manufacturer.full_name,
			"date": date.getUTCFullYear() +
				'-' + (date.getUTCMonth() + 1).toString().padStart(2, 0) +
				'-' + (date.getUTCDate()).toString().padStart(2, 0)
		};
		ungroupobjectsblockchainresp = ungroupNodeBlockchain(ungroupobjectsbch);
		node.blockchain_request_body = JSON.stringify(ungroupobjectsblockchainresp.request);
	}


	if ((node.status == "823cc6e9-465b-416e-beda-8a642149c235" || node.status == "25d67987-0cd4-404a-85d7-847d142af11f") && isNotNullObject(ungroupobjectsblockchainresp.result)
		|| node.status == "a4b6de4f-828a-46a3-b272-73a1c345ae44" ) {
		var update_res = null;

		// Сохраняем дочерние СЧ
		for (var i = 0; i < key_elements.length; i++) {
			// Сохраняем в лог запись о разгруппировке
			var log_item = set_ke_log(key_elements[i], "29bba961-5aa4-4690-a459-49bcdbaf502f", node.recid, node.ke_node_type);

			//db.insert("log", log_item);

			// Отправка записи истории 29.09.2020 amaslov 44458
			MakeLogRecord("log", log_item, rzd_url.rzd_name_url);

			if (isNotEmptyString(key_elements[i].ke_node)) {
				var key_element_node = db.findbyrecid("reestr_ke_nodes", key_elements[i].ke_node);

				if (isNotNullObject(key_element_node)) {
					// Сохраняем в лог запись о группировке
					log_item =set_ke_log(key_elements[i], "e935eefb-3f88-4576-b43a-275dbf4dc787", key_element_node.recid, key_element_node.ke_node_type);

					//db.insert("log", log_item);
					// Отправка записи истории 29.09.2020 amaslov 44458
					MakeLogRecord("log", log_item, rzd_url.rzd_name_url);
				}
			}

			// Сохраняем СЧ
			update_res = db.update("reestr_key_elements", key_elements[i]);
		}

		// Гриппируем и обновляем дочерние узлы (если такие имеются)
		var child_nodes_params = {
			parent_ke_node: node.recid
		};
		// Получаем все дочерние узлы
		var child_nodes = db.findbyparams("reestr_ke_nodes", child_nodes_params);
		if (isNotEmptyOrNullArray(child_nodes)) {
			for (var i = 0; i < child_nodes.length; i++) {
				// Получаем все СЧ, входящие в дочерний узел
				var child_node_key_elements_params = {
					"ke_node": child_nodes[i].recid
				};
				var child_node_key_elements = db.findbyparams("reestr_key_elements", child_node_key_elements_params);
				if (isEmptyOrNullArray(child_node_key_elements)) {
					return badResp("Не найдены СЧ, связанные с узлом" + child_nodes[i].unique_number + ".");
				}

				var dictionary_ke_node_type = db.findbyrecid("dictionary_ke_node_types", child_nodes[i].ke_node_type);

				var groupobjectsblockchainresp = {};
				//По задаче rm38731 дочерние СЕ не разгруппировываются в блокчейн при включении в СЕ родительского уровня, и, соответственно, их не надо группировать повторно при разгруппировке родительского СЕ. Группируем в блокчейн только узлы
				if (child_nodes[i].assembly_element_type == commonAssemblyElementTypes.node_id) {
					var groupobjectsbch = {
						"nodeip": nodeip,
						"reestr_key_elements": child_node_key_elements,
						"type": dictionary_ke_node_type.reccode,
						"manufacturer": manufacturer.full_name,
						"number": null,
						"date": date.getUTCFullYear() +
							'-' + (date.getUTCMonth() + 1).toString().padStart(2, 0) +
							'-' + (date.getUTCDate()).toString().padStart(2, 0)
					};

					groupobjectsblockchainresp = groupNodeBlockchain(groupobjectsbch);
					node.blockchain_request_body = JSON.stringify(groupobjectsblockchainresp.request);
				}

				// groupobjectsblockchainresp = groupNodeBlockchain(groupobjectsbch);
				if (child_nodes[i].assembly_element_type == commonAssemblyElementTypes.assembly_unit_id || !!groupobjectsblockchainresp.result) {
					// Статус - Выпущен в обращение
					child_nodes[i].status = "823cc6e9-465b-416e-beda-8a642149c235";
					child_nodes[i].parent_ke_node = null;
					// Тип родительского узла
					child_nodes[i].parent_node_type = null;
					child_nodes[i].position_on_assembly_element = null;

					if (child_nodes[i].assembly_element_type == commonAssemblyElementTypes.node_id) {
						child_nodes[i].blockchainhash = groupobjectsblockchainresp.result.hash;
						child_nodes[i].blockchainnode = groupobjectsblockchainresp.result.node;
						child_nodes[i].blockchainrecn = groupobjectsblockchainresp.result.recn;
						child_nodes[i].blockchaintn = groupobjectsblockchainresp.result.tn;
					}

					update_res = db.update("reestr_ke_nodes", child_nodes[i]);
				}
			}
		}

		// Устанавливаем статус "Разгруппирован"
		node.status = "0dae0f67-de52-4d13-9984-3297d3bc958a";
		// Сбрасываем количество дочерних элементов
		node.child_count = 0;

		db.update("reestr_ke_nodes", node);

		//Прописываем историю в таблицу node_log
		var node_log_actions = db.findbyparams("dictionary_node_actions", { "code": 2 });

		//Разгруппировка
		var node_log_record = set_node_log(node, node_log_actions[0].recid, "");

		//Прописываем содержимое узла
		for (var i = 0; i < key_elements.length; i++) {
			var key_element_type_record = db.findbyrecid("dictionary_key_elements_codes", key_elements[i].key_element_code)
			if (isNotNullObject(key_element_type_record)) {
				if (i < key_elements.length - 1) {
					node_log_record.node_content += key_elements[i].numberke + '(' + key_element_type_record.recname + ')' + ", ";
				} else {
					node_log_record.node_content += key_elements[i].numberke + '(' + key_element_type_record.recname + ')'
				}
			} else {
				if (i < key_elements.length - 1) {
					node_log_record.node_content += key_elements[i].numberke + ", ";
				} else {
					node_log_record.node_content += key_elements[i].numberke
				}
			}
		}
		
		//db.insert("node_log", node_log_record);
		// Отправка записи истории 29.09.2020 amaslov 44458
		MakeLogRecord("node_log", node_log_record, rzd_url.rzd_name_url);

		// Удаляем родительский узел
		db.delete("reestr_ke_nodes", node.recid);

		// Удаляем записи из таблицы История сборки узлов, которые относятся к текущему узлу
		for (var i = 0; i < node_assembly_history_records_array.length; i++) {
			//удаляем локально (т.к. иначе эти записи останутся)
			var delLocal = delete_entity_static({
				table: "nodes_assembly_history",
				recid: node_assembly_history_records_array[i].recid
			});
			//удаляем на АРМ росжелдор
			var sendRes = DeleteRecordToOuterRdev("nodes_assembly_history", node_assembly_history_records_array[i].recid, rzd_url.rzd_name_url);
			if(!sendRes.success){
				return sendRes;
			}
		}
	}

	return successResp("Узел успешно разгруппирован.");
}

// Разгруппировать СЕ
function ungroupassemblyunit(params) {
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
	
	var date = new Date();

	var node = db.findbyrecid("reestr_ke_nodes", params.recid);
	if (isNullObject(node)) {
		return badResp("СЕ не найден в системе.");
	}
	// Получаем текущего участника
	var user = getcurrentuser();
	if(isNullObject(user)){
		return badResp("Невозможно получить текущего пользователя");
	}

	var member = getmemberbyuserwithrecid(user.recid);
	if(isNullObject(member)){
		return badResp("Получатель не найден в системе");
	}

	//проверка на наличие партии у разгруппировываемого се
	if (node.batchid != null && node.batchid !=""){
		//получаем запись партии
		var batch = db.findbyrecid("reestr_batch", node.batchid);
		if (isNullObject(batch)) {
			return badResp("Запись о партии не найдена в системе");
		}
		if (member.recid == batch.recipient_droplist){
			//если получатель
			if (batch.batch_status != "ef519ef4-ec73-4776-9295-2d007bb32907" && batch.batch_status != "f7b21136-24a8-4ae5-af5b-3b7b3dd0c36b" && node.change_node != true){
				return badResp("Невозможно разгруппировать СЕ, в который входит СЧ, входящий в партию не в статусе - Получена или Получена частично.")
			}
		} else{
			//если отправитель
			//статус партии отклонена или получена частично флаг false
			if (batch.batch_status != "281496a2-3d01-479e-80cb-96e6e6e76135" && batch.batch_status != "f7b21136-24a8-4ae5-af5b-3b7b3dd0c36b" && node.change_node != true){
				return badResp("Невозможно разгруппировать СЕ, в который входит СЧ, входящий в партию не в статусе - Отклонена или Получена частично.")
			}
		}
	}

	// Получаем все СЧ, входящие в узел
	var key_element_params = {
		"ke_node": node.recid
	};

	var rzd_url = get_rzd_urls_portal_settings();
	if(!rzd_url.success){
		return badResp("Не удалось получить адрес ");
	}

	var key_elements = db.findbyparams("reestr_key_elements", key_element_params);
	
	if (isEmptyOrNullArray(key_elements)) {
		key_elements = []
		// return badResp("Не найдены СЧ, связанные с СЕ.");
	}

	// Получаем текущего участника
	var user = getcurrentuser();
	if(isNullObject(user)){
		return badResp("Невозможно получить текущего пользователя");
	}

	var member = getmemberbyuserwithrecid(user.recid);
	if(isNullObject(member)){
		return badResp("Получатель не найден в системе");
	}
	if (key_elements.length > 0){
		// Проверка наличии партии у СЧ
		for (let k = 0; k < key_elements.length; k++) {
			var key_elem = key_elements[k];
			if (key_elem.batchid != null && key_elem.batchid !=""){
				//получаем запись партии
				var batch = db.findbyrecid("reestr_batch", key_elem.batchid);
				if (isNullObject(batch)) {
					return badResp("Запись о партии не найдена в системе");
				}
				if (member.recid == batch.recipient_droplist){
					//если получатель
					if (batch.batch_status != "ef519ef4-ec73-4776-9295-2d007bb32907" && batch.batch_status != "f7b21136-24a8-4ae5-af5b-3b7b3dd0c36b" && key_elem.change_node != true){
						return badResp("Невозможно разгруппировать СЕ, в который входит СЧ, входящий в партию не в статусе - Получена или Получена частично.")
					}
				} else{
					//если отправитель
					//статус партии отклонена или получена частично флаг false
					if (batch.batch_status != "281496a2-3d01-479e-80cb-96e6e6e76135" && batch.batch_status != "f7b21136-24a8-4ae5-af5b-3b7b3dd0c36b" && key_elem.change_node != true){
						return badResp("Невозможно разгруппировать СЕ, в который входит СЧ, входящий в партию не в статусе - Отклонена или Получена частично.")
					}
				}
			}
		}
	}
	// Если узел Установлен на ТС, то возвращаем ошибку
	if (node.status == "f831cffa-e2ce-417f-8b4f-1645715bd454") {
		return badResp("Нельзя разгруппировать СЕ, т.к. он установлен на вагон.");
	}

	var node_assembly_history_records_array = [];

	// Прописываем для всех дочерних СЧ предыдущий узел и позицию в узле
	for (var i = 0; i < key_elements.length; i++) {
		var node_assembly_history_record_params = {
			// Родительский узел
			parent_node: node.recid,
			// Дочерний СЧ
			child_key_element: key_elements[i].recid
		};
		// Получаем запись из таблицы "История сборки узлов" по номеру текущего СЧ и родительскому узлу
		var node_assembly_history_records = db.findbyparams("nodes_assembly_history", node_assembly_history_record_params);
		if (isEmptyOrNullArray(node_assembly_history_records)) {
			return badResp("Не удалось найти запись в таблице \"История сборки узлов\" для составной части " + key_elements[i].numberke + " в СЕ " + node.unique_number + ".");
		}

		var node_assembly_history_record = node_assembly_history_records[0];

		// Если в исторической записи указан дочерний узел
		if (isNotEmptyString(node_assembly_history_record.child_node)) {
			// Узел
			key_elements[i].ke_node = node_assembly_history_record.child_node;

			// Позиция в узле
			if (isNotEmptyString(node_assembly_history_record.child_position_on_node)) {
				var position_on_node = db.findbyrecid("dictionary_positions_on_node", node_assembly_history_record.child_position_on_node)
				var positions_on_parent_node = db.findbyparams("dictionary_positions_on_parent_node", {
					"recname": position_on_node.recname,
					"key_element_code": position_on_node.key_element_code,
					"parent_node_type": position_on_node.node_type
				});
				if (isNotEmptyOrNullArray(positions_on_parent_node)) {
					var position_on_node_id = positions_on_parent_node[0].position_on_node;
					key_elements[i].position_on_node = position_on_node_id;
					// if(isNotEmptyString(position_on_node_id)){
					// 	key_elements[i].position_on_node = position_on_node_id;
					// }else{
					// 	return badResp("При разгруппировке не удалось определить позицию для дочернего узла");
					// }
				} else {
					return badResp("При разгруппировке не удалось определить позиции для дочернего узла", key_elements[i]);
				}
			} else {
				key_elements[i].position_on_node = null;
			}

			// key_elements[i].position_on_node = isNotEmptyString(node_assembly_history_record.child_position_on_node)
			//     ? node_assembly_history_record.child_position_on_node
			//     : null;
		} else {
			// Узел
			key_elements[i].ke_node = null;
			// Позиция в узле
			key_elements[i].position_on_node = null;
		}

		node_assembly_history_records_array.push(node_assembly_history_record);
	}


	var member = getmemberbyuser();
	if (isNullObject(member)) {
		member = db.findbyrecid("reestr_members", node.manufacturer_details);
		if(isNullObject(member)){
			return badResp("Не удалось определить участника для текущего пользователя.")
		}
	}

	var nodeip = getnodeipbymember(member.recid);
	if (isEmptyString(nodeip)) {
		return badResp("Не удалось определить IP адрес блокчейна.");
	}

	var manufacturer = db.findbyrecid("dictionary_branding_codes", member.branding_code);
	if (isNullObject(manufacturer)) {
		return badResp("Условный код клеймения участника текущего пользователя не найден в системе.");
	}

	var ungroupobjectsblockchainresp = {};

	// Если статус Выпущен в обращение, отправляем данные в блокчейн
	if (node.status == "823cc6e9-465b-416e-beda-8a642149c235" || node.status == "25d67987-0cd4-404a-85d7-847d142af11f") {
		// Разгруппировываем родительский СЕ в блокчейне
		var ungroupobjectsbch = {
			"nodeip": nodeip,
			"hash": node.blockchainhash,
			"node": node.blockchainnode,
			"recn": node.blockchainrecn,
			"tn": node.blockchaintn
		};

		ungroupobjectsblockchainresp = ungroupAssemblyUnitBlockchain(ungroupobjectsbch);
		node.blockchain_request_body = JSON.stringify(ungroupobjectsblockchainresp.request);
	}
	
	// Если статус "Выпущен в обращение" и блокчейн ответил согласием
	// или статус "Готов к регистрации"
	if ((node.status == "823cc6e9-465b-416e-beda-8a642149c235" || node.status == "25d67987-0cd4-404a-85d7-847d142af11f") && isNotNullObject(ungroupobjectsblockchainresp.result)
		|| node.status == "a4b6de4f-828a-46a3-b272-73a1c345ae44") {
		var update_res = null;

		// Сохраняем дочерние СЧ
		for (var i = 0; i < key_elements.length; i++) {
			// Сохраняем в лог запись о разгруппировке
			var log_item = set_ke_log(key_elements[i], "29bba961-5aa4-4690-a459-49bcdbaf502f", node.recid, node.ke_node_type);

			//db.insert("log", log_item);
			// Отправка записи истории 29.09.2020 amaslov 44458
			MakeLogRecord("log", log_item, rzd_url.rzd_name_url);

			if (isNotEmptyString(key_elements[i].ke_node)) {
				var key_element_node = db.findbyrecid("reestr_ke_nodes", key_elements[i].ke_node);

				if (isNotNullObject(key_element_node)) {
					// Сохраняем в лог запись о группировке
					log_item = set_ke_log( key_elements[i], "e935eefb-3f88-4576-b43a-275dbf4dc787", key_element_node.recid, key_element_node.ke_node_type);

					//db.insert("log", log_item);
					// Отправка записи истории 29.09.2020 amaslov 44458
					MakeLogRecord("log", log_item, rzd_url.rzd_name_url);
				}
			}

			// Сохраняем СЧ
			update_res = db.update("reestr_key_elements", key_elements[i]);
		}

		// Группируем и обновляем дочерние узлы (если такие имеются)
		var child_nodes_params = {
			parent_ke_node: node.recid
		};
		// Получаем все дочерние узлы
		var child_nodes = db.findbyparams("reestr_ke_nodes", child_nodes_params);
		if (isNotEmptyOrNullArray(child_nodes)) {
			if (child_nodes.length > 0){
				// Проверка наличии партии у СЕ
				for (let k = 0; k < child_nodes.length; k++) {
					var child_node = child_nodes[k];
					if (child_node.batchid != null && child_node.batchid !=""){
						//получаем запись партии
						var batch = db.findbyrecid("reestr_batch", child_node.batchid);
						if (isNullObject(batch)) {
							return badResp("Запись о партии не найдена в системе");
						}
						if (member.recid == batch.recipient_droplist){
							//если получатель
							if (batch.batch_status != "ef519ef4-ec73-4776-9295-2d007bb32907" && batch.batch_status != "f7b21136-24a8-4ae5-af5b-3b7b3dd0c36b" && child_node.change_node != true){
								return badResp("Невозможно разгруппировать СЕ, в который входит СЕ, входящий в партию не в статусе - Получена или Получена частично.")
							}
						} else{
							//если отправитель
							//статус партии отклонена или получена частично флаг false
							if (batch.batch_status != "281496a2-3d01-479e-80cb-96e6e6e76135" && batch.batch_status != "f7b21136-24a8-4ae5-af5b-3b7b3dd0c36b" && child_node.change_node != true){
								return badResp("Невозможно разгруппировать СЕ, в который входит СЕ, входящий в партию не в статусе - Отклонена или Получена частично.")
							}
						}
					}
				}
			}
		}

		if (isNotEmptyOrNullArray(child_nodes)) {
			//Разгруппировываем дочерние СЕ
			for (var i = 0; i < child_nodes.length; i++) {
				// Получаем все СЧ, входящие в дочерний узел
				var child_node_key_elements_params = {
					"ke_node": child_nodes[i].recid
				};
				var child_node_key_elements = db.findbyparams("reestr_key_elements", child_node_key_elements_params);
				//Если это СЕ без СЧ
				if (isEmptyOrNullArray(child_node_key_elements)) {
					child_nodes[i].status = "823cc6e9-465b-416e-beda-8a642149c235";
					child_nodes[i].parent_ke_node = null;
					child_nodes[i].parent_node_type = null;
					child_nodes[i].position_on_assembly_element = null;
					update_res = db.update("reestr_ke_nodes", child_nodes[i]);
				} else {
					var dictionary_ke_node_type = db.findbyrecid("dictionary_ke_node_types", child_nodes[i].ke_node_type);

					var groupobjectsblockchainresp = {};

					//По задаче rm38731 дочерние СЕ не разгруппировываются в блокчейн при включении в СЕ родительского уровня, и, соответственно, их не надо группировать повторно при разгруппировке родительского СЕ. Группируем в блокчейн только узлы
					if (child_nodes[i].assembly_element_type == commonAssemblyElementTypes.node_id) {
						var groupobjectsbch = {
							"nodeip": nodeip,
							"reestr_key_elements": child_node_key_elements,
							"type": dictionary_ke_node_type.reccode,
							"manufacturer": manufacturer.full_name,
							"number": null,
							"date": date.getUTCFullYear() +
								'-' + (date.getUTCMonth() + 1).toString().padStart(2, 0) +
								'-' + (date.getUTCDate()).toString().padStart(2, 0)
						};

						groupobjectsblockchainresp = groupNodeBlockchain(groupobjectsbch);
						child_nodes[i].blockchain_request_body = JSON.stringify(groupobjectsblockchainresp.request);
					}

					if (child_nodes[i].assembly_element_type == commonAssemblyElementTypes.assembly_unit_id || !!groupobjectsblockchainresp.result) {
						// Статус - Выпущен в обращение
						child_nodes[i].status = "823cc6e9-465b-416e-beda-8a642149c235";
						child_nodes[i].parent_ke_node = null;
						child_nodes[i].parent_node_type = null;
						child_nodes[i].position_on_assembly_element = null;

						if (child_nodes[i].assembly_element_type == commonAssemblyElementTypes.node_id) {
							child_nodes[i].blockchainhash = groupobjectsblockchainresp.result.hash;
							child_nodes[i].blockchainnode = groupobjectsblockchainresp.result.node;
							child_nodes[i].blockchainrecn = groupobjectsblockchainresp.result.recn;
							child_nodes[i].blockchaintn = groupobjectsblockchainresp.result.tn;
						}

						update_res = db.update("reestr_ke_nodes", child_nodes[i]);
					}
				}
			}
		}

		// Устанавливаем статус "Разгруппирован"
		node.status = "0dae0f67-de52-4d13-9984-3297d3bc958a";
		db.update("reestr_ke_nodes", node);

		// // Удаляем родительский узел
		// db.delete("reestr_ke_nodes", node.recid);

		//Прописываем историю в таблицу node_log
		var node_log_actions = db.findbyparams("dictionary_node_actions", { "code": 2 });
			
		//Разгруппировка
		var node_log_record = set_node_log(node, node_log_actions[0].recid, "");

		//Прописываем содержимое узла
		for (var i = 0; i < key_elements.length; i++) {
			var key_element_type_record = db.findbyrecid("dictionary_key_elements_codes", key_elements[i].key_element_code)
			if (isNotNullObject(key_element_type_record)) {
				if (i < key_elements.length - 1) {
					node_log_record.node_content += key_elements[i].numberke + '(' + key_element_type_record.recname + ')' + ", ";
				} else {
					node_log_record.node_content += key_elements[i].numberke + '(' + key_element_type_record.recname + ')'
				}
			} else {
				if (i < key_elements.length - 1) {
					node_log_record.node_content += key_elements[i].numberke + ", ";
				} else {
					node_log_record.node_content += key_elements[i].numberke
				}
			}
		}
		//db.insert("node_log", node_log_record);

		// Отправка записи истории 29.09.2020 amaslov 44458
		MakeLogRecord("node_log", node_log_record, rzd_url.rzd_name_url);

		// Удаляем записи из таблицы История сборки узлов, которые относятся к текущему узлу
		for (var i = 0; i < node_assembly_history_records_array.length; i++) {
			//удаляем локально (т.к. иначе эти записи останутся)
			var delLocal = delete_entity_static({
				table: "nodes_assembly_history",
				recid: node_assembly_history_records_array[i].recid
			});
			//удаляем на АРМ росжелдор
			var sendRes = DeleteRecordToOuterRdev("nodes_assembly_history", node_assembly_history_records_array[i].recid, rzd_url.rzd_name_url);
			if(!sendRes.success){
				return sendRes;
			}
		}
	}

	return successResp("СЕ успешно разгруппирован.");
}

// Блокчейн - Разруппировать СЧ из узла.
function ungroupNodeBlockchain(params) {

	var request =
	{
		"method":
		{
			"function": "ungroup_objects",
			"package": "NBD"
		},
		"group_link":
		{
			"node": params.node,
			"tn": params.tn,
			"hash": params.hash,
			"recn": params.recn
		},
		"дата": params.date,
		"предприятие": params.manufacturer
	};
	var blockchainResponse = sendrequest(request, params.nodeip);
	blockchainResponse.request = request;
	return blockchainResponse;
}

// Блокчейн - Разруппировать СЧ из узла.
function ungroupAssemblyUnitBlockchain(params) {

	var request =
	{
		"method":
		{
			"function": "object_ungroup",
			"package": "NBD"
		},
		"object_link":
		{
			"node": params.node,
			"tn": params.tn,
			"hash": params.hash,
			"recn": params.recn
		}
	};

	var blockchainResponse = sendrequest(request, params.nodeip);
	blockchainResponse.request = request;
	return blockchainResponse;
}

// Заменить СЧ в узле
function replacekeinnode(params) {
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};

	var parameters = {
		"assembly_unit_recid": params.recid,
		"old_key_element": params.old_key_element,
		"new_key_element": params.new_key_element
	}

	//Вызываем метод из плагина
	var res = plugins.callAsMethod("/plugins/nbdlogicplugin/replacekeinassemblyunit", "post", parameters, null);
	return res;

	var res = true;
	var error_message = "";
	var errors = [];
	var date = new Date();	

	var node = db.findbyrecid("reestr_ke_nodes", params.recid);
	
	if (isNullObject(node)) {
		errors.push("Узел не найден в системе");
	}	

	if (isEmptyString(params.old_key_element)) {
		errors.push("Не заполнен обязательный параметр - \"УИН СЧ, который будет заменен\"");
	}	

	if (isEmptyString(params.new_key_element)) {
		errors.push("Не заполнен обязательный параметр - \"УИН нового СЧ\"");
	}

	var rzd_url = get_rzd_urls_portal_settings();
	if(!rzd_url.success){
		return badResp("Не удалось получить адрес АРМ Росжелдора");
	}

	if (errors.length > 0){
		error_message = errors.join(";<br>");
		return badResp(error_message);
	}	

	var reestr_key_element_params = {
		"ke_node": node.recid
	};

	// Получаем список СЧ, связанных с узлом
	var reestr_key_elements = db.findbyparams("reestr_key_elements", reestr_key_element_params);

	// Если узел Установлен на ТС, то возвращаем ошибку
	// if (node.status == "f831cffa-e2ce-417f-8b4f-1645715bd454"
	// 	|| reestr_key_elements[0].statuske == commonConst.UstanovlenId) {
	// 		errors.push("Нельзя заменить составная часть в узле, т.к. она установлена на вагон");
	// }

	// Проверяем наличие в системе старого СЧ (которое будет заменено)
	var old_key_element = db.findbyrecid("reestr_key_elements", params.old_key_element);
	if (isNullObject(old_key_element)) {
		return badResp("Заменяемая составная часть не найден в системе.");
	}
	// Проверяем, что старый СЧ связан с узлом
	if (old_key_element.ke_node != node.recid) {
		return badResp("составная часть " + old_key_element.numberke + " не привязана к узлу.");
	}

	var rzd_url = get_rzd_urls_portal_settings();
	if(!rzd_url.success){
		return badResp("Не удалось получить адрес АРМ Росжелдора");
	}

	// Проверяем наличие в системе нового СЧ (на которое будет заменено)
	var new_key_element_params = {
		"numberke": params.new_key_element
	};
	var new_key_elements = db.findbyparams("reestr_key_elements", new_key_element_params);
	if (isNullObject(new_key_elements)) {
		return badResp("составная часть " + params.new_key_element + " не найдена в системе.");
	}
	// Проверяем новый СЧ на связь с другим узлом
	var new_key_element = new_key_elements[0];
	if (new_key_element.ke_node != null && new_key_element.ke_node != "") {
		return badResp("составная часть " + params.new_key_element + " уже связана с другим узлом.");
	}
	// Проверяем статус нового СЧ
	if (new_key_element.statuske != "c82c2eb8-0cf9-4693-8a2b-c6bf605c97ab") {
		return badResp("составная часть " + params.new_key_element + " в текущем статусе не может участвовать в замене.");
	}
	//Проверяем что у СЧ нет ссылки на партию
	if (new_key_element.batchid != null && new_key_element.batchid !=""){
		// Получаем текущего участника
		var user = getcurrentuser();
		if(isNullObject(user)){
			return badResp("Невозможно получить текущего пользователя");
		}

		var member = getmemberbyuserwithrecid(user.recid);
		if(isNullObject(member)){
			return badResp("Получатель не найден в системе");
		}
		//получаем запись партии
		var batch = db.findbyrecid("reestr_batch", new_key_element.batchid);
		if (isNullObject(batch)) {
			return badResp("Запись о партии не найдена в системе");
		}
		if (member.recid == batch.recipient_droplist){
			//если получатель
			if (batch.batch_status != "ef519ef4-ec73-4776-9295-2d007bb32907" && batch.batch_status != "f7b21136-24a8-4ae5-af5b-3b7b3dd0c36b" && new_key_element.change_node != true){
				return badResp("Невозможно разгруппировать СЕ, в который входит СЧ, входящий в партию не в статусе - Получена или Получена частично.")
			}
		} else{
			//если отправитель
			//статус партии отклонена или получена частично флаг false
			if (batch.batch_status != "281496a2-3d01-479e-80cb-96e6e6e76135" && batch.batch_status != "f7b21136-24a8-4ae5-af5b-3b7b3dd0c36b" && new_key_element.change_node != true){
				return badResp("Невозможно разгруппировать СЕ, в который входит СЧ, входящий в партию не в статусе - Отклонена или Получена частично.")
			}
		}
	}
	// Проверяем что у нового элемента такое же наименование как и у старого
	if (old_key_element.key_element_code != new_key_element.key_element_code) {
		return badResp("Тип нового СЧ не соответствует типу заменяемого СЧ.");
	}

	// Формируем новый массив СЧ для узла
	var new_key_elements_array = [];

	for (var i = 0; i < reestr_key_elements.length; i++) {
		var key_element = db.findbyrecid("reestr_key_elements", reestr_key_elements[i].recid);
		// Если обрабатываем СЧ, который нужно заменить, то кладем в массив новый СЧ
		if (key_element.recid == old_key_element.recid) {
			if (isNotEmptyString(key_element.position_on_node)) {
				new_key_element.position_on_node = key_element.position_on_node;
				new_key_element.position_on_node___value = key_element.position_on_node___value;
			}

			new_key_element.ke_node = key_element.ke_node;
			new_key_elements_array.push(new_key_element);
		}
		else {
			new_key_elements_array.push(key_element);
		}
	}

	var parent_node = node;
	var changed_node_assembly_history_records = [];
	var changed_child_nodes = [];

	// Необходимо проставить в исторические записи новый СЧ взамен старого
	while (isNotNullObject(parent_node)) {
		var node_assembly_history_record_params = {
			// Родительский узел
			parent_node: parent_node.recid,
			// Дочерний СЧ
			child_key_element: old_key_element.recid
		};

		// Получаем запись из таблицы "История сборки узлов" по номеру старого СЧ и родительскому узлу
		var node_assembly_history_records = db.findbyparams("nodes_assembly_history", node_assembly_history_record_params);
		if (isEmptyOrNullArray(node_assembly_history_records)) {
			return badResp("Не удалось найти запись в таблице \"История сборки узлов\" для составной части " + old_key_element.numberke + " в узле " + parent_node.unique_number + ".");
		}

		var node_assembly_history_record = node_assembly_history_records[0];
		changed_node_assembly_history_records.push(node_assembly_history_record);

		if (isNotEmptyString(node_assembly_history_record.child_node)) {
			parent_node = db.findbyrecid("reestr_ke_nodes", node_assembly_history_record.child_node);

			// Если у дочернего узла уникальный номер соответствует старому номеру, то заменяем его на новый
			if (parent_node.unique_number == old_key_element.numberke) {
				changed_child_nodes.push(parent_node);
			}
		}
		else {
			parent_node = null;
		}
	}

	// // Проводим проверки под новый список СЧ для узла
	// var res = checkreestrkenodetypelimitations(new_key_elements_array, node.reestr_ke_node_type, node.recid);
	// // Если для нового списка СЧ проверки не проходят, то заканчиваем выполнение метода и возвращаем ошибку
	// if (!res.success) { return res; }

	var member = getmemberbyuser();
	var nodeip = getnodeipbymember(member.recid);
	var manufacturer = db.findbyrecid("dictionary_branding_codes", member.branding_code);

	var blockchainResponse = {};

	var ungroupobjectsbch = {
		"nodeip": nodeip,
		"hash": node.blockchainhash,
		"node": node.blockchainnode,
		"recn": node.blockchainrecn,
		"tn": node.blockchaintn,
		"manufacturer": manufacturer.full_name,
		"date": date.getUTCFullYear() +
			'-' + (date.getUTCMonth() + 1).toString().padStart(2, 0) +
			'-' + (date.getUTCDate()).toString().padStart(2, 0)
	};
	if (node.status == "823cc6e9-465b-416e-beda-8a642149c235" || node.status == "25d67987-0cd4-404a-85d7-847d142af11f") {
		blockchainResponse = ungroupNodeBlockchain(ungroupobjectsbch);
		node.blockchain_request_body = JSON.stringify(blockchainResponse.request);
	}


	if (!!blockchainResponse.result || (node.status != "823cc6e9-465b-416e-beda-8a642149c235" && node.status != "25d67987-0cd4-404a-85d7-847d142af11f")) {
		let update_res = null;

		for (var i = 0; i < reestr_key_elements.length; i++) {
			var reestr_key_element = reestr_key_elements[i];
			
			reestr_key_element.ke_node = null;
			reestr_key_element.position_on_node = null;
			update_res = db.update("reestr_key_elements", reestr_key_element);

			if (!update_res) {
				return badResp("Ошибка при обновлении СЧ с номером " + reestr_key_element.ke_number + ".");
			}
		}

		update_res = db.update("reestr_ke_nodes", node);

		if (!update_res) {
			return badResp("Ошибка при обновлении узла с номером " + node.unique_number + ".");
		}
	}
	else {
		return badResp(blockchainResponse);
	}

	var dictionary_ke_node_type = db.findbyrecid("dictionary_ke_node_types", node.ke_node_type);

	var blockchainResponse = {};

	var groupobjectsbch = {
		"nodeip": nodeip,
		"reestr_key_elements": new_key_elements_array,
		"type": dictionary_ke_node_type.reccode,
		"manufacturer": manufacturer.full_name,
		"number": null,
		"date": date.getUTCFullYear() +
			'-' + (date.getUTCMonth() + 1).toString().padStart(2, 0) +
			'-' + (date.getUTCDate()).toString().padStart(2, 0)
	};
	if (node.status == "823cc6e9-465b-416e-beda-8a642149c235" || node.status == "25d67987-0cd4-404a-85d7-847d142af11f") {
		blockchainResponse = groupNodeBlockchain(groupobjectsbch);
		node.blockchain_request_body = JSON.stringify(blockchainResponse.request);
	}


	if (!!blockchainResponse.result || (node.status != "823cc6e9-465b-416e-beda-8a642149c235" && node.status != "25d67987-0cd4-404a-85d7-847d142af11f")) {
		// Если уникальный номер узла равен номеру СЧ, который мы заменяем,
		// то выбираем новый уникальный номер
		if (node.unique_number == old_key_element.numberke) {
			node.unique_number = new_key_elements_array[0].numberke;
		}

		if (node.assembly_element_type == commonAssemblyElementTypes.node_id && (node.status == "823cc6e9-465b-416e-beda-8a642149c235" || node.status == "25d67987-0cd4-404a-85d7-847d142af11f")) {
			node.blockchainhash = blockchainResponse.result.hash;
			node.blockchainnode = blockchainResponse.result.node;
			node.blockchainrecn = blockchainResponse.result.recn;
			node.blockchaintn = blockchainResponse.result.tn;
		}

		let update_res = db.update("reestr_ke_nodes", node);

		if (!update_res) {
			return {
				success: false,
				message: "Ошибка при сохранении записи в Реестре узлов"
			};
		}

		// Прописываем узел в СЧ
		for (var i = 0; i < new_key_elements_array.length; i++) {
			update_res = db.update("reestr_key_elements", new_key_elements_array[i]);

			if (!update_res) {
				return badResp("Ошибка при обновлении СЧ с номером " + new_key_elements_array[i].numberke + ".");
			}
		}

		//Прописываем событие Группировка для нового СЧ в узеле
		var log_item_old_ke = set_ke_log(new_key_element, "e935eefb-3f88-4576-b43a-275dbf4dc787", node.recid, node.ke_node_type)
		// Отправка записи в АРМ Росжелдора 29.09.2020 amaslov 44458
		MakeLogRecord("log", log_item_old_ke, rzd_url.rzd_name_url);

		// Действие - Замена СЧ в узле для СЧ
		var log_item = set_ke_log(old_key_element, "877d832e-4e2c-47ca-b79f-16977c8c31b9", node.recid, node.ke_node_type);

		// Отправка записи в АРМ Росжелдора 29.09.2020 amaslov 44458
		MakeLogRecord("log", log_item, rzd_url.rzd_name_url);

		//Прописываем событие Замена СЧ в СЕ для узла
		var node_log_record = set_node_log(node, "0448ba63-25b7-4ebf-b58e-8757691d6c7f", "");
		
		//Прописываем содержимое узла
		for (var i = 0; i < new_key_elements_array.length; i++) {
			var key_element_type_record = db.findbyrecid("dictionary_key_elements_codes", new_key_elements_array[i].key_element_code)
			if (isNotNullObject(key_element_type_record)) {
				if (i < new_key_elements_array.length - 1) {
					node_log_record.node_content += new_key_elements_array[i].numberke + '(' + key_element_type_record.recname + ')' + ", ";
				} else {
					node_log_record.node_content += new_key_elements_array[i].numberke + '(' + key_element_type_record.recname + ')'
				}
			} else {
				if (i < new_key_elements_array.length - 1) {
					node_log_record.node_content += new_key_elements_array[i].numberke + ", ";
				} else {
					node_log_record.node_content += new_key_elements_array[i].numberke
				}
			}
		}
		// Отправка записи в АРМ Росжелдора 29.09.2020 amaslov 44458
		MakeLogRecord("node_log", node_log_record, rzd_url.rzd_name_url);

		if (isNotEmptyOrNullArray(changed_node_assembly_history_records)) {
			for (var i = 0; i < changed_node_assembly_history_records.length; i++) {
				changed_node_assembly_history_records[i].child_key_element = new_key_element.recid;
				var sendRes = UpdateRecordToOuterRdev("nodes_assembly_history", changed_node_assembly_history_records[i], rzd_url.rzd_name_url);
				if(!sendRes.success){
					return sendRes;
				}
			}
		}

		if (isNotEmptyOrNullArray(changed_child_nodes)) {
			for (var i = 0; i < changed_child_nodes.length; i++) {
				changed_child_nodes[i].unique_number = params.new_key_element;
				db.update("reestr_ke_nodes", changed_child_nodes[i]);
			}
		}
	}
	else {
		return badResp(blockchainResponse);
	}

	return successResp("Узел успешно сохранен.");
}

// Заменить СЧ в СЕ
function replacekeinassemblyunit(params) {
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};


	var parameters = {
		"assembly_unit_recid": params.recid,
		"old_key_element": params.old_key_element,
		"new_key_element": params.new_key_element

	}
	//Вызываем метод из плагина
    var res = plugins.callAsMethod("/plugins/nbdlogicplugin/replacekeinassemblyunit", "post", parameters, null);
    return res;

	var res = true;
	var date = new Date();
	var error_message = "";
	var errors = [];

	var node = db.findbyrecid("reestr_ke_nodes", params.recid);
	if (isNullObject(node)) {
		return badResp("СЕ не найден в системе.");
	}	

	if (isEmptyString(params.old_key_element)) {
		errors.push("Не заполнен обязательный параметр - \"УИН СЧ, который будет заменен\"");
	}	

	if (isEmptyString(params.new_key_element)) {
		errors.push("Не заполнен обязательный параметр - \"УИН нового СЧ\"");
	}

	var rzd_url = get_rzd_urls_portal_settings();
	if(!rzd_url.success){
		return badResp("Не удалось получить адрес АРМ Росжелдора");
	}

	if (errors.length > 0){
		error_message = errors.join(";<br>");
		return badResp(error_message);
	}	

	var reestr_key_element_params = {
		"ke_node": node.recid
	};

	// Получаем список СЧ, связанных с узлом
	var reestr_key_elements = db.findbyparams("reestr_key_elements", reestr_key_element_params);

	// Если узел Установлен на ТС, то возвращаем ошибку
	if (node.status == "f831cffa-e2ce-417f-8b4f-1645715bd454"
		|| reestr_key_elements[0].statuske == commonConst.UstanovlenId) {
		return badResp("Нельзя заменить СЧ в узле, т.к. она установлена на вагон.");
	}

	// Проверяем наличие в системе старого СЧ (которое будет заменено)
	var old_key_element = db.findbyrecid("reestr_key_elements", params.old_key_element);
	if (isNullObject(old_key_element)) {
		return badResp("Заменяемая СЧ не найдена в системе.");
	}
	// Проверяем, что старый СЧ связан с узлом
	if (old_key_element.ke_node != node.recid) {
		return badResp("СЧ " + old_key_element.numberke + " не привязана к узлу.");
	}

	// Проверяем наличие в системе нового СЧ (на которое будет заменено)
	var new_key_element_params = {
		"numberke": params.new_key_element
	};
	var new_key_elements = db.findbyparams("reestr_key_elements", new_key_element_params);
	if (isNullObject(new_key_elements)) {
		return badResp("СЧ " + params.new_key_element + " не найдена в системе.");
	}
	// Проверяем новый СЧ на связь с другим узлом
	var new_key_element = new_key_elements[0];
	if (new_key_element.ke_node != null && new_key_element.ke_node != "") {
		return badResp("составная часть " + params.new_key_element + " уже связан с другим узлом.");
	}
	// Проверяем статус нового СЧ
	if (new_key_element.statuske != "c82c2eb8-0cf9-4693-8a2b-c6bf605c97ab" && new_key_element.statuske != "259762d5-2ee4-4acb-a2c7-18593cb6cc4f") {
		return badResp("составная часть " + params.new_key_element + " в текущем статусе не может участвовать в замене.");
	}

	//Проверяем что у СЧ нет ссылки на партию
	if (new_key_element.batchid != null && new_key_element.batchid !=""){
		// Получаем текущего участника
		var user = getcurrentuser();
		if(isNullObject(user)){
			return badResp("Невозможно получить текущего пользователя");
		}

		var member = getmemberbyuserwithrecid(user.recid);
		if(isNullObject(member)){
			return badResp("Получатель не найден в системе");
		}
		//получаем запись партии
		var batch = db.findbyrecid("reestr_batch", new_key_element.batchid);
		if (isNullObject(batch)) {
			return badResp("Запись о партии не найдена в системе");
		}
		if (member.recid == batch.recipient_droplist){
			//если получатель
			if (batch.batch_status != "ef519ef4-ec73-4776-9295-2d007bb32907" && batch.batch_status != "f7b21136-24a8-4ae5-af5b-3b7b3dd0c36b" && new_key_element.change_node != true){
				return badResp("Невозможно выполнить замену")
			}
		} else{
			//если отправитель
			//статус партии отклонена или получена частично флаг false
			if (batch.batch_status != "281496a2-3d01-479e-80cb-96e6e6e76135" && batch.batch_status != "f7b21136-24a8-4ae5-af5b-3b7b3dd0c36b" && new_key_element.change_node != true){
				return badResp("Невозможно выполнить замену")
			}
		}
	}
	
	// Проверяем что у нового элемента такое же наименование как и у старого
	if (old_key_element.key_element_code != new_key_element.key_element_code) {
		return badResp("Тип нового СЧ не соответствует типу заменяемого СЧ.");
	}

	if (old_key_element.key_element_code == keyElementCodes.rough_axis_id) {
		return badResp("Для замены Оси черновой необходимо заменить Ось чистовую.");
	}

	var old_rough_axis = null;
	var new_rough_axis = null;

	// Если идет замена Оси чистовой
	if (old_key_element.key_element_code == keyElementCodes.clear_axis_id) {
		// Если у старого СЧ установлен флаг "Есть номер черновой оси" и есть ссылка на Ось черновую
		if (old_key_element.has_rough_axis_number != null
			&& old_key_element.has_rough_axis_number
			&& isNotEmptyString(old_key_element.rough_axis) != null) {
			// Получаем Ось Черновую, связанную с Осью чистовой 
			old_rough_axis = db.findbyrecid("reestr_key_elements", old_key_element.rough_axis);
			if (isNullObject(old_rough_axis)) {
				return badResp("Ось черновая, указанная в оси чистовой с УИН" + old_key_element.numberke + ", не найдена в системе.");
			}
		}

		// Если у нового СЧ установлен флаг "Есть номер черновой оси" и есть ссылка на Ось черновую
		if (new_key_element.has_rough_axis_number != null
			&& new_key_element.has_rough_axis_number
			&& isNotEmptyString(new_key_element.rough_axis)) {
			// Получаем Ось Черновую, связанную с Осью чистовой 
			new_rough_axis = db.findbyrecid("reestr_key_elements", new_key_element.rough_axis);
			if (isNullObject(new_rough_axis)) {
				return badResp("Ось черновая, указанная в оси чистовой с УИН" + new_key_element.numberke + ", не найдена в системе.");
			}

			var dictionary_count_params = {
				"ke_node_type": node.ke_node_type,
				"scheme": node.documentation_number
			};

			var dictionary_count_records = db.findbyparams("dictionary_count_key_elements_by_node_type", dictionary_count_params);
			if (isEmptyOrNullArray(dictionary_count_records)) {
				return badResp("Для родительского узла/СЕ не найдена запись в справонике \"Кол-во СЧ/СЕ в СЕ/узле\".");
			}

			var dictionary_count_record = dictionary_count_records[0];

			// Обязательное условие: в справочнике "Кол-во СЧ/СЕ в СЕ/узле" количество Оси черновой > 0
			if (dictionary_count_record.rough_axis_count == null || dictionary_count_record.rough_axis_count == 0) {
				return badResp("Нельзя установить Ось чистовую вместе с Осью черновой: превышено разрешенное количество Осей черновых.");
			}

			// Если Ось чистовая выпущена в обращение, а связанная с ней Ось черновая не выпущена в обращение, то возвращаем ошибку 
			if (isEmptyString(new_rough_axis.blockchainhash)) {
				return badResp("Нельзя просканировать Ось чистовую с УИН " + new_key_element.numberke + ", потому что связанная с ней Ось черновая с УИН " + new_rough_axis.numberke + " не выпущена в обращение.");
			}

			if (isEmptyString(new_key_element.blockchainhash)) {
				return badResp("Нельзя просканировать Ось чистовую с УИН " + new_key_element.numberke + " в текущем статусе.");
			}
		}

		// Если статус узла "Выпущен в обращение"
		if (node.status == "823cc6e9-465b-416e-beda-8a642149c235" || node.status == "25d67987-0cd4-404a-85d7-847d142af11f") {
			// Нужно проверить, меняет ли замена Оси чистовой общее кол-во элементов в СЕ
			if ((isNullObject(old_rough_axis) && isNotNullObject(new_rough_axis))
				|| isNotNullObject(old_rough_axis) && isNullObject(new_rough_axis)) {
				return badResp("Нельзя изменить кол-во СЧ Ось черновая в СЕ после выпуска в обращение.");
			}
		}
	}

	var parent_node = node;
	var changed_node_assembly_history_records = [];
	var deleted_node_assembly_history_records = [];
	var added_node_assembly_history_records = [];
	var changed_child_nodes = [];
	//массив СЕ/узлов, в которые иерархически включен СЧ
	var parents_hierarchy = [];
	//массив информации о родительских СЕ и позициях для СЧ в них
	var group_ke_position = [];

	for(var i = 0; i < reestr_key_elements.length; i++) {
		parent_node = node;
		var prev_node = null;
		// Необходимо определить в исторические записи сборки, которые нужно будет обновить
		while(isNotNullObject(parent_node)) {
			var node_assembly_history_record_params = {
				// Родительский узел
				parent_node: parent_node.recid,
				// Дочерний СЧ
				child_key_element: reestr_key_elements[i].recid
			};
			// Получаем запись из таблицы "История сборки узлов" по номеру СЧ и родительскому узлу
			var node_assembly_history_records = db.findbyparams("nodes_assembly_history", node_assembly_history_record_params);
			if (isEmptyOrNullArray(node_assembly_history_records)) {
				return badResp("Не удалось найти запись в таблице \"История сборки узлов\" для составной части " + reestr_key_elements[i].numberke + " в СЕ " + parent_node.unique_number + ".");
			}

			var node_assembly_history_record = node_assembly_history_records[0];

			if(reestr_key_elements[i].recid == old_key_element.recid){
				// Получаем запись об СЕ/узле
				var parent_ke_node = db.findbyrecid("reestr_ke_nodes", node_assembly_history_record.parent_node);
				if(isNullObject(parent_ke_node)){
					return badResp("Не удалось найти запись в таблице \"Сборочные единицы\"");
				}
				//Пропускаем узлы, т.к. они на данный момент уже разгруппированы на уровне блокчейна и нам не важны
				if(parent_ke_node.assembly_element_type == commonAssemblyElementTypes.assembly_unit_id || isNullObject(prev_node)){
					parents_hierarchy.push(parent_ke_node);
				}
				node_assembly_history_record.child_key_element = new_key_element.recid;
				changed_node_assembly_history_records.push(node_assembly_history_record);
			}

			if (isNotEmptyString(node_assembly_history_record.child_node)) {
				prev_node = {
					"node": parent_node, 
					"key_element": reestr_key_elements[i],
					"position": node_assembly_history_record.parent_position_on_node
				};
				parent_node = db.findbyrecid("reestr_ke_nodes", node_assembly_history_record.child_node);
				
				if(reestr_key_elements[i].recid == old_key_element.recid){
					// Если у дочернего узла уникальный номер соответствует старому номеру, то заменяем его на новый
					if (parent_node.unique_number == old_key_element.numberke) {
						changed_child_nodes.push(parent_node);
					}
				}
			}
			else {
				//если СЕ или узел верхнего уровня - сохраняем
				if(parent_node.assembly_element_type == commonAssemblyElementTypes.assembly_unit_id || isNullObject(prev_node)){
					group_ke_position.push({
						"node": parent_node, 
						"key_element": reestr_key_elements[i],
						"position": node_assembly_history_record.parent_position_on_node
					});
				} else {
					//если дочерний узел - сохраняем предыдущий СЕ
					group_ke_position.push(prev_node);
				}
				parent_node = null;
			}
		}
	}

	var blockchain_groups = [];
	//формируем массивы элементов для старых групп
	for (var i = 0; i < parents_hierarchy.length; i++) {
		
		var child_kes = group_ke_position.filter(function (ke) {
			return ke.node.recid === parents_hierarchy[i].recid;
		});
		
		
		blockchain_groups.push({
			"node": parents_hierarchy[i],
			"child_kes": child_kes.map(function(c) { return { key_element: c.key_element, position: c.position }; }),
		});
	}
	
	// Если идет замена Оси чистовой
	if (old_key_element.key_element_code == keyElementCodes.clear_axis_id) {

		// Если Ось черновая будет заменена
		if (isNotNullObject(old_rough_axis) && isNotNullObject(new_rough_axis)) {
			var parent_node = node;

			while (isNotNullObject(parent_node)) {
				var node_assembly_history_record_params = {
					// Родительский узел
					parent_node: parent_node.recid,
					// Дочерний СЧ
					child_key_element: old_rough_axis.recid
				};
		
				// Получаем запись из таблицы "История сборки узлов" по номеру старого СЧ и родительскому узлу
				var node_assembly_history_records = db.findbyparams("nodes_assembly_history", node_assembly_history_record_params);
				if (isEmptyOrNullArray(node_assembly_history_records)) {
					return badResp("Не удалось найти запись в таблице \"История сборки узлов\" для составной части " + old_rough_axis.numberke + " в СЕ " + parent_node.unique_number + ".");
				}
		
				var node_assembly_history_record = node_assembly_history_records[0];
				node_assembly_history_record.child_key_element = new_rough_axis.recid;
				changed_node_assembly_history_records.push(node_assembly_history_record);
		
				if (isNotEmptyString(node_assembly_history_record.child_node)) {
					parent_node = db.findbyrecid("reestr_ke_nodes", node_assembly_history_record.child_node);
		
					// Если у дочернего узла уникальный номер соответствует старому номеру, то заменяем его на новый
					if (parent_node.unique_number == old_rough_axis.numberke) {
						changed_child_nodes.push(parent_node);
					}
				}
				else {
					parent_node = null;
				}
			}
		}

		// Если Ось черновая будет исключена из СЕ
		if (isNotNullObject(old_rough_axis) && isNullObject(new_rough_axis)) {
			var parent_node = node;

			while (isNotNullObject(parent_node)) {
				// Ситуация, когда Ось чистовая с Осью черновой заменяется на Ось чистовую
				// Нужно определить записи для Оси черновой, которые нужно удалить 
				if (isNotNullObject(old_rough_axis) && isNullObject(new_rough_axis)) {
					var node_assembly_history_record_params = {
						// Родительский узел
						parent_node: parent_node.recid,
						// Дочерний СЧ
						child_key_element: old_rough_axis.recid
					};
	
					// Получаем запись из таблицы "История сборки узлов" по номеру старого СЧ и родительскому узлу
					var node_assembly_history_records = db.findbyparams("nodes_assembly_history", node_assembly_history_record_params);
					if (isEmptyOrNullArray(node_assembly_history_records)) {
						return badResp("Не удалось найти запись в таблице \"История сборки узлов\" для составной части " + old_rough_axis.numberke + " в СЕ " + parent_node.unique_number + ".");
					}
	
					var node_assembly_history_record = node_assembly_history_records[0];
					deleted_node_assembly_history_records.push(node_assembly_history_record);
	
					if (isNotEmptyString(node_assembly_history_record.child_node)) {
						parent_node = db.findbyrecid("reestr_ke_nodes", node_assembly_history_record.child_node);
					}
					else {
						parent_node = null;
					}
				}
			}
		}

		// Если Ось черновая будет добавлена в СЕ
		if (isNullObject(old_rough_axis) && isNotNullObject(new_rough_axis)) {
			var parent_node = node;

			while (isNotNullObject(parent_node)) {
				var node_assembly_history_record_params = {
					// Родительский узел
					parent_node: parent_node.recid,
					// Дочерний СЧ
					child_key_element: old_key_element.recid
				};
		
				// Получаем запись из таблицы "История сборки узлов" по номеру старого СЧ и родительскому узлу
				var node_assembly_history_records = db.findbyparams("nodes_assembly_history", node_assembly_history_record_params);
				if (isEmptyOrNullArray(node_assembly_history_records)) {
					return badResp("Не удалось найти запись в таблице \"История сборки узлов\" для составной части " + old_key_element.numberke + " в СЕ " + parent_node.unique_number + ".");
				}
		
				var node_assembly_history_record = node_assembly_history_records[0];

				var history_record_res = generateNodeAssemblyHistoryRecords(parent_node, [new_rough_axis]);
				if (!history_record_res.success) {
					return history_record_res;
				}
				var history_record = history_record_res.data[0];
				history_record.child_node = node_assembly_history_record.child_node;
				added_node_assembly_history_records.push(history_record);
		
				if (isNotEmptyString(node_assembly_history_record.child_node)) {
					parent_node = db.findbyrecid("reestr_ke_nodes", node_assembly_history_record.child_node);
				}
				else {
					parent_node = null;
				}
			}
		}
	}

	// // Проводим проверки под новый список СЧ для узла
	// var res = checkreestrkenodetypelimitations(new_key_elements_array, node.reestr_ke_node_type, node.recid);
	// // Если для нового списка СЧ проверки не проходят, то заканчиваем выполнение метода и возвращаем ошибку
	// if (!res.success) { return res; }
	
	var member = getmemberbyuser();
	var nodeip = getnodeipbymember(member.recid);
	var manufacturer = db.findbyrecid("dictionary_branding_codes", member.branding_code);


	//разгруппировка цепочки СЕ
	for(var i = 0; i < blockchain_groups.length; i++){
		var parent_ke_node = blockchain_groups[i].node;

		var blockchainResponse = {};

		// Если статус "Выпущен в обращение" или "Перенесен в родительский узел", отправляем данные в блокчейн
		if (parent_ke_node.status == "823cc6e9-465b-416e-beda-8a642149c235" || parent_ke_node.status == "01d8f0ce-28db-4d3d-a956-38bb26260437" || parent_ke_node.status == "25d67987-0cd4-404a-85d7-847d142af11f") {
			var ungroupobjectsbch = {
				"nodeip": nodeip,
				"hash": parent_ke_node.blockchainhash,
				"node": parent_ke_node.blockchainnode,
				"recn": parent_ke_node.blockchainrecn,
				"tn": parent_ke_node.blockchaintn
			};

			blockchainResponse = ungroupAssemblyUnitBlockchain(ungroupobjectsbch);
			parent_ke_node.blockchain_request_body = JSON.stringify(blockchainResponse.request);
		}

		// Если статус "Выпущен в обращение" или "Перенесен в родительский узел" и блокчейн ответил согласием
		// или статус "Готов к регистрации"
		if ((parent_ke_node.status == "823cc6e9-465b-416e-beda-8a642149c235" || parent_ke_node.status == "01d8f0ce-28db-4d3d-a956-38bb26260437" || parent_ke_node.status == "25d67987-0cd4-404a-85d7-847d142af11f" && isNotNullObject(blockchainResponse.result))
			|| parent_ke_node.status == "a4b6de4f-828a-46a3-b272-73a1c345ae44" ) {
			let update_res = null;

			for (var j = 0; j < reestr_key_elements.length; j++) {
				var reestr_key_element = Object.assign({}, reestr_key_elements[j]);

				reestr_key_element.ke_node = null;
				reestr_key_element.position_on_node = null;
				update_res = db.update("reestr_key_elements", reestr_key_element);

				if (!update_res) {
					return badResp("Ошибка при обновлении СЧ с номером " + reestr_key_element.ke_number + ".");
				}
			}
		}
		else {
			return badResp(blockchainResponse);
		}
	}

	var new_key_elements_array = [];//JSON.parse(JSON.stringify(reestr_key_elements));
    reestr_key_elements.forEach(function(key_element, index) {
        if (key_element.recid === old_key_element.recid) {
            if (isNotEmptyString(old_key_element.position_on_node)) {
                new_key_element.position_on_node = old_key_element.position_on_node;
                new_key_element.position_on_node___value = old_key_element.position_on_node___value;
            }
            new_key_element.ke_node = node.recid;
            new_key_elements_array.push(new_key_element);
		} else if (isNotNullObject(old_rough_axis) && isNotNullObject(new_rough_axis) && key_element.recid === old_rough_axis.recid) {
            // Если СЕ содержит Ось черновую и текущий СЧ это Ось черновая, то в массив кладем новую Ось черновую, если требуется
			new_rough_axis.ke_node = node.recid;
			key_element = new_rough_axis;
			new_key_elements_array.push(new_rough_axis);
        } else {
			new_key_elements_array.push(key_element);
		}
        //Если СЕ содержит ось черновую и текущий СЧ - ось черновая, а новой черновой оси нет - удаляем старую
        if (isNotNullObject(old_rough_axis) && isNullObject(new_rough_axis)) {
            if (key_element.recid === old_rough_axis.recid) {
                new_key_elements_array.splice(index, 1);
            }
        }

        //Если старая Чистовая ось не была связана с Черновой осью, а новая - свзяна, добавляем черновую ось
        if (isNullObject(old_rough_axis) && isNotNullObject(new_rough_axis)) {
            if (key_element.key_element_code === keyElementCodes.clear_axis_id) {
                new_rough_axis.ke_node = node.recid;
                new_key_elements_array.push(new_rough_axis);
            }
        }
	});
	
	//меняем старый СЧ на новый и добавляем черновую ось, если требуется
	blockchain_groups.forEach(function(group){
		group.child_kes.forEach(function(item, index){
			if(item.key_element.recid == old_key_element.recid)
			{
				if (isNotEmptyString(item.key_element.position_on_node)){
					new_key_element.position_on_node = item.key_element.position_on_node;
					new_key_element.position_on_node___value = item.key_element.position_on_node___value
				}
				new_key_element.ke_node = item.key_element.ke_node;
				item.key_element = new_key_element;
			} else {
				// Если СЕ содержит Ось черновую и текущий СЧ это Ось черновая, то в массив кладем новую Ось черновую, если требуется
				if (isNotNullObject(old_rough_axis) && isNotNullObject(new_rough_axis)){
					if(item.key_element.recid == old_rough_axis.recid)
					{
						new_rough_axis.ke_node = node.recid;
						item.key_element = new_rough_axis;
					}
				}
			}
			//Если СЕ содержит ось черновую и текущий СЧ - ось черновая, а новой черновой оси нет - удаляем старую
			if (isNotNullObject(old_rough_axis) && isNullObject(new_rough_axis)){
				if(item.key_element.recid == old_rough_axis.recid)
				{
					group.child_kes.splice(index, 1); 
				}
			} 

			//Если старая Чистовая ось не была связана с Черновой осью, а новая - свзяна, добавляем черновую ось
			if (isNullObject(old_rough_axis) && isNotNullObject(new_rough_axis)) {
				if(item.key_element.key_element_code == keyElementCodes.clear_axis_id)
				{
					new_rough_axis.ke_node = node.recid;
					group.child_kes.push({
						"node": item.node,
						"key_element": new_rough_axis,
						"position": null
					});
				}
			}
		});
	});

	//формируем массивы элементов для новых групп
	blockchain_groups.forEach(function(group){
		var childs_blockchain = [];
		//выбираем только СЕ
		var child_nodes = db.findbyparams("reestr_ke_nodes", {
			"parent_ke_node": group.node.recid, "assembly_element_type": "62b3559e-10da-4189-8b25-d558ba451ac8" });

		var child_kes_blockchain = JSON.parse(JSON.stringify(group.child_kes));
		child_kes_blockchain.forEach(function(child){
			if(isNotEmptyString(child.position)){
				var position_on_node = db.findbyrecid("dictionary_positions_on_node", child.position);
				if(isNullObject(position_on_node)){
					return badResp("При замене СЧ не удалось определить позиции для дочернего узла");
				}
				child.key_element.position_on_node = position_on_node.recid;
				child.key_element.position_on_node___value = position_on_node.recname;
			}
		});

		if (isNotNullObject(child_nodes)) {
			childs_blockchain = [].concat(child_nodes);
		}
		if (isNotNullObject(child_kes_blockchain)) {
			childs_blockchain = [].concat(childs_blockchain, child_kes_blockchain.map(function(c) { return c.key_element; }));
		}

		group.child_kes = child_kes.map(function (c) { return c.key_element; });
		group.childs_blockchain = childs_blockchain;
	});

	for(var i = blockchain_groups.length-1; i >= 0 ; i--){
		var parent_ke_node = blockchain_groups[i].node;
		
		var childs_for_blockchain = blockchain_groups[i].childs_blockchain;
		
		var dictionary_ke_node_type = db.findbyrecid("dictionary_ke_node_types", parent_ke_node.ke_node_type);

		var blockchainResponse = {};

		// Если статус Выпущен в обращение/"Перенесен в родительский узел", отправляем данные в блокчейн
		if (parent_ke_node.status == "823cc6e9-465b-416e-beda-8a642149c235" || parent_ke_node.status == "01d8f0ce-28db-4d3d-a956-38bb26260437" || parent_ke_node.status == "25d67987-0cd4-404a-85d7-847d142af11f") {

			var groupobjectsbch = {
				"nodeip": nodeip,

				"hash": parent_ke_node.blockchainhash,
				"node": parent_ke_node.blockchainnode,
				"recn": parent_ke_node.blockchainrecn,
				"tn": parent_ke_node.blockchaintn,

				"reestr_key_elements": childs_for_blockchain,
				"type": dictionary_ke_node_type.reccode,
				"manufacturer": manufacturer.full_name,
				"number": null,
				"date": date.getUTCFullYear() +
					'-' + (date.getUTCMonth() + 1).toString().padStart(2, 0) +
					'-' + (date.getUTCDate()).toString().padStart(2, 0)
			};

			//Проверка статуса СЕ перед запросом на группировку
			var checkStatusResp = checkAssemblyUnitLabelStatus(parent_ke_node, nodeip);
			if (!checkStatusResp.success) {
				if (checkStatusResp.message == 'group not maked' || checkStatusResp.message == 'event is not applied yet') {
					var currentDate = new Date();
					var datesDiff = null;
					var waitTimeout = 10;
					//Если разница дат меньше десяти секунд
					while (datesDiff < waitTimeout || datesDiff == null) {
						var checkStatusDate = new Date();
						if (((checkStatusDate.getTime() - currentDate.getTime()) / 1000) >= waitTimeout) {
							return badResp("Не прошло согласование с узлом-арбитром, пожалуйста, повторите операцию еще раз")
						}

						checkStatusResp = checkAssemblyUnitLabelStatus(parent_ke_node, nodeip);
						/**
						 * Если блокчейн ответил что группа не создана, изменяем разность дат и продолжаем цикл
						 * Если блокчейн на запрос статуса вернул другую ошибку, выходим из цикла, отображая эту ошибку
						 */
						if (!checkStatusResp.success) {
							if (checkStatusResp.message == 'group not labeled' || checkStatusResp.message == 'event is not applied yet') {
								datesDiff = (checkStatusDate.getTime() - currentDate.getTime()) / 1000;
							} else {
								return badResp("Ошибка блокчейна: " + checkStatusResp.data);
							}
						} else {
							datesDiff = 10;
						}
					}
				} else {
					return badResp(checkStatusResp.data);
				}
			}
			blockchainResponse = groupAssemblyUnitBlockchain(groupobjectsbch);
			parent_ke_node.blockchain_request_body = JSON.stringify(blockchainResponse.request);
		}

		// Если статус "Выпущен в обращение"/"Перенесен в родительский узел" и блокчейн ответил согласием
		// или статус "Готов к регистрации"
		if ((parent_ke_node.status == "823cc6e9-465b-416e-beda-8a642149c235" || parent_ke_node.status == "01d8f0ce-28db-4d3d-a956-38bb26260437" || parent_ke_node.status == "25d67987-0cd4-404a-85d7-847d142af11f")
		&& isNotNullObject(blockchainResponse.result)
			|| parent_ke_node.status == "a4b6de4f-828a-46a3-b272-73a1c345ae44") {
			// Если уникальный номер узла равен номеру СЧ, который мы заменяем,
			// то выбираем новый уникальный номер
			if (parent_ke_node.unique_number == old_key_element.numberke) {
				parent_ke_node.unique_number = blockchain_groups[i].child_kes[0].key_element.numberke;
			}
			if (isNotNullObject(old_rough_axis) && node.unique_number == old_rough_axis.numberke) {
				parent_ke_node.unique_number = blockchain_groups[i].child_kes[0].key_element.numberke;
			}

			let update_res = db.update("reestr_ke_nodes", parent_ke_node);

			if (!update_res) {
				return {
					success: false,
					message: "Ошибка при сохранении записи в Реестре узлов"
				};
			}
			//прописываем группировку в истории СЧ только о родительском узле
			if(i == 0){
				// Прописываем узел в СЧ
				for (let j = 0; j < new_key_elements_array.length; j++) {
					if( new_key_elements_array[j].recid === new_key_element.recid || (isNotNullObject(new_rough_axis) && new_key_elements_array[j].recid === new_rough_axis.recid)){
						
						// Действие - Группировка
						var log_item = set_ke_log(new_key_elements_array[j], "e935eefb-3f88-4576-b43a-275dbf4dc787", parent_ke_node.recid, parent_ke_node.ke_node_type);

						//db.insert("log", log_item);
						// получение адреса арма росжелдора 29.09.2020 amaslov 44458
						MakeLogRecord("log", log_item, rzd_url.rzd_name_url);
					}
					update_res = db.update("reestr_key_elements", new_key_elements_array[j]);

					if (!update_res) {
						return badResp("Ошибка при обновлении СЧ с номером " + new_key_elements_array[j].numberke + ".");
					}
				}
			}

			// или статус НЕ "Готов к регистрации"
			if (parent_ke_node.status != "a4b6de4f-828a-46a3-b272-73a1c345ae44"){
				//Вызываем метод из плагина
				var parameters = {
					"recid": parent_ke_node.recid
				}
				var res = plugins.callAsMethod(String().concat("/plugins/nbdlogicplugin/regeneratepassport/",parent_ke_node.recid), "post", parameters, null);
				if(!res.success){
					return res;
				}
			}

			//Прописываем историю в таблицу node_log
			var node_log_actions = db.findbyparams("dictionary_node_actions", { "code": 8 });
			//Замена СЧ
			var node_log_record = set_node_log(parent_ke_node, node_log_actions[0].recid, "");
			
			//Прописываем содержимое узла
			for (let j = 0; j < new_key_elements_array.length; j++) {
				var key_element_type_record = db.findbyrecid("dictionary_key_elements_codes", new_key_elements_array[j].key_element_code)
				if (isNotNullObject(key_element_type_record)) {
					if (i < new_key_elements_array.length - 1) {
						node_log_record.node_content += new_key_elements_array[j].numberke + '(' + key_element_type_record.recname + ')' + ", ";
					} else {
						node_log_record.node_content += new_key_elements_array[j].numberke + '(' + key_element_type_record.recname + ')'
					}
				} else {
					if (i < new_key_elements_array.length - 1) {
						node_log_record.node_content += new_key_elements_array[j].numberke + ", ";
					} else {
						node_log_record.node_content += new_key_elements_array[j].numberke
					}
				}
			}
			//db.insert("node_log", node_log_record);
			// Отправляем запись истории в АРМ 29.09.2020 amaslov 44458
			MakeLogRecord("node_log", node_log_record, rzd_url.rzd_name_url);
			//прописываем замену в истории СЧ только о родительском узле
			if(i == 0){
				var log_item = set_ke_log(old_key_element, "877d832e-4e2c-47ca-b79f-16977c8c31b9", parent_ke_node.recid, parent_ke_node.ke_node_type);
				//db.insert("log", log_item);
				// Отправляем запись истории в АРМ 29.09.2020 amaslov 44458
				MakeLogRecord("log", log_item, rzd_url.rzd_name_url);
			}
		}
		else {
			return badResp(blockchainResponse);
		}
	}
	
		// // Если идет замена Оси чистовой
		// if (old_key_element.key_element_code == keyElementCodes.clear_axis_id) {
		// 	// Замена Оси черновой
		// 	if (isNotNullObject(old_rough_axis) && isNotNullObject(new_rough_axis)) {
		// 		log_item = {
		// 			"reged_key_element": old_rough_axis.recid,
		// 			// Действие - Замена СЧ в узле
		// 			"ke_action": "877d832e-4e2c-47ca-b79f-16977c8c31b9",
		// 			"operation_date": date.toISOString(),
		// 			"node_unique_number": node.unique_number,
		// 			"node_type": node.ke_node_type
		// 		};
		// 		db.insert("log", log_item);
		// 	}
		// 	// Исключение Оси черновой из СЕ
		// 	else if (isNotNullObject(old_rough_axis) && isNullObject(new_rough_axis)) {
		// 		log_item = {
		// 			"reged_key_element": old_rough_axis.recid,
		// 			// Действие - Разгруппировка
		// 			"ke_action": "29bba961-5aa4-4690-a459-49bcdbaf502f",
		// 			"operation_date": date.toISOString(),
		// 			"node_unique_number": node.unique_number,
		// 			"node_type": node.ke_node_type
		// 		};
		// 		db.insert("log", log_item);
		// 	}
		// 	// Добавление Оси черновой в СЕ
		// 	else if (isNullObject(old_rough_axis) && isNotNullObject(new_rough_axis)) {
		// 		log_item = {
		// 			"reged_key_element": new_rough_axis.recid,
		// 			// Действие - Группировка
		// 			"ke_action": "e935eefb-3f88-4576-b43a-275dbf4dc787",
		// 			"operation_date": date.toISOString(),
		// 			"node_unique_number": node.unique_number,
		// 			"node_type": node.ke_node_type
		// 		};
		// 		db.insert("log", log_item);
		// 	}
		// }

		if (isNotEmptyOrNullArray(changed_node_assembly_history_records)) {
			for (var i = 0; i < changed_node_assembly_history_records.length; i++) {
				//changed_node_assembly_history_records[i].child_key_element = new_key_element.recid;
				var sendRes = UpdateRecordToOuterRdev("nodes_assembly_history", changed_node_assembly_history_records[i], rzd_url.rzd_name_url);
				if(!sendRes.success){
					return sendRes;
				}
			}
		}

		if (isNotEmptyOrNullArray(deleted_node_assembly_history_records)) {
			for (var i = 0; i < deleted_node_assembly_history_records.length; i++) {
				//удаляем локально (т.к. иначе эти записи останутся)
				var delLocal = delete_entity_static({
					table: "nodes_assembly_history",
					recid: deleted_node_assembly_history_records[i].recid
				});
				//удаляем на АРМ росжелдор
				var sendRes = DeleteRecordToOuterRdev("nodes_assembly_history", deleted_node_assembly_history_records[i].recId, rzd_url.rzd_name_url);
				if(!sendRes.success){
					return sendRes;
				}
			}
		}

		if (isNotEmptyOrNullArray(added_node_assembly_history_records)) {
			for (var i = 0; i < added_node_assembly_history_records.length; i++) {
				var sendRes = InsertRecordToOuterRdev("nodes_assembly_history", added_node_assembly_history_records[i], rzd_url.rzd_name_url);
				if(!sendRes.success){
					return sendRes;
				}
			}
		}

		if (isNotEmptyOrNullArray(changed_child_nodes)) {
			for (var i = 0; i < changed_child_nodes.length; i++) {
				changed_child_nodes[i].unique_number = params.new_key_element;
				db.update("reestr_ke_nodes", changed_child_nodes[i]);
			}
		}

	return successResp("СЕ успешно сохранен.");
}

if (!Object.assign) {
	Object.defineProperty(Object, 'assign', {
	  enumerable: false,
	  configurable: true,
	  writable: true,
	  value: function(target, firstSource) {
		'use strict';
		if (target === undefined || target === null) {
		  throw new TypeError('Cannot convert first argument to object');
		}
  
		var to = Object(target);
		for (var i = 1; i < arguments.length; i++) {
		  var nextSource = arguments[i];
		  if (nextSource === undefined || nextSource === null) {
			continue;
		  }
  
		  var keysArray = typeof nextSource !== "string" && Object.keys(Object(nextSource));
		  for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
			var nextKey = keysArray[nextIndex];
			var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
			if (desc !== undefined && desc.enumerable) {
			  to[nextKey] = nextSource[nextKey];
			}
		  }
		}
		return to;
	  }
	});
  }

// https://tc39.github.io/ecma262/#sec-array.prototype.find
if (!Array.prototype.find) {
	Object.defineProperty(Array.prototype, 'find', {
		value: function (predicate) {
			// 1. Let O be ? ToObject(this value).
			if (this == null) {
				throw new TypeError('"this" is null or not defined');
			}

			var o = Object(this);

			// 2. Let len be ? ToLength(? Get(O, "length")).
			var len = o.length >>> 0;

			// 3. If IsCallable(predicate) is false, throw a TypeError exception.
			if (typeof predicate !== 'function') {
				throw new TypeError('predicate must be a function');
			}

			// 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
			var thisArg = arguments[1];

			// 5. Let k be 0.
			var k = 0;

			// 6. Repeat, while k < len
			while (k < len) {
				// a. Let Pk be ! ToString(k).
				// b. Let kValue be ? Get(O, Pk).
				// c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
				// d. If testResult is true, return kValue.
				var kValue = o[k];
				if (predicate.call(thisArg, kValue, k, o)) {
					return kValue;
				}
				// e. Increase k by 1.
				k++;
			}

			// 7. Return undefined.
			return undefined;
		},
		configurable: true,
		writable: true
	});
}
/**
 * Сгруппировать балку надрессорную (из немаркируемых СЧ (Оператор РЖД))
 * @param {*} params 
 */
function rzd_op_groupnonmarkednode(params){
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
	//Валидация поля "Владелец"
	if(isEmptyString(params.member)){
		return badResp("Поле \"Владелец\" не может быть пустым");
	}
	var member = db.findbyrecid("reestr_members", params.member);
	if(isNullObject(member)){
		return badResp("Владелец не найден в системе")
	}
	params.member = member.recid;
	return groupnonmarkednode(params);
}

/**
 * Сгруппировать балку надрессорную (из немаркируемых СЧ)
 * @param {*} params 
 */
function groupnonmarkednode(params){
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
	var headers = {
		"Content-Type": "application/json"
	};
	var headers = addAuthHeader(headers);
	var url = String().concat(host, "/plugins/nbdlogicplugin/groupnonmarkednode/", params.recid.toString())
	var res = fetch(url, {
		headers: headers,
		"body": JSON.stringify(params),
		"Method": "post"
	});
	if(isNotEmptyString(res.data)){
		return JSON.parse(res.data)
	}else{
		return res;
	}
}

function checkVagonCompositionByAssemblyElement(assemblyElement) {
	var vagonCompositionRecord = null;

	var vagonCompositionRecordsParams = {
		"assembly_element_type": assemblyElement.ke_node_type
	};
	var vagonCompositionRecords = db.findbyparams("dictionary_vagon_composition", vagonCompositionRecordsParams);

	// Если найдены записи в справочнике "Состав вагона"
	if (vagonCompositionRecords != null && vagonCompositionRecords.length > 0) {
		for (var j = 0; j < vagonCompositionRecords.length; j++) {
			// Если у одной из записей из справочника "Состав вагона" поле "Наименование узла/СЕ",
			// соответствует типу СЕ, то проверка считается пройденной
			if (assemblyElement.ke_node_type == vagonCompositionRecords[j].assembly_element_type) {
				vagonCompositionRecord = vagonCompositionRecords[j];
				break;
			}
		}

		if (vagonCompositionRecord == null) {
			return {
				success: false,
				message: "Сборочный элемент "
					+ assemblyElement.unique_number
					+ " (" + assemblyElement.ke_node_type_calculated + ")"
					+ " не может быть включен в состав вагона."
			};
		}
	}
	else {
		return {
			success: false,
			message: "Для СЕ " + assemblyUnit.unique_number + " не найдены записи в справочнике \"Состав вагона\"."
		};
	}

	return {
		success: true,
		message: null
	};
}

function getAllPositionsOnVagonByAssemblyElement(vagonModelAxes, assemblyElement) {
	var allPositionsOnVagon = [];
	var allPositionsOnVagonIds = [];
	var nodeAxes = 0;

	// Если тележка
	if (assemblyElement.ke_node_type == "cbb9d8cb-89ef-4b99-be77-a7d6e57e388e") {
		var dictionaryRecordsParams = {
			"scheme": assemblyElement.documentation_number,
			"ke_node_type": assemblyElement.ke_node_type
		};
		var dictionaryRecords = db.findbyparams("dictionary_count_key_elements_by_node_type", dictionaryRecordsParams);
		if (isEmptyOrNullArray(dictionaryRecords)) {
			return null;
		}

		var dictionaryRecord = dictionaryRecords[0];

		nodeAxes = dictionaryRecord.slider_body_count > 2 && dictionaryRecord.slider_cap_count > 2
			? 6
			: 4;
	}

	//a38b7c61-0bf9-485d-9282-eb5214548993 и b8676775-861b-44c6-ab56-25d109636620 это торцевые позиции
	//cf480ce8-e694-4945-a4ef-3d9a8f050ba9 средняя позиция

	// Если nodeAxes == 0, смотреть только на осность вагона
	var condition = "";
	if (nodeAxes == 0) {
		if (vagonModelAxes == "4") {
			condition = "and (for_four_axes_vagon eq true)";
		}
		else if (vagonModelAxes == "6") {
			condition = "and (for_six_axes_vagon eq true)";
		}
	} else {
		if (vagonModelAxes == "4" && nodeAxes == 4) {
			condition = "and (for_four_axes_vagon eq true)";
		} else if (vagonModelAxes == "6" && (nodeAxes == 6)) {
			condition = "and (for_six_axes_vagon eq true) and (position_node_on_vagon eq cf480ce8-e694-4945-a4ef-3d9a8f050ba9)";
		} else if (vagonModelAxes == "6" && nodeAxes == 4) {
			condition = "and ((for_four_axes_vagon eq true) or (for_six_axes_vagon eq true)) and ((position_node_on_vagon eq a38b7c61-0bf9-485d-9282-eb5214548993) or (position_node_on_vagon eq b8676775-861b-44c6-ab56-25d109636620))";
		}
		else {
			return [];
		}
	}

	var keyElementsParams = {
		"ke_node": assemblyElement.recid
	};
	var keyElements = db.findbyparams("reestr_key_elements", keyElementsParams);

	if (isEmptyOrNullArray(keyElements)) {
		var positionsOnVagonRespUrl = String().concat(
			host,
			"/odata/dictionary_positions_on_vagon?$filter=(child_node_type eq ",
			assemblyElement.ke_node_type,
			") ",
			condition);

		var positionsOnVagonResp = sendRequest("GET", null, positionsOnVagonRespUrl, null);
		var positionsOnVagon = positionsOnVagonResp.value;
		if (isEmptyOrNullArray(positionsOnVagon))
			return null;

		for (var i = 0; i < positionsOnVagon.length; i++) {
			var positionOnVagon = positionsOnVagon[i];

			if (positionOnVagon.position_node_on_vagon != null
				&& allPositionsOnVagonIds.indexOf(positionOnVagon.position_node_on_vagon) == -1) {
				
				var assemblyElementPosition = db.findbyrecid("dictionary_node_positions", positionOnVagon.position_node_on_vagon);

				if (!isNullObject(assemblyElementPosition)) {
					allPositionsOnVagon.push(assemblyElementPosition);
					allPositionsOnVagonIds.push(assemblyElementPosition.recid);
				}
			}
		}
	}
	else {
		for (var i = 0; i < keyElements.length; i++) {
			var keyElement = keyElements[i];

			var positionsOnVagonRespUrl = String().concat(
				host,
				"/odata/dictionary_positions_on_vagon?$filter=(key_element_code eq ",
				keyElement.key_element_code, 
				") ",
				"and (position_on_node eq ",
				keyElement.position_on_node,
				") ",
				condition);

			var positionsOnVagonResp = sendRequest("GET", null, positionsOnVagonRespUrl, null);
			var positionsOnVagon = positionsOnVagonResp.value;
			if (isEmptyOrNullArray(positionsOnVagon))
				continue;

			var positionOnVagon = positionsOnVagon[0];

			if (positionOnVagon != null
				&& positionOnVagon.position_node_on_vagon != null
				&& allPositionsOnVagonIds.indexOf(positionOnVagon.position_node_on_vagon) == -1) {

				var assemblyElementPosition = db.findbyrecid("dictionary_node_positions", positionOnVagon.position_node_on_vagon);

				if (!isNullObject(assemblyElementPosition)) {
					allPositionsOnVagon.push(assemblyElementPosition);
					allPositionsOnVagonIds.push(assemblyElementPosition.recid);
				}
			}
		}
	}

	return allPositionsOnVagon;
}

function getFreePositionsOnVagonByAssemblyUnit(
	vagonId,
	assemblyUnit,
	assemblyUnitPositions) {

	var freePositions = [];
	var usedPositions = [];

	var assemblyElementsOnVagonParams = {
		"vehicle": vagonId
	};
	var assemblyElementsOnVagon = db.findbyparams("reestr_ke_nodes", assemblyElementsOnVagonParams);

	if (assemblyElementsOnVagon != null) {
		// Добавляем в usedPositions идентификаторы позиций, уже установленных СЕ
		for (var i = 0; i < assemblyElementsOnVagon.length; i++) {
			var assemblyElementOnVagon = assemblyElementsOnVagon[i];

			if (assemblyElementOnVagon.ke_node_type == assemblyUnit.ke_node_type
				&& assemblyElementOnVagon.assembly_element_position_on_vagon != null) {
				usedPositions.push(assemblyElementOnVagon.assembly_element_position_on_vagon);
			}
		}
	}

	if (usedPositions.length > 0)
		for (var i = 0; i < assemblyUnitPositions.length; i++) {
			if (usedPositions.indexOf(assemblyUnitPositions[i].recid) == -1) {
				freePositions.push(assemblyUnitPositions[i]);
			}
		}
	else {
		freePositions = assemblyUnitPositions;
	}

	return freePositions;
}

function getAllPositionsOnAssemblyElementByKeyElement(keyElement, parentNodePattern) {
	// Родительский сборочный элемент
	var keyElementNode = null;
	// Идентификатор родительского сборочного элемента
	var keyElementNodeId = null;
	// Идентификатор типа родительского сборочного элемента
	var keyElementNodeTypeId = null;
	// Идентификатор позиции СЧ в родительском узле
	var keyElementNodePositionId = null;

	// Если у СЧ есть ссылка на родительский сборочный элемент, то инициализируем необходимые переменные и проводим некоторые проверки
	if (keyElement.ke_node != null && keyElement.ke_node != "") {
		// Получаем родительский сборочный элемент из "Реестра узлов/СЕ"
		keyElementNode = db.findbyrecid("reestr_ke_nodes", keyElement.ke_node);
		if (isNullObject(keyElementNode)) {
			return badResp("Не удалось определить родительский сборочный элемент для СЧ.");
		}

		keyElementNodeId = keyElementNode.recid;
		keyElementNodeTypeId = keyElementNode.ke_node_type;
		keyElementNodePositionId = keyElement.position_on_node;

		// Запрещаем сканировать сборочные элементы по СЧ с одним из перечисленных ниже типом СЧ, по причине того, что данные СЧ не имеют позиции
		// в своем родительском сборочном элементе.
		// Балка надрессорная, Ось чистовая, Ось черновая, Рама боковая, Кольцо в подпятник,
		// Замок, Валик подъемника, Корпус автосцепки, Вкладыш подпятника
		if ((keyElementCodeId == "477d0c01-84d3-441c-9bb9-15f9d609671d"
			|| keyElementCodeId == "e4ef0365-0365-40df-ab4e-a77104c352df"
			|| keyElementCodeId == "b28e1a4f-d340-4ce0-a37a-d84dcfa1b6fb"
			|| keyElementCodeId == "8cdec5a2-69ac-4dd9-8568-f53853b55f86"
			|| keyElementCodeId == "9c60e01e-b4b7-448a-ae1b-7709f55d43a2"
			|| keyElementCodeId == "966f3039-1528-4af5-9e8e-2378dd738243"
			|| keyElementCodeId == "6eab3f2a-03b7-4570-9278-55944ed353d2"
			|| keyElementCodeId == "a70ac9bc-3212-4361-9b83-ab36282f7c97"
			|| keyElementCodeId == "a0e6b16a-5fee-4318-a4dc-115ae65d4b09")
			&& keyElementNodePositionId != null) {
				return badResp("Для установки узла нельзя использовать составную часть данного типа.");
		}
	}

	// Идентификатор типа СЧ
	var keyElementCodeId = keyElement.key_element_code;

	// Идентификатор типа целевого сборочного элемента
	var parentNodeTypeId = parentNodePattern.ke_node_type;

	// Проводим проверку состава сборочного элемента: можно ли просканировать данный СЧ в сборочный элемент
	var checkAssemblyElementCompositionRes = checkAssemblyElementComposition(keyElement, keyElementNode, parentNodeTypeId);
	if (!checkAssemblyElementCompositionRes.success) {
		return badResp(checkAssemblyElementCompositionRes.message);
	}

	var resultPositions = [];

	// Установка СЧ в сборочный элемент
	if (keyElementNodeId == null || keyElementNodeId == "") {
		// Выполняем запрос на получение всех возможных позиций СЧ в сборочном элементе из справочника "Позиции в узле"
		// по параметрам: Наименование СЧ (key_element_code = keyElementCodeId), Наименование типа узла (node_type = parentNodeTypeId) 
		var allPositionsParams = {
			"key_element_code": keyElementCodeId
		};

		if (isNotEmptyString(parentNodeTypeId)) {
			allPositionsParams.node_type = parentNodeTypeId;
		}
		
		var allPositions = db.findbyparams("dictionary_positions_on_node", allPositionsParams);

		// Если тип просканированного СЧ соответствует одному из нижеперечисленных, 
		// то список доступных позиций в сборочном элементе определять не требуется,
		// потому что у этих СЧ нет позиций в родительском сборочном элементе.
		// Балка надрессорная, Ось чистовая, Ось черновая, Рама боковая, Кольцо в подпятник,
		// Замок, Валик подъемника, Корпус автосцепки, Вкладыш подпятника,
		// Корпус скользуна, Колпак скользуна, Пружина скользуна наружная, Пружина скользуна внутренняя
		if ((keyElementCodeId == "477d0c01-84d3-441c-9bb9-15f9d609671d"
			|| keyElementCodeId == "e4ef0365-0365-40df-ab4e-a77104c352df"
			|| keyElementCodeId == "b28e1a4f-d340-4ce0-a37a-d84dcfa1b6fb"
			|| keyElementCodeId == "8cdec5a2-69ac-4dd9-8568-f53853b55f86"
			|| keyElementCodeId == "9c60e01e-b4b7-448a-ae1b-7709f55d43a2"
			|| keyElementCodeId == "966f3039-1528-4af5-9e8e-2378dd738243"
			|| keyElementCodeId == "6eab3f2a-03b7-4570-9278-55944ed353d2"
			|| keyElementCodeId == "a70ac9bc-3212-4361-9b83-ab36282f7c97"
			|| keyElementCodeId == "34c12f72-eb33-4ab1-ba3e-a80166258e5d"
			|| keyElementCodeId == "ff1d8011-75dc-4d30-832f-f47c3d5ac430"
			|| keyElementCodeId == "4aed23f8-9710-4904-a2f5-b89d9bc7c75c"
			|| keyElementCodeId == "975cd310-7675-4436-899f-4c6b84555f6a"
			|| keyElementCodeId == "a0e6b16a-5fee-4318-a4dc-115ae65d4b09")
			&& allPositions.length == 0) {

			return successResp("Указанный СЧ может быть установлен в узел/СЕ без указания позиции.")
		}

		resultPositions = allPositions;
	}
	// Установка сборочного элемента по СЧ в родительский сборочный элемент
	else {
		// Запрещаем сканировать сборочные элементы по СЧ с одним из перечисленных ниже типом СЧ, по причине того, что данные СЧ не имеют позиции
		// в своем родительском сборочном элементе.
		// Балка надрессорная, Ось чистовая, Ось черновая, Рама боковая, Кольцо в подпятник,
		// Замок, Валик подъемника, Корпус автосцепки, Вкладыш подпятника
		if (keyElementCodeId == "477d0c01-84d3-441c-9bb9-15f9d609671d"
			|| keyElementCodeId == "e4ef0365-0365-40df-ab4e-a77104c352df"
			|| keyElementCodeId == "b28e1a4f-d340-4ce0-a37a-d84dcfa1b6fb"
			|| keyElementCodeId == "8cdec5a2-69ac-4dd9-8568-f53853b55f86"
			|| keyElementCodeId == "9c60e01e-b4b7-448a-ae1b-7709f55d43a2"
			|| keyElementCodeId == "966f3039-1528-4af5-9e8e-2378dd738243"
			|| keyElementCodeId == "6eab3f2a-03b7-4570-9278-55944ed353d2"
			|| keyElementCodeId == "a70ac9bc-3212-4361-9b83-ab36282f7c97"
			|| keyElementCodeId == "a0e6b16a-5fee-4318-a4dc-115ae65d4b09") {
			return badResp("Для установки узла нельзя использовать составную часть данного типа.");
		}

		var condition = keyElementNodeTypeId != null && keyElementNodeTypeId != ""
			? " and (parent_node_type eq " + parentNodeTypeId + ")"
			: "";

		var axisCountCondition = "";

		// Необходимо проверить, является ли целевой сборочный элемент тележкой, чтобы с учетом этого получить список достпных позиций
		if (parentNodeTypeId == "cbb9d8cb-89ef-4b99-be77-a7d6e57e388e") {
			// Получаем номенклатуру узла из справочника "Кол-во СЧ/СЕ в СЕ/узле" по параметрам:
			// Номер документа (scheme = parentNodePattern.documentation),
			// Тип узла/СЕ (ke_node_type = parentNodeTypeId)

			var dictionaryCountKeyElementsByNodeTypeRecordsParams = {
				"scheme": parentNodePattern.documentation,
				"ke_node_type": parentNodeTypeId
			};
			var dictionaryCountKeyElementsByNodeTypeRecords = db.findbyparams("dictionary_count_key_elements_by_node_type", dictionaryCountKeyElementsByNodeTypeRecordsParams);
			dictionaryCountKeyElementsByNodeType = dictionaryCountKeyElementsByNodeTypeRecords[0];

			// Если в номенклатуре узла количество корпусов и колпаков скользуна больше двух - это средняя тележка
			// и необходимо запрашивать позиции с флагом "Для шестиосного вагона", иначе необходимо запрашивать позиции с флагом "Для четырехосного вагона"
			if (dictionaryCountKeyElementsByNodeType.slider_body_count > 2 && dictionaryCountKeyElementsByNodeType.slider_cap_count > 2) {
				axisCountCondition = "and (for_six_axis_vagon eq true)"
			} else {
				axisCountCondition = "and (for_four_axis_vagon eq true)"
			}
		}

		// Выполняем запрос на получение возможных позиций СЧ в родительском сборочном элементе из справочника "Позиции в дочернем узле"
		// по параметрам: Наименование СЧ (key_element_code = keyElementCodeId),
		// Тип дочернего узла (child_node_type = keyElementNodeTypeId),
		// Тип родительского узла (condition) (parent_node_type = parentNodeTypeId)
		var positionsOnParentNodeRespUrl = String().concat(
			host,
			"/odata/dictionary_positions_on_parent_node?$filter=(key_element_code eq ",
			keyElementCodeId,
			") and (child_node_type eq ",
			keyElementNodeTypeId,
			") ",
			condition,
			axisCountCondition);

		var positionsOnParentNodeResp = sendRequest("GET", null, positionsOnParentNodeRespUrl, null);
		var parentNodePositions = positionsOnParentNodeResp.value;
		if (isEmptyOrNullArray(parentNodePositions))
			return successResp();

		var keyElementParentNodePositions = [];
		var keyElementParentNodePositionsIds = [];

		// Фильтруем список позиций по полю "Позиция в дочернем узле" (position_on_node)
		// Значение поля должно соответствовать позиции текущего СЧ в родительском сборочном элементе
		for (var i = 0; i < parentNodePositions.length; i++) {
			if (parentNodePositions[i].position_on_node == keyElementNodePositionId) {
				keyElementParentNodePositions.push(parentNodePositions[i]);
				keyElementParentNodePositionsIds.push(parentNodePositions[i].recid)
			}
		}

		// Формируем массив наименований обратных позиций
		var alternativePositionNames = [];
		for (var i = 0; i < keyElementParentNodePositions.length; i++) {
			alternativePositionNames.push(keyElementParentNodePositions[i].alternative_position);
		}

		// Формируем массив объектов обратных позиций на основе наименований позиций
		var alternativePositions = [];
		for (var i = 0; i < parentNodePositions.length; i++) {
			if (alternativePositionNames.indexOf(parentNodePositions[i].recname) != -1) {
				alternativePositions.push(parentNodePositions[i]);
			}
		}

		// Обратные позиции добавляем в общий массив позиций 
		for (var i = 0; i < alternativePositions.length; i++) {
			if (keyElementParentNodePositionsIds.indexOf(alternativePositions[i].recid) == -1) {
				keyElementParentNodePositions.push(alternativePositions[i]);
			}
		}

		resultPositions = keyElementParentNodePositions;
	}

	return successResp("", resultPositions);
}

/**
 * Метод для проверки того, что СЧ может быть просканирован в сборочный элемент,
 * или сборочный элемент через СЧ может быть просканирован в родительский сборочный элемент.
 */
function checkAssemblyElementComposition(keyElement, assemblyElement, parentNodeTypeId) {
	// Если СЧ имеет родительский сборочный элемент
	if (assemblyElement != null) {
		// Выполняем запрос на получение записей из справочника "Состав узла/СЕ" с параметрами: 
		// Тип родительского узла/СЕ (parent_assembly_element = parentNodeTypeId),
		// Дочерний узел/СЕ (child_assembly_element = assemblyElement.ke_node_type)
		var assemblyElementCompositionRecordsParams = {
			"parent_assembly_element": parentNodeTypeId,
			"child_assembly_element": assemblyElement.ke_node_type
		};
		var assemblyElementCompositionRecords = db.findbyparams("dictionary_assembly_element_composition", assemblyElementCompositionRecordsParams);

		// Если не удалось найти записи в справочнике "Состав узла/СЕ", то возвращаем ошибку
		if (assemblyElementCompositionRecords == null || assemblyElementCompositionRecords.length == 0) {
			return {
				success: false,
				message: "Сборочный элемент "
					+ assemblyElement.unique_number
					+ " (" + assemblyElement.ke_node_type_calculated + ")"
					+ " не может быть включен в состав данного сборочного элемента."
			}
		}
	}
	// Иначе, если СЧ не имеет родительского сборочного элемента
	else {
		// Выполняем запрос на получение записей из справочника "Состав узла/СЕ" с параметрами: 
		// Тип родительского узла/СЕ (parent_assembly_element = parentNodeTypeId),
		// Дочерний СЧ (child_key_element = keyElement.key_element_code)
		var assemblyElementCompositionRecordsParams = {
			"parent_assembly_element": parentNodeTypeId,
			"child_key_element": keyElement.key_element_code
		};
		var assemblyElementCompositionRecords = db.findbyparams("dictionary_assembly_element_composition", assemblyElementCompositionRecordsParams);

		// Если не удалось найти записи в справочнике "Состав узла/СЕ", то возвращаем ошибку
		if (assemblyElementCompositionRecords == null || assemblyElementCompositionRecords.length == 0) {
			return {
				success: false,
				message: "составная часть "
					+ keyElement.numberke
					+ " (" + keyElement.key_element_code_calculated + ")"
					+ " не может быть включен в состав данного сборочного элемента."
			}
		}
	}

	return {
		success: true,
		message: null
	};
}

function getFreePositionsOnAssemblyElementByKeyElement(keyElement, assemblyElement, allPositions) {
	// Родительский сборочный элемент
	var keyElementNode = null;
	// Идентификатор родительского сборочного элемента
	var keyElementNodeId = null;
	// Идентификатор позиции СЧ в родительском узле
	var keyElementNodePositionId = null;

	// Идентификатор типа СЧ
	var keyElementCodeId = keyElement.key_element_code;
	// Идентификатор типа целевого сборочного элемента
	var parentNodeTypeId = assemblyElement.ke_node_type;

	// Если у СЧ есть ссылка на родительский сборочный элемент, то инициализируем необходимые переменные и проводим некоторые проверки
	if (keyElement.ke_node != null && keyElement.ke_node != "") {
		// Получаем родительский сборочный элемент из "Реестра узлов/СЕ"
		keyElementNode = db.findbyrecid("reestr_ke_nodes", keyElement.ke_node);
		if (isNullObject(keyElementNode)) {
			return badResp("Не удалось определить родительский сборочный элемент для СЧ.");
		}

		keyElementNodeId = keyElementNode.recid;
		keyElementNodePositionId = keyElement.position_on_node;

		// Запрещаем сканировать сборочные элементы по СЧ с одним из перечисленных ниже типом СЧ, по причине того, что данные СЧ не имеют позиции
		// в своем родительском сборочном элементе.
		// Балка надрессорная, Ось чистовая, Ось черновая, Рама боковая, Кольцо в подпятник,
		// Замок, Валик подъемника, Корпус автосцепки, Вкладыш подпятника
		if ((keyElementCodeId == "477d0c01-84d3-441c-9bb9-15f9d609671d"
			|| keyElementCodeId == "e4ef0365-0365-40df-ab4e-a77104c352df"
			|| keyElementCodeId == "b28e1a4f-d340-4ce0-a37a-d84dcfa1b6fb"
			|| keyElementCodeId == "8cdec5a2-69ac-4dd9-8568-f53853b55f86"
			|| keyElementCodeId == "9c60e01e-b4b7-448a-ae1b-7709f55d43a2"
			|| keyElementCodeId == "966f3039-1528-4af5-9e8e-2378dd738243"
			|| keyElementCodeId == "6eab3f2a-03b7-4570-9278-55944ed353d2"
			|| keyElementCodeId == "a70ac9bc-3212-4361-9b83-ab36282f7c97"
			|| keyElementCodeId == "a0e6b16a-5fee-4318-a4dc-115ae65d4b09")
			&& keyElementNodePositionId != null) {
			return badResp("Для установки узла нельзя использовать составную часть данного типа.");
		}
	}

	// Добавление СЧ в сборочный элемент
	if (keyElementNodeId == null || keyElementNodeId == "") {
		// Массив доспупных позиций СЧ в сборочном элементе
		var freePositions = [];
		// Массив занятых позиций СЧ в сборочном элементе
		var usedPositions = [];

		// Получаем уже установленные в сборочный элемент СЧ из "Реестра составных частей ТС"
		var alreadyInstalledKesParams = {
			"ke_node": assemblyElement.recid
		};
		var alreadyInstalledKes = db.findbyparams("reestr_key_elements", alreadyInstalledKesParams);
		
		// Добавляем в массив занятых позиций (usedPositions) идентификаторы позиций уже установленных СЧ
		for (var i = 0; i < alreadyInstalledKes.length; i++) {
			if (alreadyInstalledKes[i].position_on_node != null) {
				usedPositions.push(alreadyInstalledKes[i].position_on_node)
			}
		}

		// Если есть занятые позиции, то фильтруем список всех возможных позиций и заполняем массив доступных позиций
		if (usedPositions.length > 0) {
			for (var i = 0; i < allPositions.length; i++) {
				if (usedPositions.indexOf(allPositions[i].recid) == -1) {
					freePositions.push(allPositions[i]);
				}
			}
		}
		// Иначе инициализируем массив доступных позиций значениями массива всех возможных позиций
		else {
			freePositions = allPositions;
		}

		return successResp("", freePositions);
	}
	else {
		var axisCountCondition = "";

		// Необходимо проверить, является ли целевой сборочный элемент тележкой, чтобы с учетом этого получить список достпных позиций
		if (parentNodeTypeId == "cbb9d8cb-89ef-4b99-be77-a7d6e57e388e") {
			// Получаем номенклатуру узла из справочника "Кол-во СЧ/СЕ в СЕ/узле" по параметрам:
			// Номер документа (scheme = assemblyElement.documentation_number),
			// Тип узла/СЕ (ke_node_type = parentNodeTypeId)

			var dictionaryCountKeyElementsByNodeTypeRecordsParams = {
				"scheme": assemblyElement.documentation_number,
				"ke_node_type": parentNodeTypeId
			};
			var dictionaryCountKeyElementsByNodeTypeRecords = db.findbyparams("dictionary_count_key_elements_by_node_type", dictionaryCountKeyElementsByNodeTypeRecordsParams);
			dictionaryCountKeyElementsByNodeType = dictionaryCountKeyElementsByNodeTypeRecords[0];

			// Если в номенклатуре узла количество корпусов и колпаков скользуна больше двух - это средняя тележка
			// и необходимо запрашивать позиции с флагом "Для шестиосного вагона", иначе необходимо запрашивать позиции с флагом "Для четырехосного вагона"
			if (dictionaryCountKeyElementsByNodeType.slider_body_count > 2 && dictionaryCountKeyElementsByNodeType.slider_cap_count > 2) {
				axisCountCondition = "and (for_six_axis_vagon eq true)"
			} else {
				axisCountCondition = "and (for_four_axis_vagon eq true)"
			}
		}

		// Массив занятых позиций СЧ в родительском сборочном элементе
		var usedPositions = [];
		// Массив доступных позиций СЧ в родительском сборочном элементе
		var freePositions = [];

		// Получаем уже установленные в сборочный элемент СЧ из "Реестра составных частей ТС"
		var alreadyInstalledKesParams = {
			"ke_node": assemblyElement.recid
		};
		var alreadyInstalledKes = db.findbyparams("reestr_key_elements", alreadyInstalledKesParams);

		// Добавляем в usedPositions идентификаторы позиций уже установленных СЧ
		// В цикле обрабатываем все установленные в сборочный элемент СЧ
		for (var i = 0; i < alreadyInstalledKes.length; i++) {
			// Если у установленного СЧ есть позиция в родительском сборочном элементе
			if (alreadyInstalledKes[i].position_on_node != null) {
				// Получаем позицию СЧ в родительском сборочном элементе из справочника "Позиции в узле"
				var positionsOnNodeValue = db.findbyrecid("dictionary_positions_on_node", alreadyInstalledKes[i].position_on_node);

				// Получаем по позиции из справочника "Позиции в узле" запись из справочника "Позиции в дочернем узле" по параметрам:
				// Тип родительского узла (parent_node_type = positionsOnNodeValue.node_type),
				// Наименование СЧ (key_element_code = positionsOnNodeValue.key_element_code),
				// Позиция в родительском узле (recname = positionsOnNodeValue.recname),
				// Осность (axisCountCondition)
				var positionsOnParentNodeRespUrl = String().concat(
					host,
					"/odata/dictionary_positions_on_parent_node?$filter=(parent_node_type eq ",
					positionsOnNodeValue.node_type,
					") and (key_element_code eq ",
					positionsOnNodeValue.key_element_code,
					") and (recname eq '",
					positionsOnNodeValue.recname,
					"') ",
					axisCountCondition);
				var positionsOnParentNodeResp = sendRequest("GET", null, positionsOnParentNodeRespUrl, null);
				var positionsOnParentNodeValue = positionsOnParentNodeResp.value;

				// Добавляем в массив занятых позиций (usedPositions) идентификатор позиции установленного СЧ
				if (positionsOnParentNodeValue != null) {
					if (positionsOnParentNodeValue.length > 0) {
						usedPositions.push(positionsOnParentNodeValue[0].recid);
					}
				}
			}
		}

		// Если есть занятые позиции, то фильтруем список всех возможных позиций и заполняем массив доступных позиций
		if (usedPositions.length > 0) {
			for (var i = 0; i < allPositions.length; i++) {
				if (usedPositions.indexOf(allPositions[i].recid) == -1) {
					freePositions.push(allPositions[i]);
				}
			}
		}
		// Иначе инициализируем массив доступных позиций значениями массива всех возможных позиций
		else {
			freePositions = allPositions;
		}

		return successResp("", freePositions);
	}
}

function getAllPositionsOnAssemblyElementByAssemblyElement(assemblyElement, parentNodePattern) {
	// Тип родительского узла
	var parentNodeTypeId = parentNodePattern.ke_node_type;

	var axisCountCondition = "";

	// Необходимо проверить, является ли целевой сборочный элемент тележкой, чтобы с учетом этого получить список достпных позиций
	if (parentNodeTypeId == "cbb9d8cb-89ef-4b99-be77-a7d6e57e388e") {
		// Получаем номенклатуру узла из справочника "Кол-во СЧ/СЕ в СЕ/узле" по параметрам:
		// Номер документа (scheme = assemblyElement.documentation_number),
		// Тип узла/СЕ (ke_node_type = parentNodeTypeId)
		var dictionaryCountKeyElementsByNodeTypeRecordsParams = {
			"scheme": parentNodePattern.documentation,
			"ke_node_type": parentNodeTypeId
		};
		var dictionaryCountKeyElementsByNodeTypeRecords = db.findbyparams("dictionary_count_key_elements_by_node_type", dictionaryCountKeyElementsByNodeTypeRecordsParams);
		dictionaryCountKeyElementsByNodeType = dictionaryCountKeyElementsByNodeTypeRecords[0];

		// Если в номенклатуре узла количество корпусов и колпаков скользуна больше двух - это средняя тележка
		// и необходимо запрашивать позиции с флагом "Для шестиосного вагона", иначе необходимо запрашивать позиции с флагом "Для четырехосного вагона"
		if (dictionaryCountKeyElementsByNodeType.slider_body_count > 2 && dictionaryCountKeyElementsByNodeType.slider_cap_count > 2) {
			axisCountCondition = "and (for_six_axis_vagon eq true)";
		} else {
			axisCountCondition = "and (for_four_axis_vagon eq true)";
		}
	}

	// Выполняем запрос на получение возможных позиций СЕ в родительском сборочном элементе из справочника "Позиции в дочернем узле"
	// по параметрам: Тип дочернего узла (child_node_type = assemblyUnitType.recid),
	// Тип родительского узла (parent_node_type = parentNodeTypeId),
	// осность
	var positionsOnParentNodeRespUrl = String().concat(
		host,
		"/odata/dictionary_positions_on_parent_node?$filter=(child_node_type eq ",
		assemblyElement.ke_node_type,
		") and (parent_node_type eq ",
		parentNodeTypeId,
		") ",
		axisCountCondition);
	var positionsOnParentNodeResp = sendRequest("GET", null, positionsOnParentNodeRespUrl, null);
	var parentNodePositions = positionsOnParentNodeResp.value;

	// Проводим проверку состава сборочного элемента: можно ли просканировать данную СЕ в целевой сборочный элемент
	var checkAssemblyElementCompositionRes = checkAssemblyElementComposition(null, assemblyElement, parentNodeTypeId);
	if (!checkAssemblyElementCompositionRes.success) {
		return badResp(checkAssemblyElementCompositionRes.message);
	}

	// Возможные позиции СЕ в сборочном элементе
	var allPositionsOnNode = [];
	var allPositionsOnNodeIds = [];

	// Определяем возможные позиции текущего СЕ в узле/СЕ
	// По записям из справочника "Позиции в дочернем узле" получаем позиции из справочника "Позиции узла" (dictionary_node_positions)
	for (var i = 0; i < parentNodePositions.length; i++) {
		var position = parentNodePositions[i];

		if (position.node_position != null
			&& allPositionsOnNodeIds.indexOf(position.node_position) == -1) {

			var positionOnNode = db.findbyrecid("dictionary_node_positions", position.node_position);

			if (isNotNullObject(positionOnNode)) {
				allPositionsOnNode.push(positionOnNode);
				allPositionsOnNodeIds.push(positionOnNode.recid);
			}
		}
	}

	return successResp("", allPositionsOnNode);
}

function getFreePositionsOnAssemblyElementByAssemblyElement(assemblyElement, parentAssemblyElement, allPositionsOnNode) {
	// Зарезервированные позиции СЕ в сборочном элементе
	var reservedPositionsOnNodeIds = [];
	// Доступные позиции СЕ в сборочном элементе
	var freePositionsOnNode = [];

	// Получаем дочерние сборочные элементы из реестра "Сборочные единицы" по параметрам:
	// УИН родительского узла (parent_ke_node = this.props.activeRecord.recid),
	// Тип узла/СЕ (ke_node_type = this.state.currentElement.ke_node_type)
	var alreadyInstalledNodesParams = {
		"parent_ke_node": parentAssemblyElement.recid,
		"ke_node_type": assemblyElement.ke_node_type
	};
	var alreadyInstalledNodes = db.findbyparams("reestr_ke_nodes", alreadyInstalledNodesParams);

	// Если удалось получить дочерние сборочные элементы, то кладем их позиции в сборочном элементе в массив зарезервированных позиций
	if (isNotEmptyOrNullArray(alreadyInstalledNodes)) {
		for (var i = 0; i < alreadyInstalledNodes.length; i++) {
			var installedNode = alreadyInstalledNodes[i];
	
			if (installedNode.position_on_assembly_element != null) {
				reservedPositionsOnNodeIds.push(installedNode.position_on_assembly_element)
			}
		}
	}

	// Если удалось определить зарезервированные позиции, то фильтруем массив всех возможных позиций и заполняем массив доступных позиций
	if (reservedPositionsOnNodeIds.length > 0) {
		for (var i = 0; i < allPositionsOnNode.length; i++) {
			if (reservedPositionsOnNodeIds.indexOf(allPositionsOnNode[i].recid) == -1) {
				freePositionsOnNode.push(allPositionsOnNode[i]);
			}
		}
	}
	// Иначе инициализируем массив доступных позиций значениями из массива возможных позиций
	else 
		freePositionsOnNode = allPositionsOnNode;

	return successResp("", freePositionsOnNode);
}

//нужен, т.к. платформа передаёт не целую запись
function requestcorrect_assembly_unit_in(params){
	var assembly_element = db.findbyrecid("reestr_ke_nodes", params.recid);
	if(isNullObject(assembly_element)){
		return {
			success: false,
			message: "Не удалось получить данные корректируемой СЕ",
			closeForm: true,
			showMessage: true,
			data: null
		};
	}
	return {
		success: true,
		message: "",
		closeForm: false,
		showMessage: false,
		data: assembly_element
	};
}

//метод "запросить корректировку СЕ"
function requestcorrect_assembly_unit(data){

	var fields = {
		"change_method_of_marking": !!data.change_method_of_marking,
		"change_method_of_encoding": !!data.change_method_of_encoding,
		"change_date_manufacture": !!data.change_date_manufacture,
		"change_life_time": !!data.change_life_time,
		"change_individual_features": !!data.change_individual_features,
		"change_manufacturer_number": !!data.change_manufacturer_number,
		"change_steel_grade": !!data.change_steel_grade,
		"change_administration_code": !!data.change_administration_code,
		"change_coupling_model": !!data.change_coupling_model,
		"change_carcass_volume": !!data.change_carcass_volume,
		"change_absorbing_device_model": !!data.change_absorbing_device_model,
		"change_air_distributor_model": !!data.change_air_distributor_model,
		"change_truck_model": !!data.change_truck_model,
		"change_truck_type": !!data.change_truck_type,
		"change_max_static_axial_load": !!data.change_max_static_axial_load,
		"change_operating_pressure_transportation": !!data.change_operating_pressure_transportation,
		"change_operating_pressure_unloading": !!data.change_operating_pressure_unloading,
		"change_design_pressure": !!data.change_design_pressure,
		"change_hydraulic_test_pressure": !!data.change_hydraulic_test_pressure,
		"change_class_absorbing_device": !!data.change_class_absorbing_device,
		"change_energy_intensity": !!data.change_energy_intensity,
		"change_certificate_number": false,
		"change_main_part": !!data.change_main_part,
		"change_line_part": !!data.change_line_part,
		"change_main_part_date": !!data.change_main_part_date,
		"change_line_part_date": !!data.change_line_part_date,
		"change_main_part_number": !!data.change_main_part_number,
		"change_line_part_number": !!data.change_line_part_number,

	}

	var url = String().concat("/plugins/nbdlogicplugin/requestcorrectassemblyunit/", data.recid.toString());
	var res = plugins.callAsMethod(url, "post", fields, null);
	res.closeForm = res.success;
	return res;
}

// Корректировка СЕ
//функция доставки данных в ДФ "Корректировать СЕ"
function prepare_correctassemblyunit_form(params){
	//Массив ошибок по бизнес-процессу 
	var errors_logic_arr = [];
	//Массив системных ошибок 
	var errors_system_arr = [];
	// Получаем текущего участника
	var user = getcurrentuser();
	if(isNullObject(user)){
		errors_system_arr.push("Невозможно получить текущего пользователя");
	}

	var member = getmemberbyuserwithrecid(user.recid);
	if(isNullObject(member)){
		errors_system_arr.push("Получатель не найден в системе");
	}

	var assemblyElement = db.findbyrecid("reestr_ke_nodes", params.recid);
	if(isNullObject(assemblyElement)){
		errors_system_arr.push("Не удалось получить запись");
	}
	var ke_node_type = db.findbyrecid("dictionary_ke_node_types", assemblyElement.ke_node_type);
	if(isNullObject(ke_node_type)){
		errors_system_arr.push("Не удалось получить наименование изделия");
	}
	if (assemblyElement.batchid != null && assemblyElement.batchid !=""){
		//получаем запись партии
		var batch = db.findbyrecid("reestr_batch", assemblyElement.batchid);
		if (isNullObject(batch)) {
			errors_system_arr.push("Запись о партии не найдена в системе");
		}
		if (member.recid != batch.recipient_droplist){
			//если изготовитель, отправитель
			if (batch.batch_status == "ef519ef4-ec73-4776-9295-2d007bb32907" || (batch.batch_status == "f7b21136-24a8-4ae5-af5b-3b7b3dd0c36b" && assemblyElement.change_node == true)){
				//получени наименования статуса
				var batch_status_name = db.findbyrecid("dictionary_batch_status", batch.batch_status);
				if(isNullObject(batch_status_name)){
					errors_system_arr.push("Не удалось получить статус партии");
				}
				//Получаем запись из таблицы Запрос корректировки
				var correctionRequestRecords = db.findbyparams("correction_request", {
					"objectid": params.recid
				});
				if (!isEmptyOrNullArray(correctionRequestRecords) && correctionRequestRecords.length > 0) {
					var change_parameters = correctionRequestRecords[0].parameters;
				} else {
					errors_logic_arr.push("Невозможно корректировать ЭП " + assemblyElement.unique_number + " " + ke_node_type.recname + ", включенного в партию в статусе " + batch_status_name.recname + " без запроса на корректировку");
				}
			}
		}
	}

	if(isNotEmptyOrNullArray(errors_system_arr)){
		if (errors_system_arr.length > 0){
			return {
				success: false,
				message: String().concat(errors_system_arr.join(", ")),
				closeForm: true,
				showMessage: true,
				data: null
			};
		}
	}
	if(isNotEmptyOrNullArray(errors_logic_arr)){
		if (errors_logic_arr.length > 0){
			return {
				success: false,
				message: String().concat(errors_logic_arr.join(", ")),
				closeForm: true,
				showMessage: true,
				data: null
			};
		}
	}

	var data = {
		"recid": assemblyElement.recid,
		"ke_node_type": assemblyElement.ke_node_type,
		"batchid": assemblyElement.batchid,
		//флаги, показывающие какие параметры можно корректировать, если был запрос корректировки
		"change_flags": !!change_parameters ? JSON.parse(change_parameters) : null, 
        "method_of_marking_group": {
            "method_of_marking_old": assemblyElement.method_of_marking_text,
		},
		"method_of_encoding_group": {
			"method_of_encoding_old": assemblyElement.method_of_encoding_text,
		},
		"formation_date_group": {
			"formation_date_old": assemblyElement.formation_date,
		},
		"certificate_number_group": {
			"certificate_number_old": assemblyElement.certificate_number_text,
		},
		"manufacturer_number_group": {
			"manufacturer_number_old": assemblyElement.manufacturer_number,
		},
		"administration_code_group": {
			"administration_code_old": assemblyElement.administration_code_text,
		},
		"life_time_group": {
			"life_time_old": assemblyElement.life_time,
		},
		"steel_grade_group": {
			"steel_grade_old": assemblyElement.steel_grade_text,
		},
		//тележка
		"truck_model_group": {
			"truck_model_old": assemblyElement.truck_model_text,
		},
		"truck_type_group": {
			"truck_type_old": assemblyElement.truck_type_text,
		},
		"max_static_axial_load_group": {
			"max_static_axial_load_old": assemblyElement.max_static_axial_load,
		},
		//автосцепка
		"individual_features_group": {
			"individual_features_old": assemblyElement.individual_features,
		},
		"autocoupler_model_group": {
			"autocoupler_model_old": assemblyElement.autocoupler_model_text,
		},
		//котёл
		"carcass_volume_group": {
			"carcass_volume_old": assemblyElement.carcass_volume,
		},
		"operating_pressure_transportation_group": {
			"operating_pressure_transportation_old": assemblyElement.operating_pressure_transportation,
		},
		"operating_pressure_unloading_group": {
			"operating_pressure_unloading_old": assemblyElement.operating_pressure_unloading,
		},
		"design_pressure_group": {
			"design_pressure_old": assemblyElement.design_pressure,
		},
		"hydraulic_test_pressure_group": {
			"hydraulic_test_pressure_old": assemblyElement.hydraulic_test_pressure,
		},
		//воздухораспределитель
		"air_distributor_model_group": {
			"air_distributor_model_old": assemblyElement.air_distributor_model_text,
		},
		"air_distributor_main_part_group": {
			"main_part_old": assemblyElement.main_part_text,
		},
		"main_part_date_group": {
			"main_part_date_old": assemblyElement.main_part_date,
		},
		"main_part_number_group": {
			"main_part_number_old": assemblyElement.main_part_number,
		},
		"air_distributor_line_part_group": {
			"line_part_old": assemblyElement.line_part_text,
		},
		"line_part_date_group": {
			"line_part_date_old": assemblyElement.line_part_date,
		},
		"line_part_number_group": {
			"line_part_number_old": assemblyElement.line_part_number,
		},
		//поглощающий аппарат
		"absorbing_device_model_group": {
			"absorbing_device_model_old": assemblyElement.absorbing_device_model_text,
		},
		"class_absorbing_device_group": {
			"class_absorbing_device_old": assemblyElement.class_absorbing_device_text,
		},
		"energy_intensity_group": {
			"energy_intensity_old": assemblyElement.energy_intensity,
		},
	}
	


    return {
        success: true,
        message: "Запись доставлена в форму.",
        closeForm: false,
        showMessage: false,
        data: data
    };
}

//метод отправки данных с дин. формы в плагин для кооректировки СЕ
function correctassemblyunit_form(data){

	//определяем, в партии ли СЕ
	if(isNotEmptyString(data.batchid)){
		var batch = db.findbyrecid("reestr_batch", data.batchid);
		if(isNullObject(batch)){
			return  {
				success: false,
				message: "Произошла ошибка при получении информации о партии.",
				closeForm: false,
				showMessage: false,
				data: data
			}
		}

		//если партия в статусе черновик был изменен параметр "Сертификат соответствия" - выводить предупреждение об исключении из партии
		if(batch.batch_status == '255abbd7-fa7c-40d4-a270-5169a84fa05e' && isNotEmptyString(data.certificate_number_group.certificate_number_new)){
			data.countChild = 1;
		} else {
			data.countChild = 0;
		}
	}
	// Создание отдела архива данных, если его нет
	data.old = !data.old ? {} : data.old;

	// Инициализируем количество нужных нам дополнительных форм
	data.old.countChild = !data.old.countChild ? !data.countChild ? 0 : data.countChild : data.old.countChild;

	// Инициализируем текущий номер дополнительной формы
	data.old.childNow = !data.old.childNow ? 0.0 : data.old.childNow;

	// Условия, когда нужен переход на дополнительные формы
	//(когда СЧ в партии в статусе "Черновик" и был изменен параметр "Сертификат соответствия")
	if (data.old.countChild !== 0 && data.old.childNow < data.old.countChild && isNotEmptyString(data.certificate_number_group.certificate_number_new)) {
		var certificate = db.findbyrecid("reestr_certificates", data.certificate_number_group.certificate_number_new);
		if(isNullObject(certificate)){
			return {
				showMessage: true,
				message: "Ошибка при корректировке получении информации о сертификате соответствия",
				success: false,
				data: data,
				closeForm: false,
			};
		}
		//если сертификат изменился - выдаём предупреждение
		if(certificate.registration_number != data.certificate_number_group.certificate_number_old){
			// Перелистываем номер формы
			data.old.childNow++;
			// Отправляем на следующую дополнительную форму 
			return {
				showMessage: false,
				message: null,
				success: true,
				data: data,
				closeForm: false,
				idNextForm: "e3174f64-01a2-4738-9c5d-85ea3f1d1d3a" 
			};
		}
	}

	if(data.old.childNow ==0){

		var params = {
			"recid": data.recid,
			"method_of_marking": data.method_of_marking_group.method_of_marking_new,
			"method_of_encoding": data.method_of_encoding_group.method_of_encoding_new,
			"formation_date": data.formation_date_group.formation_date_new,
			"certificate_number": data.certificate_number_group.certificate_number_new,
			"manufacturer_number": data.manufacturer_number_group.manufacturer_number_new,
			"administration_code": data.administration_code_group.administration_code_new,
			"life_time": data.life_time_group.life_time_new,
			"steel_grade": data.steel_grade_group.steel_grade_new,
			"truck_model": data.truck_model_group.truck_model_new,
			"truck_type": data.truck_type_group.truck_type_new,
			"max_static_axial_load": data.max_static_axial_load_group.max_static_axial_load_new,
			"individual_features": data.individual_features_group.individual_features_new,
			"autocoupler_model": data.autocoupler_model_group.autocoupler_model_new,
			"carcass_volume": data.carcass_volume_group.carcass_volume_new,
			"operating_pressure_transportation": data.operating_pressure_transportation_group.operating_pressure_transportation_new,
			"operating_pressure_unloading": data.operating_pressure_unloading_group.operating_pressure_unloading_new,
			"design_pressure": data.design_pressure_group.design_pressure_new,
			"hydraulic_test_pressure": data.hydraulic_test_pressure_group.hydraulic_test_pressure_new,
			"air_distributor_model": data.air_distributor_model_group.air_distributor_model_new,
			"absorbing_device_model": data.absorbing_device_model_group.absorbing_device_model_new,
			"class_absorbing_device": data.class_absorbing_device_group.class_absorbing_device_new,
			"energy_intensity": data.energy_intensity_group.energy_intensity_new,
			//параметр, отвечающий за согласие исключить СЧ из партии в случае корректировки сертификата
			"is_agree_exclude_ke_from_batch": false,
			"main_part": data.air_distributor_main_part_group.main_part_new,
			"main_part_date": data.main_part_date_group.main_part_date_new,
			"main_part_number": data.main_part_number_group.main_part_number_new,
			"line_part": data.air_distributor_line_part_group.line_part_new,
			"line_part_date": data.line_part_date_group.line_part_date_new,
			"line_part_number": data.line_part_number_group.line_part_number_new,
		}
	}
	else {
		var params = {
			"recid": data.old.correct_assembly_element.recid,
			"method_of_marking": data.old.correct_assembly_element.method_of_marking_group.method_of_marking_new,
			"method_of_encoding": data.old.correct_assembly_element.method_of_encoding_group.method_of_encoding_new,
			"formation_date": data.old.correct_assembly_element.formation_date_group.formation_date_new,
			"certificate_number": (data.is_agree_exclude_ke_from_batch) ? data.old.correct_assembly_element.certificate_number_group.certificate_number_new : "",
			"manufacturer_number": data.old.correct_assembly_element.manufacturer_number_group.manufacturer_number_new,
			"administration_code": data.old.correct_assembly_element.administration_code_group.administration_code_new,
			"life_time": data.old.correct_assembly_element.life_time_group.life_time_new,
			"steel_grade": data.old.correct_assembly_element.steel_grade_group.steel_grade_new,
			"truck_model": data.old.correct_assembly_element.truck_model_group.truck_model_new,
			"truck_type": data.old.correct_assembly_element.truck_type_group.truck_type_new,
			"max_static_axial_load": data.old.correct_assembly_element.max_static_axial_load_group.max_static_axial_load_new,
			"individual_features": data.old.correct_assembly_element.individual_features_group.individual_features_new,
			"autocoupler_model": data.old.correct_assembly_element.autocoupler_model_group.autocoupler_model_new,
			"carcass_volume": data.old.correct_assembly_element.carcass_volume_group.carcass_volume_new,
			"operating_pressure_transportation": data.old.correct_assembly_element.operating_pressure_transportation_group.operating_pressure_transportation_new,
			"operating_pressure_unloading": data.old.correct_assembly_element.operating_pressure_unloading_group.operating_pressure_unloading_new,
			"design_pressure": data.old.correct_assembly_element.design_pressure_group.design_pressure_new,
			"hydraulic_test_pressure": data.old.correct_assembly_element.hydraulic_test_pressure_group.hydraulic_test_pressure_new,
			"air_distributor_model": data.old.correct_assembly_element.air_distributor_model_group.air_distributor_model_new,
			"absorbing_device_model": data.old.correct_assembly_element.absorbing_device_model_group.absorbing_device_model_new,
			"class_absorbing_device": data.old.correct_assembly_element.class_absorbing_device_group.class_absorbing_device_new,
			"energy_intensity": data.old.correct_assembly_element.energy_intensity_group.energy_intensity_new,
			//параметр, отвечающий за согласие исключить СЕ из партии в случае корректировки сертификата
			"is_agree_exclude_ke_from_batch": data.is_agree_exclude_ke_from_batch,
			"main_part": data.old.correct_assembly_element.air_distributor_main_part_group.main_part_new,
			"main_part_date": data.old.correct_assembly_element.main_part_date_group.main_part_date_new,
			"main_part_number": data.old.correct_assembly_element.main_part_number_group.main_part_number_new,
			"line_part": data.old.correct_assembly_element.air_distributor_line_part_group.line_part_new,
			"line_part_date": data.old.correct_assembly_element.line_part_date_group.line_part_date_new,
			"line_part_number": data.old.correct_assembly_element.line_part_number_group.line_part_number_new,
		}
	}
	var res = plugins.callAsMethod("/plugins/nbdlogicplugin/correctassemblyunit", "post", params, null);
	res.closeForm = res.success;
	return res;
}

// Сохранение черновика се
function save_reestr_ke_nodes(params){
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
	//Вызываем метод валидации из плагина
	var res = plugins.callAsMethod("/plugins/nbdlogicplugin/save_reestr_ke_nodes", "post", params.selectedRecords[0], null);
	
	if (!res.success){
		return res;
	}
	
	return {
		success: true,
		message: "",
		data: null
	};
}