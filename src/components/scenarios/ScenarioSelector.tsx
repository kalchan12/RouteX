import type { ScenarioConfig } from '../../types';

interface ScenarioSelectorProps {
  scenarios: ScenarioConfig[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled: boolean;
}

export function ScenarioSelector({ scenarios, selectedId, onSelect, disabled }: ScenarioSelectorProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <label style={{ fontSize: 13, color: '#94a3b8', whiteSpace: 'nowrap' }}>Scenario:</label>
      <select
        value={selectedId}
        onChange={(e) => onSelect(e.target.value)}
        disabled={disabled}
        style={{
          padding: '6px 12px',
          background: '#1e293b',
          color: '#eaeaea',
          border: '1px solid #334155',
          borderRadius: 6,
          fontSize: 13,
          cursor: disabled ? 'not-allowed' : 'pointer',
          minWidth: 180,
        }}
      >
        {scenarios.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} ({s.duration}s)
          </option>
        ))}
      </select>
    </div>
  );
}