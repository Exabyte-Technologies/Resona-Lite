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
  onChange,
}: Props) {
  const [draftValue, setDraftValue] = useState(value);
  const [isSliding, setIsSliding] = useState(false);
  const displayedValue = isSliding ? draftValue : value;

  return (
    <View style={styles.control}>
      <View style={styles.heading}>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
        <Text style={styles.value}>
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
        style={styles.slider}
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
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    color: colors.dim,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
  },
  value: {
    minWidth: 52,
    color: colors.accent,
    fontFamily: fonts.body,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  slider: {
    height: 36,
    marginHorizontal: -8,
  },
});
