# **\--- App Core \---**

NODE\_ENV="development" PORT=3000

# **The URL where the frontend is running (for CORS)**

FRONTEND\_URL="http://localhost:3000"

# **\--- Database (PostgreSQL) \---**

# **Format: postgresql://USER:PASSWORD@HOST:PORT/DB\_NAME**

DATABASE\_URL="postgresql://user:password@localhost:5432/octopus\_db"

# **\--- Authentication (JWT) \---**

JWT\_SECRET="CHANGE\_THIS\_TO\_A\_COMPLEX\_SECRET\_STRING" JWT\_EXPIRATION="7d"

# **\--- OAuth (Google) \---**

# **Get these from Google Cloud Console**

GOOGLE\_CLIENT\_ID="" GOOGLE\_CLIENT\_SECRET="" GOOGLE\_CALLBACK\_URL="http://localhost:3000/api/auth/google/callback"

# **\--- Redis & Queue (BullMQ) \---**

REDIS\_HOST="localhost" REDIS\_PORT=6379 REDIS\_PASSWORD=""

# **\--- Email (Resend) \---**

# **Get API Key from [https://resend.com](https://resend.com)**

RESEND\_API\_KEY="re\_123456..." MAIL\_FROM="Octopus noreply@octopus.app"

# **\--- Crawler \---**

# **Optional: If you use a rotating proxy service (BrightData, etc.) later**

PROXY\_SERVER\_URL=""

# **\--- Frontend Public Variables \---**

# **These are exposed to the browser**

NEXT\_PUBLIC\_API\_URL="http://localhost:3000/api" NEXT\_PUBLIC\_POSTHOG\_KEY="" NEXT\_PUBLIC\_POSTHOG\_HOST=""

