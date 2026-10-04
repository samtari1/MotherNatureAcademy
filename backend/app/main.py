from contextlib import asynccontextmanager
from datetime import date, datetime, timezone
from email.message import EmailMessage
import smtplib
import ssl
import time
import logging
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import Date, DateTime, Integer, String, Text, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    database_url: str = "postgresql+psycopg://mna_user:replace-me@localhost:5432/mna"
    allowed_origins: str = "http://localhost:3000"
    notification_email: EmailStr = "Laura@MotherNatureAcademy.com"
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    smtp_starttls: bool = True


settings = Settings()
engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class Inquiry(Base):
    __tablename__ = "inquiries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    parent_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(40))
    child_name: Mapped[str | None] = mapped_column(String(80))
    child_age: Mapped[str] = mapped_column(String(40), nullable=False)
    schedule: Mapped[str | None] = mapped_column(String(120))
    message: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    notification_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Registration(Base):
    __tablename__ = "registrations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    school_year: Mapped[str] = mapped_column(String(12), nullable=False)
    child_name: Mapped[str] = mapped_column(String(120), nullable=False)
    child_nickname: Mapped[str | None] = mapped_column(String(80))
    child_date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    lives_with: Mapped[str] = mapped_column(String(40), nullable=False)
    schedule: Mapped[str] = mapped_column(String(20), nullable=False)
    guardian_name: Mapped[str] = mapped_column(String(120), nullable=False)
    guardian_relationship: Mapped[str] = mapped_column(String(80), nullable=False)
    address: Mapped[str] = mapped_column(String(200), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(2), nullable=False)
    postal_code: Mapped[str] = mapped_column(String(20), nullable=False)
    home_phone: Mapped[str | None] = mapped_column(String(40))
    cell_phone: Mapped[str] = mapped_column(String(40), nullable=False)
    work_phone: Mapped[str | None] = mapped_column(String(40))
    guardian_email: Mapped[str] = mapped_column(String(254), nullable=False)
    second_guardian_name: Mapped[str | None] = mapped_column(String(120))
    second_guardian_relationship: Mapped[str | None] = mapped_column(String(80))
    second_guardian_phone: Mapped[str | None] = mapped_column(String(40))
    second_guardian_email: Mapped[str | None] = mapped_column(String(254))
    signature: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    notification_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    yield


