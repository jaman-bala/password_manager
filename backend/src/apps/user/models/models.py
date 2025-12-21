from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import PermissionsMixin
from django.db import models

from apps.user.managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    fio = models.CharField("FIO", max_length=150)
    email = models.EmailField("Email", blank=True, null=True)
    username = models.CharField("Username", max_length=150, unique=True)
    profile_image = models.ImageField("Profile image", blank=True, null=True)
    is_active = models.BooleanField("Active", default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = []  # type: ignore
    objects = UserManager()

    def __str__(self) -> str:
        return f"{self.username} - {self.fio}"

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        db_table = "user_user"
