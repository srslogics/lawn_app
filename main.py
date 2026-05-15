from __future__ import annotations

import os
from contextlib import asynccontextmanager
from datetime import date, datetime
from pathlib import Path
from typing import Generator, Literal

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sqlalchemy import Float, Integer, String, create_engine, inspect, select, text
from sqlalchemy.engine import URL
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker


ROOT_DIR = Path(__file__).resolve().parent
DATA_DIR = ROOT_DIR / "data"
SQLITE_DATABASE_URL = f"sqlite:///{DATA_DIR / 'app.db'}"


def load_env_file(path: Path) -> None:
    if not path.exists():
        return

    for line in path.read_text().splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


def build_database_url() -> str:
    load_env_file(ROOT_DIR / ".env")

    direct_url = os.getenv("DATABASE_URL")
    if direct_url:
        return direct_url

    host = os.getenv("DB_HOST")
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    name = os.getenv("DB_NAME", "postgres")
    port = int(os.getenv("DB_PORT", "5432"))
    sslmode = os.getenv("DB_SSLMODE", "require")

    if host and user and password:
        return str(
            URL.create(
                "postgresql+psycopg2",
                username=user,
                password=password,
                host=host,
                port=port,
                database=name,
                query={"sslmode": sslmode},
            )
        )

    return SQLITE_DATABASE_URL


CONFIGURED_DATABASE_URL = build_database_url()
DATABASE_URL = CONFIGURED_DATABASE_URL
IS_SQLITE = DATABASE_URL.startswith("sqlite")
ACTIVE_DATABASE = "sqlite" if IS_SQLITE else "postgresql"
DATABASE_STATUS = "pending"
DATABASE_ERROR: str | None = None
ROOM_INVENTORY = {
    "Deluxe Room": 16,
    "Premium Room": 12,
    "Family Suite": 8,
    "Executive Suite": 4,
}


class Base(DeclarativeBase):
    pass


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    client_name: Mapped[str] = mapped_column(String, nullable=False)
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    event_date: Mapped[str] = mapped_column(String, nullable=False)
    guest_count: Mapped[int] = mapped_column(Integer, nullable=False)
    package_name: Mapped[str] = mapped_column(String, nullable=False)
    advance_paid: Mapped[float] = mapped_column(Float, nullable=False)
    notes: Mapped[str] = mapped_column(String, default="")
    status: Mapped[str] = mapped_column(String, nullable=False)
    manager: Mapped[str] = mapped_column(String, nullable=False)
    lawn_area: Mapped[str] = mapped_column(String, nullable=False)


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    stage: Mapped[str] = mapped_column(String, nullable=False)
    preferences: Mapped[str] = mapped_column(String, default="")


