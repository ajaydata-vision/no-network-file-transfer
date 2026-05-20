# Optical File Transfer Web Application Plan

## Goal

Build a local-only browser application that transfers files optically through a sequence of QR codes. The sender uploads a file, the browser compresses and chunks it, and the app displays QR codes. The receiver uses a camera in another browser/device to scan chunks, verify them, reconstruct the file, and download it.

This planning phase intentionally does not write application code. It defines the implementation target, architecture, risks, and corrected execution plan.

## Repository Target

Target remote repository:

```text
https://github.com/ajaydata-vision/no-network-file-transfer.git
```

Verified with `git ls-remote` on 2026-05-20. The remote responded but returned no refs, so it appears to exist but have no branches/commits yet. Current local workspace is also not initialized as a git repository and contains only this planning document.

Implementation should either:

- initialize `I:\camera-transfer` as the local repository, add the GitHub URL as `origin`, commit the completed project, and push the first branch; or
- clone the remote into a fresh folder if the remote later gains commits before implementation starts.

Because the remote currently appears empty, initializing this workspace is the expected path once coding begins.

## Non-Negotiable Requirements

- No backend, no external services, no deployment dependency.
- React 18, TypeScript, Vite, React Router, Tailwind CSS 3.
- Zustand for app state.
- QR generation package decision: use `qrcode` plus `@types/qrcode` for Vite/TypeScript compatibility. The requested `qrcode.js` package was verified and is not a good primary implementation dependency.
- `jsqr` for QR decoding.
- `pako` for gzip/gunzip.
- `crypto-js` for SHA-256 hashes.
- `uuid` for session IDs.
- Display and Camera modes available in one app with a top toggle.
- Works in modern desktop and mobile browsers.
- Max file size: 100 MB.
- Session expiry: 5 minutes.
- QR auto-advance default: 300 ms, configurable from 100 ms to 1000 ms.
- Chunks are stored and reconstructed out of order.
- Each chunk and the final reconstructed file must be hash verified.

## Product Shape

The first screen is the actual tool, not a landing page.

The app has one primary page with:

- Header: title, mode toggle, session details when relevant.
- Display mode: file picker/drop zone, transfer setup, QR presenter, manual controls, stats.
- Camera mode: session entry, camera scanner, progress, diagnostics, download result.

React Router can still be used, but routes should mirror modes:

- `/display`
- `/camera`
- `/` redirects to `/display`

The mode toggle changes route and Zustand `appMode`.

## Verified QR Package Decision

Verified with `npm view` on 2026-05-20:

- `qrcode.js`
  - npm package exists.
  - Current version: `0.0.1`.
  - Main entry: `index.js`.
  - No published TypeScript types.
  - No `module`, `browser`, or Vite-oriented metadata was reported by `npm view`.
  - Last modified: `2022-06-25T05:26:57.957Z`.
  - Repository: `git://github.com/FrozenRidge/jsqrcode.git`.
- `qrcode`
  - Current version: `1.5.4`.
  - Main entry: `./lib/index.js`.
  - Browser mapping exists: `./lib/browser.js`.
  - Last modified: `2025-11-13T00:56:56.222Z`.
  - Repository: `git://github.com/soldair/node-qrcode.git`.
  - License: MIT.
- `@types/qrcode`
  - Current version: `1.5.6`.
  - Provides TypeScript definitions for `qrcode`.

Decision:

Use `qrcode` for QR generation and install `@types/qrcode` for TypeScript support. This is a deliberate compatibility correction to the original dependency list. It preserves the required browser QR-generation behavior while avoiding a stale package with weak TypeScript/Vite signals.

Updated install set for QR generation:

```bash
npm install qrcode
npm install --save-dev @types/qrcode
```

Do not install `qrcode.js` unless the user explicitly requires that exact package despite the compatibility risk.

## Data Contract

Each QR payload will be JSON with this shape:

```ts
type TransferPayload = {
  v: 1;
  sessionId: string;
  chunkIndex: number;
  totalChunks: number;
  fileName: string;
  fileSize: number;
  compressedSize: number;
  fileHash: string;
  chunkHash: string;
  data: string;
  createdAt: number;
  expiresAt: number;
};
```

Notes:

- `chunkIndex` is zero-based internally, displayed as one-based.
- `data` is base64 encoded compressed bytes for this chunk.
- `chunkHash` is SHA-256 of the raw compressed chunk bytes, not the base64 string.
- `fileHash` is SHA-256 of the original uncompressed file bytes.
- `compressedSize` supports diagnostics and speed calculations.
- `v` allows payload format evolution.

## Encoding Flow

