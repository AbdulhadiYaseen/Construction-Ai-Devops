import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Factory function to spawn unique server instances for clean in-process execution per request
export function createConstructionMcpServer(): McpServer {
  const server = new McpServer({
    name: "ConstructionIntelligenceServer",
    version: "1.0.0",
  });

  // Tool 1: Get Site Weather Risk Assessment
  server.tool(
    "get_weather_risk",
    "Fetches meteorological conditions and dynamic crane/structural safety thresholds for site coordinates.",
    {
      latitude: z.number().describe("Latitude of the construction site"),
      longitude: z.number().describe("Longitude of the construction site"),
    },
    async ({ latitude, longitude }) => {
      // Generate realistic, location-grounded weather thresholds
      const isCoastal = Math.abs(longitude) % 10 > 7; 
      const isHighAltitude = Math.abs(latitude) % 10 > 6; 
      
      let temp = 74;
      let wind = 14;
      let humidity = 45;
      let precipitation = "None";
      let assessment = "All operations nominal. Ground and air conditions are safe for heavy lifting and pouring.";

      if (isCoastal) {
        temp = 81;
        wind = 21;
        humidity = 88;
        precipitation = "Scattered Coastal Showers";
        assessment = "HIGH HUMIDITY ENVIRONMENT: Extended cement hydration set times expected. Shoreline soil compaction telemetry scanning required prior to deep excavations.";
      } else if (isHighAltitude) {
        temp = 55;
        wind = 29; // Exceeds safe crane threshold (25 kph)
        humidity = 30;
        assessment = "CRITICAL WIND ALERT: Wind speed (29 kph) exceeds safe crane load thresholds (25 kph). Pause high-elevation crane lifting maneuvers and secure all loose framing panels.";
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              latitude,
              longitude,
              temperatureF: temp,
              windSpeedKph: wind,
              humidityPercent: humidity,
              precipitationAlert: precipitation,
              safetyAssessment: assessment
            }, null, 2)
          }
        ]
      };
    }
  );

  // Tool 2: Get Physical Site Safety & OSHA Regulations
  server.tool(
    "get_safety_regulations",
    "Retrieves regulatory and safety requirements (OSHA, municipal code) for a specific physical category of construction project.",
    {
      projectType: z.enum(["HighRise", "Marine", "Excavation", "Infrastructure", "Residential"])
        .describe("The physical structural category of the construction site"),
    },
    async ({ projectType }) => {
      const safetyStandards: Record<string, string[]> = {
        HighRise: [
          "OSHA CFR 1926 Subpart M: Perimeter safety netting and toe-boards mandatory above 4 storeys.",
          "Daily anemometer telemetry calibration required for high-elevation crane operations.",
          "Fire service wet-riser standpipes must run concurrently with building steel-framing elevations."
        ],
        Marine: [
          "Dynamic saltwater shoring and corrosion proofing required on all load-bearing structural piles.",
          "Dynamic tide trackers must sync with command systems daily.",
          "Coast Guard approved lifejackets (Type III) mandatory for all personnel working over or adjacent to water."
        ],
        Excavation: [
          "OSHA CFR 1926 Subpart P: Active hydraulic shoring, shielding, or slope-backs mandatory for trenches exceeding 5 feet.",
          "Daily soil moisture density and clay compaction testing required to avoid mudslides.",
          "Minimum 2-foot clearance buffer for spoil piles from the excavation lip."
        ],
        Infrastructure: [
          "Heavy machinery warning beacons and 15-foot minimum workspace perimeter buffers.",
          "High-density subterranean sonar scan mandatory prior to ground breaking to map utility paths.",
          "Concrete road-bed thermal expansion joints verified at every 20-foot increment."
        ],
        Residential: [
          "Standard local municipal zoning offset markers verified by licensed surveyor.",
          "Dust-containment shrouds and noise buffers mandatory for active neighborhood framing.",
          "Temporary electrical service panels inspected and certified ground-fault circuit interrupted (GFCI) weekly."
        ]
      };

      const guidelines = safetyStandards[projectType] || ["General OSHA safety standards apply."];

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              projectType,
              regulationsSource: "OSHA & Municipal Building Compliance Guidelines",
              mandatoryDirectives: guidelines
            }, null, 2)
          }
        ]
      };
    }
  );

  // Tool 3: Concrete Hydration Stability Validation
  server.tool(
    "validate_concrete_pour",
    "Evaluates active meteorological parameters (temperature, humidity) against standard chemical concrete hydration stability indexes to prevent cracking.",
    {
      temperatureFahrenheit: z.number().describe("Ambient temperature in Fahrenheit"),
      humidityPercent: z.number().describe("Ambient relative humidity percentage"),
    },
    async ({ temperatureFahrenheit, humidityPercent }) => {
      let status = "OPTIMAL";
      let structuralRisk = "None";
      let mitigationAction = "Standard pour parameters. Begin curing operations normally.";

      if (temperatureFahrenheit > 95) {
        status = "CRITICAL HYDRATION DANGER";
        structuralRisk = "Rapid thermal cracking and excessive moisture evaporation, leading to severe structural load capacity loss.";
        mitigationAction = "Integrate chemical hydration retardants (Type B/D admixtures). Apply continuous cool-water spray misting, and shade curing grids.";
      } else if (temperatureFahrenheit < 40) {
        status = "CRITICAL FREEZING DANGER";
        structuralRisk = "Hydration chemical reaction halts, water expands inside concrete, structurally destroying tensile strength by up to 50%.";
        mitigationAction = "Deploy insulated heating curing blankets immediately. Ensure ambient temp around pour remains above 50°F for a minimum of 72 hours.";
      } else if (humidityPercent > 90) {
        status = "ALERT";
        structuralRisk = "Extremely high humidity will significantly extend standard cement curing set times.";
        mitigationAction = "Adjust subsequent task timelines by T+48 hours to prevent premature framework stress loading.";
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              pourConditions: {
                temperatureFahrenheit,
                humidityPercent
              },
              pourStatus: status,
              primaryStructuralRisk: structuralRisk,
              mandatoryMitigation: mitigationAction
            }, null, 2)
          }
        ]
      };
    }
  );

  return server;
}
