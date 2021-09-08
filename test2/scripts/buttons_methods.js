// Взятие заявления в работу
function take_application_to_work(params) {
	return plugins.callAsMethod(
		String().concat("/plugins/licenselogicplugins/takeapplicationtowork/", params.recid),
		"post",
		null,
		null
	);
}

// Регистрация заявления
function register_application(params) {
	return plugins.callAsMethod(
		String().concat("/plugins/licenselogicplugins/registerapplication/"),
		"post",
		params,
		null
	);
}

// Формирование внутреннего документа
function get_inner_document(params) {
	return plugins.callAsMethod(
		String().concat("plugins/licenselogicplugins/get_inner_document_dynamic_form_methods/process_data_for_form"),
		"post",
		params,
		null
	);
}

// Формирование внутреннего документа МКД
function get_inner_document_mkd(params) {
	return plugins.callAsMethod(
		String().concat("plugins/licenselogicplugins/get_inner_document_mkd_dynamic_form_methods/process_data_for_form"),
		"post",
		params,
		null
	);
}

// Отказать в предоставлении услуги(taxi)
function refuse_permission_issue_taxi(params) {
	return plugins.callAsMethod(
		String().concat("/plugins/licenselogicplugins/refusal_permission_issue_taxi_form_methods/process_data_for_form"),
		"post",
		params,
		null
	);
}

// Отказать в рассмотрени документов (МКД)
function refuse_to_consider_mkd_service_documents(params) {
	return plugins.callAsMethod(
		String().concat("/plugins/licenselogicplugins/refusal_to_consider_mkd_service_documents/process_data_for_form"),
		"post",
		params,
		null
	);
}

/**
 * Отказ в обработке заявления
 * @param {*} params 
 */
function reject_documents_processing(params) {

	return plugins.callAsMethod(
		String().concat("/plugins/licenselogicplugins/refusal_to_consider_other_services/process_data_from_form"),
		"post",
		params,
		null
	);
}

/**
 * Вызов плагина в рабочем процессе reject_documents_processing
 * @param {*} params Параметры от первого шага процесса
 */
function call_reject_documents_processing(params) {

	if (isEmptyOrNullArray(params.recordIdList)) {
		return badResp("Не удалось установить идентификатор записи, для которой вызывался метод.")
	}

	var body = { recid: params.recordIdList[0], files_for_sign: params.data  };
	return plugins.callAsMethod(String().concat("/plugins/licenselogicplugins/reject_document_sending"), "post", body);
}

/**
 * Отправка подписанных документов чререз таблицу "Внутренние документы (приказы)"
 * @param {*} params Параметры от первого шага процесса
 */
 function call_reject_documents_processing_for_inner_docs(params) {

	if (isEmptyOrNullArray(params.recordIdList)) {
		return badResp("Не удалось установить идентификатор записи, для которой вызывался метод.")
	}

	// работаем только с одним конкретным документом 
	var innerDocRecId = params.recordIdList[0];

	// достаем записи из таблицы "Внутренние документы (приказы)"
	var innerDocRecs = db.findbyparams('internal_documents_orders', {
		recid: innerDocRecId
	});
	if (isEmptyOrNullArray(innerDocRecs)) {
		return badResp("Не удалось получить запись таблицы 'Внутренние документы (приказы)' для подписи");
	}
	var innerDocRec = innerDocRecs[0];

	// достаем связанное заявление
	var applications = db.findbyparams('service_applications', {
		recid: innerDocRec.application_number
	});
	applicationId = applications[0].recid;
	if (applicationId === undefined) {
		return badResp("Не удалось получить заявление, связанное с данным внутренним документом");
	}

	// Отправляем в плагин ид заявления, к которому привязаны документы и список документов
	var body = { recid: applicationId, files_for_sign: params.data };

	// узнаем статус заявления
	var applicationStatuses = db.findbyparams('application_statuses', {
		recid: applications[0].application_status
	});
	if (isEmptyOrNullArray(applicationStatuses)) {
		return badResp("Не удалось получить статус заявления, связанного с документом");
	}
	var applicationStatus = applicationStatuses[0];

	switch (applicationStatus.recname.trim().toLowerCase()) {
		case "Ожидается подпись руководителя для уведомления об устранении замечаний".toLowerCase():
			return plugins.callAsMethod(String().concat("/plugins/licenselogicplugins/reject_document_sending"), "post", body);
		  	break;
		case "Ожидается подпись руководителя для уведомления об отказе в предоставлении услуги".toLowerCase():
			return plugins.callAsMethod(String().concat("/plugins/licenselogicplugins/reject_document_sending"), "post", body);
			break;
		case "Внесена запись в реестр лицензий".toLowerCase():
			return plugins.callAsMethod(String().concat("/plugins/licenselogicplugins/license_discharge/send_discharge_to_applicant"), "post", body);
		  	break;
	}

	return badResp("При статусе " + applicationStatus.recname + " нельзя отправить комментарий в ЛК заявителя"); 
}

