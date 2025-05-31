import React from 'react';

interface AudioDeviceSelectorProps {
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  onDeviceChange: (deviceId: string) => void;
  disabled: boolean;
}

const AudioDeviceSelector: React.FC<AudioDeviceSelectorProps> = ({
  devices,
  selectedDeviceId,
  onDeviceChange,
  disabled
}) => {
  return (
    <div className="w-full">
      <label htmlFor="audio-device" className="block text-sm font-medium mb-1">
        Audio Input Device
      </label>
      <select
        id="audio-device"
        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={selectedDeviceId}
        onChange={(e) => onDeviceChange(e.target.value)}
        disabled={disabled}
      >
        {devices.length === 0 ? (
          <option value="">No devices found</option>
        ) : (
          devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Device ${device.deviceId.substring(0, 5)}...`}
            </option>
          ))
        )}
      </select>
    </div>
  );
};

export default AudioDeviceSelector;
