import { useEffect, useState } from 'react'

interface AnimatedProgressBarProps {
  progress: number
}

const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({ progress }) => {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    const intervalId = setInterval(() => {
      setAnimate(prev => !prev)
    }, 1000)

    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
      <div 
        className={`bg-green-600 h-2.5 rounded-full transition-all duration-1000 ${animate ? 'opacity-100' : 'opacity-75'}`} 
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  )
}

export default AnimatedProgressBar