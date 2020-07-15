import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import ReactEchartsCore from 'echarts-for-react/lib/core';
import echarts from 'echarts/lib/echarts';
import EventEmitter from 'eventemitter3';
import uniq from 'lodash/uniq'

export const emitter = new EventEmitter()

let empty = [];

const Overview = React.memo(({ data, featureMap, sa2Attr, colors }) => {
  let filters = useRef({});
  let schema = featureMap.map(([label, attr], i) => ({name: attr, index: i, text: label}));
  let lastSa2Attr = useRef();
  let groups = {
    outbound: {},
    inbound: {},
    within: {}
  };
  useEffect(() => {
    if (sa2Attr !== lastSa2Attr.current) {
      filters.current = {};
      lastSa2Attr.current = sa2Attr;
    }
  }, [sa2Attr])
  let addFilter = useCallback((e) => {
    let {parallelAxisId, intervals} = e;
    let label = parallelAxisId.replace(/[0\0]/g,'');
    let scem = schema.find(s => s.text === label);
    if (scem) {
      if (intervals.length === 0) {
        delete filters.current[scem.name];
      } else {
        filters.current = {...filters.current, [scem.name]: intervals};
      }
      let results = [];
      if (Object.keys(filters.current).length === 0) {
        emitter.emit('overview_results', empty);
        return;
      };
      for (let [, group] of Object.entries(groups)) {
        for (let [sa, values] of Object.entries(group)) {
          let conditions = schema
            .filter(sch => filters.current.hasOwnProperty(sch.name) && filters.current[sch.name].length > 0)
            .every(sch => {
              let intervals = filters.current[sch.name];
              let value = values[sch.index];
              return intervals.every((interval) => {
                return interval.every((num, i) => {
                  return i === 0 ? (value >= num) : (value <= num);
                })
              })
            });
          if (conditions) { results.push(sa); }
          if (results.length > 20) break;
        }
        if (results.length > 20) break;
        let uniques = uniq(results);
        emitter.emit('overview_results', uniques);
      }
    }
  }, [groups, schema]);
  let groupAssign = (key, attr, values) => {
    let group = groups[key];
    if (!group.hasOwnProperty(attr)) {
      group[attr] = values;
    } else {
      values.forEach((val, i) => {
        if (group[attr][i] == null) {
          group[attr][i] = val;
        } else if (val != null) {
          group[attr][i] += val;
        }
      });
    }
  }
  data.forEach(d => {
    let {sa22018_v1} = d.properties;
    let sa2 = d.properties[sa2Attr]
    let values = featureMap.map(([label, attr]) => {
      if (d.properties[attr] === -999) return null;
      return d.properties[attr];
    });
    if (sa22018_v1 === sa2) {
      groupAssign('within', sa22018_v1, values);
    } else {
      groupAssign('outbound', sa22018_v1, values);
      groupAssign('inbound', sa2, values);
    }
  });
  let series = [{
    name: 'outbound',
    type: 'parallel',
    lineStyle: {
        width: 1,
        color: colors[0]
    },
    data: Object.values(groups.outbound)
  }, {
    name: 'inbound',
    type: 'parallel',
    lineStyle: {
        width: 1,
        color: colors[1]
    },
    data: Object.values(groups.inbound)
  }, {
    name: 'within',
    type: 'parallel',
    lineStyle: {
        width: 1,
        color: colors[2]
    },
    data: Object.values(groups.within)
  }];

  let option = {
      parallelAxis: schema.map(s => ({dim: s.index, name: s.text, min: -1})),
      series,
      legend: {
        data: ['outbound', 'inbound', 'within'],
        itemGap: 20,
        bottom: 20,
      },
  };

  return (
    <ReactEchartsCore
      echarts={echarts}
      option={option}
      notMerge
      lazyUpdate
      theme="dark"
      onEvents={{'axisareaselected': addFilter}}
    />
  );
})

export { Overview };
