/**
 * Фоновая задача для автогенерации баркодов
 */
function autogeneratebarcodes(){
	return plugins.callAsShadowTask(
		"/plugins/nbdlogicplugin/autogeneratebarcodes",
		"post",
		null,
		null
	);
}