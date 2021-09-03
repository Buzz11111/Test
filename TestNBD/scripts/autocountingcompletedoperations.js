/**
 * Фоновая задача по заполнению таблицы подсчета выполненных операций
 */
 function autocountingcompletedoperations(){
	return plugins.callAsShadowTask(
		"/plugins/nbdlogicplugin/autocountingcompletedoperations",
		"post",
		null,
		null
	);
}