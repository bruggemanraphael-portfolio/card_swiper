const playerStyles = `
    :host {
        --resume-font-size: clamp(0.9rem, 4vw, 1.2rem);
        --resume-line-height: 1.5;
        --color-white: #ffffff;
        --color-black: #000000;
        --color-pink: #ff69b431;
        display: flex;
        justify-content: center;
        align-items: center;
        aspect-ratio: var(--video-aspect-ratio, 9 / 16);
        height: auto;
        min-height: 0;
        width: 100%;
        background-color: var(--color-black);
        user-select: none;
    }

    .player-container {
        border-radius: 15px;
        position: relative;
        margin: 0 auto;
        box-sizing: border-box;
        height: 100%;
        width: 100%;
        overflow: hidden;
        perspective: 900px;
        touch-action: none;
        z-index: 20;
    }

    video {
        position: absolute;
        inset: 0;
        margin: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
        pointer-events: none;
        transform-style: preserve-3d;
        backface-visibility: hidden;
    }

    .swipe-enter-up {
        transform-origin: center bottom;
        animation: swipeBasculeUp 0.45s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .swipe-enter-down {
        transform-origin: center top;
        animation: swipeBasculeDown 0.45s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .swipe-enter-left {
        transform-origin: right center;
        animation: swipeBasculeLeft 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .swipe-enter-right {
        transform-origin: left center;
        animation: swipeBasculeRight 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    @keyframes swipeBasculeUp {
        0% {
            opacity: 0.2;
            transform: translateY(16%) rotateX(16deg) scale(0.97);
        }
        100% {
            opacity: 1;
            transform: translateY(0) rotateX(0deg) scale(1);
        }
    }

    @keyframes swipeBasculeDown {
        0% {
            opacity: 0.2;
            transform: translateY(-16%) rotateX(-16deg) scale(0.97);
        }
        100% {
            opacity: 1;
            transform: translateY(0) rotateX(0deg) scale(1);
        }
    }

    @keyframes swipeBasculeLeft {
        0% {
            opacity: 0;
            transform: translateX(100%) rotateY(-22deg) scale(0.94);
        }
        100% {
            opacity: 1;
            transform: translateX(0) rotateY(0deg) scale(1);
        }
    }

    @keyframes swipeBasculeRight {
        0% {
            opacity: 0;
            transform: translateX(-100%) rotateY(22deg) scale(0.94);
        }
        100% {
            opacity: 1;
            transform: translateX(0) rotateY(0deg) scale(1);
        }
    }

    .play-button {
        position: absolute;
        display: grid;
        place-items: center;
        box-sizing: border-box;
        border: 0;
        border-radius: 50%;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: var(--color-black);
        z-index: 5;
        cursor: pointer;
        width: clamp(48px, 20%, 88px);
        aspect-ratio: 1;
        padding: 9px;
        background-color: rgba(255, 255, 255, 0.3);
        opacity: 1;
        transition: opacity 0.5s ease-in-out;
    }

    .play-button svg {
        display: block;
        width: 100%;
        height: 100%;
    }

    .fade-out {
        opacity: 0;
    }

    .resume-panel {
        display: block;
        font-size: var(--resume-font-size);
        position: absolute;
        bottom: 0;
        left: 0;
        background-color: var(--color-pink);
        box-shadow: 0 -4px 14px rgba(0, 0, 0, 0.35);
        backdrop-filter: blur(6px);
        color: var(--color-white);
        line-height: var(--resume-line-height);
        width: 100%;
        max-height: 100%;
        height: 60px;
        text-align: center;
        z-index: 5;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: transparent transparent;
        padding-top: 5px;
    }

    .inner-container {
        display: inline-block;
        width: 100%;
        height: 100%;
        padding: 0 clamp(16px, 8vw, 70px) 30px;
        box-sizing: border-box;
    }

    .inner-container h1 {
        font-size: clamp(1.25rem, 6vw, 2rem);
        overflow-wrap: anywhere;
    }

    .inner-container p {
        margin: 0;
        padding-bottom: 30px;
        overflow-wrap: anywhere;
    }

    .resume-panel-height {
        height: 100%;
    }
`;

