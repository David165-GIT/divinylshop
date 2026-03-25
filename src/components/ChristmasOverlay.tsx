import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import santaSleigh from "@/assets/santa-sleigh.png";

const ChristmasOverlay = () => {
  const [enabled, setEnabled] = useState(false);
  const [santa, setSanta] = useState<{ visible: boolean; top: number; direction: "ltr" | "rtl" } | null>(null);

  const launchSanta = useCallback(() => {
    const top = 5 + Math.random() * 60; // random vertical position 5-65%
    const direction = Math.random() > 0.5 ? "ltr" : "rtl";
    setSanta({ visible: true, top, direction });
    // Hide after animation completes (4s)
    setTimeout(() => setSanta(null), 4000);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // Launch once shortly after enabling
    const initialTimeout = setTimeout(launchSanta, 3000);
    // Then every 20 seconds
    const interval = setInterval(launchSanta, 20000);
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [enabled, launchSanta]);
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

      {/* Elegant garland - thin warm lights */}
      <div className="fixed top-0 left-0 right-0 z-[59] pointer-events-none">
        <div className="flex justify-between px-2">
          {Array.from({ length: 30 }, (_, i) => (
            <div
              key={i}
              className="flex flex-col items-center"
            >
              <div className="w-px h-2 bg-foreground/10" />
              <div
                className="w-2 h-2 rounded-full animate-christmas-glow"
                style={{
                  backgroundColor: ["#c0392b", "#27ae60", "#d4a017", "#c0392b", "#27ae60"][i % 5],
                  animationDelay: `${i * 0.3}s`,
                  boxShadow: `0 0 4px ${["#c0392b", "#27ae60", "#d4a017", "#c0392b", "#27ae60"][i % 5]}40`,
                }}
              />
            </div>
          ))}
        </div>
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

      {/* Santa sleigh flying across */}
      {santa?.visible && (
        <div
          className={`fixed z-[61] pointer-events-none ${santa.direction === "ltr" ? "animate-santa-ltr" : "animate-santa-rtl"}`}
          style={{ top: `${santa.top}%`, left: 0 }}
        >
          <img
            src={santaSleigh}
            alt=""
            className="h-20 md:h-28"
            width={1024}
            height={512}
          />
        </div>
      )}
    </>
  );
};

export default ChristmasOverlay;
