import SwiftUI
import UniformTypeIdentifiers
import MediaPlayer

private let accent = Color(red: 0.96, green: 0.20, blue: 0.34)

@main struct KarmanApp: App {
    @StateObject private var library = MusicLibrary()
    @StateObject private var player = MusicPlayer()
    var body: some Scene {
        WindowGroup {
            CollectionView()
                .environmentObject(library).environmentObject(player)
                .tint(accent)
                .onOpenURL { library.importFiles([$0]) }
        }
    }
}

struct CollectionView: View {
    @EnvironmentObject var library: MusicLibrary
    @EnvironmentObject var player: MusicPlayer
    @State private var importer = false
    @State private var importingFolder = false
    @State private var newPlaylist = false
    @State private var playlistName = ""
    @State private var search = ""
    @State private var help = false

    var body: some View {
        TabView {
            page("Медиатека") { libraryPage }
                .tabItem { Label("Медиатека", systemImage: "square.stack.fill") }
            page("Папки") { foldersPage }
                .tabItem { Label("Папки", systemImage: "folder.fill") }
            page("Плейлисты") { playlistsPage }
                .tabItem { Label("Плейлисты", systemImage: "music.note.list") }
            page("Поиск") {
                SongListView(selection: .all, query: search)
                    .searchable(text: $search, prompt: "Песня, исполнитель или альбом")
            }.tabItem { Label("Поиск", systemImage: "magnifyingglass") }
        }
        .fileImporter(isPresented: $importer,
                      allowedContentTypes: importingFolder ? [.folder] : [.audio],
                      allowsMultipleSelection: true) { result in
            switch result {
            case .success(let urls): library.importFiles(urls)
            case .failure(let error): library.message = "Не удалось открыть файлы: \(error.localizedDescription)"
            }
        }
        .alert("Новый плейлист", isPresented: $newPlaylist) {
            TextField("Название", text: $playlistName)
            Button("Создать") { library.makePlaylist(playlistName); playlistName = "" }
            Button("Отмена", role: .cancel) { playlistName = "" }
        }
        .alert("Карман", isPresented: Binding(get: { library.message != nil }, set: { if !$0 { library.message = nil } })) {
            Button("Понятно") { library.message = nil }
        } message: { Text(library.message ?? "") }
        .alert("Не удалось включить музыку", isPresented: Binding(get: { player.error != nil }, set: { if !$0 { player.error = nil } })) {
            Button("Понятно") { player.error = nil }
        } message: { Text(player.error ?? "") }
        .sheet(isPresented: $help) { helpView }
    }

