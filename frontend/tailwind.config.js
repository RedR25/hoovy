/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "2rem",
        "4xl": "2.5rem",
      },
      fontFamily: {
        friendly: ['"Fredoka"', '"Nunito"', "system-ui", "sans-serif"],
      },
      // Exact colors lifted from the Figma site bundle
      colors: {
        hoovy: {
          // sky/blue family
          sky:        "#47C2FF",
          skyLight:   "#A3E5FF",
          skyDeep:    "#1FA3E6",
          skyShadow:  "#1C86D9",
          // green family (primary CTA)
          green:      "#3CB84B",
          greenLight: "#59D968",
          // red / pink family
          pink:       "#FF4766",
          pinkDeep:   "#D93D55",
          pinkSoft:   "#FF7EB3",
          // orange family
          orange:     "#FF9800",
          orangeDeep: "#CC7A00",
          orangeSoft: "#FFE8CC",
          // yellow family
          yellow:     "#FFD833",
          yellowSoft: "#FFF8B3",
          yellowDeep: "#D98A1C",
          // purple
          purple:     "#A877FF",
          purpleDeep: "#8A4FCC",
          // brown (tree trunks etc)
          brown:      "#A36F45",
          brownDeep:  "#664024",
          // neutrals
          cream:      "#FFFDF5",
          navy:       "#2A3A50",

          // Backwards-compat aliases — older files still reference these.
          // Map to the closest Figma palette equivalent.
          bg:         "#FFFDF5",   // was: lavender; now: cream
          blue:       "#47C2FF",   // alias for sky
          cta:        "#3CB84B",   // alias for green
        },
      },
      boxShadow: {
        // Soft outer drop for floating cards
        cardLift: "0 10px 20px rgba(0,0,0,0.1)",
        // Inset cloud highlight
        cloud: "inset -4px -6px 12px rgba(71,194,255,0.2), 0 10px 20px rgba(0,0,0,0.05)",
        // Sun outer glow
        sunGlow: "0 0 50px rgba(255,216,51,0.6), inset -6px -6px 15px rgba(255,152,0,0.5)",
      },
      backgroundImage: {
        sky: "linear-gradient(to bottom, #47C2FF 0%, #A3E5FF 100%)",
        cream: "linear-gradient(to bottom, #FFFDF5, #FFF8E1)",
      },
    },
  },
  plugins: [],
};
