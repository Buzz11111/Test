// Метод записи сообщений в таблицу логов
function logs(title, message) {
	if (typeof message == "undefined") {
		message = "Without message";
	}
	// Если при записях в лог произошла ошибка, то не обращаем внимания, чинить нет смысла. 
	try {
		db.insert("logs", { "recname": title, "recdescription": message });
		return true;
	} catch (ex) {
		return ex;
	}
}

// Подготовка объекта положительного ответа
function ok(message, data) {
	if (typeof data == "undefined") {
		data = "";
	}

	return {
		"success": true,
		"message": message,
		"data": data
	};
}

// Подготовка объекта негативного ответа
function fail(message, data) {
	if (typeof data == "undefined") {
		data = "";
	}

	return {
		"success": false,
		"message": message,
		"data": data
	};
}

/// Обновление данных уведомления 
function update_notif_status(notif) {
	// Устанавливаем дату получения если финальный статус
	if (notif.notificationstatus == 60) {
		notif.dateofreceiving = new Date().toISOString();
	}

	var res = true;
	res = res && db.update("gos_notifications", notif);
	if (!res) { return false; }
	var table = get_table(notif.usertype);
	res = true;
	res = res && db.update(table, { "recid": notif.reccode, "notificationstatus": notif.notificationstatus, "recupdated": null });
	if (!res) { return false; }
	return true;
}

// Получение таблицы уведомления по типу пользователя
function get_table(customertype) {
	switch (customertype) {
		case 1:
			return "to_indiv";
		case 2:
			return "to_ip";
		case 3:
			return "to_entity";
		case 4:
			return "to_foreigner";
		case 5:
			return "to_any";
	}
	return false;
}