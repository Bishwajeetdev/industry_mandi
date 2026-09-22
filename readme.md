# TECHNICAL PRODUCT COMPARISON & MARKETPLACE PLATFORM

Build a complete, scalable, production-ready web application for a **Technical Product Comparison, Ranking, Price Comparison, and Marketplace Platform**.

The platform should allow buyers to discover technical products, compare multiple products based on specifications and performance, receive an AI-assisted ranking, find the best available price, and purchase products through approved vendors.

The system should support three types of users:

1. Admin
2. Vendor
3. Buyer

The application should have a modern, professional technology-focused UI and be completely responsive across desktop, tablet, and mobile.

---

# 1. TECHNOLOGY STACK

Use the following technologies:

## Frontend

* HTML5
* CSS3
* Bootstrap 5
* JavaScript
* React.js
* React Router
* Axios
* Bootstrap Icons or another suitable icon library

Use React for application logic and reusable components.

Use Bootstrap for responsive layouts and UI components.

Use custom CSS where required to create a premium and unique design.

---

## Backend

Use:

* Node.js
* Express.js
* RESTful API architecture
* JavaScript
* JWT-based authentication
* bcrypt/bcryptjs for password hashing
* Express middleware
* Server-side validation

Important:

Do NOT use PHP anywhere in the project.

React should communicate with Node.js/Express through REST APIs.

Architecture:

React → Axios → Node.js/Express REST API → MongoDB

---

## Database

Use:

* MongoDB
* Mongoose
* DBMS principles for database design

Design the database in a modular way so that the application can scale to millions of products and users.

---

## AI

Integrate AI into meaningful parts of the platform.

AI should not be added merely as a decorative chatbot.

AI can be used for:

* Product comparison assistance
* Product recommendation
* Natural-language product search
* Product specification extraction
* Product description generation
* Product categorization
* Similar-product detection
* Comparison summaries
* Personalized recommendations
* Review summarization
* Price/deal analysis

The AI layer should be modular so that an external AI provider/API can be replaced later.

---

# 2. MAIN OBJECTIVE

The main purpose of the platform is:

> "Help users research, compare, rank, and purchase technical products from verified vendors."

Example:

A buyer searches for:

"Best gaming laptops under ₹80,000"

The system should return relevant products.

The buyer can select:

* Product A
* Product B
* Product C
* Product D

The platform compares them and generates a ranking:

1. Product B
2. Product D
3. Product A
4. Product C

The ranking should be based on a transparent scoring system using configurable criteria such as:

* Performance
* Price
* Specifications
* Features
* User rating
* Value for money
* Battery
* Display
* Build quality
* Other category-specific specifications

IMPORTANT:

The ranking system must NOT simply depend on AI.

Create a deterministic scoring engine where the administrator can configure category-specific weights.

AI can provide an additional explanation such as:

"Product B ranked highest because it provides stronger performance and a better price-to-performance ratio."

---

# 3. USER ROLES

Implement three primary roles.

## ADMIN

Admin has complete control over the platform.

Admin dashboard should include:

* Dashboard overview
* User management
* Buyer management
* Vendor management
* Product management
* Product approval
* Product pairing approval
* Category management
* Brand management
* Comparison management
* Ranking configuration
* Vendor management
* Price management
* Review management
* AI configuration
* Reports
* Analytics
* Platform settings

---

# 4. VENDOR

Vendors can:

* Register
* Login
* Manage profile
* Submit products
* Pair products with existing products
* Add product prices
* Update inventory
* Update product information
* View approval status
* View rejected submissions
* View sales/referral information
* View analytics

Vendor registration should NOT automatically activate the account.

The vendor account must require:

Admin approval.

Vendor status:

* Pending
* Approved
* Rejected
* Suspended

---

# 5. BUYER

Buyers can:

* Register
* Login
* Browse products
* Search products
* Filter products
* Sort products
* Compare products
* View product specifications
* View prices
* View vendors
* View reviews
* Add products to wishlist
* Save comparisons
* View recently viewed products
* Receive AI recommendations
* Ask AI product questions