class Vendor(Base):
    __tablename__ = "vendors"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    contact_person: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    notes: Mapped[str] = mapped_column(String, default="")


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    client_name: Mapped[str] = mapped_column(String, nullable=False)
    payment_type: Mapped[str] = mapped_column(String, nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    notes: Mapped[str] = mapped_column(String, default="")


class HotelBooking(Base):
    __tablename__ = "hotel_bookings"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    guest_name: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[str] = mapped_column(String, nullable=False)
    room_type: Mapped[str] = mapped_column(String, nullable=False)
    check_in: Mapped[str] = mapped_column(String, nullable=False)
    check_out: Mapped[str] = mapped_column(String, nullable=False)
    rooms_count: Mapped[int] = mapped_column(Integer, nullable=False)
    guests_count: Mapped[int] = mapped_column(Integer, nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    booking_source: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    payment_status: Mapped[str] = mapped_column(String, default="Pending")
    notes: Mapped[str] = mapped_column(String, default="")


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    owner: Mapped[str] = mapped_column(String, nullable=False)
    due: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)


class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    message: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[str] = mapped_column(String, nullable=False)


class Enquiry(Base):
    __tablename__ = "enquiries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    event_date: Mapped[str] = mapped_column(String, nullable=False)
    guest_count: Mapped[int] = mapped_column(Integer, nullable=False)
    budget: Mapped[float] = mapped_column(Float, nullable=False)
    stay_required: Mapped[str] = mapped_column(String, default="No")
    rooms_needed: Mapped[int | None] = mapped_column(Integer, nullable=True)
    message: Mapped[str] = mapped_column(String, default="")
    status: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[str] = mapped_column(String, nullable=False)


def build_engine(database_url: str):
    engine_kwargs = {"pool_pre_ping": True}
    if database_url.startswith("sqlite"):
        engine_kwargs["connect_args"] = {"check_same_thread": False}
    return create_engine(database_url, **engine_kwargs)


def switch_database(database_url: str) -> None:
    global DATABASE_URL, IS_SQLITE, ACTIVE_DATABASE, engine, SessionLocal

    DATABASE_URL = database_url
    IS_SQLITE = database_url.startswith("sqlite")
    ACTIVE_DATABASE = "sqlite" if IS_SQLITE else "postgresql"
    engine = build_engine(database_url)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


switch_database(DATABASE_URL)


REQUIREMENTS = [
    {
        "title": "Business profile",
        "description": "Venue name, contact numbers, address, city, GST details, and customer-facing business information.",
    },
    {
        "title": "Packages and pricing",
        "description": "Wedding, reception, birthday, and corporate packages with seasonal pricing and add-on rules.",
    },
    {
        "title": "Lawn areas and capacity",
        "description": "Main lawn, deck, garden court, guest capacity, setup buffers, and event-use restrictions.",
    },
    {
        "title": "Vendor preferences",
        "description": "Preferred decorators, caterers, lighting teams, payment terms, and backup partner lists.",
    },
    {
        "title": "Operations workflow",
        "description": "Default event managers, checklists, vendor arrival windows, and escalation rules for event day.",
    },
    {
        "title": "Billing and notifications",
        "description": "Advance rules, balance reminders, invoice preferences, and alerts for staff and clients.",
    },
    {
        "title": "Hotel rooms and stays",
        "description": "Room inventory, stay packages, guest check-ins, room allocation, and accommodation planning alongside venue events.",
    },
]


SEED = {
    "bookings": [
        {
            "id": "B001",
            "client_name": "Aarav Sharma",
            "event_type": "Wedding",
            "event_date": "2026-05-10",
            "guest_count": 450,
            "package_name": "Premium",
            "advance_paid": 325000,
            "notes": "Floral tunnel, LED wall, valet, VIP seating, bridal lounge.",
            "status": "Confirmed",
            "manager": "Ritika",
            "lawn_area": "Main Lawn",
        },
        {
            "id": "B002",
            "client_name": "Khanna Family",
            "event_type": "Reception",
            "event_date": "2026-05-14",
            "guest_count": 320,
            "package_name": "Gold",
            "advance_paid": 180000,
            "notes": "Live counters, elevated stage lighting, family lounge seating.",
            "status": "Upcoming",
            "manager": "Raghav",
            "lawn_area": "Sunset Deck",
        },
        {
            "id": "B003",
            "client_name": "Brightstar Industries",
            "event_type": "Corporate",
            "event_date": "2026-05-21",
            "guest_count": 260,
            "package_name": "Custom Luxury",
            "advance_paid": 400000,
            "notes": "Branding wall, guest lounge, formal stage program, AV support.",
            "status": "Inquiry",
            "manager": "Mira",
            "lawn_area": "North Lawn",
        },
        {
            "id": "B004",
            "client_name": "Neha Kapoor",
            "event_type": "Birthday",
            "event_date": "2026-05-24",
            "guest_count": 180,
            "package_name": "Silver",
            "advance_paid": 90000,
            "notes": "Kids activity zone, dessert island, pastel decor setup.",
            "status": "Upcoming",
            "manager": "Ritika",
            "lawn_area": "Garden Court",
        },
    ],
    "clients": [
        {
            "id": "C001",
            "name": "Neha Kapoor",
            "phone": "+91 9810011223",
            "email": "neha@example.com",
            "stage": "Booked",
            "preferences": "Pastel decor, dessert island, kids activity corner.",
        },
        {
            "id": "C002",
            "name": "Aarav Sharma",
            "phone": "+91 9822244466",
            "email": "aarav@example.com",
            "stage": "Site Visit",
            "preferences": "Bridal entry path, valet, separate VIP lounge.",
        },
        {
            "id": "C003",
            "name": "Brightstar Industries",
            "phone": "+91 9900099900",
            "email": "events@brightstar.com",
            "stage": "Quoted",
            "preferences": "Corporate branding, projection wall, formal seating blocks.",
        },
    ],
    "vendors": [
        {
            "id": "V001",
            "name": "Royal Petals Decor",
            "category": "Decor",
            "contact_person": "Rajiv",
            "phone": "+91 9700001122",
            "status": "Preferred",
            "notes": "Strong for weddings and stage styling.",
        },
        {
            "id": "V002",
            "name": "Spice Route Catering",
            "category": "Catering",
            "contact_person": "Mahesh",
            "phone": "+91 9711100012",
            "status": "Active",
            "notes": "Large-scale buffet and live counters.",
        },
        {
            "id": "V003",
            "name": "EchoLight Productions",
            "category": "Lighting",
            "contact_person": "Rohit",
            "phone": "+91 9777701010",
            "status": "Backup",
            "notes": "Night events, moving heads, LED wall setup.",
        },
    ],
    "payments": [
        {
            "id": "P001",
            "client_name": "Aarav Sharma",
            "payment_type": "Advance",
            "amount": 325000,
            "status": "Received",
            "notes": "Bank transfer completed.",
        },
        {
            "id": "P002",
            "client_name": "Khanna Family",
            "payment_type": "Installment",
            "amount": 120000,
            "status": "Pending",
            "notes": "Due next week after menu lock.",
        },
        {
            "id": "P003",
            "client_name": "Brightstar Industries",
            "payment_type": "Token",
            "amount": 150000,
            "status": "Pending",
            "notes": "Waiting for finance approval from client side.",
        },
    ],
    "hotelBookings": [
        {
            "id": "H001",
            "guest_name": "Rhea Malhotra",
            "phone": "+91 9898981212",
            "room_type": "Premium Room",
            "check_in": "2026-05-09",
            "check_out": "2026-05-11",
            "rooms_count": 6,
            "guests_count": 12,
            "amount": 96000,
            "booking_source": "Wedding Block",
            "status": "Reserved",
            "payment_status": "Pending",
            "notes": "Bride-side family arrival one day before ceremony.",
        },
        {
            "id": "H002",
            "guest_name": "Khanna Family Stay",
            "phone": "+91 9811188811",
            "room_type": "Family Suite",
            "check_in": "2026-05-13",
            "check_out": "2026-05-15",
            "rooms_count": 8,
            "guests_count": 18,
            "amount": 168000,
            "booking_source": "Reception Block",
            "status": "Reserved",
            "payment_status": "Pending",
            "notes": "Family block tied to reception function and late checkout request.",
        },
        {
            "id": "H003",
            "guest_name": "Axis Buildcon Team",
            "phone": "+91 9877000022",
            "room_type": "Deluxe Room",
            "check_in": "2026-05-20",
            "check_out": "2026-05-21",
            "rooms_count": 4,
            "guests_count": 7,
            "amount": 44000,
            "booking_source": "Corporate Event",
            "status": "Confirmed",
            "payment_status": "Received",
            "notes": "Executive stay aligned with next-day corporate gathering.",
        },
    ],
    "tasks": [
        {"id": "T001", "title": "Confirm stage floral design", "owner": "Decor team", "due": "Today 1:00 PM", "status": "Upcoming"},
        {"id": "T002", "title": "Check valet lane flow", "owner": "Operations manager", "due": "Today 5:30 PM", "status": "Upcoming"},
        {"id": "T003", "title": "Collect pending installment", "owner": "Finance desk", "due": "Tomorrow", "status": "Risk"},
    ],
    "activity": [
        "Khanna Family payment marked pending for follow-up.",
        "Brightstar Industries quote sent with custom luxury package.",
        "Royal Petals Decor confirmed for May premium wedding slot.",
        "Aarav Sharma booking moved to Confirmed.",
    ],
}


class BookingCreate(BaseModel):
    clientName: str
    eventType: str
    eventDate: str
    guestCount: int = Field(ge=1)
    packageName: str
    advancePaid: float = Field(ge=0)
    notes: str = ""
    manager: str | None = None
    lawnArea: str | None = None
    status: str | None = None


class BookingStatusUpdate(BaseModel):
    status: Literal["Inquiry", "Upcoming", "Confirmed"]


class ClientCreate(BaseModel):
    name: str
    phone: str
    email: str
    stage: str
    preferences: str = ""


class VendorCreate(BaseModel):
    name: str
    category: str
    contactPerson: str
    phone: str
    status: str
    notes: str = ""


class PaymentCreate(BaseModel):
    clientName: str
    paymentType: str
    amount: float = Field(ge=0)
    status: str
    notes: str = ""


class HotelBookingCreate(BaseModel):
    guestName: str
    phone: str
    roomType: str
    checkIn: str
    checkOut: str
    roomsCount: int = Field(ge=1)
    guestsCount: int = Field(ge=1)
    amount: float = Field(ge=0)
    bookingSource: str
    status: str
    paymentStatus: str = "Pending"
    notes: str = ""


class TaskCreate(BaseModel):
    title: str
    owner: str
    due: str
    status: str


class EnquiryCreate(BaseModel):
    name: str
    phone: str
    email: str
    eventType: str
    eventDate: str
    guestCount: int = Field(ge=1)
    budget: float = Field(ge=0)
    stayRequired: str = "No"
    roomsNeeded: int | None = Field(default=None, ge=0)
    message: str = ""


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def normalize_text(value: str | None) -> str:
    return (value or "").strip()


def clear_application_data(db: Session) -> None:
    db.query(Enquiry).delete()
    db.query(Activity).delete()
    db.query(Task).delete()
    db.query(HotelBooking).delete()
    db.query(Payment).delete()
    db.query(Vendor).delete()
    db.query(Client).delete()
    db.query(Booking).delete()
    db.commit()


def create_seed_data(db: Session) -> None:
    clear_application_data(db)
    db.add_all(Booking(**item) for item in SEED["bookings"])
    db.add_all(Client(**item) for item in SEED["clients"])
    db.add_all(Vendor(**item) for item in SEED["vendors"])
    db.add_all(Payment(**item) for item in SEED["payments"])
    db.add_all(HotelBooking(**item) for item in SEED["hotelBookings"])
    db.add_all(Task(**item) for item in SEED["tasks"])
    db.add_all(
        Activity(message=message, created_at=datetime.utcnow().isoformat())
        for message in SEED["activity"]
    )
    db.commit()


def seed_missing_modules(db: Session) -> None:
    return None


def ensure_database() -> None:
    if IS_SQLITE:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    ensure_enquiry_schema()
    ensure_hotel_booking_schema()
    with SessionLocal() as db:
        seed_missing_modules(db)


def ensure_enquiry_schema() -> None:
    inspector = inspect(engine)
    if "enquiries" not in inspector.get_table_names():
        return

    column_names = {column["name"] for column in inspector.get_columns("enquiries")}
    statements: list[str] = []

    if "stay_required" not in column_names:
        statements.append("ALTER TABLE enquiries ADD COLUMN stay_required VARCHAR DEFAULT 'No'")
    if "rooms_needed" not in column_names:
        statements.append("ALTER TABLE enquiries ADD COLUMN rooms_needed INTEGER")

    if not statements:
        return

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


def ensure_hotel_booking_schema() -> None:
    inspector = inspect(engine)
    if "hotel_bookings" not in inspector.get_table_names():
        return

    column_names = {column["name"] for column in inspector.get_columns("hotel_bookings")}
    statements: list[str] = []

    if "payment_status" not in column_names:
        statements.append("ALTER TABLE hotel_bookings ADD COLUMN payment_status VARCHAR DEFAULT 'Pending'")

    if not statements:
        return

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


def initialize_database() -> None:
    global DATABASE_STATUS, DATABASE_ERROR

    try:
        ensure_database()
        DATABASE_STATUS = "connected"
        DATABASE_ERROR = None
    except Exception as exc:
        if IS_SQLITE:
            DATABASE_STATUS = "error"
            DATABASE_ERROR = str(exc)
            raise

        DATABASE_STATUS = "fallback"
        DATABASE_ERROR = str(exc)
        switch_database(SQLITE_DATABASE_URL)
        ensure_database()


def next_prefixed_id(db: Session, model: type[Base], prefix: str) -> str:
    ids = [value for value in db.scalars(select(model.id)).all()]
    max_number = 0
    for raw_id in ids:
        if isinstance(raw_id, str) and raw_id.startswith(prefix):
            numeric = raw_id.removeprefix(prefix)
            if numeric.isdigit():
                max_number = max(max_number, int(numeric))
    return f"{prefix}{max_number + 1:03d}"


def parse_iso_date(raw_value: str, label: str) -> date:
    try:
        return date.fromisoformat(raw_value)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=f"{label} must be a valid date in YYYY-MM-DD format.") from exc


