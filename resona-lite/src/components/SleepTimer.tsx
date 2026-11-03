import { StyleSheet, View } from 'react-native';
import { LocalizedText as Text, useLanguage } from '../i18n';
import { MotionEntrance, MotionPressable, SelectionWash } from '../motion';
import { formatRemaining } from '../sleep-timer';
import { fonts, useThemeColors } from '../theme';
import Panel from './Panel';
import Icon from './Icon';

type Props={deadline:number|null;remaining:number;finished:boolean;onChange:(minutes:number|null)=>void};
export default function SleepTimer({deadline,remaining,finished,onChange}:Props){
 const colors=useThemeColors();const {t}=useLanguage();
 return <Panel title="Sleep timer" icon="sleep" compact>
  <Text style={{color:colors.muted,fontFamily:fonts.body,fontSize:13,lineHeight:20}}>Stop all sounds after a little while.</Text>
  <View style={styles.choices}>
   {[null,15,30,45,60,90].map(minutes => {
     const selected = minutes === null && deadline === null;
     return <MotionPressable key={minutes ?? 'off'} accessibilityRole="button" accessibilityState={{ selected }}
       onPress={() => onChange(minutes)} style={[styles.choice, { borderColor: colors.controlBorder, backgroundColor: colors.surfaceSubtle }]}>
       <SelectionWash selected={selected} color={colors.surfaceSelected} radius={12} />
       <Text style={{ flexShrink:1, color:colors.accent, fontSize:13, fontWeight:'600' }}>{minutes === null ? 'Off' : t('{{minutes}} min', { minutes })}</Text>
       {selected && <Icon name="check" size={16} />}
     </MotionPressable>;
   })}
  </View>
  {deadline!==null?<MotionEntrance style={styles.status}><Text style={{color:colors.ink,fontSize:14}}>{t('Time remaining')} · {formatRemaining(remaining)}</Text><MotionPressable accessibilityRole="button" onPress={()=>onChange(null)} style={styles.cancel}><Text style={{color:colors.accent,textDecorationLine:'underline',fontSize:12}}>Cancel timer</Text></MotionPressable></MotionEntrance>:finished?<MotionEntrance><Text accessibilityLiveRegion="polite" style={{color:colors.accent,fontSize:13}}>{t('Timer finished')} · {t('All sounds have stopped.')}</Text></MotionEntrance>:null}
 </Panel>;
}
const styles=StyleSheet.create({choices:{flexDirection:'row',flexWrap:'wrap',gap:8},choice:{minWidth:72,maxWidth:'100%',minHeight:44,paddingHorizontal:12,flexDirection:'row',gap:6,justifyContent:'center',alignItems:'center',borderRadius:12,borderWidth:1},status:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:6},cancel:{minHeight:44,justifyContent:'center',paddingHorizontal:6}});
