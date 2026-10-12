import { Event, UserProfile, RelevanceBreakdown } from '../types/index.js';

export function calculateRelevanceScore(
  profile: UserProfile | null,
  event: Event
): RelevanceBreakdown {
  if (!profile) {
    const totalScore = Math.round(
      (event.career_value_rating * 0.35 +
        event.learning_value_rating * 0.35 +
        (event.organizer?.trust_score ?? 50) * 0.30)
    );
    return {
      totalScore,
      goalFit: 75,
      interestFit: 70,
      careerValue: Math.round(event.career_value_rating),
      learningValue: Math.round(event.learning_value_rating),
      convenience: 85,
      communityScore: Math.round(event.rating_avg ? event.rating_avg * 20 : 50),
      organizerTrust: Math.round(event.organizer?.trust_score ?? 50),
      explanation: 'General campus event score based on its listed career/learning value, available review ratings and the organizer trust score (seeded demo figures where marked).',
      topMatchingFactors: ['Listed career and learning value']
    };
  }

  // Calculate dynamic weights based on the user's explicit priorities
  const userPriorities = profile.priorities || { career: 35, learning: 25, networking: 20, convenience: 10, fun: 10 };
  const priTotal = (userPriorities.career || 0) + (userPriorities.learning || 0) + (userPriorities.networking || 0) + (userPriorities.convenience || 0) + (userPriorities.fun || 0) || 100;

  // Base allocation
  const weightCareer = ((userPriorities.career || 30) / priTotal) * 0.50; // max 0.35
  const weightLearning = ((userPriorities.learning || 25) / priTotal) * 0.45;
  const weightNetworking = ((userPriorities.networking || 20) / priTotal) * 0.40;
  const weightConvenience = ((userPriorities.convenience || 15) / priTotal) * 0.35;

  const weightGoalFit = 0.22;
  const weightInterestFit = 0.15;
  const weightCommunity = 0.08;
  const weightOrganizer = 0.08;

  // 1. Goal Fit
  let goalMatches = 0;
  const userGoals = profile.goals || [];
  const eventTags = event.tags || [];
  const skills = event.skills_taught || [];

  for (const goal of userGoals) {
    const gLower = goal.toLowerCase();
    if (gLower.includes('internship') || gLower.includes('resume')) {
      if (event.career_value_rating >= 85 || eventTags.some(t => t.toLowerCase().includes('resume') || t.toLowerCase().includes('interview') || t.toLowerCase().includes('recruiting'))) {
        goalMatches += 1.3;
      }
    }
    if (gLower.includes('technical') || gLower.includes('skills')) {
      if (event.learning_value_rating >= 85 || skills.length > 0 || event.category === 'Workshops') {
        goalMatches += 1.2;
      }
    }
    if (gLower.includes('project') || gLower.includes('build')) {
      if (event.category === 'Hackathons' || eventTags.some(t => t.toLowerCase().includes('hands-on') || t.toLowerCase().includes('lab'))) {
        goalMatches += 1.3;
      }
    }
    if (gLower.includes('meet') || gLower.includes('network')) {
      if (event.networking_potential === 'High' || event.networking_potential === 'Exceptional' || event.category === 'Networking') {
        goalMatches += 1.3;
      }
    }
    if (gLower.includes('competition') || gLower.includes('win')) {
      if (event.category === 'Competitions' || event.category === 'Hackathons') {
        goalMatches += 1.4;
      }
    }
    if (gLower.includes('fun')) {
      if (event.category === 'Cultural' || eventTags.some(t => t.toLowerCase().includes('chill') || t.toLowerCase().includes('music') || t.toLowerCase().includes('social'))) {
        goalMatches += 1.4;
      }
    }
  }

  const rawGoalScore = userGoals.length > 0 ? (goalMatches / userGoals.length) * 100 : 75;
  const goalFit = Math.min(100, Math.max(45, Math.round(rawGoalScore)));

  // 2. Interest Fit
  let interestMatches = 0;
  const userInterests = profile.interests || [];
  const allEventText = `${event.title} ${event.tagline} ${event.description} ${eventTags.join(' ')} ${skills.join(' ')}`.toLowerCase();

  for (const interest of userInterests) {
    const tokens = interest.toLowerCase().split(/\s+/);
    if (tokens.some(token => token.length > 3 && allEventText.includes(token))) {
      interestMatches++;
    }
  }

  const rawInterestScore = userInterests.length > 0 ? (interestMatches / userInterests.length) * 110 : 70;
  const interestFit = Math.min(100, Math.max(40, Math.round(rawInterestScore)));

  // 3. Career Value
  const careerValue = Math.round(event.career_value_rating);

  // 4. Learning Value
  const learningValue = Math.round(event.learning_value_rating);

  // 5. Convenience (Distance & Commute across Delhi NCR)
  let convenience = 85;
  const studentZone = (profile.delhi_region || profile.campus_location || 'South Delhi').toLowerCase();
  const venueZone = (event.venue?.campus_zone || event.venue?.city_region || 'South Delhi').toLowerCase();

  if (studentZone.includes('south') && venueZone.includes('south')) {
    convenience = 96; // Same zone (e.g. IIT Delhi & IIIT Delhi)
  } else if (studentZone.includes('north') && venueZone.includes('north')) {
    convenience = 96; // Same zone (e.g. DU North Campus)
  } else if (venueZone.includes('central') || studentZone.includes('central')) {
    convenience = 90; // Connected by Yellow / Violet lines
  } else if ((studentZone.includes('south') && venueZone.includes('north')) || (studentZone.includes('north') && venueZone.includes('south'))) {
    convenience = 74; // Cross-town metro commute (~45 mins)
  } else if (venueZone.includes('noida') || venueZone.includes('gurugram')) {
    convenience = 78; // NCR commute
  }

  // 6. Community Score
  // No reviews => neutral 50 (unknown), not a high score.
  const communityScore = event.rating_avg ? Math.min(100, Math.round(event.rating_avg * 20)) : 50;

  // 7. Organizer Trust
  const organizerTrust = Math.round(event.organizer?.trust_score ?? 50);

  // 8. Networking potential score
  const networkingScore = event.networking_potential === 'Exceptional' ? 98 : event.networking_potential === 'High' ? 88 : event.networking_potential === 'Moderate' ? 70 : 50;

  // Normalized weighted sum
  const sumWeights = weightGoalFit + weightInterestFit + weightCareer + weightLearning + weightNetworking + weightConvenience + weightCommunity + weightOrganizer;
  
  const weightedSum =
    (goalFit * weightGoalFit +
      interestFit * weightInterestFit +
      careerValue * weightCareer +
      learningValue * weightLearning +
      networkingScore * weightNetworking +
      convenience * weightConvenience +
      communityScore * weightCommunity +
      organizerTrust * weightOrganizer) / sumWeights;

  const totalScore = Math.min(99, Math.max(35, Math.round(weightedSum)));

  // Generate top factors and human narrative explanation
  const topFactors: string[] = [];
  if (userPriorities.career >= 30 && careerValue >= 88) {
    topFactors.push(`High career leverage matching your priority (${careerValue}/100)`);
  }
  if (userPriorities.learning >= 25 && learningValue >= 88) {
    topFactors.push(`Strong learning depth matching your technical focus (${learningValue}/100)`);
  }
  if (userPriorities.networking >= 25 && (event.networking_potential === 'High' || event.networking_potential === 'Exceptional')) {
    topFactors.push(`Unmatched peer and industry networking (${event.networking_potential})`);
  }
  if (goalFit >= 85) {
    topFactors.push(`Direct alignment with your goals (${userGoals.slice(0, 2).join(', ')})`);
  }
  if (convenience >= 90) {
    topFactors.push(`Convenient Delhi metro / campus proximity (${event.venue?.campus_zone || 'Nearby'})`);
  }
  if (topFactors.length === 0) {
    topFactors.push('Balanced fit across your priorities');
  }

  const primaryPriorityName = Object.entries(userPriorities).sort((a, b) => b[1] - a[1])[0]?.[0] || 'career';
  const explanation = `Scored ${totalScore}/100 weighted heavily for your ${primaryPriorityName} priority and ${userGoals[0] || 'career'} goals, held at ${event.venue?.name || 'Delhi venue'} with an organizer trust score of ${organizerTrust}% (${event.organizer?.is_demo ? 'demo figure' : 'platform score'}).`;

  return {
    totalScore,
    goalFit,
    interestFit,
    careerValue,
    learningValue,
    convenience,
    communityScore,
    organizerTrust,
    explanation,
    topMatchingFactors: topFactors.slice(0, 3)
  };
}
