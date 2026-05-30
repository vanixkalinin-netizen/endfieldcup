export type BracketPlayer = {
  id: string;
  nickname: string;
  discordNickname: string;
};

export type BracketSource =
  | {
      type: "seed";
      playerId: string;
    }
  | {
      type: "bye";
      id: string;
    }
  | {
      type: "match";
      matchId: string;
    }
  | {
      type: "loser";
      matchId: string;
    };

export type BracketSectionId = "upper" | "lower" | "placement";

export type BracketMatch = {
  id: string;
  section: BracketSectionId;
  roundIndex: number;
  matchIndex: number;
  label: string;
  participants: [BracketPlayer | null, BracketPlayer | null];
  winnerId: string | null;
  isLive: boolean;
  isVisible: boolean;
  isReady: boolean;
  sources: [BracketSource, BracketSource];
};

export type BracketRound = {
  id: string;
  label: string;
  section: BracketSectionId;
  matches: BracketMatch[];
};

export type BracketSection = {
  id: BracketSectionId;
  label: string;
  rounds: BracketRound[];
};

export type BracketState = {
  seeds: string[];
  winners: Record<string, string>;
  liveMatchId: string | null;
};

type RawBracketState =
  | {
      seeds?: unknown;
      winners?: unknown;
      liveMatchId?: unknown;
      slots?: unknown;
    }
  | string[]
  | null;

type PlayerMap = Map<string, BracketPlayer>;

function getUpperRoundLabel(
  matchCount: number,
  roundIndex: number,
  totalRounds: number,
) {
  if (roundIndex === 0 && matchCount !== 1) {
    return "Стартовый раунд";
  }

  if (matchCount === 1) {
    return totalRounds === 1 || roundIndex === totalRounds - 1
      ? "Финал"
      : "Полуфинал";
  }

  if (matchCount === 2) {
    return "Полуфинал";
  }

  if (matchCount === 4) {
    return "1/4 финала";
  }

  if (matchCount === 8) {
    return "1/8 финала";
  }

  if (matchCount === 16) {
    return "1/16 финала";
  }

  return `Раунд ${roundIndex + 1}`;
}

function getLowerRoundLabel(matchCount: number, roundIndex: number) {
  if (matchCount === 1) {
    return "Финал нижней сетки";
  }

  if (roundIndex === 0) {
    return "Нижний старт";
  }

  if (matchCount === 2) {
    return "Полуфинал нижней";
  }

  return `Раунд нижней ${roundIndex + 1}`;
}

function getPlacementMatchLabel(matchIndex: number) {
  return matchIndex === 0
    ? "\u0411\u0440\u043e\u043d\u0437\u043e\u0432\u044b\u0439 \u043c\u0430\u0442\u0447"
    : "\u0413\u0440\u0430\u043d\u0434-\u0444\u0438\u043d\u0430\u043b";
}

function normalizeSeedOrder(rawState: RawBracketState, participantIds: string[]) {
  const participantSet = new Set(participantIds);
  const uniqueSeeds: string[] = [];

  const rawSeeds = Array.isArray(rawState)
    ? rawState
    : Array.isArray(rawState?.seeds)
      ? rawState.seeds
      : Array.isArray(rawState?.slots)
        ? rawState.slots.filter((value) => typeof value === "string")
        : [];

  for (const value of rawSeeds) {
    if (typeof value !== "string") {
      continue;
    }

    if (!participantSet.has(value) || uniqueSeeds.includes(value)) {
      continue;
    }

    uniqueSeeds.push(value);
  }

  for (const participantId of participantIds) {
    if (!uniqueSeeds.includes(participantId)) {
      uniqueSeeds.push(participantId);
    }
  }

  return uniqueSeeds;
}

function normalizeWinners(rawState: RawBracketState) {
  if (!rawState || Array.isArray(rawState) || typeof rawState !== "object") {
    return {} as Record<string, string>;
  }

  if (!rawState.winners || typeof rawState.winners !== "object") {
    return {} as Record<string, string>;
  }

  const winners: Record<string, string> = {};

  for (const [matchId, winnerId] of Object.entries(rawState.winners)) {
    if (typeof winnerId === "string" && winnerId.trim()) {
      winners[matchId] = winnerId;
    }
  }

  return winners;
}

function normalizeLiveMatchId(rawState: RawBracketState) {
  if (!rawState || Array.isArray(rawState) || typeof rawState !== "object") {
    return null;
  }

  return typeof rawState.liveMatchId === "string" && rawState.liveMatchId.trim()
    ? rawState.liveMatchId
    : null;
}

