// import React from 'react';
// import ReactDOM from 'react-dom';
import './index.css';
// import App from './App';
import * as serviceWorker from './serviceWorker';
import mapboxgl from 'mapbox-gl'; // or "const mapboxgl = require('mapbox-gl');"

// ReactDOM.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
//   document.getElementById('root')
// );

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const map = new mapboxgl.Map({
  container: 'root',
  style: 'mapbox://styles/mapbox/streets-v11', // stylesheet location
  center: [174.6214276,-41.2442847], // starting position [lng, lat]
  zoom: 9 // starting zoom
});

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