def ranges_overlap(start_a: date, end_a: date, start_b: date, end_b: date) -> bool:
    return start_a < end_b and start_b < end_a


def add_activity(db: Session, message: str) -> None:
    db.add(Activity(message=message, created_at=datetime.utcnow().isoformat()))
    old_rows = db.scalars(select(Activity).order_by(Activity.id.desc()).offset(12)).all()
    for row in old_rows:
        db.delete(row)
    db.commit()


def serialize_booking(row: Booking) -> dict:
    return {
        "id": row.id,
        "clientName": row.client_name,
        "eventType": row.event_type,
        "eventDate": row.event_date,
        "guestCount": row.guest_count,
        "packageName": row.package_name,
        "advancePaid": row.advance_paid,
        "notes": row.notes,
        "status": row.status,
        "manager": row.manager,
        "lawnArea": row.lawn_area,
    }


def serialize_client(row: Client) -> dict:
    return {
        "id": row.id,
        "name": row.name,
        "phone": row.phone,
        "email": row.email,
        "stage": row.stage,
        "preferences": row.preferences,
    }


def serialize_vendor(row: Vendor) -> dict:
    return {
        "id": row.id,
        "name": row.name,
        "category": row.category,
        "contactPerson": row.contact_person,
        "phone": row.phone,
        "status": row.status,
        "notes": row.notes,
    }


