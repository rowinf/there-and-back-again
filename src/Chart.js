import React from 'react'
import ReactEchartsCore from 'echarts-for-react/lib/core';
import echarts from 'echarts/lib/echarts';
import 'echarts/lib/chart/bar';
import 'echarts/lib/chart/pie';
import 'echarts/lib/component/tooltip';
import 'echarts/lib/component/grid';
import 'echarts/lib/component/legend';
import 'echarts/lib/component/title';
import 'echarts/lib/chart/parallel';
import 'echarts/lib/component/parallelAxis';

const Chart = React.memo(({ data, dataset }) => {
  let [, ...modeLabels] = data[0].map(d => d[0])
  let option = dataset === 'w' ? {
    title: {
        text: `Total: ${data.map(d => d[0][1]).reduce((acc, num) => acc + num, 0)}`,
        left: 'right'
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'shadow'
        },
        formatter: (serie) => serie.map(series => `<span style=display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${series.color};></span>${series.seriesName} ${series.value || '-'} <br />`).join(' ')
    },
    legend: {
        data: modeLabels,
        left: 'left',
        width: 250
    },
    grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '24%',
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
  } : {
    title: {
        text: data[0][0].join(': '),
        left: 'right'
    },
    tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
        orient: 'vertical',
        left: 10,
        data: data[0].slice(1).filter(d => d[1] > 0).map(d => d[0])
    },
    series: [
        {
            name: data[0][0],
            type: 'pie',
            radius: ['50%', '70%'],
            avoidLabelOverlap: false,
            label: {
                show: false,
                position: 'center'
            },
            emphasis: {
                label: {
                    show: true,
                    fontSize: '20'
                }
            },
            labelLine: {
                show: false
            },
            data: data[0].slice(1).map(d => ({value: d[1], name: d[0] }))
        }
    ]
  };

  return (
    <ReactEchartsCore
      echarts={echarts}
      option={option}
      notMerge
      lazyUpdate
      theme="dark"
    />
  )
})

export {Chart}
