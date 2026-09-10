# Supabase Storage deployment

MongoDB remains the application database. Actual uploaded file bytes are stored in the private Supabase Storage bucket `hackwithvizag-uploads`; MongoDB stores stable object metadata. A Render persistent disk and `UPLOAD_ROOT` are not required.

## Supabase setup

Create a Supabase project and configure these environment variables on the backend service only:

```text
SUPABASE_URL=<project URL>
SUPABASE_SERVICE_ROLE_KEY=<backend-only service-role key>
SUPABASE_STORAGE_BUCKET=hackwithvizag-uploads
```

`SUPABASE_SECRET_KEY` is also accepted for projects using Supabase's newer
secret-key naming. Configure only a backend secret/service-role key here; never
use a publishable or anonymous key for private storage access.

Never expose the service-role key in Vite variables or frontend code. The backend will create the configured bucket as private when it first uploads a file if the bucket does not already exist. If an existing configured bucket is public, the backend attempts to make it private before uploading.

In Render, open the backend Web Service, select **Environment**, add the three variables, and redeploy. Do not configure `UPLOAD_ROOT` and do not attach a persistent disk.

The same Supabase variables are required in `backend/.env` for local development. Local and production uploads use the same storage architecture.

## Private file access

New files are stored under these object paths:

```text
ppt/<teamId>/<unique-filename>
supporting-documents/<teamId>/<unique-filename>
payment-screenshots/<teamId>/<unique-filename>
profile/<userId>/<unique-filename>
```

The bucket must remain private. Browsers continue to request files through authenticated backend API endpoints; the service-role key and direct Storage URLs are never returned to the frontend.

Admin document contracts remain:

```text
GET /api/admin/team/:teamId/documents/ppt
GET /api/admin/team/:teamId/documents/ppt?disposition=attachment
GET /api/admin/team/:teamId/documents/supporting
```

Old MongoDB records are not rewritten or deleted. The backend retains a read-only local fallback for an old record only when its file happens to exist under `backend/uploads`; this is legacy compatibility, not production persistence. Missing old files must be recollected manually.

## Deployment verification

After configuring Render, upload a brand-new submission and verify the object in the Supabase Storage dashboard, its `storagePath` metadata in MongoDB, and both authenticated admin view/download routes. Restart the backend and repeat the downloads to prove the file does not depend on Render's filesystem.