No OTP verification is required.

Authentication should use:

Email + Password

with secure password hashing.

---

# 6. AUTHENTICATION

Create authentication for:

* Admin
* Vendor
* Buyer

Use:

* Node.js
* Express.js
* JWT
* bcrypt/bcryptjs
* Authentication middleware
* Role-based authorization middleware

Login page should allow users to select or automatically detect their role.

Requirements:

* Password hashing
* JWT authentication
* Protected routes
* Role-based authorization
* Logout
* Password reset mechanism
* Account status validation

Do NOT implement OTP verification.

---

# 7. ADMIN APPROVAL SYSTEM

Admin approval is mandatory for vendor accounts and vendor-submitted products.

Workflow:

Vendor registers

↓

Status = Pending

↓

Admin reviews vendor

↓

Admin approves/rejects

↓

If approved → Vendor can access vendor dashboard

---

# 8. PRODUCT MANAGEMENT

Products should contain structured technical information.

Example product:

```javascript
{
  name,
  brand,
  model,
  category,
  subcategory,
  description,
  images,
  specifications,
  releaseDate,
  rating,
  reviewCount,
  status
}
```

Specifications must be flexible.

Do NOT create a database that only works for laptops.

The system should support different specifications for different categories.

For example:

Laptop:

* Processor
* RAM
* Storage
* GPU
* Display
* Battery
* Weight

Smartphone:

* Processor
* RAM
* Storage
* Display
* Camera
* Battery
* Charging
* Operating System

GPU:

* VRAM
* CUDA cores
* Clock speed
* Architecture
* TDP
* Memory type

Use a flexible MongoDB specification structure.

---

# 9. PRODUCT SUBMISSION BY VENDOR

Vendor should be able to submit a product.

Vendor enters:

* Product name
* Brand
* Model number
* Category
* Description
* Specifications
* Images
* Price
* Stock
* Product URL

Submission status:

* Pending
* Approved
* Rejected
* Changes Requested

Vendor cannot publish products directly.

---

# 10. EXISTING PRODUCT PAIRING

This is a critical feature.

If a vendor wants to sell a product that already exists in the platform database, the vendor should NOT create a duplicate product.

Example:

Existing platform product:

"Samsung Galaxy S26 256GB"

Vendor submits:

"Samsung Galaxy S26 256GB"

The system should identify a possible existing product.

Show:

"Possible existing products"

Vendor can request:

"Pair with existing product"

Admin reviews the pairing request.

Admin can:

* Approve pairing
* Reject pairing
* Request changes

Once approved, the vendor becomes a seller/vendor for that existing product.

---

# 11. AI PRODUCT MATCHING

Use AI to assist product pairing.

When a vendor submits:

"Samsung Galaxy S26 256 GB Black"

The system should search existing products and identify potential matches.

Matching factors:

* Brand
* Product name
* Model number
* Variant
* Storage
* RAM
* Technical specifications

Return:

Match confidence:

95%

Potential match:

Samsung Galaxy S26 256GB

Admin must still approve the pairing.

AI should assist the admin rather than automatically publish or merge products.

---

# 12. PRODUCT COMPARISON

Allow users to compare:

2 to 5 products.

Example:

Laptop A
Laptop B
Laptop C
Laptop D

Create a detailed comparison table.

Comparison sections:

### Basic Information

* Brand
* Model
* Release date
* Price
* Rating

### Performance

* Processor
* CPU cores
* GPU
* RAM
* Storage
* Benchmark data

### Display

* Display size
* Resolution
* Panel type
* Refresh rate
* Brightness
* HDR
* Color coverage

### Battery

* Capacity
* Estimated battery life
* Charging

### Connectivity

* WiFi
* Bluetooth
* USB
* HDMI
* Other ports

### Physical

* Weight
* Dimensions
* Build material