def serialize_payment(row: Payment) -> dict:
    return {
        "id": row.id,
        "clientName": row.client_name,
        "paymentType": row.payment_type,
        "amount": row.amount,
        "status": row.status,
        "notes": row.notes,
    }


def serialize_hotel_booking(row: HotelBooking) -> dict:
    return {
        "id": row.id,
        "guestName": row.guest_name,
        "phone": row.phone,
        "roomType": row.room_type,
        "checkIn": row.check_in,
        "checkOut": row.check_out,
        "roomsCount": row.rooms_count,
        "guestsCount": row.guests_count,
        "amount": row.amount,
        "bookingSource": row.booking_source,
        "status": row.status,
        "paymentStatus": row.payment_status,
        "notes": row.notes,
    }


def serialize_task(row: Task) -> dict:
    return {
        "id": row.id,
        "title": row.title,
        "owner": row.owner,
        "due": row.due,
        "status": row.status,
    }


def serialize_enquiry(row: Enquiry) -> dict:
    return {
        "id": row.id,
        "name": row.name,
        "phone": row.phone,
        "email": row.email,
        "eventType": row.event_type,
        "eventDate": row.event_date,
        "guestCount": row.guest_count,
        "budget": row.budget,
        "stayRequired": row.stay_required,
        "roomsNeeded": row.rooms_needed,
        "message": row.message,
        "status": row.status,
        "createdAt": row.created_at,
    }


