import { useState } from 'react';
import Slider from '@react-native-community/slider';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../theme';

type Props = {
  title: string;
  description?: string;
  value: number;
  minimum: number;
  maximum: number;
  step?: number;
  unit?: string;
  compact?: boolean;
  onChange: (value: number) => void;
};

export default function RangeControl({
  title,
  description,
  value,
  minimum,
  maximum,
  step = 1,
  unit = '',
  compact = false,
  onChange,
}: Props) {
  const [draftValue, setDraftValue] = useState(value);
  const [isSliding, setIsSliding] = useState(false);
  const displayedValue = isSliding ? draftValue : value;

  return (
    <View style={[styles.control, compact && styles.compactControl]}>
      <View style={styles.heading}>
        <View style={styles.copy}>
          <Text style={[styles.title, compact && styles.compactTitle]}>{title}</Text>
          {description ? (
            <Text style={[styles.description, compact && styles.compactDescription]}>
              {description}
            </Text>
          ) : null}
        </View>
        <Text style={[styles.value, compact && styles.compactValue]}>
          {formatValue(displayedValue)}
          {unit}
        </Text>
      </View>
      <Slider
        accessibilityLabel={title}
        minimumValue={minimum}
        maximumValue={maximum}
        step={step}
        value={value}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.line}
        thumbTintColor={colors.accent}
        onValueChange={(nextValue) => {
          setDraftValue(nextValue);
          setIsSliding(true);
        }}
        onSlidingComplete={(nextValue) => {
          setDraftValue(nextValue);
          setIsSliding(false);
          onChange(nextValue);
        }}
        style={[styles.slider, compact && styles.compactSlider]}
      />
    </View>
  );
}

function formatValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

const styles = StyleSheet.create({
  control: {
    gap: spacing.xs,
  },
  compactControl: {
    gap: spacing.xxs,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: '600',
  },
  compactTitle: {
    fontSize: 14,
  },
  description: {
    color: colors.dim,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  compactDescription: {
    fontSize: 12,
    lineHeight: 14,
  },
  value: {
    minWidth: 52,
    color: colors.accent,
    fontFamily: fonts.body,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  compactValue: {
    fontSize: 13,
  },
  slider: {
    height: 44,
    marginHorizontal: -8,
  },
  compactSlider: {
    height: 34,
    marginHorizontal: -6,
  },
});
