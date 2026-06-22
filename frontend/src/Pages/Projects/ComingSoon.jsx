import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from "../../components/ui/PageContainer";

const ComingSoon = () => {
 const navigate = useNavigate();

 return (
 <PageContainer
 title="Coming Soon"
 subtitle="New features are on the way"
 >
 <div className="flex flex-col items-center justify-center h-[60vh] bg-surface rounded-2xl border border-white/60 shadow-sm text-center px-4">
 <h1 className="text-4xl font-bold text-main mb-4">Coming Soon!</h1>
 <p className="text-lg text-muted mb-8">
 We are working hard to bring you the best project management experience.
 </p>
 <button 
 onClick={() => navigate(-1)}
 className="px-6 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition shadow-md"
 >
 Go Back
 </button>
 </div>
 </PageContainer>
 );
};

export default ComingSoon;