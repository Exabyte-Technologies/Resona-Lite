package expo.modules.resonaplayback

import android.content.Intent
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.functions.Queues

object PlaybackEvents {
  var listener: ((Map<String, Any>) -> Unit)? = null
  val pending = mutableListOf<Map<String, Any>>()
  fun emit(action: String, expired: Boolean = false) {
    val event = mapOf("action" to action, "expired" to expired)
    listener?.invoke(event) ?: pending.add(event)
  }
}

class ResonaPlaybackModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ResonaPlayback")
    Events("onPlaybackAction")
    OnStartObserving { PlaybackEvents.listener = { sendEvent("onPlaybackAction", it) } }
    OnStopObserving { PlaybackEvents.listener = null }
    AsyncFunction("configure") { }
    AsyncFunction("activate") { }
    AsyncFunction("drainActions") { val events = PlaybackEvents.pending.toList(); PlaybackEvents.pending.clear(); events }.runOnQueue(Queues.MAIN)
    AsyncFunction("update") { json: String ->
      val context = appContext.reactContext ?: return@AsyncFunction
      val data = org.json.JSONObject(json)
      if (!data.optBoolean("session")) {
        context.stopService(Intent(context, ResonaPlaybackService::class.java))
      } else {
        val existing = ResonaPlaybackService.active
        if (existing != null) existing.updateState(json)
        else {
          val intent = Intent(context, ResonaPlaybackService::class.java).putExtra("state", json)
          if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(intent) else context.startService(intent)
        }
      }
    }.runOnQueue(Queues.MAIN)
    AsyncFunction("dispose") {
      appContext.reactContext?.let { it.stopService(Intent(it, ResonaPlaybackService::class.java)) }
      PlaybackEvents.listener = null; PlaybackEvents.pending.clear()
    }.runOnQueue(Queues.MAIN)
  }
}
