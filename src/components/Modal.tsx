const Modal: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="modalDiv">
    <div className="modalContent">{children}</div>
  </div>
);