app = FastAPI(title="Mother Nature Academy Inquiry API", version="1.0.0", lifespan=lifespan)
origins = [origin.strip() for origin in settings.allowed_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class InquiryCreate(BaseModel):
    parent_name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=40)
    child_name: str | None = Field(default=None, max_length=80)
    child_age: Literal["2.5", "3", "4", "5", "Other / not yet born"]
    schedule: str | None = Field(default=None, max_length=120)
    message: str | None = Field(default=None, max_length=2000)
    consent: Literal["yes"]
    website: str | None = Field(default=None, max_length=300)

    @field_validator("parent_name", "email", mode="before")
    @classmethod
    def strip_strings(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("phone", "child_name", "schedule", "message", mode="before")
    @classmethod
    def strip_optional_strings(cls, value):
        if isinstance(value, str):
            clean = value.strip()
            return clean or None
        return value


class RegistrationCreate(BaseModel):
    school_year: Literal["2026-27"]
    child_name: str = Field(min_length=1, max_length=120)
    child_nickname: str | None = Field(default=None, max_length=80)
    child_date_of_birth: date
    lives_with: Literal["Mother", "Father", "Both parents", "Other"]
    schedule: Literal["2_days", "3_days", "5_days"]
    guardian_name: str = Field(min_length=1, max_length=120)
    guardian_relationship: str = Field(min_length=1, max_length=80)
    address: str = Field(min_length=1, max_length=200)
    city: str = Field(min_length=1, max_length=100)
    state: str = Field(min_length=2, max_length=2)
    postal_code: str = Field(min_length=3, max_length=20)
    home_phone: str | None = Field(default=None, max_length=40)
    cell_phone: str = Field(min_length=1, max_length=40)
    work_phone: str | None = Field(default=None, max_length=40)
    guardian_email: EmailStr
    second_guardian_name: str | None = Field(default=None, max_length=120)
    second_guardian_relationship: str | None = Field(default=None, max_length=80)
    second_guardian_phone: str | None = Field(default=None, max_length=40)
    second_guardian_email: EmailStr | None = None
    signature: str = Field(min_length=1, max_length=120)
    accuracy_confirmed: Literal["yes"]
    application_acknowledged: Literal["yes"]
    website: str | None = Field(default=None, max_length=300)

    @field_validator("child_name", "guardian_name", "guardian_relationship", "address", "city", "postal_code", "signature", mode="before")
    @classmethod
    def strip_required_strings(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("child_nickname", "home_phone", "work_phone", "second_guardian_name", "second_guardian_relationship", "second_guardian_phone", mode="before")
    @classmethod
    def strip_registration_optional_strings(cls, value):
        if isinstance(value, str):
            clean = value.strip()
            return clean or None
        return value

    @field_validator("state", mode="before")
    @classmethod
    def normalize_state(cls, value):
        return value.strip().upper() if isinstance(value, str) else value


def notify_academy(inquiry: Inquiry) -> bool:
    if not all([settings.smtp_host, settings.smtp_from, settings.smtp_user, settings.smtp_password]):
        return False
    msg = EmailMessage()
    msg["Subject"] = f"New website inquiry from {inquiry.parent_name}"
    msg["From"] = settings.smtp_from
    msg["To"] = str(settings.notification_email)
    msg["Reply-To"] = inquiry.email
    msg.set_content(
        "A new Mother Nature Academy website inquiry was submitted.\n\n"
        f"Parent/guardian: {inquiry.parent_name}\n"
        f"Email: {inquiry.email}\n"
        f"Phone: {inquiry.phone or 'Not provided'}\n"
        f"Child first name: {inquiry.child_name or 'Not provided'}\n"
        f"Child age: {inquiry.child_age}\n"
        f"Schedule: {inquiry.schedule or 'Not selected'}\n\n"
        f"Message:\n{inquiry.message or 'No message'}\n"
    )
    context = ssl.create_default_context()
    if settings.smtp_port == 465:
        smtp_connection = smtplib.SMTP_SSL(
            settings.smtp_host,
            settings.smtp_port,
            timeout=12,
            context=context,
        )
    else:
        smtp_connection = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=12)

    with smtp_connection as smtp:
        smtp.ehlo()
        if settings.smtp_starttls and settings.smtp_port != 465:
            smtp.starttls(context=context)
            smtp.ehlo()
        smtp.login(settings.smtp_user, settings.smtp_password)
        smtp.send_message(msg)
    return True


def notify_registration(registration: Registration) -> bool:
    if not all([settings.smtp_host, settings.smtp_from, settings.smtp_user, settings.smtp_password]):
        return False
    schedules = {
        "2_days": "Tuesday and Thursday — $325/month",
        "3_days": "Monday, Wednesday, and Friday — $425/month",
        "5_days": "Monday through Friday — $575/month",
    }
    msg = EmailMessage()
    msg["Subject"] = "New Mother Nature Academy registration application"
    msg["From"] = settings.smtp_from
    msg["To"] = str(settings.notification_email)
    msg["Reply-To"] = registration.guardian_email
    msg.set_content(
        "A registration application was submitted through the academy website.\n\n"
        f"School year: {registration.school_year}\n"
        f"Child: {registration.child_name}\n"
        f"Nickname: {registration.child_nickname or 'Not provided'}\n"
        f"Date of birth: {registration.child_date_of_birth.isoformat()}\n"
        f"Lives with: {registration.lives_with}\n"
        f"Schedule: {schedules[registration.schedule]}\n\n"
        f"Responsible party: {registration.guardian_name}\n"
        f"Relationship: {registration.guardian_relationship}\n"
        f"Address: {registration.address}, {registration.city}, {registration.state} {registration.postal_code}\n"
        f"Home phone: {registration.home_phone or 'Not provided'}\n"
        f"Cell phone: {registration.cell_phone}\n"
        f"Work phone: {registration.work_phone or 'Not provided'}\n"
        f"Email: {registration.guardian_email}\n\n"
        f"Second responsible party: {registration.second_guardian_name or 'Not provided'}\n"
        f"Relationship: {registration.second_guardian_relationship or 'Not provided'}\n"
        f"Phone: {registration.second_guardian_phone or 'Not provided'}\n"
        f"Email: {registration.second_guardian_email or 'Not provided'}\n\n"
        f"Typed signature: {registration.signature}\n"
        f"Submitted at (UTC): {registration.created_at.isoformat()}\n\n"
        "Medical, medication, allergy, immunization, and payment details are not collected by this web form."
    )
    context = ssl.create_default_context()
    if settings.smtp_port == 465:
        smtp_connection = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=12, context=context)
    else:
        smtp_connection = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=12)
    with smtp_connection as smtp:
        smtp.ehlo()
        if settings.smtp_starttls and settings.smtp_port != 465:
            smtp.starttls(context=context)
            smtp.ehlo()
        smtp.login(settings.smtp_user, settings.smtp_password)
        smtp.send_message(msg)
    return True


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/inquiries", status_code=201)
def create_inquiry(payload: InquiryCreate):
    # A hidden honeypot catches basic automated submissions without exposing a challenge to families.
    if payload.website:
        return {"status": "received", "notification_sent": True}

    now = time.time()

    with SessionLocal() as db:
        recent = db.scalars(
            select(Inquiry).where(Inquiry.created_at >= datetime.fromtimestamp(now - 60, timezone.utc)).order_by(Inquiry.created_at.desc()).limit(20)
        ).all()
        # Basic global abuse brake. Configure an IP-aware rate limiter at the reverse proxy for production.
        if len(recent) >= 20:
            raise HTTPException(status_code=429, detail="Please wait a moment before trying again.")
        row = Inquiry(
            parent_name=payload.parent_name,
            email=str(payload.email),
            phone=payload.phone,
            child_name=payload.child_name,
            child_age=payload.child_age,
            schedule=payload.schedule,
            message=payload.message,
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        notification_sent = False
        try:
            notification_sent = notify_academy(row)
            if notification_sent:
                row.notification_sent_at = datetime.now(timezone.utc)
                db.commit()
            else:
                logger.warning("SMTP is not configured; inquiry %s was saved without email notification", row.id)
        except (OSError, smtplib.SMTPException):
            # The inquiry remains safely stored for follow-up if email delivery is unavailable.
            logger.exception("Email notification failed for inquiry %s", row.id)
        return {"status": "received", "id": row.id, "notification_sent": notification_sent}


@app.post("/api/registrations", status_code=201)
def create_registration(payload: RegistrationCreate):
    if payload.website:
        return {"status": "received", "notification_sent": True}

    now = time.time()
    with SessionLocal() as db:
        recent = db.scalars(
            select(Registration).where(Registration.created_at >= datetime.fromtimestamp(now - 60, timezone.utc)).order_by(Registration.created_at.desc()).limit(20)
        ).all()
        if len(recent) >= 20:
            raise HTTPException(status_code=429, detail="Please wait a moment before trying again.")
        row = Registration(**payload.model_dump(exclude={"accuracy_confirmed", "application_acknowledged", "website"}))
        row.guardian_email = str(payload.guardian_email)
        if payload.second_guardian_email:
            row.second_guardian_email = str(payload.second_guardian_email)
        db.add(row)
        db.commit()
        db.refresh(row)
        notification_sent = False
        try:
            notification_sent = notify_registration(row)
            if notification_sent:
                row.notification_sent_at = datetime.now(timezone.utc)
                db.commit()
            else:
                logger.warning("SMTP is not configured; registration %s was saved without email notification", row.id)
        except (OSError, smtplib.SMTPException):
            logger.exception("Registration email notification failed for registration %s", row.id)
        return {"status": "received", "id": row.id, "notification_sent": notification_sent}
