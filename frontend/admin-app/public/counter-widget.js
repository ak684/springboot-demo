(function() {
    // Helper function to format counter values based on settings
    function formatCounterValue(data) {
        if (!data || data.currentValue === null || data.currentValue === undefined) {
            return '0';
        }

        // Use pre-formatted value from backend if available
        if (data.formattedCurrentValue) {
            return data.formattedCurrentValue;
        }

        // Fallback to client-side formatting
        var value = parseFloat(data.currentValue);
        
        // Handle show decimals setting
        if (!data.showDecimals) {
            value = Math.round(value);
        }

        // Format based on numberFormat setting or browser locale
        var options = {
            minimumFractionDigits: data.showDecimals ? 2 : 0,
            maximumFractionDigits: data.showDecimals ? 2 : 0
        };

        if (data.numberFormat === 'US') {
            return value.toLocaleString('en-US', options);
        } else if (data.numberFormat === 'EU') {
            return value.toLocaleString('de-DE', options);
        } else {
            // Use browser's default locale
            return value.toLocaleString(undefined, options);
        }
    }

    function trimTrailingSlash(url) {
        if (!url) {
            return url;
        }
        return url.endsWith('/') ? url.slice(0, -1) : url;
    }

    const scriptOrigin = (function() {
        try {
            if (document.currentScript) {
                return new URL(document.currentScript.src).origin;
            }
        } catch (error) {
            console.warn('ImpactCounter: Unable to determine script origin, falling back to window location.', error);
        }
        return window.location.origin;
    })();

    function resolveBaseUrl(isProduction) {
        if (window.__BRANDING__ && window.__BRANDING__.appBaseUrl) {
            return trimTrailingSlash(window.__BRANDING__.appBaseUrl);
        }
        if (scriptOrigin) {
            return trimTrailingSlash(scriptOrigin);
        }
        const fallbackOrigin = isProduction ? window.location.origin : 'http://localhost:9000';
        return trimTrailingSlash(fallbackOrigin);
    }

    window.ImpactCounter = {
        init: function(counterId, elementId) {
            // Auto-detect production vs development
            const isProduction = !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');
            const defaultBaseUrl = resolveBaseUrl(isProduction);
            return this.initWithBaseUrl(counterId, elementId, defaultBaseUrl);
        },

        initWithBaseUrl: function(counterId, elementId, baseUrl) {
            const element = document.getElementById(elementId);
            if (!element) {
                console.error('ImpactCounter: Element with id "' + elementId + '" not found');
                return;
            }

            // Use same detection logic as init() if no baseUrl provided
            if (!baseUrl) {
                const isProduction = !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');
                baseUrl = resolveBaseUrl(isProduction);
            }

            console.log('🔧 ImpactCounter: Using base URL:', baseUrl);
            
            const eventSourceUrl = baseUrl + '/api/v1/public/counters/' + counterId + '/stream';
            console.log('📡 ImpactCounter: Connecting to:', eventSourceUrl);

            try {
                const eventSource = new EventSource(eventSourceUrl);
eventSource.addEventListener('counter-update', function(event) {
    console.log('📨 Received counter-update event:', event.data);
    try {
        const data = JSON.parse(event.data);
        console.log('✅ Parsed counter data:', data);
        
        // Format the counter value based on settings
        const formattedValue = formatCounterValue(data);
        
        // Minimal HTML structure - easily stylable by parent site
        element.innerHTML =
            '<div class="impact-counter">' +
                '<div class="impact-counter-name">' + (data.name || '') + '</div>' +
                '<div class="impact-counter-value">' + formattedValue + '</div>' +
            '</div>';
        console.log('✅ Counter updated successfully');
    } catch (parseError) {
        console.error('❌ Error parsing counter data:', parseError);
        console.error('❌ Raw data was:', event.data);
        element.innerHTML = '<div class="impact-counter-error">Error parsing counter data</div>';
    }
});
                

                // Also listen to the default message event as fallback
                eventSource.onmessage = function(event) {
                    console.log('📨 Received default SSE message:', event.data);
                    try {
                        const data = JSON.parse(event.data);
                        console.log('✅ Parsed data:', data);
                        
                        // Format the counter value based on settings
                        const formattedValue = formatCounterValue(data);
                        
                        element.innerHTML =
                            '<div class="impact-counter">' +
                                '<div class="impact-counter-name">' + (data.name || '') + '</div>' +
                                '<div class="impact-counter-value">' + formattedValue + '</div>' +
                            '</div>';
                        console.log('✅ Counter updated successfully');
                    } catch (parseError) {
                        console.error('❌ Error parsing counter data:', parseError);
                        element.innerHTML = '<div class="impact-counter-error">Error parsing counter data</div>';
                    }
                };

                eventSource.onerror = function(event) {
                    console.error('❌ ImpactCounter: EventSource error:', event);
                    console.error('❌ EventSource readyState:', eventSource.readyState);
                    console.error('❌ EventSource url:', eventSource.url);
                    
                    element.innerHTML = '<div class="impact-counter-error">Counter temporarily unavailable</div>';

                    // Try to reconnect after a delay if connection is closed
                    if (eventSource.readyState === EventSource.CLOSED) {
                        console.log('🔄 ImpactCounter: Connection closed, attempting to reconnect in 5 seconds...');
                        setTimeout(function() {
                            console.log('🔄 ImpactCounter: Reconnecting...');
                            window.ImpactCounter.initWithBaseUrl(counterId, elementId, baseUrl);
                        }, 5000);
                    }
                };

                eventSource.onopen = function(event) {
                    console.log('✅ ImpactCounter: Connected to counter stream');
                    element.innerHTML = '<div class="impact-counter">Connecting...</div>';
                };

                // Store reference for cleanup if needed
                element._impactCounterEventSource = eventSource;

            } catch (error) {
                console.error('❌ ImpactCounter: Failed to initialize:', error);
                element.innerHTML = '<div class="impact-counter-error">Failed to initialize counter</div>';
            }
        },

        // Method to cleanup a counter (useful for SPAs)
        cleanup: function(elementId) {
            const element = document.getElementById(elementId);
            if (element && element._impactCounterEventSource) {
                element._impactCounterEventSource.close();
                delete element._impactCounterEventSource;
            }
        }
    };

    // Auto-initialize counters with data attributes
    document.addEventListener('DOMContentLoaded', function() {
        const autoCounters = document.querySelectorAll('[data-impact-counter-id]');
        autoCounters.forEach(function(element) {
            const counterId = element.getAttribute('data-impact-counter-id');
            let baseUrl = element.getAttribute('data-base-url');
            if (!baseUrl) {
                // Use same detection logic as init()
                const isProduction = !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');
                baseUrl = resolveBaseUrl(isProduction);
            }
            if (counterId && element.id) {
                window.ImpactCounter.initWithBaseUrl(counterId, element.id, baseUrl);
            }
        });
    });
})();
