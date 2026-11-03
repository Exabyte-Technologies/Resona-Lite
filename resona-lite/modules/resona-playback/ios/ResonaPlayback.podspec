Pod::Spec.new do |s|
  s.name = 'ResonaPlayback'
  s.version = '1.0.0'
  s.summary = 'Native background playback controls for Resona Lite'
  s.description = s.summary
  s.license = { :type => 'MIT' }
  s.author = 'Resona Lite'
  s.homepage = 'https://github.com/Exabyte-Technologies/Resona'
  s.platforms = { :ios => '16.4' }
  s.source = { :git => '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'AVFAudio', 'MediaPlayer', 'UIKit'
  s.source_files = '**/*.{h,m,mm,swift}'
  s.swift_version = '5.9'
end
