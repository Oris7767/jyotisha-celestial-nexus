
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanetaryPosition } from "@/types/astrology";

interface PlanetaryPositionsProps {
  positions: PlanetaryPosition[];
}

const PlanetaryPositions: React.FC<PlanetaryPositionsProps> = ({ positions }) => {
  if (!positions || positions.length === 0) {
    return <p className="text-center text-gray-500">No planetary data available</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Planetary Positions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Planet</TableHead>
              <TableHead>Sign</TableHead>
              <TableHead>Longitude</TableHead>
              <TableHead>House</TableHead>
              <TableHead>Nakshatra</TableHead>
              <TableHead>Retrograde</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.map((position: PlanetaryPosition, index: number) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{position.planet}</TableCell>
                <TableCell>{position.sign}</TableCell>
                <TableCell>{position.longitude.toFixed(2)}°</TableCell>
                <TableCell>{position.house}</TableCell>
                <TableCell>{position.nakshatra || "-"}</TableCell>
                <TableCell>{position.retrograde ? "Yes" : "No"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PlanetaryPositions;
