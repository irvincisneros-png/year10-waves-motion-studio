import type { EnergyLedger } from '../../science/optics';

export function EnergyLedgerView({ ledger }: { ledger: EnergyLedger }) {
  const pct = (value: number) => Math.round(value * 100);
  return (
    <div className="energy-ledger" data-control-id="optics.energy-ledger-display" aria-label="Energy ledger: transmitted, reflected, absorbed" role="status">
      <div className="energy-ledger__bar" aria-hidden="true">
        <span className="energy-ledger__transmitted" style={{ width: `${pct(ledger.transmitted)}%` }}>T {pct(ledger.transmitted)}%</span>
        <span className="energy-ledger__reflected" style={{ width: `${pct(ledger.reflected)}%` }}>R {pct(ledger.reflected)}%</span>
        <span className="energy-ledger__absorbed" style={{ width: `${pct(ledger.absorbed)}%` }}>A {pct(ledger.absorbed)}%</span>
      </div>
      <table>
        <caption>Modelled optical energy ledger</caption>
        <thead><tr><th scope="col">Transmitted</th><th scope="col">Reflected</th><th scope="col">Absorbed</th><th scope="col">Total</th></tr></thead>
        <tbody><tr><td>{pct(ledger.transmitted)}%</td><td>{pct(ledger.reflected)}%</td><td>{pct(ledger.absorbed)}%</td><td>{pct(ledger.transmitted + ledger.reflected + ledger.absorbed)}%</td></tr></tbody>
      </table>
    </div>
  );
}
