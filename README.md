# Kusd frontend

This frontend was built upon the kondor example site made by joticajulian

To test the page, go into the project folder and run:

```
yarn install
yarn build:3rdpage
```

To serve the webpage run:

```
node ./server.js
```

The page will be available in http://localhost:8081/index.html

## Extension Developers

Kondor wallet has been created using Vue Framework. It can be tested in 2 ways:

1. As a single-page application in a web page. As it is developed in Vue you can take advantage of the hot reloads for fast iteration. With this option the local storage is not tested, and instead of that it is bypassed by data written in memory.
2. As browser extension (recommended). This option doesn't have the hot reloads offered by Vue but you can test it as extension with all features.

Setup the project by installing dependencies:

```
yarn install
```

### Run as Single-Page Application

When testing in localhost we need a proxy server to avoid the issues with cors. Start the server that adds the corresponding headers:

```
node ./server.js
```

The server will start in http://localhost:8081

"# kusd_frontend" 
#   k u s d _ f r o n t e n d 
 
 
