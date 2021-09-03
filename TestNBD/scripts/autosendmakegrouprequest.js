/**
 * Фоновая задача по автоотправке запросов make_group в блокчейн
 */
 function autosendmakegrouprequest(){
	return plugins.callAsShadowTask(
		"/plugins/nbdlogicplugin/autosendmakegrouprequest",
		"post",
		null,
		null
	);
}