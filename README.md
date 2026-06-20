# Smart Dairy - Full Stack Project Setup

Smart Dairy is a full stack starter project with a Spring Boot backend and React frontend.

## Tech Stack

### Backend
- Java Spring Boot
- Maven
- MySQL
- Spring Web
- Spring Data JPA
- Spring Security + JWT
- Validation
- Lombok
- Swagger / OpenAPI

### Frontend
- React (Vite)
- Tailwind CSS
- React Router
- Axios

## Project Structure

```text
smart-dairy/
├── pom.xml
├── src/main/java/com/smartdairy/
│   ├── SmartDairyApplication.java
│   ├── config/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   ├── exception/
│   ├── repository/
│   ├── security/
│   └── service/
│       └── impl/
│
├── src/main/resources/
│   └── application.properties
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── components/
        │   └── Navbar.jsx
        ├── pages/
        │   ├── LandingPage.jsx
        │   └── HomePage.jsx
        └── services/
            └── api.js
```

## Backend Configuration

`src/main/resources/application.properties` includes:
- MySQL datasource URL, username, password
- JPA settings
- JWT secret and expiration
- Swagger OpenAPI paths

Update these values as needed for your local environment:

```properties
spring.datasource.username=root
spring.datasource.password=root
```

## Run Backend

```bash
./mvnw spring-boot:run
```

Swagger UI:
- [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:
- [http://localhost:5173](http://localhost:5174)

## Initial Features Included

- Layered backend architecture with packages:
  - `controller`
  - `service`
  - `repository`
  - `entity`
  - `dto`
  - `security`
  - `config`
  - `exception`
- JWT authentication endpoints:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
- Role-based secure endpoints:
  - `GET /api/secure/farmer` (FARMER, ADMIN)
  - `GET /api/secure/admin` (ADMIN)
- Public and private home endpoints
- React pages:
  - Landing page
  - Home page UI
  - Login page
  - Register page
  - Admin page
- Navigation bar with route links
- Local storage based auth persistence and protected frontend routes
