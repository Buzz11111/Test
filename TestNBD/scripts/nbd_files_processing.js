/**
 * 
 * @param {*} tableName Имя таблицы
 * @param {*} recid     Идентификатор записи, в которой искать файл
 */
function getattachedfiles(tableName, recid) {
    if (tableName == "" || tableName == null)
    {
        errorLog("getattachedfiles", "Ошибка, значение tableName не может быть равно Null или Empty.");
        throw new Error("Ошибка, значение tableName не может быть равно Null или Empty.");
    }

    if (recid == "" || recid == null)
    {
        errorLog("getattachedfiles", "Ошибка, значение recid не может быть равно Null или Empty.");
        throw new Error("Ошибка, значение recid не может быть равно Null или Empty.");
    }

    var url = String().concat(host, "/api/files/list/", tableName, "/", recid);
    
    return sendRequest("GET", null, url, null);
}

function getattachedfilesInRZD(tableName, recid) {
    if (tableName == "" || tableName == null)
    {
        errorLog("getattachedfiles", "Ошибка, значение tableName не может быть равно Null или Empty.");
        throw new Error("Ошибка, значение tableName не может быть равно Null или Empty.");
    }

    if (recid == "" || recid == null)
    {
        errorLog("getattachedfiles", "Ошибка, значение recid не может быть равно Null или Empty.");
        throw new Error("Ошибка, значение recid не может быть равно Null или Empty.");
    }
    var rzd_url = get_rzd_urls_portal_settings();
    if(rzd_url.success){
    var url = String().concat(rzd_url.rzd_name_url, "/api/files/list/", tableName, "/", recid);
    }else{
        throw new Error("Ошибка, не удалось получить адрес АРМ Росжелдора");
    }
    return sendRequest("GET", null, url, null);
}

/**
 * Получение приложенных файлов в таблице по наименованию таблицы, колонки и идентификатору записи, в которой нужно искать приложенный файл
 * @param {*} table_name        Наименование таблицы
 * @param {*} column_name       Наименование колонки с файлом
 * @param {*} recid             Идентификатор записи
 */
function getattachedfileincolumn(table_name, column_name, recid){
    
    var files_record = getattachedfiles(table_name, recid);
    var files_records_data = files_record.data;
    if(isEmptyOrNullArray(files_records_data)){
        errorLog("getattachedfileincolumn", "Не найдено ни одного файла в таблице recid: " + recid);
        return []
    }
    var files = [];
    for(var i = 0; i < files_records_data.length; i++){
        var file_record = files_records_data[i];
        if(file_record.columnName == column_name){
            files.push(file_record);
        }
    }
    return files;
}

/**
 * Обработка объекта, полученного из файла после парсинга
 * @param {*} object                Объект
 * @param {*} filename              Имя файла
 * @param {*} application_record    Запись заявления
 */
function process_object_from_file(object, filename, application_record){
    var message_start = "Ошибка при парсинге файла \""+ filename +"\""

    //Проверка поля generated_file_from_manufacturer
    //Если true, возвращаем succes
    if(object.generated_file_from_manufacturer){
        return {
            success: true,
            generated_file_from_manufacturer: true
        };
    }
    //Проверка поля document_type
    if(isEmptyString(object.document_type)){
        return badResp(message_start + " не указан тип документа, заполните поле \"document_type\"")
    }
    //Проверка поля item_type
    if(isEmptyString(object.item_type)){
        return badResp(message_start + " не указан тип элемента, заполните поле \"item_type\"")
    }
    if(object.item_type == "составная часть"){
        var process_object_as_ke_application_res = process_object_as_ke_application(object, application_record);
        
        if(process_object_as_ke_application_res.success){
            return {
                success: true,
                message: process_object_as_ke_application_res.message,
                data: process_object_as_ke_application_res.data,
                type: "ke",
                generated_file_from_manufacturer: false
            };
        }else{
            return {
                success: false,
                message: message_start + " " + process_object_as_ke_application_res.message
            };
        }
    }else if(object.item_type == "Сборочная единица" || object.item_type == "Узел"){
        var process_object_as_node_application_res = process_object_as_node_application(object, application_record);
        if(process_object_as_node_application_res.success){
            return {
                success: true,
                message: process_object_as_node_application_res.message,
                data: process_object_as_node_application_res.data,
                type: process_object_as_node_application_res.type,
                generated_file_from_manufacturer: false
            };
        }else{
            return {
                success: false,
                message: message_start + " " + process_object_as_node_application_res.message,
                data: process_object_as_node_application_res.data
            };
        }
    }else if(object.item_type == "Транспортное средство"){
        var process_object_as_vehicle_appication_res = process_object_as_vehicle_appication(object, application_record);
        if(process_object_as_vehicle_appication_res.success){
            return {
                success: true, 
                message: process_object_as_vehicle_appication_res.message,
                data: process_object_as_vehicle_appication_res.data,
                type: process_object_as_vehicle_appication_res.type,
                generated_file_from_manufacturer: false,
                element: process_object_as_vehicle_appication_res.element,
                is_key_element: process_object_as_vehicle_appication_res.is_key_element,
            }
        }
        else{
            return {
                success: false,
                message: message_start + " " + process_object_as_vehicle_appication_res.message,
                data: process_object_as_vehicle_appication_res.data
            };
        }
    }else{
        return badResp(message_start + " неверно указан тип элемента, должен быть \"Сборочная единица\, \"Узел\" или \"составная часть\"")
    }
}

/**
 * Обработка объекта как заявления на регистрацию СЧ
 * @param {*} object    Объект
 * @param {*} application_record Запись заявления
 */
function process_object_as_ke_application(object, application_record){
    //Проверка структуры common_params
    if(isNullObject(object.common_params)){
        return badResp("Не заполнена структура \"common_params\", проверьте данные");
    }

    //Проверка структуры special_params
    if(isNullObject(object.special_params)){
        return badResp("Не заполнена структура \"special_params\", проверьте данные")
    }

    //Проверка структуры after_register_params
    if(isNullObject(object.after_register_params)){
        return badResp("Не заполнена структура \"after_register_params\", проверьте данные")
    }

    //Проверка полей в структура special_params
    var common_params = object.common_params;

    //Поле ke_number
    if(isEmptyString(common_params.ke_number)){
        return badResp("Не заполнено поле \"ke_number\" в структуре \"common_params\"")
    }
    //Поле method_of_marking
    if(isEmptyString(common_params.method_of_marking)){
        return badResp("Не заполнено поле \"method_of_marking\" в структуре \"common_params\"")
    }
    //Поле key_element_code
    if(!isEmptyString(common_params.key_element_code)){
        // Проверка, что наименование указано корректно, поиск соответствия в справочнике dictionary_key_elements_codes (Условные коды деталей)
        var dictionary_key_elements_codes_fields = db.findbyparams("dictionary_key_elements_codes", {
            recname: common_params.key_element_code
        });
        if (isEmptyOrNullArray(dictionary_key_elements_codes_fields)){
            return badResp("Значение поля \"key_element_code\" в структуре \"common_params\" является недопустимым")
        }
    } else {
        return badResp("Не заполнено поле \"key_element_code\" в структуре \"common_params\"")
    }
    //Поле documentation_number
    if(isEmptyString(common_params.documentation_number)){
        return badResp("Не заполнено поле \"documentation_number\" в структуре \"common_params\"")
    }
    //Поле date_manufacture
    if(isEmptyString(common_params.date_manufacture)){
        return badResp("Не заполнено поле \"date_manufacture\" в структуре \"common_params\"")
    }

    //Получение идентификатора типа СЧ по его наименованию
    var key_element_type_id_res = get_key_element_type(common_params.key_element_code);
    if(!key_element_type_id_res.success){
        return badResp(key_element_type_id_res.message);
    }

    var key_element_code = db.findbyrecid("dictionary_key_elements_codes", key_element_type_id_res.data);
    if(isNullObject(key_element_code)){
        return badResp("Тип составной части не найден в системе");
    }

    //Получение номера СЧ в системе
    var key_element_numbers = db.findbyparams("ke_numbers", {
        recname: common_params.ke_number
    });
    if(isEmptyOrNullArray(key_element_numbers)){
        return badResp("Указанный УИН не найден в системе");
    }
    var key_element_number = key_element_numbers[0]
    if(key_element_number.number_status != 'f0849fb8-def2-405d-9166-d4c8866202b6'){
        return badResp("Указанный УИН занят")
    }

    if(isEmptyString(key_element_number.rfid_request)){
        return badResp("Указанный УИН не содержит информации о владельце");
    }

    //Проверка что владелец существует в системе
    var member = db.findbyrecid("reestr_members", application_record.member);
    if(isNullObject(member)){
        return badResp("Владелец не найден в системе");
    }

    //Проверка что указанный владелец соответствует владельцу номера 
    if(member.recid != key_element_number.issuer){
        return badResp("Указанный УИН не может быть использован владельцем \"" + member.fullname + "\"");
    }

    //Проверка полей в структура after_register_params
    var after_register_params = object.after_register_params;

    //Поле acceptance_certificate
    if(isEmptyString(after_register_params.acceptance_certificate)){
        return badResp("Не заполнено поле \"acceptance_certificate\" в структуре \"after_register_params\"")
    }

    //Меняем поля на идентификаторы
    object.common_params.ke_number = key_element_number.recid;
    object.common_params.key_element_code = key_element_code.recid;
    object.common_params.manufacturer_details = member.recid;

    //Получение идентификаторов в БД по текстовым данным в объекте
    var get_ke_common_params_ids_result = get_ke_common_params_ids(object);
    if(!get_ke_common_params_ids_result.success){
        return badResp(get_ke_common_params_ids_result.message)
    }
    object.common_params = get_ke_common_params_ids_result.data;

    var get_key_element_special_params_ids_result = get_key_element_special_params_ids(object);
    if(!get_key_element_special_params_ids_result.success){
        return badResp(get_key_element_special_params_ids_result.message)
    }
    object.special_params = get_key_element_special_params_ids_result.data;

    var get_key_element_after_register_params_ids_result = get_key_element_after_register_params_ids(object);
    if(!get_key_element_after_register_params_ids_result.success){
        return badResp(get_key_element_after_register_params_ids_result.message)
    }
    object.after_register_params = get_key_element_after_register_params_ids_result.data;

    //Получение группы параметров для комплектации
    if(object.common_params.key_element_code == keyElementCodes.wheel_id || object.common_params.key_element_code == keyElementCodes.clear_axis_id || object.common_params.key_element_code == keyElementCodes.side_frame_id || object.common_params.key_element_code == keyElementCodes.pressure_beam_id){

        if(!isNullObject(object.params_for_complectation)){
            var get_key_element_params_for_complectation_result = get_key_element_params_for_complectation(object);
            if(!get_key_element_params_for_complectation_result.success){
                return get_key_element_params_for_complectation_result;
            }
            object.params_for_complectation = get_key_element_params_for_complectation_result.data;
        }

    }else{
        if(!isNullObject(object.params_for_complectation)){
            var get_key_element_params_for_complectation_result = get_key_element_params_for_complectation(object);
            if(!get_key_element_params_for_complectation_result.success){
                return get_key_element_params_for_complectation_result;
            }
            object.params_for_complectation = get_key_element_params_for_complectation_result.data;
        }
    }
    
    //Создание паспорта и выпуск в обращение
    var create_passport_resp = create_key_element_passport(object);

    return create_passport_resp;
}

/**
 * Обработка объекта как заявления на регистраицию узла
 * @param {*} object                Обрабатываемый объект
 * @param {*} application_record    Запись заявления
 */
function process_object_as_node_application(object, application_record){
    //Проверка структуры common_params
    if(isNullObject(object.common_params)){
        return badResp("Не заполнена структура \"common_params\", проверьте данные");
    }

    //Проверка структуры special_params
    if(isNullObject(object.special_params)){
        return badResp("Не заполнена структура \"special_params\", проверьте данные")
    }
    
  
    //Получение идентификатора типа узла
    var get_node_type_res = get_node_type(object.common_params.ke_node_type);
    if(!get_node_type_res.success){
        return badResp(get_node_type_res.message);
    }
    object.common_params.ke_node_type = get_node_type_res.data;
    
    //Получение идентификаторов параметров в группе общих параметров
    var get_node_common_params_ids_res = get_node_common_params_ids(object);
    if(!get_node_common_params_ids_res.success){
        return get_node_common_params_ids_res;
    }

    object.common_params = get_node_common_params_ids_res.data;

    //Проверка что владелец существует в системе
    var member = db.findbyrecid("reestr_members", application_record.member);
    if(isNullObject(member)){
        return badResp("Владелец не найден в системе");
    }
    object.memberid = member.recid;

    object.common_params.manufacturer_details = member.recid;

    //Получение инфы о номере СЧ
    var key_element_number = db.findbyrecid("ke_numbers", object.common_params.unique_number);
    if(key_element_number.number_status != 'f0849fb8-def2-405d-9166-d4c8866202b6'){
        return badResp("Указанный УИН занят")
    }

    if(isEmptyString(key_element_number.rfid_request)){
        return badResp("Указанный УИН не содержит информации о владельце");
    }

    //Проверка что указанный владелец соответствует владельцу номера 
    if(member.recid != key_element_number.issuer){
        return badResp("Указанный УИН не может быть использован владельцем \"" + member.fullname + "\"");
    }

    //Получение идентификаторов параметров в группе специальных параметров
    var get_node_special_params_ids_res = get_node_special_params_ids(object);
    if(!get_node_special_params_ids_res.success){
        return get_node_special_params_ids_res;
    }
    object.special_params = get_node_special_params_ids_res.data;

    if(object.common_params.ke_node_type != "79ddf686-f26f-4567-97ac-cb18eadd83e9" && object.common_params.ke_node_type != "c790c624-b93e-498b-97ba-0fb47f8b4b52"  && object.common_params.ke_node_type != "a6180bfa-368d-4eff-97f2-c4f6c2612bc6"){
        //Проверка структуры node_composition
        if(isNullObject(object.node_composition)){
        return badResp("Не заполнена структура \"node_composition\", проверьте данные");
        }
        //Получение идентификаторов сущностей, передаваемых в составе СЕ
        var get_node_composition_res = get_node_composition(object);
        if(!get_node_composition_res.success){
            return get_node_composition_res;
        }
        object.node_composition = get_node_composition_res.data;
    }

    var get_assembly_unit_after_register_params_ids_result = get_assembly_unit_after_register_params_ids(object);
    if(!get_assembly_unit_after_register_params_ids_result.success){
        return badResp(get_assembly_unit_after_register_params_ids_result.message)
    }
    object.after_register_params = get_assembly_unit_after_register_params_ids_result.data;

    //Создание паспорта элемента
    if(object.item_type == "Сборочная единица"){
        var create_assembly_unit_passport_res = create_assembly_unit_passport(object);
        return create_assembly_unit_passport_res;
    }else{
        //Создание паспорта узла
    }
}

/**
 * Обработка объекта как заявления на установку элемента на вагон
 * @param {*} object 
 * @param {*} application_record 
 */
function process_object_as_vehicle_appication(object, application_record){
    //Валидация входящих параметров
    //Номер ТС
    if(isEmptyString(object.vehicle_number)){
        return badResp("Параметр \"vehicle_number\" не может быть пустым")
    }
    //Получение записи с ТС
    var vehicles = db.findbyparams("reestr_vehicles", {
        manufacturer_number: object.vehicle_number
    })
    if(isEmptyOrNullArray(vehicles)){
        return badResp(String().concat("ТС с номером ", object.vehicle_number, " не найден в системе"));
    }
    var vehicle = vehicles[0];
    //Получение производителя ТС
    if(isEmptyString(object.vehicle_manufacturer)){
        return badResp("Параметр \"vehicle_manufacturer\" не может быть пустым");
    }
    var dictionary_branding_codes = db.findbyparams("dictionary_branding_codes", {
        code: object.vehicle_manufacturer
    });
    if(isEmptyOrNullArray(dictionary_branding_codes)){
        return badResp(String().concat("Код клеймения ", object.vehicle_manufacturer, " не найден в системе"));
    }
    var dictionary_branding_code = dictionary_branding_codes[0];
    var reestr_members = db.findbyparams("reestr_members", {
        branding_code: dictionary_branding_code.recid
    })
    if(isEmptyOrNullArray(reestr_members)){
        return badResp("Участник не найден в системе");
    }
    var member = reestr_members[0];

    //Получение осности вагона
    var vehicle_model = db.findbyrecid("dictionary_models", vehicle.dictionary_models);
    if(isNullObject(vehicle_model)){
        return badResp("Модель ТС не найдена в системе");
    }
    var vehicle_number_axes = vehicle_model.number_axes;

    //Устанавливаемый элемент
    if(isEmptyString(object.element)){
        return badResp("Поле \"element\" не может быть пустым");
    }
    //Получение записи элемента
    var ke_numbers = db.findbyparams("ke_numbers", {
        recname: object.element
    })
    if(isEmptyOrNullArray(ke_numbers)){
        return badResp(String().concat("УИН с номером \"", object.element, "\" не найден в системе"))
    }
    var ke_number = ke_numbers[0];

    var element = null;

    var elements_from_reestr_key_elements = db.findbyparams("reestr_key_elements", {
        ke_number: ke_number.recid
    })
    if(!isEmptyOrNullArray(elements_from_reestr_key_elements)){
        element = elements_from_reestr_key_elements[0];
    }else{
        var elements_from_reestr_ke_nodes = db.findbyparams("reestr_ke_nodes", {
            unique_number_relation: ke_number.recid
        });
        if(!isEmptyOrNullArray(elements_from_reestr_ke_nodes)){
            element = elements_from_reestr_ke_nodes[0];
        }
    }

    if(isNullObject(element)){
        return badResp("Запись элемента не найдена в системе");
    }

    var is_key_element = false;
    //Если элемент в заявлении это узел, то обрабатываем его как узел
    if(!isEmptyString(element.assembly_element_type)){
        //Получение всех занятых позиций на вагоне
        var all_installed_nodes = db.findbyparams("reestr_ke_nodes", {
            vehicle: vehicle.recid
        });
        if(isEmptyOrNullArray(all_installed_nodes)){
            all_installed_nodes = [];
        }
        var used_positions = [];
        for(var i = 0; i < all_installed_nodes.length; i++){
            if(!isEmptyString(all_installed_nodes[i].assembly_element_position_on_vagon)){
                used_positions.push(all_installed_nodes[i].assembly_element_position_on_vagon);
            }
        }
        //Получение возможных позиций на вагоне
        var possible_positions = db.findbyparams("dictionary_positions_on_vagon", {
            child_node_type: element.ke_node_type
        });
        /*Если возможных позиций не найдено, пытаемся получить дочерний СЧ и установить узел через него,
        иначе сканируем как через УИН СЕ*/
        if(isEmptyOrNullArray(possible_positions)){
            //Получаем СЧ из параметра child_element
            if(isEmptyString(object.child_element)){
                return badResp("Узел может поворачиваться, необходимо указать параметр \"child_element\"");
            }
            var child_ke_numbers = db.findbyparams("ke_numbers", {
                recname: object.child_element
            })
            if(isEmptyOrNullArray(child_ke_numbers)){
                return badResp(String().concat("УИН ", object.child_element, " не найден в системе"));
            }
            var child_ke_number = child_ke_numbers[0];
            //Получение записи СЧ
            var key_elements = db.findbyparams("reestr_key_elements", {
                ke_number: child_ke_number.recid
            });
            if(isEmptyOrNullArray(key_elements)){
                return badResp(String().concat("Дочерний СЧ ", child_ke_number.recname, " не найден в системе"));
            }
            var install_key_element_or_node_on_vagon_res = install_key_element_or_node_on_vagon(key_elements[0], vehicle, object, ke_number, member);
            if(!install_key_element_or_node_on_vagon_res.success){
                return install_key_element_or_node_on_vagon_res;
            }
        }else{
            //Получение свободных позиций
            var not_used_positions = [];
            for(var i = 0; i < possible_positions.length; i++){
                if(used_positions.indexOf(possible_positions[i].recid) == -1){
                    not_used_positions.push(possible_positions[i].recid);
                }
            }
            if(isEmptyOrNullArray(not_used_positions)){
                return badResp("Не удалось получить свободные позиции для узла");
            }
            //Сканирование элемента на вагон как узла
            var items_for_installation = [
                {
                    number: element.recid,
                    position: not_used_positions[0],
                    numberValue: ke_number.recname
                }
            ];

            var setupkeonvagonres = setupkeonvagon({
                recid: vehicle.recid,
                operationdate: new Date().toISOString(),
                ke_numbers: JSON.stringify(items_for_installation),
                memberid: member.recid
            });
            if(!setupkeonvagonres.success){
                return setupkeonvagonres;
            }
        }
    }else{
        is_key_element = true;
        var install_key_element_or_node_on_vagon_res = install_key_element_or_node_on_vagon(element, vehicle, object, ke_number, member);
        if(!install_key_element_or_node_on_vagon_res.success){
            return install_key_element_or_node_on_vagon_res;
        }
    }
    application_record.registered_entity_id = vehicle.recid;
    application_record.registered_entity_type = "vehicle";
    db.update("reestr_vehicles", application_record);
    return {
        success: true,
        message: "Элемент установлен",
        data: vehicle.recid,
        element: element.recid,
        is_key_element: is_key_element,
        type: "vehicle"
    }
}

/**
 * Установить составная часть на вагон
 * @param {*} element   Устанавливаемый СЧ
 * @param {*} vehicle   Запись ТС
 * @param {*} object    Объект заявления
 * @param {*} ke_number Объект с инфой об УИНе
 * @param {*} member    Объект с инфой об участнике
 */
function install_key_element_or_node_on_vagon(element, vehicle, object, ke_number, member){
    if(element.key_element_code == keyElementCodes.pressure_beam_id ||
        element.key_element_code == keyElementCodes.clear_axis_id || 
        element.key_element_code == keyElementCodes.side_frame_id || 
        element.key_element_code == keyElementCodes.saddle_ring_id || 
        element.key_element_code == keyElementCodes.lock_id || 
        element.key_element_code == keyElementCodes.elevator_roll_id || 
        element.key_element_code == keyElementCodes.coupler_id || 
        element.key_element_code == keyElementCodes.saddle_bearing_id){
            return badResp("Для установки узла нельзя использовать составную часть данного типа.");
    }

    if(isEmptyString(element.ke_node)){
        if(element.key_element_code != keyElementCodes.gondola_hatch_id && element.key_element_code != keyElementCodes.front_rear_detents_id){
            return badResp("Данный СЧ не может устанавливаться отдельно от узла");
        }
    }
    //Получение занятых позиций СЧ
    var installed_key_elements = db.findbyparams("reestr_key_elements", {
        vehicle: vehicle.recid
    });
    if(isEmptyOrNullArray(installed_key_elements)){
        installed_key_elements = [];
    }
    var used_positions = [];
    for(var i = 0; i < installed_key_elements.length; i++){
        used_positions.push(installed_key_elements[i].position_on_vagon);
    }

    //Получение возможных позиций
    var possible_positions = [];
    if(!isEmptyString(element.position_on_node)){
        if(!isEmptyString(object.position)){
            possible_positions = db.findbyparams("dictionary_positions_on_vagon", {
                position_on_node: element.position_on_node,
                key_element_code: element.key_element_code//,
                // recname: object.position
            })
        }else{
            possible_positions = db.findbyparams("dictionary_positions_on_vagon", {
                position_on_node: element.position_on_node,
                key_element_code: element.key_element_code
            })
        }
        
        if(isEmptyOrNullArray(possible_positions)){
            possible_positions = [];
        }
    }else{
        if(!isEmptyString(object.position)){
            possible_positions = db.findbyparams("dictionary_positions_on_vagon", {
                key_element_code: element.key_element_code,
                recname: object.position
            })
        }else{
            possible_positions = db.findbyparams("dictionary_positions_on_vagon", {
                key_element_code: element.key_element_code
            })
        }
        
        if(isEmptyOrNullArray(possible_positions)){
            possible_positions = [];
        }
    }
    if(isEmptyOrNullArray(possible_positions)){
        return badResp("Доступных позиций не найдено в системе");
    }

    //Получение свободных позиций
    var not_used_positions = [];
    for(var i = 0; i < possible_positions.length; i++){
        if(used_positions.indexOf(possible_positions[i].recid) == -1){
            not_used_positions.push(possible_positions[i].recid);
        }
    }

    if(isEmptyOrNullArray(not_used_positions)){
        return badResp("Свободных позиций не найдено");
    }
    //Установка СЧ на вагон
    var items_for_installation = [
        {
            number: element.recid,
            position: not_used_positions[0],
            numberValue: ke_number.recname
        }
    ];

    var setupkeonvagonres = setupkeonvagon({
        recid: vehicle.recid,
        operationdate: new Date().toISOString(),
        ke_numbers: JSON.stringify(items_for_installation),
        memberid: member.recid
    });
    return setupkeonvagonres;
}

/**
 * Создание паспорта СЕ
 * @param {*} object 
 */
