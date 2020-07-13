import React from 'react'
import ReactEchartsCore from 'echarts-for-react/lib/core';
import echarts from 'echarts/lib/echarts';
import 'echarts/lib/chart/bar';
import 'echarts/lib/component/tooltip';
import 'echarts/lib/component/grid';
import 'echarts/lib/component/legend';

const Chart = ({ data }) => {
  let [, ...modeLabels] = data[0].map(d => d[0])
  let option = {
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'shadow'
        },
        formatter: (serie) => serie.map(series => `<span style=display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${series.color};></span>${series.seriesName} ${series.value || '-'} <br />`).join(' ')
    },
    legend: {
        data: modeLabels
    },
    grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
    },
    xAxis: {
        type: 'value'
    },
    yAxis: {
        type: 'category',
        data: data.map(d => d[0][0])
    },
    series: modeLabels.filter((label, i) => {
      let rows = data.map(d => d[i + 1])
      let sum = rows.reduce((acc, row) => acc + row[1], 0)
      return sum > 0
    }).map((label, i) => ({
      name: label,
      type: 'bar',
      stack: 'a',
      label: {
          position: 'insideRight',
          show: true,
          formatter: (obj) => obj.value === 0 ? '-' : `${obj.value}`
      },
      data: data.map(d => d.find(item => item[0] === label)[1])
    }))
  };

  return (
    <ReactEchartsCore
      echarts={echarts}
      option={option}
      notMerge={true}
      lazyUpdate={true}
      theme="dark"
    />
  )
}

export {Chart}
