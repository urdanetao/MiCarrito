import { useState } from 'react';
import { CoreHeader } from './components';
import { Login, Engine } from './system';
import { getSessionData } from './util/util';
import { LiaBalanceScaleSolid } from 'react-icons/lia';

function App() {
    const moduleName = "MiCarrito";
    const [session, setSession] = useState(getSessionData());
    const logued = session?.sessionId?.trim() !== "" ? true : false;

    const mainWindowStyles = {
        width: "100%",
        height: "calc(100vh - 50px)",
        overflowX: "hidden",
        overflowY: "hidden",
    };

    return (
        <>
            <CoreHeader
                sessionData={session}
                moduleName={moduleName}
            />
            <div style={mainWindowStyles}>
                {logued ? <Engine setSession={setSession} /> : <Login setSession={setSession} />}
            </div>
        </>
    )
}

export default App
