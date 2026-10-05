from contextlib import asynccontextmanager
from datetime import date, datetime, timezone
from email.message import EmailMessage
from html import escape
import json
from pathlib import Path
import smtplib
import ssl
import time
import logging
import hmac
import re
import uuid
from dataclasses import dataclass
from typing import Literal
from urllib.parse import parse_qs, urlencode, urlparse
from zoneinfo import ZoneInfo

from cryptography.fernet import Fernet, InvalidToken
from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, create_engine, select, text, update
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
    smtp_config_encryption_key: str = ""
    registration_data_encryption_key: str = ""
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
    additional_data_encrypted: Mapped[str | None] = mapped_column(Text)
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


class PolicySection(Base):
    __tablename__ = "policy_sections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    slug: Mapped[str] = mapped_column(String(200), nullable=False, unique=True, index=True)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    published: Mapped[bool] = mapped_column(default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
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


class ContactConfiguration(Base):
    __tablename__ = "contact_configuration"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    business_name: Mapped[str] = mapped_column(String(180), nullable=False)
    physical_street: Mapped[str] = mapped_column(String(200), nullable=False)
    physical_city: Mapped[str] = mapped_column(String(100), nullable=False)
    physical_state: Mapped[str] = mapped_column(String(80), nullable=False)
    physical_postal_code: Mapped[str] = mapped_column(String(20), nullable=False)
    mailing_street: Mapped[str] = mapped_column(String(200), nullable=False)
    mailing_city: Mapped[str] = mapped_column(String(100), nullable=False)
    mailing_state: Mapped[str] = mapped_column(String(80), nullable=False)
    mailing_postal_code: Mapped[str] = mapped_column(String(20), nullable=False)
    educator_1_name: Mapped[str] = mapped_column(String(120), nullable=False)
    educator_1_title: Mapped[str] = mapped_column(String(80), nullable=False, default="")
    educator_1_phone: Mapped[str] = mapped_column(String(40), nullable=False)
    educator_1_email: Mapped[str] = mapped_column(String(254), nullable=False)
    educator_2_name: Mapped[str] = mapped_column(String(120), nullable=False)
    educator_2_title: Mapped[str] = mapped_column(String(80), nullable=False, default="")
    educator_2_phone: Mapped[str] = mapped_column(String(40), nullable=False)
    educator_2_email: Mapped[str] = mapped_column(String(254), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class MailConfiguration(Base):
    __tablename__ = "mail_configuration"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    smtp_host: Mapped[str] = mapped_column(String(255), nullable=False)
    smtp_port: Mapped[int] = mapped_column(Integer, nullable=False, default=587)
    smtp_user: Mapped[str] = mapped_column(String(254), nullable=False)
    smtp_password_encrypted: Mapped[str | None] = mapped_column(Text)
    smtp_from: Mapped[str] = mapped_column(String(254), nullable=False)
    notification_email: Mapped[str] = mapped_column(String(254), nullable=False)
    smtp_starttls: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class AcademicCalendar(Base):
    __tablename__ = "academic_calendars"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    school_year: Mapped[str] = mapped_column(String(40), nullable=False, unique=True)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    is_current: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    calendar_id: Mapped[int] = mapped_column(ForeignKey("academic_calendars.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date)
    description: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


def ensure_registration_data_column() -> None:
    # create_all creates this column on fresh installs, but does not add columns
    # to existing installations. This additive migration preserves old records.
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE registrations ADD COLUMN IF NOT EXISTS additional_data_encrypted TEXT"))


def encrypt_registration_page_two(payload: "RegistrationCreate") -> str:
    key = settings.registration_data_encryption_key
    if not key:
        raise HTTPException(status_code=503, detail="Registration health-data encryption is not configured. Please contact the academy directly.")
    try:
        cipher = Fernet(key.encode())
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=503, detail="Registration health-data encryption is unavailable. Please contact the academy directly.") from exc
    details = {
        "medical_conditions": payload.medical_conditions or "",
        "medications": payload.medications or "",
        "allergies": [item.model_dump() for item in payload.allergies],
        "immunizations_up_to_date": payload.immunizations_up_to_date,
        "immunization_explanation": payload.immunization_explanation or "",
        "other_considerations": payload.other_considerations or "",
        "health_information_consent": True,
        "admission_policy_initials": payload.admission_policy_initials,
        "payment_terms_acknowledged": True,
    }
    return cipher.encrypt(json.dumps(details, ensure_ascii=False, separators=(",", ":")).encode()).decode()


def decrypt_registration_page_two(encrypted: str | None) -> dict:
    empty = {
        "medical_conditions": "", "medications": "", "allergies": [],
        "immunizations_up_to_date": "", "immunization_explanation": "",
        "other_considerations": "", "health_information_consent": False,
        "admission_policy_initials": "", "payment_terms_acknowledged": False,
    }
    if not encrypted:
        return empty
    key = settings.registration_data_encryption_key
    if not key:
        raise HTTPException(status_code=503, detail="Registration data cannot be decrypted. Restore REGISTRATION_DATA_ENCRYPTION_KEY from the server backup.")
    try:
        return json.loads(Fernet(key.encode()).decrypt(encrypted.encode()))
    except (InvalidToken, ValueError, TypeError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=503, detail="Registration data cannot be decrypted. Check REGISTRATION_DATA_ENCRYPTION_KEY.") from exc


@asynccontextmanager
async def lifespan(_: FastAPI):
    Path(settings.media_dir).mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(engine)
    ensure_registration_data_column()
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
        if db.get(ContactConfiguration, 1) is None:
            db.add(ContactConfiguration(
                id=1, business_name="Mother Nature Academy LLC",
                physical_street="148 Hill Lane", physical_city="Carthage", physical_state="NC", physical_postal_code="28327",
                mailing_street="PO Box 2597", mailing_city="Southern Pines", mailing_state="NC", mailing_postal_code="28388",
                educator_1_name="Laura Snyder", educator_1_title="Miss Laura", educator_1_phone="(910) 986-2836",
                educator_1_email="Laura@MotherNatureAcademy.com",
                educator_2_name="Elise Snyder", educator_2_title="Miss CC", educator_2_phone="(910) 975-4541",
                educator_2_email="Elise@MotherNatureAcademy.com",
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
        # The former PicturePage.html gallery held many additional academy
        # photos that weren't represented in the first modern gallery. Seed
        # each by stable URL so this also adds them to databases that already
        # contain the original starter gallery.
        legacy_gallery = [
            ("Bunny", "A visit with one of the academy rabbits.", "A rabbit inside its enclosure.", "bunny-pics.jpg"),
            ("Chicken coop", "A look at the academy chickens and coop.", "Chicken coop and outdoor run at the academy.", "chicken-pic.jpg"),
            ("Nature trail", "A winding trail through the trees.", "A sandy path winding through a wooded area.", "pic1.jpg"),
            ("Nature trail", "Exploring the wooded paths on campus.", "A sandy trail through the woods.", "pic2.jpg"),
            ("Nature trail", "A shaded path invites a slow walk and a closer look.", "A path winding through the trees.", "pic4.jpg"),
            ("Nature trail", "A quiet trail through the woods.", "A sandy woodland trail bordered by trees.", "pic5.jpg"),
            ("Open lawn", "Room to run, play, and explore outside.", "A grassy open area on the academy grounds.", "pic7.jpg"),
            ("Green chair", "A playful place to sit and imagine.", "Large green chair beneath the covered outdoor area.", "greenchair.jpg"),
            ("Garden cart", "Tools and materials for hands-on outdoor work.", "Green garden cart on the academy grounds.", "greenmachine.jpg"),
            ("Indoor classroom", "A peek inside one of the learning spaces.", "Tables and learning materials in a bright classroom.", "20161012-094050.jpg"),
            ("Reading nook", "A cozy place to pause with a book.", "Bookshelves, floor cushions, and books in a reading nook.", "library2.jpg"),
            ("Outdoor pavilion", "A covered place to gather and play outside.", "Covered outdoor pavilion with a mulch play area.", "lavapit.jpg"),
            ("Outdoor classroom", "A covered space for making and learning outdoors.", "Covered outdoor classroom with tables and a garden bed.", "20170601-105402.jpg"),
            ("Learning garden", "A small garden bed ready for planting and discovery.", "Raised garden bed beside the academy building.", "20170601-105619.jpg"),
            ("Outdoor classroom", "A shaded space to gather and learn outside.", "Covered outdoor classroom and paved area.", "20170601-105628.jpg"),
            ("Campus play space", "Outdoor play space beneath the trees.", "Academy outdoor play area beside a yellow building.", "20170601-105644.jpg"),
            ("Garden", "Growing things together in the garden.", "Green plants growing in a sunny garden bed.", "20170601-110048.jpg"),
            ("Classroom materials", "Materials are ready for sorting, creating, and play.", "Shelves and baskets of classroom learning materials.", "20170601-110327.jpg"),
            ("Classroom tables", "A classroom corner set up for creative work.", "Small tables and shelves in the academy classroom.", "20170601-110404.jpg"),
            ("Classroom art area", "A space for art, maps, and small-group activities.", "Child-sized tables, chairs, shelves, and a colorful map.", "20170601-110427.jpg"),
            ("Outdoor toys", "Ride-on toys and play materials are ready outside.", "Child-sized ride-on toys stored beneath a covered play area.", "20170601-110819.jpg"),
            ("Planting bed", "A garden bed ready for planting and care.", "A small raised planting bed along the building.", "20170601-110920.jpg"),
            ("Garden", "A young garden growing on the academy grounds.", "Rows of small plants growing in a garden bed.", "20170601-111036.jpg"),
        ]
        for index, (title, caption, alt_text, filename) in enumerate(legacy_gallery):
            url = f"/images/legacy-gallery/{filename}"
            if db.scalar(select(MediaItem.id).where(MediaItem.url == url)) is None:
                db.add(MediaItem(kind="photo", title=title, caption=caption, alt_text=alt_text, url=url, sort_order=70 + index * 10))
        legacy_videos = [
            ("Introduction to Forest School", "A short introduction to child-led learning outdoors, shared on the legacy preschool program page.", "https://www.youtube.com/embed/ptkID2k091I", 90),
            ("Nature Kindergarten — Frances Krusekopf", "A short film about nature kindergarten and outdoor early learning.", "https://www.youtube.com/embed/MOngsiy67YY", 100),
            ("The Cridge Nature Preschool — Shaw TV Victoria", "A look at the Cridge nature preschool program.", "https://www.youtube.com/embed/VYThQPwwXuc", 110),
        ]
        for title, caption, url, sort_order in legacy_videos:
            if db.scalar(select(MediaItem.id).where(MediaItem.url == url)) is None:
                db.add(MediaItem(kind="video", title=title, caption=caption, alt_text="", url=url, sort_order=sort_order))
        if db.scalar(select(PolicySection.id).limit(1)) is None:
            sections = [
                ("outdoor-learning-and-safety", "Outdoor learning & safety", "Outdoor play and exploration are central to the academy day. Educators supervise activities and help children learn to notice and navigate age-appropriate risks. Campus activities and outdoor time may change with weather or site conditions; the academy communicates closures and schedule changes through its current family channels."),
                ("enrollment", "Enrollment & availability", "Families may submit an application or inquiry through the website. Applications are reviewed by the academy, and submitting a form does not guarantee a place. Age eligibility, schedules, fees, and availability can change by school year; please confirm the current details with the academy before making enrollment plans."),
                ("clothing-and-belongings", "Clothing & belongings", "Please dress children for the day’s weather in comfortable, washable layers suitable for outdoor play. Label clothing and any requested outdoor gear. Ask the academy what spare clothing or weather gear to keep on campus. Please leave toys and valuables at home unless you have arranged a comfort item with the educators."),
                ("snacks-and-allergies", "Snacks & food allergies", "The academy’s handbook describes snacks being provided during the morning. Families should speak directly with the educators about allergies, dietary needs, or other food concerns before a child attends, so the academy can confirm the current plan. Do not include detailed health information in the public inquiry form or email. The registration application has a separate encrypted section for relevant child health details."),
                ("health-and-medications", "Health, illness & medication", "Please keep a child home when they are unwell or unable to participate comfortably. Contact the academy directly for its current illness, return-to-school, emergency, and medication procedures. Use the encrypted health-information section on the registration application for relevant health details. Discuss emergency plans and care procedures directly with the educators before the first day; do not send detailed health records by email."),
                ("toileting-and-personal-care", "Toileting & personal care", "Children’s toileting and personal-care needs vary. Please discuss your child’s needs and the support they may require with the educators before the first day, so the academy can explain its current practices and agree on a plan with your family."),
                ("arrival-and-pickup", "Arrival, departure & authorized pickup", "The academy may assign arrival and pickup times to help the day run smoothly. Please confirm your family’s current assigned times and pickup authorization requirements with the educators, and contact the academy if plans change or you expect to be delayed."),
                ("family-participation", "Family participation & visitors", "Families are welcome to ask about classroom visits, enrichment, volunteering, or mentorship opportunities. All visits and volunteer participation must be arranged with the academy in advance and follow its current supervision, safety, and screening requirements."),
                ("positive-guidance", "Positive guidance", "The academy’s handbook describes a positive-guidance approach that helps children build self-regulation, communication, and problem-solving skills. Educators guide children toward safe, respectful ways to resolve challenges and work with families when a child needs support."),
            ]
            db.add_all([PolicySection(slug=slug, title=title, body=body, sort_order=(index + 1) * 10) for index, (slug, title, body) in enumerate(sections)])
        else:
            health_policy = db.scalar(select(PolicySection).where(PolicySection.slug == "health-and-medications"))
            if health_policy and "through the academy’s enrollment process rather than through the public website forms" in health_policy.body:
                health_policy.body = health_policy.body.replace(
                    "Share health needs and emergency plans directly with the educators through the academy’s enrollment process rather than through the public website forms.",
                    "Use the encrypted health-information section on the registration application for relevant health details. Discuss emergency plans and care procedures directly with the educators before the first day; do not send detailed health records by email.",
                )
            allergy_policy = db.scalar(select(PolicySection).where(PolicySection.slug == "snacks-and-allergies"))
            if allergy_policy and "Please do not include sensitive medical details in the public inquiry or registration forms." in allergy_policy.body:
                allergy_policy.body = allergy_policy.body.replace(
                    "Please do not include sensitive medical details in the public inquiry or registration forms.",
                    "Do not include detailed health information in the public inquiry form or email. The registration application has a separate encrypted section for relevant child health details.",
                )
        # Seed current and historical school calendars transcribed from the
        # academy's legacy calendar documents. Older years remain published
        # for reference; only 2026–2027 is selected as the current calendar.
        calendar_seed = [
            ("2017–2018", False, [
                ("First day of programming", "2017-09-05", None, ""), ("Columbus Day Break (Closed)", "2017-10-09", "2017-10-10", ""), ("Veterans Day Holiday (Closed)", "2017-11-10", None, ""), ("Thanksgiving Break (Closed)", "2017-11-22", "2017-11-24", ""), ("Winter Break (Closed)", "2017-12-22", "2018-01-06", ""), ("Program Resumes", "2018-01-08", None, ""), ("Martin Luther King Day (Closed)", "2018-01-15", None, ""), ("President’s Day (Closed)", "2018-02-19", None, ""), ("Spring Break (Closed)", "2018-03-05", "2018-03-09", ""), ("Easter Holiday (Closed)", "2018-03-30", "2018-04-02", ""), ("Last Day of programming", "2018-05-25", None, ""), ("Summer Break (Closed)", "2018-05-28", "2018-09-03", ""),
            ]),
            ("2018–2019", False, [
                ("First day of programming", "2018-09-04", None, ""), ("Fall Break (Closed)", "2018-10-19", "2018-10-22", ""), ("Veterans Day Holiday (Open)", "2018-11-12", None, ""), ("Thanksgiving Break (Closed)", "2018-11-21", "2018-11-23", ""), ("Winter Break (Closed)", "2018-12-21", "2019-01-04", ""), ("Program Resumes", "2019-01-07", None, ""), ("Martin Luther King Day (Closed)", "2019-01-21", None, ""), ("President’s Day (Closed)", "2019-02-18", None, ""), ("Spring Break (Closed)", "2019-03-04", "2019-03-08", ""), ("Easter Holiday (Closed)", "2019-04-18", "2019-04-19", ""), ("Last Day of programming", "2019-05-24", None, ""), ("Summer Break (Closed)", "2019-05-28", "2019-09-02", ""),
            ]),
            ("2020–2021", False, [
                ("First day of programming", "2020-09-08", None, ""), ("Fall Break (Closed)", "2020-10-12", "2020-10-13", ""), ("Thanksgiving Break (Closed)", "2020-11-25", "2020-11-27", ""), ("Winter Break (Closed)", "2020-12-21", "2021-01-05", ""), ("Program Resumes", "2021-01-06", None, ""), ("Martin Luther King Day (Closed)", "2021-01-18", None, ""), ("President’s Day Holiday (Closed)", "2021-02-15", "2021-02-16", ""), ("Spring Break (Closed)", "2021-04-05", "2021-04-09", ""), ("Last Day of programming", "2021-05-21", None, ""), ("Summer Break (Closed)", "2021-05-24", "2021-09-06", ""),
            ]),
            ("2023–2024", False, [
                ("First day of programming", "2023-09-05", None, ""), ("Fall Break (Closed)", "2023-10-09", "2023-10-10", ""), ("Thanksgiving Break (Closed)", "2023-11-22", "2023-11-24", ""), ("Winter Break (Closed)", "2023-12-18", "2024-01-02", ""), ("Program Resumes", "2024-01-10", None, ""), ("Martin Luther King Day (Closed)", "2024-01-15", None, ""), ("President’s Day Holiday (Closed)", "2024-02-19", "2024-02-20", ""), ("Spring Break (Closed)", "2024-03-11", "2024-03-15", ""), ("Easter Holiday", "2024-04-01", "2024-04-02", ""), ("Last Day of programming", "2024-05-17", None, ""), ("Summer Break (Closed)", "2024-05-20", "2024-09-03", ""),
            ]),
            ("2024–2025", False, [
                ("First day of programming", "2024-09-03", None, ""), ("Fall Break (Closed)", "2024-10-14", "2024-10-15", ""), ("Thanksgiving Break (Closed)", "2024-11-27", "2024-11-29", ""), ("Winter Break (Closed)", "2024-12-23", "2025-01-07", ""), ("Program Resumes", "2025-01-08", None, ""), ("Martin Luther King Day (Closed)", "2025-01-20", None, ""), ("President’s Day Holiday (Closed)", "2025-02-17", "2025-02-18", ""), ("Spring Break (Closed)", "2025-03-24", "2025-03-28", ""), ("Program Resumes", "2025-03-31", None, ""), ("Holiday Break (Closed)", "2025-04-18", "2025-04-21", ""), ("Last Day of programming", "2025-05-16", None, ""), ("Summer Break (Closed)", "2025-05-19", "2025-09-02", ""),
            ]),
            ("2026–2027", True, [
                ("Orientation", "2026-08-31", None, ""), ("First day of programming", "2026-09-08", None, ""), ("Fall Break (Closed)", "2026-10-12", "2026-10-13", ""), ("Thanksgiving Break (Closed)", "2026-11-25", "2026-11-27", ""), ("Winter Break (Closed)", "2026-12-21", "2027-01-05", ""), ("Program Resumes", "2027-01-06", None, ""), ("Martin Luther King Day (Closed)", "2027-01-18", None, ""), ("President’s Day Holiday (Closed)", "2027-02-15", "2027-02-16", ""), ("Spring Break (Closed)", "2027-03-08", "2027-03-12", ""), ("Program Resumes", "2027-03-15", None, ""), ("Holiday Break (Closed)", "2027-03-26", "2027-03-29", ""), ("Last Day of programming", "2027-05-21", None, ""), ("Summer Break (Closed)", "2027-05-24", "2027-09-07", ""),
            ]),
        ]
        for school_year, is_current, events in calendar_seed:
            calendar = db.scalar(select(AcademicCalendar).where(AcademicCalendar.school_year == school_year))
            if calendar is None:
                calendar = AcademicCalendar(school_year=school_year, title=f"{school_year} Academic Calendar", is_current=is_current, published=True)
                db.add(calendar)
                db.flush()
                db.add_all([CalendarEvent(calendar_id=calendar.id, title=title, start_date=date.fromisoformat(start), end_date=date.fromisoformat(end) if end else None, description=description, sort_order=(index + 1) * 10) for index, (title, start, end, description) in enumerate(events)])
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


class AllergyEntry(BaseModel):
    allergen: str = Field(min_length=1, max_length=200)
    reaction: str = Field(min_length=1, max_length=300)

    @field_validator("allergen", "reaction", mode="before")
    @classmethod
    def strip_allergy_fields(cls, value):
        return value.strip() if isinstance(value, str) else value


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
    medical_conditions: str | None = Field(default=None, max_length=5000)
    medications: str | None = Field(default=None, max_length=5000)
    allergies: list[AllergyEntry] = Field(default_factory=list, max_length=5)
    immunizations_up_to_date: Literal["yes", "no"]
    immunization_explanation: str | None = Field(default=None, max_length=2000)
    other_considerations: str | None = Field(default=None, max_length=5000)
    health_information_consent: Literal["yes"]
    admission_policy_initials: str = Field(min_length=1, max_length=20)
    payment_terms_acknowledged: Literal["yes"]
    website: str | None = Field(default=None, max_length=300)

    @field_validator("child_name", "guardian_name", "guardian_relationship", "address", "city", "postal_code", "signature", mode="before")
    @classmethod
    def strip_required_strings(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("child_nickname", "home_phone", "work_phone", "second_guardian_name", "second_guardian_relationship", "second_guardian_phone", "medical_conditions", "medications", "immunization_explanation", "other_considerations", mode="before")
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

    @field_validator("admission_policy_initials", mode="before")
    @classmethod
    def strip_policy_initials(cls, value):
        return value.strip() if isinstance(value, str) else value

    @model_validator(mode="after")
    def require_immunization_explanation(self):
        if self.immunizations_up_to_date == "no" and not self.immunization_explanation:
            raise ValueError("Please explain why the child's immunizations are not up to date.")
        return self


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


class ContactConfigurationInput(BaseModel):
    business_name: str = Field(min_length=1, max_length=180)
    physical_street: str = Field(min_length=1, max_length=200)
    physical_city: str = Field(min_length=1, max_length=100)
    physical_state: str = Field(min_length=1, max_length=80)
    physical_postal_code: str = Field(min_length=1, max_length=20)
    mailing_street: str = Field(min_length=1, max_length=200)
    mailing_city: str = Field(min_length=1, max_length=100)
    mailing_state: str = Field(min_length=1, max_length=80)
    mailing_postal_code: str = Field(min_length=1, max_length=20)
    educator_1_name: str = Field(min_length=1, max_length=120)
    educator_1_title: str = Field(default="", max_length=80)
    educator_1_phone: str = Field(min_length=1, max_length=40)
    educator_1_email: EmailStr
    educator_2_name: str = Field(min_length=1, max_length=120)
    educator_2_title: str = Field(default="", max_length=80)
    educator_2_phone: str = Field(min_length=1, max_length=40)
    educator_2_email: EmailStr

    @field_validator("business_name", "physical_street", "physical_city", "physical_state", "physical_postal_code", "mailing_street", "mailing_city", "mailing_state", "mailing_postal_code", "educator_1_name", "educator_1_title", "educator_1_phone", "educator_2_name", "educator_2_title", "educator_2_phone", mode="before")
    @classmethod
    def trim_contact_fields(cls, value):
        return value.strip() if isinstance(value, str) else value


class SmtpConfigurationInput(BaseModel):
    enabled: bool = True
    smtp_host: str = Field(min_length=1, max_length=255)
    smtp_port: int = Field(ge=1, le=65535)
    smtp_user: str = Field(min_length=1, max_length=254)
    smtp_password: str = Field(default="", max_length=1024)
    smtp_from: EmailStr
    notification_email: EmailStr
    smtp_starttls: bool = True

    @field_validator("smtp_host", "smtp_user", mode="before")
    @classmethod
    def strip_smtp_strings(cls, value):
        return value.strip() if isinstance(value, str) else value


class PolicyInput(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    body: str = Field(min_length=1, max_length=20000)
    published: bool = True
    sort_order: int = Field(default=0, ge=0, le=10000)


class AcademicCalendarInput(BaseModel):
    school_year: str = Field(min_length=4, max_length=40)
    title: str = Field(min_length=1, max_length=180)
    notes: str = Field(default="", max_length=5000)
    is_current: bool = False
    published: bool = False


class AcademicCalendarCreate(AcademicCalendarInput):
    copy_from_id: int | None = None


class CalendarEventInput(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    start_date: date
    end_date: date | None = None
    description: str = Field(default="", max_length=500)
    sort_order: int = Field(default=0, ge=0, le=10000)

    @field_validator("end_date")
    @classmethod
    def end_not_before_start(cls, value, info):
        start = info.data.get("start_date")
        if value and start and value < start:
            raise ValueError("End date must be on or after the start date.")
        return value


def shift_calendar_date(value: date | None, years: int) -> date | None:
    if value is None or years == 0:
        return value
    try:
        return value.replace(year=value.year + years)
    except ValueError:  # A Feb. 29 event copied to a non-leap year.
        return value.replace(year=value.year + years, day=28)


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


def contact_to_dict(row: ContactConfiguration) -> dict:
    return {key: getattr(row, key) for key in (
        "business_name", "physical_street", "physical_city", "physical_state", "physical_postal_code",
        "mailing_street", "mailing_city", "mailing_state", "mailing_postal_code",
        "educator_1_name", "educator_1_title", "educator_1_phone", "educator_1_email",
        "educator_2_name", "educator_2_title", "educator_2_phone", "educator_2_email",
    )} | {"updated_at": row.updated_at}


def policy_to_dict(section: PolicySection) -> dict:
    return {"id": section.id, "slug": section.slug, "title": section.title, "body": section.body,
            "published": section.published, "sort_order": section.sort_order, "updated_at": section.updated_at}


def calendar_event_to_dict(event: CalendarEvent) -> dict:
    return {"id": event.id, "calendar_id": event.calendar_id, "title": event.title,
            "start_date": event.start_date.isoformat(), "end_date": event.end_date.isoformat() if event.end_date else None,
            "description": event.description, "sort_order": event.sort_order}


def calendar_to_dict(calendar: AcademicCalendar, db, include_draft: bool = False) -> dict:
    events = db.scalars(select(CalendarEvent).where(CalendarEvent.calendar_id == calendar.id).order_by(CalendarEvent.start_date, CalendarEvent.sort_order, CalendarEvent.id)).all()
    return {"id": calendar.id, "school_year": calendar.school_year, "title": calendar.title,
            "notes": calendar.notes, "is_current": calendar.is_current, "published": calendar.published,
            "events": [calendar_event_to_dict(event) for event in events]}


@dataclass(frozen=True)
class MailTransport:
    enabled: bool
    host: str
    port: int
    username: str
    password: str
    sender: str
    recipient: str
    starttls: bool


def smtp_cipher() -> Fernet:
    if not settings.smtp_config_encryption_key:
        raise HTTPException(status_code=503, detail="Set SMTP_CONFIG_ENCRYPTION_KEY in backend/.env before saving a new SMTP password.")
    try:
        return Fernet(settings.smtp_config_encryption_key.encode("ascii"))
    except (ValueError, UnicodeEncodeError) as exc:
        raise HTTPException(status_code=503, detail="SMTP_CONFIG_ENCRYPTION_KEY must be a valid Fernet key.") from exc


def get_mail_transport() -> MailTransport:
    with SessionLocal() as db:
        row = db.get(MailConfiguration, 1)
        if row is None:
            return MailTransport(
                enabled=all([settings.smtp_host, settings.smtp_from, settings.smtp_user, settings.smtp_password]),
                host=settings.smtp_host, port=settings.smtp_port, username=settings.smtp_user,
                password=settings.smtp_password, sender=settings.smtp_from,
                recipient=str(settings.notification_email), starttls=settings.smtp_starttls,
            )
        password = settings.smtp_password
        if row.smtp_password_encrypted:
            try:
                password = smtp_cipher().decrypt(row.smtp_password_encrypted.encode("ascii")).decode("utf-8")
            except InvalidToken as exc:
                raise RuntimeError("Stored SMTP password cannot be decrypted. Check SMTP_CONFIG_ENCRYPTION_KEY.") from exc
        return MailTransport(row.enabled, row.smtp_host, row.smtp_port, row.smtp_user, password,
                             row.smtp_from, row.notification_email, row.smtp_starttls)


def notify_academy(inquiry: Inquiry) -> bool:
    mail = get_mail_transport()
    if not mail.enabled or not all([mail.host, mail.sender, mail.username, mail.password]):
        return False
    msg = EmailMessage()
    msg["Subject"] = f"New website inquiry from {inquiry.parent_name}"
    msg["From"] = mail.sender
    msg["To"] = mail.recipient
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
    if mail.port == 465:
        smtp_connection = smtplib.SMTP_SSL(
            mail.host,
            mail.port,
            timeout=12,
            context=context,
        )
    else:
        smtp_connection = smtplib.SMTP(mail.host, mail.port, timeout=12)

    with smtp_connection as smtp:
        smtp.ehlo()
        if mail.starttls and mail.port != 465:
            smtp.starttls(context=context)
            smtp.ehlo()
        smtp.login(mail.username, mail.password)
        smtp.send_message(msg)
    return True


def notify_registration(registration: Registration) -> bool:
    mail = get_mail_transport()
    if not mail.enabled or not all([mail.host, mail.sender, mail.username, mail.password]):
        return False
    schedules = {
        "2_days": "Tuesday and Thursday — $325/month",
        "3_days": "Monday, Wednesday, and Friday — $425/month",
        "5_days": "Monday through Friday — $575/month",
    }
    submitted_at_utc = registration.created_at
    if submitted_at_utc.tzinfo is None:
        submitted_at_utc = submitted_at_utc.replace(tzinfo=timezone.utc)
    submitted_at = submitted_at_utc.astimezone(ZoneInfo("America/New_York")).strftime("%Y-%m-%d %I:%M %p %Z")
    child_rows = [
        ("Child", registration.child_name),
        ("Nickname", registration.child_nickname or "Not provided"),
        ("Age", registration.child_age),
        ("Date of birth", registration.child_date_of_birth.isoformat()),
        ("Lives with", registration.lives_with),
        ("Schedule", schedules[registration.schedule]),
    ]
    guardian_rows = [
        ("Name", registration.guardian_name),
        ("Relationship", registration.guardian_relationship),
        ("Address", f"{registration.address}, {registration.city}, {registration.state} {registration.postal_code}"),
        ("Cell phone", registration.cell_phone),
        ("Home phone", registration.home_phone or "Not provided"),
        ("Work phone", registration.work_phone or "Not provided"),
        ("Email", registration.guardian_email),
    ]
    second_guardian_rows = [
        ("Name", registration.second_guardian_name or "Not provided"),
        ("Relationship", registration.second_guardian_relationship or "Not provided"),
        ("Phone", registration.second_guardian_phone or "Not provided"),
        ("Email", registration.second_guardian_email or "Not provided"),
    ]

    def plain_section(title: str, rows: list[tuple[str, str]]) -> str:
        return title + "\n" + "\n".join(f"{label}: {value}" for label, value in rows)

    def html_section(title: str, rows: list[tuple[str, str]]) -> str:
        cells = "".join(
            "<tr>"
            f'<td style="padding:9px 12px;border-bottom:1px solid #e7ebe5;color:#69766c;width:36%;vertical-align:top">{escape(label)}</td>'
            f'<td style="padding:9px 12px;border-bottom:1px solid #e7ebe5;color:#27372d;vertical-align:top;word-break:break-word">{escape(str(value))}</td>'
            "</tr>"
            for label, value in rows
        )
        return (
            '<h2 style="margin:25px 0 8px;font:600 17px Arial,sans-serif;color:#315743">'
            f"{escape(title)}</h2>"
            '<table role="presentation" style="width:100%;border-collapse:collapse;background:#fff">'
            f"{cells}</table>"
        )

    msg = EmailMessage()
    msg["Subject"] = f"New registration application — {registration.child_name}"
    msg["From"] = mail.sender
    msg["To"] = mail.recipient
    msg["Reply-To"] = registration.guardian_email
    msg.set_content(
        "NEW REGISTRATION APPLICATION\n"
        f"Mother Nature Academy · School year {registration.school_year}\n"
        f"Submitted {submitted_at} (Eastern Time)\n\n"
        + plain_section("CHILD & SCHEDULE", child_rows)
        + "\n\n" + plain_section("RESPONSIBLE PARTY", guardian_rows)
        + "\n\n" + plain_section("SECOND RESPONSIBLE PARTY", second_guardian_rows)
        + f"\n\nSIGNATURE & ACKNOWLEDGMENT\nTyped signature: {registration.signature}\n"
        "The family confirmed the application details and acknowledged that submission does not guarantee enrollment.\n\n"
        "Privacy note: Child health details are encrypted in the application record and are not included in this email notification. Payment account details are not collected by this form."
    )
    msg.add_alternative(
        '<!doctype html><html><body style="margin:0;padding:24px;background:#f3f5f1;font-family:Arial,Helvetica,sans-serif;color:#27372d">'
        '<table role="presentation" style="width:100%;max-width:720px;margin:0 auto;border-collapse:collapse;background:#fff">'
        '<tr><td style="padding:26px 28px;background:#315743;color:#fff">'
        '<div style="font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#dce8dc">Mother Nature Academy</div>'
        '<h1 style="margin:8px 0 5px;font-size:24px;line-height:1.25">New registration application</h1>'
        f'<div style="font-size:14px;color:#edf3ec">School year {escape(registration.school_year)}</div>'
        f'<div style="margin-top:7px;font-size:12px;color:#dce8dc">Submitted {escape(submitted_at)} (Eastern Time)</div>'
        '</td></tr><tr><td style="padding:10px 28px 28px">'
        + html_section("Child & schedule", child_rows)
        + html_section("Responsible party", guardian_rows)
        + html_section("Second responsible party", second_guardian_rows)
        + '<h2 style="margin:25px 0 8px;font:600 17px Arial,sans-serif;color:#315743">Signature & acknowledgment</h2>'
        + '<p style="margin:0;padding:12px;background:#f3f5f1;font-size:13px;line-height:1.6">'
        + f'<strong>Typed signature:</strong> {escape(registration.signature)}<br>'
        + 'The family confirmed the application details and acknowledged that submission does not guarantee enrollment.</p>'
        + '<p style="margin:18px 0 0;color:#758075;font-size:11px;line-height:1.6">'
        + 'Privacy note: Child health details are encrypted in the application record and are not included in this email notification. Payment account details are not collected by this form.</p>'
        + '</td></tr></table></body></html>',
        subtype="html",
    )
    context = ssl.create_default_context()
    if mail.port == 465:
        smtp_connection = smtplib.SMTP_SSL(mail.host, mail.port, timeout=12, context=context)
    else:
        smtp_connection = smtplib.SMTP(mail.host, mail.port, timeout=12)
    with smtp_connection as smtp:
        smtp.ehlo()
        if mail.starttls and mail.port != 465:
            smtp.starttls(context=context)
            smtp.ehlo()
        smtp.login(mail.username, mail.password)
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
        except Exception:
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
        row = Registration(**payload.model_dump(exclude={
            "accuracy_confirmed", "application_acknowledged", "website", "medical_conditions", "medications",
            "allergies", "immunizations_up_to_date", "immunization_explanation", "other_considerations",
            "health_information_consent", "admission_policy_initials", "payment_terms_acknowledged",
        }))
        row.additional_data_encrypted = encrypt_registration_page_two(payload)
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
        except Exception:
            logger.exception("Registration email notification failed for registration %s", row.id)
        return {"status": "received", "id": row.id, "notification_sent": notification_sent}


@app.get("/api/admin/registrations")
def list_admin_registrations(_: str = Depends(require_admin)):
    with SessionLocal() as db:
        rows = db.scalars(select(Registration).order_by(Registration.created_at.desc(), Registration.id.desc()).limit(200)).all()
        return [
            {
                "id": row.id,
                "school_year": row.school_year,
                "child_name": row.child_name,
                "guardian_name": row.guardian_name,
                "created_at": row.created_at.isoformat(),
                "notification_sent": row.notification_sent_at is not None,
            }
            for row in rows
        ]


@app.get("/api/admin/registrations/{registration_id}")
def get_admin_registration(registration_id: int, _: str = Depends(require_admin)):
    with SessionLocal() as db:
        row = db.get(Registration, registration_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Registration application not found.")
        return {
            "id": row.id,
            "school_year": row.school_year,
            "child_name": row.child_name,
            "child_nickname": row.child_nickname,
            "child_age": row.child_age,
            "child_date_of_birth": row.child_date_of_birth.isoformat(),
            "lives_with": row.lives_with,
            "schedule": row.schedule,
            "guardian_name": row.guardian_name,
            "guardian_relationship": row.guardian_relationship,
            "address": row.address,
            "city": row.city,
            "state": row.state,
            "postal_code": row.postal_code,
            "home_phone": row.home_phone,
            "cell_phone": row.cell_phone,
            "work_phone": row.work_phone,
            "guardian_email": row.guardian_email,
            "second_guardian_name": row.second_guardian_name,
            "second_guardian_relationship": row.second_guardian_relationship,
            "second_guardian_phone": row.second_guardian_phone,
            "second_guardian_email": row.second_guardian_email,
            "signature": row.signature,
            "page_two": decrypt_registration_page_two(row.additional_data_encrypted),
            "created_at": row.created_at.isoformat(),
            "notification_sent_at": row.notification_sent_at.isoformat() if row.notification_sent_at else None,
        }


@app.delete("/api/admin/registrations/{registration_id}")
def delete_admin_registration(registration_id: int, request: Request, _: str = Depends(require_admin)):
    allowed_admin_origin(request)
    with SessionLocal() as db:
        row = db.get(Registration, registration_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Registration application not found.")
        db.delete(row)
        db.commit()
    return {"status": "deleted"}


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


@app.get("/api/policies")
def list_public_policies():
    with SessionLocal() as db:
        sections = db.scalars(
            select(PolicySection).where(PolicySection.published.is_(True)).order_by(PolicySection.sort_order, PolicySection.id)
        ).all()
        return [policy_to_dict(section) for section in sections]


@app.get("/api/calendars")
def list_public_calendars():
    with SessionLocal() as db:
        calendars = db.scalars(select(AcademicCalendar).where(AcademicCalendar.published.is_(True)).order_by(AcademicCalendar.is_current.desc(), AcademicCalendar.school_year.desc())).all()
        return [calendar_to_dict(calendar, db) for calendar in calendars]


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


@app.get("/api/contact-info")
def get_public_contact_info():
    with SessionLocal() as db:
        row = db.get(ContactConfiguration, 1)
        if row is None:
            raise HTTPException(status_code=503, detail="Contact information is not ready.")
        return contact_to_dict(row)


@app.get("/api/admin/news")
def list_admin_news(_: str = Depends(require_admin)):
    with SessionLocal() as db:
        posts = db.scalars(select(NewsPost).order_by(NewsPost.updated_at.desc())).all()
        return [news_to_dict(post) for post in posts]


@app.get("/api/admin/policies")
def list_admin_policies(_: str = Depends(require_admin)):
    with SessionLocal() as db:
        sections = db.scalars(select(PolicySection).order_by(PolicySection.sort_order, PolicySection.id)).all()
        return [policy_to_dict(section) for section in sections]


@app.get("/api/admin/calendars")
def list_admin_calendars(_: str = Depends(require_admin)):
    with SessionLocal() as db:
        calendars = db.scalars(select(AcademicCalendar).order_by(AcademicCalendar.is_current.desc(), AcademicCalendar.school_year.desc())).all()
        return [calendar_to_dict(calendar, db) for calendar in calendars]


@app.post("/api/admin/calendars", status_code=201)
def create_academic_calendar(payload: AcademicCalendarCreate, request: Request, _: str = Depends(require_admin)):
    allowed_admin_origin(request)
    with SessionLocal() as db:
        if db.scalar(select(AcademicCalendar.id).where(AcademicCalendar.school_year == payload.school_year.strip())):
            raise HTTPException(status_code=409, detail="That school year already has a calendar.")
        source = db.get(AcademicCalendar, payload.copy_from_id) if payload.copy_from_id is not None else None
        if payload.copy_from_id is not None and source is None:
            raise HTTPException(status_code=404, detail="The calendar selected for copying was not found.")
        if payload.is_current:
            db.execute(update(AcademicCalendar).values(is_current=False))
        values = payload.model_dump(exclude={"copy_from_id"})
        calendar = AcademicCalendar(**{**values, "school_year": payload.school_year.strip(), "title": payload.title.strip(), "notes": payload.notes.strip()})
        db.add(calendar)
        db.flush()
        if source is not None:
            source_year = re.match(r"^\s*(\d{4})", source.school_year)
            target_year = re.match(r"^\s*(\d{4})", calendar.school_year)
            year_delta = int(target_year.group(1)) - int(source_year.group(1)) if source_year and target_year else 0
            source_events = db.scalars(select(CalendarEvent).where(CalendarEvent.calendar_id == source.id).order_by(CalendarEvent.start_date, CalendarEvent.sort_order, CalendarEvent.id)).all()
            db.add_all([CalendarEvent(
                calendar_id=calendar.id,
                title=event.title,
                start_date=shift_calendar_date(event.start_date, year_delta),
                end_date=shift_calendar_date(event.end_date, year_delta),
                description=event.description,
                sort_order=event.sort_order,
            ) for event in source_events])
        db.commit()
        db.refresh(calendar)
        return calendar_to_dict(calendar, db)


@app.put("/api/admin/calendars/{calendar_id}")
def update_academic_calendar(calendar_id: int, payload: AcademicCalendarInput, request: Request, _: str = Depends(require_admin)):
    allowed_admin_origin(request)
    with SessionLocal() as db:
        calendar = db.get(AcademicCalendar, calendar_id)
        if calendar is None:
            raise HTTPException(status_code=404, detail="Calendar not found.")
        duplicate = db.scalar(select(AcademicCalendar.id).where(AcademicCalendar.school_year == payload.school_year.strip(), AcademicCalendar.id != calendar_id))
        if duplicate:
            raise HTTPException(status_code=409, detail="That school year already has a calendar.")
        if payload.is_current:
            db.execute(update(AcademicCalendar).where(AcademicCalendar.id != calendar_id).values(is_current=False))
        for key, value in payload.model_dump().items():
            setattr(calendar, key, value.strip() if isinstance(value, str) else value)
        db.commit()
        db.refresh(calendar)
        return calendar_to_dict(calendar, db)


@app.delete("/api/admin/calendars/{calendar_id}")
def delete_academic_calendar(calendar_id: int, request: Request, _: str = Depends(require_admin)):
    allowed_admin_origin(request)
    with SessionLocal() as db:
        calendar = db.get(AcademicCalendar, calendar_id)
        if calendar is None:
            raise HTTPException(status_code=404, detail="Calendar not found.")
        db.query(CalendarEvent).filter(CalendarEvent.calendar_id == calendar_id).delete(synchronize_session=False)
        db.delete(calendar)
        db.commit()
    return {"status": "deleted"}


@app.post("/api/admin/calendars/{calendar_id}/events", status_code=201)
def create_calendar_event(calendar_id: int, payload: CalendarEventInput, request: Request, _: str = Depends(require_admin)):
    allowed_admin_origin(request)
    with SessionLocal() as db:
        if db.get(AcademicCalendar, calendar_id) is None:
            raise HTTPException(status_code=404, detail="Calendar not found.")
        event = CalendarEvent(calendar_id=calendar_id, **payload.model_dump())
        db.add(event)
        db.commit()
        db.refresh(event)
        return calendar_event_to_dict(event)


@app.put("/api/admin/calendar-events/{event_id}")
def update_calendar_event(event_id: int, payload: CalendarEventInput, request: Request, _: str = Depends(require_admin)):
    allowed_admin_origin(request)
    with SessionLocal() as db:
        event = db.get(CalendarEvent, event_id)
        if event is None:
            raise HTTPException(status_code=404, detail="Calendar event not found.")
        for key, value in payload.model_dump().items():
            setattr(event, key, value)
        db.commit()
        db.refresh(event)
        return calendar_event_to_dict(event)


@app.delete("/api/admin/calendar-events/{event_id}")
def delete_calendar_event(event_id: int, request: Request, _: str = Depends(require_admin)):
    allowed_admin_origin(request)
    with SessionLocal() as db:
        event = db.get(CalendarEvent, event_id)
        if event is None:
            raise HTTPException(status_code=404, detail="Calendar event not found.")
        db.delete(event)
        db.commit()
    return {"status": "deleted"}


@app.post("/api/admin/policies", status_code=201)
def create_policy(payload: PolicyInput, request: Request, _: str = Depends(require_admin)):
    allowed_admin_origin(request)
    with SessionLocal() as db:
        section = PolicySection(slug="pending", title=payload.title.strip(), body=payload.body.strip(),
                                published=payload.published, sort_order=payload.sort_order)
        db.add(section)
        db.flush()
        section.slug = make_slug(section.title, section.id)
        db.commit()
        db.refresh(section)
        return policy_to_dict(section)


@app.put("/api/admin/policies/{section_id}")
def update_policy(section_id: int, payload: PolicyInput, request: Request, _: str = Depends(require_admin)):
    allowed_admin_origin(request)
    with SessionLocal() as db:
        section = db.get(PolicySection, section_id)
        if section is None:
            raise HTTPException(status_code=404, detail="Policy section not found.")
        section.title = payload.title.strip()
        section.slug = make_slug(section.title, section.id)
        section.body = payload.body.strip()
        section.published = payload.published
        section.sort_order = payload.sort_order
        db.commit()
        db.refresh(section)
        return policy_to_dict(section)


@app.delete("/api/admin/policies/{section_id}")
def delete_policy(section_id: int, request: Request, _: str = Depends(require_admin)):
    allowed_admin_origin(request)
    with SessionLocal() as db:
        section = db.get(PolicySection, section_id)
        if section is None:
            raise HTTPException(status_code=404, detail="Policy section not found.")
        db.delete(section)
        db.commit()
    return {"status": "deleted"}


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


@app.get("/api/admin/contact-info")
def get_admin_contact_info(_: str = Depends(require_admin)):
    with SessionLocal() as db:
        row = db.get(ContactConfiguration, 1)
        if row is None:
            raise HTTPException(status_code=503, detail="Contact information is not ready.")
        return contact_to_dict(row)


@app.put("/api/admin/contact-info")
def update_admin_contact_info(payload: ContactConfigurationInput, request: Request, _: str = Depends(require_admin)):
    allowed_admin_origin(request)
    values = payload.model_dump()
    values["educator_1_email"] = str(payload.educator_1_email)
    values["educator_2_email"] = str(payload.educator_2_email)
    with SessionLocal() as db:
        row = db.get(ContactConfiguration, 1)
        if row is None:
            row = ContactConfiguration(id=1, **values)
            db.add(row)
        else:
            for key, value in values.items():
                setattr(row, key, value)
        db.commit()
        db.refresh(row)
        return contact_to_dict(row)


def smtp_admin_dict(row: MailConfiguration | None) -> dict:
    if row is None:
        enabled = all([settings.smtp_host, settings.smtp_from, settings.smtp_user, settings.smtp_password])
        host, port, user = settings.smtp_host, settings.smtp_port, settings.smtp_user
        sender, recipient, starttls = settings.smtp_from, str(settings.notification_email), settings.smtp_starttls
        password_set = bool(settings.smtp_password)
    else:
        enabled, host, port, user = row.enabled, row.smtp_host, row.smtp_port, row.smtp_user
        sender, recipient, starttls = row.smtp_from, row.notification_email, row.smtp_starttls
        password_set = bool(row.smtp_password_encrypted or settings.smtp_password)
    key_ready = False
    if settings.smtp_config_encryption_key:
        try:
            Fernet(settings.smtp_config_encryption_key.encode("ascii"))
            key_ready = True
        except (ValueError, UnicodeEncodeError):
            pass
    return {
        "enabled": enabled, "smtp_host": host, "smtp_port": port, "smtp_user": user,
        "smtp_from": sender, "notification_email": recipient, "smtp_starttls": starttls,
        "smtp_password_set": password_set, "encryption_key_configured": key_ready,
    }


@app.get("/api/admin/smtp-settings")
def get_admin_smtp_settings(_: str = Depends(require_admin)):
    with SessionLocal() as db:
        return smtp_admin_dict(db.get(MailConfiguration, 1))


@app.put("/api/admin/smtp-settings")
def update_admin_smtp_settings(payload: SmtpConfigurationInput, request: Request, _: str = Depends(require_admin)):
    allowed_admin_origin(request)
    with SessionLocal() as db:
        row = db.get(MailConfiguration, 1)
        if row is None:
            row = MailConfiguration(
                id=1, enabled=payload.enabled, smtp_host=payload.smtp_host, smtp_port=payload.smtp_port,
                smtp_user=payload.smtp_user, smtp_from=str(payload.smtp_from),
                notification_email=str(payload.notification_email), smtp_starttls=payload.smtp_starttls,
            )
            db.add(row)
        else:
            row.enabled = payload.enabled
            row.smtp_host = payload.smtp_host
            row.smtp_port = payload.smtp_port
            row.smtp_user = payload.smtp_user
            row.smtp_from = str(payload.smtp_from)
            row.notification_email = str(payload.notification_email)
            row.smtp_starttls = payload.smtp_starttls
        if payload.smtp_password:
            encrypted = smtp_cipher().encrypt(payload.smtp_password.encode("utf-8")).decode("ascii")
            row.smtp_password_encrypted = encrypted
        db.commit()
        db.refresh(row)
        return smtp_admin_dict(row)
