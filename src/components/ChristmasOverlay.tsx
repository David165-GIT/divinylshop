import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import santaDj from "@/assets/santa-dj.jpg";

const Snowflake = ({ style }: { style: React.CSSProperties }) => (
  <div className="fixed pointer-events-none text-white/80 animate-snowfall z-[60]" style={style}>
    ❄
  </div>
);

const ChristmasOverlay = () => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "christmas_mode")
        .single();
      setEnabled(data?.value === "true");
    };
    fetch();

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

  const snowflakes = Array.from({ length: 25 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    animationDuration: `${4 + Math.random() * 6}s`,
    animationDelay: `${Math.random() * 5}s`,
    fontSize: `${10 + Math.random() * 18}px`,
    opacity: 0.4 + Math.random() * 0.6,
  }));

  return (
    <>
      {/* Snowflakes */}
      {snowflakes.map((style, i) => (
        <Snowflake key={i} style={style} />
      ))}

      {/* Santa DJ - bottom right */}
      <div className="fixed bottom-4 right-4 z-[61] animate-fade-in-up pointer-events-none">
        <img
          src={santaDj}
          alt="Père Noël DJ"
          className="w-28 md:w-36 drop-shadow-lg"
        />
      </div>

      {/* Garland top */}
      <div className="fixed top-0 left-0 right-0 z-[59] pointer-events-none flex justify-center">
        <div className="flex gap-3 py-1">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full animate-pulse"
              style={{
                backgroundColor: ["#e74c3c", "#27ae60", "#f1c40f", "#e74c3c", "#27ae60"][i % 5],
                animationDelay: `${i * 0.2}s`,
                animationDuration: "1.5s",
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default ChristmasOverlay;
