function set_ke_log(key_element, action, parentId, nodeType) {
	var modelName = "";
	if (isNotEmptyString(key_element.auto_mode_cargo_model_text)) {
		modelName = key_element.auto_mode_cargo_model_text;
	} else if (isNotEmptyString(key_element.coupling_model_text)) {
		modelName = key_element.coupling_model_text;
	} else if (isNotEmptyString(key_element.absorbing_device_body_model_text)) {
		modelName = key_element.absorbing_device_body_model_text;
	}

	var keManufacturerText = null;
	//НЕ заполняем для:
	//сменный жд кузов
	//Пружина скользуна внутренняя/Пружина скользуна наружняя
	if (key_element.ke_manufacturer != null && key_element.key_element_code !== 'ad836d1b-6ecb-4dce-a508-8e9f42095ba3' && key_element.key_element_code !== '975cd310-7675-4436-899f-4c6b84555f6a' && key_element.key_element_code !== '4aed23f8-9710-4904-a2f5-b89d9bc7c75c') {
		if (isNotEmptyString(key_element.ke_manufacturer_text)) {
			keManufacturerText = key_element.ke_manufacturer_text;
		} else {
			let brandingCode = db.findbyrecid("dictionary_branding_codes", key_element.ke_manufacturer);
			if (brandingCode != null) {
				keManufacturerText = brandingCode.code + "," + brandingCode.recname;
			}
		}
	}

	var vehicleNumber;
	if (key_element.vehicle != null && isNotEmptyString(key_element.vehicle)){
		var vehicle = db.findbyrecid("reestr_vehicles", key_element.vehicle);
		if (vehicle != null) {
			vehicleNumber = vehicle.vagon_number;
		}
	}

	var actionName = "";
	if (action != null && isNotEmptyString(action)){
		var keAction = db.findbyrecid("dictionary_ke_actions", action);
		if (keAction != null){
			actionName = keAction.recname;
		} 
	}

	keLog = {
		"reged_key_element": key_element.recid,
		"ke_action": action,
		"action_name": actionName,
		"operation_date": (new Date()).toISOString(),
		"method_of_marking": key_element.method_of_marking_text,
		"method_of_encoding": key_element.method_of_encoding_text,
		"normative_name": key_element.key_element_normative_name_calculated,
		"documentation_number": key_element.documentation_number_text,
		"date_manufacture": key_element.date_manufacture,
		"manufacturer_details": key_element.manufacturer_details_text,
		"is_registratred_in_rzd": !!key_element.is_registratred_in_rzd ? key_element.is_registratred_in_rzd : false,
		"is_registrated_installation": !!key_element.is_registrated_installation ? key_element.is_registrated_installation : false,
		"product_name": key_element.product_name_text,
		"technical_conditions": key_element.technical_conditions_text,
		"billet_manufacturer_details": key_element.billet_manufacturer_info_text,
		"certificate_number": key_element.certificate_number_text,
		"life_time": key_element.life_time,
		"ke_manufacturer": keManufacturerText,
		"branding_code_certificate_number": key_element.branding_code_certificate_number,
		"features": key_element.features,
		"rough_axis_number": !!key_element.rough_axis_text ? key_element.rough_axis_text : key_element.rough_axis_number,
		"rough_axis_manufacture_date": !!key_element.rough_axis_manufacture_date ? key_element.rough_axis_manufacture_date : key_element.rough_axis_manufacturing_date,
		"manufacturer_number": key_element.manufacturer_number,
		"melt_number": key_element.melt_number,
		"steel_grade": key_element.steel_grade_text,
		"administration_code": key_element.administration_code_text,
		"slip_knots_distance": key_element.slip_knots_distance,
		"detail_number_by_manufacturer_system": modelName,
		"carcass_load_capacity": key_element.carcass_load_capacity,
		"carcass_volume": key_element.carcass_volume,
		"tare_max_weight": key_element.tare_max_weight,
		"specialization_type": key_element.specialization_text,
		"features": key_element.individual_features,
		"initial_release": key_element.initial_release,
		"acceptance_certificate": key_element.acceptance_certificate,
		"packing_certificate": key_element.packing_certificate,
		"vehicle": key_element.vehicle,
		"vehicle_number": action != "bb7492ac-7097-4870-8f04-fae9b6d6e2c6" && action != "b158bc11-095a-4926-8db7-ef88b7e33efa" && action != "c0c84f9c-250a-45f1-b718-537560ac84a6" ? "" : vehicleNumber,
		"install_ke_date": key_element.install_ke_date,
		"position_on_vagon": getPositionOnVagon(key_element.position_on_vagon),
		"application_id": key_element.application_id,
		"parent": parentId,
		"node_type": nodeType,
		"node_owner": key_element.node_owner,
		"manufacturer_details_guid": key_element.manufacturer_details,
		"batchid": key_element.batchid,
		"key_element_code": key_element.key_element_code,
		"position_on_node": key_element.position_on_node,
		"repair_date": key_element.repair_date,
		"repair_type": key_element.repair_type,
		"repair_defect": key_element.repair_defect,
		"repair_operation": key_element.repair_operation,
		"gamma_percent_resource_end_date": key_element.gamma_percent_resource_end_date,
		"billing_is_calculated": false
	}


	if (isNotEmptyString(key_element.ke_node) && (isEmptyString(parentId) || isEmptyString(nodeType))) {
		var parentNode = db.findbyrecid("reestr_ke_nodes", key_element.ke_node);
		if (isNotNullObject(parentNode)) {
			keLog["parent"] = parentNode.recid;
			keLog["node_type"] = parentNode.ke_node_type;
		}
	}
	return keLog;
}

