"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

// 2층(사용성): 담당자가 노동자용 링크를 QR로 바로 발급 — 외부 서비스 호출 없이 로컬에서 생성한다.
export function QRCodeImage({ url, size = 160 }: { url: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(url, { width: size, margin: 1 }).then(setDataUrl);
  }, [url, size]);

  if (!dataUrl) return <div style={{ width: size, height: size }} className="rounded bg-zinc-100 dark:bg-zinc-800" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={dataUrl} width={size} height={size} alt={`QR: ${url}`} className="rounded bg-white p-1" />;
}
