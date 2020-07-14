import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import ReactMapboxGl, { Layer } from "react-mapbox-gl";
import { Transition } from 'react-transition-group';
// import circle from '@turf/circle'

import logo from './logo.svg';
import './App.css';
import commuterGraph from './commuter_graph.json';
import educationGraph from './education_graph.json';
import centroids from './sa2-centroids-ext.json';
import { Drawer } from './Drawer';
import { FetchJson } from './FetchJson';
import { Overview, emitter } from './Overview';

const sa2NameLookup = centroids.features.reduce((acc, centroid) => {
  acc[centroid.properties['SA22018_V1_00']] = centroid.properties['SA22018_V1_NAME']
  return acc
}, {});

// const sa2CentroidLookup = centroids.features.reduce((acc, centroid) => {
//   acc[centroid.properties['SA22018_V1_00']] = centroid['geometry']
//   return acc
// }, {});

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
  entered:  { width: '34%', opacity: 1 },
  exiting:  { width: '34%', opacity: 1 },
  exited:  { width: 0, opacity: 0 },
};

const transitionMapStyles = {
  entering: { width: '100%' },
  entered:  { width: '66%' },
  exiting:  { width: '66%' },
  exited:  { width: '100%' },
};

const Map = ReactMapboxGl({
  accessToken: process.env.REACT_APP_MAPBOX_ACCESS_TOKEN
});
let empty = [];
let workFeatureMap = [
  ['Work at home', 'work_at_ho'],
  ['Walk or jog', 'walk_or_jo'],
  ['Train', 'train'],
  ['Public bus', 'public_bus'],
  ['Passenger', 'passenger_'],
  ['Ferry', 'ferry'],
  ['Private Car', 'drive_a_pr'],
  ['Bicycle', 'bicycle'],
  ['Other', 'other'],
];
let educationFeatureMap = [
  ['Bicycle', 'bicycle'],
  ['Drive a Car', 'drive_a_ca'],
  ['Passenger', 'passenger_'],
  ['Public bus', 'public_bus'],
  ['School bus', 'school_bus'],
  ['Train', 'train'],
  ['Walk or jog', 'walk_or_jo'],
  ['Study at home', 'study_at_h'],
];

let colors = ['#f28cb1', '#8ab9f2', '#8ae89a'];

