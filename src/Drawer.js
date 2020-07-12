import React from 'react';

const Drawer = ({ activeFeature, features }) => {
  return (
    <div className="text-white overflow-y-auto">
      <div className="m-2 my-4">
        <h4>
          {activeFeature.name}
        </h4>
        <p>Census total: {activeFeature.total}</p>
        <p>work at home: {activeFeature.workAtHome}</p>
      </div>
      <div className="m-2 h-64 overflow-y-auto">
        {!features.length && 'No commuters in the provided data'}
        {features.length && <table><thead><tr><th>Statistical Area</th><th>Count</th></tr></thead><tbody>{features.map((feat, i) => <tr key={i}><td>{feat.name}</td><td>{feat.total}</td></tr>)}</tbody></table>}
      </div>
    </div>
  )
}

export {Drawer}
