/**
 * Фоновая задача по автопроставлению флага учета изготовления
 */
 function autoisregistratredinrzd(){
	return plugins.callAsShadowTask(
		"/plugins/nbdlogicplugin/autoisregistratredinrzd",
		"post",
		null,
		null
	);
}