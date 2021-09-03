/**
 * Простановка позиций на вагоне ключевым элементам и промежуточным СЕ
 * @param {*} input_key_elements  Массив отсканированных СЧ
 * @param {*} input_assembly_units  Массив отсканированных СЕ
 * @param {*} vagon_axes 	осность вагона
 * @param {*} vagon_record 	Запись вагона
 */
function getAllKeyElementsWithPositionsOnVagon(input_key_elements, input_assembly_units, vagon_axes) {
	// Массив, который содержит входные СЧ + СЧ полученные из узлов
	var all_key_elements = [];
	// Массив, который содержит идентификаторы всех СЧ из all_key_elements
	var all_key_element_ids = [];
	// Массив идентификаторов всех обработанных узлов
	var ke_node_ids = [];
	// Массив промежуточных СЕ
	var intermediate_nodes = [];
	//Массив идентификаторов промежуточных СЕ
	var intermediate_nodes_ids = [];

	if (input_assembly_units != null && input_assembly_units.length > 0) {
		for (var i = 0; i < input_assembly_units.length; i++) {
			var input_assembly_unit = input_assembly_units[i];

			// Ищем все СЧ, которые относятся к данному СЕ
			var assembly_unit_key_elements_params = {
				ke_node: input_assembly_unit.recid
			};
			var assembly_unit_key_elements = db.findbyparams("reestr_key_elements", assembly_unit_key_elements_params);

			if (assembly_unit_key_elements == null || assembly_unit_key_elements.length == 0)
				continue;

			for (var j = 0; j < assembly_unit_key_elements.length; j++) {
				var key_element = assembly_unit_key_elements[j];

				// Получаем позицию на вагоне для установки текущего СЧ из СЕ
				var key_element_position_on_vagon_params = {
					key_element_code: key_element.key_element_code,
					position_node_on_vagon: input_assembly_unit.position_node_on_vagon
				};

				// Позиция в узле
				if (isNotEmptyString(key_element.position_on_node)) {
					key_element_position_on_vagon_params.position_on_node = key_element.position_on_node;
				}

				// Если вагон 4-осный, то указываем параметр for_four_axes_vagon = true
				if (vagon_axes == "4") {
					key_element_position_on_vagon_params.for_four_axes_vagon = true;
				}
				// Если вагон 6-осный, то указываем параметр for_six_axes_vagon = true
				else if (vagon_axes == "6") {
					key_element_position_on_vagon_params.for_six_axes_vagon = true;
				}

				// Определяем позицию на вагоне для установки текущего СЧ из СЕ
				var positions_on_vagon = db.findbyparams("dictionary_positions_on_vagon", key_element_position_on_vagon_params);
				if (positions_on_vagon == null || positions_on_vagon.length == 0) {
					return badResp("Для СЧ " + key_element.numberke + " из СЕ " + input_assembly_unit.unique_number + " не удалось определить позицию на вагоне.");
				}

				var position_on_vagon = positions_on_vagon[0];

				key_element.position_on_vagon = position_on_vagon.recid;
				key_element.position_on_vagon___value = position_on_vagon.recname;
				key_element.position_node_on_vagon = input_assembly_unit.position_node_on_vagon;

				all_key_elements.push(key_element);
				all_key_element_ids.push(key_element.recid);
			}
		}
	}

	// Проходим в цикле по объектам СЧ
	for (var i = 0; i < input_key_elements.length; i++) {
		var input_key_element = input_key_elements[i];
		// Если еще не обрабатывали текущий СЧ
		if (all_key_element_ids.indexOf(input_key_element.recid) == -1) {
			// Если СЧ относится к узлу
			if (isNotEmptyString(input_key_element.ke_node)) {
				// Находим узел по идентификатору 
				var reestr_ke_node = db.findbyrecid("reestr_ke_nodes", input_key_element.ke_node);
				if (isNullObject(reestr_ke_node)) {
					return badResp("Узел '" + input_key_element.ke_node + "' не найден в системе.");
				}

				// Если мы еще не обрабатывали найденный узел
				if (ke_node_ids.indexOf(reestr_ke_node.recid) == -1) {
					// Добавляем найденный узел в массив обработанных узлов
					ke_node_ids.push(reestr_ke_node.recid);

					var node_key_elements_params = {
						"ke_node": reestr_ke_node.recid
					};
					// По идентификатору узла находим все СЧ, которые связаны с ним
					var node_key_elements = db.findbyparams("reestr_key_elements", node_key_elements_params);

					// По идентификатору узла находим все дочерние СЕ, связанные с ним
					var node_child_nodes = db.findbyparams("reestr_ke_nodes", {
						parent_ke_node: reestr_ke_node.recid,
						assembly_element_type: "62b3559e-10da-4189-8b25-d558ba451ac8"
					});

					if (!isEmptyOrNullArray(node_child_nodes)) {
						//Получение СЧ нижнего уровня
						for (var j = 0; j < node_child_nodes.length; j++) {
							var node = node_child_nodes[j];

							var child_nodes = db.findbyparams("reestr_ke_nodes", {
								parent_ke_node: node.recid,
								assembly_element_type: "62b3559e-10da-4189-8b25-d558ba451ac8"
							});
							if (!isEmptyOrNullArray(child_nodes)) {
								for (var k = 0; k < child_nodes.length; k++) {
									var child_node = child_nodes[k];
									node_child_nodes.push(child_node);
								}
							}
						}

						//Получение истории сборки дочерних СЕ
						var child_nodes_assembly_history = {};
						for (var j = 0; j < node_child_nodes.length; j++) {
							var child_node = node_child_nodes[j];

							var child_node_assembly_history = db.findbyparams("nodes_assembly_history", {
								parent_node: child_node.recid
							});

							if (!isEmptyOrNullArray(child_node_assembly_history)) {
								child_nodes_assembly_history[child_node.recid] = child_node_assembly_history;
							}
						}
					}


					if (!!node_key_elements) {
						// Проверяем, что для СЧ указана "Позиция в узле"
						// if (isEmptyString(input_key_element.position_on_node)) {
						// 	return badResp("Для составной части с номером " + input_key_element.numberke + " не указана позиция в узле.");
						// }

						// Проводим проверку для входящего СЧ, что его можно установить на указанную позицию на вагоне
						// Получаем все доступные позиции на вагоне для текущего входного СЧ
						var positions_on_vagon_by_input_key_element_params = {
							// Наименование СЧ
							"key_element_code": input_key_element.key_element_code
						};

						// Позиция в узле
						if (isNotEmptyString(input_key_element.position_on_node)) {
							positions_on_vagon_by_input_key_element_params.position_on_node = input_key_element.position_on_node;
						}
						// Если вагон 4-осный, то указываем параметр for_four_axes_vagon = true
						if (vagon_axes == "4") {
							positions_on_vagon_by_input_key_element_params.for_four_axes_vagon = true;
						}
						// Если вагон 6-осный, то указываем параметр for_six_axes_vagon = true
						else if (vagon_axes == "6") {
							positions_on_vagon_by_input_key_element_params.for_six_axes_vagon = true;
						}
						// Определяем список доступных позиций на вагоне для текущего входного СЧ
						var positions_on_vagon_by_input_key_element = db.findbyparams("dictionary_positions_on_vagon", positions_on_vagon_by_input_key_element_params);

						var input_key_element_position_on_vagon = null;

						// Если не удалось определить список доступных позиций на вагоне, возвращаем ошибку
						if (isEmptyOrNullArray(positions_on_vagon_by_input_key_element)) {
							return badResp("составная часть с номером " + input_key_element.numberke + " нельзя установить на указанную позицию на вагоне.");
						}

						// Пытаемся в списке доступных позиций на вагоне найти позицию, 
						// которая была указана для текущего входного СЧ. Поиск проводится с учетом того, 
						// что у узла НЕ БЫЛА ИЗМЕНЕНА ОРИЕНТАЦИЯ
						for (var j = 0; j < positions_on_vagon_by_input_key_element.length; j++) {
							if (positions_on_vagon_by_input_key_element[j].recid == input_key_element.position_on_vagon) {
								input_key_element_position_on_vagon = positions_on_vagon_by_input_key_element[j];
								break;
							}
						}

						// // Если в списке доступных позиций на вагоне не удалось найти указанную позицию
						// if (isNullObject(input_key_element_position_on_vagon)) {
						// 	// Формируем альтернативный список доступных позиций на вагоне 
						// 	// (с учетом того, что БЫЛА ИЗМЕНЕНА ОРИЕНТАЦИЯ УЗЛА)
						// 	var alternative_positions_on_vagon_by_input_key_element = [];
						// 	for (var j = 0; j < positions_on_vagon_by_input_key_element.length; j++) {
						//         var alternative_position_on_vagon_params = {
						//             // Наименование СЧ
						//             "key_element_code": input_key_element.key_element_code,
						//             // Наименование позиции
						//             "recname": positions_on_vagon_by_input_key_element[j].alternative_position
						//         };
						// 		// Если вагон 4-осный, то указываем параметр for_four_axes_vagon = true
						// 		if (vagon_axes == "4") {
						// 			alternative_position_on_vagon_params.for_four_axes_vagon = true;
						// 		}
						// 		// Если вагон 6-осный, то указываем параметр for_six_axes_vagon = true
						// 		else if (vagon_axes == "6") {
						// 			alternative_position_on_vagon_params.for_six_axes_vagon = true;
						//         }
						// 		var alternative_positions_on_vagon = db.findbyparams("dictionary_positions_on_vagon", alternative_position_on_vagon_params);
						//         if (isEmptyOrNullArray(alternative_positions_on_vagon)) {
						// 			return badResp("Для позиции " + positions_on_vagon_by_input_key_element[j].recname + " не удалось определить обратную позицию.");
						// 		}

						// 		alternative_positions_on_vagon_by_input_key_element.push(alternative_positions_on_vagon[0]);
						//     }

						// 	// Пытаемся в АЛЬТЕРНАТИВНОМ списке доступных позиций на вагоне найти позицию, 
						// 	// которая была указана для текущего входного СЧ. Поиск проводится с учетом того, 
						// 	// что у узла БЫЛА ИЗМЕНЕНА ОРИЕНТАЦИЯ
						// 	for (var j = 0; j < alternative_positions_on_vagon_by_input_key_element.length; j++) {
						// 		if (alternative_positions_on_vagon_by_input_key_element[j].recid == input_key_element.position_on_vagon) {
						// 			input_key_element_position_on_vagon = alternative_positions_on_vagon_by_input_key_element[j];
						// 			break;
						// 		}
						//     }

						// 	// Если в списке доступных позиций на вагоне не удалось найти указанную позицию
						// 	if (isNullObject(input_key_element_position_on_vagon)) {
						// 		return badResp("составная часть с номером " + input_key_element.numberke + " нельзя установить на указанную позицию на вагоне.");
						// 	}
						// }
						// Конец проверки на то, что входящий СЧ можно установить на указанную позицию на вагоне

						var orientation_changed = false;

						// // Если у СЧ поле "Позиция в узле" не соответствует полю "Позиция в узле" для выбранной позиции на вагоне,
						// // значит изменена ориентация узла
						// if (isNotEmptyString(input_key_element.position_on_node)
						// 	&& input_key_element_position_on_vagon.position_on_node != input_key_element.position_on_node) {
						// 	orientation_changed = true;
						// }

						if (isNotEmptyString(input_key_element.position_on_node) && input_key_element_position_on_vagon.is_alternative) {
							orientation_changed = true;
						}
						// Получаем список позиций на вагоне для установки всех элементов узла
						var node_positions_on_vagon_params = {
							// Наименование СЧ
							//"key_element_code": input_key_element_position_on_vagon.key_element_code,
							// Позиция узла в вагоне
							"position_node_on_vagon": input_key_element_position_on_vagon.position_node_on_vagon,
							// Альтернативная позиция
							"is_alternative": orientation_changed
						};
						// Если вагон 4-осный, то указываем параметр for_four_axes_vagon = true
						if (vagon_axes == "4") {
							node_positions_on_vagon_params.for_four_axes_vagon = true;
						}
						// Если вагон 6-осный, то указываем параметр for_six_axes_vagon = true
						else if (vagon_axes == "6") {
							node_positions_on_vagon_params.for_six_axes_vagon = true;
						}
						var node_positions_on_vagon = db.findbyparams("dictionary_positions_on_vagon", node_positions_on_vagon_params);

						// // Если изменена ориентация узла
						// if (orientation_changed) {
						// 	// Проходим в цикле по всем СЧ из узла
						// 	for (var j = 0; j < node_key_elements.length; j++) {
						// 		var node_key_element = node_key_elements[j];
						// 		// Определяем позицию на вагоне для текущего СЧ из узла
						// 		for (var k = 0; k < node_positions_on_vagon.length; k++) {
						// 			// Если у текущей позиции на вагоне значение поля "Позиция в узле" равно значению поля
						// 			// "Позиция в узле" у текущего СЧ из узла 
						// 			if (node_positions_on_vagon[k].position_on_node == node_key_element.position_on_node
						// 				&& node_positions_on_vagon[k].key_element_code == node_key_element.key_element_code) {
						// 				// Необходимо определить обратную позицию на вагоне
						//                 var alternative_position_on_vagon_params = {
						//                     // Наименование СЧ
						//                     "key_element_code": node_key_element.key_element_code
						// 				};

						// 				// Наименование позиции
						// 				alternative_position_on_vagon_params.recname = isEmptyString(node_positions_on_vagon[k].alternative_position)
						// 					? node_positions_on_vagon[k].recname
						// 					: node_positions_on_vagon[k].alternative_position;

						// 				// Если вагон 4-осный, то указываем параметр for_four_axes_vagon = true
						// 				if (vagon_axes == "4") {
						// 					alternative_position_on_vagon_params.for_four_axes_vagon = true;
						// 				}
						// 				// Если вагон 6-осный, то указываем параметр for_six_axes_vagon = true
						// 				else if (vagon_axes == "6") {
						// 					alternative_position_on_vagon_params.for_six_axes_vagon = true;
						// 				}
						// 				// Определяем обратную позицию на вагоне для текущего СЧ
						// 				var alternative_positions_on_vagon = db.findbyparams("dictionary_positions_on_vagon", alternative_position_on_vagon_params);

						// 				node_key_element.position_on_vagon = alternative_positions_on_vagon[0].recid;
						// 				node_key_element.position_on_vagon___value = alternative_positions_on_vagon[0].recname;

						// 				node_key_element.position_node_on_vagon = alternative_positions_on_vagon[0].position_node_on_vagon;

						// 				break;
						// 			}
						// 		}

						// 		all_key_elements.push(node_key_element);
						// 		all_key_element_ids.push(node_key_element.recid);
						// 	}
						// }
						// // Иначе, если ориентация не была изменена
						// else {
						// Проходим в цикле по всем СЧ из узла
						for (var j = 0; j < node_key_elements.length; j++) {
							var node_key_element = node_key_elements[j];
							// Определяем позицию на вагоне для текущего СЧ из узла
							for (var k = 0; k < node_positions_on_vagon.length; k++) {
								if (node_positions_on_vagon[k].position_on_node == node_key_element.position_on_node
									&& node_positions_on_vagon[k].key_element_code == node_key_element.key_element_code) {
									node_key_element.position_on_vagon = node_positions_on_vagon[k].recid;
									node_key_element.position_on_vagon___value = node_positions_on_vagon[k].recname;
									node_key_element.position_node_on_vagon = node_positions_on_vagon[k].position_node_on_vagon;
									break;
								}
							}

							all_key_elements.push(node_key_element);
							all_key_element_ids.push(node_key_element.recid);
						}
						// }

						if (!isEmptyOrNullArray(node_child_nodes)) {
							for (var j = 0; j < node_child_nodes.length; j++) {
								var child_node = node_child_nodes[j];
								//Если СЕ не был обработан
								if (intermediate_nodes_ids.indexOf(child_node.recid) == -1) {
									//Если СЕ не триангель, обработка его СЧ и простановка позиций на их основе
									if (child_node.ke_node_type != "c790c624-b93e-498b-97ba-0fb47f8b4b52") {
										//Получение истории сборки этого узла
										var child_node_assembly_history = child_nodes_assembly_history[child_node.recid];
										if (isEmptyOrNullArray(child_node_assembly_history)) {
											return badResp("Для промежуточного узла не найдена история сборки");
										}
										//Проход по истории сборки узла
										for (var k = 0; k < child_node_assembly_history.length; k++) {
											var history_record = child_node_assembly_history[k];
											if (!isEmptyString(history_record.child_key_element)) {
												//Поиск СЧ в массиве СЧ с проставленными позициями на вагоне
												for (var l = 0; l < all_key_elements.length; l++) {
													var key_element = all_key_elements[l];
													if (key_element.recid == history_record.child_key_element && !isEmptyString(key_element.position_on_vagon)) {
														var middle_positions_on_vehicle = db.findbyparams("dictionary_node_middle_position_on_vehicle", {
															key_element_code: key_element.key_element_code,
															children_key_element_position: key_element.position_on_vagon
														});
														if (isEmptyOrNullArray(middle_positions_on_vehicle)) {
															return badResp(String().concat("Ошибка при установке СЧ '", key_element.numberke, "' Позиция промежуточного СЕ на вагоне не найдена в системе."));
														}
														child_node.assembly_element_position_on_vagon = middle_positions_on_vehicle[0].middle_node_position;
													}
												}
											}
										}
										//Если не удалось определить позицию на вагоне для промежуточного узла
										if (isEmptyString(child_node.assembly_element_position_on_vagon)) {
											return badResp("Не удалось определить позицию промежуточного СЕ на вагоне");
										}

										intermediate_nodes_ids.push(child_node.recid);
										intermediate_nodes.push(child_node);
									}
								}
							}
						}
					}
				}
			}
			else {
				all_key_elements.push(input_key_element);
				all_key_element_ids.push(input_key_element.recid);
			}
		}
	}

	return {
		success: true,
		all_key_elements: all_key_elements,
		intermediate_nodes: intermediate_nodes
	};
}

/**
 * Установка составных частей на ТС из паспорта ТС(оператор РЖД)
 * @param {*} params 
 */