Specifications should automatically change based on the category.

---

# 13. PRODUCT RANKING SYSTEM

If the user compares four products, rank them from:

1 → 4

Example:

Product A
Product B
Product C
Product D

Result:

# Comparison Ranking

🥇 Product B
Score: 91/100

🥈 Product A
Score: 87/100

🥉 Product D
Score: 82/100

4. Product C
   Score: 76/100

Do NOT use arbitrary AI-generated rankings.

Create a transparent scoring algorithm.

Example:

Overall Score =

Performance × 30%

Price/Value × 25%

Features × 15%

User Rating × 15%

Build Quality × 10%

Battery × 5%

These weights should be configurable by Admin.

Different categories should have different weights.

Example:

Laptop:

Performance: 30%
Display: 15%
Battery: 15%
Price: 25%
Build: 10%
Features: 5%

Smartphone:

Performance: 20%
Camera: 20%
Display: 15%
Battery: 15%
Price: 20%
Build: 10%

Admin should be able to modify these weights.

---

# 14. AI COMPARISON SUMMARY

After the ranking, generate an AI-assisted summary.

Example:

"Product B ranks first because it offers the strongest performance-to-price ratio among the four products. Product A has a better display, while Product D offers stronger battery life."

Include:

* Overall score explanation
* Performance comparison
* Value comparison
* Important differences
* Who should buy each product

AI must use actual database specifications.

Do not allow AI to invent specifications.

---

# 15. BEST PRICE SYSTEM

After comparison, display:

# Best Available Price

Example:

Product B

Amazon — ₹74,999
Flipkart — ₹76,499
Vendor X — ₹72,999
Vendor Y — ₹75,200

Best available price:

₹72,999

Seller:

Vendor X

Include:

* Price
* Seller
* Stock status
* Last updated
* Shipping information
* Buy button

The system should identify the lowest valid available price from approved sellers.

---

# 16. MARKETPLACE

The platform should support multiple vendors selling the same product.

Important architecture:

PRODUCT

↓

Multiple VENDORS

↓

Multiple OFFERS

Example:

Product:

iPhone XYZ

Offers:

Vendor A — ₹70,000
Vendor B — ₹69,500
Vendor C — ₹71,200

The product page should show:

"Compare Prices"

with all approved offers.

---

# 17. VENDOR OFFER SYSTEM

Each offer should contain:

* Product ID
* Vendor ID
* Price
* Discount
* Stock status
* SKU
* Seller URL
* Shipping cost
* Delivery estimate
* Warranty
* Offer status
* Last updated

Only approved vendors and approved offers should appear publicly.

---

# 18. PRODUCT PAGE

Create a detailed product page.

Example:

/product/apple-macbook-air-m4

Include:

* Product images
* Product name
* Brand
* Rating
* Technical specifications
* Pros
* Cons
* AI summary
* Price comparison
* Available sellers
* Price history
* Reviews
* Related products
* Compare button
* Wishlist button
* Buy button

---

# 19. SEARCH SYSTEM

Create advanced product search.

Search by:

* Product name
* Brand
* Model
* Specification
* Category

Example:

"16GB RTX laptop under 80000"

The system should understand:

RAM = 16GB
GPU = RTX
Price <= ₹80,000
Category = Laptop

Use AI/NLP to convert natural language into search filters where possible.

---

# 20. FILTER SYSTEM

Implement dynamic filters.

Examples:

Price

Brand

Rating

RAM

Storage

Processor

GPU

Display

Battery

Availability

Vendor

Discount

Filters must be category-specific.

---

# 21. AI PRODUCT RECOMMENDATION

Add an AI recommendation assistant.

Example user query:

"I need a laptop for video editing under ₹80,000."

AI should analyze the product database and return relevant products.

The AI must only recommend products that actually exist in the database.

Display:

Product
Price
Important specifications
Why it matches
Limitations

---

# 22. AI CHAT ASSISTANT

Create a technical shopping assistant.

