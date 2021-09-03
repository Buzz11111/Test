/**
 * Объект-обертка возвращаемого результата выполнения фоновой задачи в нужном формате
 */
autosendmailresult = {
	/**
	 * Метод возвращающий успешный результат выполнения фоновой задачи
	 * @param {*} data - данные которые необходимо вернуть из фоновой задачи. 
	 * Попадают в rdev___shadow_tasks.content
	 */
	success: function(data){
		event.log("autosendmail", null, "Фоновая задача выполнена успешно", 1, data);
		return {
			success: true,
			message: "",
			data: data
		};
	},
	/**
	 * Метод возвращающий результат с ошибкой выполнения фоновой задачи
	 * @param {*} message - сообщение об ошибке
	 */
	error: function(message){
		event.log("autosendmail", null, "Фоновая задача выполнена с ошибкой", 4, message);
		return {
			success: false,
			message: message,
			data: null
		};
	}
};

/**
 * Объект отвечающий за запросы к API синхронизации на RDEV
 */
syncapi = {
	/**
	 * Метод затягивает изменения из удаленного узла синхронизации
	 * @param {*} id - идентификатор настройки узла синхронизации
	 */
	pull: function(id){
		var url = String().concat(host, "/pull/", id);

		var result = fetch(url, {
			method: "GET",
			headers: addAuthHeader(null),
			body: null
		});

		if(!result.Success){
			throw new Error(result.Message);
		}

		return JSON.parse(result.Data);
	}
};

/**
 * Фоновая задача для повторной рассылки писем
 */
