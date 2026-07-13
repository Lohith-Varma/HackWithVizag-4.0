import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { TIMELINE_DATA } from '../../data/hackathonData';
import { FiCheckCircle, FiPlay, FiClock } from 'react-icons/fi';
import './Timeline.css';

export default function Timeline() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 60%", "end end"]
  });

  const lineProgress = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className="timeline-status-icon icon-done" />;
      case 'active':
        return <FiPlay className="timeline-status-icon icon-current" />;
      default:
        return <FiClock className="timeline-status-icon icon-pending" />;
    }
  };

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <section id="timeline" className="timeline-section" ref={sectionRef}>
      <div className="glow-blob blob-timeline-purple" />

      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <span className="section-subtitle">Roadmap</span>
          <h2 className="section-title">Timeline of Events</h2>
          <p className="section-description">
            Plan your schedule accordingly. Here is the chronological path from registration to the grand prizes.
          </p>
        </div>

        {/* Timeline Container */}
        <div className="timeline-container">
          {/* Central Line Track */}
          <div className="timeline-track">
            <motion.div 
              style={{ height: lineProgress }} 
              className="timeline-track-glow" 
            />
          </div>

          {/* Timeline Nodes */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="timeline-nodes-list"
          >
            {TIMELINE_DATA.map((event, index) => {
              const isEven = index % 2 === 0;
              const statusClass = `status-${event.status}`;
              
              return (
                <motion.div 
                  key={event.id}
                  variants={itemVariants}
                  className={`timeline-item ${isEven ? 'timeline-left' : 'timeline-right'} ${statusClass}`}
                >
                  {/* central indicator dot */}
                  <div className={`timeline-dot ${statusClass}`}>
                    {getStatusIcon(event.status)}
                  </div>

                  {/* event content card */}
                  <div className="timeline-content-card">
                    <span className="timeline-date">{event.date}</span>
                    <h3 className="timeline-event-title">{event.title}</h3>
                    <p className="timeline-event-desc">{event.desc}</p>
                    {event.status === 'active' && (
                      <span className="live-pill">Active Phase</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
