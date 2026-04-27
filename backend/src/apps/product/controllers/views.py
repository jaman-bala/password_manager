from ninja import Router
from ninja.security import django_auth
from django.http import Http404
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.conf import settings
from config.ninja_auth import jwt_auth

from apps.organizations.models.vault import VaultAccess
from apps.product.models.models import ProductOrm, CategoryOrm
from apps.product.dto.schema import ProductDTO, CategoryDTO, ProductCreateDTO, CategoryCreateDTO, PaginatedProductsResponseSchema

router = Router()
User = get_user_model()

# Cache key helpers
def get_products_cache_key(user_id: int, page: int, limit: int, search: str = "") -> str:
    return f"products:u{user_id}:p{page}:l{limit}:s{search or 'all'}"

def get_categories_cache_key() -> str:
    return "categories:all"

def invalidate_products_cache(user_id: int):
    """Invalidate all product cache keys for a user"""
    # Delete cache with pattern (simple approach - delete specific keys)
    # For production with many pages, use Redis SCAN or cache versioning
    cache.delete_pattern(f"products:u{user_id}:*")

def invalidate_categories_cache():
    """Invalidate categories cache"""
    cache.delete(get_categories_cache_key())

@router.get("/categories", response=list[CategoryDTO], tags=["Категории"])
def get_categories(request):
    """Получить все категории товаров (кэшировано)"""
    cache_key = get_categories_cache_key()
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    
    categories = list(CategoryOrm.objects.all())
    cache.set(cache_key, categories, settings.CACHE_TTL_CATEGORIES)
    return categories


@router.post("/categories", response=CategoryDTO, tags=["Категории"])
def create_category(request, data: CategoryCreateDTO):
    """Создать новую категорию"""
    name = data.name.strip()
    if not name:
        raise ValueError("Название категории не может быть пустым")
    
    category = CategoryOrm.objects.create(name=name)
    invalidate_categories_cache()  # Clear categories cache
    return category


@router.delete("/categories/{category_id}", tags=["Категории"])
def delete_category(request, category_id: int):
    """Удалить категорию"""
    try:
        category = CategoryOrm.objects.get(id=category_id)
        # Удаляем категорию из всех продуктов
        ProductOrm.objects.filter(category=category).update(category=None)
        category.delete()
        invalidate_categories_cache()  # Clear categories cache
        # Invalidate all users' product caches since products were updated
        # In production, use targeted invalidation
        cache.clear()  # Simple approach: clear all cache
        return {"success": True, "message": "Category deleted successfully"}
    except CategoryOrm.DoesNotExist:
        raise Http404("Category not found")


@router.get("/products", response=PaginatedProductsResponseSchema, tags=["Продукты"], auth=jwt_auth)
def get_products(request, page: int = 1, limit: int = 20, search: str = ""):
    """Получить продукты пользователя с пагинацией (кэшировано)"""
    cache_key = get_products_cache_key(request.user.id, page, limit, search)
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    # Получаем ID сейфов, к которым у пользователя есть доступ
    accessible_vault_ids = VaultAccess.objects.filter(user=request.user).values_list('vault_id', flat=True)

    # Фильтруем: личные записи ИЛИ записи из доступных сейфов
    qs = ProductOrm.objects.filter(
        user=request.user
    ) | ProductOrm.objects.filter(
        vault_id__in=accessible_vault_ids
    )

    if search:
        qs = qs.filter(title__icontains=search) | qs.filter(login__icontains=search) | qs.filter(url__icontains=search)

    # Убеждаемся, что сортировка сохраняется после объединения QuerySet'ов
    qs = qs.order_by('-created_at')

    total = qs.count()
    total_pages = (total + limit - 1) // limit
    start = (page - 1) * limit
    end = start + limit

    items = list(qs[start:end])
    result = {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }
    cache.set(cache_key, result, settings.CACHE_TTL_PRODUCTS)
    return result

@router.get("/products/{product_id}", response=ProductDTO, tags=["Продукты"], auth=jwt_auth)
def get_product(request, product_id: int):
    """Получить продукт по ID"""
    try:
        product = ProductOrm.objects.get(id=product_id, user=request.user)
        return product
    except ProductOrm.DoesNotExist:
        raise Http404("Product not found")

@router.post("/products", response=ProductDTO, tags=["Продукты"], auth=jwt_auth)
def create_product(request, data: ProductCreateDTO):
    """Создать новый продукт"""
    category = None
    if data.category_id:
        category = CategoryOrm.objects.get(id=data.category_id)

    folder = None
    if data.folder_id:
        from apps.product.models import Folder
        folder = Folder.objects.get(id=data.folder_id)

    vault = None
    if data.vault_id:
        from apps.organizations.models import Vault
        vault = Vault.objects.get(id=data.vault_id)

    product = ProductOrm.objects.create(
        user=request.user,
        category=category,
        folder=folder,
        vault=vault,
        title=data.title or "",
        url=data.url or "",
        login=data.login or "",
        password=data.password or "",
        notes=data.notes or "",
    )
    invalidate_products_cache(request.user.id)  # Clear user's product cache
    return product

@router.put("/products/{product_id}", response=ProductDTO, tags=["Продукты"], auth=jwt_auth)
def update_product(request, product_id: int, data: ProductCreateDTO):
    """Обновить продукт"""
    try:
        product = ProductOrm.objects.get(id=product_id, user=request.user)
        category = None
        if data.category_id:
            category = CategoryOrm.objects.get(id=data.category_id)

        folder = None
        if data.folder_id:
            from apps.product.models import Folder
            folder = Folder.objects.get(id=data.folder_id)

        vault = None
        if data.vault_id:
            from apps.organizations.models import Vault
            vault = Vault.objects.get(id=data.vault_id)

        product.category = category
        product.folder = folder
        product.vault = vault
        product.title = data.title or ""
        product.url = data.url or ""
        product.login = data.login or ""
        product.password = data.password or ""
        product.notes = data.notes or ""
        product.save()

        invalidate_products_cache(request.user.id)  # Clear user's product cache
        return product
    except ProductOrm.DoesNotExist:
        raise Http404("Product not found")

@router.delete("/products/{product_id}", tags=["Продукты"], auth=jwt_auth)
def delete_product(request, product_id: int):
    """Удалить продукт"""
    try:
        product = ProductOrm.objects.get(id=product_id, user=request.user)
        product.delete()
        invalidate_products_cache(request.user.id)  # Clear user's product cache
        return {"success": True, "message": "Product deleted successfully"}
    except ProductOrm.DoesNotExist:
        raise Http404("Product not found")