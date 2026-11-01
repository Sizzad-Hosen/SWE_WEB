import React, {
  Component,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

export type ImageSourcePropType = string | { uri?: string };
export type StyleProp<T = CSSProperties> = T | T[] | false | null | undefined;
export type ViewStyle = CSSProperties & Record<string, unknown>;
export type TextStyle = CSSProperties & Record<string, unknown>;
export type ImageStyle = CSSProperties & Record<string, unknown>;

class AnimatedValue {
  private value: number;
  private listeners = new Set<() => void>();

  constructor(value: number) { this.value = value; }
  setValue(value: number) { this.value = value; this.listeners.forEach((listener) => listener()); }
  getValue() { return this.value; }
  subscribe(listener: () => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  interpolate({ inputRange, outputRange }: { inputRange: number[]; outputRange: Array<number | string> }) {
    return new InterpolatedValue(this, inputRange, outputRange);
  }
}

class InterpolatedValue {
  constructor(
    private source: AnimatedValue,
    private input: number[],
    private output: Array<number | string>,
  ) {}
  getValue() {
    const current = this.source.getValue();
    const index = Math.max(0, Math.min(this.input.length - 2, this.input.findIndex((v) => v >= current) - 1));
    const from = this.input[index] ?? 0;
    const to = this.input[index + 1] ?? from + 1;
    const progress = Math.max(0, Math.min(1, (current - from) / (to - from || 1)));
    const start = this.output[index] ?? 0;
    const end = this.output[index + 1] ?? start;
    if (typeof start === 'number' && typeof end === 'number') return start + (end - start) * progress;
    return progress < 0.5 ? start : end;
  }
  subscribe(listener: () => void) { return this.source.subscribe(listener); }
}

const isAnimated = (value: unknown): value is AnimatedValue | InterpolatedValue =>
  Boolean(value && typeof (value as any).getValue === 'function');

function flattenStyle(style: any): Record<string, any> {
  if (!style) return {};
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flattenStyle));
  return typeof style === 'object' ? { ...style } : {};
}

function collectAnimated(value: unknown, found = new Set<AnimatedValue | InterpolatedValue>()) {
  if (isAnimated(value)) found.add(value);
  else if (Array.isArray(value)) value.forEach((item) => collectAnimated(item, found));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => collectAnimated(item, found));
  return [...found];
}

function useAnimatedStyle(style: any) {
  const values = useMemo(() => collectAnimated(style), [style]);
  const [, render] = useState(0);
  useEffect(() => {
    const unsubscribers = values.map((value) => value.subscribe(() => render((n) => n + 1)));
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [values]);
  return normalizeStyle(style);
}

function normalizeStyle(input: any): CSSProperties {
  const source = flattenStyle(input);
  const result: Record<string, any> = {};
  const transforms: string[] = [];

  Object.entries(source).forEach(([key, raw]) => {
    const value = isAnimated(raw) ? raw.getValue() : raw;
    if (key === 'transform' && Array.isArray(value)) {
      value.forEach((entry) => Object.entries(entry).forEach(([name, item]) => {
        const resolved = isAnimated(item) ? item.getValue() : item;
        if (name === 'translateX' || name === 'translateY') transforms.push(`${name}(${typeof resolved === 'number' ? `${resolved}px` : resolved})`);
        else transforms.push(`${name}(${resolved})`);
      }));
      return;
    }
    if (key === 'shadowColor' || key === 'shadowOffset' || key === 'shadowOpacity' || key === 'shadowRadius' || key === 'elevation') return;
    if (key === 'textAlignVertical') { result.verticalAlign = value; return; }
    if (key === 'includeFontPadding') return;
    result[key] = value;
  });

  if (transforms.length) result.transform = transforms.join(' ');
  if (source.shadowColor || source.elevation) {
    const offset = source.shadowOffset ?? { width: 0, height: 2 };
    result.boxShadow = `${offset.width ?? 0}px ${offset.height ?? 2}px ${source.shadowRadius ?? source.elevation ?? 4}px ${source.shadowColor ?? '#00000033'}`;
  }
  return result as CSSProperties;
}

const layoutStyle = (style: any): CSSProperties => ({ display: 'flex', flexDirection: 'column', ...normalizeStyle(style) });

type BasicProps = { children?: ReactNode; style?: any; testID?: string; pointerEvents?: string; [key: string]: any };

export function View({ children, style, testID, pointerEvents, ...props }: BasicProps) {
  return <div data-testid={testID} style={{ ...layoutStyle(style), pointerEvents: pointerEvents as any }} {...props}>{children}</div>;
}

export const SafeAreaView = View;
export const KeyboardAvoidingView = View;

export function Text({ children, style, numberOfLines, selectable, ...props }: BasicProps) {
  const lineStyle: CSSProperties = numberOfLines ? {
    display: '-webkit-box', WebkitLineClamp: numberOfLines, WebkitBoxOrient: 'vertical', overflow: 'hidden',
  } : {};
  return <span style={{ ...normalizeStyle(style), ...lineStyle, userSelect: selectable ? 'text' : undefined }} {...props}>{children}</span>;
}

type PressableProps = {
  children?: ReactNode;
  style?: StyleProp<Record<string, any>> | ((state: { pressed: boolean; hovered?: boolean; focused?: boolean }) => StyleProp<Record<string, any>>);
  onPress?: (...args: any[]) => void;
  onPressIn?: (...args: any[]) => void;
  onPressOut?: (...args: any[]) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  [key: string]: any;
};

function PressableBase({ children, style, onPress, onPressIn, onPressOut, disabled, accessibilityLabel, ...props }: PressableProps) {
  const resolved = typeof style === 'function' ? style({ pressed: false }) : style;
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={accessibilityLabel}
      onClick={onPress}
      onPointerDown={onPressIn}
      onPointerUp={onPressOut}
      style={{ ...layoutStyle(resolved), padding: 0, background: 'transparent', cursor: disabled ? 'default' : 'pointer', textAlign: 'inherit' }}
      {...props}
    >{children}</button>
  );
}

