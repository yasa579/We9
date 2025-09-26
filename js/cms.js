import { db, auth, provider, signInWithPopup, signOut, collection, addDoc, getDocs, deleteDoc, doc } from './firebase.js';

// Elemen DOM
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');
const userName = document.getElementById('user-name');
const uploadForm = document.getElementById('upload-form');
const songsTableBody = document.getElementById('songs-table-body');

// Daftar admin yang diizinkan (ganti dengan email Anda)
const allowedAdmins = ['admin@example.com']; // Ganti dengan email admin

// Cek status login
auth.onAuthStateChanged((user) => {
    if (user) {
        // Cek apakah user adalah admin
        if (allowedAdmins.includes(user.email)) {
            showAdminUI(user);
            loadSongs();
        } else {
            alert('Anda tidak memiliki akses ke CMS ini.');
            signOut(auth);
        }
    } else {
        showLoginUI();
    }
});

// Tampilkan UI admin
function showAdminUI(user) {
    loginBtn.style.display = 'none';
    userInfo.style.display = 'flex';
    userName.textContent = user.displayName || user.email;
    
    // Enable form upload
    uploadForm.style.display = 'block';
}

// Tampilkan UI login
function showLoginUI() {
    loginBtn.style.display = 'block';
    userInfo.style.display = 'none';
    uploadForm.style.display = 'none';
    songsTableBody.innerHTML = '<tr><td colspan="3">Silakan login untuk mengelola lagu.</td></tr>';
}

// Login dengan Google
loginBtn.addEventListener('click', async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error('Error logging in:', error);
        alert('Terjadi kesalahan saat login. Silakan coba lagi.');
    }
});

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Error logging out:', error);
    }
});

// Upload lagu baru
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('song-title').value.trim();
    const artist = document.getElementById('song-artist').value.trim();
    const coverUrl = document.getElementById('song-cover').value.trim();
    const audioUrl = document.getElementById('song-audio').value.trim();
    
    if (!title || !artist || !audioUrl) {
        alert('Judul, artis, dan URL audio wajib diisi!');
        return;
    }
    
    try {
        await addDoc(collection(db, 'songs'), {
            title,
            artist,
            coverUrl: coverUrl || '',
            audioUrl,
            uploadedAt: new Date().toISOString()
        });
        
        alert('Lagu berhasil diupload!');
        uploadForm.reset();
        loadSongs(); // Muat ulang daftar lagu
    } catch (error) {
        console.error('Error uploading song:', error);
        alert('Terjadi kesalahan saat mengupload lagu. Silakan coba lagi.');
    }
});

// Muat daftar lagu
async function loadSongs() {
    try {
        const querySnapshot = await getDocs(collection(db, 'songs'));
        songsTableBody.innerHTML = '';
        
        if (querySnapshot.empty) {
            songsTableBody.innerHTML = '<tr><td colspan="3">Belum ada lagu yang diupload.</td></tr>';
            return;
        }
        
        querySnapshot.forEach((doc) => {
            const song = doc.data();
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${song.title}</td>
                <td>${song.artist}</td>
                <td>
                    <button class="delete-btn" data-id="${doc.id}">Hapus</button>
                </td>
            `;
            
            songsTableBody.appendChild(row);
        });
        
        // Tambahkan event listener untuk tombol hapus
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const songId = e.target.getAttribute('data-id');
                if (confirm('Apakah Anda yakin ingin menghapus lagu ini?')) {
                    try {
                        await deleteDoc(doc(db, 'songs', songId));
                        alert('Lagu berhasil dihapus!');
                        loadSongs(); // Muat ulang daftar lagu
                    } catch (error) {
                        console.error('Error deleting song:', error);
                        alert('Terjadi kesalahan saat menghapus lagu. Silakan coba lagi.');
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error loading songs:', error);
        songsTableBody.innerHTML = '<tr><td colspan="3">Terjadi kesalahan saat memuat lagu.</td></tr>';
    }
}
