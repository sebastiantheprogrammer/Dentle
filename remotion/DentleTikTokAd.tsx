import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const green = "#057a6d";
const red = "#d83a2e";
const ink = "#08130f";
const muted = "#5b6b65";
const paper = "#f7fbf8";
const mint = "#dff3ed";
const gold = "#f4c95d";

const scenes = [
  {
    start: 0,
    duration: 180,
    kicker: "Dental students",
    title: "Your daily diagnosis game is here.",
    body: "Dentle turns clinical clues into a fast Wordle-style challenge.",
  },
  {
    start: 180,
    duration: 240,
    kicker: "How it works",
    title: "Read the case. Study the image. Guess the diagnosis.",
    body: "Start with useful clues, then narrow it down like you would in clinic.",
  },
  {
    start: 420,
    duration: 270,
    kicker: "Five boards",
    title: "Pick your lane.",
    body: "Dentle Dx, Radiograph, Oral Path, Treatment Plan, and Emergency.",
  },
  {
    start: 690,
    duration: 300,
    kicker: "Demo",
    title: "Type a diagnosis and get instant color feedback.",
    body: "Green means correct, amber means close, red means wrong.",
  },
  {
    start: 990,
    duration: 270,
    kicker: "Built for habit",
    title: "New dental cases can generate daily.",
    body: "The admin tools control AI cases, images, subscribers, and analytics.",
  },
  {
    start: 1260,
    duration: 300,
    kicker: "Challenge your class",
    title: "Can you solve today's Dentle?",
    body: "Post your score, compare boards, and come back tomorrow.",
  },
  {
    start: 1560,
    duration: 240,
    kicker: "Dentle.org",
    title: "Launch the dental Wordle.",
    body: "A quick daily warmup for dental school, boards, and clinic brain.",
  },
];

const boards = ["Dentle Dx", "Radiograph", "Oral Path", "Treatment", "Emergency"];
const guesses = ["Gingivit", "Gingivitis", "Periapical cyst"];

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const sceneProgress = (frame: number, start: number, duration: number) =>
  interpolate(frame, [start, start + duration], [0, 1], clamp);

const fade = (frame: number, start: number, duration: number) => {
  const inOpacity = interpolate(frame, [start, start + 24], [0, 1], {
    ...clamp,
    easing: ease,
  });
  const outOpacity = interpolate(frame, [start + duration - 24, start + duration], [1, 0], {
    ...clamp,
    easing: ease,
  });
  return Math.min(inOpacity, outOpacity);
};

const ToothLogo = ({ small = false }: { small?: boolean }) => (
  <div
    style={{
      width: small ? 58 : 78,
      height: small ? 58 : 78,
      borderRadius: small ? 18 : 24,
      background: ink,
      display: "grid",
      placeItems: "center",
      color: paper,
      fontSize: small ? 35 : 48,
      fontWeight: 900,
      boxShadow: "0 18px 40px rgba(8, 19, 15, 0.18)",
    }}
  >
    <svg width={small ? 34 : 46} height={small ? 34 : 46} viewBox="0 0 64 64" fill="none">
      <path
        d="M20.5 6.7c4.8-2 7.6.7 11.5.7s6.7-2.7 11.5-.7c8.3 3.5 9.6 14 5.6 24.1-2.6 6.7-4 19.7-9.3 24.3-3.6 3.1-5.5-7.9-7.8-7.9s-4.2 11-7.8 7.9c-5.3-4.6-6.7-17.6-9.3-24.3-4-10.1-2.7-20.6 5.6-24.1Z"
        fill="currentColor"
      />
    </svg>
  </div>
);

const PhoneMock = ({
  frame,
  image,
  label,
  zoomStart,
}: {
  frame: number;
  image: string;
  label: string;
  zoomStart: number;
}) => {
  const scale = interpolate(frame, [zoomStart, zoomStart + 90], [0.93, 1], {
    ...clamp,
    easing: ease,
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 108,
        top: 620,
        width: 864,
        height: 1020,
        borderRadius: 56,
        background: "#0c1915",
        padding: 20,
        boxShadow: "0 42px 90px rgba(5, 122, 109, 0.28)",
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          height: 46,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#b9d9d0",
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        {label}
      </div>
      <div style={{ height: 914, overflow: "hidden", borderRadius: 38, background: paper }}>
        <Img
          src={staticFile(image)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: image.includes("admin") ? "top center" : "center top",
          }}
        />
      </div>
    </div>
  );
};

