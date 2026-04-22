from ninja import Router
from django.http import Http404
from django.contrib.auth import get_user_model
from config.ninja_auth import jwt_auth

from apps.organizations.models import Organization, OrganizationMember, Vault, VaultAccess
from apps.organizations.dto.schema import (
    OrganizationCreateDTO,
    OrganizationDTO,
    OrganizationMemberDTO,
    VaultCreateDTO,
    VaultDTO,
    VaultAccessDTO,
    VaultGrantAccessDTO
)

router = Router()
User = get_user_model()


@router.get("/organizations", response=list[OrganizationDTO], tags=["Организации"], auth=jwt_auth)
def get_organizations(request):
    """Получить организации пользователя"""
    organizations = Organization.objects.filter(
        owner=request.user
    ) | Organization.objects.filter(
        members__user=request.user
    )
    return list(organizations.distinct())


@router.post("/organizations", response=OrganizationDTO, tags=["Организации"], auth=jwt_auth)
def create_organization(request, data: OrganizationCreateDTO):
    """Создать организацию"""
    org = Organization.objects.create(
        name=data.name,
        description=data.description,
        owner=request.user
    )
    # Владелец автоматически становится членом с ролью admin
    OrganizationMember.objects.create(
        organization=org,
        user=request.user,
        role=OrganizationMember.RoleChoices.ADMIN
    )
    return org


@router.get("/organizations/{org_id}/members", response=list[OrganizationMemberDTO], tags=["Организации"], auth=jwt_auth)
def get_organization_members(request, org_id: int):
    """Получить членов организации"""
    try:
        org = Organization.objects.get(id=org_id)
        # Проверяем, что пользователь имеет доступ
        if org.owner != request.user and not org.members.filter(user=request.user).exists():
            raise Http404("Organization not found")
        
        members = org.members.all()
        result = []
        for member in members:
            result.append({
                "id": member.id,
                "user_id": member.user.id,
                "username": member.user.username,
                "role": member.role,
                "joined_at": member.joined_at
            })
        return result
    except Organization.DoesNotExist:
        raise Http404("Organization not found")


@router.post("/organizations/{org_id}/members", tags=["Организации"], auth=jwt_auth)
def add_organization_member(request, org_id: int, user_id: int, role: str = "member"):
    """Добавить члена в организацию"""
    try:
        org = Organization.objects.get(id=org_id)
        # Только владелец или admin может добавлять членов
        if org.owner != request.user:
            member = org.members.get(user=request.user)
            if member.role != OrganizationMember.RoleChoices.ADMIN:
                return {"error": "Нет прав для добавления членов"}, 403
        
        user = User.objects.get(id=user_id)
        
        # Проверяем, что пользователь ещё не член
        if org.members.filter(user=user).exists():
            return {"error": "Пользователь уже член организации"}, 400
        
        OrganizationMember.objects.create(
            organization=org,
            user=user,
            role=role
        )
        return {"success": True}
    except Organization.DoesNotExist:
        raise Http404("Organization not found")
    except User.DoesNotExist:
        return {"error": "User not found"}, 404


@router.delete("/organizations/{org_id}/members/{member_id}", tags=["Организации"], auth=jwt_auth)
def remove_organization_member(request, org_id: int, member_id: int):
    """Удалить члена из организации"""
    try:
        org = Organization.objects.get(id=org_id)
        # Только владелец или admin может удалять членов
        if org.owner != request.user:
            member = org.members.get(user=request.user)
            if member.role != OrganizationMember.RoleChoices.ADMIN:
                return {"error": "Нет прав для удаления членов"}, 403
        
        member = org.members.get(id=member_id)
        # Нельзя удалить владельца
        if member.user == org.owner:
            return {"error": "Нельзя удалить владельца"}, 400
        
        member.delete()
        return {"success": True}
    except Organization.DoesNotExist:
        raise Http404("Organization not found")
    except OrganizationMember.DoesNotExist:
        raise Http404("Member not found")


# Vault endpoints
@router.get("/vaults", response=list[VaultDTO], tags=["Сейфы"], auth=jwt_auth)
def get_vaults(request):
    """Получить сейфы доступные пользователю"""
    # Сейфы организаций, где пользователь член
    vaults = Vault.objects.filter(
        organization__members__user=request.user
    ) | Vault.objects.filter(
        created_by=request.user
    )
    return list(vaults.distinct())


@router.post("/vaults", response=VaultDTO, tags=["Сейфы"], auth=jwt_auth)
def create_vault(request, data: VaultCreateDTO):
    """Создать сейф"""
    try:
        org = Organization.objects.get(id=data.organization_id)
        # Проверяем, что пользователь член организации
        if not org.members.filter(user=request.user).exists():
            return {"error": "Нет доступа к организации"}, 403
        
        vault = Vault.objects.create(
            name=data.name,
            description=data.description,
            organization=org,
            created_by=request.user
        )
        return vault
    except Organization.DoesNotExist:
        return {"error": "Organization not found"}, 404


@router.get("/vaults/{vault_id}/access", response=list[VaultAccessDTO], tags=["Сейфы"], auth=jwt_auth)
def get_vault_access(request, vault_id: int):
    """Получить список доступа к сейфу"""
    try:
        vault = Vault.objects.get(id=vault_id)
        # Проверяем доступ
        if not vault.organization.members.filter(user=request.user).exists():
            raise Http404("Vault not found")
        
        access_list = vault.access_list.all()
        result = []
        for access in access_list:
            result.append({
                "id": access.id,
                "vault_id": access.vault.id,
                "user_id": access.user.id,
                "username": access.user.username,
                "permission": access.permission,
                "granted_at": access.granted_at
            })
        return result
    except Vault.DoesNotExist:
        raise Http404("Vault not found")


@router.post("/vaults/{vault_id}/access", tags=["Сейфы"], auth=jwt_auth)
def grant_vault_access(request, vault_id: int, data: VaultGrantAccessDTO):
    """Предоставить доступ к сейфу"""
    try:
        vault = Vault.objects.get(id=vault_id)
        # Проверяем, что пользователь имеет права admin на сейф или организации
        org_member = vault.organization.members.get(user=request.user)
        if org_member.role != OrganizationMember.RoleChoices.ADMIN:
            return {"error": "Нет прав для предоставления доступа"}, 403
        
        user = User.objects.get(id=data.user_id)
        
        # Проверяем, что пользователь член организации
        if not vault.organization.members.filter(user=user).exists():
            return {"error": "Пользователь не член организации"}, 400
        
        VaultAccess.objects.create(
            vault=vault,
            user=user,
            permission=data.permission,
            granted_by=request.user
        )
        return {"success": True}
    except Vault.DoesNotExist:
        raise Http404("Vault not found")
    except User.DoesNotExist:
        return {"error": "User not found"}, 404


@router.delete("/vaults/{vault_id}/access/{access_id}", tags=["Сейфы"], auth=jwt_auth)
def revoke_vault_access(request, vault_id: int, access_id: int):
    """Отозвать доступ к сейфу"""
    try:
        vault = Vault.objects.get(id=vault_id)
        # Проверяем права
        org_member = vault.organization.members.get(user=request.user)
        if org_member.role != OrganizationMember.RoleChoices.ADMIN:
            return {"error": "Нет прав для отзыва доступа"}, 403
        
        access = vault.access_list.get(id=access_id)
        access.delete()
        return {"success": True}
    except Vault.DoesNotExist:
        raise Http404("Vault not found")
    except VaultAccess.DoesNotExist:
        raise Http404("Access not found")
