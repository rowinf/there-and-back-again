import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import ReactMapboxGl, { Layer, GeoJSONLayer } from "react-mapbox-gl";
import { Transition } from 'react-transition-group';
import circle from '@turf/circle'

import logo from './logo.svg';
import './App.css';
import commuterGraph from './commuter_graph.json';
import centroids from './sa2-centroids-ext.json';
import { Drawer } from './Drawer';
import { FetchJson } from './FetchJson';

const sa2NameLookup = centroids.features.reduce((acc, centroid) => {
  acc[centroid.properties['SA22018_V1_00']] = centroid.properties['SA22018_V1_NAME']
  return acc
}, {})

const sa2CentroidLookup = centroids.features.reduce((acc, centroid) => {
  acc[centroid.properties['SA22018_V1_00']] = centroid['geometry']
  return acc
}, {})

const duration = 300;

const defaultStyle = {
  transition: `${duration}ms ease-in-out`,
  width: 0,
  position: 'absolute',
  top: 0,
  bottom: 0,
  right: 0
};

const transitionDrawerStyles = {
  entering: { width: 0, opacity: 0 },
  entered:  { width: '25%', opacity: 1 },
  exiting:  { width: '25%', opacity: 1 },
  exited:  { width: 0, opacity: 0 },
};

const transitionMapStyles = {
  entering: { width: '100%' },
  entered:  { width: '75%' },
  exiting:  { width: '75%' },
  exited:  { width: '100%' },
};

const Map = ReactMapboxGl({
  accessToken: process.env.REACT_APP_MAPBOX_ACCESS_TOKEN
});