def activity_messages(db: Session) -> list[str]:
    rows = db.scalars(select(Activity).order_by(Activity.id.desc())).all()
    return [row.message for row in rows]


def dashboard_summary(db: Session) -> dict:
    bookings = db.scalars(select(Booking).order_by(Booking.event_date.asc())).all()
    payments = db.scalars(select(Payment).order_by(Payment.id.asc())).all()
    hotel_bookings = db.scalars(select(HotelBooking).order_by(HotelBooking.check_in.asc())).all()
    tasks = db.scalars(select(Task).order_by(Task.id.asc())).all()

    pending_payments = [payment for payment in payments if payment.status == "Pending"]
    received_payments = [payment for payment in payments if payment.status == "Received"]
    confirmed_bookings = [booking for booking in bookings if booking.status == "Confirmed"]
    upcoming_bookings = [booking for booking in bookings if booking.status == "Upcoming"]
    inquiry_bookings = [booking for booking in bookings if booking.status == "Inquiry"]
    active_stays = [
        booking for booking in hotel_bookings if booking.status in {"Reserved", "Checked In", "Confirmed"}
    ]
    pending_hotel_collections = [booking for booking in hotel_bookings if booking.payment_status == "Pending"]
    received_hotel_collections = [booking for booking in hotel_bookings if booking.payment_status == "Received"]

    return {
        "metrics": {
            "totalBookings": len(bookings),
            "openInquiries": len(inquiry_bookings),
            "upcomingEvents": len(upcoming_bookings),
            "confirmedEvents": len(confirmed_bookings),
            "hotelReservations": len(active_stays),
            "roomsReserved": sum(booking.rooms_count for booking in active_stays),
            "activeVendors": db.query(Vendor).count(),
            "paymentsReceived": sum(payment.amount for payment in received_payments)
            + sum(booking.amount for booking in received_hotel_collections),
            "pendingCollections": sum(payment.amount for payment in pending_payments)
            + sum(booking.amount for booking in pending_hotel_collections),
        },
        "todayBookings": [serialize_booking(row) for row in bookings[:4]],
        "hotelStays": [serialize_hotel_booking(row) for row in hotel_bookings[:4]],
        "pendingPayments": [
            *[serialize_payment(row) for row in pending_payments[:5]],
            *[
                {
                    "id": row.id,
                    "clientName": row.guest_name,
                    "paymentType": f"Hotel Stay · {row.room_type}",
                    "amount": row.amount,
                    "status": row.payment_status,
                    "notes": f"{row.rooms_count} room(s) · {row.check_in} to {row.check_out}",
                }
                for row in pending_hotel_collections[:5]
            ],
        ][:8],
        "activity": activity_messages(db)[:8],
        "tasks": [serialize_task(row) for row in tasks],
    }


