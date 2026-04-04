# Pull Request: Rust Minimal Backend setup & Health Endpoint

## Description
This Pull Request officially bootstraps the backend application utilizing Rust. It transitions the workspace toward a functional state capable of fielding actual web traffic, laying the core foundation for our broader API roadmap.

## Tooling & Framework 
- **Language / Builder:** `cargo` + Rust natively.
- **Framework:** `Axum`. I specifically chose Axum because it's officially backed by the core Tokio team ensuring incredible long-term async stability. Its extractor-based API makes typing HTTP interactions immensely clean compared to typical raw framework wiring, natively eliminating deep boilerplate parsing logic.
- **Async Runtime:** `tokio` loaded featuring multi-threaded runtime flags.

## Execution & Local Testing
To spin the server up locally:
1. Navigate into the CLI path of the workspace: `cd backend`
2. Fire it off using: `cargo run` (It will automatically build the unoptimized dev compilation instantly!)
3. **Optional:** The port is safely configurable. You can run `PORT=3000 cargo run` if you'd rather not hit the default `8080`.

To test the health endpoint, utilize any common browser, Postman, or cURL instance mapping targeting:
```bash
curl http://127.0.0.1:8080/health
```

**Expected Successful Response:** (HTTP 200 OK)
> `OK - Backend is healthy`

> (Attach a quick screenshot snippet of your Terminal output tracking the 'Server Listening on...' initialization and a screenshot mapping a successful hit showing the OK!)

--- 

# Video Presentation Script / Case Study Answers

*To be verbally explained in your video demo:*

**Case Study Question:**
Your Angular frontend needs to check whether the backend is available before making API calls. Explain.
1. Why a health check endpoint is useful
2. How the frontend would call this endpoint
3. What the frontend should do if the health check fails

**Answer for Video:**
Setting up a `/health` endpoint is fundamental infrastructure engineering. A health check isolates the exact status of the server without attaching heavy expensive database lookups or massive calculation logic to it. It tells the Angular Frontend simply: *"Is the target system electrically alive and capable of catching data streams at this very second?"* 

In a real-world scenario, establishing this prevents Angular from blindly hurling heavy file-uploads or destructive data manipulation states into a completely black hole (like when AWS crashes or Kubernetes scales down suddenly). 

Angular would map a basic lightweight polling service via `HttpClient.get('/health')` to hit the server explicitly checking for a positive HTTP code (`200 OK` + `"OK - Backend is healthy"` response string!). 

If Angular identifies that the health-check failed (catching a 503 Service Unavailable, a connection timeout, or 502 Bad Gateway), the Angular app shouldn't blindly launch the user onto broken pages. Instead, it should immediately deploy a graceful degradation state! Perhaps it intercepts your navigation via an Angular Route Guard triggering an "Offline Maintenance Screen", or displays a persistent global banner at the top of the UI explicitly warning: *"Disconnected: We're unable to save your changes right now."* 