function App() {
  let [loaded, setLoaded] = useState(false);
  let [activeFeatureId, setActiveFeatureId] = useState();
  let [activeFeature, setActiveFeature] = useState();
  let [hoverFeatureId, setHoverFeatureId] = useState();
  let [walkCircle, setWalkCircle] = useState();
  let [bikeCircle, setBikeCircle] = useState();
  let [eBikeCircle, setEBikeCircle] = useState();
  let [walkRadius] = useState(1.5);
  let [bikeRadius] = useState(4);
  let [eBikeRadius] = useState(10);
  let [features, setFeatures] = useState([]);
  let [drawer, setDrawer]= useState(false);
  let [zoom, setZoom] = useState([9]);
  let [center, setCenter] = useState([174.3130,-36.5949]);
  let mapRef = useRef();
  let onMapLoad = useCallback((map) => {
      setLoaded(true);
      mapRef.current = map;
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
              'rgba(98,123,193,0.1)',
              'rgba(0,0,0,0)'
            ]
          }
        }
      );
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
          let {features} = commuterGraph;
          let edges = features.filter(feat => {
            return (feat.properties.sa22018_v1 === Number(SA22018_V1_00)) || (feat.properties.sa2_code_w === Number(SA22018_V1_00))
          }).map(edge => ({
            name: sa2NameLookup[edge.properties.sa2_code_w],
            ...edge.properties,
          }));
          let outtotaler = (attr) => collection => collection.reduce((acc, edge) => {
            if (edge[attr] === -999 || edge.sa2_code_w === Number(SA22018_V1_00)) {
              return acc;
            }
            return acc + edge[attr];
          }, 0);
          let intotaler = (attr) => collection => collection.reduce((acc, edge) => {
            if (edge[attr] === -999) {
              return acc;
            }
            if (edge.sa2_code_w === Number(SA22018_V1_00) && edge.sa22018_v1 === Number(SA22018_V1_00)) {
              return acc;
            }
            return acc + edge[attr];
          }, 0);
          let withintotaler = (attr) => collection => collection.reduce((acc, edge) => {
            if (edge[attr] === -999) {
              return acc;
            }
            if (edge.sa2_code_w === Number(SA22018_V1_00) && edge.sa22018_v1 === Number(SA22018_V1_00)) {
              return acc + edge[attr];
            }
            return acc;
          }, 0);
          edges.sort((a, b) => b.total - a.total);
          let name = sa2NameLookup[SA22018_V1_00];
          let outboundTotals = [
            ['Outbound Total', outtotaler('total')(edges)],
            ['Work at home', outtotaler('work_at_ho')(edges)],
            ['Walk or jog', outtotaler('walk_or_jo')(edges)],
            ['Train', outtotaler('train')(edges)],
            ['Public bus', outtotaler('public_bus')(edges)],
            ['Passenger', outtotaler('passenger_')(edges)],
            ['Ferry', outtotaler('ferry')(edges)],
            ['Private Car', outtotaler('drive_a_pr')(edges)],
            ['Bicycle', outtotaler('bicycle')(edges)],
            ['Other', outtotaler('other')(edges)],
          ]
          let inboundTotals = [
            ['Inbound Total', intotaler('total')(edges)],
            ['Work at home', intotaler('work_at_ho')(edges)],
            ['Walk or jog', intotaler('walk_or_jo')(edges)],
            ['Train', intotaler('train')(edges)],
            ['Public bus', intotaler('public_bus')(edges)],
            ['Passenger', intotaler('passenger_')(edges)],
            ['Ferry', intotaler('ferry')(edges)],
            ['Private Car', intotaler('drive_a_pr')(edges)],
            ['Bicycle', intotaler('bicycle')(edges)],
            ['Other', intotaler('other')(edges)],
          ]
          let withinTotals = [
            ['Living and working within', withintotaler('total')(edges)],
            ['Work at home', withintotaler('work_at_ho')(edges)],
            ['Walk or jog', withintotaler('walk_or_jo')(edges)],
            ['Train', withintotaler('train')(edges)],
            ['Public bus', withintotaler('public_bus')(edges)],
            ['Passenger', withintotaler('passenger_')(edges)],
            ['Ferry', withintotaler('ferry')(edges)],
            ['Private Car', withintotaler('drive_a_pr')(edges)],
            ['Bicycle', withintotaler('bicycle')(edges)],
            ['Other', withintotaler('other')(edges)],
          ]
          setDrawer(true);
          setActiveFeatureId(SA22018_V1_00);
          // setFeatures(edges);
          setActiveFeature({name, outboundTotals, inboundTotals, withinTotals});
        }
      });
    }, []);

    useEffect(() => {
      if (activeFeatureId) {
        let centroid = sa2CentroidLookup[activeFeatureId];
        let walk = circle(centroid, walkRadius);
        let bike = circle(centroid, bikeRadius);
        let ebike = circle(centroid, eBikeRadius);
        setBikeCircle(bike);
        setEBikeCircle(ebike);
        setWalkCircle(walk);
      }
    }, [activeFeatureId, bikeRadius, eBikeRadius, walkRadius]);

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
  }, [hoverFeatureId, loaded]);
  useEffect(() => {
    if (loaded && activeFeatureId) {
      mapRef.current.addLayer({
        id: `${activeFeatureId}-line-outbound`,
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
        id: `${activeFeatureId}-line-inbound`,
        type: 'line',
        source: 'graph',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#8ab9f2',
        },
        'filter': ['==', 'sa2_code_w', Number(activeFeatureId)]
      });
      mapRef.current.addLayer({
        id: `${activeFeatureId}-label`,
        type: 'symbol',
        source: 'graph',
        'layout': {
          'symbol-placement': 'line',
          'text-field': ['get', ['to-string', ['get', 'sa2_code_w']], ['literal', sa2NameLookup]]
        },
        'paint': {
          'text-color': 'rgba(232, 232, 192, 0.9)',
        },
        'filter': ['==', 'SA22018_V1'.toLocaleLowerCase(), Number(activeFeatureId)]
      });
      mapRef.current.addLayer({
        id: `${activeFeatureId}-label-inbound`,
        type: 'symbol',
        source: 'graph',
        'layout': {
          'symbol-placement': 'line',
          'text-field': ['get', ['to-string', ['get', 'sa22018_v1']], ['literal', sa2NameLookup]]
        },
        'paint': {
          'text-color': 'rgba(232, 232, 192, 0.9)',
        },
        'filter': ['==', 'sa2_code_w', Number(activeFeatureId)]
      });
      mapRef.current.addLayer({
        'id': `${activeFeatureId}-fill`,
        'type': 'fill',
        'source': 'rowinf-data',
        'source-layer': 'data',
        'paint': {
          'fill-color': '#f28cb1',
          'fill-opacity': 0.1
        },
        'filter': ['==', 'SA22018_V1_00', activeFeatureId]
      });
    }
    return () => {
      if (mapRef.current.isStyleLoaded && mapRef.current.getLayer(`${activeFeatureId}-line-outbound`)) {
        mapRef.current.removeLayer(`${activeFeatureId}-line-outbound`)
      }
      if (mapRef.current.isStyleLoaded && mapRef.current.getLayer(`${activeFeatureId}-line-inbound`)) {
        mapRef.current.removeLayer(`${activeFeatureId}-line-inbound`)
      }
      if (mapRef.current.isStyleLoaded && mapRef.current.getLayer(`${activeFeatureId}-fill`)) {
        mapRef.current.removeLayer(`${activeFeatureId}-fill`)
      }
      if (mapRef.current.isStyleLoaded && mapRef.current.getLayer(`${activeFeatureId}-label`)) {
        mapRef.current.removeLayer(`${activeFeatureId}-label`)
      }
      if (mapRef.current.isStyleLoaded && mapRef.current.getLayer(`${activeFeatureId}-label-inbound`)) {
        mapRef.current.removeLayer(`${activeFeatureId}-label-inbound`)
      }
    }
  }, [activeFeatureId, loaded]);

  return (
    <div className="App bg-gray-700 text-white">
      <Transition in={drawer} timeout={duration}>
        {(state) => (
          <>
            <Map
              // eslint-disable-next-line react/style-prop-object
              style="mapbox://styles/rowinf/ckc2kkcdh06f71jode0t4bauh"
              center={center}
              zoom={zoom}
              tileset='rowinf.data'
              onStyleLoad={onMapLoad}
              containerStyle={{ position: 'absolute', top: 0, bottom: 0, ...transitionMapStyles[state]}}
              className="transition-width ease-in-out duration-300"
            >
              {bikeCircle && <GeoJSONLayer fillPaint={{'fill-color': "#229933", 'fill-opacity': 0.2 }} data={bikeCircle}  />}
              {eBikeCircle && <GeoJSONLayer fillPaint={{'fill-color': "#7aaa25", 'fill-opacity': 0.2 }} data={eBikeCircle}  />}
              {walkCircle && <GeoJSONLayer fillPaint={{'fill-color': "#9bcc87", 'fill-opacity': 0.3 }} data={walkCircle}  />}
              <FetchJson url="https://gist.githubusercontent.com/rowinf/159d218722c8fe82964343a015fbc62e/raw/7bd9457c76df2c705020b7f3a5c43fcba346d5d3/sa2-centroids-ext.geojson" onSuccess={console.log} />
            </Map>
            <div className="transition ease-in-out duration-300 border-dashed border-4 border-gray-600 overflow-y-auto" style={{...defaultStyle, ...transitionDrawerStyles[state]}}>
              {activeFeature && <Drawer activeFeature={activeFeature} />}
              <button className="absolute top-0 right-0 font-bold py-2 px-4 rounded inline-flex items-center" onClick={() => setDrawer(false)}>
                <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M10 8.586L2.929 1.515 1.515 2.929 8.586 10l-7.071 7.071 1.414 1.414L10 11.414l7.071 7.071 1.414-1.414L11.414 10l7.071-7.071-1.414-1.414L10 8.586z"/></svg>
              </button>
            </div>
          </>
        )}
      </Transition>
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
    </div>
  );
}

export default App;
