import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import ReactMapboxGl, { Layer } from "react-mapbox-gl";
import { Transition } from 'react-transition-group';

import logo from './logo.svg';
import './App.css';
import { Drawer } from './Drawer';
import { FetchJson } from './FetchJson';
import { Overview, emitter } from './Overview';

const duration = 300;

const defaultStyle = {
  transition: `${duration}ms ease-in-out`,
  width: 0,
  position: 'absolute',
  top: 0,
  right: 0
};

const transitionDrawerStyles = {
  entering: { width: 0, opacity: 0 },
  entered:  { width: '33.333%', opacity: 1 },
  exiting:  { width: '33.333%', opacity: 1 },
  exited:  { width: 0, opacity: 0 },
};

const transitionMapStyles = {
  entering: { width: '100%' },
  entered:  { width: '66.667%' },
  exiting:  { width: '66.667%' },
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
  let [maploaded, setMaploaded] = useState(false);
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
  let [zoom, setZoom] = useState([10]);
  let [commuterGraphLoaded, setCommuterGraphLoaded] = useState();
  let [educationGraphLoaded, setEducationGraphLoaded] = useState();
  let [center, setCenter] = useState([174.7507971,-36.8916042]);
  let [filtered, setFiltered] = useState([]);
  let [centroids, setCentroids] = useState([]);
  let mapRef = useRef();
  let sa2NameLookup = useRef({});
  let sa2CentroidLookup = useRef({});
  let commuterGraph = useRef();
  let educationGraph = useRef();
  let onCentroidsLoaded = useCallback((json) => {
    sa2NameLookup.current = json.features.reduce((acc, centroid) => {
      acc[centroid.properties['SA22018_V1_00']] = centroid.properties['SA22018_V1_NAME']
      return acc
    }, {});

    sa2CentroidLookup.current = json.features.reduce((acc, record) => {
      acc[record.properties['SA22018_V1_00']] = record.geometry
      return acc
    }, {});
    setCentroids(true)
  }, [])
  let onCommuterGraphLoaded = useCallback((json) => {
    commuterGraph.current = json;
    setCommuterGraphLoaded(true);
  }, [])
  let onEducationGraphLoaded = useCallback((json) => {
    educationGraph.current = json;
    setEducationGraphLoaded(true);
  }, [])

  let onMapLoad = useCallback((map) => {
      mapRef.current = map;
      map.addSource('rowinf-data', {
        type: 'vector',
        url: 'mapbox://rowinf.data',
        'generateId': true
      });

      setMaploaded(true);
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
      let {features} = filters.dataset === 'e' ? educationGraph.current : commuterGraph.current;
      let edges = features.filter(feat => {
        return (feat.properties.sa22018_v1 === Number(activeFeatureId)) || (feat.properties[sa2Attr] === Number(activeFeatureId))
      }).map(edge => ({
        name: sa2NameLookup.current[edge.properties[sa2Attr]],
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
      let name = sa2NameLookup.current[activeFeatureId];
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
    if (maploaded && centroids && commuterGraphLoaded && educationGraphLoaded) {
      setLoaded(true)
    }
  }, [centroids, commuterGraphLoaded, educationGraphLoaded, maploaded]);
  useEffect(() => {
    if (maploaded && commuterGraphLoaded) {
      mapRef.current.addSource('graph', {
        type: 'geojson',
        data: commuterGraph.current,
      });
    }
  }, [commuterGraphLoaded, maploaded]);
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
          'fill-color': '#da1884',
          'fill-opacity': 0.3
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
      setFiltered(r);
    });
    return () => {
      emitter.off('overview_results');
    }
  }, [])

  return (
    <div className="App bg-gray-700 text-white">
      <Transition in={drawer} timeout={duration} onExited={() => setTimeout(() => mapRef.current.resize(), duration * 1.1)} onEntered={() => setTimeout(() => mapRef.current.resize(), duration * 1.1)}>
        {(state) => (
          <>
            <Map
              // eslint-disable-next-line react/style-prop-object
              style="mapbox://styles/rowinf/ckc2kkcdh06f71jode0t4bauh"
              center={center}
              zoom={zoom}
              tileset='rowinf.data'
              onStyleLoad={onMapLoad}
              containerStyle={{ position: 'absolute', top: 0, left: 0, height: 'calc(100vh - 300px)', ...transitionMapStyles[state]}}
              className="transition-width ease-in-out duration-300"
            >
              {/* {bikeCircle && <GeoJSONLayer fillPaint={{'fill-color': "#229933", 'fill-opacity': 0.2 }} data={bikeCircle}  />}
              {eBikeCircle && <GeoJSONLayer fillPaint={{'fill-color': "#7aaa25", 'fill-opacity': 0.2 }} data={eBikeCircle}  />}
              {walkCircle && <GeoJSONLayer fillPaint={{'fill-color': "#9bcc87", 'fill-opacity': 0.3 }} data={walkCircle}  />} */}
              {centroids && loaded && filters.outbound && filters.dataset === 'w' ? (
                <>
                  <Layer id="outbound-line" type="line" sourceId="graph" layout={{ 'line-join': 'round', 'line-cap': 'round' }} paint={{ 'line-color': '#f28cb1', 'line-offset': -2 }} filter={['==', 'sa22018_v1', Number(activeFeatureId)]} />
                  <Layer id="outbound-label" type="symbol" sourceId="graph" layout={{ 'symbol-placement': 'line', 'text-field': ['get', ['to-string', ['get', 'sa2_code_w']], ['literal', sa2NameLookup.current]] }} paint={{'text-color': 'rgba(232, 232, 192, 0.9)'}} filter={['==', 'SA22018_V1'.toLocaleLowerCase(), Number(activeFeatureId)]} />
                </>
              ) : null}
              {centroids && loaded && filters.inbound && filters.dataset === 'w' ? (
                <>
                  <Layer id="inbound-line" type="line" sourceId="graph" layout={{ 'line-join': 'round', 'line-cap': 'round' }} paint={{ 'line-color': '#8ab9f2', 'line-offset': 4 }} filter={['==', 'sa2_code_w', Number(activeFeatureId)]} />
                  <Layer id="inbound-label" type="symbol" sourceId="graph" layout={{ 'symbol-placement': 'line', 'text-field': ['get', ['to-string', ['get', 'sa22018_v1']], ['literal', sa2NameLookup.current]] }} paint={{'text-color': 'rgba(232, 232, 192, 0.9)'}} filter={['==', 'sa2_code_w', Number(activeFeatureId)]} />
                </>
              ) : null}
            </Map>
            <div className="absolute left-0 right-0 bottom-0 flex">
              <div className="w-2/3">
                {commuterGraphLoaded && educationGraphLoaded ?
                <Overview
                  data={filters.dataset === 'w' ? commuterGraph.current.features : educationGraph.current.features}
                  featureMap={filters.dataset === 'w' ? workFeatureMap : educationFeatureMap}
                  sa2Attr={filters.dataset === 'w' ? 'sa2_code_w' : 'sa2_code_e'}
                  colors={colors} />
                  : null}
              </div>
              <div className="w-1/3 flex flex-col flex-grow-0 flex-initial">
                <div style={{height: 300}} className="overflow-auto p-3">
                  {filtered.length
                    ? filtered.map(f => {
                      let name = sa2NameLookup.current[f]
                      if (!name) return null
                      return (
                        <div key={f} className="flex items-baseline">
                          <span className="text-sm">{f} {sa2NameLookup.current[f]}</span>
                          <button className="mx-2 px-2 border border-gray-100 rounded font-semibold" onClick={() => {
                            let centroid = sa2CentroidLookup.current[f];
                            setActiveFeatureId(f);
                            setDrawer(true);
                            setTimeout(() => {
                              setZoom([12])
                            }, 100);
                            mapRef.current.setCenter(centroid.coordinates);
                          }}>Go
                          </button>
                        </div>
                      )
                      })
                    : 'Select a range in the series chart to the left to filter regions here'
                  }
                </div>
              </div>
            </div>
            <FetchJson url="https://gist.githubusercontent.com/rowinf/0dc4187273028359193dd68cb8299209/raw/65f59fde8c750f512bf2bf1a1587debe90c4c827/sa2-centroids.geojson" onSuccess={onCentroidsLoaded} />
            <FetchJson url="https://gist.githubusercontent.com/rowinf/f1a3e8489da942f3c1ba1e8e7ef0d323/raw/c541c3fcfcce9b8b4d96dc4cf1d79bc9e1569345/commuter_graph.geojson" onSuccess={onCommuterGraphLoaded} />
            <FetchJson url="https://gist.githubusercontent.com/rowinf/ee0b4529615f74140bacd5954d5a0016/raw/8c85afd547b8652737fcf32f64b13075a0945f6d/education_graph.geojson" onSuccess={onEducationGraphLoaded} />
            <div className="transition ease-in-out duration-300 overflow-y-auto" style={{...defaultStyle, ...transitionDrawerStyles[state]}}>
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
