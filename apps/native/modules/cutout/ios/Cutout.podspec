Pod::Spec.new do |s|
  s.name           = 'Cutout'
  s.version        = '1.0.0'
  s.summary        = 'Lifts the subject out of a photo with Vision.'
  s.author         = 'dam'
  s.homepage       = 'https://github.com/dam'
  s.license        = 'UNLICENSED'
  s.platforms      = { :ios => '26.0' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
end