function App() {
  let [loaded, setLoaded] = useState(false);
  let [activeFeatureId, setActiveFeatureId] = useState();
  let [hoverFeatureId, setHoverFeatureId] = useState();
  // let [walkCircle, setWalkCircle] = useState();
  // let [bikeCircle, setBikeCircle] = useState();
  // let [eBikeCircle, setEBikeCircle] = useState();
  // let [walkRadius] = useState(1.5);
  // let [bikeRadius] = useState(4);
  // let [eBikeRadius] = useState(10);
  let [filters, setFilters] = useState({
    inbound: true,
    outbound: true,
    dataset: 'w'
  });
  let sa2Attr = filters.dataset === 'w' ? 'sa2_code_w' : 'sa2_code_e'
  let [drawer, setDrawer]= useState(false);
  let [zoom, setZoom] = useState([9]);
  let [center, setCenter] = useState([174.3130,-36.5949]);
  let [filtered, setFiltered] = useState([])
  let mapRef = useRef();
  let onMapLoad = useCallback((map) => {
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
      setLoaded(true);
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
        let {features: efeatures} = e;
        if (efeatures[0]) {
          let [feat] = efeatures;
          let { properties } = feat;
          let { SA22018_V1_00 } = properties;
          setDrawer(true);
          setActiveFeatureId(SA22018_V1_00);
        }
      });
    }, []);
    let features = useMemo(() => {
      if (!activeFeatureId) return empty;
      let {features} = filters.dataset === 'e' ? educationGraph : commuterGraph;
      let edges = features.filter(feat => {
        return (feat.properties.sa22018_v1 === Number(activeFeatureId)) || (feat.properties[sa2Attr] === Number(activeFeatureId))
      }).map(edge => ({
        name: sa2NameLookup[edge.properties[sa2Attr]],
        ...edge.properties,
      }));
      edges.sort((a, b) => b.total - a.total);
      return edges;
    }, [activeFeatureId, filters.dataset, sa2Attr]);
    let activeFeature = useMemo(() => {
      let outtotaler = (attr) => collection => collection.reduce((acc, edge) => {
        if (edge[attr] === -999) {
          return acc;
        }
        if (edge[sa2Attr] !== Number(activeFeatureId) && edge.sa22018_v1 === Number(activeFeatureId)) {
          return acc + edge[attr];
        }
        return acc;
      }, 0);
      let intotaler = (attr) => collection => collection.reduce((acc, edge) => {
        if (edge[attr] === -999) {
          return acc;
        }
        if (edge[sa2Attr] === Number(activeFeatureId) && edge.sa22018_v1 !== Number(activeFeatureId)) {
          return acc + edge[attr];
        }
        return acc;
      }, 0);
      let withintotaler = (attr) => collection => collection.reduce((acc, edge) => {
        if (edge[attr] === -999) {
          return acc;
        }
        if (edge[sa2Attr] === Number(activeFeatureId) && edge.sa22018_v1 === Number(activeFeatureId)) {
          return acc + edge[attr];
        }
        return acc;
      }, 0);
      let name = sa2NameLookup[activeFeatureId];
      let featGroups = [
        filters.dataset === 'e' ? ['Total', withintotaler] : ['Within', withintotaler],
        filters.outbound ? ['Outbound', outtotaler] : null,
        filters.inbound ? ['Inbound', intotaler] : null
      ].filter(g => g);
      let data = featGroups.map(([topLabel, totaler]) => {
        let featureMap = [
          [topLabel, 'total'],
          ...(filters.dataset === 'w' ? workFeatureMap : educationFeatureMap)
        ]
        return featureMap.map(([label, attr]) => {
          return [label, totaler(attr)(features)]
        });
      });
      return {name, data}
    }, [activeFeatureId, features, filters.dataset, filters.inbound, filters.outbound, sa2Attr])

    // useEffect(() => {
    //   if (activeFeatureId) {
    //     let centroid = sa2CentroidLookup[activeFeatureId];
    //     if (centroid) {
    //       let walk = circle(centroid, walkRadius);
    //       let bike = circle(centroid, bikeRadius);
    //       let ebike = circle(centroid, eBikeRadius);
    //       setBikeCircle(bike);
    //       setEBikeCircle(ebike);
    //       setWalkCircle(walk);
    //     } else {
    //       setBikeCircle(null);
    //       setEBikeCircle(null);
    //       setWalkCircle(null);
    //     }
    //   }
    // }, [activeFeatureId, bikeRadius, eBikeRadius, walkRadius]);

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
            });
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
        mapRef.current.off('mousemove', 'sa2-join');
      }
    }
  }, [hoverFeatureId, loaded]);
  useEffect(() => {
    if (loaded && activeFeatureId) {
      mapRef.current.addLayer({
        'id': `${activeFeatureId}-fill`,
        'type': 'fill',
        'source': 'rowinf-data',
        'source-layer': 'data',
        'paint': {
          'fill-color': '#b2ec91',
          'fill-opacity': 0.1
        },
        'filter': ['==', 'SA22018_V1_00', activeFeatureId]
      });
    }
    return () => {
      if (loaded && mapRef.current.isStyleLoaded && mapRef.current.getLayer(`${activeFeatureId}-fill`)) {
        mapRef.current.removeLayer(`${activeFeatureId}-fill`)
      }
    }
  }, [activeFeatureId, loaded]);

  useEffect(() => {
    emitter.on('overview_results', (r) => {
      console.log(r);
      setFiltered(r);
    });
    return () => {
      emitter.off('overview_results');
    }
  }, [])

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
              {/* {bikeCircle && <GeoJSONLayer fillPaint={{'fill-color': "#229933", 'fill-opacity': 0.2 }} data={bikeCircle}  />}
              {eBikeCircle && <GeoJSONLayer fillPaint={{'fill-color': "#7aaa25", 'fill-opacity': 0.2 }} data={eBikeCircle}  />}
              {walkCircle && <GeoJSONLayer fillPaint={{'fill-color': "#9bcc87", 'fill-opacity': 0.3 }} data={walkCircle}  />} */}
              {loaded && filters.outbound && filters.dataset === 'w' ? (
                <>
                  <Layer id="outbound-line" type="line" sourceId="graph" layout={{ 'line-join': 'round', 'line-cap': 'round' }} paint={{ 'line-color': '#f28cb1', 'line-offset': -2 }} filter={['==', 'sa22018_v1', Number(activeFeatureId)]} />
                  <Layer id="outbound-label" type="symbol" sourceId="graph" layout={{ 'symbol-placement': 'line', 'text-field': ['get', ['to-string', ['get', 'sa2_code_w']], ['literal', sa2NameLookup]] }} paint={{'text-color': 'rgba(232, 232, 192, 0.9)'}} filter={['==', 'SA22018_V1'.toLocaleLowerCase(), Number(activeFeatureId)]} />
                </>
              ) : null}
              {loaded && filters.inbound && filters.dataset === 'w' ? (
                <>
                  <Layer id="inbound-line" type="line" sourceId="graph" layout={{ 'line-join': 'round', 'line-cap': 'round' }} paint={{ 'line-color': '#8ab9f2', 'line-offset': 4 }} filter={['==', 'sa2_code_w', Number(activeFeatureId)]} />
                  <Layer id="inbound-label" type="symbol" sourceId="graph" layout={{ 'symbol-placement': 'line', 'text-field': ['get', ['to-string', ['get', 'sa22018_v1']], ['literal', sa2NameLookup]] }} paint={{'text-color': 'rgba(232, 232, 192, 0.9)'}} filter={['==', 'sa2_code_w', Number(activeFeatureId)]} />
                </>
              ) : null}
            </Map>
            <div className="absolute left-0 right-0 bottom-0 flex">
              <div className="w-2/3">
                <Overview
                  data={commuterGraph.features}
                  featureMap={workFeatureMap}
                  sa2={sa2NameLookup}
                  colors={colors} />
                </div>
              <div className="w-1/3 bg-gray-700">
                {filtered.length
                  ? filtered.map(f => f).join('\n')
                  : 'Select a range in the chart for the regions to appear here'
                }
              </div>
            </div>
            <FetchJson url="https://gist.githubusercontent.com/rowinf/159d218722c8fe82964343a015fbc62e/raw/7bd9457c76df2c705020b7f3a5c43fcba346d5d3/sa2-centroids-ext.geojson" onSuccess={console.log} />
            <div className="transition ease-in-out duration-300 border-dashed border-4 border-gray-600 overflow-y-auto" style={{...defaultStyle, ...transitionDrawerStyles[state]}}>
              {activeFeature && <Drawer activeFeature={activeFeature} filters={filters} setFilters={setFilters} />}
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
