# Tourist Tome
### Integrated Destination Management System (IDMS)
**Nathan Scott, Nicole Burke, Jon Moore, Gavin Harban, Jayden Sosa**
![tt_readme.png](tt_readme.png)
---

## Table of Contents
1. [Project Overview](#project-overview)
2. [UI Design](#ui-design)
3. [Database Design](#database-design)
4. [Architecture Design](#architecture-design)
5. [System Specification](#system-specification)

---

## Project Overview

Tourist Tome is a web-based three-tier client-server system that centralises tourist attraction information, tour operator management, booking simulation, visitor analytics, sustainability monitoring, emergency services information, and multi-language interface support.

---

## UI Design

### Login Page
The login page acts as the portal between the website and users. The system uses personal and business emails for entry, paired with a user-created password. Two text fields with hints of `Email` and `Password` handle input. Users without an account click the **Register** button in the bottom right corner to be redirected to the registration screen.

### Registration Page
The registration page contains two buttons allowing users to create accounts via either their native email or directly using Google. Once registered, users receive a confirmation email and, upon verification, are redirected to the login screen.

### Home Page
The home screen displays top attractions and the most popular user tours. A search bar in the top right allows users to find specific attractions or tours. A filters button to the left of the search bar opens filtering options based on preferred locations, price ranges, and other criteria.

The design is minimalistic, organised, and engaging. Hovering over attraction or tour images shows the name and average user score. Clicking an image navigates to the details page for that attraction or tour.

Operators have access to the **Attraction** tab, which directs them to a tour management page. The **MYBOOKING** button navigates to a page tracking all of a user's booked tours.

### Details Page
The details page shows detailed information for a specific attraction. A displayed image and description appear on the left. On the right are segments for available tours and reviews.

Users can scroll through tours for the attraction — changing the selected tour also updates the displayed review. A **More** button shows additional tours, and a **See More** option in the review section redirects to the full review page.

### Review Page
The review page provides an in-depth look at reviews for specific tours and allows users to write a new review. The right side contains written reviews with a scrollbar. Operators see an expanded view without the write-review option, giving them a comprehensive view of feedback.

The average user score is prominently displayed above the personal review block. This transparency holds operators accountable and ensures quality control.

### Tours Page
The tours page is an extended view of all tours for an attraction. Descriptions provide specific information including pricing and agenda details. Pressing **Book Now** takes the user to the checkout page for that specific tour.

### Booking Page
The booking page allows users to select a tour date, specify how many persons are attending, and view date availability and remaining spots. Total price is displayed along with accepted payment methods: Visa, American Express, MasterCard, and PayPal.

### MyBooking Page (Users)
The MyBooking page is a personal dashboard where users view and manage all reserved tours in one table. Displayed information includes Booking ID, tour name, attraction, location, date, party size, and status (Confirmed, Cancelled, or Pending). A search widget allows users to find specific bookings.

### Admin (Operators) Tour Page
The operators' tour page allows operators to create and edit tours for each attraction. Operators can enter price, tour name, tour description, duration, location, max capacity, and an image. This gives tour managers full control over how tours are displayed on the website.

### Admin Dashboard Page
The admin dashboard allows administrators to manage attractions on the website. Admins enter attraction name, type, description, and price. The page also includes a User Manager section for assigning users to manage specific attractions and tours.

### Dashboard Page
The dashboard provides a summary of website activity and performance. It displays the total number of active users (tourists and operators) and total bookings. Below that, the most popular tours are highlighted based on tourist visits.

---

## Database Design

### Introduction and Purpose

The database supports a variety of integrations and cross-referencing systems including:

- **Tourist Info Portal** — storage for archaeological sites
- **Tour Operator Management** — operator structures, credentials, calendars, and reviews
- **Booking Integration** — connections to hotels, airlines, and pricing data
- **Visitor Analytics** — nationality, popular destinations, spending patterns, seasonal trends, tourism planning
- **Sustainable Tourism Monitoring** — carbon footprint calculation, capacity management, environmental impact reporting
- **EMS Integration** — connection to Belize Police Department Tourist Police Unit and medical facilities
- **Multi-Language Support**

These systems are abstracted into core structures: User, Role, Nationality, Attraction, Attraction Category, Attraction Media, Tour, Operator, Booking, Payment, Review, and Availability.

The database is normalised to **3NF** — fields are atomic, fully dependent on the primary key, and there are no transitive dependencies.

---

### Table Descriptions

#### Users
Stores all users interacting with the system. Includes authentication, personal info, roles, and optional nationality. Account status can be toggled (active/suspended/deleted) without hard deletes.

#### Role *(hard-coded)*
Defines user access levels: **Admin (1)**, **Operator (2)**, **Tourist (3)**.

#### Nationality
Standardised list of countries using ISO codes. Used in analytics and front-end drop-downs.

#### Attraction
Stores all tourist sites and points of interest in Belize. Features name, description, location, and base price.

#### AttrCategory *(hard-coded)*
Classifies attractions into: **Archaeological**, **Marine**, **Wildlife**, **Cultural**.

#### AttrMedia
Stores media associated with each attraction (images, videos, GIFs, map/location data). Supports multiple media per attraction, display ordering, and alt text for accessibility and SEO.

#### Operator
Stores registered tour operator information including company name, contact email, and phone number. Each operator can run multiple tours.

#### Tour
Represents each specific tour at any attraction, operated by any operator. Stores duration, price, and max capacity. Links to Booking, Review, and Availability.

#### Booking
Structures the user tour booking. Records who booked which tour on what date, with how many people, at what price, and the booking status.

#### Payment
Tracks payment per booking. Records amount, method, success status, and timestamp. One-to-one relationship with Booking.

#### Review
Allows users to provide feedback for tours. Includes a rating, comment, and timestamp. Enforces one review per user per tour via composite unique index.

#### Availability
Manages tour schedule and remaining capacity per tour date. Prevents overbooking. Composite unique key prevents duplicate dates per tour.

---

### Logical Table Layout

#### Users
| Field | Type | Constraints | Notes |
|---|---|---|---|
| userID | INT | PK, NOT NULL, AUTO_INCREMENT | Unique user identifier |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Authentication |
| passwordHash | VARCHAR(255) | NOT NULL | Argon2 hashed and salted |
| fName | VARCHAR(50) | NOT NULL | First name |
| lName | VARCHAR(50) | NOT NULL | Last name |
| roleID | INT | NOT NULL, FK → Role | Permissions and access level |
| natID | INT | FK → Nationality | Optional nationality |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | User metrics |
| updatedAt | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Updates |
| active | BOOLEAN | NOT NULL, DEFAULT TRUE | Soft account management |

#### Role
| roleID | roleName |
|---|---|
| 1 | Admin |
| 2 | Operator |
| 3 | Tourist |

#### Nationality
| Field | Type | Constraints | Notes |
|---|---|---|---|
| natID | INT | PK, NOT NULL, AUTO_INCREMENT | Unique identifier |
| cName | VARCHAR(100) | NOT NULL, UNIQUE | Country name |
| iso | CHAR(3) | UNIQUE | Alpha-2 or Alpha-3 ISO code |

#### Attraction
| Field | Type | Constraints | Notes |
|---|---|---|---|
| attrID | INT | PK, NOT NULL, AUTO_INCREMENT | Unique identifier |
| title | VARCHAR(255) | NOT NULL | Attraction name |
| descr | TEXT | NOT NULL | Description |
| catID | INT | NOT NULL, FK → AttrCategory | Classification |
| location | VARCHAR(255) | NOT NULL | City, District |
| basePrice | DECIMAL(10,2) | NOT NULL, CHECK ≥ 0 | Base visit price |

#### AttrCategory
| catID | catName |
|---|---|
| 1 | Archaeological |
| 2 | Marine |
| 3 | Wildlife |
| 4 | Cultural |

#### AttrMedia
| Field | Type | Constraints | Notes |
|---|---|---|---|
| mediaID | INT | PK, NOT NULL, AUTO_INCREMENT | Unique identifier |
| attrID | INT | NOT NULL, FK → Attraction | Parent attraction |
| mediaPath | VARCHAR(500) | NOT NULL | URL or file path |
| mediaType | VARCHAR(50) | NOT NULL | Image, video, etc. |
| displayOrder | INT | NOT NULL, DEFAULT 0, CHECK ≥ 0 | Front-end ordering |
| alt | VARCHAR(255) | NULL | Alt text |
| uploadedTime | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Telemetry |

#### Tour
| Field | Type | Constraints | Notes |
|---|---|---|---|
| tourID | INT | PK, NOT NULL, AUTO_INCREMENT | Unique identifier |
| attrID | INT | NOT NULL, FK → Attraction | Associated attraction |
| operatorID | INT | NOT NULL, FK → Operator | Tour operator |
| title | VARCHAR(255) | NOT NULL | Tour title |
| duration | INT | NOT NULL, CHECK > 0 | Length in hours |
| price | DECIMAL(10,2) | NOT NULL, CHECK ≥ 0 | Tour price |
| maxCap | INT | NOT NULL, CHECK > 0 | Seat limit |

#### Operator
| Field | Type | Constraints | Notes |
|---|---|---|---|
| operatorID | INT | PK, NOT NULL, AUTO_INCREMENT | Unique operator ID |
| companyName | VARCHAR(255) | NOT NULL, UNIQUE | Registered business name |
| contactEmail | VARCHAR(255) | NOT NULL | Business contact |
| phoneNum | VARCHAR(50) | NULL | Optional phone number |

#### Booking
| Field | Type | Constraints | Notes |
|---|---|---|---|
| bookingID | INT | PK, NOT NULL, AUTO_INCREMENT | Unique identifier |
| userID | INT | NOT NULL, FK → Users | User that booked |
| tourID | INT | NOT NULL, FK → Tour | Tour being booked |
| tourDate | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Date booked for |
| bookingDate | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Date booking was made |
| personCount | INT | NOT NULL, CHECK > 0 | Party size |
| price | DECIMAL(10,2) | NOT NULL, CHECK ≥ 0 | Calculated total |
| status | VARCHAR(50) | NOT NULL | Pending, Confirmed, Cancelled |

#### Payment
| Field | Type | Constraints | Notes |
|---|---|---|---|
| paymentID | INT | PK, NOT NULL, AUTO_INCREMENT | Unique ID |
| bookingID | INT | NOT NULL, FK → Booking | Related booking |
| amount | DECIMAL(10,2) | NOT NULL, CHECK ≥ 0 | Amount paid |
| method | VARCHAR(50) | NOT NULL | Credit, Debit, PayPal, etc. |
| success | BOOLEAN | NOT NULL | Successful or failed |
| date | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Transaction date |

#### Review
| Field | Type | Constraints | Notes |
|---|---|---|---|
| reviewID | INT | PK, NOT NULL, AUTO_INCREMENT | Unique ID |
| userID | INT | NOT NULL, FK → Users | Reviewer |
| tourID | INT | NOT NULL, FK → Tour | Tour reviewed |
| rating | DECIMAL(2,1) | NOT NULL, CHECK BETWEEN 1 AND 5 | 1–5 stars |
| comment | TEXT | NULL | Feedback |
| createdAt | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Time created |

#### Availability
| Field | Type | Constraints | Notes |
|---|---|---|---|
| availabilityID | INT | PK, NOT NULL, AUTO_INCREMENT | ID |
| tourID | INT | NOT NULL, FK → Tour | Related tour |
| date | DATE | NOT NULL | Available date |
| slots | INT | NOT NULL, CHECK ≥ 0 | Remaining capacity |
| UNIQUE(tourID, date) | — | Composite UNIQUE | Prevents date duplication |

---

### Relationships

| Tables | Type | Notes |
|---|---|---|
| User → Booking | 1-to-Many | One user can make multiple bookings |
| User → Review | 1-to-Many | A user can leave multiple reviews |
| User → Role | Many-to-1 | Many users share the same role |
| User → Nationality | Many-to-1 | Many users share the same nationality |
| Tour → Booking | 1-to-Many | Each tour can have multiple bookings |
| Tour → Availability | 1-to-Many | Each tour can have availability for multiple dates |
| Tour → Review | 1-to-Many | Multiple users can review the same tour |
| Tour → Operator | Many-to-1 | Multiple tours can belong to the same operator |
| Tour → Attraction | Many-to-1 | Multiple tours can be linked to the same attraction |
| Attraction → AttrMedia | 1-to-Many | An attraction can have many media items |
| Attraction → AttrCategory | Many-to-1 | Many attractions can belong to the same category |
| Booking → Payment | 1-to-1 | Each booking has one payment |
| Operator → Tour | 1-to-Many | One operator can run many tours |

---

### MySQL Schema

```sql
-- ROLE
CREATE TABLE Role (
  roleID INT AUTO_INCREMENT PRIMARY KEY,
  roleName VARCHAR(100) NOT NULL UNIQUE
);
INSERT INTO Role (roleID, roleName) VALUES (1,'Admin'),(2,'Operator'),(3,'Tourist');

-- NATIONALITY
CREATE TABLE Nationality (
  natID INT AUTO_INCREMENT PRIMARY KEY,
  cName VARCHAR(100) NOT NULL UNIQUE,
  iso CHAR(3) UNIQUE
);

-- USERS
CREATE TABLE Users (
  userID INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  passwordHash VARCHAR(255) NOT NULL,
  fName VARCHAR(50) NOT NULL,
  lName VARCHAR(50) NOT NULL,
  roleID INT NOT NULL,
  natID INT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (roleID) REFERENCES Role(roleID),
  FOREIGN KEY (natID) REFERENCES Nationality(natID)
);

-- ATTRACTION CATEGORY
CREATE TABLE AttrCategory (
  catID INT AUTO_INCREMENT PRIMARY KEY,
  catName VARCHAR(100) NOT NULL UNIQUE
);
INSERT INTO AttrCategory (catID, catName) VALUES
(1,'Archaeological'),(2,'Marine'),(3,'Wildlife'),(4,'Cultural');

-- ATTRACTION
CREATE TABLE Attraction (
  attrID INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  descr TEXT NOT NULL,
  catID INT NOT NULL,
  location VARCHAR(255) NOT NULL,
  basePrice DECIMAL(10,2) NOT NULL CHECK (basePrice >= 0),
  FOREIGN KEY (catID) REFERENCES AttrCategory(catID)
);

-- ATTRACTION MEDIA
CREATE TABLE AttrMedia (
  mediaID INT AUTO_INCREMENT PRIMARY KEY,
  attrID INT NOT NULL,
  mediaPath VARCHAR(500) NOT NULL,
  mediaType VARCHAR(50) NOT NULL,
  displayOrder INT NOT NULL DEFAULT 0 CHECK (displayOrder >= 0),
  alt VARCHAR(255),
  uploadedTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attrID) REFERENCES Attraction(attrID) ON DELETE CASCADE
);

-- OPERATOR
CREATE TABLE Operator (
  operatorID INT AUTO_INCREMENT PRIMARY KEY,
  companyName VARCHAR(255) NOT NULL UNIQUE,
  contactEmail VARCHAR(255) NOT NULL,
  phoneNum VARCHAR(50)
);

-- TOUR
CREATE TABLE Tour (
  tourID INT AUTO_INCREMENT PRIMARY KEY,
  attrID INT NOT NULL,
  operatorID INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  duration INT NOT NULL CHECK (duration > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  maxCap INT NOT NULL CHECK (maxCap > 0),
  FOREIGN KEY (attrID) REFERENCES Attraction(attrID),
  FOREIGN KEY (operatorID) REFERENCES Operator(operatorID)
);

-- BOOKING
CREATE TABLE Booking (
  bookingID INT AUTO_INCREMENT PRIMARY KEY,
  userID INT NOT NULL,
  tourID INT NOT NULL,
  tourDate DATE NOT NULL,
  bookingDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  personCount INT NOT NULL CHECK (personCount > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  status VARCHAR(50) NOT NULL,
  FOREIGN KEY (userID) REFERENCES Users(userID),
  FOREIGN KEY (tourID) REFERENCES Tour(tourID)
);

-- PAYMENT
CREATE TABLE Payment (
  paymentID INT AUTO_INCREMENT PRIMARY KEY,
  bookingID INT NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  method VARCHAR(50) NOT NULL,
  success BOOLEAN NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bookingID) REFERENCES Booking(bookingID) ON DELETE CASCADE
);

-- REVIEW
CREATE TABLE Review (
  reviewID INT AUTO_INCREMENT PRIMARY KEY,
  userID INT NOT NULL,
  tourID INT NOT NULL,
  rating DECIMAL(2,1) NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userID) REFERENCES Users(userID) ON DELETE CASCADE,
  FOREIGN KEY (tourID) REFERENCES Tour(tourID) ON DELETE CASCADE
);

-- AVAILABILITY
CREATE TABLE Availability (
  availabilityID INT AUTO_INCREMENT PRIMARY KEY,
  tourID INT NOT NULL,
  date DATE NOT NULL,
  slots INT NOT NULL CHECK (slots >= 0),
  UNIQUE(tourID, date),
  FOREIGN KEY (tourID) REFERENCES Tour(tourID)
);
```

---

## Architecture Design

### Architectural Style

The system follows a **Three-Tier Client-Server Architecture** with RESTful communication:

- **Presentation Layer** — Frontend
- **Application Layer** — Backend / API
- **Data Layer** — Database

This structure preserves modularity, scalability, maintainability, independent frontend/backend updates, and easier testing and deployment.

```
Client Devices (Browser / Mobile / Desktop)
            ↓ HTTPS
        Frontend (React / HTML / CSS / JS)
            ↓ API Calls
      Backend Server (Node.js / Express)
            ↓ SQL Queries
       SQL Database Server (MySQL)
```

---

### Presentation Layer (Frontend)

**Technology Stack:** HTML5, CSS3, JavaScript, React

**Responsibilities:**
- Render tourist information portal
- Display maps and multimedia
- Tour operator dashboards
- Booking interface
- Analytics visualisations
- Sustainability monitoring display
- Multi-language UI toggle
- Emergency services module interface

**Key Design Features:**
- Responsive, mobile-first design
- Reusable UI components
- API-driven dynamic content rendering
- Client-side form validation
- Secure token-based session handling

---

### Application Layer (Backend / API)

**Technology:** Node.js with Express.js, RESTful API, JSON data exchange

**Core Modules:**

1. **Authentication & Authorisation** — User roles (Admin, Operator, Tourist), password hashing and salting, JWT-based authentication
2. **Tourist Information Module** — CRUD for attractions, multimedia management, geo-location data
3. **Tour Operator Management** — Operator registration, licence validation, tour package creation, availability management
4. **Booking Management** — Simulated booking engine, seasonal pricing logic, capacity checks, confirmation generation
5. **Analytics & Reporting** — Visitor statistics, popular attraction metrics, seasonal trend simulation, dashboard aggregation
6. **Sustainability Monitoring** — Carbon footprint estimation, capacity tracking per site, environmental impact simulation
7. **Emergency Services** — Static and dynamic emergency contacts, location-based emergency info

---

### Data Layer (Database)

**Type:** Relational SQL — MySQL / PostgreSQL

**Design Principles:**
- 3rd Normal Form (3NF)
- Foreign key constraints
- Indexing on frequently queried columns
- Transaction control for booking operations
- Deadlock prevention through transaction isolation levels

---

### Deployment Options

**Option 1 — Raspberry Pi**
- 2GB RAM, Debian Server
- Nginx / Apache web server
- Node.js runtime
- SQL database
- Reverse proxy setup

**Option 2 — Cloud VM**
- Linux server
- HTTPS with SSL
- Domain integration
- Firewall configuration

---

### Security Architecture

- Password hashing (Argon2 / bcrypt)
- Input validation and sanitisation
- SQL injection prevention via prepared statements
- HTTPS encryption
- Session expiration
- Basic rate limiting

---

### Risk Mitigation

| Risk | Mitigation |
|---|---|
| Data integration complexity | Modular API design |
| Database deadlocks | Transaction isolation and indexing |
| Mobile compatibility | Responsive React components |
| Connectivity issues | Lightweight UI |
| Scope creep | Modular sprint-based implementation |

---

## System Specification

### Part 1 — Introduction

**Purpose:** This document defines the complete technical and functional specifications for the Tourist Tome IDMS. It describes system behaviour, module logic, data structures, security controls, performance standards, and deployment requirements. It serves as the authoritative technical contract for development, testing, and evaluation.

**Scope:** Tourist Tome is a web-based three-tier client-server system. It is delivered as a prototype and excludes real financial transactions and government API integrations.

**System Overview:** Three-tier architecture — Presentation Layer (React), Application Layer (REST API), Data Layer (Relational SQL). All frontend-to-backend communication is JSON over HTTPS.

---

### Part 2 — User Roles & Access Control

| Role | Level | Permissions |
|---|---|---|
| Admin | 1 | Full system control and analytics access |
| Operator | 2 | Manage tours and booking availabilities |
| Tourist | 3 | Browse, book, and review |

Role-based access is enforced at the API level using JWT authentication.

**Authentication Specifications:**
- Password hashing algorithm: **Argon2**
- JWT token expiration: **60 minutes**
- Refresh token: optional in prototype
- Account status enforcement: `active = TRUE`
- Login rate limiting: 5 failed attempts → temporary lock (15 minutes)

---

### Part 3 — Functional Specifications

#### Tourist Information Module
- View and filter attractions by category
- View media gallery, base price, and location
- Pagination: 10 per page
- Lazy loading images
- `GET /api/attractions` — HTTP 404 if not found

#### Tour Operator Management Module
- Operator registration with unique company name, contact email, and phone
- Tour creation requiring attrID, operatorID, duration > 0, price ≥ 0, maxCap > 0
- Operators may only edit their own tours

#### Booking Management Module *(Critical — Transactional Integrity)*

```
Step 1: Validate User
Step 2: Validate Tour
Step 3: Check Availability

IF slots >= personCount
  BEGIN TRANSACTION
    INSERT Booking
    UPDATE Availability.slots -= personCount
  COMMIT
ELSE
  Return HTTP 409 Conflict
```

- Transaction isolation level: **REPEATABLE READ**
- Booking status: `Pending | Confirmed | Cancelled`

**Seasonal Pricing:**

| Season | Months | Multiplier |
|---|---|---|
| Peak | December, January | 1.25× |
| Standard | All other months | 1.00× |
| Off-Peak | June, July, August | 0.85× |

Formula: `Total = Tour.price × personCount × SeasonalMultiplier`

#### Payment Module *(Simulated)*
- One-to-one with Booking
- No real payment gateway
- If `success = FALSE` → booking remains Pending

#### Availability Module
- Composite unique constraint: `UNIQUE(tourID, date)`
- Slots cannot drop below zero

#### Review Module
- Rating between 1.0 and 5.0
- One review per user per tour (composite unique index)
- Reviews visible publicly

#### Visitor Analytics Module
- Aggregated metrics: bookings by nationality, popular tours, seasonal demand, average spending
- Derived from Booking, User, Nationality, and Tour tables
- Dashboard queries are read-only and paginated

#### Sustainability Monitoring Module
- Carbon formula: `CarbonScore = personCount × tour.duration × EmissionFactor`
- EmissionFactor varies by tour type (Marine, Wildlife, Cultural)
- Capacity threshold flag: if `Slots / maxCap < 10%` → attraction flagged as nearing capacity

#### Emergency Services Module
- Static emergency contacts with location-based filtering
- Tourist Police references
- All features available **without authentication**

---

### Part 4 — Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | API response ≤ 2s, page load ≤ 3s, 50 concurrent users |
| Security | HTTPS, Argon2, prepared statements, input sanitisation, JWT, RBAC, soft-delete |
| Reliability | Transaction rollback on failure, deadlock mitigation, error logging, DB backup |
| Scalability | Stateless REST API, modular backend, FK indexing, cloud-ready, reverse proxy |
| Usability | Mobile-first, responsive, multi-language, accessible alt text, intuitive navigation |
| Browsers | Chrome, Firefox, Edge, Safari |
| Devices | Desktop, Tablet, Smartphone |

---

### Part 5 — Database Specification

- **Type:** MySQL / PostgreSQL
- **Normalisation:** 3NF
- **Indexes:** userID, tourID, attrID, bookingDate, Nationality
- **Transaction Control:** REPEATABLE READ for booking operations
- **Constraints:** Foreign keys, CHECK constraints, UNIQUE constraints, composite uniqueness on availability

---

### Part 6 — API Specification

| Method | Endpoint | Auth | Role |
|---|---|---|---|
| POST | `/api/login` | No | All |
| GET | `/api/attractions` | No | Public |
| POST | `/api/bookings` | Yes | Tourist |
| POST | `/api/tours` | Yes | Operator |
| GET | `/api/analytics` | Yes | Admin |

**Error Codes:**

| Code | Meaning |
|---|---|
| 400 | Bad Request |
| 401 | Unauthorised |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal Server Error |

---

### Part 7 — Deployment

**Option 1 — Raspberry Pi:** 2GB RAM, Debian, Nginx reverse proxy, Node.js, SQL database

**Option 2 — Cloud VM:** Linux, SSL certificate, domain integration, firewall rules, HTTPS enforced

---

### Part 8 — Testing

**Unit Testing:** Booking calculation, availability reduction, authentication validation

**Integration Testing:** Booking → Payment → Availability flow, Tour → Review linkage, role enforcement

**Load Testing:** Simulated concurrent booking attempts, deadlock validation

---

### Part 9 — Constraints & Assumptions

- Mock data usage
- No real financial transactions
- Academic time constraints
- No live airline integration

---

### Part 10 — Success Criteria

The system is considered successful if:

- All modules function as specified
- Database integrity is maintained
- Booking prevents overcapacity
- Security standards are implemented
- Documentation is complete