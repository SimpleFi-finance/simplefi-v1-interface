/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';

const AssetLogo = ({ logo, height = '25px', width = '25px' }) => {
  const [image, setImage] = useState(null)
  useEffect(() => {
    if (logo) {
      import(`../assets/logos/${logo}`).then(img => {
        setImage(img.default)
      });
    }
  }, [logo]);
  return (
    <img src={image} alt={logo} style={{
      height: height,
      width: width,
      objectFit: 'contain',
    }} />
  )
}

export default AssetLogo