//Метод забора сообщений со шлюза
function get_gateway_incoming(params) {
    return plugins.callAsShadowTask(
        "/plugins/licenselogicplugins/getgatewaymessages",
        "post",
        null,
        null
    );
}

//Метод подтверждения сообщения на шлюзе
function confirm_gateway_message(params) {
    return plugins.callAsShadowTask(
        "/plugins/licenselogicplugins/confirmgatewaymessage",
        "post",
        null,
        null
    );
}

// Метод отправки статусов о регистрации заявлений на шлюз
function send_registeration_status_application_to_gateway(params) {
    return plugins.callAsShadowTask(
        "/plugins/licenselogicplugins/sendapplicationregistrationstatus",
        "post",
        null,
        null
    );
}

// Метод отправки неотправленных промежуточных комментариев на шлюз
function send_unsent_interim_notification_to_gateway(params) {
    return plugins.callAsShadowTask(
        "/plugins/licenselogicplugins/sendunsentinterimnotificationtogateway",
        "post",
        null,
        null
    );
}

// Метод опроса шлюза на предмет полученных ответов на запросы
function gateway_pending_requests_task(params) {
    return plugins.callAsShadowTask(
        "/plugins/licenselogicplugins/gateway_pending_requests",
        "post",
        null,
        null
    );
}

// Метод запроса информации о начислении
function request_info_about_accrual(params) {
    return plugins.callAsShadowTask(
        "/plugins/licenselogicplugins/requestinfoaboutaccrual",
        "post",
        null,
        null
    );
}

// Метод для отправки сообщений на email
function send_mail_task(params) {
    return plugins.callAsShadowTask(
        "/plugins/licenselogicplugins/sendmail",
        "post",
        null,
        null
    );
}

// Метод для отправки запросов на шлюз, которые не получилось отправить ранее
function send_unsent_requests_to_gateway(params) {
    return plugins.callAsShadowTask(
        "/plugins/licenselogicplugins/send_unsent_requests_to_gateway",
        "post",
        null,
        null
    );
}

// Метод для сбора и добавления сообщений в очередь для отправки на почту
function check_license_expiration(params) {
    return plugins.callAsShadowTask(
        "/plugins/licenselogicplugins/license_register/check_license_expiration",
        "post",
        null,
        null
    );
}

// Метод для отправки сообщений из очереди в личный кабинет РПГУ
function notify_license_termination_rpgu(params) {
    return plugins.callAsShadowTask(
        "/plugins/licenselogicplugins/rpgu_interaction/send_notifications",
        "post",
        null,
        null
    );
}