1. User selects or drops a file.
2. Reject files larger than 100 MB.
3. Read file as `ArrayBuffer`.
4. Calculate SHA-256 of original bytes.
5. Compress bytes with `pako.gzip`.
6. Split compressed bytes into chunks.
7. Generate a UUID session ID.
8. Set `createdAt` and `expiresAt = createdAt + 5 minutes`.
9. Build payloads for all chunks.
10. Convert payloads to JSON strings.
11. Render current payload as a QR code.
12. Auto-advance at configured interval while not paused.
13. Wrap from last chunk to first until the session expires or user stops.

Important correction to the original prompt: after the final chunk, the display should not permanently stop by default. Real camera scanning can miss chunks, and out-of-order recovery requires repeated cycles. The UI can show "Cycle complete" after one pass, but it should continue looping QR codes until paused, expired, or cancelled.

## Chunk Size Strategy

Initial target: 700 bytes of compressed binary per chunk.

Reasoning:

- The prompt requested 2800 bytes.
- Base64 expands binary by about 33%.
- JSON metadata adds several hundred bytes.
- QR code capacity depends on mode, version, and error correction.
- `jsQR` scanning reliability falls sharply with very dense QR codes on real cameras, especially on phones viewing desktop displays.

Implementation should expose this as a constant:

```ts
const CHUNK_SIZE_BYTES = 700;
```

Local QR loopback testing showed that 1800 compressed bytes produced payloads around 2795 characters, which exceeded QR capacity at error correction level M. Further loopback testing showed that 1000 compressed bytes could fit QR capacity but still produce QR images that `jsQR` occasionally failed to decode. If local testing proves reliable at larger values, it can be raised cautiously. Reliability matters more than theoretical transfer speed.

## Decoding Flow

1. User enters a session ID.
2. Basic validate UUID format.
3. Request camera permission with `getUserMedia`.
4. Render camera preview in a `<video>`.
5. Every 50 ms, draw the current frame to a hidden canvas.
6. Pass `ImageData` to `jsQR`.
7. If no QR is found, update diagnostics and hints.
8. If QR is found, parse JSON and validate:
   - payload version supported
   - session ID matches input
   - session not expired according to payload `expiresAt`
   - chunk index is valid
   - total chunk count is consistent
   - file metadata is consistent with prior chunks
   - chunk hash matches decoded binary chunk
9. Store valid chunk by `chunkIndex`.
10. Ignore duplicates.
11. When all chunks are present, concatenate compressed chunks in index order.
12. Decompress with `pako.ungzip`.
13. Hash reconstructed original bytes.
14. Compare with `fileHash`.
15. If valid, create a `Blob` and object URL for download.
16. Stop camera scanning after successful reconstruction.

## State Model

Zustand store should keep serializable metadata and in-memory transfer data. Large arrays can live in store during transfer, but should be cleared aggressively on cancel, expiry, or completion cleanup.

```ts
type AppMode = "display" | "camera";

type DisplayState = {
  file?: File;
  fileName?: string;
  fileSize?: number;
  fileHash?: string;
  compressedSize?: number;
  sessionId?: string;
  expiresAt?: number;
  qrPayloads: string[];
  currentChunkIndex: number;
  isPreparing: boolean;
  isTransferring: boolean;
  isPaused: boolean;
  intervalMs: number;
  cycleCount: number;
  error?: string;
};

type CameraState = {
  enteredSessionId: string;
  activeSessionId?: string;
  isCameraActive: boolean;
  status: "idle" | "waiting" | "detected" | "scanned" | "complete" | "error";
  receivedChunks: Map<number, Uint8Array>;
  totalChunks?: number;
  fileName?: string;
  fileSize?: number;
  compressedSize?: number;
  fileHash?: string;
  expiresAt?: number;
  startedAt?: number;
  completedAt?: number;
  diagnostics: ScannerDiagnostics;
  downloadUrl?: string;
  error?: string;
};
```

The store also exposes actions:

- `setMode`
- `selectFile`
- `prepareTransfer`
- `startTransfer`
- `pauseTransfer`
- `resumeTransfer`
- `setCurrentChunk`
- `stopDisplayTransfer`
- `setCameraSessionInput`
- `startCameraSession`
- `recordScannedPayload`
- `completeReceive`
- `cancelReceive`
- `clearExpiredSession`
- `pushNotification`
- `clearError`

## Component Plan