function rzd_op_setupkeonvagon(params) {
	//Получение идентификатора производителя
	var vehicle = db.findbyrecid("reestr_vehicles", params.recid);
	if (isNullObject(vehicle)) {
		return badResp("ТС не найдено в системе");
	}
	if (isEmptyString(vehicle.trusted_manufacturer)) {
		return badResp("Поле \"Доверенное предприятие\" не может быть пустым");
	}
	//Получение записи из справочника кодов клеймения
	var dictionary_branding_code = db.findbyrecid("dictionary_branding_codes", vehicle.trusted_manufacturer);
	if (isEmptyOrNullArray(dictionary_branding_code)) {
		return badResp("Условный код клеймения не найден в системе");
	}
	//Получение записи из реестра участников
	var members = db.findbyparams("reestr_members", {
		branding_code: dictionary_branding_code.recid
	});
	if (isEmptyOrNullArray(members)) {
		return badResp("Участник не найден в системе");
	}
	var member = members[0];
	params.memberid = member.recid;
	return setupkeonvagon(params);
}

// Установка составных частей на вагон из паспорта ТС
function setupkeonvagon(params) {

	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};

	params.operationdate = (!!params.operationdate) ? params.operationdate : null;
	params.ke_numbers = (!!params.ke_numbers) ? params.ke_numbers : null;

	if (isEmptyString(params.operationdate)) {
		return badResp("Необходимо указать \"Дата установки\"");
	}

	if (params.ke_numbers == null) {
		return {
			success: false,
			message: "Необходимо указать \"Номера СЧ\""
		};
	}

	var rzd_url = get_rzd_urls_portal_settings();
	if (!rzd_url.success) {
		return badResp("Не удалось получить адрес АРМ Росжелдора");
	}

	// Получаем текущего участника
	var user = getcurrentuser();
	if (isNullObject(user)) {
		return badResp("Невозможно получить текущего пользователя");
	}

	var member = getmemberbyuserwithrecid(user.recid);
	if (isNullObject(member)) {
		return badResp("Получатель не найден в системе");
	}

	var input_key_elements = JSON.parse(params.ke_numbers);

	var reestr_vehicles = db.findbyrecid("reestr_vehicles", params.recid);
	// Получаем модель вагона
	var vagon_model = db.findbyrecid("dictionary_models", reestr_vehicles.dictionary_models);
	if (isNullObject(vagon_model)) {
		return badResp("Модель вагона не найдена в системе.");
	}

	var dateke = new Date(params.operationdate);

	if (isNotEmptyString(reestr_vehicles.vagon_number)) {
		return badResp("Для вагона уже введен сетевой номер, установка невозможна. Чтобы установить СЧ, необходимо очистить поле \"Номер вагона зарегистрированный\"");
	}

	// Получаем полные объекты СЧ по идентификаторам из входных данных
	var reestr_key_elements = [];
	var input_assembly_units = []; //СЕ просканированные по УИНу
	var assembly_units = [];

	var errors = [];

	for (var i = 0; i < input_key_elements.length; i++) {
		var key_element = db.findbyrecid("reestr_key_elements", input_key_elements[i].number);

		if (isNotNullObject(key_element)) {
			//добавляем флаг, является ли введённый уин УИНом СЧ для дальнейшей валидации
			input_key_elements[i].is_key_element = true;

			//Проверка что СЧ не стоит на вагоне
			if (isNotEmptyString(key_element.vehicle)) {
				errors.push("СЧ " + key_element.numberke + " уже установлен на вагон");
			}

			//Проверка статуса СЧ 
			if (key_element.statuske != "c82c2eb8-0cf9-4693-8a2b-c6bf605c97ab" && key_element.statuske != "259762d5-2ee4-4acb-a2c7-18593cb6cc4f") {
				return badResp(String().concat("Невозможно установить СЧ '", input_key_elements[i].numberValue, "' в текущем статусе"))
			}

			//Проверяем что у СЧ нет ссылки на партию
			if (key_element.batchid != null && key_element.batchid != "") {
				//получаем запись партии
				var batch = db.findbyrecid("reestr_batch", key_element.batchid);
				if (isNullObject(batch)) {
					return badResp("Запись о партии не найдена в системе");
				}
				if (member.recid == batch.recipient_droplist) {
					//если получатель
					if (batch.batch_status != "ef519ef4-ec73-4776-9295-2d007bb32907" && batch.batch_status != "f7b21136-24a8-4ae5-af5b-3b7b3dd0c36b" && key_element.change_node != true) {
						return badResp(String().concat("Действие \"Установка на ТС\" недоступно для СЧ, включенного в партию <a href=\"/tables/reestr_batch/", batch.recid, "\" target=\"_blank\" class=\"alert-link\"> №", batch.batch_number, "</a> в текущем статусе."));
					}
				} else {
					//если отправитель
					//статус партии отклонена или получена частично флаг false
					if (batch.batch_status != "281496a2-3d01-479e-80cb-96e6e6e76135" && batch.batch_status != "f7b21136-24a8-4ae5-af5b-3b7b3dd0c36b" && key_element.change_node != true) {
						return badResp(String().concat("Действие \"Установка на ТС\" недоступно для СЧ, включенного в партию <a href=\"/tables/reestr_batch/", batch.recid, "\" target=\"_blank\" class=\"alert-link\"> №", batch.batch_number, "</a> в текущем статусе."));
					}
				}
			}

			// Если сканируем СЧ из дочернего узла
			if (isNotEmptyString(key_element.ke_node)) {
				// Балка надрессорная, Ось чистовая, Ось черновая, Рама боковая
				if (key_element.key_element_code == "477d0c01-84d3-441c-9bb9-15f9d609671d"
					|| key_element.key_element_code == "e4ef0365-0365-40df-ab4e-a77104c352df"
					|| key_element.key_element_code == "b28e1a4f-d340-4ce0-a37a-d84dcfa1b6fb"
					|| key_element.key_element_code == "a0e6b16a-5fee-4318-a4dc-115ae65d4b09") {
					return badResp("Для установки узла нельзя использовать составная часть с типами: Балка надрессорная, Ось чистовая, Ось черновая, Рама боковая.");
				}

				// Проверяем статус уставливаемого СЕ
				var current_node = db.findbyrecid("reestr_ke_nodes", key_element.ke_node);

				if (current_node.assembly_element_type == commonAssemblyElementTypes.assembly_unit_id
					&& current_node.status != "823cc6e9-465b-416e-beda-8a642149c235" && current_node.status != "25d67987-0cd4-404a-85d7-847d142af11f") {
					return badResp("Нельзя установить СЕ " + current_node.unique_number + " в текущем статусе.");
				}

				//Проверяем что у СЕ есть ссылка на партию
				if (current_node.batchid != null && current_node.batchid != "") {
					//получаем запись партии
					var batch = db.findbyrecid("reestr_batch", current_node.batchid);
					if (isNullObject(batch)) {
						return badResp("Запись о партии не найдена в системе");
					}
					if (member.recid == batch.recipient_droplist) {
						//если получатель
						if (batch.batch_status != "ef519ef4-ec73-4776-9295-2d007bb32907" && batch.batch_status != "f7b21136-24a8-4ae5-af5b-3b7b3dd0c36b" && current_node.change_node != true) {
							return badResp(String().concat("Действие \"Установка на ТС\" недоступно для СЕ, включенного в партию <a href=\"/tables/reestr_batch/", batch.recid, "\" target=\"_blank\" class=\"alert-link\"> №", batch.batch_number, "</a> в текущем статусе."));
						}
					} else {
						//если отправитель
						//статус партии отклонена или получена частично флаг false
						if (batch.batch_status != "281496a2-3d01-479e-80cb-96e6e6e76135" && batch.batch_status != "f7b21136-24a8-4ae5-af5b-3b7b3dd0c36b" && current_node.change_node != true) {
							return badResp(String().concat("Действие \"Установка на ТС\" недоступно для СЕ, включенного в партию <a href=\"/tables/reestr_batch/", batch.recid, "\" target=\"_blank\" class=\"alert-link\"> №", batch.batch_number, "</a> в текущем статусе."));
						}
					}
				}

				if (isEmptyString(input_key_elements[i].position)) {
					return badResp("Для одного из составных частей не указана позиция.");
				}

				var position_on_vagon = db.findbyrecid("dictionary_positions_on_vagon", input_key_elements[i].position);
				if (isNullObject(position_on_vagon)) {
					return badResp("Не удалось определить одну из позиций СЧ на вагоне.");
				}

				key_element.position_on_vagon = position_on_vagon.recid;
				key_element.position_on_vagon___value = position_on_vagon.recname;

				reestr_key_elements.push(key_element);

				current_node.position_node_on_vagon = position_on_vagon.position_node_on_vagon;
				//Сохранение записи об устанавливаемом СЕ в массив
				if (assembly_units.indexOf(current_node) == -1) {
					assembly_units.push(current_node);
				}
			}
			// Если сканируем СЧ
			else {
				var position_on_vagon_params = {
					// Наименование СЧ
					"key_element_code": key_element.key_element_code
				};
				// Если вагон 4-осный, то указываем параметр for_four_axes_vagon = true
				if (vagon_model.number_axes == "4") {
					position_on_vagon_params.for_four_axes_vagon = true;
				}
				// Если вагон 6-осный, то указываем параметр for_six_axes_vagon = true
				else if (vagon_model.number_axes == "6") {
					position_on_vagon_params.for_six_axes_vagon = true;
				}

				var key_element_position_on_vagon = db.findbyparams("dictionary_positions_on_vagon", position_on_vagon_params);

				if (isNotEmptyOrNullArray(key_element_position_on_vagon)) {
					var key_element_record = db.findbyrecid("reestr_key_elements", input_key_elements[i].number);
					//Если это не сменный ЖД кузов
					if (key_element_record.key_element_code != "ad836d1b-6ecb-4dce-a508-8e9f42095ba3") {
						if (isEmptyString(input_key_elements[i].position)) {
							return badResp("Для одного из составных частей не указана позиция.");
						}

						var position_on_vagon = db.findbyrecid("dictionary_positions_on_vagon", input_key_elements[i].position);
						if (isNullObject(position_on_vagon)) {
							return badResp("Не удалось определить одну из позиций СЧ на вагоне.");
						}
						key_element.position_on_vagon = position_on_vagon.recid;
						key_element.position_on_vagon___value = position_on_vagon.recname;
					}
				}

				reestr_key_elements.push(key_element);
			}
		}

		// Иначе проверяем просканирован ли СЕ
		else {
			var assembly_unit = db.findbyrecid("reestr_ke_nodes", input_key_elements[i].number);
			if (isNullObject(assembly_unit)) {
				return badResp("Элемент" + input_key_elements[i].numberValue + " не найден в системе.");
			}

			//добавляем флаг, является ли введённый уин УИНом СЧ для дальнейшей валидации
			input_key_elements[i].is_key_element = false;

			if (assembly_unit.status != "823cc6e9-465b-416e-beda-8a642149c235" && assembly_unit.status != "25d67987-0cd4-404a-85d7-847d142af11f") {
				return badResp("Нельзя установить СЕ " + assembly_unit.unique_number + " в текущем статусе.");
			}

			if (isNotEmptyString(assembly_unit.vehicle)) {
				errors.push("СЕ " + assembly_unit.unique_number + " уже установлен на вагон");
			}

			//Проверяем что у СЕ есть ссылка на партию
			if (assembly_unit.batchid != null && assembly_unit.batchid != "") {
				//получаем запись партии
				var batch = db.findbyrecid("reestr_batch", assembly_unit.batchid);
				if (isNullObject(batch)) {
					return badResp("Запись о партии не найдена в системе");
				}
				if (member.recid == batch.recipient_droplist) {
					//если получатель
					if (batch.batch_status != "ef519ef4-ec73-4776-9295-2d007bb32907" && batch.batch_status != "f7b21136-24a8-4ae5-af5b-3b7b3dd0c36b" && assembly_unit.change_node != true) {
						return badResp(String().concat("Действие \"Установка на ТС\" недоступно для СЕ, включенного в партию <a href=\"/tables/reestr_batch/", batch.recid, "\" target=\"_blank\" class=\"alert-link\"> №", batch.batch_number, "</a> в текущем статусе."));
					}
				} else {
					//если отправитель
					//статус партии отклонена или получена частично флаг false
					if (batch.batch_status != "281496a2-3d01-479e-80cb-96e6e6e76135" && batch.batch_status != "f7b21136-24a8-4ae5-af5b-3b7b3dd0c36b" && assembly_unit.change_node != true) {
						return badResp(String().concat("Действие \"Установка на ТС\" недоступно для СЕ, включенного в партию <a href=\"/tables/reestr_batch/", batch.recid, "\" target=\"_blank\" class=\"alert-link\"> №", batch.batch_number, "</a> в текущем статусе."));
					}
				}
			}

			//Простановка позиции
			if (isEmptyString(input_key_elements[i].position)) {
				if (vagon_model.number_axes == 4) {
					var dictionary_positions_on_vagon = db.findbyparams("dictionary_positions_on_vagon", {
						"child_node_type": assembly_unit.ke_node_type,
						"for_four_axes_vagon": true
					})
					if (isEmptyOrNullArray(dictionary_positions_on_vagon)) {
						return badResp("Позиция на вагоне для сканируемого СЕ " + "(" + input_key_elements[i].numberValue + ")" + " не найдена в системе")
					}
					assembly_unit.position_node_on_vagon = dictionary_positions_on_vagon[0].position_node_on_vagon;
					input_assembly_units.push(assembly_unit);
				}
				if (vagon_model.number_axes == 6) {
					var dictionary_positions_on_vagon = db.findbyparams("dictionary_positions_on_vagon", {
						"child_node_type": assembly_unit.ke_node_type,
						"for_six_axes_vagon": true
					})
					if (isEmptyOrNullArray(dictionary_positions_on_vagon)) {
						return badResp("Позиция на вагоне для сканируемого СЕ " + "(" + input_key_elements[i].numberValue + ")" + " не найдена в системе")
					}
					assembly_unit.position_node_on_vagon = dictionary_positions_on_vagon[0].position_node_on_vagon;
					input_assembly_units.push(assembly_unit);
				}

			} else {
				var assembly_unit_position_on_vagon = db.findbyrecid("dictionary_node_positions", input_key_elements[i].position);
				if (isNullObject(assembly_unit_position_on_vagon)) {
					return badResp("Не удалось определить позицию СЕ " + input_key_elements[i].numberValue + " на вагоне.");
				}

				assembly_unit.position_node_on_vagon = input_key_elements[i].position;
				input_assembly_units.push(assembly_unit);
			}

		}
	}

	if (errors.length > 0) {
		var message = "";
		for (var i = 0; i < errors.length; i++) {
			message += errors[i] + ", "
		}
		return badResp(message);
	}

	//Получение уже установленных на вагон узлов
	var alreadyInstalledNodes = db.findbyparams("reestr_ke_nodes", {
		vehicle: reestr_vehicles.recid
	})
	if (isEmptyOrNullArray(alreadyInstalledNodes)) {
		alreadyInstalledNodes = [];
	}
	//Добавление к уже установленным узлам просканированных узлов
	var all_nodes = alreadyInstalledNodes.concat(assembly_units);
	//Проверка количества тележек на вагоне
	var checkCartsCountResult = checkCartsCount(all_nodes, vagon_model)
	if (!checkCartsCountResult.success) {
		return checkCartsCountResult;
	}

	// Проверка на то что в форме для номеров СЧ указаны разные позиции
	// #39520 Если был просканирован УИН СЕ - не осуществляем проверку позиции для него, т.к. позиции разных наименований СЕ могут быть одинаковыми.
	// todo: Планируется доработка по валидации позиций СЕ одного наименования, на случай вызова метода через АПИ, где нет фильрации по свободным позициям, как в интерфейсе
	// todo: Альтернативные позиции вынесли в отдельные записи. Добавить валидацию, что не используется одна и та же.
	for (var i = 0; i < input_key_elements.length; i++) {
		if (input_key_elements[i].is_key_element) {
			for (var j = 0; j < input_key_elements.length; j++) {
				if (input_key_elements[i].is_key_element && isNotEmptyString(input_key_elements[j].position) && isNotEmptyString(input_key_elements[i].position)) {
					if (input_key_elements[j].position == input_key_elements[i].position
						&& input_key_elements[j].number != input_key_elements[i].number) {
						return badResp("На позицию можно установить только один СЧ.");
					}
				}
			}
		}
	}

	// Проверка на то, что СЧ можно установить на указанные позиции
	for (var i = 0; i < reestr_key_elements.length; i++) {
		var key_element = reestr_key_elements[i];
		//Если это не сменный ЖД кузов
		if (key_element.key_element_code != "ad836d1b-6ecb-4dce-a508-8e9f42095ba3") {
			var position_on_vagon = db.findbyrecid("dictionary_positions_on_vagon", key_element.position_on_vagon);
			if (isNullObject(position_on_vagon)) {
				return badResp("Не удалось найти в системе позицию для СЧ с номером " + key_element.numberke + ".");
			}

			if ((position_on_vagon.key_element_code != key_element.key_element_code)
				|| (vagon_model.number_axes == "6" && position_on_vagon.for_six_axes_vagon == false)
				|| (vagon_model.number_axes == "4" && position_on_vagon.for_four_axes_vagon == false)) {
				return badResp("СЧ c номером " + key_element.numberke + " нельзя установить на позицию " + position_on_vagon.recname + ".");
			}
		}
	}


	var all_key_elements_res = getAllKeyElementsWithPositionsOnVagon(reestr_key_elements, input_assembly_units, vagon_model.number_axes);
	if (!all_key_elements_res.success) {
		return badResp("Произошла ошибка в процессе обработки указанных составных частей. " + all_key_elements_res.message);
	}

	var all_key_elements = all_key_elements_res.all_key_elements;
	var intermediate_nodes = all_key_elements_res.intermediate_nodes;

	//Получение СЕ без СЧ входящих в состав родительского СЕ
	//Получение родительских СЕ
	var parent_assembly_units = []
	var assembly_unit_without_ke = []
	for (var i = 0; i < all_key_elements.length; i++) {
		var input_key_element = all_key_elements[i];
		if (isNotEmptyString(input_key_element.ke_node)) {

			var node_records = db.findbyrecid("reestr_ke_nodes", input_key_element.ke_node);

			if (node_records && !parent_assembly_units.find(function (unit) {
				return unit.recid === node_records.recid;
			})) {
				parent_assembly_units.push(node_records);
			}
		}
	}

	var assembly_units_without_kes_ids = []
	for (var i = 0; i < parent_assembly_units.length; i++) {
		var assembly_units_in_parent = db.findbyparams("reestr_ke_nodes", {
			"parent_ke_node": parent_assembly_units[i].recid
		})
		if (isNotEmptyOrNullArray(assembly_units_in_parent)) {
			for (var j = 0; j < assembly_units_in_parent.length; j++) {
				if (assembly_units_in_parent[j].ke_node_type == "c790c624-b93e-498b-97ba-0fb47f8b4b52") { // Если это триангель
					if (assembly_units_without_kes_ids.indexOf(assembly_units_in_parent[j].recid) == -1) {
						assembly_units_without_kes_ids.push(assembly_units_in_parent[j].recid);
					}
				}
			}
		}
	}

	for (var i = 0; i < assembly_units_without_kes_ids.length; i++) {
		var ass_unit_record = db.findbyrecid("reestr_ke_nodes", assembly_units_without_kes_ids[i]);
		input_assembly_units.push(ass_unit_record);
	}

	// Проводим проверку, что все полученные СЧ будут установлены на разные позиции
	var key_elements_positions = [];
	for (var i = 0; i < all_key_elements.length; i++) {
		if (isNotEmptyString(all_key_elements[i].position_on_vagon)) {
			if (key_elements_positions.indexOf(all_key_elements[i].position_on_vagon) == -1) {
				key_elements_positions.push(all_key_elements[i].position_on_vagon);
			}
			else {
				return badResp(
					"На позицию "
					+ all_key_elements[i].position_on_vagon___value
					+ " (" + all_key_elements[i].key_element_code___value + ")"
					+ " претендует более одного СЧ. Проверьте введенные данные.");
			}
		}
	}

	// Проверка на то, что среди установленных на вагон СЧ, нет СЧ на позиции, которая указана в форме установки на вагон
	var key_elements_on_wagon_params = {
		"vehicle": reestr_vehicles.recid
	};
	var key_elements_on_wagon = db.findbyparams("reestr_key_elements", key_elements_on_wagon_params);
	if (isNotEmptyOrNullArray(key_elements_on_wagon)) {
		for (var i = 0; i < all_key_elements.length; i++) {
			if (all_key_elements[i].key_element_code != "ad836d1b-6ecb-4dce-a508-8e9f42095ba3") {
				if (isEmptyString(all_key_elements[i].position_on_vagon)) {
					return badResp("Не удалось проставить позицию на вагоне для СЧ " + all_key_elements[i].numberke)
				}
				var position_on_vagon = db.findbyrecid("dictionary_positions_on_vagon", all_key_elements[i].position_on_vagon);
				if (isNullObject(position_on_vagon)) {
					return badResp("Не удалось найти в системе позицию для СЧ с номером " + all_key_elements[i].numberke + ".");
				}

				for (var j = 0; j < key_elements_on_wagon.length; j++) {
					if (key_elements_on_wagon[j].position_on_vagon == position_on_vagon.recid) {
						return badResp("На позицию " + position_on_vagon.recname + " уже установлен СЧ с номером " + key_elements_on_wagon[j].numberke + ".");
					}
				}
			}
		}
	}

	// Проверяем кто проводит установку
	var allow_groups_names = ["TSControllers", "RZDOperators"];
	var check_authorization_res = checkauthorization(allow_groups_names);

	// Если установку проводит TSController, то нужно проверить что все СЧ не подтверждены Эксплуатантом
	if (check_authorization_res.success) {
		for (var i = 0; i < reestr_key_elements.length; i++) {
			var key_element = reestr_key_elements[i];
			if (key_element.is_confirmed_delegation) {
				return badResp("составная часть с номером " + key_element.numberke + " передан эксплуатанту. Установка не проведена.");
			}
		}
	}
	// Иначе проверяем, что установку проводит Эксплуатант
	else {
		allow_groups_names = ["Ekspluatants"];
		check_authorization_res = checkauthorization(allow_groups_names);

		// Если установку проводит Эксплуатант, то нужно проверить, что все СЧ подтверждены Эксплуатантом
		if (check_authorization_res.success) {
			for (var i = 0; i < reestr_key_elements.length; i++) {
				var key_element = reestr_key_elements[i];
				if (!key_element.is_confirmed_delegation) {
					return badResp("составная часть с номером " + key_element.numberke + " не передан эксплуатанту. Установка не проведена.");
				}
			}
		}
		else { return badResp("Нет прав для проведения операции.") }
	}

	var checkres = checkcountlimitation(all_key_elements, params.recid);
	if (!checkres.success) {
		return checkres;
	}

	var assemblyUnitsCheckres = checkAssemblyUnitsCountLimitation(input_assembly_units, vagon_model.recid)
	if (!assemblyUnitsCheckres.success) {
		return assemblyUnitsCheckres
	}
	var child_node_ids = [];
	var child_nodes = [];
	// Проставляем узлам, которые будут установлены на вагон, статус Установлен на ТС
	for (var i = 0; i < all_key_elements.length; i++) {
		if (isNotEmptyString(all_key_elements[i].ke_node) && child_node_ids.indexOf(all_key_elements[i].ke_node) == -1) {
			var child_node = db.findbyrecid("reestr_ke_nodes", all_key_elements[i].ke_node);
			// Статус - Установлен на ТС
			child_node.status = "f831cffa-e2ce-417f-8b4f-1645715bd454";

			// Если ставим на вагон СЕ, то прописываем в нее информацию по вагону
			if (child_node.assembly_element_type == commonAssemblyElementTypes.assembly_unit_id) {
				child_node.vehicle = reestr_vehicles.recid;
				child_node.install_date = dateke.getUTCFullYear() +
					'-' + (dateke.getUTCMonth() + 1).toString().padStart(2, 0) +
					'-' + (dateke.getUTCDate()).toString().padStart(2, 0);

				var current_ke_position_on_vagon = db.findbyrecid("dictionary_positions_on_vagon", all_key_elements[i].position_on_vagon);
				child_node.assembly_element_position_on_vagon = current_ke_position_on_vagon.position_node_on_vagon;

				//Поиск дочерних СЕ типа "Триангель" и проставление ему позиции в тележке, потому что он без СЧ
				var child_triangels = db.findbyparams("reestr_ke_nodes", {
					parent_ke_node: child_node.recid,
					ke_node_type: "c790c624-b93e-498b-97ba-0fb47f8b4b52"
				});

				if (!isEmptyOrNullArray(child_triangels)) {
					for (var j = 0; j < child_triangels.length; j++) {
						var triangel = child_triangels[j];
						var triangel_positions = db.findbyparams("dictionary_node_middle_position_on_vehicle", {
							middle_node_position_in_parent_node: triangel.position_on_assembly_element,
							parent_node_position_on_vehicle: child_node.assembly_element_position_on_vagon
						});
						if (isEmptyOrNullArray(triangel_positions)) {
							return badResp("Не удалось определить позицию триангеля на вагоне");
						}
						triangel.assembly_element_position_on_vagon = triangel_positions[0].middle_node_position;
						db.update("reestr_ke_nodes", triangel);
					}
				}
			}
			child_node_ids.push(all_key_elements[i].ke_node);
			child_nodes.push(child_node);
		}
	}

	// Проверка соответсвия СЧ справочнику Состав вагона (dictionary_vagon_composition)
	for (var i = 0; i < all_key_elements.length; i++) {
		var key_element = all_key_elements[i];

		var vagon_composition_records_params = {
			"key_element_type": key_element.key_element_code
		};
		var vagon_composition_records = db.findbyparams("dictionary_vagon_composition", vagon_composition_records_params);

		var vagon_composition_record = null;

		// Если найдены записи в справочнике "Состав вагона"
		if (isNotEmptyOrNullArray(vagon_composition_records)) {
			// Если СЧ не состоит в узле/СЕ
			if (isEmptyString(key_element.ke_node)) {
				for (var j = 0; j < vagon_composition_records.length; j++) {
					// Если у одной из записей из справочника "Состав вагона" не указано "Наименование узла/СЕ",
					// то проверка считается пройденной
					if (isEmptyString(vagon_composition_records[j].assembly_element_type)) {
						vagon_composition_record = vagon_composition_records[j];
						break;
					}
				}
			}
			else {
				for (var j = 0; j < vagon_composition_records.length; j++) {
					var node = db.findbyrecid("reestr_ke_nodes", key_element.ke_node);
					if (isNullObject(node)) {
						return badResp("В системе не найден узел/СЕ для СЧ " + key_element.numberke + ".");
					}

					// Если у одной из записей из справочника "Состав вагона" поле "Наименование узла/СЕ",
					// соответствует типу узла/СЕ СЧ, то проверка считается пройденной
					if (node.ke_node_type == vagon_composition_records[j].assembly_element_type) {
						vagon_composition_record = vagon_composition_records[j];
						break;
					}
				}
			}

			if (isNullObject(vagon_composition_record)) {
				return badResp("СЧ " + key_element.numberke + " не может быть включен в состав вагона.");
			}
		}
		else {
			return badResp("Для СЧ " + key_element.numberke + " не найдены записи в справочнике \"Состав вагона\".");
		}
	}

	//получаем дочерние СЕ, которые также будем отправлять в блокчейн, сохранять историю их установки на ТС и указывать в них информацию о ТС
	var child_assembly_units = [];
	var all_main_assembly_units = input_assembly_units.concat(assembly_units); //объединяем СЕ, сканируемые напрямую и через СЧ
	if (isNotEmptyOrNullArray(all_main_assembly_units)) {
		childs_se_out = [];
		childs_ke_out = [];
		for (var i = 0; i < all_main_assembly_units.length; i++) {
			var unit = all_main_assembly_units[i];
			var res = findchilds(unit, true);
			if (res.success && isNotEmptyOrNullArray(childs_se_out)) {
				childs_se_out.splice(childs_se_out.indexOf(unit), 1);
				child_assembly_units = child_assembly_units.concat(childs_se_out);
			}
		}
	}

	//Обновление позиции на вагоне в дочерних СЕ
	for (var i = 0; i < child_assembly_units.length; i++) {
		var child_assembly_unit = child_assembly_units[i];
		for (var j = 0; j < intermediate_nodes.length; j++) {
			var intermediate_node = intermediate_nodes[j];
			if (intermediate_node.recid == child_assembly_unit.recid) {
				child_assembly_unit.position_node_on_vagon = intermediate_node.assembly_element_position_on_vagon;
				child_assembly_units[i] = child_assembly_unit;
			}
		}
	}

	for (let i = 0; i < child_assembly_units.length; i++) {
		let unit = child_assembly_units[i];
		// Если ставим на вагон СЕ, то прописываем в нее информацию по вагону
		if (unit.assembly_element_type == commonAssemblyElementTypes.assembly_unit_id) {
			unit.vehicle = reestr_vehicles.recid;
			unit.install_date = dateke.getUTCFullYear() +
				'-' + (dateke.getUTCMonth() + 1).toString().padStart(2, 0) +
				'-' + (dateke.getUTCDate()).toString().padStart(2, 0);
		}
	}

	var assembly_units_blockchain_requests = [];
	// Установка на вагон в блокчейне для СЕ 
	//28.04.2020 до этого была отправка в блокчейн только СЕ , изменила чтобы отправлялись все СЕ в рамках задачи rm38228
	var assembly_units_not_filtered = all_main_assembly_units.concat(child_assembly_units);//объединяем СЕ верхнего и нижних уровней
	var all_assembly_units = [];
	//28.08.2020 amaslov https://rm.mfc.ru/issues/43221 сюда могут попасть дубли, поэтому отфильтровываем их и узлы.
	var unique_numbers = [];
	assembly_units_not_filtered.forEach(function (element) {
		if (element.assembly_element_type != commonAssemblyElementTypes.node_id) { //Проверка на узел
			if (unique_numbers.indexOf(element.unique_number) === -1) all_assembly_units.push(element); //отфильтровываем дубли
			unique_numbers.push(element.unique_number);	//вспомогательный массив с УИНами
		}
	});

	var member = null;
	if (!isEmptyString(params.memberid)) {
		member = db.findbyrecid("reestr_members", params.memberid)
	} else {
		member = getmemberbyuser();
	}
	if (isNullObject(member)) {
		return badResp("Не удалось определить участника для текущего пользователя.");
	}
	var nodeip = getnodeipbymember(member.recid);
	if (isEmptyString(nodeip)) {
		return badResp("Не удалось определить IP адрес блокчейна.");
	}

	if (isNotEmptyOrNullArray(all_assembly_units)) {
		for (var i = 0; i < all_assembly_units.length; i++) {
			var assembly_unit = all_assembly_units[i];

			//28.08.2020 amaslov https://rm.mfc.ru/issues/43221 вырезано условие, по которому пропускалось формирование запроса для триангеля. Но без условия триангель дублировался, поэтому выше сделано удаление дублей
			var position = isNotEmptyString(assembly_unit.position_node_on_vagon)
				? db.findbyrecid("dictionary_node_positions", assembly_unit.position_node_on_vagon)
				: null;

			var request = {
				nodeip: nodeip,
				assembly_unit: assembly_unit,
				link: {
					hash: assembly_unit.blockchainhash,
					node: assembly_unit.blockchainnode,
					recn: assembly_unit.blockchainrecn,
					tn: assembly_unit.blockchaintn
				},
				vehicle_manufacturer_number: isNotEmptyString(reestr_vehicles.manufacturer_number)
					? reestr_vehicles.manufacturer_number
					: null,
				install_ke_date: dateke.getUTCFullYear() +
					'-' + (dateke.getUTCMonth() + 1).toString().padStart(2, 0) +
					'-' + (dateke.getUTCDate()).toString().padStart(2, 0),
				position_on_vagon: isNotNullObject(position)
					? position.recname
					: "null"
			};

			assembly_units_blockchain_requests.push(request);
		}
	}

	var errors = [];
	var bc_requests = [];
	for (var i = 0; i < all_key_elements.length; i++) {
		var requestdata = {
			"numberke": all_key_elements[i].numberke,
			"ke_id": all_key_elements[i].recid,
			"wagonnumber": reestr_vehicles.vagon_number,
			"wagonid": reestr_vehicles.recid,
			"wagon_position": all_key_elements[i].position_on_vagon,
			"manufacturernumber": reestr_vehicles.manufacturer_number,
			"memberid": params.memberid,
			"date": dateke.getUTCFullYear() +
				'-' + (dateke.getUTCMonth() + 1).toString().padStart(2, 0) +
				'-' + (dateke.getUTCDate()).toString().padStart(2, 0)
		};
		// В рамках задачи #27901 устанвка СЧ на вагон сделана в 2 этапа, первый этап формирует массив запросов в блокчейн и если все проверки пройдены, 
		// второй этап выполняет циклом запросы в блокчейн
		var res = addkeprepareblockchainrequest(requestdata);
		if (!res.success) {
			errors.push(res.message);
		} else {
			bc_requests.push(res.message);
		}
	}
	//Если есть ошибки, откатываем все изменения в СЧ
	if (isNotEmptyOrNullArray(errors)) {
		for (var i = 0; i < all_key_elements.length; i++) {
			all_key_elements[i].vehicle = null;
			all_key_elements[i].install_ke_date = null;
			all_key_elements[i].position_on_vagon = null;
			all_key_elements[i].statuske = "c82c2eb8-0cf9-4693-8a2b-c6bf605c97ab";
			delete all_key_elements[i].position_node_on_vagon;
			db.update("reestr_key_elements", all_key_elements[i]);
		}
		return badResp(errors.join(" "));
	}
	//Если ошибок нет, выполяем запросы в блокчейн
	else {
		if (isNotEmptyOrNullArray(assembly_units_blockchain_requests)) {
			for (var i = 0; i < assembly_units_blockchain_requests.length; i++) {

				var blockchainResponse = addtowagonblockchain(assembly_units_blockchain_requests[i]);

				if (!!blockchainResponse.result) {
					// Статус - Установлен на ТС
					if (isEmptyString(assembly_units_blockchain_requests[i].assembly_unit.parent_ke_node)) {
						assembly_units_blockchain_requests[i].assembly_unit.status = "f831cffa-e2ce-417f-8b4f-1645715bd454";
					}
					assembly_units_blockchain_requests[i].assembly_unit.vehicle = reestr_vehicles.recid;
					assembly_units_blockchain_requests[i].assembly_unit.install_date = dateke.getUTCFullYear() +
						'-' + (dateke.getUTCMonth() + 1).toString().padStart(2, 0) +
						'-' + (dateke.getUTCDate()).toString().padStart(2, 0);
					assembly_units_blockchain_requests[i].assembly_unit.assembly_element_position_on_vagon = assembly_units_blockchain_requests[i].assembly_unit.position_node_on_vagon;
					assembly_units_blockchain_requests[i].assembly_unit.blockchain_request_body = JSON.stringify(blockchainResponse.request);

					delete assembly_units_blockchain_requests[i].assembly_unit.position_node_on_vagon;

					event.log("reestr_ke_nodes", null, "assembly_units_blockchain_requests ", 4, assembly_units_blockchain_requests[i].assembly_unit);

					db.update("reestr_ke_nodes", assembly_units_blockchain_requests[i].assembly_unit);
				}
				else {
					return {
						success: false,
						message: blockchainResponse
					};
				}
			}
		}

		var installed_elements = []; //Массив устанавливаемых элементов для формирования ЭП в плагине
		if (isNotEmptyOrNullArray(bc_requests)) {
			for (var i = 0; i < bc_requests.length; i++) {
				//Для обхода запросов в блокчейн при установке СЧ на вагон
				if (bc_requests[i].reestr_ke_tmp.key_element_code == "" || bc_requests[i].reestr_ke_tmp.key_element_code == "") {

					var reestr_key_elementsTmp = null;
					var reestr_vehiclesTmp = null;
					var gamma_percent_resource_end_date = bc_requests[i].gamma_percent_resourse_end

					reestr_key_elementsTmp = bc_requests[i].reestr_ke_tmp;
					reestr_vehiclesTmp = bc_requests[i].reestr_vehicles_tmp
					var node = null;
					if (isNotEmptyString(reestr_key_elementsTmp.ke_node)) {
						node = db.findbyrecid("reestr_ke_nodes", reestr_key_elementsTmp.ke_node);
					}


					reestr_key_elementsTmp.vehicle = reestr_vehiclesTmp.recid;
					reestr_key_elementsTmp.install_ke_date = bc_requests[i].date;
					reestr_key_elementsTmp.position_on_vagon = bc_requests[i].wagon_position;
					reestr_key_elementsTmp.statuske = "a0b630bc-fbed-4863-9053-6cec9ee3a459";
					reestr_key_elementsTmp.last_blockchain_request = JSON.stringify(bc_requests[i], null, '\t');

					var logItem = set_ke_log(reestr_key_elementsTmp, "bb7492ac-7097-4870-8f04-fae9b6d6e2c6", !!node ? node.recid : null, !!node ? node.ke_node_type : null);
					// Если у ТС указано Доверенное предприятие, проверяем все СЧ.
					// Если у СЧ Доверенное предприятие отличается от того, которое указано в ТС, заменяем его
					if (isNotEmptyString(reestr_vehiclesTmp.trusted_manufacturer)
						&& reestr_key_elementsTmp.trusted_manufacturer != reestr_vehiclesTmp.trusted_manufacturer) {
						reestr_key_elementsTmp.trusted_manufacturer = reestr_vehiclesTmp.trusted_manufacturer;
					}

					// Если "Год окончания гамма-процентного ресурса детали", указанный в СЧ не заполнен 
					// или отличается от переданного во входных данных, то обновляем его
					if (isEmptyString(reestr_key_elementsTmp.gamma_percent_resource_end_date)
						|| reestr_key_elementsTmp.gamma_percent_resource_end_date != gamma_percent_resource_end_date) {
						reestr_key_elementsTmp.gamma_percent_resource_end_date = gamma_percent_resource_end_date;
					}
					delete reestr_key_elementsTmp.position_node_on_vagon;
					res = res && db.update("reestr_key_elements", reestr_key_elementsTmp);

					//res = res && db.insert("log", logItem);
					// Отправка записи в АРМ Росжелдора 29.09.2020 amaslov 44458
					MakeLogRecord("log", logItem, rzd_url.rzd_name_url);

					installed_elements.push({
						id: reestr_key_elementsTmp.recid,
						isNode: false
					});

					event.log("reestr_key_elements",
						reestr_key_elementsTmp.recid,
						"СЧ с номером " + reestr_key_elementsTmp.numberke + " установлен на ТС с номером " + reestr_vehiclesTmp.vagon_number + ".",
						eventTypeEnum.Info,
						bc_requests[i]);
				} else {
					var blockchainResponse = addtowagonblockchain(bc_requests[i]);

					var reestr_key_elementsTmp = null;
					var reestr_vehiclesTmp = null;
					var gamma_percent_resource_end_date = bc_requests[i].gamma_percent_resourse_end
					if (!!blockchainResponse.result) {
						reestr_key_elementsTmp = bc_requests[i].reestr_ke_tmp;
						reestr_vehiclesTmp = bc_requests[i].reestr_vehicles_tmp

						var node = null;
						if (isNotEmptyString(reestr_key_elementsTmp.ke_node)) {
							node = db.findbyrecid("reestr_ke_nodes", reestr_key_elementsTmp.ke_node);
						}

						reestr_key_elementsTmp.vehicle = reestr_vehiclesTmp.recid;
						reestr_key_elementsTmp.install_ke_date = bc_requests[i].date;
						reestr_key_elementsTmp.position_on_vagon = bc_requests[i].wagon_position;
						reestr_key_elementsTmp.statuske = "a0b630bc-fbed-4863-9053-6cec9ee3a459";
						reestr_key_elementsTmp.last_blockchain_request = JSON.stringify(blockchainResponse.request);

						var logItem = set_ke_log(reestr_key_elementsTmp, "bb7492ac-7097-4870-8f04-fae9b6d6e2c6", !!node ? node.recid : null, !!node ? node.ke_node_type : null);

						// Если у ТС указано Доверенное предприятие, проверяем все СЧ.
						// Если у СЧ Доверенное предприятие отличается от того, которое указано в ТС, заменяем его
						if (isNotEmptyString(reestr_vehiclesTmp.trusted_manufacturer)
							&& reestr_key_elementsTmp.trusted_manufacturer != reestr_vehiclesTmp.trusted_manufacturer) {
							reestr_key_elementsTmp.trusted_manufacturer = reestr_vehiclesTmp.trusted_manufacturer;
						}

						// Если "Год окончания гамма-процентного ресурса детали", указанный в СЧ не заполнен 
						// или отличается от переданного во входных данных, то обновляем его
						if (isEmptyString(reestr_key_elementsTmp.gamma_percent_resource_end_date)
							|| reestr_key_elementsTmp.gamma_percent_resource_end_date != gamma_percent_resource_end_date) {
							reestr_key_elementsTmp.gamma_percent_resource_end_date = gamma_percent_resource_end_date;
						}
						delete reestr_key_elementsTmp.position_node_on_vagon
						res = res && db.update("reestr_key_elements", reestr_key_elementsTmp);

						//res = res && db.insert("log", logItem);
						// Отправка записи в АРМ Росжелдора 29.09.2020 amaslov 44458
						MakeLogRecord("log", logItem, rzd_url.rzd_name_url);

						installed_elements.push({
							id: reestr_key_elementsTmp.recid,
							isNode: false
						});

						event.log("reestr_key_elements",
							reestr_key_elementsTmp.recid,
							"СЧ с номером " + reestr_key_elementsTmp.numberke + " установлен на ТС с номером " + reestr_vehiclesTmp.vagon_number + ".",
							eventTypeEnum.Info,
							bc_requests[i]);
					}
					else {
						return {
							success: false,
							message: blockchainResponse
						};
					}
				}
			}

			// // Обновляем СЕ верхнего уровня, установленные на вагон
			// for (var i = 0; i < child_nodes.length; i++) {
			// 	delete child_nodes[i].position_node_on_vagon
			// 	db.update("reestr_ke_nodes", child_nodes[i]);
			// }

			// // Обновляем дочерние СЕ, установленные на вагон
			// for(let i=0; i<child_assembly_units.length; i++){
			// 	if (child_assembly_units[i].assembly_element_type == commonAssemblyElementTypes.assembly_unit_id) {
			// 		db.update("reestr_ke_nodes", child_assembly_units[i]);
			// 	}
			// }
		}
		else {
			if (isEmptyOrNullArray(assembly_units_blockchain_requests)) {
				return badResp("Нет запросов для отправки в блокчейн");
			}
		}


		//Получение устанавливаемых узлов
		for (var i = 0; i < all_assembly_units.length; i++) {
			installed_elements.push({
				id: all_assembly_units[i].recid,
				isNode: true
			})
		}

		//Формирование ЭП в плагине
		var for_passports_body = {
			recid: params.recid,
			elements: installed_elements
		}
		var form_passports_res = plugins.callAsMethod("/plugins/nbdlogicplugin/buildinstalledelementpassport", "post", for_passports_body, null)
		if (!form_passports_res.success) {
			return form_passports_res
		}

		//Прописываем историю устанавливаемых узлов в таблицу node_log
		var node_log_actions = db.findbyparams("dictionary_node_actions", { "code": 3 });
		for (var i = 0; i < all_assembly_units.length; i++) {
			//Установка на вагон
			var node_log_record = set_node_log(all_assembly_units[i], node_log_actions[0].recid, "");

			if (isNotEmptyString(all_assembly_units[i].recid)) {
				var items_in_assembly_unit = db.findbyparams("reestr_key_elements", { "ke_node": all_assembly_units[i].recid });
				if (isNotNullObject(items_in_assembly_unit)) {
					for (var j = 0; j < items_in_assembly_unit.length; j++) {
						var key_element_type_record = db.findbyrecid("dictionary_key_elements_codes", items_in_assembly_unit[j].key_element_code)
						if (isNotNullObject(key_element_type_record)) {
							if (j < items_in_assembly_unit.length - 1) {
								node_log_record.node_content += items_in_assembly_unit[j].numberke + '(' + key_element_type_record.recname + ')' + ", ";
							} else {
								node_log_record.node_content += items_in_assembly_unit[j].numberke + '(' + key_element_type_record.recname + ')'
							}
						} else {
							if (j < items_in_assembly_unit.length - 1) {
								node_log_record.node_content += items_in_assembly_unit[j].numberke + ", ";
							} else {
								node_log_record.node_content += items_in_assembly_unit[j].numberke;
							}
						}
					}
				}
				//db.insert("node_log", node_log_record);
				// Отправка записи в АРМ Росжелдора 29.09.2020 amaslov 44458
				MakeLogRecord("node_log", node_log_record, rzd_url.rzd_name_url);
			}
			else {
				return badResp("Не удалось записать историю узла");
			}
		}
	}

	// Обновление количества СЧ/СЕ, установленных на вагон
	var counting_res = counting_ke_se_onvagon(params.recid);
	if (!counting_res.success)
		return counting_res;

	return successResp("Установка проведена успешно.");
}

