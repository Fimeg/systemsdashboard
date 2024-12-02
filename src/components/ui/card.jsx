import React from 'react';

const Card = ({ className, children }) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className || ''}`}>
    {children}
  </div>
);

const CardHeader = ({ className, children }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className || ''}`}>
    {children}
  </div>
);

const CardTitle = ({ className, children }) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className || ''}`}>
    {children}
  </h3>
);

const CardContent = ({ className, children }) => (
  <div className={`p-6 pt-0 ${className || ''}`}>
    {children}
  </div>
);

export { Card, CardHeader, CardTitle, CardContent };