class CardSwiper extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.videos = [];
        this.startX = 0;
        this.startY = 0;
        this.activePointerId = null;
        this.hideControlsTimeout = null;
        this.currentVideo = null;
        this.videoIndex = 0;
        this.lastSwipeDirection = null;
        this.pendingData = {};
        this.videoSources = [];
    }

    static get observedAttributes() {
        return ['videos-url', 'swipe-mode'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue || !this.playerContainer) return;

        if (name === 'videos-url' && newValue) {
            this.loadVideos(newValue);
        }

        if (name === 'swipe-mode') {
            this.swipeMode = newValue === 'horizontal' ? 'horizontal' : 'vertical';
        }
    }

    connectedCallback() {
        if (this.shadowRoot.children.length) return;

        this.playIcon = `
            <svg viewBox="0 0 65 72" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 20V51.5L44.75 35.75L20 20Z" fill="#E24997"/>
            </svg>
        `;
        this.pauseIcon = `
            <svg viewBox="0 0 67 72" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
                <path d="M38 51.5V20H47V51.5H38ZM20 51.5V20H29V51.5H20Z" fill="#E24997"/>
            </svg>
        `;
        this.shadowRoot.innerHTML = `
            <style>${playerStyles}</style>
            <div class="player-container">
                <button class="play-button" type="button" aria-label="Lire la video">${this.playIcon}</button>
                <div class="resume-panel">
                    <div class="inner-container">
                        <h1>Vincent</h1>
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec ipsum ex. Phasellus finibus mi aliquam est egestas, non commodo elit iaculis. Nam bibendum ornare elit, vitae maximus tortor pretium quis.</p>
                    </div>
                </div>
            </div>
        `;

        this.playerContainer = this.shadowRoot.querySelector('.player-container');
        this.playerButton = this.shadowRoot.querySelector('.play-button');
        this.resume = this.shadowRoot.querySelector('.resume-panel');
        this.titleElement = this.shadowRoot.querySelector('h1');
        this.descriptionElement = this.shadowRoot.querySelector('p');

        this.init(this.getAttribute('swipe-mode'));
        this.applyData(this.pendingData);

        const videosUrl = this.getAttribute('videos-url');
        if (videosUrl) {
            this.loadVideos(videosUrl);
        }
    }

    get data() {
        return {
            title: this.titleElement?.textContent ?? this.pendingData.title ?? '',
            description: this.descriptionElement?.textContent ?? this.pendingData.description ?? '',
            videos: [...this.videoSources],
            currentIndex: this.videoIndex,
            currentVideo: this.videoSources[this.videoIndex] ?? null,
            swipeMode: this.swipeMode ?? this.getAttribute('swipe-mode') ?? 'vertical'
        };
    }

    set data(data) {
        if (!data || typeof data !== 'object') return;
        this.pendingData = { ...this.pendingData, ...data };

        if (this.playerContainer) {
            this.applyData(data);
        }
    }

    applyData(data) {
        if (typeof data.title === 'string') {
            this.titleElement.textContent = data.title;
        }

        if (typeof data.description === 'string') {
            this.descriptionElement.textContent = data.description;
        }

        if (data.swipeMode === 'vertical' || data.swipeMode === 'horizontal') {
            this.swipeMode = data.swipeMode;
        }

        if (Array.isArray(data.videos)) {
            this.setVideos(data.videos);
        }
    }

    init(swipeMode = 'vertical') {
        this.swipeMode = swipeMode === 'horizontal' ? 'horizontal' : 'vertical';
        this.createVideos();
        this.updateVideo();
        this.bindEvents();
    }

    createVideos() {
        for (let index = 0; index < this.videoSources.length; index += 1) {
            const video = document.createElement('video');
            video.classList.add('video');
            video.loop = true;
            video.playsInline = true;
            video.preload = 'metadata';
            video.src = this.videoSources[index];
            video.addEventListener('loadedmetadata', () => {
                if (video === this.currentVideo) {
                    this.updateAspectRatio(video);
                }
            });
            this.playerContainer.appendChild(video);
            this.videos.push(video);
        }
    }

    setVideos(videos) {
        const validVideos = videos
            .map((video) => typeof video === 'string' ? video : video?.url ?? video?.src)
            .filter((video) => typeof video === 'string' && video.length > 0);

        this.videos.forEach((video) => {
            video.pause();
            video.remove();
        });

        this.videoSources = validVideos;
        this.videos = [];
        this.videoIndex = 0;
        this.createVideos();
        this.updateVideo();
    }

    async loadVideos(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`La requete a echoue avec le statut ${response.status}.`);
            }

            const payload = await response.json();
            const videos = Array.isArray(payload) ? payload : payload.videos;
            if (!Array.isArray(videos)) {
                throw new Error('La reponse doit contenir un tableau de videos.');
            }

            this.setVideos(videos);
            this.dispatchEvent(new CustomEvent('videosload', {
                detail: this.data,
                bubbles: true,
                composed: true
            }));
        } catch (error) {
            this.dispatchEvent(new CustomEvent('videoserror', {
                detail: { url, message: error.message },
                bubbles: true,
                composed: true
            }));
        }
    }

    bindEvents() {
        this.playerContainer.addEventListener('pointerdown', (event) => {
            if (this.isControlTarget(event.target)) return;
            this.activePointerId = event.pointerId;
            this.startX = event.clientX;
            this.startY = event.clientY;
            this.playerContainer.setPointerCapture(event.pointerId);
            this.revealControls();
        });

        this.playerContainer.addEventListener('pointerup', (event) => {
            if (event.pointerId !== this.activePointerId) return;
            this.activePointerId = null;
            if (this.isControlTarget(event.target)) return;

            const diffX = event.clientX - this.startX;
            const diffY = event.clientY - this.startY;
            this.handleSwipe(diffX, diffY);
            this.scheduleControlsHide();
        });

        this.playerContainer.addEventListener('pointercancel', (event) => {
            if (event.pointerId === this.activePointerId) {
                this.activePointerId = null;
            }
        });

        this.playerButton.addEventListener('click', () => {
            this.togglePlayback();
            this.scheduleControlsHide();
        });

        this.resume.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            this.resume.classList.toggle('resume-panel-height');
            this.resume.scrollTo(0, 0);
            this.revealControls();
        });
    }

    handleSwipe(diffX, diffY) {
        const threshold = window.matchMedia('(pointer: coarse)').matches ? 40 : 60;
        const absX = Math.abs(diffX);
        const absY = Math.abs(diffY);

        if (this.swipeMode === 'vertical' && absY >= threshold && absY > absX) {
            diffY < 0 ? this.nextVideo('up') : this.previousVideo('down');
        } else if (this.swipeMode === 'horizontal' && absX >= threshold && absX > absY) {
            diffX < 0 ? this.nextVideo('left') : this.previousVideo('right');
        }
    }

    async togglePlayback() {
        if (!this.currentVideo) return;

        if (this.currentVideo.paused) {
            try {
                await this.currentVideo.play();
                this.setPlaybackIcon(true);
            } catch (error) {
                this.setPlaybackIcon(false);
                this.dispatchEvent(new CustomEvent('playbackerror', {
                    detail: { message: error.message },
                    bubbles: true,
                    composed: true
                }));
            }
        } else {
            this.currentVideo.pause();
            this.setPlaybackIcon(false);
        }
    }

    setPlaybackIcon(isPlaying) {
        this.playerButton.innerHTML = isPlaying ? this.pauseIcon : this.playIcon;
        this.playerButton.setAttribute('aria-label', isPlaying ? 'Mettre la video en pause' : 'Lire la video');
    }

    nextVideo(direction) {
        if (!this.videos.length) return;
        this.lastSwipeDirection = direction;
        this.videoIndex = (this.videoIndex + 1) % this.videos.length;
        this.updateVideo();
    }

    previousVideo(direction) {
        if (!this.videos.length) return;
        this.lastSwipeDirection = direction;
        this.videoIndex = (this.videoIndex - 1 + this.videos.length) % this.videos.length;
        this.updateVideo();
    }

    updateVideo() {
        if (!this.videos.length) {
            this.currentVideo = null;
            this.playerButton.classList.add('fade-out');
            return;
        }

        this.videos.forEach((video, index) => {
            video.classList.remove('swipe-enter-up', 'swipe-enter-down', 'swipe-enter-left', 'swipe-enter-right');

            if (index === this.videoIndex) {
                video.style.display = 'block';
                video.style.transform = 'translateY(0)';
                video.style.zIndex = '1';
                this.applySwipeAnimation(video);
                this.currentVideo = video;
                this.updateAspectRatio(video);
                this.setPlaybackIcon(false);
            } else {
                video.pause();
                video.style.display = 'none';
                video.style.transform = 'translateY(100%)';
                video.style.zIndex = '-1';
            }
        });

        this.revealControls();
        this.lastSwipeDirection = null;
        this.dispatchEvent(new CustomEvent('videochange', {
            detail: this.data,
            bubbles: true,
            composed: true
        }));
    }

    applySwipeAnimation(video) {
        if (!this.lastSwipeDirection) return;
        void video.offsetWidth;
        video.classList.add(`swipe-enter-${this.lastSwipeDirection}`);
    }

    updateAspectRatio(video) {
        if (!video.videoWidth || !video.videoHeight) return;
        this.style.setProperty('--video-aspect-ratio', `${video.videoWidth} / ${video.videoHeight}`);
    }

    scheduleControlsHide() {
        clearTimeout(this.hideControlsTimeout);
        const delay = window.matchMedia('(pointer: coarse)').matches ? 2800 : 4000;
        this.hideControlsTimeout = setTimeout(() => {
            this.playerButton.classList.add('fade-out');
        }, delay);
    }

    revealControls() {
        this.playerButton.classList.remove('fade-out');
        this.scheduleControlsHide();
    }

    isControlTarget(target) {
        return this.playerButton.contains(target) || this.resume.contains(target);
    }
}

customElements.define('card-swiper', CardSwiper);