// Подсчет количества СЧ/СЕ, установленных на вагон
function counting_ke_se_onvagon(vehicleid) {
	var reestr_vehicles_fields = db.findbyrecid("reestr_vehicles", vehicleid);

	var front_rear_detents_count = 0; // упоры передний и задний объединенный
	var gondola_hatches_count = 0;	// крышка люка полувагона
	var carts_count = 0;			//тележка
	var removable_carcass_count = 0; // сменный жд кузов
	var vagon_tank_body_count = 0; // котел вагона-цистерны
	var autocouplers_count = 0; // автосцепка
	var absorbing_device_count = 0; // Поглощающий аппарат
	var traction_clamp_count = 0; // Хомут тяговый
	var air_distributor_count = 0; // Воздухораспределитель в сборе
	var auto_mode_cargo_count = 0; // Авторежим грузовой

	//Получение узлов, установленных на вагон
	var nodes = db.findbyparams("reestr_ke_nodes", {
		vehicle: vehicleid
	});

	if (isEmptyOrNullArray(nodes)) {
		nodes = [];
	}

	//Получение СЧ, установленных на вагон
	var key_elements = db.findbyparams("reestr_key_elements", {
		vehicle: vehicleid
	});

	if (isEmptyOrNullArray(key_elements)) {
		key_elements = [];
	}

	//Получение количества установленных узлов
	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];

		//Тележка
		if (node.ke_node_type == 'cbb9d8cb-89ef-4b99-be77-a7d6e57e388e') {
			carts_count++;
		}
		//Автосцепка СА-3
		if (node.ke_node_type == 'ae11ae44-1c69-49e0-83a1-4122bb2d80ae') {
			autocouplers_count++;
		}
		//Котел вагона-цистерны
		if (node.ke_node_type == '79ddf686-f26f-4567-97ac-cb18eadd83e9') {
			vagon_tank_body_count++;
		}

		//Поглощающий аппарат
		if (node.ke_node_type == '700b86ca-5b88-44d6-a5d3-c2c4e76d96f8') {
			absorbing_device_count++;
		}

		//Воздухораспределитель в сборе
		if (node.ke_node_type == 'a6180bfa-368d-4eff-97f2-c4f6c2612bc6') {
			air_distributor_count++;
		}
	}

	//Получение количества установленных СЧ
	for (var i = 0; i < key_elements.length; i++) {
		var key_element = key_elements[i];
		//Упоры передний и задний объединенные
		if (key_element.key_element_code == keyElementCodes.front_rear_detents_id) {
			front_rear_detents_count++;;
		}
		//Крышка люка полувагона
		if (key_element.key_element_code == keyElementCodes.gondola_hatch_id) {
			gondola_hatches_count++;
		}
		//Сменный железнодорожный кузов
		if (key_element.key_element_code == keyElementCodes.removable_railway_carcass_id) {
			removable_carcass_count++;
		}

		//Хомут тяговый
		if (key_element.key_element_code == keyElementCodes.traction_clamp_id) {
			traction_clamp_count++;
		}

		//Авторежим
		if (key_element.key_element_code == keyElementCodes.auto_mode_cargo_id) {
			auto_mode_cargo_count++;
		}
	}

	// Получение общего количества СЧ/се установленных на вагон
	var count_elements_setup_on_vagon = parseInt(carts_count) + parseInt(autocouplers_count) + parseInt(vagon_tank_body_count) + parseInt(absorbing_device_count) + parseInt(air_distributor_count) + parseInt(front_rear_detents_count) + parseInt(gondola_hatches_count) + parseInt(removable_carcass_count) + parseInt(traction_clamp_count) + parseInt(auto_mode_cargo_count);

	// 13.08.2020 amaslov 42345 Снятие флага "Учет установки СЧ" при изменении состава ТС
	reestr_vehicles_fields.element_install_registratred = false;

	//Если вагон наполнен полностью, обновляем дату комплектации и флаг 13.09.2020 amaslov 43591.
	var check_complectation_result = check_vehicle_complectation(reestr_vehicles_fields);
	if (check_complectation_result.success) {
		reestr_vehicles_fields.complectation_date = new Date();
		reestr_vehicles_fields.is_completed = true;
	} else {
		reestr_vehicles_fields.is_completed = false;
	}

	reestr_vehicles_fields.count_installed_elements = count_elements_setup_on_vagon.toString();
	var update = db.update("reestr_vehicles", reestr_vehicles_fields);

	if (!update) {
		return badResp("Не удалось обновить запись заявления");
	}
	return successResp("Количество СЧ/СЕ, установленных на ТС, успешно обновлено");
}

