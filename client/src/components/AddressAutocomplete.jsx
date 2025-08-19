import React, { useRef, useEffect, useState } from "react";
import { Input } from "./FormComponents";
import "../styles/AddressAutocomplete.css";

const AddressAutocomplete = React.forwardRef(
  (
    {
      value,
      onChange,
      placeholder = "Enter address...",
      error,
      className,
      name,
      ...props
    },
    ref
  ) => {
    const inputRef = useRef(null);
    const autocompleteRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [apiError, setApiError] = useState(false);



    // Load Google Places API
    useEffect(() => {
      const loadGoogleMapsScript = () => {
        if (window.google && window.google.maps && window.google.maps.places) {
          setIsLoaded(true);
          return;
        }

        const script = document.createElement("script");
        const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

        if (!apiKey || apiKey === "your_google_places_api_key_here") {
          console.warn(
            "Google Places API key not configured. Address autocomplete will not work."
          );
          setApiError(true);
          return;
        }

        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          setIsLoaded(true);
          setApiError(false);
        };
        script.onerror = () => {
          console.error("Failed to load Google Maps API");
          setApiError(true);
        };

        document.head.appendChild(script);
      };

      loadGoogleMapsScript();
    }, []);

    // Initialize autocomplete when Google Maps API is loaded
    useEffect(() => {
      if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

      try {
        // Configure autocomplete options for US and Canada
        const autocompleteOptions = {
          types: ["address"],
          componentRestrictions: { country: ["us", "ca"] }, // Allow US and Canadian addresses
          fields: ["formatted_address", "address_components", "geometry"],
        };

        const autocomplete = new window.google.maps.places.Autocomplete(
          inputRef.current,
          autocompleteOptions
        );

        autocompleteRef.current = autocomplete;

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();

          if (place.formatted_address) {
            // Format the address properly
            const formattedAddress = formatAddress(place);

            // Call onChange with the formatted address
            if (onChange) {
              onChange({
                target: {
                  value: formattedAddress,
                  name: props.name || "address",
                },
              });
            }
          }
        });
      } catch (error) {
        console.error("Error initializing Google Places Autocomplete:", error);
      }

      return () => {
        if (autocompleteRef.current) {
          window.google?.maps?.event?.clearInstanceListeners(
            autocompleteRef.current
          );
          autocompleteRef.current = null;
        }
      };
    }, [isLoaded, onChange, props.name]);

    // Format address components into a clean, standardized format
    const formatAddress = (place) => {
      if (place.formatted_address) {
        return place.formatted_address;
      }

      // Fallback: construct address from components
      const components = place.address_components || [];
      let streetNumber = "";
      let streetName = "";
      let city = "";
      let state = "";
      let zipCode = "";
      let country = "";

      components.forEach((component) => {
        const types = component.types;

        if (types.includes("street_number")) {
          streetNumber = component.long_name;
        } else if (types.includes("route")) {
          streetName = component.long_name;
        } else if (types.includes("locality")) {
          city = component.long_name;
        } else if (types.includes("administrative_area_level_1")) {
          state = component.short_name;
        } else if (types.includes("postal_code")) {
          zipCode = component.long_name;
        } else if (types.includes("country")) {
          country = component.short_name;
        }
      });

      // Construct formatted address (works for both US and Canadian formats)
      const addressParts = [];
      if (streetNumber && streetName) {
        addressParts.push(`${streetNumber} ${streetName}`);
      } else if (streetName) {
        addressParts.push(streetName);
      }

      if (city) addressParts.push(city);
      if (state) addressParts.push(state);
      if (zipCode) addressParts.push(zipCode);

      return addressParts.join(", ");
    };



    // Handle manual input changes
    const handleInputChange = (e) => {
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div className="address-autocomplete-wrapper">
        <Input
          ref={(element) => {
            inputRef.current = element;
            if (ref) {
              if (typeof ref === "function") {
                ref(element);
              } else {
                ref.current = element;
              }
            }
          }}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          error={error}
          className={className}
          name={name}
          autoComplete="off"
          {...props}
        />
        {!apiError && isLoaded && (
          <div className="location-tooltip location-granted">
            📍 US & Canada address suggestions
          </div>
        )}
        {apiError && (
          <div className="location-tooltip location-denied">
            ⚠️ Address suggestions unavailable
          </div>
        )}
      </div>
    );
  }
);

AddressAutocomplete.displayName = "AddressAutocomplete";

export default AddressAutocomplete;
