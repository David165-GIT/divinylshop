import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import christmasGarland from "@/assets/christmas-garland.png";

const ChristmasOverlay = () => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fetchMode = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "christmas_mode")
        .single();
      setEnabled(data?.value === "true");
    };
    fetchMode();

    const channel = supabase
      .channel("christmas-mode")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings", filter: "key=eq.christmas_mode" },
        (payload: any) => {
          setEnabled(payload.new?.value === "true");
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (!enabled) return null;

  // Subtle snowflakes
  const snowflakes = Array.from({ length: 80 }, (_, i) => ({
    left: `${(i / 80) * 100 + Math.random() * 2}%`,
    animationDuration: `${6 + Math.random() * 10}s`,
    animationDelay: `${Math.random() * 10}s`,
    fontSize: `${6 + Math.random() * 14}px`,
    opacity: 0.2 + Math.random() * 0.5,
  }));

  return (
    <>
      {/* Subtle snowflakes */}
      {snowflakes.map((style, i) => (
        <div
          key={i}
          className="fixed pointer-events-none animate-snowfall z-[60]"
          style={{ ...style, color: "hsl(var(--foreground) / 0.2)" }}
        >
          ✦
        </div>
      ))}

      {/* Christmas garland border at top */}
      <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
        <img
          src={christmasGarland}
          alt=""
          className="w-full object-cover object-bottom"
          style={{ height: "70px" }}
        />
      </div>

      {/* Snow pile at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-[58] pointer-events-none">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-8 md:h-12">
          <path
            d="M0,60 L0,35 Q60,15 120,30 Q180,45 240,28 Q300,10 360,25 Q420,40 480,22 Q540,5 600,20 Q660,35 720,18 Q780,2 840,22 Q900,42 960,25 Q1020,8 1080,28 Q1140,48 1200,30 Q1260,12 1320,32 Q1380,52 1440,35 L1440,60 Z"
            fill="hsl(var(--background))"
            stroke="none"
          />
          <path
            d="M0,60 L0,42 Q80,28 160,38 Q240,48 320,35 Q400,22 480,32 Q560,42 640,30 Q720,18 800,33 Q880,48 960,35 Q1040,22 1120,37 Q1200,52 1280,38 Q1360,24 1440,40 L1440,60 Z"
            fill="white"
            opacity="0.5"
            stroke="none"
          />
        </svg>
      </div>
    </>
  );
};

export default ChristmasOverlay;
