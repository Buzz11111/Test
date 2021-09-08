function isEmptyString(value) {
    return (value == null || value === "undefined" || value === "" || value.length === 0);
}

function isNotEmptyString(value) {
    return (value != null && value !== "undefined" && value !== "" && value.length !== 0);
}

function isNullObject(value) {
    return (value == null || value === "undefined" || !value || Object.keys(value).length === 0);
}

function isNotNullObject(value) {
    return (value != null && value !== "undefined" && value && Object.keys(value).length !== 0);
}

function isEmptyOrNullArray(value) {
    return (!value || value == null || value === "undefined" || value.length <= 0);
}

function isNotEmptyOrNullArray(value) {
    return (value && value != null && value !== "undefined" && value.length > 0);
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
            if (!!data.result) data = data.result;
            if (data.success) {
                return {
                    closeForm: data.closeForm,
                    success: data.success,
                    message: data.message,
                    data: data.data
                }
            } else {
                return {
                    closeForm: data.closeForm,
                    success: data.success,
                    message: data.message,
                    data: data.data
                }
            }
        } else {
            return {
                closeForm: true,
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


/**
 * Метод для возврата ответа с ошибкой
 * @param {*} message Сообщение
 * @param {*} data Данные
 */
function badResp(message, data) {
    return {
        success: false,
        message: message,
        data: data
    };
}

/**
 * Метод для возврата ответа с успехом
 * @param {*} message Сообщение
 * @param {*} data Данные
 */
function successResp(message, data) {
    return {
        success: true,
        message: message,
        data: data
    };
}

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

/**
 * Получение приложенных файлов в таблице по наименованию таблицы, колонки и идентификатору записи, в которой нужно искать приложенный файл
 * @param {*} table_name        Наименование таблицы
 * @param {*} column_name       Наименование колонки с файлом
 * @param {*} recid             Идентификатор записи
 */
function getattachedfilesincolumn(table_name, column_name, recid){
    
    var files_record = getattachedfiles(table_name, recid);
    var files_records_data = files_record.data;
    if(isEmptyOrNullArray(files_records_data)){
        // errorLog("getattachedfileincolumn", "Не найдено ни одного файла в таблице recid: " + recid);
        return {
            success: false,
            message: "Не найдено ни одного файла в таблице"
        }
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