    private func page<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        NavigationStack {
            content()
                .navigationTitle(title)
                .toolbar {
                    ToolbarItem(placement: .navigationBarLeading) {
                        Button { help = true } label: { Image(systemName: "info.circle") }
                            .accessibilityLabel("Как пользоваться плеером")
                    }
                    ToolbarItem(placement: .navigationBarTrailing) { importMenu }
                }
        }
        .safeAreaInset(edge: .bottom, spacing: 0) {
                    VStack(spacing: 0) {
                        if library.importing { ProgressView("Добавляем музыку…").padding(10).frame(maxWidth: .infinity).background(.regularMaterial) }
                        if player.current != nil { PlayerDock() }
                    }
                }
    }

    private var importMenu: some View {
        Menu {
            Button { importingFolder = false; importer = true } label: { Label("Выбрать песни", systemImage: "music.note") }
            Button { importingFolder = true; importer = true } label: { Label("Выбрать папку", systemImage: "folder") }
        } label: { Image(systemName: "plus.circle.fill") }
            .accessibilityLabel("Добавить музыку").disabled(library.importing)
    }

    private var libraryPage: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                VStack(spacing: 0) {
                    NavigationLink { SongListView(selection: .all).navigationTitle("Песни") } label: {
                        category("Песни", icon: "music.note", count: library.data.songs.count)
                    }
                    Divider().padding(.leading, 44)
                    NavigationLink { albumsPage.navigationTitle("Альбомы") } label: {
                        category("Альбомы", icon: "square.stack", count: albums.count)
                    }
                }
                if library.data.songs.isEmpty {
                    emptyState(title: "Твоя музыка — здесь", detail: "Добавь песни или целую папку из «Файлов».", icon: "music.note")
                    Button("Добавить музыку") { importingFolder = false; importer = true }
                        .buttonStyle(.borderedProminent).frame(maxWidth: .infinity).disabled(library.importing)
                } else {
                    Text("Недавно добавлено").font(.title2.bold())
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], alignment: .leading, spacing: 22) {
                        ForEach(Array(library.data.songs.sorted { $0.added > $1.added }.prefix(20))) { song in
                            Button { player.select(song, queue: library.data.songs.sorted { $0.added > $1.added }, library: library) } label: {
                                VStack(alignment: .leading, spacing: 7) {
                                    CoverView(song: song).aspectRatio(1, contentMode: .fit)
                                    Text(song.title).font(.subheadline).foregroundStyle(.primary).lineLimit(1)
                                    Text(song.artistName).font(.caption).foregroundStyle(.secondary).lineLimit(1)
                                }
                            }.buttonStyle(.plain)
                        }
                    }
                }
            }.padding(.horizontal, 20).padding(.bottom, 24)
        }.background(Color(uiColor: .systemBackground))
    }

    private func category(_ title: String, icon: String, count: Int) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon).font(.title2).frame(width: 30)
            Text(title).font(.title3)
            Spacer()
            Text("\(count)").font(.subheadline).foregroundStyle(.secondary)
            Image(systemName: "chevron.right").font(.caption.weight(.semibold)).foregroundStyle(.tertiary)
        }.padding(.vertical, 16).contentShape(Rectangle())
    }

    private var albums: [AlbumGroup] { library.albums }
    private var albumsPage: some View {
        List(albums) { album in
            NavigationLink {
                SongListView(selection: .album(album.title, album.artist)).navigationTitle(album.title)
            } label: {
                HStack(spacing: 12) {
                    CoverView(song: album.song).frame(width: 60, height: 60)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(album.title).lineLimit(1)
                        Text(album.artist).font(.subheadline).foregroundStyle(.secondary).lineLimit(1)
                    }
                }.padding(.vertical, 4)
            }
        }.listStyle(.plain)
    }
    private var foldersPage: some View {
        Group {
            if library.folders.isEmpty {
                VStack(spacing: 20) {
                    emptyState(title: "Музыка по папкам", detail: "Выбери папку в «Файлах». Вложенные папки тоже появятся здесь.", icon: "folder")
                    Button("Добавить папку") { importingFolder = true; importer = true }
                        .buttonStyle(.borderedProminent).disabled(library.importing)
                }.padding()
            } else {
                List(library.folders) { folder in
                    NavigationLink { FolderView(folder: folder, path: "") } label: {
                        Label {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(folder.name)
                                Text("Песен: \(library.data.songs.filter { $0.folderID == folder.id }.count)")
                                    .font(.caption).foregroundStyle(.secondary)
                            }
                        } icon: { Image(systemName: "folder.fill").foregroundStyle(accent) }
                    }.padding(.vertical, 6)
                }.listStyle(.plain)
            }
        }
    }
    private var playlistsPage: some View {
        List {
            Button { newPlaylist = true } label: { Label("Новый плейлист", systemImage: "plus") }
            ForEach(library.data.playlists) { playlist in
                NavigationLink {
                    SongListView(selection: .playlist(playlist.id)).navigationTitle(playlist.name)
                } label: {
                    Label {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(playlist.name)
                            Text("Песен: \(playlist.songIDs.count)").font(.caption).foregroundStyle(.secondary)
                        }
                    } icon: { Image(systemName: "music.note.list").foregroundStyle(accent) }
                }.padding(.vertical, 6)
            }.onDelete { offsets in
                let ids = offsets.map { library.data.playlists[$0].id }
                ids.forEach { library.deletePlaylist($0) }
            }
        }.listStyle(.plain)
    }
    private var helpView: some View {
        NavigationStack {
            List {
                Section("Добавление музыки") {
                    Text("Нажми + и выбери песни или папку. Музыка копируется в плеер, оригиналы остаются в «Файлах». Для загрузки из iCloud может понадобиться интернет. Дождись завершения импорта.")
                }
                Section("Прослушивание") {
                    Text("Мини-плеер открывает большой экран с перемоткой, громкостью и очередью. В меню песни доступны «Следующей», «В конец очереди» и добавление в плейлист.")
                    Text("После импорта музыка играет без интернета. Предусмотрены фоновое воспроизведение, управление с экрана блокировки и наушников. Светлая и тёмная темы следуют настройке iPhone.")
                }
                Section("Хранение") {
                    Text("Папки в приложении — импортированная копия. Изменения оригинальной папки автоматически не синхронизируются. Удаление приложения удаляет его коллекцию: сохраняй оригиналы отдельно.")
                }
            }.navigationTitle("Как слушать")
                .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Готово") { help = false } } }
        }
    }
}

