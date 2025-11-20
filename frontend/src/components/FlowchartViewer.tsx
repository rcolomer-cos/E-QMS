import React from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  FitViewOptions,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './FlowchartViewer.css';

interface FlowchartViewerProps {
  data: { nodes: Node[]; edges: Edge[] };
}

const fitViewOptions: FitViewOptions = {
  padding: 0.2,
  duration: 800,
};

const FlowchartViewer: React.FC<FlowchartViewerProps> = ({ data }) => {
  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <div className="flowchart-viewer-empty">
        <p>No flowchart available for this process.</p>
      </div>
    );
  }

  return (
    <div className="flowchart-viewer-container">
      <ReactFlow
        nodes={data.nodes}
        edges={data.edges}
        fitView
        fitViewOptions={fitViewOptions}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={true}
        minZoom={0.1}
        maxZoom={4}
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
};

export default FlowchartViewer;
