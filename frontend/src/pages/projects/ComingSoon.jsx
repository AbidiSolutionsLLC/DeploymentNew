import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from "../../components/ui/PageContainer";
import { WrenchScrewdriverIcon } from "@heroicons/react/24/outline";

const ComingSoon = () => {
 const navigate = useNavigate();

 return (
 <PageContainer
 title="Project Portal"
 subtitle="Under Development"
 >
 <div className="flex flex-col items-center justify-center h-[70vh] bg-surface rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-border-subtle text-center px-4">
 <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-6 text-brand">
 <WrenchScrewdriverIcon className="w-10 h-10" />
 </div>
 <h1 className="text-3xl font-bold text-heading mb-4 tracking-tight">Under Development</h1>
 <p className="text-lg text-muted mb-8 max-w-md mx-auto">
 This portal is under development. We are working on it and it will be available soon.
 </p>
 <button 
 onClick={() => navigate('/people/home')}
 className="btn btn-primary"
 >
 Return to People Portal
 </button>
 </div>
 </PageContainer>
 );
};

export default ComingSoon;
