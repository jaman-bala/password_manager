import base64
import hashlib
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import os


class EncryptionService:
    """Сервис для шифрования/дешифрования паролей с master password"""
    
    @staticmethod
    def derive_key(master_password: str, salt: bytes = None) -> tuple[bytes, bytes]:
        """
        Генерирует ключ из master password с использованием PBKDF2
        
        Args:
            master_password: мастер-пароль пользователя
            salt: соль для ключа (если None, генерируется новая)
            
        Returns:
            (key, salt) - ключ и соль
        """
        if salt is None:
            salt = os.urandom(16)
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(master_password.encode()))
        return key, salt
    
    @staticmethod
    def encrypt_password(password: str, master_password: str) -> tuple[str, str]:
        """
        Шифрует пароль с master password
        
        Args:
            password: пароль для шифрования
            master_password: мастер-пароль пользователя
            
        Returns:
            (encrypted_password, salt) - зашифрованный пароль в base64 и соль в base64
        """
        key, salt = EncryptionService.derive_key(master_password)
        fernet = Fernet(key)
        encrypted = fernet.encrypt(password.encode())
        return base64.b64encode(encrypted).decode(), base64.b64encode(salt).decode()
    
    @staticmethod
    def decrypt_password(encrypted_password: str, salt: str, master_password: str) -> str:
        """
        Дешифрует пароль с master password
        
        Args:
            encrypted_password: зашифрованный пароль в base64
            salt: соль в base64
            master_password: мастер-пароль пользователя
            
        Returns:
            расшифрованный пароль
        """
        salt_bytes = base64.b64decode(salt)
        key, _ = EncryptionService.derive_key(master_password, salt_bytes)
        fernet = Fernet(key)
        encrypted_bytes = base64.b64decode(encrypted_password)
        decrypted = fernet.decrypt(encrypted_bytes)
        return decrypted.decode()
    
    @staticmethod
    def hash_master_password(master_password: str) -> str:
        """
        Создаёт хеш master password для хранения в базе (для проверки)
        
        Args:
            master_password: мастер-пароль
            
        Returns:
            хеш пароля
        """
        return hashlib.sha256(master_password.encode()).hexdigest()
    
    @staticmethod
    def verify_master_password(master_password: str, stored_hash: str) -> bool:
        """
        Проверяет master password
        
        Args:
            master_password: введённый пароль
            stored_hash: сохранённый хеш
            
        Returns:
            True если пароль верный
        """
        return hashlib.sha256(master_password.encode()).hexdigest() == stored_hash