export function parseBracketState(
  rawState: string | null | undefined,
  participantIds: string[],
): BracketState {
  let parsedState: RawBracketState = null;

  if (rawState?.trim()) {
    try {
      parsedState = JSON.parse(rawState) as RawBracketState;
    } catch {
      parsedState = null;
    }
  }

  return {
    seeds: normalizeSeedOrder(parsedState, participantIds),
    winners: normalizeWinners(parsedState),
    liveMatchId: normalizeLiveMatchId(parsedState),
  };
}

export function stringifyBracketState(state: BracketState) {
  return JSON.stringify(state);
}

function resolveSeedPlayer(playerId: string, playersById: PlayerMap) {
  return playersById.get(playerId) ?? null;
}

function resolveWinnerId(
  participants: [BracketPlayer | null, BracketPlayer | null],
  candidateWinner: string | undefined,
) {
  if (!participants[0] || !participants[1] || !candidateWinner) {
    return null;
  }

  return participants.some((participant) => participant?.id === candidateWinner)
    ? candidateWinner
    : null;
}

function resolveAdvanceId(
  participants: [BracketPlayer | null, BracketPlayer | null],
  winnerId: string | null,
  sources: [BracketSource, BracketSource],
) {
  if (winnerId) {
    return winnerId;
  }

  if (sources[1].type === "bye" && participants[0] && !participants[1]) {
    return participants[0].id;
  }

  if (sources[0].type === "bye" && participants[1] && !participants[0]) {
    return participants[1].id;
  }

  return null;
}

function resolveLoserId(
  participants: [BracketPlayer | null, BracketPlayer | null],
  winnerId: string | null,
) {
  if (!winnerId || !participants[0] || !participants[1]) {
    return null;
  }

  return participants[0].id === winnerId ? participants[1].id : participants[0].id;
}

function resolveSourcePlayer(
  source: BracketSource,
  playersById: PlayerMap,
  resolvedAdvancers: Record<string, string>,
  resolvedLosers: Record<string, string>,
) {
  if (source.type === "bye") {
    return null;
  }

  if (source.type === "seed") {
    return resolveSeedPlayer(source.playerId, playersById);
  }

  const playerId =
    source.type === "match"
      ? resolvedAdvancers[source.matchId]
      : resolvedLosers[source.matchId];

  return playerId ? (playersById.get(playerId) ?? null) : null;
}

function buildMatchPairs(sources: BracketSource[], roundId: string) {
  const pairs: [BracketSource, BracketSource][] = [];

  for (let index = 0; index < sources.length; index += 2) {
    pairs.push([
      sources[index],
      sources[index + 1] ??
        ({
          type: "bye",
          id: `${roundId}-bye-${index / 2}`,
        } satisfies BracketSource),
    ]);
  }

  return pairs;
}

function buildUpperRounds(
  initialSources: BracketSource[],
  playersById: PlayerMap,
  state: BracketState,
  resolvedWinners: Record<string, string>,
  resolvedLosers: Record<string, string>,
) {
  const rounds: BracketRound[] = [];
  let currentSources = initialSources;
  let roundIndex = 0;
  const resolvedAdvancers: Record<string, string> = {};

  while (currentSources.length > 1) {
    const roundId = `upper-round-${roundIndex}`;
    const matchPairs = buildMatchPairs(currentSources, roundId);
    const matches: BracketMatch[] = [];

    for (let matchIndex = 0; matchIndex < matchPairs.length; matchIndex += 1) {
      const sources = matchPairs[matchIndex];
      const participants: [BracketPlayer | null, BracketPlayer | null] = [
        resolveSourcePlayer(sources[0], playersById, resolvedAdvancers, resolvedLosers),
        resolveSourcePlayer(sources[1], playersById, resolvedAdvancers, resolvedLosers),
      ];
      const matchId = `${roundId}-match-${matchIndex}`;
      const winnerId = resolveWinnerId(participants, state.winners[matchId]);
      const advanceId = resolveAdvanceId(participants, winnerId, sources);
      const loserId = resolveLoserId(participants, advanceId);

      if (winnerId) {
        resolvedWinners[matchId] = winnerId;
      }

      if (advanceId) {
        resolvedAdvancers[matchId] = advanceId;
      }

      if (loserId) {
        resolvedLosers[matchId] = loserId;
      }

      matches.push({
        id: matchId,
        section: "upper",
        roundIndex,
        matchIndex,
        label: "",
        participants,
        winnerId,
        isLive: false,
        isVisible: roundIndex === 0 ? participants.some(Boolean) : participants.every(Boolean),
        isReady: participants.every(Boolean),
        sources,
      });
    }

    rounds.push({
      id: roundId,
      label: "",
      section: "upper",
      matches,
    });

    currentSources = matches.map(
      (match) =>
        ({
          type: "match",
          matchId: match.id,
        }) satisfies BracketSource,
    );
    roundIndex += 1;
  }

  rounds.forEach((round, index) => {
    const label = getUpperRoundLabel(
      round.matches.length,
      index,
      rounds.length,
    );
    round.label = label;
    round.matches.forEach((match) => {
      match.label = label;
    });
  });

  return rounds;
}

