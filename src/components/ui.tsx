import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, Radius, Space } from '@/constants/theme';
import { useColors } from '@/providers/theme';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export function Icon({ name, size = 22, color }: { name: string; size?: number; color?: string }) {
  const c = useColors();
  return <MaterialCommunityIcons name={name as IconName} size={size} color={color ?? c.text} />;
}

/* ---------- Layout ---------- */

export function Screen({
  children,
  scroll = true,
  footer,
  onRefresh,
  refreshing = false,
}: {
  children: ReactNode;
  scroll?: boolean;
  footer?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const inner = <View style={styles.content}>{children}</View>;
  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} colors={[c.primary]} />
            ) : undefined
          }>
          {inner}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{inner}</View>
      )}
      {footer}
    </View>
  );
}

export function Row({ children, style, gap = Space.sm }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

/* ---------- Text ---------- */

type Variant = 'title' | 'h2' | 'body' | 'muted' | 'small' | 'label';

export function T({
  children,
  variant = 'body',
  color,
  style,
  numberOfLines,
}: {
  children: ReactNode;
  variant?: Variant;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const c = useColors();
  const base: TextStyle = {
    title: { fontSize: 26, fontWeight: '800' as const },
    h2: { fontSize: 18, fontWeight: '700' as const },
    body: { fontSize: 15 },
    muted: { fontSize: 14, color: c.textMuted },
    small: { fontSize: 12, color: c.textMuted },
    label: { fontSize: 13, fontWeight: '600' as const, color: c.textMuted },
  }[variant];
  return (
    <Text numberOfLines={numberOfLines} style={[{ color: c.text }, base, color ? { color } : null, style]}>
      {children}
    </Text>
  );
}

/* ---------- Containers ---------- */

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const c = useColors();
  const cardStyle = [styles.card, { backgroundColor: c.surface, borderColor: c.border }, style];
  if (onPress)
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [cardStyle, pressed && { opacity: 0.85 }]}>
        {children}
      </Pressable>
    );
  return <View style={cardStyle}>{children}</View>;
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <View style={{ gap: Space.sm }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <T variant="h2">{title}</T>
        {action}
      </Row>
      {children}
    </View>
  );
}

/* ---------- Buttons ---------- */

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  small,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const bg = { primary: c.primary, secondary: c.surfaceAlt, danger: c.expense, ghost: 'transparent' }[variant];
  const fg = { primary: c.onPrimary, secondary: c.text, danger: '#fff', ghost: c.primaryDark }[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        small && { paddingVertical: 8, paddingHorizontal: 12 },
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Row gap={6} style={{ justifyContent: 'center' }}>
          {icon ? <Icon name={icon} size={small ? 16 : 20} color={fg} /> : null}
          <Text style={{ color: fg, fontWeight: '700', fontSize: small ? 13 : 15 }}>{title}</Text>
        </Row>
      )}
    </Pressable>
  );
}

export function IconButton({ name, onPress, color, size = 22 }: { name: string; onPress: () => void; color?: string; size?: number }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={({ pressed }) => ({ padding: 6, opacity: pressed ? 0.6 : 1 })}>
      <Icon name={name} color={color} size={size} />
    </Pressable>
  );
}

export function Fab({ onPress, icon = 'plus' }: { onPress: () => void; icon?: string }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel="Add"
      style={({ pressed }) => [
        styles.fab,
        { backgroundColor: c.primary, bottom: insets.bottom + 20, opacity: pressed ? 0.85 : 1 },
      ]}>
      <Icon name={icon} size={30} color={c.onPrimary} />
    </Pressable>
  );
}

/* ---------- Inputs ---------- */

export function Field({ label, style, ...props }: TextInputProps & { label?: string }) {
  const c = useColors();
  return (
    <View style={{ gap: 6 }}>
      {label ? <T variant="label">{label}</T> : null}
      <TextInput
        placeholderTextColor={c.textMuted}
        {...props}
        style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.text }, style]}
      />
    </View>
  );
}

