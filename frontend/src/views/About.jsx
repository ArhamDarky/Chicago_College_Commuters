import React from 'react';
import '../About.css';

export default function About() {
  return (
    <div className="about-container">
      {/* Mission */}
      <section className="mission">
        <h2>Our Mission</h2>
        <p>
          At Chicago Commuters, our mission is to empower daily travelers with
          reliable, real-time transit data—so you spend less time waiting and
          more time moving.
        </p>
      </section>

      {/* Team */}
      <section className="team">
        <h2>Meet the Team</h2>
        <div className="team-grid">
          {/* Member 1 */}
          <div className="team-member">
            <img
              src="https://via.placeholder.com/150"
              alt="Arham Darky"
              className="member-photo"
            />
            <h3>Arham Darky</h3>
            <p className="role">Project Lead</p>
            <p className="major">Computer Science, DePaul University</p>
            <a
              href="https://www.linkedin.com/in/arham-darky-982aa9224/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
                alt="LinkedIn"
                className="linkedin-icon"
              />
            </a>
          </div>

          {/* Member 2 */}
          <div className="team-member">
            <img
              src="https://via.placeholder.com/150"
              alt="Member Two"
              className="member-photo"
            />
            <h3>Talha Shaikh</h3>
            <p className="role">Frontend Developer</p>
            <p className="major">Computer Science, DePaul University</p>
            <a
              href="https://www.linkedin.com/in/member-two/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
                alt="LinkedIn"
                className="linkedin-icon"
              />
            </a>
          </div>

          {/* Member 3 */}
          <div className="team-member">
            <img
              src="https://via.placeholder.com/150"
              alt="Member Three"
              className="member-photo"
            />
            <h3>Denil Dominic</h3>
            <p className="role">Backend Developer</p>
            <p className="major">Computer Science, DePaul University</p>
            <a
              href="https://www.linkedin.com/in/member-three/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
                alt="LinkedIn"
                className="linkedin-icon"
              />
            </a>
          </div>

          {/* Member 4 */}
          <div className="team-member">
            <img
              src="https://via.placeholder.com/150"
              alt="Member Four"
              className="member-photo"
            />
            <h3>Hassaan</h3>
            <p className="role">UI/UX Designer</p>
            <p className="major">Computer Science, DePaul University</p>
            <a
              href="https://www.linkedin.com/in/member-four/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
                alt="LinkedIn"
                className="linkedin-icon"
              />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

