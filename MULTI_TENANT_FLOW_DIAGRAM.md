# Multi-Tenant Architecture Flow Diagram

## Complete Request Flow with Data Isolation

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT REQUEST                                          │
│                         (Frontend React Application)                                  │
└─────────────────────────────────┬───────────────────────────────────────────────────┘
                                  │
                                  │ HTTP Request with JWT Token
                                  │ Authorization: Bearer <token>
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         JWT AUTHENTICATION FILTER                                     │
│                    (JwtAuthenticationFilter.java)                                    │
└─────────────────────────────────┬───────────────────────────────────────────────────┘
                                  │
                                  │ 1. Extract JWT from header
                                  │ 2. Validate token signature & expiry
                                  │ 3. Extract username (email) from token
                                  │ 4. Load UserDetails from database
                                  │ 5. Set SecurityContextHolder
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         SECURITY CONTEXT                                             │
│                    (SecurityContextHolder)                                            │
│                         Authentication Object                                         │
│                    ┌─────────────────────────┐                                       │
│                    │ Principal: User email    │                                       │
│                    │ Authorities: ROLE_ADMIN  │                                       │
│                    │ Authenticated: true      │                                       │
│                    └─────────────────────────┘                                       │
└─────────────────────────────────┬───────────────────────────────────────────────────┘
                                  │
                                  │ Controller receives request
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         CONTROLLER LAYER                                              │
│                    (FarmerController, etc.)                                          │
│                         @RestController                                              │
└─────────────────────────────────┬───────────────────────────────────────────────────┘
                                  │
                                  │ Calls Service Layer
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         SERVICE LAYER                                                 │
│                    (FarmerServiceImpl.java)                                           │
└─────────────────────────────────┬───────────────────────────────────────────────────┘
                                  │
                                  │ Step 1: Get Current Logged-in Admin
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│   SecurityUtil           │    │   UserServiceImpl       │
│   getCurrentUsername()   │───▶│   getLoggedInUser()      │
│                          │    │                          │
│ Extracts email from       │    │ 1. Get email from       │
│ SecurityContextHolder    │    │    SecurityUtil          │
└──────────────────────────┘    │ 2. Query User by email   │
                                 │    from UserRepository  │
                                 │ 3. Return User entity   │
                                 └──────────┬──────────────┘
                                            │
                                            │ Returns User (admin)
                                            │
                    ┌───────────────────────┴───────────────┐
                    │                                       │
                    ▼                                       ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│   CREATE OPERATION       │    │   READ OPERATION         │
│   createFarmer()         │    │   getFarmerById()        │
└──────────────────────────┘    └──────────────────────────┘
                    │                                       │
                    │                                       │
                    │ 1. farmer.setAdmin(admin)             │ 1. admin = getLoggedInUser()
                    │ 2. farmerRepository.save()           │ 2. findByIdAndAdmin(id, admin)
                    │                                       │
                    ▼                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         REPOSITORY LAYER                                               │
│                    (FarmerRepository.java)                                            │
└─────────────────────────────────┬───────────────────────────────────────────────────┘
                                  │
                                  │ CREATE:                 READ:
                                  │ INSERT INTO farmers     SELECT * FROM farmers
                                  │ (admin_id, ...)         WHERE id = ? AND admin_id = ?
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         DATABASE                                                      │
│                    ┌─────────────────────────┐                                       │
│                    │   farmers table         │                                       │
│                    │ ┌─────────────────────┐ │                                       │
│                    │ │ id (PK)             │ │                                       │
│                    │ │ admin_id (FK) ◄─────│ │─── Tenant Identifier                │
│                    │ │ full_name           │ │                                       │
│                    │ │ mobile_number       │ │                                       │
│                    │ │ aadhaar_number      │ │                                       │
│                    │ │ ...                 │ │                                       │
│                    │ └─────────────────────┘ │                                       │
│                    │                          │                                       │
│                    │   UNIQUE CONSTRAINT:      │                                       │
│                    │   (admin_id, aadhaar)     │                                       │
│                    │                          │                                       │
│                    │   INDEXES:                │                                       │
│                    │   idx_admin_id            │                                       │
│                    └─────────────────────────┘                                       │
│                                                                                      │
│   Similar pattern for:                                                               │
│   - milk_collections (admin_id FK)                                                   │
│   - payments (admin_id FK)                                                          │
│   - farmer_bills (admin_id FK)                                                      │
│   - feed_purchases (admin_id FK)                                                    │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Query Results
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│   Entity with admin set   │    │   Only admin's data      │
│   returned to service     │    │   returned to service     │
└──────────────────────────┘    └──────────────────────────┘
                    │                           │
                    └─────────────┬─────────────┘
                                  │
                                  │ DTO Response
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         RESPONSE TO CLIENT                                            │
│                    JSON Response with tenant-specific data                            │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Authentication Flow Detail

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         LOGIN REQUEST                                                 │
│                    POST /api/auth/login                                               │
│                    { email, password }                                                │
└─────────────────────────────────┬───────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         AUTH SERVICE                                                   │
│                    (AuthServiceImpl.login())                                           │
└─────────────────────────────────┬───────────────────────────────────────────────────┘
                                  │
                                  │ 1. AuthenticationManager.authenticate()
                                  │    - Validates email/password
                                  │    - Throws if invalid
                                  │
                                  │ 2. userRepository.findByEmail()
                                  │    - Fetches User entity
                                  │
                                  │ 3. jwtService.generateToken(user)
                                  │    - Creates JWT with:
                                  │      Subject: user.getEmail()
                                  │      IssuedAt: now
                                  │      Expiration: now + jwtExpirationMs
                                  │      Signed with HS256 secret key
                                  │
                                  │ 4. Returns AuthResponse:
                                  │    { token, email, role }
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         CLIENT STORES TOKEN                                           │
│                    localStorage / cookie                                               │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Data Isolation Mechanisms

