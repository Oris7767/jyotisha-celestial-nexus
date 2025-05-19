
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartData, PlanetaryPositions } from "@/types/astrology";

interface AstrologyChartProps {
  chartData: ChartData | null;
}

const AstrologyChart: React.FC<AstrologyChartProps> = ({ chartData }) => {
  if (!chartData) {
    return (
      <Card className="h-[400px] flex items-center justify-center">
        <p className="text-center text-gray-500">No chart data available</p>
      </Card>
    );
  }

  // This is a placeholder for a more sophisticated chart visualization
  // In a real application, you would use a charting library or create a more detailed SVG
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vedic Astrology Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-[400px] w-[400px] mx-auto border border-gray-200 rounded-lg">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="font-semibold">Ascendant: {chartData.ascendant.sign} {chartData.ascendant.degree.toFixed(2)}°</p>
              <p className="text-sm text-gray-500">{chartData.ascendant.nakshatra || ""}</p>
            </div>
          </div>
          
          {/* This is just a placeholder. In a real app, you would render the actual chart with houses and planets */}
          <div className="absolute inset-0">
            {/* Simplified chart representation - would be replaced with actual chart rendering */}
            <svg width="100%" height="100%" viewBox="0 0 400 400">
              {/* Center lines */}
              <line x1="0" y1="200" x2="400" y2="200" stroke="#ddd" />
              <line x1="200" y1="0" x2="200" y2="400" stroke="#ddd" />
              
              {/* Four quadrants */}
              <rect x="0" y="0" width="200" height="200" fill="transparent" stroke="#ddd" />
              <rect x="200" y="0" width="200" height="200" fill="transparent" stroke="#ddd" />
              <rect x="0" y="200" width="200" height="200" fill="transparent" stroke="#ddd" />
              <rect x="200" y="200" width="200" height="200" fill="transparent" stroke="#ddd" />
              
              {/* House numbers - simplified */}
              <text x="100" y="100" textAnchor="middle" fill="#666">1</text>
              <text x="300" y="100" textAnchor="middle" fill="#666">2</text>
              <text x="300" y="300" textAnchor="middle" fill="#666">3</text>
              <text x="100" y="300" textAnchor="middle" fill="#666">4</text>
              
              {/* This would be replaced with actual planet positioning */}
              {chartData.planets.slice(0, 5).map((planet: PlanetaryPositions, index: number) => (
                <text 
                  key={index} 
                  x={100 + (index * 40)} 
                  y={50} 
                  textAnchor="middle" 
                  fill="blue"
                  fontSize="12"
                >
                  {planet.planet.substring(0, 2)}
                </text>
              ))}
            </svg>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Note: This is a simplified representation. Connect to your Vedic Astrology API for a complete chart.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AstrologyChart;
