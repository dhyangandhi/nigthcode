export type ThemeColors = {
    primary: string;
    planMode: string;
    selection: string;
    thinking: string;
    succcess: string;
    error: string;
    info: string;
    background: string;
    surface: string;
    dialogSurface: string;
    thinkingBorder: string;
    dimSeparator: string;
};

export type Theme = {
    name: string;
    colors: ThemeColors;
};

export const THEMES: Theme[] = [
    {
        name: "Nightfox",
        colors: {
            primary: "#56D6C2",
            planMode: "#CF8EF4",
            selection: "#89B4FA",
            thinking: "#CF8EF4",
            succcess: "#82E0AA",
            error: "#FF6B6B",
            info: "#56D6C2",
            background: "#0D0D12",
            surface: "#1A1A24",
            dialogSurface: "#0A0A10",
            thinkingBorder: "#34344A",
            dimSeparator: "#4E4E66",
        },
    },
]

export const DEFAULT_THEME = THEMES.find((t) => t.name === "Nightfox") ?? THEMES[0]!;
