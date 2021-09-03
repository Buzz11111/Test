/**
 * Фоновая задача по автоподписанию УИНов из таблицы ke_numbers
 */
 function autosignkenumbers(){
	return plugins.callAsShadowTask(
		"/plugins/nbdlogicplugin/autosignuins",
		"post",
		null,
		null
	);
}