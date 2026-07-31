// MinuteGenAI - Configuration Settings
// Point the frontend to your secure FastAPI backend service.

window.CONFIG = {
  // Base URL of the local FastAPI backend server.
  // Make sure your backend server is running (default port is 8000).
  // Automatically detects if running locally or in production on Vercel.
  API_BASE_URL: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:8000"
    : ""
};
