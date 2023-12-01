import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { FeatureCollection } from "geojson";
import axios from "axios";
import { MapData } from "../types/types";

const MapComponent: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);

  useEffect(() => {
    loadData().then((data) => {
      console.log("Data >>", data);
      if (data) renderMap(data);
    });
  }, []);

  const loadData = async (): Promise<MapData | null> => {
    try {
      const statesResponse = await axios.get(`/data/california.geojson`);
      const countiesResponse = await axios.get<FeatureCollection>(
        "https://gist.githubusercontent.com/sdwfrost/d1c73f91dd9d175998ed166eb216994a/raw/e89c35f308cee7e2e5a784e1d3afc5d449e9e4bb/counties.geojson"
      );
      const powerPlantsResponse = await axios.get<FeatureCollection>(
        "/data/California_Power_Plants.geojson"
      );

      // Wrap the state data into a FeatureCollection
      const statesFeatureCollection: FeatureCollection = {
        type: "FeatureCollection",
        features: [statesResponse.data],
      };
      console.log("statesResponse >>", statesResponse);

      return {
        states: statesFeatureCollection,
        counties: countiesResponse.data,
        powerPlants: powerPlantsResponse.data,
      };
    } catch (error) {
      console.error("Error loading data:", error);
      return null;
    }
  };

  const renderMap = (data: MapData) => {
    const svgElement = svgRef.current;
    const svg = d3.select(svgElement);
    const g = d3.select(gRef.current);
    const width = 975;
    const height = 610;

    function clicked(event: any, d: any) {
      event.stopPropagation();
      const bounds = pathGenerator.bounds(d);
      const [[x0, y0], [x1, y1]] = bounds;
      event.stopPropagation();
      d3.selectAll(".state").transition().style("fill", null);
      d3.select(event.target).transition().style("fill", "maroon");

      const transform = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(
          Math.min(2, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height))
        )
        .translate(-(x0 + x1) / 2, -(y0 + y1) / 2);

      svg
        .transition()
        .duration(750)
        .call(zoom.transform as any, transform);
    }
    const projection = d3
      .geoAlbersUsa()
      .scale(1300)
      .translate([width / 2, height / 2]);
    const pathGenerator = d3.geoPath().projection(projection);
    const reset = () => {
      svg.selectAll(".state").transition().style("fill", null);
      svg
        .transition()
        .duration(750)
        .call(zoom.transform as any, d3.zoomIdentity);
    };

    svg.selectAll(".state").on("click", clicked).on("dblclick", reset);

    const zoomed = (event: any) => {
      const { transform } = event;
      d3.select(gRef.current).attr("transform", transform);
      d3.select(gRef.current).attr("stroke-width", 1 / transform.k);
    };

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on("zoom", zoomed);

    svg.call(zoom as any);
    g.selectAll("path.county")
      .data(data.counties.features)
      .enter()
      .append("path")
      .attr("d", pathGenerator)
      .attr("class", "county");

    g.selectAll("path.state")
      .data(data.states.features)
      .enter()
      .append("path")
      .attr("d", pathGenerator)
      .attr("class", "state")
      .on("click", clicked)
      .on("dblclick", reset);

    // Draw Power Plants
    g.selectAll("path.power-plant")
      .data(data.powerPlants.features)
      .enter()
      .append("path")
      .attr("d", pathGenerator)
      .attr("class", "power-plant")
      .on("mouseenter", function (event, d) {
        const tooltip = d3.select("#tooltip");
        tooltip
          .style("visibility", "visible")
          .text("Plant Name: " + d.properties!.PlantName)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 10 + "px");
      })
      .on("mouseleave", function () {
        d3.select("#tooltip").style("visibility", "hidden");
      });
    svg.on("click", reset);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <svg ref={svgRef} width={800} height={600}>
        <g ref={gRef}></g>
      </svg>
      <div
        id="tooltip"
        style={{
          position: "absolute",
          visibility: "hidden",
          backgroundColor: "white",
          border: "1px solid black",
          padding: "5px",
          borderRadius: "5px",
          pointerEvents: "none",
        }}
      ></div>
    </div>
  );
};

export default MapComponent;
