import { Composition } from "remotion";
import { DentleTikTokAd } from "./DentleTikTokAd";

export const RemotionRoot = () => {
  return (
    <Composition
      id="DentleTikTokAd"
      component={DentleTikTokAd}
      durationInFrames={1800}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
