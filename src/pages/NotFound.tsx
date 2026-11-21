import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-navy-950 text-chalk flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="max-w-md space-y-4">
        <div className="w-3 h-3 rounded-full bg-alert mx-auto" />
        <h1 className="font-condensed font-bold text-3xl uppercase tracking-wider text-chalk">
          404 · Uncharted Orbit
        </h1>
        <p className="text-sm text-chalk-dim leading-relaxed">
          That page does not exist. Open the command center or read the report.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/dashboard"
            className="px-4 py-2 bg-sky text-navy-950 rounded-control font-semibold text-xs hover:bg-sky/90 transition-colors"
          >
            Open command center
          </Link>
          <Link
            to="/analytics"
            className="px-4 py-2 bg-navy-900 border border-line text-chalk rounded-control font-medium text-xs hover:bg-navy-800 transition-colors"
          >
            Read the fleet report
          </Link>
        </div>
      </div>
    </div>
  );
};
