from django.db import models
from django.utils.translation import gettext_lazy as _


class DiscountEnum(models.TextChoices):
    MINIMUM = "minimum", _("10 %")
    AVERAGE = "average", _("20 %")
    HIGHER = "higher", _("30 %")
