var registration_reasons= {
    first_reason: "изготовление составной части",
    second_reason: "установка составной части на грузовой вагон",
    third_reason: "изготовление составной части; установка составной части на грузовой вагон"
}

// учет СЧ
function allow_key_element(params) {
    if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
    //Вызываем метод из плагина
    var res = plugins.callAsMethod("/plugins/nbdlogicplugin/allow_Key_element", "post", params, null);
	return res;
}

// учет СЧ массовый
function allow_key_element_array(params) {
    var user = getcurrentuser();
    //Валидация входящих параметров
    if(isEmptyString(params.output_application_number)){
        return badResp("Поле \"Номер исходящего\" не может быть пустым");
    }

    if(isEmptyString(params.output_application_date)){
        return badResp("Поле \"Дата исходящего\" не может быть пустым");
    } else {
        //Проверяем, что Дата исходящего была не позднее текущей даты
        var date = new Date();
        date.setHours(date.getUTCHours() + 3);
        date.setUTCHours(0, 0, 0, 0);
        var application_date = new Date(params.output_application_date);
        application_date.setHours(application_date.getUTCHours() + 3);
        application_date.setUTCHours(0, 0, 0, 0);
        if (application_date.getTime() > date.getTime()) {
            return badResp("\"Дата исходящего\" должна быть не позднее текущей даты.");
        }
    }

    if (ischeckfields()){
        if(isEmptyString(user.firstname)){
            return badResp("Заполните в профиле пользователя поле \"Имя\" ");
        }

        if(isEmptyString(user.lastname)){
            return badResp("Заполните в профиле пользователя поле \"Фамилия\" ");
        }

        if(isEmptyString(user.patronymic)){
            return badResp("Заполните в профиле пользователя поле \"Отчество\" ");
        }
        if(isEmptyString(user.email)){
            return badResp("Заполните в профиле пользователя поле \"Электронная почта\" ");
        }
    }
    
    var user_fullname = String().concat(user.lastname, " ", user.firstname, " ", user.patronymic);
    
    //Игнор СЧ с заявлениями на учет НЕ в финальном статусе
    var key_elements_without_applications = [];
    for(var i = 0; i < params.key_elements.length; i++){
        var key_element = params.key_elements[i];
        
        //Проверка наличия заявления у СЧ
        if(!isEmptyString(key_element.application_id)){
            var application = db.findbyrecid("reestr_applications_for_key_elements_registration", key_element.application_id);
            if(!isNullObject(application)){
                if(application.status != '56b4391b-82bc-42b5-a466-91d21db8022b'){
                    continue;
                }else{
                    key_elements_without_applications.push(key_element)
                }
            }else{
                key_elements_without_applications.push(key_element)
            }
        }else{
            key_elements_without_applications.push(key_element)
        }
    }

    params.key_elements = key_elements_without_applications;

    //Рассчет количества файлов в архиве
    var max_files_count = 3;
    
    //Рассчет количества чанков, на которые будет разбита выборка
    var chunks_count = 0;
    if(params.key_elements.length <= max_files_count){
        chunks_count = 1;
    }else{
        chunks_count = Math.ceil(params.key_elements.length / max_files_count);
    }

    //Разбиение записей на блоки
    var chunked_records = [];
    var last_index = 0;
    for(var i = 0; i < chunks_count; i++){
        var chunk = [];
        for(var j = 0; j < max_files_count; j++){
            if((last_index + 1) <= params.key_elements.length ){
                chunk.push(params.key_elements[last_index]);
                last_index = last_index + 1;
            }
        }
        if(chunk.length > 0){
            chunked_records.push(chunk);
        }
    }

    //Формирование json - файлов
    var formed_files = [];
    var reestr_applications_for_key_elements_registration_records = [];
    for(var i = 0; i < chunked_records.length; i++){
        var chunk = chunked_records[i];
        var files_in_chunk = [];

        var reestr_members_fields = db.findbyrecid("reestr_members", chunk[0].manufacturer_details);
        if(isEmptyString(reestr_members_fields.branding_code)){
            return badResp("Не удалось определить сокращенное наименование производителя");
        }

        //Создание записи на учет СЧ 
        var reestr_applications_for_key_elements_registration_data = {
			member: chunk[0].manufacturer_details,
            recname: String().concat(reestr_members_fields.unique_member_identifier, "-", get_autoincremented_idx("application_number").toString()),
            reason: registration_reasons.first_reason,
            reason1: true,
            count_ke_ce: chunk.length.toString(),
            fio: user_fullname,
            phone: user.phonenumber,
            status: null,
            output_application_number: params.output_application_number,
            output_application_date: params.output_application_date
        };

        
        var reestr_applications_for_key_elements_registration_record = db.insert("reestr_applications_for_key_elements_registration", reestr_applications_for_key_elements_registration_data);
        if(isNullObject(reestr_applications_for_key_elements_registration_record)){
            return badResp("Не удалось создать новое заявление");
        }
        reestr_applications_for_key_elements_registration_records.push(reestr_applications_for_key_elements_registration_record);
        //Массив идентификаторов СЧ в чанке
        var kes_in_chunk = [];

        for(var j = 0; j < chunk.length; j++){
            var record = chunk[j];

            //Проверка наличия заявления у СЧ
            if(!isEmptyString(record.application_id)){
                var application = db.findbyrecid("reestr_applications_for_key_elements_registration", record.application_id);
                if(!isNullObject(application)){
                    if(application.status != '56b4391b-82bc-42b5-a466-91d21db8022b'){
                        continue;
                    }
                }
            }

            //Получение УИН СЧ
            var ke_number = db.findbyrecid("ke_numbers", record.ke_number);
            if(isNullObject(ke_number)){
                return badResp("УИН СЧ не найден в системе");
            }

            if(!isEmptyString(record.billet_manufacturer_info)){
                var dictionary_billet_manufacturer_details_fields = db.findbyrecid("dictionary_billet_manufacturer_details", record.billet_manufacturer_info)
                if(!isEmptyOrNullArray(dictionary_billet_manufacturer_details_fields)){
                    var billet_manufacturer_info_name = dictionary_billet_manufacturer_details_fields.billet_manufacturer_name;
                } else {
                    return badResp("Значение поля \"Сведения об изготовителе заготовки\" не найдено в справочнике, проверьте параметр \"billet_manufacturer_info\"")
                }
            }

            //Получение файла с ЭП КЭ
            var attached_files = getattachedfileincolumn("reestr_key_elements", "key_element_passport_file", record.recid);
            if(isEmptyOrNullArray(attached_files)){
                return badResp("Файл ЭП СЧ отсутствует в карточке СЧ");
            }
            var attached_file = attached_files[0];
            var file_content_object = ParseFileToObject(attached_file.recId);
            if(!file_content_object.success){
                return badResp("Не удалось получить содержимое файла ЭП СЧ")
            }
            file_content_object = JSON.parse(file_content_object.data.toString());

            // Формирование json-файла
            var save_content_as_file_result = SaveContentAsFileAsync("reestr_applications_for_key_elements_registration", reestr_applications_for_key_elements_registration_records[i].recid, 
            "files", ke_number.recname, "json", JSON.stringify(file_content_object));

            // Формирование и запись наименование файла json
            var key_element_field = db.findbyrecid("reestr_key_elements", record.recid);
        
            key_element_field.file_name_in_archive = String().concat(ke_number.recname, ".json");
            var update_result = db.update("reestr_key_elements", key_element_field);
        
            if(!update_result){
                return badResp("Не удалось обновить запись заявления");
            }

            if(!save_content_as_file_result.success){
                for(var k = 0; k < reestr_applications_for_key_elements_registration_records.length; k++){
                    db.delete("reestr_applications_for_key_elements_registration", reestr_applications_for_key_elements_registration_records[k].recid);
                }
                return save_content_as_file_result;
            }
            files_in_chunk.push(save_content_as_file_result.data.result.recId);
            kes_in_chunk.push(record.recid);
            
        }
        var branding_code = db.findbyrecid("dictionary_branding_codes", reestr_members_fields.branding_code);
        if(isNullObject(branding_code)){
            return badResp("Код клеймения не найден в системе");
        }
        //Формирование заявления
        var title = "составных частей";
        var report_params = {
            ke_or_ce: title,
            reason_ke_ce: title,
            count_ke_ce_name: title,
            list_ke_ce_elements: title,
            full_name: reestr_members_fields.fullname,
            short_name: String().concat(branding_code.recname, ", ", branding_code.code),
            actual_adress: reestr_members_fields.actualadress,
            email: reestr_members_fields.email,
            inn: reestr_members_fields.inn,
            ogrn: reestr_members_fields.ogrn,
            reason: reestr_applications_for_key_elements_registration_record.reason,
            count_ke_ce: chunk.length.toString(),
            uin: record.numberke,
            name_element: record.key_element_code_calculated,
            fio: reestr_applications_for_key_elements_registration_record.fio,
            phone: reestr_applications_for_key_elements_registration_record.phone,
            output_application_number: reestr_applications_for_key_elements_registration_record.output_application_number,
            output_application_date: reestr_applications_for_key_elements_registration_record.output_application_date,
            key_element_recid: reestr_applications_for_key_elements_registration_records[i].recid
        };
        for (let k = 0; k < kes_in_chunk.length; k++) {
            var ke_in_chunk = kes_in_chunk[k];
            var key_element = db.findbyrecid("reestr_key_elements", ke_in_chunk);
        
            key_element.application_id = reestr_applications_for_key_elements_registration_record.recid;
            var update_res = db.update("reestr_key_elements", key_element);
            if(!update_res){
                return badResp("Не удалось обновить запись заявления");
            }
        }

        //Формирование и прикладывание извещения
        var add_notice_res = prepare_and_add_notice("reportnoticeforregistrationmultiplekeyelement", report_params, "notice_file", "reestr_applications_for_key_elements_registration", reestr_applications_for_key_elements_registration_record.recid, String().concat("Заявление на учет СЧ №", reestr_applications_for_key_elements_registration_record.recname.toString()));
        if(!add_notice_res.success){
            return badResp(add_notice_res.message)
        }
        reestr_applications_for_key_elements_registration_record.status = "c63d14c0-3464-4849-af6b-7446b4129dd9";
        reestr_applications_for_key_elements_registration_record.registered_entity_id = JSON.stringify(kes_in_chunk);
        reestr_applications_for_key_elements_registration_record.registered_entity_type = "key_elements_archive";
        
        var updres = db.update("reestr_applications_for_key_elements_registration", reestr_applications_for_key_elements_registration_record);
        if(!updres){
            return badResp("Не удалось обновить запись заявления");
        }
        formed_files.push(files_in_chunk);
    }

    //Упаковка в архив
    for(var i = 0; i < formed_files.length; i++){
        var files_in_chunk = formed_files[i];
        var packRes = PackFileToZipArchive(
            String().concat("Приложения к заявлению №", reestr_applications_for_key_elements_registration_records[i].recname.toString()), 
            "reestr_applications_for_key_elements_registration", 
            reestr_applications_for_key_elements_registration_records[i].recid, 
            "files", 
            files_in_chunk,
            false)

        if(!packRes.success){
            return packRes;
        }
        var packRes = PackFileToZipArchive(
            String().concat("Приложения к заявлению №", reestr_applications_for_key_elements_registration_records[i].recname.toString()), 
            "reestr_applications_for_key_elements_registration", 
            reestr_applications_for_key_elements_registration_records[i].recid, 
            "generated_application_file", 
            files_in_chunk,
            false)

        if(!packRes.success){
            return packRes;
        }
    }

    //Удаление файлов, из которых был собран архив
    for(var i = 0; i < formed_files.length; i++){
        var files_in_chunk = formed_files[i];
        for(var j = 0; j < files_in_chunk.length; j++){
            var delete_file_res = delete_files(files_in_chunk[j]);
            if(!delete_file_res.success){
                return delete_file_res;
            }
        }
    }

    //Простановка флага в записях с файлами
    for(var i = 0; i < chunked_records.length; i++){
        var chunk = chunked_records[i];
        for(var j = 0; j < chunk.length; j++){
            var chunk_record = db.findbyrecid("reestr_key_elements", chunk[j].recid);
            chunk_record.is_allow_key_element = true;
            db.update("reestr_key_elements", chunk_record);
        }
    }

    return successResp("Создано " + chunks_count + " заявлений на учет " + params.key_elements.length.toString() + " составных частей");
}

// Отправка в Росжелдор
function send_to_roszheldor(params) {
    var idsArr = JSON.stringify(params.recordIdList);
	var paramteres = {
		"recid_applications": idsArr
	}
	//Вызываем метод из плагина
    var res = plugins.callAsMethod("/plugins/nbdlogicplugin/send_to_roszheldor", "post", paramteres, null);
	return res;
}

/**
 * Отправка в Росжелдор(пакетная)
 * @param {*} params 
 */
function send_to_roszheldor_multiple(params){
    
   /*  var formed_applications = db.findbyparams("reestr_applications_for_key_elements_registration", {
        status: "c63d14c0-3464-4849-af6b-7446b4129dd9"
    });
    if(isEmptyOrNullArray(formed_applications)){
        return {
            success: true,
            message: "Не найдено заявлений для отправки в Росжелдор",
            data: []
        }
    } */

    var reestr_applications_for_key_elements_registration_records = params.recordIdList;
	var reestr_applications_for_key_elements_registration_arr = [];
	for (let j = 0; j < reestr_applications_for_key_elements_registration_records.length; j++) {
		var reestr_applications_for_key_elements_registration_record = db.findbyrecid("reestr_applications_for_key_elements_registration", reestr_applications_for_key_elements_registration_records[j]);
		reestr_applications_for_key_elements_registration_arr.push(reestr_applications_for_key_elements_registration_record);
	}
	
	/* var applications = db.findbyparams("rfid_request", {
		rfid_request_status: 5
	}) */
	if(isEmptyOrNullArray(reestr_applications_for_key_elements_registration_arr)){
		return {
			success: true,
			message: "Не найдено заявлений для подписи",
			data: []
		}
	}

    var sended_apps = 0;
    var errors = [];
    for(var i = 0; i < reestr_applications_for_key_elements_registration_arr.length; i++){
        var formed_application = reestr_applications_for_key_elements_registration_arr[i];
        var attached_files = getattachedfileincolumn("reestr_applications_for_key_elements_registration", "notice_file", formed_application.recid);
        if(isEmptyOrNullArray(attached_files)){
            continue;
        }
        var send_app = true;
        for(var j = 0; j < attached_files.length; j++){
            var attached_file = attached_files[j];
            if(attached_file.isVerify != true){
                send_app = false;
            }
        }
        if(send_app){
            var send_to_roszheldor_resp = send_to_roszheldor({
                recid: formed_application.recid
            });
            if(!send_to_roszheldor_resp.success){
                errors.push(send_to_roszheldor_resp.message)
            }else{
                sended_apps++;
            }
            
        }
    }
    if(isNotEmptyOrNullArray(errors)){
        var showerrorsfromarrayres = showerrorsfromarray(errors);
        var returnmessage = String().concat("В Росжелдор отправлено ", sended_apps.toString(), " заявлений, ошибки при отправке: ", showerrorsfromarrayres.message);
        if(sended_apps > 0){
            return {
                success: true,
                message: returnmessage,
                data: []
            }
        }else{
            return {
                success: false,
                message: returnmessage,
                data: []
            }
        }
        
    }

    return {
        success: true,
        message: String().concat("В Росжелдор отправлено ", sended_apps.toString(), " заявлений"),
        data: []
    }
}

