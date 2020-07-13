import React, { useCallback, useState } from 'react';
import clx from 'classnames';
import { Chart } from './Chart';

const Drawer = ({ activeFeature, filters, setFilters }) => {
  let [expanded, setExpanded] = useState(false)
  let toggle = (attr) => {
    let isActive = !!filters[attr];
    setFilters({ ...filters, [attr]: !isActive });
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
            <h4>Filter</h4>
            {/* <label htmlFor="work">Work</label>
            <input type="checkbox" name="work" />
            <label htmlFor="education">Education</label>
            <input type="checkbox" name="education" /> */}
            <div className="flex">
              <label className="block font-bold w-1/2">
                <input className="mr-2 leading-tight" type="checkbox" name="inbound" onClick={() => toggle('inbound')} checked={filters.inbound} />
                <span className="text-sm">Inbound</span>
              </label>
              <label className="block font-bold w-1/2">
                <input className="mr-2 leading-tight" type="checkbox" name="outbound" onClick={() => toggle('outbound')} checked={filters.outbound} />
                <span className="text-sm">Outbound</span>
              </label>
            </div>
          </div>
          </form>
        </div>
        <div className="flex-auto my-4">
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
            <Chart data={activeFeature.data} />
          )
        }
        </div>
      </div>
    </div>
  )
}

export {Drawer}
