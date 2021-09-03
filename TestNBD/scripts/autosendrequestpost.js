/**
 * Фоновая задача для повторной отправки запросов в Электронный инспектор
 */
function autosendrequestpost(){
	return plugins.callAsShadowTask(
		"/plugins/nbdlogicplugin/auto_send_post_request_to_electronic_inspector",
		"post",
		null,
		null
	);
}