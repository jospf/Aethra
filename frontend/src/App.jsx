import React from 'react'
import Map from './components/Map'

function App() {
    return (
        <div className="w-screen h-screen overflow-hidden bg-gray-900 text-white relative">
            <Map />

            {/* Overlay UI Layer */}
            <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-8">
                <header className="flex justify-between items-start">
                    <div className="bg-gray-900/80 backdrop-blur-md p-4 rounded-lg border border-gray-700/50 pointer-events-auto">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
                            Aethra
                        </h1>
                        <p className="text-xs text-gray-400 mt-1">System Online</p>
                    </div>
                </header>

                <footer className="flex justify-between items-end">
                    {/* Footer content placeholders */}
                </footer>
            </div>
        </div>
    )
}

export default App
