import './Background.css'

const SPACING = 1000
const COUNT = 8

const Background = () => (
  <div className="background" aria-hidden="true">
    {Array.from({ length: COUNT }, (_, i) => (
      <div
        key={i}
        className={`background__ellipse background__ellipse--${i % 2 === 0 ? 'left' : 'right'}`}
        style={{ top: `${i * SPACING + SPACING / 2 - 359}px` }}
      />
    ))}
  </div>
)

export default Background
