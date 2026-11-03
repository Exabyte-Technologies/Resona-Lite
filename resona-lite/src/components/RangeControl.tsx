import { LocalizedText as Text, useLanguage } from '../i18n';
import { useState } from 'react';
import Slider from '@react-native-community/slider';
import { StyleSheet, View } from 'react-native';
import { fonts, spacing, useThemeColors } from '../theme';
import { useAccessibilitySettings } from '../accessibility';

type Props = {
  title: string;
  description?: string;
  value: number;
  minimum: number;
  maximum: number;
  step?: number;
  unit?: string;
  compact?: boolean;
  grid?: boolean;
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
  grid = false,
  onChange,
}: Props) {
  const colors = useThemeColors();
  const { spacious } = useAccessibilitySettings();
  const {t}=useLanguage();
  const [draftValue, setDraftValue] = useState(value);
  const [isSliding, setIsSliding] = useState(false);
  const displayedValue = isSliding ? draftValue : value;

  return (
    <View style={[
      styles.control,
      compact && styles.compactControl,
      grid && styles.gridControl,
    ]}>
      <View style={[styles.heading, grid && styles.gridHeading, spacious && styles.stackedHeading]}>
        <View style={styles.copy}>
          <Text style={[
            styles.title,
            { color: colors.ink },
            compact && styles.compactTitle,
            grid && styles.gridTitle,
          ]}>
            {title}
          </Text>
          {description ? (
            <Text style={[
              styles.description,
              { color: colors.dim },
              compact && styles.compactDescription,
              grid && styles.gridDescription,
            ]}>
              {description}
            </Text>
          ) : null}
        </View>
        <Text style={[
          styles.value,
          { color: colors.accent },
          compact && styles.compactValue,
          grid && styles.gridValue,
        ]}>
          {formatValue(displayedValue)}
          {unit}
        </Text>
      </View>
      <View style={[styles.sliderInset, grid && styles.gridSliderInset]}>
        <Slider
          accessibilityLabel={t(title)}
          minimumValue={minimum}
          maximumValue={maximum}
          step={step}
          value={value}
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor={colors.controlBorder}
          thumbTintColor={colors.ink}
          onValueChange={(nextValue) => {
            setDraftValue(nextValue);
            setIsSliding(true);
          }}
          onSlidingComplete={(nextValue) => {
            setDraftValue(nextValue);
            setIsSliding(false);
            onChange(nextValue);
          }}
          style={[
            styles.slider,
            compact && styles.compactSlider,
            grid && styles.gridSlider,
          ]}
        />
      </View>
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
  gridControl: {
    width: '100%',
    gap: 0,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  gridHeading: {
    minHeight: 34,
    flexDirection: 'column-reverse',
    alignItems: 'stretch',
    justifyContent: 'flex-end',
    gap: 2,
  },
  stackedHeading: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 4,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: '600',
  },
  gridTitle: {
    fontSize: 11,
    lineHeight: 13,
  },
  compactTitle: {
    fontSize: 14,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  gridDescription: {
    fontSize: 9,
    lineHeight: 11,
  },
  compactDescription: {
    fontSize: 12,
    lineHeight: 14,
  },
  value: {
    flexShrink: 1,
    minWidth: 52,
    fontFamily: fonts.body,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  gridValue: {
    alignSelf: 'flex-start',
    minWidth: 0,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'left',
  },
  compactValue: {
    fontSize: 13,
  },
  sliderInset:{ marginHorizontal:8 },
  gridSliderInset:{ marginHorizontal:4 },
  slider: {
    height: 44,
  },
  compactSlider: {
    height: 34,
  },
  gridSlider: {
    width: '100%',
    height: 30,
  },
});
