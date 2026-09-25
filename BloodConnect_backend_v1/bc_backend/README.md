# BloodConnect Backend - V1

Spring Boot 3.5 + Java 21 + MySQL + WebSocket/STOMP.

## 1. Database
Create the database:

```sql
CREATE DATABASE bloodconnect;
```

Or run `database/schema.sql` in MySQL Workbench.

Then edit `src/main/resources/application.properties` and replace `CHANGE_ME` with your MySQL root password.

## 2. Run
Use Eclipse/STS as a Maven project and run `BloodConnectApplication.java` as Spring Boot App, or from a terminal with Maven:

```bash
mvn spring-boot:run
```

Backend: http://localhost:8080

## 3. Seeded accounts
Admin: admin@bloodconnect.com / admin123
Donor: arun@bloodconnect.com / demo123
Receiver: karthik@bloodconnect.com / demo123

Passwords are BCrypt-hashed in the database.

## 4. Main API endpoints
POST `/api/auth/register`
POST `/api/auth/login`
POST `/api/requests?receiverId={id}`
GET `/api/requests/active`
GET `/api/requests/matching?bloodGroup=O%2B`
PUT `/api/requests/{id}/accept?donorId={id}`
GET `/api/donors/matching?bloodGroup=O%2B`
PUT `/api/donors/{id}/availability?available=true`
GET `/api/chats/{requestId}`
POST `/api/chats/{requestId}?senderId={id}`

## 5. Real-time chat
WebSocket/STOMP endpoint: `ws://localhost:8080/ws`
Subscribe: `/topic/requests/{requestId}`
Send: `/app/chat/{requestId}` with JSON:
`{"senderId":1,"content":"Hello"}`

The current V1 is intentionally permissive at the HTTP security layer because the next step is to connect the existing React session to proper JWT authentication. Do not deploy this version publicly yet.
