-- Функция прибавляет к числовому полю единицу (для всех записей)
CREATE OR REPLACE FUNCTION public.test_update_record2(
	)
    RETURNS void
	LANGUAGE 'plpgsql'

    VOLATILE 
AS $BODY$
BEGIN
	UPDATE procedure_test_table
	SET sysint_field = sysint_field+1;
END;
$BODY$;

-- Функция обновляет поля выбранной записи на значения, введенные в модальном окне
CREATE OR REPLACE FUNCTION public.test_update_record(
	_recid uuid,
	_newstring text,
	_newnumb integer)
    RETURNS void
    LANGUAGE 'plpgsql'

    COST 100
    VOLATILE 
AS $BODY$
BEGIN
	UPDATE procedure_params_test_table
	SET sysstring_field = _newstring, sysint_field = _newnumb
	WHERE recid = _recid;
END;
$BODY$;