import React, { useCallback, useState } from 'react';
import clx from 'classnames';
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
    <div className="m-2 my-4">
      <h4 className="text-lg">{activeFeature.name}</h4>
      <div className="flex flex-col">
        <div className="flex-auto">
          <form autoComplete="off">
            <div className="flex flex-col my-4">
            <h4 className="text-sm">Choose which dataset to display</h4>
            <div className="flex mb-2">
              <label className="block font-bold w-1/4">
                <input className="mr-2 leading-tight" type="radio" name="dataset" value="e" checked={filters.dataset === 'e'} onChange={(e) => addFilter('dataset', 'e')} />
                <span>Education</span>
              </label>
              <label className="block font-bold w-1/4">
                <input className="mr-2 leading-tight" type="radio" name="dataset" value="w" checked={filters.dataset === 'w'} onChange={(e) => addFilter('dataset', 'w')} />
                <span>Work</span>
              </label>
            </div>
            <h4 className="text-sm">Outbound/inbound is the direction the commuters are going, if they are going into the area or leaving it</h4>
            <div className="flex mb-2">
              <label className="block font-bold w-1/4">
                <input className="mr-2 leading-tight" type="checkbox" name="inbound" onChange={() => toggle('inbound')} checked={filters.inbound} />
                <span>Inbound</span>
              </label>
              <label className="block font-bold w-1/4">
                <input className="mr-2 leading-tight" type="checkbox" name="outbound" onChange={() => toggle('outbound')} checked={filters.outbound} />
                <span>Outbound</span>
              </label>
            </div>
          </div>
          </form>
        </div>
        <div className="flex-auto mb-2">
          <button className={clx("font-bold py-2 px-4 rounded hover:bg-blue-700", {'bg-transparent': expanded, 'bg-blue-500': !expanded})} onClick={() => setExpanded(false)}>Chart</button>
          <button className={clx("font-bold py-2 px-4 mx-4 rounded hover:bg-blue-700", {'bg-transparent': !expanded, 'bg-blue-500': expanded})} onClick={() => setExpanded(true)}>Data Tables</button>
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
            <Chart data={activeFeature.data} dataset={filters.dataset} />
          )
        }
        </div>
      </div>
    </div>
  )
}

export {Drawer}
