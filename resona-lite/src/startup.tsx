import { useHomeQuote } from './quotes';
import { createContext,useContext,useEffect,useState,type PropsWithChildren } from 'react';
import { Animated,Image,Platform,StyleSheet,View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useLanguage } from './i18n';

if(Platform.OS!=='web') {void SplashScreen.preventAutoHideAsync().catch(()=>{});SplashScreen.setOptions({duration:250,fade:true});}
const StartupContext=createContext(true);
export const useStartupReady=()=>useContext(StartupContext);
export function StartupProvider({children}:PropsWithChildren){
 const {ready:languageReady}=useLanguage();const {ready:quoteReady}=useHomeQuote();const ready=languageReady&&quoteReady;const [complete,setComplete]=useState(false);const [opacity]=useState(()=>new Animated.Value(1));
 useEffect(()=>{if(!ready)return;let active=true;if(Platform.OS!=='web')void SplashScreen.hideAsync().catch(()=>{});const timer=setTimeout(()=>{Animated.timing(opacity,{toValue:0,duration:250,useNativeDriver:true}).start(({finished})=>{if(active&&finished)setComplete(true);});},500);return()=>{active=false;clearTimeout(timer);opacity.stopAnimation();};},[ready,opacity]);
 return <StartupContext.Provider value={complete}><View style={styles.root}>{children}{!complete?<Animated.View style={[styles.cover,{opacity}]}><Image source={require('../assets/resona-icon-gradient.png')} style={styles.image}/></Animated.View>:null}</View></StartupContext.Provider>;
}
const styles=StyleSheet.create({root:{flex:1},cover:{...StyleSheet.absoluteFill,zIndex:9999,backgroundColor:'#101a1c',alignItems:'center',justifyContent:'center',gap:18},image:{width:180,height:180,borderRadius:36}});
