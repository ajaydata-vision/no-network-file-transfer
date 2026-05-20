# Handoff: Optical File Transfer

Date: 2026-05-21

## Repository

```text
https://github.com/ajaydata-vision/no-network-file-transfer.git
```

Current branch:

```text
main
```

Latest implementation commit at handoff:

```text
2704778 Improve QR decode reliability
```

## Current State

The app is a browser-only optical file transfer prototype. It has:

- Display Mode for file upload, compression, chunking, hash generation, QR rendering, and timed QR playback.
- Camera Mode for session entry, camera startup, frame scanning, QR decode, chunk validation, reconstruction, and download.
- QR Loopback Test for same-browser validation without physical camera optics.
- Camera Log panel for browser-side camera and QR loopback diagnostics.
- Five-digit dev port configured by default.

The QR loopback path has been tested by the user and successfully showed the reconstructed file on the Camera page.

## Run

```bash
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:15173
```

`npm run dev` uses:

```text
vite --host 127.0.0.1 --port 15173 --strictPort
```

Port `5173` was avoided because another local app was already using it.

## Verification Commands

Latest verification passed:

```bash
npm run build
npm test
```

Test coverage currently includes utility tests for:

- base64 byte round trip
- chunk split/concat
- payload validation
- out-of-order chunk reconstruction
- final file hash verification

## Important Technical Decisions

### QR Package

The prompt originally requested `qrcode.js`, but npm verification showed that package is stale and not TypeScript/Vite-friendly. The implementation uses:

```text
qrcode
@types/qrcode
```

### Chunk Size

Current chunk size:

```ts
CHUNK_SIZE_BYTES = 700;
```

Why:

- `1800` compressed bytes produced JSON payloads around `2795` characters and exceeded QR capacity at error correction level `M`.
- `1000` compressed bytes fit capacity but still caused occasional `jsQR` decode failures on generated QR images.
- `700` compressed bytes is the current reliability-first setting.

This increases transfer time but improves QR decode reliability.

### QR Rendering

QR rendering now uses:

- error correction level `M`
- pure black/white colors
- larger quiet zone
- Display QR width: `640`
- QR loopback retries with larger in-memory render sizes:
  - `960`
  - `1280`
  - `1600`
  - `1920`

### Same-Browser QR Loopback

The current loopback test does not bypass QR anymore. It:

1. Builds the payload.
2. Renders payload as a QR image in memory.
3. Decodes that QR image with `jsQR`.
4. Sends only decoded QR text into receiver validation.
5. Reconstructs and verifies the file.

This proves QR generation, QR decoding, chunk validation, reconstruction, and hashing. It does not prove physical camera optics.

## Current User-Tested Result

The user confirmed:

```text
It worked.. camera page showed me file..
```

That result was after QR loopback reliability fixes.

## Known Limits

- Real optical transfer still needs physical camera testing.
- Same-browser loopback proves QR encode/decode, but not screen-to-camera focus, glare, exposure, motion blur, or camera permission behavior.
- A 1 MB file at current settings may take roughly 6-8 minutes if it does not compress well.
- Large files are technically accepted up to 100 MB but are not practical for QR optical transfer at current settings.
- Camera failures are browser-side; inspect the in-app Camera Log panel, not server logs.
- Dev log files such as `dev-15173.out.log` and `vite-dev.log` were empty during testing.

## User Workflow Now

### QR Loopback Local Test

1. Open Display Mode.
2. Upload file.
3. Start transfer.
4. Switch to Camera Mode in the same tab.
5. Click `Run QR Loopback Test`.
6. Download reconstructed file when shown.

### Real Optical Test

1. Open Display Mode on sender computer.
2. Upload file and start transfer.
3. Open Camera Mode on a second device or second browser with camera access.
4. Enter the session ID.
5. Click Start Camera.
6. Point camera at the sender QR display.
7. Download once transfer completes.

## Next Recommended Work

1. Test with a real phone camera pointed at the display QR stream.
2. If camera scan is unreliable, consider:
   - larger on-screen QR display
   - slower QR interval, such as `500-800 ms`
   - lower chunk size, such as `500`
   - visual scan guide and distance hints
3. Add an exportable diagnostic report from Camera Log.
4. Consider adaptive chunk sizing or automatic QR capacity validation during transfer preparation.
5. Add browser/E2E test coverage for QR loopback flow.

## Recent Commits

```text
2704778 Improve QR decode reliability
2182345 Lower QR chunk size for decode reliability
0b706e3 Remove help panels and raise camera log
77cb6f3 Reduce QR chunk size for capacity
e0ca061 Add QR loopback step logging
6ec03b2 Use QR encode decode loopback test
d0d6fb2 Add camera debug log panel
d1a6f80 Improve camera error handling and local receive test
```
