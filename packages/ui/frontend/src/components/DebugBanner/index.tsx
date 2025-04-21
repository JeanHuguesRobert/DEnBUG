import React from 'react';
import './DebugBanner.css';

export const DebugBanner: React.FC = () => {
    return (
        <div className="debug-banner">
            <div className="banner-content">
                <h1>Denbug Retrace Debugger</h1>
                <code className="idiom">domain_de&&bug("event", args)</code>
                <p>Time-travel debugging with domain-specific trace control</p>
            </div>
        </div>
    );
};