export function Segmented<V extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: V; label: string; color?: string }[];
  value: V;
  onChange: (v: V) => void;
}) {
  const c = useColors();
  return (
    <View style={[styles.segmented, { backgroundColor: c.surfaceAlt }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.segment, active && { backgroundColor: o.color ?? c.primary }]}>
            <Text style={{ color: active ? '#fff' : c.text, fontWeight: '700', fontSize: 14 }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({ label, active, onPress, color }: { label: string; active?: boolean; onPress?: () => void; color?: string }) {
  const c = useColors();
  const tint = color ?? c.primary;
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, { borderColor: active ? tint : c.border, backgroundColor: active ? tint + '22' : c.surface }]}>
      <Text style={{ color: active ? tint : c.text, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export function Switch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const c = useColors();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={[styles.switch, { backgroundColor: value ? c.primary : c.border }]}>
      <View style={[styles.knob, { alignSelf: value ? 'flex-end' : 'flex-start' }]} />
    </Pressable>
  );
}

export function ToggleRow({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Row style={{ justifyContent: 'space-between', paddingVertical: 4 }}>
      <View style={{ flex: 1 }}>
        <T style={{ fontWeight: '600' }}>{label}</T>
        {hint ? <T variant="small">{hint}</T> : null}
      </View>
      <Switch value={value} onChange={onChange} />
    </Row>
  );
}

/* ---------- Lists ---------- */

export function IconBadge({ name, color, size = 40 }: { name: string; color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={name} size={size * 0.5} color={color} />
    </View>
  );
}

export function ListRow({
  icon,
  iconColor,
  title,
  subtitle,
  right,
  onPress,
}: {
  icon?: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
}) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.listRow, pressed && { opacity: 0.7 }]}>
      {icon ? <IconBadge name={icon} color={iconColor ?? c.primary} /> : null}
      <View style={{ flex: 1 }}>
        <T style={{ fontWeight: '600' }} numberOfLines={1}>
          {title}
        </T>
        {subtitle ? (
          <T variant="small" numberOfLines={1}>
            {subtitle}
          </T>
        ) : null}
      </View>
      {right}
    </Pressable>
  );
}

export function Divider() {
  const c = useColors();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.border }} />;
}

export function Empty({ icon = 'tray', title, subtitle, action }: { icon?: string; title: string; subtitle?: string; action?: ReactNode }) {
  const c = useColors();
  return (
    <View style={{ alignItems: 'center', padding: Space.xxl, gap: Space.sm }}>
      <Icon name={icon} size={48} color={c.textMuted} />
      <T variant="h2" style={{ textAlign: 'center' }}>
        {title}
      </T>
      {subtitle ? (
        <T variant="muted" style={{ textAlign: 'center' }}>
          {subtitle}
        </T>
      ) : null}
      {action}
    </View>
  );
}

export function Loading() {
  const c = useColors();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Space.xxl, backgroundColor: c.background }}>
      <ActivityIndicator color={c.primary} size="large" />
    </View>
  );
}

export function ProgressBar({ value, color }: { value: number; color: string }) {
  const c = useColors();
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: c.surfaceAlt, overflow: 'hidden' }}>
      <View style={{ width: `${Math.min(100, Math.max(0, value * 100))}%`, height: '100%', backgroundColor: color }} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', padding: Space.lg, gap: Space.lg },
  card: { borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: Space.lg, gap: Space.sm },
  button: { borderRadius: Radius.md, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  input: { borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  segmented: { flexDirection: 'row', borderRadius: Radius.md, padding: 4, gap: 4 },
  segment: { flex: 1, paddingVertical: 10, borderRadius: Radius.sm, alignItems: 'center' },
  chip: { borderWidth: 1, borderRadius: Radius.pill, paddingVertical: 6, paddingHorizontal: 12 },
  switch: { width: 48, height: 28, borderRadius: 14, padding: 3, justifyContent: 'center' },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: Space.md, paddingVertical: Space.sm },
});
