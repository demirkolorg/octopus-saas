## **Base URL**

`http://localhost:3000/api`

## **Response Standards**

### **Success Response (List)**

JSON  
{  
  "data": \[ ... \],  
  "meta": {  
    "total": 100,  
    "page": 1,  
    "limit": 20,  
    "lastPage": 5  
  }  
}

### **Success Response (Single)**

JSON  
{  
  "data": { ... }  
}

### **Error Response**

JSON  
{  
  "statusCode": 400,  
  "message": "Validation failed",  
  "error": "Bad Request"  
}

---

## **1\. Authentication**

* **POST** `/auth/register`  
  * Body: `{ "email": "user@example.com", "password": "securePass123" }`  
* **POST** `/auth/login`  
  * Body: `{ "email": "user@example.com", "password": "..." }`  
  * Returns: `{ "accessToken": "ey...", "user": { ... } }`  
* **GET** `/auth/google`  
  * Redirects to Google OAuth consent screen.  
* **GET** `/auth/me`  
  * Headers: `Authorization: Bearer <token>`  
  * Returns: Current user profile.

---

## **2\. Sources (Resource)**

* **GET** `/sources`  
  * Returns list of sources belonging to the user.  
* **POST** `/sources`  
  * Create a new source.

Body:  
JSON  
{  
  "name": "Tech Crunch",  
  "url": "https://techcrunch.com",  
  "refreshInterval": 900,  
  "selectors": {  
    "list\_item": { "type": "css", "val": ".post-block" },  
    "title": { "type": "css", "val": "h2.post-block\_\_title a" },  
    "link": { "type": "css", "val": "h2.post-block\_\_title a" },  
    "date": { "type": "xpath", "val": "//time/@datetime" },  
    "image": { "type": "css", "val": "img.post-block\_\_media" }  
  }  
}

*   
* **PATCH** `/sources/:id`  
  * Update status or selectors.  
  * Body: `{ "status": "PAUSED" }` or `{ "selectors": { ... } }`  
* **DELETE** `/sources/:id`  
  * Soft delete or hard delete the source and its articles.  
* **POST** `/sources/:id/crawl`  
  * Manually trigger a crawl job immediately.  
  * Returns: `{ "jobId": "...", "status": "PENDING" }`

---

## **3\. Articles (Pagination)**

* **GET** `/articles`  
  * Query Params:  
    * `page` (default: 1\)  
    * `limit` (default: 20\)  
    * `sourceId` (optional: UUID)  
    * `isRead` (optional: true/false)  
    * `orderBy` (default: "createdAt:desc")  
* **PATCH** `/articles/:id/read`  
  * Mark article as read/unread.  
  * Body: `{ "isRead": true }`

---

## **4\. Proxy & Selector Utility**

* **GET** `/proxy`  
  * Used by the Frontend Iframe to render target sites safely.  
  * Query Param: `url` (Encoded target URL)  
  * Returns: HTML string with rewritten relative paths (`href="/css/style.css"` \-\> `href="TARGET_URL/css/style.css"`).