// учет се
function allow_ce_element(params){
    if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
 //Вызываем метод из плагина
    var res = plugins.callAsMethod("/plugins/nbdlogicplugin/allow_assembly_unit", "post", params, null);
	return res;
}

// учет се массовый
function allow_ce_element_array(params){

	var user = getcurrentuser();
    //Валидация входящих параметров
    var fillingValidateErrors = [];
    if(isEmptyString(params.output_application_number)){
        fillingValidateErrors.push("\"Номер исходящего\"");
    }

    if(isEmptyString(params.output_application_date)){
        fillingValidateErrors.push("\"Дата исходящего\"");
    }

    if(isNotEmptyOrNullArray(fillingValidateErrors)){
        return badResp(fillingValidateErrors.length > 1 ? 
            String().concat("Поля ", fillingValidateErrors.join(", "), " не могут быть пустыми") : 
            String().concat("Поле ", fillingValidateErrors.join(", "), " не может быть пустым"));
    }

    //Проверяем, что Дата исходящего была не позднее текущей даты
    var date = new Date();
    date.setHours(date.getUTCHours() + 3);
    date.setUTCHours(0, 0, 0, 0);
    var application_date = new Date(params.output_application_date);
    application_date.setHours(application_date.getUTCHours() + 3);
    application_date.setUTCHours(0, 0, 0, 0);
    if (application_date.getTime() > date.getTime()) {
        return badResp("\"Дата исходящего\" должна быть не позднее текущей даты.");
    }

    if (ischeckfields()){
        var userValidateErrors = [];
        if(isEmptyString(user.firstname)){
            userValidateErrors.push("\"Имя\" ");
        }

        if(isEmptyString(user.lastname)){
            userValidateErrors.push("\"Фамилия\" ");
        }

        if(isEmptyString(user.patronymic)){
            userValidateErrors.push("\"Отчество\" ");
        }
        if(isEmptyString(user.email)){
            userValidateErrors.push("\"Электронная почта\" ");
        }
        if(isNotEmptyOrNullArray(userValidateErrors)){
            return badResp(userValidateErrors.length > 1? 
                String().concat("Заполните в профиле пользователя поля ", userValidateErrors.join(", ")) :
                String().concat("Заполните в профиле пользователя поле ", userValidateErrors.join(", ")) );
        }
    }

    //Игнор СЕ с заявлениями на учет НЕ в финальном статусе
    var nodes_without_applications = [];
    for(var i = 0; i < params.nodes.length; i++){
        var node = params.nodes[i];
        //Проверка наличия заявления у СЕ
        if(!isEmptyString(node.application_id)){
            var application = db.findbyrecid("reestr_applications_for_key_elements_registration", node.application_id);

            //Проверка дочерних СЕ с заявлениями на учет
            var child_nodes = db.findbyparams("reestr_ke_nodes",{
                parent_ke_node: node.recid
            });
            if(!isEmptyOrNullArray(child_nodes)){
                var has_not_final_application = false;
                for(var j = 0; j < child_nodes.length; j++){
                    var child_node = child_nodes[j];
                    if(!isEmptyString(child_node.application_id)){
                        var child_node_application = db.findbyrecid("reestr_applications_for_key_elements_registration", child_node.application_id);
                        if(!isNullObject(child_node_application)){
                            if(child_node_application.status != '56b4391b-82bc-42b5-a466-91d21db8022b'){
                                has_not_final_application = true;
                            }
                        }
                    }
                }
                if(has_not_final_application){
                    continue;
                }
            }

            //Проверка дочерних КЭ с заявлениями на учет
            var child_key_elements = db.findbyparams("reestr_key_elements",{
                ke_node: node.recid
            });
            if(!isEmptyOrNullArray(child_key_elements)){
                var has_not_final_application = false;
                for(var j = 0; j < child_key_elements.length; j++){
                    var child_key_element = child_key_elements[j];
                    if(!isEmptyString(child_key_element.application_id)){
                        var child_key_element_application = db.findbyrecid("reestr_applications_for_key_elements_registration", child_key_element.application_id);
                        if(!isNullObject(child_key_element_application)){
                            if(child_key_element_application.status != '56b4391b-82bc-42b5-a466-91d21db8022b'){
                                has_not_final_application = true;
                            }
                        }
                    }
                }
                if(has_not_final_application){
                    continue;
                }
            }

            //Проверка заявления родительского СЕ
            if(!isNullObject(application)){
                if(application.status != '56b4391b-82bc-42b5-a466-91d21db8022b'){
                    continue;
                }else{
                    nodes_without_applications.push(node); 
                }
            }else{
                nodes_without_applications.push(node); 
            }
        }else{
            nodes_without_applications.push(node); 
        }
    }
    params.nodes = nodes_without_applications;

    //Разбиение на чанки
    var max_elems_in_chunk = 2;
    var chunks_count = 0;
    //Вычисление количества чанков
    if(params.nodes.length > max_elems_in_chunk){
        chunks_count = Math.ceil(params.nodes.length / max_elems_in_chunk);
    }else{
        chunks_count = 1;
    }

    //Разбиение массива неучтенных узлов
    var not_allowed_nodes_chunked = [];
    var last_index = 0;
    for(var i = 0; i < chunks_count; i++){
        var chunk = [];
        for(var j = 0; j < max_elems_in_chunk; j++){
            if((last_index + 1) <= params.nodes.length){
                chunk.push(params.nodes[last_index]);
            }
            last_index = last_index + 1;
        }
        if(chunk.length > 0){
            not_allowed_nodes_chunked.push(chunk);
        }
    }

    var chunked_files_ids = []; 
	var reestr_applications_for_key_elements_registration_records = [];
    //Создание записей в реестр учета
    for(var i = 0; i < not_allowed_nodes_chunked.length; i++){
        var chunk = not_allowed_nodes_chunked[i];
        var files_ids_chunk = [];
        var records_in_chunk_ids = [];
        var application_recid = null;

        var key_elements_in_nodes = [];
        for(var j = 0; j < chunk.length; j++){
            var item = chunk[j];
            var key_elements = db.findbyparams("reestr_key_elements", {
                ke_node: item.recid,
                is_registratred_in_rzd: false
            })
            if(!isEmptyOrNullArray(key_elements)){
                key_elements_in_nodes = key_elements_in_nodes.concat(key_elements);
            }
        }
        
        var reestr_members_fields = db.findbyrecid("reestr_members", chunk[0].manufacturer_details);
        if(isEmptyString(reestr_members_fields.branding_code)){
            return badResp("Не удалось определить сокращенное наименование производителя");
        }
        var branding_code = db.findbyrecid("dictionary_branding_codes", reestr_members_fields.branding_code);

        var user_fullname = String().concat(user.lastname, " ", user.firstname, " ", user.patronymic);
        var reestr_applications_for_key_elements_registration_data = {
            member: chunk[0].manufacturer_details,
            recname: String().concat(reestr_members_fields.unique_member_identifier, "-", get_autoincremented_idx("application_number").toString()),
            reason: registration_reasons.first_reason,
            reason1: true,
            count_ke_ce: chunk.length + key_elements_in_nodes.length,
            fio: user_fullname,
            phone: user.phonenumber,
            status: null,
            output_application_number: params.output_application_number,
            output_application_date: params.output_application_date
        }
    
        var reestr_applications_for_key_elements_registration_record = db.insert("reestr_applications_for_key_elements_registration", reestr_applications_for_key_elements_registration_data);
        if(isNullObject(reestr_applications_for_key_elements_registration_record)){
            return badResp("Не удалось создать новое заявление");
        }
        reestr_applications_for_key_elements_registration_records.push(reestr_applications_for_key_elements_registration_record);
        var accepted_assembly_units_uin_array = [];
        //Создание извещений
        for(var j = 0; j < chunk.length; j++){
            accepted_assembly_units_uin_array.push(chunk[j].unique_number);
            chunk[j].application_recid = reestr_applications_for_key_elements_registration_record.recid;

          
        }
        //var accepted_assembly_units_uin = accepted_assembly_units_uin_array.join();
        not_allowed_nodes_chunked[i] = chunk;
        for (let k = 0; k < chunk.length; k++) {
            var ke_in_chunk = chunk[k];
            var key_element = db.findbyrecid("reestr_ke_nodes", ke_in_chunk.recid);
           
            key_element.application_id = reestr_applications_for_key_elements_registration_record.recid;
            var update_res = db.update("reestr_ke_nodes", key_element);
           
            if(!update_res){
                return badResp("Не удалось обновить запись заявления");
            }
        }

        for(var j = 0; j < chunk.length; j++){
            //Проверка наличия заявления у СЕ
            if(!isEmptyString(chunk[j].application_id)){
                var application = db.findbyrecid("reestr_applications_for_key_elements_registration", chunk[j].application_id);
                if(!isNullObject(application)){
                    if(application.status != '56b4391b-82bc-42b5-a466-91d21db8022b'){
                        continue;
                    }
                }
            }
            //Получение УИН СЕ
            var ke_number = db.findbyrecid("ke_numbers", chunk[j].unique_number_relation);
            if(isNullObject(ke_number)){
                return badResp("УИН СЧ не найден в системе");
            }

            var attached_files = getattachedfileincolumn("reestr_ke_nodes", "node_passport_file", chunk[j].recid);
            if(isEmptyOrNullArray(attached_files)){
                return badResp("Файл ЭП СЕ отсутствует в карточке СЕ");
            }
            var attached_file = attached_files[0];
            var file_content_object = ParseFileToObject(attached_file.recId);
            if(!file_content_object.success){
                return badResp("Не удалось получить содержимое файла ЭП СЧ")
            }
            file_content_object = JSON.parse(file_content_object.data.toString());

            // Формирование json-файла
            var save_content_as_file_result = SaveContentAsFileAsync(
                "reestr_applications_for_key_elements_registration", 
                chunk[j].application_recid, 
                "files", 
                "assembly_unit" + j.toString(), 
                "json", 
                JSON.stringify(file_content_object)
                );

            if(!save_content_as_file_result.success){
                return save_content_as_file_result;
            }

            // Формирование и запись наименование файла json
            var reestr_ke_node_field = db.findbyrecid("reestr_ke_nodes", chunk[j].recid);
           
            reestr_ke_node_field.file_name_in_archive = String().concat(ke_number.recname, ".json");
            var update_result = db.update("reestr_ke_nodes", reestr_ke_node_field);
           
            if(!update_result){
                return badResp("Не удалось обновить запись заявления");
            }

            //Получение ЭП СЧ неучтенных дочерних СЧ
            var child_key_elements = db.findbyparams("reestr_key_elements", {
                ke_node: chunk[j].recid
            });
            if(isEmptyOrNullArray(child_key_elements)){
                child_key_elements = [];
            }

            for(var a = 0; a < child_key_elements.length; a++){
                var child_key_element = child_key_elements[a];
                if(child_key_element.is_registratred_in_rzd != true){
                    var child_key_element_passport_files = getattachedfileincolumn("reestr_key_elements", "key_element_passport_file", child_key_element.recid);
                    if(isEmptyOrNullArray(child_key_element_passport_files)){
                        return badResp("ЭП дочернего неучтенного СЧ не найден в системе");
                    }
                    var child_key_element_passport_file = child_key_element_passport_files[0];
                    var child_key_element_passport_file_content = ParseFileToObject(child_key_element_passport_file.recId);
                    if(!child_key_element_passport_file_content.success){
                        return badResp("Не удалось получить содержимое файла ЭП дочернего неучтенного СЧ");
                    }

                    //Получение записи УИН для дочернего КЭ
                    var child_key_element_ke_number = db.findbyrecid("ke_numbers", child_key_element.ke_number);
                    if(isNullObject(child_key_element_ke_number)){
                        return badResp("Не удалось получить УИН дочернего неучтенного КЭ");
                    }

                    //Прикладывание файлов
                    var save_child_key_element_content_as_file_result = SaveContentAsFileAsync("reestr_applications_for_key_elements_registration", chunk[j].application_recid, "generated_application_file", child_key_element_ke_number.recname, "json", JSON.stringify(JSON.parse(child_key_element_passport_file_content.data.toString())))
                    if(!save_child_key_element_content_as_file_result.success){
                        return save_child_key_element_content_as_file_result;
                    }

                    files_ids_chunk.push(save_child_key_element_content_as_file_result.data.result.recId);
                }
            }

            //Получение ЭП СЕ неучтенных дочерних СЕ
            var child_nodes = db.findbyparams("reestr_ke_nodes", {
                assembly_element_type: "62b3559e-10da-4189-8b25-d558ba451ac8",
                parent_ke_node: chunk[j].recid
            });
            if(isEmptyOrNullArray(child_nodes)){
                child_nodes = [];
            }

            for(var a = 0; a < child_nodes.length; a++){
                var child_node = child_nodes[a];
                if(child_node.is_registratred_in_rzd != true){
                    var child_node_passport_files = getattachedfileincolumn("reestr_ke_nodes", "node_passport_file", child_node.recid);
                    if(isEmptyOrNullArray(child_node_passport_files)){
                        return badResp("ЭП дочернего неучтенного СЕ не найден в системе");
                    }
                    var child_node_passport_file = child_node_passport_files[0];
                    var child_node_passport_file_content = ParseFileToObject(child_node_passport_file.recId);
                    if(!child_node_passport_file_content.success){
                        return badResp("Не удалось получить содержимое файла ЭП дочернего неучтенного СЕ");
                    }

                    //Получение записи УИН для дочернего СЕ
                    var child_node_ke_number = db.findbyrecid("ke_numbers", child_node.unique_number_relation);
                    if(isNullObject(child_node_ke_number)){
                        return badResp("Не удалось получить УИН дочернего неучтенного СЕ");
                    }

                    //Прикладывание файлов
                    var save_child_node_content_as_file_result = SaveContentAsFileAsync("reestr_applications_for_key_elements_registration", chunk[j].application_recid, "generated_application_file", child_node_ke_number.recname, "json", JSON.stringify(JSON.parse(child_node_passport_file_content.data.toString())))
                    if(!save_child_node_content_as_file_result.success){
                        return save_child_node_content_as_file_result;
                    }

                    files_ids_chunk.push(save_child_node_content_as_file_result.data.result.recId);
                }
            }

            files_ids_chunk.push(save_content_as_file_result.data.result.recId);
            records_in_chunk_ids.push(chunk[j].recid);
            application_recid = chunk[j].application_recid;
        }

        var title = "сборочных единиц";
            
            var report_params = {
                ke_or_ce: title,
                reason_ke_ce: title,
                count_ke_ce_name: title,
                list_ke_ce_elements: title,
                full_name: reestr_members_fields.fullname,
                short_name: String().concat(branding_code.recname, ", ", branding_code.code),
                actual_adress: reestr_members_fields.actualadress,
                email: reestr_members_fields.email,
                inn: reestr_members_fields.inn,
                ogrn: reestr_members_fields.ogrn,
                reason: reestr_applications_for_key_elements_registration_record.reason,
                count_ke_ce: chunk.length.toString(),
                fio: reestr_applications_for_key_elements_registration_record.fio,
                phone: reestr_applications_for_key_elements_registration_record.phone,
                output_application_number: reestr_applications_for_key_elements_registration_record.output_application_number,
                output_application_date: reestr_applications_for_key_elements_registration_record.output_application_date,
                application_recid: reestr_applications_for_key_elements_registration_record.recid
            };
            
            //Формирование и прикладывание извещения
            var add_notice_res = prepare_and_add_notice("reportnoticeforregistrationmultipleassemblyunit", report_params, "notice_file", "reestr_applications_for_key_elements_registration", reestr_applications_for_key_elements_registration_record.recid, String().concat("Заявление на учет СЕ №", reestr_applications_for_key_elements_registration_record.recname.toString()));
            if(!add_notice_res.success){
                return badResp(add_notice_res.message)
            }

            chunked_files_ids.push(files_ids_chunk);

        var reestr_applications_for_key_elements_registration_record = db.findbyrecid("reestr_applications_for_key_elements_registration", application_recid);
        reestr_applications_for_key_elements_registration_record.status = "c63d14c0-3464-4849-af6b-7446b4129dd9";
        reestr_applications_for_key_elements_registration_record.registered_entity_id = JSON.stringify(records_in_chunk_ids);
        reestr_applications_for_key_elements_registration_record.registered_entity_type = "assembly_units_archive";

        var updres = db.update("reestr_applications_for_key_elements_registration", reestr_applications_for_key_elements_registration_record);
        if(!updres){
            return badResp("Не удалось обновить запись заявления");
        }
    }
    


    //Упаковка файлов в архив и удаление файлов, из которых архив был собран
    for(var i = 0; i < chunked_files_ids.length; i++){
        var chunk = chunked_files_ids[i];
        var packRes = PackFileToZipArchive(
            String().concat("Приложения к заявлению №", reestr_applications_for_key_elements_registration_records[i].recname.toString()),
            "reestr_applications_for_key_elements_registration", 
            not_allowed_nodes_chunked[i][0].application_recid, 
            "files", 
            chunk,
            false)
            
        if(!packRes.success){
            return packRes;
        }
        var packRes = PackFileToZipArchive(
           String().concat("Приложения к заявлению №", reestr_applications_for_key_elements_registration_records[i].recname.toString()),  
            "reestr_applications_for_key_elements_registration",
            not_allowed_nodes_chunked[i][0].application_recid, 
            "generated_application_file", 
            chunk,
            false)

        if(!packRes.success){
            return packRes;
        }
        //Удаление файлов
        for(var j = 0; j < chunk.length; j++){
            var delete_file_res = delete_files(chunk[j]);
            if(!delete_file_res.success){
                return delete_file_res;
            }
        }

        //Доработка в рамках https://rm.mfc.ru/issues/41231, проставляю ссылку на заявление учёта для дочерних СЧ
        if(isNotEmptyOrNullArray(key_elements_in_nodes)){
            key_elements_in_nodes.forEach(function(element){
                if(!element.is_registered_in_rzd){
                    element.is_allow_key_element = true;
                    element.application_id = reestr_applications_for_key_elements_registration_records[i].recid;
                    var reestr_ke_element_update = db.update("reestr_key_elements", element);
                    if(!reestr_ke_element_update){
                        return badResp("Не удалось обновить запись СЧ");
                    }
                }
            });
        }
    }
    
    //Простановка флага для учитываемых узлов
    for(var i = 0; i < params.nodes.length; i++){
        var not_allowed_node = params.nodes[i];
        var ce_unit_fields = db.findbyrecid("reestr_ke_nodes", not_allowed_node.recid);
        ce_unit_fields.is_allow_ce_element = true;
        db.update("reestr_ke_nodes", ce_unit_fields);
    }
    return successResp("Создано " + chunks_count + " заявлений на учет " + params.nodes.length.toString() + " сборочных единиц");
}

