/**
 * Фоновая задача по удалению старых логов
 */
function cleanuplogstask() {
	try {
		var logObjectName = "cleanuplogstask";
		event.log(logObjectName, null, "Получена ФЗ по очистке логов", 1, "Начинаем очистку логов");
		// Получаем из настроек значение периода хранения логов
		var periodDays = settings.get("logstorageperioddays");
		var periodHours = settings.get("logstorageperiodhours");
		var periodDaysErr = settings.get("errorstorageperioddays");
		var periodHoursErr = settings.get("errorstorageperiodhours");
		// Очищаем логи
		var result = cleanuplogs("public.rdev___events_log", periodDays, periodHours, periodDaysErr, periodHoursErr);

		return {
			success: true,
			message: "Фоновая задача успешно завершена. Логи очищены",
			data: null
		};
	} catch (e) {
		return {
			success: false,
			message: "Ошибка при выполнении фоновой задачи по очитке логов" + e,
			data: null
		};
	}
}