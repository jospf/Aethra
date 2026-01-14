import React from 'react'
import Map from './components/Map'
import { ClockWidget } from './components/widgets/ClockWidget'
import { useISS } from './hooks/useISS'
import ISSWidget from './components/widgets/ISSWidget'

function App() {
    const { issData, loading, error } = useISS();

    return (
        <div className="w-screen h-screen overflow-hidden bg-gray-900 text-white relative">
            <Map issData={issData} />

            {/* Overlay UI Layer */}
            <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6">
                <header className="flex justify-between items-start">
                    <div className="bg-gray-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 pointer-events-auto shadow-2xl">
                        <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-transparent bg-clip-text tracking-tighter">
                            Aethra
                        </h1>
                        <div className="flex items-center space-x-2 mt-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">System Online</span>
                        </div>
                    </div>

                    <div className="pointer-events-auto flex grow justify-center px-12">
                        <ClockWidget />
                    </div>

                    <div className="w-[120px]"></div> {/* Spacer for symmetry */}
                </header>

                <footer className="flex justify-between items-end">
                    <div className="bg-gray-900/60 backdrop-blur-md p-3 rounded-xl border border-white/10 pointer-events-auto text-[10px] text-gray-500 font-medium">
                        © 2026 AETHRA COMMAND • GEOSPATIAL INTELLIGENCE
                    </div>

                    <div className="pointer-events-auto">
                        <ISSWidget data={issData} loading={loading} error={error} />
                    </div>
                </footer>
            </div>
        </div>
    )
}

export default App
