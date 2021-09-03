// Получить лист комплектации для вагона.
function getcarpassport(requestdata) {
	var reestr_vehiclesTmp = null;

	// Получение вагона по номеру.
	if (!!requestdata.wagonnumber) {
		var reestr_vehiclesTmp_params = {
			"vagon_number": requestdata.wagonnumber
		};
		var reestr_vehiclesTmps = db.findbyparams("reestr_vehicles", reestr_vehiclesTmp_params)
		if (!!reestr_vehiclesTmps) {
			reestr_vehiclesTmp = reestr_vehiclesTmps[0];
		}
		else {
			throw new Error("Вагон '" + requestdata.wagonnumber + "' не найден в системе.");
		}
	}
	else {
		throw new Error("Требуется указать номер вагона в параметре 'wagonnumber'.")
	}

	// Формат ответа для системы учёта вагонов.
	var carPassport =
		{
			"WheelPairsList": [],
			"CastPartsOfTruckList": []
		};

	if (!!reestr_vehiclesTmp) {

		// Получение деталей, которые установлены на вагон.
		var reestr_key_elementsByTsTmp_params = {
			"vehicle": reestr_vehiclesTmp.recid
		};
		var reestr_key_elementsByTsTmps = db.findbyparams("reestr_key_elements", reestr_key_elementsByTsTmp_params)

		if (!!reestr_key_elementsByTsTmps) {
			var wheelNumber = 1;
			var pressureBeamNumber = 1;
			var sideFrameNumber = 1;

			// Формируем описание для кождой детали.
			for (var i = 0; i < reestr_key_elementsByTsTmps.length; i++) {

				var reestr_key_elementsByTsTmp = reestr_key_elementsByTsTmps[i];
				//Балка надрессорная
				if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.pressure_beam_id) {
					var PressureBeams = getPressureBeam(reestr_key_elementsByTsTmp, pressureBeamNumber);
					pressureBeamNumber++;
					carPassport.CastPartsOfTruckList.push(PressureBeams);
				}
				//Рама боковая
				if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.side_frame_id) {
					var SideFrames = getSideFrame(reestr_key_elementsByTsTmp, sideFrameNumber);
					sideFrameNumber++
					carPassport.CastPartsOfTruckList.push(SideFrames);
				}
				//Колесная пара в сборе
				if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.wheel_pair_id) {
					var WheelPairs = getWheelPair(reestr_key_elementsByTsTmp, wheelNumber);
					wheelNumber++;
					carPassport.WheelPairsList.push(WheelPairs);
				}
			}
		}
		else {
			throw new Error("Не найдены детали для вагона " + requestdata.wagonnumber)
		}
	}
	else {
		throw new Error("Не найден вагон " + requestdata.wagonnumber)
	}

	return carPassport;
}

// Формирование данных по колёсной паре.
function getWheelPair(reestr_key_elements, wheelNumber) {
	// Завод.
	if (!!reestr_key_elements.ke_manufacturer) {

	}
	else {
		throw new Error("Требуется заполнить обязательное поле - завод");
	}
	var manufacturer = db.findbyrecid("reestr_members", reestr_key_elements.ke_manufacturer);
	var dictionary_branding_codes = db.findbyrecid("dictionary_branding_codes", manufacturer.branding_code);

	// Администрация.
	if (!!reestr_key_elements.administration_code) {

	}
	else {
		throw new Error("Требуется заполнить обязательное поле - ж.д. администрация");
	}

	var dictionary_administration_codes = db.findbyrecid("dictionary_administration_codes", reestr_key_elements.administration_code);

	dictionary_administration_codes_name = dictionary_administration_codes.reccode;

	// Депо установки.
	if (!!reestr_key_elements.depo_complete_survey) {

	}
	else {
		throw new Error("Требуется заполнить обязательное поле - Депо установки детали");
	}

	var depo = db.findbyrecid("reestr_members", reestr_key_elements.depo_complete_survey);
	var depo_dictionary_branding_codes = db.findbyrecid("dictionary_branding_codes", depo.branding_code);

	// Дата производства.
	var dateke = new Date(reestr_key_elements.date_manufacture);
	// Дата установки.
	var date_install = new Date(reestr_key_elements.date_install);
	// Толщина обода правая.
	var right = reestr_key_elements.right_wheel_width;
	// Толщина обода левая.
	var left = reestr_key_elements.left_wheel_width;

	right = right.substr(0, right.length - 1) + "." + right.substr(right.length - 1, 1);
	left = left.substr(0, left.length - 1) + "." + left.substr(left.length - 1, 1);

	// Описание для системы учёта вагонов.
	var WheelPairs = {
		"SerialNumberUnderVirtualCar": wheelNumber,
		"IdOwner": dictionary_administration_codes_name,
		"IdManufacturerFirm": dictionary_branding_codes.code,
		"SerialNumberOfAxis": reestr_key_elements.manufacturer_number,
		"YearOfManufactorer": dateke.getUTCFullYear(),
		"RimsThicknessRightWheel": right,
		"RimsThicknessLeftWheel": left,
		"FirmCompleteSurveyID": depo_dictionary_branding_codes.code,
		"DateInspection": (date_install.getUTCMonth() + 1).toString().padStart(2, 0) + '.' + date_install.getUTCFullYear()
	};

	return WheelPairs;
}

