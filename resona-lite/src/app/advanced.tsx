import AdvancedScreen from '../screens/AdvancedScreen';
import { usePlayer } from '../player-context';

export default function AdvancedRoute() {
  const player = usePlayer();

  return (
    <AdvancedScreen
      settings={player.settings}
      binauralPlaying={player.binauralPlaying}
      ambientPlaying={player.ambientPlaying}
      noisePlaying={player.noisePlaying}
      noiseMuted={player.noiseMuted}
      audioReady={player.audioReady}
      audioError={player.audioError}
      onSettingChange={player.updateSetting}
      onToggleBinaural={player.toggleBinaural}
      onToggleAmbient={player.toggleAmbient}
      onToggleNoise={player.toggleNoise}
    />
  );
}
