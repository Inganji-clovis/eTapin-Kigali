'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Bus, ChevronRight, Clock, Map } from 'lucide-react';

type Station = {
  id: string;
  name: string;
  isHub: boolean;
};

type StopData = {
  station: Station;
  order: number;
};

type RouteData = {
  id: string;
  name: string;
  description: string;
  stops: StopData[];
  buses: Array<{
    id: string;
    capacity: number;
    currentStation: Station | null;
  }>;
};

type RequestFeedback = {
  requestId: string;
  waitingCount: number;
  originName: string;
  destinationName: string;
};

export default function PassengerForm() {
  const searchParams = useSearchParams();
  const [hubs, setHubs] = useState<Station[]>([]);
  const [stops, setStops] = useState<Station[]>([]);
  
  const [originId, setOriginId] = useState('');
  const [destinationId, setDestinationId] = useState('');
  
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [searchError, setSearchError] = useState('');
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  const [requestState, setRequestState] = useState<Record<string, 'idle' | 'submitting' | 'done' | 'cancelling' | 'cancelled'>>({});
  const [requestError, setRequestError] = useState<Record<string, string>>({});
  const [requestFeedback, setRequestFeedback] = useState<Record<string, RequestFeedback>>({});

  useEffect(() => {
    fetch('/api/stations')
      .then(async res => {
        if (!res.ok) {
          throw new Error('Failed to load stations');
        }
        return res.json();
      })
      .then(data => {
        setHubs(data.hubs || []);
        setStops(data.stops || []);
        setLoadError('');
      })
      .catch(err => {
        console.error('Failed to load stations', err);
        setLoadError('Ntitwashoboye kubona ibyapa. Ongera ugerageze mu kanya.');
      });
  }, []);

  useEffect(() => {
    const requestedOriginId = searchParams.get('originId');
    if (!requestedOriginId || originId) {
      return;
    }

    const allStations = [...hubs, ...stops];
    const stationExists = allStations.some(station => station.id === requestedOriginId);
    if (stationExists) {
      setOriginId(requestedOriginId);
    }
  }, [hubs, originId, searchParams, stops]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originId || !destinationId) return;
    
    setIsLoading(true);
    setHasSearched(true);
    setSearchError('');
    setRoutes([]);
    setExpandedRouteId(null);
    setRequestState({});
    setRequestError({});
    setRequestFeedback({});
    
    try {
      const res = await fetch(`/api/routes?originId=${originId}&destinationId=${destinationId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch routes');
      }
      const data = await res.json();
      setRoutes(data);
    } catch (err) {
      console.error('Failed to find routes', err);
      setSearchError('Habaye ikibazo mu gushaka imodoka. Ongera ugerageze.');
    } finally {
      setIsLoading(false);
    }
  };

  type LocationSelectorProps = {
    label: string;
    value: string;
    onChange: (value: string) => void;
    disabledId: string;
  };

  const LocationSelector = ({ label, value, onChange, disabledId }: LocationSelectorProps) => (
    <div className="input-group">
      <label>{label}</label>
      <div className="custom-select-wrapper">
        <MapPin className="select-icon" size={18} />
        <select 
          value={value} 
          onChange={e => onChange(e.target.value)}
          required
          className="modern-select with-icon"
        >
          <option value="" disabled>Hitamo aho uri...</option>
          <optgroup label="Ibyapa Binini (Major Hubs)">
            {hubs.map(station => (
              <option key={station.id} value={station.id} disabled={station.id === disabledId}>
                {station.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Ibyapa Bito (Bus Stops)">
            {stops.map(station => (
              <option key={station.id} value={station.id} disabled={station.id === disabledId}>
                {station.name}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
    </div>
  );

  const getRouteInsight = (route: RouteData) => {
    const activeBus = route.buses[0] ?? null;
    const currentStationId = activeBus?.currentStation?.id ?? null;
    const currentStop = route.stops.find(stop => stop.station.id === currentStationId) ?? null;
    const originStop = route.stops.find(stop => stop.station.id === originId) ?? null;
    const destinationStop = route.stops.find(stop => stop.station.id === destinationId) ?? null;

    if (!originStop || !destinationStop) {
      return {
        summary: 'Ntitwashoboye gusobanura uru rugendo neza.',
        detail: 'Hari amakuru make kuri uyu murongo.',
        statusTone: 'neutral',
        spanStops: 0,
      };
    }

    const spanStops = Math.max(destinationStop.order - originStop.order, 0);

    if (!activeBus || !currentStop) {
      return {
        summary: 'Nta modoka ikurikiranywe kuri uyu murongo ubu.',
        detail: 'Uyu murongo urahuye n urugendo rwawe ariko nta modoka dufiteho amakuru ubu.',
        statusTone: 'neutral',
        spanStops,
      };
    }

    if (currentStop.order < originStop.order) {
      const stopsAway = originStop.order - currentStop.order;
      return {
        summary: `Imodoka iri hafi ya ${currentStop.station.name}.`,
        detail: `Iracyafite ibyapa ${stopsAway} mbere yo kugera aho wuririra i ${originStop.station.name}.`,
        statusTone: 'good',
        spanStops,
      };
    }

    if (currentStop.order === originStop.order) {
      return {
        summary: `Imodoka iri aho wuririra kuri ${originStop.station.name}.`,
        detail: `Uva kuri iyi stop ugana ${destinationStop.station.name} mu byapa ${spanStops}.`,
        statusTone: 'good',
        spanStops,
      };
    }

    if (currentStop.order <= destinationStop.order) {
      const remainingStops = destinationStop.order - currentStop.order;
      return {
        summary: `Imodoka iri hagati y urugendo rwawe, kuri ${currentStop.station.name}.`,
        detail: `Yarenze aho wuririra, kandi isigaje ibyapa ${remainingStops} mbere yo kugera aho ujya.`,
        statusTone: 'warn',
        spanStops,
      };
    }

    return {
      summary: `Imodoka iri nyuma ya ${destinationStop.station.name}.`,
      detail: 'Iyi modoka yakomeje kurenga aho wajyaga, bityo ushobora gutegereza indi ikurikira.',
      statusTone: 'warn',
      spanStops,
    };
  };

  const handlePassengerRequest = async (routeId: string) => {
    if (!originId || !destinationId) {
      return;
    }

    setRequestState(prev => ({ ...prev, [routeId]: 'submitting' }));
    setRequestError(prev => ({ ...prev, [routeId]: '' }));
    setRequestFeedback(prev => {
      const next = { ...prev };
      delete next[routeId];
      return next;
    });

    try {
      const res = await fetch('/api/passenger-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originId,
          destinationId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create request');
      }

      setRequestFeedback(prev => ({
        ...prev,
        [routeId]: {
          requestId: data.requestId,
          waitingCount: data.waitingCount,
          originName: data.originName,
          destinationName: data.destinationName,
        },
      }));
      setRequestState(prev => ({ ...prev, [routeId]: 'done' }));
    } catch (err) {
      console.error('Failed to create passenger request', err);
      setRequestError(prev => ({
        ...prev,
        [routeId]: 'Ntitwashoboye kohereza ubusabe bwawe. Ongera ugerageze.',
      }));
      setRequestState(prev => ({ ...prev, [routeId]: 'idle' }));
    }
  };

  const handleCancelPassengerRequest = async (routeId: string) => {
    const activeRequest = requestFeedback[routeId];
    if (!activeRequest) {
      return;
    }

    setRequestState(prev => ({ ...prev, [routeId]: 'cancelling' }));
    setRequestError(prev => ({ ...prev, [routeId]: '' }));

    try {
      const res = await fetch(`/api/passenger-requests/${activeRequest.requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });

      if (!res.ok) {
        throw new Error('Failed to cancel request');
      }

      setRequestState(prev => ({ ...prev, [routeId]: 'cancelled' }));
    } catch (err) {
      console.error('Failed to cancel passenger request', err);
      setRequestError(prev => ({
        ...prev,
        [routeId]: 'Ntitwashoboye gukuraho ubusabe bwawe. Ongera ugerageze.',
      }));
      setRequestState(prev => ({ ...prev, [routeId]: 'done' }));
    }
  };

  return (
    <div className="passenger-app-container">
      {/* Interactive Form */}
      <motion.form 
        onSubmit={handleSearch} 
        className="trip-form glass-panel"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="form-header">
          <Map className="text-yellow" size={24} />
          <h2 className="form-title">Teganya Urugendo</h2>
        </div>
        
        <div className="selectors-container">
          <LocationSelector 
            label="Ahantu Uva (Origin)" 
            value={originId} 
            onChange={setOriginId} 
            disabledId={destinationId} 
          />
          
          <div className="connector-icon">
            <Navigation size={20} className="text-blue" />
          </div>

          <LocationSelector 
            label="Ahantu Ujya (Destination)" 
            value={destinationId} 
            onChange={setDestinationId} 
            disabledId={originId} 
          />
        </div>

        {loadError ? <p className="status-message error-message">{loadError}</p> : null}

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit" 
          className="search-btn action-btn"
          disabled={!originId || !destinationId || isLoading}
        >
          {isLoading ? 'Gushaka... (Searching...)' : 'Shaka Imodoka'}
        </motion.button>
      </motion.form>

      {/* Results Section */}
      <AnimatePresence>
        {hasSearched && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="results-container"
          >
            {isLoading ? (
              <div className="loader-container glass-panel">
                <div className="spinner"></div>
                <p>Birari Gushaka...</p>
              </div>
            ) : searchError ? (
              <div className="no-routes glass-panel">
                <p>{searchError}</p>
              </div>
            ) : routes.length > 0 ? (
              <div className="routes-list">
                <h3 className="results-title">Imirongo Ihuye n'Urugendo (Matching Routes)</h3>
                
                {routes.map((route, i) => (
                  <motion.div 
                    key={route.id} 
                    className="route-card glass-panel"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    {(() => {
                      const insight = getRouteInsight(route);
                      const currentStationName = route.buses[0]?.currentStation?.name;
                      const isExpanded = expandedRouteId === route.id;
                      const submitState = requestState[route.id] ?? 'idle';
                      const routeRequestError = requestError[route.id];
                      const routeRequestFeedback = requestFeedback[route.id];

                      return (
                        <>
                    <div className="route-header">
                      <div className="route-badge">
                        <Bus size={20} />
                        <h4>{route.name}</h4>
                      </div>
                      <span className="route-desc">{route.description}</span>
                    </div>

                    <div className={`route-status route-status-${insight.statusTone}`}>
                      <p className="route-status-title">{insight.summary}</p>
                      <p className="route-status-detail">{insight.detail}</p>
                    </div>
                    
                    {/* Animated Subway-style Tracker */}
                    <div className="route-tracker">
                      <div className="tracker-line"></div>
                      <div className="stops-container">
                        {route.stops.map((stop, index) => {
                          const isOrigin = stop.station.id === originId;
                          const isDest = stop.station.id === destinationId;
                          const isBusHere = route.buses[0]?.currentStation?.id === stop.station.id;

                          return (
                            <div key={stop.station.id} className={`tracker-stop ${isOrigin ? 'is-origin' : ''} ${isDest ? 'is-dest' : ''}`}>
                              <div className="stop-marker">
                                {isBusHere && (
                                  <motion.div 
                                    className="live-bus-icon"
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                  >
                                    <Bus size={18} />
                                  </motion.div>
                                )}
                              </div>
                              <span className="stop-name">{stop.station.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="route-actions">
                      <div className="time-est">
                        <Clock size={16} />
                        <span>
                          {currentStationName
                            ? `Bus iri kuri ${currentStationName}`
                            : 'Nta station y imodoka iramenyekana'}
                        </span>
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="book-btn action-btn"
                        type="button"
                        onClick={() =>
                          setExpandedRouteId(isExpanded ? null : route.id)
                        }
                      >
                        {isExpanded ? 'Hisha Ibisobanuro' : 'Reba Inzira'}
                        <ChevronRight size={18} />
                      </motion.button>
                    </div>

                    {isExpanded ? (
                      <div className="route-details">
                        <div className="route-detail-item">
                          <span className="route-detail-label">Aho uva</span>
                          <strong>{route.stops.find(stop => stop.station.id === originId)?.station.name}</strong>
                        </div>
                        <div className="route-detail-item">
                          <span className="route-detail-label">Aho ujya</span>
                          <strong>{route.stops.find(stop => stop.station.id === destinationId)?.station.name}</strong>
                        </div>
                        <div className="route-detail-item">
                          <span className="route-detail-label">Ibyapa biri hagati</span>
                          <strong>{insight.spanStops}</strong>
                        </div>
                        <div className="route-detail-item route-detail-item-wide">
                          <span className="route-detail-label">Icyo wakora gikurikira</span>
                          <strong>
                            {insight.statusTone === 'good'
                              ? 'Uyu murongo uracyari mwiza kuri uru rugendo. Wakomeza kuwukurikira.'
                              : 'Uyu murongo urahuye n aho ushaka kujya, ariko imodoka iri imbere cyane. Tegereza indi cyangwa uhindure aho uhera.'}
                          </strong>
                        </div>
                        <div className="route-detail-item route-detail-item-wide route-request-panel">
                          <span className="route-detail-label">Saba ko station ibara urugendo rwawe</span>
                          <p className="route-request-copy">
                            Ohereza ubusabe bwawe kugira ngo iyi station igaragaze ko hari umugenzi ushaka kujya kuri uru rugendo.
                          </p>
                          <button
                            type="button"
                            className="request-btn"
                            onClick={() => handlePassengerRequest(route.id)}
                            disabled={submitState === 'submitting' || submitState === 'done' || submitState === 'cancelling'}
                          >
                            {submitState === 'submitting'
                              ? 'Birimo koherezwa...'
                              : submitState === 'done' || submitState === 'cancelling'
                                ? 'Ubusabe bwoherejwe'
                                : 'Ohereza Ubusabe'}
                          </button>
                          {routeRequestError ? (
                            <p className="request-message request-message-error">{routeRequestError}</p>
                          ) : null}
                          {routeRequestFeedback && submitState !== 'cancelled' ? (
                            <div className="request-message request-message-success">
                              <strong>Ubusabe bwawe bwakiriwe.</strong>
                              <span>
                                Hari abagenzi {routeRequestFeedback.waitingCount} bategereje kuri {routeRequestFeedback.originName} bajya kuri {routeRequestFeedback.destinationName}.
                              </span>
                              <button
                                type="button"
                                className="request-link-btn"
                                onClick={() => handleCancelPassengerRequest(route.id)}
                                disabled={submitState === 'cancelling'}
                              >
                                {submitState === 'cancelling' ? 'Birimo gukurwaho...' : 'Kuraho ubusabe'}
                              </button>
                            </div>
                          ) : null}
                          {submitState === 'cancelled' ? (
                            <div className="request-message request-message-muted">
                              <strong>Ubusabe bwakuweho.</strong>
                              <span>Driver board ntikizongera kubara uru rugendo rwawe.</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                        </>
                      );
                    })()}
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div className="no-routes glass-panel" initial={{ scale: 0.95 }}>
                <Bus size={40} className="opacity-50 mx-auto mb-4" />
                <p>Mbabarira, nta modoka ihari iva aho watoranyije ijya aho ushaka.</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
