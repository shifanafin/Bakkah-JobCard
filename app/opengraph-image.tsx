import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Bakkah Premium Auto Care — Car Detailing Dubai, Al Qusais";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #101408 60%, #0a0a0a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(107,122,40,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(107,122,40,0.06) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            width: 700,
            height: 700,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(107,122,40,0.15) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(107,122,40,0.15)",
              border: "1px solid rgba(107,122,40,0.4)",
              borderRadius: 100,
              padding: "8px 20px",
              color: "#8a9a30",
              fontSize: 14,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            ⭐ Trusted Auto Detailing Studio — Al Qusais, Dubai ⭐
          </div>

          {/* Brand name */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <div
              style={{
                color: "#ffffff",
                fontSize: 96,
                fontWeight: 900,
                letterSpacing: "0.1em",
                lineHeight: 0.9,
              }}
            >
              BAKKAH
            </div>
            <div
              style={{
                color: "#6B7A28",
                fontSize: 18,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
              }}
            >
              AUTO PREMIUM CARE
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              width: 120,
              height: 2,
              background: "linear-gradient(90deg, transparent, #6B7A28, transparent)",
            }}
          />

          {/* Services */}
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: "center",
              maxWidth: 900,
            }}
          >
            {["Ceramic Coating", "Paint Correction", "Full Detail", "RTA Inspection", "Fleet Services"].map(
              (s) => (
                <div
                  key={s}
                  style={{
                    background: "rgba(107,122,40,0.12)",
                    border: "1px solid rgba(107,122,40,0.3)",
                    borderRadius: 8,
                    padding: "6px 14px",
                    color: "#a0ad50",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {s}
                </div>
              )
            )}
          </div>

          {/* Trust row */}
          <div
            style={{
              display: "flex",
              gap: 32,
              color: "#888",
              fontSize: 15,
              marginTop: 8,
            }}
          >
            <span>📍 Al Qusais, Dubai UAE</span>
            <span>⭐ 5.0 Google Rating</span>
            <span>🚗 5,000+ Cars Transformed</span>
            <span>📞 +971 54 588 6999</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
