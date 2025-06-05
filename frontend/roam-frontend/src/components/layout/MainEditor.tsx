import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

interface MainEditorProps {
  pageId?: number;
  pageTitle?: string;
}

interface Block {
  id: number;
  block_uuid: string;
  content: string;
  page_id: number;
  parent_block_uuid: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

const MainEditor: React.FC<MainEditorProps> = ({ pageId, pageTitle }) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRecordingId, setCurrentRecordingId] = useState<number | null>(null);
  
  // Refs for block editing
  const blockRefs = useRef<{[key: string]: HTMLDivElement}>({});
  
  // Fetch blocks when pageId changes
  useEffect(() => {
    if (pageId) {
      fetchBlocks(pageId);
    } else {
      setBlocks([]);
    }
  }, [pageId]);
  
  const fetchBlocks = async (pageId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`http://localhost:5000/api/pages/${pageId}/blocks`);
      setBlocks(response.data);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      setError('Failed to load blocks. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const createBlock = async (parentBlockUuid: string | null, order: number, content: string = '') => {
    if (!pageId) return;
    
    try {
      const newBlock = {
        content,
        page_id: pageId,
        parent_block_uuid: parentBlockUuid,
        order
      };
      
      const response = await axios.post('http://localhost:5000/api/blocks', newBlock);
      
      // If recording is active, create timestamp
      if (currentRecordingId) {
        try {
          await axios.post('http://localhost:5000/api/audio/timestamps', {
            recording_id: currentRecordingId,
            block_uuid: response.data.block_uuid,
            timestamp_in_audio_ms: Date.now() // This would be the actual timestamp in a real app
          });
        } catch (error) {
          console.error('Error creating audio timestamp:', error);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Error creating block:', error);
      setError('Failed to create block. Please try again.');
    }
  };
  
  const updateBlock = async (blockUuid: string, content: string) => {
    try {
      await axios.put(`http://localhost:5000/api/blocks/${blockUuid}`, { content });
    } catch (error) {
      console.error('Error updating block:', error);
      setError('Failed to update block. Please try again.');
    }
  };
  
  const deleteBlock = async (blockUuid: string) => {
    try {
      await axios.delete(`http://localhost:5000/api/blocks/${blockUuid}`);
      
      // Remove block from state
      setBlocks(prevBlocks => prevBlocks.filter(block => block.block_uuid !== blockUuid));
    } catch (error) {
      console.error('Error deleting block:', error);
      setError('Failed to delete block. Please try again.');
    }
  };
  
  const handleKeyDown = async (e: React.KeyboardEvent, block: Block, index: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      // Get all blocks at the same level
      const siblingBlocks = blocks.filter(b => b.parent_block_uuid === block.parent_block_uuid);
      
      // Find the current block's position among siblings
      const siblingIndex = siblingBlocks.findIndex(b => b.block_uuid === block.block_uuid);
      
      // Calculate the order for the new block
      const newOrder = siblingIndex < siblingBlocks.length - 1 
        ? (block.order + siblingBlocks[siblingIndex + 1].order) / 2 
        : block.order + 1;
      
      // Create new block
      const newBlock = await createBlock(block.parent_block_uuid, newOrder);
      
      if (newBlock) {
        // Insert the new block after the current one
        const updatedBlocks = [...blocks];
        updatedBlocks.splice(index + 1, 0, newBlock);
        setBlocks(updatedBlocks);
        
        // Focus the new block after render
        setTimeout(() => {
          if (blockRefs.current[newBlock.block_uuid]) {
            blockRefs.current[newBlock.block_uuid].focus();
          }
        }, 0);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      
      if (!e.shiftKey) {
        // Indent: Make the current block a child of the previous sibling
        const prevBlock = blocks[index - 1];
        if (prevBlock && prevBlock.parent_block_uuid === block.parent_block_uuid) {
          try {
            await axios.put(`http://localhost:5000/api/blocks/${block.block_uuid}/indent`);
            
            // Update block in state
            const updatedBlock = { ...block, parent_block_uuid: prevBlock.block_uuid, order: 0 };
            const updatedBlocks = [...blocks];
            updatedBlocks[index] = updatedBlock;
            setBlocks(updatedBlocks);
          } catch (error) {
            console.error('Error indenting block:', error);
          }
        }
      } else {
        // Outdent: Move the current block to the parent's level
        if (block.parent_block_uuid) {
          const parentBlock = blocks.find(b => b.block_uuid === block.parent_block_uuid);
          if (parentBlock) {
            try {
              await axios.put(`http://localhost:5000/api/blocks/${block.block_uuid}/outdent`);
              
              // Update block in state
              const updatedBlock = { ...block, parent_block_uuid: parentBlock.parent_block_uuid };
              const updatedBlocks = [...blocks];
              updatedBlocks[index] = updatedBlock;
              setBlocks(updatedBlocks);
            } catch (error) {
              console.error('Error outdenting block:', error);
            }
          }
        }
      }
    } else if (e.key === 'Backspace' && (e.target as HTMLDivElement).textContent === '') {
      e.preventDefault();
      
      // Delete empty block
      await deleteBlock(block.block_uuid);
      
      // Focus previous block
      if (index > 0) {
        const prevBlock = blocks[index - 1];
        if (blockRefs.current[prevBlock.block_uuid]) {
          blockRefs.current[prevBlock.block_uuid].focus();
        }
      }
    }
  };
  
  const handleBlockChange = (e: React.FormEvent<HTMLDivElement>, block: Block) => {
    const content = e.currentTarget.textContent || '';
    
    // Debounce updates to avoid too many API calls
    const timeoutId = setTimeout(() => {
      updateBlock(block.block_uuid, content);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  };
  
  const processMarkdown = (content: string): React.ReactNode => {
    // Process links [[Page Name]]
    const linkRegex = /\[\[(.*?)\]\]/g;
    let parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = linkRegex.exec(content)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      
      // Add the link
      const pageName = match[1];
      parts.push(
        <span key={`link-${match.index}`} className="page-link">
          {pageName}
        </span>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }
    
    // If no links were found, return the original content
    if (parts.length === 0) {
      return content;
    }
    
    return parts;
  };
  
  const renderBlocks = useCallback((parentBlockUuid: string | null = null, level: number = 0) => {
    const filteredBlocks = blocks
      .filter(block => block.parent_block_uuid === parentBlockUuid)
      .sort((a, b) => a.order - b.order);
    
    return filteredBlocks.map((block, index) => {
      const blockIndex = blocks.findIndex(b => b.block_uuid === block.block_uuid);
      
      return (
        <div key={block.block_uuid} className={`block-container level-${level}`}>
          <div className="block-bullet">•</div>
          <div
            ref={el => {
              if (el) blockRefs.current[block.block_uuid] = el;
            }}
            className="block-content"
            contentEditable
            suppressContentEditableWarning
            onKeyDown={e => handleKeyDown(e, block, blockIndex)}
            onInput={e => handleBlockChange(e, block)}
            dangerouslySetInnerHTML={{ __html: block.content }}
          />
          {renderBlocks(block.block_uuid, level + 1)}
        </div>
      );
    });
  }, [blocks]);
  
  const handleRecordingStart = (recordingId: number) => {
    setCurrentRecordingId(recordingId);
  };
  
  const handleRecordingStop = () => {
    setCurrentRecordingId(null);
  };
  
  // Create initial block if page is empty
  useEffect(() => {
    if (pageId && blocks.length === 0 && !loading) {
      createBlock(null, 0);
    }
  }, [pageId, blocks, loading]);
  
  if (!pageId) {
    return (
      <div className="main-editor empty-state">
        <h2>Select a page or create a new one</h2>
        <p>Use the sidebar to navigate to an existing page or create a new one.</p>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="main-editor loading-state">
        <div className="spinner"></div>
        <p>Loading page content...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="main-editor error-state">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => pageId && fetchBlocks(pageId)}>Retry</button>
      </div>
    );
  }
  
  return (
    <div className="main-editor">
      <h1 className="page-title">{pageTitle}</h1>
      <div className="blocks-container">
        {renderBlocks()}
      </div>
    </div>
  );
};

export default MainEditor;