const BoardCards = ({ frame, start }: { frame: number; start: number }) => (
  <div
    style={{
      position: "absolute",
      left: 90,
      top: 690,
      width: 900,
      display: "grid",
      gap: 22,
    }}
  >
    {boards.map((board, index) => {
      const y = interpolate(frame, [start + index * 10, start + 36 + index * 10], [60, 0], {
        ...clamp,
        easing: ease,
      });
      const opacity = interpolate(frame, [start + index * 10, start + 30 + index * 10], [0, 1], {
        ...clamp,
        easing: ease,
      });
      return (
        <div
          key={board}
          style={{
            opacity,
            transform: `translateY(${y}px)`,
            height: 126,
            borderRadius: 28,
            background: index === 0 ? mint : "#ffffff",
            border: `4px solid ${index === 0 ? green : "#d4e2dd"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 38px",
            boxShadow: "0 24px 60px rgba(8, 19, 15, 0.09)",
          }}
        >
          <span style={{ fontSize: 44, fontWeight: 900, color: ink }}>{board}</span>
          <span style={{ fontSize: 28, fontWeight: 800, color: green }}>Daily</span>
        </div>
      );
    })}
  </div>
);

const GuessDemo = ({ frame, start }: { frame: number; start: number }) => (
  <div
    style={{
      position: "absolute",
      left: 86,
      top: 670,
      width: 908,
      borderRadius: 38,
      background: "#ffffff",
      padding: 34,
      boxShadow: "0 36px 80px rgba(8, 19, 15, 0.13)",
      border: "4px solid #dbe7e2",
    }}
  >
    <div style={{ fontSize: 30, color: muted, fontWeight: 800, marginBottom: 20 }}>Diagnosis</div>
    <div
      style={{
        height: 94,
        borderRadius: 24,
        border: "4px solid #b9d8cf",
        display: "flex",
        alignItems: "center",
        paddingLeft: 28,
        fontSize: 44,
        fontWeight: 900,
        color: ink,
      }}
    >
      {guesses[Math.min(2, Math.floor(Math.max(0, frame - start) / 78))]}
      <span
        style={{
          width: 4,
          height: 48,
          background: green,
          marginLeft: 8,
          opacity: interpolate(frame % 30, [0, 14, 15, 29], [1, 1, 0, 0], clamp),
        }}
      />
    </div>
    <div style={{ display: "grid", gap: 18, marginTop: 28 }}>
      {[
        ["Location", "close", gold],
        ["Category", "wrong", red],
        ["Diagnosis", "correct", green],
      ].map(([label, status, color], index) => {
        const opacity = interpolate(frame, [start + 80 + index * 30, start + 110 + index * 30], [0, 1], {
          ...clamp,
          easing: ease,
        });
        return (
          <div
            key={label}
            style={{
              opacity,
              height: 86,
              borderRadius: 24,
              background: color,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 28px",
              fontSize: 30,
              fontWeight: 900,
              textTransform: "uppercase",
            }}
          >
            <span>{label}</span>
            <span>{status}</span>
          </div>
        );
      })}
    </div>
  </div>
);

const SubscribePopup = ({ frame, start }: { frame: number; start: number }) => {
  const y = interpolate(frame, [start, start + 40], [140, 0], { ...clamp, easing: ease });
  const opacity = interpolate(frame, [start, start + 35], [0, 1], { ...clamp, easing: ease });

  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        bottom: 170,
        width: 920,
        borderRadius: 36,
        background: ink,
        color: "#fff",
        padding: "34px 38px",
        opacity,
        transform: `translateY(${y}px)`,
        boxShadow: "0 30px 80px rgba(8, 19, 15, 0.28)",
      }}
    >
      <div style={{ fontSize: 34, fontWeight: 950, marginBottom: 10 }}>New Dentle drops tomorrow</div>
      <div style={{ fontSize: 26, color: "#cfe7df", lineHeight: 1.25 }}>
        Subscribe for the daily dental challenge and keep your streak alive.
      </div>
    </div>
  );
};

const Caption = ({ scene }: { scene: (typeof scenes)[number] }) => {
  const frame = useCurrentFrame();
  const p = sceneProgress(frame, scene.start, scene.duration);
  const opacity = fade(frame, scene.start, scene.duration);
  const y = interpolate(p, [0, 0.25], [42, 0], { ...clamp, easing: ease });

  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        top: 156,
        width: 936,
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 16,
          background: "#ffffff",
          borderRadius: 999,
          padding: "14px 22px",
          fontSize: 28,
          fontWeight: 900,
          color: green,
          boxShadow: "0 14px 40px rgba(8, 19, 15, 0.09)",
        }}
      >
        <ToothLogo small />
        {scene.kicker}
      </div>
      <div
        style={{
          marginTop: 34,
          fontSize: 74,
          lineHeight: 0.94,
          fontWeight: 950,
          letterSpacing: 0,
          color: ink,
        }}
      >
        {scene.title}
      </div>
      <div
        style={{
          marginTop: 28,
          fontSize: 34,
          lineHeight: 1.22,
          fontWeight: 760,
          color: muted,
          maxWidth: 820,
        }}
      >
        {scene.body}
      </div>
    </div>
  );
};

const ProgressBar = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const width = interpolate(frame, [0, durationInFrames], [0, 940], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        bottom: 70,
        width: 940,
        height: 12,
        borderRadius: 999,
        background: "#d8e7e1",
        overflow: "hidden",
      }}
    >
      <div style={{ width, height: "100%", borderRadius: 999, background: green }} />
    </div>
  );
};

export const DentleTikTokAd = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: paper, fontFamily: "Arial, Helvetica, sans-serif", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 20% 18%, rgba(244, 201, 93, 0.32), transparent 30%), linear-gradient(180deg, #f7fbf8 0%, #eaf7f2 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 76,
          left: 72,
          right: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: ink,
          fontWeight: 950,
          fontSize: 34,
        }}
      >
        <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
          <ToothLogo small />
          <span>Dentle</span>
        </div>
        <span style={{ color: green }}>dentle.org</span>
      </div>

      {scenes.map((scene) => (
        <Caption key={scene.start} scene={scene} />
      ))}

      <Sequence from={120} durationInFrames={300}>
        <PhoneMock frame={frame} image="ad/dentle-home.png" label="How to play" zoomStart={120} />
      </Sequence>

      <Sequence from={420} durationInFrames={270}>
        <BoardCards frame={frame} start={420} />
      </Sequence>

      <Sequence from={690} durationInFrames={300}>
        <GuessDemo frame={frame} start={690} />
      </Sequence>

      <Sequence from={990} durationInFrames={300}>
        <PhoneMock frame={frame} image="ad/dentle-admin.png" label="AI daily admin" zoomStart={990} />
      </Sequence>

      <Sequence from={1260} durationInFrames={300}>
        <PhoneMock frame={frame} image="ad/dentle-boards.png" label="Choose a board" zoomStart={1260} />
        <SubscribePopup frame={frame} start={1380} />
      </Sequence>

      <Sequence from={1560} durationInFrames={240}>
        <div
          style={{
            position: "absolute",
            left: 70,
            top: 640,
            width: 940,
            height: 560,
            borderRadius: 48,
            background: ink,
            color: "#fff",
            padding: 56,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 44px 100px rgba(8, 19, 15, 0.26)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 36 }}>
              <ToothLogo />
              <div style={{ fontSize: 44, fontWeight: 950 }}>Dentle</div>
            </div>
            <div style={{ fontSize: 66, lineHeight: 0.98, fontWeight: 950 }}>The daily dental diagnosis game.</div>
          </div>
          <div
            style={{
              height: 92,
              borderRadius: 999,
              background: green,
              display: "grid",
              placeItems: "center",
              color: "#fff",
              fontSize: 38,
              fontWeight: 950,
            }}
          >
            Play at dentle.org
          </div>
        </div>
      </Sequence>

      <ProgressBar />
    </AbsoluteFill>
  );
};