@asynccontextmanager
async def lifespan(_: FastAPI):
    initialize_database()
    yield


app = FastAPI(title="Celebration Lawn Command", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health(db: Session = Depends(get_db)) -> dict:
    db.execute(text("SELECT 1"))
    return {
        "ok": True,
        "timestamp": datetime.utcnow().isoformat(),
        "configuredDatabase": "sqlite" if CONFIGURED_DATABASE_URL.startswith("sqlite") else "postgresql",
        "activeDatabase": ACTIVE_DATABASE,
        "databaseStatus": DATABASE_STATUS,
        "databaseError": DATABASE_ERROR,
    }


@app.get("/api/bootstrap")
def bootstrap(db: Session = Depends(get_db)) -> dict:
    return {
        "bookings": [serialize_booking(row) for row in db.scalars(select(Booking).order_by(Booking.event_date.asc())).all()],
        "clients": [serialize_client(row) for row in db.scalars(select(Client).order_by(Client.id.asc())).all()],
        "vendors": [serialize_vendor(row) for row in db.scalars(select(Vendor).order_by(Vendor.id.asc())).all()],
        "payments": [serialize_payment(row) for row in db.scalars(select(Payment).order_by(Payment.id.asc())).all()],
        "hotelBookings": [serialize_hotel_booking(row) for row in db.scalars(select(HotelBooking).order_by(HotelBooking.check_in.asc())).all()],
        "tasks": [serialize_task(row) for row in db.scalars(select(Task).order_by(Task.id.asc())).all()],
        "requirements": REQUIREMENTS,
        "activity": activity_messages(db),
        "dashboard": dashboard_summary(db),
    }


@app.get("/api/dashboard")
def dashboard(db: Session = Depends(get_db)) -> dict:
    return dashboard_summary(db)


@app.get("/api/bookings")
def list_bookings(db: Session = Depends(get_db)) -> list[dict]:
    return [serialize_booking(row) for row in db.scalars(select(Booking).order_by(Booking.event_date.asc())).all()]


@app.post("/api/bookings", status_code=201)
def create_booking(payload: BookingCreate, db: Session = Depends(get_db)) -> dict:
    event_date = parse_iso_date(payload.eventDate, "Event date")
    lawn_area = payload.lawnArea or "Main Lawn"

    existing_booking = db.scalar(
        select(Booking).where(Booking.event_date == event_date.isoformat(), Booking.lawn_area == lawn_area).limit(1)
    )
    if existing_booking is not None:
        raise HTTPException(
            status_code=409,
            detail=f"{lawn_area} is already booked on {event_date.isoformat()} for {existing_booking.client_name}.",
        )

    booking = Booking(
        id=next_prefixed_id(db, Booking, "B"),
        client_name=payload.clientName,
        event_type=payload.eventType,
        event_date=event_date.isoformat(),
        guest_count=payload.guestCount,
        package_name=payload.packageName,
        advance_paid=payload.advancePaid,
        notes=payload.notes,
        status=payload.status or "Inquiry",
        manager=payload.manager or "Unassigned",
        lawn_area=lawn_area,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    add_activity(db, f"{booking.client_name} booking created as {booking.status}.")
    return serialize_booking(booking)


@app.patch("/api/bookings/{booking_id}/status")
def update_booking_status(booking_id: str, payload: BookingStatusUpdate, db: Session = Depends(get_db)) -> dict:
    booking = db.get(Booking, booking_id)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = payload.status
    db.commit()
    db.refresh(booking)
    add_activity(db, f"{booking.client_name} moved to {booking.status}.")
    return serialize_booking(booking)


@app.get("/api/clients")
def list_clients(db: Session = Depends(get_db)) -> list[dict]:
    return [serialize_client(row) for row in db.scalars(select(Client).order_by(Client.id.asc())).all()]


@app.post("/api/clients", status_code=201)
def create_client(payload: ClientCreate, db: Session = Depends(get_db)) -> dict:
    name = normalize_text(payload.name)
    phone = normalize_text(payload.phone)
    email = normalize_text(payload.email).lower()
    stage = normalize_text(payload.stage)
    preferences = normalize_text(payload.preferences)

    existing_client = db.scalar(
        select(Client).where((Client.phone == phone) | (Client.email == email)).limit(1)
    )
    if existing_client is not None:
        raise HTTPException(
            status_code=409,
            detail=f"Client record already exists for {existing_client.name} with the same phone or email.",
        )

    client = Client(
        id=next_prefixed_id(db, Client, "C"),
        name=name,
        phone=phone,
        email=email,
        stage=stage,
        preferences=preferences,
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    add_activity(db, f"{client.name} added to CRM.")
    return serialize_client(client)


@app.get("/api/vendors")
def list_vendors(db: Session = Depends(get_db)) -> list[dict]:
    return [serialize_vendor(row) for row in db.scalars(select(Vendor).order_by(Vendor.id.asc())).all()]


@app.post("/api/vendors", status_code=201)
def create_vendor(payload: VendorCreate, db: Session = Depends(get_db)) -> dict:
    name = normalize_text(payload.name)
    category = normalize_text(payload.category)
    contact_person = normalize_text(payload.contactPerson)
    phone = normalize_text(payload.phone)
    status = normalize_text(payload.status)
    notes = normalize_text(payload.notes)

    existing_vendor = db.scalar(
        select(Vendor).where(Vendor.name == name, Vendor.phone == phone).limit(1)
    )
    if existing_vendor is not None:
        raise HTTPException(
            status_code=409,
            detail=f"Vendor record already exists for {existing_vendor.name} with the same phone.",
        )

    vendor = Vendor(
        id=next_prefixed_id(db, Vendor, "V"),
        name=name,
        category=category,
        contact_person=contact_person,
        phone=phone,
        status=status,
        notes=notes,
    )
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    add_activity(db, f"{vendor.name} vendor record added.")
    return serialize_vendor(vendor)


@app.get("/api/payments")
def list_payments(db: Session = Depends(get_db)) -> list[dict]:
    return [serialize_payment(row) for row in db.scalars(select(Payment).order_by(Payment.id.asc())).all()]


@app.post("/api/payments", status_code=201)
def create_payment(payload: PaymentCreate, db: Session = Depends(get_db)) -> dict:
    payment = Payment(
        id=next_prefixed_id(db, Payment, "P"),
        client_name=payload.clientName,
        payment_type=payload.paymentType,
        amount=payload.amount,
        status=payload.status,
        notes=payload.notes,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    add_activity(db, f"{payment.client_name} payment entry added.")
    return serialize_payment(payment)


@app.get("/api/hotel-bookings")
def list_hotel_bookings(db: Session = Depends(get_db)) -> list[dict]:
    return [serialize_hotel_booking(row) for row in db.scalars(select(HotelBooking).order_by(HotelBooking.check_in.asc())).all()]


@app.post("/api/hotel-bookings", status_code=201)
def create_hotel_booking(payload: HotelBookingCreate, db: Session = Depends(get_db)) -> dict:
    check_in = parse_iso_date(payload.checkIn, "Check-in date")
    check_out = parse_iso_date(payload.checkOut, "Check-out date")
    if check_out < check_in:
        raise HTTPException(status_code=422, detail="Check-out date cannot be earlier than check-in date.")
    if payload.roomType not in ROOM_INVENTORY:
        raise HTTPException(status_code=422, detail="Selected room type is not supported.")

    overlapping_stays = db.scalars(
        select(HotelBooking).where(HotelBooking.room_type == payload.roomType)
    ).all()
    blocked_rooms = 0
    for row in overlapping_stays:
        row_check_in = parse_iso_date(row.check_in, "Existing check-in date")
        row_check_out = parse_iso_date(row.check_out, "Existing check-out date")
        if ranges_overlap(check_in, check_out, row_check_in, row_check_out) and row.status in {
            "Reserved",
            "Confirmed",
            "Checked In",
        }:
            blocked_rooms += row.rooms_count

    remaining_rooms = ROOM_INVENTORY[payload.roomType] - blocked_rooms
    if payload.roomsCount > remaining_rooms:
        raise HTTPException(
            status_code=409,
            detail=(
                f"Only {max(remaining_rooms, 0)} {payload.roomType} room(s) are available for "
                f"{check_in.isoformat()} to {check_out.isoformat()}."
            ),
        )

    hotel_booking = HotelBooking(
        id=next_prefixed_id(db, HotelBooking, "H"),
        guest_name=payload.guestName,
        phone=payload.phone,
        room_type=payload.roomType,
        check_in=check_in.isoformat(),
        check_out=check_out.isoformat(),
        rooms_count=payload.roomsCount,
        guests_count=payload.guestsCount,
        amount=payload.amount,
        booking_source=payload.bookingSource,
        status=payload.status,
        payment_status=payload.paymentStatus,
        notes=payload.notes,
    )
    db.add(hotel_booking)
    db.commit()
    db.refresh(hotel_booking)
    add_activity(db, f"{hotel_booking.guest_name} hotel stay saved as {hotel_booking.status}.")
    return serialize_hotel_booking(hotel_booking)


@app.get("/api/tasks")
def list_tasks(db: Session = Depends(get_db)) -> list[dict]:
    return [serialize_task(row) for row in db.scalars(select(Task).order_by(Task.id.asc())).all()]


@app.post("/api/tasks", status_code=201)
def create_task(payload: TaskCreate, db: Session = Depends(get_db)) -> dict:
    task = Task(
        id=next_prefixed_id(db, Task, "T"),
        title=payload.title,
        owner=payload.owner,
        due=payload.due,
        status=payload.status,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    add_activity(db, f"{task.title} task created.")
    return serialize_task(task)


@app.get("/api/enquiries")
def list_enquiries(db: Session = Depends(get_db)) -> list[dict]:
    rows = db.scalars(select(Enquiry).order_by(Enquiry.id.desc())).all()
    return [serialize_enquiry(row) for row in rows]


@app.post("/api/enquiries", status_code=201)
def create_enquiry(payload: EnquiryCreate, db: Session = Depends(get_db)) -> dict:
    event_date = parse_iso_date(payload.eventDate, "Event date")
    stay_required = normalize_text(payload.stayRequired) or "No"
    if stay_required not in {"Yes", "No"}:
        raise HTTPException(status_code=422, detail="Stay requirement must be either Yes or No.")

    rooms_needed = payload.roomsNeeded
    if stay_required == "Yes" and (rooms_needed is None or rooms_needed < 1):
        raise HTTPException(status_code=422, detail="Rooms needed must be at least 1 when guest stay is required.")
    if stay_required == "No":
        rooms_needed = None

    enquiry = Enquiry(
        name=normalize_text(payload.name),
        phone=normalize_text(payload.phone),
        email=normalize_text(payload.email).lower(),
        event_type=normalize_text(payload.eventType),
        event_date=event_date.isoformat(),
        guest_count=payload.guestCount,
        budget=payload.budget,
        stay_required=stay_required,
        rooms_needed=rooms_needed,
        message=normalize_text(payload.message),
        status="New",
        created_at=datetime.utcnow().isoformat(),
    )
    db.add(enquiry)
    db.commit()
    db.refresh(enquiry)
    add_activity(db, f"New enquiry received from {enquiry.name} for {enquiry.event_type}.")
    return serialize_enquiry(enquiry)


@app.post("/api/reset")
def reset(db: Session = Depends(get_db)) -> dict:
    clear_application_data(db)
    return {"ok": True, "message": "Application data cleared."}


@app.get("/")
def root() -> FileResponse:
    return FileResponse(ROOT_DIR / "index.html")


@app.get("/enquiry")
def enquiry_page() -> FileResponse:
    return FileResponse(ROOT_DIR / "enquiry.html")


app.mount("/", StaticFiles(directory=ROOT_DIR, html=True), name="static")
