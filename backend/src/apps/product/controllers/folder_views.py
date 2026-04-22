from ninja import Router
from django.http import Http404
from django.contrib.auth import get_user_model
from config.ninja_auth import jwt_auth

from apps.product.models import Folder
from apps.product.dto.folder_schema import FolderCreateDTO, FolderDTO

router = Router()
User = get_user_model()


@router.get("/folders", response=list[FolderDTO], tags=["Папки"], auth=jwt_auth)
def get_folders(request):
    """Получить папки пользователя"""
    folders = Folder.objects.filter(user=request.user) | Folder.objects.filter(
        organization__members__user=request.user
    )
    result = []
    for folder in folders.distinct():
        result.append({
            "id": folder.id,
            "name": folder.name,
            "parent_id": folder.parent_id,
            "user_id": folder.user_id,
            "organization_id": folder.organization_id,
            "created_at": folder.created_at,
            "updated_at": folder.updated_at,
            "icon": folder.icon,
            "color": folder.color,
            "full_path": folder.get_full_path()
        })
    return result


@router.get("/folders/{folder_id}", response=FolderDTO, tags=["Папки"], auth=jwt_auth)
def get_folder(request, folder_id: int):
    """Получить папку по ID"""
    try:
        folder = Folder.objects.get(id=folder_id)
        # Проверяем доступ
        if folder.user != request.user and not (
            folder.organization and folder.organization.members.filter(user=request.user).exists()
        ):
            raise Http404("Folder not found")
        
        return {
            "id": folder.id,
            "name": folder.name,
            "parent_id": folder.parent_id,
            "user_id": folder.user_id,
            "organization_id": folder.organization_id,
            "created_at": folder.created_at,
            "updated_at": folder.updated_at,
            "icon": folder.icon,
            "color": folder.color,
            "full_path": folder.get_full_path()
        }
    except Folder.DoesNotExist:
        raise Http404("Folder not found")


@router.post("/folders", response=FolderDTO, tags=["Папки"], auth=jwt_auth)
def create_folder(request, data: FolderCreateDTO):
    """Создать папку"""
    parent = None
    if data.parent_id:
        try:
            parent = Folder.objects.get(id=data.parent_id)
            # Проверяем доступ к родительской папке
            if parent.user != request.user and not (
                parent.organization and parent.organization.members.filter(user=request.user).exists()
            ):
                return {"error": "Нет доступа к родительской папке"}, 403
        except Folder.DoesNotExist:
            return {"error": "Parent folder not found"}, 404
    
    organization = None
    if data.organization_id:
        from apps.organizations.models import Organization
        try:
            organization = Organization.objects.get(id=data.organization_id)
            # Проверяем, что пользователь член организации
            if not organization.members.filter(user=request.user).exists():
                return {"error": "Нет доступа к организации"}, 403
        except Organization.DoesNotExist:
            return {"error": "Organization not found"}, 404
    
    folder = Folder.objects.create(
        name=data.name,
        parent=parent,
        user=request.user if not organization else None,
        organization=organization,
        icon=data.icon,
        color=data.color
    )
    
    return {
        "id": folder.id,
        "name": folder.name,
        "parent_id": folder.parent_id,
        "user_id": folder.user_id,
        "organization_id": folder.organization_id,
        "created_at": folder.created_at,
        "updated_at": folder.updated_at,
        "icon": folder.icon,
        "color": folder.color,
        "full_path": folder.get_full_path()
    }


@router.put("/folders/{folder_id}", response=FolderDTO, tags=["Папки"], auth=jwt_auth)
def update_folder(request, folder_id: int, data: FolderCreateDTO):
    """Обновить папку"""
    try:
        folder = Folder.objects.get(id=folder_id)
        # Проверяем доступ
        if folder.user != request.user and not (
            folder.organization and folder.organization.members.filter(user=request.user).exists()
        ):
            raise Http404("Folder not found")
        
        # Проверяем права на изменение (только владелец или admin организации)
        if folder.organization:
            org_member = folder.organization.members.get(user=request.user)
            if org_member.role != 'admin' and folder.user != request.user:
                return {"error": "Нет прав для изменения"}, 403
        
        parent = None
        if data.parent_id:
            try:
                parent = Folder.objects.get(id=data.parent_id)
                # Нельзя сделать папку родителем самой себе
                if parent.id == folder.id:
                    return {"error": "Нельзя сделать папку родителем самой себе"}, 400
            except Folder.DoesNotExist:
                return {"error": "Parent folder not found"}, 404
        
        folder.name = data.name
        folder.parent = parent
        folder.icon = data.icon
        folder.color = data.color
        folder.save()
        
        return {
            "id": folder.id,
            "name": folder.name,
            "parent_id": folder.parent_id,
            "user_id": folder.user_id,
            "organization_id": folder.organization_id,
            "created_at": folder.created_at,
            "updated_at": folder.updated_at,
            "icon": folder.icon,
            "color": folder.color,
            "full_path": folder.get_full_path()
        }
    except Folder.DoesNotExist:
        raise Http404("Folder not found")


@router.delete("/folders/{folder_id}", tags=["Папки"], auth=jwt_auth)
def delete_folder(request, folder_id: int):
    """Удалить папку"""
    try:
        folder = Folder.objects.get(id=folder_id)
        # Проверяем доступ
        if folder.user != request.user and not (
            folder.organization and folder.organization.members.filter(user=request.user).exists()
        ):
            raise Http404("Folder not found")
        
        # Проверяем права на удаление
        if folder.organization:
            org_member = folder.organization.members.get(user=request.user)
            if org_member.role != 'admin' and folder.user != request.user:
                return {"error": "Нет прав для удаления"}, 403
        
        # Проверяем, что папка пуста (нет дочерних папок)
        if folder.children.exists():
            return {"error": "Нельзя удалить папку с подпапками"}, 400
        
        folder.delete()
        return {"success": True, "message": "Folder deleted successfully"}
    except Folder.DoesNotExist:
        raise Http404("Folder not found")
