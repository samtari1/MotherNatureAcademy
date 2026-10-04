from contextlib import asynccontextmanager
from datetime import date, datetime, timezone
from email.message import EmailMessage
from pathlib import Path
import smtplib
import ssl
import time
import logging
import hmac
import re
import uuid
from typing import Literal
from urllib.parse import parse_qs, urlencode, urlparse

from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import Date, DateTime, Integer, String, Text, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker
from starlette.staticfiles import StaticFiles

from app.admin_security import create_session, verify_password, verify_session

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
    admin_username: str = ""
    admin_password_hash: str = ""
    admin_session_secret: str = ""
    admin_cookie_secure: bool = False
    media_dir: str = str(Path(__file__).resolve().parents[2] / "media")


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
    school_year: Mapped[str] = mapped_column(String(40), nullable=False)
    child_name: Mapped[str] = mapped_column(String(120), nullable=False)
    child_nickname: Mapped[str | None] = mapped_column(String(80))
    child_age: Mapped[str] = mapped_column(String(40), nullable=False)
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


class NewsPost(Base):
    __tablename__ = "news_posts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), nullable=False, unique=True, index=True)
    summary: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    body: Mapped[str] = mapped_column(Text, nullable=False, default="")
    published: Mapped[bool] = mapped_column(default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class MediaItem(Base):
    __tablename__ = "media_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    kind: Mapped[str] = mapped_column(String(12), nullable=False)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    caption: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    alt_text: Mapped[str] = mapped_column(String(300), nullable=False, default="")
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    published: Mapped[bool] = mapped_column(default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class SiteConfiguration(Base):
    __tablename__ = "site_configuration"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    hours: Mapped[str] = mapped_column(String(180), nullable=False)
    campus_location: Mapped[str] = mapped_column(String(180), nullable=False)
    tuition_2_days: Mapped[str] = mapped_column(String(40), nullable=False)
    tuition_3_days: Mapped[str] = mapped_column(String(40), nullable=False)
    tuition_5_days: Mapped[str] = mapped_column(String(40), nullable=False)
    registration_fee: Mapped[str] = mapped_column(String(40), nullable=False)
    school_year: Mapped[str] = mapped_column(String(40), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


@asynccontextmanager
async def lifespan(_: FastAPI):
    Path(settings.media_dir).mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(engine)
    seed_content()
    yield


app = FastAPI(title="Mother Nature Academy Inquiry API", version="1.0.0", lifespan=lifespan)
origins = [origin.strip() for origin in settings.allowed_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)

Path(settings.media_dir).mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=settings.media_dir), name="media")
login_failures: dict[str, list[float]] = {}


def seed_content() -> None:
    with SessionLocal() as db:
        if db.get(SiteConfiguration, 1) is None:
            db.add(SiteConfiguration(
                id=1,
                hours="Monday–Friday, 9:00 am–12:00 pm",
                campus_location="Carthage, North Carolina",
                tuition_2_days="$325",
                tuition_3_days="$425",
                tuition_5_days="$575",
                registration_fee="$100",
                school_year="2026–2027",
            ))
        if db.scalar(select(MediaItem.id).limit(1)) is None:
            seed_items = [
                ("photo", "Pond", "Time outside by the pond", "Pond and trees on the academy grounds", "/images/pond.jpg", 10),
                ("photo", "Garden", "Growing and noticing in the garden", "Rows of leafy plants growing in the garden", "/images/garden.png", 20),
                ("photo", "Chicken coop", "Our chicken coop", "Chickens in their coop", "/images/chicken-coop.jpg", 30),
                ("photo", "Rabbits", "Rabbits on the farm", "Rabbits resting in their enclosure", "/images/rabbits.jpg", 40),
                ("photo", "Reading nook", "A quiet reading nook", "Books and a quiet reading corner", "/images/library.jpg", 50),
                ("photo", "Mud kitchen", "Outdoor pretend play", "Outdoor mud kitchen play space", "/images/mudkitchen.jpg", 60),
                ("video", "Virtual campus tour", "Take a look around campus", "", "https://www.youtube.com/embed/LZVVfnhUSSg", 10),
            ]
            db.add_all([MediaItem(kind=k, title=t, caption=c, alt_text=a, url=u, sort_order=o) for k, t, c, a, u, o in seed_items])
        db.commit()


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
    school_year: str = Field(min_length=1, max_length=12)
    child_name: str = Field(min_length=1, max_length=120)
    child_nickname: str | None = Field(default=None, max_length=80)
    child_age: Literal["2.5", "3", "4", "5", "Other / not yet born"]
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

    @field_validator("second_guardian_email", mode="before")
    @classmethod
    def empty_second_email_is_missing(cls, value):
        return None if value == "" else value


class AdminLogin(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=200)


class NewsInput(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    summary: str = Field(default="", max_length=500)
    body: str = Field(min_length=1, max_length=20000)
    published: bool = False


class VideoInput(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    caption: str = Field(default="", max_length=500)
    url: str = Field(min_length=1, max_length=500)
    published: bool = True
    sort_order: int = 0


class MediaEdit(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    caption: str = Field(default="", max_length=500)
    alt_text: str = Field(default="", max_length=300)
    published: bool
    sort_order: int = Field(ge=0, le=10000)
    url: str | None = Field(default=None, max_length=500)


class SiteConfigurationInput(BaseModel):
    hours: str = Field(min_length=1, max_length=180)
    campus_location: str = Field(min_length=1, max_length=180)
    tuition_2_days: str = Field(min_length=1, max_length=40)
    tuition_3_days: str = Field(min_length=1, max_length=40)
    tuition_5_days: str = Field(min_length=1, max_length=40)
    registration_fee: str = Field(min_length=1, max_length=40)
    school_year: str = Field(min_length=1, max_length=40)


def allowed_admin_origin(request: Request) -> None:
    origin = request.headers.get("origin", "")
    if origin not in origins:
        raise HTTPException(status_code=403, detail="This request origin is not allowed.")


def require_admin(request: Request) -> str:
    if not settings.admin_username or not settings.admin_password_hash or len(settings.admin_session_secret) < 32:
        raise HTTPException(status_code=503, detail="Admin login has not been configured on this server.")
    token = request.cookies.get("mna_admin_session")
    if not verify_session(token, settings.admin_session_secret, settings.admin_username):
        raise HTTPException(status_code=401, detail="Please sign in to continue.")
    return settings.admin_username


def safe_video_url(url: str) -> str:
    parsed = urlparse(url.strip())
    host = (parsed.hostname or "").lower()
    video_id = ""
    if host in {"youtu.be", "www.youtu.be"}:
        video_id = parsed.path.strip("/").split("/")[0]
    elif host in {"youtube.com", "www.youtube.com", "m.youtube.com"}:
        video_id = parse_qs(parsed.query).get("v", [""])[0]
        if not video_id and parsed.path.startswith("/embed/"):
            video_id = parsed.path.split("/embed/", 1)[1].split("/", 1)[0]
    elif host == "www.youtube-nocookie.com" or host == "youtube-nocookie.com":
        if parsed.path.startswith("/embed/"):
            video_id = parsed.path.split("/embed/", 1)[1].split("/", 1)[0]
    if not re.fullmatch(r"[A-Za-z0-9_-]{6,20}", video_id):
        raise HTTPException(status_code=422, detail="Use a valid YouTube video link.")
    # Retain YouTube's optional share/embed token when supplied. Other query
    # values from watch links are intentionally discarded.
    share_token = parse_qs(parsed.query).get("si", [""])[0]
    query = urlencode({"si": share_token}) if re.fullmatch(r"[A-Za-z0-9_-]{1,128}", share_token) else ""
    return f"https://www.youtube.com/embed/{video_id}" + (f"?{query}" if query else "")


def news_to_dict(post: NewsPost) -> dict:
    return {"id": post.id, "title": post.title, "slug": post.slug, "summary": post.summary, "body": post.body,
            "published": post.published, "created_at": post.created_at, "updated_at": post.updated_at}


def media_to_dict(item: MediaItem) -> dict:
    return {"id": item.id, "kind": item.kind, "title": item.title, "caption": item.caption,
            "alt_text": item.alt_text, "url": item.url, "published": item.published,
            "sort_order": item.sort_order, "created_at": item.created_at}


def config_to_dict(row: SiteConfiguration) -> dict:
    return {"hours": row.hours, "campus_location": row.campus_location,
            "tuition_2_days": row.tuition_2_days, "tuition_3_days": row.tuition_3_days,
            "tuition_5_days": row.tuition_5_days, "registration_fee": row.registration_fee,
            "school_year": row.school_year, "updated_at": row.updated_at}


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
        f"Age: {registration.child_age}\n"
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


@app.post("/api/admin/login")
def admin_login(payload: AdminLogin, request: Request, response: Response):
    allowed_admin_origin(request)
    if not settings.admin_username or not settings.admin_password_hash or len(settings.admin_session_secret) < 32:
        raise HTTPException(status_code=503, detail="Admin login has not been configured on this server.")
    client_host = request.client.host if request.client else "unknown"
    forwarded_for = request.headers.get("x-forwarded-for", "")
    key = forwarded_for.split(",", 1)[0].strip() if client_host in {"127.0.0.1", "::1"} and forwarded_for else client_host
    now = time.time()
    attempts = [stamp for stamp in login_failures.get(key, []) if now - stamp < 900]
    login_failures[key] = attempts
    if len(attempts) >= 5:
        raise HTTPException(status_code=429, detail="Too many sign-in attempts. Please wait 15 minutes.")
    username_ok = hmac.compare_digest(payload.username.encode(), settings.admin_username.encode())
    password_ok = verify_password(payload.password, settings.admin_password_hash)
    if not (username_ok and password_ok):
        login_failures[key].append(now)
        raise HTTPException(status_code=401, detail="The username or password is incorrect.")
    login_failures.pop(key, None)
    response.set_cookie(
        "mna_admin_session",
        create_session(settings.admin_username, settings.admin_session_secret),
        max_age=12 * 60 * 60,
        httponly=True,
        secure=settings.admin_cookie_secure,
        samesite="strict",
        path="/",
    )
    return {"username": settings.admin_username}


@app.get("/api/admin/session")
def admin_session(username: str = Depends(require_admin)):
    return {"username": username}


@app.post("/api/admin/logout")
def admin_logout(request: Request, response: Response, _: str = Depends(require_admin)):
    allowed_admin_origin(request)
    response.delete_cookie("mna_admin_session", path="/", secure=settings.admin_cookie_secure, httponly=True, samesite="strict")
    return {"status": "signed out"}


@app.get("/api/news")
def list_public_news():
    with SessionLocal() as db:
        posts = db.scalars(select(NewsPost).where(NewsPost.published.is_(True)).order_by(NewsPost.created_at.desc())).all()
        return [news_to_dict(post) for post in posts]


@app.get("/api/media")
def list_public_media(kind: Literal["photo", "video"] | None = None):
    with SessionLocal() as db:
        query = select(MediaItem).where(MediaItem.published.is_(True))
        if kind:
            query = query.where(MediaItem.kind == kind)
        items = db.scalars(query.order_by(MediaItem.sort_order, MediaItem.id)).all()
        return [media_to_dict(item) for item in items]


@app.get("/api/site-content")
def get_public_site_content():
    with SessionLocal() as db:
        row = db.get(SiteConfiguration, 1)
        if row is None:
            raise HTTPException(status_code=503, detail="Site content is not ready.")
        return config_to_dict(row)


@app.get("/api/admin/news")
def list_admin_news(_: str = Depends(require_admin)):
    with SessionLocal() as db:
        posts = db.scalars(select(NewsPost).order_by(NewsPost.updated_at.desc())).all()
        return [news_to_dict(post) for post in posts]


def make_slug(title: str, post_id: int | None = None) -> str:
    slug = re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", title.lower())).strip("-") or "news"
    return (slug[:180].rstrip("-") + (f"-{post_id}" if post_id else ""))[:200]


@app.post("/api/admin/news", status_code=201)
def create_news(payload: NewsInput, request: Request, _: str = Depends(require_admin)):
    allowed_admin_origin(request)
    with SessionLocal() as db:
        post = NewsPost(title=payload.title.strip(), summary=payload.summary.strip(), body=payload.body.strip(), published=payload.published, slug="pending")
        db.add(post)
        db.flush()
        post.slug = make_slug(post.title, post.id)
        db.commit()
        db.refresh(post)
        return news_to_dict(post)


@app.put("/api/admin/news/{post_id}")
def update_news(post_id: int, payload: NewsInput, request: Request, _: str = Depends(require_admin)):
    allowed_admin_origin(request)
    with SessionLocal() as db:
        post = db.get(NewsPost, post_id)
        if post is None:
            raise HTTPException(status_code=404, detail="News post not found.")
        post.title = payload.title.strip()
        post.slug = make_slug(post.title, post.id)
        post.summary = payload.summary.strip()
        post.body = payload.body.strip()
        post.published = payload.published
        db.commit()
        db.refresh(post)
        return news_to_dict(post)


@app.delete("/api/admin/news/{post_id}")
def delete_news(post_id: int, request: Request, _: str = Depends(require_admin)):
    allowed_admin_origin(request)
    with SessionLocal() as db:
        post = db.get(NewsPost, post_id)
        if post is None:
            raise HTTPException(status_code=404, detail="News post not found.")
        db.delete(post)
        db.commit()
    return {"status": "deleted"}


@app.get("/api/admin/media")
def list_admin_media(_: str = Depends(require_admin)):
    with SessionLocal() as db:
        items = db.scalars(select(MediaItem).order_by(MediaItem.kind, MediaItem.sort_order, MediaItem.id)).all()
        return [media_to_dict(item) for item in items]


@app.post("/api/admin/media/photos", status_code=201)
async def upload_admin_photo(
    request: Request,
    file: UploadFile = File(...),
    title: str = Form(..., min_length=1, max_length=180),
    caption: str = Form(default="", max_length=500),
    alt_text: str = Form(default="", max_length=300),
    _: str = Depends(require_admin),
):
    allowed_admin_origin(request)
    content_type = (file.content_type or "").lower()
    extension_and_signature = {
        "image/jpeg": ("jpg", lambda data: data.startswith(b"\xff\xd8\xff")),
        "image/png": ("png", lambda data: data.startswith(b"\x89PNG\r\n\x1a\n")),
        "image/webp": ("webp", lambda data: data.startswith(b"RIFF") and data[8:12] == b"WEBP"),
    }
    if content_type not in extension_and_signature:
        raise HTTPException(status_code=415, detail="Upload a JPG, PNG, or WebP image.")
    contents = await file.read(8 * 1024 * 1024 + 1)
    extension, signature_check = extension_and_signature[content_type]
    if len(contents) > 8 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image files must be 8 MB or smaller.")
    if not signature_check(contents):
        raise HTTPException(status_code=415, detail="The uploaded file does not match its image type.")
    filename = f"{uuid.uuid4().hex}.{extension}"
    Path(settings.media_dir, filename).write_bytes(contents)
    with SessionLocal() as db:
        item = MediaItem(kind="photo", title=title.strip(), caption=caption.strip(), alt_text=alt_text.strip(), url=f"/media/{filename}", sort_order=0)
        db.add(item)
        db.commit()
        db.refresh(item)
        return media_to_dict(item)


@app.post("/api/admin/media/videos", status_code=201)
def create_admin_video(payload: VideoInput, request: Request, _: str = Depends(require_admin)):
    allowed_admin_origin(request)
    with SessionLocal() as db:
        item = MediaItem(kind="video", title=payload.title.strip(), caption=payload.caption.strip(), alt_text="",
                         url=safe_video_url(payload.url), published=payload.published, sort_order=payload.sort_order)
        db.add(item)
        db.commit()
        db.refresh(item)
        return media_to_dict(item)


@app.patch("/api/admin/media/{media_id}")
def update_admin_media(media_id: int, payload: MediaEdit, request: Request, _: str = Depends(require_admin)):
    allowed_admin_origin(request)
    with SessionLocal() as db:
        item = db.get(MediaItem, media_id)
        if item is None:
            raise HTTPException(status_code=404, detail="Media item not found.")
        item.title = payload.title.strip()
        item.caption = payload.caption.strip()
        item.alt_text = payload.alt_text.strip()
        item.published = payload.published
        item.sort_order = payload.sort_order
        if payload.url:
            if item.kind != "video":
                raise HTTPException(status_code=422, detail="Uploaded photo URLs cannot be changed here.")
            item.url = safe_video_url(payload.url)
        db.commit()
        db.refresh(item)
        return media_to_dict(item)


@app.delete("/api/admin/media/{media_id}")
def delete_admin_media(media_id: int, request: Request, _: str = Depends(require_admin)):
    allowed_admin_origin(request)
    stored_url = None
    with SessionLocal() as db:
        item = db.get(MediaItem, media_id)
        if item is None:
            raise HTTPException(status_code=404, detail="Media item not found.")
        stored_url = item.url
        db.delete(item)
        db.commit()
    if stored_url and stored_url.startswith("/media/"):
        filename = Path(stored_url).name
        (Path(settings.media_dir) / filename).unlink(missing_ok=True)
    return {"status": "deleted"}


@app.get("/api/admin/site-content")
def get_admin_site_content(_: str = Depends(require_admin)):
    with SessionLocal() as db:
        row = db.get(SiteConfiguration, 1)
        if row is None:
            raise HTTPException(status_code=503, detail="Site content is not ready.")
        return config_to_dict(row)


@app.put("/api/admin/site-content")
def update_admin_site_content(payload: SiteConfigurationInput, request: Request, _: str = Depends(require_admin)):
    allowed_admin_origin(request)
    with SessionLocal() as db:
        row = db.get(SiteConfiguration, 1)
        if row is None:
            row = SiteConfiguration(id=1, **payload.model_dump())
            db.add(row)
        else:
            for key, value in payload.model_dump().items():
                setattr(row, key, value.strip())
        db.commit()
        db.refresh(row)
        return config_to_dict(row)
