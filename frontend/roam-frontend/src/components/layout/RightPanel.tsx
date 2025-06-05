import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface RightPanelProps {
  pageId?: number;
}

interface LinkedReference {
  id: number;
  source_page_id: number;
  target_page_id: number;
  source_page: {
    id: number;
    title: string;
  };
  blocks: {
    id: number;
    block_uuid: string;
    content: string;
  }[];
}

const RightPanel: React.FC<RightPanelProps> = ({ pageId }) => {
  const [linkedReferences, setLinkedReferences] = useState<LinkedReference[]>([]);
  const [graphData, setGraphData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'references' | 'graph'>('references');

  useEffect(() => {
    if (pageId) {
      fetchLinkedReferences(pageId);
      fetchGraphData(pageId);
    } else {
      setLinkedReferences([]);
      setGraphData(null);
    }
  }, [pageId]);

  const fetchLinkedReferences = async (pageId: number) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/pages/${pageId}/linked_references`);
      setLinkedReferences(response.data);
    } catch (error) {
      console.error('Error fetching linked references:', error);
    }
  };

  const fetchGraphData = async (pageId: number) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/pages/${pageId}/graph`);
      setGraphData(response.data);
    } catch (error) {
      console.error('Error fetching graph data:', error);
    }
  };

  const renderLinkedReferences = () => {
    if (linkedReferences.length === 0) {
      return <p className="no-references">No linked references found.</p>;
    }

    return (
      <div className="linked-references-list">
        {linkedReferences.map(reference => (
          <div key={reference.id} className="reference-item">
            <h4 className="reference-page-title">{reference.source_page.title}</h4>
            <div className="reference-blocks">
              {reference.blocks.map(block => (
                <div key={block.block_uuid} className="reference-block">
                  <div className="block-bullet">•</div>
                  <div className="block-content" dangerouslySetInnerHTML={{ __html: block.content }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderGraph = () => {
    if (!graphData) {
      return <p className="no-graph">Graph data not available.</p>;
    }

    // In a real implementation, this would render a D3 or similar graph visualization
    // For this example, we'll just show a placeholder
    return (
      <div className="graph-visualization">
        <div className="graph-placeholder">
          <div className="graph-node current">Current Page</div>
          {graphData.nodes.map((node: any, index: number) => (
            <div key={index} className="graph-node linked" style={{
              left: `${30 + Math.random() * 40}%`,
              top: `${30 + Math.random() * 40}%`
            }}>
              {node.title}
            </div>
          ))}
          {graphData.links.map((link: any, index: number) => (
            <div key={index} className="graph-link"></div>
          ))}
        </div>
      </div>
    );
  };

  if (!pageId) {
    return (
      <div className="right-panel empty-state">
        <p>Select a page to view linked references and graph visualization.</p>
      </div>
    );
  }

  return (
    <div className="right-panel">
      <div className="panel-tabs">
        <button 
          className={`tab-button ${activeTab === 'references' ? 'active' : ''}`}
          onClick={() => setActiveTab('references')}
        >
          Linked References
        </button>
        <button 
          className={`tab-button ${activeTab === 'graph' ? 'active' : ''}`}
          onClick={() => setActiveTab('graph')}
        >
          Graph View
        </button>
      </div>
      
      <div className="panel-content">
        {activeTab === 'references' ? (
          <div className="linked-references">
            <h3>Linked References</h3>
            {renderLinkedReferences()}
          </div>
        ) : (
          <div className="graph-view">
            <h3>Graph View</h3>
            {renderGraph()}
          </div>
        )}
      </div>
    </div>
  );
};

export default RightPanel;
