export const WORDS = [
    'balloon',
    'cap',
    'sheet',
    'glasses',
    'collar',
    'horn'
];

export const STIMULI = Object.fromEntries(
    WORDS.map(word => [
        word,
        {
            conventional: [
                `${word}1.png`,
                `${word}2.png`
            ],
            extension: `${word}-ext.png`,
            audio: `${word}.mp3`
        }
    ])
);

export const CONDITION_ORDERS = [
    ['conventional', 'novel_extension', 'challenge'],
    ['conventional', 'challenge', 'novel_extension'],
    ['novel_extension', 'conventional', 'challenge'],
    ['novel_extension', 'challenge', 'conventional'],
    ['challenge', 'conventional', 'novel_extension'],
    ['challenge', 'novel_extension', 'conventional']
];

export function mulberry32(seed) {
    let value = seed >>> 0;

    return function random() {
        value += 0x6D2B79F5;

        let result = value;

        result = Math.imul(
            result ^ (result >>> 15),
            result | 1
        );

        result ^= result + Math.imul(
            result ^ (result >>> 7),
            result | 61
        );

        return (
            (result ^ (result >>> 14)) >>> 0
        ) / 4294967296;
    };
}

export function participantIdToNumber(participantId) {
    const text = String(participantId ?? '0').trim();

    if (/^\d+$/.test(text)) {
        return Number(text) >>> 0;
    }

    let hash = 2166136261;

    for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
}

export function shuffle(items, random = Math.random) {
    const output = [...items];

    for (let index = output.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(random() * (index + 1));

        [
            output[index],
            output[swapIndex]
        ] = [
            output[swapIndex],
            output[index]
        ];
    }

    return output;
}

export function createYoking(words = WORDS, random = Math.random) {
    if (words.length < 2) {
        throw new Error('At least two words are required.');
    }

    let foilWords;

    do {
        foilWords = shuffle(words, random);
    } while (
        foilWords.some((foilWord, index) => foilWord === words[index])
    );

    return Object.fromEntries(
        words.map((word, index) => [word, foilWords[index]])
    );
}

function assignBalancedSides(trials, random = Math.random) {
    if (trials.length % 2 !== 0) {
        throw new Error(
            `Cannot exactly balance ${trials.length} trials.`
        );
    }

    const half = trials.length / 2;
    const targetSides = shuffle(
        [
            ...Array(half).fill('left'),
            ...Array(half).fill('right')
        ],
        random
    );

    return trials.map((trial, index) => {
        const targetSide = targetSides[index];
        const targetIsLeft = targetSide === 'left';

        return {
            ...trial,
            targetSide,
            leftImage: targetIsLeft
                ? trial.targetImage
                : trial.foilImage,
            rightImage: targetIsLeft
                ? trial.foilImage
                : trial.targetImage
        };
    });
}

export function generateConventionalBlock({
    stimuli = STIMULI,
    yoking,
    random = Math.random
} = {}) {
    const resolvedYoking = yoking ?? createYoking(WORDS, random);
    const trials = [];

    for (const word of WORDS) {
        const foilWord = resolvedYoking[word];

        stimuli[word].conventional.forEach((targetImage, imageIndex) => {
            const foilImage =
                stimuli[foilWord].conventional[imageIndex];

            for (let repetition = 1; repetition <= 2; repetition += 1) {
                trials.push({
                    condition: 'conventional',
                    word,
                    audio: stimuli[word].audio,
                    targetImage,
                    targetType: 'conventional',
                    foilWord,
                    foilImage,
                    foilType: 'conventional',
                    conventionalImageNumber: imageIndex + 1,
                    repetition
                });
            }
        });
    }

    return assignBalancedSides(shuffle(trials, random), random);
}

export function generateNovelExtensionBlock({
    stimuli = STIMULI,
    yoking,
    random = Math.random
} = {}) {
    const resolvedYoking = yoking ?? createYoking(WORDS, random);
    const trials = [];

    for (const word of WORDS) {
        const foilWord = resolvedYoking[word];

        for (let repetition = 1; repetition <= 2; repetition += 1) {
            trials.push({
                condition: 'novel_extension',
                word,
                audio: stimuli[word].audio,
                targetImage: stimuli[word].extension,
                targetType: 'extension',
                foilWord,
                foilImage: stimuli[foilWord].extension,
                foilType: 'extension',
                repetition
            });
        }
    }

    return assignBalancedSides(shuffle(trials, random), random);
}