Example:

User:

"Which laptop is better for programming?"

AI:

"Based on your selected products, Product A has a stronger CPU while Product B has better battery life..."

The AI should be connected to the product database.

It should answer questions based on available product data.

If information is unavailable, it should explicitly say:

"Information not available."

Never hallucinate technical specifications.

---

# 23. AI PRODUCT DESCRIPTION

When vendors submit a product, AI can assist with:

* Product description
* Feature summary
* Specification formatting
* SEO title
* Meta description
* Search keywords

Vendor should be able to review/edit AI-generated content before submission.

---

# 24. REVIEW SYSTEM

Buyers can submit reviews.

Review fields:

* Rating
* Title
* Review
* Pros
* Cons

Review moderation should be available to Admin.

AI can summarize reviews:

Example:

"Users generally praise the display and performance, while some mention average battery life."

Clearly distinguish AI summaries from verified user reviews.

---

# 25. PRICE HISTORY

Store historical price information.

Example:

September 1 — ₹79,999

September 10 — ₹77,999

September 20 — ₹74,999

Create a price history graph.

Display:

Current price

Lowest recorded price

Highest recorded price

Price change

---

# 26. WISHLIST

Buyers can add products to:

Wishlist

Allow:

* Add
* Remove
* View wishlist
* Compare wishlist products

---

# 27. DATABASE COLLECTIONS

Create MongoDB collections using Mongoose models such as:

users

vendors

buyers

admins

products

categories

brands

productVariants

vendorOffers

productPairingRequests

productSubmissions

comparisons

reviews

wishlists

priceHistory

aiRecommendations

notifications

auditLogs

rankingConfigurations

Use indexes for:

* Product name
* Brand
* Model
* Category
* Vendor
* Price
* Search fields

---

# 28. ADMIN DASHBOARD

Create a professional dashboard.

Dashboard cards:

Total Users

Total Vendors

Pending Vendors

Total Products

Pending Products

Pairing Requests

Pending Reviews

Active Offers

Total Comparisons

Revenue/Referral Metrics

Charts:

* User growth
* Product growth
* Vendor growth
* Popular products
* Popular categories
* Most compared products
* Price trends

---

# 29. VENDOR DASHBOARD

Dashboard should show:

Products

Pending Products

Approved Products

Rejected Products

Offers

Sales/Clicks

Product Pairing Requests

Revenue/Commission

Profile

Notifications

---

# 30. BUYER DASHBOARD

Buyer dashboard:

Profile

Wishlist

Saved Comparisons

Recently Viewed

Reviews

Recommendations

Notifications

---

# 31. NOTIFICATION SYSTEM

Create notifications for:

Vendor approval

Product approval

Product rejection

Pairing approval

Pairing rejection

Review moderation

Price drop

System announcements

---

# 32. SECURITY

Implement:

* Password hashing
* Input validation
* API validation
* Role-based access control
* Protected APIs
* MongoDB injection prevention
* XSS protection
* CORS configuration
* CSRF protection where applicable
* Secure environment variables
* Rate limiting
* File upload validation
* Image type validation
* Admin audit logs

Never expose:

* Database credentials
* API keys
* AI API keys
* JWT secrets

Use environment variables.

---

# 33. RESPONSIVE UI

The UI must work perfectly on:

* Desktop
* Laptop
* Tablet
* Mobile

Use Bootstrap's responsive grid.

Create reusable React components.

Examples:

Navbar

Footer

ProductCard

ProductGrid

ComparisonTable

PriceCard

FilterSidebar

SearchBar

RatingStars

ProductSpecs

VendorCard

ReviewCard

AIChat

Pagination

Modal

Toast

LoadingState

EmptyState

ErrorState

---

# 34. UI DESIGN

Create a premium technical marketplace aesthetic.

Design characteristics:

* Clean
* Modern
* Professional
* Technology-focused
* Fast
* Minimal
* Data-rich

Use:

* White/light backgrounds where appropriate
* Dark technical sections
* Cards
* Subtle shadows
* Rounded corners
* Clear typography
* Data visualization
* Responsive tables

Avoid excessive animations.

Prioritize usability and performance.

---

# 35. FRONTEND ROUTES

Create routes such as:

/

/login

/register

/products

/products/:category

/product/:slug

/compare

/search

/wishlist

/reviews

/dashboard

/dashboard/buyer

/vendor

/vendor/products

/vendor/products/add

/vendor/offers

/vendor/pairing

/admin

/admin/users

/admin/vendors

/admin/products

/admin/pairing

/admin/reviews

/admin/categories

/admin/brands

/admin/ranking

/admin/settings

---

# 36. BACKEND API STRUCTURE

Build all APIs using Node.js + Express.js.

Create REST APIs such as:

POST /api/auth/register

POST /api/auth/login

POST /api/auth/logout

POST /api/auth/refresh

GET /api/products

GET /api/products/:id

POST /api/products

PUT /api/products/:id

DELETE /api/products/:id

GET /api/products/search

GET /api/products/compare

POST /api/comparisons

GET /api/products/:id/offers

POST /api/vendor/products

POST /api/vendor/pairing

GET /api/vendor/offers

POST /api/reviews

GET /api/reviews

POST /api/admin/products/:id/approve

POST /api/admin/products/:id/reject

POST /api/admin/vendors/:id/approve

POST /api/admin/pairing/:id/approve

Create separate:

* Controllers
* Routes
* Models
* Middleware
* Services
* Utilities

Do not put all backend logic inside a single server.js file.

---

# 37. API RESPONSE FORMAT

Use a consistent JSON structure.

Success:

```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Product not found",
  "error": {}
}
```

Use appropriate HTTP status codes.

---

# 38. AI ARCHITECTURE

Create a dedicated AI service layer.

Example:

/backend/services/ai/

aiService.js

productRecommendation.js

productMatching.js

comparisonSummary.js

reviewSummary.js

naturalLanguageSearch.js

AI should never directly modify production database records without validation.

Recommended workflow:

User/Vendor

↓

AI Service

↓

Validate AI response

↓

Business Logic

↓

Database

For product pairing:

Vendor Product

↓

AI Matching

↓

Potential Matches

↓

Admin Approval

↓

Database

---

# 39. SEO

Implement SEO-friendly pages.

Each product should have:

SEO title

Meta description

Canonical URL

Open Graph metadata

Structured data/schema markup

SEO-friendly URL:

/product/samsung-galaxy-s26-256gb

Category URL:

/laptops

Comparison URL:

/compare/macbook-air-m4-vs-dell-xps-14

Generate dynamic metadata using product information.

---

# 40. PERFORMANCE

Optimize for:

* Fast page loading
* Lazy loading
* Image optimization
* API caching
* Database indexing
* Pagination
* Debounced search
* Efficient MongoDB queries

Do not load thousands of products on one page.

Use pagination or infinite scrolling.

---

# 41. ADMIN RANKING CONFIGURATION

Create an admin interface where administrators can configure ranking weights.

Example:

Laptop Ranking:

Performance = 30%

Price = 25%

Display = 15%

Battery = 15%

Build = 10%

Features = 5%

Ensure:

Total = 100%

The ranking engine should automatically use these weights.

---

# 42. COMPARISON RESULT UX

When users compare products, create a visually clear result.

Example:

COMPARISON

Product A | Product B | Product C | Product D

Overall Score:

87 | 92 | 81 | 85

Ranking:

#2 | #1 | #4 | #3

Then show:

Performance

Display

Battery

Value

Features

Price

Highlight meaningful differences rather than simply coloring every different value.

---

# 43. BEST PRICE LOGIC

For each product:

Retrieve all approved vendor offers.

Filter:

Active = true

Stock = available

Vendor = approved

Then:

