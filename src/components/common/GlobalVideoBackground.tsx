import { useEffect, useRef, useState, memo } from "react";
import { useLocation } from "react-router-dom";

export const GlobalVideoBackground = memo(function GlobalVideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const setPlaybackRateSafe = (rate: number) => {
      try {
        if (video) {
          video.playbackRate = rate;
          video.defaultPlaybackRate = rate;
        }
      } catch (err) {
        console.warn("Could not set playback rate safely on iOS:", err);
      }
    };

    setPlaybackRateSafe(1.5);

    const handleCanPlay = () => {
      setPlaybackRateSafe(1.5);
    };
    
    const handlePlaying = () => {
      setHasPlayed(true);
    };

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("playing", handlePlaying);

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setPlaybackRateSafe(1.5);
        })
        .catch((err) => {
          console.log("Video autoplay blocked by browser policy:", err);
        });
    }

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("playing", handlePlaying);
    };
  }, []);

  return (
    <>
      <div 
        className="fixed inset-0 w-full h-full pointer-events-none transition-opacity duration-500"
        style={{
          backgroundColor: "#0b130e",
          zIndex: -2,
          opacity: isHomePage ? 1 : 0
        }}
      />
      <video
        ref={videoRef}
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[115%] h-[115%] object-cover object-top pointer-events-none transition-opacity duration-500"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260329_050842_be71947f-f16e-4a14-810c-06e83d23ddb5.mp4"
        poster={hasPlayed ? undefined : "/images/hero-bg.png"}
        autoPlay
        loop
        muted
        playsInline
        style={{
          backgroundColor: "transparent",
          zIndex: -1,
          opacity: isHomePage ? 1 : 0.001
        }}
      />
    </>
  );
});
