'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Bus, Clock3, RefreshCw, Route as RouteIcon, Users } from 'lucide-react';
import type { DriverDashboardData } from '@/lib/driverDashboard';

type DriverDashboardProps = {
  initialData: DriverDashboardData;
};

export default function DriverDashboard({ initialData }: DriverDashboardProps) {
  const router = useRouter();
  const [data, setData] = useState<DriverDashboardData | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [requestActionState, setRequestActionState] = useState<Record<string, 'idle' | 'submitting'>>({});
  const [busActionState, setBusActionState] = useState<Record<string, 'idle' | 'submitting'>>({});

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/driver-dashboard', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Failed to load dashboard');
      }

      const payload = (await res.json()) as DriverDashboardData;
      setData(payload);
      router.refresh();
    } catch (err) {
      console.error('Failed to load driver dashboard', err);
      setError('Ntitwashoboye gufungura dashboard y abashoferi. Ongera ugerageze.');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const refreshTimer = window.setInterval(() => {
      loadDashboard();
    }, 20000);

    return () => window.clearInterval(refreshTimer);
  }, [loadDashboard]);

  const busiestRoute = useMemo(() => {
    if (!data?.routeSummaries.length) {
      return null;
    }

    return [...data.routeSummaries].sort((a, b) => b.totalWaiting - a.totalWaiting)[0];
  }, [data]);

  const formatTime = (timestamp: string) =>
    new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));

  const handleRequestAction = async (
    requestId: string,
    status: 'BOARDED' | 'CANCELLED'
  ) => {
    setRequestActionState(prev => ({ ...prev, [requestId]: 'submitting' }));
    setError('');

    try {
      const res = await fetch(`/api/passenger-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        throw new Error('Failed to update request');
      }

      await loadDashboard();
    } catch (err) {
      console.error('Failed to update request status', err);
      setError('Ntitwashoboye kuvugurura ubusabe. Ongera ugerageze.');
    } finally {
      setRequestActionState(prev => ({ ...prev, [requestId]: 'idle' }));
    }
  };

  const handleAdvanceBus = async (busId: string) => {
    setBusActionState(prev => ({ ...prev, [busId]: 'submitting' }));
    setError('');

    try {
      const res = await fetch(`/api/buses/${busId}/advance`, {
        method: 'PATCH',
      });

      if (!res.ok) {
        throw new Error('Failed to advance bus');
      }

      await loadDashboard();
    } catch (err) {
      console.error('Failed to advance bus', err);
      setError('Ntitwashoboye kwimura imodoka kuri stop ikurikira. Ongera ugerageze.');
    } finally {
      setBusActionState(prev => ({ ...prev, [busId]: 'idle' }));
    }
  };

  return (
    <div className="driver-dashboard">
      <div className="driver-toolbar glass-panel">
        <div>
          <p className="driver-eyebrow">Driver Demand Board</p>
          <h2 className="driver-title">Aho abagenzi bategereje ubu</h2>
          {data ? (
            <p className="driver-updated-copy">
              Last updated {formatTime(data.generatedAt)}. Auto-refreshes every 20 seconds.
            </p>
          ) : null}
        </div>
        <button type="button" className="driver-refresh-btn" onClick={loadDashboard} disabled={isLoading}>
          <RefreshCw size={16} className={isLoading ? 'spin-icon' : ''} />
          <span>{isLoading ? 'Birimo kuvugururwa...' : 'Refresh'}</span>
        </button>
      </div>

      {error ? <div className="glass-panel driver-error">{error}</div> : null}

      {data ? (
        <>
          <section className="driver-metrics">
            <div className="glass-panel metric-card">
              <Users size={20} />
              <span className="metric-value">{data.totalWaitingRequests}</span>
              <span className="metric-label">Waiting requests</span>
            </div>
            <div className="glass-panel metric-card">
              <Bus size={20} />
              <span className="metric-value">
                {data.routeSummaries.reduce((sum, route) => sum + route.activeBuses, 0)}
              </span>
              <span className="metric-label">Active buses</span>
            </div>
            <div className="glass-panel metric-card">
              <RouteIcon size={20} />
              <span className="metric-value">{data.routeSummaries.length}</span>
              <span className="metric-label">Routes on board</span>
            </div>
            <div className="glass-panel metric-card">
              <Activity size={20} />
              <span className="metric-value">{busiestRoute?.name ?? 'None'}</span>
              <span className="metric-label">Highest pressure route</span>
            </div>
          </section>

          <section className="driver-content-grid">
            <div className="driver-route-column">
              {data.routeSummaries.map(route => (
                <article key={route.id} className="glass-panel driver-route-card">
                  <div className="driver-route-top">
                    <div>
                      <h3>{route.name}</h3>
                      <p>{route.description}</p>
                    </div>
                    <div className={`driver-demand-pill ${route.totalWaiting > 0 ? 'active' : ''}`}>
                      {route.totalWaiting} waiting
                    </div>
                  </div>

                  <div className="driver-route-meta">
                    <span>
                      <Bus size={15} />
                      {route.activeBuses} active bus{route.activeBuses > 1 ? 'es' : ''}
                    </span>
                    <span>
                      <Clock3 size={15} />
                      {route.currentStations.length
                        ? `Current: ${route.currentStations.join(', ')}`
                        : 'Current stop unknown'}
                    </span>
                  </div>

                  <div className="driver-bus-list">
                    {route.buses.map(bus => (
                      <div key={bus.id} className="driver-bus-row">
                        <div>
                          <span className="driver-section-label">Bus position</span>
                          <strong>{bus.currentStationName}</strong>
                          <p>Next: {bus.nextStationName}</p>
                        </div>
                        <button
                          type="button"
                          className="driver-action-btn"
                          disabled={busActionState[bus.id] === 'submitting'}
                          onClick={() => handleAdvanceBus(bus.id)}
                        >
                          {busActionState[bus.id] === 'submitting' ? 'Moving...' : 'Next stop'}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="driver-stop-line">
                    {route.stops.map(stop => (
                      <div
                        key={stop.stationId}
                        className={`driver-stop-chip ${stop.waitingCount > 0 ? 'has-demand' : ''} ${stop.isCurrentBusStop ? 'is-current' : ''}`}
                      >
                        <span className="driver-stop-name">{stop.name}</span>
                        <span className="driver-stop-count">
                          {stop.waitingCount > 0 ? `${stop.waitingCount} waiting` : 'clear'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="driver-hotspots">
                    <span className="driver-section-label">Priority stops</span>
                    {route.hotspots.length > 0 ? (
                      <div className="driver-hotspot-list">
                        {route.hotspots.slice(0, 3).map(stop => (
                          <div key={stop.stationId} className="driver-hotspot-item">
                            <strong>{stop.name}</strong>
                            <span>{stop.waitingCount} waiting</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="driver-empty-copy">No current passenger pressure on this route.</p>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <aside className="glass-panel driver-recent-panel">
              <div className="driver-recent-header">
                <h3>Waiting passenger requests</h3>
                <span>{new Date(data.generatedAt).toLocaleTimeString()}</span>
              </div>

              <div className="driver-recent-list">
                {data.recentRequests.length > 0 ? (
                  data.recentRequests.map(request => (
                    <div key={request.id} className="driver-recent-item">
                      <div className="driver-request-main">
                        <strong>{request.originName}</strong>
                        <p>{request.destinationName}</p>
                        <div className="driver-request-routes">
                          {request.recommendedRoutes.length > 0 ? (
                            request.recommendedRoutes.map(routeName => (
                              <span key={routeName} className="driver-route-tag">
                                {routeName}
                              </span>
                            ))
                          ) : (
                            <span className="driver-route-tag muted">No active route match</span>
                          )}
                        </div>
                      </div>
                      <div className="driver-request-side">
                        <span>{formatTime(request.timestamp)}</span>
                        <div className="driver-request-actions">
                          <button
                            type="button"
                            className="driver-action-btn success"
                            disabled={requestActionState[request.id] === 'submitting'}
                            onClick={() => handleRequestAction(request.id, 'BOARDED')}
                          >
                            Boarded
                          </button>
                          <button
                            type="button"
                            className="driver-action-btn muted"
                            disabled={requestActionState[request.id] === 'submitting'}
                            onClick={() => handleRequestAction(request.id, 'CANCELLED')}
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="driver-empty-copy">No waiting requests left. Nice clean board.</p>
                )}
              </div>
            </aside>
          </section>
        </>
      ) : null}
    </div>
  );
}