function create_assembly_unit_passport(object){
    //Получение шаблона для создания узла через метод assemblyunitscannumbers
    var node_patterns = db.findbyparams("reestr_ke_node_types", {
        ke_node_type: object.common_params.ke_node_type,
        documentation: object.common_params.documentation_number
    })

    if(isEmptyOrNullArray(node_patterns)){
        return badResp("Шаблон для узла не найден в системе");
    }
    var node_pattern = node_patterns[0];
    
    //Получение уина
    var ke_number = db.findbyrecid("ke_numbers", object.common_params.unique_number);

    //Создание пустой записи, чтобы далее передать ее recid в метод assemblyunitscannumbers
    var inserted_record = db.insert("reestr_ke_nodes", {recstate: 1});
    if(isNullObject(inserted_record)){
        return badResp("Не удалось создать запись в реестре узлов")
    }
    
    //Формирование массива устанавливаемых элементов
    var elements_to_setup = [];
    if (object.common_params.ke_node_type != "79ddf686-f26f-4567-97ac-cb18eadd83e9" && object.common_params.ke_node_type != "c790c624-b93e-498b-97ba-0fb47f8b4b52" && object.common_params.ke_node_type != "a6180bfa-368d-4eff-97f2-c4f6c2612bc6"){
        for(var i = 0; i < object.node_composition.length; i++){
            var node_composition_item = object.node_composition[i];
    
            var element_to_setup = {};
            //Получаем запись устанавливаемого элемента
            var item = null;
            var itemNumber = null;
            if(node_composition_item.is_key_element){
                item = db.findbyrecid("reestr_key_elements", node_composition_item.item);
                if(isNullObject(item)){
                    return badResp("СЧ не найден в системе");
                }
                itemNumber = item.numberke;
            }else{
                item = db.findbyrecid("reestr_ke_nodes", node_composition_item.item);
                if(isNullObject(item)){
                    return badResp("Узел не найден в системе");
                }
                itemNumber = item.unique_number;
            }
            element_to_setup.number = item.recid;
            element_to_setup.numberValue = itemNumber;
    
            if(!node_composition_item.no_position){
                element_to_setup.position = node_composition_item.position;
            }
            elements_to_setup.push(element_to_setup);
        }
    }
    

    //Создание параметров для метода assemblyunitscannumbers;
    var assemblyunitscannumbersparams = {
        recid: inserted_record.recid,
        unique_number: ke_number.recname,
        reestr_ke_node_type: node_pattern.recid,
        ke_numbers: JSON.stringify(elements_to_setup),
        ke_node_type: object.common_params.ke_node_type,
        documentation_number: object.common_params.documentation_number,
        memberid: object.memberid
    }

    
    var assemblyunitscannumbersres = assemblyunitscannumbers(assemblyunitscannumbersparams);
    if(!assemblyunitscannumbersres.success){
        return assemblyunitscannumbersres
    }
    
    var scanned_node_update_from_object_res = scanned_node_update_from_object(inserted_record.recid, object);
    if(!scanned_node_update_from_object_res.success){
        return scanned_node_update_from_object_res;
    }
    return {
        success: true,
        message: "Паспорт создан",
        data: inserted_record.recid,
        type: "assembly_unit"
    };
}

/**
 * Обновление паспорта входящими данными
 * @param {*} recid         Идентификатор созданного паспорта
 * @param {*} object        Объект из приложенного файла
 */
function scanned_node_update_from_object(recid, object){
    var node = db.findbyrecid("reestr_ke_nodes", recid);
    if(isNullObject(node)){
        return badResp("Запись узла не найдена в системе");
    }

    var common_params = object.common_params;
    var special_params = object.special_params;
    var after_register_params = object.after_register_params;

    
    //Обновление записи данными из входящего объекта
    node.documentation_number = common_params.documentation_number;
    node.method_of_marking = common_params.method_of_marking;
    node.formation_date = common_params.formation_date;
    node.method_of_encoding = common_params.method_of_encoding;

    //Если это узел, обновляем только группу общих параметров
    if(node.assembly_element_type == '3607f67c-c619-43bd-bd9c-90acff9a5f28'){
        var updres = db.update("reestr_ke_nodes", node);
        if(!updres.success){
            return updres;
        }
    }
    //Для каждого типа СЕ обновляем группу специальных параметров отдельно
    else{
        switch (node.ke_node_type) {
            //Воздухораспределитель
            case "aa12b486-85f2-416f-b299-e76e07174934":
                break;
            //Хомут в сборе в поглощающим аппаратом
            case "5db9db1f-e0cb-41fc-80ec-52cb1141ea51":
                break;
            //Скользун
            case "a70bf64c-215b-4d42-9c8e-f8ab4ac9f357":
                //Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
                node.manufacturer = special_params.ke_manufacturer;

                //Регистрационный номер свидетельства о присвоении номера для клеймения
                node.branding_code_certificate_number = special_params.branding_code_certificate_number;

                 //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

                // Свидетельство о приемке
                node.acceptance_certificate = after_register_params.acceptance_certificate;

                // Свидетельство об упаковывании
                node.packing_certificate = after_register_params.packing_certificate;
                break;
            //Комплект пружин    
            case "5fe8c6fd-fd66-49da-92d3-222b1b3a1243":
                break;
            //Передача тормозная рычажная
            case "b817ce27-bd7b-4151-8de6-5036a203994e":
                break;
            //Колесная пара
            case "a3afe986-102a-4a10-aafe-5407134f7c15":
                //Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
                node.manufacturer = special_params.ke_manufacturer;

                //Регистрационный номер свидетельства о присвоении номера для клеймения
                node.branding_code_certificate_number = special_params.branding_code_certificate_number;

                //Код государства собственника детали
                node.administration_code = special_params.administration_code;

                //Максимальная статическая осевая нагрузка
                node.max_static_axial_load = special_params.max_static_axial_load;

                 //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

                // Свидетельство о приемке
                node.acceptance_certificate = after_register_params.acceptance_certificate;

                // Свидетельство об упаковывании
                node.packing_certificate = after_register_params.packing_certificate;
                break;
            //Тележка
            case "cbb9d8cb-89ef-4b99-be77-a7d6e57e388e":
                //Сведения о сертификате соответствия
                node.certificate_number = special_params.certificate_number;

                //Срок службы
                node.life_time = special_params.life_time;

                //Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
                node.manufacturer = special_params.ke_manufacturer;

                //Регистрационный номер свидетельства о присвоении номера для клеймения
                node.branding_code_certificate_number = special_params.branding_code_certificate_number;

                //Номер изделия по системе нумерации предприятия-изготовителя
                node.manufacturer_number = special_params.manufacturer_number;

                //Код государства собственника детали
                node.administration_code = special_params.administration_code;

                //Обозначение модели тележки
                node.truck_model = special_params.truck_model;

                //Тип тележки
                node.truck_type = special_params.truck_type;

                //Максимальная расчетная статическая осевая нагрузка
                node.max_static_axial_load = special_params.max_static_axial_load;

                //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

                // Свидетельство о приемке
                node.acceptance_certificate = after_register_params.acceptance_certificate;

                // Свидетельство об упаковывании
                node.packing_certificate = after_register_params.packing_certificate;
                break;
            //Рама боковая
            case "22ca1065-868e-4726-8f52-b6a5fdb8dfdc":
                break;
            //Балка надрессорная
            case "c8c2ab90-8d32-41fc-8a4d-a969d13c9f04":
                break;
            //Автосцепка СА-3
            case "ae11ae44-1c69-49e0-83a1-4122bb2d80ae":
                //Сведения о сертификате соответствия
                node.certificate_number = special_params.certificate_number;

                //Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
                node.manufacturer = special_params.ke_manufacturer;

                //Регистрационный номер свидетельства о присвоении номера для клеймения
                node.branding_code_certificate_number = special_params.branding_code_certificate_number;

                //Индивидуальные особенности
                node.individual_features = special_params.individual_features;

                //Номер изделия по системе нумерации предприятия-изготовителя
                node.manufacturer_number = special_params.manufacturer_number;

                //Обозначение модели автосцепки
                node.autocoupler_model = special_params.autocoupler_model;

                //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

                // Свидетельство о приемке
                node.acceptance_certificate = after_register_params.acceptance_certificate;

                // Свидетельство об упаковывании
                node.packing_certificate = after_register_params.packing_certificate;
                break;

            //Колесная пара без буксовых узлов
            case "00b0b326-a67a-4ce2-95af-376fcc9d8355":
                //Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
                node.manufacturer = special_params.ke_manufacturer;

                //Регистрационный номер свидетельства о присвоении номера для клеймения
                node.branding_code_certificate_number = special_params.branding_code_certificate_number;

                //Сведения о сертификате соответствия
                node.certificate_number = special_params.certificate_number;

                 //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

                // Свидетельство о приемке
                node.acceptance_certificate = after_register_params.acceptance_certificate;

                // Свидетельство об упаковывании
                node.packing_certificate = after_register_params.packing_certificate;
                break;
            //Триангель
            case "c790c624-b93e-498b-97ba-0fb47f8b4b52":
                //Сведения о сертификате соответствия
                node.certificate_number = special_params.certificate_number;

                //Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
                node.manufacturer = special_params.ke_manufacturer;

                //Регистрационный номер свидетельства о присвоении номера для клеймения
                node.branding_code_certificate_number = special_params.branding_code_certificate_number;

                //Номер изделия по системе нумерации предприятия-изготовителя
                node.manufacturer_number = special_params.manufacturer_number;

                 //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

                // Свидетельство о приемке
                node.acceptance_certificate = after_register_params.acceptance_certificate;

                // Свидетельство об упаковывании
                node.packing_certificate = after_register_params.packing_certificate;
                break;
            //Котел вагона-цистерны
            case "79ddf686-f26f-4567-97ac-cb18eadd83e9":
                //Сведения о сертификате соответствия
                node.certificate_number = special_params.certificate_number;

                //Срок службы
                node.life_time = special_params.life_time;

                //Номер изделия по системе нумерации предприятия-изготовителя
                node.manufacturer_number = special_params.manufacturer_number;

                //Марка материала
                node.steel_grade = special_params.steel_grade;

                //Объем кузова (котла)
                node.carcass_volume = special_params.carcass_volume;

                //Рабочее (избыточное) давление при перевозке
                node.operating_pressure_transportation = special_params.operating_pressure_transportation;

                //Рабочее (избыточное) давление при разгрузке
                node.operating_pressure_unloading = special_params.operation_pressure_unloading;

                //Расчетное давление
                node.design_pressure = special_params.design_pressure;

                //Испытательное давление гидравлическое
                node.hydraulic_test_pressure = special_params.hydraulic_test_pressure;

                 //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

                // Свидетельство о приемке
                node.acceptance_certificate = after_register_params.acceptance_certificate;

                // Свидетельство об упаковывании
                node.packing_certificate = after_register_params.packing_certificate;
                break;

            //Воздухораспределитель в сборе
            case "a6180bfa-368d-4eff-97f2-c4f6c2612bc6":
                //Сведения о сертификате соответствия
                node.certificate_number = special_params.certificate_number;

                //Срок службы
                node.life_time = special_params.life_time;

                //Номер изделия по системе нумерации предприятия-изготовителя
                node.manufacturer_number = special_params.manufacturer_number;

                //Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
                node.manufacturer = special_params.ke_manufacturer;

                //Регистрационный номер свидетельства о присвоении номера для клеймения
                node.branding_code_certificate_number = special_params.branding_code_certificate_number;

                //Обозначение модели воздрухораспределителя
                node.air_distributor_model = special_params.coupling_model;

                //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

                // Свидетельство о приемке
                node.acceptance_certificate = after_register_params.acceptance_certificate;

                // Свидетельство об упаковывании
                node.packing_certificate = after_register_params.packing_certificate;
                break;

            //Поглощающий аппарат
            case "700b86ca-5b88-44d6-a5d3-c2c4e76d96f8":
                //Сведения о сертификате соответствия
                node.certificate_number = special_params.certificate_number;

                //Срок службы
                node.life_time = special_params.life_time;

                //Номер изделия по системе нумерации предприятия-изготовителя
                node.manufacturer_number = special_params.manufacturer_number;

                //Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
                node.manufacturer = special_params.ke_manufacturer;

                //Регистрационный номер свидетельства о присвоении номера для клеймения
                node.branding_code_certificate_number = special_params.branding_code_certificate_number;

                //Обозначение модели
                node.absorbing_device_model = special_params.absorbing_model;

                //Класс
                node.class_absorbing_device = special_params.absorbing_class;

                //Энергоемкость
                node.energy_intensity = special_params.energy_intensity;

                //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

                // Свидетельство о приемке
                node.acceptance_certificate = after_register_params.acceptance_certificate;

                // Свидетельство об упаковывании
                node.packing_certificate = after_register_params.packing_certificate;
                break;
        }
        //Обновление записи узла
        var updres = db.update("reestr_ke_nodes", node);
        if(!updres.success){
            return updres;
        }
    }
    return successResp("Обновлено");
}

/**
 * Получение идентификатора типа СЧ по текстовому типу из объекта
 * @param {*} type 
 */
function get_key_element_type(type){
    var key_element_type_id = null;
    switch (type) {
        case "Крышка люка полувагона":
            key_element_type_id = keyElementCodes.gondola_hatch_id
            break;
        case "Упоры передний и задний объединенные":
            key_element_type_id = keyElementCodes.front_rear_detents_id
            break;
        case "Вкладыш подпятника":
            key_element_type_id = keyElementCodes.saddle_bearing_id
            break;
        case "Вставки в клиновые карманы":
            key_element_type_id = keyElementCodes.wedge_pockets_inserts_id
            break;
        case "Кольцо в подпятник":
            key_element_type_id = keyElementCodes.saddle_ring_id
            break;
        case "Пластины в клиновых карманах":
            key_element_type_id = keyElementCodes.wedge_pockets_id
            break;
        case "Ось чистовая":
            key_element_type_id = keyElementCodes.clear_axis_id
            break;
        case "Сменный железнодорожный кузов":
            key_element_type_id = keyElementCodes.removable_railway_carcass_id
            break;
        case "Адаптер подшипника":
            key_element_type_id = keyElementCodes.bearing_adapter_id
            break;
        case "Валик подъемника":
            key_element_type_id = keyElementCodes.elevator_roll_id
            break;
        case "Замок":
            key_element_type_id = keyElementCodes.lock_id
            break;
        case "Колесо":
            key_element_type_id = keyElementCodes.wheel_id
            break;
        case "Скоба":
            key_element_type_id = keyElementCodes.brace_id
            break;
        case "Планка фрикционная":
            key_element_type_id = keyElementCodes.friction_strip_id
            break;
        case "Колпак скользуна":
            key_element_type_id = keyElementCodes.slider_cap_id
            break;
        case "Корпус скользуна":
            key_element_type_id = keyElementCodes.slider_body_id
            break;
        case "Клин фрикционный":
            key_element_type_id = keyElementCodes.friction_wedge_id
            break;
        case "Корпус автосцепки":
            key_element_type_id = keyElementCodes.coupler_id
            break;
        case "Рама боковая":
            key_element_type_id = keyElementCodes.side_frame_id
            break;
        case "Балка надрессорная":
            key_element_type_id = keyElementCodes.pressure_beam_id
            break;
        case "Авторежим грузовой":
            key_element_type_id = keyElementCodes.auto_mode_cargo_id
            break;
        case "Пружина скользуна наружная":
            key_element_type_id = keyElementCodes.spring_slider_outside_id
            break;
        case "Пружина скользуна внутренняя":
            key_element_type_id = keyElementCodes.spring_slider_inside_id
            break;
        case "Пружина рессорного подвешивания наружная":
            key_element_type_id = keyElementCodes.spring_outside_id
            break;
        case "Пружина рессорного подвешивания внутренняя":
            key_element_type_id = keyElementCodes.spring_inside_id
            break;
        case "Подшипник буксового узла":
            key_element_type_id = keyElementCodes.bearing_node_id
            break;
        case "Хомут тяговый":
            key_element_type_id = keyElementCodes.traction_clamp_id
            break;
        case "Корпус поглощающего аппарата":
            key_element_type_id = keyElementCodes.absorbing_device_body_id
            break;
        case "Ось черновая":
            key_element_type_id = keyElementCodes.rough_axis_id
            break;
    }
    if(isEmptyString(key_element_type_id)){
        return {
            success: true,
            message: "Тип составной части не найден в системе, проверьте поле \"key_element_code\""
        }
    }else{
        return {
            success: true,
            data: key_element_type_id
        }
    }
}

/**
 * Получение идентификатора типа узла по текстовому наименованию
 * @param {*} type 
 */
function get_node_type(type){
    var node_type_id = null;
    switch (type) {
        //Воздухораспределитель
        case "Воздухораспределитель":
            node_type_id = "aa12b486-85f2-416f-b299-e76e07174934";
            break;
        //Хомут в сборе в поглощающим аппаратом
        case "Хомут в сборе в поглощающим аппаратом":
            node_type_id = "5db9db1f-e0cb-41fc-80ec-52cb1141ea51";
            break;
        //Скользун
        case "Скользун":
            node_type_id = "a70bf64c-215b-4d42-9c8e-f8ab4ac9f357";
            break;
        //Комплект пружин    
        case "Комплект пружин":
            node_type_id = "5fe8c6fd-fd66-49da-92d3-222b1b3a1243";
            break;
        //Передача тормозная рычажная
        case "Передача тормозная рычажная":
            node_type_id = "b817ce27-bd7b-4151-8de6-5036a203994e";
            break;
        //Колесная пара
        case "Колесная пара":
            node_type_id = "a3afe986-102a-4a10-aafe-5407134f7c15";
            break;
        //Тележка
        case "Тележка":
            node_type_id = "cbb9d8cb-89ef-4b99-be77-a7d6e57e388e";
            break;
        //Рама боковая
        case "Рама боковая":
            node_type_id = "22ca1065-868e-4726-8f52-b6a5fdb8dfdc";    
            break;
        //Балка надрессорная
        case "Балка надрессорная":
            node_type_id = "c8c2ab90-8d32-41fc-8a4d-a969d13c9f04";
            break;
        //Автосцепка СА-3
        case "Автосцепка СА-3":
            node_type_id = "ae11ae44-1c69-49e0-83a1-4122bb2d80ae";
            break;
        //Колесная пара без буксовых узлов
        case "Колесная пара без буксовых узлов":
            node_type_id = "00b0b326-a67a-4ce2-95af-376fcc9d8355";
            break;
        //Триангель
        case "Триангель":
            node_type_id = "c790c624-b93e-498b-97ba-0fb47f8b4b52";
            break;
        //Котел вагона-цистерны
        case "Котел вагона-цистерны":
            node_type_id = "79ddf686-f26f-4567-97ac-cb18eadd83e9";
            break;
        //Воздухораспределитель в сборе
        case "Воздухораспределитель в сборе":
            node_type_id = "a6180bfa-368d-4eff-97f2-c4f6c2612bc6";
            break;
        //Поглощающий аппарат
        case "Поглощающий аппарат":
            node_type_id = "700b86ca-5b88-44d6-a5d3-c2c4e76d96f8";
            break;
    }
    if(isEmptyString(node_type_id)){
        return {
            success: true,
            message: "Тип узла не найден в системе, проверьте поле \"ke_node_type\""
        }
    }else{
        return {
            success: true,
            data: node_type_id
        }
    }
}

/**
 * Получение идентификаторов сущностей составной части в БД по данным в структуре common_params
 * @param {*} object 
 */
function get_ke_common_params_ids(object){
    var common_params = object.common_params;
    //Способ маркировки method_of_marking
    var method_of_marking_res = db.findbyparams("dictionary_method_of_marking", {
        recname: common_params.method_of_marking
    })
    if(isEmptyOrNullArray(method_of_marking_res)){
        return badResp("Способ маркировки не найден в системе, проверьте поле \"method_of_marking\"");
    }
    common_params.method_of_marking = method_of_marking_res[0].recid;

    //Тип документации documentation_number
    var documentation_number_res = db.findbyparams("reestr_documentation", {
        detail: common_params.documentation_number,
        key_element_code: common_params.key_element_code
    });
    if(isEmptyOrNullArray(documentation_number_res)){
        return badResp("Тип документации не найден в системе, проверьте поле \"documentation_number\"");
    }
    common_params.documentation_number = documentation_number_res[0].recid;

    //Способ кодировки method_of_encoding
    if (!isEmptyString(common_params.method_of_encoding) && common_params.method_of_encoding != null){
        var method_of_encoding_res = db.findbyparams("dictionary_method_of_encoding", {
            recname: common_params.method_of_encoding
        })
        common_params.method_of_encoding = method_of_encoding_res[0].recid;
    }
    
    return {
        success: true, 
        data: common_params
    }
}

/**
 * Получение идентификаторов сущностей узла в БД по данным в структуре common_params
 * @param {*} object 
 */
function get_node_common_params_ids(object){
    var common_params = object.common_params;
    //unique_number
    if(object.item_type == "Сборочная единица"){
        if(isEmptyString(common_params.unique_number)){
            return badResp("Поле \"УИН\" не может быть пустым, проверьте параметр \"unique_number\"")
        }
        var ke_numbers = db.findbyparams("ke_numbers", {
            recname: common_params.unique_number
        })
        if(isEmptyOrNullArray(ke_numbers)){
            return badResp("УИН не найден в системе, проверьте параметр \"unique_number\"")
        }
        common_params.unique_number = ke_numbers[0].recid;
    }
    //method_of_marking
    if(isEmptyString(common_params.method_of_marking)){
        return badResp("Поле \"Способ маркировки\" не может быть пустым, проверьте параметр \"method_of_marking\"")
    }
    var method_of_marking_res = db.findbyparams("dictionary_method_of_marking", {
        recname: common_params.method_of_marking
    })
    if(isEmptyOrNullArray(method_of_marking_res)){
        return badResp("Способ маркировки не найден в системе, проверьте поле \"method_of_marking\"");
    }
    common_params.method_of_marking = method_of_marking_res[0].recid;

    //documentation_number
    if(isEmptyString(common_params.documentation_number)){
        return badResp("Поле \"Тип документации\" не может быть пустым, проверьте параметр \"documentation_number\"")
    }
    var documentation_number_res = db.findbyparams("reestr_documentation", {
        detail: common_params.documentation_number,
        ke_node_type: common_params.ke_node_type
    });
    if(isEmptyOrNullArray(documentation_number_res)){
        return badResp("Тип документации не найден в системе, проверьте поле \"documentation_number\"");
    }
    common_params.documentation_number = documentation_number_res[0].recid;

    //formation_date
    if(isEmptyString(common_params.formation_date)){
        return badResp("Поле \"Дата создания\" не может быть пустым, проверьте параметр \"formation_date\"")
    }

    common_params.formation_date = new Date(common_params.formation_date);

    //Способ кодировки method_of_encoding
    if (isNotEmptyString(common_params.method_of_encoding) && common_params.method_of_encoding != null){
        var method_of_encoding_res = db.findbyparams("dictionary_method_of_encoding", {
            recname: common_params.method_of_encoding
        })
        common_params.method_of_encoding = method_of_encoding_res[0].recid;
    }

    return {
        success: true,
        data: common_params
    };
}

/**
 * Получение идентификаторов сущностей в БД по данным в структуре special_params
 * @param {*} object 
 */