```javascript
const lowestPrice = Math.min(
  ...validOffers.map(offer => offer.price)
);
```

Display the corresponding seller.

Do not display rejected, inactive, or unapproved offers.

---

# 44. MARKETPLACE

The platform should support multiple vendors selling the same product.

Important architecture:

PRODUCT

↓

Multiple VENDORS

↓

Multiple OFFERS

Example:

Product:

iPhone XYZ

Offers:

Vendor A — ₹70,000
Vendor B — ₹69,500
Vendor C — ₹71,200

The product page should show:

"Compare Prices"

with all approved offers.

---

# 45. ADMIN AUDIT LOG

Track important actions:

Admin login

Vendor approval

Vendor rejection

Product approval

Product rejection

Product pairing

Product editing

Ranking configuration changes

User suspension

Review moderation

Store:

* User ID
* Action
* Timestamp
* IP where appropriate
* Relevant entity ID

---

# 46. NODE.JS PROJECT STRUCTURE

Use a clean Express architecture:

```text
project/

├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── layouts/
│       ├── hooks/
│       ├── services/
│       ├── context/
│       ├── utils/
│       ├── assets/
│       ├── App.jsx
│       └── main.jsx
│
├── backend/
│   ├── config/
│   │   ├── db.js
│   │   └── env.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── vendorController.js
│   │   ├── adminController.js
│   │   ├── comparisonController.js
│   │   ├── offerController.js
│   │   └── reviewController.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Category.js
│   │   ├── Brand.js
│   │   ├── VendorOffer.js
│   │   ├── ProductPairingRequest.js
│   │   ├── Review.js
│   │   ├── Wishlist.js
│   │   ├── PriceHistory.js
│   │   └── RankingConfiguration.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── vendorRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── comparisonRoutes.js
│   │   ├── offerRoutes.js
│   │   └── reviewRoutes.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   ├── errorMiddleware.js
│   │   └── uploadMiddleware.js
│   │
│   ├── services/
│   │   ├── rankingService.js
│   │   ├── priceService.js
│   │   ├── productMatchingService.js
│   │   └── ai/
│   │       ├── aiService.js
│   │       ├── productRecommendation.js
│   │       ├── productMatching.js
│   │       ├── comparisonSummary.js
│   │       ├── reviewSummary.js
│   │       └── naturalLanguageSearch.js
│   │
│   ├── utils/
│   ├── seed/
│   ├── app.js
│   └── server.js
│
├── database/
│   ├── indexes/
│   └── seed/
│
├── docs/
│   ├── API.md
│   ├── DATABASE.md
│   └── AI.md
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

# 47. BACKEND DEPENDENCIES

Use appropriate Node.js packages, including:

* express
* mongoose
* cors
* dotenv
* jsonwebtoken
* bcryptjs
* express-validator
* helmet
* express-rate-limit
* multer
* slugify

Add other packages only when genuinely required.

---

# 48. ENVIRONMENT VARIABLES

Create:

`.env.example`

Example:

```env
PORT=5000

MONGODB_URI=

JWT_SECRET=

JWT_EXPIRES_IN=7d

AI_API_KEY=

AI_MODEL=

CLIENT_URL=