// Установить СЧ на вагон.
function apiaddketowagon(requestdata) {
	var res = true;
	var isparamsvalid = true;
	var errormessage = "Ошибка в параметрах. ";

	var reestr_key_elementsTmp_params = {
		"numberke": requestdata.numberke
	};
	var reestr_key_elementsTmps = db.findbyparams("reestr_key_elements", reestr_key_elementsTmp_params)
	if (isEmptyOrNullArray(reestr_key_elementsTmps)) {
		return badResp("составная часть не найден в системе.");
	}
	var reestr_key_elementsTmp = reestr_key_elementsTmps[0];

	if (isNotEmptyString(reestr_key_elementsTmp.vehicle)) {
		return badResp("СЧ с номером \"" + requestdata.numberke + "\" уже установлен на вагон.");
	}

	if (reestr_key_elementsTmp.statuske == commonConst.ZapreshenId) {
		return badResp("СЧ в статусе \"Запрещен к обращению\" нельзя установить на вагон.");
	}

	var gamma_percent_resource_end_date = null;

	// Если Балка надрессорная, Рама боковая, то проверяем наличие параметра "Год окончания гамма-процентного ресурса детали"
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.pressure_beam_id
		|| reestr_key_elementsTmp.key_element_code == keyElementCodes.side_frame_id) {
		if (isEmptyString(reestr_key_elementsTmp.gamma_percent_resource_end_date)
			&& isEmptyString(requestdata.gamma_percent_resource_end_date)) {
			return badResp("Необходимо заполнить поле - Год окончания гамма-процентного ресурса детали, УИН: " + reestr_key_elementsTmp.numberke);
		}

		gamma_percent_resource_end_date = isNotEmptyString(requestdata.gamma_percent_resource_end_date)
			? requestdata.gamma_percent_resource_end_date
			: reestr_key_elementsTmp.gamma_percent_resource_end_date;
	}

	var reestr_vehiclesTmp = null;
	if (!!requestdata.wagonnumber) {
		var reestr_vehiclesTmp_params = {
			"vagon_number": requestdata.wagonnumber
		};
		var reestr_vehiclesTmps = db.findbyparams("reestr_vehicles", reestr_vehiclesTmp_params)
		if (isEmptyOrNullArray(reestr_vehiclesTmps)) {
			return badResp("Вагон не найден в системе.");
		}
		reestr_vehiclesTmp = reestr_vehiclesTmps[0];
	}
	else {
		var reestr_vehiclesTmp_params = {
			"manufacturer_number": requestdata.manufacturernumber
		};
		var reestr_vehiclesTmps = db.findbyparams("reestr_vehicles", reestr_vehiclesTmp_params);
		if (isEmptyOrNullArray(reestr_vehiclesTmps)) {
			return badResp("Вагон не найден в системе.");
		}

		reestr_vehiclesTmp = reestr_vehiclesTmps[0];
	}

	//dictionary_count_ke_on_vagon
	var dictionary_count_ke_on_vagonTmp = null;

	var dictionary_count_ke_on_vagonTmp_params = {
		"model_vagon": reestr_vehiclesTmp.dictionary_models
	};
	var dictionary_count_ke_on_vagonTmps = db.findbyparams("dictionary_count_ke_on_vagon", dictionary_count_ke_on_vagonTmp_params);
	if (isEmptyOrNullArray(dictionary_count_ke_on_vagonTmps)) {
		return badResp("В системе не найдена информация по возможному количеству СЧ для данной модели вагона.");
	}

	dictionary_count_ke_on_vagonTmp = dictionary_count_ke_on_vagonTmps[0];

	var vagonnumbersetter = null;

	if (!!reestr_vehiclesTmp.vagon_number_set_member) {
		vagonnumbersetter = db.findbyrecid("reestr_members", reestr_vehiclesTmp.vagon_number_set_member);
		if (isNullObject(vagonnumbersetter)) {
			return badResp("Предприятие сопоставления сетевого номера заводскому не найдено в системе.");
		}
	}

	//reestr_key_elements
	var reestr_key_elementsByTsTmp_params = {
		"vehicle": reestr_vehiclesTmp.recid
	};
	var reestr_key_elementsByTsTmps = db.findbyparams("reestr_key_elements", reestr_key_elementsByTsTmp_params)

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

	if (!!reestr_key_elementsByTsTmps) {
		// "Колесная пара"
		// {"name": "wheel_pair",
		// 	"type": "dictionary_count_ke_on_vagon_wheel_pair"
		// },
		// "Боковая рама"
		// {"name": "side_frame",
		// 	"type": "dictionary_count_ke_on_vagon_side_frame"
		// },
		// "Надрессорная балка"
		// {"name": "pressure_beam",
		// 	"type": "dictionary_count_ke_on_vagon_pressure_beam"
		// },
		// "Главная часть воздухораспределителя"
		// {"name": "air_distributor",
		// 	"type": "dictionary_count_ke_on_vagon_air_distributor"
		// },
		// "Поглощающий аппарат"
		// {"name": "absorbing_device",
		// 	"type": "dictionary_count_ke_on_vagon_absorbing_device"
		// },


		// "Авторежим"
		// {"name": "auto_mode",
		// 	"type": "dictionary_count_ke_on_vagon_auto_mode"
		// },
		// "Клин фрикционный"
		// {"name": "friction_wedge",
		// 	"type": "dictionary_count_ke_on_vagon_friction_wedge"
		// },
		// "Корпус скользуна"
		// {"name": "slider_body",
		// 	"type": "dictionary_count_ke_on_vagon_slider_body"
		// },
		// "Колпак скользуна"
		// {"name": "slider_cap",
		// 	"type": "dictionary_count_ke_on_vagon_slider_cap"
		// },
		// "Адаптер колеса"
		// {"name": "wheel_adapter",
		// 	"type": "dictionary_count_ke_on_vagon_wheel_adapter"
		// }

		// Тормозной цилиндр
		// {"name": "brake_cylinder",
		// 	"type": "dictionary_count_ke_on_vagon_brake_cylinder"
		// },
		// Пружины рессорного подвешивания подклиновая наружная
		// {"name": "spring_suspension_under_wedge_external",
		// 	"type": "dictionary_count_ke_on_vagon_spring_suspension_under_wedge_external"
		// },
		// Пружины рессорного подвешивания подклиновая внутренняя
		// {"name": "spring_suspension_under_wedge_internal",
		// 	"type": "dictionary_count_ke_on_vagon_spring_suspension_under_wedge_internal"
		// },
		// Пружины рессорного подвешивания наружная
		// {"name": "spring_suspension_external",
		// 	"type": "dictionary_count_ke_on_vagon_spring_suspension_external"
		// },
		// Пружины рессорного подвешивания внутренняя
		// {"name": "spring_suspension_internal",
		// 	"type": "dictionary_count_ke_on_vagon_spring_suspension_internal"
		// },
		// Пружины скользуна наружная
		// {"name": "spring_slider_external",
		// 	"type": "dictionary_count_ke_on_vagon_spring_slider_external"
		// },
		// Пружины скользуна внутренняя
		// {"name": "spring_slider_internal",
		// 	"type": "dictionary_count_ke_on_vagon_spring_slider_internal"
		// },
		// Резервуары воздушные для автотормозов
		// {"name": "air_tank_auto_brakes",
		// 	"type": "dictionary_count_ke_on_vagon_air_tank_auto_brakes"
		// },
		// Тяговый хомут автосцепки
		// {"name": "traction_clamp_coupling",
		// 	"type": "dictionary_count_ke_on_vagon_traction_clamp_coupling"
		// },
		// Триангель
		// {"name": "triangel",
		// 	"type": "dictionary_count_ke_on_vagon_triangel"
		// },
		// Магистральная часть воздухораспределителя
		// {"name": "trunk_part_air_distributor",
		// 	"type": "dictionary_count_ke_on_vagon_trunk_part_air_distributor"
		// }
		// Сменный ЖД кузов
		// {"name": "railway_carcass",
		// 	"type": "dictionary_count_ke_on_vagon_removable_railway_carcass"
		// }
		// Планка фрикционная
		// {"name": "friction_strip",
		// 	"type": "dictionary_count_ke_on_vagon_friction_strip"
		// }
		// Скоба
		// {"name": "brace",
		// 	"type": "dictionary_count_ke_on_vagon_brace"
		// }
		// Чистовая ось
		// {"name": "clear_axis",
		// 	"type": "dictionary_count_ke_onvagonclear_axis"
		// }
		// Колесо
		// {"name": "wheel",
		// 	"type": "dictionary_count_ke_on_vagon_wheel"
		// }
		// Пластины в клиновых карманах
		// {
		// 	"name": "wedge_pockets",
		// 	"type": "dictionary_count_ke_on_vagon_wedge_pockets"
		// },
		// Кольцо в подпятник
		// {
		// 	"name": "saddle_rings",
		// 	"type": "dictionary_count_ke_on_vagon_saddle_rings"
		// },
		// Вставки в клиновые карманы
		// {
		// 	"name": "wedge_pockets_inserts",
		// 	"type": "dictionary_count_ke_on_vagon_wedge_pockets_inserts"
		// },
		// Вкладыш подпятника
		// {
		// 	"name": "saddle_bearings",
		// 	"type": "dictionary_count_ke_on_vagon_saddle_bearings"
		// },
		// Замок
		// {
		// 	"name": "locks",
		// 	"type": "dictionary_count_ke_on_vagon_locks"
		// },
		// Валик подъемника
		// {
		// 	"name": "elevator_rolls",
		// 	"type": "dictionary_count_ke_on_vagon_elevator_rolls"
		// },
		// Корпус автосцепки
		// {
		// 	"name": "auto_couplers",
		// 	"type": "dictionary_count_ke_on_vagon_auto_couplers"
		// }

		for (var i = 0; i < reestr_key_elementsByTsTmps.length; i++) {
			var reestr_key_elementsByTsTmp = reestr_key_elementsByTsTmps[i];
			// Балка надрессорная
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.pressure_beam_id) {
				pressure_beam_count++;
			}
			// Рама боковая
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.side_frame_id) {
				side_frame_count++
			}
			// Колесная пара в сборе
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.wheel_pair_id) {
				wheel_pair_count++;
			}
			// Главная часть воздухораспределителя
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.main_part_air_distributor_id) {
				air_distributor_count++;
			}
			// Поглощающий аппарат
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.absorbing_device_id) {
				absorbing_device_count++;
			}
			// Авторежим
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.auto_mode_id) {
				auto_mode_count++;
			}
			// Клин фрикционный
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.friction_wedge_id) {
				friction_wedge_count++;
			}
			// Корпус скользуна
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.slider_body_id) {
				slider_body_count++;
			}
			// Колпак скользуна
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.slider_cap_id) {
				slider_cap_count++;
			}
			// Адаптер колеса
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.wheel_adapter_id) {
				wheel_adapter_count++;
			}

			// Тормозной цилиндр
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.brake_cylinder_id) {
				brake_cylinder_count++;
			}
			// Пружины рессорного подвешивания подклиновая наружная
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.spring_suspension_under_wedge_external_id) {
				spring_suspension_under_wedge_external_count++;
			}
			// Пружины рессорного подвешивания подклиновая внутренняя
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.spring_suspension_under_wedge_internal_id) {
				spring_suspension_under_wedge_internal_count++;
			}
			// Пружины рессорного подвешивания наружная
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.spring_suspension_external_id) {
				spring_suspension_external_count++;
			}
			// Пружины рессорного подвешивания внутренняя
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.spring_suspension_internal_id) {
				spring_suspension_internal_count++;
			}
			// Пружины скользуна наружная
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.spring_slider_external_id) {
				spring_slider_external_count++;
			}
			// Пружины скользуна внутренняя
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.spring_slider_internal_id) {
				spring_slider_internal_count++;
			}
			// Резервуары воздушные для автотормозов
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.air_tank_auto_brakes_id) {
				air_tank_auto_brakes_count++;
			}
			// Тяговый хомут автосцепки
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.traction_clamp_coupling_id) {
				traction_clamp_coupling_count++;
			}
			// Триангель
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.triangel_id) {
				triangel_count++;
			}
			// Магистральная часть воздухораспределителя
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.trunk_part_air_distributor_id) {
				trunk_part_air_distributor_count++;
			}
			// Адаптер подшипника
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.bearing_adapter_id) {
				bearing_adapter_count++;
			}
			//Сменный ЖД кузов
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.removable_railway_carcass_id) {
				removable_railway_carcass_count++;
			}
			//Планка фрикционная
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.friction_strip_id) {
				friction_strip_count++;
			}
			//Скоба
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.brace_id) {
				brace_count++;
			}
			//Ось чистовая
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.clear_axis_id) {
				clear_axis_count++;
			}
			//Колесо
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.wheel_id) {
				wheel_count++;
			}
			//Пластины в клиновых карманах
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.wedge_pockets_id) {
				wedge_pockets_count++;
			}
			//Кольцо в подпятник
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.saddle_ring_id) {
				saddle_rings_count++;
			}
			//Вставки в клиновые карманы
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.wedge_pockets_inserts_id) {
				wedge_pockets_inserts_count++;
			}
			//Вкладыш подпятника
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.saddle_bearing_id) {
				saddle_bearings_count++;
			}
			//Замок
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.lock_id) {
				locks_count++;
			}
			//Валик подъемника
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.elevator_roll_id) {
				elevator_rolls_count++
			}
			//Корпус автосцепки
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.auto_coupler_id) {
				auto_couplers_count++
			}
			//Упоры передний и задний объединенные
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.front_rear_detents_id) {
				front_rear_detents_count++
			}
			//Крышка люка полувагона
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.gondola_hatch_id) {
				gondola_hatches_count++
			}
			//Ось черновая
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.rough_axis_id) {
				rough_axis_count++;
			}
		}
	}

	// Балка надрессорная
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.pressure_beam_id &&
		pressure_beam_count >= dictionary_count_ke_on_vagonTmp.pressure_beam) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Балка надрессорная, уже установлено максимальное количество элементов '" + pressure_beam_count + "'.";

	}
	// Рама боковая
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.side_frame_id &&
		side_frame_count >= dictionary_count_ke_on_vagonTmp.side_frame) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Рама боковая, уже установлено максимальное количество элементов '" + side_frame_count + "'.";
	}
	// Колесная пара в сборе
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.wheel_pair_id &&
		wheel_pair_count >= dictionary_count_ke_on_vagonTmp.wheel_pair) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Колесная пара в сборе, уже установлено максимальное количество элементов '" + wheel_pair_count + "'.";
	}
	// Главная часть воздухораспределителя
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.main_part_air_distributor_id &&
		air_distributor_count >= dictionary_count_ke_on_vagonTmp.air_distributor) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Главная часть воздухораспределителя, уже установлено максимальное количество элементов '" + air_distributor_count + "'.";
	}
	// Поглощающий аппарат
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.absorbing_device_id &&
		absorbing_device_count >= dictionary_count_ke_on_vagonTmp.absorbing_device) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Поглощающий аппарат, уже установлено максимальное количество элементов '" + absorbing_device_count + "'.";
	}
	// Авторежим
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.auto_mode_id &&
		auto_mode_count >= dictionary_count_ke_on_vagonTmp.auto_mode) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Авторежим, уже установлено максимальное количество элементов '" + auto_mode_count + "'.";
	}
	// Клин фрикционный
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.friction_wedge_id &&
		friction_wedge_count >= dictionary_count_ke_on_vagonTmp.friction_wedge) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Клин фрикционный, уже установлено максимальное количество элементов '" + friction_wedge_count + "'.";
	}
	// Корпус скользуна
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.slider_body_id &&
		slider_body_count >= dictionary_count_ke_on_vagonTmp.slider_body) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Корпус скользуна, уже установлено максимальное количество элементов '" + slider_body_count + "'.";
	}
	// Колпак скользуна
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.slider_cap_id &&
		slider_cap_count >= dictionary_count_ke_on_vagonTmp.slider_cap) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Колпак скользуна, уже установлено максимальное количество элементов '" + slider_cap_count + "'.";
	}
	// Адаптер колеса
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.wheel_adapter_id &&
		wheel_adapter_count >= dictionary_count_ke_on_vagonTmp.wheel_adapter) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Адаптер колеса, уже установлено максимальное количество элементов '" + wheel_adapter_count + "'.";
	}

	// Тормозной цилиндр
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.brake_cylinder_id &&
		brake_cylinder_count >= dictionary_count_ke_on_vagonTmp.brake_cylinder) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Тормозной цилиндр, уже установлено максимальное количество элементов '" + brake_cylinder_count + "'.";
	}
	// Пружины рессорного подвешивания подклиновая наружная
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.spring_suspension_under_wedge_external_id &&
		spring_suspension_under_wedge_external_count >= dictionary_count_ke_on_vagonTmp.spring_suspension_under_wedge_external) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Пружины рессорного подвешивания подклиновая наружная, уже установлено максимальное количество элементов '" + spring_suspension_under_wedge_external_count + "'.";
	}
	// Пружины рессорного подвешивания подклиновая внутренняя
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.spring_suspension_under_wedge_internal_id &&
		spring_suspension_under_wedge_internal_count >= dictionary_count_ke_on_vagonTmp.spring_suspension_under_wedge_internal) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Пружины рессорного подвешивания подклиновая внутренняя, уже установлено максимальное количество элементов '" + spring_suspension_under_wedge_internal_count + "'.";
	}
	// Пружины рессорного подвешивания наружная
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.spring_suspension_external_id &&
		spring_suspension_external_count >= dictionary_count_ke_on_vagonTmp.spring_suspension_external) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Пружины рессорного подвешивания наружная, уже установлено максимальное количество элементов '" + spring_suspension_external_count + "'.";
	}
	// Пружины рессорного подвешивания внутренняя
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.spring_suspension_internal_id &&
		spring_suspension_internal_count >= dictionary_count_ke_on_vagonTmp.spring_suspension_internal) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Пружины рессорного подвешивания внутренняя, уже установлено максимальное количество элементов '" + spring_suspension_internal_count + "'.";
	}
	// Пружины скользуна наружная
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.spring_slider_external_id &&
		spring_slider_external_count >= dictionary_count_ke_on_vagonTmp.spring_slider_external) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Пружины скользуна наружная, уже установлено максимальное количество элементов '" + spring_slider_external_count + "'.";
	}
	// Пружины скользуна внутренняя
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.spring_slider_internal_id &&
		spring_slider_internal_count >= dictionary_count_ke_on_vagonTmp.spring_slider_internal) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Пружины скользуна внутренняя, уже установлено максимальное количество элементов '" + spring_slider_internal_count + "'.";
	}
	// Резервуары воздушные для автотормозов
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.air_tank_auto_brakes_id &&
		air_tank_auto_brakes_count >= dictionary_count_ke_on_vagonTmp.air_tank_auto_brakes) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Резервуары воздушные для автотормозов, уже установлено максимальное количество элементов '" + air_tank_auto_brakes_count + "'.";
	}
	// Тяговый хомут автосцепки
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.traction_clamp_coupling_id &&
		traction_clamp_coupling_count >= dictionary_count_ke_on_vagonTmp.traction_clamp_coupling) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Тяговый хомут автосцепки, уже установлено максимальное количество элементов '" + traction_clamp_coupling_count + "'.";
	}
	// Триангель
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.triangel_id &&
		triangel_count >= dictionary_count_ke_on_vagonTmp.triangel) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Триангель, уже установлено максимальное количество элементов '" + triangel_count + "'.";
	}
	// Магистральная часть воздухораспределителя
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.trunk_part_air_distributor_id &&
		trunk_part_air_distributor_count >= dictionary_count_ke_on_vagonTmp.trunk_part_air_distributor) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Магистральная часть воздухораспределителя, уже установлено максимальное количество элементов '" + trunk_part_air_distributor_count + "'.";
	}
	// Адаптер подшипника
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.bearing_adapter_id &&
		bearing_adapter_count >= dictionary_count_ke_on_vagonTmp.bearing_adapter) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Адаптер подшипника, уже установлено максимальное количество элементов '" + bearing_adapter_count + "'.";
	}
	// Сменный ЖД кузов
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.removable_railway_carcass_id &&
		removable_railway_carcass_count >= dictionary_count_ke_on_vagonTmp.railway_carcass) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Сменный ЖД кузов, уже установлено максимальное количество элементов '" + removable_railway_carcass_count + "'.";
	}
	// Планка фрикционная
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.friction_strip_id &&
		friction_strip_count >= dictionary_count_ke_on_vagonTmp.friction_strip) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Планка фрикционная, уже установлено максимальное количество элементов '" + friction_strip_count + "'.";
	}
	// Скоба
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.brace_id &&
		brace_count >= dictionary_count_ke_on_vagonTmp.brace) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Скоба, уже установлено максимальное количество элементов '" + brace_count + "'.";
	}
	// Ось чистовая
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.clear_axis_id &&
		clear_axis_count >= dictionary_count_ke_on_vagonTmp.clear_axis) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Ось чистовая, уже установлено максимальное количество элементов '" + clear_axis_count + "'.";
	}
	// Колесо
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.wheel_id &&
		wheel_count >= dictionary_count_ke_on_vagonTmp.wheel) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Колесо, уже установлено максимальное количество элементов '" + wheel_count + "'.";
	}
	// Пластины в клиновых карманах
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.wedge_pockets_id &&
		wedge_pockets_count >= dictionary_count_ke_on_vagonTmp.wedge_pockets) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Пластины в клиновых карманах, уже установлено максимальное количество элементов '" + wedge_pockets_count + "'.";
	}
	// Кольцо в подпятник
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.saddle_ring_id &&
		saddle_rings_count >= dictionary_count_ke_on_vagonTmp.saddle_rings) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Пластины в клиновых карманах, уже установлено максимальное количество элементов '" + saddle_rings_count + "'.";
	}
	// Вставки в клиновые карманы
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.wedge_pockets_inserts_id &&
		wedge_pockets_inserts_count >= dictionary_count_ke_on_vagonTmp.wedge_pockets_inserts) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Вставки в клиновые карманы, уже установлено максимальное количество элементов '" + wedge_pockets_inserts_count + "'.";
	}
	// Вкладыш подпятника
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.saddle_bearing_id &&
		saddle_bearings_count >= dictionary_count_ke_on_vagonTmp.saddle_bearings) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Вкладыш подпятника, уже установлено максимальное количество элементов '" + saddle_bearings_count + "'.";
	}
	// Замок
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.lock_id &&
		locks_count >= dictionary_count_ke_on_vagonTmp.locks) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Замок, уже установлено максимальное количество элементов '" + locks_count + "'.";
	}
	// Валик подъемника
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.elevator_roll_id &&
		elevator_rolls_count >= dictionary_count_ke_on_vagonTmp.elevator_rolls) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Валик подъемника, уже установлено максимальное количество элементов '" + elevator_rolls_count + "'.";
	}
	// Корпус автосцепки
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.auto_coupler_id &&
		auto_couplers_count >= dictionary_count_ke_on_vagonTmp.auto_couplers) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Корпус автосцепки, уже установлено максимальное количество элементов '" + auto_couplers_count + "'.";
	}
	// Упоры передний и задний объединенные
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.front_rear_detents_id &&
		front_rear_detents_count >= dictionary_count_ke_on_vagonTmp.front_rear_detents) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Упоры передний и задний объединенные, уже установлено максимальное количество элементов '" + front_rear_detents_count + "'.";
	}
	// Крышка люка полувагона
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.gondola_hatch_id &&
		gondola_hatches_count >= dictionary_count_ke_on_vagonTmp.gondola_hatches) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Крышка люка полувагона, уже установлено максимальное количество элементов '" + gondola_hatches_count + "'.";
	}

	// Ось черновая
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.rough_axis_id &&
		rough_axis_count >= dictionary_count_ke_on_vagonTmp.rough_axis) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Ось черновая, уже установлено максимальное количество элементов '" + rough_axis_count + "'.";
	}

	var nodeip = getnodeipbymember(reestr_key_elementsTmp.owner);
	if (isEmptyString(nodeip)) {
		return badResp("Не удалось определить IP адрес блокчейна.");
	}

	var member = null;
	if (isEmptyString(requestdata.memberid)) {
		member = getmemberbyuser();
	} else {
		member = db.findbyrecid("reestr_members", requestdata.memberid);
	}

	if (isNullObject(member)) {
		return badResp("Не удалось определить участника для текущего пользователя.");
	}

	var position_on_vagon = isNotEmptyString(requestdata.wagon_position)
		? db.findbyrecid("dictionary_positions_on_vagon", requestdata.wagon_position)
		: null;
	var position_on_vagon_recname = isNotNullObject(position_on_vagon)
		? position_on_vagon.recname
		: "отсутствует";

	if (isparamsvalid) {
		var addtowagonbch = {
			"nodeip": nodeip,

			"link":
			{
				"hash": reestr_key_elementsTmp.blockchainhash,
				"node": reestr_key_elementsTmp.blockchainnode,
				"recn": reestr_key_elementsTmp.blockchainrecn,
				"tn": reestr_key_elementsTmp.blockchaintn
			},

			// Заводской номер вагона
			"vehicle_manufacturer_number": reestr_vehiclesTmp.manufacturer_number,
			// Дата установки СЧ на вагон
			"install_ke_date": requestdata.date,
			// Позиция СЧ на вагоне
			"position_on_vagon": position_on_vagon_recname
		};

		// Год окончания гамма-процентного ресурса детали
		if (isNotEmptyString(gamma_percent_resource_end_date)) {
			addtowagonbch.gamma_percent_resource_end_date = gamma_percent_resource_end_date;
		}

		var blockchainResponse = addtowagonblockchain(addtowagonbch);

		if (!!blockchainResponse.result) {
			reestr_key_elementsTmp.vehicle = reestr_vehiclesTmp.recid;
			reestr_key_elementsTmp.install_ke_date = requestdata.date;
			reestr_key_elementsTmp.position_on_vagon = requestdata.wagon_position;
			reestr_key_elementsTmp.statuske = "a0b630bc-fbed-4863-9053-6cec9ee3a459";
			reestr_key_elementsTmp.last_blockchain_request = JSON.stringify(blockchainResponse.request);

			var logItem = set_ke_log(reestr_key_elementsTmp, "bb7492ac-7097-4870-8f04-fae9b6d6e2c6");

			// Если у ТС указано Доверенное предприятие, проверяем все СЧ.
			// Если у СЧ Доверенное предприятие отличается от того, которое указано в ТС, заменяем его
			if (isNotEmptyString(reestr_vehiclesTmp.trusted_manufacturer)
				&& reestr_key_elementsTmp.trusted_manufacturer != reestr_vehiclesTmp.trusted_manufacturer) {
				reestr_key_elementsTmp.trusted_manufacturer = reestr_vehiclesTmp.trusted_manufacturer;
			}

			// Если "Год окончания гамма-процентного ресурса детали", указанный в СЧ не заполнен 
			// или отличается от переданного во входных данных, то обновляем его
			if (isEmptyString(reestr_key_elementsTmp.gamma_percent_resource_end_date)
				|| reestr_key_elementsTmp.gamma_percent_resource_end_date != gamma_percent_resource_end_date) {
				reestr_key_elementsTmp.gamma_percent_resource_end_date = gamma_percent_resource_end_date;
			}

			res = res && db.update("reestr_key_elements", reestr_key_elementsTmp);

			//res = res && db.insert("log", logItem);
			MakeLogRecord("log", logItem, rzd_url.rzd_name_url);

			event.log("reestr_key_elements",
				reestr_key_elementsTmp.recid,
				"СЧ с номером " + reestr_key_elementsTmp.numberke + " установлен на ТС с номером " + requestdata.wagonnumber + ".",
				eventTypeEnum.Info,
				addtowagonbch);
		}
		else {
			return {
				success: false,
				message: blockchainResponse
			};
		}
	}

	if (!isparamsvalid) {
		return badResp(errormessage);
	} else {
		return successResp();
	}
}