function autosendmail(){
	var logObjectName = "autosendmail";
	try{
		event.log(logObjectName, null, "Выполняем фоновую задачу по автоматической повторной отправки писем", 1, null);
		event.log(logObjectName, null, "Получаем список задач на выполнения повторной отправки писем", 1, null);

		// Получаем список задач на выполнения повторной отправки писем
		// задачи на отправку писем из send_mail_tasks, которые не отправлены IsSend = false и еще не се попытки прошли IsCompteted = false
		var sendTasks = db.findbyparams("send_mail_tasks", { 
			recstate: 1,
			is_send: false,
			is_completed: false
		 });

		event.log(logObjectName, null, "Метод получения списка задач успешно выполнен", 1, sendTasks);

		// Если отсутствуют задачи на повторную отправку
		if(sendTasks == null){
			return autosyncresult.success("Отсутствуют задачи на повторную отправку писем. Фоновая задача была завершена.");
		}
		
		event.log(logObjectName, null, "Выполняем отправку каждой полученной задачи", 1, null);

		// Выполняем цикл по задач на повторную отправку
		for(var i = 0; i < sendTasks.length; ++i){
			var sendTask = sendTasks[i];

			/*
			// для тестирования выполняем логирование
			var sendTaskParamsTests = {
				recname: sendTask.recname,
				title: sendTask.title,
				recdescription: sendTask.recdescription,
				recid_app: sendTask.id_application, 
				table_app: sendTask.table_application
			}

			//создаем запись в таблице логов send_mail_tasks_log	
			send_mail_tasks_log(sendTaskParamsTests);
			*/
			// Сравниваем текующую дату с датой следующей отправки
			// Получаем текущую дату
			var nowDate;
			/* if (sendTask.current_date == null){ */
				nowDate = new Date();
			/* } else {
				nowDate = new Date(sendTask.current_date);
			} */
			//var nowDate = new Date();
			nowDate = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), nowDate.getHours(), nowDate.getMinutes(), 0);
			nowDate.setMilliseconds(0);

			// Получаем дату следующей отправки
			var date_resend = new Date(sendTask.date_next_sending);
			date_resend = new Date(date_resend.getFullYear(), date_resend.getMonth(), date_resend.getDate(), date_resend.getHours(), date_resend.getMinutes(), 0);
			date_resend.setMilliseconds(0);

			// логирование в send_mail_tasks_log
			/* send_mail_tasks_log({
				now_date: nowDate, 
				date_resend: date_resend,
				recid_app: sendTask.id_application, 
				table_app: sendTask.table_application
			}); */

			// сравниваем даты
			if(nowDate.getTime() >= date_resend.getTime()){

				// логирование в send_mail_tasks_log
				/* send_mail_tasks_log({
					now_date: nowDate, 
					date_resend: date_resend,
					is_compared: true,
					recid_app: sendTask.id_application, 
					table_app: sendTask.table_application
				}); */

				event.log(logObjectName, null, "Отправляем письмо повторно", 1, sendTask);
				
				//Отправки письма
				var send_mail_result = send_email(sendTask.email, sendTask.subject, sendTask.body, [sendTask.arhive_recid]);
				
				// если снова не успешно
				if(!send_mail_result.success){

					event.log(logObjectName, null, "Повтороная отправка выполнена с ошибкой, выполняется вычисление даты следующей отправки", 1, sendTask);

					// Обновляем дату следующей отпавки
					// вызываем алгоритм расчета даты/времени следующей отправки
					var date_resend_param = calculated_next_date(sendTask.reccreated, sendTask.date_next_sending);

					// логирование в send_mail_tasks_log
					/* send_mail_tasks_log({
						message_error_send: "Была ошибка отправки, расчет даты следующей отправки", 
						date_resend: date_resend_param,
						recid_app: sendTask.id_application, 
						table_app: sendTask.table_application
					}); */

					if (date_resend_param == null){
						// логирование в send_mail_tasks_log
						/* send_mail_tasks_log({
							message_error_send: "Кончились попытки отправки", 
							date_resend: date_resend_param,
							recid_app: sendTask.id_application, 
							table_app: sendTask.table_application
						}); */
						event.log(logObjectName, null, "Кончились попытки отправок", 1, sendTask);

						sendTask.is_send = false;
						sendTask.is_completed = true;	// окончание всех попыток отправок

						// Обновление статуса заявления в "Ошибка отправки"
						update_status_application(sendTask.recid_application, sendTask.table_application, sendTask.subject);
					} else {
						//Формирование параметров для обновления задачи на повторную отправку
						sendTask.is_send = false;
						sendTask.is_completed = false;	// окончание всех попыток отправок
					}

					sendTask.date_next_sending = date_resend_param;

					var result_update_send_mail_tasks = db.update("send_mail_tasks", sendTask)

					if(!result_update_send_mail_tasks){
						return badResp("Не удалось обновить задачу на повторную отправку писем в send_mail_tasks");
					}

					event.log(logObjectName, null, "Дата следующей отправки успешно обновлена", 1, sendTask);
					
				} else {
					// логирование в send_mail_tasks_log
					/* send_mail_tasks_log({
						message_success_send: "Успешно отправилось", 
						date_resend: date_resend_param,
						recid_app: sendTask.id_application, 
						table_app: sendTask.table_application
					}); */
					//Формирование параметров для обновления задачи на завершение отправки
					sendTask.is_send = true,
					sendTask.is_completed = false;

					var result_update_send_mail_tasks = db.update("send_mail_tasks", sendTask)

					if(!result_update_send_mail_tasks){
						return badResp("Не удалось обновить задачу на завершение отправки писем в send_mail_tasks");
					}

					// Отправляем сообщение владельцу и делаем отправку файлов в другой рдев
					sending_notice_and_upload_files(sendTask.subject, sendTask.body, sendTask.email, sendTask.arhive_recid, sendTask.recid_application, sendTask.table_application);

					event.log(logObjectName, null, "Повтороная отправка успешно выполнена", 1, sendTask);
				}
			}
		}

		return autosendmailresult.success("Фоновая задача по повторной отправке писем выполнена успешно.");
	}catch(e){
		return autosendmailresult.error("Ошибка при выполнении фоновой задачи по повторной отправке: " + e + ".");
	}
}
