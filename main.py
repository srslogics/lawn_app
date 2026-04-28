from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Generator, Literal

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Float, Integer, String, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker


ROOT_DIR = Path(__file__).resolve().parent
DATA_DIR = ROOT_DIR / "data"
DB_PATH = DATA_DIR / "app.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"


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


engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


REQUIREMENTS = [
    {
        "title": "Booking lifecycle",
        "description": "Inquiry, site visit, quote, token, contract, confirmed booking, balance tracking.",
    },
    {
        "title": "Venue calendar",
        "description": "Date locks, setup windows, teardown slots, conflict detection, and lawn utilization.",
    },
    {
        "title": "Client CRM",
        "description": "Profiles, preferences, communication history, approvals, and lead stages.",
    },
    {
        "title": "Vendor coordination",
        "description": "Decor, catering, lighting, sound, security, valet, and backup partner mapping.",
    },
    {
        "title": "Event-day operations",
        "description": "Setup status, task assignment, readiness checks, and issue escalation.",
    },
    {
        "title": "Finance control",
        "description": "Deposits, balances, receipts, payout visibility, and revenue reporting.",
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
            "advance_paid": 3200,
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
            "advance_paid": 1800,
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
            "advance_paid": 4000,
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
            "advance_paid": 900,
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
            "amount": 3200,
            "status": "Received",
            "notes": "Bank transfer completed.",
        },
        {
            "id": "P002",
            "client_name": "Khanna Family",
            "payment_type": "Installment",
            "amount": 1200,
            "status": "Pending",
            "notes": "Due next week after menu lock.",
        },
        {
            "id": "P003",
            "client_name": "Brightstar Industries",
            "payment_type": "Token",
            "amount": 1500,
            "status": "Pending",
            "notes": "Waiting for finance approval from client side.",
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


class TaskCreate(BaseModel):
    title: str
    owner: str
    due: str
    status: str


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_seed_data(db: Session) -> None:
    db.query(Activity).delete()
    db.query(Task).delete()
    db.query(Payment).delete()
    db.query(Vendor).delete()
    db.query(Client).delete()
    db.query(Booking).delete()

    db.add_all(Booking(**item) for item in SEED["bookings"])
    db.add_all(Client(**item) for item in SEED["clients"])
    db.add_all(Vendor(**item) for item in SEED["vendors"])
    db.add_all(Payment(**item) for item in SEED["payments"])
    db.add_all(Task(**item) for item in SEED["tasks"])
    db.add_all(
        Activity(message=message, created_at=datetime.utcnow().isoformat())
        for message in SEED["activity"]
    )
    db.commit()


def ensure_database() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        has_bookings = db.scalar(select(Booking.id).limit(1))
        if not has_bookings:
            create_seed_data(db)


def next_prefixed_id(db: Session, model: type[Base], prefix: str) -> str:
    ids = [value for value in db.scalars(select(model.id)).all()]
    max_number = 0
    for raw_id in ids:
      if isinstance(raw_id, str) and raw_id.startswith(prefix):
          numeric = raw_id.removeprefix(prefix)
          if numeric.isdigit():
              max_number = max(max_number, int(numeric))
    return f"{prefix}{max_number + 1:03d}"


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


def serialize_task(row: Task) -> dict:
    return {
        "id": row.id,
        "title": row.title,
        "owner": row.owner,
        "due": row.due,
        "status": row.status,
    }


def activity_messages(db: Session) -> list[str]:
    rows = db.scalars(select(Activity).order_by(Activity.id.desc())).all()
    return [row.message for row in rows]


def dashboard_summary(db: Session) -> dict:
    bookings = db.scalars(select(Booking).order_by(Booking.event_date.asc())).all()
    payments = db.scalars(select(Payment).order_by(Payment.id.asc())).all()
    tasks = db.scalars(select(Task).order_by(Task.id.asc())).all()

    pending_payments = [payment for payment in payments if payment.status == "Pending"]
    received_payments = [payment for payment in payments if payment.status == "Received"]
    confirmed_bookings = [booking for booking in bookings if booking.status == "Confirmed"]
    upcoming_bookings = [booking for booking in bookings if booking.status == "Upcoming"]
    inquiry_bookings = [booking for booking in bookings if booking.status == "Inquiry"]

    return {
        "metrics": {
            "totalBookings": len(bookings),
            "openInquiries": len(inquiry_bookings),
            "upcomingEvents": len(upcoming_bookings),
            "confirmedEvents": len(confirmed_bookings),
            "activeVendors": db.query(Vendor).count(),
            "paymentsReceived": sum(payment.amount for payment in received_payments),
            "pendingCollections": sum(payment.amount for payment in pending_payments),
        },
        "todayBookings": [serialize_booking(row) for row in bookings[:4]],
        "pendingPayments": [serialize_payment(row) for row in pending_payments[:5]],
        "activity": activity_messages(db)[:8],
        "tasks": [serialize_task(row) for row in tasks],
    }


@asynccontextmanager
async def lifespan(_: FastAPI):
    ensure_database()
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
def health() -> dict:
    return {"ok": True, "timestamp": datetime.utcnow().isoformat()}


@app.get("/api/bootstrap")
def bootstrap(db: Session = Depends(get_db)) -> dict:
    return {
        "bookings": [serialize_booking(row) for row in db.scalars(select(Booking).order_by(Booking.event_date.asc())).all()],
        "clients": [serialize_client(row) for row in db.scalars(select(Client).order_by(Client.id.asc())).all()],
        "vendors": [serialize_vendor(row) for row in db.scalars(select(Vendor).order_by(Vendor.id.asc())).all()],
        "payments": [serialize_payment(row) for row in db.scalars(select(Payment).order_by(Payment.id.asc())).all()],
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
    booking = Booking(
        id=next_prefixed_id(db, Booking, "B"),
        client_name=payload.clientName,
        event_type=payload.eventType,
        event_date=payload.eventDate,
        guest_count=payload.guestCount,
        package_name=payload.packageName,
        advance_paid=payload.advancePaid,
        notes=payload.notes,
        status=payload.status or "Inquiry",
        manager=payload.manager or "Unassigned",
        lawn_area=payload.lawnArea or "Main Lawn",
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
    client = Client(
        id=next_prefixed_id(db, Client, "C"),
        name=payload.name,
        phone=payload.phone,
        email=payload.email,
        stage=payload.stage,
        preferences=payload.preferences,
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
    vendor = Vendor(
        id=next_prefixed_id(db, Vendor, "V"),
        name=payload.name,
        category=payload.category,
        contact_person=payload.contactPerson,
        phone=payload.phone,
        status=payload.status,
        notes=payload.notes,
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


@app.post("/api/reset")
def reset(db: Session = Depends(get_db)) -> dict:
    create_seed_data(db)
    return {"ok": True, "message": "Database reset to seed data."}


@app.get("/")
def root() -> FileResponse:
    return FileResponse(ROOT_DIR / "index.html")


app.mount("/", StaticFiles(directory=ROOT_DIR, html=True), name="static")
