import React, { memo, useEffect, useRef, useState } from 'react';
import { isDefined } from "shared-components/utils/lo";
import TextInput from "shared-components/views/form/TextInput";
import { useSelector } from "react-redux";
import { dictionarySelectors } from "store/ducks/dictionary";
import { getVentureAddress } from "shared-components/utils/venture";

const findAddressComponent = (place, name) =>
  place.address_components.find(c => c.types.includes(name))?.long_name;

const GoogleMapsAutocomplete = ({ values, setFieldValue, ...rest }) => {
  const [inputValue, setInputValue] = useState(getVentureAddress(values, ''));
  const inputRef = useRef();
  const geography = useSelector(dictionarySelectors.getGeography());

  useEffect(() => {
    const addressParts = [values.address, values.city, values.region, values.zipCode, values.country?.title]
      .filter(val => val);
    setInputValue(addressParts.join(', '));
  }, [values.address, values.city, values.region, values.zipCode, values.country]);

  useEffect(() => {
    if (window.google) {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ["address"],
      });
      autocomplete.setFields(['address_components', 'geometry', 'name']);
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        const city = findAddressComponent(place, 'locality')
        setFieldValue('city', city || '');
        const region = findAddressComponent(place, 'administrative_area_level_1');
        setFieldValue('region', region || '');
        const zipCode = findAddressComponent(place, 'postal_code');
        setFieldValue('zipCode', zipCode || '');
        const street = findAddressComponent(place, 'route');
        const number = findAddressComponent(place, 'street_number');
        const address = `${isDefined(number) ? `${number} ` : ''}${street || ''}`;
        setFieldValue('address', address);
        const selectedCountry = place.address_components.find(c => c.types.includes('country'))?.short_name;
        const country = geography.find(c => !!selectedCountry && c.code === selectedCountry);
        if (isDefined(country)) {
          setFieldValue('country', country);
        }
        setFieldValue('lat', place.geometry.location.lat());
        setFieldValue('lng', place.geometry.location.lng());

        const addressParts = [address, city, region, zipCode, country?.title].filter(val => val);
        setInputValue(addressParts.join(', '));
      });
    }
  }, [window.google]);

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  return (
    <TextInput
      inputRef={inputRef}
      fullWidth
      value={inputValue}
      onChange={handleInputChange}
      placeholder="Enter an address"
      inputProps={{ maxLength: 250 }}
      {...rest}
    />
  );
};

export default memo(GoogleMapsAutocomplete);