private func emptyState(title: String, detail: String, icon: String) -> some View {
    VStack(spacing: 14) {
        Image(systemName: icon).font(.system(size: 52, weight: .light)).foregroundStyle(accent)
        Text(title).font(.title2.bold())
        Text(detail).font(.subheadline).foregroundStyle(.secondary).multilineTextAlignment(.center)
    }.frame(maxWidth: .infinity).padding(.vertical, 50)
}

enum MusicSelection {
    case all, playlist(UUID), folder(UUID, String), album(String, String)
}

struct SongListView: View {
    @EnvironmentObject var library: MusicLibrary
    @EnvironmentObject var player: MusicPlayer
    var selection: MusicSelection
    var query = ""
    var songs: [Song] {
        var result = library.data.songs
        switch selection {
        case .all: result.sort { $0.title.localizedStandardCompare($1.title) == .orderedAscending }
        case .playlist(let id):
            let map = Dictionary(uniqueKeysWithValues: result.map { ($0.id, $0) })
            result = library.data.playlists.first { $0.id == id }?.songIDs.compactMap { map[$0] } ?? []
        case .folder(let id, let path): result = result.filter { $0.folderID == id && ($0.relativeFolder ?? "") == path }
        case .album(let title, let artist): result = result.filter { $0.albumName == title && $0.artistName == artist }
        }
        if !query.isEmpty {
            result = result.filter { [$0.title, $0.artistName, $0.albumName].contains { $0.localizedCaseInsensitiveContains(query) } }
        }
        return result
    }
    var body: some View {
        List {
            if songs.isEmpty {
                Text(query.isEmpty ? "Здесь пока нет песен" : "Ничего не найдено").foregroundStyle(.secondary)
            } else {
                HStack(spacing: 12) {
                    Button { playAll(shuffled: false) } label: { Label("Слушать", systemImage: "play.fill").frame(maxWidth: .infinity) }
                    Button { playAll(shuffled: true) } label: { Label("Вперемешку", systemImage: "shuffle").frame(maxWidth: .infinity) }
                }.buttonStyle(.bordered).listRowSeparator(.hidden).padding(.vertical, 8)
                ForEach(songs) { song in SongRow(song: song, songs: songs, playlistID: playlistID) }
            }
        }.listStyle(.plain)
    }
    private var playlistID: UUID? { if case .playlist(let id) = selection { return id }; return nil }
    private func playAll(shuffled: Bool) {
        guard let song = shuffled ? songs.randomElement() : songs.first else { return }
        player.shuffle = shuffled
        player.select(song, queue: songs, library: library)
    }
}

struct FolderView: View {
    @EnvironmentObject var library: MusicLibrary
    var folder: MusicFolder
    var path: String
    private var songs: [Song] { library.data.songs.filter { $0.folderID == folder.id && ($0.relativeFolder ?? "") == path } }
    private var children: [String] {
        let prefix = path.isEmpty ? "" : path + "/"
        let names = library.data.songs.filter { $0.folderID == folder.id }.compactMap { song -> String? in
            let value = song.relativeFolder ?? ""
            guard value.hasPrefix(prefix), value != path else { return nil }
            return value.dropFirst(prefix.count).split(separator: "/").first.map(String.init)
        }
        return Set(names).sorted { $0.localizedStandardCompare($1) == .orderedAscending }
    }
    var body: some View {
        List {
            ForEach(children, id: \.self) { name in
                NavigationLink { FolderView(folder: folder, path: path.isEmpty ? name : path + "/" + name) } label: {
                    Label(name, systemImage: "folder.fill").foregroundStyle(accent)
                }
            }
            ForEach(songs) { song in SongRow(song: song, songs: songs) }
        }.listStyle(.plain).navigationTitle(path.isEmpty ? folder.name : String(path.split(separator: "/").last ?? ""))
    }
}

