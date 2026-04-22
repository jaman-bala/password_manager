from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Organization, Vault, OrganizationMember, VaultAccess


@admin.register(Organization)
class OrganizationAdmin(ModelAdmin):
    list_display = ('name', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'description')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Vault)
class VaultAdmin(ModelAdmin):
    list_display = ('name', 'organization', 'created_at')
    list_filter = ('organization', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(OrganizationMember)
class OrganizationMemberAdmin(ModelAdmin):
    list_display = ('user', 'organization', 'role', 'joined_at')
    list_filter = ('role', 'organization', 'joined_at')
    search_fields = ('user__username', 'organization__name')
    ordering = ('-joined_at',)
    readonly_fields = ('joined_at',)


@admin.register(VaultAccess)
class VaultAccessAdmin(ModelAdmin):
    list_display = ('user', 'vault', 'permission', 'granted_at')
    list_filter = ('permission', 'vault', 'granted_at')
    search_fields = ('user__username', 'vault__name')
    ordering = ('-granted_at',)
    readonly_fields = ('granted_at',)
