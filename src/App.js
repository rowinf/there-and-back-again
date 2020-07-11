import React, { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

import logo from './logo.svg';
import './App.css';
import commuterGraph from './commuter_graph.json'

function App() {
  let [loaded, setLoaded] = useState(false);
  let [activeFeatureId, setActiveFeatureId] = useState();
  let [hoverFeatureId, setHoverFeatureId] = useState();
  let mapRef = useRef()
  useEffect(() => {
    let map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/rowinf/ckc2kkcdh06f71jode0t4bauh',
      // center: [174.6214276,-41.2442847],
      center: [174.3130,-36.5949],
      zoom: 9,
      tileset: 'rowinf.data'
    });

    mapRef.current = map
    map.on('load', () => {
      setLoaded(true);
      map.addSource('rowinf-data', {
        type: 'vector',
        url: 'mapbox://rowinf.data',
        'generateId': true
      });

      map.addSource('graph', {
        type: 'geojson',
        data: commuterGraph,
      });
      map.addLayer(
        {
          'id': 'hover-layer',
          'type': 'fill',
          'source': 'rowinf-data',
          "source-layer": 'data',
          'paint': {
            'fill-color': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              '#627BC1',
              'rgba(0,0,0,0)'
            ]
          }
        }
      );
    });

    map.on('click', 'hover-layer', function(e) {
      // set bbox as 5px reactangle area around clicked point
      // var bbox = [
      //   [e.point.x - 5, e.point.y - 5],
      //   [e.point.x + 5, e.point.y + 5]
      // ];
      // let {lat, lng} = e.lngLat;
      // let query = new URLSearchParams({radius: 5, limit: 5, dedupe: true, access_token: process.env.REACT_APP_MAPBOX_ACCESS_TOKEN});
      // let url = `https://api.mapbox.com/v4/rowinf.data/tilequery/${lng},${lat}.json?${query}`

      let {features: efeatures} = e;
      if (efeatures[0]) {
        let [feat] = efeatures;
        let { properties } = feat;
        let { SA22018_V1_00 } = properties;
        setActiveFeatureId(SA22018_V1_00);
        let {features} = commuterGraph;
        let edges = features.filter(feat => {
          return (feat.properties.sa22018_v1 === Number(SA22018_V1_00))
        })
      }
    });
  }, []);
  useEffect(() => {
    if (loaded) {
      mapRef.current.on('mousemove', 'hover-layer', function(e) {
        mapRef.current.getCanvas().style.cursor = 'pointer';
        if (e.features.length > 0) {
          if (hoverFeatureId) {
            mapRef.current.removeFeatureState({
              id: hoverFeatureId,
              source: 'rowinf-data',
              sourceLayer: 'data'
            })
          }
          let {id} = e.features[0]
          setHoverFeatureId(id)
          mapRef.current.setFeatureState({
            source: 'rowinf-data',
            sourceLayer: 'data',
            id,
          }, {
            hover: true
          });
        }
      })
    }
    return ()=> {
      if (loaded) {
        mapRef.current.off('mousemove', 'sa2-join')
      }
    }
  }, [hoverFeatureId, loaded])
  useEffect(() => {
    if (loaded && activeFeatureId) {
      mapRef.current.addLayer({
        id: `${activeFeatureId}-line`,
        type: 'line',
        source: 'graph',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#f28cb1',
        },
        'filter': ['==', 'SA22018_V1'.toLocaleLowerCase(), Number(activeFeatureId)]
      });
      mapRef.current.addLayer({
        'id': `${activeFeatureId}-fill`,
        'type': 'fill',
        'source': 'rowinf-data',
        'source-layer': 'data',
        'paint': {
          'fill-color': '#f28cb1',
          'fill-opacity': 0.75
        },
        'filter': ['==', 'SA22018_V1_00', activeFeatureId]
      });
    }
    return () => {
      if (mapRef.current.isStyleLoaded && mapRef.current.getLayer(`${activeFeatureId}-line`)) {
        mapRef.current.removeLayer(`${activeFeatureId}-line`)
      }
      if (mapRef.current.isStyleLoaded && mapRef.current.getLayer(`${activeFeatureId}-fill`)) {
        mapRef.current.removeLayer(`${activeFeatureId}-fill`)
      }
    }
  }, [activeFeatureId, loaded])
  return (
    <div className="App">
      <header className="App-header" style={loaded ? {display: 'none'} : {}}>
        <img src={logo} className="App-logo" alt="logo" />
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      <div id="map" />
    </div>
  );
}

export default App;