// Подготовить запрос в блокчейн. Метод сделан в рамках задачи #27901
function addkeprepareblockchainrequest(requestdata) {
	var res = true;
	var isparamsvalid = true;
	var errormessage = "Ошибка в параметрах. ";

	var reestr_key_elementsTmp_params = {
		"numberke": requestdata.numberke
	};
	var reestr_key_elementsTmps = db.findbyparams("reestr_key_elements", reestr_key_elementsTmp_params)
	if (isEmptyOrNullArray(reestr_key_elementsTmps)) {
		return badResp("составная часть не найден в системе.");
	}
	var reestr_key_elementsTmp = reestr_key_elementsTmps[0];

	if (isNotEmptyString(reestr_key_elementsTmp.vehicle)) {
		return badResp("СЧ с номером \"" + requestdata.numberke + "\" уже установлен на вагон.");
	}

	if (reestr_key_elementsTmp.statuske == commonConst.ZapreshenId) {
		return badResp("СЧ в статусе \"Запрещен к обращению\" нельзя установить на вагон.");
	}

	var gamma_percent_resource_end_date = null;

	// Если Балка надрессорная, Рама боковая, то проверяем наличие параметра "Год окончания гамма-процентного ресурса детали"
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.pressure_beam_id
		|| reestr_key_elementsTmp.key_element_code == keyElementCodes.side_frame_id) {
		if (isEmptyString(reestr_key_elementsTmp.gamma_percent_resource_end_date)
			&& isEmptyString(requestdata.gamma_percent_resource_end_date)) {
			return badResp("Необходимо заполнить поле - Год окончания гамма-процентного ресурса детали, УИН: " + reestr_key_elementsTmp.numberke);
		}

		gamma_percent_resource_end_date = isNotEmptyString(requestdata.gamma_percent_resource_end_date)
			? requestdata.gamma_percent_resource_end_date
			: reestr_key_elementsTmp.gamma_percent_resource_end_date;
	}

	if (isEmptyString(requestdata.wagonid)) {
		return badResp("Идентификатор ТС не указан в параметрах");
	}
	var reestr_vehiclesTmp = db.findbyrecid("reestr_vehicles", requestdata.wagonid);
	if (isNullObject(reestr_vehiclesTmp)) {
		return badResp("Запись ТС не найдена в системе.")
	}

	//dictionary_count_ke_on_vagon
	var dictionary_count_ke_on_vagonTmp = null;

	var dictionary_count_ke_on_vagonTmp_params = {
		"model_vagon": reestr_vehiclesTmp.dictionary_models
	};
	var dictionary_count_ke_on_vagonTmps = db.findbyparams("dictionary_count_ke_on_vagon", dictionary_count_ke_on_vagonTmp_params);
	if (isEmptyOrNullArray(dictionary_count_ke_on_vagonTmps)) {
		return badResp("В системе не найдена информация по возможному количеству СЧ для данной модели вагона.");
	}

	dictionary_count_ke_on_vagonTmp = dictionary_count_ke_on_vagonTmps[0];
	var vagonnumbersetter = null;

	if (!!reestr_vehiclesTmp.vagon_number_set_member) {
		vagonnumbersetter = db.findbyrecid("reestr_members", reestr_vehiclesTmp.vagon_number_set_member);
		if (isNullObject(vagonnumbersetter)) {
			return badResp("Предприятие сопоставления сетевого номера заводскому не найдено в системе.");
		}
	}

	//reestr_key_elements
	var reestr_key_elementsByTsTmp_params = {
		"vehicle": reestr_vehiclesTmp.recid
	};
	var reestr_key_elementsByTsTmps = db.findbyparams("reestr_key_elements", reestr_key_elementsByTsTmp_params)

	var wheel_pair_count = 0;
	var side_frame_count = 0;
	var pressure_beam_count = 0;
	var air_distributor_count = 0;
	var absorbing_device_count = 0;

	var coupler_count = 0;
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


	if (!!reestr_key_elementsByTsTmps) {
		for (var i = 0; i < reestr_key_elementsByTsTmps.length; i++) {
			var reestr_key_elementsByTsTmp = reestr_key_elementsByTsTmps[i];
			// Балка надрессорная
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.pressure_beam_id) {
				pressure_beam_count++;
			}
			// Рама боковая
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.side_frame_id) {
				side_frame_count++
			}
			// Колесная пара в сборе
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.wheel_pair_id) {
				wheel_pair_count++;
			}
			// Главная часть воздухораспределителя
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.main_part_air_distributor_id) {
				air_distributor_count++;
			}
			// Поглощающий аппарат
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.absorbing_device_id) {
				absorbing_device_count++;
			}
			// Авторежим
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.auto_mode_id) {
				auto_mode_count++;
			}
			// Клин фрикционный
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.friction_wedge_id) {
				friction_wedge_count++;
			}
			// Корпус скользуна
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.slider_body_id) {
				slider_body_count++;
			}
			// Колпак скользуна
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.slider_cap_id) {
				slider_cap_count++;
			}
			// Адаптер колеса
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.wheel_adapter_id) {
				wheel_adapter_count++;
			}

			// Тормозной цилиндр
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.brake_cylinder_id) {
				brake_cylinder_count++;
			}
			// Пружины рессорного подвешивания подклиновая наружная
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.spring_suspension_under_wedge_external_id) {
				spring_suspension_under_wedge_external_count++;
			}
			// Пружины рессорного подвешивания подклиновая внутренняя
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.spring_suspension_under_wedge_internal_id) {
				spring_suspension_under_wedge_internal_count++;
			}
			// Пружины рессорного подвешивания наружная
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.spring_suspension_external_id) {
				spring_suspension_external_count++;
			}
			// Пружины рессорного подвешивания внутренняя
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.spring_suspension_internal_id) {
				spring_suspension_internal_count++;
			}
			// Пружины скользуна наружная
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.spring_slider_external_id) {
				spring_slider_external_count++;
			}
			// Пружины скользуна внутренняя
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.spring_slider_internal_id) {
				spring_slider_internal_count++;
			}
			// Резервуары воздушные для автотормозов
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.air_tank_auto_brakes_id) {
				air_tank_auto_brakes_count++;
			}
			// Тяговый хомут автосцепки
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.traction_clamp_coupling_id) {
				traction_clamp_coupling_count++;
			}
			// Триангель
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.triangel_id) {
				triangel_count++;
			}
			// Магистральная часть воздухораспределителя
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.trunk_part_air_distributor_id) {
				trunk_part_air_distributor_count++;
			}
			// Адаптер подшипника
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.bearing_adapter_id) {
				bearing_adapter_count++;
			}
			//Сменный ЖД кузов
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.removable_railway_carcass_id) {
				removable_railway_carcass_count++;
			}
			//Планка фрикционная
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.friction_strip_id) {
				friction_strip_count++;
			}
			//Скоба
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.brace_id) {
				brace_count++;
			}
			//Ось чистовая
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.clear_axis_id) {
				clear_axis_count++;
			}
			//Колесо
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.wheel_id) {
				wheel_count++;
			}
			//Пластины в клиновых карманах
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.wedge_pockets_id) {
				wedge_pockets_count++;
			}
			//Кольцо в подпятник
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.saddle_ring_id) {
				saddle_rings_count++;
			}
			//Вставки в клиновые карманы
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.wedge_pockets_inserts_id) {
				wedge_pockets_inserts_count++;
			}
			//Вкладыш подпятника
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.saddle_bearing_id) {
				saddle_bearings_count++;
			}
			//Замок
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.lock_id) {
				locks_count++;
			}
			//Валик подъемника
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.elevator_roll_id) {
				elevator_rolls_count++;
			}
			//Корпус автосцепки
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.auto_coupler_id) {
				auto_couplers_count++;
			}
			//Упоры передний и задний объединенные
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.front_rear_detents_id) {
				front_rear_detents_count++;
			}
			//Корпус автосцепки
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.gondola_hatch_id) {
				gondola_hatches_count++;
			}
			//Ось черновая
			if (reestr_key_elementsByTsTmp.key_element_code == keyElementCodes.rough_axis_id) {
				rough_axis_count++;
			}
		}
	}

	// Балка надрессорная
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.pressure_beam_id &&
		pressure_beam_count >= dictionary_count_ke_on_vagonTmp.pressure_beam) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Балка надрессорная, уже установлено максимальное количество элементов '" + pressure_beam_count + "'.";

	}
	// Рама боковая
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.side_frame_id &&
		side_frame_count >= dictionary_count_ke_on_vagonTmp.side_frame) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Рама боковая, уже установлено максимальное количество элементов '" + side_frame_count + "'.";
	}
	// Колесная пара в сборе
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.wheel_pair_id &&
		wheel_pair_count >= dictionary_count_ke_on_vagonTmp.wheel_pair) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Колесная пара в сборе, уже установлено максимальное количество элементов '" + wheel_pair_count + "'.";
	}
	// Главная часть воздухораспределителя
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.main_part_air_distributor_id &&
		air_distributor_count >= dictionary_count_ke_on_vagonTmp.air_distributor) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Главная часть воздухораспределителя, уже установлено максимальное количество элементов '" + air_distributor_count + "'.";
	}
	// Поглощающий аппарат
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.absorbing_device_id &&
		absorbing_device_count >= dictionary_count_ke_on_vagonTmp.absorbing_device) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Поглощающий аппарат, уже установлено максимальное количество элементов '" + absorbing_device_count + "'.";
	}
	// Авторежим
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.auto_mode_id &&
		auto_mode_count >= dictionary_count_ke_on_vagonTmp.auto_mode) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Авторежим, уже установлено максимальное количество элементов '" + auto_mode_count + "'.";
	}
	// Клин фрикционный
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.friction_wedge_id &&
		friction_wedge_count >= dictionary_count_ke_on_vagonTmp.friction_wedge) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Клин фрикционный, уже установлено максимальное количество элементов '" + friction_wedge_count + "'.";
	}
	// Корпус скользуна
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.slider_body_id &&
		slider_body_count >= dictionary_count_ke_on_vagonTmp.slider_body) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Корпус скользуна, уже установлено максимальное количество элементов '" + slider_body_count + "'.";
	}
	// Колпак скользуна
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.slider_cap_id &&
		slider_cap_count >= dictionary_count_ke_on_vagonTmp.slider_cap) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Колпак скользуна, уже установлено максимальное количество элементов '" + slider_cap_count + "'.";
	}
	// Адаптер колеса
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.wheel_adapter_id &&
		wheel_adapter_count >= dictionary_count_ke_on_vagonTmp.wheel_adapter) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Адаптер колеса, уже установлено максимальное количество элементов '" + wheel_adapter_count + "'.";
	}

	// Тормозной цилиндр
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.brake_cylinder_id &&
		brake_cylinder_count >= dictionary_count_ke_on_vagonTmp.brake_cylinder) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Тормозной цилиндр, уже установлено максимальное количество элементов '" + brake_cylinder_count + "'.";
	}
	// Пружины рессорного подвешивания подклиновая наружная
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.spring_suspension_under_wedge_external_id &&
		spring_suspension_under_wedge_external_count >= dictionary_count_ke_on_vagonTmp.spring_suspension_under_wedge_external) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Пружины рессорного подвешивания подклиновая наружная, уже установлено максимальное количество элементов '" + spring_suspension_under_wedge_external_count + "'.";
	}
	// Пружины рессорного подвешивания подклиновая внутренняя
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.spring_suspension_under_wedge_internal_id &&
		spring_suspension_under_wedge_internal_count >= dictionary_count_ke_on_vagonTmp.spring_suspension_under_wedge_internal) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Пружины рессорного подвешивания подклиновая внутренняя, уже установлено максимальное количество элементов '" + spring_suspension_under_wedge_internal_count + "'.";
	}
	// Пружины рессорного подвешивания наружная
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.spring_suspension_external_id &&
		spring_suspension_external_count >= dictionary_count_ke_on_vagonTmp.spring_suspension_external) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Пружины рессорного подвешивания наружная, уже установлено максимальное количество элементов '" + spring_suspension_external_count + "'.";
	}
	// Пружины рессорного подвешивания внутренняя
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.spring_suspension_internal_id &&
		spring_suspension_internal_count >= dictionary_count_ke_on_vagonTmp.spring_suspension_internal) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Пружины рессорного подвешивания внутренняя, уже установлено максимальное количество элементов '" + spring_suspension_internal_count + "'.";
	}
	// Пружины скользуна наружная
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.spring_slider_external_id &&
		spring_slider_external_count >= dictionary_count_ke_on_vagonTmp.spring_slider_external) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Пружины скользуна наружная, уже установлено максимальное количество элементов '" + spring_slider_external_count + "'.";
	}
	// Пружины скользуна внутренняя
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.spring_slider_internal_id &&
		spring_slider_internal_count >= dictionary_count_ke_on_vagonTmp.spring_slider_internal) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Пружины скользуна внутренняя, уже установлено максимальное количество элементов '" + spring_slider_internal_count + "'.";
	}
	// Резервуары воздушные для автотормозов
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.air_tank_auto_brakes_id &&
		air_tank_auto_brakes_count >= dictionary_count_ke_on_vagonTmp.air_tank_auto_brakes) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Резервуары воздушные для автотормозов, уже установлено максимальное количество элементов '" + air_tank_auto_brakes_count + "'.";
	}
	// Тяговый хомут автосцепки
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.traction_clamp_coupling_id &&
		traction_clamp_coupling_count >= dictionary_count_ke_on_vagonTmp.traction_clamp_coupling) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Тяговый хомут автосцепки, уже установлено максимальное количество элементов '" + traction_clamp_coupling_count + "'.";
	}
	// Триангель
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.triangel_id &&
		triangel_count >= dictionary_count_ke_on_vagonTmp.triangel) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Триангель, уже установлено максимальное количество элементов '" + triangel_count + "'.";
	}
	// Магистральная часть воздухораспределителя
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.trunk_part_air_distributor_id &&
		trunk_part_air_distributor_count >= dictionary_count_ke_on_vagonTmp.trunk_part_air_distributor) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Магистральная часть воздухораспределителя, уже установлено максимальное количество элементов '" + trunk_part_air_distributor_count + "'.";
	}
	// Адаптер подшипника
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.bearing_adapter_id &&
		bearing_adapter_count >= dictionary_count_ke_on_vagonTmp.bearing_adapter) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Адаптер подшипника, уже установлено максимальное количество элементов '" + bearing_adapter_count + "'.";
	}
	// Сменный ЖД кузов
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.removable_railway_carcass_id &&
		removable_railway_carcass_count >= dictionary_count_ke_on_vagonTmp.railway_carcass) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Сменный ЖД кузов, уже установлено максимальное количество элементов '" + removable_railway_carcass_count + "'.";
	}
	// Планка фрикционная
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.friction_strip_id &&
		friction_strip_count >= dictionary_count_ke_on_vagonTmp.friction_strip) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Планка фрикционная, уже установлено максимальное количество элементов '" + friction_strip_count + "'.";
	}
	// Скоба
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.brace_id &&
		brace_count >= dictionary_count_ke_on_vagonTmp.brace) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Скоба, уже установлено максимальное количество элементов '" + brace_count + "'.";
	}
	// Ось чистовая
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.clear_axis_id &&
		clear_axis_count >= dictionary_count_ke_on_vagonTmp.clear_axis) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Ось чистовая, уже установлено максимальное количество элементов '" + clear_axis_count + "'.";
	}
	// Колесо
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.wheel_id &&
		wheel_count >= dictionary_count_ke_on_vagonTmp.wheel) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Колесо, уже установлено максимальное количество элементов '" + wheel_count + "'.";
	}
	// Пластины в клиновых карманах
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.wedge_pockets_id &&
		wedge_pockets_count >= dictionary_count_ke_on_vagonTmp.wedge_pockets) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Пластины в клиновых карманах, уже установлено максимальное количество элементов '" + wedge_pockets_count + "'.";
	}
	// Кольцо в подпятник
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.saddle_ring_id &&
		saddle_rings_count >= dictionary_count_ke_on_vagonTmp.saddle_rings) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Кольцо в подпятник, уже установлено максимальное количество элементов '" + saddle_rings_count + "'.";
	}
	// Вставки в клиновые карманы
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.wedge_pockets_inserts_id &&
		wedge_pockets_inserts_count >= dictionary_count_ke_on_vagonTmp.wedge_pockets_inserts) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Вставки в клиновые карманы, уже установлено максимальное количество элементов '" + wedge_pockets_inserts_count + "'.";
	}
	// Вкладыш подпятника
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.saddle_bearing_id &&
		saddle_bearings_count >= dictionary_count_ke_on_vagonTmp.saddle_bearings) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Вкладыш подпятника, уже установлено максимальное количество элементов '" + saddle_bearings_count + "'.";
	}
	// Замок
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.lock_id &&
		locks_count >= dictionary_count_ke_on_vagonTmp.locks) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Замок, уже установлено максимальное количество элементов '" + locks_count + "'.";
	}
	// Валик подъемника
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.elevator_roll_id &&
		elevator_rolls_count >= dictionary_count_ke_on_vagonTmp.elevator_rolls) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Валик подъемника, уже установлено максимальное количество элементов '" + elevator_rolls_count + "'.";
	}
	// Корпус автосцепки
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.auto_coupler_id &&
		auto_couplers_count >= dictionary_count_ke_on_vagonTmp.auto_couplers) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Корпус автосцепки, уже установлено максимальное количество элементов '" + auto_couplers_count + "'.";
	}
	// Упоры передний и задний объединенные
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.front_rear_detents_id &&
		front_rear_detents_count >= dictionary_count_ke_on_vagonTmp.front_rear_detents) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Упоры передний и задний объединенные, уже установлено максимальное количество элементов '" + front_rear_detents_count + "'.";
	}
	// Крышка люка полувагона
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.gondola_hatch_id &&
		gondola_hatches_count >= dictionary_count_ke_on_vagonTmp.gondola_hatches) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Крышка люка полувагона, уже установлено максимальное количество элементов '" + gondola_hatches_count + "'.";
	}

	// Ось черновая
	if (reestr_key_elementsTmp.key_element_code == keyElementCodes.rough_axis_id &&
		rough_axis_count >= dictionary_count_ke_on_vagonTmp.rough_axis) {
		isparamsvalid = false;
		errormessage += "На вагон нельзя установить элемент типа Ось черновая, уже установлено максимальное количество элементов '" + rough_axis_count + "'.";
	}

	var nodeip = getnodeipbymember(reestr_key_elementsTmp.node_owner);
	if (isEmptyString(nodeip)) {
		return badResp("Не удалось определить IP адрес блокчейна.");
	}

	var member = null;
	if (isEmptyString(requestdata.memberid)) {
		member = getmemberbyuser();
	} else {
		member = db.findbyrecid("reestr_members", requestdata.memberid);
	}

	if (isNullObject(member)) {
		return badResp("Не удалось определить участника для текущего пользователя.");
	}

	var position_on_vagon = isNotEmptyString(requestdata.wagon_position)
		? db.findbyrecid("dictionary_positions_on_vagon", requestdata.wagon_position)
		: null;
	var position_on_vagon_recname = isNotNullObject(position_on_vagon)
		? position_on_vagon.recname
		: "отсутствует";

	if (isparamsvalid) {
		var addtowagonbch = {
			"nodeip": nodeip,

			"link":
			{
				"hash": reestr_key_elementsTmp.blockchainhash,
				"node": reestr_key_elementsTmp.blockchainnode,
				"recn": reestr_key_elementsTmp.blockchainrecn,
				"tn": reestr_key_elementsTmp.blockchaintn
			},

			// Заводской номер вагона
			"vehicle_manufacturer_number": reestr_vehiclesTmp.manufacturer_number,
			// Дата установки СЧ на вагон
			"install_ke_date": requestdata.date,
			// Позиция СЧ на вагоне
			"position_on_vagon": position_on_vagon_recname,
			//Идентификатор СЧ (для дальнейшей отправки в блокчейн)
			"keid": requestdata.ke_id,
			//Дата окончания гамма-процентного ресурса (для дальнейшей проверки после отправки в блокчейн)
			"gamma_percent_resourse_end": gamma_percent_resource_end_date,
			//Идентификатор вагона (для дальнейшей отправки в блокчейн)
			"wagonid": requestdata.wagonid,
			//Дата установки на вагон (для дальнейшей отправки в блокчейн)
			"date": requestdata.date,
			//Позиция на вагоне
			"wagon_position": requestdata.wagon_position,
			//Полный объект с записью о добавляемом СЧ (для дальнейшей проверки после отправки в блокчейн)
			"reestr_ke_tmp": reestr_key_elementsTmp,
			//Запись из реестра ТС (для дальнейшей проверки после отправки в блокчейн)
			"reestr_vehicles_tmp": reestr_vehiclesTmp
		};

		// Год окончания гамма-процентного ресурса детали
		if (isNotEmptyString(gamma_percent_resource_end_date)) {
			addtowagonbch.gamma_percent_resource_end_date = gamma_percent_resource_end_date;
		}
		return successResp(addtowagonbch)
	} else {
		return badResp(errormessage);
	}
}

