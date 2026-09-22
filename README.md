# Swipe Player

## Resume

Swipe Player est un composant Web video. Il affiche une video a la fois et change de video avec un geste horizontal ou vertical. Le composant utilise un Shadow DOM : ses styles, icones et controles sont isoles de votre application.

## Ajouter le composant

Copiez `js/player.js` dans votre projet, puis chargez-le comme module :

```html
<swipe-player swipe-mode="horizontal"></swipe-player>
<script type="module" src="/chemin/vers/player.js"></script>
```

Utilisez un serveur HTTP pour votre application. L'ouverture directe du fichier HTML peut bloquer les appels API et certaines ressources video.

## Configuration

### Sens du swipe

L'attribut `swipe-mode` definit le geste de navigation :

| Valeur | Video suivante | Video precedente |
| --- | --- | --- |
| `vertical` | Swipe vers le haut | Swipe vers le bas |
| `horizontal` | Swipe vers la gauche | Swipe vers la droite |

```html
<swipe-player swipe-mode="vertical"></swipe-player>
```

### Videos depuis votre application

Utilisez la propriete `data` apres le chargement du composant :

```js
const player = document.querySelector('swipe-player');

player.data = {
    title: 'Mes videos',
    description: 'Une selection chargee par mon application.',
    swipeMode: 'horizontal',
    videos: [
        'https://cdn.example.com/video-1.mp4',
        { url: 'https://cdn.example.com/video-2.mp4' },
        { src: 'https://cdn.example.com/video-3.mp4' }
    ]
};
```

Chaque video peut etre une URL sous forme de texte, ou un objet avec une propriete `url` ou `src`.

Pour ne remplacer que la liste des videos :

```js
player.setVideos([
    'https://cdn.example.com/nouvelle-video.mp4'
]);
```

### Videos depuis une API

Ajoutez l'attribut `videos-url` avec l'URL de votre endpoint :

```html
<swipe-player
    swipe-mode="vertical"
    videos-url="/api/videos">
</swipe-player>
```

Votre API doit retourner un tableau JSON ou un objet contenant `videos` :

```json
{
    "videos": [
        { "url": "https://cdn.example.com/video-1.mp4" },
        { "url": "https://cdn.example.com/video-2.mp4" }
    ]
}
```

## Lire l'etat

La propriete `data` donne l'etat public du lecteur :

```js
const { videos, currentIndex, currentVideo, swipeMode } = player.data;
```

Les proprietes disponibles sont `title`, `description`, `videos`, `currentIndex`, `currentVideo` et `swipeMode`.

## Evenements

Ecoutez les evenements directement sur l'element :

```js
player.addEventListener('videosload', (event) => {
    console.log('Videos chargees :', event.detail.videos);
});

player.addEventListener('videoserror', (event) => {
    console.error('Erreur de chargement :', event.detail.message);
});

player.addEventListener('videochange', (event) => {
    console.log('Video active :', event.detail.currentVideo);
});
```

Les evenements remontent dans le DOM, vous pouvez donc aussi les ecouter depuis un conteneur parent.