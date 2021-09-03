// Сохранение причины утилизации
function save_dictionary_disposal_reasons(params){
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
	//Вызываем метод из плагина
	var res = plugins.callAsMethod("/plugins/nbdlogicplugin/savedisposalreason", "post", params.selectedRecords[0], null);
	return res;
}