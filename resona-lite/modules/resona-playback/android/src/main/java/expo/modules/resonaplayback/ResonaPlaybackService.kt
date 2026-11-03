package expo.modules.resonaplayback

import android.app.*
import android.content.*
import android.graphics.BitmapFactory
import android.media.*
import android.media.session.MediaSession
import android.media.session.PlaybackState
import android.os.*
import org.json.JSONObject

class ResonaPlaybackService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private lateinit var session: MediaSession
  private lateinit var audio: AudioManager
  private var focus: AudioFocusRequest? = null
  private var wakeLock: PowerManager.WakeLock? = null
  private var state = JSONObject()
  private var deadline: Long? = null
  private val expire = Runnable { PlaybackEvents.emit("stop", true); stopSelf() }
  private val noisy = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) { PlaybackEvents.emit("pause") }
  }

  override fun onCreate() {
    super.onCreate()
    active = this
    audio = getSystemService(AUDIO_SERVICE) as AudioManager
    if (Build.VERSION.SDK_INT >= 26) (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(NotificationChannel(CHANNEL, "Resona Lite", NotificationManager.IMPORTANCE_LOW).apply { setSound(null, null); enableVibration(false); setShowBadge(false) })
    session = MediaSession(this, "Resona Lite").apply {
      setCallback(object : MediaSession.Callback() {
        override fun onPlay() { PlaybackEvents.emit("play") }
        override fun onPause() { PlaybackEvents.emit("pause") }
        override fun onStop() { PlaybackEvents.emit("stop") }
      }); isActive = true
    }
    if (Build.VERSION.SDK_INT >= 33) registerReceiver(noisy, IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY), RECEIVER_NOT_EXPORTED)
    else {
      @Suppress("DEPRECATION")
      registerReceiver(noisy, IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY))
    }
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    intent?.getStringExtra("action")?.let { action -> PlaybackEvents.emit(action); if (action == "stop") stopSelf(); return START_NOT_STICKY }
    intent?.getStringExtra("state")?.let { state = JSONObject(it) }
    publishState()
    return START_NOT_STICKY
  }

  fun updateState(json: String) {
    state = JSONObject(json)
    publishState()
  }

  private fun publishState() {
    val playing = state.optBoolean("playing")
    val notification = notification(playing)
    if (Build.VERSION.SDK_INT >= 29) startForeground(ID, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
    else startForeground(ID, notification)
    val newDeadline = if (state.isNull("deadline")) null else state.optLong("deadline")
    if (deadline != newDeadline) {
      deadline = newDeadline; handler.removeCallbacks(expire)
      newDeadline?.let { handler.postDelayed(expire, (it - System.currentTimeMillis()).coerceAtLeast(0)) }
    }
    session.setPlaybackState(PlaybackState.Builder().setActions(PlaybackState.ACTION_PLAY or PlaybackState.ACTION_PAUSE or PlaybackState.ACTION_STOP or PlaybackState.ACTION_PLAY_PAUSE).setState(if (playing) PlaybackState.STATE_PLAYING else PlaybackState.STATE_PAUSED, PlaybackState.PLAYBACK_POSITION_UNKNOWN, if (playing) 1f else 0f).build())
    session.setMetadata(MediaMetadata.Builder().putString(MediaMetadata.METADATA_KEY_TITLE, "resona").putString(MediaMetadata.METADATA_KEY_ARTIST, state.optString("mood")).build())
    if (playing) {
      if (wakeLock == null) wakeLock = (getSystemService(POWER_SERVICE) as PowerManager).newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "ResonaLite:Playback").apply { acquire() }
      if (focus == null && Build.VERSION.SDK_INT >= 26) {
        focus = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN).setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build()).setOnAudioFocusChangeListener({ change -> if (change < 0) PlaybackEvents.emit("pause") }, handler).build()
        if (audio.requestAudioFocus(focus!!) == AudioManager.AUDIOFOCUS_REQUEST_FAILED) {
          focus = null
          PlaybackEvents.emit("pause")
        }
      }
    } else releaseResources()
  }

  private fun notification(playing: Boolean): Notification {
    val launch = packageManager.getLaunchIntentForPackage(packageName)!!
    val open = PendingIntent.getActivity(this, 0, launch, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    val icon = resources.getIdentifier("notification_icon", "drawable", packageName).takeIf { it != 0 } ?: applicationInfo.icon
    val builder = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, CHANNEL) else Notification.Builder(this)
    builder.setSmallIcon(icon).setContentTitle("resona · ${state.optString("mood")}").setContentText(state.optString("status")).setContentIntent(open).setColor(0xff83c9bd.toInt()).setOnlyAlertOnce(true).setOngoing(playing).setVisibility(Notification.VISIBILITY_PUBLIC).setCategory(Notification.CATEGORY_TRANSPORT)
    val logo = state.optString("logo")
    if (logo.startsWith("file:")) BitmapFactory.decodeFile(android.net.Uri.parse(logo).path)?.let { builder.setLargeIcon(it) }
    val actions = listOf(Triple(if (playing) "pause" else "play", state.optString("playLabel"), if (playing) android.R.drawable.ic_media_pause else android.R.drawable.ic_media_play), Triple("stop", state.optString("stopLabel"), android.R.drawable.ic_menu_close_clear_cancel), Triple("extend", state.optString("extendLabel"), android.R.drawable.ic_menu_recent_history))
    for ((index, action) in actions.withIndex()) {
      val target = Intent(this, ResonaPlaybackService::class.java).putExtra("action", action.first)
      builder.addAction(Notification.Action.Builder(action.third, action.second, PendingIntent.getService(this, index + 1, target, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)).build())
    }
    builder.setStyle(Notification.MediaStyle().setMediaSession(session.sessionToken).setShowActionsInCompactView(0, 1))
    return builder.build()
  }

  private fun releaseResources() {
    wakeLock?.let { if (it.isHeld) it.release() }; wakeLock = null
    if (Build.VERSION.SDK_INT >= 26) focus?.let { audio.abandonAudioFocusRequest(it) }; focus = null
  }
  override fun onTaskRemoved(rootIntent: Intent?) { stopSelf() }
  override fun onDestroy() {
    if (active === this) active = null
    handler.removeCallbacksAndMessages(null); releaseResources(); unregisterReceiver(noisy); session.release(); stopForeground(STOP_FOREGROUND_REMOVE); super.onDestroy()
  }
  override fun onBind(intent: Intent?): IBinder? = null
  companion object { var active: ResonaPlaybackService? = null; private const val ID = 7401; private const val CHANNEL = "resona-playback" }
}
