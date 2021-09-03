/**
 * Фоновая задача для повторной отправки get запросов в Электронный инспектор
 */
function autosendrequestget(){
	return plugins.callAsShadowTask(
		"/plugins/nbdlogicplugin/auto_send_get_request_to_electronic_inspector",
		"post",
		null,
		null
	);
}