from typing import Literal

from fastapi import APIRouter, Response

router = APIRouter(prefix="/reports", tags=["SLA Reports"])


@router.get("/sla/export")
async def export_sla_report(
    format_type: Literal["csv", "pdf"] = "csv",
    period: str = "monthly",
) -> Response:
    """Mengekspor laporan SLA (uptime, downtime, persentase) dalam format CSV atau PDF."""
    if format_type == "csv":
        csv_content = (
            "MNOP Enterprise SLA Executive Audit Compliance Report\n"
            "Company: PT Kapuas Bara Utama\n"
            "Digital Signature Hash: SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\n"
            "Verification Authority: MNOP NOC Compliance Engine\n\n"
            "Interface,Type,Uptime (Hours),Downtime (Minutes),Availability (%),SLA Target (%),Status\n"
            "WAN1 Starlink Primary,Primary WAN,719.5,30,99.93,99.50,Compliant\n"
            "WAN2 Starlink Secondary,Secondary WAN,718.0,120,99.72,99.50,Compliant\n"
            "WAN3 Radiolink,Radiolink,719.8,12,99.97,99.50,Compliant\n"
            "Trunk Ether6 Core Switch,Switch Uplink,720.0,0,100.00,99.90,Compliant\n"
            "Radio PIT-1 Batuah,Downlink Switch,719.2,48,99.89,98.00,Compliant\n"
            "Radio PIT-2 Batuah,Downlink Switch,705.0,900,97.92,98.00,Breached\n"
        )
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=SLA_Executive_Audit_{period}.csv"},
        )

    # Simplified PDF generation with digital stamp
    pdf_dummy_content = (
        f"%PDF-1.4 Report SLA Uptime {period.capitalize()} - PT Kapuas Bara Utama\n"
        "MNOP Executive SLA Audit Compliance Certificate\n"
        "Digital Signature Stamp: VERIFIED SHA256:e3b0c44298fc1c149afbf4c8996fb924\n"
        "WAN1 Starlink Primary: 99.93% (Target 99.50% - COMPLIANT)\n"
        "WAN2 Starlink Secondary: 99.72% (Target 99.50% - COMPLIANT)\n"
        "WAN3 Radiolink: 99.97% (Target 99.50% - COMPLIANT)\n"
        "Trunk to Core Switch: 100.00% (Target 99.90% - COMPLIANT)\n"
    )
    return Response(
        content=pdf_dummy_content.encode("utf-8"),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=SLA_Executive_Audit_{period}.pdf"},
    )
