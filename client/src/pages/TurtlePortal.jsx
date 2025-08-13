import React from 'react';

const TurtlePortal = () => {
    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>Turtle Portal (Temporary Page)</h2>
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button onClick={() => alert('Button 1 clicked!')}>Button 1</button>
                <button onClick={() => alert('Button 2 clicked!')}>Button 2</button>
                <button onClick={() => alert('Button 3 clicked!')}>Button 3</button>
            </div>
        </div>
    );
};

export default TurtlePortal;