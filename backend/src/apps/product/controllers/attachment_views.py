from typing import List

from django.http import Http404, FileResponse
from ninja import File, Router
from ninja.files import UploadedFile

from apps.product.dto.attachment_schema import AttachmentDTO
from apps.product.models.attachment import ProductAttachment
from apps.product.models.models import ProductOrm
from config.ninja_auth import jwt_auth

router = Router()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.get('/products/{product_id}/attachments', response=List[AttachmentDTO], auth=jwt_auth, tags=['Вложения'])
def list_attachments(request, product_id: int):
    """Список вложений для записи"""
    try:
        product = ProductOrm.objects.get(id=product_id, user=request.user)
    except ProductOrm.DoesNotExist:
        raise Http404('Product not found')
    return list(product.attachments.all())


@router.post('/products/{product_id}/attachments', response=List[AttachmentDTO], auth=jwt_auth, tags=['Вложения'])
def upload_attachments(request, product_id: int, files: List[UploadedFile] = File(...)):
    """Загрузить вложения для записи (несколько файлов одновременно)"""
    try:
        product = ProductOrm.objects.get(id=product_id, user=request.user)
    except ProductOrm.DoesNotExist:
        raise Http404('Product not found')

    created = []
    for f in files:
        if f.size and f.size > MAX_FILE_SIZE:
            continue
        attachment = ProductAttachment.objects.create(
            product=product,
            file=f,
            filename=f.name,
            content_type=f.content_type or 'application/octet-stream',
            size=f.size or 0,
        )
        created.append(attachment)
    return created


@router.delete('/attachments/{attachment_id}', auth=jwt_auth, tags=['Вложения'])
def delete_attachment(request, attachment_id: int):
    """Удалить вложение"""
    try:
        attachment = ProductAttachment.objects.select_related('product').get(
            id=attachment_id, product__user=request.user
        )
    except ProductAttachment.DoesNotExist:
        raise Http404('Attachment not found')

    if attachment.file:
        attachment.file.delete(save=False)
    attachment.delete()
    return {'success': True}


@router.get('/attachments/{attachment_id}/download', auth=jwt_auth, tags=['Вложения'])
def download_attachment(request, attachment_id: int):
    """Скачать или просмотреть вложение (изображения открываются inline)"""
    try:
        attachment = ProductAttachment.objects.select_related('product').get(
            id=attachment_id, product__user=request.user
        )
    except ProductAttachment.DoesNotExist:
        raise Http404('Attachment not found')

    if not attachment.file:
        raise Http404('File not found')

    is_image = attachment.content_type.startswith('image/')
    disposition = 'inline' if is_image else 'attachment'

    response = FileResponse(
        attachment.file.open('rb'),
        content_type=attachment.content_type,
    )
    response['Content-Disposition'] = f'{disposition}; filename="{attachment.filename}"'
    return response