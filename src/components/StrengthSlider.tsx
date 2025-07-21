const StrengthSlider: React.FC<{
  value: string;
  setValue: (val: string) => void;
}> = ({ value, setValue }) => (
  <div className="rangeContainer">
    <input
      type="range"
      min="1"
      max="100"
      step="1"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        const parsed = parseInt(value);
        setValue(isNaN(parsed) ? '50' : Math.min(100, Math.max(1, parsed)).toString());
      }}
      style={{ width: '100%' }}
    />
    <div style={{ textAlign: 'center' }}>{value}</div>
  </div>
);
export default StrengthSlider;