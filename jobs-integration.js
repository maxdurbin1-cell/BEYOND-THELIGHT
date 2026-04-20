(function () {
  const JOB_TITLES = ['Hunt', 'Guard', 'Rescue', 'Deliver', 'Investigate', 'Eliminate', 'Retrieve', 'Escort'];
  const JOB_TARGETS = ['Bandits', 'Beasts', 'Refugees', 'Cargo', 'Murders', 'Threats', 'Artifacts', 'VIPs'];
  const JOB_LOCATIONS = ['Forest', 'Mountains', 'Ruins', 'Town', 'Camp', 'Temple', 'Cave', 'Shrine'];
  const JOB_REWARDS = [50, 75, 100, 150, 200, 300, 400, 500];

  function generateJob() {
    const title = pick(JOB_TITLES);
    const target = pick(JOB_TARGETS);
    const location = pick(JOB_LOCATIONS);
    const difficulty = pick(['Easy', 'Medium', 'Hard', 'Challenging', 'Impossible']);
    const reward = pick(JOB_REWARDS);

    return {
      id: Date.now() + Math.random(),
      title: `\${title} \${target}`,
      target,
      location,
      difficulty,
      reward,
      description: `\${title} the \${target} in the \${location}. Reward: \${reward} Credits.`,
      createdAt: new Date().toISOString()
    };
  }

  function acceptJob(jobId) {
    const jobs = S.availableJobs || [];
    const job = jobs.find(j => j.id === jobId);
    if (!job) return false;

    // Create a mission from this job
    createMission(
      'Local Authority',
      job.title,
      job.difficulty,
      job.location,
      'province'
    );

    // Remove from available jobs
    S.availableJobs = jobs.filter(j => j.id !== jobId);
    showNotif(`Accepted: \${job.title}`, 'good');
    renderJobs();
    renderMissionTracker();
    return true;
  }

  function renderJobs() {
    const container = document.getElementById('jobsGrid');
    if (!container) return;

    S.availableJobs = S.availableJobs || [];

    if (!S.availableJobs.length) {
      container.innerHTML = '<div style="grid-column:1/-1;font-size:.85rem;color:var(--muted2);">Generate jobs or visit settlements to receive tasks.</div>';
      return;
    }

    container.innerHTML = S.availableJobs.map(job => `
      <div class="shop-card" style="display:flex;flex-direction:column;">
        <div class="s-name" style="color:var(--gold2);">\${job.title}</div>
        <div style="font-size:.72rem;color:var(--teal);margin:.15rem 0;">
          <strong>\${job.difficulty}</strong> • \${job.location}
        </div>
        <div style="font-size:.8rem;color:var(--text2);flex:1;margin:.2rem 0;line-height:1.5;">
          \${job.description}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:.3rem;padding-top:.3rem;border-top:1px solid var(--border);">
          <span style="font-family:'Rajdhani',sans-serif;font-weight:700;font-size:.95rem;color:var(--gold);">\${job.reward}₵</span>
          <button class="btn btn-xs btn-primary" onclick="acceptJob(\${job.id})">Accept</button>
        </div>
      </div>
    `).join('');
  }

  function generateRandomJobs(count = 5) {
    S.availableJobs = S.availableJobs || [];
    for (let i = 0; i < count; i++) {
      S.availableJobs.push(generateJob());
    }
    renderJobs();
    showNotif(`Generated \${count} jobs`, 'good');
  }

  window.generateJob = generateJob;
  window.acceptJob = acceptJob;
  window.renderJobs = renderJobs;
  window.generateRandomJobs = generateRandomJobs;

  // Mount Jobs tab UI
  function mountJobsPanel() {
    const jobsPanel = document.getElementById('tab-gambling');
    if (!jobsPanel || jobsPanel.dataset.jobsMounted) return;
    
    jobsPanel.dataset.jobsMounted = '1';
    // Jobs could be added alongside gambling or as a separate feature
  }

  document.addEventListener('DOMContentLoaded', () => {
    S.availableJobs = S.availableJobs || [];
  });
})();