import Foundation
import Combine
import AVFoundation
import MediaPlayer

final class MusicPlayer: NSObject, ObservableObject, AVAudioPlayerDelegate {
    @Published var current: Song?
    @Published var isPlaying = false
    @Published var position: Double = 0
    @Published var duration: Double = 0
    @Published var shuffle = false
    @Published var repeatMode = 0 // off, queue, one
    @Published var error: String?
    private var player: AVAudioPlayer?
    @Published private var queue: [Song] = []
    var queueSongs: [Song] { validQueue() }
    func enqueue(_ song: Song, next: Bool, library: MusicLibrary) {
        guard current != nil else { select(song, queue: [song], library: library); return }
        // A track appears once in the queue; adding it again moves its position.
        guard song.id != current?.id else { return }
        queue.removeAll { $0.id == song.id }
        if next, let index = queue.firstIndex(where: { $0.id == current?.id }) {
            shuffle = false // Explicit next-track selection takes precedence over random playback.
            queue.insert(song, at: index + 1)
        } else { queue.append(song) }
    }
    private var library: MusicLibrary?
    private var timer: Timer?
    private var resumeAfterInterruption = false
    private var remoteTargets: [(MPRemoteCommand, Any)] = []
    override init() {
        super.init()
        NotificationCenter.default.addObserver(self, selector: #selector(interruption), name: AVAudioSession.interruptionNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(routeChanged), name: AVAudioSession.routeChangeNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(mediaReset), name: AVAudioSession.mediaServicesWereResetNotification, object: nil)
        let c = MPRemoteCommandCenter.shared()
        bind(c.playCommand) { $0.play() }
        bind(c.pauseCommand) { $0.pause() }
        bind(c.togglePlayPauseCommand) { $0.toggle() }
        bind(c.nextTrackCommand) { $0.next() }
        bind(c.previousTrackCommand) { $0.previous() }
        let target = c.changePlaybackPositionCommand.addTarget { [weak self] event in
            guard let event = event as? MPChangePlaybackPositionCommandEvent else { return .commandFailed }
            DispatchQueue.main.async { self?.seek(event.positionTime) }
            return .success
        }
        remoteTargets.append((c.changePlaybackPositionCommand, target))
        timer = Timer.scheduledTimer(withTimeInterval: 0.4, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            self.position = self.player?.currentTime ?? 0
        }
    }
    private func bind(_ command: MPRemoteCommand, action: @escaping (MusicPlayer) -> Void) {
        let target = command.addTarget { [weak self] _ in
            guard let self = self else { return .commandFailed }
            DispatchQueue.main.async { action(self) }
            return .success
        }
        remoteTargets.append((command, target))
    }
    deinit {
        timer?.invalidate()
        NotificationCenter.default.removeObserver(self)
        for (command, target) in remoteTargets { command.removeTarget(target) }
    }
    func select(_ song: Song, queue: [Song], library: MusicLibrary) {
        self.queue = queue
        self.library = library
        open(song)
    }
    private func open(_ song: Song, autoplay: Bool = true) {
        guard let library = library else { return }
        pause()
        player = nil
        position = 0
        current = song
        duration = song.duration
        do {
            let audio = try AVAudioPlayer(contentsOf: library.file(song))
            audio.delegate = self
            audio.prepareToPlay()
            player = audio
            duration = audio.duration
            if autoplay { play() } else { publishNowPlaying() }
        } catch { self.error = "Не удалось воспроизвести песню: \(error.localizedDescription)"; publishNowPlaying() }
    }
    func toggle() { isPlaying ? pause() : play() }
    func play() {
        guard let player = player else { return }
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default)
            try session.setActive(true)
            if player.play() { isPlaying = true }
            else { error = "Не удалось запустить воспроизведение." }
        } catch { self.error = "Не удалось включить звук: \(error.localizedDescription)" }
        publishNowPlaying()
    }
    func pause() { player?.pause(); isPlaying = false; publishNowPlaying() }
    func seek(_ value: Double) {
        player?.currentTime = min(max(0, value), duration)
        position = player?.currentTime ?? 0
        publishNowPlaying()
    }
    private func validQueue() -> [Song] {
        guard let library = library else { return [] }
        let available = Set(library.data.songs.map(\.id))
        return queue.filter { available.contains($0.id) }
    }
    func next(ended: Bool = false) {
        let items = validQueue()
        guard !items.isEmpty else { stop(); return }
        if ended && repeatMode == 2 { seek(0); play(); return }
        if shuffle, items.count > 1, let song = items.filter({ $0.id != current?.id }).randomElement() { open(song); return }
        let index = items.firstIndex(where: { $0.id == current?.id }) ?? -1
        if ended && index + 1 >= items.count && repeatMode == 0 { pause(); seek(0); return }
        open(items[(index + 1) % items.count])
    }
    func previous() {
        if position > 3 { seek(0); return }
        let items = validQueue()
        guard !items.isEmpty else { return }
        let index = items.firstIndex(where: { $0.id == current?.id }) ?? 0
        open(items[(index - 1 + items.count) % items.count])
    }
    func stop() {
        pause(); player = nil; current = nil; position = 0; duration = 0
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }
    private func publishNowPlaying() {
        guard let current = current else { return }
        var info: [String: Any] = [
            MPMediaItemPropertyTitle: current.title,
            MPMediaItemPropertyArtist: current.artistName,
            MPMediaItemPropertyAlbumTitle: current.albumName,
            MPMediaItemPropertyPlaybackDuration: duration,
            MPNowPlayingInfoPropertyElapsedPlaybackTime: player?.currentTime ?? 0,
            MPNowPlayingInfoPropertyPlaybackRate: isPlaying ? 1.0 : 0.0
        ]
        if let image = library?.artwork(current) {
            info[MPMediaItemPropertyArtwork] = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
        }
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }
    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        if flag { next(ended: true) }
        else { pause(); error = "Воспроизведение прервано из-за ошибки аудиофайла." }
    }
    func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
        pause(); self.error = "Ошибка чтения аудиофайла: \(error?.localizedDescription ?? "неизвестный формат")"
    }
    @objc private func interruption(_ note: Notification) {
        guard let raw = note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: raw) else { return }
        if type == .began { resumeAfterInterruption = isPlaying; pause() }
        else {
            let options = AVAudioSession.InterruptionOptions(rawValue: note.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt ?? 0)
            if resumeAfterInterruption && options.contains(.shouldResume) { play() }
            resumeAfterInterruption = false
        }
    }
    @objc private func routeChanged(_ note: Notification) {
        if note.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt == AVAudioSession.RouteChangeReason.oldDeviceUnavailable.rawValue { pause() }
    }
    @objc private func mediaReset(_ note: Notification) {
        let saved = position
        if let song = current { open(song, autoplay: false); seek(saved) }
    }
}
