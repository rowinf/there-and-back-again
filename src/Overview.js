import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import ReactEchartsCore from 'echarts-for-react/lib/core';
import echarts from 'echarts/lib/echarts';
import EventEmitter from 'eventemitter3';

export const emitter = new EventEmitter()


const Overview = React.memo(({ data, featureMap, sa2, colors }) => {
  let filters = useRef({});
  let schema = featureMap.map(([label, attr], i) => ({name: attr, index: i, text: label}));
  let groups = {
    outbound: {},
    inbound: {},
    within: {}
  };
  let addFilter = useCallback((e) => {
    let {parallelAxisId, intervals} = e;
    let label = parallelAxisId.replace(/[0\0]/g,'');
    let scem = schema.find(s => s.text === label);
    if (scem) {
      filters.current = {...filters.current, [scem.name]: intervals};
      let results = [];
      for (let [, val] of Object.entries(filters.current)) {
        for (let [, grouped] of Object.entries(groups)) {
          for (let [sa, values] of Object.entries(grouped)) {
            val.forEach(v => {
              if (values[scem.index] >= v[0] && values[scem.index] < v[1]) {
                results.push(sa);
              }
            })
          }
        }
      }
      emitter.emit('overview_results', results);
    }
  }, [groups, schema]);
  let groupAssign = (key, attr, values) => {
    let group = groups[key]
    if (!group.hasOwnProperty(attr)) {
      group[attr] = values;
    } else {
      values.forEach((val, i) => {
        if (group[attr][i] == null) {
          group[attr][i] = val;
        } else if (isFinite(group[attr][i]) && val != null) {
          group[attr][i] += val;
        }
      });
    }
  }
  data.forEach(d => {
    let {sa22018_v1, sa2_code_w} = d.properties
    let values = featureMap.map(([label, attr]) => {
      if (d.properties[attr] === -999) return null;
      return d.properties[attr];
    });
    if (sa22018_v1 === sa2_code_w) {
      groupAssign('within', sa22018_v1, values)
    } else {
      groupAssign('outbound', sa22018_v1, values)
      groupAssign('inbound', sa2_code_w, values)
      // if (groups.outbound[sa22018_v1].some(a => {
      //   return a > 1000
      // })) {
      //   debugger
      // }
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