function get_key_element_special_params_ids(object){
    var special_params = object.special_params;
    switch (object.common_params.key_element_code) {
        //Крышка люка полувагона
        case keyElementCodes.gondola_hatch_id:
            //Условный номер для клеймения продукции вагоностроения
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "key_element_code": object.common_params.key_element_code
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;
            break;
        //Упоры передний и задний объединенные
        case keyElementCodes.front_rear_detents_id:
            // Технические условия
            if (!isEmptyString(special_params.technical_specifications)){
                var technical_conditions_fields = db.findbyparams("dictionary_technical_conditions", {
                    recname: special_params.technical_specifications
                })
                if(!isEmptyOrNullArray(technical_conditions_fields)){

                    //Проверка что поле "Технические условия" может вычислиться 
                    var documentation_record = db.findbyrecid("reestr_documentation", object.common_params.documentation_number);
                    if(isNullObject(documentation_record)){
                        return badResp("Не удалось получить значение поля \"Технические условия\", не получена информация о документации")
                    }
                    
                    if(documentation_record.technical_conditions != technical_conditions_fields[0].recid){
                        return badResp("Значение поля \"Технические условия\" не заполнено в Реестре конструкторской и эксплуатационной документации")
                    }

                } else {
                    return badResp("Значение поля \"Технические условия\" является недопустимым, проверьте параметр \"technical_specifications\"")
                }
            } else {
                return badResp("Поле \"Технические условия\" пустое, проверьте параметр \"technical_specifications\"")
            }

           /* //Сведения об изготовителе заготовки
           if(isEmptyString(special_params.billet_manufacturer_info)){
            var manufacturer_member = db.findbyrecid("reestr_members", object.common_params.manufacturer_details);
            if(!isNullObject(manufacturer_number)){
                special_params.billet_manufacturer_info = manufacturer_member.fullname;
            }
            else{
                return badResp("Не удалось заполнить поле \"Сведения об изготовителе заготовки\"");
            }
            } */

           //Сведения об изготовителе заготовки
           if(!isEmptyString(special_params.billet_manufacturer_info)){
            var dictionary_billet_manufacturer_details_fields = db.findbyparams("dictionary_billet_manufacturer_details", {
                billet_manufacturer_name: special_params.billet_manufacturer_info,
                key_element_code: keyElementCodes.front_rear_detents_id
            })
            if(!isEmptyOrNullArray(dictionary_billet_manufacturer_details_fields)){
                special_params.billet_manufacturer_info = dictionary_billet_manufacturer_details_fields[0].recid
            } else {
                return badResp("Значение поля \"Сведения об изготовителе заготовки\" является недопустимым, проверьте параметр \"billet_manufacturer_info\"")
            }
            } else {
                return badResp("Поле \"Сведения об изготовителе заготовки\" пустое, проверьте параметр \"billet_manufacturer_info\"")
            }
            //Сведения о сертификате соответствия
            if(isEmptyString(special_params.certificate_number)){
                return badResp("Поле \"Сведения о сертификате соответствия\" пустое, проверьте параметр \"certificate_number\"")
            }
            var certificate_numbers = db.findbyparams("reestr_certificates", {
                registration_number: special_params.certificate_number,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(certificate_numbers)){
                return badResp("Сведения о сертификате соответствия не найдены в системе, проверьте параметр \"Сведения о сертификате соответствия\" ")
            }
            special_params.certificate_number = certificate_numbers[0].recid;

            //Срок службы
            if(isEmptyString(special_params.life_time)){
                return badResp("Поле \"Срок службы\" пустое, проверьте параметр \"life_time\"");
            }

            //Условный номер для клеймения продукции вагоностроения
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "key_element_code": object.common_params.key_element_code
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;
            //Номер изделия по системе нумерации предприятия-изготовителя
            if(isEmptyString(special_params.manufacturer_number)){
                return badResp("Поле \"Номер изделия по системе нумерации предприятия-изготовителя\" пустое, проверьте параметр \"manufacturer_number\"");
            }
            // Формирование параметров для проверки на дубликат записи с таким же номером изделия
            var params_for_validate = {
                manufacturer_details: object.common_params.manufacturer_details,
                key_element_code: object.common_params.key_element_code,
                manufacturer_number: special_params.manufacturer_number,
                date_manufacture: object.common_params.date_manufacture
            }
            //проверка на уникальность по дате, номеру, заводу, типу
            var validate_dublicate = validate_dublicate_elements(params_for_validate);
            if(!validate_dublicate.success) {
                return validate_dublicate;
            }
            //Код государства собственника детали
            if(isEmptyString(special_params.administration_code)){
                return badResp("Поле \"Код государства собственника детали\" пустое, проверьте параметр \"administration_code\"");
            }
            var administration_code_records = db.findbyparams("dictionary_administration_codes", {
                recname: special_params.administration_code
            });
            if(isEmptyOrNullArray(administration_code_records)){
                return badResp("Код государства собственника детали не найден в системе, проверьте параметр \"administration_code\"");
            }
            special_params.administration_code = administration_code_records[0].recid;
            //Марка материала
            if(isEmptyString(special_params.steel_grade)){
                return badResp("Поле \"Марка материала\" пустое, проверьте параметр \"steel_grade\"");
            }
            var steel_grade_records = db.findbyparams("dictionary_steel_grade", {
                recname: special_params.steel_grade,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(steel_grade_records)){
                return badResp("Марка материала не найдена в системе, проверьте параметр \"steel_grade\"");
            }
            special_params.steel_grade = steel_grade_records[0].recid;
            
            break;
        //Вкладыш подпятника
        case keyElementCodes.saddle_bearing_id:
           /*  //Сведения об изготовителе заготовки
           if(isEmptyString(special_params.billet_manufacturer_info)){
            var manufacturer_member = db.findbyrecid("reestr_members", object.common_params.manufacturer_details);
            if(!isNullObject(manufacturer_number)){
                special_params.billet_manufacturer_info = manufacturer_member.fullname;
            }
            else{
                return badResp("Не удалось заполнить поле \"Сведения об изготовителе заготовки\"");
            }
            } */
            //Сведения об изготовителе заготовки
            if(!isEmptyString(special_params.billet_manufacturer_info)){
                var dictionary_billet_manufacturer_details_fields = db.findbyparams("dictionary_billet_manufacturer_details", {
                    billet_manufacturer_name: special_params.billet_manufacturer_info,
                    key_element_code: keyElementCodes.saddle_bearing_id
                })
                if(!isEmptyOrNullArray(dictionary_billet_manufacturer_details_fields)){
                    special_params.billet_manufacturer_info = dictionary_billet_manufacturer_details_fields[0].recid
                } else {
                    return badResp("Значение поля \"Сведения об изготовителе заготовки\" является недопустимым, проверьте параметр \"billet_manufacturer_info\"")
                }
            } else {
                return badResp("Поле \"Сведения об изготовителе заготовки\" пустое, проверьте параметр \"billet_manufacturer_info\"")
            }
            //Условный номер для клеймения продукции вагоностроения
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "key_element_code": object.common_params.key_element_code
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;

            //Марка материала
            if(isEmptyString(special_params.steel_grade)){
                return badResp("Поле \"Марка материала\" пустое, проверьте параметр \"steel_grade\"");
            }
            var steel_grade_records = db.findbyparams("dictionary_steel_grade", {
                recname: special_params.steel_grade,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(steel_grade_records)){
                return badResp("Марка материала не найдена в системе, проверьте параметр \"steel_grade\"");
            }
            special_params.steel_grade = steel_grade_records[0].recid;
            break;
        //Вставки в клиновые карманы
        case keyElementCodes.wedge_pockets_inserts_id:
           /*  //Сведения об изготовителе заготовки
           if(isEmptyString(special_params.billet_manufacturer_info)){
            var manufacturer_member = db.findbyrecid("reestr_members", object.common_params.manufacturer_details);
            if(!isNullObject(manufacturer_number)){
                special_params.billet_manufacturer_info = manufacturer_member.fullname;
            }
            else{
                return badResp("Не удалось заполнить поле \"Сведения об изготовителе заготовки\"");
            }
            } */
            //Сведения об изготовителе заготовки
            if(!isEmptyString(special_params.billet_manufacturer_info)){
                var dictionary_billet_manufacturer_details_fields = db.findbyparams("dictionary_billet_manufacturer_details", {
                    billet_manufacturer_name: special_params.billet_manufacturer_info,
                    key_element_code: keyElementCodes.wedge_pockets_inserts_id
                })
                if(!isEmptyOrNullArray(dictionary_billet_manufacturer_details_fields)){
                    special_params.billet_manufacturer_info = dictionary_billet_manufacturer_details_fields[0].recid
                } else {
                    return badResp("Значение поля \"Сведения об изготовителе заготовки\" является недопустимым, проверьте параметр \"billet_manufacturer_info\"")
                }
            } else {
                return badResp("Поле \"Сведения об изготовителе заготовки\" пустое, проверьте параметр \"billet_manufacturer_info\"")
            }
            //Условный номер для клеймения продукции вагоностроения
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "key_element_code": object.common_params.key_element_code
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;
            
            //Марка материала
            if(isEmptyString(special_params.steel_grade)){
                return badResp("Поле \"Марка материала\" пустое, проверьте параметр \"steel_grade\"");
            }
            var steel_grade_records = db.findbyparams("dictionary_steel_grade", {
                recname: special_params.steel_grade,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(steel_grade_records)){
                return badResp("Марка материала не найдена в системе, проверьте параметр \"steel_grade\"");
            }
            special_params.steel_grade = steel_grade_records[0].recid;
            break;
        //Кольцо в подпятник
        case keyElementCodes.saddle_ring_id:
           /*  //Сведения об изготовителе заготовки
           if(isEmptyString(special_params.billet_manufacturer_info)){
            var manufacturer_member = db.findbyrecid("reestr_members", object.common_params.manufacturer_details);
            if(!isNullObject(manufacturer_number)){
                special_params.billet_manufacturer_info = manufacturer_member.fullname;
            }
            else{
                return badResp("Не удалось заполнить поле \"Сведения об изготовителе заготовки\"");
            }
            } */
            //Сведения об изготовителе заготовки
            if(!isEmptyString(special_params.billet_manufacturer_info)){
                var dictionary_billet_manufacturer_details_fields = db.findbyparams("dictionary_billet_manufacturer_details", {
                    billet_manufacturer_name: special_params.billet_manufacturer_info,
                    key_element_code: keyElementCodes.saddle_ring_id
                })
                if(!isEmptyOrNullArray(dictionary_billet_manufacturer_details_fields)){
                    special_params.billet_manufacturer_info = dictionary_billet_manufacturer_details_fields[0].recid
                } else {
                    return badResp("Значение поля \"Сведения об изготовителе заготовки\" является недопустимым, проверьте параметр \"billet_manufacturer_info\"")
                }
            } else {
                return badResp("Поле \"Сведения об изготовителе заготовки\" пустое, проверьте параметр \"billet_manufacturer_info\"")
            }
            //Условный номер для клеймения продукции вагоностроения
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "key_element_code": object.common_params.key_element_code
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;
            
            //Марка материала
            if(isEmptyString(special_params.steel_grade)){
                return badResp("Поле \"Марка материала\" пустое, проверьте параметр \"steel_grade\"");
            }
            var steel_grade_records = db.findbyparams("dictionary_steel_grade", {
                recname: special_params.steel_grade,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(steel_grade_records)){
                return badResp("Марка материала не найдена в системе, проверьте параметр \"steel_grade\"");
            }
            special_params.steel_grade = steel_grade_records[0].recid;
            break;
        //Пластины в клиновых карманах
        case keyElementCodes.wedge_pockets_id:
          /*   //Сведения об изготовителе заготовки
           if(isEmptyString(special_params.billet_manufacturer_info)){
            var manufacturer_member = db.findbyrecid("reestr_members", object.common_params.manufacturer_details);
            if(!isNullObject(manufacturer_number)){
                special_params.billet_manufacturer_info = manufacturer_member.fullname;
            }
            else{
                return badResp("Не удалось заполнить поле \"Сведения об изготовителе заготовки\"");
            }
            } */
            //Сведения об изготовителе заготовки
            if(!isEmptyString(special_params.billet_manufacturer_info)){
                var dictionary_billet_manufacturer_details_fields = db.findbyparams("dictionary_billet_manufacturer_details", {
                    billet_manufacturer_name: special_params.billet_manufacturer_info,
                    key_element_code: keyElementCodes.wedge_pockets_id
                })
                if(!isEmptyOrNullArray(dictionary_billet_manufacturer_details_fields)){
                    special_params.billet_manufacturer_info = dictionary_billet_manufacturer_details_fields[0].recid
                } else {
                    return badResp("Значение поля \"Сведения об изготовителе заготовки\" является недопустимым, проверьте параметр \"billet_manufacturer_info\"")
                }
            } else {
                return badResp("Поле \"Сведения об изготовителе заготовки\" пустое, проверьте параметр \"billet_manufacturer_info\"")
            }

            //Условный номер для клеймения продукции вагоностроения
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "key_element_code": object.common_params.key_element_code
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;
            
            //Марка материала
            if(isEmptyString(special_params.steel_grade)){
                return badResp("Поле \"Марка материала\" пустое, проверьте параметр \"steel_grade\"");
            }
            var steel_grade_records = db.findbyparams("dictionary_steel_grade", {
                recname: special_params.steel_grade,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(steel_grade_records)){
                return badResp("Марка материала не найдена в системе, проверьте параметр \"steel_grade\"");
            }
            special_params.steel_grade = steel_grade_records[0].recid;
            break;
        //Ось чистовая
        case keyElementCodes.clear_axis_id:
           /*  //Сведения об изготовителе заготовки
           if(isEmptyString(special_params.billet_manufacturer_info)){
            var manufacturer_member = db.findbyrecid("reestr_members", object.common_params.manufacturer_details);
            if(!isNullObject(manufacturer_number)){
                special_params.billet_manufacturer_info = manufacturer_member.fullname;
            }
            else{
                return badResp("Не удалось заполнить поле \"Сведения об изготовителе заготовки\"");
            }
            } */
            //Сведения об изготовителе заготовки
            if(!isEmptyString(special_params.billet_manufacturer_info)){
                var dictionary_billet_manufacturer_details_fields = db.findbyparams("dictionary_billet_manufacturer_details", {
                    billet_manufacturer_name: special_params.billet_manufacturer_info,
                    key_element_code: keyElementCodes.clear_axis_id
                })
                if(!isEmptyOrNullArray(dictionary_billet_manufacturer_details_fields)){
                    special_params.billet_manufacturer_info = dictionary_billet_manufacturer_details_fields[0].recid
                } else {
                    return badResp("Значение поля \"Сведения об изготовителе заготовки\" является недопустимым, проверьте параметр \"billet_manufacturer_info\"")
                }
            } else {
                return badResp("Поле \"Сведения об изготовителе заготовки\" пустое, проверьте параметр \"billet_manufacturer_info\"")
            }
            //Сведения о сертификате соответствия
            if(isEmptyString(special_params.certificate_number)){
                return badResp("Поле \"Сведения о сертификате соответствия\" пустое, проверьте параметр \"certificate_number\"")
            }
            var certificate_numbers = db.findbyparams("reestr_certificates", {
                registration_number: special_params.certificate_number,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(certificate_numbers)){
                return badResp("Сведения о сертификате соответствия не найдены в системе, проверьте параметр \"Сведения о сертификате соответствия\" ")
            }
            special_params.certificate_number = certificate_numbers[0].recid;
            //Условный номер для клеймения продукции вагоностроения
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "key_element_code": object.common_params.key_element_code
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;

            //Год изготовления черновой оси
            if(isEmptyString(special_params.rough_axis_manufacturing_date)){
                return badResp("Поле \"Год изготовления черновой оси\" пустое, проверьте параметр \"rough_axis_manufacturing_date\"");
            }

            //Номер черновой оси
            if(isEmptyString(special_params.rough_axis_number)){
                return badResp("Поле \"Номер черновой оси\" пустое, проверьте параметр \"rough_axis_number\"");
            }

            //Марка материала
            if(isEmptyString(special_params.steel_grade)){
                return badResp("Поле \"Марка материала\" пустое, проверьте параметр \"steel_grade\"");
            }
            var steel_grade_records = db.findbyparams("dictionary_steel_grade", {
                recname: special_params.steel_grade,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(steel_grade_records)){
                return badResp("Марка материала не найдена в системе, проверьте параметр \"steel_grade\"");
            }
            special_params.steel_grade = steel_grade_records[0].recid;
            break;
        //Сменный железнодорожный кузов
        case keyElementCodes.removable_railway_carcass_id:
            // Технические условия
            if (!isEmptyString(special_params.technical_specifications)){
                var technical_conditions_fields = db.findbyparams("dictionary_technical_conditions", {
                    recname: special_params.technical_specifications
                })
                if(!isEmptyOrNullArray(technical_conditions_fields)){

                    //Проверка что поле "Технические условия" может вычислиться 
                    var documentation_record = db.findbyrecid("reestr_documentation", object.common_params.documentation_number);
                    if(isNullObject(documentation_record)){
                        return badResp("Не удалось получить значение поля \"Технические условия\", не получена информация о документации")
                    }

                    if(documentation_record.technical_conditions != technical_conditions_fields[0].recid){
                        return badResp("Значение поля \"Технические условия\" не заполнено в Реестре конструкторской и эксплуатационной документации")
                    }

                } else {
                    return badResp("Значение поля \"Технические условия\" является недопустимым, проверьте параметр \"technical_specifications\"")
                }
            } else {
                return badResp("Поле \"Технические условия\" пустое, проверьте параметр \"technical_specifications\"")
            }
            
            //Срок службы
            if(isEmptyString(special_params.life_time)){
                return badResp("Поле \"Срок службы\" пустое, проверьте параметр \"life_time\"");
            }

            //Индивидуальные особенности
            if(isEmptyString(special_params.individual_features)){
                return badResp("Поле \"Индивидуальные особенности\" пустое, проверьте параметр \"individual_features\"");
            }

            //Номер изделия по системе нумерации предприятия-изготовителя
            if(isEmptyString(special_params.manufacturer_number)){
                return badResp("Поле \"Номер изделия по системе нумерации предприятия-изготовителя\" пустое, проверьте параметр \"manufacturer_number\"");
            }

            // Формирование параметров для проверки на дубликат записи с таким же номером изделия
            var params_for_validate = {
                manufacturer_details: object.common_params.manufacturer_details,
                key_element_code: object.common_params.key_element_code,
                manufacturer_number: special_params.manufacturer_number,
                date_manufacture: object.common_params.date_manufacture
            }
            //проверка на уникальность по дате, номеру, заводу, типу
            var validate_dublicate = validate_dublicate_elements(params_for_validate);
            if(!validate_dublicate.success) {
                return validate_dublicate;
            }

            //Марка материала
            if(isEmptyString(special_params.steel_grade)){
                return badResp("Поле \"Марка материала\" пустое, проверьте параметр \"steel_grade\"");
            }
            var steel_grade_records = db.findbyparams("dictionary_steel_grade", {
                recname: special_params.steel_grade,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(steel_grade_records)){
                return badResp("Марка материала не найдена в системе, проверьте параметр \"steel_grade\"");
            }
            special_params.steel_grade = steel_grade_records[0].recid;

            //Грузоподъемность
            if(isEmptyString(special_params.carcass_load_capacity)){
                return badResp("Поле \"Грузоподъемность\" пустое, проверьте параметр \"carcass_load_capacity\"");
            }

            //Объем кузова (котла)
            if(isEmptyString(special_params.carcass_volume)){
                return badResp("Поле \"Объем кузова (котла)\" пустое, проверьте параметр \"carcass_volume\"");
            }

            //Масса тары максимальная
            if(isNotEmptyString(special_params.tare_max_weight)){
                if(isNaN(special_params.tare_max_weight)){
                    return badResp("Масса тары не число");
                }
                var tare_max_weight_parsed = parseFloat(special_params.tare_max_weight);
                if(tare_max_weight_parsed < 0){
                    return badResp("Масса тары отрицательна");
                }
                
            } else {
                return badResp("Поле \"Масса тары максимальная\" пустое, проверьте параметр \"tare_max_weight\"");
            }

            //Специализация
            if(isEmptyString(special_params.specialization)){
                return badResp("Поле \"Специализация\" пустое, проверьте параметр \"specialization\"");
            }
            var dictionary_specializations_records = db.findbyparams("dictionary_specializations", {
                spec_name: special_params.specialization
            });

            if(isEmptyOrNullArray(dictionary_specializations_records)){
                return badResp("Специализация не найдена в системе, проверьте параметр \"specialization\"")
            }

            special_params.specialization = dictionary_specializations_records[0].recid;

            
            break;
        //Адаптер подшипника
        case keyElementCodes.bearing_adapter_id:
           /*  //Сведения об изготовителе заготовки
           if(isEmptyString(special_params.billet_manufacturer_info)){
            var manufacturer_member = db.findbyrecid("reestr_members", object.common_params.manufacturer_details);
            if(!isNullObject(manufacturer_number)){
                special_params.billet_manufacturer_info = manufacturer_member.fullname;
            }
            else{
                return badResp("Не удалось заполнить поле \"Сведения об изготовителе заготовки\"");
            }
            } */
            //Сведения об изготовителе заготовки
            if(!isEmptyString(special_params.billet_manufacturer_info)){
                var dictionary_billet_manufacturer_details_fields = db.findbyparams("dictionary_billet_manufacturer_details", {
                    billet_manufacturer_name: special_params.billet_manufacturer_info,
                    key_element_code: keyElementCodes.bearing_adapter_id
                })
                if(!isEmptyOrNullArray(dictionary_billet_manufacturer_details_fields)){
                    special_params.billet_manufacturer_info = dictionary_billet_manufacturer_details_fields[0].recid
                } else {
                    return badResp("Значение поля \"Сведения об изготовителе заготовки\" является недопустимым, проверьте параметр \"billet_manufacturer_info\"")
                }
            } else {
                return badResp("Поле \"Сведения об изготовителе заготовки\" пустое, проверьте параметр \"billet_manufacturer_info\"")
            }

            //Условный номер для клеймения продукции вагоностроения
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "key_element_code": object.common_params.key_element_code
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;
            
            //Марка материала
            if(isEmptyString(special_params.steel_grade)){
                return badResp("Поле \"Марка материала\" пустое, проверьте параметр \"steel_grade\"");
            }
            var steel_grade_records = db.findbyparams("dictionary_steel_grade", {
                recname: special_params.steel_grade,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(steel_grade_records)){
                return badResp("Марка материала не найдена в системе, проверьте параметр \"steel_grade\"");
            }
            special_params.steel_grade = steel_grade_records[0].recid;
            break;
        //Валик подъемника
        case keyElementCodes.elevator_roll_id:
            /* //Сведения об изготовителе заготовки
           if(isEmptyString(special_params.billet_manufacturer_info)){
            var manufacturer_member = db.findbyrecid("reestr_members", object.common_params.manufacturer_details);
            if(!isNullObject(manufacturer_number)){
                special_params.billet_manufacturer_info = manufacturer_member.fullname;
            }
            else{
                return badResp("Не удалось заполнить поле \"Сведения об изготовителе заготовки\"");
            }
            } */
           //Сведения об изготовителе заготовки
           if(!isEmptyString(special_params.billet_manufacturer_info)){
            var dictionary_billet_manufacturer_details_fields = db.findbyparams("dictionary_billet_manufacturer_details", {
                billet_manufacturer_name: special_params.billet_manufacturer_info,
                key_element_code: keyElementCodes.elevator_roll_id
            })
            if(!isEmptyOrNullArray(dictionary_billet_manufacturer_details_fields)){
                special_params.billet_manufacturer_info = dictionary_billet_manufacturer_details_fields[0].recid
            } else {
                return badResp("Значение поля \"Сведения об изготовителе заготовки\" является недопустимым, проверьте параметр \"billet_manufacturer_info\"")
            }
        } else {
            return badResp("Поле \"Сведения об изготовителе заготовки\" пустое, проверьте параметр \"billet_manufacturer_info\"")
        }
            //Условный номер для клеймения продукции вагоностроения
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "key_element_code": object.common_params.key_element_code
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;
            break;
        //Замок
        case keyElementCodes.lock_id:
           /*  //Сведения об изготовителе заготовки
           if(isEmptyString(special_params.billet_manufacturer_info)){
            var manufacturer_member = db.findbyrecid("reestr_members", object.common_params.manufacturer_details);
            if(!isNullObject(manufacturer_number)){
                special_params.billet_manufacturer_info = manufacturer_member.fullname;
            }
            else{
                return badResp("Не удалось заполнить поле \"Сведения об изготовителе заготовки\"");
            }
            } */
            //Сведения об изготовителе заготовки
            if(!isEmptyString(special_params.billet_manufacturer_info)){
                var dictionary_billet_manufacturer_details_fields = db.findbyparams("dictionary_billet_manufacturer_details", {
                    billet_manufacturer_name: special_params.billet_manufacturer_info,
                    key_element_code: keyElementCodes.lock_id
                })
                if(!isEmptyOrNullArray(dictionary_billet_manufacturer_details_fields)){
                    special_params.billet_manufacturer_info = dictionary_billet_manufacturer_details_fields[0].recid
                } else {
                    return badResp("Значение поля \"Сведения об изготовителе заготовки\" является недопустимым, проверьте параметр \"billet_manufacturer_info\"")
                }
            } else {
                return badResp("Поле \"Сведения об изготовителе заготовки\" пустое, проверьте параметр \"billet_manufacturer_info\"")
            }
            //Условный номер для клеймения продукции вагоностроения
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "key_element_code": object.common_params.key_element_code
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;
            break;
        //Колесо
        case keyElementCodes.wheel_id:
            /* //Сведения об изготовителе заготовки
           if(isEmptyString(special_params.billet_manufacturer_info)){
            var manufacturer_member = db.findbyrecid("reestr_members", object.common_params.manufacturer_details);
            if(!isNullObject(manufacturer_number)){
                special_params.billet_manufacturer_info = manufacturer_member.fullname;
            }
            else{
                return badResp("Не удалось заполнить поле \"Сведения об изготовителе заготовки\"");
            }
            } */
            //Сведения об изготовителе заготовки
            if(!isEmptyString(special_params.billet_manufacturer_info)){
                var dictionary_billet_manufacturer_details_fields = db.findbyparams("dictionary_billet_manufacturer_details", {
                    billet_manufacturer_name: special_params.billet_manufacturer_info,
                    key_element_code: keyElementCodes.wheel_id
                })
                if(!isEmptyOrNullArray(dictionary_billet_manufacturer_details_fields)){
                    special_params.billet_manufacturer_info = dictionary_billet_manufacturer_details_fields[0].recid
                } else {
                    return badResp("Значение поля \"Сведения об изготовителе заготовки\" является недопустимым, проверьте параметр \"billet_manufacturer_info\"")
                }
            } else {
                return badResp("Поле \"Сведения об изготовителе заготовки\" пустое, проверьте параметр \"billet_manufacturer_info\"")
            }
            //Сведения о сертификате соответствия
            if(isEmptyString(special_params.certificate_number)){
                return badResp("Поле \"Сведения о сертификате соответствия\" пустое, проверьте параметр \"certificate_number\"")
            }
            var certificate_numbers = db.findbyparams("reestr_certificates", {
                registration_number: special_params.certificate_number,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(certificate_numbers)){
                return badResp("Сведения о сертификате соответствия не найдены в системе, проверьте параметр \"Сведения о сертификате соответствия\" ")
            }
            special_params.certificate_number = certificate_numbers[0].recid;

            //Условный номер для клеймения продукции вагоностроения
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "key_element_code": object.common_params.key_element_code
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;
            
            //Номер изделия по системе нумерации предприятия-изготовителя
            if(isEmptyString(special_params.manufacturer_number)){
                return badResp("Поле \"Номер изделия по системе нумерации предприятия-изготовителя\" пустое, проверьте параметр \"manufacturer_number\"");
            }

            // Формирование параметров для проверки на дубликат записи с таким же номером изделия
            var params_for_validate = {
                manufacturer_details: object.common_params.manufacturer_details,
                key_element_code: object.common_params.key_element_code,
                manufacturer_number: special_params.manufacturer_number,
                date_manufacture: object.common_params.date_manufacture
            }
            //проверка на уникальность по дате, номеру, заводу, типу
            var validate_dublicate = validate_dublicate_elements(params_for_validate);
            if(!validate_dublicate.success) {
                return validate_dublicate;
            }

            //Номер плавки
            if(isEmptyString(special_params.melt_number)){
                return badResp("Поле \"Номер плавки\" пустое, проверьте параметр \"melt_number\"");
            }

            //Марка материала
            if(isEmptyString(special_params.steel_grade)){
                return badResp("Поле \"Марка материала\" пустое, проверьте параметр \"steel_grade\"");
            }
            var steel_grade_records = db.findbyparams("dictionary_steel_grade", {
                recname: special_params.steel_grade,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(steel_grade_records)){
                return badResp("Марка материала не найдена в системе, проверьте параметр \"steel_grade\"");
            }
            special_params.steel_grade = steel_grade_records[0].recid;
            break;
        //Скоба
        case keyElementCodes.brace_id:
           /*  //Сведения об изготовителе заготовки
           if(isEmptyString(special_params.billet_manufacturer_info)){
            var manufacturer_member = db.findbyrecid("reestr_members", object.common_params.manufacturer_details);
            if(!isNullObject(manufacturer_number)){
                special_params.billet_manufacturer_info = manufacturer_member.fullname;
            }
            else{
                return badResp("Не удалось заполнить поле \"Сведения об изготовителе заготовки\"");
            }
            } */
            //Сведения об изготовителе заготовки
            if(!isEmptyString(special_params.billet_manufacturer_info)){
                var dictionary_billet_manufacturer_details_fields = db.findbyparams("dictionary_billet_manufacturer_details", {
                    billet_manufacturer_name: special_params.billet_manufacturer_info,
                    key_element_code: keyElementCodes.brace_id
                })
                if(!isEmptyOrNullArray(dictionary_billet_manufacturer_details_fields)){
                    special_params.billet_manufacturer_info = dictionary_billet_manufacturer_details_fields[0].recid
                } else {
                    return badResp("Значение поля \"Сведения об изготовителе заготовки\" является недопустимым, проверьте параметр \"billet_manufacturer_info\"")
                }
            } else {
                return badResp("Поле \"Сведения об изготовителе заготовки\" пустое, проверьте параметр \"billet_manufacturer_info\"")
            }
            //Условный номер для клеймения продукции вагоностроения
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "key_element_code": object.common_params.key_element_code
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;

            //Марка материала
            if(isEmptyString(special_params.steel_grade)){
                return badResp("Поле \"Марка материала\" пустое, проверьте параметр \"steel_grade\"");
            }
            var steel_grade_records = db.findbyparams("dictionary_steel_grade", {
                recname: special_params.steel_grade,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(steel_grade_records)){
                return badResp("Марка материала не найдена в системе, проверьте параметр \"steel_grade\"");
            }
            special_params.steel_grade = steel_grade_records[0].recid;
            break;
        //Планка фрикционная
        case keyElementCodes.friction_strip_id:
           /*  //Сведения об изготовителе заготовки
           if(isEmptyString(special_params.billet_manufacturer_info)){
            var manufacturer_member = db.findbyrecid("reestr_members", object.common_params.manufacturer_details);
            if(!isNullObject(manufacturer_number)){
                special_params.billet_manufacturer_info = manufacturer_member.fullname;
            }
            else{
                return badResp("Не удалось заполнить поле \"Сведения об изготовителе заготовки\"");
            }
            } */
            //Сведения об изготовителе заготовки
            if(!isEmptyString(special_params.billet_manufacturer_info)){
                var dictionary_billet_manufacturer_details_fields = db.findbyparams("dictionary_billet_manufacturer_details", {
                    billet_manufacturer_name: special_params.billet_manufacturer_info,
                    key_element_code: keyElementCodes.friction_strip_id
                })
                if(!isEmptyOrNullArray(dictionary_billet_manufacturer_details_fields)){
                    special_params.billet_manufacturer_info = dictionary_billet_manufacturer_details_fields[0].recid
                } else {
                    return badResp("Значение поля \"Сведения об изготовителе заготовки\" является недопустимым, проверьте параметр \"billet_manufacturer_info\"")
                }
            } else {
                return badResp("Поле \"Сведения об изготовителе заготовки\" пустое, проверьте параметр \"billet_manufacturer_info\"")
            }
            //Условный номер для клеймения продукции вагоностроения
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "key_element_code": object.common_params.key_element_code
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;

            //Марка материала
            if(isEmptyString(special_params.steel_grade)){
                return badResp("Поле \"Марка материала\" пустое, проверьте параметр \"steel_grade\"");
            }
            var steel_grade_records = db.findbyparams("dictionary_steel_grade", {
                recname: special_params.steel_grade,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(steel_grade_records)){
                return badResp("Марка материала не найдена в системе, проверьте параметр \"steel_grade\"");
            }
            special_params.steel_grade = steel_grade_records[0].recid;
            break;
        //Колпак скользуна
        case keyElementCodes.slider_cap_id:
            /* //Сведения об изготовителе заготовки
           if(isEmptyString(special_params.billet_manufacturer_info)){
            var manufacturer_member = db.findbyrecid("reestr_members", object.common_params.manufacturer_details);
            if(!isNullObject(manufacturer_number)){
                special_params.billet_manufacturer_info = manufacturer_member.fullname;
            }
            else{
                return badResp("Не удалось заполнить поле \"Сведения об изготовителе заготовки\"");
            }
            } */
            //Сведения об изготовителе заготовки
            if(!isEmptyString(special_params.billet_manufacturer_info)){
                var dictionary_billet_manufacturer_details_fields = db.findbyparams("dictionary_billet_manufacturer_details", {
                    billet_manufacturer_name: special_params.billet_manufacturer_info,
                    key_element_code: keyElementCodes.slider_cap_id
                })
                if(!isEmptyOrNullArray(dictionary_billet_manufacturer_details_fields)){
                    special_params.billet_manufacturer_info = dictionary_billet_manufacturer_details_fields[0].recid
                } else {
                    return badResp("Значение поля \"Сведения об изготовителе заготовки\" является недопустимым, проверьте параметр \"billet_manufacturer_info\"")
                }
            } else {
                return badResp("Поле \"Сведения об изготовителе заготовки\" пустое, проверьте параметр \"billet_manufacturer_info\"")
            }
            //Условный номер для клеймения продукции вагоностроения
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "key_element_code": object.common_params.key_element_code
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;

            //Марка материала
            if(isEmptyString(special_params.steel_grade)){
                return badResp("Поле \"Марка материала\" пустое, проверьте параметр \"steel_grade\"");
            }
            var steel_grade_records = db.findbyparams("dictionary_steel_grade", {
                recname: special_params.steel_grade,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(steel_grade_records)){
                return badResp("Марка материала не найдена в системе, проверьте параметр \"steel_grade\"");
            }
            special_params.steel_grade = steel_grade_records[0].recid;
            break;
        //Корпус скользуна
        case keyElementCodes.slider_body_id:
            /* //Сведения об изготовителе заготовки
           if(isEmptyString(special_params.billet_manufacturer_info)){
            var manufacturer_member = db.findbyrecid("reestr_members", object.common_params.manufacturer_details);
            if(!isNullObject(manufacturer_number)){
                special_params.billet_manufacturer_info = manufacturer_member.fullname;
            }
            else{
                return badResp("Не удалось заполнить поле \"Сведения об изготовителе заготовки\"");
            }
            } */
            //Сведения об изготовителе заготовки
            if(!isEmptyString(special_params.billet_manufacturer_info)){
                var dictionary_billet_manufacturer_details_fields = db.findbyparams("dictionary_billet_manufacturer_details", {
                    billet_manufacturer_name: special_params.billet_manufacturer_info,
                    key_element_code: keyElementCodes.slider_body_id
                })
                if(!isEmptyOrNullArray(dictionary_billet_manufacturer_details_fields)){
                    special_params.billet_manufacturer_info = dictionary_billet_manufacturer_details_fields[0].recid
                } else {
                    return badResp("Значение поля \"Сведения об изготовителе заготовки\" является недопустимым, проверьте параметр \"billet_manufacturer_info\"")
                }
            } else {
                return badResp("Поле \"Сведения об изготовителе заготовки\" пустое, проверьте параметр \"billet_manufacturer_info\"")
            }
            //Условный номер для клеймения продукции вагоностроения
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            });
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "key_element_code": object.common_params.key_element_code
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;

            //Марка материала
            if(isEmptyString(special_params.steel_grade)){
                return badResp("Поле \"Марка материала\" пустое, проверьте параметр \"steel_grade\"");
            }
            var steel_grade_records = db.findbyparams("dictionary_steel_grade", {
                recname: special_params.steel_grade,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(steel_grade_records)){
                return badResp("Марка материала не найдена в системе, проверьте параметр \"steel_grade\"");
            }
            special_params.steel_grade = steel_grade_records[0].recid;
            break;
        //Клин фрикционный
        case keyElementCodes.friction_wedge_id:
           /*  //Сведения об изготовителе заготовки
           if(isEmptyString(special_params.billet_manufacturer_info)){
            var manufacturer_member = db.findbyrecid("reestr_members", object.common_params.manufacturer_details);
            if(!isNullObject(manufacturer_number)){
                special_params.billet_manufacturer_info = manufacturer_member.fullname;
            }
            else{
                return badResp("Не удалось заполнить поле \"Сведения об изготовителе заготовки\"");
            }
            } */
            //Сведения об изготовителе заготовки
            if(!isEmptyString(special_params.billet_manufacturer_info)){
                var dictionary_billet_manufacturer_details_fields = db.findbyparams("dictionary_billet_manufacturer_details", {
                    billet_manufacturer_name: special_params.billet_manufacturer_info,
                    key_element_code: keyElementCodes.friction_wedge_id
                })
                if(!isEmptyOrNullArray(dictionary_billet_manufacturer_details_fields)){
                    special_params.billet_manufacturer_info = dictionary_billet_manufacturer_details_fields[0].recid
                } else {
                    return badResp("Значение поля \"Сведения об изготовителе заготовки\" является недопустимым, проверьте параметр \"billet_manufacturer_info\"")
                }
            } else {
                return badResp("Поле \"Сведения об изготовителе заготовки\" пустое, проверьте параметр \"billet_manufacturer_info\"")
            }
            //Условный номер для клеймения продукции вагоностроения
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "key_element_code": object.common_params.key_element_code
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;

            //Марка материала
            if(isEmptyString(special_params.steel_grade)){
                return badResp("Поле \"Марка материала\" пустое, проверьте параметр \"steel_grade\"");
            }
            var steel_grade_records = db.findbyparams("dictionary_steel_grade", {
                recname: special_params.steel_grade,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(steel_grade_records)){
                return badResp("Марка материала не найдена в системе, проверьте параметр \"steel_grade\"");
            }
            special_params.steel_grade = steel_grade_records[0].recid;

            break;
        //Корпус автосцепки
        case keyElementCodes.coupler_id:
           /*  //Сведения об изготовителе заготовки
           if(isEmptyString(special_params.billet_manufacturer_info)){
            var manufacturer_member = db.findbyrecid("reestr_members", object.common_params.manufacturer_details);
            if(!isNullObject(manufacturer_number)){
                special_params.billet_manufacturer_info = manufacturer_member.fullname;
            }
            else{
                return badResp("Не удалось заполнить поле \"Сведения об изготовителе заготовки\"");
            }
            } */
            //Сведения об изготовителе заготовки
            if(!isEmptyString(special_params.billet_manufacturer_info)){
                var dictionary_billet_manufacturer_details_fields = db.findbyparams("dictionary_billet_manufacturer_details", {
                    billet_manufacturer_name: special_params.billet_manufacturer_info,
                    key_element_code: keyElementCodes.coupler_id
                })
                if(!isEmptyOrNullArray(dictionary_billet_manufacturer_details_fields)){
                    special_params.billet_manufacturer_info = dictionary_billet_manufacturer_details_fields[0].recid
                } else {
                    return badResp("Значение поля \"Сведения об изготовителе заготовки\" является недопустимым, проверьте параметр \"billet_manufacturer_info\"")
                }
            } else {
                return badResp("Поле \"Сведения об изготовителе заготовки\" пустое, проверьте параметр \"billet_manufacturer_info\"")
            }
            //Сведения о сертификате соответствия
            if(isEmptyString(special_params.certificate_number)){
                return badResp("Поле \"Сведения о сертификате соответствия\" пустое, проверьте параметр \"certificate_number\"")
            }
            var certificate_numbers = db.findbyparams("reestr_certificates", {
                registration_number: special_params.certificate_number,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(certificate_numbers)){
                return badResp("Сведения о сертификате соответствия не найдены в системе, проверьте параметр \"Сведения о сертификате соответствия\" ")
            }
            special_params.certificate_number = certificate_numbers[0].recid;
            //Условный номер для клеймения продукции вагоностроения
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "key_element_code": object.common_params.key_element_code
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;

            //Номер изделия по системе нумерации предприятия-изготовителя
            if(isEmptyString(special_params.manufacturer_number)){
                return badResp("Поле \"Номер изделия по системе нумерации предприятия-изготовителя\" пустое, проверьте параметр \"manufacturer_number\"");
            }

            // Формирование параметров для проверки на дубликат записи с таким же номером изделия
            var params_for_validate = {
                manufacturer_details: object.common_params.manufacturer_details,
                key_element_code: object.common_params.key_element_code,
                manufacturer_number: special_params.manufacturer_number,
                date_manufacture: object.common_params.date_manufacture
            }
            //проверка на уникальность по дате, номеру, заводу, типу
            var validate_dublicate = validate_dublicate_elements(params_for_validate);
            if(!validate_dublicate.success) {
                return validate_dublicate;
            }

            //Марка материала
            if(isEmptyString(special_params.steel_grade)){
                return badResp("Поле \"Марка материала\" пустое, проверьте параметр \"steel_grade\"");
            }
            var steel_grade_records = db.findbyparams("dictionary_steel_grade", {
                recname: special_params.steel_grade,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(steel_grade_records)){
                return badResp("Марка материала не найдена в системе, проверьте параметр \"steel_grade\"");
            }
            special_params.steel_grade = steel_grade_records[0].recid;

            //Модель автосцепки
            if(isEmptyString(special_params.coupling_model)){
                return badResp("Поле \"Модель автосцепки\" пустое, проверьте параметр \"coupling_model\"");
            }
            var dictionary_couplings_models_records = db.findbyparams("dictionary_couplings_models", {
                coupling_name: special_params.coupling_model
            });
            if(isEmptyOrNullArray(dictionary_couplings_models_records)){
                return badResp("Модель автосцепки не найдена в системе, проверьте параметр \"coupling_model\"");
            }

            special_params.coupling_model = dictionary_couplings_models_records[0].recid;
            break;
        //Рама боковая
        case keyElementCodes.side_frame_id:
           /*  //Сведения об изготовителе заготовки
           if(isEmptyString(special_params.billet_manufacturer_info)){
            var manufacturer_member = db.findbyrecid("reestr_members", object.common_params.manufacturer_details);
            if(!isNullObject(manufacturer_number)){
                special_params.billet_manufacturer_info = manufacturer_member.fullname;
            }
            else{
                return badResp("Не удалось заполнить поле \"Сведения об изготовителе заготовки\"");
            }
            } */
           //Сведения об изготовителе заготовки
           if(!isEmptyString(special_params.billet_manufacturer_info)){
            var dictionary_billet_manufacturer_details_fields = db.findbyparams("dictionary_billet_manufacturer_details", {
                billet_manufacturer_name: special_params.billet_manufacturer_info,
                key_element_code: keyElementCodes.side_frame_id
            })
            if(!isEmptyOrNullArray(dictionary_billet_manufacturer_details_fields)){
                special_params.billet_manufacturer_info = dictionary_billet_manufacturer_details_fields[0].recid
            } else {
                return badResp("Значение поля \"Сведения об изготовителе заготовки\" является недопустимым, проверьте параметр \"billet_manufacturer_info\"")
            }
        } else {
            return badResp("Поле \"Сведения об изготовителе заготовки\" пустое, проверьте параметр \"billet_manufacturer_info\"")
        }
            //Условный номер для клеймения продукции вагоностроения
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "key_element_code": object.common_params.key_element_code
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;

            //Номер изделия по системе нумерации предприятия-изготовителя
            if(isEmptyString(special_params.manufacturer_number)){
                return badResp("Поле \"Номер изделия по системе нумерации предприятия-изготовителя\" пустое, проверьте параметр \"manufacturer_number\"");
            }

            // Формирование параметров для проверки на дубликат записи с таким же номером изделия
            var params_for_validate = {
                manufacturer_details: object.common_params.manufacturer_details,
                key_element_code: object.common_params.key_element_code,
                manufacturer_number: special_params.manufacturer_number,
                date_manufacture: object.common_params.date_manufacture
            }
            //проверка на уникальность по дате, номеру, заводу, типу
            var validate_dublicate = validate_dublicate_elements(params_for_validate);
            if(!validate_dublicate.success) {
                return validate_dublicate;
            }

            //Номер плавки
            if(isEmptyString(special_params.melt_number)){
                return badResp("Поле \"Номер плавки\" пустое, проверьте параметр \"melt_number\"");
            }

            //Марка материала
            if(isEmptyString(special_params.steel_grade)){
                return badResp("Поле \"Марка материала\" пустое, проверьте параметр \"steel_grade\"");
            }
            var steel_grade_records = db.findbyparams("dictionary_steel_grade", {
                recname: special_params.steel_grade,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(steel_grade_records)){
                return badResp("Марка материала не найдена в системе, проверьте параметр \"steel_grade\"");
            }
            special_params.steel_grade = steel_grade_records[0].recid;

            //Код государства собственника детали
            if(isEmptyString(special_params.administration_code)){
                return badResp("Поле \"Код государства собственника детали\" пустое, проверьте параметр \"administration_code\"");
            }
            var administration_code_records = db.findbyparams("dictionary_administration_codes", {
                recname: special_params.administration_code
            });
            if(isEmptyOrNullArray(administration_code_records)){
                return badResp("Код государства собственника детали не найден в системе, проверьте параметр \"administration_code\"");
            }
            special_params.administration_code = administration_code_records[0].recid;

            //Сведения о сертификате соответствия
            if(isEmptyString(special_params.certificate_number)){
                return badResp("Поле \"Сведения о сертификате соответствия\" пустое, проверьте параметр \"certificate_number\"")
            }
            var certificate_numbers = db.findbyparams("reestr_certificates", {
                registration_number: special_params.certificate_number,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(certificate_numbers)){
                return badResp("Сведения о сертификате соответствия не найдены в системе, проверьте параметр \"Сведения о сертификате соответствия\" ")
            }
            special_params.certificate_number = certificate_numbers[0].recid;

            //Срок службы
            if(isEmptyString(special_params.life_time)){
                return badResp("Поле \"Срок службы\" пустое, проверьте параметр \"life_time\"");
            }

            //Расстояние между наружными упорными поверхностями буксового проема (количество шишек)
            if(isEmptyString(special_params.slip_knots_distance)){
                return badResp("Поле \"Расстояние между наружными упорными поверхностями буксового проема (количество шишек)\" пустое, проверьте параметр \"slip_knots_distance\"");
            }
            break;
        //Балка надрессорная
        case keyElementCodes.pressure_beam_id:
           /*  //Сведения об изготовителе заготовки
           if(isEmptyString(special_params.billet_manufacturer_info)){
            var manufacturer_member = db.findbyrecid("reestr_members", object.common_params.manufacturer_details);
            if(!isNullObject(manufacturer_number)){
                special_params.billet_manufacturer_info = manufacturer_member.fullname;
            }
            else{
                return badResp("Не удалось заполнить поле \"Сведения об изготовителе заготовки\"");
            }
            } */
           //Сведения об изготовителе заготовки
           if(!isEmptyString(special_params.billet_manufacturer_info)){
            var dictionary_billet_manufacturer_details_fields = db.findbyparams("dictionary_billet_manufacturer_details", {
                billet_manufacturer_name: special_params.billet_manufacturer_info,
                key_element_code: keyElementCodes.pressure_beam_id
            })
            if(!isEmptyOrNullArray(dictionary_billet_manufacturer_details_fields)){
                special_params.billet_manufacturer_info = dictionary_billet_manufacturer_details_fields[0].recid
            } else {
                return badResp("Значение поля \"Сведения об изготовителе заготовки\" является недопустимым, проверьте параметр \"billet_manufacturer_info\"")
            }
        } else {
            return badResp("Поле \"Сведения об изготовителе заготовки\" пустое, проверьте параметр \"billet_manufacturer_info\"")
        }
            //Условный номер для клеймения продукции вагоностроения
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "key_element_code": object.common_params.key_element_code
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;

            //Номер изделия по системе нумерации предприятия-изготовителя
            if(isEmptyString(special_params.manufacturer_number)){
                return badResp("Поле \"Номер изделия по системе нумерации предприятия-изготовителя\" пустое, проверьте параметр \"manufacturer_number\"");
            }

            // Формирование параметров для проверки на дубликат записи с таким же номером изделия
            var params_for_validate = {
                manufacturer_details: object.common_params.manufacturer_details,
                key_element_code: object.common_params.key_element_code,
                manufacturer_number: special_params.manufacturer_number,
                date_manufacture: object.common_params.date_manufacture
            }
            //проверка на уникальность по дате, номеру, заводу, типу
            var validate_dublicate = validate_dublicate_elements(params_for_validate);
            if(!validate_dublicate.success) {
                return validate_dublicate;
            }

            //Марка материала
            if(isEmptyString(special_params.steel_grade)){
                return badResp("Поле \"Марка материала\" пустое, проверьте параметр \"steel_grade\"");
            }
            var steel_grade_records = db.findbyparams("dictionary_steel_grade", {
                recname: special_params.steel_grade,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(steel_grade_records)){
                return badResp("Марка материала не найдена в системе, проверьте параметр \"steel_grade\"");
            }
            special_params.steel_grade = steel_grade_records[0].recid;

            //Код государства собственника детали
            if(isEmptyString(special_params.administration_code)){
                return badResp("Поле \"Код государства собственника детали\" пустое, проверьте параметр \"administration_code\"");
            }
            var administration_code_records = db.findbyparams("dictionary_administration_codes", {
                recname: special_params.administration_code
            });
            if(isEmptyOrNullArray(administration_code_records)){
                return badResp("Код государства собственника детали не найден в системе, проверьте параметр \"administration_code\"");
            }
            special_params.administration_code = administration_code_records[0].recid;

            //Сведения о сертификате соответствия
            if(isEmptyString(special_params.certificate_number)){
                return badResp("Поле \"Сведения о сертификате соответствия\" пустое, проверьте параметр \"certificate_number\"")
            }
            var certificate_numbers = db.findbyparams("reestr_certificates", {
                registration_number: special_params.certificate_number,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(certificate_numbers)){
                return badResp("Сведения о сертификате соответствия не найдены в системе, проверьте параметр \"Сведения о сертификате соответствия\" ")
            }
            special_params.certificate_number = certificate_numbers[0].recid;

            //Срок службы
            if(isEmptyString(special_params.life_time)){
                return badResp("Поле \"Срок службы\" пустое, проверьте параметр \"life_time\"");
            }

            //Номер плавки
            if(isEmptyString(special_params.melt_number)){
                return badResp("Поле \"Номер плавки\" пустое, проверьте параметр \"melt_number\"");
            }
            break;

        //Подшипник буксового узла 
        case keyElementCodes.bearing_node_id:
             
            // Технические условия
            if (!isEmptyString(special_params.technical_specifications)){
                var technical_conditions_fields = db.findbyparams("dictionary_technical_conditions", {
                    recname: special_params.technical_specifications
                })
                if(!isEmptyOrNullArray(technical_conditions_fields)){

                    //Проверка что поле "Технические условия" может вычислиться 
                    var documentation_record = db.findbyrecid("reestr_documentation", object.common_params.documentation_number);
                    if(isNullObject(documentation_record)){
                        return badResp("Не удалось получить значение поля \"Технические условия\", не получена информация о документации")
                    }

                    if(documentation_record.technical_conditions != technical_conditions_fields[0].recid){
                        return badResp("Значение поля \"Технические условия\" не заполнено в Реестре конструкторской и эксплуатационной документации")
                    }

                } else {
                    return badResp("Значение поля \"Технические условия\" является недопустимым, проверьте параметр \"technical_specifications\"")
                }
            } else {
                return badResp("Поле \"Технические условия\" пустое, проверьте параметр \"technical_specifications\"")
            }

            //Номер изделия по системе нумерации предприятия-изготовителя
            if(isEmptyString(special_params.manufacturer_number)){
                return badResp("Поле \"Номер изделия по системе нумерации предприятия-изготовителя\" пустое, проверьте параметр \"manufacturer_number\"");
            }

            // Формирование параметров для проверки на дубликат записи с таким же номером изделия
            var params_for_validate = {
                manufacturer_details: object.common_params.manufacturer_details,
                key_element_code: object.common_params.key_element_code,
                manufacturer_number: special_params.manufacturer_number,
                date_manufacture: object.common_params.date_manufacture
            }
            //проверка на уникальность по дате, номеру, заводу, типу
            var validate_dublicate = validate_dublicate_elements(params_for_validate);
            if(!validate_dublicate.success) {
                return validate_dublicate;
            }

            //Условный номер для клеймения продукции вагоностроения
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "key_element_code": object.common_params.key_element_code
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;

            //Сведения о сертификате соответствия
            if(isEmptyString(special_params.certificate_number)){
                return badResp("Поле \"Сведения о сертификате соответствия\" пустое, проверьте параметр \"certificate_number\"")
            }
            var certificate_numbers = db.findbyparams("reestr_certificates", {
                registration_number: special_params.certificate_number,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(certificate_numbers)){
                return badResp("Сведения о сертификате соответствия не найдены в системе, проверьте параметр \"Сведения о сертификате соответствия\" ")
            }
            special_params.certificate_number = certificate_numbers[0].recid;
            break;

        //Пружина скользуна внутренняя
        case keyElementCodes.spring_slider_inside_id:
            //Марка материала
            if(isEmptyString(special_params.steel_grade)){
                return badResp("Поле \"Марка материала\" пустое, проверьте параметр \"steel_grade\"");
            }
            var steel_grade_records = db.findbyparams("dictionary_steel_grade", {
                recname: special_params.steel_grade,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(steel_grade_records)){
                return badResp("Марка материала не найдена в системе, проверьте параметр \"steel_grade\"");
            }
            special_params.steel_grade = steel_grade_records[0].recid;
            /* //Сведения об изготовителе заготовки
           if(isEmptyString(special_params.billet_manufacturer_info)){
            var manufacturer_member = db.findbyrecid("reestr_members", object.common_params.manufacturer_details);
            if(!isNullObject(manufacturer_number)){
                special_params.billet_manufacturer_info = manufacturer_member.fullname;
            }
            else{
                return badResp("Не удалось заполнить поле \"Сведения об изготовителе заготовки\"");
            }
            } */
            //Сведения об изготовителе заготовки
            if(!isEmptyString(special_params.billet_manufacturer_info)){
                var dictionary_billet_manufacturer_details_fields = db.findbyparams("dictionary_billet_manufacturer_details", {
                    billet_manufacturer_name: special_params.billet_manufacturer_info,
                    key_element_code: keyElementCodes.spring_slider_inside_id
                })
                if(!isEmptyOrNullArray(dictionary_billet_manufacturer_details_fields)){
                    special_params.billet_manufacturer_info = dictionary_billet_manufacturer_details_fields[0].recid
                } else {
                    return badResp("Значение поля \"Сведения об изготовителе заготовки\" является недопустимым, проверьте параметр \"billet_manufacturer_info\"")
                }
            } else {
                return badResp("Поле \"Сведения об изготовителе заготовки\" пустое, проверьте параметр \"billet_manufacturer_info\"")
            }
            break;

        //Пружина скользуна наружная 
        case keyElementCodes.spring_slider_outside_id:
            //Марка материала
            if(isEmptyString(special_params.steel_grade)){
                return badResp("Поле \"Марка материала\" пустое, проверьте параметр \"steel_grade\"");
            }
            var steel_grade_records = db.findbyparams("dictionary_steel_grade", {
                recname: special_params.steel_grade,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(steel_grade_records)){
                return badResp("Марка материала не найдена в системе, проверьте параметр \"steel_grade\"");
            }
            special_params.steel_grade = steel_grade_records[0].recid;

            /* //Сведения об изготовителе заготовки
           if(isEmptyString(special_params.billet_manufacturer_info)){
            var manufacturer_member = db.findbyrecid("reestr_members", object.common_params.manufacturer_details);
            if(!isNullObject(manufacturer_number)){
                special_params.billet_manufacturer_info = manufacturer_member.fullname;
            }
            else{
                return badResp("Не удалось заполнить поле \"Сведения об изготовителе заготовки\"");
            }
            } */

           //Сведения об изготовителе заготовки
           if(!isEmptyString(special_params.billet_manufacturer_info)){
            var dictionary_billet_manufacturer_details_fields = db.findbyparams("dictionary_billet_manufacturer_details", {
                billet_manufacturer_name: special_params.billet_manufacturer_info,
                key_element_code: keyElementCodes.spring_slider_outside_id
            })
            if(!isEmptyOrNullArray(dictionary_billet_manufacturer_details_fields)){
                special_params.billet_manufacturer_info = dictionary_billet_manufacturer_details_fields[0].recid
            } else {
                return badResp("Значение поля \"Сведения об изготовителе заготовки\" является недопустимым, проверьте параметр \"billet_manufacturer_info\"")
            }
        } else {
            return badResp("Поле \"Сведения об изготовителе заготовки\" пустое, проверьте параметр \"billet_manufacturer_info\"")
        }
            break;

        //Пружина рессорного подвешивания внутренняя    
        case keyElementCodes.spring_inside_id:
            //Сведения о сертификате соответствия
            if(isEmptyString(special_params.certificate_number)){
                return badResp("Поле \"Сведения о сертификате соответствия\" пустое, проверьте параметр \"certificate_number\"")
            }
            var certificate_numbers = db.findbyparams("reestr_certificates", {
                registration_number: special_params.certificate_number,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(certificate_numbers)){
                return badResp("Сведения о сертификате соответствия не найдены в системе, проверьте параметр \"Сведения о сертификате соответствия\" ")
            }
            special_params.certificate_number = certificate_numbers[0].recid;

            //Условный номер для клеймения продукции вагоностроения
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "key_element_code": object.common_params.key_element_code
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;

            //Марка материала
            if(isEmptyString(special_params.steel_grade)){
                return badResp("Поле \"Марка материала\" пустое, проверьте параметр \"steel_grade\"");
            }
            var steel_grade_records = db.findbyparams("dictionary_steel_grade", {
                recname: special_params.steel_grade,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(steel_grade_records)){
                return badResp("Марка материала не найдена в системе, проверьте параметр \"steel_grade\"");
            }
            special_params.steel_grade = steel_grade_records[0].recid;

           /*  //Сведения об изготовителе заготовки
           if(isEmptyString(special_params.billet_manufacturer_info)){
            var manufacturer_member = db.findbyrecid("reestr_members", object.common_params.manufacturer_details);
            if(!isNullObject(manufacturer_number)){
                special_params.billet_manufacturer_info = manufacturer_member.fullname;
            }
            else{
                return badResp("Не удалось заполнить поле \"Сведения об изготовителе заготовки\"");
            }
            } */

            //Сведения об изготовителе заготовки
            if(!isEmptyString(special_params.billet_manufacturer_info)){
                var dictionary_billet_manufacturer_details_fields = db.findbyparams("dictionary_billet_manufacturer_details", {
                    billet_manufacturer_name: special_params.billet_manufacturer_info,
                    key_element_code: keyElementCodes.spring_inside_id
                })
                if(!isEmptyOrNullArray(dictionary_billet_manufacturer_details_fields)){
                    special_params.billet_manufacturer_info = dictionary_billet_manufacturer_details_fields[0].recid
                } else {
                    return badResp("Значение поля \"Сведения об изготовителе заготовки\" является недопустимым, проверьте параметр \"billet_manufacturer_info\"")
                }
            } else {
                return badResp("Поле \"Сведения об изготовителе заготовки\" пустое, проверьте параметр \"billet_manufacturer_info\"")
            }
            break;
        
        //Пружина рессорного подвешивания наружная 
        case keyElementCodes.spring_outside_id:
            //Сведения о сертификате соответствия
            if(isEmptyString(special_params.certificate_number)){
                return badResp("Поле \"Сведения о сертификате соответствия\" пустое, проверьте параметр \"certificate_number\"")
            }
            var certificate_numbers = db.findbyparams("reestr_certificates", {
                registration_number: special_params.certificate_number,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(certificate_numbers)){
                return badResp("Сведения о сертификате соответствия не найдены в системе, проверьте параметр \"Сведения о сертификате соответствия\" ")
            }
            special_params.certificate_number = certificate_numbers[0].recid;

            //Условный номер для клеймения продукции вагоностроения
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "key_element_code": object.common_params.key_element_code
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;

            //Марка материала
            if(isEmptyString(special_params.steel_grade)){
                return badResp("Поле \"Марка материала\" пустое, проверьте параметр \"steel_grade\"");
            }
            var steel_grade_records = db.findbyparams("dictionary_steel_grade", {
                recname: special_params.steel_grade,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(steel_grade_records)){
                return badResp("Марка материала не найдена в системе, проверьте параметр \"steel_grade\"");
            }
            special_params.steel_grade = steel_grade_records[0].recid;

           /*  //Сведения об изготовителе заготовки
           if(isEmptyString(special_params.billet_manufacturer_info)){
            var manufacturer_member = db.findbyrecid("reestr_members", object.common_params.manufacturer_details);
            if(!isNullObject(manufacturer_number)){
                special_params.billet_manufacturer_info = manufacturer_member.fullname;
            }
            else{
                return badResp("Не удалось заполнить поле \"Сведения об изготовителе заготовки\"");
            }
            } */

            //Сведения об изготовителе заготовки
            if(!isEmptyString(special_params.billet_manufacturer_info)){
                var dictionary_billet_manufacturer_details_fields = db.findbyparams("dictionary_billet_manufacturer_details", {
                    billet_manufacturer_name: special_params.billet_manufacturer_info,
                    key_element_code: keyElementCodes.spring_outside_id
                })
                if(!isEmptyOrNullArray(dictionary_billet_manufacturer_details_fields)){
                    special_params.billet_manufacturer_info = dictionary_billet_manufacturer_details_fields[0].recid
                } else {
                    return badResp("Значение поля \"Сведения об изготовителе заготовки\" является недопустимым, проверьте параметр \"billet_manufacturer_info\"")
                }
            } else {
                return badResp("Поле \"Сведения об изготовителе заготовки\" пустое, проверьте параметр \"billet_manufacturer_info\"")
            }
            break;

        //Авторежим грузовой
        case keyElementCodes.auto_mode_cargo_id:
            //Условный номер для клеймения продукции вагоностроения
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "key_element_code": object.common_params.key_element_code
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;
            
           // Технические условия
            if (!isEmptyString(special_params.technical_specifications)){
                var technical_conditions_fields = db.findbyparams("dictionary_technical_conditions", {
                    recname: special_params.technical_specifications
                })
                if(!isEmptyOrNullArray(technical_conditions_fields)){

                    //Проверка что поле "Технические условия" может вычислиться 
                    var documentation_record = db.findbyrecid("reestr_documentation", object.common_params.documentation_number);
                    if(isNullObject(documentation_record)){
                        return badResp("Не удалось получить значение поля \"Технические условия\", не получена информация о документации")
                    }

                    if(documentation_record.technical_conditions != technical_conditions_fields[0].recid){
                        return badResp("Значение поля \"Технические условия\" не заполнено в Реестре конструкторской и эксплуатационной документации")
                    }

                } else {
                    return badResp("Значение поля \"Технические условия\" является недопустимым, проверьте параметр \"technical_specifications\"")
                }
            } else {
                return badResp("Поле \"Технические условия\" пустое, проверьте параметр \"technical_specifications\"")
            }
            

            //Сведения о сертификате соответствия
            if(isEmptyString(special_params.certificate_number)){
                return badResp("Поле \"Сведения о сертификате соответствия\" пустое, проверьте параметр \"certificate_number\"")
            }
            var certificate_numbers = db.findbyparams("reestr_certificates", {
                registration_number: special_params.certificate_number,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(certificate_numbers)){
                return badResp("Сведения о сертификате соответствия не найдены в системе, проверьте параметр \"Сведения о сертификате соответствия\" ")
            }
            special_params.certificate_number = certificate_numbers[0].recid;

            //Номер изделия по системе нумерации предприятия-изготовителя
            if(isEmptyString(special_params.manufacturer_number)){
                return badResp("Поле \"Номер изделия по системе нумерации предприятия-изготовителя\" пустое, проверьте параметр \"manufacturer_number\"");
            }

            // Формирование параметров для проверки на дубликат записи с таким же номером изделия
            var params_for_validate = {
                manufacturer_details: object.common_params.manufacturer_details,
                key_element_code: object.common_params.key_element_code,
                manufacturer_number: special_params.manufacturer_number,
                date_manufacture: object.common_params.date_manufacture
            }
            //проверка на уникальность по дате, номеру, заводу, типу
            var validate_dublicate = validate_dublicate_elements(params_for_validate);
            if(!validate_dublicate.success) {
                return validate_dublicate;
            }

            //Срок службы
            if(isEmptyString(special_params.life_time)){
                return badResp("Поле \"Срок службы\" пустое, проверьте параметр \"life_time\"");
            }

            //Обозначение модели авторежим грузовой
            if(isEmptyString(special_params.coupling_model)){
                return badResp("Поле \"Обозначение модели авторежим грузовой\" пустое, проверьте параметр \"auto_mode_cargo_model\"");
            }
            var dictionary_auto_mode_cargo_models = db.findbyparams("dictionary_auto_mode_cargo_models", {
                recname: special_params.coupling_model
            })
            if(isEmptyOrNullArray(dictionary_auto_mode_cargo_models)){
                return badResp("Обозначение модели автосцепки не найдено в системе, проверьте параметр \"autocoupler_model\"");
            }
            special_params.coupling_model = dictionary_auto_mode_cargo_models[0].recid;

            break;
        //Хомут тяговый
        case keyElementCodes.traction_clamp_id:
           /*  //Сведения об изготовителе заготовки
           if(isEmptyString(special_params.billet_manufacturer_info)){
            var manufacturer_member = db.findbyrecid("reestr_members", object.common_params.manufacturer_details);
            if(!isNullObject(manufacturer_number)){
                special_params.billet_manufacturer_info = manufacturer_member.fullname;
            }
            else{
                return badResp("Не удалось заполнить поле \"Сведения об изготовителе заготовки\"");
            }
            } */
           //Сведения об изготовителе заготовки
           if(!isEmptyString(special_params.billet_manufacturer_info)){
            var dictionary_billet_manufacturer_details_fields = db.findbyparams("dictionary_billet_manufacturer_details", {
                billet_manufacturer_name: special_params.billet_manufacturer_info,
                key_element_code: keyElementCodes.traction_clamp_id
            })
            if(!isEmptyOrNullArray(dictionary_billet_manufacturer_details_fields)){
                special_params.billet_manufacturer_info = dictionary_billet_manufacturer_details_fields[0].recid
            } else {
                return badResp("Значение поля \"Сведения об изготовителе заготовки\" является недопустимым, проверьте параметр \"billet_manufacturer_info\"")
            }
        } else {
            return badResp("Поле \"Сведения об изготовителе заготовки\" пустое, проверьте параметр \"billet_manufacturer_info\"")
        }
            //Сведения о сертификате соответствия
            if(isEmptyString(special_params.certificate_number)){
                return badResp("Поле \"Сведения о сертификате соответствия\" пустое, проверьте параметр \"certificate_number\"")
            }
            var certificate_numbers = db.findbyparams("reestr_certificates", {
                registration_number: special_params.certificate_number,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(certificate_numbers)){
                return badResp("Сведения о сертификате соответствия не найдены в системе, проверьте параметр \"Сведения о сертификате соответствия\" ")
            }
            special_params.certificate_number = certificate_numbers[0].recid;

            //Условный номер для клеймения продукции вагоностроения
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "key_element_code": object.common_params.key_element_code
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;
            //Номер изделия по системе нумерации предприятия-изготовителя
            if(isEmptyString(special_params.manufacturer_number)){
                return badResp("Поле \"Номер изделия по системе нумерации предприятия-изготовителя\" пустое, проверьте параметр \"manufacturer_number\"");
            }

            // Формирование параметров для проверки на дубликат записи с таким же номером изделия
            var params_for_validate = {
                manufacturer_details: object.common_params.manufacturer_details,
                key_element_code: object.common_params.key_element_code,
                manufacturer_number: special_params.manufacturer_number,
                date_manufacture: object.common_params.date_manufacture
            }
            //проверка на уникальность по дате, номеру, заводу, типу
            var validate_dublicate = validate_dublicate_elements(params_for_validate);
            if(!validate_dublicate.success) {
                return validate_dublicate;
            }
     
            //Марка материала
            if(isEmptyString(special_params.steel_grade)){
                return badResp("Поле \"Марка материала\" пустое, проверьте параметр \"steel_grade\"");
            }
            var steel_grade_records = db.findbyparams("dictionary_steel_grade", {
                recname: special_params.steel_grade,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(steel_grade_records)){
                return badResp("Марка материала не найдена в системе, проверьте параметр \"steel_grade\"");
            }
            special_params.steel_grade = steel_grade_records[0].recid;
            
            break;

        //Корпус поглощающего аппарата
        case keyElementCodes.absorbing_device_body_id:
            //Условный номер для клеймения продукции вагоностроения
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "key_element_code": object.common_params.key_element_code
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;

            //Номер изделия по системе нумерации предприятия-изготовителя
            if(isEmptyString(special_params.manufacturer_number)){
                return badResp("Поле \"Номер изделия по системе нумерации предприятия-изготовителя\" пустое, проверьте параметр \"manufacturer_number\"");
            }

            // Формирование параметров для проверки на дубликат записи с таким же номером изделия
            var params_for_validate = {
                manufacturer_details: object.common_params.manufacturer_details,
                key_element_code: object.common_params.key_element_code,
                manufacturer_number: special_params.manufacturer_number,
                date_manufacture: object.common_params.date_manufacture
            }
            //проверка на уникальность по дате, номеру, заводу, типу
            var validate_dublicate = validate_dublicate_elements(params_for_validate);
            if(!validate_dublicate.success) {
                return validate_dublicate;
            }

            //Обозначение модели Корпус поглощающего аппарата
            if(isEmptyString(special_params.absorbing_model)){
                return badResp("Поле \"Обозначение модели корпус поглощающего аппарата\" пустое, проверьте параметр \"absorbing_model\"");
            }
            var dictionary_absorbing_device_body_models = db.findbyparams("dictionary_absorbing_device_body_models", {
                recname: special_params.absorbing_model
            })
            if(isEmptyOrNullArray(dictionary_absorbing_device_body_models)){
                return badResp("Обозначение модели корпус поглощающего аппарата не найдено в системе, проверьте параметр \"absorbing_model\"");
            }
            special_params.absorbing_model = dictionary_absorbing_device_body_models[0].recid;

            break;
        //Ось черновая
        case keyElementCodes.rough_axis_id:
           /*  //Сведения об изготовителе заготовки
           if(isEmptyString(special_params.billet_manufacturer_info)){
            var manufacturer_member = db.findbyrecid("reestr_members", object.common_params.manufacturer_details);
            if(!isNullObject(manufacturer_number)){
                special_params.billet_manufacturer_info = manufacturer_member.fullname;
            }
            else{
                return badResp("Не удалось заполнить поле \"Сведения об изготовителе заготовки\"");
            }
            } */
            //Сведения об изготовителе заготовки
            if(!isEmptyString(special_params.billet_manufacturer_info)){
                var dictionary_billet_manufacturer_details_fields = db.findbyparams("dictionary_billet_manufacturer_details", {
                    billet_manufacturer_name: special_params.billet_manufacturer_info,
                    key_element_code: keyElementCodes.rough_axis_id
                })
                if(!isEmptyOrNullArray(dictionary_billet_manufacturer_details_fields)){
                    special_params.billet_manufacturer_info = dictionary_billet_manufacturer_details_fields[0].recid
                } else {
                    return badResp("Значение поля \"Сведения об изготовителе заготовки\" является недопустимым, проверьте параметр \"billet_manufacturer_info\"")
                }
            } else {
                return badResp("Поле \"Сведения об изготовителе заготовки\" пустое, проверьте параметр \"billet_manufacturer_info\"")
            }
            //Сведения о сертификате соответствия
            if(isEmptyString(special_params.certificate_number)){
                return badResp("Поле \"Сведения о сертификате соответствия\" пустое, проверьте параметр \"certificate_number\"")
            }
            var certificate_numbers = db.findbyparams("reestr_certificates", {
                registration_number: special_params.certificate_number,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(certificate_numbers)){
                return badResp("Сведения о сертификате соответствия не найдены в системе, проверьте параметр \"Сведения о сертификате соответствия\" ")
            }
            special_params.certificate_number = certificate_numbers[0].recid;
            //Условный номер для клеймения продукции вагоностроения
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "key_element_code": object.common_params.key_element_code
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;

            //Марка материала
            if(isEmptyString(special_params.steel_grade)){
                return badResp("Поле \"Марка материала\" пустое, проверьте параметр \"steel_grade\"");
            }
            var steel_grade_records = db.findbyparams("dictionary_steel_grade", {
                recname: special_params.steel_grade,
                key_element_code: object.common_params.key_element_code
            })
            if(isEmptyOrNullArray(steel_grade_records)){
                return badResp("Марка материала не найдена в системе, проверьте параметр \"steel_grade\"");
            }
            special_params.steel_grade = steel_grade_records[0].recid;

            //Номер изделия по системе нумерации предприятия-изготовителя
            if(isEmptyString(special_params.manufacturer_number)){
                return badResp("Поле \"Номер изделия по системе нумерации предприятия-изготовителя\" пустое, проверьте параметр \"manufacturer_number\"");
            }

            // Формирование параметров для проверки на дубликат записи с таким же номером изделия
            var params_for_validate = {
                manufacturer_details: object.common_params.manufacturer_details,
                key_element_code: object.common_params.key_element_code,
                manufacturer_number: special_params.manufacturer_number,
                date_manufacture: object.common_params.date_manufacture
            }
            //проверка на уникальность по дате, номеру, заводу, типу
            var validate_dublicate = validate_dublicate_elements(params_for_validate);
            if(!validate_dublicate.success) {
                return validate_dublicate;
            }
            //Номер плавки
            if(isEmptyString(special_params.melt_number)){
                return badResp("Поле \"Номер плавки\" пустое, проверьте параметр \"melt_number\"");
            }
            break;

        
    }
    return {
        success: true,
        data: special_params
    }
}

/**
 * Получение группы параметров для комплектации
 * @param {*} object 
 */
function get_key_element_params_for_complectation(object){
    var params_for_complectation = object.params_for_complectation;
    switch (object.common_params.key_element_code) {
        //Колесо
        case keyElementCodes.wheel_id:
            if(!isEmptyString(params_for_complectation.wheel_width)){
                params_for_complectation.wheel_width = params_for_complectation.wheel_width;
            }
            break;
        //Рама боковая
        case keyElementCodes.side_frame_id:
            if(!isEmptyString(params_for_complectation.complete_set_sender)){
                var dictionary_branding_codes = db.findbyparams("dictionary_branding_codes", {
                    code: params_for_complectation.complete_set_sender
                })
                if(isEmptyOrNullArray(dictionary_branding_codes)){
                    return badResp("Код клеймения не найден в справочнике кодов клеймения, проверьте поле \"complete_set_sender\"");
                }
                var dictionary_branding_code = dictionary_branding_codes[0];
                var members = db.findbyparams("reestr_members", {
                    branding_code: dictionary_branding_code.recid
                })
              
                if(isEmptyOrNullArray(members)){
                    return badResp("Участник не найден в реестре участников, проверьте поле \"complete_set_sender\"")
                }
                params_for_complectation.complete_set_sender = members[0].recid;
            }
            break;

        //Балка надрессорная
        case keyElementCodes.pressure_beam_id:
            if(!isEmptyString(params_for_complectation.complete_set_sender)){
                var dictionary_branding_codes = db.findbyparams("dictionary_branding_codes", {
                    code: params_for_complectation.complete_set_sender
                })
                if(isEmptyOrNullArray(dictionary_branding_codes)){
                    return badResp("Код клеймения не найден в справочнике кодов клеймения, проверьте поле \"complete_set_sender\"");
                }
                var dictionary_branding_code = dictionary_branding_codes[0];
                var members = db.findbyparams("reestr_members", {
                    branding_code: dictionary_branding_code.recid
                })
                if(isEmptyOrNullArray(members)){
                    return badResp("Участник не найден в реестре участников, проверьте поле \"complete_set_sender\"")
                }
                params_for_complectation.complete_set_sender = members[0].recid;
            }
            break;

        //Ось чистовая
        case keyElementCodes.clear_axis_id:
            //Предприятие отправившее комплектацию
            if(!isEmptyString(params_for_complectation.complete_set_sender)){
                var dictionary_branding_codes = db.findbyparams("dictionary_branding_codes", {
                    code: params_for_complectation.complete_set_sender
                })
                if(isEmptyOrNullArray(dictionary_branding_codes)){
                    return badResp("Код клеймения не найден в справочнике кодов клеймения, проверьте поле \"complete_set_sender\"");
                }
                var dictionary_branding_code = dictionary_branding_codes[0];
                var members = db.findbyparams("reestr_members", {
                    branding_code: dictionary_branding_code.recid
                })
                if(isEmptyOrNullArray(members)){
                    return badResp("Участник не найден в реестре участников, проверьте поле \"complete_set_sender\"")
                }
                params_for_complectation.complete_set_sender = members[0].recid;
            }else{
                return badResp("Поле \"Предприятие отправившее комплектацию\" пустое, проверьте параметр \"complete_set_sender\"")
            }

            //Предприятие полного освидетельствования
            if(!isEmptyString(params_for_complectation.depo_complete_survey)){
                var dictionary_branding_codes = db.findbyparams("dictionary_branding_codes", {
                    code: params_for_complectation.depo_complete_survey
                })
                if(isEmptyOrNullArray(dictionary_branding_codes)){
                    return badResp("Код клеймения не найден в справочнике кодов клеймения, проверьте поле \"depo_complete_survey\"");
                }
                var dictionary_branding_code = dictionary_branding_codes[0];
                var members = db.findbyparams("reestr_members", {
                    branding_code: dictionary_branding_code.recid
                })
                if(isEmptyOrNullArray(members)){
                    return badResp("Участник не найден в реестре участников, проверьте поле \"depo_complete_survey\"")
                }
                params_for_complectation.depo_complete_survey = members[0].recid;
            }else{
                return badResp("Поле \"Предприятие полного освидетельствования\" пустое, проверьте параметр \"depo_complete_survey\"")
            }

            //Дата освидетельствования
            if(!isEmptyString(params_for_complectation.date_install)){
                params_for_complectation.date_install = new Date(params_for_complectation.date_install);
            }else{
                return badResp("Поле \"Дата освидетельствования\" пустое, проверьте параметр \"date_install\"")
            }
            break;
        
    }
    return {
        success: true,
        data: params_for_complectation
    }
}

/**
 * Получение идентификаторов сущностей в БД по данным в структуре special_params
 * @param {*} object 
 */
function get_node_special_params_ids(object){
    var special_params = object.special_params;
    switch (object.common_params.ke_node_type) {
        //Воздухораспределитель
        case "aa12b486-85f2-416f-b299-e76e07174934":
            break;
        //Хомут в сборе в поглощающим аппаратом
        case "5db9db1f-e0cb-41fc-80ec-52cb1141ea51":
            break;
        //Скользун
        case "a70bf64c-215b-4d42-9c8e-f8ab4ac9f357":
            //Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "ke_node_type": object.common_params.ke_node_type
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;
            break;
        //Комплект пружин    
        case "5fe8c6fd-fd66-49da-92d3-222b1b3a1243":
            break;
        //Передача тормозная рычажная
        case "b817ce27-bd7b-4151-8de6-5036a203994e":
            break;
        //Колесная пара
        case "a3afe986-102a-4a10-aafe-5407134f7c15":
           // Технические условия
           if (!isEmptyString(special_params.technical_specifications)){
            var technical_conditions_fields = db.findbyparams("dictionary_technical_conditions", {
                recname: special_params.technical_specifications
            })
            if(!isEmptyOrNullArray(technical_conditions_fields)){

                //Проверка что поле "Технические условия" может вычислиться 
                var documentation_record = db.findbyrecid("reestr_documentation", object.common_params.documentation_number);
                if(isNullObject(documentation_record)){
                    return badResp("Не удалось получить значение поля \"Технические условия\", не получена информация о документации")
                }
                
                if(documentation_record.technical_conditions != technical_conditions_fields[0].recid){
                    return badResp("Значение поля \"Технические условия\" не заполнено в Реестре конструкторской и эксплуатационной документации")
                }

            } else {
                return badResp("Значение поля \"Технические условия\" является недопустимым, проверьте параметр \"technical_specifications\"")
            }
        } else {
            return badResp("Поле \"Технические условия\" пустое, проверьте параметр \"technical_specifications\"")
        }
            //Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "ke_node_type": object.common_params.ke_node_type
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;

            //Код государства собственника детали
            if(isEmptyString(special_params.administration_code)){
                return badResp("Поле \"Код государства собственника детали\" пустое, проверьте параметр \"administration_code\"");
            }
            var administration_code_records = db.findbyparams("dictionary_administration_codes", {
                recname: special_params.administration_code
            });
            if(isEmptyOrNullArray(administration_code_records)){
                return badResp("Код государства собственника детали не найден в системе, проверьте параметр \"administration_code\"");
            }
            special_params.administration_code = administration_code_records[0].recid;

            //Максимальная статическая осевая нагрузка
            if(isEmptyString(special_params.max_static_axial_load)){
                return badResp("Поле \"Максимальная расчетная статическая осевая нагрузка\" пустое, проверьте поле \"max_static_axial_load\"");
            }
            break;
        //Тележка
        case "cbb9d8cb-89ef-4b99-be77-a7d6e57e388e":
            //Проверка что поле "Технические условия" может вычислиться 
            var documentation_record = db.findbyrecid("reestr_documentation", object.common_params.documentation_number);
            if(isNullObject(documentation_record)){
                return badResp("Не удалось получить значение поля \"Технические условия\", не получена информация о документации")
            }
            var technical_conditions = db.findbyrecid("dictionary_technical_conditions", documentation_record.technical_conditions);
            if(isNullObject(technical_conditions)){
                return badResp("Не удалось получить запись из справочника технических условий")
            }
            //Сведения о сертификате соответствия
            if(isEmptyString(special_params.certificate_number)){
                return badResp("Поле \"Сведения о сертификате соответствия\" пустое, проверьте параметр \"certificate_number\"")
            }
            var certificate_numbers = db.findbyparams("reestr_certificates", {
                registration_number: special_params.certificate_number,
                ke_node_type: object.common_params.ke_node_type
            })
            if(isEmptyOrNullArray(certificate_numbers)){
                return badResp("Сведения о сертификате соответствия не найдены в системе, проверьте параметр \"Сведения о сертификате соответствия\" ")
            }
            special_params.certificate_number = certificate_numbers[0].recid;

            //Срок службы
            if(isEmptyString(special_params.life_time)){
                return badResp("Поле \"Срок службы\" пустое, проверьте параметр \"life_time\"")
            }

            //Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "ke_node_type": object.common_params.ke_node_type
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;

            //Номер изделия по системе нумерации предприятия-изготовителя
            if(isEmptyString(special_params.manufacturer_number)){
                return badResp("Поле \"Номер изделия по системе нумерации предприятия-изготовителя\" пустое, проверьте поле \"manufacturer_number\"");
            }

            // Формирование параметров для проверки на дубликат записи с таким же номером изделия
            var params_for_validate = {
                manufacturer_details: object.common_params.manufacturer_details,
                ke_node_type: object.common_params.ke_node_type,
                manufacturer_number: special_params.manufacturer_number,
                formation_date: object.common_params.formation_date
            }

            //проверка на уникальность по дате, номеру, заводу, типу
            var validate_dublicate = validate_dublicate_nodes(params_for_validate);
            if(!validate_dublicate.success) {
                return validate_dublicate;
            }

            //Код государства собственника детали
            if(isEmptyString(special_params.administration_code)){
                return badResp("Поле \"Код государства собственника детали\" пустое, проверьте параметр \"administration_code\"");
            }
            var administration_code_records = db.findbyparams("dictionary_administration_codes", {
                recname: special_params.administration_code
            });
            if(isEmptyOrNullArray(administration_code_records)){
                return badResp("Код государства собственника детали не найден в системе, проверьте параметр \"administration_code\"");
            }
            special_params.administration_code = administration_code_records[0].recid;

            //Обозначение модели тележки
            if(isEmptyString(special_params.truck_model)){
                return badResp("Поле \"Обозначение модели тележки\" пустое, проверьте параметр \"truck_model\"");
            }
            var dictionary_truck_models = db.findbyparams("dictionary_truck_models", {
                recname: special_params.truck_model
            });
            if(isEmptyOrNullArray(dictionary_truck_models)){
                return badResp("Обозначение модели тележки не найдено в системе, проверьте параметр \"truck_model\"");
            }
            special_params.truck_model = dictionary_truck_models[0].recid;

            //Тип тележки
            if(isEmptyString(special_params.truck_type)){
                return badResp("Поле \"Тип тележки\" пустое, проверьте параметр \"truck_type\"");
            }
            var dictionary_type_carts = db.findbyparams("dictionary_type_cart", {
                recname: special_params.truck_type
            })
            if(isEmptyOrNullArray(dictionary_type_carts)){
                return badResp("Тип тележки не найден в системе, проверьте параметр \"truck_type\"");
            }
            special_params.truck_type = dictionary_type_carts[0].recid;

            //Максимальная расчетная статическая осевая нагрузка
            if(isEmptyString(special_params.max_static_axial_load)){
                return badResp("Поле \"Максимальная расчетная статическая осевая нагрузка\" пустое, проверьте параметр \"max_static_axial_load\"")
            }
            break;
        //Рама боковая
        case "22ca1065-868e-4726-8f52-b6a5fdb8dfdc":
            break;
        //Балка надрессорная
        case "c8c2ab90-8d32-41fc-8a4d-a969d13c9f04":
            break;
        //Автосцепка СА-3
        case "ae11ae44-1c69-49e0-83a1-4122bb2d80ae":
            // Технические условия
            if (!isEmptyString(special_params.technical_specifications)){
                var technical_conditions_fields = db.findbyparams("dictionary_technical_conditions", {
                    recname: special_params.technical_specifications
                })
                if(!isEmptyOrNullArray(technical_conditions_fields)){

                    //Проверка что поле "Технические условия" может вычислиться 
                    var documentation_record = db.findbyrecid("reestr_documentation", object.common_params.documentation_number);
                    if(isNullObject(documentation_record)){
                        return badResp("Не удалось получить значение поля \"Технические условия\", не получена информация о документации")
                    }
                    
                    if(documentation_record.technical_conditions != technical_conditions_fields[0].recid){
                        return badResp("Значение поля \"Технические условия\" не заполнено в Реестре конструкторской и эксплуатационной документации")
                    }

                } else {
                    return badResp("Значение поля \"Технические условия\" является недопустимым, проверьте параметр \"technical_specifications\"")
                }
            } else {
                return badResp("Поле \"Технические условия\" пустое, проверьте параметр \"technical_specifications\"")
            }
            //Сведения о сертификате соответствия
            if(isEmptyString(special_params.certificate_number)){
                return badResp("Поле \"Сведения о сертификате соответствия\" пустое, проверьте параметр \"certificate_number\"")
            }
            var certificate_numbers = db.findbyparams("reestr_certificates", {
                registration_number: special_params.certificate_number,
                ke_node_type: object.common_params.ke_node_type
            })
            if(isEmptyOrNullArray(certificate_numbers)){
                return badResp("Сведения о сертификате соответствия не найдены в системе, проверьте параметр \"Сведения о сертификате соответствия\" ")
            }
            special_params.certificate_number = certificate_numbers[0].recid;

            //Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "ke_node_type": object.common_params.ke_node_type
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;

            //Индивидуальные особенности
            if(isEmptyString(special_params.individual_features)){
                return badResp("Поле \"Индивидуальные особенности\" пустое, проверьте параметр \"individual_features\"");
            }

            //Номер изделия по системе нумерации предприятия-изготовителя
            if(isEmptyString(special_params.manufacturer_number)){
                return badResp("Поле \"Номер изделия по системе нумерации предприятия-изготовителя\" пустое, проверьте поле \"manufacturer_number\"");
            }

            // Формирование параметров для проверки на дубликат записи с таким же номером изделия
            var params_for_validate = {
                manufacturer_details: object.common_params.manufacturer_details,
                ke_node_type: object.common_params.ke_node_type,
                manufacturer_number: special_params.manufacturer_number,
                formation_date: object.common_params.formation_date
            }

            //проверка на уникальность по дате, номеру, заводу, типу
            var validate_dublicate = validate_dublicate_nodes(params_for_validate);
            if(!validate_dublicate.success) {
                return validate_dublicate;
            }

            //Обозначение модели автосцепки
            if(isEmptyString(special_params.autocoupler_model)){
                return badResp("Поле \"Обозначение модели автосцепки\" пустое, проверьте параметр \"autocoupler_model\"");
            }
            var dictionary_couplings_models = db.findbyparams("dictionary_couplings_models", {
                coupling_name: special_params.autocoupler_model
            })
            if(isEmptyOrNullArray(dictionary_couplings_models)){
                return badResp("Обозначение модели автосцепки не найдено в системе, проверьте параметр \"autocoupler_model\"");
            }
            special_params.autocoupler_model = dictionary_couplings_models[0].recid;
            break;
        //Колесная пара без буксовых узлов
        case "00b0b326-a67a-4ce2-95af-376fcc9d8355":
           // Технические условия
           if (!isEmptyString(special_params.technical_specifications)){
            var technical_conditions_fields = db.findbyparams("dictionary_technical_conditions", {
                recname: special_params.technical_specifications
            })
            if(!isEmptyOrNullArray(technical_conditions_fields)){

                //Проверка что поле "Технические условия" может вычислиться 
                var documentation_record = db.findbyrecid("reestr_documentation", object.common_params.documentation_number);
                if(isNullObject(documentation_record)){
                    return badResp("Не удалось получить значение поля \"Технические условия\", не получена информация о документации")
                }
                
                if(documentation_record.technical_conditions != technical_conditions_fields[0].recid){
                    return badResp("Значение поля \"Технические условия\" не заполнено в Реестре конструкторской и эксплуатационной документации")
                }

            } else {
                return badResp("Значение поля \"Технические условия\" является недопустимым, проверьте параметр \"technical_specifications\"")
            }
        } else {
            return badResp("Поле \"Технические условия\" пустое, проверьте параметр \"technical_specifications\"")
        }
            //Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "ke_node_type": object.common_params.ke_node_type
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;

            //Сведения о сертификате соответствия
            if(isEmptyString(special_params.certificate_number)){
                return badResp("Поле \"Сведения о сертификате соответствия\" пустое, проверьте параметр \"certificate_number\"")
            }
            var certificate_numbers = db.findbyparams("reestr_certificates", {
                registration_number: special_params.certificate_number,
                ke_node_type: object.common_params.ke_node_type
            })
            if(isEmptyOrNullArray(certificate_numbers)){
                return badResp("Сведения о сертификате соответствия не найдены в системе, проверьте параметр \"Сведения о сертификате соответствия\" ")
            }
            special_params.certificate_number = certificate_numbers[0].recid;
            break;
        //Триангель
        case "c790c624-b93e-498b-97ba-0fb47f8b4b52":
            //Сведения о сертификате соответствия
            if(isEmptyString(special_params.certificate_number)){
                return badResp("Поле \"Сведения о сертификате соответствия\" пустое, проверьте параметр \"certificate_number\"")
            }
            var certificate_numbers = db.findbyparams("reestr_certificates", {
                registration_number: special_params.certificate_number,
                ke_node_type: object.common_params.ke_node_type
            })
            if(isEmptyOrNullArray(certificate_numbers)){
                return badResp("Сведения о сертификате соответствия не найдены в системе, проверьте параметр \"Сведения о сертификате соответствия\" ")
            }
            special_params.certificate_number = certificate_numbers[0].recid;

            //Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
            if(isEmptyString(special_params.ke_manufacturer)){
                return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
            }
            var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                code: special_params.ke_manufacturer
            })
            if(isEmptyOrNullArray(ke_manufacturer_records)){
                return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
            }
            special_params.ke_manufacturer = ke_manufacturer_records[0].recid;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            var dictionary_branding_code_certificate_numbers_params = {
                "branding_code": ke_manufacturer_records[0].recid,
                "ke_node_type": object.common_params.ke_node_type
            };
            var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
            
            if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
            }
            special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;

            //Номер изделия по системе нумерации предприятия-изготовителя
            if(isEmptyString(special_params.manufacturer_number)){
                return badResp("Поле \"Номер изделия по системе нумерации предприятия-изготовителя\" пустое, проверьте поле \"manufacturer_number\"");
            }

            // Формирование параметров для проверки на дубликат записи с таким же номером изделия
            var params_for_validate = {
                manufacturer_details: object.common_params.manufacturer_details,
                ke_node_type: object.common_params.ke_node_type,
                manufacturer_number: special_params.manufacturer_number,
                formation_date: object.common_params.formation_date
            }

            //проверка на уникальность по дате, номеру, заводу, типу
            var validate_dublicate = validate_dublicate_nodes(params_for_validate);
            if(!validate_dublicate.success) {
                return validate_dublicate;
            }
            break;
        //Котел вагона-цистерны
        case "79ddf686-f26f-4567-97ac-cb18eadd83e9":
           // Технические условия
           if (!isEmptyString(special_params.technical_specifications)){
            var technical_conditions_fields = db.findbyparams("dictionary_technical_conditions", {
                recname: special_params.technical_specifications
            })
            if(!isEmptyOrNullArray(technical_conditions_fields)){

                //Проверка что поле "Технические условия" может вычислиться 
                var documentation_record = db.findbyrecid("reestr_documentation", object.common_params.documentation_number);
                if(isNullObject(documentation_record)){
                    return badResp("Не удалось получить значение поля \"Технические условия\", не получена информация о документации")
                }
                
                if(documentation_record.technical_conditions != technical_conditions_fields[0].recid){
                    return badResp("Значение поля \"Технические условия\" не заполнено в Реестре конструкторской и эксплуатационной документации")
                }

            } else {
                return badResp("Значение поля \"Технические условия\" является недопустимым, проверьте параметр \"technical_specifications\"")
            }
        } else {
            return badResp("Поле \"Технические условия\" пустое, проверьте параметр \"technical_specifications\"")
        }
            //Сведения о сертификате соответствия
            if(isEmptyString(special_params.certificate_number)){
                return badResp("Поле \"Сведения о сертификате соответствия\" пустое, проверьте параметр \"certificate_number\"")
            }
            var certificate_numbers = db.findbyparams("reestr_certificates", {
                registration_number: special_params.certificate_number,
                ke_node_type: object.common_params.ke_node_type
            })
            if(isEmptyOrNullArray(certificate_numbers)){
                return badResp("Сведения о сертификате соответствия не найдены в системе, проверьте параметр \"Сведения о сертификате соответствия\" ")
            }
            special_params.certificate_number = certificate_numbers[0].recid;

            //Срок службы
            if(isEmptyString(special_params.life_time)){
                return badResp("Поле \"Срок службы\" пустое, проверьте параметр \"life_time\"")
            }

            //Номер изделия по системе нумерации предприятия-изготовителя
            if(isEmptyString(special_params.manufacturer_number)){
                return badResp("Поле \"Номер изделия по системе нумерации предприятия-изготовителя\" пустое, проверьте поле \"manufacturer_number\"");
            }

            // Формирование параметров для проверки на дубликат записи с таким же номером изделия
            var params_for_validate = {
                manufacturer_details: object.common_params.manufacturer_details,
                ke_node_type: object.common_params.ke_node_type,
                manufacturer_number: special_params.manufacturer_number,
                formation_date: object.common_params.formation_date
            }

            //проверка на уникальность по дате, номеру, заводу, типу
            var validate_dublicate = validate_dublicate_nodes(params_for_validate);
            if(!validate_dublicate.success) {
                return validate_dublicate;
            }

            //Марка материала
            if(isEmptyString(special_params.steel_grade)){
                return badResp("Поле \"Марка материала\" пустое, проверьте параметр \"steel_grade\"");
            }
            var dictionary_steel_grade = db.findbyparams("dictionary_steel_grade", {
                recname: special_params.steel_grade,
                ke_node_type: object.common_params.ke_node_type
            })
            if(isEmptyOrNullArray(dictionary_steel_grade)){
                return badResp("Марка материала не найдена в системе, проверьте параметр \"steel_grade\"")
            }
            special_params.steel_grade = dictionary_steel_grade[0].recid;

            //Объем кузова (котла)
            if(isEmptyString(special_params.carcass_volume)){
                return badResp("Поле \"Объем кузова (котла)\" пустое, проверьте параметр \"carcass_volume\"");
            }
            //Проверка на число
            special_params.carcass_volume = special_params.carcass_volume.replace(",", "\.");
            if(isNaN(special_params.carcass_volume)){
                return badResp("Поле \"Объем кузова (котла)\" не число, проверьте параметр \"carcass_volume\"");
            }
            var carcass_volume_parsed = parseFloat(special_params.carcass_volume, 10);
            if(carcass_volume_parsed < 0){
                return badResp("Поле \"Объем кузова (котла)\" отрицательно, проверьте параметр \"carcass_volume\"");
            }

            //Рабочее (избыточное) давление при перевозке
            if(isEmptyString(special_params.operating_pressure_transportation)){
                return badResp("Поле \"Рабочее (избыточное) давление при перевозке\" пустое, проверьте параметр \"operating_pressure_transportation\"");
            }
            //Проверка на число
            special_params.operating_pressure_transportation = special_params.operating_pressure_transportation.replace(",", "\.");
            if(isNaN(special_params.operating_pressure_transportation)){
                return badResp("Поле \"Рабочее (избыточное) давление при перевозке\" не число, проверьте параметр \"operating_pressure_transportation\"");
            }
            var operating_pressure_transportation_parsed = parseFloat(special_params.operating_pressure_transportation, 10);
            if(operating_pressure_transportation_parsed < 0){
                return badResp("Поле \"Рабочее (избыточное) давление при перевозке\" отрицательно, проверьте параметр \"operating_pressure_transportation\"");
            }

            //Рабочее (избыточное) давление при разгрузке
            if(isEmptyString(special_params.operation_pressure_unloading)){
                return badResp("Поле \"Рабочее (избыточное) давление при разгрузке\" пустое, проверьте параметр \"operating_pressure_unloading\"");
            }
            //Проверка на число
            special_params.operation_pressure_unloading = special_params.operation_pressure_unloading.replace(",", "\.");
            if(isNaN(special_params.operation_pressure_unloading)){
                return badResp("Поле \"Рабочее (избыточное) давление при разгрузке\" не число, проверьте параметр \"operating_pressure_unloading\"");
            }
            var operating_pressure_unloading_parsed = parseFloat(special_params.operation_pressure_unloading, 10);
            if(operating_pressure_unloading_parsed < 0){
                return badResp("Поле \"Рабочее (избыточное) давление при разгрузке\" отрицательно, проверьте параметр \"operating_pressure_unloading\"");
            }

            //Расчетное давление
            if(isEmptyString(special_params.design_pressure)){
                return badResp("Поле \"Расчетное давление\" пустое, проверьте параметр \"design_pressure\"");
            }
            //Проверка на число
            special_params.design_pressure = special_params.design_pressure.replace(",", "\.");
            if(isNaN(special_params.design_pressure)){
                return badResp("Поле \"Расчетное давление\" не число, проверьте параметр \"design_pressure\"");
            }
            var design_pressure_parsed = parseFloat(special_params.design_pressure, 10);
            if(design_pressure_parsed < 0){
                return badResp("Поле \"Расчетное давление\" отрицательно, проверьте параметр \"design_pressure\"");
            }

            //Испытательное давление гидравлическое
            if(isEmptyString(special_params.hydraulic_test_pressure)){
                return badResp("Поле \"Испытательное давление гидравлическое\" пустое, проверьте параметр \"hydraulic_test_pressure\"");
            }
            //Проверка на число
            special_params.hydraulic_test_pressure = special_params.hydraulic_test_pressure.replace(",", "\.");
            if(isNaN(special_params.hydraulic_test_pressure)){
                return badResp("Поле \"Испытательное давление гидравлическое\" не число, проверьте параметр \"hydraulic_test_pressure\"");
            }
            var hydraulic_test_pressure_parsed = parseFloat(special_params.hydraulic_test_pressure, 10);
            if(hydraulic_test_pressure_parsed < 0){
                return badResp("Поле \"Испытательное давление гидравлическое\" отрицательно, проверьте параметр \"hydraulic_test_pressure\"");
            }
            break;

            //Воздухораспределитель в сборе
        case "a6180bfa-368d-4eff-97f2-c4f6c2612bc6":
            // Технические условия
            if (!isEmptyString(special_params.technical_specifications)){
                var technical_conditions_fields = db.findbyparams("dictionary_technical_conditions", {
                    recname: special_params.technical_specifications
                })
                if(!isEmptyOrNullArray(technical_conditions_fields)){

                    //Проверка что поле "Технические условия" может вычислиться 
                    var documentation_record = db.findbyrecid("reestr_documentation", object.common_params.documentation_number);
                    if(isNullObject(documentation_record)){
                        return badResp("Не удалось получить значение поля \"Технические условия\", не получена информация о документации")
                    }
                    
                    if(documentation_record.technical_conditions != technical_conditions_fields[0].recid){
                        return badResp("Значение поля \"Технические условия\" не заполнено в Реестре конструкторской и эксплуатационной документации")
                    }

                } else {
                    return badResp("Значение поля \"Технические условия\" является недопустимым, проверьте параметр \"technical_specifications\"")
                }
            } else {
                return badResp("Поле \"Технические условия\" пустое, проверьте параметр \"technical_specifications\"")
            }
          //Сведения о сертификате соответствия
          if(isEmptyString(special_params.certificate_number)){
            return badResp("Поле \"Сведения о сертификате соответствия\" пустое, проверьте параметр \"certificate_number\"")
        }
        var certificate_numbers = db.findbyparams("reestr_certificates", {
            registration_number: special_params.certificate_number,
            ke_node_type: object.common_params.ke_node_type
        })
        if(isEmptyOrNullArray(certificate_numbers)){
            return badResp("Сведения о сертификате соответствия не найдены в системе, проверьте параметр \"Сведения о сертификате соответствия\" ")
        }
        special_params.certificate_number = certificate_numbers[0].recid;

        //Срок службы
        if(isEmptyString(special_params.life_time)){
            return badResp("Поле \"Срок службы\" пустое, проверьте параметр \"life_time\"")
        }
             //Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
             if(isEmptyString(special_params.ke_manufacturer)){
                 return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
             }
             var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                 code: special_params.ke_manufacturer
             })
             if(isEmptyOrNullArray(ke_manufacturer_records)){
                 return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
             }
             special_params.ke_manufacturer = ke_manufacturer_records[0].recid;
 
             //Регистрационный номер свидетельства о присвоении номера для клеймения
             var dictionary_branding_code_certificate_numbers_params = {
                 "branding_code": ke_manufacturer_records[0].recid,
                 "ke_node_type": object.common_params.ke_node_type
             };
             var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
             
             if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                 return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
             }
             special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;
 
            //Номер изделия по системе нумерации предприятия-изготовителя
            if(isEmptyString(special_params.manufacturer_number)){
                return badResp("Поле \"Номер изделия по системе нумерации предприятия-изготовителя\" пустое, проверьте поле \"manufacturer_number\"");
            }
            // Формирование параметров для проверки на дубликат записи с таким же номером изделия
            var params_for_validate = {
                manufacturer_details: object.common_params.manufacturer_details,
                ke_node_type: object.common_params.ke_node_type,
                manufacturer_number: special_params.manufacturer_number,
                formation_date: object.common_params.formation_date
            }

            //проверка на уникальность по дате, номеру, заводу, типу
            var validate_dublicate = validate_dublicate_nodes(params_for_validate);
            if(!validate_dublicate.success) {
                return validate_dublicate;
            }
             //Обозначение модели Воздухораспределитель в сборе
             if(isEmptyString(special_params.coupling_model)){
                return badResp("Поле \"Обозначение модели Воздухораспределитель в сборе\" пустое, проверьте параметр \"coupling_model\"");
            }
            var dictionary_air_distributor_models = db.findbyparams("dictionary_air_distributor_models", {
                recname: special_params.coupling_model
            })
            if(isEmptyOrNullArray(dictionary_air_distributor_models)){
                return badResp("Обозначение модели Воздухораспределитель в сборе не найдено в системе, проверьте параметр \"coupling_model\"");
            }
            special_params.coupling_model = dictionary_air_distributor_models[0].recid;
             break;

             //Поглощающий аппарат
             case "700b86ca-5b88-44d6-a5d3-c2c4e76d96f8":
                // Технические условия
            if (!isEmptyString(special_params.technical_specifications)){
                var technical_conditions_fields = db.findbyparams("dictionary_technical_conditions", {
                    recname: special_params.technical_specifications
                })
                if(!isEmptyOrNullArray(technical_conditions_fields)){

                    //Проверка что поле "Технические условия" может вычислиться 
                    var documentation_record = db.findbyrecid("reestr_documentation", object.common_params.documentation_number);
                    if(isNullObject(documentation_record)){
                        return badResp("Не удалось получить значение поля \"Технические условия\", не получена информация о документации")
                    }
                    
                    if(documentation_record.technical_conditions != technical_conditions_fields[0].recid){
                        return badResp("Значение поля \"Технические условия\" не заполнено в Реестре конструкторской и эксплуатационной документации")
                    }

                } else {
                    return badResp("Значение поля \"Технические условия\" является недопустимым, проверьте параметр \"technical_specifications\"")
                }
            } else {
                return badResp("Поле \"Технические условия\" пустое, проверьте параметр \"technical_specifications\"")
            }
              //Сведения о сертификате соответствия
              if(isEmptyString(special_params.certificate_number)){
                return badResp("Поле \"Сведения о сертификате соответствия\" пустое, проверьте параметр \"certificate_number\"")
            }
            var certificate_numbers = db.findbyparams("reestr_certificates", {
                registration_number: special_params.certificate_number,
                ke_node_type: object.common_params.ke_node_type
            })
            if(isEmptyOrNullArray(certificate_numbers)){
                return badResp("Сведения о сертификате соответствия не найдены в системе, проверьте параметр \"Сведения о сертификате соответствия\" ")
            }
            special_params.certificate_number = certificate_numbers[0].recid;
    
            //Срок службы
            if(isEmptyString(special_params.life_time)){
                return badResp("Поле \"Срок службы\" пустое, проверьте параметр \"life_time\"")
            }
                 //Условный номер для клеймения продукции вагоностроения/Сокращенное наименование предприятия-изготовителя
                 if(isEmptyString(special_params.ke_manufacturer)){
                     return badResp("Поле \"Условный номер для клеймения продукции вагоностроения\" не может быть пустым, проверьте параметр \"ke_manufacturer\"");
                 }
                 var ke_manufacturer_records = db.findbyparams("dictionary_branding_codes", {
                     code: special_params.ke_manufacturer
                 })
                 if(isEmptyOrNullArray(ke_manufacturer_records)){
                     return badResp("Условный номер для клеймения продукции вагоностроения\" не найден в системе, проверьте параметр \"ke_manufacturer\"")
                 }
                 special_params.ke_manufacturer = ke_manufacturer_records[0].recid;
     
                 //Регистрационный номер свидетельства о присвоении номера для клеймения
                 var dictionary_branding_code_certificate_numbers_params = {
                     "branding_code": ke_manufacturer_records[0].recid,
                     "ke_node_type": object.common_params.ke_node_type
                 };
                 var branding_code_certificate_numbers = db.findbyparams("dictionary_branding_code_certificate_numbers", dictionary_branding_code_certificate_numbers_params);
                 
                 if(isEmptyOrNullArray(branding_code_certificate_numbers)){
                     return badResp("Регистрационный номер свидетельства о присвоении номера для клеймения не найден в системе, проверьте поле \"ke_manufacturer\"")
                 }
                 special_params.branding_code_certificate_number = branding_code_certificate_numbers[0].recname;
     
                //Номер изделия по системе нумерации предприятия-изготовителя
                if(isEmptyString(special_params.manufacturer_number)){
                    return badResp("Поле \"Номер изделия по системе нумерации предприятия-изготовителя\" пустое, проверьте поле \"manufacturer_number\"");
                }
                // Формирование параметров для проверки на дубликат записи с таким же номером изделия
                var params_for_validate = {
                    manufacturer_details: object.common_params.manufacturer_details,
                    ke_node_type: object.common_params.ke_node_type,
                    manufacturer_number: special_params.manufacturer_number,
                    formation_date: object.common_params.formation_date
                }

                //проверка на уникальность по дате, номеру, заводу, типу
                var validate_dublicate = validate_dublicate_nodes(params_for_validate);
                if(!validate_dublicate.success) {
                    return validate_dublicate;
                }
                 //Обозначение модели Поглощающий аппарат
                 if(isEmptyString(special_params.absorbing_model)){
                    return badResp("Поле \"Обозначение модели Поглощающий аппарат\" пустое, проверьте параметр \"absorbing_model\"");
                }
                var dictionary_absorbing_device_body_models = db.findbyparams("dictionary_absorbing_device_body_models", {
                    recname: special_params.absorbing_model
                })
                if(isEmptyOrNullArray(dictionary_absorbing_device_body_models)){
                    return badResp("Обозначение модели Поглощающий аппарат не найдено в системе, проверьте параметр \"absorbing_model\"");
                }
                special_params.absorbing_model = dictionary_absorbing_device_body_models[0].recid;

                 //Класс Поглощающий аппарат
                 if(isEmptyString(special_params.absorbing_class)){
                    return badResp("Поле \"Класс поглощающего аппарата\" пустое, проверьте параметр \"absorbing_class\"");
                }
                var dictionary_class_absorbing_device = db.findbyparams("dictionary_class_absorbing_device", {
                    recname: special_params.absorbing_class
                })
                if(isEmptyOrNullArray(dictionary_class_absorbing_device)){
                    return badResp("Класс поглощающего аппарата не найдено в системе, проверьте параметр \"absorbing_class\"");
                }
                special_params.absorbing_class = dictionary_class_absorbing_device[0].recid;

                //Энергоемкость
                if(isEmptyString(special_params.energy_intensity)){
                    return badResp("Поле \"Энергоемкость\" пустое, проверьте поле \"energy_intensity\"");
                }
                 break;
    }
    return {
        success: true,
        data: special_params
    };
}

/**
 * Получение идентификаторов элементов и позиций в составе узла
 * @param {*} object 
 */
function get_node_composition(object){
    
    var node_composition = object.node_composition;

    //Проверка ключей в массиве
    for(var i = 0; i < node_composition.length; i++){
        var node_composition_item = node_composition[i];
        var keys = typeof node_composition_item !== "string" && Object.keys(node_composition_item);
        if(keys.indexOf("uin") == -1){
            return badResp("Ключ \"uin\" отсутсвует в позиции \"" + i + "\", проверьте массив \"node_composition\"")
        }

        if(keys.indexOf("position") == -1){
            return badResp("Ключ \"position\" отсутсвует в позиции \"" + i + "\", проверьте массив \"node_composition\"")
        }

        if(isEmptyString(node_composition_item.uin)){
            return badResp("Поле \"uin\" не может быть пустым, проверьте массив \"node_composition\", позиция \"" + i + "\"")
        }
    }
    // Проверка на состав СЕ по количеству
    var assembly_unit = {
        ke_node_type: object.common_params.ke_node_type,
        documentation_number: object.common_params.documentation_number
    }
	
	var all_key_elements_params = []; 
    for (var k = 0; k < node_composition.length; k++) {
        var node_composition_item = node_composition[k];
        var all_key_elements = db.findbyparams("reestr_key_elements", {
            numberke: node_composition_item.uin
        });
        all_key_elements_params.push({key_element_code: all_key_elements[0].key_element_code})
    }
    //Проверяем комплектацию СЕ
    var checkAssemblyUnitCompositionResult = checkAssemblyUnitComposition(all_key_elements_params, assembly_unit, true)
	if (!checkAssemblyUnitCompositionResult.success) {
		return badResp(checkAssemblyUnitCompositionResult.message)
	}

    var objects_to_install = [];

    var errors = [];
    //Получение объектов устанавливаемых элементов
    for(var i = 0; i < node_composition.length; i++ ){
        var node_composition_item = node_composition[i];
        var ke_numbers = db.findbyparams("ke_numbers", {
            recname: node_composition_item.uin
        })

        if(isEmptyOrNullArray(ke_numbers)){
            return badResp("Элемент с УИНом \"" + node_composition_item.uin + "\" не найден в системе, проверьте массив \"node_composition\", позиция \"" + i + "\"");
        }

        var ke_number = ke_numbers[0];
        //Поиск элемента в реестре СЧ
        var key_elements = db.findbyparams("reestr_key_elements", {
            ke_number: ke_number.recid
        })
        //Поиск элемента в реестре узлов
        var nodes = db.findbyparams("reestr_ke_nodes",{
            unique_number_relation: ke_number.recid
        });

        var object_to_install = {}; //Объект с инфой об устанавливаемом элементе
        if(isEmptyOrNullArray(key_elements) && isEmptyOrNullArray(nodes)){
            return badResp("По номеру \"" + node_composition_item.uin + "\" не найдено ни одного элемента, проверьте массив \"node_composition\", позиция \"" + i + "\"");
        }else if (!isEmptyOrNullArray(key_elements)){
            object_to_install.item = key_elements[0];
            object_to_install.is_key_element = true;
        }else if(!isEmptyOrNullArray(nodes)){
            object_to_install.item = nodes[0];
            object_to_install.is_key_element = false;
        }

        //Проверка, что устанавливаемый элемент учтен в росжелдоре
        if(object_to_install.is_key_element){
            if(object_to_install.item.is_registratred_in_rzd != true){
                errors.push(String().concat("составная часть с УИНом ", ke_number.recname, " не учтен в системе."));
            } 
        }else{
            if(object_to_install.item.is_registratred_in_rzd != true){
                errors.push(String().concat("Сборочная единица с УИНом ", ke_number.recname, " не учтена в системе."));
            }
        }
        
        //Получение идентификатора позиции в узле, если это СЧ
        if(object_to_install.is_key_element){
            //Скользун
            if(object.common_params.ke_node_type === "a70bf64c-215b-4d42-9c8e-f8ab4ac9f357"){
                if(object_to_install.item.key_element_code === keyElementCodes.slider_body_id){
                    node_composition_item.no_position = true;
                }
                if(object_to_install.item.key_element_code === keyElementCodes.slider_cap_id){
                    node_composition_item.no_position = true;
                }
               if(object_to_install.item.key_element_code === keyElementCodes.spring_slider_outside_id){
                    node_composition_item.no_position = true;
                } 
                if(object_to_install.item.key_element_code === keyElementCodes.spring_slider_inside_id){
                    node_composition_item.no_position = true;
                } 
            }
            //Колесная пара без буксовых узлов
            if(object.common_params.ke_node_type == "00b0b326-a67a-4ce2-95af-376fcc9d8355"){
                if(object_to_install.item.key_element_code == keyElementCodes.clear_axis_id){
                    node_composition_item.no_position = true;
                }
            }
            //Колесная пара
            if(object.common_params.ke_node_type === "a3afe986-102a-4a10-aafe-5407134f7c15"){
                if(object_to_install.item.key_element_code === keyElementCodes.clear_axis_id){
                    node_composition_item.no_position = true;
                }
            }
            //Тележка
            if(object.common_params.ke_node_type == "cbb9d8cb-89ef-4b99-be77-a7d6e57e388e"){
                if(object_to_install.item.key_element_code == keyElementCodes.saddle_bearing_id){
                    node_composition_item.no_position = true;
                }
            }
            //Рама боковая
            if(object.common_params.ke_node_type == "22ca1065-868e-4726-8f52-b6a5fdb8dfdc"){
                if(object_to_install.item.key_element_code == keyElementCodes.side_frame_id){
                    node_composition_item.no_position = true;
                }
            }
            //Балка надрессорная
            if(object.common_params.ke_node_type == "c8c2ab90-8d32-41fc-8a4d-a969d13c9f04"){
                if(object_to_install.item.key_element_code == keyElementCodes.pressure_beam_id || object.common_params.ke_node_type == keyElementCodes.saddle_ring_id){
                    node_composition_item.no_position = true;
                }
            }
            
            //Автосцепка СА-3
            if(object.common_params.ke_node_type === "ae11ae44-1c69-49e0-83a1-4122bb2d80ae"){
                if(object_to_install.item.key_element_code === keyElementCodes.lock_id){
                    node_composition_item.no_position = true;
                }
                if(object_to_install.item.key_element_code === keyElementCodes.auto_coupler_id){
                    node_composition_item.no_position = true;
                }
                if(object_to_install.item.key_element_code === keyElementCodes.elevator_roll_id){
                    node_composition_item.no_position = true;
                } 
            }

            //Поглощающий аппарат
            if(object.common_params.ke_node_type === "700b86ca-5b88-44d6-a5d3-c2c4e76d96f8"){
                if(object_to_install.item.key_element_code === keyElementCodes.absorbing_device_body_id){
                    node_composition_item.no_position = true;
                }
            }

            //Проверка указанной позиции во входящих данных и получение ее идентификатора
            if(!node_composition_item.no_position){
                if(isEmptyString(node_composition_item.position)){
                    return badResp("Для элемента \"" + node_composition_item.uin + "\" не указана позиция, проверьте массив \"node_composition\", позиция \"" + i + "\"");
                }

                //Если СЧ не в составе узла
                if(isEmptyString(object_to_install.item.ke_node)){
                    var dictionary_positions_on_node = db.findbyparams("dictionary_positions_on_node", {
                        node_type: object.common_params.ke_node_type,
                        recname: node_composition_item.position,
                        key_element_code: object_to_install.item.key_element_code
                    });
                    if(isEmptyOrNullArray(dictionary_positions_on_node)){
                        return badResp("Позиции в узле не найдены для элемента \"" + node_composition_item.uin + "\", проверьте массив \"node_composition\", позиция \"" + i + "\"")
                    }
                    object_to_install.position = dictionary_positions_on_node[0].recid;
                }else{
                    //Если СЧ в составе узла
                    var node = db.findbyrecid("reestr_ke_nodes", object_to_install.item.ke_node);
                    if(isNullObject(node)){
                        return badResp("Узел для элемента \"" + node_composition_item.uin + "\" не найден в системе, проверьте массив \"node_composition\", позиция \"" + i + "\"");
                    }

                    //Получение позиции в дочернем узле
                    var dictionary_positions_on_parent_node = db.findbyparams("dictionary_positions_on_parent_node", {
                        child_node_type: node.ke_node_type,
                        key_element_code: object_to_install.item.key_element_code,
                        parent_node_type: object.common_params.ke_node_type,
                        recname: node_composition_item.position
                    })
                    
                    

                    if(isEmptyOrNullArray(dictionary_positions_on_parent_node)){
                        return badResp("Позиция в дочернем узле для элемента \"" + node_composition_item.uin + "\" не найдена в системе, проверьте массив \"node_composition\", позиция \"" + i + "\"")
                    } 
                    
                    object_to_install.position = dictionary_positions_on_parent_node[0].recid; 

                }
            }else{
                object_to_install.no_position = true;
            }
        }
        //Получение идентификатора позиции в узле, если это узел
        else if(!object_to_install.is_key_element){
           
            var node = db.findbyrecid("reestr_ke_nodes", object_to_install.item.recid);
            
            if(isNullObject(node)){
                return badResp("Ошибка");
            }
            if(isEmptyString(node_composition_item.position)){
                return badResp("Позиция для элемента \"" + node_composition_item.uin + "\" пустая, проверьте массив \"node_composition\", позиция \"" + i + "\"")
            }
            //Получение позиции в узле
            var dictionary_node_positions = db.findbyparams("dictionary_node_positions", {
                recname: node_composition_item.position
            })
            if(isEmptyOrNullArray(dictionary_node_positions)){
                return badResp("Позиция в узле для элемента \"" + node_composition_item.uin + "\" не найдена в системе, проверьте массив \"node_composition\", позиция \"" + i + "\"")
            }
            var dictionary_node_position = dictionary_node_positions[0];
            if (isNotEmptyString(object_to_install.item.key_element_code)){

            //Получение позиции в дочернем узле
            var dictionary_positions_on_parent_node = db.findbyparams("dictionary_positions_on_parent_node", {
                child_node_type: node.ke_node_type,
                key_element_code: object_to_install.item.key_element_code,
                parent_node_type: object.common_params.ke_node_type,
                node_position: dictionary_node_position.recid
            })
            } else {
                var dictionary_positions_on_parent_node = db.findbyparams("dictionary_positions_on_parent_node", {
                    child_node_type: node.ke_node_type,
                   // key_element_code: object_to_install.item.key_element_code,
                    parent_node_type: object.common_params.ke_node_type,
                    node_position: dictionary_node_position.recid })
            }
            
            if(isEmptyOrNullArray(dictionary_positions_on_parent_node)){
                return badResp("Позиция в дочернем узле для элемента \"" + node_composition_item.uin + "\" не найдена в системе, проверьте массив \"node_composition\", позиция \"" + i + "\"")
            }
            object_to_install.position = dictionary_node_position.recid;
        }
        objects_to_install.push(object_to_install);
    }

    if(errors.length > 0){
        return showerrorsfromarray(errors);
    }

    var return_res = [];
    for (var i = 0; i < objects_to_install.length; i++){
        var return_obj = {};
        return_obj.item = objects_to_install[i].item.recid;
        return_obj.is_key_element = objects_to_install[i].is_key_element;
        if(objects_to_install[i].no_position){
            return_obj.no_position = true;
        }else{
            return_obj.no_position = false;
        }
        return_obj.position = objects_to_install[i].position;
        return_res.push(return_obj);
    }
    return {
        success: true,
        data: return_res
    };
}

/**
 * Создание паспорта СЧ
 * @param {*} object    Объект с параметрами СЧ
 */
function create_key_element_passport(object){

    //Получение шаблона для создания узла через метод assemblyunitscannumbers
    var node_patterns = db.findbyparams("reestr_parts_type", {
        key_element_code: object.common_params.key_element_code,
        documentation_number: object.common_params.documentation_number
    })

    if(isEmptyOrNullArray(node_patterns)){
        return badResp("Шаблон для СЧ не найден в системе");
    }
    var node_pattern = node_patterns[0];


    var reestr_key_elements_result = db.findbyparams("reestr_key_elements", {
        ke_number: object.common_params.ke_number
    })
    
    if(!isEmptyOrNullArray(reestr_key_elements_result)){
        return badResp("СЧ с заданным номером уже имеется в системе");
    }

    var ke_number = db.findbyrecid("ke_numbers", object.common_params.ke_number);
    if(isNullObject(ke_number)){
        return badResp("УИН не найден в системе");
    }

    //Создание параметров для метода scannumbers;
    var scannumbersparams = {
        reestrPartsType: node_pattern.recid,
        NumberKe: ke_number.recname
    }  
    var headers = {
        "Content-Type": "application/json"
    };
    var headers = addAuthHeader(headers);
    var url = String().concat(host, "/plugins/nbdlogicplugin/kescannumber");
    var res = fetch(url, {
        headers: headers,
        "body": JSON.stringify(scannumbersparams),
        "Method": "post"
    });
    var result_parse = JSON.parse(res.data);
   
    if (isEmptyString(res.data)){
        return res;
    } else {
        if (result_parse.success == false){
            return {
				success: false,
				message: result_parse.message,
				data: result_parse.message
			};
        }
    }
    // Получение recid записи СЧ
    var reestr_key_elements_fields = db.findbyparams("reestr_key_elements", {
        numberke: ke_number.recname
    })
    

    var key_element_object = db.findbyrecid("reestr_key_elements", reestr_key_elements_fields[0].recid);
    if(isNullObject(key_element_object)){
        return badResp("Запись не найдена в системе");
    }

    //Установка полей из группы общих параметров
    key_element_object.ke_number = object.common_params.ke_number;
    key_element_object.key_element_code = object.common_params.key_element_code;

    key_element_object.method_of_marking = object.common_params.method_of_marking;
    key_element_object.method_of_encoding = object.common_params.method_of_encoding;
    key_element_object.manufacturer_details = object.common_params.manufacturer_details;
    key_element_object.documentation_number = object.common_params.documentation_number;
    
    key_element_object.date_manufacture = new Date(object.common_params.date_manufacture);
    key_element_object.owner = ke_number.issuer;
    
    var special_params = object.special_params
    var params_for_complectation = object.params_for_complectation;
    var after_register_params = object.after_register_params;

    switch (object.common_params.key_element_code) {
        //Крышка люка полувагона
        case keyElementCodes.gondola_hatch_id:
            //Условный номер для клеймения продукции вагоностроения
            key_element_object.ke_manufacturer = special_params.ke_manufacturer
            //Регистрационный номер свидетельства о присвоении номера для клеймения
            key_element_object.branding_code_certificate_number = special_params.branding_code_certificate_number;

            //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

            // Свидетельство о приемке
            key_element_object.acceptance_certificate = after_register_params.acceptance_certificate;

            // Свидетельство об упаковывании
            key_element_object.packing_certificate = after_register_params.packing_certificate;
            
            break;
        //Упоры передний и задний объединенные
        case keyElementCodes.front_rear_detents_id:
            //Сведения о сертификате соответствия
            key_element_object.certificate_number = special_params.certificate_number;

            //Срок службы
            key_element_object.life_time = special_params.life_time;

            //Условный номер для клеймения продукции вагоностроения
            key_element_object.ke_manufacturer = special_params.ke_manufacturer;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            key_element_object.branding_code_certificate_number = special_params.branding_code_certificate_number;

            //Номер изделия по системе нумерации предприятия-изготовителя
            key_element_object.manufacturer_number = special_params.manufacturer_number;

            //Код государства собственника детали
            key_element_object.administration_code = special_params.administration_code;

            //Марка материала
            key_element_object.steel_grade = special_params.steel_grade;

            //Сведения об изготовителе заготовки
            key_element_object.billet_manufacturer_info = special_params.billet_manufacturer_info;

            //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

            // Свидетельство о приемке
            key_element_object.acceptance_certificate = after_register_params.acceptance_certificate;

            // Свидетельство об упаковывании
            key_element_object.packing_certificate = after_register_params.packing_certificate;
            break;
        //Вкладыш подпятника
        case keyElementCodes.saddle_bearing_id:
            //Условный номер для клеймения продукции вагоностроения
            key_element_object.ke_manufacturer = special_params.ke_manufacturer;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            key_element_object.branding_code_certificate_number = special_params.branding_code_certificate_number;

            //Марка материала
            key_element_object.steel_grade = special_params.steel_grade;

            //Сведения об изготовителе заготовки
            key_element_object.billet_manufacturer_info = special_params.billet_manufacturer_info;

            //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

            // Свидетельство о приемке
            key_element_object.acceptance_certificate = after_register_params.acceptance_certificate;

            // Свидетельство об упаковывании
            key_element_object.packing_certificate = after_register_params.packing_certificate;
            break;
        //Вставки в клиновые карманы
        case keyElementCodes.wedge_pockets_inserts_id:
            //Условный номер для клеймения продукции вагоностроения
            key_element_object.ke_manufacturer = special_params.ke_manufacturer;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            key_element_object.branding_code_certificate_number = special_params.branding_code_certificate_number;

            //Марка материала
            key_element_object.steel_grade = special_params.steel_grade;

            //Сведения об изготовителе заготовки
            key_element_object.billet_manufacturer_info = special_params.billet_manufacturer_info;

            //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

            // Свидетельство о приемке
            key_element_object.acceptance_certificate = after_register_params.acceptance_certificate;

            // Свидетельство об упаковывании
            key_element_object.packing_certificate = after_register_params.packing_certificate;

            break;
        //Кольцо в подпятник
        case keyElementCodes.saddle_ring_id:
            //Условный номер для клеймения продукции вагоностроения
            key_element_object.ke_manufacturer = special_params.ke_manufacturer;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            key_element_object.branding_code_certificate_number = special_params.branding_code_certificate_number;

            //Марка материала
            key_element_object.steel_grade = special_params.steel_grade;

            //Сведения об изготовителе заготовки
            key_element_object.billet_manufacturer_info = special_params.billet_manufacturer_info;

            //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

            // Свидетельство о приемке
            key_element_object.acceptance_certificate = after_register_params.acceptance_certificate;

            // Свидетельство об упаковывании
            key_element_object.packing_certificate = after_register_params.packing_certificate;
            break;
        //Пластины в клиновых карманах
        case keyElementCodes.wedge_pockets_id:
            //Условный номер для клеймения продукции вагоностроения
            key_element_object.ke_manufacturer = special_params.ke_manufacturer;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            key_element_object.branding_code_certificate_number = special_params.branding_code_certificate_number;
            
            //Марка материала
            key_element_object.steel_grade = special_params.steel_grade;

            //Сведения об изготовителе заготовки
            key_element_object.billet_manufacturer_info = special_params.billet_manufacturer_info;

            //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

            // Свидетельство о приемке
            key_element_object.acceptance_certificate = after_register_params.acceptance_certificate;

            // Свидетельство об упаковывании
            key_element_object.packing_certificate = after_register_params.packing_certificate;
            break;
        //Ось чистовая
        case keyElementCodes.clear_axis_id:
            //Сведения о сертификате соответствия
            key_element_object.certificate_number = special_params.certificate_number;
            //Условный номер для клеймения продукции вагоностроения
            key_element_object.ke_manufacturer = special_params.ke_manufacturer;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            key_element_object.branding_code_certificate_number = special_params.branding_code_certificate_number;

            //Год изготовления черновой оси
            key_element_object.rough_axis_manufacturing_date = special_params.rough_axis_manufacturing_date;
            
            //Номер черновой оси
            key_element_object.rough_axis_number = special_params.rough_axis_number;
            
            //Марка материала
            key_element_object.steel_grade = special_params.steel_grade;

            //Сведения об изготовителе заготовки
            key_element_object.billet_manufacturer_info = special_params.billet_manufacturer_info;

            //Параметры для комплектации
            if(!isNullObject(params_for_complectation)){
                //Предприятие, отправившее комплектацию
                key_element_object.complete_set_sender = params_for_complectation.complete_set_sender;
                //Предприятие полного освидетельствования
                key_element_object.depo_complete_survey = params_for_complectation.depo_complete_survey;
                //Дата освидетельствования
                key_element_object.date_install = params_for_complectation.date_install;
            }

            //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

            // Свидетельство о приемке
            key_element_object.acceptance_certificate = after_register_params.acceptance_certificate;

            // Свидетельство об упаковывании
            key_element_object.packing_certificate = after_register_params.packing_certificate;

            break;
        //Сменный железнодорожный кузов
        case keyElementCodes.removable_railway_carcass_id:
            //Срок службы
            key_element_object.life_time = special_params.life_time;

            //Индивидуальные особенности
            key_element_object.individual_features = special_params.individual_features;

            //Номер изделия по системе нумерации предприятия-изготовителя
            key_element_object.manufacturer_number = special_params.manufacturer_number;

            //Марка материала
            key_element_object.steel_grade = special_params.steel_grade;

            //Грузоподъемность
            key_element_object.carcass_load_capacity = special_params.carcass_load_capacity;

            //Объем кузова (котла)
            key_element_object.carcass_volume = special_params.carcass_volume;

            //Масса тары максимальная
            key_element_object.tare_max_weight = special_params.tare_max_weight;

            //Специализация
            key_element_object.specialization = special_params.specialization;

            
            //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

            // Свидетельство о приемке
            key_element_object.acceptance_certificate = after_register_params.acceptance_certificate;

            // Свидетельство об упаковывании
            key_element_object.packing_certificate = after_register_params.packing_certificate;
            break;
        //Адаптер подшипника
        case keyElementCodes.bearing_adapter_id:
            //Условный номер для клеймения продукции вагоностроения
            key_element_object.ke_manufacturer = special_params.ke_manufacturer;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            key_element_object.branding_code_certificate_number = special_params.branding_code_certificate_number;

            //Марка материала
            key_element_object.steel_grade = special_params.steel_grade;

            //Сведения об изготовителе заготовки
            key_element_object.billet_manufacturer_info = special_params.billet_manufacturer_info;

            //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

            // Свидетельство о приемке
            key_element_object.acceptance_certificate = after_register_params.acceptance_certificate;

            // Свидетельство об упаковывании
            key_element_object.packing_certificate = after_register_params.packing_certificate;

            break;
        //Валик подъемника
        case keyElementCodes.elevator_roll_id:
            //Условный номер для клеймения продукции вагоностроения
            key_element_object.ke_manufacturer = special_params.ke_manufacturer;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            key_element_object.branding_code_certificate_number = special_params.branding_code_certificate_number;

            //Сведения об изготовителе заготовки
            key_element_object.billet_manufacturer_info = special_params.billet_manufacturer_info;

            //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

            // Свидетельство о приемке
            key_element_object.acceptance_certificate = after_register_params.acceptance_certificate;

            // Свидетельство об упаковывании
            key_element_object.packing_certificate = after_register_params.packing_certificate;
            break;
        //Замок
        case keyElementCodes.lock_id:
            //Условный номер для клеймения продукции вагоностроения
            key_element_object.ke_manufacturer = special_params.ke_manufacturer;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            key_element_object.branding_code_certificate_number = special_params.branding_code_certificate_number;

            //Сведения об изготовителе заготовки
            key_element_object.billet_manufacturer_info = special_params.billet_manufacturer_info;

            //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

            // Свидетельство о приемке
            key_element_object.acceptance_certificate = after_register_params.acceptance_certificate;

            // Свидетельство об упаковывании
            key_element_object.packing_certificate = after_register_params.packing_certificate;
            break;
        //Колесо
        case keyElementCodes.wheel_id:
            //Сведения о сертификате соответствия
            key_element_object.certificate_number = special_params.certificate_number;

            //Условный номер для клеймения продукции вагоностроения
            key_element_object.ke_manufacturer = special_params.ke_manufacturer;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            key_element_object.branding_code_certificate_number = special_params.branding_code_certificate_number;
            
            //Номер изделия по системе нумерации предприятия-изготовителя
            key_element_object.manufacturer_number = special_params.manufacturer_number;

            //Номер плавки
            key_element_object.melt_number = special_params.melt_number;

            //Марка материала
            key_element_object.steel_grade = special_params.steel_grade;

            //Параметры для комплектации
            if(!isNullObject(params_for_complectation)){
                //Ширина обода
                key_element_object.wheel_width = params_for_complectation.wheel_width;
            }

            //Сведения об изготовителе заготовки
            key_element_object.billet_manufacturer_info = special_params.billet_manufacturer_info;

            //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

            // Свидетельство о приемке
            key_element_object.acceptance_certificate = after_register_params.acceptance_certificate;

            // Свидетельство об упаковывании
            key_element_object.packing_certificate = after_register_params.packing_certificate;
            break;
        //Скоба
        case keyElementCodes.brace_id:
            //Условный номер для клеймения продукции вагоностроения
            key_element_object.ke_manufacturer = special_params.ke_manufacturer;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            key_element_object.branding_code_certificate_number = special_params.branding_code_certificate_number;

            //Марка материала
            key_element_object.steel_grade = special_params.steel_grade;

            //Сведения об изготовителе заготовки
            key_element_object.billet_manufacturer_info = special_params.billet_manufacturer_info;

            //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

            // Свидетельство о приемке
            key_element_object.acceptance_certificate = after_register_params.acceptance_certificate;

            // Свидетельство об упаковывании
            key_element_object.packing_certificate = after_register_params.packing_certificate;
            break;
        //Планка фрикционная
        case keyElementCodes.friction_strip_id:
            //Условный номер для клеймения продукции вагоностроения
            key_element_object.ke_manufacturer = special_params.ke_manufacturer;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            key_element_object.branding_code_certificate_number = special_params.branding_code_certificate_number;

            //Марка материала
            key_element_object.steel_grade = special_params.steel_grade;

            //Сведения об изготовителе заготовки
            key_element_object.billet_manufacturer_info = special_params.billet_manufacturer_info;

            //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

            // Свидетельство о приемке
            key_element_object.acceptance_certificate = after_register_params.acceptance_certificate;

            // Свидетельство об упаковывании
            key_element_object.packing_certificate = after_register_params.packing_certificate;
            break;
        //Колпак скользуна
        case keyElementCodes.slider_cap_id:
            //Условный номер для клеймения продукции вагоностроения
            key_element_object.ke_manufacturer = special_params.ke_manufacturer;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            key_element_object.branding_code_certificate_number = special_params.branding_code_certificate_number;

            //Марка материала
            key_element_object.steel_grade = special_params.steel_grade;

            //Сведения об изготовителе заготовки
            key_element_object.billet_manufacturer_info = special_params.billet_manufacturer_info;

            //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

            // Свидетельство о приемке
            key_element_object.acceptance_certificate = after_register_params.acceptance_certificate;

            // Свидетельство об упаковывании
            key_element_object.packing_certificate = after_register_params.packing_certificate;
            break;
        //Корпус скользуна
        case keyElementCodes.slider_body_id:
            //Условный номер для клеймения продукции вагоностроения
            key_element_object.ke_manufacturer = special_params.ke_manufacturer;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            key_element_object.branding_code_certificate_number = special_params.branding_code_certificate_number;

            //Марка материала
            key_element_object.steel_grade = special_params.steel_grade;

            //Сведения об изготовителе заготовки
            key_element_object.billet_manufacturer_info = special_params.billet_manufacturer_info;

            //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

            // Свидетельство о приемке
            key_element_object.acceptance_certificate = after_register_params.acceptance_certificate;

            // Свидетельство об упаковывании
            key_element_object.packing_certificate = after_register_params.packing_certificate;
            break;
        //Клин фрикционный
        case keyElementCodes.friction_wedge_id:
            //Условный номер для клеймения продукции вагоностроения
            key_element_object.ke_manufacturer = special_params.ke_manufacturer;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            key_element_object.branding_code_certificate_number = special_params.branding_code_certificate_number;

            //Марка материала
            key_element_object.steel_grade = special_params.steel_grade;

            //Сведения об изготовителе заготовки
            key_element_object.billet_manufacturer_info = special_params.billet_manufacturer_info;

            //Номер изделия по системе нумерации предприятия-изготовителя
            if (!isEmptyString(special_params.manufacturer_number)){
                key_element_object.manufacturer_number = special_params.manufacturer_number;

                key_element_object.point_to_manufacturer_number = true;
            }

            //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

            // Свидетельство о приемке
            key_element_object.acceptance_certificate = after_register_params.acceptance_certificate;

            // Свидетельство об упаковывании
            key_element_object.packing_certificate = after_register_params.packing_certificate;
           
            break;
        //Корпус автосцепки
        case keyElementCodes.coupler_id:
            //Сведения о сертификате соответствия
            key_element_object.certificate_number = special_params.certificate_number;

            //Условный номер для клеймения продукции вагоностроения
            key_element_object.ke_manufacturer = special_params.ke_manufacturer;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            key_element_object.branding_code_certificate_number = special_params.branding_code_certificate_number;

            //Номер изделия по системе нумерации предприятия-изготовителя
            key_element_object.manufacturer_number = special_params.manufacturer_number;

            //Марка материала
            key_element_object.steel_grade = special_params.steel_grade;

            //Модель автосцепки
            key_element_object.coupling_model = special_params.coupling_model;

            //Сведения об изготовителе заготовки
            key_element_object.billet_manufacturer_info = special_params.billet_manufacturer_info;

            //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

            // Свидетельство о приемке
            key_element_object.acceptance_certificate = after_register_params.acceptance_certificate;

            // Свидетельство об упаковывании
            key_element_object.packing_certificate = after_register_params.packing_certificate;
            break;
        //Рама боковая
        case keyElementCodes.side_frame_id:
            //Условный номер для клеймения продукции вагоностроения
            key_element_object.ke_manufacturer = special_params.ke_manufacturer;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            key_element_object.branding_code_certificate_number = special_params.branding_code_certificate_number;

            //Номер изделия по системе нумерации предприятия-изготовителя
            key_element_object.manufacturer_number = special_params.manufacturer_number;

            //Марка материала
            key_element_object.steel_grade = special_params.steel_grade;

            //Код государства собственника детали
            key_element_object.administration_code = special_params.administration_code;

            //Сведения о сертификате соответствия
            key_element_object.certificate_number = special_params.certificate_number;

            //Срок службы
            key_element_object.life_time = special_params.life_time;

            //Номер плавки
            key_element_object.melt_number = special_params.melt_number;

            //Расстояние между наружными упорными поверхностями буксового проема (количество шишек)
            key_element_object.slip_knots_distance = special_params.slip_knots_distance;

            //Параметры для комплектации
            if(!isNullObject(params_for_complectation)){
                //Предприятие, отправившее комплектацию
                key_element_object.complete_set_sender = params_for_complectation.complete_set_sender;
            }

            //Сведения об изготовителе заготовки
            key_element_object.billet_manufacturer_info = special_params.billet_manufacturer_info;

            //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

            // Свидетельство о приемке
            key_element_object.acceptance_certificate = after_register_params.acceptance_certificate;

            // Свидетельство об упаковывании
            key_element_object.packing_certificate = after_register_params.packing_certificate;

            // Год окончания гамма-процентного ресурса детали
            key_element_object.gamma_percent_resource_end_date = after_register_params.gamma_percent_resource_end_date;
            break;
        //Балка надрессорная
        case keyElementCodes.pressure_beam_id:
            //Условный номер для клеймения продукции вагоностроения
            key_element_object.ke_manufacturer = special_params.ke_manufacturer;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            key_element_object.branding_code_certificate_number = special_params.branding_code_certificate_number;

            //Номер изделия по системе нумерации предприятия-изготовителя
            key_element_object.manufacturer_number = special_params.manufacturer_number;

            //Марка материала
            key_element_object.steel_grade = special_params.steel_grade;

            //Код государства собственника детали
            key_element_object.administration_code = special_params.administration_code;

            //Сведения о сертификате соответствия
            key_element_object.certificate_number = special_params.certificate_number;

            //Срок службы
            key_element_object.life_time = special_params.life_time;

            //Номер плавки
            key_element_object.melt_number = special_params.melt_number;

            //Сведения об изготовителе заготовки
            key_element_object.billet_manufacturer_info = special_params.billet_manufacturer_info;

            //Параметры для комплектации
            if(!isNullObject(params_for_complectation)){
                //Предприятие, отправившее комплектацию
                key_element_object.complete_set_sender = params_for_complectation.complete_set_sender;
            }

            //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

            // Свидетельство о приемке
            key_element_object.acceptance_certificate = after_register_params.acceptance_certificate;

            // Свидетельство об упаковывании
            key_element_object.packing_certificate = after_register_params.packing_certificate;

            // Год окончания гамма-процентного ресурса детали
            key_element_object.gamma_percent_resource_end_date = after_register_params.gamma_percent_resource_end_date;
            break;
        //Подшипник буксового узла
        case keyElementCodes.bearing_node_id:
            
            //Номер изделия по системе нумерации предприятия-изготовителя
            key_element_object.manufacturer_number = special_params.manufacturer_number;
            
            //Условный номер для клеймения продукции вагоностроения
            key_element_object.ke_manufacturer = special_params.ke_manufacturer;
            
            //Регистрационный номер свидетельства о присвоении номера для клеймения
            key_element_object.branding_code_certificate_number = special_params.branding_code_certificate_number;
            
            //Сведения о сертификате соответствия
            key_element_object.certificate_number = special_params.certificate_number;

            //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

            // Свидетельство о приемке
            key_element_object.acceptance_certificate = after_register_params.acceptance_certificate;

            // Свидетельство об упаковывании
            key_element_object.packing_certificate = after_register_params.packing_certificate;
            break;
        //Пружина скользуна внутренняя
        case keyElementCodes.spring_slider_inside_id:
            //Марка материала
            key_element_object.steel_grade = special_params.steel_grade;

            //Сведения об изготовителе заготовки
            key_element_object.billet_manufacturer_info = special_params.billet_manufacturer_info;

            //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

            // Свидетельство о приемке
            key_element_object.acceptance_certificate = after_register_params.acceptance_certificate;

            // Свидетельство об упаковывании
            key_element_object.packing_certificate = after_register_params.packing_certificate;
            break;
        //Пружина скользуна наружная
        case keyElementCodes.spring_slider_outside_id:
            //Марка материала
            key_element_object.steel_grade = special_params.steel_grade;

            //Сведения об изготовителе заготовки
            key_element_object.billet_manufacturer_info = special_params.billet_manufacturer_info;

            //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

            // Свидетельство о приемке
            key_element_object.acceptance_certificate = after_register_params.acceptance_certificate;

            // Свидетельство об упаковывании
            key_element_object.packing_certificate = after_register_params.packing_certificate;
            break;
        //Пружина рессорного подвешивания внутренняя
        case keyElementCodes.spring_inside_id:
            //Сведения о сертификате соответствия
            key_element_object.certificate_number = special_params.certificate_number;
                
            //Условный номер для клеймения продукции вагоностроения
            key_element_object.ke_manufacturer = special_params.ke_manufacturer;
                
            //Марка материала
            key_element_object.steel_grade = special_params.steel_grade;

            //Сведения об изготовителе заготовки
            key_element_object.billet_manufacturer_info = special_params.billet_manufacturer_info;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            key_element_object.branding_code_certificate_number = special_params.branding_code_certificate_number;

            //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

            // Свидетельство о приемке
            key_element_object.acceptance_certificate = after_register_params.acceptance_certificate;

            // Свидетельство об упаковывании
            key_element_object.packing_certificate = after_register_params.packing_certificate;
            break;
        //Пружина рессорного подвешивания наружная
        case keyElementCodes.spring_outside_id:
            //Сведения о сертификате соответствия
            key_element_object.certificate_number = special_params.certificate_number;
            
            //Условный номер для клеймения продукции вагоностроения
            key_element_object.ke_manufacturer = special_params.ke_manufacturer;
            
            //Марка материала
            key_element_object.steel_grade = special_params.steel_grade;

            //Сведения об изготовителе заготовки
            key_element_object.billet_manufacturer_info = special_params.billet_manufacturer_info;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            key_element_object.branding_code_certificate_number = special_params.branding_code_certificate_number;

            //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

            // Свидетельство о приемке
            key_element_object.acceptance_certificate = after_register_params.acceptance_certificate;

            // Свидетельство об упаковывании
            key_element_object.packing_certificate = after_register_params.packing_certificate;
            break;

        //Авторежим грузовой
        case keyElementCodes.auto_mode_cargo_id:
            //Условный номер для клеймения продукции вагоностроения
            key_element_object.ke_manufacturer = special_params.ke_manufacturer;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            key_element_object.branding_code_certificate_number = special_params.branding_code_certificate_number;

            //Срок службы
            key_element_object.life_time = special_params.life_time;

            //Сведения о сертификате соответствия
            key_element_object.certificate_number = special_params.certificate_number;

            //Номер изделия по системе нумерации предприятия-изготовителя
            key_element_object.manufacturer_number = special_params.manufacturer_number;

            //Обозначение модели авторежим грузовой
            key_element_object.auto_mode_cargo_model = special_params.coupling_model;

            //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

            // Свидетельство о приемке
            key_element_object.acceptance_certificate = after_register_params.acceptance_certificate;

            // Свидетельство об упаковывании
            key_element_object.packing_certificate = after_register_params.packing_certificate;

        break;

        //Хомут тяговый
        case keyElementCodes.traction_clamp_id:
            //Сведения о сертификате соответствия
            key_element_object.certificate_number = special_params.certificate_number;

            //Условный номер для клеймения продукции вагоностроения
            key_element_object.ke_manufacturer = special_params.ke_manufacturer;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            key_element_object.branding_code_certificate_number = special_params.branding_code_certificate_number;

            //Номер изделия по системе нумерации предприятия-изготовителя
            key_element_object.manufacturer_number = special_params.manufacturer_number;

            //Марка материала
            key_element_object.steel_grade = special_params.steel_grade;

            //Сведения об изготовителе заготовки
            key_element_object.billet_manufacturer_info = special_params.billet_manufacturer_info;

            //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

            // Свидетельство о приемке
            key_element_object.acceptance_certificate = after_register_params.acceptance_certificate;

            // Свидетельство об упаковывании
            key_element_object.packing_certificate = after_register_params.packing_certificate;
        break;
        //Корпус поглощающего аппарата
        case keyElementCodes.absorbing_device_body_id:
            //Условный номер для клеймения продукции вагоностроения
            key_element_object.ke_manufacturer = special_params.ke_manufacturer
            //Регистрационный номер свидетельства о присвоении номера для клеймения
            key_element_object.branding_code_certificate_number = special_params.branding_code_certificate_number;
            //Номер изделия по системе нумерации предприятия-изготовителя
            key_element_object.manufacturer_number = special_params.manufacturer_number;
            //Обозначение модели Корпус поглощающего аппарата
            key_element_object.absorbing_device_body_model = special_params.absorbing_model;

            //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

            // Свидетельство о приемке
            key_element_object.acceptance_certificate = after_register_params.acceptance_certificate;

            // Свидетельство об упаковывании
            key_element_object.packing_certificate = after_register_params.packing_certificate;
            
        break;
        //Ось черновая
        case keyElementCodes.rough_axis_id:
            //Сведения о сертификате соответствия
            key_element_object.certificate_number = special_params.certificate_number;
            //Условный номер для клеймения продукции вагоностроения
            key_element_object.ke_manufacturer = special_params.ke_manufacturer;

            //Регистрационный номер свидетельства о присвоении номера для клеймения
            key_element_object.branding_code_certificate_number = special_params.branding_code_certificate_number;
            
            //Марка материала
            key_element_object.steel_grade = special_params.steel_grade;

            //Сведения об изготовителе заготовки
            key_element_object.billet_manufacturer_info = special_params.billet_manufacturer_info;

            //Номер плавки
            key_element_object.melt_number = special_params.melt_number;

            //Номер изделия по системе нумерации предприятия-изготовителя
            key_element_object.manufacturer_number = special_params.manufacturer_number;

            //Группа параметров after_register_params (Группа параметров после выпуска в обращение) 

            // Свидетельство о приемке
            key_element_object.acceptance_certificate = after_register_params.acceptance_certificate;

            // Свидетельство об упаковывании
            key_element_object.packing_certificate = after_register_params.packing_certificate;

        break;
    }
   
    var key_element_code = db.findbyrecid("dictionary_key_elements_codes", object.common_params.key_element_code);

    key_element_object.statuske = "52c7de6f-1bc2-48a7-90b4-1b14264a01ab";
    key_element_object.numberke = ke_number.recname;
    
    var insert_res = db.update("reestr_key_elements", key_element_object);
  
    if(isNullObject(insert_res)){
        return badResp("Не удалось создать запись СЧ в реестре СЧ");
    }
    
    //Обновление статуса номера в таблице УИН
    ke_number.status = "6f0eee3f-72c9-4a5f-8e50-53d9f4a277d1";
	ke_number.number_status = "c8671fa5-6832-4c7a-b767-0f4fc3084915";
	ke_number.number_assigner = getcurrentuser().login;
    ke_number.number_assign_date = new Date();
    ke_number.type = key_element_code.recname;
	db.update("ke_numbers", ke_number);

    return {
        success: true,
        message: "Паспорт СЧ успешно создан",
        data: key_element_object.recid,
        type: "ke"
    };
}

/**
 * Отправка файлов во внешний рдев
 * @param {*} outer_rdev       адрес внешнего рдева
 * @param {*} files     файлы для загрузки
 */
function upload_files_to_outer_rdev(outer_rdev, files){
    var url = String().concat(outer_rdev, "/api/files/upload2");
	var headers = {
		'Content-Type': "multipart/form-data"
    };
    var body = JSON.stringify(files);
	return sendRequest("POST", headers, url, body);
}

/**
 * Удаление файла из БД
 * @param {*} recid 
 */
function delete_files(recid){
    var url = String().concat(host, "/api/files/delete_file/", recid);
    return sendRequest("DELETE", null, url, null);
}

/**
 * Удаление файла из БД
 * @param {*} recid 
 * @param {*} remote_host 
 */
function delete_files_from_outer_rdev(recid, remote_host){
    var url = String().concat(String(remote_host), "/api/files/delete_file/", recid);
    return sendRequest("DELETE", null, url, null);
}

/**
 * Подписать файлы заявлений на учет в карточке заявления
 * @param {*} params 
 */
function sign_allow_application_on_edit_form(params){

    var applications_recid = JSON.stringify(params.recordIdList);
	var paramteres = {
		"recid_applications": applications_recid,
		"table_name": "reestr_applications_for_key_elements_registration",
		"field_name_file": "notice_file"
	}
	//Вызываем метод из плагина
    var res = plugins.callAsMethod("/plugins/nbdlogicplugin/sign_applications", "post", paramteres, null);
	return res;

    if(params.recid!=null)
    {
        // Если метод вызван по кнопке, то используем params.recid.
        recid = params.recid
    }
    else if(isEmptyOrNullArray(params.recordIdList) == false)
    {
        // Если метод вызван как метод воркфлоу, то recordIdList - массив идентификаторов записей.
        recid = params.recordIdList[0];
    }

    var attached_files = getattachedfileincolumn("reestr_applications_for_key_elements_registration", "notice_file", recid);
    if(isEmptyOrNullArray(attached_files)){
        return {
            success: true, 
            message: "Не найдено файлов для подписания",
            data: []
        }
    }
    var files_to_sign = [];
    for(var i = 0; i < attached_files.length; i++){
        var attached_file = attached_files[i];
        files_to_sign.push(attached_file.recId);
    }

    if(isEmptyOrNullArray(files_to_sign)){
        return {
            success: true,
            message: "Файлы для подписания не найдены",
            data: []
        }
    }else{
        return {
            success: true,
            message: String().concat("Найдено ", files_to_sign.length.toString(), " файлов для подписи"),
            data: files_to_sign
        }
    }

}

/**
 * Получение идентификаторов сущностей в БД по данным в структуре after_register_params
 * @param {*} object 
 */
function get_key_element_after_register_params_ids(object){
    var after_register_params = object.after_register_params;
    switch (object.common_params.key_element_code) {
        //Крышка люка полувагона
        case keyElementCodes.gondola_hatch_id:

            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;

            break;
        //Упоры передний и задний объединенные
        case keyElementCodes.front_rear_detents_id:

            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
         
            break;
        //Вкладыш подпятника
        case keyElementCodes.saddle_bearing_id:

            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
          
            break;
        //Вставки в клиновые карманы
        case keyElementCodes.wedge_pockets_inserts_id:

            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
           
            break;
        //Кольцо в подпятник
        case keyElementCodes.saddle_ring_id:

            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
            
            break;
        //Пластины в клиновых карманах
        case keyElementCodes.wedge_pockets_id:

            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
            
            break;
        //Ось чистовая
        case keyElementCodes.clear_axis_id:

            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
           
            break;
        //Сменный железнодорожный кузов
        case keyElementCodes.removable_railway_carcass_id:

            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
           
            break;
        //Адаптер подшипника
        case keyElementCodes.bearing_adapter_id:
            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
            break;
        //Валик подъемника
        case keyElementCodes.elevator_roll_id:

            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
         
            break;
        //Замок
        case keyElementCodes.lock_id:

            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
         
            break;
        //Колесо
        case keyElementCodes.wheel_id:

            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
           
            break;
        //Скоба
        case keyElementCodes.brace_id:

            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
           
            break;
        //Планка фрикционная
        case keyElementCodes.friction_strip_id:

            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
            
            break;
        //Колпак скользуна
        case keyElementCodes.slider_cap_id:

            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
          
            break;
        //Корпус скользуна
        case keyElementCodes.slider_body_id:

            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
            
            break;
        //Клин фрикционный
        case keyElementCodes.friction_wedge_id:

            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
           
            break;
        //Корпус автосцепки
        case keyElementCodes.coupler_id:

            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
         
            break;
        //Рама боковая
        case keyElementCodes.side_frame_id:

            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }

            //Свидетельство об упаковывании
            after_register_params.packing_certificate;

            // Год окончания гамма-процентного ресурса детали
            if(isEmptyString(after_register_params.gamma_percent_resource_end_date)){
                return badResp("Поле \"Год окончания гамма-процентного ресурса детали\" пустое, проверьте параметр \"gamma_percent_resource_end_date\"");
            }
            
           
            break;
        //Балка надрессорная
        case keyElementCodes.pressure_beam_id:
            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }

            //Свидетельство об упаковывании
            after_register_params.packing_certificate;

            // Год окончания гамма-процентного ресурса детали
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }

            break;

        //Подшипник буксового узла 
        case keyElementCodes.bearing_node_id:

            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
          
            break;

        //Пружина скользуна внутренняя
        case keyElementCodes.spring_slider_inside_id:

            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
    
            break;

        //Пружина скользуна наружная 
        case keyElementCodes.spring_slider_outside_id:

            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
   
            break;

        //Пружина рессорного подвешивания внутренняя    
        case keyElementCodes.spring_inside_id:

            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
           
            break;
        
        //Пружина рессорного подвешивания наружная 
        case keyElementCodes.spring_outside_id:

            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
           
            break;
        // Аторежим грузовой
        case keyElementCodes.auto_mode_cargo_id:
            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;

            break;
        //Хомут тяговый
        case keyElementCodes.traction_clamp_id:

            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
         
            break;
        //Корпус поглощающего аппарата
        case keyElementCodes.absorbing_device_body_id:

            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;

        break;

        //Ось черновая
        case keyElementCodes.rough_axis_id:

            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
           
        break;
    }
    return {
        success: true,
        data: after_register_params
    }
}

/**
 * Получение идентификаторов сущностей в БД по данным в структуре after_register_params (СЕ)
 * @param {*} object 
 */
function get_assembly_unit_after_register_params_ids(object){
    var after_register_params = object.after_register_params;
    switch (object.common_params.ke_node_type) {
        //Воздухораспределитель
        case "aa12b486-85f2-416f-b299-e76e07174934":
            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
            break;
        //Хомут в сборе в поглощающим аппаратом
        case "5db9db1f-e0cb-41fc-80ec-52cb1141ea51":
            break;
        //Скользун
        case "a70bf64c-215b-4d42-9c8e-f8ab4ac9f357":
            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
            break;
        //Комплект пружин    
        case "5fe8c6fd-fd66-49da-92d3-222b1b3a1243":
            break;
        //Передача тормозная рычажная
        case "b817ce27-bd7b-4151-8de6-5036a203994e":
            break;
        //Колесная пара
        case "a3afe986-102a-4a10-aafe-5407134f7c15":
             //Свидетельство о приемке
             if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
            break;
        //Тележка
        case "cbb9d8cb-89ef-4b99-be77-a7d6e57e388e":
            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
            return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
            break;
        //Рама боковая
        case "22ca1065-868e-4726-8f52-b6a5fdb8dfdc":
            break;
        //Балка надрессорная
        case "c8c2ab90-8d32-41fc-8a4d-a969d13c9f04":
            break;
        //Автосцепка СА-3
        case "ae11ae44-1c69-49e0-83a1-4122bb2d80ae":
            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
            break;
        //Колесная пара без буксовых узлов
        case "00b0b326-a67a-4ce2-95af-376fcc9d8355":
            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
            break;
        //Триангель
        case "c790c624-b93e-498b-97ba-0fb47f8b4b52":
            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
            break;
        //Котел вагона-цистерны
        case "79ddf686-f26f-4567-97ac-cb18eadd83e9":
            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
            break;
         //Воздухораспределитель в сборе
         case "a6180bfa-368d-4eff-97f2-c4f6c2612bc6":
            //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
            break;
         //Поглощающий аппарат
         case "700b86ca-5b88-44d6-a5d3-c2c4e76d96f8":
             //Свидетельство о приемке
            if(isEmptyString(after_register_params.acceptance_certificate)){
                return badResp("Поле \"Свидетельство о приемке\" пустое, проверьте параметр \"acceptance_certificate\"");
            }
            //Свидетельство об упаковывании
            after_register_params.packing_certificate;
            break;
        
    }
    return {
        success: true,
        data: after_register_params
    }
}

/**
 * Подписать архив на учет в карточке заявления
 * @param {*} params 
 */
function sign_arhive(params){

    var applications_recid = JSON.stringify(params.recordIdList);
	var paramteres = {
		"recid_applications": applications_recid,
		"table_name": "reestr_applications_for_key_elements_registration",
		"field_name_file": "generated_application_file"
	}
	//Вызываем метод из плагина
    var res = plugins.callAsMethod("/plugins/nbdlogicplugin/sign_applications", "post", paramteres, null);
	return res;
}
