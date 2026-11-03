import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LANGUAGES, LocalizedText as Text, useLanguage, type Language } from '../i18n';
import { MotionPressable, useReducedMotion } from '../motion';
import { useThemeColors } from '../theme';
import BlurBackdrop from './BlurBackdrop';
import Icon from './Icon';

export default function LanguagePicker({ visible, firstLaunch=false, onContinue, onClose }: { visible: boolean; firstLaunch?: boolean; onContinue:()=>void; onClose:()=>void }) {
  const { language,setLanguage,t,rtl }=useLanguage();
  const c=useThemeColors(), insets=useSafeAreaInsets(), reduceMotion=useReducedMotion();
  return <Modal transparent visible={visible} animationType={reduceMotion?'none':'fade'} onRequestClose={firstLaunch?()=>{}:onClose} statusBarTranslucent>
    <View style={[styles.overlay,{paddingTop:Math.max(insets.top,20),paddingBottom:Math.max(insets.bottom,20),direction:rtl?'rtl':'ltr'}]}>
      <BlurBackdrop intensity={30}/>
      <View accessibilityViewIsModal style={[styles.card,{backgroundColor:c.surface,borderColor:c.line}]}>
        <View style={styles.heading}><Icon name="language" size={24}/><Text accessibilityRole="header" style={[styles.title,{color:c.ink}]}>Choose your language</Text></View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {LANGUAGES.map(item=><MotionPressable key={item.code} accessibilityRole="radio" accessibilityLabel={item.name} accessibilityState={{checked:item.code===language}} onPress={()=>setLanguage(item.code as Language)} style={[styles.language,{borderColor:item.code===language?c.selectedBorder:c.line,backgroundColor:item.code===language?c.surfaceSelected:c.surfaceSubtle}]}>
            <Text style={{color:c.ink,fontSize:17,writingDirection:item.code==='ar'?'rtl':'ltr'}}>{item.name}</Text><Text style={{color:c.accent}}>{item.code===language?'✓':''}</Text>
          </MotionPressable>)}
        </ScrollView>
        <View style={styles.actions}>

          <MotionPressable accessibilityRole="button" accessibilityLabel={t(firstLaunch?'Continue':'Done')} onPress={()=>{setLanguage(language);onContinue();}} style={[styles.continue,{backgroundColor:c.accent}]}><Text style={{color:c.accentInk,fontWeight:'600'}}>{firstLaunch?'Continue':'Done'}</Text></MotionPressable>
        </View>
      </View>
    </View>
  </Modal>;
}
const styles=StyleSheet.create({overlay:{flex:1,paddingHorizontal:20,alignItems:'center',justifyContent:'center'},card:{width:'100%',maxWidth:420,maxHeight:'100%',borderRadius:26,borderWidth:1,overflow:'hidden'},heading:{flexDirection:'row',alignItems:'center',gap:12,padding:22},title:{flex:1,fontSize:23,fontWeight:'600'},list:{paddingHorizontal:22,gap:8,paddingBottom:12},language:{minHeight:50,borderWidth:1,borderRadius:12,paddingHorizontal:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},actions:{padding:22,flexDirection:'row',gap:12},cancel:{minHeight:48,paddingHorizontal:14,justifyContent:'center'},continue:{flex:1,minHeight:48,borderRadius:14,alignItems:'center',justifyContent:'center'}});
