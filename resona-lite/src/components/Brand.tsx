import { Image, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '../i18n';
import { useThemeColors } from '../theme';
export default function Brand({ size=28, light=false }: { size?:number; light?:boolean }) {
 const c=useThemeColors();
 return <View style={styles.row}><Image source={require('../../assets/resona-icon-gradient.png')} style={{width:size,height:size,borderRadius:size/4}} accessible={false}/><Text accessibilityLabel="Resona Lite" style={[styles.wordmark,{color:light?'#e4eeea':c.ink}]}>resona<Text style={{color:light?'#83c9bd':c.accent}}>.</Text></Text></View>;
}
const styles=StyleSheet.create({row:{direction:'ltr',flexDirection:'row',alignItems:'center',gap:8},wordmark:{fontSize:24,fontWeight:'700',letterSpacing:-1.2}});
