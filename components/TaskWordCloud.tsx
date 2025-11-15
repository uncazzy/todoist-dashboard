import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import cloud from 'd3-cloud';

// Input word data before layout calculation
interface WordInput {
  text: string;
  size: number;
}

interface TaskWordCloudProps {
  tasks: Array<{ content: string }>;
}

const TaskWordCloud = ({ tasks }: TaskWordCloudProps): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        // Adjust height based on screen size
        const height = window.innerWidth < 768 ? width * 0.8 : 400;
        setDimensions({ width, height });
      }
    };

    // Initial dimension setup
    updateDimensions();

    // Add resize listener
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!tasks.length || !svgRef.current || !dimensions.width) return;

    const svgElement = svgRef.current;

    // Clear previous content
    d3.select(svgElement).selectAll("*").remove();

    // Process text from tasks
    const words = tasks
      .map(task => task.content.toLowerCase())
      .join(" ")
      .split(/[\s,.!?]+/)
      .filter(word => 
        word.length > 2 && // Include slightly shorter words
        !["the", "and", "for", "that", "this", "with", "from", "have", "will", 
          "what", "when", "where", "which", "how", "who", "why", "can", "all",
          "has", "had", "was", "were", "are", "been", "being", "its", "their",
          "your", "you", "may", "also", "than", "then", "now", "get", "got", "but"
        ].includes(word)
      );

    // Count word frequencies
    const wordFrequency = new Map<string, number>();
    words.forEach(word => {
      wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
    });

    // Convert to format needed for d3-cloud with adjusted sizing
    const maxCount = Math.max(...Array.from(wordFrequency.values()));
    const isMobile = window.innerWidth < 768;
    
    const wordData: WordInput[] = Array.from(wordFrequency.entries())
      .map(([text, count]) => ({
        text,
        // Larger base size for mobile
        size: isMobile 
          ? 18 + (count / maxCount) * 48 
          : 14 + (count / maxCount) * 36
      }))
      .sort((a, b) => b.size - a.size)
      .slice(0, isMobile ? 75 : 150); // Show fewer words on mobile for better readability

    const layout = cloud<WordInput>()
      .size([dimensions.width, dimensions.height])
      .words(wordData)
      .padding(isMobile ? 4 : 3)
      .rotate(() => (Math.random() < 0.5 ? 0 : 90))
      .fontSize(d => d.size)
      .spiral("archimedean")
      .on("end", draw);

    function draw(words: cloud.Word[]) {
      if (!svgElement) return;

      const svg = d3.select(svgElement)
        .attr("width", dimensions.width)
        .attr("height", dimensions.height)
        .attr("viewBox", [-dimensions.width/2, -dimensions.height/2, dimensions.width, dimensions.height])
        .style("background", "transparent");
      
      svg.selectAll("*").remove();
      
      const g = svg.append("g");

      const colorScale = d3.scaleOrdinal(d3.schemeSet3);

      g.selectAll("text")
        .data(words)
        .enter().append("text")
        .style("font-family", "system-ui, -apple-system, sans-serif")
        .style("fill", function(d) { return colorScale(d.text || '') })
        .attr("text-anchor", "middle")
        .attr("transform", "translate(0,0)rotate(0)")
        .attr("opacity", 0)
        .text(d => d.text || '')
        .transition()
        .duration(600)
        .style("font-size", d => `${d.size || 0}px`)
        .attr("transform", d => `translate(${d.x || 0},${d.y || 0})rotate(${d.rotate || 0})`)
        .attr("opacity", 0.9);
    }

    layout.start();

    return () => {
      if (svgElement) {
        d3.select(svgElement).selectAll("*").remove();
      }
    };
  }, [tasks, dimensions]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[300px] sm:min-h-[400px] flex items-center justify-center">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}

export default TaskWordCloud;