function buildLowerRounds(
  upperRounds: BracketRound[],
  playersById: PlayerMap,
  state: BracketState,
  resolvedWinners: Record<string, string>,
  resolvedLosers: Record<string, string>,
) {
  if (upperRounds.length < 2) {
    return [] as BracketRound[];
  }

  const rounds: BracketRound[] = [];
  let roundIndex = 0;
  let lowerWinnerSources: BracketSource[] = [];
  const resolvedAdvancers: Record<string, string> = {};

  function buildRound(
    sourcePool: BracketSource[],
    matchCountLabel: number,
  ) {
    if (!sourcePool.length) {
      return [] as BracketSource[];
    }

    const roundId = `lower-round-${roundIndex}`;
    const roundSources = buildMatchPairs(sourcePool, roundId);
    const matches: BracketMatch[] = [];

    for (let matchIndex = 0; matchIndex < roundSources.length; matchIndex += 1) {
      const sources = roundSources[matchIndex];
      const participants: [BracketPlayer | null, BracketPlayer | null] = [
        resolveSourcePlayer(sources[0], playersById, resolvedAdvancers, resolvedLosers),
        resolveSourcePlayer(sources[1], playersById, resolvedAdvancers, resolvedLosers),
      ];
      const matchId = `${roundId}-match-${matchIndex}`;
      const winnerId = resolveWinnerId(participants, state.winners[matchId]);
      const advanceId = resolveAdvanceId(participants, winnerId, sources);
      const loserId = resolveLoserId(participants, advanceId);

      if (winnerId) {
        resolvedWinners[matchId] = winnerId;
      }

      if (advanceId) {
        resolvedAdvancers[matchId] = advanceId;
      }

      if (loserId) {
        resolvedLosers[matchId] = loserId;
      }

      matches.push({
        id: matchId,
        section: "lower",
        roundIndex,
        matchIndex,
        label: "",
        participants,
        winnerId,
        isLive: false,
        isVisible: true,
        isReady: participants.every(Boolean),
        sources,
      });
    }

    const round: BracketRound = {
      id: roundId,
      label: getLowerRoundLabel(matchCountLabel, roundIndex),
      section: "lower",
      matches,
    };
    round.matches.forEach((match) => {
      match.label = round.label;
    });
    rounds.push(round);
    roundIndex += 1;

    return matches.map(
      (match) =>
        ({
          type: "match",
          matchId: match.id,
        }) satisfies BracketSource,
    );
  }

  const initialLoserSources = upperRounds[0].matches.map(
    (match) =>
      ({
        type: "loser",
        matchId: match.id,
      }) satisfies BracketSource,
  );
  lowerWinnerSources = buildRound(
    initialLoserSources,
    Math.ceil(initialLoserSources.length / 2),
  );

  while (lowerWinnerSources.length > 1) {
    lowerWinnerSources = buildRound(
      lowerWinnerSources,
      Math.ceil(lowerWinnerSources.length / 2),
    );
  }

  return rounds;
}

function buildPlacementRounds(
  upperRounds: BracketRound[],
  lowerRounds: BracketRound[],
  playersById: PlayerMap,
  state: BracketState,
  resolvedWinners: Record<string, string>,
  resolvedLosers: Record<string, string>,
) {
  const upperFinal = upperRounds.at(-1)?.matches.at(-1);
  const lowerFinal = lowerRounds.at(-1)?.matches.at(-1);

  if (!upperFinal || !lowerFinal) {
    return [] as BracketRound[];
  }

  const resolvedAdvancers = {
    ...resolvedWinners,
  };
  const definitions = [
    {
      id: "placement-third-place",
      label: getPlacementMatchLabel(0),
      sources: [
        { type: "loser", matchId: upperFinal.id },
        { type: "loser", matchId: lowerFinal.id },
      ] satisfies [BracketSource, BracketSource],
    },
    {
      id: "placement-first-place",
      label: getPlacementMatchLabel(1),
      sources: [
        { type: "match", matchId: upperFinal.id },
        { type: "match", matchId: lowerFinal.id },
      ] satisfies [BracketSource, BracketSource],
    },
  ];

  const matches = definitions.map((definition, matchIndex) => {
    const participants: [BracketPlayer | null, BracketPlayer | null] = [
      resolveSourcePlayer(
        definition.sources[0],
        playersById,
        resolvedAdvancers,
        resolvedLosers,
      ),
      resolveSourcePlayer(
        definition.sources[1],
        playersById,
        resolvedAdvancers,
        resolvedLosers,
      ),
    ];
    const winnerId = resolveWinnerId(participants, state.winners[definition.id]);
    const advanceId = resolveAdvanceId(participants, winnerId, definition.sources);
    const loserId = resolveLoserId(participants, advanceId);

    if (winnerId) {
      resolvedWinners[definition.id] = winnerId;
      resolvedAdvancers[definition.id] = winnerId;
    }

    if (loserId) {
      resolvedLosers[definition.id] = loserId;
    }

    return {
      id: definition.id,
      section: "placement" as const,
      roundIndex: 0,
      matchIndex,
      label: definition.label,
      participants,
      winnerId,
      isLive: false,
      isVisible: participants.every(Boolean),
      isReady: participants.every(Boolean),
      sources: definition.sources,
    } satisfies BracketMatch;
  });

  return [
    {
      id: "placement-round-0",
      label: "\u0424\u0438\u043d\u0430\u043b\u044c\u043d\u0430\u044f \u0441\u0442\u0430\u0434\u0438\u044f",
      section: "placement",
      matches,
    } satisfies BracketRound,
  ];
}

