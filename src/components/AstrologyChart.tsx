
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
            <div className="w-full h-full relative">
              {/* Center lines */}
              <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-200"></div>
              <div className="absolute bottom-0 top-0 left-1/2 w-px bg-gray-200"></div>
              
              {/* Four quadrants */}
              <div className="absolute top-0 left-0 w-1/2 h-1/2 border-r border-b border-gray-200"></div>
              <div className="absolute top-0 right-0 w-1/2 h-1/2 border-l border-b border-gray-200"></div>
              <div className="absolute bottom-0 left-0 w-1/2 h-1/2 border-r border-t border-gray-200"></div>
              <div className="absolute bottom-0 right-0 w-1/2 h-1/2 border-l border-t border-gray-200"></div>
              
              {/* House numbers */}
              <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 text-gray-600">1</div>
              <div className="absolute top-1/4 right-1/4 transform translate-x-1/2 -translate-y-1/2 text-gray-600">2</div>
              <div className="absolute bottom-1/4 right-1/4 transform translate-x-1/2 translate-y-1/2 text-gray-600">3</div>
              <div className="absolute bottom-1/4 left-1/4 transform -translate-x-1/2 translate-y-1/2 text-gray-600">4</div>
              
              {/* Planet positions - simplified representation */}
              <div className="absolute top-12 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {chartData.planets.slice(0, 5).map((planet: PlanetaryPositions, index: number) => (
                  <span 
                    key={index}
                    className="text-xs font-bold text-blue-600"
                  >
                    {planet.planet.substring(0, 2)}
                  </span>
                ))}
              </div>
            </div>
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
