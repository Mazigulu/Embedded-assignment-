/**
 * Server Entry Point
 * 
 * Sets up Express backend running with layered architecture:
 * - Transport / Controller Layer
 * - Business Logic Layer
 * - Data Access Layer (Repository)
 * - Telemetry & Wire Interceptor
 * - Vite dev server middleware (dev) / static file server (prod)
 */

import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { ItemController } from './server/controllers/itemController.ts';
import { TelemetryController } from './server/controllers/telemetryController.ts';
import type { RequestWireLog } from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Parse incoming JSON and Form URL-encoded payloads
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS headers for API consumers
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Wire Logger & Telemetry Interceptor Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Only intercept /api routes for wire log
    if (!req.path.startsWith('/api')) {
      return next();
    }

    const startTime = performance.now();
    const requestId = (req.headers['x-request-id'] as string) || `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    req.headers['x-request-id'] = requestId;

    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    let capturedResponseBody: any = null;

    res.json = function (body: any) {
      capturedResponseBody = body;
      return originalJson(body);
    };

    res.send = function (body: any) {
      if (!capturedResponseBody) {
        try {
          capturedResponseBody = typeof body === 'string' ? JSON.parse(body) : body;
        } catch {
          capturedResponseBody = body;
        }
      }
      return originalSend(body);
    };

    res.on('finish', () => {
      const durationMs = Number((performance.now() - startTime).toFixed(2));
      const reqHeaders: Record<string, string> = {};
      for (const [key, val] of Object.entries(req.headers)) {
        if (typeof val === 'string') {
          reqHeaders[key] = val;
        }
      }

      const resHeaders: Record<string, string> = {
        'content-type': res.getHeader('content-type')?.toString() || 'application/json',
        'x-request-id': requestId,
        'x-response-time-ms': durationMs.toString(),
      };

      const wireLog: RequestWireLog = {
        id: requestId,
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        durationMs,
        requestHeaders: reqHeaders,
        requestBody: req.body && Object.keys(req.body).length > 0 ? req.body : undefined,
        responseHeaders: resHeaders,
        responseBody: capturedResponseBody,
        layerTrace: capturedResponseBody?.meta?.layerTrace || [],
      };

      TelemetryController.logWireTransaction(wireLog);
    });

    next();
  });

  // ==========================================
  // Layered REST API Routes
  // ==========================================

  // Items endpoints (Controller -> Service -> DAL)
  app.get('/api/items', ItemController.getAll);
  app.get('/api/items/:id', ItemController.getById);
  app.post('/api/items', ItemController.create);
  app.put('/api/items/:id', ItemController.update);
  app.delete('/api/items/:id', ItemController.delete);
  app.post('/api/reset', ItemController.reset);

  // System Diagnostics & Protocol Verification
  app.get('/api/health', TelemetryController.getHealth);
  app.get('/api/metrics', TelemetryController.getMetrics);
  app.get('/api/requests/recent', TelemetryController.getRecentRequests);
  app.post('/api/echo', TelemetryController.echo);
  app.post('/api/simulate-error', TelemetryController.simulateError);
  app.get('/api/assessment-info', TelemetryController.getAssessmentInfo);

  // In-memory User Store for PHP CRUD form
  interface UserRecord {
    id: number;
    fname: string;
    lname: string;
    contactno: string;
    email: string;
    address: string;
    postingDate: string;
  }

  const usersList: UserRecord[] = [
    {
      id: 1,
      fname: 'John',
      lname: 'Doe',
      contactno: '9876543210',
      email: 'john.doe@example.com',
      address: '123 Baker Street, London',
      postingDate: '2026-10-10 14:22:10',
    },
    {
      id: 2,
      fname: 'Sarah',
      lname: 'Connor',
      contactno: '9123456780',
      email: 'sarah.c@example.com',
      address: '456 Cyber Way, Los Angeles',
      postingDate: '2026-10-11 09:15:33',
    },
  ];
  let nextUserId = 3;

  // Handle Form Submission from index.html (POST / or POST /index.php)
  const handleFormSubmit = (req: Request, res: Response) => {
    const { fname, lname, contactno, email, address } = req.body;
    if (fname || email) {
      usersList.push({
        id: nextUserId++,
        fname: fname || '',
        lname: lname || '',
        contactno: contactno || '',
        email: email || '',
        address: address || '',
        postingDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
      });
    }
    return res.redirect('/index.php?status=success');
  };

  app.post('/', handleFormSubmit);
  app.post('/index.php', handleFormSubmit);

  // Handle View Inserted Data (GET /index.php)
  app.get('/index.php', (req: Request, res: Response) => {
    if (req.query.del) {
      const delId = parseInt(req.query.del as string, 10);
      const idx = usersList.findIndex(u => u.id === delId);
      if (idx !== -1) {
        usersList.splice(idx, 1);
      }
      return res.redirect('/index.php?status=deleted');
    }

    const alertHtml = req.query.status === 'success'
      ? '<div class="alert alert-success alert-dismissible fade show" role="alert"><strong>Success!</strong> Record has been inserted successfully into the database.<button type="button" class="close" data-dismiss="alert">&times;</button></div>'
      : req.query.status === 'deleted'
      ? '<div class="alert alert-danger alert-dismissible fade show" role="alert">Record has been removed successfully.<button type="button" class="close" data-dismiss="alert">&times;</button></div>'
      : '';

    const rowsHtml = usersList.map((u, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${u.fname} ${u.lname}</strong></td>
        <td>${u.email}</td>
        <td>${u.contactno}</td>
        <td>${u.address}</td>
        <td>${u.postingDate}</td>
        <td>
          <a href="/index.php?del=${u.id}" class="btn btn-sm btn-outline-danger" onclick="return confirm('Are you sure you want to delete this record?');">
            <i class="fa fa-trash"></i> Delete
          </a>
        </td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
<title>PHP CRUD - View Inserted Data</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:400,700">
<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css">
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">
<script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js"></script>
<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/js/bootstrap.min.js"></script>
<style>
body {
    color: #566787;
    background: #63738a;
    font-family: 'Roboto', sans-serif;
}
.table-responsive {
    margin: 30px 0;
}
.table-wrapper {
    background: #fff;
    padding: 25px 30px;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0,0,0,.2);
}
.table-title {
    padding-bottom: 15px;
    background: #299be4;
    color: #fff;
    padding: 16px 30px;
    margin: -25px -30px 15px;
    border-radius: 4px 4px 0 0;
}
.table-title h2 {
    margin: 5px 0 0;
    font-size: 24px;
}
.table-title .btn {
    color: #566787;
    float: right;
    font-size: 13px;
    background: #fff;
    border: none;
    min-width: 50px;
    border-radius: 2px;
    border: none;
    outline: none !important;
    margin-left: 10px;
}
table.table tr th, table.table tr td {
    border-color: #e9e9e9;
    padding: 12px 15px;
    vertical-align: middle;
}
table.table-striped tbody tr:nth-of-type(odd) {
    background-color: #fcfcfc;
}
</style>
</head>
<body>
<div class="container-xl">
    <div class="table-responsive">
        <div class="table-wrapper">
            <div class="table-title">
                <div class="row">
                    <div class="col-sm-8">
                        <h2>PHP CRUD Operation <b>User Management</b></h2>
                    </div>
                    <div class="col-sm-4">
                        <a href="/" class="btn btn-primary"><i class="fa fa-plus"></i> <span>Insert New Data</span></a>
                    </div>
                </div>
            </div>
            ${alertHtml}
            <table class="table table-striped table-hover">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Mobile Number</th>
                        <th>Address</th>
                        <th>Posting Date</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml || '<tr><td colspan="7" class="text-center py-4">No records found. Click "Insert New Data" to add records.</td></tr>'}
                </tbody>
            </table>
        </div>
    </div>
</div>
</body>
</html>`;

    return res.send(html);
  });

  // Global API 404 handler for undefined /api routes
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      error: `API Route '${req.method} ${req.path}' does not exist on server.`,
      code: 'ERR_ENDPOINT_NOT_FOUND',
      meta: {
        requestId: `req-404-${Date.now()}`,
        timestamp: new Date().toISOString(),
        executionTimeMs: 0.1,
        layerTrace: [
          {
            layer: 'Transport / API',
            component: 'Express Router',
            action: 'Route matching failed',
            durationMs: 0.1,
            details: 'No registered controller matched the requested path.',
          },
        ],
      },
    });
  });

  // ==========================================
  // Client Presentation Layer Mounting
  // ==========================================
  if (isProd) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // In Dev: Mount Vite dev server middlewares
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Client-Server App] Server running at http://0.0.0.0:${PORT}`);
    console.log(`[Architecture] Layered System Active: Presentation -> Controller -> Service -> DAL`);
  });
}

startServer().catch(err => {
  console.error('[Server Error] Failed to bootstrap application:', err);
  process.exit(1);
});