```text
src/
  App.tsx
  main.tsx
  routes/
    DisplayPage.tsx
    CameraPage.tsx
  components/
    Header.tsx
    ModeToggle.tsx
    FileDropzone.tsx
    SessionBadge.tsx
    CountdownTimer.tsx
    QRPresenter.tsx
    TransferControls.tsx
    ProgressBar.tsx
    TransferStats.tsx
    CameraScanner.tsx
    ScanOverlay.tsx
    DiagnosticsPanel.tsx
    DownloadPanel.tsx
    ErrorNotice.tsx
  store/
    transferStore.ts
  lib/
    constants.ts
    fileEncoding.ts
    fileDecoding.ts
    hashing.ts
    base64.ts
    qr.ts
    camera.ts
    diagnostics.ts
    validation.ts
    download.ts
  types/
    transfer.ts
```

## UI Requirements

### Header

- Title: `Optical File Transfer`.
- Segmented toggle for Display and Camera.
- In Display mode, show copyable session ID after transfer is prepared.
- In Display mode, show 5-minute countdown after session starts.

### Display Mode

- Drag-and-drop upload area plus click-to-browse.
- Selected file name and human-readable size.
- Large start button enabled only with a valid selected file.
- Preparing state while hashing/compressing/chunking.
- QR code centered, minimum 300 px and responsive up to roughly 600 px.
- Chunk label: `Chunk 5 of 333`.
- Next timer label based on interval.
- Previous, Next, Pause/Resume controls.
- Interval control from 100 ms to 1000 ms.
- Progress bar showing current chunk position through current cycle.
- Stats: transfer speed estimate, file size, compressed size, file name, first 16 chars of file hash.

### Camera Mode

- Session input and start button.
- Error for invalid UUID format.
- Camera preview after start.
- Center scan overlay.
- Status: waiting, detected, scanned, complete, error.
- Chunk counter: received count and total count once known.
- Progress bar.
- Brightness slider implemented as CSS/filter assistance on preview, not a change to camera sensor exposure.
- Focus button attempts camera track focus constraints when supported and degrades gracefully.
- Cancel button stops tracks and clears receiver state.
- Collapsible diagnostics panel with FPS, brightness, contrast, confidence proxy, and hints.
- Download panel appears after verified reconstruction.

## Browser and Security Constraints

- Camera access generally requires secure context. `localhost` is allowed by modern browsers.
- The app should warn if camera APIs are unavailable.
- No file contents should be persisted to localStorage.
- Object URLs must be revoked when no longer needed.
- Camera tracks must be stopped on cancel, route change, or component unmount.
- Avoid logging file contents or QR payload data to console.

## Error Handling

- File too large: block selection/start and show max size.
- Read/compression/hash failure: show recoverable error and allow retry.
- QR render failure: show error and keep transfer paused.
- Camera permission denied: explain browser permission path and allow retry.
- Invalid session ID input: block camera start.
- Expired payload: stop scanning and show expired session message.
- Payload parse error: ignore frame and keep scanning.
- Chunk hash mismatch: ignore chunk, increment diagnostic error count.
- Metadata mismatch: ignore payload and show warning.
- Final hash mismatch: show error, keep received chunk map, and allow continued scanning if the sender is still looping.

## Testing Plan

### Automated

- Unit tests for:
  - base64 encode/decode round trip
  - chunk split/concat round trip
  - SHA-256 hash consistency
  - payload validation
  - gzip/gunzip reconstruction
  - duplicate chunks ignored
  - out-of-order chunks reconstruct correctly
  - final hash mismatch detected

### Manual Local

- Start dev server with `npm run dev`.
- Test 100 KB text/PDF-like file.
- Test 2 MB image.
- Test pause and manual navigation.
- Test out-of-order scanning by manually stepping QR codes.
- Test session expiry using a temporarily shortened expiry constant during development.
- Test mobile viewport layout.
- Test camera permission denied.

### Browser Verification

- Chrome or Edge first.
- Firefox second.
- Safari/mobile only after the baseline flow works.

## Execution Plan

1. Scaffold Vite React TypeScript project.
2. Install dependencies exactly matching the requested stack.
3. Add Tailwind configuration and base styles.
4. Define transfer types and constants.
5. Implement pure utilities:
   - hashing
   - base64 conversion
   - gzip/gunzip wrappers
   - chunk split/concat
   - payload validation
6. Implement Zustand store.
7. Build Display mode:
   - upload
   - file processing
   - QR generation
   - auto-advance
   - manual controls
8. Build Camera mode:
   - session entry
   - camera lifecycle
   - frame capture
   - QR decode loop
   - chunk validation
   - reconstruction
   - download
9. Add diagnostics and helpful hints.
10. Add README with local run and testing instructions.
11. Run typecheck/build.
12. Start local dev server and test in browser.
13. Fix issues found during local testing.

## Adversarial Review

### Risk 1: QR payloads may be too large to scan reliably.

