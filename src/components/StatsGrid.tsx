import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow } from "swiper/modules";

// Import Swiper core and required modules styles
import "swiper/css";
import "swiper/css/effect-coverflow";

export function StatsGrid() {
  const cards = [
    {
      title: "NEURAL ACTIVITY",
      value: "7.2M",
      footer: "LIVE SIGNALS INTERPRETED",
      details: [
        "Continuous temporal synapsing",
        "1024 parallel telemetry streams",
        "Dynamic feed classification active"
      ]
    },
    {
      title: "PREDICTIVE MODEL",
      value: "93%",
      footer: "FORECAST ACCURACY RATE",
      details: [
        "Reinforced gradient mapping",
        "Low latency neural resolution",
        "Adaptive signal feedback system"
      ]
    },
    {
      title: "EPOCH LATENCY",
      value: "0.4ms",
      footer: "CYCLE RESPONSE SPEED",
      details: [
        "Hardware accelerated pipeline",
        "Direct metal shader execution",
        "Temporal synchronization loop"
      ]
    },
    {
      title: "COGNITIVE STREAMS",
      value: "14.8M",
      footer: "REAL-TIME MODEL COHERENCE",
      details: [
        "Distributed synapse projection",
        "High-fidelity entropy filtering",
        "Sub-millisecond state coherence"
      ]
    },
    {
      title: "SYNAPSE DEPTH",
      value: "128L",
      footer: "MODEL RESOLUTION DEPTH",
      details: [
        "Deep feed-forward mapping",
        "Transformer-based neural routing",
        "Multi-dimensional pattern projection"
      ]
    },
    {
      title: "SIGNAL INTEGRITY",
      value: "99.9%",
      footer: "NOISE REDUCTION RATIO",
      details: [
        "Advanced wave-let filtering",
        "Dynamic heuristic balancing",
        "Contextual signal amplification"
      ]
    }
  ];

  const css = `
    .Carousal_003 {
      width: 100%;
      height: 520px;
      padding-bottom: 20px !important;
      overflow: visible !important;
    }
    
    .Carousal_003 .swiper-slide {
      background-position: center;
      background-size: cover;
      width: 380px;
      max-width: 85%;
      height: 480px;
    }
  `;

  return (
    <div id="edra-stats-panel" className="w-full pointer-events-auto">
      <style>{css}</style>
      
      <Swiper
        effect="coverflow"
        grabCursor={true}
        slidesPerView="auto"
        centeredSlides={true}
        loop={true}
        observer={true}
        observeParents={true}
        spaceBetween={32}
        coverflowEffect={{
          rotate: 30,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: false,
        }}
        className="Carousal_003"
        modules={[EffectCoverflow]}
      >
        {cards.map((card, index) => (
          <SwiperSlide key={index}>
            <div className="p-1.5 rounded-[28px] bg-white/[0.04] backdrop-blur-md flex flex-col justify-between h-[480px]">
              {/* Premium super-translucent dark glass container with subtle glow for high elite appeal */}
              <div className="bg-black/45 border border-white/5 backdrop-blur-md rounded-[23px] p-8 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-white uppercase tracking-[0.08em] opacity-80">
                      {card.title}
                    </span>
                  </div>

                  {/* High priority metric text perfectly aligned exactly 24px in size/margin below the header */}
                  <div className="mt-[24px] text-left">
                    <span className="font-sans font-normal text-[60px] md:text-[68px] lg:text-[76px] tracking-[-0.04em] text-white leading-none block">
                      {card.value}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  {card.details.map((detail, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px] text-white/60 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/30 mt-1 shrink-0" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Symmetrical footer label bar without borders */}
              <div className="pt-3 pb-2.5 px-6">
                <span className="font-mono text-[10px] font-medium text-white/55 uppercase tracking-widest block truncate">
                  {card.footer}
                </span>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
