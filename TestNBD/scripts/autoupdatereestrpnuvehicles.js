/**
 * Фоновая задача по автообновлению записей в таблице reestr_pnu_vehicles
 */
 function autoupdatereestrpnuvehicles(){
	return plugins.callAsShadowTask(
		"/plugins/nbdlogicplugin/autoupdatereestrpnuvehicles",
		"post",
		null,
		null
	);
}