/**
 * Учет комплектации вагона
 * @param {*} params 
 */
function allow_vagon_complectation(params) {

	var user = getcurrentuser();
    //Валидация входящих параметров
    if(isEmptyString(params.output_application_number)){
        return badResp("Поле \"Номер исходящего заявление\" не может быть пустым");
    }
   if(isEmptyString(params.output_application_date)){
        return badResp("Поле \"Дата исходящего\" не может быть пустым");
    } else {
        //Проверяем, что Дата исходящего была не позднее текущей даты
        var date = new Date();
        date.setHours(date.getUTCHours() + 3);
        date.setUTCHours(0, 0, 0, 0);
        var application_date = new Date(params.output_application_date);
        application_date.setHours(application_date.getUTCHours() + 3);
        application_date.setUTCHours(0, 0, 0, 0);
        if (application_date.getTime() > date.getTime()) {
            return badResp("\"Дата исходящего\" должна быть не позднее текущей даты.");
        }
    }

    if (ischeckfields()){
        if(isEmptyString(user.firstname)){
            return badResp("Заполните в профиле пользователя поле \"Имя\" ");
        }

        if(isEmptyString(user.lastname)){
            return badResp("Заполните в профиле пользователя поле \"Фамилия\" ");
        }

        if(isEmptyString(user.patronymic)){
            return badResp("Заполните в профиле пользователя поле \"Отчество\" ");
        }

        if(isEmptyString(user.email)){
            return badResp("Заполните в профиле пользователя поле \"Электронная почта\" ");
        }
    }

    var vehicle_record = db.findbyrecid("reestr_vehicles", params.recid);

    var user_fullname = String().concat(user.lastname, " ", user.firstname, " ", user.patronymic);

    if(isNullObject(vehicle_record)){
        return badResp("Запись вагона не найдена в системе")
    }

    var vagon_model = db.findbyrecid("dictionary_models", vehicle_record.dictionary_models);
    if(isNullObject(vagon_model)){
        return badResp("Модель вагона не найдена в системе");
    }

    //Получение всех установленных СЧ
    var installed_key_elements = db.findbyparams("reestr_key_elements", {
        vehicle: vehicle_record.recid
    })

    if(isEmptyOrNullArray(installed_key_elements)){
        return badResp("На ТС не установлено ни одного составной части");
    }

    var installed_nodes = db.findbyparams("reestr_ke_nodes", {
        vehicle: vehicle_record.recid
    })
    if(isEmptyOrNullArray(installed_nodes)){
        installed_nodes = [];
    }

    //Проверка заявлений на учет у СЧ
    if(!isEmptyOrNullArray(installed_key_elements)){
        for(var i = 0; i < installed_key_elements.length; i++){
            var key_element = installed_key_elements[i];
            if(key_element.is_registered_in_rzd != true){
                if(!isEmptyString(key_element.application_id)){
                    var key_element_application = db.findbyrecid("reestr_applications_for_key_elements_registration", key_element.application_id);
                    if(!isNullObject(key_element_application)){
                        if(key_element_application.status != '56b4391b-82bc-42b5-a466-91d21db8022b'){
                            return badResp(String().concat("Невозможно создать новое заявление на учет до принятия решения по заявлению ", "<a href=\"/tables/reestr_applications_for_key_elements_registration/", key_element_application.recid, "\" target=\"_blank\" class=\"alert-link\">", key_element_application.recname, "</a>"))
                        }
                    }
                }
            }
        }
    }

    //Проверка заявлений на учет у СE
    if(!isEmptyOrNullArray(installed_nodes)){
        for(var i = 0; i < installed_nodes.length; i++){
            var node = installed_nodes[i];
            if(node.is_registered_in_rzd != true){
                //Проверка заявления родительского СЕ
                if(!isEmptyString(node.application_id)){
                    var node_application = db.findbyrecid("reestr_applications_for_key_elements_registration", node.application_id);
                    if(!isNullObject(node_application)){
                        if(node_application.status != '56b4391b-82bc-42b5-a466-91d21db8022b'){
                            return badResp(String().concat("Невозможно создать новое заявление на учет до принятия решения по заявлению ", "<a href=\"/tables/reestr_applications_for_key_elements_registration/", node_application.recid, "\" target=\"_blank\" class=\"alert-link\">", node_application.recname, "</a>"))
                        }
                    }
                }
            }
        }
    }
    

    var installed_elems_count = installed_key_elements.length + installed_nodes.length;

    //Проверка комплектации вагона
    var check_key_elements_count_on_vehicle_res = check_key_elements_count_on_vehicle(vehicle_record, installed_key_elements);
    if(!check_key_elements_count_on_vehicle_res.success){
        return check_key_elements_count_on_vehicle_res
    }

    //Получение участника
    if(isEmptyString(vehicle_record.manufacturer_name)){
        return badResp("У ТС не заполнено поле \"Предприятие изготовитель ТС\"");
    }
    var members = db.findbyparams("reestr_members", {
        fullname: vehicle_record.manufacturer_name
    })
    if(isEmptyOrNullArray(members)){
        return badResp("\"Предприятие изготовитель ТС\" не найдено в системе");
    }
    var member = members[0];

    //Получение количества неучтенных СЧ и узлов на вагоне по учету изготовления
    var not_allowed_ke_registratred_in_rzd_count = 0;
    var not_allowed_se_registratred_in_rzd_count = 0;

    //Получение количества неучтенных СЧ и узлов на вагоне по учету установки
    var not_allowed_ke_registrated_installation_count = 0;
    var not_allowed_se_registrated_installation_count = 0;

    //Получение количества неучтенных СЧ
    var key_elements_on_vehicle = db.findbyparams("reestr_key_elements", {
        vehicle: vehicle_record.recid
    });
    if(!isEmptyOrNullArray(key_elements_on_vehicle)){
        for(var i = 0; i < key_elements_on_vehicle.length; i++){
            var key_element = key_elements_on_vehicle[i];
            if(key_element.is_registrated_installation != true){
                not_allowed_ke_registrated_installation_count += 1;
            }
            if(key_element.is_registratred_in_rzd != true){
                not_allowed_ke_registratred_in_rzd_count += 1;
            }
        }
    }

    //Получение количества неучтенных узлов
    var nodes_on_vehicle = db.findbyparams("reestr_ke_nodes", {
        vehicle: vehicle_record.recid
    })
    if(!isEmptyOrNullArray(nodes_on_vehicle)){
        for(var i = 0; i < nodes_on_vehicle.length; i++){
            var node = nodes_on_vehicle[i];
            if(node.is_registrated_installation != true){
                not_allowed_se_registrated_installation_count += 1;
            }
            if(node.is_registratred_in_rzd != true){
                not_allowed_se_registratred_in_rzd_count += 1;
            }
        }
    }

    var reestr_applications_for_key_elements_registration_data = null;

    //Создание записи в реестр заявлений на регистрацию. Основание для учета проставляется в зависимости от количества учтенных СЧ и узлов
    if(not_allowed_ke_registratred_in_rzd_count > 0 || not_allowed_se_registratred_in_rzd_count > 0){
        reestr_applications_for_key_elements_registration_data = {
            member: member.recid,
			recname: String().concat(member.unique_member_identifier, "-", get_autoincremented_idx("application_number").toString()),
            reason: registration_reasons.third_reason,
			reason1: true,
            reason2: true,
            count_ke_ce: not_allowed_ke_registrated_installation_count + not_allowed_se_registrated_installation_count,
            fio: user_fullname,
            phone: user.phonenumber,
            status: null,
            output_application_number: params.output_application_number,
            output_application_date: params.output_application_date
        }
    }else{
        reestr_applications_for_key_elements_registration_data = {
            member: member.recid,
			recname: String().concat(member.unique_member_identifier, "-", get_autoincremented_idx("application_number").toString()),
            reason: registration_reasons.second_reason,
			reason1: false,
			reason2: true,
            count_ke_ce: not_allowed_ke_registrated_installation_count + not_allowed_se_registrated_installation_count,
            fio: user_fullname,
            phone: user.phonenumber,
            status: null,
            output_application_number: params.output_application_number,
            output_application_date: params.output_application_date
        }
    }

    var reestr_applications_for_key_elements_registration_record = db.insert("reestr_applications_for_key_elements_registration", reestr_applications_for_key_elements_registration_data);
    if(isNullObject(reestr_applications_for_key_elements_registration_record)){
        return badResp("Не удалось создать новое заявление");
    }

    // Формирование записи в таблицу reestr_applications_for_key_elements_registration
    var user = getcurrentuser();
    var user_fullname = String().concat(user.lastname, " ", user.firstname, " ", user.patronymic);

    //Собираем файлы которые надо приложить
    var files_in_zip = [];

    //Формирование списка установленных СЧ  05.08.2020 amaslov 41230
    for(var i = 0; i < installed_key_elements.length; i++){      
        //проверяем есть ли приложенные файлы и прикрепляем их
        var filenames = []; //в этот массив помещаем названия приложенных файлов, чтобы потом записать их строкой в поле file_name_in_archive TODO правильнее было бы заполнять это поле при генерации файлов
        
        if(installed_key_elements[i].is_registratred_in_rzd == null || !installed_key_elements[i].is_registratred_in_rzd){ //нам нужны только файлы ранее не учтенных на изготовление элементов
            var attached_file_ep = getattachedfileincolumn("reestr_key_elements", "key_element_passport_file", installed_key_elements[i].recid);
 
            if(attached_file_ep.length > 0){                
                files_in_zip.push(attached_file_ep[0].recId);
                filenames.push(attached_file_ep[0].recName);           
            }
        }

        if(installed_key_elements[i].is_registrated_installation == null || !installed_key_elements[i].is_registrated_installation){ //нам нужны только файлы ранее не учтенные на усановку на ТС
            var attached_file_dop_ep = getattachedfileincolumn("reestr_key_elements", "key_element_passport_file_appendix", installed_key_elements[i].recid);
            if(attached_file_dop_ep.length > 0){
                files_in_zip.push(attached_file_dop_ep[0].recId)
                filenames.push(attached_file_dop_ep[0].recName);
            }
        }
        
        if(filenames.length > 0){
            installed_key_elements[i].file_name_in_archive = filenames.join(", ");
            var update_result = db.update("reestr_key_elements", installed_key_elements[i]);
            if(!update_result){
                return badResp("Не удалось обновить запись заявления");
            }
        }
    }
    
    //Формирование списка установленных CЕ 05.08.2020 amaslov 41230
    for(var i = 0; i < installed_nodes.length; i++){        
        //проверяем есть ли приложенные файлы и прикрепляем их
        var filenames = []; //в этот массив помещаем названия приложенных файлов, чтобы потом записать их строкой в поле file_name_in_archive.
        if(installed_nodes[i].is_registratred_in_rzd == null || !installed_nodes[i].is_registratred_in_rzd){ //нам нужны файлы только ранее не учтенных на изготовление элементов
            var attached_file_ep = getattachedfileincolumn("reestr_ke_nodes", "node_passport_file", installed_nodes[i].recid);
            if(attached_file_ep.length > 0){
                files_in_zip.push(attached_file_ep[0].recId);
                filenames.push(attached_file_ep[0].recName);
            }
        }
        if(installed_nodes[i].is_registrated_installation == null || !installed_nodes[i].is_registrated_installation){ //нам нужны файлы только ранее не учтенных на усановку на ТС
            var attached_file_dop_ep = getattachedfileincolumn("reestr_ke_nodes", "node_passport_file_appendix", installed_nodes[i].recid);
            if(attached_file_dop_ep.length > 0){
                files_in_zip.push(attached_file_dop_ep[0].recId);
                filenames.push(attached_file_dop_ep[0].recName);
            }
        }
        if(filenames.length > 0){
            installed_nodes[i].file_name_in_archive = filenames.join(", ");
            var update_result = db.update("reestr_ke_nodes", installed_nodes[i]);
            if(!update_result){
                return badResp("Не удалось обновить запись заявления");
            }
        }        
    }
    if(files_in_zip.length == 0 || files_in_zip == null){
        return badResp("Нет файлов для прикладывания к заявлению");
    }
    
    var packRes = PackFileToZipArchive(
            String().concat("Приложения к заявлению №", reestr_applications_for_key_elements_registration_record.recname.toString()), 
            "reestr_applications_for_key_elements_registration", 
            reestr_applications_for_key_elements_registration_record.recid, 
            "generated_application_file", 
            files_in_zip,
            false)

        if(!packRes.success){
            return packRes;
        }    

    //Формирование заявления
    var report_params = {
        full_name: member.fullname,
        short_name: member.fullname,
        actual_adress: member.actualadress,
        email: member.email,
        inn: member.inn,
        ogrn: member.ogrn,
        reason: reestr_applications_for_key_elements_registration_record.reason,
        count_ke_ce: not_allowed_ke_registrated_installation_count + not_allowed_se_registrated_installation_count,
        vagonid: vehicle_record.recid,
        output_application_number: reestr_applications_for_key_elements_registration_record.output_application_number,
        output_application_date: reestr_applications_for_key_elements_registration_record.output_application_date,
        fio: user_fullname,
        phone: user.phonenumber
    };

    //Формирование и прикладывание извещения
    var add_notice_res = prepare_and_add_notice("reportnoticeforregistrationvagon", report_params, "notice_file", "reestr_applications_for_key_elements_registration", reestr_applications_for_key_elements_registration_record.recid, String().concat("Заявление на учет ТС №", reestr_applications_for_key_elements_registration_record.recname));
    if(!add_notice_res.success){
        db.delete("reestr_applications_for_key_elements_registration", reestr_applications_for_key_elements_registration_record.recid)
        return badResp(add_notice_res.message)
    }

    //Обновление записи в реестре с заявлениями
    reestr_applications_for_key_elements_registration_record.status = "c63d14c0-3464-4849-af6b-7446b4129dd9";
    reestr_applications_for_key_elements_registration_record.registered_entity_id = vehicle_record.recid;
    reestr_applications_for_key_elements_registration_record.registered_entity_type = "vehicle";

    var updres = db.update("reestr_applications_for_key_elements_registration", reestr_applications_for_key_elements_registration_record);
    if(!updres){
        db.delete("reestr_applications_for_key_elements_registration", reestr_applications_for_key_elements_registration_record.recid)
        return badResp("Не удалось обновить запись заявления");
    }

    //Обновление записи в реестре ТС
    vehicle_record.is_registratred = true;
    var reestr_vehicles_updres = db.update("reestr_vehicles", vehicle_record);
    if(!reestr_vehicles_updres){
        db.delete("reestr_applications_for_key_elements_registration", reestr_applications_for_key_elements_registration_record.recid)
        return badResp("Не удалось обновить запись в реестре ТС");
    }

    //Обновляем установленные неучтенные ранее СЧ (привязываем к заявлению на учёт)
    for(var i = 0; i < installed_key_elements.length; i++){
        if(!installed_key_elements[i].is_registratred_in_rzd || !installed_key_elements[i].is_registrated_installation){
            installed_key_elements[i].application_id = reestr_applications_for_key_elements_registration_record.recid;
            installed_key_elements[i].is_allow_key_element = true;
            var reestr_ke_element_update = db.update("reestr_key_elements", installed_key_elements[i]);
            if(!reestr_ke_element_update){
                return badResp("Не удалось обновить запись СЧ");
            }
        }
    }
    
    //Обновляем установленные неучтенные ранее СЕ (привязываем к заявлению на учёт)
    for(var i = 0; i < installed_nodes.length; i++){
        if(!installed_nodes[i].is_registratred_in_rzd || !installed_nodes[i].is_registrated_installation){
            installed_nodes[i].application_id = reestr_applications_for_key_elements_registration_record.recid;
            installed_nodes[i].is_allow_ce_element = true;
            var reestr_ke_node_update = db.update("reestr_ke_nodes", installed_nodes[i]);
            if(!reestr_ke_node_update){
                return badResp("Не удалось обновить запись СЕ");
            }
        }
    }

    return successResp(String().concat("Заявление <a href=\"/tables/reestr_applications_for_key_elements_registration/", reestr_applications_for_key_elements_registration_record.recid, "\" target=\"_blank\" class=\"alert-link\"> № ", reestr_applications_for_key_elements_registration_record.recname, "</a> на учет установки на ТС создано"));
}

