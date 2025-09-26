import { db, collection, addDoc, getDocs } from './firebase.js';

// Elemen DOM
const audioPlayer = document.getElementById('audio-player');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const loopBtn = document.getElementById('loop-btn');
const currentSongImg = document.getElementById('current-song-img');
const currentSongTitle = document.getElementById('current-song-title');
const currentSongArtist = document.getElementById('current-song-artist');
const progressBar = document.querySelector('.progress');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const progressContainer = document.querySelector('.progress-container');

// State pemutar
let isPlaying = false;
let isLooping = false;
let currentSongIndex = 0;
let currentPlaylistSongs = [];

// Kelas Player
class Player {
    constructor() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Kontrol pemutaran
        playBtn.addEventListener('click', () => this.togglePlay());
        prevBtn.addEventListener('click', () => this.previousSong());
        nextBtn.addEventListener('click', () => this.nextSong());
        loopBtn.addEventListener('click', () => this.toggleLoop());
        
        // Update progress bar
        audioPlayer.addEventListener('timeupdate', () => this.updateProgress());
        audioPlayer.addEventListener('loadedmetadata', () => this.updateDuration());
        audioPlayer.addEventListener('ended', () => this.songEnded());
        
        // Klik progress bar untuk seek
        progressContainer.addEventListener('click', (e) => this.setProgress(e));
    }
    
    playSong(song, playlistSongs = null) {
        if (playlistSongs) {
            currentPlaylistSongs = playlistSongs;
            currentSongIndex = currentPlaylistSongs.findIndex(s => s.id === song.id);
        }
        
        currentSongImg.src = song.coverUrl || 'assets/default-song.jpg';
        currentSongTitle.textContent = song.title;
        currentSongArtist.textContent = song.artist;
        
        audioPlayer.src = song.audioUrl;
        audioPlayer.load();
        
        this.play();
    }
    
    play() {
        audioPlayer.play();
        isPlaying = true;
        playBtn.textContent = '⏸';
    }
    
    pause() {
        audioPlayer.pause();
        isPlaying = false;
        playBtn.textContent = '▶';
    }
    
    togglePlay() {
        if (audioPlayer.src === '') return;
        
        if (isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    previousSong() {
        if (currentPlaylistSongs.length === 0) return;
        
        currentSongIndex--;
        if (currentSongIndex < 0) {
            currentSongIndex = currentPlaylistSongs.length - 1;
        }
        
        this.playSong(currentPlaylistSongs[currentSongIndex]);
    }
    
    nextSong() {
        if (currentPlaylistSongs.length === 0) return;
        
        currentSongIndex++;
        if (currentSongIndex >= currentPlaylistSongs.length) {
            currentSongIndex = 0;
        }
        
        this.playSong(currentPlaylistSongs[currentSongIndex]);
    }
    
    toggleLoop() {
        isLooping = !isLooping;
        loopBtn.style.color = isLooping ? '#1DB954' : '#fff';
        audioPlayer.loop = isLooping;
    }
    
    updateProgress() {
        const { currentTime, duration } = audioPlayer;
        const progressPercent = (currentTime / duration) * 100;
        progressBar.style.width = `${progressPercent}%`;
        
        // Format waktu
        currentTimeEl.textContent = this.formatTime(currentTime);
    }
    
    updateDuration() {
        durationEl.textContent = this.formatTime(audioPlayer.duration);
    }
    
    setProgress(e) {
        const width = progressContainer.clientWidth;
        const clickX = e.offsetX;
        const duration = audioPlayer.duration;
        
        audioPlayer.currentTime = (clickX / width) * duration;
    }
    
    songEnded() {
        if (!isLooping) {
            this.nextSong();
        }
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }
}

// Inisialisasi player
const player = new Player();
window.player = player; // Ekspos ke global scope untuk diakses oleh app.js

// Update fungsi playSong di app.js untuk menggunakan player
window.playSong = function(song) {
    player.playSong(song, allSongs);
};