/**
 * Проверка количества устанавливаемых СЕ
 * @param {*} assembly_units	устанавливаемые СЕ 
 * @param {*} vagonmodelid 			id вагона
 */
function checkAssemblyUnitsCountLimitation(assembly_units, vagonmodelid) {
	//Получение количества СЧ на вагоне
	var dictionary_count_ke_on_vagon_records = db.findbyparams("dictionary_count_ke_on_vagon", { "model_vagon": vagonmodelid });
	if (isEmptyOrNullArray(dictionary_count_ke_on_vagon_records)) {
		return badResp("В системе не найдена запись с моделью вагона")
	}
	var dictionary_count_ke_on_vagon_record = dictionary_count_ke_on_vagon_records[0];

	var triangels_count = 0;
	var wagon_tank_cauldrons = 0;
	var air_distributors_count = 0;

	for (var i = 0; i < assembly_units.length; i++) {
		var assembly_unit = db.findbyrecid("reestr_ke_nodes", assembly_units[i].recid);
		//Триангель
		if (assembly_unit.ke_node_type == "c790c624-b93e-498b-97ba-0fb47f8b4b52") {
			triangels_count += 1;
		}
		//Котел вагона-цистерны
		if (assembly_unit.ke_node_type == "79ddf686-f26f-4567-97ac-cb18eadd83e9") {
			wagon_tank_cauldrons += 1;
		}

		//Воздухораспределитель в сборе
		if (assembly_unit.ke_node_type == "a6180bfa-368d-4eff-97f2-c4f6c2612bc6") {
			air_distributors_count += 1;
		}
	}
	if (triangels_count > dictionary_count_ke_on_vagon_record.triangel) {
		return badResp("Количество триангелей больше чем требуется, требуется " + dictionary_count_ke_on_vagon_record.triangel);
	}

	if (air_distributors_count > dictionary_count_ke_on_vagon_record.air_distributor_assembled) {
		return badResp("Количество воздухораспределителей в сборе больше чем требуется, требуется " + dictionary_count_ke_on_vagon_record.air_distributor_assembled);
	}

	if (wagon_tank_cauldrons > dictionary_count_ke_on_vagon_record.vagon_tank_bodies) {
		return badResp("Количество котлов вагона-цистерны больше чем требуется, требуется " + dictionary_count_ke_on_vagon_record.vagon_tank_bodies);
	}
	return successResp("");
}
/**
 * Проверка количества тележек (количества торцевых и средних)
 * @param {*} nodes узлы
 * @param {*} vagon_model модель тележки
 */
