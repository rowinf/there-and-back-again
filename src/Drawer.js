import React, { useCallback, useState } from 'react';
import { Chart } from './Chart';

const Drawer = ({ activeFeature, filters, setFilters }) => {
  let [expanded, setExpanded] = useState(false)
  let toggle = (attr) => {
    let isActive = !!filters[attr];
    setFilters({ ...filters, [attr]: !isActive });
  }
  let addFilter = (attr, value) => {
    setFilters({ ...filters, [attr]: value });
  }
  let createTotals = useCallback(() => {
    let tables = [];

    activeFeature.data.forEach((row) => {
      let headRows = [];
      let bodyRows = [];
      row.forEach((cells, i) => {
        let row = (
          <tr key={i}>
            {cells.map((cell, j) => { return i === 0 ? <th key={j} className="border border-gray-200 px-4 py-2">{cell}</th> : <td key={j} className="border border-gray-200 px-4 py-2">{cell === 0 ? '-' : cell}</td>} )}
          </tr>
        )
        if (i === 0) { headRows.push(row); }
        else { bodyRows.push(row); }
      })
      tables.push([headRows, bodyRows]);
    })
    return tables;
  }, [activeFeature]);
  let tableTotals = createTotals();
  return (
    <div className="flex flex-col" style={{height: 'calc(100vh - 300px)'}}>
      <div className="flex-auto m-1 overflow-auto">
        <form autoComplete="off">
          <div className="flex flex-col my-1">
          <p className="text-sm mb-1">Choose which dataset to display</p>
          <div className="flex mb-1">
            <label className="block font-bold w-1/2">
              <input className="mr-2 leading-tight" type="radio" name="dataset" value="e" checked={filters.dataset === 'e'} onChange={(e) => addFilter('dataset', 'e')} />
              <span>Education</span>
            </label>
            <label className="block font-bold w-1/2">
              <input className="mr-2 leading-tight" type="radio" name="dataset" value="w" checked={filters.dataset === 'w'} onChange={(e) => addFilter('dataset', 'w')} />
              <span>Work</span>
            </label>
          </div>
          <p className="text-sm mb-1">Toggle Outbound/inbound commuters</p>
          <div className="flex mb-1">
            <label className="block font-bold w-1/2">
              <input className="mr-2 leading-tight" type="checkbox" name="inbound" onChange={() => toggle('inbound')} checked={filters.inbound} />
              <span>Inbound</span>
            </label>
            <label className="block font-bold w-1/2">
              <input className="mr-2 leading-tight" type="checkbox" name="outbound" onChange={() => toggle('outbound')} checked={filters.outbound} />
              <span>Outbound</span>
            </label>
          </div>
        </div>
        </form>
      </div>
      <div className="flex-initial">
      {
        expanded ? (
          <>
          {tableTotals.map(([header, body], i) =>
            <table className="border-collapse table-auto border-2 border-gray-100 my-2" key={i}>
              <thead>{header}</thead>
              <tbody>{body}</tbody>
            </table>
          )}
          </>
        ) : (
          <Chart name={activeFeature.name} data={activeFeature.data} dataset={filters.dataset} />
        )
      }
      </div>
    </div>
  )
}

export {Drawer}
