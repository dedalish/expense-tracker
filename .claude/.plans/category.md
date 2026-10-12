Требования к модулю

Сущность Category:

    id — идентификатор
    name — название категории
    color — цвет (hex)
    icon — иконка (emoji или строка)
    userId — привязка к пользователю

API:

    POST /categories — создать категорию
    GET /categories — все категории текущего пользователя
    PATCH /categories/:id — обновить
    DELETE /categories/:id — удалить

Защита JWT-гардом, валидация через class-validator.
