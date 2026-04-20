// jobs-integration.js - Complete Integration

(function () {
  const JOB_TITLES = ['Hunt', 'Guard', 'Rescue', 'Deliver', 'Investigate', 'Eliminate', 'Retrieve', 'Escort'];
  const JOB_TARGETS = ['Bandits', 'Beasts', 'Refugees', 'Cargo', 'Murders', 'Threats', 'Artifacts', 'VIPs'];
  const JOB_LOCATIONS = ['Forest', 'Mountains', 'Ruins', 'Town', 'Camp', 'Temple', 'Cave', 'Shrine'];
  const JOB_REWARDS = [50, 75, 100, 150, 200, 300, 400, 500];
  const JOB_DIFFICULTIES = ['easy', 'medium', 'hard', 'challenging', 'impossible'];

  /**
   * Generate a random job
   */
  function generateJob() {
    const title = pick(JOB_TITLES);
    const target = pick(JOB_TARGETS);
    const location = pick(JOB_LOCATIONS);
    const difficulty = pick(JOB_DIFFICULTIES);
    const reward = pick(JOB_REWARDS);

    return {
      id: Date.now() + Math.random(),
      title: `${title} ${target}`,
      target,
      location,
      difficulty,
      reward,
      description: `${title} the ${target} in the ${location}. Reward: ${reward} Credits.`,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Accept a job and convert to mission
   */
  function acceptJob(jobId) {
    const jobs = S.availableJobs || [];
    const job = jobs.find(j => j.id === jobId);
    if (!job) return false;

    // Create mission from job
    createMission(
      'Local Authority',
      job.title,
      job.difficulty,
      job.location,
      'province'
    );

    // Award credits to character
    if (typeof S.credits !== 'undefined') {
      S.credits = (S.credits || 0) + (job.reward * 0.25); // 25% upfront
      updateCreditsUI();
    }

    // Remove from available
    S.availableJobs = jobs.filter(j => j.id !== jobId);
    showNotif(`Accepted: ${job.title}`, 'good');
    renderJobs();
    return true;
  }

  /**
   * Render available jobs
   */
  function renderJobs() {
    const container = document.getElementById('jobsGrid');
    if (!container) return;

    S.availableJobs = S.availableJobs || [];

    if (!S.availableJobs.length) {
      container.innerHTML = `
        <div style="grid-column:1/-1;font-size:.85rem;color:var(--muted2);padding:1rem;text-align:center;">
          No available jobs. Generate new jobs or visit settlements.
        </div>
      `;
      return;
    }

    container.innerHTML = S.availableJobs.map(job => `
      <div class="shop-card" style="display:flex;flex-direction:column;">
        <div class="s-name" style="color:var(--gold2);">${job.title}</div>
        <div style="font-size:.72rem;color:var(--teal);margin:.15rem 0;text-transform:uppercase;letter-spacing:.05em;">
          <strong>${job.difficulty}</strong> • ${job.location}
        </div>
        <div style="font-size:.8rem;color:var(--text2);flex:1;margin:.3rem 0;line-height:1.5;">
          ${job.description}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:.3rem;padding-top:.3rem;border-top:1px solid var(--border);">
          <span style="font-family:'Rajdhani',sans-serif;font-weight:700;font-size:.95rem;color:var(--gold);">${job.reward}₵</span>
          <button class="btn btn-xs btn-primary" onclick="acceptJob(${job.id})">Accept</button>
        </div>
      </div>
    `).join('');
  }

  /**
   * Generate random jobs
   */
  function generateRandomJobs(count = 5) {
    S.availableJobs = S.availableJobs || [];
    for (let i = 0; i < count; i++) {
      S.availableJobs.push(generateJob());
    }
    renderJobs();
    showNotif(`Generated ${count} new jobs`, 'good');
  }

  // Expose to window
  window.generateJob = generateJob;
  window.acceptJob = acceptJob;
  window.renderJobs = renderJobs;
  window.generateRandomJobs = generateRandomJobs;

  // Initialize on load
  document.addEventListener('DOMContentLoaded', () => {
    S.availableJobs = S.availableJobs || [];
    renderJobs();
  });
})();
