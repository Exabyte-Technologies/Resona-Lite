import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BlurBackdrop from './BlurBackdrop';
import Icon from './Icon';
import LayerBalanceControls, { type LayerBalanceProps } from './LayerBalanceControls';
import { MotionPressable, useReducedMotion } from '../motion';
import { fonts, useThemeColors } from '../theme';

export default function LayerBalanceDialog({ visible, onClose, settings, onChange }: LayerBalanceProps & { visible: boolean; onClose: () => void }) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  return <Modal visible={visible} transparent animationType={reduceMotion ? 'none' : 'fade'} onRequestClose={onClose} statusBarTranslucent>
    <View style={[styles.overlay, { paddingTop:Math.max(insets.top,24), paddingBottom:Math.max(insets.bottom,24) }]}>
      <BlurBackdrop intensity={22} />
      <Pressable accessible={false} onPress={onClose} style={StyleSheet.absoluteFill} />
      <View accessibilityViewIsModal style={[styles.card, { backgroundColor:colors.surface, borderColor:colors.line }]}>
        <View style={styles.heading}>
          <View style={[styles.icon, { backgroundColor:colors.iconSurface }]}><Icon name="balance" size={20} /></View>
          <Text accessibilityRole="header" style={[styles.title, { color:colors.ink }]}>Layer balance</Text>
          <MotionPressable accessibilityRole="button" accessibilityLabel="Close layer balance" onPress={onClose} style={styles.closeButton}><Text style={{ color:colors.accent, fontWeight:'600', fontSize:14 }}>Done</Text></MotionPressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
          <Text style={[styles.description, { color:colors.muted }]}>Find your blend. Changes apply to your soundscape as you listen.</Text>
          <LayerBalanceControls settings={settings} onChange={onChange} />
        </ScrollView>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay:{ flex:1, paddingHorizontal:24, alignItems:'center', justifyContent:'center' },
  card:{ width:'100%', maxWidth:420, maxHeight:'100%', borderRadius:26, borderWidth:StyleSheet.hairlineWidth, overflow:'hidden' },
  heading:{ flexDirection:'row', alignItems:'center', gap:10, paddingLeft:20, paddingRight:12, paddingTop:12 },
  icon:{ width:36, height:36, borderRadius:12, alignItems:'center', justifyContent:'center' },
  title:{ flex:1, fontFamily:fonts.display, fontWeight:'600', fontSize:19 },
  closeButton:{ minHeight:44, minWidth:50, alignItems:'center', justifyContent:'center' },
  body:{ paddingHorizontal:20, paddingTop:12, paddingBottom:24 },
  description:{ fontFamily:fonts.body, fontSize:14, lineHeight:21, marginBottom:24 },
});
