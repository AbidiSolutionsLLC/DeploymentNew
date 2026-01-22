import React, { useEffect, useState } from 'react';
import api from '../../axios';
import { FaUserTie, FaNetworkWired } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

// --- Recursive Node Component ---
const OrgNode = ({ node, onNodeClick }) => {
  return (
    <div className="flex flex-col items-center">
      {/* The User Card */}
      <div 
        onClick={() => onNodeClick(node)}
        className="relative flex flex-col items-center p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer w-48 z-10"
      >
        {/* Profile Pic */}
        <div className="w-16 h-16 mb-3 rounded-full overflow-hidden border-2 border-gray-100 shadow-inner">
           <img 
              src={node.avatar || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
              alt={node.name}
              className="w-full h-full object-cover"
            />
        </div>
        
        {/* Info */}
        <div className="text-center">
          <h3 className="text-sm font-bold text-gray-800 truncate w-full">{node.name}</h3>
          <p className="text-xs text-blue-600 font-medium truncate w-full">{node.designation || node.role}</p>
          {node.department && (
            <span className="text-[10px] text-gray-400 mt-1 inline-block bg-gray-50 px-2 py-0.5 rounded-full">
              {node.department.name}
            </span>
          )}
        </div>

        {/* Connector Dot (Bottom) - Only if children exist */}
        {node.children && node.children.length > 0 && (
          <div className="absolute -bottom-3 w-1 h-4 bg-gray-300"></div>
        )}
      </div>

      {/* Children Container */}
      {node.children && node.children.length > 0 && (
        <div className="flex flex-col items-center mt-3">
          {/* Horizontal Line connecting children */}
          <div className="relative flex justify-center gap-8 pt-4">
             {/* Top Connector Line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-4 bg-gray-300"></div>
            
            {/* The Horizontal Bar connecting all children */}
            {node.children.length > 1 && (
                 <div className="absolute top-0 left-[calc(50%-50%+3rem)] right-[calc(50%-50%+3rem)] h-px bg-gray-300 w-[calc(100%-12rem)]"></div>
            )}
            
            {/* Render Children Recursively */}
            <div className="flex gap-8">
               {node.children.map((child, index) => (
                 <div key={child._id} className="relative flex flex-col items-center">
                    {/* Vertical line to child */}
                    <div className="absolute -top-4 w-px h-4 bg-gray-300"></div>
                    
                    {/* Horizontal Connector Logic for multiple children */}
                    {node.children.length > 1 && (
                      <>
                        {/* Left Line for first child to center */}
                        {index === 0 && <div className="absolute -top-4 right-1/2 w-[calc(100%+1rem)] h-px bg-gray-300 origin-right translate-y-0"></div>}
                        {/* Right Line for last child to center */}
                        {index === node.children.length - 1 && <div className="absolute -top-4 left-1/2 w-[calc(100%+1rem)] h-px bg-gray-300 origin-left"></div>}
                        {/* Full Line for middle children */}
                        {index > 0 && index < node.children.length - 1 && <div className="absolute -top-4 w-[calc(100%+2rem)] h-px bg-gray-300"></div>}
                      </>
                    )}

                   <OrgNode node={child} onNodeClick={onNodeClick} />
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Page Component ---
const OrgChartPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // Use navigate instead of modal

  useEffect(() => {
    const fetchOrgChart = async () => {
      try {
        const response = await api.get('/users/org-chart');
        setData(response.data.data);
      } catch (error) {
        console.error("Failed to fetch chart", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrgChart();
  }, []);

  const handleNodeClick = (user) => {
    // Navigate to the user's profile page
    navigate(`/people/profile/${user._id}`);
  };

  return (
    <div className="p-6 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaNetworkWired className="text-blue-600" /> Organization Chart
          </h1>
          <p className="text-sm text-gray-500">Visual hierarchy of company leadership and teams</p>
        </div>
      </div>

      {/* Chart Container - Scrollable Area */}
      <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 shadow-inner overflow-auto p-10 cursor-grab active:cursor-grabbing">
        <div className="min-w-max flex justify-center pb-20">
          {loading ? (
             <div className="text-gray-400">Loading Hierarchy...</div>
          ) : data.length > 0 ? (
            data.map(rootNode => (
              <OrgNode 
                key={rootNode._id} 
                node={rootNode} 
                onNodeClick={handleNodeClick} 
              />
            ))
          ) : (
            <div className="flex flex-col items-center mt-20 text-gray-400">
               <FaUserTie className="text-4xl mb-2 opacity-50"/>
               <p>No reporting hierarchy found.</p>
               <p className="text-xs">Ensure users have "Reports To" assigned in their profiles.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrgChartPage;