var transliteratedAlphabet = {
    "А": "A",
    "Б": "B",
    "В": "V",
    "Г": "G",
    "Д": "D",
    "Е": "E",
    "Ё": "E",
    "Ж": "ZH",
    "З": "Z",
    "И": "I",
    "Й": "I",
    "К": "K",
    "Л": "L",
    "М": "M",
    "Н": "N",
    "О": "O",
    "П": "P",
    "Р": "R",
    "С": "S",
    "Т": "T",
    "У": "U",
    "Ф": "F",
    "Х": "X",
    "Ц": "C",
    "Ч": "CH",
    "Ш": "SH",
    "Щ": "SH",
    "Ы": "I",
    "Э": "E",
    "Ю": "YU",
    "Я": "YA",
}

var latinAlphabet = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9"
]

var latinAlphabetWithoutNumbers = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z"
]


// var rzdPortalUrl ="http://bc-rzd.numeral.su";
// var rzdPortalIP = "http://192.168.102.158";
// Константы для работы портала.
/* var helperConstants = 
{
    // Урл, который указывает на арм росжелдора по днс имени.
    rzdPortalNameUrl: "http://bc-rzd.numeral.su", // http://nbd.dev.egspace.ru
    // Урл, который указывает на арм росжелдора по IP.
    rzdPortalIPUrl: "http://192.168.102.158" // http://10.10.0.174:5009
}; */

function isEmptyString(value) {
    return (value == null || value === "undefined" || value === "" || value.length === 0);
}

function isNotEmptyString(value) {
    return (value != null && value !== "undefined" && value !== "" && value.length !== 0);
}

function isNullObject(value) {
    return (value == null || value === "undefined" || !value || (typeof value !== "string" && Object.keys(value).length === 0));
}

function isNotNullObject(value) {
    return (value != null && value !== "undefined" && !!value && (typeof value === "string"  || Object.keys(value).length !== 0 ) );
}

function isEmptyOrNullArray(value) {
    return (!value || value == null || value === "undefined" || value.length <= 0);
}

function isNotEmptyOrNullArray(value) {
    return (value && value != null && value !== "undefined" && value.length > 0);
}

function formatDate(date) {
	var dd = date.getDate();
	if (dd < 10) dd = '0' + dd;

	var mm = date.getMonth() + 1;
	if (mm < 10) mm = '0' + mm;

	var yyyy = date.getFullYear();

	return dd + '.' + mm + '.' + yyyy;
}

function formatDateReverse(date) {
	var dd = date.getDate();
	if (dd < 10) dd = '0' + dd;

	var mm = date.getMonth() + 1;
	if (mm < 10) mm = '0' + mm;

	var yyyy = date.getFullYear();

	return yyyy + '.' + mm + '.' + dd;
}

function formatTime(date) {
	var hours = date.getHours();
	if (hours < 10) hours = '0' + hours;

	var minutes = date.getMinutes();
	if (minutes < 10) minutes = '0' + minutes;

	var seconds = date.getSeconds();
	if (seconds < 10) seconds = '0' + seconds;

	return hours + ":" + minutes + ":" + seconds;
}

function badResp(message, data) {
    return {
        success: false,
        message: message,
        data: data
    };
}

function successResp(message, data) {
    return {
        success: true,
        message: message,
        data: data
    };
}

/**
 * Транслитерирование строки
 * @param {*} string 
 */
function transliterateString(string){
    if(isEmptyString(string)){
        return badResp("Строка для транслитерирования не может быть пустой");
    }
    var resultString = "";
    string = string.toUpperCase();


    //Проход по всем литералам в тексте
    for(var i = 0; i < string.length; i++){
        var literal = string[i];
        if(!isEmptyString(literal)){
            if(latinAlphabet.indexOf(literal) == -1){
                var alphabetLiterals = typeof transliteratedAlphabet !== "string" && Object.keys(transliteratedAlphabet);
                for(var j = 0; j < alphabetLiterals.length; j++){
                    var alphabetLiteral = alphabetLiterals[j];
                    if(alphabetLiteral == literal){
                        resultString = String().concat(resultString, transliteratedAlphabet[alphabetLiteral])
                    }
                }
            }else{
                resultString = String().concat(resultString, literal);
            } 
        }
    }

    if(resultString.length <= 0){
        return badResp("Не удалось транслитерировать строку");
    }else{
        return {
            success: true,
            message: "Транслитерация успешна",
            data: resultString.toLowerCase()
        }
    }

}

/**
 * Выдача уникального идентификатора участнику
 */
function getMemberUniqueIdentifier(){
    //Получение всех ранее выданных идентификаторов
    var all_identifiers = db.findbyparams("dictionary_unique_members_identifiers", {recstate: 1});
    
    var identifier = null;
    if(isEmptyOrNullArray(all_identifiers)){
        identifier = "A01";
    }else{
        //Подсчет количества ранее выданных идентификаторов
        var identifiers_count = all_identifiers.length + 1;
        var hundreds_count = Math.floor(identifiers_count / 100);
        identifier = String().concat(latinAlphabetWithoutNumbers[hundreds_count], String().concat("0000", identifiers_count).slice(-2));
    }
    
    var insertRes = db.insert("dictionary_unique_members_identifiers", {recname: identifier});
    if(isNullObject(insertRes)){
        return badResp("Не удалось создать запись уникального идентификатора")
    }
    return {
        success: true,
        identifier_id: insertRes.recid,
        identifier: insertRes.recname
    }
}

function infoLog(objname, message)
{
    event.log(
            objname, // objectname
            null, // objectid
            message, // message
            1 // eventtype
        );
}

function errorLog(objname, message)
{
    event.log(
            objname, // objectname
            null, // objectid
            message, // message
            4 // eventtype
        );
}
/**
 * Вычисление даты следующей отправки
 * @param {*} date_start_send // Дата/время начала отправки
 * @param {*} date_resend  // дата последней попытки из send_mail_tasks
 */
function calculated_next_date(date_start_send, date_resend){

    if (date_resend == null){
        date_resend = new Date(date_start_send);
        date_resend = new Date(date_resend.getFullYear(), date_resend.getMonth(), date_resend.getDate(), date_resend.getHours(), date_resend.getMinutes(), 0);
        date_resend.setMilliseconds(0);
        date_resend.setHours(date_resend.getHours() + 1);
    } else {
        // окончание даты отправки каждый час
        var end_every_hour_date = new Date(date_start_send);
        end_every_hour_date = new Date(end_every_hour_date.getFullYear(), end_every_hour_date.getMonth(), end_every_hour_date.getDate(), 0, 0, 0);
        end_every_hour_date.setMilliseconds(0);
        end_every_hour_date.setDate(end_every_hour_date.getDate() + 1);

        // полное окончание отправок
        var end_trying_date = new Date(end_every_hour_date);
        end_trying_date = new Date(end_trying_date.getFullYear(), end_trying_date.getMonth(), end_trying_date.getDate(), end_trying_date.getHours(), end_trying_date.getMinutes(), 0);
        end_trying_date.setMilliseconds(0);
        end_trying_date.setHours(end_trying_date.getHours() + 48);

        date_resend = new Date(date_resend);
        date_resend = new Date(date_resend.getFullYear(), date_resend.getMonth(), date_resend.getDate(), date_resend.getHours(), date_resend.getMinutes(), 0);
        date_resend.setMilliseconds(0);

        if (date_resend.getTime() < end_every_hour_date.getTime()){
            date_resend.setHours(date_resend.getHours() + 1);
        } else if (date_resend.getTime() <= end_trying_date.getTime()){
            date_resend.setHours(date_resend.getHours() + 24); 
        } else {
            // если кончились попытки
            // зануляем дату следующей отправки
            date_resend = null;
        }
    }
    return date_resend;

}

/**
 * Обновление статуса заявления при НЕ успешной отправки письма
 * @param {*} application_recid // recid заявления
 * @param {*} table // таблица в которой находится запись
 * @param {*} type  // тип заявления
 */
function update_status_application(application_recid, table, type){
    if (type == "Уведомление о поступлении заявления на регистрацию УИН" 
    || type == "Уведомление о поступлении заявления на учет СЧ/СЕ" 
    || type == "Уведомление о принятии решения по заявлению на регистрацию УИН" 
    || type == "Уведомление о принятии решения по заявлению на учет СЧ/СЕ"){
        var table_fields = db.findbyrecid(table, application_recid);
        if(isNullObject(table_fields)){
            return badResp("Запись заявления не найдена в системе");
        }
        switch (table) {
            case "rfid_request":
                //меняем на статус Ошибка отправки
                table_fields.rfid_request_status = 12;
                var updres = db.update(table, table_fields);
                if(!updres){
                    return badResp("Не удалось обновить запись заявления");
                }
                break;
            case "reestr_applications_for_key_elements_registration":
                //меняем на статус Ошибка отправки
                table_fields.status = "f7f5967e-0be7-417e-95c3-3632c62b298c";
                var updres = db.update(table, table_fields);
                if(!updres){
                    return badResp("Не удалось обновить запись заявления");
                }
                break;
            default:
                break;
        }
    }
}
/**
 * Логирование
 * @param {*} params // параметры записи
 */
function send_mail_tasks_log(params){
    //создаем запись в таблице логов send_mail_tasks_log
    var insert_restult_test = db.insert("send_mail_tasks_log", params);
    if(isNullObject(insert_restult_test)){
        return badResp("Не удалось создать запись в таблице логов send_mail_tasks_log");
    }
}

 /**
 * Функция добавления задачи на повторную рассылку в случае ошибочной первоначальной отправки
 * @param {*} email // почта, куда отправить письмо
 * @param {*} title // тема сообщения (тут же тип заявления)
 * @param {*} body // тело сообщения
 * @param {*} archive // recid архива приложенных файлов
 * @param {*} recid_application // recid заявления, которое хотим отправить
 * @param {*} table_application // таблица, в которой находится заявление
 * @param {*} is_send // флаг об успешной отправки письма
 * @param {*} is_completed // флаг об окончании количества попыток отправки
 * @param {*} email_owner // почта владельца
 * @param {*} title_owner // тема сообщения владельца (тут же тип заявления)
 * @param {*} body_owner // тело сообщения владельца
 */
function create_send_mail_task(email, title, body, archive, recid_application, table_application, email_owner, title_owner, body_owner){
    // Создаем пустую запись в send_mail_tasks
    var new_task_record = db.insert("send_mail_tasks", {recstate: 1});
    if(isNullObject(new_task_record)){
        return badResp("Ошибка создания задачи на повторную отправку в send_mail_tasks");
    }
    // Вызываем алгоритм расчета даты следующей отправки
    var date_resend = calculated_next_date(new_task_record.reccreated, new_task_record.date_resend);

    // Обновление параметров для повторной рассылки
    new_task_record.email = email;
    new_task_record.subject = title;
    new_task_record.arhive_recid = archive;
    new_task_record.recid_application = recid_application;
    new_task_record.table_application = table_application;
    new_task_record.is_send = false;
    new_task_record.is_completed = false;
    new_task_record.date_next_sending = date_resend;

    // Записываем информацию о владельце заявления (если есть, значения могут быть и null, в случае если создает задача только на самого владельца)
    // Возможно стоит завести отдельную функцию для владельца
    //new_task_record.email_owner = email_owner;
    //new_task_record.title_owner = title_owner;
    new_task_record.body = body;

    var new_task_record_update = db.update("send_mail_tasks", new_task_record);
    
    if (!new_task_record_update){
        return badResp("Не удалось обновить задачу на повторную отправку писем");
    }

    // Обновляем статус заявления на "Отправка"
    var table_application_fields = db.findbyrecid(table_application, recid_application); // Получаем запись заявления
    if(isNullObject(table_application_fields)){
        return badResp("Запись заявления не найдена в системе");
    }
    switch (title) {
        case "Уведомление о поступлении заявления на регистрацию УИН":
        case "Уведомление о принятии решения по заявлению на регистрацию УИН":
            table_application_fields.rfid_request_status = 11; //Статус "Отправка"
            break;
        case "Уведомление о поступлении заявления на учет СЧ/СЕ":
        case "Уведомление о принятии решения по заявлению на учет СЧ/СЕ":
            table_application_fields.status = "73f0764a-028c-4a3d-a201-528c12636c1c"; //Статус "Отправка"
            break;
    
        default:
            break;
    }

    var table_application_fields_update = db.update(table_application, table_application_fields);
    if(!table_application_fields_update){
        return badResp("Не удалось обновить запись заявления");
    }
}
 /**
 * Функция отправки уведомления владельцу и загрузка файлов в другой рдев  (если отправка основного уведомления в росжелдор или производитель дошло успешно)
 * @param {*} title // тема сообщения - тип заявления
 * @param {*} title_owner // тема сообщения владельца - тип заявления
 * @param {*} body_owner // тело сообщения владельца
 * @param {*} email_owner // Почта владельца
 * @param {*} archive // recid архива приложенных файлов
 * @param {*} recid_application // recid заявления, которое хотим отправить
 * @param {*} table_application // таблица, в которой находится заявление
 */
function sending_notice_and_upload_files(title, body_owner, email_owner, archive, recid_application, table_application){
    // Получаем запись заявления
    var table_app_fields = db.findbyrecid(table_application, recid_application);
    if (isNullObject(table_app_fields)){
        return badResp("Не удалось получить запись заявления");
    }
    if (title == "Уведомление о поступлении заявления на регистрацию УИН"){
        //Отправка сообщения владельцу
        var send_mail_result = send_email(email_owner, title, body_owner, [archive]);
        if(!send_mail_result.success){
            // вызываем алгоритм создания задачи на повторную рассылку
            create_send_mail_task(email_owner, title, body_owner, archive.toString(), recid_application, table_application);
        }

        //Отправка всех файлов с формы в рдев росжелдора
        var all_attached_files = getattachedfiles(table_application, recid_application);
        if(!all_attached_files.success){
            return all_attached_files;
        }
        var files_to_upload = [];
        var all_attached_files = all_attached_files.data;
        for(var i = 0; i < all_attached_files.length; i++){
            var fileUrl = String().concat(host, "/api/files/download/", all_attached_files[i].recId);
                files_to_upload.push({
                    recId: all_attached_files[i].recId,
                    entityId: recid_application,
                    entityName: table_application,
                    columnName: all_attached_files[i].columnName,
                    description: all_attached_files[i].recDescription,
                    file: {
                        "name": all_attached_files[i].recName, "url": fileUrl   
                    }
                });
        }

        // Удаление созданного архива
        // delete_files(archive);

        // получение адреса росжелдора
        var rzd_url = get_rzd_urls_portal_settings();
        if(rzd_url.success){
            var files_upload_res = upload_files_to_outer_rdev(rzd_url.rzd_name_url, files_to_upload);
            if(!files_upload_res.success){
                files_upload_res.message = String().concat("Ошибка отправки файлов во внешнуюю систему: ", files_upload_res.message);
                return files_upload_res;
            }
        }

        // меняем статус на Отправлено в росжелдор
        
        //Отправлено в росжелдор
        table_app_fields.rfid_request_status = 6;
        var updres = db.update(table_application, table_app_fields);
        if(!updres){
            return badResp("Не удалось обновить запись заявления");
        }
    }
    if (title == "Уведомление о принятии решения по заявлению на регистрацию УИН"){
       
        //Определение имени хоста
        var hostnames = db.findbyparams("dictionary_host_names", {recstate: 1});
        if(isEmptyOrNullArray(hostnames)){
            return badResp("Не удалось определить адрес хоста, обратитесь к администратору за решением проблемы");
        }
        var hostname = hostnames[0].recname;

        var filesForOuterRdev = [];
        //Получение файлов для вложения
        var files = getattachedfiles(table_application, recid_application).data;
        for(var i = 0; i < files.length; i++){
            //Наполнение массива для отправки файлов в другой рдев
            if(files[i].columnName == "notification_file" || files[i].columnName == "barcodes"){
                var fileUrl = String().concat(host, "/api/files/download/", files[i].recId);
                filesForOuterRdev.push({
                    recId: files[i].recId,
                    entityId: recid_application,
                    entityName: table_application,
                    columnName: files[i].columnName,
                    description: files[i].recDescription,
                    file: {
                        "name": files[i].recName, "url": fileUrl   
                    }
                })
            }
        }

        //Удаление созданного архива
        // delete_files(archive);

        var ke_numbers = db.findbyparams("ke_numbers", {
            rfid_request: recid_application
        });

        //Статус "Результат отправлен владельцу"
        table_app_fields.rfid_request_status = 10;
        var updres = db.update(table_application, table_app_fields);
        if(!updres){
            return badResp("Не удалось обновить запись заявления");
        }
        
        // Получение настройки, которая разрешает/запрещает передачу между армами
        var transfer_setting = get_transfer_between_arms_portal_settings();
        if (!transfer_setting.success){
            return transfer_setting;
        }
        if (transfer_setting.is_transfer_between_arms){
            // получение адреса росжелдора
            var rzd_url = get_rzd_urls_portal_settings();
            if(!rzd_url.success){
                return rzd_url;
            }
            if(host == rzd_url.rzd_ip_url || host == rzd_url.rzd_name_url){
                
                if(!isEmptyString(table_app_fields.host)){
                    if(hostname != table_app_fields.host){
                        var url = String().concat(table_app_fields.host, "/api/anonym");
                        //Отправка файлов в арм производителя
                        var files_upload_res = upload_files_to_outer_rdev(table_app_fields.host, filesForOuterRdev);
                        if(!files_upload_res.success){
                            event.log("send_mail", null, "ОШИБКА", 1, files_upload_res);
                            
                        }
                        //Обновление записи в арме производителя
                        //Обновление записи с заявлением
                        var headers = {
                            "Content-Type": "application/json"
                        }
                        
                        var update_request_params = {
                            method: "update_entity_static",
                            fields: {
                                table: "rfid_request",
                                entity: table_app_fields
                            }
                        }
        
                        var sendrequestresult = sendRequest("POST", headers, url, JSON.stringify(update_request_params));
                        if(!sendrequestresult.result.success){
                            return sendrequestresult;
                        }
        
                        var uinFilesForOuterRdev = [];
                        //Перенос УИН
                        if(!isEmptyOrNullArray(ke_numbers)){
                            
                            for(var i = 0; i < ke_numbers.length; i++){
                                var ke_number = ke_numbers[i];
                                var insert_request_params = {
                                    method: "insert_entity_static",
                                    fields: {
                                        table: "ke_numbers",
                                        entity: ke_number
                                    }
                                }
                                var sendrequestresult = sendRequest("POST", headers, url, JSON.stringify(insert_request_params));
                                if(sendrequestresult.result == null){
                                    return badResp(String().concat("Не удалось отправить запись УИН по url: ", url));
                                }
                                
                                //Получение файлов datamatrix для УИН
                                var uin_files = getattachedfiles("ke_numbers", ke_numbers[i].recid).data;
                                for(var j= 0; j < uin_files.length; j++){
                                    //Наполнение массива для отправки файлов в другой рдев
                                    if(uin_files[j].columnName == "barcode"){
                                        var fileUrl = String().concat(host, "/api/files/download/", uin_files[j].recId);
                                        uinFilesForOuterRdev.push({
                                            recId: uin_files[j].recId,
                                            entityId: ke_numbers[i].recid,
                                            entityName: "ke_numbers",
                                            columnName: uin_files[j].columnName,
                                            description: uin_files[j].recDescription,
                                            file: {
                                                "name": uin_files[j].recName, "url": fileUrl   
                                            }
                                        })
                                    }
                                }
                            }
                        }
        
                        //Отправка файлов в арм производителя
                        var files_upload_res = upload_files_to_outer_rdev(table_app_fields.host, uinFilesForOuterRdev);
                        if(!files_upload_res.success){
                            return files_upload_res;
                        }
                    }
                }else{
                    return badResp("Не удалось установить адрес получателя файлов");
                }
            }
        }
    }

    if (title == "Уведомление о поступлении заявления на учет СЧ/СЕ"){
        //Отправка сообщения владельцу
        var send_mail_result = send_email(email_owner, title, body_owner, [archive]);
        if(!send_mail_result.success){
            // вызываем алгоритм создания задачи на повторную рассылку
            create_send_mail_task(email_owner, title, body_owner, archive.toString(), recid_application, table_application);
        }

        //Удаление созданного архива
        // delete_files(archive);

        //Отправка всех файлов с формы в рдев росжелдора
        var all_attached_files = getattachedfiles(table_application, recid_application);
        if(!all_attached_files.success){
            return all_attached_files;
        }
        var files_to_upload = [];
        var all_attached_files = all_attached_files.data;
        for(var i = 0; i < all_attached_files.length; i++){
            if(all_attached_files[i].columnName != 'files'){
                var fileUrl = String().concat(host, "/api/files/download/", all_attached_files[i].recId);
                files_to_upload.push({
                    recId: all_attached_files[i].recId,
                    entityId: recid_application,
                    entityName: table_application,
                    columnName: all_attached_files[i].columnName,
                    description: all_attached_files[i].recDescription,
                    file: {
                        "name": all_attached_files[i].recName, "url": fileUrl   
                    }
                });
            }
        }

        // получение адреса росжелдора
        var rzd_url = get_rzd_urls_portal_settings();
        if(rzd_url.success){
            var files_upload_res = upload_files_to_outer_rdev(rzd_url.rzd_name_url, files_to_upload);
            if(!files_upload_res.success){
                files_upload_res.message = String().concat("recid: ", recid_application, ", Ошибка отправки файлов во внешнюю систему: ", files_upload_res.message);
                return files_upload_res;
            }
        }
        // Если письмо отправлено успешно, то меняем статус на Отправлено в Росжелдор
        table_app_fields.status = "20b9d598-ea5b-4508-b0ce-c13d54d65944";
        var updres = db.update(table_application, table_app_fields);
        if(!updres){
            return badResp("Не удалось обновить запись заявления");
        }
    }

    if (title == "Уведомление о принятии решения по заявлению на учет СЧ/СЕ"){

        //Определение имени хоста
        var hostnames = db.findbyparams("dictionary_host_names", {recstate: 1});
        if(isEmptyOrNullArray(hostnames)){        
            errorLog("send_application_result", "Не удалось определить адрес хоста, обратитесь к администратору за решением проблемы");
            return badResp("Не удалось определить адрес хоста, обратитесь к администратору за решением проблемы");
        }
        var hostname = hostnames[0].recname;
        
        //Удаление созданного архива
        // delete_files(archiveRecid);

        //Отправка файла с результатом в арм производителя
        var files_to_upload = [];

        var all_attached_files = getattachedfiles(table_application, recid_application);
        if(!all_attached_files.success){
            return all_attached_files;
        }

        var all_attached_files = all_attached_files.data;
        for(var i = 0; i < all_attached_files.length; i++){
            if(all_attached_files[i].columnName == "result_file"){
                var fileUrl = String().concat(host, "/api/files/download/", all_attached_files[i].recId);
                files_to_upload.push({
                    recId: all_attached_files[i].recId,
                    entityId: recid_application,
                    entityName: table_application,
                    columnName: all_attached_files[i].columnName,
                    description: all_attached_files[i].recDescription,
                    file: {
                        "name": all_attached_files[i].recName, "url": fileUrl   
                    }
                });
            }
        }

        // Обновление статуса
        // Статус результат отправлен владельцу
        table_app_fields.status = "56b4391b-82bc-42b5-a466-91d21db8022b";
        var updres = db.update(table_application, table_app_fields);
        if(!updres){
            return badResp("Не удалось обновить запись заявления");
        }

        // Получение настройки, которая разрешает/запрещает передачу между армами
        var transfer_setting = get_transfer_between_arms_portal_settings();
        if (!transfer_setting.success){
            return transfer_setting;
        }
        if (transfer_setting.is_transfer_between_arms){
            //Получение адреса АРМ росжелдора
            var rzd_url = get_rzd_urls_portal_settings();
            if(!rzd_url.success){
                return rzd_url;
            }

            if(host == rzd_url.rzd_ip_url || host == rzd_url.rzd_name_url){
                if(!isEmptyString(table_app_fields.host)){
                    if(hostname != table_app_fields.host){
                        //Отправка файлов в арм производителя
                        var files_upload_res = upload_files_to_outer_rdev(table_app_fields.host, files_to_upload);
                        if(!files_upload_res.success){
                            event.log("send_mail", null, "ОШИБКА", 1, files_upload_res);
                            
                        }
                        //Обновление записи в арме производителя
        
        
                        //Обновление записи с заявлением
                        var headers = {
                            "Content-Type": "application/json"
                        }
                        var url = String().concat(table_app_fields.host, "/api/anonym");
                        var update_request_params = {
                            method: "update_entity_static",
                            fields: {
                                table: table_application,
                                entity: table_app_fields
                            }
                        }
        
                        var sendrequestresult = sendRequest("POST", headers, url, JSON.stringify(update_request_params));
                        if(isNullObject(sendrequestresult)){
                            return badResp("Не удалось отправить результат в арм " + table_app_fields.host);
                        }
                    }
                }
            }
        }
    }
}

//Объект для работы с вызовами плагинов из js кода
var plugins = {
    /**
     * Вызов плагина как метода
     * @param {*} path Путь к методу 
     * @param {*} httpMethod Тип HTTP запроса
     */
    callAsMethod: function(path, httpMethod, body, headers){

        httpMethod = httpMethod.toUpperCase()

        var url = String().concat(host, path)

        if(isNullObject(headers)){
            headers = {
                "Content-Type": "application/json"
            };
        }
        headers = addAuthHeader(headers);

        if(body == null){
            if(httpMethod == "POST"){
                body = {}
            }
        }else{
            if(httpMethod == "GET"){
                body = null;
            }
        }

        var res = fetch(url, {
            headers: headers,
            body: JSON.stringify(body),
            Method: httpMethod
        });

        if (isNotEmptyString(res.data)) {
            var data = JSON.parse(res.data)

            if (data.success) {
                return {
                    success: data.success,
                    message: data.message,
                    data: data.data
                }
            } else {
                return {
                    success: data.success,
                    message: data.message,
                }
            }
        } else {
            return {
                success: res.success,
                message: res.message,
                data: null
            }
        }
    },

    /**
     * Вызов метода плагина как фоновой задачи
     * @param {*} path Путь к методу плагина
     * @param {*} httpMethod   HTTP-метод
     * @param {*} body  Тело запроса
     * @param {*} headers Заголовки запроса
     */
    callAsShadowTask: function(path, httpMethod, body, headers){
        httpMethod = httpMethod.toUpperCase()

        var url = String().concat(host, path)

        if(isNullObject(headers)){
            headers = {
                "Content-Type": "application/json"
            };
        }
        headers = addAuthHeader(headers);

        if(body == null){
            if(httpMethod == "POST"){
                body = {}
            }
        }else{
            if(httpMethod == "GET"){
                body = null;
            }
        }

        var res = fetch(url, {
            headers: headers,
            "body": JSON.stringify(body),
            "Method": httpMethod
        });
    
        if(isNotEmptyString(res.data)){
            var data = JSON.parse(res.data)
            if(data.success){
                return {
                    success: data.success,
                    message: "",
                    data: JSON.stringify(data)
                }
            }else{
                return {
                    success: data.success,
                    message: data.message,
                    data: JSON.stringify(data)
                }
            }
        }else{
            return {
                success: res.success,
                message: res.message,
                data: null
            }
        }
    }

}

// Метод получения списка email для рассылки из portal_settings (Настройки портала)
function get_emails_for_mailing_portal_settings(){
    // получение список email для рассылки
    var portal_settings_fields = db.findbyparams("portal_settings", {
        recstate: 1,
        is_active: true,
        key: "email_for_mailing_rzd"
    });

    if(isEmptyOrNullArray(portal_settings_fields)){
        return badResp("Не удалось получить email по ключу \"email_for_mailing_rzd\", проверьте состояние поля \"Вкл/Выкл\" в portal_settings");
    }
    var email_list = [];
    for(var i = 0; i < portal_settings_fields.length; i++){
        var email = portal_settings_fields[i].value;    
        email_list.push(email);
    }
    return {
        success: true,
        data : email_list
    };
}