### 1. Entity Level
```java
@Entity
@Table(name = "farmers",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_farmers_admin_aadhaar", 
        columnNames = {"admin_id", "aadhaar_number"}
    ),
    indexes = @Index(name = "idx_farmers_admin_id", columnList = "admin_id"))
public class Farmer {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "admin_id", nullable = false)
    private User admin;  // ← Tenant identifier
}
```

### 2. Repository Level
```java
public interface FarmerRepository extends JpaRepository<Farmer, Long> {
    // All queries include admin parameter
    List<Farmer> findByAdmin(User admin);
    Optional<Farmer> findByIdAndAdmin(Long id, User admin);
    boolean existsByIdAndAdmin(Long id, User admin);
    List<Farmer> searchByAdmin(User admin, String query);
}
```

### 3. Service Level
```java
@Service
public class FarmerServiceImpl {
    @Override
    public FarmerResponse createFarmer(FarmerRequest request) {
        User admin = userService.getLoggedInUser();  // ← Get current tenant
        Farmer farmer = mapToEntity(new Farmer(), request);
        farmer.setAdmin(admin);                       // ← Associate with tenant
        return farmerRepository.save(farmer);
    }
    
    @Override
    public FarmerResponse getFarmerById(Long id) {
        User admin = userService.getLoggedInUser();  // ← Get current tenant
        return farmerRepository.findByIdAndAdmin(id, admin)  // ← Filter by tenant
            .orElseThrow(() -> new ResourceNotFoundException(...));
    }
}
```

### 4. Security Level
```java
public class SecurityUtil {
    public static String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();  // Returns email from JWT
    }
}

@Service
public class UserServiceImpl {
    public User getLoggedInUser() {
        String email = SecurityUtil.getCurrentUsername();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException(...));
    }
}
```

## Key Components Summary

| Component | Responsibility | File |
|-----------|---------------|------|
| **JwtAuthenticationFilter** | Validates JWT, sets SecurityContext | `security/JwtAuthenticationFilter.java` |
| **JwtService** | Generates/validates JWT tokens | `security/JwtService.java` |
| **CustomUserDetailsService** | Loads User from database | `security/CustomUserDetailsService.java` |
| **SecurityUtil** | Extracts current username from SecurityContext | `security/SecurityUtil.java` |
| **UserServiceImpl** | Gets logged-in User entity | `service/impl/UserServiceImpl.java` |
| **Entity Classes** | Store admin_id as tenant identifier | `entity/*.java` |
| **Repository Interfaces** | Filter queries by admin_id | `repository/*.java` |
| **Service Classes** | Enforce tenant isolation in business logic | `service/impl/*.java` |

## Tenant Isolation Guarantees

1. **Authentication**: Only valid JWT tokens can access the system
2. **Authorization**: SecurityContext always contains the current user
3. **Data Association**: Every entity creation includes admin_id
4. **Query Filtering**: All repository queries include admin_id in WHERE clause
5. **Database Constraints**: Unique constraints include admin_id to prevent cross-tenant conflicts
6. **Indexing**: admin_id indexed for query performance

## Example SQL Queries Generated

```sql
-- Create farmer (automatically includes admin_id)
INSERT INTO farmers (admin_id, full_name, mobile_number, ...)
VALUES (123, 'John Doe', '9876543210', ...);

-- Get farmer by ID (filtered by admin)
SELECT * FROM farmers 
WHERE id = 456 AND admin_id = 123;

-- Search farmers (filtered by admin)
SELECT * FROM farmers 
WHERE admin_id = 123 
  AND (LOWER(full_name) LIKE '%john%' OR LOWER(village) LIKE '%john%');

-- Count farmers (filtered by admin)
SELECT COUNT(*) FROM farmers WHERE admin_id = 123;
```

## Security Benefits

- **Complete Data Isolation**: Each tenant (admin) can only access their own data
- **No Cross-Tenant Leaks**: Database queries always include tenant filter
- **Performance**: Indexed admin_id ensures fast queries
- **Scalability**: Same database serves multiple tenants securely
- **Audit Trail**: Every record has admin_id for tracking
