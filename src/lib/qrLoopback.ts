import QRCode from "qrcode";
import jsQR from "jsqr";

export async function encodeAndDecodeQrText(text: string): Promise<string> {
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, text, {
    errorCorrectionLevel: "M",
    margin: 3,
    width: 560,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create QR loopback canvas.");
  }

  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const decoded = jsQR(image.data, image.width, image.height, {
    inversionAttempts: "attemptBoth",
  });

  if (!decoded?.data) {
    throw new Error("QR loopback decoder could not read the generated QR image.");
  }

  return decoded.data;
}