// Метод получения адресов армов производителя из portal_settings (Настройки портала)
function get_manufacturer_urls_portal_settings(){
    // получение список url арма производителя
    var portal_settings_fields = db.findbyparams("portal_settings", {
        recstate: 1,
        is_active: true,
        key: "url_manufacturer_arm"
    });

    if(isEmptyOrNullArray(portal_settings_fields)){
        return badResp("Не удалось получить адрес АРМ производителя по ключу \"url_manufacturer_arm\"");
    }
    var url_arm_list = [];
    for(var i = 0; i < portal_settings_fields.length; i++){
        var url = portal_settings_fields[i].value;    
        url_arm_list.push(url);
    }
    return {
        success: true,
        data : url_arm_list
    };
}

// Метод получения адресов армов росжелдора из portal_settings (Настройки портала)
function get_rzd_urls_portal_settings(){
    // получение адрес росжелдора по днс 
    var portal_settings_fields = db.findbyparams("portal_settings", {
        recstate: 1,
        is_active: true,
        key: "name_url_rzd_arm"
    });

    if(isEmptyOrNullArray(portal_settings_fields)){
        return badResp("Не удалось получить адрес АРМ Росжелдора (по dns имени) по ключу \"name_url_rzd_arm\"");
    }
    // адрес росжелдора по днс имени
    var rzd_name_url = portal_settings_fields[0].value;

    // получение адрес росжелдора по ip
    var portal_settings_fields = db.findbyparams("portal_settings", {
        recstate: 1,
        is_active: true,
        key: "ip_url_rzd_arm"
    });

    if(isEmptyOrNullArray(portal_settings_fields)){
        return badResp("Не удалось получить адрес АРМ Росжелдора (по ip) по ключу \"ip_url_rzd_arm\"");
    }
    // адрес росжелдора по ip
    var rzd_ip_url = portal_settings_fields[0].value;

    return {
        success: true,
        rzd_name_url : rzd_name_url,
        rzd_ip_url : rzd_ip_url
    };
}

/**
 * Функция добавления задачи на повторную отправку post/get (PutDoc,GetDoc) запроса в электронный инспектор в случае ошибочной первоначальной отправки
 * @param {*} recid // recid партии
 * @param {*} method // тип запроса
 * @param {*} url // url на запрос к API
 * @param {*} request_options // headers, body
 */
function create_request_task(recid, method, url, request_options){
    // Создаем пустую запись в send_request_tasks
    var new_task_record = db.insert("send_request_tasks", {recstate: 1});
    if(isNullObject(new_task_record)){
        return badResp("Ошибка создания задачи на повторную отправку запроса в send_request_tasks");
    }
    // Вызываем алгоритм расчета даты следующей отправки
    // если выполняется post запрос, то calculated_next_date_post, если get запрос, то calculated_next_date_get
    var date_resend;
    switch (method) {
        case "POST":
            date_resend = calculated_next_date_post(new_task_record.reccreated, new_task_record.date_resend);
            break;
        case "GET":
            date_resend = calculated_next_date_get(new_task_record.reccreated, new_task_record.date_resend);
            break;
        default:
            break;
    }

    // Обновление параметров для повторной отправки 
    new_task_record.batch_recid = recid;
    new_task_record.method = method;
    new_task_record.request_options = request_options;
    new_task_record.url = url;
    new_task_record.date_resend = date_resend;
    new_task_record.is_send = false;
    new_task_record.is_completed = false;

    var new_task_record_update = db.update("send_request_tasks", new_task_record);
    
    if (!new_task_record_update){
        return badResp("Не удалось обновить задачу на повторную отправку запроса в Электронный инспектор");
    }
    return new_task_record_update;
}

/**
 * Вычисление даты следующей отправки POST запроса во внешнюю систему Цифровой инспектор
 * @param {*} date_start_send // Дата/время начала отправки
 * @param {*} date_resend  // дата последней попытки из send_request_tasks
 */
function calculated_next_date_post(date_start_send, date_resend){

    if (date_resend == null){
        date_resend = new Date(date_start_send);
        date_resend = new Date(date_resend.getFullYear(), date_resend.getMonth(), date_resend.getDate(), date_resend.getHours(), date_resend.getMinutes(), 0);
        date_resend.setMilliseconds(0);
        date_resend.setMinutes(date_resend.getMinutes() + 15);
    } else {
        // окончание даты отправки каждые 15 мин
        var end_every_hour_date = new Date(date_start_send);
        end_every_hour_date = new Date(end_every_hour_date.getFullYear(), end_every_hour_date.getMonth(), end_every_hour_date.getDate(), end_every_hour_date.getHours(), end_every_hour_date.getMinutes(), 0);
        end_every_hour_date.setMilliseconds(0);
        end_every_hour_date.setMinutes(end_every_hour_date.getMinutes() + 60);

        date_resend = new Date(date_resend);
        date_resend = new Date(date_resend.getFullYear(), date_resend.getMonth(), date_resend.getDate(), date_resend.getHours(), date_resend.getMinutes(), 0);
        date_resend.setMilliseconds(0);

        if (date_resend.getTime() < end_every_hour_date.getTime()){
            date_resend.setMinutes(date_resend.getMinutes() + 15);
        } 
        else {
            // если кончились попытки
            // зануляем дату следующей отправки
            date_resend = null;
        }
    }
    return date_resend;

}

/**
 * Вычисление даты следующей отправки GET запроса во внешнюю систему Цифровой инспектор
 * @param {*} date_start_send // Дата/время начала отправки
 * @param {*} date_resend  // дата последней попытки из send_request_tasks
 */
