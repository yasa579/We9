import { db, collection, addDoc, getDocs, deleteDoc, doc, query, where } from './firebase.js';

// Elemen DOM
const songsContainer = document.getElementById('songs-container');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const playlistsContainer = document.getElementById('playlists-container');
const createPlaylistBtn = document.getElementById('create-playlist-btn');
const playlistModal = document.getElementById('playlist-modal');
const closeModal = document.querySelector('.close');
const savePlaylistBtn = document.getElementById('save-playlist');
const playlistNameInput = document.getElementById('playlist-name');

// State aplikasi
let allSongs = [];
let currentPlaylist = null;
let playlists = [];

// Muat semua lagu dari Firestore
async function loadSongs() {
    try {
        const querySnapshot = await getDocs(collection(db, 'songs'));
        allSongs = [];
        querySnapshot.forEach((doc) => {
            allSongs.push({ id: doc.id, ...doc.data() });
        });
        displaySongs(allSongs);
    } catch (error) {
        console.error('Error loading songs:', error);
    }
}

// Tampilkan lagu di grid
function displaySongs(songs) {
    songsContainer.innerHTML = '';
    
    songs.forEach(song => {
        const songCard = document.createElement('div');
        songCard.className = 'song-card';
        songCard.innerHTML = `
            <img src="${song.coverUrl || 'assets/default-song.jpg'}" alt="${song.title}">
            <h4>${song.title}</h4>
            <p>${song.artist}</p>
        `;
        songCard.addEventListener('click', () => playSong(song));
        songsContainer.appendChild(songCard);
    });
}

// Fungsi untuk memutar lagu
function playSong(song) {
    // Implementasi di player.js
    if (window.player) {
        window.player.playSong(song);
    }
}

// Cari lagu
function searchSongs() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        displaySongs(allSongs);
        return;
    }
    
    const filteredSongs = allSongs.filter(song => 
        song.title.toLowerCase().includes(searchTerm) || 
        song.artist.toLowerCase().includes(searchTerm)
    );
    
    displaySongs(filteredSongs);
}

// Muat playlist dari localStorage
function loadPlaylists() {
    const savedPlaylists = localStorage.getItem('playlists');
    if (savedPlaylists) {
        playlists = JSON.parse(savedPlaylists);
        displayPlaylists();
    }
}

// Tampilkan playlist di sidebar
function displayPlaylists() {
    playlistsContainer.innerHTML = '';
    
    playlists.forEach((playlist, index) => {
        const playlistItem = document.createElement('div');
        playlistItem.className = 'playlist-item';
        if (currentPlaylist && currentPlaylist.name === playlist.name) {
            playlistItem.classList.add('active');
        }
        playlistItem.textContent = playlist.name;
        playlistItem.addEventListener('click', () => selectPlaylist(playlist));
        
        // Tambahkan tombol hapus
        const deleteBtn = document.createElement('span');
        deleteBtn.textContent = ' ×';
        deleteBtn.style.color = '#ff4d4d';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deletePlaylist(index);
        });
        
        playlistItem.appendChild(deleteBtn);
        playlistsContainer.appendChild(playlistItem);
    });
}

// Pilih playlist
function selectPlaylist(playlist) {
    currentPlaylist = playlist;
    displayPlaylists();
    
    if (playlist.songs.length > 0) {
        // Filter lagu berdasarkan ID di playlist
        const playlistSongs = allSongs.filter(song => 
            playlist.songs.includes(song.id)
        );
        displaySongs(playlistSongs);
    } else {
        songsContainer.innerHTML = '<p>Playlist ini kosong.</p>';
    }
}

// Buat playlist baru
function createPlaylist() {
    playlistModal.style.display = 'block';
}

// Simpan playlist
function savePlaylist() {
    const name = playlistNameInput.value.trim();
    
    if (name === '') {
        alert('Nama playlist tidak boleh kosong!');
        return;
    }
    
    // Cek apakah nama playlist sudah ada
    if (playlists.some(playlist => playlist.name === name)) {
        alert('Playlist dengan nama tersebut sudah ada!');
        return;
    }
    
    const newPlaylist = {
        name: name,
        songs: []
    };
    
    playlists.push(newPlaylist);
    localStorage.setItem('playlists', JSON.stringify(playlists));
    displayPlaylists();
    
    // Reset dan tutup modal
    playlistNameInput.value = '';
    playlistModal.style.display = 'none';
}

// Hapus playlist
function deletePlaylist(index) {
    if (confirm(`Apakah Anda yakin ingin menghapus playlist "${playlists[index].name}"?`)) {
        playlists.splice(index, 1);
        localStorage.setItem('playlists', JSON.stringify(playlists));
        
        // Jika playlist yang dihapus sedang dipilih, reset currentPlaylist
        if (currentPlaylist && currentPlaylist.name === playlists[index]?.name) {
            currentPlaylist = null;
            displaySongs(allSongs);
        }
        
        displayPlaylists();
    }
}

// Event listeners
searchBtn.addEventListener('click', searchSongs);
searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        searchSongs();
    }
});

createPlaylistBtn.addEventListener('click', createPlaylist);
closeModal.addEventListener('click', () => {
    playlistModal.style.display = 'none';
});
savePlaylistBtn.addEventListener('click', savePlaylist);

// Tutup modal jika klik di luar
window.addEventListener('click', (e) => {
    if (e.target === playlistModal) {
        playlistModal.style.display = 'none';
    }
});

// Inisialisasi aplikasi
document.addEventListener('DOMContentLoaded', () => {
    loadSongs();
    loadPlaylists();
});
