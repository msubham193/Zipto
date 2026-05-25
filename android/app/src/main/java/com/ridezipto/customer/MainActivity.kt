package com.ridezipto.customer

import android.os.Bundle
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    // Dismiss the Android 12+ system splash screen immediately so only
    // the JS animated Splash screen (Splash.tsx) is shown — no double splash.
    installSplashScreen()
    super.onCreate(savedInstanceState)
  }

  override fun getMainComponentName(): String = "Zipto"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