function calculated_next_date_get(date_start_send, date_resend){

    if (date_resend == null){
        date_resend = new Date(date_start_send);
        date_resend = new Date(date_resend.getFullYear(), date_resend.getMonth(), date_resend.getDate(), date_resend.getHours(), date_resend.getMinutes(), 0);
        date_resend.setMilliseconds(0);
        date_resend.setHours(date_resend.getHours() + 1);
    } else {
        // увеличиваем дату следующей отправки на 30 мин
        date_resend = new Date(date_resend);
        date_resend = new Date(date_resend.getFullYear(), date_resend.getMonth(), date_resend.getDate(), date_resend.getHours(), date_resend.getMinutes(), 0);
        date_resend.setMilliseconds(0);
        date_resend.setMinutes(date_resend.getMinutes() + 30);
    }
    return date_resend;
}


/**
 * Обновление статуса в Ошибка подписания
 * @param {*} recid // recid записи партии
 * @param {*} is_success // успешно ли получен ответ
 */
function update_status_reestr_batch(recid, is_success){
    var reestr_batch_fields = db.findbyrecid("reestr_batch", recid);
    if(isNullObject(reestr_batch_fields)){
        return badResp("Не удалось получить запись партии");
    }

    switch (is_success) {
        case "true":
            // Меняем статус на "Подписание завершено"
            reestr_batch_fields.batch_status = "640adf70-20a7-48bd-93f5-75862c7ae1b0";
            break;
        case "false":
            // Меняем статус на "Ошибка подписания"
            reestr_batch_fields.batch_status = "553bf3ff-cd91-49e4-94d3-d06ff3ecb2be";
            break;
        default:
            break;
    }

    // Обновляем запись
    var reestr_batch_update_res = db.update("reestr_batch", reestr_batch_fields);
    if(!reestr_batch_update_res){
        return badResp("Не удалось обновить статус партии");
    }
}

// функция для получения адреса АС Электронный инспектор из portal_settings (Настройки портала)
function get_settgins_for_electronic_inspector(){
    // получение адрес АС Электронный инспектор
    var portal_settings_fields = db.findbyparams("portal_settings", {
        recstate: 1,
        is_active: true,
        key: "electronic_inspector_url"
    });

    if(isEmptyOrNullArray(portal_settings_fields)){
        return badResp("Не удалось получить адрес по ключу \"electronic_inspector_url\"");
    }
    var electronic_inspector_url = portal_settings_fields[0].value;

    // получение APIKEY для авторизации в АС Электронный инспектор
    var portal_settings_fields = db.findbyparams("portal_settings", {
        recstate: 1,
        is_active: true,
        key: "electronic_inspector_apikey"
    });

    if(isEmptyOrNullArray(portal_settings_fields)){
        return badResp("Не удалось получить адрес по ключу \"electronic_inspector_apikey\"");
    }
    var electronic_inspector_apikey = portal_settings_fields[0].value;

    // получение Authorization (логин, пароль) для авторизации в АС Электронный инспектор
    var portal_settings_fields = db.findbyparams("portal_settings", {
        recstate: 1,
        is_active: true,
        key: "electronic_inspector_authorization"
    });

    if(isEmptyOrNullArray(portal_settings_fields)){
        return badResp("Не удалось получить адрес по ключу \"electronic_inspector_authorization\"");
    }
    var electronic_inspector_authorization = portal_settings_fields[0].value;

    return {
        success: true,
        electronic_inspector_url : electronic_inspector_url,
        electronic_inspector_apikey : electronic_inspector_apikey,
        electronic_inspector_authorization : electronic_inspector_authorization
    };
}
// Метод получения настройки, которая разрешает/запрещает отправку между АРМами
function get_transfer_between_arms_portal_settings(){
    // Получение флага transfer_between_arms
    var portal_settings_fields = db.findbyparams("portal_settings", {
        recstate: 1,
        key: "transfer_between_arms"
    });

    if(isEmptyOrNullArray(portal_settings_fields)){
        return badResp("Не удалось получить настройку, которая разрешает/запрещает отправку между АРМами по ключу \"transfer_between_arms\"");
    }

    var is_transfer_between_arms = portal_settings_fields[0].is_active;

    return {
        success: true,
        is_transfer_between_arms: is_transfer_between_arms
    }
}


/**
 * Обновление связанных записей заявления при отправке в Росжелдор
 * @param {*} key_elements_list Список СЧ к учету
 * @param {*} node_list Список СЕ к учету
 */
function update_relations_records(key_elements_list, node_list){
    if (key_elements_list.length > 0){
        for (var i = 0; i < key_elements_list.length; i++) {
            // Получаем запись СЧ
            var record = db.findbyrecid("reestr_key_elements", key_elements_list[i]);
            if (isNullObject(record)){
                return badResp("Не удалось получить запись СЧ");
            }
            // Обновляем recupdated
            record.recupdated = new Date();
            var update_result = db.update("reestr_key_elements", record);
            if(!update_result){
                return badResp("Не удалось обновить recupdated записи СЧ");
            }
            
            // Получаем историю по СЧ
            var key_element_log = db.findbyparams("log", {
                reged_key_element: key_elements_list[i],
                recstate: 1
            })

            if (isEmptyOrNullArray(key_element_log)){
                return badResp("Ошибка получения записей в log по СЧ " + record.numberke)
            }

            //Обновляем recupdated у связанных записей с текущим СЧ в таблице log
            for (var k = 0; k < key_element_log.length; k++) {
                var record_log = db.findbyrecid("log", key_element_log[k].recid);
                if (isNullObject(record_log)){
                    return badResp("Не удалось получить запись в log");
                }
                record_log.recupdated = new Date();
                var update_result = db.update("log", record_log);
                if (!update_result){
                    return badResp("Не удалось обновить recupdated записи log");
                }
            }
        }
    }
    if (node_list.length > 0){
        for (var i = 0; i < node_list.length; i++) {
            // Получаем запись СЕ
            var record = db.findbyrecid("reestr_ke_nodes", node_list[i]);
            if (isNullObject(record)){
                return badResp("Не удалось получить запись СЕ");
            }
            // Обновляем recupdated
            record.recupdated = new Date();
            var update_result = db.update("reestr_ke_nodes", record);
            if(!update_result){
                return badResp("Не удалось обновить recupdated записи СЕ");
            }
            
            // Получаем историю по СЕ
            var node_element_log = db.findbyparams("node_log", {
                nodeid: node_list[i],
                recstate: 1
            })

            if (isEmptyOrNullArray(node_element_log)){
                return badResp("Ошибка получения записей в node_log по СЕ " + record.readonly_ke_node)
            }

            //Обновляем recupdated у связанных записей с текущим СЧ в таблице log
            for (var k = 0; k < node_element_log.length; k++) {
                var record_node_log = db.findbyrecid("node_log", node_element_log[k].recid);
                if (isNullObject(record_node_log)){
                    return badResp("Не удалось получить запись в node_log");
                }
                record_node_log.recupdated = new Date();
                var update_result = db.update("node_log", record_node_log);
                if (!update_result){
                    return badResp("Не удалось обновить recupdated записи node_log");
                }
            }
        }
    }
    return {
        success: true,
        message: "Успех" 
    }
}

