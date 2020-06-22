// Запросы к серверу
const BASE_URL = 'https://json.medrating.org';

function getUsers() {
    return fetch(`${BASE_URL}/users/`)
        .then(response => response.json())
        .then(users => users.filter(user => {
            if (user.name) {
                return user;
            }
        }));
}

function getUserAlbums(userId) {
    return fetch(`${BASE_URL}/albums?userId=${userId}`)
        .then(response => response.json())
        .then(albums => albums);
}

function getAlbumPhotos(albumId) {
    return fetch(`${BASE_URL}/photos?albumId=${albumId}`)
        .then(response => response.json())
        .then(photos => photos);
}


// Страница каталога
const root = document.querySelector("#root");

function createElement(tag, classes) {
    const element = document.createElement(tag);
    if (classes) {
        element.className += classes;
    }
    return element;
}

async function createUsers() {
    const users = await getUsers();
    const usersNodes = await users.map(user => {
        return createUser(user.id, user.name);
    })
    return usersNodes;
}

function createUser(id, name) {
    const userNode = createElement('ul', 'users');
    userNode.dataset.id = id;

    const userName = createElement('h2', '');
    userName.textContent = 'Имя пользователя: ' + name;
    userNode.append(userName)

    const albumsContainer = createElement('div', 'spoiler');
    userNode.onclick = (e) => {
        const anchor = userNode.firstChild;
        if (e.target == anchor) {
            if (spoilerHandler(albumsContainer)) {
                return
            }
        }
        createUserAlbums(id).then(albums => {
                albumsContainer.append(...albums);
                userNode.append(albumsContainer);
            }
        )
    }

    return userNode;
}

async function createUserAlbums(userId) {
    const albums = await getUserAlbums(userId);
    let albumsNodes = albums.map(album => {
        return createAlbum(album.id, album.title)
    });
    return albumsNodes;
}

function createAlbum(albumId, title) {
    const albumNode = createElement('ul', 'spoiler album')

    const albumTitle = createElement('h3', '');
    albumTitle.textContent = 'Альбом: ' + title;
    albumNode.append(albumTitle)

    const albumContainer = createElement('ul', 'album-container');
    albumNode.onclick = async (e) => {
        const anchor = albumTitle;
        if (e.target == anchor) {
            if (spoilerHandler(albumContainer)) {
                return;
            }
        }

        const albumData = await getAlbumPhotos(albumId);
        const photos = albumData.map(photo => {
            return createPhoto(photo);
        })

        albumContainer.append(...photos);
        albumNode.append(albumContainer);
    }

    return albumNode;
}

function createPhoto(photoData) {
    const photo = createElement('img', 'photo_small');
    photo.src = photoData.thumbnailUrl;

    const largePhoto = createElement('img', 'photo_large hide');
    largePhoto.src = photoData.url;
    const largePhotoContainer = createElement('div', 'photo-container_large');
    largePhotoContainer.append(largePhoto);

    showPhotoHandler(photo, largePhoto);
    const photoTitleContainer = createElement('div', 'title-container');
    const photoTitle = createElement('h4', 'title');
    photoTitle.textContent = 'Название фото: ' + photoData.title;
    photoTitleContainer.append(photoTitle);

    showTitleHandler(photo, largePhotoContainer, photoTitleContainer);

    const photoContainer = createElement('div', 'photo-container');
    photoContainer.append(photo, largePhotoContainer)

    const albumItem = createElement('li', 'album-item');
    albumItem.append(photoContainer);
    albumItem.append(createPhotoFavButton(photoData));
    return albumItem;
}

function createPhotoFavButton(photoData) {
    const id = photoData.id;
    const favouritesButton = createElement('div', 'fav-icon')
    favouritesButton.innerHTML = '&#9733;';

    if (localStorage.getItem(id)) {
        favouritesButton.classList.add('fav');
    }

    favouritesButton.onclick = () => {
        favouritesButton.classList.toggle('fav');

        if (localStorage.getItem(id)) {
            localStorage.removeItem(id);
        } else {
            localStorage.setItem(id, JSON.stringify(photoData));
        }
    }

    return favouritesButton;
}

function spoilerHandler(elem) {
    if (elem.childNodes.length != 0 || elem.classList.contains('hide')) {
        elem.classList.toggle('hide');
        return true;
    } else {
        return false;
    }
}

function showTitleHandler(photo, largePhoto, title) {
    function removeTitle(elem) {
        title.remove();
    }

    largePhoto.onmouseenter = (event) => {
        largePhoto.append(title);
    }
    photo.onmouseenter = (event) => {
        photo.after(title);
    }
    photo.addEventListener('mouseleave', () => removeTitle(photo));
    largePhoto.addEventListener('mouseleave', () => removeTitle(largePhoto));
    largePhoto.addEventListener('click', () => removeTitle(largePhoto))
}

function showPhotoHandler(photo, largePhoto) {
    photo.onclick = () => {
        largePhoto.classList.toggle('hide');
        photo.classList.toggle('hide');
    }
    largePhoto.onclick = () => {
        largePhoto.classList.toggle('hide');
        photo.classList.toggle('hide');
    }
}

// Страница избранного
function createFavouritesPage() {
    const favouritesPage = createElement('div', 'favourites');
    const photosDataIds = Object.keys(localStorage);
    for (let photoId of photosDataIds) {
        photoData = JSON.parse(localStorage.getItem(photoId));
        favouritesPage.append(createPhoto(photoData));
    }
    return favouritesPage;
}

// Навигация между страницами
const CATALOG_HREF = 'catalog';
const FAVOURITE_HREF = 'favourite'

function createNav() {
    const nav = createElement('div', 'nav');

    const catalogLink = createElement('span', 'link');
    catalogLink.textContent = 'Каталог';

    const favouritesLink = createElement('span', 'link');
    favouritesLink.textContent = 'Избранное';

    catalogLink.onclick = () => {
        window.location.href = '#' + CATALOG_HREF;
        renderPages();
    }
    favouritesLink.onclick = () => {
        window.location.href = '#' + FAVOURITE_HREF;
        renderPages();
    }

    nav.append(catalogLink, favouritesLink);
    return nav;
}

// Рендеры
function renderCatalog() {
    createUsers().then(users => {
            root.append(...users)
        }
    )
}

function renderFavourites() {
    root.append(createFavouritesPage());
}

function renderPages() {
    clearRoot();

    root.append(createNav());
    const currentPage = window.location.hash.slice(1);
    if (currentPage == CATALOG_HREF) {
        renderCatalog()
    } else if (currentPage == FAVOURITE_HREF) {
        renderFavourites();
    } else {
        mainPage = createElement('div', 'main-page');
        mainPage.textContent = 'Главная страница';
        root.append(mainPage);
    }
}

function clearRoot() {
    for (node of Array.from(root.childNodes)) {
        node.remove();
    }
}

renderPages();