/**
 * Проверка соответствия количества установленных СЧ справочнику комплектации
 * @param {*} vagon 
 * @param {*} key_elements 
 */
function check_key_elements_count_on_vehicle(vagon, key_elements){

    var vagon_complectations = db.findbyparams("dictionary_count_ke_on_vagon", {
        model_vagon: vagon.dictionary_models
    })

    if(isEmptyOrNullArray(vagon_complectations)){
        return badResp("Комплектация вагона не найдена в системе");
    }

    var vagon_complectation = vagon_complectations[0]

    var wheel_pair_count = 0;
	var side_frame_count = 0;
	var pressure_beam_count = 0;
	var air_distributor_count = 0;
	var absorbing_device_count = 0;

	var auto_mode_count = 0;
	var friction_wedge_count = 0;
	var slider_body_count = 0;
	var slider_cap_count = 0;
	var wheel_adapter_count = 0;
	var removable_railway_carcass_count = 0;

	var brake_cylinder_count = 0;
	var spring_suspension_under_wedge_external_count = 0;
	var spring_suspension_under_wedge_internal_count = 0;
	var spring_suspension_external_count = 0;
	var spring_suspension_internal_count = 0;
	var spring_slider_external_count = 0;
	var spring_slider_internal_count = 0;
	var air_tank_auto_brakes_count = 0;
	var traction_clamp_coupling_count = 0;
	var triangel_count = 0;
	var trunk_part_air_distributor_count = 0;
	var bearing_adapter_count = 0;
	var friction_strip_count = 0;
	var brace_count = 0;
	var clear_axis_count = 0;
	var wheel_count = 0;
	var wedge_pockets_count = 0;
	var saddle_rings_count = 0;
	var wedge_pockets_inserts_count = 0;
	var saddle_bearings_count = 0;
	var locks_count = 0;
	var elevator_rolls_count = 0;
	var auto_couplers_count = 0;
	var front_rear_detents_count = 0;
    var gondola_hatches_count = 0;
    var rough_axis_count = 0;

    //Подсчет установленных элементов
    for (var i = 0; i < key_elements.length; i++) {
        var key_element = key_elements[i];
        // Балка надрессорная
        if (key_element.key_element_code == keyElementCodes.pressure_beam_id) {
            pressure_beam_count++;
        }
        // Рама боковая
        if (key_element.key_element_code == keyElementCodes.side_frame_id) {
            side_frame_count++
        }
        // Колесная пара в сборе
        if (key_element.key_element_code == keyElementCodes.wheel_pair_id) {
            wheel_pair_count++;
        }
        // Главная часть воздухораспределителя
        if (key_element.key_element_code == keyElementCodes.main_part_air_distributor_id) {
            air_distributor_count++;
        }
        // Поглощающий аппарат
        if (key_element.key_element_code == keyElementCodes.absorbing_device_id) {
            absorbing_device_count++;
        }
        // Авторежим
        if (key_element.key_element_code == keyElementCodes.auto_mode_id) {
            auto_mode_count++;
        }
        // Клин фрикционный
        if (key_element.key_element_code == keyElementCodes.friction_wedge_id) {
            friction_wedge_count++;
        }
        // Корпус скользуна
        if (key_element.key_element_code == keyElementCodes.slider_body_id) {
            slider_body_count++;
        }
        // Колпак скользуна
        if (key_element.key_element_code == keyElementCodes.slider_cap_id) {
            slider_cap_count++;
        }
        // Адаптер колеса
        if (key_element.key_element_code == keyElementCodes.wheel_adapter_id) {
            wheel_adapter_count++;
        }

        // Тормозной цилиндр
        if (key_element.key_element_code == keyElementCodes.brake_cylinder_id) {
            brake_cylinder_count++;
        }
        // Пружины рессорного подвешивания подклиновая наружная
        if (key_element.key_element_code == keyElementCodes.spring_suspension_under_wedge_external_id) {
            spring_suspension_under_wedge_external_count++;
        }
        // Пружины рессорного подвешивания подклиновая внутренняя
        if (key_element.key_element_code == keyElementCodes.spring_suspension_under_wedge_internal_id) {
            spring_suspension_under_wedge_internal_count++;
        }
        // Пружины рессорного подвешивания наружная
        if (key_element.key_element_code == keyElementCodes.spring_suspension_external_id) {
            spring_suspension_external_count++;
        }
        // Пружины рессорного подвешивания внутренняя
        if (key_element.key_element_code == keyElementCodes.spring_suspension_internal_id) {
            spring_suspension_internal_count++;
        }
        // Пружины скользуна наружная
        if (key_element.key_element_code == keyElementCodes.spring_slider_external_id) {
            spring_slider_external_count++;
        }
        // Пружины скользуна внутренняя
        if (key_element.key_element_code == keyElementCodes.spring_slider_internal_id) {
            spring_slider_internal_count++;
        }
        // Резервуары воздушные для автотормозов
        if (key_element.key_element_code == keyElementCodes.air_tank_auto_brakes_id) {
            air_tank_auto_brakes_count++;
        }
        // Тяговый хомут автосцепки
        if (key_element.key_element_code == keyElementCodes.traction_clamp_coupling_id) {
            traction_clamp_coupling_count++;
        }
        // Триангель
        if (key_element.key_element_code == keyElementCodes.triangel_id) {
            triangel_count++;
        }
        // Магистральная часть воздухораспределителя
        if (key_element.key_element_code == keyElementCodes.trunk_part_air_distributor_id) {
            trunk_part_air_distributor_count++;
        }
        // Адаптер подшипника
        if (key_element.key_element_code == keyElementCodes.bearing_adapter_id) {
            bearing_adapter_count++;
        }
        //Сменный ЖД кузов
        if(key_element.key_element_code == keyElementCodes.removable_railway_carcass_id){
            removable_railway_carcass_count++;
        }
        //Планка фрикционная
        if(key_element.key_element_code == keyElementCodes.friction_strip_id){
            friction_strip_count++;
        }
        //Скоба
        if(key_element.key_element_code == keyElementCodes.brace_id){
            brace_count++;
        }
        //Ось чистовая
        if(key_element.key_element_code == keyElementCodes.clear_axis_id){
            clear_axis_count++;
        }
        //Колесо
        if(key_element.key_element_code == keyElementCodes.wheel_id){
            wheel_count++;
        }
        //Пластины в клиновых карманах
        if(key_element.key_element_code == keyElementCodes.wedge_pockets_id){
            wedge_pockets_count++;
        }
        //Кольцо в подпятник
        if(key_element.key_element_code == keyElementCodes.saddle_ring_id){
            saddle_rings_count++;
        }
        //Вставки в клиновые карманы
        if(key_element.key_element_code == keyElementCodes.wedge_pockets_inserts_id){
            wedge_pockets_inserts_count++;
        }
        //Вкладыш подпятника
        if(key_element.key_element_code == keyElementCodes.saddle_bearing_id){
            saddle_bearings_count++;
        }
        //Замок
        if(key_element.key_element_code == keyElementCodes.lock_id){
            locks_count++;
        }
        //Валик подъемника
        if(key_element.key_element_code == keyElementCodes.elevator_roll_id){
            elevator_rolls_count++
        }
        //Корпус автосцепки
        if(key_element.key_element_code == keyElementCodes.auto_coupler_id){
            auto_couplers_count++
        }
        //Упоры передний и задний объединенные
        if(key_element.key_element_code == keyElementCodes.front_rear_detents_id){
            front_rear_detents_count++
        }
        //Крышка люка полувагона
        if(key_element.key_element_code == keyElementCodes.gondola_hatch_id){
            gondola_hatches_count++
        }
        //Ось черновая
        if(key_element.key_element_code == keyElementCodes.rough_axis_id){
            rough_axis_count++;
        }
    }

    var errors = [];

    //Проверка по комплектации
    // Балка надрессорная
	if (key_element.key_element_code == keyElementCodes.pressure_beam_id &&
		pressure_beam_count < vagon_complectation.pressure_beam) {
		errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно балок надрессорных, требуется " + vagon_complectation.pressure_beam);
	}
	// Рама боковая
	if (key_element.key_element_code == keyElementCodes.side_frame_id &&
		side_frame_count < vagon_complectation.side_frame) {
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно рам боковых, требуется " + vagon_complectation.side_frame);
	}
	// Колесная пара в сборе
	if (key_element.key_element_code == keyElementCodes.wheel_pair_id &&
		wheel_pair_count < vagon_complectation.wheel_pair) {
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно колесных пар в сборе, требуется " + vagon_complectation.wheel_pair);	
	}
	// Главная часть воздухораспределителя
	if (key_element.key_element_code == keyElementCodes.main_part_air_distributor_id &&
		air_distributor_count < vagon_complectation.air_distributor) {
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно главных частей воздухораспределителя, требуется " + vagon_complectation.air_distributor);
	}
	// Поглощающий аппарат
	if (key_element.key_element_code == keyElementCodes.absorbing_device_id &&
		absorbing_device_count < vagon_complectation.absorbing_device) {
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно поглощающих аппаратов, требуется " + vagon_complectation.absorbing_device);
	}
	// Авторежим
	if (key_element.key_element_code == keyElementCodes.auto_mode_id &&
		auto_mode_count < vagon_complectation.auto_mode) {
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно авторежимов, требуется " + vagon_complectation.auto_mode);
	}
	// Клин фрикционный
	if (key_element.key_element_code == keyElementCodes.friction_wedge_id &&
		friction_wedge_count < vagon_complectation.friction_wedge) {
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно клинов фрикционных, требуется " + vagon_complectation.friction_wedge);
	}
	// Корпус скользуна
	if (key_element.key_element_code == keyElementCodes.slider_body_id &&
		slider_body_count < vagon_complectation.slider_body) {
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно корпусов скользуна, требуется " + vagon_complectation.slider_body);
	}
	// Колпак скользуна
	if (key_element.key_element_code == keyElementCodes.slider_cap_id &&
		slider_cap_count < vagon_complectation.slider_cap) {
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно колпаков скользуна, требуется " + vagon_complectation.slider_cap);
	}
	// Адаптер колеса
	if (key_element.key_element_code == keyElementCodes.wheel_adapter_id &&
		wheel_adapter_count < vagon_complectation.wheel_adapter) {
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно адаптеров колеса, требуется " + vagon_complectation.wheel_adapter);
	}
	// Тормозной цилиндр
	if (key_element.key_element_code == keyElementCodes.brake_cylinder_id &&
		brake_cylinder_count < vagon_complectation.brake_cylinder) {
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно тормозных цилиндров, требуется " + vagon_complectation.brake_cylinder);
	}
	// Пружины рессорного подвешивания подклиновая наружная
	if (key_element.key_element_code == keyElementCodes.spring_suspension_under_wedge_external_id &&
		spring_suspension_under_wedge_external_count < vagon_complectation.spring_suspension_under_wedge_external) {
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно пружин рессорного подвешивания подклиновых наружных, требуется " + vagon_complectation.spring_suspension_under_wedge_external);
	}
	// Пружины рессорного подвешивания подклиновая внутренняя
	if (key_element.key_element_code == keyElementCodes.spring_suspension_under_wedge_internal_id &&
		spring_suspension_under_wedge_internal_count < vagon_complectation.spring_suspension_under_wedge_internal) {
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно пружин рессорного подвешивания подклиновых внутренних, требуется " + vagon_complectation.spring_suspension_under_wedge_internal);
	}
	// Пружины рессорного подвешивания наружная
	if (key_element.key_element_code == keyElementCodes.spring_suspension_external_id &&
		spring_suspension_external_count < vagon_complectation.spring_suspension_external) {
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно пружин рессорного подвешивания наружных, требуется " + vagon_complectation.spring_suspension_external);
	}
	// Пружины рессорного подвешивания внутренняя
	if (key_element.key_element_code == keyElementCodes.spring_suspension_internal_id &&
		spring_suspension_internal_count < vagon_complectation.spring_suspension_internal) {
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно пружин рессорного подвешивания внутренних, требуется " + vagon_complectation.spring_suspension_internal);
	}
	// Пружины скользуна наружная
	if (key_element.key_element_code == keyElementCodes.spring_slider_external_id &&
		spring_slider_external_count < vagon_complectation.spring_slider_external) {
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно пружин скользуна наружных, требуется " + vagon_complectation.spring_slider_external);
	}
	// Пружины скользуна внутренняя
	if (key_element.key_element_code == keyElementCodes.spring_slider_internal_id &&
		spring_slider_internal_count < vagon_complectation.spring_slider_internal) {
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно пружин скользуна внутренних, требуется " + vagon_complectation.spring_slider_internal);
	}
	// Резервуары воздушные для автотормозов
	if (key_element.key_element_code == keyElementCodes.air_tank_auto_brakes_id &&
		air_tank_auto_brakes_count < vagon_complectation.air_tank_auto_brakes) {
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно резервуаров воздушных для автотормозов, требуется " + vagon_complectation.air_tank_auto_brakes);
	}
	// Тяговый хомут автосцепки
	if (key_element.key_element_code == keyElementCodes.traction_clamp_coupling_id &&
		traction_clamp_coupling_count < vagon_complectation.traction_clamp_coupling) {
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно тяговых хомутов автосцепки, требуется " + vagon_complectation.traction_clamp_coupling);
	}
	// Триангель
	if (key_element.key_element_code == keyElementCodes.triangel_id &&
		triangel_count < vagon_complectation.triangel) {
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно триангелей, требуется " + vagon_complectation.triangel);
	}
	// Магистральная часть воздухораспределителя
	if (key_element.key_element_code == keyElementCodes.trunk_part_air_distributor_id &&
		trunk_part_air_distributor_count < vagon_complectation.trunk_part_air_distributor) {
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно магистральных частей воздухораспределителя, требуется " + vagon_complectation.trunk_part_air_distributor);
	}
	// Адаптер подшипника
	if (key_element.key_element_code == keyElementCodes.bearing_adapter_id &&
		bearing_adapter_count < vagon_complectation.bearing_adapter) {
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно адаптеров подшипника, требуется " + vagon_complectation.bearing_adapter);
	}
	// Сменный ЖД кузов
	if(key_element.key_element_code == keyElementCodes.removable_railway_carcass_id && 
		removable_railway_carcass_count < vagon_complectation.railway_carcass){
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно сменных ЖД кузовов, требуется " + vagon_complectation.railway_carcass);
	}
	// Планка фрикционная
	if(key_element.key_element_code == keyElementCodes.friction_strip_id && 
		friction_strip_count < vagon_complectation.friction_strip){
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно планок фрикционных, требуется " + vagon_complectation.friction_strip);
	}
	// Скоба
	if(key_element.key_element_code == keyElementCodes.brace_id && 
		brace_count < vagon_complectation.brace){
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно скоб, требуется " + vagon_complectation.brace);
	}
	// Ось чистовая
	if(key_element.key_element_code == keyElementCodes.clear_axis_id && 
		clear_axis_count < vagon_complectation.clear_axis){
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно осей чистовых, требуется " + vagon_complectation.clear_axis);
	}
	// Колесо
	if(key_element.key_element_code == keyElementCodes.wheel_id&& 
		wheel_count < vagon_complectation.wheel){
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно колес, требуется " + vagon_complectation.wheel);
	}
	// Пластины в клиновых карманах
	if(key_element.key_element_code == keyElementCodes.wedge_pockets_id&& 
		wedge_pockets_count < vagon_complectation.wedge_pockets){
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно пластин в клиновых карманах, требуется " + vagon_complectation.wedge_pockets);
	}
	// Кольцо в подпятник
	if(key_element.key_element_code == keyElementCodes.saddle_ring_id&& 
		saddle_rings_count < vagon_complectation.saddle_rings){
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно колец в подпятник, требуется " + vagon_complectation.saddle_rings);
	}
	// Вставки в клиновые карманы
	if(key_element.key_element_code == keyElementCodes.wedge_pockets_inserts_id&& 
		wedge_pockets_inserts_count < vagon_complectation.wedge_pockets_inserts){
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно вставок в клиновые карманы, требуется " + vagon_complectation.wedge_pockets_inserts);
	}
	// Вкладыш подпятника
	if(key_element.key_element_code == keyElementCodes.saddle_bearing_id&& 
		saddle_bearings_count < vagon_complectation.saddle_bearings){
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно вкладышей подпятника, требуется " + vagon_complectation.saddle_bearings);
	}
	// Замок
	if(key_element.key_element_code == keyElementCodes.lock_id&& 
		locks_count < vagon_complectation.locks){
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно замков, требуется " + vagon_complectation.locks);
	}
	// Валик подъемника
	if(key_element.key_element_code == keyElementCodes.elevator_roll_id&& 
		elevator_rolls_count < vagon_complectation.elevator_rolls){
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно валиков подъемника, требуется " + vagon_complectation.elevator_rolls);
	}
	// Корпус автосцепки
	if(key_element.key_element_code == keyElementCodes.auto_coupler_id&& 
		auto_couplers_count < vagon_complectation.auto_couplers){
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно корпусов автосцепки, требуется " + vagon_complectation.auto_couplers);
	}
	// Упоры передний и задний объединенные
	if(key_element.key_element_code == keyElementCodes.front_rear_detents_id&& 
		front_rear_detents_count < vagon_complectation.front_rear_detents){
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно упоров передних и задних, требуется " + vagon_complectation.front_rear_detents);
	}
	// Крышка люка полувагона
	if(key_element.key_element_code == keyElementCodes.gondola_hatch_id&& 
		gondola_hatches_count < vagon_complectation.gondola_hatches){
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно крышек люков полувагона, требуется " + vagon_complectation.gondola_hatches);
    }

    // Ось черновая
	if(key_element.key_element_code == keyElementCodes.rough_axis_id && 
		rough_axis_count < vagon_complectation.rough_axis){
        errors.push("Невозможно учесть комплектацию вагона: установлено недостаточно осей черновых, требуется " + vagon_complectation.rough_axis);
	}
    
    if(errors.length > 0){
        return showerrorsfromarray(errors);
    }

    return {
        success: true
    };    
}

