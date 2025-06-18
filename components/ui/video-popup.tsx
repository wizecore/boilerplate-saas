"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Play, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type AnimationStyle =
  | "from-bottom"
  | "from-center"
  | "from-top"
  | "from-left"
  | "from-right"
  | "fade"
  | "top-in-bottom-out"
  | "left-in-right-out";

interface HeroVideoProps {
  animationStyle?: AnimationStyle;
  videoSrc: string;
  thumbnailSrc: string;
  thumbnailSrcDark?: string;
  thumbnailAlt?: string;
  className?: string;
}

const animationVariants = {
  "from-bottom": {
    initial: { y: "100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  },
  "from-center": {
    initial: { scale: 0.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.5, opacity: 0 },
  },
  "from-top": {
    initial: { y: "-100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "-100%", opacity: 0 },
  },
  "from-left": {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "-100%", opacity: 0 },
  },
  "from-right": {
    initial: { x: "100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  "top-in-bottom-out": {
    initial: { y: "-100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  },
  "left-in-right-out": {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  },
};

export default function           VideoPopup({
  animationStyle = "from-center",
  videoSrc,
  thumbnailSrc,
  thumbnailSrcDark,
  thumbnailAlt = "Video thumbnail",
  className,
}: HeroVideoProps) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const selectedAnimation = animationVariants[animationStyle];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsVideoOpen(false);
      }
    };

    if (isVideoOpen) {
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.removeEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isVideoOpen]);

  return (
    <div className={cn("relative", className)}>
      <a
        className="block group relative cursor-pointer focus:outline-blue-50 plausible-event-name=IntroVideo"
        onClick={(e) => {
          e.preventDefault();
          setIsVideoOpen(true)
        }}
      >
        <img
          src={thumbnailSrc}
          alt={thumbnailAlt}
          width={1920}
          height={1080}
          className={cn("w-full block dark:hidden rounded-md shadow-lg transition-all duration-200 ease-out", 
            isVideoOpen && "invisible"
          )}
        />
        <img
          src={thumbnailSrcDark}
          alt={thumbnailAlt}
          width={1920}
          height={1080}
          className={cn("w-full hidden dark:block rounded-md shadow-lg transition-all duration-200 ease-out", 
            isVideoOpen && "invisible"
          )}
        />
        <div className="absolute inset-0 scale-50 md:scale-90 flex items-center justify-center rounded-md transition-all duration-200 ease-out">
          <div className="flex size-28 items-center justify-center rounded-full bg-primary/10 backdrop-blur-md brightness-[0.7] group-hover:brightness-100">
            <div
              className="relative flex size-24 items-center justify-center rounded-full bg-gradient-to-b from-blue-600 to-blue-900 shadow-md transition-all duration-200 ease-out"
            >
              <Play
                className="size-8 fill-white text-white transition-transform duration-200 ease-out"
                style={{
                  filter:
                    "drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06))",
                }}
              />
            </div>
          </div>
        </div>
      </a>
      <AnimatePresence>
        {isVideoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setIsVideoOpen(false)}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md rounded-md overflow-clip"
          >
            <motion.div
              {...selectedAnimation}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative aspect-video w-full"
              
            >
              <motion.button 
                className="absolute -top-12 right-0 rounded-md bg-neutral-900/50 p-2 text-xl text-white ring-1 backdrop-blur-md dark:bg-neutral-100/50 dark:text-black">
                <XIcon className="size-3 md:size-5" />
              </motion.button>
              <div className="relative isolate z-[1] size-full overflow-hidden rounded-md border border-foreground/20">
                <iframe
                  onKeyDown={e => {
                    if (e.key === "Escape") {
                      setIsVideoOpen(false);
                    }
                  }}
                  src={videoSrc}
                  className="size-full rounded-md"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                ></iframe>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
