import React from 'react';

type Props = {
  children: React.ReactNode;
};

const SettingsContainer: React.FC<Props> = ({ children }) => (
  <div className="flex flex-col gap-2 py-3 px-2 bg-background">{children}</div>
);

export default SettingsContainer;