// Формирование данных по боковой раме.
function getSideFrame(reestr_key_elements, sideFrameNumber) {
	// Завод.
	if (!!reestr_key_elements.ke_manufacturer) {

	}
	else {
		throw new Error("Требуется заполнить обязательное поле - завод");
	}
	var manufacturer = db.findbyrecid("reestr_members", reestr_key_elements.ke_manufacturer);
	var dictionary_branding_codes = db.findbyrecid("dictionary_branding_codes", manufacturer.branding_code);

	// Администрация.
	if (!!reestr_key_elements.administration_code) {

	}
	else {
		throw new Error("Требуется заполнить обязательное поле - ж.д. администрация");
	}

	var dictionary_administration_codes = db.findbyrecid("dictionary_administration_codes", reestr_key_elements.administration_code);

	dictionary_administration_codes_name = dictionary_administration_codes.reccode;

	// Дата производства.
	var dateke = new Date(reestr_key_elements.date_manufacture);

	// Определение положения.
	var placeUnderVirtualCar = "Left";

	if ((parseInt(sideFrameNumber) + 1) % 2 == 0) {
		placeUnderVirtualCar = "Right"
	}

	// Описание для системы учёта вагонов.
	var CastPartsOfTruck = {
		"PlaceUnderVirtualCar": placeUnderVirtualCar,
		"NameOfPartTruck": "TheSideFrame",
		"SerialNumber": (parseInt((parseInt(sideFrameNumber) + 1) % 2) + 1).toString(),
		"OrderInFile": "0",
		"IdOwner": dictionary_administration_codes_name,
		"IdManufacturerFirm": dictionary_branding_codes.code,
		"SerialNumberOfPart": reestr_key_elements.manufacturer_number,
		"YearOfManufactorer": (parseInt(dateke.getUTCFullYear())).toString()
	};

	return CastPartsOfTruck;
}

// Формирование данных по надрессорной балке.
function getPressureBeam(reestr_key_elements, pressureBeamNumber) {
	// Завод.
	if (!!reestr_key_elements.ke_manufacturer) {

	}
	else {
		throw new Error("Требуется заполнить обязательное поле - завод");
	}
	var manufacturer = db.findbyrecid("reestr_members", reestr_key_elements.ke_manufacturer);
	var dictionary_branding_codes = db.findbyrecid("dictionary_branding_codes", manufacturer.branding_code);

	// Администрация.
	if (!!reestr_key_elements.administration_code) {

	}
	else {
		throw new Error("Требуется заполнить обязательное поле - ж.д. администрация");
	}

	var dictionary_administration_codes = db.findbyrecid("dictionary_administration_codes", reestr_key_elements.administration_code);

	dictionary_administration_codes_name = dictionary_administration_codes.reccode;

	// Дата производства.
	var dateke = new Date(reestr_key_elements.date_manufacture);

	// Описание для системы учёта вагонов.
	var CastPartsOfTruck = {
		"PlaceUnderVirtualCar": "Joist",
		"NameOfPartTruck": "Joist",
		"SerialNumber": (parseInt(pressureBeamNumber)).toString(),
		"OrderInFile": "0",
		"IdOwner": dictionary_administration_codes_name,
		"IdManufacturerFirm": dictionary_branding_codes.code,
		"SerialNumberOfPart": reestr_key_elements.manufacturer_number,
		"YearOfManufactorer": (parseInt(dateke.getUTCFullYear())).toString()
	};

	return CastPartsOfTruck;
}

/**
 * Присвоение сетевого номера вагону (оператор РЖД)
 * @param {*} params 
 */
function rzd_op_setvagonnumber(params){
	//Получение идентификатора производителя
	var vehicle = db.findbyrecid("reestr_vehicles", params.recid);
	if(isNullObject(vehicle)){
		return badResp("ТС не найдено в системе");
	}
	if(isEmptyString(vehicle.trusted_manufacturer)){
		return badResp("Поле \"Доверенное предприятие\" не может быть пустым");
	}
	//Получение записи из справочника кодов клеймения
	var dictionary_branding_code = db.findbyrecid("dictionary_branding_codes", vehicle.trusted_manufacturer);
	if(isEmptyOrNullArray(dictionary_branding_code)){
		return badResp("Условный код клеймения не найден в системе");
	}
	//Получение записи из реестра участников
	var members = db.findbyparams("reestr_members", {
		branding_code: dictionary_branding_code.recid
	});
	if(isEmptyOrNullArray(members)){
		return badResp("Участник не найден в системе");
	}
	var member = members[0];
	params.memberid = member.recid;
	return setvagonnumber(params);
}

// Присвоение сетевого номера вагону.
function setvagonnumber(params) {
	//Вызываем метод из плагина
	var res = plugins.callAsMethod("/plugins/nbdlogicplugin/setvagonnumber", "post", params, null);
	return res;
}