import logging
from typing import Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/alerts", tags=["Alert Notifications"])
logger = logging.getLogger(__name__)


class TelegramConfigSchema(BaseModel):
    bot_token: str = Field(..., json_schema_extra={"example": "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"})
    chat_id: str = Field(..., json_schema_extra={"example": "-100123456789"})
    enabled: bool = True


class EmailConfigSchema(BaseModel):
    smtp_host: str = Field(..., json_schema_extra={"example": "smtp.gmail.com"})
    smtp_port: int = Field(587, json_schema_extra={"example": 587})
    sender_email: str = Field(..., json_schema_extra={"example": "noc-alert@kbucoal.com"})
    recipient_emails: list[str] = Field(..., json_schema_extra={"example": ["it-manager@kbucoal.com", "noc-admin@kbucoal.com"]})
    enabled: bool = True


class AlertTestRequest(BaseModel):
    alert_type: str = Field("telegram", json_schema_extra={"example": "telegram"})
    device_name: str = Field("Core Router CCR2004", json_schema_extra={"example": "Core Router CCR2004"})
    event_type: str = Field("DOWN", json_schema_extra={"example": "DOWN"})
    message: str = Field("Link WAN1 Starlink Down detected on Batuah Site", json_schema_extra={"example": "Link WAN1 Starlink Down detected on Batuah Site"})


@router.post("/test", status_code=status.HTTP_200_OK)
async def send_test_alert(payload: AlertTestRequest) -> dict[str, Any]:
    """Send simulated Telegram Bot or Email SMTP alert for network event."""
    logger.info(
        f"Triggering {payload.alert_type} alert for device {payload.device_name}: {payload.event_type} - {payload.message}"
    )

    if payload.alert_type == "telegram":
        return {
            "status": "success",
            "channel": "Telegram Bot",
            "message": f"Notifikasi Telegram berhasil dikirim ke Chat ID NOC: [{payload.event_type}] {payload.device_name} - {payload.message}",
            "delivered": True,
        }
    elif payload.alert_type == "email":
        return {
            "status": "success",
            "channel": "SMTP Email Engine",
            "message": f"Email alert SMTP dikirim ke tim IT Management: [{payload.event_type}] {payload.device_name}",
            "delivered": True,
        }
    elif payload.alert_type == "whatsapp":
        return {
            "status": "success",
            "channel": "WhatsApp Business API",
            "message": f"Pesan WA resmi terkirim ke Nomor On-Call NOC (+6281234567890): [{payload.event_type}] {payload.device_name}",
            "delivered": True,
        }
    elif payload.alert_type == "sms":
        return {
            "status": "success",
            "channel": "SMS Gateway Modem",
            "message": f"SMS darurat terkirim via Gateway GSM: [{payload.event_type}] {payload.device_name}",
            "delivered": True,
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipe channel alert tidak valid. Gunakan 'telegram', 'email', 'whatsapp', atau 'sms'.",
        )
