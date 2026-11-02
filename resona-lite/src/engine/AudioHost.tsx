import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { ENGINE_HTML } from './document';
import type { AudioCommand, AudioHostProps } from './types';

export default function AudioHost({ commandRef, onMessage }: AudioHostProps) {
  const ref = useRef<WebView<object>>(null);
  const source = useMemo(() => ({ html: ENGINE_HTML, baseUrl: 'about:blank' }), []);
  useEffect(() => {
    commandRef.current = (command: AudioCommand) => {
      ref.current?.injectJavaScript(`window.resonaCommand(${JSON.stringify(command)}); true;`);
    };
    return () => { commandRef.current = null; };
  }, [commandRef]);
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.host}>
      <WebView<object>
        ref={ref}
        source={source}
        originWhitelist={['*']}
        javaScriptEnabled
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        onShouldStartLoadWithRequest={({ url }) => url === 'about:blank'}
        onMessage={({ nativeEvent }) => {
          try { const message = JSON.parse(nativeEvent.data); if (message.channel === 'resona-lite') onMessage(message); } catch { /* unrelated bridge data */ }
        }}
        onError={({ nativeEvent }) => onMessage({ type: 'error', message: nativeEvent.description })}
        onContentProcessDidTerminate={() => { onMessage({ type: 'error', message: 'Audio was interrupted. Restart the app to reload the engine.' }); }}
        style={styles.host}
      />
    </View>
  );
}
const styles = StyleSheet.create({ host: { position: 'absolute', width: 1, height: 1, opacity: 0, bottom: 0, left: 0 } });
