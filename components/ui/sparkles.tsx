"use client";

import React, { useId } from "react";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import { type Engine } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import { cn } from "@/lib/utils";

type ParticlesProps = {
  id?: string;
  className?: string;
  background?: string;
  particleSize?: number;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
};

// Stable init callback required by ParticlesProvider
const initParticles = async (engine: Engine) => {
  await loadSlim(engine);
};

export const SparklesCore = (props: ParticlesProps) => {
  const {
    id,
    className,
    background,
    minSize,
    maxSize,
    speed,
    particleColor,
    particleDensity,
  } = props;

  const generatedId = useId();
  const particleId = id || generatedId;

  return (
    <ParticlesProvider init={initParticles}>
      <div className={cn("w-full h-full relative pointer-events-none select-none", className)}>
        <Particles
          id={particleId}
          className="w-full h-full"
          options={
            {
              background: {
                color: {
                  value: background || "transparent",
                },
              },
              fullScreen: {
                enable: false,
                zIndex: 0,
              },
              fpsLimit: 120,
              interactivity: {
                events: {
                  onClick: {
                    enable: false,
                  },
                  onHover: {
                    enable: false,
                  },
                  resize: {
                    enable: true,
                  },
                },
              },
              particles: {
                color: {
                  value: particleColor || "#ffffff",
                },
                move: {
                  enable: true,
                  direction: "none",
                  speed: speed || 0.6,
                  random: true,
                  straight: false,
                  outModes: {
                    default: "out",
                  },
                },
                number: {
                  value: particleDensity || 90,
                  density: {
                    enable: true,
                    width: 1200,
                    height: 800,
                  },
                },
                opacity: {
                  value: {
                    min: 0.25,
                    max: 0.9,
                  },
                  animation: {
                    enable: true,
                    speed: 1.5,
                    sync: false,
                  },
                },
                size: {
                  value: {
                    min: minSize || 1,
                    max: maxSize || 2.5,
                  },
                  animation: {
                    enable: true,
                    speed: 2,
                    sync: false,
                  },
                },
                shape: {
                  type: "circle",
                },
              },
              detectRetina: true,
            } as any
          }
        />
      </div>
    </ParticlesProvider>
  );
};
