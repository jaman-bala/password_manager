// Security types

export interface MasterPasswordSetup {
  master_password: string;
  confirm_password: string;
}

export interface MasterPasswordVerify {
  master_password: string;
}

export interface TwoFactorSetup {
  code: string;
}

export interface TwoFactorVerify {
  code: string;
}

export interface PasswordBreachCheck {
  password: string;
}

export interface PasswordBreachResponse {
  is_breached: boolean;
  count: number;
}

export interface TwoFactorStatus {
  enabled: boolean;
  has_backup_codes: boolean;
}

export interface TwoFactorSetupResponse {
  success: boolean;
  secret: string;
  qr_code: string;
}

export interface TwoFactorEnableResponse {
  success: boolean;
  message: string;
  backup_codes: string[];
}
