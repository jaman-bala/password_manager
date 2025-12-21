from ninja import Router
from ninja.security import django_auth
from django.http import Http404
from django.contrib.auth import get_user_model
from config.ninja_auth import jwt_auth

from apps.product.models.models import ProductOrm, CategoryOrm
from apps.product.dto.schema import ProductDTO, CategoryDTO, ProductCreateDTO

router = Router()
User = get_user_model()


@router.get("/categories", response=list[CategoryDTO], tags=["Категории"])
def get_categories(request):
    """Получить все категории товаров"""
    categories = CategoryOrm.objects.all()
    return categories

@router.get("/products", response=list[ProductDTO], tags=["Продукты"], auth=jwt_auth)
def get_products(request):
    """Получить все продукты пользователя"""
    qs = ProductOrm.objects.filter(user=request.user)
    return qs

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
    product = ProductOrm.objects.create(
        user=request.user,
        category=category,
        title=data.title or "",
        url=data.url or "",
        login=data.login or "",
        password=data.password or "",
        notes=data.notes or "",
    )
    return product

@router.put("/products/{product_id}", response=ProductDTO, tags=["Продукты"], auth=jwt_auth)
def update_product(request, product_id: int, data: ProductCreateDTO):
    """Обновить продукт"""
    try:
        product = ProductOrm.objects.get(id=product_id, user=request.user)
        category = None
        if data.category_id:
            category = CategoryOrm.objects.get(id=data.category_id)
        
        product.category = category
        product.title = data.title or ""
        product.url = data.url or ""
        product.login = data.login or ""
        product.password = data.password or ""
        product.notes = data.notes or ""
        product.save()
        
        return product
    except ProductOrm.DoesNotExist:
        raise Http404("Product not found")

@router.delete("/products/{product_id}", tags=["Продукты"], auth=jwt_auth)
def delete_product(request, product_id: int):
    """Удалить продукт"""
    try:
        product = ProductOrm.objects.get(id=product_id, user=request.user)
        product.delete()
        return {"success": True, "message": "Product deleted successfully"}
    except ProductOrm.DoesNotExist:
        raise Http404("Product not found")