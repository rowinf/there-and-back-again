import React from 'react';

const Drawer = ({ activeFeature, features }) => {
  let headRows = []
  let bodyRows = []
  activeFeature.totals.forEach((cells, i) => {
    let row = (
      <tr key={i}>
        {cells.map((cell, j) => { return i === 0 ? <th key={j}>{cell}</th> : <td key={j}>{cell}</td>} )}
      </tr>
    )
    if (i === 0) { headRows.push(row) }
    else { bodyRows.push(row) }
  })
  return (
    <div className="text-white overflow-y-auto">
      <div className="m-2 my-4">
        <table>
          <thead>{headRows}</thead>
          <tbody>{bodyRows}</tbody>
        </table>
      </div>
      <div className="m-2 h-64 overflow-y-auto">
        {!features.length && 'No commuters in the provided data'}
        {features.length && <table><thead><tr><th>Statistical Area</th><th>Count</th></tr></thead><tbody>{features.map((feat, i) => <tr key={i}><td>{feat.name}</td><td>{feat.total}</td></tr>)}</tbody></table>}
      </div>
    </div>
  )
}

export {Drawer}
