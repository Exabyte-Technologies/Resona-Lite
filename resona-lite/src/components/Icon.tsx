import { StyleSheet, View } from 'react-native';
import { useThemeColors } from '../theme';

export type IconName =
  | 'check'
  | 'language'
  | 'home'
  | 'tune'
  | 'waves'
  | 'headphones'
  | 'layers'
  | 'frequency'
  | 'noise'
  | 'balance'
  | 'sleep'
  | 'meditation'
  | 'focus'
  | 'awake';

type Props = {
  name: IconName;
  color?: string;
  size?: number;
};

export default function Icon({ name, color, size = 22 }: Props) {
  const colors = useThemeColors();
  const stroke = color ?? colors.accent;
  const scale = size / 24;
  const scaled = (value: number) => value * scale;
  const line = {
    position: 'absolute' as const,
    backgroundColor: stroke,
    borderRadius: scaled(2),
  };

  if (name === 'check') return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: size * 0.68, height: size * 0.38, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: stroke, transform: [{ rotate: '-45deg' }] }} />
  </View>;

  if (name === 'language') return <View accessible={false} style={{width:size,height:size,alignItems:'center',justifyContent:'center'}}>
    <View style={{width:size*0.82,height:size*0.82,borderRadius:size/2,borderWidth:1.4,borderColor:stroke}}/>
    <View style={{position:'absolute',width:size*0.38,height:size*0.82,borderRadius:size/2,borderWidth:1.2,borderColor:stroke}}/>
    <View style={{position:'absolute',width:size*0.82,height:1.2,backgroundColor:stroke}}/>
  </View>;

  if (name === 'home') {
    return (
      <View accessible={false} style={{ width: size, height: size }}>
        <View style={[line, { left: scaled(4), top: scaled(8), width: scaled(11), height: scaled(2), transform: [{ rotate: '-42deg' }] }]} />
        <View style={[line, { right: scaled(4), top: scaled(8), width: scaled(11), height: scaled(2), transform: [{ rotate: '42deg' }] }]} />
        <View style={[styles.house, { left: scaled(5), top: scaled(10), width: scaled(14), height: scaled(11), borderColor: stroke, borderBottomWidth: scaled(2), borderLeftWidth: scaled(2), borderRightWidth: scaled(2), borderTopWidth: 0 }]} />
        <View style={[styles.door, { left: scaled(10), top: scaled(15), width: scaled(4), height: scaled(6), borderColor: stroke, borderTopLeftRadius: scaled(2), borderTopRightRadius: scaled(2) }]} />
      </View>
    );
  }

  if (name === 'tune' || name === 'balance') {
    return (
      <View accessible={false} style={{ width: size, height: size, justifyContent: 'center', gap: scaled(5) }}>
        {[0, 1, 2].map((index) => (
          <View key={index} style={{ height: scaled(2), marginHorizontal: scaled(3), backgroundColor: stroke, borderRadius: scaled(2), justifyContent: 'center' }}>
            <View style={{ width: scaled(5), height: scaled(5), marginLeft: scaled([5, 11, 3][index]), borderRadius: scaled(3), backgroundColor: colors.background, borderWidth: scaled(1.5), borderColor: stroke }} />
          </View>
        ))}
      </View>
    );
  }

  if (name === 'waves' || name === 'frequency') {
    return (
      <View accessible={false} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: scaled(7), height: scaled(7), borderRadius: scaled(4), backgroundColor: stroke }} />
        {[scaled(14), scaled(21)].map((diameter) => (
          <View key={diameter} style={{ position: 'absolute', width: diameter, height: diameter, borderRadius: diameter / 2, borderWidth: scaled(1.4), borderColor: stroke, opacity: diameter > scaled(18) ? 0.55 : 0.8 }} />
        ))}
      </View>
    );
  }

  if (name === 'headphones') {
    return (
      <View accessible={false} style={{ width: size, height: size }}>
        <View style={{ position: 'absolute', left: scaled(4), top: scaled(3), width: scaled(16), height: scaled(17), borderTopLeftRadius: scaled(10), borderTopRightRadius: scaled(10), borderWidth: scaled(2), borderBottomColor: 'transparent', borderColor: stroke }} />
        <View style={{ position: 'absolute', left: scaled(3), top: scaled(13), width: scaled(5), height: scaled(8), borderRadius: scaled(2), backgroundColor: stroke }} />
        <View style={{ position: 'absolute', right: scaled(3), top: scaled(13), width: scaled(5), height: scaled(8), borderRadius: scaled(2), backgroundColor: stroke }} />
      </View>
    );
  }

  if (name === 'sleep') {
    return (
      <View accessible={false} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: scaled(15), height: scaled(15), borderRadius: scaled(8), backgroundColor: stroke }} />
        <View style={{ position: 'absolute', top: scaled(2), right: scaled(2), width: scaled(13), height: scaled(13), borderRadius: scaled(7), backgroundColor: colors.surfaceSubtle }} />
      </View>
    );
  }

  if (name === 'meditation') {
    return (
      <View accessible={false} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: scaled(6), height: scaled(6), borderRadius: scaled(3), backgroundColor: stroke }} />
        <View style={{ position: 'absolute', width: scaled(14), height: scaled(14), borderRadius: scaled(8), borderWidth: scaled(1.5), borderColor: stroke }} />
        <View style={{ position: 'absolute', width: scaled(21), height: scaled(21), borderRadius: scaled(11), borderWidth: scaled(1), borderColor: stroke, opacity: 0.55 }} />
      </View>
    );
  }

  if (name === 'focus') {
    return (
      <View accessible={false} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: scaled(13), height: scaled(13), borderWidth: scaled(1.6), borderColor: stroke, transform: [{ rotate: '45deg' }] }} />
      </View>
    );
  }

  if (name === 'awake') {
    return (
      <View accessible={false} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: scaled(8), height: scaled(8), borderRadius: scaled(5), backgroundColor: stroke }} />
        {[0, 45, 90, 135].map((angle) => (
          <View key={angle} style={[line, { left: scaled(11), top: scaled(2), width: scaled(2), height: scaled(5), transform: [{ rotate: `${angle}deg` }, { translateY: scaled(7) }] }]} />
        ))}
      </View>
    );
  }

  if (name === 'noise') {
    return (
      <View accessible={false} style={{ width: size, height: size, justifyContent: 'center', gap: scaled(4) }}>
        {[0, 1, 2].map((index) => (
          <View key={index} style={{ height: scaled(2), marginHorizontal: scaled(index * 2), borderRadius: scaled(2), backgroundColor: stroke, opacity: 1 - index * 0.18 }} />
        ))}
      </View>
    );
  }

  return (
    <View accessible={false} style={{ width: size, height: size }}>
      <View style={{ position: 'absolute', left: scaled(4), top: scaled(5), width: scaled(15), height: scaled(13), borderRadius: scaled(4), borderWidth: scaled(1.6), borderColor: stroke }} />
      <View style={{ position: 'absolute', left: scaled(7), top: scaled(9), width: scaled(13), height: scaled(12), borderRadius: scaled(4), borderWidth: scaled(1.6), borderColor: stroke, backgroundColor: colors.surface }} />
    </View>
  );
}

const styles = StyleSheet.create({
  house: {
    position: 'absolute',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  door: {
    position: 'absolute',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
});
