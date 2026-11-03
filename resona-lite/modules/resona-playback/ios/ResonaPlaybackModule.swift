import ExpoModulesCore
import AVFAudio
import MediaPlayer
import UIKit
import ActivityKit

public final class ResonaPlaybackModule: Module {
  private var observing = false
  private var pending: [[String: Any]] = []
  private var commandTargets: [(MPRemoteCommand, Any)] = []
  private var observers: [NSObjectProtocol] = []
  private var sleepTimer: DispatchSourceTimer?
  private var deadline: Double?
  private var playing = false
  private var shouldResume = false

  public func definition() -> ModuleDefinition {
    Name("ResonaPlayback")
    Events("onPlaybackAction")
    OnStartObserving { self.observing = true }
    OnStopObserving { self.observing = false }
    AsyncFunction("liveActivitiesEnabled") { ActivityAuthorizationInfo().areActivitiesEnabled }.runOnQueue(.main)
    AsyncFunction("configure") { try self.configure() }.runOnQueue(.main)
    AsyncFunction("activate") { try AVAudioSession.sharedInstance().setActive(true) }.runOnQueue(.main)
    AsyncFunction("drainActions") { () -> [[String: Any]] in
      let events = self.pending; self.pending.removeAll(); return events
    }.runOnQueue(.main)
    AsyncFunction("update") { (json: String) in try self.update(json) }.runOnQueue(.main)
    AsyncFunction("dispose") { self.dispose() }.runOnQueue(.main)
  }

  private func emit(_ action: String, expired: Bool = false) {
    let event: [String: Any] = ["action": action, "expired": expired]
    if observing { sendEvent("onPlaybackAction", event) } else { pending.append(event) }
  }

  private func configure() throws {
    try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.allowAirPlay, .allowBluetoothA2DP])
    guard commandTargets.isEmpty else { return }
    let center = MPRemoteCommandCenter.shared()
    for (command, action) in [(center.playCommand, "play"), (center.pauseCommand, "pause"), (center.stopCommand, "stop"), (center.togglePlayPauseCommand, "toggle")] {
      command.isEnabled = true
      let target = command.addTarget { [weak self] _ in
        DispatchQueue.main.async { guard let self else { return }; self.emit(action == "toggle" ? (self.playing ? "pause" : "play") : action) }
        return .success
      }
      commandTargets.append((command, target))
    }
    center.nextTrackCommand.isEnabled = false; center.previousTrackCommand.isEnabled = false
    observers.append(NotificationCenter.default.addObserver(forName: AVAudioSession.interruptionNotification, object: nil, queue: .main) { [weak self] note in
      guard let self, let raw = note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt, let type = AVAudioSession.InterruptionType(rawValue: raw) else { return }
      if type == .began { self.shouldResume = self.playing; self.emit("pause") }
      else {
        let options = AVAudioSession.InterruptionOptions(rawValue: note.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt ?? 0)
        if self.shouldResume && options.contains(.shouldResume) { self.emit("play") }
        self.shouldResume = false
      }
    })
    observers.append(NotificationCenter.default.addObserver(forName: AVAudioSession.routeChangeNotification, object: nil, queue: .main) { [weak self] note in
      if note.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt == AVAudioSession.RouteChangeReason.oldDeviceUnavailable.rawValue { self?.shouldResume = false; self?.emit("pause") }
    })
  }

  private func update(_ json: String) throws {
    let data = try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: Any] ?? [:]
    playing = data["playing"] as? Bool ?? false
    let session = data["session"] as? Bool ?? false
    let nextDeadline = data["deadline"] as? Double
    if deadline != nextDeadline {
      deadline = nextDeadline; sleepTimer?.cancel(); sleepTimer = nil
      if let nextDeadline {
        let timer = DispatchSource.makeTimerSource(queue: .main)
        timer.schedule(deadline: .now() + max(0, nextDeadline / 1000 - Date().timeIntervalSince1970))
        timer.setEventHandler { [weak self] in self?.emit("stop", expired: true) }
        timer.resume(); sleepTimer = timer
      }
    }
    guard session else {
      MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
      MPNowPlayingInfoCenter.default().playbackState = .stopped
      try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
      return
    }
    var info: [String: Any] = [MPMediaItemPropertyTitle: "resona", MPMediaItemPropertyArtist: data["mood"] as? String ?? "Resona Lite", MPNowPlayingInfoPropertyIsLiveStream: true, MPNowPlayingInfoPropertyPlaybackRate: playing ? 1.0 : 0.0]
    if let path = data["logo"] as? String, let url = URL(string: path), let image = UIImage(contentsOfFile: url.path) {
      info[MPMediaItemPropertyArtwork] = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
    }
    MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    MPNowPlayingInfoCenter.default().playbackState = playing ? .playing : .paused
  }

  private func dispose() {
    sleepTimer?.cancel(); sleepTimer = nil
    for (command, target) in commandTargets { command.removeTarget(target) }; commandTargets.removeAll()
    observers.forEach(NotificationCenter.default.removeObserver); observers.removeAll()
    pending.removeAll(); MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
  }
}