/**
 * Учесть выпущенные в обращение и не учтенные СЧ
 * @param {*} params 
 */
function allow_key_element_static(params){
	var user = getcurrentuser();
    //Валидация входящих параметров
    var fillingValidateErrors = [];
    //Заявитель
    if(isEmptyString(params.member)){
        fillingValidateErrors.push("\"Заявитель\"");
    }
    
    if(isEmptyString(params.output_application_number)){
        fillingValidateErrors.push("\"Номер исходящего\"");
    }

    if(isEmptyString(params.output_application_date)){
        fillingValidateErrors.push("\"Дата исходящего\"");
    }

    if(isNotEmptyOrNullArray(fillingValidateErrors)){
        return badResp(fillingValidateErrors.length > 1 ? 
            String().concat("Поля ", fillingValidateErrors.join(", "), " не могут быть пустыми") : 
            String().concat("Поле ", fillingValidateErrors.join(", "), " не может быть пустым"));
    }

    if (ischeckfields()){
        var userValidateErrors = [];
        if(isEmptyString(user.firstname)){
            userValidateErrors.push("\"Имя\" ");
        }

        if(isEmptyString(user.lastname)){
            userValidateErrors.push("\"Фамилия\" ");
        }

        if(isEmptyString(user.patronymic)){
            userValidateErrors.push("\"Отчество\" ");
        }
        if(isEmptyString(user.email)){
            userValidateErrors.push("\"Электронная почта\" ");
        }
        if(isNotEmptyOrNullArray(userValidateErrors)){
            return badResp(userValidateErrors.length > 1? 
                String().concat("Заполните в профиле пользователя поля ", userValidateErrors.join(", ")) :
                String().concat("Заполните в профиле пользователя поле ", userValidateErrors.join(", ")) );
        }
    }
    
    var member = db.findbyrecid("reestr_members", params.member);
    if(isNullObject(member)){
        return badResp("Заявитель не найден в системе");
    }
    if(isEmptyString(member.branding_code)){
        return badResp("Не удалось определить сокращенное наименование производителя");
    }
    var branding_code = db.findbyrecid("dictionary_branding_codes", member.branding_code);
    if(isNullObject(branding_code)){
        return badResp("Код клеймения не найден в системе");
    }

    //Проверяем, что Дата исходящего была не позднее текущей даты
    var date = new Date();
    date.setHours(date.getUTCHours() + 3);
    date.setUTCHours(0, 0, 0, 0);
    var application_date = new Date(params.output_application_date);
    application_date.setHours(application_date.getUTCHours() + 3);
    application_date.setUTCHours(0, 0, 0, 0);
    if (application_date.getTime() > date.getTime()) {
        return badResp("\"Дата исходящего\" должна быть не позднее текущей даты.");
    }

    //Получение неучтенных СЧ
    var not_allowed_key_elements = []

    if(isEmptyOrNullArray(params.selectedRecords)){
        //выпущенные в обращение
        not_allowed_key_elements_1 = db.findbyparams("reestr_key_elements", {
            owner: member.recid,
            is_allow_key_element: false,
            statuske: "c82c2eb8-0cf9-4693-8a2b-c6bf605c97ab"
        });
        //установлен на тс
        not_allowed_key_elements_2 = db.findbyparams("reestr_key_elements", {
            owner: member.recid,
            is_allow_key_element: false,
            statuske: "a0b630bc-fbed-4863-9053-6cec9ee3a459"
        });
        //a.polunina Убрала в рамках задачи https://rm.mfc.ru/issues/46142
        //возобновлена эксплуатация
        // not_allowed_key_elements_4 = db.findbyparams("reestr_key_elements", {
        //     owner: member.recid,
        //     is_allow_key_element: false,
        //     statuske: "f7730d93-7567-4fe7-b146-b5d9b2559d02"
        // });
        //снят с тс
        not_allowed_key_elements_3 = db.findbyparams("reestr_key_elements", {
            owner: member.recid,
            is_allow_key_element: false,
            statuske: "259762d5-2ee4-4acb-a2c7-18593cb6cc4f"
        });

        not_allowed_key_elements = (!!not_allowed_key_elements_1 ? not_allowed_key_elements_1 : []).concat(
            !!not_allowed_key_elements_2 ? not_allowed_key_elements_2 : [], !!not_allowed_key_elements_3 ? not_allowed_key_elements_3 : []);

    }else{
        not_allowed_key_elements = params.selectedRecords;
    }

    if(isEmptyOrNullArray(not_allowed_key_elements)){
        return successResp("Не найдено СЧ для учета");
    }
    
    //Игнор СЧ с заявлениями на учет НЕ в финальном статусе
    var key_elements_without_applications = [];
    for(var i = 0; i < not_allowed_key_elements.length; i++){
        var key_element = not_allowed_key_elements[i];
        
        //Проверка наличия заявления у СЧ
        if(!isEmptyString(key_element.application_id)){
            var application = db.findbyrecid("reestr_applications_for_key_elements_registration", key_element.application_id);
            if(!isNullObject(application)){
                if(application.status != '56b4391b-82bc-42b5-a466-91d21db8022b'){
                    continue;
                }else{
                    key_elements_without_applications.push(key_element)
                }
            }else{
                key_elements_without_applications.push(key_element)
            }
        }else{
            key_elements_without_applications.push(key_element)
        }
    }
    not_allowed_key_elements = key_elements_without_applications

    

    //Рассчет количества файлов в архиве
    var max_files_count = 3;
    
    //Если в параметрах пришло максимальное количество файлов, обновление их в переменной max_files_count
    if(params.max_files_count != null){
        max_files_count = params.max_files_count;
    }

    //Рассчет количества чанков, на которые будет разбита выборка
    var chunks_count = 0;
    if(not_allowed_key_elements.length <= max_files_count){
        chunks_count = 1;
    }else{
        chunks_count = Math.ceil(not_allowed_key_elements.length / max_files_count);
    }
    
    // Формирование записи в таблицу reestr_applications_for_key_elements_registration

    var user_fullname = String().concat(user.lastname, " ", user.firstname, " ", user.patronymic);

    //Разбиение записей на блоки
    var chunked_records = [];
    var last_index = 0;
    for(var i = 0; i < chunks_count; i++){
        var chunk = [];
        for(var j = 0; j < max_files_count; j++){
            if((last_index + 1) <= not_allowed_key_elements.length ){
                chunk.push(not_allowed_key_elements[last_index]);
                last_index = last_index + 1;
            }
        }
        if(chunk.length > 0){
            chunked_records.push(chunk);
        }
    }
    
    //Формирование json - файлов
    var formed_files = [];
    var reestr_applications_for_key_elements_registration_records = [];
    for(var i = 0; i < chunked_records.length; i++){
        var chunk = chunked_records[i];
        var files_in_chunk = [];


        //Создание записи на учет СЧ 
        var reestr_applications_for_key_elements_registration_data = {
            member: member.recid,
            recname: String().concat(member.unique_member_identifier, "-", get_autoincremented_idx("application_number").toString()),
            reason: registration_reasons.first_reason,
            reason1: true,
            count_ke_ce: chunk.length.toString(),
            fio: user_fullname,
            phone: user.phonenumber,
            status: null,
            output_application_number: params.output_application_number,
            output_application_date: params.output_application_date
        }
    
        
        var reestr_applications_for_key_elements_registration_record = db.insert("reestr_applications_for_key_elements_registration", reestr_applications_for_key_elements_registration_data);
        if(isNullObject(reestr_applications_for_key_elements_registration_record)){
            return badResp("Не удалось создать новое заявление");
        }
        reestr_applications_for_key_elements_registration_records.push(reestr_applications_for_key_elements_registration_record);
        //Массив идентификаторов СЧ в чанке
        var kes_in_chunk = [];

        for(var j = 0; j < chunk.length; j++){
            var record = chunk[j];

            //Проверка наличия заявления у СЧ
            if(!isEmptyString(record.application_id)){
                var application = db.findbyrecid("reestr_applications_for_key_elements_registration", record.application_id);
                if(!isNullObject(application)){
                    if(application.status != '56b4391b-82bc-42b5-a466-91d21db8022b'){
                        continue;
                    }
                }
            }
            //Получение УИН СЧ
            var ke_number = db.findbyrecid("ke_numbers", record.ke_number);
            if(isNullObject(ke_number)){
                return badResp("УИН СЧ не найден в системе");
            }

            if(!isEmptyString(record.billet_manufacturer_info)){
                var dictionary_billet_manufacturer_details_fields = db.findbyrecid("dictionary_billet_manufacturer_details", record.billet_manufacturer_info)
                if(!isEmptyOrNullArray(dictionary_billet_manufacturer_details_fields)){
                    var billet_manufacturer_info_name = dictionary_billet_manufacturer_details_fields.billet_manufacturer_name;
                } else {
                    return badResp("Значение поля \"Сведения об изготовителе заготовки\" не найдено в справочнике, проверьте параметр \"billet_manufacturer_info\"")
                }
            }

            //Получение файла с ЭП КЭ
            var attached_files = getattachedfileincolumn("reestr_key_elements", "key_element_passport_file", record.recid);
            if(isEmptyOrNullArray(attached_files)){
                return badResp("Файл ЭП СЧ отсутствует в карточке СЧ");
            }
            var attached_file = attached_files[0];
            var file_content_object = ParseFileToObject(attached_file.recId);
            if(!file_content_object.success){
                return badResp("Не удалось получить содержимое файла ЭП СЧ")
            }
            file_content_object = JSON.parse(file_content_object.data.toString());

            // Формирование json-файла
            var save_content_as_file_result = SaveContentAsFileAsync("reestr_applications_for_key_elements_registration", reestr_applications_for_key_elements_registration_records[i].recid, 
            "files", ke_number.recname, "json", JSON.stringify(file_content_object));

            // Формирование и запись наименование файла json
            var key_element_field = db.findbyrecid("reestr_key_elements", record.recid);
           
            key_element_field.file_name_in_archive = String().concat(ke_number.recname, ".json");
            var update_result = db.update("reestr_key_elements", key_element_field);
           
            if(!update_result){
                return badResp("Не удалось обновить запись заявления");
            }

            if(!save_content_as_file_result.success){
                for(var k = 0; k < reestr_applications_for_key_elements_registration_records.length; k++){
                    db.delete("reestr_applications_for_key_elements_registration", reestr_applications_for_key_elements_registration_records[k].recid);
                }
                return save_content_as_file_result;
            }
            files_in_chunk.push(save_content_as_file_result.data.result.recId);
            kes_in_chunk.push(record.recid);
            
        }
        //Формирование заявления
        var title = "составных частей";
        var report_params = {
            ke_or_ce: title,
            reason_ke_ce: title,
            count_ke_ce_name: title,
            list_ke_ce_elements: title,
            full_name: member.fullname,
            short_name: String().concat(branding_code.recname, ", ", branding_code.code),
            actual_adress: member.actualadress,
            email: member.email,
            inn: member.inn,
            ogrn: member.ogrn,
            reason: reestr_applications_for_key_elements_registration_record.reason,
            count_ke_ce: chunk.length.toString(),
            uin: record.numberke,
            name_element: record.key_element_code_calculated,
            fio: reestr_applications_for_key_elements_registration_record.fio,
            phone: reestr_applications_for_key_elements_registration_record.phone,
            output_application_number: reestr_applications_for_key_elements_registration_record.output_application_number,
            output_application_date: reestr_applications_for_key_elements_registration_record.output_application_date,
            key_element_recid: reestr_applications_for_key_elements_registration_records[i].recid
        };
        for (let k = 0; k < kes_in_chunk.length; k++) {
            var ke_in_chunk = kes_in_chunk[k];
            var key_element = db.findbyrecid("reestr_key_elements", ke_in_chunk);
           
            key_element.application_id = reestr_applications_for_key_elements_registration_record.recid;
            var update_res = db.update("reestr_key_elements", key_element);
            if(!update_res){
                return badResp("Не удалось обновить запись заявления");
            }
        }
        //Формирование и прикладывание извещения
       var add_notice_res = prepare_and_add_notice("reportnoticeforregistrationmultiplekeyelement", report_params, "notice_file", "reestr_applications_for_key_elements_registration", reestr_applications_for_key_elements_registration_record.recid, String().concat("Заявление на учет СЧ №", reestr_applications_for_key_elements_registration_record.recname.toString()));
        if(!add_notice_res.success){
            return badResp(add_notice_res.message)
        }
        reestr_applications_for_key_elements_registration_record.status = "c63d14c0-3464-4849-af6b-7446b4129dd9";
        reestr_applications_for_key_elements_registration_record.registered_entity_id = JSON.stringify(kes_in_chunk);
        reestr_applications_for_key_elements_registration_record.registered_entity_type = "key_elements_archive";
        
        var updres = db.update("reestr_applications_for_key_elements_registration", reestr_applications_for_key_elements_registration_record);
        if(!updres){
            return badResp("Не удалось обновить запись заявления");
        }
        formed_files.push(files_in_chunk);
    }

    //Упаковка в архив
    for(var i = 0; i < formed_files.length; i++){
        var files_in_chunk = formed_files[i];
        var packRes = PackFileToZipArchive(
            String().concat("Приложения к заявлению №", reestr_applications_for_key_elements_registration_records[i].recname.toString()), 
            "reestr_applications_for_key_elements_registration", 
            reestr_applications_for_key_elements_registration_records[i].recid, 
            "files", 
            files_in_chunk,
            false)

        if(!packRes.success){
            return packRes;
        }
        var packRes = PackFileToZipArchive(
            String().concat("Приложения к заявлению №", reestr_applications_for_key_elements_registration_records[i].recname.toString()), 
            "reestr_applications_for_key_elements_registration", 
            reestr_applications_for_key_elements_registration_records[i].recid, 
            "generated_application_file", 
            files_in_chunk,
            false)

        if(!packRes.success){
            return packRes;
        }
    }
    
    //Удаление файлов, из которых был собран архив
    for(var i = 0; i < formed_files.length; i++){
        var files_in_chunk = formed_files[i];
        for(var j = 0; j < files_in_chunk.length; j++){
            var delete_file_res = delete_files(files_in_chunk[j]);
            if(!delete_file_res.success){
                return delete_file_res;
            }
        }
    }

    //Простановка флага в записях с файлами
    for(var i = 0; i < chunked_records.length; i++){
        var chunk = chunked_records[i];
        for(var j = 0; j < chunk.length; j++){
            var chunk_record = db.findbyrecid("reestr_key_elements", chunk[j].recid);
            chunk_record.is_allow_key_element = true;
            db.update("reestr_key_elements", chunk_record);
        }
    }
    
    return successResp("Учтено " + not_allowed_key_elements.length.toString() + " составных частей");
}