function checkCartsCount(nodes, vagon_model) {
	var middleCartsCount = 0;
	var endCartsCount = 0;

	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		if (node.ke_node_type == "cbb9d8cb-89ef-4b99-be77-a7d6e57e388e") {
			var count_ke_on_node_records = db.findbyparams("dictionary_count_key_elements_by_node_type", {
				ke_node_type: node.ke_node_type,
				scheme: node.documentation_number
			})
			if (isEmptyOrNullArray(count_ke_on_node_records)) {
				return badResp("Для узла " + node.readonly_ke_node + " не удалось получить запись из справочника \"Кол-во СЧ/СЕ в СЕ/узле\"");
			}
			var count_ke_on_node = count_ke_on_node_records[0];
			//Если количество колпаков и корпусов скользуна больше двух по номенклатуре, то это тележка в среднюю позицию
			if (count_ke_on_node.slider_body_count > 2 && count_ke_on_node.slider_cap_count > 2) {
				middleCartsCount += 1;
			} else {
				endCartsCount += 1;
			}
		}
	}
	if (endCartsCount > 2) {
		return badResp("На вагон не может быть установлено более двух торцевых тележек")
	}
	if (vagon_model.number_axes == 6 && middleCartsCount > 1) {
		return badResp("На вагон не может быть установлено более одной средней тележки")
	}
	return successResp("Проверка завершена");
}

/**
 * Подготовка данных для динформы просмотра комплектации вагона
 * @param {*} params 
 */
function prepare_vagon_compozition_dynamic_form(params) {

	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};

	//Проверка входящих параметров
	if (isEmptyString(params.dictionary_models)) {
		return {
			success: false,
			message: "Поле \"Модель\" не может быть пустым",
			closeForm: true,
			showMessage: true
		}
	}

	var front_rear_detents_count = 0;
	var gondola_hatches_count = 0;
	var carts_count = 0;
	var removable_carcass_count = 0;
	var vagon_tank_body_count = 0;
	var autocouplers_count = 0;
	var absorbing_devices_count = 0;
	var air_distributors_assembled_count = 0;
	var auto_modes_count = 0;
	var traction_clamps_count = 0;

	var front_rear_detents_count_from_dict = 0;
	var gondola_hatches_count_from_dict = 0;
	var carts_count_from_dict = 0;
	var removable_carcass_count_from_dict = 0;
	var vagon_tank_body_count_from_dict = 0;
	var autocouplers_count_from_dict = 0;
	var absorbing_devices_count_from_dict = 0;
	var air_distributors_assembled_count_from_dict = 0;
	var auto_modes_count_from_dict = 0;
	var traction_clamps_count_from_dict = 0;

	//Получение количества СЧ на вагоне
	var count_ke_on_vagon_records = db.findbyparams("dictionary_count_ke_on_vagon", {
		model_vagon: params.dictionary_models
	});
	if (!isEmptyOrNullArray(count_ke_on_vagon_records)) {
		var count_ke_on_vagon = count_ke_on_vagon_records[0];
		//Наполнение переменных из справочника
		//Упоры передний и задний
		if (isNotEmptyString(count_ke_on_vagon.front_rear_detents)) {
			front_rear_detents_count_from_dict = count_ke_on_vagon.front_rear_detents;
		}
		//Крышка люка полувагона
		if (isNotEmptyString(count_ke_on_vagon.gondola_hatches)) {
			gondola_hatches_count_from_dict = count_ke_on_vagon.gondola_hatches;
		}
		//Тележка
		if (isNotEmptyString(count_ke_on_vagon.carts)) {
			carts_count_from_dict = count_ke_on_vagon.carts;
		}
		//Сменный жд кузов
		if (isNotEmptyString(count_ke_on_vagon.railway_carcass)) {
			removable_carcass_count_from_dict = count_ke_on_vagon.railway_carcass;
		}
		//Котел вагона-цистерны
		if (isNotEmptyString(count_ke_on_vagon.vagon_tank_bodies)) {
			vagon_tank_body_count_from_dict = count_ke_on_vagon.vagon_tank_bodies;
		}
		//Автосцепка СА-3
		if (isNotEmptyString(count_ke_on_vagon.autocouplers)) {
			autocouplers_count_from_dict = count_ke_on_vagon.autocouplers;
		}
		//Поглощающий аппарат
		if (isNotEmptyString(count_ke_on_vagon.absorbing_device)) {
			absorbing_devices_count_from_dict = count_ke_on_vagon.absorbing_device;
		}
		//Хомут тяговый
		if (isNotEmptyString(count_ke_on_vagon.traction_clamp)) {
			traction_clamps_count_from_dict = count_ke_on_vagon.traction_clamp;
		}
		//Воздухораспределитель в сборе
		if (isNotEmptyString(count_ke_on_vagon.air_distributor_assembled)) {
			air_distributors_assembled_count_from_dict = count_ke_on_vagon.air_distributor_assembled;
		}
		//Авторежим грузовой
		if (isNotEmptyString(count_ke_on_vagon.auto_mode)) {
			auto_modes_count_from_dict = count_ke_on_vagon.auto_mode;
		}


		//Получение узлов, установленных на вагон
		var nodes = db.findbyparams("reestr_ke_nodes", {
			vehicle: params.recid
		});

		if (isEmptyOrNullArray(nodes)) {
			nodes = [];
		}

		//Получение СЧ, установленных на вагон
		var key_elements = db.findbyparams("reestr_key_elements", {
			vehicle: params.recid
		});

		if (isEmptyOrNullArray(key_elements)) {
			key_elements = [];
		}

		//Получение количества установленных узлов
		for (var i = 0; i < nodes.length; i++) {
			var node = nodes[i];

			//Тележка
			if (node.ke_node_type == 'cbb9d8cb-89ef-4b99-be77-a7d6e57e388e') {
				carts_count++;
			}
			//Автосцепка СА-3
			if (node.ke_node_type == 'ae11ae44-1c69-49e0-83a1-4122bb2d80ae') {
				autocouplers_count++;
			}
			//Котел вагона-цистерны
			if (node.ke_node_type == '79ddf686-f26f-4567-97ac-cb18eadd83e9') {
				vagon_tank_body_count++;
			}
			//Поглощающий аппарат
			if (node.ke_node_type == '700b86ca-5b88-44d6-a5d3-c2c4e76d96f8') {
				absorbing_devices_count++;
			}
			//Воздухораспределитель в сборе
			if (node.ke_node_type == 'a6180bfa-368d-4eff-97f2-c4f6c2612bc6') {
				air_distributors_assembled_count++;
			}
		}

		//Получение количества установленных СЧ
		for (var i = 0; i < key_elements.length; i++) {
			var key_element = key_elements[i];
			//Упоры передний и задний объединенные
			if (key_element.key_element_code == keyElementCodes.front_rear_detents_id) {
				front_rear_detents_count++;;
			}
			//Крышка люка полувагона
			if (key_element.key_element_code == keyElementCodes.gondola_hatch_id) {
				gondola_hatches_count++;
			}
			//Сменный железнодорожный кузов
			if (key_element.key_element_code == keyElementCodes.removable_railway_carcass_id) {
				removable_carcass_count++;
			}
			//Хомут тяговый
			if (key_element.key_element_code == keyElementCodes.traction_clamp_id) {
				traction_clamps_count++;
			}
			//Авторежим грузовой 
			if (key_element.key_element_code == keyElementCodes.auto_mode_cargo_id) {
				auto_modes_count++;
			}
		}

		var res_items = [];
		//Проверки количества 
		//Упоры передний и задний
		if (front_rear_detents_count_from_dict > 0) {
			res_items.push({
				name: "Упоры передний и задний объединенные",
				amount: String().concat(front_rear_detents_count.toString(), " из ", front_rear_detents_count_from_dict.toString()),
				is_completed: (front_rear_detents_count == front_rear_detents_count_from_dict) ? true : false
			});
		}

		//Крышка люка полувагона
		if (gondola_hatches_count_from_dict > 0) {
			res_items.push({
				name: "Крышка люка полувагона",
				amount: String().concat(gondola_hatches_count.toString(), " из ", gondola_hatches_count_from_dict.toString()),
				is_completed: (gondola_hatches_count == gondola_hatches_count_from_dict) ? true : false
			});
		}

		//Тележка
		if (carts_count_from_dict > 0) {
			res_items.push({
				name: "Тележка",
				amount: String().concat(carts_count.toString(), " из ", carts_count_from_dict.toString()),
				is_completed: (carts_count == carts_count_from_dict) ? true : false
			});
		}

		//Сменный жд кузов
		if (removable_carcass_count_from_dict > 0) {
			res_items.push({
				name: "Сменный железнодорожный кузов",
				amount: String().concat(removable_carcass_count.toString(), " из ", removable_carcass_count_from_dict.toString()),
				is_completed: (removable_carcass_count == removable_carcass_count_from_dict) ? true : false
			});
		}

		//Котел вагона-цистерны
		if (vagon_tank_body_count_from_dict > 0) {
			res_items.push({
				name: "Котел вагона-цистерны",
				amount: String().concat(vagon_tank_body_count.toString(), " из ", vagon_tank_body_count_from_dict.toString()),
				is_completed: (vagon_tank_body_count == vagon_tank_body_count_from_dict) ? true : false
			});
		}

		//Автосцепка СА-3
		if (autocouplers_count_from_dict > 0) {
			res_items.push({
				name: "Автосцепка СА-3",
				amount: String().concat(autocouplers_count.toString(), " из ", autocouplers_count_from_dict.toString()),
				is_completed: (autocouplers_count == autocouplers_count_from_dict) ? true : false
			});
		}

		//Поглощающий аппарат
		if (absorbing_devices_count_from_dict > 0) {
			res_items.push({
				name: "Поглощающий аппарат",
				amount: String().concat(absorbing_devices_count.toString(), " из ", absorbing_devices_count_from_dict.toString()),
				is_completed: (absorbing_devices_count == absorbing_devices_count_from_dict) ? true : false
			});
		}

		//Хомут тяговый
		if (traction_clamps_count_from_dict > 0) {
			res_items.push({
				name: "Хомут тяговый",
				amount: String().concat(traction_clamps_count.toString(), " из ", traction_clamps_count_from_dict.toString()),
				is_completed: (traction_clamps_count == traction_clamps_count_from_dict) ? true : false
			});
		}

		//Воздухораспределитель в сборе
		if (air_distributors_assembled_count_from_dict > 0) {
			res_items.push({
				name: "Воздухораспределитель в сборе",
				amount: String().concat(air_distributors_assembled_count.toString(), " из ", air_distributors_assembled_count_from_dict.toString()),
				is_completed: (air_distributors_assembled_count == air_distributors_assembled_count_from_dict) ? true : false
			});
		}

		//Авторежим грузовой
		if (auto_modes_count_from_dict > 0) {
			res_items.push({
				name: "Авторежим грузовой",
				amount: String().concat(auto_modes_count.toString(), " из ", auto_modes_count_from_dict.toString()),
				is_completed: (auto_modes_count == auto_modes_count_from_dict) ? true : false
			});
		}
	}

	var result = {
		dataGrid: res_items
	}
	return {
		success: true,
		message: "",
		closeForm: false,
		showMessage: false,
		data: result
	};
}

