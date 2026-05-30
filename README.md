# Optical File Transfer

Browser-only file transfer through QR codes. One browser displays encoded file chunks as QR frames. Another browser or phone camera scans those frames, verifies chunk hashes, reconstructs the original file, and downloads it.

No backend, no accounts, no external services.

## Tech Stack

- React 18, TypeScript, Vite
- React Router for Display and Camera modes
- Tailwind CSS 3
- Zustand state store
- `qrcode` for QR generation
- `jsqr` for QR decoding
- `pako` for gzip/gunzip
- `crypto-js` for SHA-256
- `uuid` for session IDs

## Run Locally

```bash
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:15173/generate
```

Camera access works on `localhost` in modern browsers.

For a second device on the same network, run:

```bash
npm run dev:lan
```

Then open the app from your computer's LAN address, for example:

```text
http://192.168.1.10:15173
```

Use that LAN base URL in the Generate QR page's `Camera URL QR` field so a phone can scan one setup QR and open the camera URL with the session prefilled.

Phone camera access usually requires HTTPS for LAN URLs. `localhost` works for local
testing, but a phone opening `http://192.168...` may block camera permission until the
app is served over HTTPS.

## Modes

### Generate QR

1. Open `/generate`.
2. Select a file up to 10 MB.
3. Click `Start Transfer`.
4. Copy/share the session ID.
5. Keep the QR code visible. The sender loops chunks until stopped or expired.

### Scan QR to File

1. Open `/camera` on another device or tab.
2. Enter the session ID.
3. Click `Start Camera`.
4. Point the camera at the display QR sequence.
5. Download the verified file when transfer completes.

### Same-Browser QR Loopback Test

For local verification without a second device:

1. Create a Generate QR transfer.
2. Switch to Scan QR to File in the same browser.
3. Click `Run QR Loopback Test`.
4. The app renders each chunk as a QR image in memory, decodes that QR image with `jsQR`, then sends only the decoded QR text into the receiver.
5. The receiver validates chunk hashes, reconstructs the file, verifies the final file hash, and shows the download when reconstruction succeeds.

This proves compression, chunking, QR generation, QR decoding, payload validation, reconstruction, and hashing. It does not test real camera optics.

## Important Practical Notes

- The default QR interval is 300 ms.
- Chunk size is 700 compressed bytes to keep JSON payloads inside QR capacity and improve `jsQR` decode reliability.
- Large files can take a long time over optical QR transfer.
- The receiver cannot validate that a session exists before scanning because there is no backend. It validates the UUID format first, then validates scanned QR payloads.
- Real optical testing needs a physical camera, phone, external webcam, or virtual camera pointed at the display.

## Scripts

```bash
npm run dev
npm run dev:lan
npm run build
npm test
```

## Verification

The implementation includes utility tests for:

- base64 byte round trip
- chunk split/concat
- out-of-order chunk reconstruction
- payload chunk hash validation
- final file hash validation

## Repository

```text
https://github.com/ajaydata-vision/no-network-file-transfer.git
```
