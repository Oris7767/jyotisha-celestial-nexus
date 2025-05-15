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
      // Sử dụng dịch vụ Swiss Ephemeris trực tiếp thay vì gọi API
      const result = await fetchChartData(data);
      setChartData(result);
      
      toast({
        title: "Chart Generated",
        description: "Vedic astrological chart has been calculated successfully.",
      });
    } catch (error) {
      console.error("Failed to generate chart:", error);
      toast({
        title: "Error",
        description: "Failed to generate the astrological chart. Please try again.",
        variant: "destructive",
      });
    } finally {
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
          Powered by Swiss Ephemeris - Direct calculations using the native Swiss Ephemeris library.
        </p>
      </div>
    </div>
  );
}