function set_node_log(node, action, node_content) {
	var manufacturerText = null;
	if (node.manufacturer != null && node.ke_node_type !== '79ddf686-f26f-4567-97ac-cb18eadd83e9') {
		if (isNotEmptyString(node.manufacturer_text)) {
			manufacturerText = node.manufacturer_text;
		} else {
			let brandingCode = db.findbyrecid("dictionary_branding_codes", node.manufacturer);
			if (brandingCode != null) {
				manufacturerText = brandingCode.code + "," + brandingCode.recname;
			}
		}
	}

	var vehicleNumber;
	if (node.vehicle != null && isNotEmptyString(node.vehicle)){
		var vehicle = db.findbyrecid("reestr_vehicles", node.vehicle);
		if (vehicle != null) {
			vehicleNumber = vehicle.vagon_number;
		}
	}

	var actionName = "";
	if (action != null && isNotEmptyString(action)){
		var nodeAction = db.findbyrecid("dictionary_node_actions", action);
		if (nodeAction != null){
			actionName = nodeAction.recname;
		} 
	}

	var nodeLog = {
		"nodeid": node.recid,
		"number": node.unique_number,
		"type": node.ke_node_type,
		"action_date": (new Date()).toISOString(),
		"action": action,
		"action_name": actionName,
		"node_content": node_content,
		"method_of_marking": node.method_of_marking_text,
		"method_of_encoding": node.method_of_encoding_text,
		"normative_name": node.ke_assembly_unit_type_calculated,
		"documentation_number": node.documentation_number_text,
		"date_manufacture": node.formation_date,
		"manufacturer_details": node.manufacturer_details_text,
		"is_registratred_in_rzd": !!node.is_registratred_in_rzd ? node.is_registratred_in_rzd : false,
		"is_registrated_installation": !!node.is_registrated_installation ? node.is_registrated_installation : false,
		"product_name": node.product_name_text,
		"technical_conditions": node.technical_conditions_text,
		"billet_manufacturer_details": node.billet_manufacturer_info_text,
		"certificate_number": node.certificate_number_text,
		"life_time": node.life_time,
		"manufacturer": manufacturerText,
		"branding_code_certificate_number": node.branding_code_certificate_number,
		"features": node.individual_features,
		"melt_number": node.melt_number,
		"steel_grade": node.steel_grade_text,
		"administration_code": node.administration_code_text,
		"initial_release": node.initial_release,
		"acceptance_certificate": node.acceptance_certificate,
		"packing_certificate": node.packing_certificate,
		"truck_type": node.truck_type,
		"max_static_axial_load": node.max_static_axial_load,
		"operating_pressure_transportation": node.operating_pressure_transportation,
		"operating_pressure_unloading": node.operating_pressure_unloading,
		"design_pressure": node.design_pressure,
		"hydraulic_test_pressure": node.hydraulic_test_pressure,
		"class_absorbing_device": node.class_absorbing_device_text,
		"vehicle": node.vehicle,
		"vehicle_number": action != "c2969c99-7342-4b1b-a84c-06b9e49574a9" && action != "9868ae8d-725d-4cb5-85b4-abf063316465" && action != "5b93a2a1-bb60-4c97-b2d3-343087f48781" ? "" : vehicleNumber,
		"install_date": node.install_date,
		"position_on_vagon": getPositionOnVagon(node.assembly_element_position_on_vagon),
		"application_id": node.application_id,
		"node_owner": node.node_owner,
		"manufacturer_details_guid": node.manufacturer_details,
		"batchid": node.batchid,
		"position_on_parent": node.position_on_assembly_element,
		"repair_date": node.repair_date,
		"repair_type": node.repair_type,
		"repair_defect": node.repair_defect,
		"repair_operation": node.repair_operation,
		"main_part_number": node.main_part_number,
		"line_part_number": node.line_part_number,
		"main_part_date": node.main_part_date,
		"line_part_date": node.line_part_date,
		"billing_is_calculated": false,
		"assembly_element_type": node.assembly_element_type,
		"energy_intensity": node.energy_intensity,
		"manufacturer_number": node.manufacturer_number,
		"model": !!node.absorbing_device_model_text ? node.absorbing_device_model_text : (!!node.air_distributor_model_text ? node.air_distributor_model_text : (!!node.autocoupler_model_text ? node.autocoupler_model_text : (!!node.truck_model_text ? node.truck_model_text : ""))),
	};
	if (isNotEmptyString(node.parent_ke_node)) {
		var parentNode = db.findbyrecid("reestr_ke_nodes", node.parent_ke_node);
		if (isNotNullObject(parentNode)) {
			nodeLog["parent"] = parentNode.recid;
			nodeLog["parent_node_type"] = parentNode.ke_node_type;
		}
	}
	//Если тип СЕ - воздухораспределитель в сборе
	if (node.ke_node_type == "a6180bfa-368d-4eff-97f2-c4f6c2612bc6") {
		if (isNotEmptyString(node.main_part_text)) {
			nodeLog["main_part_text"] = node.main_part_text;
		} else if (isNotEmptyString(node.main_part)) {
			var mainPart = db.findbyrecid("dictionary_names_main_part_air_distributor", node.main_part);
			if (isNotNullObject("mainPart")) {
				nodeLog["main_part"] = mainPart.recname;
			}
		}
		if (isNotEmptyString(node.line_part_text)) {
			nodeLog["line_part_text"] = node.line_part_text;
		} else if (isNotEmptyString(node.line_part)) {
			var linePart = db.findbyrecid("dictionary_names_line_part_air_distributor", node.line_part);
			if (isNotNullObject("linePart")) {
				nodeLog["line_part"] = linePart.recname;
			}
		}
	}

	return nodeLog;
}

//Получаем позицию по идентификатору
function getPositionOnVagon(positionId) {
	var result = "";
	if (isNotEmptyString(positionId)) {
		var position = db.findbyrecid("dictionary_positions_on_vagon", positionId);
		if (isNotNullObject(position)) {
			result = position.recname;
		} else {
			var position = db.findbyrecid("dictionary_node_positions", positionId);
			if (isNotNullObject(position)) {
				result = position.recname;
			}
		}
	}
	return result;
}