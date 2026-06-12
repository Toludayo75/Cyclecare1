import React from "react";
import Svg, {
  Circle,
  Ellipse,
  Path,
  G,
  Defs,
  RadialGradient,
  Stop,
  ClipPath,
  Rect,
} from "react-native-svg";

interface Props {
  width?: number;
  height?: number;
}

export function WelcomeIllustration({ width = 280, height = 320 }: Props) {
  const cx = width / 2;

  return (
    <Svg width={width} height={height} viewBox="0 0 280 320">
      <Defs>
        <RadialGradient id="bgGlow" cx="50%" cy="55%" r="50%">
          <Stop offset="0%" stopColor="#E96C8A" stopOpacity="0.12" />
          <Stop offset="100%" stopColor="#F8F7F9" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* Background soft glow */}
      <Circle cx={cx} cy={170} r={130} fill="url(#bgGlow)" />

      {/* ── Large decorative leaves (bottom) ── */}
      {/* Left teal leaf */}
      <Path
        d="M 60 240 Q 30 200 55 160 Q 70 190 60 240 Z"
        fill="#2FB7A3"
        opacity="0.7"
      />
      <Path
        d="M 60 240 Q 55 195 75 165 Q 72 200 60 240 Z"
        fill="#1E9B89"
        opacity="0.5"
      />

      {/* Right teal leaf */}
      <Path
        d="M 220 240 Q 250 200 225 160 Q 210 190 220 240 Z"
        fill="#2FB7A3"
        opacity="0.7"
      />
      <Path
        d="M 220 240 Q 225 195 205 165 Q 208 200 220 240 Z"
        fill="#1E9B89"
        opacity="0.5"
      />

      {/* Bottom left pink leaf */}
      <Path
        d="M 85 265 Q 55 235 75 200 Q 90 225 85 265 Z"
        fill="#E96C8A"
        opacity="0.5"
      />

      {/* Bottom right pink leaf */}
      <Path
        d="M 195 265 Q 225 235 205 200 Q 190 225 195 265 Z"
        fill="#E96C8A"
        opacity="0.5"
      />

      {/* ── Small accent leaves ── */}
      {/* Top left */}
      <Path
        d="M 75 130 Q 48 110 58 82 Q 72 102 75 130 Z"
        fill="#2FB7A3"
        opacity="0.55"
      />
      {/* Top right */}
      <Path
        d="M 205 125 Q 232 105 222 77 Q 208 97 205 125 Z"
        fill="#2FB7A3"
        opacity="0.55"
      />

      {/* ── Moon phases ── */}
      {/* Left crescent */}
      <G opacity="0.85">
        <Circle cx={68} cy={82} r={14} fill="#E96C8A" />
        <Circle cx={74} cy={82} r={11} fill="#F8F7F9" />
      </G>

      {/* Right crescent */}
      <G opacity="0.85">
        <Circle cx={212} cy={76} r={11} fill="#E96C8A" />
        <Circle cx={217} cy={76} r={8.5} fill="#F8F7F9" />
      </G>

      {/* Small full moons / dots */}
      <Circle cx={48} cy={155} r={5} fill="#E96C8A" opacity="0.5" />
      <Circle cx={232} cy={148} r={4} fill="#E96C8A" opacity="0.5" />
      <Circle cx={100} cy={58} r={3.5} fill="#2FB7A3" opacity="0.6" />
      <Circle cx={180} cy={50} r={3} fill="#2FB7A3" opacity="0.6" />

      {/* ── Small flowers ── */}
      {/* Flower left */}
      <G transform="translate(92, 240)">
        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <Ellipse
            key={i}
            cx={Math.cos((angle * Math.PI) / 180) * 7}
            cy={Math.sin((angle * Math.PI) / 180) * 7}
            rx={4}
            ry={3}
            fill="#E96C8A"
            opacity="0.7"
            transform={`rotate(${angle} ${Math.cos((angle * Math.PI) / 180) * 7} ${Math.sin((angle * Math.PI) / 180) * 7})`}
          />
        ))}
        <Circle cx={0} cy={0} r={4} fill="#F59E0B" opacity="0.85" />
      </G>

      {/* Flower right */}
      <G transform="translate(190, 238)">
        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <Ellipse
            key={i}
            cx={Math.cos((angle * Math.PI) / 180) * 6}
            cy={Math.sin((angle * Math.PI) / 180) * 6}
            rx={3.5}
            ry={2.5}
            fill="#E96C8A"
            opacity="0.65"
            transform={`rotate(${angle} ${Math.cos((angle * Math.PI) / 180) * 6} ${Math.sin((angle * Math.PI) / 180) * 6})`}
          />
        ))}
        <Circle cx={0} cy={0} r={3.5} fill="#F59E0B" opacity="0.8" />
      </G>

      {/* Small teal flower top */}
      <G transform="translate(148, 52)">
        {[0, 72, 144, 216, 288].map((angle, i) => (
          <Ellipse
            key={i}
            cx={Math.cos((angle * Math.PI) / 180) * 5}
            cy={Math.sin((angle * Math.PI) / 180) * 5}
            rx={3}
            ry={2}
            fill="#2FB7A3"
            opacity="0.6"
          />
        ))}
        <Circle cx={0} cy={0} r={3} fill="#fff" opacity="0.9" />
      </G>

      {/* ── Body / woman silhouette ── */}
      {/* Oval background behind body */}
      <Ellipse cx={cx} cy={175} rx={52} ry={100} fill="#E96C8A" opacity="0.08" />

      {/* Dress / body */}
      <Path
        d="M 120 200 Q 110 230 108 270 L 172 270 Q 170 230 160 200 Q 152 210 140 210 Q 128 210 120 200 Z"
        fill="#E96C8A"
        opacity="0.85"
      />

      {/* Torso */}
      <Path
        d="M 126 170 Q 118 185 120 200 Q 128 210 140 210 Q 152 210 160 200 Q 162 185 154 170 Z"
        fill="#E96C8A"
        opacity="0.9"
      />

      {/* Neck */}
      <Rect x={136} y={142} width={8} height={16} rx={4} fill="#E96C8A" opacity="0.85" />

      {/* Head */}
      <Circle cx={cx} cy={128} r={22} fill="#E96C8A" opacity="0.9" />

      {/* Hair */}
      <Path
        d="M 118 118 Q 115 105 122 95 Q 130 90 140 92 Q 150 90 158 95 Q 165 105 162 118 Q 158 108 150 105 Q 140 102 130 105 Q 122 108 118 118 Z"
        fill="#D4526A"
        opacity="0.9"
      />

      {/* Hair flowing */}
      <Path
        d="M 118 118 Q 112 130 115 145 Q 118 138 120 135 L 118 118 Z"
        fill="#D4526A"
        opacity="0.7"
      />
      <Path
        d="M 162 118 Q 168 130 165 145 Q 162 138 160 135 L 162 118 Z"
        fill="#D4526A"
        opacity="0.7"
      />

      {/* Arms */}
      <Path
        d="M 126 175 Q 108 185 105 200 Q 112 195 120 192 Z"
        fill="#E96C8A"
        opacity="0.75"
      />
      <Path
        d="M 154 175 Q 172 185 175 200 Q 168 195 160 192 Z"
        fill="#E96C8A"
        opacity="0.75"
      />

      {/* ── Sparkle dots ── */}
      <Circle cx={165} cy={130} r={2.5} fill="#2FB7A3" opacity="0.7" />
      <Circle cx={115} cy={145} r={2} fill="#2FB7A3" opacity="0.6" />
      <Circle cx={240} cy={105} r={2} fill="#E96C8A" opacity="0.5" />
      <Circle cx={40} cy={110} r={2.5} fill="#E96C8A" opacity="0.5" />

      {/* ── Cycle dots at bottom ── */}
      <G opacity="0.6">
        <Circle cx={120} cy={290} r={4} fill="#E96C8A" />
        <Circle cx={133} cy={293} r={3} fill="#E96C8A" opacity="0.6" />
        <Circle cx={144} cy={294} r={2.5} fill="#E96C8A" opacity="0.4" />
        <Circle cx={154} cy={293} r={3} fill="#2FB7A3" opacity="0.6" />
        <Circle cx={165} cy={290} r={4} fill="#2FB7A3" />
      </G>
    </Svg>
  );
}
