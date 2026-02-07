import React, { useState, useEffect } from 'react';

export default function AdminApp() {
    const [status, setStatus] = useState('Checking API...');
    const [activeTab, setActiveTab] = useState('dashboard');
    const [headlineCZ, setHeadlineCZ] = useState('');
    const [headlineEN, setHeadlineEN] = useState('');
    const [heroDescCZ, setHeroDescCZ] = useState('');
    const [heroDescEN, setHeroDescEN] = useState('');
    const [statementCZ, setStatementCZ] = useState('');
    const [statementEN, setStatementEN] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState('');
    const [preview, setPreview] = useState(null);
    const [galleries, setGalleries] = useState([]);
    const [isGalleryLoading, setIsGalleryLoading] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [settingsTab, setSettingsTab] = useState('cz');

    const showToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

    useEffect(() => {
        // Build Check
        fetch(`${API_URL}/health`)
            .then(res => res.json())
            .then(data => setStatus('Connected'))
            .catch(err => setStatus('API Offline'));

        // Fetch Settings
        fetch(`${API_URL}/api/settings`)
            .then(res => res.json())
            .then(data => {
                setHeadlineCZ(data.headline_cz || '');
                setHeadlineEN(data.headline_en || '');
                setHeroDescCZ(data.hero_desc_cz || '');
                setHeroDescEN(data.hero_desc_en || '');
                setStatementCZ(data.statement_cz || '');
                setStatementEN(data.statement_en || '');
            })
            .catch(err => console.error('Failed to fetch settings'));

        // Fetch Galleries
        fetchGalleries();
    }, [API_URL]);

    const fetchGalleries = async () => {
        try {
            const response = await fetch(`${API_URL}/api/galleries`);
            if (response.ok) {
                const data = await response.json();
                setGalleries(data);
            }
        } catch (err) {
            console.error('Failed to fetch galleries');
        }
    };

    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            const response = await fetch(`${API_URL}/api/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    headline_cz: headlineCZ,
                    headline_en: headlineEN,
                    hero_desc_cz: heroDescCZ,
                    hero_desc_en: heroDescEN,
                    statement_cz: statementCZ,
                    statement_en: statementEN
                }),
            });
            if (response.ok) {
                showToast('Settings saved successfully!');
            } else {
                showToast('Failed to save settings.', 'error');
            }
        } catch (err) {
            showToast('Error connecting to settings API.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadMessage('Uploading...');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_URL}/api/upload`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setUploadMessage('Upload successful!');
                setPreview(data.url);
            } else {
                setUploadMessage('Upload failed.');
            }
        } catch (err) {
            setUploadMessage('Error connecting to upload API.');
        } finally {
            setUploading(false);
        }
    };

    const handleCreateGallery = async () => {
        const title = prompt('Enter gallery title:');
        if (!title) return;

        try {
            const response = await fetch(`${API_URL}/api/galleries`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title }),
            });
            if (response.ok) {
                const newGallery = await response.json();
                setGalleries([...galleries, newGallery]);
                showToast('Gallery created successfully!');
            }
        } catch (err) {
            showToast('Failed to create gallery', 'error');
        }
    };

    const handleUpdateGalleryTitle = async (id, newTitle) => {
        try {
            const response = await fetch(`${API_URL}/api/galleries/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle }),
            });
            if (response.ok) {
                setGalleries(galleries.map(g => g.id === id ? { ...g, title: newTitle } : g));
                showToast('Gallery title updated');
            }
        } catch (err) {
            showToast('Failed to update gallery title', 'error');
        }
    };

    const handleDeleteGallery = async (id) => {
        try {
            const response = await fetch(`${API_URL}/api/galleries/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setGalleries(galleries.filter(g => g.id !== id));
                showToast('Gallery deleted');
            }
        } catch (err) {
            showToast('Failed to delete gallery', 'error');
        }
    };

    const handleGalleryUpload = async (galleryId, files) => {
        if (!files || files.length === 0) return;

        setIsGalleryLoading(true);
        const uploadedImages = [];

        for (const file of Array.from(files)) {
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch(`${API_URL}/api/upload`, {
                    method: 'POST',
                    body: formData,
                });

                if (response.ok) {
                    const data = await response.json();
                    uploadedImages.push({ url: data.url, filename: data.filename });
                }
            } catch (err) {
                console.error('Error uploading file:', file.name);
            }
        }

        if (uploadedImages.length > 0) {
            const gallery = galleries.find(g => g.id === galleryId);
            const updatedImages = [...(gallery.images || []), ...uploadedImages];

            try {
                const response = await fetch(`${API_URL}/api/galleries/${galleryId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ images: updatedImages }),
                });

                if (response.ok) {
                    setGalleries(galleries.map(g =>
                        g.id === galleryId ? { ...g, images: updatedImages } : g
                    ));
                    showToast(`Uploaded ${uploadedImages.length} images`);
                }
            } catch (err) {
                showToast('Failed to update gallery images', 'error');
            }
        }
        setIsGalleryLoading(false);
    };

    const handleRemoveGalleryImage = async (galleryId, imageUrl) => {
        const gallery = galleries.find(g => g.id === galleryId);
        const updatedImages = gallery.images.filter(img => img.url !== imageUrl);

        try {
            const response = await fetch(`${API_URL}/api/galleries/${galleryId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ images: updatedImages }),
            });

            if (response.ok) {
                setGalleries(galleries.map(g =>
                    g.id === galleryId ? { ...g, images: updatedImages } : g
                ));
                showToast('Image removed');
            }
        } catch (err) {
            showToast('Failed to remove image', 'error');
        }
    };

    const styles = {
        wrapper: {
            display: 'flex',
            minHeight: '100vh',
            fontFamily: '"SF Pro Display", -apple-system, sans-serif',
            color: '#1a1a1a',
            backgroundColor: '#fff',
        },
        sidebar: {
            width: '240px',
            backgroundColor: '#f9f9f9',
            borderRight: '1px solid #eee',
            padding: '2rem 1rem',
            display: 'flex',
            flexDirection: 'column',
        },
        sidebarBrand: {
            fontSize: '1.2rem',
            fontWeight: 600,
            marginBottom: '3rem',
            paddingLeft: '1rem',
        },
        sidebarItem: (active) => ({
            padding: '0.8rem 1rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            marginBottom: '0.5rem',
            fontSize: '0.9rem',
            fontWeight: 500,
            color: active ? '#000' : '#666',
            backgroundColor: active ? '#eee' : 'transparent',
            transition: 'all 0.2s ease',
        }),
        main: {
            flex: 1,
            padding: '3rem 4rem',
            maxWidth: '1000px',
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '3rem',
        },
        statusIcon: {
            fontSize: '0.82rem',
            padding: '0.4rem 0.8rem',
            borderRadius: '2rem',
            backgroundColor: status === 'Connected' ? '#e6f4ea' : '#fce8e6',
            color: status === 'Connected' ? '#1e8e3e' : '#d93025',
        },
        uploadBox: {
            border: '1px dashed #e0e0e0',
            borderRadius: '1rem',
            padding: '4rem 2rem',
            textAlign: 'center',
            backgroundColor: '#fafafa',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
        },
        previewImg: {
            marginTop: '2rem',
            borderRadius: '0.5rem',
            maxWidth: '100%',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        },
        tabContainer: {
            display: 'flex',
            gap: '1rem',
            marginBottom: '2rem',
            borderBottom: '1px solid #eee',
            paddingBottom: '0.5rem',
        },
        tab: (active) => ({
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 500,
            color: active ? '#000' : '#666',
            borderBottom: active ? '2px solid #000' : '2px solid transparent',
            transition: 'all 0.2s ease',
            marginBottom: '-0.5rem',
        }),
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <section>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Overview</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                            <div style={{ padding: '1.5rem', border: '1px solid #eee', borderRadius: '1rem' }}>
                                <h3 style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Server Status</h3>
                                <p style={{ fontWeight: 600 }}>{status}</p>
                            </div>
                            <div style={{ padding: '1.5rem', border: '1px solid #eee', borderRadius: '1rem' }}>
                                <h3 style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Images</h3>
                                <p style={{ fontWeight: 600 }}>Local Storage</p>
                            </div>
                            <div style={{ padding: '1.5rem', border: '1px solid #eee', borderRadius: '1rem' }}>
                                <h3 style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Mode</h3>
                                <p style={{ fontWeight: 600 }}>Development</p>
                            </div>
                        </div>
                    </section>
                );
            case 'posts':
                return (
                    <section>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Content Management</h2>
                        <p style={{ color: '#666' }}>Post management is coming soon.</p>
                    </section>
                );
            case 'media':
                return (
                    <section>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: 500 }}>Media Library</h2>
                        <div
                            style={styles.uploadBox}
                            onClick={() => document.getElementById('file-upload').click()}
                        >
                            <input
                                type="file"
                                id="file-upload"
                                hidden
                                onChange={handleUpload}
                                accept="image/*"
                            />
                            <p style={{ color: '#999' }}>
                                {uploading ? 'Processing...' : 'Click to select or drag and drop image'}
                            </p>
                            {uploadMessage && (
                                <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: uploadMessage.includes('failed') ? '#d93025' : '#1e8e3e' }}>
                                    {uploadMessage}
                                </p>
                            )}
                        </div>

                        {preview && (
                            <div style={{ textAlign: 'center' }}>
                                <img src={`${API_URL}${preview}`} alt="Preview" style={styles.previewImg} />
                                <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#666' }}>{preview}</p>
                            </div>
                        )}
                    </section>
                );
            case 'settings':
                return (
                    <section>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 500 }}>Global Settings</h2>
                            <button
                                onClick={handleSaveSettings}
                                disabled={isSaving}
                                style={{
                                    padding: '0.6rem 1.2rem',
                                    borderRadius: '0.5rem',
                                    backgroundColor: '#000',
                                    color: '#fff',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: '0.9rem',
                                    opacity: isSaving ? 0.6 : 1
                                }}
                            >
                                {isSaving ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>

                        <div style={styles.tabContainer}>
                            <div
                                style={styles.tab(settingsTab === 'cz')}
                                onClick={() => setSettingsTab('cz')}
                            >
                                Czech (CZ)
                            </div>
                            <div
                                style={styles.tab(settingsTab === 'en')}
                                onClick={() => setSettingsTab('en')}
                            >
                                English (EN)
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
                            {settingsTab === 'cz' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}><strong>Landing Page Headline</strong></label>
                                        <input
                                            type="text"
                                            value={headlineCZ}
                                            onChange={(e) => setHeadlineCZ(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '0.5rem',
                                                border: '1px solid #eee',
                                                fontSize: '0.9rem',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}><strong>Hero Description</strong></label>
                                        <textarea
                                            value={heroDescCZ}
                                            onChange={(e) => setHeroDescCZ(e.target.value)}
                                            rows="4"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '0.5rem',
                                                border: '1px solid #eee',
                                                fontSize: '0.9rem',
                                                outline: 'none',
                                                resize: 'vertical'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}><strong>Statement Quote</strong></label>
                                        <textarea
                                            value={statementCZ}
                                            onChange={(e) => setStatementCZ(e.target.value)}
                                            rows="3"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '0.5rem',
                                                border: '1px solid #eee',
                                                fontSize: '0.9rem',
                                                outline: 'none',
                                                resize: 'vertical'
                                            }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}><strong>Landing Page Headline</strong></label>
                                        <input
                                            type="text"
                                            value={headlineEN}
                                            onChange={(e) => setHeadlineEN(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '0.5rem',
                                                border: '1px solid #eee',
                                                fontSize: '0.9rem',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}><strong>Hero Description</strong></label>
                                        <textarea
                                            value={heroDescEN}
                                            onChange={(e) => setHeroDescEN(e.target.value)}
                                            rows="4"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '0.5rem',
                                                border: '1px solid #eee',
                                                fontSize: '0.9rem',
                                                outline: 'none',
                                                resize: 'vertical'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}><strong>Statement Quote</strong></label>
                                        <textarea
                                            value={statementEN}
                                            onChange={(e) => setStatementEN(e.target.value)}
                                            rows="3"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '0.5rem',
                                                border: '1px solid #eee',
                                                fontSize: '0.9rem',
                                                outline: 'none',
                                                resize: 'vertical'
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                );
            case 'gallery':
                return (
                    <section>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 500 }}>Galleries</h2>
                            <button
                                onClick={handleCreateGallery}
                                style={{
                                    padding: '0.6rem 1.2rem',
                                    borderRadius: '0.5rem',
                                    backgroundColor: '#000',
                                    color: '#fff',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: 500
                                }}
                            >
                                + New Gallery
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {galleries.map(gallery => (
                                <div key={gallery.id} style={{ padding: '1.5rem', border: '1px solid #eee', borderRadius: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <input
                                            type="text"
                                            value={gallery.title}
                                            onChange={(e) => {
                                                const newTitle = e.target.value;
                                                setGalleries(galleries.map(g => g.id === gallery.id ? { ...g, title: newTitle } : g));
                                            }}
                                            onBlur={(e) => handleUpdateGalleryTitle(gallery.id, e.target.value)}
                                            style={{
                                                fontSize: '1.1rem',
                                                fontWeight: 600,
                                                border: 'none',
                                                outline: 'none',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '0.25rem',
                                                backgroundColor: 'transparent',
                                                borderBottom: '1px solid transparent',
                                                transition: 'border-color 0.2s',
                                                width: '60%'
                                            }}
                                            onFocus={(e) => e.target.style.borderBottom = '1px solid #ccc'}
                                        />
                                        <button
                                            onClick={() => handleDeleteGallery(gallery.id)}
                                            style={{ color: '#d93025', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                                        >
                                            Delete Gallery
                                        </button>
                                    </div>

                                    <div
                                        style={{
                                            ...styles.uploadBox,
                                            padding: '2rem',
                                            marginBottom: '1.5rem',
                                            opacity: isGalleryLoading ? 0.6 : 1,
                                            pointerEvents: isGalleryLoading ? 'none' : 'auto'
                                        }}
                                        onClick={() => document.getElementById(`gallery-upload-${gallery.id}`).click()}
                                    >
                                        <input
                                            type="file"
                                            id={`gallery-upload-${gallery.id}`}
                                            hidden
                                            multiple
                                            onChange={(e) => handleGalleryUpload(gallery.id, e.target.files)}
                                            accept="image/*"
                                        />
                                        <p style={{ color: '#999', fontSize: '0.9rem' }}>
                                            {isGalleryLoading ? 'Uploading...' : 'Click to add multiple images'}
                                        </p>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
                                        {gallery.images && gallery.images.map((img, idx) => (
                                            <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #eee' }}>
                                                <img
                                                    src={`${API_URL}${img.url}`}
                                                    alt={img.filename}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                                <button
                                                    onClick={() => handleRemoveGalleryImage(gallery.id, img.url)}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '0.3rem',
                                                        right: '0.3rem',
                                                        backgroundColor: 'rgba(0,0,0,0.5)',
                                                        color: '#fff',
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        width: '1.5rem',
                                                        height: '1.5rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        fontSize: '0.8rem'
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                );
            default:
                return null;
        }
    };

    return (
        <div style={styles.wrapper}>
            <aside style={styles.sidebar}>
                <div style={styles.sidebarBrand}>CMS Admin</div>
                <div style={styles.sidebarItem(activeTab === 'dashboard')} onClick={() => setActiveTab('dashboard')}>
                    Dashboard
                </div>
                <div style={styles.sidebarItem(activeTab === 'posts')} onClick={() => setActiveTab('posts')}>
                    Posts
                </div>
                <div style={styles.sidebarItem(activeTab === 'media')} onClick={() => setActiveTab('media')}>
                    Media
                </div>
                <div style={styles.sidebarItem(activeTab === 'gallery')} onClick={() => setActiveTab('gallery')}>
                    Gallery
                </div>
                <div style={styles.sidebarItem(activeTab === 'settings')} onClick={() => setActiveTab('settings')}>
                    Settings
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                    <a href="/" style={{ color: '#666', textDecoration: 'none', fontSize: '0.85rem', paddingLeft: '1rem' }}>
                        ← Back to Site
                    </a>
                </div>
            </aside>

            <main style={styles.main}>
                <header style={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, textTransform: 'capitalize' }}>
                            {activeTab}
                        </h1>
                        <a
                            href="/"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                color: '#666',
                                textDecoration: 'none',
                                fontSize: '0.8rem',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #eee',
                                transition: 'all 0.2s',
                            }}
                            onMouseOver={(e) => { e.target.style.backgroundColor = '#f5f5f5'; e.target.style.borderColor = '#ddd'; }}
                            onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.borderColor = '#eee'; }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>open_in_new</span>
                            View Website
                        </a>
                    </div>
                    <span style={styles.statusIcon}>{status}</span>
                </header>

                {renderContent()}
            </main>

            {/* Toast Container */}
            <div style={{
                position: 'fixed',
                bottom: '2rem',
                right: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                zIndex: 1000,
                pointerEvents: 'none'
            }}>
                {toasts.map(toast => (
                    <div key={toast.id} style={{
                        padding: '1rem 1.5rem',
                        backgroundColor: toast.type === 'error' ? '#fee2e2' : '#f0fdf4',
                        color: toast.type === 'error' ? '#991b1b' : '#166534',
                        border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#dcfce7'}`,
                        borderRadius: '0.75rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        pointerEvents: 'auto',
                        animation: 'fadeInSlide 0.3s ease forwards',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <style>{`
                            @keyframes fadeInSlide {
                                from { opacity: 0; transform: translateY(1rem); }
                                to { opacity: 1; transform: translateY(0); }
                            }
                        `}</style>
                        <span style={{ fontSize: '1.1rem' }}>
                            {toast.type === 'error' ? '✕' : '✓'}
                        </span>
                        {toast.message}
                    </div>
                ))}
            </div>
        </div>
    );
}