export function Pressable(props: PressableProps) { return <PressableBase {...props} />; }
export function TouchableOpacity(props: PressableProps) { return <PressableBase {...props} />; }

function resolveImageSource(source: ImageSourcePropType | number | undefined) {
  if (typeof source === 'string') return source;
  if (source && typeof source === 'object') return source.uri;
  return undefined;
}

export function Image({ source, style, resizeMode = 'cover', onLoad, onError, ...props }: any) {
  return <img src={resolveImageSource(source)} style={{ ...normalizeStyle(style), objectFit: resizeMode }} onLoad={onLoad} onError={onError} {...props} />;
}

export function ScrollView({ children, style, contentContainerStyle, horizontal, refreshControl, onScroll, ...props }: BasicProps) {
  const handleScroll = onScroll ? (event: React.UIEvent<HTMLDivElement>) => onScroll({
    ...event,
    nativeEvent: { contentOffset: { x: event.currentTarget.scrollLeft, y: event.currentTarget.scrollTop } },
  }) : undefined;
  return (
    <div style={{ ...layoutStyle(style), overflowX: horizontal ? 'auto' : undefined, overflowY: horizontal ? 'hidden' : 'auto' }} onScroll={handleScroll} {...props}>
      {refreshControl}
      <div style={{ ...layoutStyle(contentContainerStyle), flexDirection: horizontal ? 'row' : (normalizeStyle(contentContainerStyle).flexDirection ?? 'column') }}>{children}</div>
    </div>
  );
}

type FlatListProps<T> = {
  data?: T[];
  renderItem: (info: { item: T; index: number }) => ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  ListHeaderComponent?: ReactNode | ComponentType<any>;
  ListEmptyComponent?: ReactNode | ComponentType<any>;
  numColumns?: number;
  contentContainerStyle?: any;
  style?: any;
  [key: string]: any;
};

export function FlatList<T>({ data = [], renderItem, keyExtractor, ListHeaderComponent, ListEmptyComponent, numColumns = 1, contentContainerStyle, style }: FlatListProps<T>) {
  return (
    <div style={layoutStyle(style)}>
      {typeof ListHeaderComponent === 'function' ? <ListHeaderComponent /> : ListHeaderComponent}
      <div style={{ ...layoutStyle(contentContainerStyle), display: 'grid', gridTemplateColumns: `repeat(${numColumns}, minmax(0, 1fr))` }}>
        {data.length ? data.map((item: any, index: number) => <React.Fragment key={keyExtractor?.(item, index) ?? index}>{renderItem({ item, index })}</React.Fragment>) :
          (typeof ListEmptyComponent === 'function' ? <ListEmptyComponent /> : ListEmptyComponent)}
      </div>
    </div>
  );
}

type TextInputProps = BasicProps & {
  value?: string;
  onChangeText?: (value: string) => void;
  onSubmitEditing?: () => void;
  secureTextEntry?: boolean;
  multiline?: boolean;
  editable?: boolean;
  keyboardType?: string;
  placeholderTextColor?: string;
};

export class TextInput extends Component<TextInputProps> {
  private element: HTMLInputElement | HTMLTextAreaElement | null = null;
  focus = () => this.element?.focus();
  blur = () => this.element?.blur();
  render() {
    const { style, value, onChangeText, onSubmitEditing, secureTextEntry, multiline, editable = true,
      keyboardType, placeholderTextColor: _placeholderTextColor, children: _children, ...props } = this.props;
    const shared: any = {
      ...props,
      value: value ?? '',
      disabled: !editable,
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChangeText?.(event.target.value),
      onKeyDown: (event: React.KeyboardEvent) => { if (event.key === 'Enter' && !multiline) onSubmitEditing?.(); },
      style: normalizeStyle(style),
      ref: (element: any) => { this.element = element; },
    };
    if (multiline) return <textarea {...shared} />;
    return <input {...shared} type={secureTextEntry ? 'password' : keyboardType === 'email-address' ? 'email' : keyboardType?.includes('number') ? 'number' : 'text'} />;
  }
}

