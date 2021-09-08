function searchcustomer(jpack) {

	if (!jpack.customertype) {
		return {
			"success": false,
			"message": "Отсутствует обязательное поле usertype"
		};
	}
	if (!jpack.doctype) {
		return {
			"success": false,
			"message": "Отсутствует обязательное поле doctype"
		};
	}
	var customer = { "recstate": "1", "customertype": jpack.customertype };

	switch (jpack.doctype) {
		case "inn":
			if (!jpack.inn) {
				return {
					"success": false,
					"message": "Отсутствует параметр inn"
				};
			}
			customer.inn = jpack.inn;
			break;
		case "snils":
			if (!jpack.snils) {
				return {
					"success": false,
					"message": "Отсутствует параметр snils"
				};
			}
			customer.snils = jpack.snils;
			break;
		case "ogrn":
			if (!jpack.ogrn) {
				return {
					"success": false,
					"message": "Отсутствует параметр ogrn"
				};
			}
			customer.ogrn = jpack.ogrn;
			break;
		case "passport":
			if (!jpack.passportseries && !jpack.passportnumber) {
				return {
					"success": false,
					"message": "Отсутствует один из обязательных параметров: passportseries passportnumber"
				};
			}
			customer.passportseries = jpack.passportseries;
			customer.passportnumber = jpack.passportnumber;
			break;
		case "foreignerpassport":
			if (!jpack.passportnumber) {
				return {
					"success": false,
					"message": "Отсутствует параметр passportnumber"
				};
			}
			if (!!jpack.passportseries) {
				customer.passportseries = jpack.passportseries;
			}
			customer.passportnumber = jpack.passportnumber;
			break;
		default:
			return {
				"success": false,
				"message": "Тип документа не поддерживается",
			};
	}

	var url = String().concat(host, "/odata/", "customers");
	var result = fetch(url, {
		method: "GET",
		headers: null,
		body: null
	});
	return result;

	
	var userdata = db.findbyparams("customers", customer);
	
	if (!userdata || typeof userdata[0] == "undefined" || !userdata[0]) {
		// Ищем через другой провайдер
		try {
			userdata = db2.findbyparams("customers", customer);
			if (!userdata || typeof userdata[0] == "undefined" || !userdata[0]) {
				throw new Error();
			}
		} catch (e) {
			return {
				"success": false,
				"message": "Пользователь не найден"
			};
		}
	}

	return {
		"success": true,
		"customer": JSON.stringify(userdata[0])
	};
}