/**
 * Подготовка файлов для отправки комментария в ЛК заявителя
 */
function get_comments_documents_for_sign(params) {
	
	if (isEmptyOrNullArray(params.recordIdList)) {

		return {
			success: false,
			message: "Не получено Ид записи",
			data: null
		}
	}

	// работаем только с одним конкретным заявлением 
	var applicationId = params.recordIdList[0];

	// достаем тип документа - Уведомление в ЛК заявителя
	var docType = db.findbyparams('document_types', {
		recname: 'Уведомление в ЛК заявителя'
	});
	if (docType[0].recid === undefined) {
		return badResp("Не удалось получить статус комментария в личный кабинет 'Отказано в предоставлении услуги'");
	}
	docType = docType[0];

	// достаем записи из таблицы "Внутренние документы (приказы)" для отказа
	var comments_docs = db.findbyparams('internal_documents_orders', {
		application_number: applicationId,
		document_type: docType.recid 
	});
	if (isEmptyOrNullArray(comments_docs)) {
		return badResp("Не удалось получить файлы из записей таблицы 'Внутренние документы (приказы)' для подписи");
    }
	
	// достаем файлы на подпись
	var attachedFilesIds = [];
	var filesNames = [];
	
	comments_docs.forEach(function (comment_docs) {

		let attachedFiles = getattachedfilesincolumn("internal_documents_orders", "document", comment_docs.recid);
		if (!isEmptyOrNullArray(attachedFiles)) {

			if (Array.isArray(attachedFiles)) {

				attachedFiles.forEach(function (doc) {

					if (doc.recId != null) {

						// берем ид файла
						attachedFilesIds.push(doc.recId);
						
						// берем имя файла, если такого нету
						if (filesNames.indexOf(doc.recName) < 0) {
							filesNames.push(doc.recName)
						}
					}
				})
			}
		}
	});

	return {
		success: true,
		message: String().concat("Подписываемые файлы: ", filesNames.join(', ')),
		data: attachedFilesIds
	}
}

/**
 * Отказать в предоставлении услуги
 * @param {*} params 
 */
function reject_service_provide(params) {
	
	return plugins.callAsMethod(
		String().concat("/plugins/licenselogicplugins/refusal_to_consider_other_services/process_data_from_form"),
		"post",
		params,
		null
	);
}

function get_params_from_dynamic_form(params){
	return {
		success: true,
		message: "ok"
	}
}

//Метод наполнения реестра лицензий из .csv файла
function fill_license_register(params){
    return plugins.callAsMethod("/plugins/licenselogicplugins/filllicenseregister", "post", params);
}

//Метод наполнения реестра лицензий алкоголя из .csv файла
function fill_alcohol_license_register(params){
    return plugins.callAsMethod("/plugins/licenselogicplugins/fill_alcohol_license_register/", "post", params);
}

/**
 * Отправка промежуточного комментария в ЛК заявителя
 * @param {*} params 
 */
function send_comment_to_applicant_account(params) {

	// Валидация пришедших параметров
	if (isEmptyOrNullArray(params.comment)) {
		return badResp("Комментарий не может быть пустым")
	}
	return plugins.callAsMethod("/plugins/licenselogicplugins/interimnotificationtoapplicantpersonalaccount", "post", params);
}

/**
 * Подготовка файлов выписки для отправки заявителю в рабочем процессе send_discharge_to_applicant
 * @param {*} params 
 */
function prepare_discharge_files_for_sending(params){
	if(isEmptyOrNullArray(params.recordIdList)){
		return badResp("Идентификатор текущей записи пустой")
	}
	var recid = params.recordIdList[0];
	
	var attachedFiles = getattachedfilesincolumn("service_applications", "generated_license_files", recid);

	if(isEmptyOrNullArray(attachedFiles)){
		return badResp("Не найдено файлов выписки для подписания")
	}

	var attachedFilesIds = [];
	for(var i = 0; i < attachedFiles.length; i++){
		var attachedFile = attachedFiles[i];
		attachedFilesIds.push(attachedFile.recId);
	}

	return {
		success: true,
		message: String().concat("Количество файлов для подписи: ", attachedFilesIds.length),
		data: attachedFilesIds
	}
}