/**
 * Обработка данных с дин. формы просмотра комплектации вагона
 * @param {*} params 
 */
function process_vagon_compozition_dynamic_form(params) {
	if (typeof params.values != 'undefined' && params.values != null && typeof params.tableName != 'undefined' && typeof params.countOfSelectedRecords != 'undefined') {
		params.values.recid = params.recid
		params = params.values;
	};
	return params;
}

/**
 * Проверка что все СЧ и СЕ установлены на ТС
 * @param {*} vehicle 		Запись ТС
 */
function check_vehicle_complectation(vehicle) {
	//Получение количества СЧ на вагоне
	var dictionary_count_ke_on_vagon_records = db.findbyparams("dictionary_count_ke_on_vagon", {
		model_vagon: vehicle.dictionary_models
	})
	if (isEmptyOrNullArray(dictionary_count_ke_on_vagon_records)) {
		return badResp("Запись количества СЧ на вагоне не найдена в системе");
	}
	var dictionary_count_ke_on_vagon = dictionary_count_ke_on_vagon_records[0];

	//Получение установленных СЧ и узлов на ТС
	//Получение СЧ
	var key_elements = db.findbyparams("reestr_key_elements", {
		vehicle: vehicle.recid
	});
	if (isEmptyOrNullArray(key_elements)) {
		key_elements = [];
	}

	//Получение узлов
	var nodes = db.findbyparams("reestr_ke_nodes", {
		vehicle: vehicle.recid
	})
	if (isEmptyOrNullArray(nodes)) {
		nodes = [];
	}



	//Переменные для количества СЧ
	var side_frames_count = 0;
	var pressure_beams_count = 0;
	var friction_wedges_count = 0;
	var slider_bodys_count = 0;
	var slider_caps_count = 0;
	var spring_suspension_external_count = 0;
	var spring_suspension_internal_count = 0;
	var spring_slider_external_count = 0;
	var spring_slider_internal_count = 0;
	var bearing_adapter_count = 0;
	var railway_carcass_count = 0;
	var friction_strips_count = 0;
	var clear_axises_count = 0;
	var braces_count = 0;
	var wheels_count = 0;
	var wedge_pockets_count = 0;
	var saddle_rings_count = 0;
	var wedge_pockets_inserts_count = 0;
	var saddle_bearings_count = 0;
	var locks_count = 0;
	var elevator_rolls_count = 0;
	var auto_couplers_count = 0;
	var front_rear_detents_count = 0;
	var gondola_hatches_count = 0;
	var bearing_nodes_count = 0;
	var rough_axises_count = 0;
	var auto_mode_cargo_count = 0;
	var traction_clamp_count = 0;
	var absorbing_device_body_count = 0;

	//Переменные для количества СЕ
	var triangels_count = 0;
	var carts_count = 0;
	var autocouplers_count = 0;
	var vagon_tank_bodies_count = 0;
	var air_distributors_count = 0;
	var absorbing_device_count = 0;

	//Проход по всем СЧ
	for (var i = 0; i < key_elements.length; i++) {
		switch (key_elements[i].key_element_code) {
			//Рама боковая
			case keyElementCodes.side_frame_id:
				side_frames_count++;
				break;

			//Балка надрессорная
			case keyElementCodes.pressure_beam_id:
				pressure_beams_count++;
				break;

			//Клин фрикционный
			case keyElementCodes.friction_wedge_id:
				friction_wedges_count++;
				break;

			//Корпус скользуна
			case keyElementCodes.slider_body_id:
				slider_bodys_count++;
				break;

			//Колпак скользуна
			case keyElementCodes.slider_cap_id:
				slider_caps_count++;
				break;

			//Пружины рессорного подвешивания наружная
			case keyElementCodes.spring_outside_id:
				spring_suspension_external_count++;
				break;

			//Пружины рессорного подвешивания внутренняя
			case keyElementCodes.spring_inside_id:
				spring_suspension_internal_count++;
				break;

			//Пружины скользуна наружная
			case keyElementCodes.spring_slider_outside_id:
				spring_slider_external_count++;
				break;

			//Пружины скользуна внутренняя
			case keyElementCodes.spring_slider_inside_id:
				spring_slider_internal_count++;
				break;

			//Адаптер подшипника
			case keyElementCodes.bearing_adapter_id:
				bearing_adapter_count++;
				break;

			//Сменный ЖД кузов
			case keyElementCodes.removable_railway_carcass_id:
				railway_carcass_count++;
				break;

			//Планка фрикционная
			case keyElementCodes.friction_strip_id:
				friction_strips_count++;
				break;

			//Ось чистовая
			case keyElementCodes.clear_axis_id:
				clear_axises_count++;
				break;

			//Скоба
			case keyElementCodes.brace_id:
				braces_count++;
				break;

			//Колесо
			case keyElementCodes.wheel_id:
				wheels_count++;
				break;

			//Пластина в клиновых карманах
			case keyElementCodes.wedge_pockets_id:
				wedge_pockets_count++;
				break;

			//Кольцо в подпятник
			case keyElementCodes.saddle_ring_id:
				saddle_rings_count++;
				break;

			//Вставки в клиновые карманы
			case keyElementCodes.wedge_pockets_inserts_id:
				wedge_pockets_inserts_count++;
				break;

			//Вкладыш подпятника
			case keyElementCodes.saddle_bearing_id:
				saddle_bearings_count++;
				break;

			//Замок
			case keyElementCodes.lock_id:
				locks_count++;
				break;

			//Валик подъемника
			case keyElementCodes.elevator_roll_id:
				elevator_rolls_count++;
				break;

			//Корпус автосцепки
			case keyElementCodes.auto_coupler_id:
				auto_couplers_count++;
				break;

			//Упоры передний и задний объединенные
			case keyElementCodes.front_rear_detents_id:
				front_rear_detents_count++;
				break;

			//Крышка люка полувагона
			case keyElementCodes.gondola_hatch_id:
				gondola_hatches_count++;
				break;
			//Подшипник буксового узла
			case keyElementCodes.bearing_node_id:
				bearing_nodes_count++;
				break;

			//Ось черновая
			case keyElementCodes.rough_axis_id:
				rough_axises_count++;
				break;

			//Авторежим грузовой
			case keyElementCodes.auto_mode_cargo_id:
				auto_mode_cargo_count++;
				break;

			//Корпус поглощающего аппарата
			case keyElementCodes.absorbing_device_body_id:
				absorbing_device_body_count++;
				break;

			//Хомут тяговый
			case keyElementCodes.traction_clamp_id:
				traction_clamp_count++;
				break;
		}
	}

	//Получение дочерних СЕ (триангелей)
	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		var child_triangels = db.findbyparams("reestr_ke_nodes", {
			ke_node_type: "c790c624-b93e-498b-97ba-0fb47f8b4b52",
			parent_ke_node: node.recid
		});
		if (!isEmptyOrNullArray(child_triangels)) {
			for (var j = 0; j < child_triangels.length; j++) {
				nodes.push(child_triangels[j]);
			}
		}
	}

	//Проход по узлам
	for (var i = 0; i < nodes.length; i++) {
		switch (nodes[i].ke_node_type) {
			//Триангель
			case "c790c624-b93e-498b-97ba-0fb47f8b4b52":
				triangels_count++;
				break;

			//Тележка
			case "cbb9d8cb-89ef-4b99-be77-a7d6e57e388e":
				carts_count++;
				break;

			//Автосцепка
			case "ae11ae44-1c69-49e0-83a1-4122bb2d80ae":
				autocouplers_count++;
				break;

			//Котел вагона-цистерны
			case "79ddf686-f26f-4567-97ac-cb18eadd83e9":
				vagon_tank_bodies_count++;
				break;

			//Воздухораспределитель в сборе
			case "a6180bfa-368d-4eff-97f2-c4f6c2612bc6":
				air_distributors_count++;
				break;

			//Поглощающий аппарат
			case "700b86ca-5b88-44d6-a5d3-c2c4e76d96f8":
				absorbing_device_count++;
				break;
		}
	}

	//Проверки по справочнику
	//Рама боковая
	if (side_frames_count < dictionary_count_ke_on_vagon.side_frame) {
		return badResp("Количество рам боковых меньше, чем требуется по комплектации вагона");
	}
	//Балка надрессорная
	if (pressure_beams_count < dictionary_count_ke_on_vagon.pressure_beam) {
		return badResp("Количество балок надрессорных меньше, чем требуется по комплектации вагона");
	}
	//Клин фрикционный
	if (friction_wedges_count < dictionary_count_ke_on_vagon.friction_wedge) {
		return badResp("Количество клинов фрикционных меньше, чем требуется по комплектации вагона");
	}
	//Корпус скользуна
	if (slider_bodys_count < dictionary_count_ke_on_vagon.slider_body) {
		return badResp("Количество корпусов скользуна меньше, чем требуется по комплектации вагона");
	}
	//Колпак скользуна
	if (slider_caps_count < dictionary_count_ke_on_vagon.slider_cap) {
		return badResp("Количество колпаков скользуна меньше, чем требуется по комплектации вагона");
	}
	//Пружины рессорного подвешивания наружная
	if (spring_suspension_external_count < dictionary_count_ke_on_vagon.spring_suspension_external) {
		return badResp("Количество пружин рессорного подвешивания наружних меньше, чем требуется по комплектации вагона");
	}
	//Пружины рессорного подвешивания внутренняя
	if (spring_suspension_internal_count < dictionary_count_ke_on_vagon.spring_suspension_internal) {
		return badResp("Количество пружин рессорного подвешивания внутренних меньше, чем требуется по комплектации вагона");
	}
	//Пружины скользуна наружная
	if (spring_slider_external_count < dictionary_count_ke_on_vagon.spring_slider_external) {
		return badResp("Количество пружин скользуна наружних меньше, чем требуется по комплектации вагона");
	}
	//Пружины скользуна внутренняя
	if (spring_slider_internal_count < dictionary_count_ke_on_vagon.spring_slider_internal) {
		return badResp("Количество пружин скользуна внутренних меньше, чем требуется по комплектации вагона");
	}
	//Подшипник буксового узла
	if (bearing_nodes_count < dictionary_count_ke_on_vagon.bearing_nodes) {
		return badResp("Количество подшипников буксового узла меньше, чем требуется по комплектации вагона");
	}
	//Адаптер подшипника
	if (bearing_adapter_count < dictionary_count_ke_on_vagon.bearing_adapter) {
		return badResp("Количество адаптеров подшипника меньше, чем требуется по комплектации вагона");
	}
	//Сменный ЖД кузов
	if (railway_carcass_count < dictionary_count_ke_on_vagon.railway_carcass) {
		return badResp("Количество сменных ЖД кузовов меньше, чем требуется по комплектации вагона");
	}
	//Планка фрикционная
	if (friction_strips_count < dictionary_count_ke_on_vagon.friction_strip) {
		return badResp("Количество планок фрикционных меньше, чем требуется по комплектации вагона");
	}
	//Ось чистовая
	if (clear_axises_count < dictionary_count_ke_on_vagon.clear_axis) {
		return badResp("Количество осей чистовых меньше, чем требуется по комплектации вагона");
	}
	//Скоба
	if (braces_count < dictionary_count_ke_on_vagon.brace) {
		return badResp("Количество скоб меньше, чем требуется по комплектации вагона");
	}
	//Колесо
	if (wheels_count < dictionary_count_ke_on_vagon.wheel) {
		;
		return badResp("Количество колес меньше, чем требуется по комплектации вагона");
	}
	//Пластина в клиновых карманах
	if (wedge_pockets_count < dictionary_count_ke_on_vagon.wedge_pockets) {
		return badResp("Количество пластин в клиновых карманах меньше, чем требуется по комплектации вагона");
	}
	//Кольцо в подпятник
	if (saddle_rings_count < dictionary_count_ke_on_vagon.saddle_rings) {
		return badResp("Количество колец в подпятник меньше, чем требуется по комплектации вагона");
	}
	//Вставки в клиновые карманы
	if (wedge_pockets_inserts_count < dictionary_count_ke_on_vagon.wedge_pockets_inserts) {
		return badResp("Количество вставок в клиновые карманы меньше, чем требуется по комплектации вагона");
	}
	//Вкладыш подпятника
	if (saddle_bearings_count < dictionary_count_ke_on_vagon.saddle_bearings) {
		return badResp("Количество вкладышей подпятника меньше, чем требуется по комплектации вагона");
	}
	//Замок
	if (locks_count < dictionary_count_ke_on_vagon.locks) {
		return badResp("Количество замков меньше, чем требуется по комплектации вагона");
	}
	//Валик подъемника
	if (elevator_rolls_count < dictionary_count_ke_on_vagon.elevator_rolls) {
		return badResp("Количество валиков подъемника меньше, чем требуется по комплектации вагона");
	}
	//Корпус автосцепки
	if (auto_couplers_count < dictionary_count_ke_on_vagon.auto_couplers) {
		return badResp("Количество корпусов автосцепки меньше, чем требуется по комплектации вагона");
	}
	//Упоры передний и задний объединенные
	if (front_rear_detents_count < dictionary_count_ke_on_vagon.front_rear_detents) {
		return badResp("Количество упоров передних и задних объединенных меньше, чем требуется по комплектации вагона");
	}
	//Крышка люка полувагона
	if (gondola_hatches_count < dictionary_count_ke_on_vagon.gondola_hatches) {
		return badResp("Количество крышек люка полувагона меньше, чем требуется по комплектации вагона");
	}
	//Триангель
	if (triangels_count < dictionary_count_ke_on_vagon.triangel) {
		return badResp("Количество триангелей меньше, чем требуется по комплектации вагона");
	}
	//Тележка
	if (carts_count < dictionary_count_ke_on_vagon.carts) {
		return badResp("Количество тележек меньше, чем требуется по комплектации вагона");
	}
	//Автосцепка
	if (autocouplers_count < dictionary_count_ke_on_vagon.autocouplers) {
		return badResp("Количество автосцепок меньше, чем требуется по комплектации вагона");
	}
	//Котел вагона-цистерны
	if (vagon_tank_bodies_count < dictionary_count_ke_on_vagon.vagon_tank_bodies) {
		return badResp("Количество котлов вагона-цистерны меньше, чем требуется по комплектации вагона");
	}

	//Ось черновая
	if (rough_axises_count < dictionary_count_ke_on_vagon.rough_axis) {
		return badResp("Количество осей черновых меньше, чем требуется по комплектации вагона");
	}

	//Воздухораспределитель в сборе
	if (air_distributors_count < dictionary_count_ke_on_vagon.air_distributor_assembled) {
		return badResp("Количество триангелей меньше, чем требуется по комплектации вагона");
	}

	//Авторежим грузовой
	if (auto_mode_cargo_count < dictionary_count_ke_on_vagon.auto_mode) {
		return badResp("Количество авторежимов грузовых меньше, чем требуется по комплектации вагона");
	}

	//Корпус поглащающего аппарата
	if (absorbing_device_body_count < dictionary_count_ke_on_vagon.absorbing_device_body) {
		return badResp("Количество корпусов поглощающего аппарата меньше, чем требуется по комплектации вагона");
	}

	//Хомут тяговый
	if (traction_clamp_count < dictionary_count_ke_on_vagon.traction_clamp) {
		return badResp("Количество хомутов тяговых меньше, чем требуется по комплектации вагона");
	}

	//Поглащающий аппарат
	if (absorbing_device_count < dictionary_count_ke_on_vagon.absorbing_device) {
		return badResp("Количество поглощающих аппаратов меньше, чем требуется по комплектации вагона");
	}

	return successResp("Комплектация вагона проверена");
}