export function generateChallengeBlock({
    stimuli = STIMULI,
    random = Math.random,
    challengeTarget = 'conventional'
} = {}) {
    if (
        challengeTarget !== 'conventional' &&
        challengeTarget !== 'extension'
    ) {
        throw new Error(
            'challengeTarget must be "conventional" or "extension".'
        );
    }

    const trials = [];

    for (const word of WORDS) {
        stimuli[word].conventional.forEach(
            (conventionalImage, imageIndex) => {
                const conventionalIsTarget =
                    challengeTarget === 'conventional';

                trials.push({
                    condition: 'challenge',
                    word,
                    audio: stimuli[word].audio,
                    targetImage: conventionalIsTarget
                        ? conventionalImage
                        : stimuli[word].extension,
                    targetType: conventionalIsTarget
                        ? 'conventional'
                        : 'extension',
                    foilWord: word,
                    foilImage: conventionalIsTarget
                        ? stimuli[word].extension
                        : conventionalImage,
                    foilType: conventionalIsTarget
                        ? 'extension'
                        : 'conventional',
                    conventionalImageNumber: imageIndex + 1,
                    repetition: 1
                });
            }
        );
    }

    return assignBalancedSides(shuffle(trials, random), random);
}

export function validateTrialList(trials) {
    const expectedCounts = {
        conventional: 24,
        novel_extension: 12,
        challenge: 12
    };

    if (trials.length !== 48) {
        throw new Error(
            `Expected 48 trials, received ${trials.length}.`
        );
    }

    for (
        const [condition, expectedCount]
        of Object.entries(expectedCounts)
    ) {
        const block = trials.filter(
            trial => trial.condition === condition
        );

        if (block.length !== expectedCount) {
            throw new Error(
                `${condition}: expected ${expectedCount} trials, ` +
                `received ${block.length}.`
            );
        }

        const leftCount = block.filter(
            trial => trial.targetSide === 'left'
        ).length;

        const rightCount = block.filter(
            trial => trial.targetSide === 'right'
        ).length;

        if (
            leftCount !== expectedCount / 2 ||
            rightCount !== expectedCount / 2
        ) {
            throw new Error(
                `${condition}: target sides are not exactly balanced.`
            );
        }
    }

    trials.forEach(trial => {
        if (trial.targetImage === trial.foilImage) {
            throw new Error(
                `Trial ${trial.trialNumber} has identical images.`
            );
        }
    });

    return true;
}

export function createParticipantTrials(
    participantId,
    {
        seed,
        challengeTarget = 'conventional',
        reuseYokingAcrossBlocks = true
    } = {}
) {
    const participantNumber = participantIdToNumber(participantId);
    const resolvedSeed = Number.isInteger(seed)
        ? seed
        : participantNumber;

    const random = mulberry32(resolvedSeed);
    const blockOrderIndex =
        participantNumber % CONDITION_ORDERS.length;
    const blockOrder = CONDITION_ORDERS[blockOrderIndex];

    const sharedYoking = createYoking(WORDS, random);

    const conventionalYoking = reuseYokingAcrossBlocks
        ? sharedYoking
        : createYoking(WORDS, random);

    const extensionYoking = reuseYokingAcrossBlocks
        ? sharedYoking
        : createYoking(WORDS, random);

    const blocks = {
        conventional: generateConventionalBlock({
            stimuli: STIMULI,
            yoking: conventionalYoking,
            random
        }),
        novel_extension: generateNovelExtensionBlock({
            stimuli: STIMULI,
            yoking: extensionYoking,
            random
        }),
        challenge: generateChallengeBlock({
            stimuli: STIMULI,
            random,
            challengeTarget
        })
    };

    const trials = [];
    let overallTrialNumber = 1;

    blockOrder.forEach((condition, blockIndex) => {
        blocks[condition].forEach((trial, trialWithinBlockIndex) => {
            trials.push({
                ...trial,
                participantId: String(participantId),
                seed: resolvedSeed,
                counterbalanceVersion: blockOrderIndex + 1,
                blockOrder: [...blockOrder],
                blockNumber: blockIndex + 1,
                trialWithinBlock: trialWithinBlockIndex + 1,
                trialNumber: overallTrialNumber
            });

            overallTrialNumber += 1;
        });
    });

    validateTrialList(trials);

    return {
        trials,
        seed: resolvedSeed,
        counterbalanceVersion: blockOrderIndex + 1,
        blockOrder: [...blockOrder],
        yoking: {
            conventional: conventionalYoking,
            novelExtension: extensionYoking
        }
    };
}