/**
 * Учет нескольких узлов/СЕ
 * @param {*} param 
 */
function allow_node_static(params){
    if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
    //Валидация входящих параметров
    var fillingValidateErrors = [];
    //Заявитель
    if(isEmptyString(params.member)){
        fillingValidateErrors.push("\"Заявитель\"");
    }
    
    if(isEmptyString(params.output_application_number)){
        fillingValidateErrors.push("\"Номер исходящего\"");
    }

    if(isEmptyString(params.output_application_date)){
        fillingValidateErrors.push("\"Дата исходящего\"");
    }

    if(isNotEmptyOrNullArray(fillingValidateErrors)){
        return badResp(fillingValidateErrors.length > 1 ? 
            String().concat("Поля ", fillingValidateErrors.join(", "), " не могут быть пустыми") : 
            String().concat("Поле ", fillingValidateErrors.join(", "), " не может быть пустым"));
    }
    
    var member = db.findbyrecid("reestr_members", params.member);
    if(isNullObject(member)){
        return badResp("Заявитель не найден в системе");
    }
    var branding_code = db.findbyrecid("dictionary_branding_codes", member.branding_code);
    if(isNullObject(branding_code)){
        return badResp("Код клеймения не найден в системе");
    }

    //Проверяем, что Дата исходящего была не позднее текущей даты
    var date = new Date();
    date.setHours(date.getUTCHours() + 3);
    date.setUTCHours(0, 0, 0, 0);
    var application_date = new Date(params.output_application_date);
    application_date.setHours(application_date.getUTCHours() + 3);
    application_date.setUTCHours(0, 0, 0, 0);
    if (application_date.getTime() > date.getTime()) {
        return badResp("\"Дата исходящего\" должна быть не позднее текущей даты.");
    }

    //Получение пользователя
    var user = getcurrentuser();
    if(isNullObject(user)){
        return badResp("Не удалось получить информацию о пользователе");
	}

    if (ischeckfields()){
        var userValidateErrors = [];
        if(isEmptyString(user.firstname)){
            userValidateErrors.push("\"Имя\" ");
        }

        if(isEmptyString(user.lastname)){
            userValidateErrors.push("\"Фамилия\" ");
        }

        if(isEmptyString(user.patronymic)){
            userValidateErrors.push("\"Отчество\" ");
        }
        if(isEmptyString(user.email)){
            userValidateErrors.push("\"Электронная почта\" ");
        }
        if(isNotEmptyOrNullArray(userValidateErrors)){
            return badResp(userValidateErrors.length > 1? 
                String().concat("Заполните в профиле пользователя поля ", userValidateErrors.join(", ")) :
                String().concat("Заполните в профиле пользователя поле ", userValidateErrors.join(", ")) );
        }
    }

    //Получение неучтенных узлов
    var not_allowed_nodes_1 = db.findbyparams("reestr_ke_nodes", {
        is_registratred_in_rzd: false,
        status: "823cc6e9-465b-416e-beda-8a642149c235",
        manufacturer_details: member.recid,
        assembly_element_type: "62b3559e-10da-4189-8b25-d558ba451ac8"   //сборочная единица
    });
    var not_allowed_nodes_2 = db.findbyparams("reestr_ke_nodes", {
        is_registratred_in_rzd: false,
        status: "01d8f0ce-28db-4d3d-a956-38bb26260437",
        manufacturer_details: member.recid,
        assembly_element_type: "62b3559e-10da-4189-8b25-d558ba451ac8"   //сборочная единица
    });
    var not_allowed_nodes_3 = db.findbyparams("reestr_ke_nodes", {
        is_registratred_in_rzd: false,
        status: "f831cffa-e2ce-417f-8b4f-1645715bd454",
        manufacturer_details: member.recid,
        assembly_element_type: "62b3559e-10da-4189-8b25-d558ba451ac8"   //сборочная единица
    });
    var not_allowed_nodes_4 = db.findbyparams("reestr_ke_nodes", {
        is_registratred_in_rzd: false,
        status: "25d67987-0cd4-404a-85d7-847d142af11f",
        manufacturer_details: member.recid,
        assembly_element_type: "62b3559e-10da-4189-8b25-d558ba451ac8"   //сборочная единица
    });

    var not_allowed_nodes = (!!not_allowed_nodes_1? not_allowed_nodes_1 : []).concat(!!not_allowed_nodes_2 ? not_allowed_nodes_2 : [], !!not_allowed_nodes_3 ? not_allowed_nodes_3 : [], !!not_allowed_nodes_4 ? not_allowed_nodes_4 : []);
    
    if(isEmptyOrNullArray(not_allowed_nodes)){
        return badResp("Не найдено элементов для учета");
    }
    
    if (params.selectedRecords != null ){
        not_allowed_nodes = params.selectedRecords;
    }
    
    //Игнор СЕ с заявлениями на учет НЕ в финальном статусе
    var nodes_without_applications = [];
    for(var i = 0; i < not_allowed_nodes.length; i++){
        var node = not_allowed_nodes[i];
        //Проверка наличия заявления у СЕ

        //Проверка дочерних СЕ с заявлениями на учет
        var child_nodes = db.findbyparams("reestr_ke_nodes",{
            parent_ke_node: node.recid
        });
        if(!isEmptyOrNullArray(child_nodes)){
            var has_not_final_application = false;
            for(var j = 0; j < child_nodes.length; j++){
                var child_node = child_nodes[j];
                if(!isEmptyString(child_node.application_id)){
                    var child_node_application = db.findbyrecid("reestr_applications_for_key_elements_registration", child_node.application_id);
                    if(!isNullObject(child_node_application)){
                        if(child_node_application.status != '56b4391b-82bc-42b5-a466-91d21db8022b'){
                            has_not_final_application = true;
                        }
                    }
                }
            }
            if(has_not_final_application){
                continue;
            }
        }

        //Проверка дочерних КЭ с заявлениями на учет
        var child_key_elements = db.findbyparams("reestr_key_elements",{
            ke_node: node.recid
        });
        if(!isEmptyOrNullArray(child_key_elements)){
            var has_not_final_application = false;
            for(var j = 0; j < child_key_elements.length; j++){
                var child_key_element = child_key_elements[j];
                if(!isEmptyString(child_key_element.application_id)){
                    var child_key_element_application = db.findbyrecid("reestr_applications_for_key_elements_registration", child_key_element.application_id);
                    if(!isNullObject(child_key_element_application)){
                        if(child_key_element_application.status != '56b4391b-82bc-42b5-a466-91d21db8022b'){
                            has_not_final_application = true;
                        }
                    }
                }
            }
            if(has_not_final_application){
                continue;
            }
        }

        //Проверка заявления родительского СЕ
        if(!isEmptyString(node.application_id)){
            var application = db.findbyrecid("reestr_applications_for_key_elements_registration", node.application_id);
            if(!isNullObject(application)){
                if(application.status != '56b4391b-82bc-42b5-a466-91d21db8022b'){
                    continue;
                }else{
                    nodes_without_applications.push(node); 
                }
            }else{
                nodes_without_applications.push(node); 
            }
        }else{
            nodes_without_applications.push(node); 
        }
    }
    not_allowed_nodes = nodes_without_applications;

    //Разбиение на чанки
    var max_elems_in_chunk = 2;
    var chunks_count = 0;
    //Вычисление количества чанков
    if(not_allowed_nodes.length > max_elems_in_chunk){
        chunks_count = Math.ceil(not_allowed_nodes.length / max_elems_in_chunk);
    }else{
        chunks_count = 1;
    }
    
    //Разбиение массива неучтенных узлов
    var not_allowed_nodes_chunked = [];
    var last_index = 0;
    for(var i = 0; i < chunks_count; i++){
        var chunk = [];
        for(var j = 0; j < max_elems_in_chunk; j++){
            if((last_index + 1) <= not_allowed_nodes.length){
                chunk.push(not_allowed_nodes[last_index]);
            }
            last_index = last_index + 1;
        }
        if(chunk.length > 0){
            not_allowed_nodes_chunked.push(chunk);
        }
    }
    var chunked_files_ids = []; 
	var reestr_applications_for_key_elements_registration_records = [];
    //Создание записей в реестр учета
    for(var i = 0; i < not_allowed_nodes_chunked.length; i++){
        var chunk = not_allowed_nodes_chunked[i];
        var files_ids_chunk = [];
        var records_in_chunk_ids = [];
        var key_elements_for_allow = []; // массив элементов к учету (recid СЧ, не файлов, а recid ЭП СЧ)
        var application_recid = null;

        var key_elements_in_nodes = [];
        var ke_nodes_in_nodes = [];
        for(var j = 0; j < chunk.length; j++){
            var item = chunk[j];
            var key_elements = db.findbyparams("reestr_key_elements", {
                ke_node: item.recid,
                is_registratred_in_rzd: false
            })

            var nodes = db.findbyparams("reestr_ke_nodes", {
                parent_ke_node: item.recid,
                is_registratred_in_rzd: false,
                assembly_element_type: "62b3559e-10da-4189-8b25-d558ba451ac8"
            })

            if(!isEmptyOrNullArray(key_elements)){
                key_elements_in_nodes = key_elements_in_nodes.concat(key_elements);
            }
            if(!isEmptyOrNullArray(nodes)){
                ke_nodes_in_nodes = ke_nodes_in_nodes.concat(nodes);
            }
        }
        
        var user = getcurrentuser();
        var user_fullname = String().concat(user.lastname, " ", user.firstname, " ", user.patronymic);
        var reestr_applications_for_key_elements_registration_data = {
            member: member.recid,
            recname: String().concat(member.unique_member_identifier, "-", get_autoincremented_idx("application_number").toString()),
            reason: registration_reasons.first_reason,
            reason1: true,
            count_ke_ce: chunk.length + key_elements_in_nodes.length + ke_nodes_in_nodes.length,
            fio: user_fullname,
            phone: user.phonenumber,
            status: null,
            output_application_number: params.output_application_number,
            output_application_date: params.output_application_date
        }
    
        var reestr_applications_for_key_elements_registration_record = db.insert("reestr_applications_for_key_elements_registration", reestr_applications_for_key_elements_registration_data);
        if(isNullObject(reestr_applications_for_key_elements_registration_record)){
            return badResp("Не удалось создать новое заявление");
        }
        reestr_applications_for_key_elements_registration_records.push(reestr_applications_for_key_elements_registration_record);
        var accepted_assembly_units_uin_array = [];
        //Создание извещений
        for(var j = 0; j < chunk.length; j++){
            accepted_assembly_units_uin_array.push(chunk[j].unique_number);
            chunk[j].application_recid = reestr_applications_for_key_elements_registration_record.recid;

          
        }
        //var accepted_assembly_units_uin = accepted_assembly_units_uin_array.join();
        not_allowed_nodes_chunked[i] = chunk;
        for (let k = 0; k < chunk.length; k++) {
            var ke_in_chunk = chunk[k];
            var key_element = db.findbyrecid("reestr_ke_nodes", ke_in_chunk.recid);
           
            key_element.application_id = reestr_applications_for_key_elements_registration_record.recid;
            var update_res = db.update("reestr_ke_nodes", key_element);
           
            if(!update_res){
                return badResp("Не удалось обновить запись заявления");
            }
        }

        for(var j = 0; j < chunk.length; j++){
            //Проверка наличия заявления у СЕ
            if(!isEmptyString(chunk[j].application_id)){
                var application = db.findbyrecid("reestr_applications_for_key_elements_registration", chunk[j].application_id);
                if(!isNullObject(application)){
                    if(application.status != '56b4391b-82bc-42b5-a466-91d21db8022b'){
                        continue;
                    }
                }
            }

            //Получение УИН СЕ
            var ke_number = db.findbyrecid("ke_numbers", chunk[j].unique_number_relation);
            if(isNullObject(ke_number)){
                return badResp("УИН СЕ не найден в системе");
            }

            var attached_files = getattachedfileincolumn("reestr_ke_nodes", "node_passport_file", chunk[j].recid);
            if(isEmptyOrNullArray(attached_files)){
                return badResp("Файл ЭП СЕ отсутствует в карточке СЕ");
            }
            var attached_file = attached_files[0];
            var file_content_object = ParseFileToObject(attached_file.recId);
            if(!file_content_object.success){
                return badResp("Не удалось получить содержимое файла ЭП СЕ")
            }
            file_content_object = JSON.parse(file_content_object.data.toString());
            
            // Формирование json-файла
            var save_content_as_file_result = SaveContentAsFileAsync(
                "reestr_applications_for_key_elements_registration", 
                chunk[j].application_recid, 
                "files", 
                ke_number.recname, 
                "json", 
                JSON.stringify(file_content_object)
                );

            if(!save_content_as_file_result.success){
                return save_content_as_file_result;
            }

            //Получение ЭП СЧ неучтенных дочерних СЧ
            var child_key_elements = db.findbyparams("reestr_key_elements", {
                ke_node: chunk[j].recid
            });
            if(isEmptyOrNullArray(child_key_elements)){
                child_key_elements = [];
            }
            for(var a = 0; a < child_key_elements.length; a++){
                var child_key_element = child_key_elements[a];
                if(child_key_element.is_registratred_in_rzd != true){
                    var child_key_element_passport_files = getattachedfileincolumn("reestr_key_elements", "key_element_passport_file", child_key_element.recid);
                    if(isEmptyOrNullArray(child_key_element_passport_files)){
                        return badResp("ЭП дочернего неучтенного СЧ не найден в системе");
                    }
                    var child_key_element_passport_file = child_key_element_passport_files[0];
                    var child_key_element_passport_file_content = ParseFileToObject(child_key_element_passport_file.recId);
                    if(!child_key_element_passport_file_content.success){
                        return badResp("Не удалось получить содержимое файла ЭП дочернего неучтенного СЧ");
                    }

                    //Получение записи УИН для дочернего КЭ
                    var child_key_element_ke_number = db.findbyrecid("ke_numbers", child_key_element.ke_number);
                    if(isNullObject(child_key_element_ke_number)){
                        return badResp("Не удалось получить УИН дочернего неучтенного КЭ");
                    }

                    //Прикладывание файлов
                    var save_child_key_element_content_as_file_result = SaveContentAsFileAsync("reestr_applications_for_key_elements_registration", chunk[j].application_recid, "generated_application_file", child_key_element_ke_number.recname, "json", JSON.stringify(JSON.parse(child_key_element_passport_file_content.data.toString())))
                    if(!save_child_key_element_content_as_file_result.success){
                        return save_child_key_element_content_as_file_result;
                    }
                    key_elements_for_allow.push(child_key_element.recid);

                    var key_element = db.findbyrecid("reestr_key_elements", child_key_element.recid);
           
                    key_element.application_id = reestr_applications_for_key_elements_registration_record.recid;

                    key_element.file_name_in_archive = String().concat(child_key_element.numberke, ".json");

                    var update_res = db.update("reestr_key_elements", key_element);
                
                    if(!update_res){
                        return badResp("Не удалось обновить запись заявления");
                    }
                    
                    files_ids_chunk.push(save_child_key_element_content_as_file_result.data.result.recId);
                }
            }
            
            //Получение ЭП СЕ неучтенных дочерних СЕ
            var child_nodes = db.findbyparams("reestr_ke_nodes", {
                assembly_element_type: "62b3559e-10da-4189-8b25-d558ba451ac8",
                parent_ke_node: chunk[j].recid,
                is_registratred_in_rzd: false,
                status: "01d8f0ce-28db-4d3d-a956-38bb26260437"
            });

            if(isEmptyOrNullArray(child_nodes)){
                child_nodes = [];
            }
            for(var a = 0; a < child_nodes.length; a++){
                var child_node = child_nodes[a];
                
                if(child_node.is_registratred_in_rzd != true){
                    var child_node_passport_files = getattachedfileincolumn("reestr_ke_nodes", "node_passport_file", child_node.recid);
                    if(isEmptyOrNullArray(child_node_passport_files)){
                        return badResp("ЭП дочернего неучтенного СЕ не найден в системе");
                    }
                    var child_node_passport_file = child_node_passport_files[0];
                    var child_node_passport_file_content = ParseFileToObject(child_node_passport_file.recId);
                    if(!child_node_passport_file_content.success){
                        return badResp("Не удалось получить содержимое файла ЭП дочернего неучтенного СЕ");
                    }

                    //Получение записи УИН для дочернего СЕ
                    var child_node_ke_number = db.findbyrecid("ke_numbers", child_node.unique_number_relation);
                    if(isNullObject(child_node_ke_number)){
                        return badResp("Не удалось получить УИН дочернего неучтенного СЕ");
                    }

                    //Прикладывание файлов
                    var save_child_node_content_as_file_result = SaveContentAsFileAsync("reestr_applications_for_key_elements_registration", chunk[j].application_recid, "generated_application_file", child_node_ke_number.recname, "json", JSON.stringify(JSON.parse(child_node_passport_file_content.data.toString())))
                    if(!save_child_node_content_as_file_result.success){
                        return save_child_node_content_as_file_result;
                    }
                    //Доработка в рамках https://rm.mfc.ru/issues/38528
                    child_node.application_id = reestr_applications_for_key_elements_registration_record.recid;

                    child_node.file_name_in_archive = String().concat(child_node.unique_number, ".json");

                    var update_res = db.update("reestr_ke_nodes", child_node);
                
                    if(!update_res){
                        return badResp("Не удалось обновить запись заявления");
                    }

                    files_ids_chunk.push(save_child_node_content_as_file_result.data.result.recId);
                }
            }

            // Формирование и запись наименование файла json
            var reestr_ke_node_field = db.findbyrecid("reestr_ke_nodes", chunk[j].recid);
           
            reestr_ke_node_field.file_name_in_archive = String().concat(ke_number.recname, ".json");
            var update_result = db.update("reestr_ke_nodes", reestr_ke_node_field);
           
            if(!update_result){
                return badResp("Не удалось обновить запись заявления");
            }

            files_ids_chunk.push(save_content_as_file_result.data.result.recId);
            records_in_chunk_ids.push(chunk[j].recid);
            application_recid = chunk[j].application_recid;
        }

        var title = "сборочных единиц";
            
            var report_params = {
                ke_or_ce: title,
                reason_ke_ce: title,
                count_ke_ce_name: title,
                list_ke_ce_elements: title,
                full_name: member.fullname,
                short_name: String().concat(branding_code.recname, ", ", branding_code.code),
                actual_adress: member.actualadress,
                email: member.email,
                inn: member.inn,
                ogrn: member.ogrn,
                reason: reestr_applications_for_key_elements_registration_record.reason,
                count_ke_ce: chunk.length.toString(),
                fio: reestr_applications_for_key_elements_registration_record.fio,
                phone: reestr_applications_for_key_elements_registration_record.phone,
                output_application_number: reestr_applications_for_key_elements_registration_record.output_application_number,
                output_application_date: reestr_applications_for_key_elements_registration_record.output_application_date,
                application_recid: reestr_applications_for_key_elements_registration_record.recid
            };
            
            //Формирование и прикладывание извещения
            var add_notice_res = prepare_and_add_notice("reportnoticeforregistrationmultipleassemblyunit", report_params, "notice_file", "reestr_applications_for_key_elements_registration", reestr_applications_for_key_elements_registration_record.recid, String().concat("Заявление на учет СЕ №", reestr_applications_for_key_elements_registration_record.recname.toString()));
            if(!add_notice_res.success){
                return badResp(add_notice_res.message)
            }

            chunked_files_ids.push(files_ids_chunk);

       // records_in_chunk_ids.push({"allow_key_elements": elements_for_allow});
        var all_elements_for_allow = {
            "key_elements": key_elements_for_allow,
            "node": records_in_chunk_ids
        }
       
        var reestr_applications_for_key_elements_registration_record = db.findbyrecid("reestr_applications_for_key_elements_registration", application_recid);
        reestr_applications_for_key_elements_registration_record.status = "c63d14c0-3464-4849-af6b-7446b4129dd9";
        reestr_applications_for_key_elements_registration_record.registered_entity_id = JSON.stringify(all_elements_for_allow);
        reestr_applications_for_key_elements_registration_record.registered_entity_type = "assembly_units_archive";

        var updres = db.update("reestr_applications_for_key_elements_registration", reestr_applications_for_key_elements_registration_record);
        if(!updres){
            return badResp("Не удалось обновить запись заявления");
        }
    }
    


    //Упаковка файлов в архив и удаление файлов, из которых архив был собран
    for(var i = 0; i < chunked_files_ids.length; i++){
        var chunk = chunked_files_ids[i];
        var packRes = PackFileToZipArchive(
            String().concat("Приложения к заявлению №", reestr_applications_for_key_elements_registration_records[i].recname.toString()),
            "reestr_applications_for_key_elements_registration", 
            not_allowed_nodes_chunked[i][0].application_recid, 
            "files", 
            chunk,
            false)
            
        if(!packRes.success){
            return packRes;
        }
        var packRes = PackFileToZipArchive(
           String().concat("Приложения к заявлению №", reestr_applications_for_key_elements_registration_records[i].recname.toString()),  
            "reestr_applications_for_key_elements_registration",
            not_allowed_nodes_chunked[i][0].application_recid, 
            "generated_application_file", 
            chunk,
            false)

        if(!packRes.success){
            return packRes;
        }
        //Удаление файлов
        for(var j = 0; j < chunk.length; j++){
            var delete_file_res = delete_files(chunk[j]);
            if(!delete_file_res.success){
                return delete_file_res;
            }
        }

        //Доработка в рамках https://rm.mfc.ru/issues/41231, проставляю ссылку на заявление учёта для дочерних СЧ
        if(isNotEmptyOrNullArray(key_elements_in_nodes)){
            key_elements_in_nodes.forEach(function(element){
                if(!element.is_registered_in_rzd){
                    element.is_allow_key_element = true;
                    element.application_id = reestr_applications_for_key_elements_registration_records[i].recid;
                    var reestr_ke_element_update = db.update("reestr_key_elements", element);
                    if(!reestr_ke_element_update){
                        return badResp("Не удалось обновить запись СЧ");
                    }
                }
            });
        }
        //Доработка в рамках https://rm.mfc.ru/issues/38528, проставляю ссылку на заявление учёта для дочерних СЕ
        if(isNotEmptyOrNullArray(ke_nodes_in_nodes)){
            ke_nodes_in_nodes.forEach(function(element){
                if(!element.is_registered_in_rzd){
                    element.is_allow_key_element = true;
                    element.application_id = reestr_applications_for_key_elements_registration_records[i].recid;
                    var reestr_ke_node_update = db.update("reestr_ke_nodes", element);
                    if(!reestr_ke_node_update){
                        return badResp("Не удалось обновить запись СE");
                    }
                }
            });
        }
    }
    
    //Простановка флага для учитываемых узлов
    for(var i = 0; i < not_allowed_nodes.length; i++){
        var not_allowed_node = not_allowed_nodes[i];
        var ce_unit_fields = db.findbyrecid("reestr_ke_nodes", not_allowed_node.recid);
        ce_unit_fields.is_allow_ce_element = true;
        db.update("reestr_ke_nodes", ce_unit_fields);
    }
    return successResp("Сформировано заявлений для учета сборочных единиц - " + not_allowed_nodes.length.toString());
}

