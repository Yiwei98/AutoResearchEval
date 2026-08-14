import { AUTO_HARNESS_TRANSFER } from "@/lib/paper-data";

import { ChartFrame } from "./ChartFrame";

const WIDTH = 640;
const HEIGHT = 310;
const LEFT = 54;
const RIGHT = 52;
const TOP = 40;
const BOTTOM = 72;
const PLOT_WIDTH = WIDTH - LEFT - RIGHT;
const PLOT_HEIGHT = HEIGHT - TOP - BOTTOM;
const Y_MIN = -0.02;
const Y_MAX = 0.13;
const Y_TICKS = [0.12, 0.08, 0.04, 0, -0.02] as const;

function xPosition(index: number) {
  return LEFT + (PLOT_WIDTH / (AUTO_HARNESS_TRANSFER.rows.length - 1)) * index;
}

function yPosition(value: number) {
  return TOP + ((Y_MAX - value) / (Y_MAX - Y_MIN)) * PLOT_HEIGHT;
}

function formatGain(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(3)}`;
}

function pathFor(metric: "avg3" | "best3") {
  return AUTO_HARNESS_TRANSFER.rows
    .map((row, index) => `${index === 0 ? "M" : "L"} ${xPosition(index)} ${yPosition(row[metric])}`)
    .join(" ");
}

export function AutoHarnessTransferChart() {
  return (
    <ChartFrame
      id="auto-harness-transfer"
      title="Auto Harness"
      subtitle="Gain of the evolved harness over the original harness on seed tasks, held-out System Optimization tasks, cross-model System Optimization tasks, and unrelated task families."
      summary="The evolved harness improves its seed tasks, held-out LongCat System Optimization tasks, and GPT-5.5 System Optimization tasks. On unrelated task families, avg@3 falls slightly while best@3 rises slightly."
    >
      <div
        className="min-w-0 max-w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        role="region"
        aria-label="Evolved harness transfer line chart"
        tabIndex={0}
      >
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="hidden h-auto w-full max-w-full sm:block"
          role="group"
          aria-labelledby="auto-harness-svg-title auto-harness-svg-desc"
        >
          <title id="auto-harness-svg-title">Gain of the evolved harness over the original harness</title>
          <desc id="auto-harness-svg-desc">
            Two directly labeled series show avg@3 and best@3 gain across seed tasks, held-out System Optimization tasks, GPT-5.5 System Optimization tasks, and other task families.
          </desc>

          <g aria-hidden="true">
            {Y_TICKS.map((tick) => {
              const y = yPosition(tick);
              return (
                <g key={tick}>
                  <line
                    x1={LEFT}
                    x2={WIDTH - RIGHT}
                    y1={y}
                    y2={y}
                    stroke={tick === 0 ? "#8a8a84" : "#e8e8e3"}
                    strokeWidth={tick === 0 ? 1.25 : 1}
                    strokeDasharray={tick === 0 ? "5 5" : undefined}
                  />
                  <text
                    x={LEFT - 10}
                    y={y + 3.5}
                    textAnchor="end"
                    fill="#6b7280"
                    fontSize="10"
                    fontFamily="ui-monospace, monospace"
                  >
                    {tick > 0 ? "+" : ""}{tick.toFixed(2)}
                  </text>
                </g>
              );
            })}
          </g>

          <g aria-label="Legend">
            <line x1="220" x2="246" y1="18" y2="18" stroke="#7755a6" strokeWidth="2.5" />
            <circle cx="233" cy="18" r="4" fill="#7755a6" />
            <text x="252" y="21.5" fill="#4b4b48" fontSize="10" fontWeight="600">
              avg@3
            </text>
            <line
              x1="324"
              x2="350"
              y1="18"
              y2="18"
              stroke="#d8873e"
              strokeWidth="2.5"
              strokeDasharray="6 4"
            />
            <rect x="333" y="14" width="8" height="8" rx="1" fill="#fff" stroke="#d8873e" strokeWidth="2" />
            <text x="356" y="21.5" fill="#4b4b48" fontSize="10" fontWeight="600">
              best@3
            </text>
          </g>

          <path
            d={pathFor("avg3")}
            fill="none"
            stroke="#7755a6"
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={pathFor("best3")}
            fill="none"
            stroke="#d8873e"
            strokeWidth="2.5"
            strokeDasharray="7 5"
            vectorEffect="non-scaling-stroke"
          />

          {AUTO_HARNESS_TRANSFER.rows.map((row, index) => {
            const x = xPosition(index);
            const avgY = yPosition(row.avg3);
            const bestY = yPosition(row.best3);
            return (
              <g key={row.key}>
                <g
                  tabIndex={0}
                  role="img"
                  aria-label={`${row.label}, avg@3 gain ${formatGain(row.avg3)}`}
                >
                  <circle cx={x} cy={avgY} r="5" fill="#7755a6" stroke="#fff" strokeWidth="2" />
                  <text
                    x={x}
                    y={row.avg3 < 0 ? avgY + 18 : avgY - 11}
                    textAnchor="middle"
                    fill="#67458f"
                    fontSize="10"
                    fontWeight="700"
                    fontFamily="ui-monospace, monospace"
                  >
                    {formatGain(row.avg3)}
                  </text>
                </g>
                <g
                  tabIndex={0}
                  role="img"
                  aria-label={`${row.label}, best@3 gain ${formatGain(row.best3)}`}
                >
                  <rect
                    x={x - 4.5}
                    y={bestY - 4.5}
                    width="9"
                    height="9"
                    rx="1"
                    fill="#fff"
                    stroke="#d8873e"
                    strokeWidth="2.5"
                  />
                  <text
                    x={x}
                    y={bestY + (Math.abs(row.best3 - row.avg3) < 0.02 ? 19 : 16)}
                    textAnchor="middle"
                    fill="#b36b2c"
                    fontSize="10"
                    fontWeight="700"
                    fontFamily="ui-monospace, monospace"
                  >
                    {formatGain(row.best3)}
                  </text>
                </g>
                <text x={x} y={HEIGHT - 39} textAnchor="middle" fill="#242421" fontSize="11" fontWeight="600">
                  {row.label}
                </text>
                <text x={x} y={HEIGHT - 22} textAnchor="middle" fill="#6b7280" fontSize="9">
                  {index === 0
                    ? "evolution set"
                    : index === 1
                      ? "same model"
                      : index === 2
                        ? "cross-model"
                        : "cross-family"}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 grid gap-2 sm:hidden" aria-label="Compact evolved harness transfer values">
        {AUTO_HARNESS_TRANSFER.rows.map((row) => (
          <div
            key={row.key}
            className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-3 border-t border-border pt-2 text-xs"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold">{row.label}</p>
              <p className="truncate text-[10px] text-muted">{row.context}</p>
            </div>
            <span className="font-mono tabular-nums text-[#67458f]">{formatGain(row.avg3)}</span>
            <span className="font-mono tabular-nums text-[#b36b2c]">{formatGain(row.best3)}</span>
          </div>
        ))}
        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 pt-1 text-[10px] text-muted">
          <span />
          <span>avg@3</span>
          <span>best@3</span>
        </div>
      </div>

      <table className="sr-only">
        <caption>Evolved harness gains by transfer setting</caption>
        <thead>
          <tr>
            <th scope="col">Setting</th>
            <th scope="col">Context</th>
            <th scope="col">avg@3 gain</th>
            <th scope="col">best@3 gain</th>
          </tr>
        </thead>
        <tbody>
          {AUTO_HARNESS_TRANSFER.rows.map((row) => (
            <tr key={row.key}>
              <th scope="row">{row.label}</th>
              <td>{row.context}</td>
              <td>{formatGain(row.avg3)}</td>
              <td>{formatGain(row.best3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ChartFrame>
  );
}
