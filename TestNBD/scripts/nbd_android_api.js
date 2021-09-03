// Инициализация.
function initkeasgood(params) {
	var res = true;

	var ke_numbersParams = {
		"recname": params.rfidnumber
	};

	var ke_numbers = db.findbyparams("ke_numbers", ke_numbersParams)
	
	var reestr_key_elements = null;

	if(!!ke_numbers)
	{
		var ke_numbersTmp = ke_numbers[0];

		var keParams = {
			"ke_number":ke_numbersTmp.recid
		};
		var kes = db.findbyparams("reestr_key_elements", keParams)
		if(!!kes)
		{
			reestr_key_elements = kes[0];
		}
	}

	reestr_key_elements = db.findbyrecid("reestr_key_elements", reestr_key_elements.recid);

	var currentownerid;
	var reestr_members = getmemberbyuser();
	if(!!reestr_members)
	{
		currentownerid = reestr_members.recid;
	}
	else
	{
		currentownerid = reestr_key_elements.owner;
	}

	var date = new Date();
	var changetdata = {
		"recid": reestr_key_elements.recid,
		"new_owner": currentownerid,
		"reason": "идентификация",
		"operation_date": date
	};

	if((reestr_key_elements.statuske.toString() == commonConst.PeradanId) || (reestr_key_elements.statuske.toString() == commonConst.UstanovlenId))
	{
		if(!!reestr_key_elements.vehicle)
		{
			var requestdata = {
				"numberke": reestr_key_elements.numberke
			};
		
			res = apiremovekefromwagon(requestdata);
			sleep(10000);
		}

		res = changeownerke(changetdata) 

		reestr_key_elements = db.findbyrecid("reestr_key_elements", reestr_key_elements.recid);	
		if (!!reestr_key_elements && res) {
			reestr_key_elements.is_identified = true;
			res = db.update("reestr_key_elements", reestr_key_elements);
		}

		if (!!reestr_key_elements && res) {
			var logItem = {
				"reged_key_element": reestr_key_elements.recid,
				"ke_action": "2c04af0c-86ba-4513-969d-9eade956b9c3",
				"operation_date": (new Date()).toISOString(),
				"reccreated": new Date().toISOString()
			};

			db.insert("log", logItem);

			event.log("reestr_key_elements",
				reestr_key_elements.recid,
				"СЧ с номером " + reestr_key_elements.numberke + " идентифицирован.",
				eventTypeEnum.Info);
		}
	}
	else
	{
		throw new Error("Для идентификации требуется статус Установлен или Передан. Текущий статус элемента " + reestr_key_elements.numberke + ": " + reestr_key_elements.statuske___value)
	}

	return res;
}

function sleep(ms) {
    var unixtime_ms = new Date().getTime();
    while(new Date().getTime() < unixtime_ms + ms) {}
}