/**
 * Функция для получения автоинкрементированного индекса
 * возможные значения
 * "" - 
 * aku - номер АКУ (общий для всех типов заявлений)
 * uip - номер УИП (общий для всех типов заявлений)
 * application_number - номер заявления (общий для всех типов заявлений)
 * @param {тип индекса} type 
 */
function get_autoincremented_idx(type){
    var rzd_url = get_rzd_urls_portal_settings();
    if(!rzd_url.success){
        return rzd_url;
    }

    var last_index = 1;
    if (isEmptyString(type)){
        var dictionaryUniqueIndexesRespUrl = String().concat(
            rzd_url.rzd_name_url,
            "/odata/dictionary_unique_indexes?$filter=(recstate eq 1)");
    
        var dictionaryUniqueIndexesResp = sendRequest("GET", null, dictionaryUniqueIndexesRespUrl, null);
        var dictionaryUniqueIndexes = dictionaryUniqueIndexesResp.value;
        if (isEmptyOrNullArray(dictionaryUniqueIndexes))
            return null;

        if(!isEmptyOrNullArray(dictionaryUniqueIndexes)){
            var sortList = dictionaryUniqueIndexes.sort(function(a, b)  {return Number(b.reccode) - Number(a.reccode)})
            last_index = Number(sortList[0].reccode) + 1;
        }

        var sendRes = UpdateRecordToOuterRdev("dictionary_unique_indexes", {reccode: last_index}, rzd_url.rzd_name_url);
        if(!sendRes.success){
            return sendRes;
        }
    }
    else {
        var dictionaryUniqueIndexesRespUrl = String().concat(
            rzd_url.rzd_name_url,
            "/odata/dictionary_unique_indexes?$filter=(recstate eq 1) and (recname eq '", type ,"')");
    
        var dictionaryUniqueIndexesResp = sendRequest("GET", null, dictionaryUniqueIndexesRespUrl, null);
        var dictionaryUniqueIndexes = dictionaryUniqueIndexesResp.value;
        if (isEmptyOrNullArray(dictionaryUniqueIndexes))
            return null;

        if(!isEmptyOrNullArray(dictionaryUniqueIndexes)){    
            var sortList = dictionaryUniqueIndexes.sort(function(a, b)  {return Number(b.reccode) - Number(a.reccode)})
            last_index = Number(sortList[0].reccode) + 1;
        }

        var sendRes = InsertRecordToOuterRdev("dictionary_unique_indexes", {recname: type, reccode: last_index}, rzd_url.rzd_name_url);
        if(!sendRes.success){
            return sendRes;
        }

    }
    return last_index;
}

