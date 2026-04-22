import json
import csv
import io
from ninja import Router
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from config.ninja_auth import jwt_auth
from config.encryption import EncryptionService

from apps.product.models import ProductOrm, category as Category, Folder
from apps.product.dto.import_export_schema import ExportFormatDTO, ImportDataDTO, ExportResponseSchema

router = Router()
User = get_user_model()


@router.post("/export", response=ExportResponseSchema, tags=["Импорт/Экспорт"], auth=jwt_auth)
def export_passwords(request, data: ExportFormatDTO):
    """Экспорт паролей пользователя"""
    user = request.user
    
    # Получаем все пароли пользователя
    products = ProductOrm.objects.filter(user=user)
    
    # Подготавливаем данные для экспорта
    export_data = []
    for product in products:
        # Если пароль зашифрован и предоставлен master password - расшифровываем
        password = product.password
        if product.is_encrypted and product.password_salt:
            # Для экспорта зашифрованных данных нужен master password
            # Если не предоставлен - экспортируем зашифрованными
            password = product.password  # зашифрованный
        
        export_data.append({
            "title": product.title,
            "url": product.url,
            "login": product.login,
            "password": password,
            "notes": product.notes,
            "category": product.category.name if product.category else None,
            "folder": product.folder.name if hasattr(product, 'folder') and product.folder else None,
            "is_encrypted": product.is_encrypted,
            "created_at": product.created_at.isoformat(),
            "updated_at": product.updated_at.isoformat()
        })
    
    if data.format == "json":
        return {
            "data": json.dumps(export_data, ensure_ascii=False, indent=2),
            "format": "json",
            "count": len(export_data)
        }
    elif data.format == "csv":
        # Конвертируем в CSV
        output = io.StringIO()
        if export_data:
            writer = csv.DictWriter(output, fieldnames=export_data[0].keys())
            writer.writeheader()
            writer.writerows(export_data)
        return {
            "data": output.getvalue(),
            "format": "csv",
            "count": len(export_data)
        }
    else:
        return JsonResponse({"error": "Неподдерживаемый формат"}, status=400)


@router.post("/import", tags=["Импорт/Экспорт"], auth=jwt_auth)
def import_passwords(request, data: ImportDataDTO):
    """Импорт паролей"""
    user = request.user
    
    try:
        if data.format == "json":
            items = json.loads(data.data)
        elif data.format == "csv":
            # Парсим CSV
            reader = csv.DictReader(io.StringIO(data.data))
            items = list(reader)
        else:
            return JsonResponse({"error": "Неподдерживаемый формат"}, status=400)
        
        imported_count = 0
        errors = []
        
        for item in items:
            try:
                # Получаем или создаём категорию
                category = None
                if item.get("category"):
                    category, _ = Category.objects.get_or_create(
                        name=item["category"]
                    )
                
                # Получаем или создаём папку
                folder = None
                if item.get("folder"):
                    folder, _ = Folder.objects.get_or_create(
                        name=item["folder"],
                        user=user
                    )
                
                # Обрабатываем пароль
                password = item.get("password", "")
                password_salt = None
                is_encrypted = False
                
                # Если импортируем зашифрованные данные и есть master password
                if item.get("is_encrypted") and data.master_password:
                    try:
                        # Пытаемся расшифровать
                        decrypted = EncryptionService.decrypt_password(
                            password,
                            item.get("password_salt", ""),
                            data.master_password
                        )
                        password = decrypted
                        # Шифруем с текущим master password пользователя
                        if user.master_password_enabled:
                            encrypted, salt = EncryptionService.encrypt_password(password, data.master_password)
                            password = encrypted
                            password_salt = salt
                            is_encrypted = True
                    except Exception as e:
                        errors.append(f"Ошибка расшифровки для {item.get('title')}: {str(e)}")
                        continue
                elif user.master_password_enabled and data.master_password:
                    # Шифруем обычный пароль с master password
                    encrypted, salt = EncryptionService.encrypt_password(password, data.master_password)
                    password = encrypted
                    password_salt = salt
                    is_encrypted = True
                
                # Создаём продукт
                ProductOrm.objects.create(
                    user=user,
                    title=item.get("title", ""),
                    url=item.get("url", ""),
                    login=item.get("login", ""),
                    password=password,
                    password_salt=password_salt,
                    notes=item.get("notes", ""),
                    category=category,
                    folder=folder,
                    is_encrypted=is_encrypted
                )
                imported_count += 1
                
            except Exception as e:
                errors.append(f"Ошибка импорта {item.get('title', 'unknown')}: {str(e)}")
        
        return JsonResponse({
            "success": True,
            "imported": imported_count,
            "errors": errors
        })
        
    except json.JSONDecodeError:
        return JsonResponse({"error": "Неверный JSON формат"}, status=400)
    except Exception as e:
        return JsonResponse({"error": f"Ошибка импорта: {str(e)}"}, status=500)


@router.get("/export-template", tags=["Импорт/Экспорт"], auth=jwt_auth)
def export_template(request, format: str = "json"):
    """Экспорт шаблона для импорта"""
    template = [
        {
            "title": "Пример сервиса",
            "url": "https://example.com",
            "login": "user@example.com",
            "password": "example_password",
            "notes": "Заметки",
            "category": "Социальные сети",
            "folder": "Личное"
        }
    ]
    
    if format == "json":
        return JsonResponse({
            "data": json.dumps(template, ensure_ascii=False, indent=2),
            "format": "json"
        })
    elif format == "csv":
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=template[0].keys())
        writer.writeheader()
        writer.writerows(template)
        return JsonResponse({
            "data": output.getvalue(),
            "format": "csv"
        })
    else:
        return JsonResponse({"error": "Неподдерживаемый формат"}, status=400)
