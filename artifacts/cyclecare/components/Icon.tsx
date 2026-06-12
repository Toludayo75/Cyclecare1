/**
 * SVG-based icon component — uses react-native-svg directly.
 * No font loading required; works reliably on web, iOS, and Android.
 *
 * Drop-in Feather API: <Feather name="heart" size={20} color="#E96C8A" />
 */
import React from "react";
import Svg, {
  Circle,
  Line,
  Path,
  Polygon,
  Polyline,
  Rect,
} from "react-native-svg";

type FeatherProps = {
  name: string;
  size?: number;
  color?: string;
  style?: object;
};

const STROKE = {
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeWidth: 2,
  fill: "none" as const,
};

type IconFn = (color: string) => React.ReactNode;

const ICONS: Record<string, IconFn> = {
  activity: (c) => (
    <Polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke={c} {...STROKE} />
  ),
  "alert-circle": (c) => (
    <>
      <Circle cx="12" cy="12" r="10" stroke={c} {...STROKE} />
      <Line x1="12" y1="8" x2="12" y2="12" stroke={c} {...STROKE} />
      <Line x1="12" y1="16" x2="12.01" y2="16" stroke={c} {...STROKE} />
    </>
  ),
  "arrow-left": (c) => (
    <>
      <Line x1="19" y1="12" x2="5" y2="12" stroke={c} {...STROKE} />
      <Polyline points="12 19 5 12 12 5" stroke={c} {...STROKE} />
    </>
  ),
  bell: (c) => (
    <>
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={c} {...STROKE} />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={c} {...STROKE} />
    </>
  ),
  book: (c) => (
    <>
      <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke={c} {...STROKE} />
      <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke={c} {...STROKE} />
    </>
  ),
  "book-open": (c) => (
    <>
      <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke={c} {...STROKE} />
      <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke={c} {...STROKE} />
    </>
  ),
  calendar: (c) => (
    <>
      <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={c} {...STROKE} />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={c} {...STROKE} />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={c} {...STROKE} />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={c} {...STROKE} />
    </>
  ),
  check: (c) => (
    <Polyline points="20 6 9 17 4 12" stroke={c} {...STROKE} />
  ),
  "check-circle": (c) => (
    <>
      <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke={c} {...STROKE} />
      <Polyline points="22 4 12 14.01 9 11.01" stroke={c} {...STROKE} />
    </>
  ),
  "chevron-down": (c) => (
    <Polyline points="6 9 12 15 18 9" stroke={c} {...STROKE} />
  ),
  "chevron-left": (c) => (
    <Polyline points="15 18 9 12 15 6" stroke={c} {...STROKE} />
  ),
  "chevron-right": (c) => (
    <Polyline points="9 18 15 12 9 6" stroke={c} {...STROKE} />
  ),
  "chevron-up": (c) => (
    <Polyline points="18 15 12 9 6 15" stroke={c} {...STROKE} />
  ),
  clock: (c) => (
    <>
      <Circle cx="12" cy="12" r="10" stroke={c} {...STROKE} />
      <Polyline points="12 6 12 12 16 14" stroke={c} {...STROKE} />
    </>
  ),
  download: (c) => (
    <>
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={c} {...STROKE} />
      <Polyline points="7 10 12 15 17 10" stroke={c} {...STROKE} />
      <Line x1="12" y1="15" x2="12" y2="3" stroke={c} {...STROKE} />
    </>
  ),
  droplet: (c) => (
    <Path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" stroke={c} {...STROKE} />
  ),
  "edit-2": (c) => (
    <Path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke={c} {...STROKE} />
  ),
  eye: (c) => (
    <>
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={c} {...STROKE} />
      <Circle cx="12" cy="12" r="3" stroke={c} {...STROKE} />
    </>
  ),
  "eye-off": (c) => (
    <>
      <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke={c} {...STROKE} />
      <Line x1="1" y1="1" x2="23" y2="23" stroke={c} {...STROKE} />
    </>
  ),
  heart: (c) => (
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke={c} {...STROKE} />
  ),
  "help-circle": (c) => (
    <>
      <Circle cx="12" cy="12" r="10" stroke={c} {...STROKE} />
      <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke={c} {...STROKE} />
      <Line x1="12" y1="17" x2="12.01" y2="17" stroke={c} {...STROKE} />
    </>
  ),
  home: (c) => (
    <>
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={c} {...STROKE} />
      <Polyline points="9 22 9 12 15 12 15 22" stroke={c} {...STROKE} />
    </>
  ),
  info: (c) => (
    <>
      <Circle cx="12" cy="12" r="10" stroke={c} {...STROKE} />
      <Line x1="12" y1="16" x2="12" y2="12" stroke={c} {...STROKE} />
      <Line x1="12" y1="8" x2="12.01" y2="8" stroke={c} {...STROKE} />
    </>
  ),
  lock: (c) => (
    <>
      <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke={c} {...STROKE} />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={c} {...STROKE} />
    </>
  ),
  "log-out": (c) => (
    <>
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={c} {...STROKE} />
      <Polyline points="16 17 21 12 16 7" stroke={c} {...STROKE} />
      <Line x1="21" y1="12" x2="9" y2="12" stroke={c} {...STROKE} />
    </>
  ),
  mail: (c) => (
    <>
      <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={c} {...STROKE} />
      <Polyline points="22,6 12,13 2,6" stroke={c} {...STROKE} />
    </>
  ),
  "map-pin": (c) => (
    <>
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={c} {...STROKE} />
      <Circle cx="12" cy="10" r="3" stroke={c} {...STROKE} />
    </>
  ),
  "message-circle": (c) => (
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke={c} {...STROKE} />
  ),
  minus: (c) => (
    <Line x1="5" y1="12" x2="19" y2="12" stroke={c} {...STROKE} />
  ),
  moon: (c) => (
    <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke={c} {...STROKE} />
  ),
  package: (c) => (
    <>
      <Line x1="16.5" y1="9.4" x2="7.5" y2="4.21" stroke={c} {...STROKE} />
      <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke={c} {...STROKE} />
      <Polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke={c} {...STROKE} />
      <Line x1="12" y1="22.08" x2="12" y2="12" stroke={c} {...STROKE} />
    </>
  ),
  plus: (c) => (
    <>
      <Line x1="12" y1="5" x2="12" y2="19" stroke={c} {...STROKE} />
      <Line x1="5" y1="12" x2="19" y2="12" stroke={c} {...STROKE} />
    </>
  ),
  search: (c) => (
    <>
      <Circle cx="11" cy="11" r="8" stroke={c} {...STROKE} />
      <Line x1="21" y1="21" x2="16.65" y2="16.65" stroke={c} {...STROKE} />
    </>
  ),
  shield: (c) => (
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={c} {...STROKE} />
  ),
  sliders: (c) => (
    <>
      <Line x1="4" y1="21" x2="4" y2="14" stroke={c} {...STROKE} />
      <Line x1="4" y1="10" x2="4" y2="3" stroke={c} {...STROKE} />
      <Line x1="12" y1="21" x2="12" y2="12" stroke={c} {...STROKE} />
      <Line x1="12" y1="8" x2="12" y2="3" stroke={c} {...STROKE} />
      <Line x1="20" y1="21" x2="20" y2="16" stroke={c} {...STROKE} />
      <Line x1="20" y1="12" x2="20" y2="3" stroke={c} {...STROKE} />
      <Line x1="1" y1="14" x2="7" y2="14" stroke={c} {...STROKE} />
      <Line x1="9" y1="8" x2="15" y2="8" stroke={c} {...STROKE} />
      <Line x1="17" y1="16" x2="23" y2="16" stroke={c} {...STROKE} />
    </>
  ),
  star: (c) => (
    <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke={c} {...STROKE} />
  ),
  sun: (c) => (
    <>
      <Circle cx="12" cy="12" r="5" stroke={c} {...STROKE} />
      <Line x1="12" y1="1" x2="12" y2="3" stroke={c} {...STROKE} />
      <Line x1="12" y1="21" x2="12" y2="23" stroke={c} {...STROKE} />
      <Line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke={c} {...STROKE} />
      <Line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke={c} {...STROKE} />
      <Line x1="1" y1="12" x2="3" y2="12" stroke={c} {...STROKE} />
      <Line x1="21" y1="12" x2="23" y2="12" stroke={c} {...STROKE} />
      <Line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke={c} {...STROKE} />
      <Line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke={c} {...STROKE} />
    </>
  ),
  user: (c) => (
    <>
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={c} {...STROKE} />
      <Circle cx="12" cy="7" r="4" stroke={c} {...STROKE} />
    </>
  ),
  wind: (c) => (
    <>
      <Path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" stroke={c} {...STROKE} />
    </>
  ),
  x: (c) => (
    <>
      <Line x1="18" y1="6" x2="6" y2="18" stroke={c} {...STROKE} />
      <Line x1="6" y1="6" x2="18" y2="18" stroke={c} {...STROKE} />
    </>
  ),
  zap: (c) => (
    <Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" stroke={c} {...STROKE} />
  ),
};

export function Feather({ name, size = 24, color = "#000", style }: FeatherProps) {
  const renderIcon = ICONS[name];
  if (!renderIcon) return null;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={style}
    >
      {renderIcon(color)}
    </Svg>
  );
}