struct SongRow: View {
    @EnvironmentObject var library: MusicLibrary
    @EnvironmentObject var player: MusicPlayer
    var song: Song
    var songs: [Song]
    var playlistID: UUID? = nil
    @State private var deleting = false
    var body: some View {
        HStack(spacing: 12) {
            Button {
                if player.current?.id == song.id { player.toggle() }
                else { player.select(song, queue: songs, library: library) }
            } label: {
                HStack(spacing: 12) {
                    CoverView(song: song).frame(width: 48, height: 48)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(song.title).foregroundStyle(player.current?.id == song.id ? accent : Color.primary).lineLimit(1)
                        Text(song.artistName).font(.caption).foregroundStyle(.secondary).lineLimit(1)
                    }
                    Spacer(minLength: 0)
                    if player.current?.id == song.id && player.isPlaying { Image(systemName: "waveform").foregroundStyle(accent) }
                }.contentShape(Rectangle())
            }.buttonStyle(.plain)
            Menu {
                Button { player.enqueue(song, next: true, library: library) } label: { Label("Следующей", systemImage: "text.line.first.and.arrowtriangle.forward") }
                Button { player.enqueue(song, next: false, library: library) } label: { Label("В конец очереди", systemImage: "text.append") }
                Menu("Добавить в плейлист") {
                    if library.data.playlists.isEmpty { Text("Сначала создай плейлист во вкладке «Плейлисты»") }
                    ForEach(library.data.playlists) { list in Button(list.name) { library.add(song.id, to: list.id) } }
                }
                if let id = playlistID { Button("Убрать из плейлиста") { library.remove(song.id, from: id) } }
                Button("Удалить из медиатеки", role: .destructive) { deleting = true }.disabled(library.importing)
            } label: { Image(systemName: "ellipsis").foregroundStyle(.secondary).frame(width: 44, height: 44) }
                .accessibilityLabel("Действия с песней \(song.title)")
        }.padding(.vertical, 3)
            .alert("Удалить песню из плеера?", isPresented: $deleting) {
                Button("Удалить", role: .destructive) {
                    if player.current?.id == song.id { player.stop() }
                    library.deleteSong(song.id)
                }
                Button("Отмена", role: .cancel) {}
            } message: { Text("Оригинал в приложении «Файлы» останется.") }
    }
}

struct CoverView: View {
    @EnvironmentObject var library: MusicLibrary
    var song: Song?
    var body: some View {
        GeometryReader { size in
            ZStack {
                RoundedRectangle(cornerRadius: 8).fill(Color(uiColor: .secondarySystemBackground))
                if let song = song, let artwork = library.artwork(song) {
                    Image(uiImage: artwork).resizable().scaledToFill()
                        .frame(width: size.size.width, height: size.size.height).clipped()
                } else {
                    LinearGradient(colors: [accent.opacity(0.25), Color.purple.opacity(0.16)], startPoint: .topLeading, endPoint: .bottomTrailing)
                    Image(systemName: "music.note").font(.system(size: max(16, size.size.width * 0.32), weight: .light)).foregroundStyle(accent)
                }
            }.clipShape(RoundedRectangle(cornerRadius: 8))
        }.accessibilityHidden(true)
    }
}

struct PlayerDock: View {
    @EnvironmentObject var player: MusicPlayer
    @State private var expanded = false
    var body: some View {
        HStack(spacing: 12) {
            Button { expanded = true } label: {
                HStack(spacing: 12) {
                    CoverView(song: player.current).frame(width: 42, height: 42)
                    Text(player.current?.title ?? "").font(.subheadline.weight(.medium)).lineLimit(1)
                    Spacer(minLength: 0)
                }.contentShape(Rectangle())
            }.buttonStyle(.plain).accessibilityLabel("Открыть проигрыватель")
            Button { player.toggle() } label: { Image(systemName: player.isPlaying ? "pause.fill" : "play.fill").font(.title3).frame(width: 44, height: 44) }
                .accessibilityLabel(player.isPlaying ? "Пауза" : "Воспроизвести")
            Button { player.next() } label: { Image(systemName: "forward.fill").font(.title3).frame(width: 44, height: 44) }.accessibilityLabel("Следующая песня")
        }.foregroundStyle(.primary).padding(10).background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
            .padding(.horizontal, 8).padding(.vertical, 6)
            .sheet(isPresented: $expanded) { PlayerView() }
    }
}

