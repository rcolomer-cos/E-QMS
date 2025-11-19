import React, { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  FitViewOptions,
  NodeTypes,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './FlowchartEditor.css';

interface FlowchartEditorProps {
  initialData?: { nodes: Node[]; edges: Edge[] };
  onSave: (data: { nodes: Node[]; edges: Edge[] }) => void;
  readOnly?: boolean;
}

// Custom node components with handles on all sides
const RectangleNode = ({ data, isConnectable }: any) => {
  return (
    <div className="flowchart-node flowchart-node-rectangle">
      <Handle type="target" position={Position.Top} id="top" isConnectable={isConnectable} />
      <Handle type="target" position={Position.Left} id="left" isConnectable={isConnectable} />
      <Handle type="target" position={Position.Right} id="right" isConnectable={isConnectable} />
      <Handle type="target" position={Position.Bottom} id="bottom" isConnectable={isConnectable} />
      <div className="flowchart-node-label">{data.label}</div>
      <Handle type="source" position={Position.Top} id="top-source" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Left} id="left-source" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="right-source" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Bottom} id="bottom-source" isConnectable={isConnectable} />
    </div>
  );
};

const DiamondNode = ({ data, isConnectable }: any) => {
  // Position handles at the visual corners of the rotated diamond (45 degrees)
  // The diamond is rotated, so we need to place handles at approximately 35% and 65% positions
  return (
    <div className="flowchart-node flowchart-node-diamond">
      <Handle type="target" position={Position.Top} id="top" isConnectable={isConnectable} style={{ top: '0%', left: '50%', transform: 'translate(-50%, -50%)' }} />
      <Handle type="target" position={Position.Left} id="left" isConnectable={isConnectable} style={{ left: '0%', top: '50%', transform: 'translate(-50%, -50%)' }} />
      <Handle type="target" position={Position.Right} id="right" isConnectable={isConnectable} style={{ right: '0%', top: '50%', transform: 'translate(50%, -50%)' }} />
      <Handle type="target" position={Position.Bottom} id="bottom" isConnectable={isConnectable} style={{ bottom: '0%', left: '50%', transform: 'translate(-50%, 50%)' }} />
      <div className="flowchart-node-label">{data.label}</div>
      <Handle type="source" position={Position.Top} id="top-source" isConnectable={isConnectable} style={{ top: '0%', left: '50%', transform: 'translate(-50%, -50%)' }} />
      <Handle type="source" position={Position.Left} id="left-source" isConnectable={isConnectable} style={{ left: '0%', top: '50%', transform: 'translate(-50%, -50%)' }} />
      <Handle type="source" position={Position.Right} id="right-source" isConnectable={isConnectable} style={{ right: '0%', top: '50%', transform: 'translate(50%, -50%)' }} />
      <Handle type="source" position={Position.Bottom} id="bottom-source" isConnectable={isConnectable} style={{ bottom: '0%', left: '50%', transform: 'translate(-50%, 50%)' }} />
    </div>
  );
};

const CircleNode = ({ data, isConnectable }: any) => {
  return (
    <div className="flowchart-node flowchart-node-circle">
      <Handle type="target" position={Position.Top} id="top" isConnectable={isConnectable} />
      <Handle type="target" position={Position.Left} id="left" isConnectable={isConnectable} />
      <Handle type="target" position={Position.Right} id="right" isConnectable={isConnectable} />
      <Handle type="target" position={Position.Bottom} id="bottom" isConnectable={isConnectable} />
      <div className="flowchart-node-label">{data.label}</div>
      <Handle type="source" position={Position.Top} id="top-source" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Left} id="left-source" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="right-source" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Bottom} id="bottom-source" isConnectable={isConnectable} />
    </div>
  );
};

const nodeTypes: NodeTypes = {
  default: RectangleNode,
  diamond: DiamondNode,
  circle: CircleNode,
};

const fitViewOptions: FitViewOptions = {
  padding: 0.2,
  duration: 800,
};

