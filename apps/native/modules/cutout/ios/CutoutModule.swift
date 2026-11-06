import CoreImage
import ExpoModulesCore
import UIKit
import Vision

enum CutoutError: Error {
  case unreadable
  case noSubject
  case unencodable
}

/// 사진 앱에서 꾹 눌러 피사체를 들어 올리는 것과 같은 Vision 요청이다. 기기 안에서 돈다.
public class CutoutModule: Module {
  public func definition() -> ModuleDefinition {
    Name("Cutout")

    AsyncFunction("cutout") { (url: URL, x: Double?, y: Double?) async throws -> String in
      let (data, _) = try await URLSession.shared.data(from: url)
      guard let photo = UIImage(data: data), let image = photo.cgImage else { throw CutoutError.unreadable }
      let handler = VNImageRequestHandler(cgImage: image, orientation: CGImagePropertyOrientation(photo.imageOrientation))
      let request = VNGenerateForegroundInstanceMaskRequest()
      try handler.perform([request])
      guard let result = request.results?.first, !result.allInstances.isEmpty else { throw CutoutError.noSubject }
      var chosen = result.allInstances
      if let x, let y {
        guard let label = instance(in: result.instanceMask, x: x, y: y) else { throw CutoutError.noSubject }
        chosen = IndexSet(integer: label)
      }
      let masked = try result.generateMaskedImage(ofInstances: chosen, from: handler, croppedToInstancesExtent: true)
      guard
        let space = CGColorSpace(name: CGColorSpace.sRGB),
        let png = CIContext().pngRepresentation(of: CIImage(cvPixelBuffer: masked), format: .RGBA8, colorSpace: space)
      else { throw CutoutError.unencodable }
      return "data:image/png;base64," + png.base64EncodedString()
    }
  }
}

/// 누른 자리의 피사체 번호. 손가락은 가장자리를 살짝 비껴 누르기 쉬워서, 바로 그 칸이
/// 배경(0)이면 둘레에서 가장 많이 걸린 피사체를 고른다.
private func instance(in mask: CVPixelBuffer, x: Double, y: Double) -> Int? {
  CVPixelBufferLockBaseAddress(mask, .readOnly)
  defer { CVPixelBufferUnlockBaseAddress(mask, .readOnly) }
  guard let base = CVPixelBufferGetBaseAddress(mask) else { return nil }
  let width = CVPixelBufferGetWidth(mask)
  let height = CVPixelBufferGetHeight(mask)
  let stride = CVPixelBufferGetBytesPerRow(mask)
  let pixels = base.assumingMemoryBound(to: UInt8.self)
  let cx = min(width - 1, max(0, Int(x * Double(width))))
  let cy = min(height - 1, max(0, Int(y * Double(height))))
  let reach = max(width, height) / 25
  var counts: [UInt8: Int] = [:]
  for dy in -reach...reach {
    for dx in -reach...reach {
      let px = cx + dx
      let py = cy + dy
      guard px >= 0, px < width, py >= 0, py < height else { continue }
      let label = pixels[py * stride + px]
      if dx == 0, dy == 0, label != 0 { return Int(label) }
      if label != 0 { counts[label, default: 0] += 1 }
    }
  }
  return counts.max { $0.value < $1.value }.map { Int($0.key) }
}

private extension CGImagePropertyOrientation {
  init(_ orientation: UIImage.Orientation) {
    switch orientation {
    case .up: self = .up
    case .upMirrored: self = .upMirrored
    case .down: self = .down
    case .downMirrored: self = .downMirrored
    case .left: self = .left
    case .leftMirrored: self = .leftMirrored
    case .right: self = .right
    case .rightMirrored: self = .rightMirrored
    @unknown default: self = .up
    }
  }
}
