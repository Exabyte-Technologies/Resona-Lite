import HomeScreen from '../screens/HomeScreen';
import { usePlayer } from '../player-context';

export default function HomeRoute() {
  const player = usePlayer();

  return (
    <HomeScreen
      settings={player.settings}
      isPlaying={player.binauralPlaying || player.ambientPlaying}
      audioReady={player.audioReady}
      audioError={player.audioError}
      onTogglePlayback={player.toggleSession}
      onSelectMode={player.chooseMode}
      onMasterVolumeChange={(value) => player.updateSetting('masterVolume', value)}
    />
  );
}
