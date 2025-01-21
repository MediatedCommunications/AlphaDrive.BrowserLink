import React from 'react';

type Props = {
  children: React.ReactNode;
};

const SettingsHeader: React.FC<Props> = ({ children }) => (
  <h1 className="text-base bg-primary text-primary-foreground px-2 py-1">
    {children}
  </h1>
);

export default SettingsHeader;