export function buildBracket(
  players: BracketPlayer[],
  rawState: string | null | undefined,
) {
  const state = parseBracketState(
    rawState,
    players.map((player) => player.id),
  );
  const playersById = new Map(players.map((player) => [player.id, player]));
  const resolvedWinners: Record<string, string> = {};
  const resolvedLosers: Record<string, string> = {};

  if (state.seeds.length < 2) {
    return {
      state: {
        ...state,
        liveMatchId: null,
      },
      rounds: [] as BracketRound[],
      upperRounds: [] as BracketRound[],
      lowerRounds: [] as BracketRound[],
      placementRounds: [] as BracketRound[],
      sections: [
        {
          id: "upper",
          label: "\u0412\u0435\u0440\u0445\u043d\u044f\u044f \u0441\u0435\u0442\u043a\u0430",
          rounds: [],
        },
        {
          id: "placement",
          label: "\u0424\u0438\u043d\u0430\u043b\u044c\u043d\u044b\u0435 \u043c\u0430\u0442\u0447\u0438",
          rounds: [],
        },
        {
          id: "lower",
          label: "\u041d\u0438\u0436\u043d\u044f\u044f \u0441\u0435\u0442\u043a\u0430",
          rounds: [],
        },
      ] satisfies BracketSection[],
      activeMatches: [] as BracketMatch[],
    };
  }

  const upperSources = state.seeds.map(
    (playerId) =>
      ({
        type: "seed",
        playerId,
      }) satisfies BracketSource,
  );

  const upperRounds = buildUpperRounds(
    upperSources,
    playersById,
    state,
    resolvedWinners,
    resolvedLosers,
  );
  const lowerRounds = buildLowerRounds(
    upperRounds,
    playersById,
    state,
    resolvedWinners,
    resolvedLosers,
  );
  const placementRounds = buildPlacementRounds(
    upperRounds,
    lowerRounds,
    playersById,
    state,
    resolvedWinners,
    resolvedLosers,
  );
  const sections: BracketSection[] = [
    {
      id: "upper",
      label: "\u0412\u0435\u0440\u0445\u043d\u044f\u044f \u0441\u0435\u0442\u043a\u0430",
      rounds: upperRounds,
    },
    {
      id: "placement",
      label: "\u0424\u0438\u043d\u0430\u043b\u044c\u043d\u044b\u0435 \u043c\u0430\u0442\u0447\u0438",
      rounds: placementRounds,
    },
    {
      id: "lower",
      label: "\u041d\u0438\u0436\u043d\u044f\u044f \u0441\u0435\u0442\u043a\u0430",
      rounds: lowerRounds,
    },
  ];
  const rounds = [...upperRounds, ...placementRounds, ...lowerRounds];
  const activeMatches = rounds.flatMap((round) =>
    round.matches.filter((match) => match.isReady && match.isVisible),
  );
  const liveMatchId = activeMatches.some((match) => match.id === state.liveMatchId)
    ? state.liveMatchId
    : null;

  rounds.forEach((round) => {
    round.matches.forEach((match) => {
      match.isLive = match.id === liveMatchId;
    });
  });

  const normalizedState: BracketState = {
    seeds: state.seeds,
    winners: resolvedWinners,
    liveMatchId,
  };

  return {
    state: normalizedState,
    rounds,
    upperRounds,
    lowerRounds,
    placementRounds,
    sections,
    activeMatches,
  };
}