SERVER_URL=
```

Never commit actual credentials.

---

# 49. SAMPLE DATA

Create seed data for testing.

Include at least:

10 categories

20 brands

30 products

10 vendors

20 vendor offers

10 buyers

Sample reviews

Sample price history

Sample comparison data

Use realistic technical specifications.

---

# 50. TEST ADMIN ACCOUNT

Create development-only seed credentials.

Example:

Admin:

[admin@example.com](mailto:admin@example.com)

Password:

Admin@123456

Clearly mention that these credentials are for development only and must be changed before production.

---

# 51. README

Create a detailed README containing:

Project overview

Features

Technology stack

Architecture

Folder structure

Installation

Frontend setup

Backend setup

MongoDB setup

Environment variables

AI API setup

Database initialization

Seed data

Running locally

Building for production

API documentation

Authentication

Admin workflow

Vendor workflow

Buyer workflow

Product pairing workflow

Comparison algorithm

Ranking algorithm

AI architecture

Deployment instructions

Security considerations

Future improvements

---

# 52. DEVELOPMENT APPROACH

Build the project in phases.

PHASE 1:

Project setup

React frontend

Bootstrap

Node.js + Express backend

MongoDB connection

Authentication

---

PHASE 2:

Product management

Categories

Brands

Product pages

Search

Filters

---

PHASE 3:

Vendor system

Vendor registration

Admin approval

Product submission

Product pairing

---

PHASE 4:

Marketplace

Vendor offers

Price comparison

Best-price system

---

PHASE 5:

Comparison engine

Multi-product comparison

Scoring

Ranking

Admin-configurable weights

---

PHASE 6:

AI

AI product matching

AI recommendations

AI comparison summaries

Natural-language search

AI review summaries

AI shopping assistant

---

PHASE 7:

Dashboard

Admin dashboard

Vendor dashboard

Buyer dashboard

Analytics

Notifications

---

PHASE 8:

Optimization

SEO

Security

Performance

Testing

Documentation

---

# 53. IMPORTANT BUSINESS RULES

Implement these rules strictly:

1. Vendors cannot publish products directly.

2. All vendor accounts require admin approval.

3. Vendor-submitted products require admin approval.

4. Existing products should be reused rather than duplicated.

5. Product pairing requires admin approval.

6. Only approved products are publicly visible.

7. Only approved vendors can submit active offers.

8. Only active offers should appear in price comparison.

9. The lowest valid available price should be displayed as the best available price.

10. Buyers cannot access admin functionality.

11. Vendors cannot access admin functionality.

12. Admin can manage the entire platform.

13. AI cannot independently approve products or vendors.

14. AI-generated technical information must be validated against database data.

15. Ranking must be transparent and configurable.

---

# 54. FUTURE SCALABILITY

Design the architecture so the platform can later support:

* Affiliate marketplace
* Direct checkout
* Payment gateway
* Order management
* Vendor commissions
* Subscription plans
* Sponsored products
* Price-drop alerts
* Email notifications
* Mobile application
* Advanced analytics
* Elasticsearch/OpenSearch
* Recommendation engine
* Product price APIs
* External marketplace integrations
* Automated product-data ingestion

Do not implement all future features now, but keep the architecture ready for them.

---

# 55. FINAL REQUIREMENT

Generate the complete working project.

Do not provide only a conceptual explanation.

Create:

* Frontend source code
* React components
* HTML structure
* CSS
* Bootstrap implementation
* JavaScript
* Node.js backend
* Express.js REST APIs
* MongoDB/Mongoose integration
* Database structure
* Seed data
* Authentication
* Admin dashboard
* Vendor dashboard
* Buyer dashboard
* Product management
* Product pairing
* Product comparison
* Ranking engine
* Marketplace offers
* Best-price system
* AI integration
* Search
* Filters
* Reviews
* Wishlist
* Price history
* Notifications
* Documentation

The application should be runnable locally.

Before considering the project complete, verify:

* Authentication works
* Role permissions work
* MongoDB connection works
* Products can be created
* Products can be approved
* Vendors can submit products
* Product pairing works
* Admin approval works
* Multiple vendor offers work
* Price comparison works
* Product comparison works
* Ranking works
* AI functionality works
* Responsive UI works
* API errors are handled
* Environment variables are documented

Prioritize functionality, scalability, security, clean architecture, and a professional UI.

The final result should feel like a real commercial technical-product research and marketplace platform rather than a basic college CRUD project.

IMPORTANT:

Do not remove, simplify, or change any of the features, workflows, business rules, AI functionality, comparison logic, ranking system, marketplace functionality, dashboards, or requirements described above.

The ONLY backend change from the original specification is:

PHP → Node.js + Express.js

Everything else must remain as specified.