/**
 * Создание записи истории в указанном АРМе
 * @param {*} table_name Название таблицы для вставки
 * @param {*} object Сущность истории
 * @param {*} host Хост АРМа
 */
function MakeLogRecord(table_name, object, host){
    var headers = {
        "Content-Type": "application/json"
    }
    var url = String().concat(host, "/api/anonym");
    var insert_request_params = {
        method: "insert_entity_static",
        fields: {
            table: table_name,
            entity: object
        }
    }

    var sendrequestresult = sendRequest("POST", headers, url, JSON.stringify(insert_request_params));

    if(isNullObject(sendrequestresult)){
        return badResp("Не удалось создать запись истории в арме " + host);
    }

    var make_event_to_confirm_queue_params = {
        table: table_name,
        log_item: object,
        log_recid: sendrequestresult.result.recid
    }

    //Вызываем метод из плагина
	var res = plugins.callAsMethod("/plugins/nbdlogicplugin/makeeventtoconfirmqueue", "post", make_event_to_confirm_queue_params, null);
    if (!res.success){
        return badResp("Не удалось создать запись в очередь \"на подтверждение\" от Арбитра.")
    }
}

//Получить uri, логин/пароль блокчейна
function GetBlockchainData(){
    //Получение адреса блокчейна из таблицы Локальные данные узла блокчейна
    var blockchainRecords = db.findbyparams( "local_data_node_blockchain",
    {"recstate" : "1"});
    if(isEmptyOrNullArray(blockchainRecords)){
        return badResp("Не удалось получить данные для авторизации в блокчейне");
    }
    var blockchainData = {
        nodeip: String().concat("https://", blockchainRecords[0].ip_address, "/"),
        login: blockchainRecords[0].login,
        password: blockchainRecords[0].password
    };

    if(isEmptyString(blockchainData.nodeip) || isEmptyString(blockchainData.login) || isEmptyString(blockchainData.password)){
        return badResp("Не удалось получить данные для авторизации в блокчейне");
    }
    return successResp("", blockchainData);
}

/**
 * Создание записи в указанном АРМе
 * @param {*} table_name Название таблицы для вставки
 * @param {*} object Сущность записи
 * @param {*} host Хост АРМа
 */
function InsertRecordToOuterRdev(table_name, object, host){
    var headers = {
        "Content-Type": "application/json"
    }
    var url = String().concat(host, "/api/anonym");
    var insert_request_params = {
        method: "insert_entity_static",
        fields: {
            table: table_name,
            entity: object
        }
    }

    var sendrequestresult = sendRequest("POST", headers, url, JSON.stringify(insert_request_params));
    if(isNullObject(sendrequestresult)){
        return badResp("Не удалось создать запись в арме " + host);
    }
    return successResp();
}

/**
 * Обновление записи в указанном АРМе
 * @param {*} table_name Название таблицы для вставки
 * @param {*} object Сущность записи
 * @param {*} host Хост АРМа
 */
function UpdateRecordToOuterRdev(table_name, object, host){
    var headers = {
        "Content-Type": "application/json"
    }
    var url = String().concat(host, "/api/anonym");
    var update_request_params = {
        method: "update_entity_static",
        fields: {
            table: table_name,
            entity: object
        }
    }

    var sendrequestresult = sendRequest("POST", headers, url, JSON.stringify(update_request_params));
    if(isNullObject(sendrequestresult)){
        return badResp("Не удалось обновить запись в арме " + host);
    }
    return successResp();
}
/**
 * Удаление записи в указанном АРМе
 * @param {*} table_name Название таблицы для вставки
 * @param {*} recid Идентификатор записи
 * @param {*} host Хост АРМа
 */
function DeleteRecordToOuterRdev(table_name, recid, host){
    var headers = {
        "Content-Type": "application/json"
    }
    var url = String().concat(host, "/api/anonym");
    var delete_request_params = {
        method: "delete_entity_static",
        fields: {
            table: table_name,
            recid: recid
        }
    }

    var sendrequestresult = sendRequest("POST", headers, url, JSON.stringify(delete_request_params));
    if(isNullObject(sendrequestresult)){
        return badResp("Не удалось удалить запись в арме " + host);
    }
    return successResp();
}


//функция для проверки роли и получения разрешения на валидацию полей профился
function ischeckfields(){
    var current_user = getcurrentuser();
    var unverifiableGroups = ["MassControllers", "reports_operators", "Deleters"];

    //Проверка роли
    for (var i = 0; i < current_user.groups.length; i++)
    {
        if (unverifiableGroups.indexOf(current_user.groups[i].recname) != -1) {
			return false;
		}
    }
    return true
}