const FlowchartEditor: React.FC<FlowchartEditorProps> = ({
  initialData,
  onSave,
  readOnly = false,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialData?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData?.edges || []);
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      setHasChanges(true);
    }
  }, [nodes, edges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!readOnly) {
        setEdges((eds: Edge[]) => addEdge({ ...params, label: '' }, eds));
      }
    },
    [setEdges, readOnly]
  );

  const onEdgeDoubleClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    if (readOnly) return;
    const currentLabel = edge.label || '';
    const newLabel = prompt('Enter label for this connection:', String(currentLabel));
    if (newLabel !== null) {
      setEdges((eds: Edge[]) =>
        eds.map((e) =>
          e.id === edge.id
            ? { 
                ...e, 
                label: newLabel,
                labelStyle: { fill: '#333', fontWeight: 500, fontSize: '12px' },
                labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
                labelBgPadding: [8, 4] as [number, number],
                labelBgBorderRadius: 4,
              }
            : e
        )
      );
    }
  }, [readOnly, setEdges]);

  const handleSave = () => {
    onSave({ nodes, edges });
    setHasChanges(false);
  };

  const [selectedShape, setSelectedShape] = useState<'default' | 'diamond' | 'circle'>('default');
  const [isControlsExpanded, setIsControlsExpanded] = useState(false);

  const addNode = (shape?: 'default' | 'diamond' | 'circle') => {
    const shapeType = shape || selectedShape;
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: shapeType,
      position: {
        x: 250 + (nodes.length * 50) % 400,
        y: 100 + Math.floor(nodes.length / 3) * 100,
      },
      data: { label: `Step ${nodes.length + 1}` },
    };
    setNodes((nds: Node[]) => [...nds, newNode]);
  };

  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (readOnly) return;
    const newLabel = prompt('Enter new label:', String(node.data.label || ''));
    if (newLabel !== null && newLabel.trim()) {
      setNodes((nds: Node[]) =>
        nds.map((n) =>
          n.id === node.id
            ? { ...n, data: { ...n.data, label: newLabel } }
            : n
        )
      );
    }
  }, [readOnly, setNodes]);

  const deleteNode = useCallback(() => {
    const selectedNodes = nodes.filter((node) => node.selected);
    if (selectedNodes.length === 0) {
      alert('Please select a node to delete');
      return;
    }
    if (window.confirm(`Delete ${selectedNodes.length} selected node(s)?`)) {
      setNodes((nds) => nds.filter((n) => !n.selected));
      setEdges((eds) => eds.filter((e) => 
        !selectedNodes.some((n) => e.source === n.id || e.target === n.id)
      ));
    }
  }, [nodes, setNodes, setEdges]);

  const clearFlowchart = () => {
    if (window.confirm('Are you sure you want to clear the entire flowchart?')) {
      setNodes([]);
      setEdges([]);
    }
  };

  return (
    <div className="flowchart-editor-wrapper">
      {!readOnly && (
        <div className="flowchart-sidebar">
          <div className="sidebar-toggle">
            <button 
              className="toggle-btn" 
              onClick={() => setIsControlsExpanded(!isControlsExpanded)}
              title={isControlsExpanded ? "Hide controls" : "Show controls"}
            >
              {isControlsExpanded ? '▼' : '▶'} Flowchart Controls
            </button>
          </div>

          {isControlsExpanded && (
            <>
              <div className="sidebar-section">
                <h3>Shape Type</h3>
                <div className="shape-selector">
                  <button
                    className={`shape-btn ${selectedShape === 'default' ? 'active' : ''}`}
                    onClick={() => setSelectedShape('default')}
                    title="Rectangle"
                  >
                    <div className="shape-preview shape-preview-rect"></div>
                    Rectangle
                  </button>
                  <button
                    className={`shape-btn ${selectedShape === 'diamond' ? 'active' : ''}`}
                    onClick={() => setSelectedShape('diamond')}
                    title="Diamond (Decision)"
                  >
                    <div className="shape-preview shape-preview-diamond"></div>
                    Diamond
                  </button>
                  <button
                    className={`shape-btn ${selectedShape === 'circle' ? 'active' : ''}`}
                    onClick={() => setSelectedShape('circle')}
                    title="Circle (Start/End)"
                  >
                    <div className="shape-preview shape-preview-circle"></div>
                    Circle
                  </button>
                </div>
              </div>

              <div className="sidebar-section">
                <h3>Actions</h3>
                <button onClick={() => addNode()} className="flowchart-btn flowchart-btn-add" title="Add selected shape">
                  ➕ Add Node
                </button>
                <button onClick={deleteNode} className="flowchart-btn flowchart-btn-delete" title="Delete selected node(s)">
                  🗑️ Delete
                </button>
                <button
                  onClick={handleSave}
                  className="flowchart-btn flowchart-btn-save"
                  disabled={!hasChanges}
                  title="Save flowchart changes"
                >
                  💾 Save
                </button>
                <button onClick={clearFlowchart} className="flowchart-btn flowchart-btn-clear" title="Clear entire flowchart">
                  ❌ Clear All
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="flowchart-editor-container">
        <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={readOnly ? undefined : onNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={onNodeDoubleClick}
        onEdgeDoubleClick={onEdgeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={fitViewOptions}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        minZoom={0.1}
        maxZoom={4}
        connectionRadius={20}
        snapToGrid={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls showInteractive={!readOnly} />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
      </ReactFlow>
      </div>

      {!readOnly && (
        <div className="flowchart-instructions">
          <strong>Instructions:</strong>
          <span>Select a shape type, click "Add Node" to create it</span>
          <span>•</span>
          <span>Drag nodes to reposition</span>
          <span>•</span>
          <span>Drag from connection points to link nodes</span>
          <span>•</span>
          <span>Double-click nodes or connections to edit labels</span>
          <span>•</span>
          <span>Mouse wheel to zoom, drag to pan</span>
        </div>
      )}
    </div>
  );
};

export default FlowchartEditor;