struct PlayerView: View {
    @EnvironmentObject var library: MusicLibrary
    @EnvironmentObject var player: MusicPlayer
    @Environment(\.dismiss) private var dismiss
    @State private var dragging = false
    @State private var scrub: Double = 0
    @State private var showQueue = false
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 28) {
                    Capsule().fill(Color.secondary.opacity(0.35)).frame(width: 36, height: 5).padding(.top, 12)
                    CoverView(song: player.current).aspectRatio(1, contentMode: .fit).frame(maxWidth: 380)
                        .shadow(color: .black.opacity(0.16), radius: 18, y: 12).padding(.vertical, 10)
                    VStack(alignment: .leading, spacing: 6) {
                        Text(player.current?.title ?? "Выбери песню").font(.title2.bold()).lineLimit(2)
                        Text(player.current?.artistName ?? "Карман").font(.title3).foregroundStyle(.secondary).lineLimit(1)
                    }.frame(maxWidth: .infinity, alignment: .leading)
                    VStack(spacing: 3) {
                        Slider(value: Binding(get: { dragging ? scrub : player.position }, set: { scrub = $0 }),
                               in: 0...max(1, player.duration), onEditingChanged: { editing in
                            if editing { scrub = player.position; dragging = true }
                            else { player.seek(scrub); dragging = false }
                        }).tint(.secondary).accessibilityLabel("Перемотка")
                        HStack {
                            Text(clock(dragging ? scrub : player.position))
                            Spacer()
                            Text("−" + clock(max(0, player.duration - (dragging ? scrub : player.position))))
                        }.font(.caption.monospacedDigit()).foregroundStyle(.secondary)
                    }
                    HStack {
                        transport("backward.fill", label: "Предыдущая песня", size: 30) { player.previous() }
                        Spacer()
                        transport(player.isPlaying ? "pause.fill" : "play.fill", label: player.isPlaying ? "Пауза" : "Воспроизвести", size: 46) { player.toggle() }
                        Spacer()
                        transport("forward.fill", label: "Следующая песня", size: 30) { player.next() }
                    }.padding(.horizontal, 20).disabled(player.current == nil)
                    NativeVolume().frame(height: 32)
                    HStack(spacing: 40) {
                        Button { player.shuffle.toggle() } label: { Image(systemName: "shuffle").frame(width: 44, height: 44) }
                            .foregroundStyle(player.shuffle ? accent : Color.secondary).accessibilityLabel("Перемешивание").accessibilityValue(player.shuffle ? "Включено" : "Выключено")
                        Button { player.repeatMode = (player.repeatMode + 1) % 3 } label: { Image(systemName: player.repeatMode == 2 ? "repeat.1" : "repeat").frame(width: 44, height: 44) }
                            .foregroundStyle(player.repeatMode > 0 ? accent : Color.secondary).accessibilityLabel(["Повтор выключен", "Повтор очереди", "Повтор песни"][player.repeatMode])
                        Button { showQueue = true } label: { Image(systemName: "list.bullet").frame(width: 44, height: 44) }
                            .foregroundStyle(.secondary).accessibilityLabel("Очередь воспроизведения")
                    }.font(.title3)
                }.padding(.horizontal, 28).padding(.bottom, 24)
            }.background(Color(uiColor: .systemBackground))
                .navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .confirmationAction) { Button { dismiss() } label: { Image(systemName: "chevron.down") }.accessibilityLabel("Свернуть плеер") } }
                .sheet(isPresented: $showQueue) { queueView }
        }
    }
    private func transport(_ symbol: String, label: String, size: CGFloat, action: @escaping () -> Void) -> some View {
        Button(action: action) { Image(systemName: symbol).font(.system(size: size)).frame(width: 64, height: 70) }
            .foregroundStyle(.primary).accessibilityLabel(label)
    }
    private var queueView: some View {
        NavigationStack {
            List {
                if player.shuffle { Text("Включено перемешивание: следующая песня выбирается случайно.").font(.footnote).foregroundStyle(.secondary) }
                ForEach(player.queueSongs) { song in
                    Button { player.select(song, queue: player.queueSongs, library: library) } label: {
                        HStack(spacing: 12) {
                            CoverView(song: song).frame(width: 44, height: 44)
                            VStack(alignment: .leading, spacing: 4) {
                                Text(song.title).foregroundStyle(.primary)
                                Text(song.artistName).font(.caption).foregroundStyle(.secondary)
                            }
                            Spacer()
                            if song.id == player.current?.id { Image(systemName: "speaker.wave.2.fill") }
                        }
                    }
                }
            }.listStyle(.plain).navigationTitle("Очередь")
                .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Готово") { showQueue = false } } }
        }
    }
}

struct NativeVolume: UIViewRepresentable {
    func makeUIView(context: Context) -> MPVolumeView {
        let view = MPVolumeView(frame: .zero)
        view.showsRouteButton = true
        return view
    }
    func updateUIView(_ uiView: MPVolumeView, context: Context) {}
}
