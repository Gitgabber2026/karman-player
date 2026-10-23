import Foundation
import Combine
import AVFoundation
import UIKit
import ImageIO

struct Song: Identifiable, Codable {
    var id: UUID
    var title: String
    var filename: String
    var duration: Double
    var favorite: Bool = false
    var added: Date = Date()
    var folderID: UUID?
    var relativeFolder: String?
    var artist: String?
    var album: String?
    var artworkFilename: String?
    var artistName: String { artist ?? "Неизвестный исполнитель" }
    var albumName: String { album ?? "Без альбома" }
}
struct AlbumGroup: Identifiable {
    var title: String
    var artist: String
    var song: Song
    var id: String { title + "\u{001F}" + artist }
}
struct Playlist: Identifiable, Codable {
    var id = UUID()
    var name: String
    var songIDs: [UUID] = []
}
struct MusicFolder: Identifiable, Codable {
    var id: UUID
    var name: String
}
struct CollectionData: Codable {
    var songs: [Song] = []
    var playlists: [Playlist] = []
    var folders: [MusicFolder]? = []
}
final class MusicLibrary: ObservableObject {
    @Published var data = CollectionData()
    @Published var message: String?
    @Published var importing = false
    var folders: [MusicFolder] { data.folders ?? [] }
    private let coverCache = NSCache<NSString, UIImage>()
    var albums: [AlbumGroup] {
        var groups: [String: AlbumGroup] = [:]
        for song in data.songs {
            let group = AlbumGroup(title: song.albumName, artist: song.artistName, song: song)
            if groups[group.id] == nil { groups[group.id] = group }
        }
        return groups.values.sorted {
            ($0.title + $0.artist).localizedStandardCompare($1.title + $1.artist) == .orderedAscending
        }
    }
    func artwork(_ song: Song) -> UIImage? {
        guard let filename = song.artworkFilename else { return nil }
        if let image = coverCache.object(forKey: filename as NSString) { return image }
        guard let image = UIImage(contentsOfFile: root.appendingPathComponent(filename).path) else { return nil }
        coverCache.setObject(image, forKey: filename as NSString)
        return image
    }
    private let root: URL
    private var index: URL { root.appendingPathComponent("collection.json") }
    init() {
        root = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("Music", isDirectory: true)
        coverCache.countLimit = 60
        do {
            try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
            if FileManager.default.fileExists(atPath: index.path) {
                data = try JSONDecoder().decode(CollectionData.self, from: Data(contentsOf: index))
            }
        } catch { message = "Не удалось прочитать коллекцию: \(error.localizedDescription)" }
    }
    func file(_ song: Song) -> URL { root.appendingPathComponent(song.filename) }
    @discardableResult func save() -> Bool {
        do {
            try JSONEncoder().encode(data).write(to: index, options: .atomic)
            return true
        } catch { message = "Не удалось сохранить коллекцию: \(error.localizedDescription)"; return false }
    }
    func importFiles(_ urls: [URL]) {
        guard !importing else { return }
        importing = true
        let destination = root
        DispatchQueue.global(qos: .userInitiated).async {
            var imported: [Song] = []
            var importedFolders: [MusicFolder] = []
            var errors = 0
            let extensions: Set<String> = ["mp3", "m4a", "aac", "wav", "aif", "aiff", "caf", "flac"]
            for selection in urls {
                let access = selection.startAccessingSecurityScopedResource()
                defer { if access { selection.stopAccessingSecurityScopedResource() } }
                let isFolder = (try? selection.resourceValues(forKeys: [.isDirectoryKey]).isDirectory) == true
                let folder = isFolder ? MusicFolder(id: UUID(), name: selection.lastPathComponent) : nil
                var candidates: [URL] = []
                if isFolder {
                    if let enumerator = FileManager.default.enumerator(
                        at: selection, includingPropertiesForKeys: [.isRegularFileKey, .isSymbolicLinkKey],
                        options: [.skipsHiddenFiles, .skipsPackageDescendants],
                        errorHandler: { _, _ in errors += 1; return true }) {
                        for case let url as URL in enumerator {
                            let values = try? url.resourceValues(forKeys: [.isRegularFileKey, .isSymbolicLinkKey])
                            if values?.isRegularFile == true && values?.isSymbolicLink != true && extensions.contains(url.pathExtension.lowercased()) {
                                candidates.append(url)
                            }
                        }
                        candidates.sort { $0.path.localizedStandardCompare($1.path) == .orderedAscending }
                    } else { errors += 1 }
                } else { candidates = [selection] }
                let initialCount = imported.count
                for source in candidates {
                    let ext = source.pathExtension.lowercased()
                    guard extensions.contains(ext) else { errors += 1; continue }
                    let id = UUID()
                    let filename = "\(id.uuidString).\(ext)"
                    let target = destination.appendingPathComponent(filename)
                    do {
                        // File coordination lets iCloud / other document providers prepare the file.
                        var coordinationError: NSError?
                        var copyError: Error?
                        NSFileCoordinator().coordinate(readingItemAt: source, options: [], error: &coordinationError) { readableURL in
                            do { try FileManager.default.copyItem(at: readableURL, to: target) }
                            catch { copyError = error }
                        }
                        if let error = coordinationError { throw error }
                        if let error = copyError { throw error }
                        let probe = try AVAudioPlayer(contentsOf: target)
                        let relative = isFolder ? String(source.deletingLastPathComponent().path.dropFirst(selection.path.count)).trimmingCharacters(in: CharacterSet(charactersIn: "/")) : nil
                        // Read embedded tags off the main thread; absent tags fall back to the filename.
                        let metadata = AVURLAsset(url: target).commonMetadata
                        func tag(_ key: AVMetadataKey) -> String? {
                            let value = AVMetadataItem.metadataItems(from: metadata, withKey: key, keySpace: .common)
                                .first?.stringValue?.trimmingCharacters(in: .whitespacesAndNewlines)
                            return value?.isEmpty == false ? value : nil
                        }
                        var coverFilename: String?
                        if let bytes = AVMetadataItem.metadataItems(from: metadata, withKey: AVMetadataKey.commonKeyArtwork, keySpace: .common).first?.dataValue,
                           let imageSource = CGImageSourceCreateWithData(bytes as CFData, nil),
                           let thumbnail = CGImageSourceCreateThumbnailAtIndex(imageSource, 0, [
                            kCGImageSourceCreateThumbnailFromImageAlways: true,
                            kCGImageSourceThumbnailMaxPixelSize: 800,
                            kCGImageSourceCreateThumbnailWithTransform: true
                           ] as CFDictionary),
                           let jpeg = UIImage(cgImage: thumbnail).jpegData(compressionQuality: 0.85) {
                            let name = id.uuidString + ".jpg"
                            do {
                                try jpeg.write(to: destination.appendingPathComponent(name), options: .atomic)
                                coverFilename = name
                            } catch { /* A missing cover must not discard a playable song. */ }
                        }
                        imported.append(Song(id: id,
                                             title: tag(.commonKeyTitle) ?? source.deletingPathExtension().lastPathComponent,
                                             filename: filename, duration: probe.duration,
                                             folderID: folder?.id, relativeFolder: relative,
                                             artist: tag(.commonKeyArtist), album: tag(.commonKeyAlbumName),
                                             artworkFilename: coverFilename))
                    } catch {
                        try? FileManager.default.removeItem(at: target)
                        errors += 1
                    }
                }
                if let folder = folder, imported.count > initialCount { importedFolders.append(folder) }
            }
            let completedSongs = imported
            let completedFolders = importedFolders
            let failedCount = errors
            DispatchQueue.main.async {
                let previous = self.data
                self.data.songs.append(contentsOf: completedSongs)
                self.data.folders = (self.data.folders ?? []) + completedFolders
                if !self.save() {
                    self.data = previous
                    for song in completedSongs {
                        try? FileManager.default.removeItem(at: self.file(song))
                        if let cover = song.artworkFilename { try? FileManager.default.removeItem(at: destination.appendingPathComponent(cover)) }
                    }
                } else {
                    self.message = "Добавлено песен: \(completedSongs.count)" + (failedCount > 0 ? ". Не удалось открыть: \(failedCount). Проверь загрузку из iCloud и формат файла." : "")
                }
                self.importing = false
            }
        }
    }
    func toggleFavorite(_ id: UUID) {
        guard let i = data.songs.firstIndex(where: { $0.id == id }) else { return }
        let previous = data
        data.songs[i].favorite.toggle()
        if !save() { data = previous }
    }
    func makePlaylist(_ name: String) {
        let value = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !value.isEmpty else { return }
        let previous = data
        data.playlists.append(Playlist(name: value))
        if !save() { data = previous }
    }
    func add(_ song: UUID, to playlist: UUID) {
        guard let i = data.playlists.firstIndex(where: { $0.id == playlist }),
              !data.playlists[i].songIDs.contains(song) else { return }
        let previous = data
        data.playlists[i].songIDs.append(song)
        if !save() { data = previous }
    }
    func remove(_ song: UUID, from playlist: UUID) {
        guard let i = data.playlists.firstIndex(where: { $0.id == playlist }) else { return }
        let previous = data
        data.playlists[i].songIDs.removeAll { $0 == song }
        if !save() { data = previous }
    }
    func deletePlaylist(_ id: UUID) {
        let previous = data
        data.playlists.removeAll { $0.id == id }
        if !save() { data = previous }
    }
    func deleteSong(_ id: UUID) {
        guard !importing, let song = data.songs.first(where: { $0.id == id }) else { return }
        let previous = data
        data.songs.removeAll { $0.id == id }
        for i in data.playlists.indices { data.playlists[i].songIDs.removeAll { $0 == id } }
        guard save() else { data = previous; return }
        if let cover = song.artworkFilename {
            coverCache.removeObject(forKey: cover as NSString)
            try? FileManager.default.removeItem(at: root.appendingPathComponent(cover))
        }
        do { try FileManager.default.removeItem(at: file(song)) }
        catch { message = "Песня удалена из коллекции, но файл не удалось удалить: \(error.localizedDescription)" }
    }
}
func clock(_ seconds: Double) -> String {
    guard seconds.isFinite && seconds >= 0 else { return "0:00" }
    return String(format: "%d:%02d", Int(seconds) / 60, Int(seconds) % 60)
}
