'use client'

import { useEarthOsStore } from '@/stores/earth-os'
import type { ModuleId } from '@/types/earth-os'

const NAV_ITEMS: Array<{ id: ModuleId; label: string; icon: string; description: string }> = [
  { id: 'explorer',     label: 'Explorer',     icon: '🌍', description: 'Unobstructed 3D Earth exploration' },
  { id: 'events',       label: 'Live Events',  icon: '⚡', description: 'Real-time natural hazards & events' },
  { id: 'flights',      label: 'Live Flights', icon: '✈️', description: 'Real-time global aircraft tracking' },
  { id: 'news',         label: 'Live News',    icon: '📰', description: 'Global planetary & disaster news' },
  { id: 'satellite',    label: 'Satellite',    icon: '🛰', description: 'Satellite imagery layers' },
  { id: 'atmosphere',   label: 'Atmosphere',   icon: '🌬', description: 'Air quality & weather' },
  { id: 'history',      label: 'Time Machine', icon: '🕐', description: 'Historical Earth data' },
  { id: 'analytics',    label: 'Analytics',    icon: '📊', description: 'Planetary statistics & dashboard' },
  { id: 'intelligence', label: 'Intelligence', icon: '🤖', description: 'AI-powered planetary reasoning' },
]

export function EosSidebar() {
  const { activeModule, setActiveModule, sidebarCollapsed, setMapMode } = useEarthOsStore()

  return (
    <aside className="eos-sidebar-container" aria-label="Earth OS navigation dock">
      <nav
        className={`eos-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
        aria-label="Earth OS navigation"
      >
        {/* Section Label */}
        {!sidebarCollapsed && (
          <div className="eos-nav-header">
            <span>Modules</span>
          </div>
        )}

        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`eos-nav-item ${activeModule === item.id ? 'active' : ''}`}
            onClick={() => {
              if (item.id === 'explorer') {
                setActiveModule('explorer')
              } else {
                const nextModule = activeModule === item.id ? 'explorer' : item.id
                setActiveModule(nextModule)
                if (nextModule === 'satellite') {
                  setMapMode('satellite')
                }
              }
            }}
            title={sidebarCollapsed ? `${item.label} — ${item.description}` : item.description}
            aria-current={activeModule === item.id ? 'page' : undefined}
          >
            <span className="eos-nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            {!sidebarCollapsed && (
              <span style={{ flex: 1, textAlign: 'left', fontWeight: activeModule === item.id ? 600 : 500 }}>
                {item.label}
              </span>
            )}
          </button>
        ))}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Attribution */}
        {!sidebarCollapsed && (
          <div style={{
            padding: '8px 8px 4px',
            fontSize: 9.5,
            color: 'var(--eos-text-tertiary)',
            borderTop: '1px solid var(--eos-border-subtle)',
            lineHeight: 1.4,
          }}>
            Data: USGS · NASA EONET · FIRMS · Open-Meteo
          </div>
        )}
      </nav>
    </aside>
  )
}