/**
 * Отправка подписанных файлов выписки по алкоголю заявителю
 * @param {*} params 
 */
function send_discharge_to_applicant(params){
	if(isEmptyOrNullArray(params.recordIdList)){
		return badResp("Идентификатор текущей записи пустой")
	}
	var body = { recid: params.recordIdList[0], files_for_sign: params.data  };
	return plugins.callAsMethod("/plugins/licenselogicplugins/license_discharge/send_discharge_to_applicant", "post", body);
}

/** todo: проверить используется ли, если нет, то удалить
 * Отправка подписанных файлов измененной выписки заявителю
 * @param {*} params 
 */
function send_changed_discharge_to_applicant(params){
	if(isEmptyOrNullArray(params.recordIdList)){
		return badResp("Идентификатор текущей записи пустой")
	}
	var recid = params.recordIdList[0];
	return plugins.callAsMethod(String().concat("/plugins/licenselogicplugins/change_license_dynamic_form_methods/send_discharge_to_applicant/", recid), "post", params);
}


/**
 * 
 * @param {*} params 
 */
function foo(params){

	return {
		showMessage: false,
		success: true,
		message: "",
		data: params
	};
}

function create_service_application_getrecord(params) {
	return {
		success: true,
		message: "",
		data: null,
		showMessage: false
	};
}


function change_license_check(data) {	

	// если прошлая форма - изменение лицензии лома
	if (data.old.change_license_form) {

		let formData = data.old.change_license_form.data;

		// пользователь выбрал отмену
		if (data.reject) {
			return {
				success: true,
				data: formData,
				closeForm: true,
				showMessage: false
			}
		}
		formData.responsibility_taken = true; // флаг о том, что пользователь не отказался вносить изменения
		
		return plugins.callAsMethod(
			String().concat("/plugins/licenselogicplugins/change_license_dynamic_form_methods/process_change_license_form"),
			"post",
			formData,
			null
		);
	}

	// если прошлая форма - изменение лицензии алкоголя
	else if (data.old.change_license_alcohol_form) {
		let formData = data.old.change_license_alcohol_form.data;

		// пользователь выбрал отмену
		if (data.reject) {
			return {
				success: true,
				data: formData,
				closeForm: true,
				showMessage: false
			}
		}
		formData.responsibility_taken = true; // флаг о том, что пользователь не отказался вносить изменения

		return plugins.callAsMethod(
			String().concat("/plugins/licenselogicplugins/change_license_alcohol_dynamic_form_methods/process_change_license_alcohol_form"),
			"post",
			formData,
			null
		);
	}

	// если прошлая форма - изменение разрешения такси
	else if (data.old.change_license_taxi_form) {
		let formData = data.old.change_license_taxi_form.data;

		// пользователь выбрал отмену
		if (data.reject) {
			return {
				success: true,
				data: formData,
				closeForm: true,
				showMessage: false
			}
		}
		formData.responsibility_taken = true; // флаг о том, что пользователь не отказался вносить изменения

		return plugins.callAsMethod(
			String().concat("/plugins/licenselogicplugins/change_license_taxi_dynamic_form_methods/process_change_license_form"),
			"post",
			formData,
			null
		);
	}

	// если прошлая форма - изменение лицензии МКД
	else if (data.old.change_license_mkd_form) {
		let formData = data.old.change_license_mkd_form.data;

		// пользователь выбрал отмену
		if (data.reject) {
			return {
				success: true,
				data: formData,
				closeForm: true,
				showMessage: false
			}
		}
		formData.responsibility_taken = true; // флаг о том, что пользователь не отказался вносить изменения

		return plugins.callAsMethod(
			String().concat("/plugins/licenselogicplugins/change_mkd_license_dynamic_form_methods/process_data_for_form"),
			"post",
			formData,
			null
		);
	}

	// неизвестна прошлая динформа
	else {

		return {
			success: false,
			message: "Ошибка: не удалось найти форму для перехода",
			data: null,
			closeForm: true
		}; 
    }
}