The original 2800-byte chunk size sounds efficient, but after base64 and JSON metadata, payloads may become dense QR codes that scan poorly from a camera pointed at a screen. Error correction level M also increases symbol density compared with lower correction.

Correction: start at 700 compressed bytes per chunk, keep it as a constant, and treat larger chunks as an optimization only after QR loopback and camera reliability are proven.

### Risk 2: Stopping after one QR sequence pass can make real transfers fail.

If the sender stops after showing the final QR once, any missed chunk means the receiver cannot recover. Camera decoding will miss frames due to blur, angle, glare, refresh timing, autofocus, and exposure shifts.

Correction: sender should loop chunks until the session expires or user stops. UI can track cycle completion separately.

### Risk 3: "Validate session" is impossible across devices without backend.

The receiver cannot know whether a session exists before scanning because there is no shared backend. A UUID can only be format-validated before camera start. Real validation occurs when matching QR payloads are scanned.

Correction: Camera mode should say "Start Camera" after UUID format validation, not imply remote session verification.

### Risk 4: Zustand session data is not shared between browser tabs or devices.

The prompt says both modes track the same session ID, but Zustand state is per browser context. In a two-tab test, the camera tab will not share sender state unless localStorage/broadcast mechanisms are added, and across devices it cannot share at all.

Correction: receiver state must be driven entirely from scanned QR payloads after the user enters a matching session ID. Display-mode Zustand state is only local to the sender.

### Risk 5: 100 MB file support is technically possible but operationally poor.

At 700-byte chunks, a compressed 100 MB file could require tens of thousands of QR codes and hours of optical transfer. Browser memory pressure will also be high if every JSON payload and QR string is precomputed.

Correction: keep the 100 MB hard maximum because it is required, but display an estimated transfer duration and warning for large files. Generate QR payloads lazily by chunk index if memory becomes an issue. For first implementation, precomputed payload strings are acceptable for small/medium local tests, but the architecture should keep generation isolated so it can become lazy.

### Risk 6: Hashing raw bytes with `crypto-js` can be mishandled.

`crypto-js` expects WordArray input. Incorrect ArrayBuffer conversion can produce wrong hashes or silently hash stringified data.

Correction: implement and test a dedicated `arrayBufferToWordArray` / `uint8ArrayToWordArray` helper and use it everywhere.

### Risk 7: Browser focus control is not universal.

Manual camera focus via media track constraints is not supported consistently across browsers and devices.

Correction: implement Focus as best-effort. If unsupported, show a short non-blocking message and continue scanning.

### Risk 8: Brightness slider cannot truly change camera exposure in most browsers.

Applying CSS filter brightness to the video does not change the raw canvas frame unless the filtered visual is drawn intentionally. Sensor exposure constraints are inconsistent.

Correction: implement brightness slider as a display/scanning canvas adjustment option only if applied to the pixel data before decoding. Otherwise label it as preview brightness. Prefer a simple pixel adjustment in the frame-processing path.

### Risk 9: QR generation library naming was ambiguous.

The prompt names `qrcode.js`, but npm package verification showed that `qrcode.js` is version `0.0.1`, lacks TypeScript types, and does not expose browser/module metadata. The `qrcode` package has a browser mapping and matching `@types/qrcode` package.

Correction: use `qrcode` plus `@types/qrcode` for implementation. This is now an explicit plan decision, not an unresolved question.

### Risk 10: Testing real camera scanning against the same screen can be awkward.

One-computer testing needs an actual camera pointed at the display, and browser tabs cannot directly "see" another tab without a physical camera or virtual camera.

Correction: include pure utility tests and manual QR stepping. For full optical verification, use a phone or external webcam pointed at the sender screen.

## Revised Implementation Decisions

- Use `/display` and `/camera` routes, with both presented as modes in one app.
- Receiver cannot prevalidate session existence; it validates UUID syntax first and QR payloads later.
- Sender loops QR chunks continuously until expiry, pause, or stop.
- Start with `CHUNK_SIZE_BYTES = 700`.
- Keep payload generation logic isolated so it can be changed from eager to lazy later.
- Do not persist file bytes, chunks, or payloads to localStorage.
- Implement camera focus as progressive enhancement.
- Implement diagnostics as useful approximations, not false precision.
- Add transfer duration estimates and warnings for large files.
- Use `qrcode` plus `@types/qrcode`, not `qrcode.js`, for QR generation.

## Current Open Questions

None blocking.

QR package compatibility has been verified. Use `qrcode` plus `@types/qrcode`, not `qrcode.js`.

## Definition of Ready for Coding

The project is ready for implementation when this plan is accepted. The first coding step should be scaffolding the Vite React TypeScript app and installing dependencies, followed by pure transfer utilities before UI work.