// Перегенрация отчета после подписывания архива в карточке заявления на учет
function regenarate_report_elements_registration(params){

    var applications_recid = JSON.stringify(params.recordIdList);
	var paramteres = {
		"recid_applications": applications_recid,
		"table_name": "reestr_applications_for_key_elements_registration",
		"field_name_file": "generated_application_file"
	}
	//Вызываем метод из плагина
    var res = plugins.callAsMethod("/plugins/nbdlogicplugin/regenarate_report_elements_registration", "post", paramteres, null);
	return res;
}

// Массовая перегенрация отчетов после подписывания архивов в карточке заявления на учет
function regenarate_report_elements_registration_multiple(params){
    /* var formed_applications = db.findbyparams("reestr_applications_for_key_elements_registration", {
        status: "c63d14c0-3464-4849-af6b-7446b4129dd9"  //Сформировано
    });
    if(isEmptyOrNullArray(formed_applications)){
        return {
            success: false,
            message: "Не найдено заявлений для перегенерации",
            data: []
        }
    } */

    var reestr_applications_for_key_elements_registration_records = params.recordIdList;
	var reestr_applications_for_key_elements_registration_arr = [];
	for (let j = 0; j < reestr_applications_for_key_elements_registration_records.length; j++) {
		var reestr_applications_for_key_elements_registration_record = db.findbyrecid("reestr_applications_for_key_elements_registration", reestr_applications_for_key_elements_registration_records[j]);
		reestr_applications_for_key_elements_registration_arr.push(reestr_applications_for_key_elements_registration_record);
	}
	
	/* var applications = db.findbyparams("rfid_request", {
		rfid_request_status: 5
	}) */
	if(isEmptyOrNullArray(reestr_applications_for_key_elements_registration_arr)){
		return {
			success: true,
			message: "Не найдено заявлений для подписи",
			data: []
		}
    }
    
    for(var i = 0; i < reestr_applications_for_key_elements_registration_arr.length; i++){
        
        var reestr_applications_for_key_elements_registration_record = db.findbyrecid("reestr_applications_for_key_elements_registration", reestr_applications_for_key_elements_registration_arr[i].recid);
        
        var member = db.findbyrecid("reestr_members", reestr_applications_for_key_elements_registration_record.member);
        if(isEmptyString(member.branding_code)){
            return badResp("Не удалось определить сокращенное наименование производителя");
        }
        var branding_code = db.findbyrecid("dictionary_branding_codes", member.branding_code);
        if(isNullObject(branding_code)){
            return badResp("Код клеймения не найден в системе");
        }

        //получение хэш суммы подписанного архива
        var attached_files = getattachedfileincolumn("reestr_applications_for_key_elements_registration", "generated_application_file", reestr_applications_for_key_elements_registration_record.recid);
        if(isEmptyOrNullArray(attached_files)){
            return {
                success: false, 
                message: "Не найдено файлов для подписания",
                data: []
            }
        }
        var url = String().concat(host, "/cryptography/signinfo/", attached_files[0].recId);
        var sing_res = sendRequest("GET", null, url, null);
        var report = null; //системное наименование отчета
        var report_name = null;
        switch (reestr_applications_for_key_elements_registration_record.registered_entity_type) {
            case "key_element":
                report = "reportnoticeforregistrationkeyelementwithhash";
                report_name = "Заявление на учет СЧ №";
                // Получаем запись ЭП СЧ
                var reestr_key_elem_fields = db.findbyrecid("reestr_key_elements", reestr_applications_for_key_elements_registration_record.registered_entity_id)
                // Формирование параметров для отчета
                var title = "составных частей";
                var report_params = {
                    ke_or_ce: title,
                    reason_ke_ce: title,
                    count_ke_ce_name: title,
                    list_ke_ce_elements: title,
                    full_name: member.fullname,
                    short_name: String().concat(branding_code.recname, ", ", branding_code.code),
                    actual_adress: member.actualadress,
                    email: member.email,
                    inn: member.inn,
                    ogrn: member.ogrn,
                    reason: reestr_applications_for_key_elements_registration_record.reason,
                    count_ke_ce: reestr_applications_for_key_elements_registration_record.count_ke_ce,
                    uin: reestr_key_elem_fields.numberke,
                    name_element: reestr_key_elem_fields.key_element_code_calculated,
                    name_json: reestr_key_elem_fields.file_name_in_archive,
                    fio: reestr_applications_for_key_elements_registration_record.fio,
                    phone: reestr_applications_for_key_elements_registration_record.phone,
                    output_application_number: reestr_applications_for_key_elements_registration_record.output_application_number,
                    output_application_date: reestr_applications_for_key_elements_registration_record.output_application_date,
                    hash_arhive: sing_res.hash
                };
                
                break;
            case "key_elements_archive":
                report = "reportnoticeforregistrationmultiplekeyelementwithhash";
                report_name = "Заявление на учет СЧ №";
                var title = "составных частей";
                var report_params = {
                    ke_or_ce: title,
                    reason_ke_ce: title,
                    count_ke_ce_name: title,
                    list_ke_ce_elements: title,
                    full_name: member.fullname,
                    short_name: String().concat(branding_code.recname, ", ", branding_code.code),
                    actual_adress: member.actualadress,
                    email: member.email,
                    inn: member.inn,
                    ogrn: member.ogrn,
                    reason: reestr_applications_for_key_elements_registration_record.reason,
                    count_ke_ce: reestr_applications_for_key_elements_registration_record.count_ke_ce,
                    fio: reestr_applications_for_key_elements_registration_record.fio,
                    phone: reestr_applications_for_key_elements_registration_record.phone,
                    output_application_number: reestr_applications_for_key_elements_registration_record.output_application_number,
                    output_application_date: reestr_applications_for_key_elements_registration_record.output_application_date,
                    key_element_recid: reestr_applications_for_key_elements_registration_record.recid,
                    hash_arhive: sing_res.hash
                };
                break;
            case "node":
                report = "reportnoticeforregistrationassemblyunitwithhash";
                report_name = "Заявление на учет СЕ №";
                
                var recid_assemblyunit = JSON.parse(reestr_applications_for_key_elements_registration_record.registered_entity_id).node;
                var count_ke = JSON.parse(reestr_applications_for_key_elements_registration_record.registered_entity_id).key_elements.length;
                
                var reestr_ke_nodes_fields = db.findbyrecid("reestr_ke_nodes", recid_assemblyunit);
                var report_params = {
                    full_name: member.fullname,
                    short_name: String().concat(branding_code.recname, ", ", branding_code.code),
                    actual_adress: member.actualadress,
                    email: member.email,
                    inn: member.inn,
                    ogrn: member.ogrn,
                    reason: reestr_applications_for_key_elements_registration_record.reason,
                    count_key_elements: count_ke,
                    count_assembly_units: 1,
                    uin: reestr_ke_nodes_fields.unique_number,
                    fio: reestr_applications_for_key_elements_registration_record.fio,
                    phone: reestr_applications_for_key_elements_registration_record.phone,
                    assembly_unit_recid: reestr_ke_nodes_fields.recid,
                    output_application_number: params.output_application_number,
                    output_application_date: params.output_application_date,
                    hash_arhive: sing_res.hash
                };
                break;
            case "assembly_units_archive":
                report = "reportnoticeforregistrationmultipleassemblyunitwithhash";
                report_name = "Заявление на учет СЕ №";
                var title = "сборочных единиц";
                
                var report_params = {
                    ke_or_ce: title,
                    reason_ke_ce: title,
                    count_ke_ce_name: title,
                    list_ke_ce_elements: title,
                    full_name: member.fullname,
                    short_name: String().concat(branding_code.recname, ", ", branding_code.code),
                    actual_adress: member.actualadress,
                    email: member.email,
                    inn: member.inn,
                    ogrn: member.ogrn,
                    reason: reestr_applications_for_key_elements_registration_record.reason,
                    count_ke_ce: reestr_applications_for_key_elements_registration_record.count_ke_ce,
                    fio: reestr_applications_for_key_elements_registration_record.fio,
                    phone: reestr_applications_for_key_elements_registration_record.phone,
                    output_application_number: reestr_applications_for_key_elements_registration_record.output_application_number,
                    output_application_date: reestr_applications_for_key_elements_registration_record.output_application_date,
                    application_recid: reestr_applications_for_key_elements_registration_record.recid,
                    hash_arhive: sing_res.hash
                };
                break;
            case "vehicle":
                report = "reportnoticeforregistrationvagonwithhash";
                report_name = "Заявление на учет ТС №";
                var user = getcurrentuser();
                var user_fullname = String().concat(user.lastname, " ", user.firstname, " ", user.patronymic);

                var report_params = {
                    full_name: member.fullname,
                    short_name: member.fullname,
                    actual_adress: member.actualadress,
                    email: member.email,
                    inn: member.inn,
                    ogrn: member.ogrn,
                    reason: reestr_applications_for_key_elements_registration_record.reason,
                    count_ke_ce: reestr_applications_for_key_elements_registration_record.count_ke_ce,
                    vagonid: reestr_applications_for_key_elements_registration_record.registered_entity_id,
                    output_application_number: reestr_applications_for_key_elements_registration_record.output_application_number,
                    output_application_date: reestr_applications_for_key_elements_registration_record.output_application_date,
                    fio: user_fullname,
                    phone: user.phonenumber,
                    hash_arhive: sing_res.hash
                };
                break;
        
            default:
                break;
        }
        
        var attached_files = getattachedfileincolumn("reestr_applications_for_key_elements_registration", "notice_file", reestr_applications_for_key_elements_registration_record.recid);
        if(isEmptyOrNullArray(attached_files)){
            return {
                success: false, 
                message: "Не найдено файлов для удаления",
                data: []
            }
        }

        //Удаление файлов
        for(var j = 0; j < attached_files.length; j++){
            var delete_file_res = delete_files(attached_files[j].recId);
            if(!delete_file_res.success){
                return delete_file_res;
            }
        }

        //Формирование и прикладывание извещения
        var add_notice_res = prepare_and_add_notice(report, report_params, "notice_file", "reestr_applications_for_key_elements_registration", reestr_applications_for_key_elements_registration_record.recid, String().concat(report_name, reestr_applications_for_key_elements_registration_record.recname.toString()));
        
        if(!add_notice_res.success){
            return badResp(add_notice_res.message)
        }

        return {
            success: true, 
            message: "Заявление успешно создано",
            data: []
        }
        
        
    }

    return {
        success: true,
        message: "Заявления сгененрированы успешно",
        data: []
    }
}
// Учет СЧ через ctrl
function allow_multy_key_element(params){
    var parameters = {
        "selected_records": params.selectedRecords,
        "output_application_number": params.values.output_application_number
    }
    //Вызываем метод из плагина
    var res = plugins.callAsMethod("/plugins/nbdlogicplugin/allow_Key_elements", "post", parameters, null);
    return res;
}

// Учет СЕ через ctrl
function allow_multy_ce_element(params){
    var parameters = {
        "selected_records": params.selectedRecords,
        "output_application_number": params.values.output_application_number
    }
    //Вызываем метод из плагина
    var res = plugins.callAsMethod("/plugins/nbdlogicplugin/allow_assembly_units", "post", parameters, null);
    return res;
}

/**
 * Учет изготовления СЧ/СЕ, установленных на ТС
 * @param {*} param 
 */
 function allow_elements_registrated_in_rzd(params){
    if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
    var parameters = {
        "vehicle_recid": params.recid,
        "output_application_number": params.output_application_number
    }
    //Вызываем метод из плагина
    var res = plugins.callAsMethod("/plugins/nbdlogicplugin/allow_vehicle_elements", "post", parameters, null);
    return res;
}