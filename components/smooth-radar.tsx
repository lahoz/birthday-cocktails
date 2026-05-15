'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface DrinkProfile {
  id: string;
  name: string;
  person: string;
  mapX: number;
  mapY: number;
  values: number[];
}

interface SmoothRadarProps {
  dimensions: string[];
  profiles: DrinkProfile[];
  averageProfile: number[];
  selectedProfileId: string | null;
  blendMode: string;
  blurAmount: number;
  spikiness: number;
  colors: {
    classic: string;
    experimental: string;
    light: string;
    spiritForward: string;
  };
}

interface PolarPoint {
  angle: number;
  radius: number;
}

function getGradientStops(
  mapX: number,
  mapY: number,
  colors: SmoothRadarProps['colors'],
) {
  return {
    start: mapX < 0 ? colors.classic : colors.experimental,
    end: mapY < 0 ? colors.light : colors.spiritForward,
  };
}

function buildBlobPoints(values: number[], spikiness: number) {
  const pointCount = values.length;
  const angleSlice = (Math.PI * 2) / pointCount;
  const spikeT = Math.max(0, Math.min(1, spikiness / 100));
  const midpointMultiplier = 0.98 - 0.48 * spikeT;

  return values.flatMap((value, index) => {
    const nextValue = values[(index + 1) % pointCount];
    const currentAngle = index * angleSlice;
    const midpointAngle = currentAngle + angleSlice / 2;
    const midpointRadius = ((value + nextValue) / 2) * midpointMultiplier;

    return [
      { angle: currentAngle, radius: value },
      { angle: midpointAngle, radius: midpointRadius },
    ];
  });
}

export default function SmoothRadar({
  dimensions,
  profiles,
  averageProfile,
  selectedProfileId,
  blendMode,
  blurAmount,
  spikiness,
  colors,
}: SmoothRadarProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || dimensions.length === 0 || profiles.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const margin = 88;
    const radius = Math.min(width, height) / 2 - margin;
    const labelRadius = radius + 68;
    const angleSlice = (Math.PI * 2) / dimensions.length;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const defs = svg.append('defs');

    const blurFilter = defs.append('filter')
      .attr('id', 'blob-blur')
      .attr('x', '-40%')
      .attr('y', '-40%')
      .attr('width', '180%')
      .attr('height', '180%');

    blurFilter.append('feGaussianBlur')
      .attr('in', 'SourceGraphic')
      .attr('stdDeviation', blurAmount);

    const glowFilter = defs.append('filter')
      .attr('id', 'average-glow')
      .attr('x', '-40%')
      .attr('y', '-40%')
      .attr('width', '180%')
      .attr('height', '180%');

    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', 2.5)
      .attr('result', 'blur');

    const glowMerge = glowFilter.append('feMerge');
    glowMerge.append('feMergeNode').attr('in', 'blur');
    glowMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const radialLine = d3.lineRadial()
      .curve(d3.curveCatmullRomClosed.alpha(0.72))
      .angle((d: PolarPoint) => d.angle)
      .radius((d: PolarPoint) => d.radius * radius);

    const averagePoints = buildBlobPoints(averageProfile, spikiness);

    const labelLayer = g.append('g');

    labelLayer.selectAll('.axis-spoke')
      .data(dimensions)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', (_: string, index: number) => {
        const angle = angleSlice * index - Math.PI / 2;
        return Math.cos(angle) * (radius + 8);
      })
      .attr('y2', (_: string, index: number) => {
        const angle = angleSlice * index - Math.PI / 2;
        return Math.sin(angle) * (radius + 8);
      })
      .attr('stroke', 'rgba(112, 105, 96, 0.16)')
      .attr('stroke-width', 1);

    labelLayer.selectAll('.axis-label')
      .data(dimensions)
      .enter()
      .append('text')
      .attr('class', 'axis-label')
      .attr('x', (_: string, index: number) => {
        const angle = angleSlice * index - Math.PI / 2;
        return Math.cos(angle) * labelRadius;
      })
      .attr('y', (_: string, index: number) => {
        const angle = angleSlice * index - Math.PI / 2;
        return Math.sin(angle) * labelRadius;
      })
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#756a61')
      .attr('font-size', '12px')
      .attr('letter-spacing', '0.08em')
      .text((dimension: string) => dimension);

    const blobLayer = g.append('g')
      .style('mix-blend-mode', blendMode);

    profiles.forEach((profile, index) => {
      const isSelected = selectedProfileId === profile.id;
      const hasSelectedProfile = selectedProfileId !== null;

      if (hasSelectedProfile && !isSelected) {
        return;
      }

      const blobPoints = buildBlobPoints(profile.values, spikiness);
      const { start, end } = getGradientStops(profile.mapX, profile.mapY, colors);
      const gradientId = `drink-gradient-${profile.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
      const gradientX = (profile.mapX + 1) / 2;
      const gradientY = 1 - (profile.mapY + 1) / 2;

      const gradient = defs.append('linearGradient')
        .attr('id', gradientId)
        .attr('gradientUnits', 'objectBoundingBox')
        .attr('x1', Math.max(0, gradientX - 0.35))
        .attr('y1', Math.max(0, gradientY - 0.35))
        .attr('x2', Math.min(1, gradientX + 0.35))
        .attr('y2', Math.min(1, gradientY + 0.35));

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', start)
        .attr('stop-opacity', 0.95);

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', end)
        .attr('stop-opacity', 0.95);

      const blobGroup = blobLayer.append('g')
        .attr('data-drink-id', profile.id)
        .style('isolation', 'isolate');

      blobGroup.append('path')
        .datum(blobPoints)
        .attr('d', radialLine)
        .attr('fill', `url(#${gradientId})`)
        .attr('fill-opacity', isSelected ? 0.48 : 0.34)
        .attr('filter', 'url(#blob-blur)')
        .attr(
          'transform',
          `translate(${Math.sin(index * 1.7) * 2},${Math.cos(index * 1.3) * 2}) scale(${isSelected ? 1.05 : 1.02})`,
        );
    });

    g.append('path')
      .datum(averagePoints)
      .attr('d', radialLine)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255,255,255,0.98)')
      .attr('stroke-width', 3)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('filter', 'url(#average-glow)');
  }, [averageProfile, blendMode, blurAmount, colors, dimensions, profiles, selectedProfileId, spikiness]);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ overflow: 'visible' }}
    />
  );
}
