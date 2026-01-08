# Meter Admin Dashboard v3

Updated to use your new API endpoints (HTTPS):

- https://fxapi.invict.site/api/meters
- https://fxapi.invict.site/api/transactions
- https://fxapi.invict.site/api/tokens

Run:
```bash
cd meter_admin_dashboard_v3
python3 -m http.server 8000
```

Open:
- http://localhost:8000/index.html

If you still get CORS, the API server must allow your origin (http://localhost:8000) or you can run via a small proxy.
