import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'

export type ComparisonRadarSeries = {
  name: string
  color: string
  /** One value per axis (0-100), aligned by index with the `axes` prop. */
  values: number[]
}

type ComparisonRadarChartProps = {
  axes: string[]
  series: ComparisonRadarSeries[]
  height?: number
  className?: string
}

export function ComparisonRadarChart({
  axes,
  series,
  height = 320,
  className = '',
}: ComparisonRadarChartProps) {
  if (axes.length === 0 || series.length === 0) {
    return (
      <div
        className={`flex items-center justify-center text-sm text-relaive-gray ${className}`}
        style={{ height }}
      >
        No data to compare yet.
      </div>
    )
  }

  const data = axes.map((axis, axisIndex) => {
    const point: Record<string, string | number> = { axis }
    for (const item of series) {
      point[item.name] = item.values[axisIndex] ?? 0
    }
    return point
  })

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="#E2E8F0" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: '#718096', fontSize: 12 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
          {series.map((item) => (
            <Radar
              key={item.name}
              name={item.name}
              dataKey={item.name}
              stroke={item.color}
              fill={item.color}
              fillOpacity={0.25}
              strokeWidth={2}
            />
          ))}
          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            wrapperStyle={{ fontSize: 13, paddingTop: 12 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