export function Modal({ visible = true, transparent, onRequestClose, children }: BasicProps & { visible?: boolean; transparent?: boolean; onRequestClose?: () => void }) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onRequestClose?.(); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [onRequestClose]);
  if (!visible) return null;
  return createPortal(<div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', flexDirection: 'column', background: transparent ? 'transparent' : '#fff' }}>{children}</div>, document.body);
}

export function ActivityIndicator({ size = 'small', color = '#54B948', style }: any) {
  const pixels = size === 'large' ? 32 : typeof size === 'number' ? size : 20;
  return <span aria-label="Loading" style={{ width: pixels, height: pixels, border: `3px solid ${color}33`, borderTopColor: color, borderRadius: '50%', animation: 'nctb-spin .8s linear infinite', ...normalizeStyle(style) }} />;
}

export function RefreshControl({ refreshing, onRefresh }: any) {
  return <button type="button" onClick={onRefresh} disabled={refreshing} style={{ display: 'none' }} aria-label="Refresh" />;
}

export const StyleSheet = {
  create: <T extends Record<string, any>>(styles: T): T => styles,
  flatten: flattenStyle,
  hairlineWidth: 1,
  absoluteFillObject: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
};
export const Platform = { OS: 'web', select: <T,>(options: { web?: T; default?: T }) => options.web ?? options.default };
export const Dimensions = { get: (_dimension?: string) => ({ width: window.innerWidth, height: window.innerHeight, scale: window.devicePixelRatio, fontScale: 1 }) };

export function useWindowDimensions() {
  const [size, setSize] = useState(() => Dimensions.get());
  useEffect(() => {
    const update = () => setSize(Dimensions.get());
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return size;
}

export const Alert = {
  alert(title: string, message?: string, buttons?: Array<{ text?: string; style?: string; onPress?: () => void }>) {
    if (!buttons?.length) { window.alert([title, message].filter(Boolean).join('\n\n')); return; }
    if (buttons.length === 1) { window.alert([title, message].filter(Boolean).join('\n\n')); buttons[0].onPress?.(); return; }
    const confirmed = window.confirm([title, message].filter(Boolean).join('\n\n'));
    const action = confirmed ? buttons[buttons.length - 1] : buttons[0];
    action?.onPress?.();
  },
};

export const Linking = {
  openURL(url: string) { window.open(url, url.startsWith('http') ? '_blank' : '_self', 'noopener,noreferrer'); return Promise.resolve(); },
  getInitialURL() { return Promise.resolve(window.location.href); },
  addEventListener(_name: string, listener: ({ url }: { url: string }) => void) {
    const handler = () => listener({ url: window.location.href });
    window.addEventListener('popstate', handler);
    return { remove: () => window.removeEventListener('popstate', handler) };
  },
  canOpenURL(_url: string) { return Promise.resolve(true); },
  openSettings() { window.open('about:preferences', '_blank'); return Promise.resolve(); },
};

export const AppState = {
  currentState: 'active',
  addEventListener(_name: string, listener: (state: string) => void) {
    const handler = () => listener(document.hidden ? 'background' : 'active');
    document.addEventListener('visibilitychange', handler);
    return { remove: () => document.removeEventListener('visibilitychange', handler) };
  },
};

export const Share = {
  async share({ message, url, title }: { message?: string; url?: string; title?: string }) {
    const text = [message, url].filter(Boolean).join('\n');
    if (navigator.share) await navigator.share({ title, text });
    else await navigator.clipboard.writeText(text);
    return { action: 'sharedAction' };
  },
};

type Animation = { start: (callback?: (finished: { finished: boolean }) => void) => void; stop: () => void };
const animate = (value: AnimatedValue, config: { toValue: number; duration?: number }): Animation => {
  let timer = 0;
  return {
    start(callback) { timer = window.setTimeout(() => { value.setValue(config.toValue); callback?.({ finished: true }); }, Math.min(config.duration ?? 0, 500)); },
    stop() { window.clearTimeout(timer); },
  };
};
const combine = (animations: Animation[], sequential: boolean): Animation => ({
  start(callback) {
    if (!sequential) { animations.forEach((item) => item.start()); callback?.({ finished: true }); return; }
    const run = (index: number) => index >= animations.length ? callback?.({ finished: true }) : animations[index].start(() => run(index + 1));
    run(0);
  },
  stop() { animations.forEach((item) => item.stop()); },
});

function AnimatedView(props: BasicProps) { const style = useAnimatedStyle(props.style); return <View {...props} style={style} />; }
function AnimatedText(props: BasicProps) { const style = useAnimatedStyle(props.style); return <Text {...props} style={style} />; }

export const Animated = {
  Value: AnimatedValue,
  View: AnimatedView,
  Text: AnimatedText,
  timing: (value: AnimatedValue, config: any) => animate(value, config),
  spring: (value: AnimatedValue, config: any) => animate(value, { ...config, duration: 250 }),
  sequence: (animations: Animation[]) => combine(animations, true),
  parallel: (animations: Animation[]) => combine(animations, false),
  loop: (animation: Animation) => animation,
};
