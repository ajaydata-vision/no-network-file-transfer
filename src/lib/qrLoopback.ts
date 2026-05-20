import QRCode from "qrcode";
import jsQR from "jsqr";

export async function encodeAndDecodeQrText(text: string): Promise<string> {
  const attempts = [
    { width: 960, margin: 4 },
    { width: 1280, margin: 6 },
    { width: 1600, margin: 8 },
    { width: 1920, margin: 10 },
  ];

  let lastSize = "unknown";

  for (const attempt of attempts) {
    const canvas = document.createElement("canvas");
    await QRCode.toCanvas(canvas, text, {
      errorCorrectionLevel: "M",
      margin: attempt.margin,
      width: attempt.width,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    lastSize = `${canvas.width}x${canvas.height}`;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not create QR loopback canvas.");
    }

    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const decoded = jsQR(image.data, image.width, image.height, {
      inversionAttempts: "attemptBoth",
    });

    if (decoded?.data) {
      return decoded.data;
    }
  }

  throw new Error(
    `QR loopback decoder could not read generated QR image after ${attempts.length} render attempts (last ${lastSize}, ${text.length} chars).`,
  );
}
