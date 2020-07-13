import React, { useMemo, useCallback, useState } from 'react';
import Transition from 'react-transition-group/cjs/Transition';

const duration = 300;

const defaultStyle = {
  transition: `${duration}ms ease-in-out`
};

const transitionStyles = {
  entering: { height: 20 },
  entered:  { height: 'auto' },
  exiting:  { height: 'auto' },
  exited:  { height: 0 },
};

const Drawer = ({ activeFeature }) => {
  let [expanded, setExpanded] = useState(false)
  let createTotals = useCallback((attr) => {
    let headRows = [];
    let bodyRows = [];
    activeFeature[attr].forEach((cells, i) => {
      let row = (
        <tr key={i}>
          {cells.map((cell, j) => { return i === 0 ? <th key={j}>{cell}</th> : <td key={j}>{cell === 0 ? '-' : cell}</td>} )}
        </tr>
      )
      if (i === 0) { headRows.push(row); }
      else { bodyRows.push(row); }
    })
    return [headRows, bodyRows];
  }, [activeFeature]);
  let [inboundHead, inboundBody] = createTotals('inboundTotals');
  let [withinHead, withinBody] = createTotals('withinTotals');
  let [outboundHead, outboundBody] = createTotals('outboundTotals');
  return (
    <div className="">
      <div className="m-2 my-4">
        <h4>{activeFeature.name}</h4>
        <button className="" onClick={() => setExpanded(false)}>chart</button>
        <button className="" onClick={() => setExpanded(true)}>data</button>
        <table className="table-auto">
          <thead>{inboundHead}</thead>
          <tbody>{inboundBody}</tbody>
        </table>
        <table className="table-auto">
          <thead>{withinHead}</thead>
          <tbody>{withinBody}</tbody>
        </table>
        <table className="table-auto">
          <thead>{outboundHead}</thead>
          <tbody>{outboundBody}</tbody>
        </table>
      </div>
    </div>
  )
}

export {Drawer}
