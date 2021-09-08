/**
 * Функция-обертка, которая конвертирует содержимое файла excel в json
 * @param {*} params содержит в себе:
 * @param fileContent - base64 файла
 */
function convert_excel_to_json(params) {
    try {
        var result = rdev.convertExcelToJson(params.fileContent);
        return result;
    } catch (ex) {
        return {
			success: false,
			message: "Ошибка: Не  удалось сконвертировать Excel файл в JSON",
            err: ex.message
		}; 
    }
}