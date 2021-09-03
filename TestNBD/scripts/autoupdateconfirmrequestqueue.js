function autoupdateconfirmrequestqueue(){
    return plugins.callAsShadowTask(
		"/plugins/nbdlogicplugin/autoupdateconfirmrequestqueue",
		"post",
		null,
		null
	);
}