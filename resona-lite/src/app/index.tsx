import HomeScreen from '../screens/HomeScreen';
import { usePlayer } from '../player-context';

export default function HomeRoute() {
  const player = usePlayer();

  return (
    <HomeScreen
      timer={{deadline:player.sleepDeadline,remaining:player.sleepRemaining,finished:player.sleepFinished,onChange:player.setSleepTimer}}
      settings={player.settings}
      isPlaying={player.binauralPlaying || player.ambientPlaying}
      audioReady={player.audioReady}
      audioError={player.audioError}
      onTogglePlayback={player.toggleSession}
      onSelectMode={player.chooseMode}
      onLayerVolumeChange={player.updateSetting}
      onMasterVolumeChange={(value) => player.updateSetting('masterVolume', value)}
    />
  );
}
