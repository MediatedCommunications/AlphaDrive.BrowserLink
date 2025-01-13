import React from 'react';

type Props = {
  children: React.ReactNode;
};

const SettingsContainer: React.FC<Props> = ({ children }) => (
  <div className="py-3 px-2 bg-background">{children}</div>
);

export default SettingsContainer;
