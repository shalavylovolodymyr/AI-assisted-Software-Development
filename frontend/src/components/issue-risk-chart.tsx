import { ChartNoAxesCombined } from "lucide-react";
import { Link } from "react-router-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Risk } from "../types";
import {
  chartColors,
  chartTick,
  chartTooltip,
  chartTooltipText,
} from "./chart-theme";

export function IssueRiskChart({ assessments }: { assessments: Risk[] }) {
  return (
    <div className="issue-risk-chart" aria-label="Issue risk trend">
      <div className="chart-subheading">
        <h3>Risk trend</h3>
        <Link to="/charts" aria-label="View portfolio charts">
          <ChartNoAxesCombined size={14} />
          <span>Charts</span>
        </Link>
      </div>
      <ResponsiveContainer width="100%" height={145}>
        <LineChart
          data={assessments.map((risk, index) => ({
            name: `Review ${index + 1}`,
            score: risk.score,
          }))}
          margin={{ left: -18, right: 14, top: 8, bottom: 0 }}
        >
          <CartesianGrid stroke={chartColors.grid} vertical={false} />
          <XAxis
            dataKey="name"
            tick={chartTick}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 25]}
            ticks={[0, 10, 25]}
            tick={chartTick}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={chartTooltip}
            itemStyle={chartTooltipText}
            labelStyle={chartTooltipText}
          />
          <Line
            dataKey="score"
            name="Risk score"
            type="monotone"
            stroke={chartColors.amber}
            strokeWidth={1.8}
            dot={
              assessments.length === 1
                ? { r: 3, fill: chartColors.amber, strokeWidth: 0 }
                : false
            }
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
