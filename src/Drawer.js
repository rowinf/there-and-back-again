import React from 'react';

const Drawer = ({ activeFeature, features }) => {
  return (
    <div className="relative text-white grid grid-rows-2">
      <h4>
        {activeFeature.name}
      </h4>
      <p>Census total: {activeFeature.total}</p>
      <div>
        {features.map((feat, i) => <div key={i}>{feat.name}, {feat.total}</div>)}
      </div>
    </div>
  )
}

export {Drawer}
