
"use client";

import { Dithering } from "@paper-design/shaders-react";

export default function GradientBackground() {
  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <Dithering
        width={1280}
        height={720}
        colorBack="#00000000"
        colorFront="#242424"
        shape="simplex"
        type="8x8"
        size={2}
        speed={1}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}