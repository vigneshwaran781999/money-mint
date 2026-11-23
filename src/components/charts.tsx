import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';

import { formatINR, formatShort } from '@/lib/money';
import { useColors } from '@/providers/theme';

import { Row, T } from './ui';

/** Grouped income/expense bars per period. */
export function BarChart({
  data,
  height = 200,
}: {
  data: { label: string; income: number; expense: number }[];
  height?: number;
}) {
  const c = useColors();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  const top = 16;
  const bottom = 22;
  const left = 44;
  const plotH = height - top - bottom;
  const slot = data.length ? (width - left) / data.length : 0;
  const barW = Math.max(3, Math.min(18, slot / 3));
  const ticks = [0, 0.5, 1];

  return (
    <View onLayout={onLayout} style={{ width: '100%' }}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {ticks.map((t) => {
            const y = top + plotH * (1 - t);
            return (
              <G key={t}>
                <Line x1={left} x2={width} y1={y} y2={y} stroke={c.border} strokeWidth={1} />
                <SvgText x={left - 6} y={y + 4} fontSize={10} fill={c.textMuted} textAnchor="end">
                  {formatShort(max * t)}
                </SvgText>
              </G>
            );
          })}
          {data.map((d, i) => {
            const cx = left + slot * i + slot / 2;
            const hi = (d.income / max) * plotH;
            const he = (d.expense / max) * plotH;
            return (
              <G key={d.label + i}>
                <Rect x={cx - barW - 1} y={top + plotH - hi} width={barW} height={hi} rx={3} fill={c.income} />
                <Rect x={cx + 1} y={top + plotH - he} width={barW} height={he} rx={3} fill={c.expense} />
                <SvgText x={cx} y={height - 6} fontSize={10} fill={c.textMuted} textAnchor="middle">
                  {d.label}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      )}
      <Row style={{ justifyContent: 'center', marginTop: 4 }} gap={16}>
        <Legend color={c.income} label="Income" />
        <Legend color={c.expense} label="Expense" />
      </Row>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <Row gap={6}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <T variant="small">{label}</T>
    </Row>
  );
}

/** Donut with a legend listing each slice and its share. */
export function DonutChart({
  data,
  size = 180,
  centerLabel,
}: {
  data: { name: string; value: number; color: string }[];
  size?: number;
  centerLabel?: string;
}) {
  const c = useColors();
  const total = data.reduce((s, d) => s + d.value, 0);
  const stroke = 26;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <View style={{ alignItems: 'center', gap: 16 }}>
      <View>
        <Svg width={size} height={size}>
          <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
            <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.surfaceAlt} strokeWidth={stroke} fill="none" />
            {total > 0 &&
              data.map((d) => {
                const len = (d.value / total) * circ;
                const el = (
                  <Circle
                    key={d.name}
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke={d.color}
                    strokeWidth={stroke}
                    fill="none"
                    strokeDasharray={`${Math.max(0, len - 1.5)} ${circ}`}
                    strokeDashoffset={-offset}
                  />
                );
                offset += len;
                return el;
              })}
          </G>
        </Svg>
        <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
          <T variant="small">{centerLabel ?? 'Total'}</T>
          <T style={{ fontWeight: '800' }}>{formatShort(total)}</T>
        </View>
      </View>
      <View style={{ alignSelf: 'stretch', gap: 8 }}>
        {data.map((d) => (
          <Row key={d.name} style={{ justifyContent: 'space-between' }}>
            <Row gap={8} style={{ flex: 1 }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: d.color }} />
              <T numberOfLines={1} style={{ flex: 1 }}>
                {d.name}
              </T>
            </Row>
            <T variant="muted">{total ? Math.round((d.value / total) * 100) : 0}%</T>
            <T style={{ fontWeight: '600', minWidth: 90, textAlign: 'right' }}>{formatINR(d.value)}</T>
          </Row>
        ))}
      </View>
    </View>
  );
}
