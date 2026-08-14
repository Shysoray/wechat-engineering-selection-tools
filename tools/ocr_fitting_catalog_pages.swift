#!/usr/bin/env swift

import AppKit
import Foundation
import Vision

func escaped(_ value: String) -> String {
    return value
        .replacingOccurrences(of: "\\", with: "\\\\")
        .replacingOccurrences(of: "\t", with: "\\t")
        .replacingOccurrences(of: "\n", with: "\\n")
        .replacingOccurrences(of: "\r", with: "\\r")
}

guard CommandLine.arguments.count >= 2 else {
    FileHandle.standardError.write(Data("usage: ocr_fitting_catalog_pages.swift [--output PATH] IMAGE...\n".utf8))
    exit(2)
}

var arguments = Array(CommandLine.arguments.dropFirst())
var outputPath: String?
if arguments.count >= 2 && arguments[0] == "--output" {
    outputPath = arguments[1]
    arguments.removeFirst(2)
}
guard !arguments.isEmpty else {
    FileHandle.standardError.write(Data("at least one image path is required\n".utf8))
    exit(2)
}

var outputLines: [String] = []
for imagePath in arguments {
    guard
        let image = NSImage(contentsOfFile: imagePath),
        let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil)
    else {
        FileHandle.standardError.write(Data("unable to load image: \(imagePath)\n".utf8))
        continue
    }

    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = false
    request.recognitionLanguages = ["en-US", "zh-Hant", "zh-Hans"]
    request.minimumTextHeight = 0.003

    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    do {
        try handler.perform([request])
    } catch {
        FileHandle.standardError.write(Data("OCR failed for \(imagePath): \(error)\n".utf8))
        continue
    }

    let observations = (request.results ?? []).sorted { left, right in
        let verticalDelta = left.boundingBox.midY - right.boundingBox.midY
        if abs(verticalDelta) > 0.004 {
            return verticalDelta > 0
        }
        return left.boundingBox.minX < right.boundingBox.minX
    }

    outputLines.append("#FILE\t\(escaped(imagePath))")
    for observation in observations {
        guard let candidate = observation.topCandidates(1).first else { continue }
        let box = observation.boundingBox
        let fields = [
            String(format: "%.6f", box.minX),
            String(format: "%.6f", box.minY),
            String(format: "%.6f", box.width),
            String(format: "%.6f", box.height),
            String(format: "%.4f", candidate.confidence),
            escaped(candidate.string),
        ]
        outputLines.append(fields.joined(separator: "\t"))
    }
}

let outputText = outputLines.joined(separator: "\n") + "\n"
if let outputPath {
    try outputText.write(toFile: outputPath, atomically: true, encoding: .utf8)
} else {
    print(outputText, terminator: "")
}
