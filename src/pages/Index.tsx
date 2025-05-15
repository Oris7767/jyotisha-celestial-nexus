
import React, { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import BirthDetailsForm from "@/components/BirthDetailsForm";
import PlanetaryPositions from "@/components/PlanetaryPositions";
import AstrologyChart from "@/components/AstrologyChart";
import { BirthDetails, ChartData } from "@/types/astrology";
import { fetchChartData } from "@/services/astrologyService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Index() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<ChartData | null>(null);

  const handleFormSubmit = async (data: BirthDetails) => {
    setIsLoading(true);
    
    try {
      // Since we don't have a real backend yet, we'll use a timeout to simulate API call
      // In a real application, you would call your API here
      setTimeout(() => {
        // This is placeholder data. In production, you would call your API
        const mockChartData: ChartData = {
          ascendant: {
            sign: "Aries",
            degree: 15.5,
            nakshatra: "Bharani"
          },
          planets: [
            { planet: "Sun", longitude: 45.5, house: 2, sign: "Taurus", retrograde: false },
            { planet: "Moon", longitude: 78.3, house: 3, sign: "Gemini", nakshatra: "Ardra", retrograde: false },
            { planet: "Mercury", longitude: 50.2, house: 2, sign: "Taurus", retrograde: false },
            { planet: "Venus", longitude: 120.7, house: 5, sign: "Leo", retrograde: false },
            { planet: "Mars", longitude: 210.3, house: 8, sign: "Scorpio", retrograde: false },
            { planet: "Jupiter", longitude: 300.1, house: 11, sign: "Aquarius", retrograde: true },
            { planet: "Saturn", longitude: 330.5, house: 12, sign: "Pisces", retrograde: true },
            { planet: "Rahu", longitude: 160.8, house: 6, sign: "Virgo", retrograde: false },
            { planet: "Ketu", longitude: 340.8, house: 12, sign: "Pisces", retrograde: false }
          ],
          houses: [
            { house: 1, sign: "Aries", degree: 0 },
            { house: 2, sign: "Taurus", degree: 30 },
            { house: 3, sign: "Gemini", degree: 60 },
            { house: 4, sign: "Cancer", degree: 90 },
            { house: 5, sign: "Leo", degree: 120 },
            { house: 6, sign: "Virgo", degree: 150 },
            { house: 7, sign: "Libra", degree: 180 },
            { house: 8, sign: "Scorpio", degree: 210 },
            { house: 9, sign: "Sagittarius", degree: 240 },
            { house: 10, sign: "Capricorn", degree: 270 },
            { house: 11, sign: "Aquarius", degree: 300 },
            { house: 12, sign: "Pisces", degree: 330 }
          ],
          dashas: {
            current: "Venus",
            endDate: "2030-01-15",
            subDashas: [
              { current: "Sun", endDate: "2023-07-15" }
            ]
          }
        };
        
        setChartData(mockChartData);
        setIsLoading(false);
        
        toast({
          title: "Chart Generated",
          description: "Vedic astrological chart has been calculated successfully.",
        });
      }, 2000);
      
      // In a real application with your API:
      // const data = await fetchChartData(birthDetails);
      // setChartData(data);
      
    } catch (error) {
      console.error("Failed to generate chart:", error);
      toast({
        title: "Error",
        description: "Failed to generate the astrological chart. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Jyotisha Celestial Nexus</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <BirthDetailsForm onSubmit={handleFormSubmit} isLoading={isLoading} />
        </div>
        
        <div className="lg:col-span-2">
          {chartData ? (
            <Tabs defaultValue="chart">
              <TabsList className="w-full">
                <TabsTrigger value="chart">Chart</TabsTrigger>
                <TabsTrigger value="planets">Planetary Positions</TabsTrigger>
              </TabsList>
              <TabsContent value="chart" className="mt-4">
                <AstrologyChart chartData={chartData} />
              </TabsContent>
              <TabsContent value="planets" className="mt-4">
                <PlanetaryPositions positions={chartData.planets} />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-center px-4">
                <h3 className="text-lg font-medium">No Chart Data</h3>
                <p className="text-gray-500 mt-2">
                  Enter birth details to generate a Vedic astrological chart
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>
          This is a client-side frontend for Vedic astrology calculations. 
          Connect it to your Swiss Ephemeris Node.js API for real calculations.
        </p>
      </div>
    </div>
  );
}