/**
 * Подготовка файлов для отправки комментария в ЛК заявителя
 */
 function get_comments_documents_for_inner_docs_for_sign(params) {
	
	if (isEmptyOrNullArray(params.recordIdList)) {

		return {
			success: false,
			message: "Не получено Ид записи",
			data: null
		}
	}

	// работаем только с одним конкретным документом 
	var innerDocRecId = params.recordIdList[0];

	// достаем записи из таблицы "Внутренние документы (приказы)"
	var innerDocRecs = db.findbyparams('internal_documents_orders', {
		recid: innerDocRecId
	});
	if (isEmptyOrNullArray(innerDocRecs)) {
		return badResp("Не удалось получить запись таблицы 'Внутренние документы (приказы)' для подписи");
    }
	var innerDocRec = innerDocRecs[0];

	// достаем файлы на подпись
	var attachedFilesIds = [];
	var filesNames = [];

	let attachedFiles = getattachedfilesincolumn("internal_documents_orders", "document", innerDocRec.recid);
	if (!isEmptyOrNullArray(attachedFiles)) {

		if (Array.isArray(attachedFiles)) {

			attachedFiles.forEach(function (doc) {

				if (doc.recId != null) {

					// берем ид файла
					attachedFilesIds.push(doc.recId);
					
					// берем имя файла, если такого нету
					if (filesNames.indexOf(doc.recName) < 0) {
						filesNames.push(doc.recName)
					}
				}
			})
		}
	}

	return {
		success: true,
		message: String().concat("Подписываемые файлы: ", filesNames.join(', ')),
		data: attachedFilesIds
	}
}

/**
 * Вызов плагина для проверки подписи внутренних документов
 * @param {*} params Параметры от первого шага процесса
 */
 function call_check_inner_docs_sign_processing(params) {

	// работаем только с одним конкретным документом 
	var innerDocRecId = params.recordIdList[0];

	// достаем записи из таблицы "Внутренние документы (приказы)"
	var innerDocRecs = db.findbyparams('internal_documents_orders', {
		recid: innerDocRecId
	});
	if (isEmptyOrNullArray(innerDocRecs)) {
		return badResp("Не удалось получить запись таблицы 'Внутренние документы (приказы)' для подписи");
	}
	var innerDocRec = innerDocRecs[0];

	// достаем связанное заявление
	var applications = db.findbyparams('service_applications', {
		recid: innerDocRec.application_number
	});
	applicationId = applications[0].recid;
	if (applicationId === undefined) {
		return badResp("Не удалось получить заявление, связанное с данным внутренним документом");
	}

	// Отправляем в плагин ид заявления, к которому привязаны документы и список документов
	var body = { recid: applicationId, files_for_sign: params.data };

	return plugins.callAsMethod(
		String().concat("/plugins/licenselogicplugins/inner_document/check_signs"),
		"post",
		body,
		null
	);
}

// Операции с пользователями решения
function get_user(data) {

	var userRecid = data.recid;

	return plugins.callAsMethod(
		String().concat("/plugins/licenselogicplugins/users/", userRecid),
		"get",
		null,
		null
	);
}

function put_user(data) {

	var userRecid = data.recid;

	return plugins.callAsMethod(
		String().concat("/plugins/licenselogicplugins/users/", userRecid),
		"put",
		data,
		null
	);
}

// Операции с группами пользователей

// Получение данных возможных разрешений и ограничений групп
function get_user_groups_politics(data) {

	var groupRecid = data.recid;

	return plugins.callAsMethod(
		"/plugins/licenselogicplugins/groups/permissions_and_restrictions/",
		"get",
		null,
		null
	);
}

// Получение данных разрешений и ограничений группы
function get_user_group(data) {

	var groupRecid = data.recid;

	return plugins.callAsMethod(
		String().concat("/plugins/licenselogicplugins/groups/permissions_and_restrictions/", groupRecid),
		"get",
		null,
		null
	);
}

// Внесение изменений в разрешения и ограничения группы
function put_user_group(data) {

	var groupRecid = data.recid;

	return plugins.callAsMethod(
		String().concat("/plugins/licenselogicplugins/groups/permissions_and_restrictions/", groupRecid),
		"put",
		data,
		null
	);
}



// Получить данные для предзаполнения формы создания начисления
function get_data_for_create_accrual_form(data) {

	var groupRecid = data.recid;

	return plugins.callAsMethod(
		String().concat("/plugins/licenselogicplugins/payment/", groupRecid, "/data_for_form"),
		"get",
		data,
		null
	);
}

// Отправить начисление
function send_accrual(data) {

	var groupRecid = data.old.chose_payment_for_acknowledge_form.recid;

	data = data.old.chose_payment_for_acknowledge_form

	return plugins.callAsMethod(
		String().concat("/plugins/licenselogicplugins/payment/", groupRecid, "/send_request_about_confirmation_to_gisgmp"),
		"post",
		data,
		null
	);
}