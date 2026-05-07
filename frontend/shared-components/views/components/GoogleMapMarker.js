import React, { memo } from 'react';
import { Marker } from "@react-google-maps/api";
import pin from 'theme/icons/map/pin';

const GoogleMapMarker = ({ fill, enlarge, ...rest }) => {
  const pinUrl = `data:image/svg+xml;utf8,${encodeURIComponent(pin({ fill }))}`;

  const icon = {
    url: pinUrl,
    scaledSize: new window.google.maps.Size(enlarge ? 29 : 24, enlarge ? 36 : 30),
  };

  return (
    <Marker zIndex={enlarge ? 100000 : null} icon={icon} {...rest} />
  );
};

export default memo(GoogleMapMarker);
