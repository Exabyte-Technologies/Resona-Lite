import { Asset } from 'expo-asset';
import { Directory, File } from 'expo-file-system';
import { createLiveActivity, widgetsDirectory, addUserInteractionListener, type LiveActivity } from 'expo-widgets';
import { HStack, VStack, Image, Button, Link, Text } from '@expo/ui/swift-ui';
import { cornerRadius, font, frame, padding, resizable } from '@expo/ui/swift-ui/modifiers';
import { Platform } from 'react-native';
import { liveActivitiesEnabled } from './runtime';
import type { PlaybackAction, PlaybackCard } from './types';

type ActivityCard = PlaybackCard & { interactive: boolean };
const interactive = Number.parseInt(String(Platform.Version), 10) >= 17;
const activity = createLiveActivity<ActivityCard>('ResonaPlayback', props => {
  'widget';
  const logo = <Image uiImage={props.logo} modifiers={[resizable(),frame({width:30,height:30}),cornerRadius(7)]}/>;
  const useIntent = props.interactive && props.playing;
  const controls = <HStack spacing={12} modifiers={[font({size:13})]}>
    {useIntent?<Button target="pause" label={props.playLabel} modifiers={[frame({minHeight:44})]}/>:<Link destination={props.playing?'resona-lite:///?action=pause':'resona-lite:///?action=play'} label={props.playLabel} modifiers={[frame({minHeight:44})]}/>}
    {useIntent?<Button target="stop" label={props.stopLabel} modifiers={[frame({minHeight:44})]}/>:<Link destination="resona-lite:///?action=stop" label={props.stopLabel} modifiers={[frame({minHeight:44})]}/>}
    {useIntent?<Button target="extend" label={props.extendLabel} modifiers={[frame({minHeight:44})]}/>:<Link destination="resona-lite:///?action=extend" label={props.extendLabel} modifiers={[frame({minHeight:44})]}/>}
  </HStack>;
  return {
    banner:<VStack alignment="leading" spacing={10} modifiers={[padding({all:16})]}>
      <HStack spacing={10}>{logo}<VStack alignment="leading"><Text modifiers={[font({size:20,weight:'semibold'})]}>resona</Text><Text>{props.mood} · {props.status}</Text></VStack></HStack>
      {props.deadline?<HStack spacing={6}><Text>{props.timerLabel}</Text><Text timerInterval={{lower:new Date(),upper:new Date(props.deadline)}} countsDown/></HStack>:null}
      {controls}
    </VStack>,
    compactLeading:logo,
    compactTrailing:<Image systemName={props.playing?'waveform':'pause.fill'} color="#83c9bd" size={18}/>,
    minimal:<Image systemName="waveform" color="#83c9bd" size={18}/>,
    expandedLeading:logo,
    expandedTrailing:<Text>{props.status}</Text>,
    expandedCenter:<Text>resona · {props.mood}</Text>,
    expandedBottom:<VStack spacing={8}>{controls}</VStack>,
  };
});
let instance:LiveActivity<ActivityCard>|null=null;
let sharedLogo='';
export const supported=true;
export async function initialize(onAction:(action:PlaybackAction)=>void){
 for(const stale of activity.getInstances()) await stale.end('immediate');
 const listener=addUserInteractionListener(event=>{if(event.source===instance?.getId() && ['play','pause','stop','extend'].includes(event.target))onAction(event.target as PlaybackAction);});
 return ()=>listener.remove();
}
export async function requestAccess(){return liveActivitiesEnabled();}
export async function show(card:PlaybackCard){
  if(!sharedLogo){
    const asset=Asset.fromModule(require('../../assets/resona-icon-gradient.png'));await asset.downloadAsync();
    if(!asset.localUri)throw new Error('Logo unavailable');
    const directory=new Directory(widgetsDirectory);if(!directory.exists)directory.create({intermediates:true});
    const target=new File(directory,'resona-logo.png');if(target.exists)target.delete();new File(asset.localUri).copy(target);sharedLogo=target.uri;
  }
  const props={...card,logo:sharedLogo,interactive};
  if(instance)await instance.update(props,card.deadline?new Date(card.deadline):undefined);
  else instance=activity.start(props,'resona-lite:///',card.deadline?new Date(card.deadline):undefined);
}
export async function hide(){if(instance){const current=instance;instance=null;await current.end('immediate');}}
