export const WORDS = [
    'balloon',
    'cap',
    'sheet',
    'glasses',
    'collar',
    'horn'
];

function createStimuli(words) {
    const stimuli = {};

    words.forEach(function(word) {
        stimuli[word] = {
            conventional: [
                word + '1.png',
                word + '2.png'
            ],
            extension: word + '-ext.png',
            audio: word + '.mp3'
        };
    });

    return stimuli;
}

export const STIMULI = createStimuli(WORDS);

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
        let result;

        value += 0x6D2B79F5;
        result = value;

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
    let participantIdForText;
    let text;
    let hash;
    let index;

    if (
        participantId === null ||
        participantId === undefined
    ) {
        participantIdForText = '0';
    } else {
        participantIdForText = participantId;
    }

    text = String(participantIdForText).trim();

    if (/^\d+$/.test(text)) {
        return Number(text) >>> 0;
    }

    hash = 2166136261;

    for (index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
}

export function shuffle(items, random) {
    const output = items.slice();
    let index;
    let swapIndex;
    let temporaryValue;

    if (typeof random !== 'function') {
        random = Math.random;
    }

    for (
        index = output.length - 1;
        index > 0;
        index -= 1
    ) {
        swapIndex = Math.floor(
            random() * (index + 1)
        );

        temporaryValue = output[index];
        output[index] = output[swapIndex];
        output[swapIndex] = temporaryValue;
    }

    return output;
}

export function createYoking(words, random) {
    let foilWords;
    let hasFixedPoint;
    let index;
    const yoking = {};

    if (!words) {
        words = WORDS;
    }

    if (typeof random !== 'function') {
        random = Math.random;
    }

    if (words.length < 2) {
        throw new Error(
            'At least two words are required.'
        );
    }

    do {
        foilWords = shuffle(words, random);
        hasFixedPoint = false;

        for (
            index = 0;
            index < words.length;
            index += 1
        ) {
            if (foilWords[index] === words[index]) {
                hasFixedPoint = true;
                break;
            }
        }
    } while (hasFixedPoint);

    words.forEach(function(word, wordIndex) {
        yoking[word] = foilWords[wordIndex];
    });

    return yoking;
}

function copyTrial(trial) {
    const copiedTrial = {};

    Object.keys(trial).forEach(function(key) {
        copiedTrial[key] = trial[key];
    });

    return copiedTrial;
}

function assignBalancedSides(trials, random) {
    const targetSides = [];
    const assignedTrials = [];
    const half = trials.length / 2;
    let index;
    let targetSide;
    let targetIsLeft;
    let assignedTrial;

    if (typeof random !== 'function') {
        random = Math.random;
    }

    if (trials.length % 2 !== 0) {
        throw new Error(
            'Cannot exactly balance ' +
            trials.length +
            ' trials.'
        );
    }

    for (index = 0; index < half; index += 1) {
        targetSides.push('left');
        targetSides.push('right');
    }

    const shuffledSides = shuffle(
        targetSides,
        random
    );

    trials.forEach(function(trial, trialIndex) {
        targetSide = shuffledSides[trialIndex];
        targetIsLeft = targetSide === 'left';
        assignedTrial = copyTrial(trial);

        assignedTrial.targetSide = targetSide;

        assignedTrial.leftImage = targetIsLeft
            ? trial.targetImage
            : trial.foilImage;

        assignedTrial.rightImage = targetIsLeft
            ? trial.foilImage
            : trial.targetImage;

        assignedTrials.push(assignedTrial);
    });

    return assignedTrials;
}

export function generateConventionalBlock(options) {
    let stimuli;
    let yoking;
    let random;
    let resolvedYoking;
    const trials = [];

    options = options || {};

    stimuli = options.stimuli || STIMULI;
    yoking = options.yoking;
    random = typeof options.random === 'function'
        ? options.random
        : Math.random;

    resolvedYoking = yoking ||
        createYoking(WORDS, random);

    WORDS.forEach(function(word) {
        const foilWord = resolvedYoking[word];

        stimuli[word].conventional.forEach(
            function(targetImage, imageIndex) {
                const foilImage =
                    stimuli[foilWord]
                        .conventional[imageIndex];

                let repetition;

                for (
                    repetition = 1;
                    repetition <= 2;
                    repetition += 1
                ) {
                    trials.push({
                        condition: 'conventional',
                        word: word,
                        audio: stimuli[word].audio,
                        targetImage: targetImage,
                        targetType: 'conventional',
                        foilWord: foilWord,
                        foilImage: foilImage,
                        foilType: 'conventional',
                        conventionalImageNumber:
                            imageIndex + 1,
                        repetition: repetition
                    });
                }
            }
        );
    });

    return assignBalancedSides(
        shuffle(trials, random),
        random
    );
}

export function generateNovelExtensionBlock(options) {
    let stimuli;
    let yoking;
    let random;
    let resolvedYoking;
    const trials = [];

    options = options || {};

    stimuli = options.stimuli || STIMULI;
    yoking = options.yoking;
    random = typeof options.random === 'function'
        ? options.random
        : Math.random;

    resolvedYoking = yoking ||
        createYoking(WORDS, random);

    WORDS.forEach(function(word) {
        const foilWord = resolvedYoking[word];
        let repetition;

        for (
            repetition = 1;
            repetition <= 2;
            repetition += 1
        ) {
            trials.push({
                condition: 'novel_extension',
                word: word,
                audio: stimuli[word].audio,
                targetImage:
                    stimuli[word].extension,
                targetType: 'extension',
                foilWord: foilWord,
                foilImage:
                    stimuli[foilWord].extension,
                foilType: 'extension',
                repetition: repetition
            });
        }
    });

    return assignBalancedSides(
        shuffle(trials, random),
        random
    );
}

export function generateChallengeBlock(options) {
    let stimuli;
    let random;
    let challengeTarget;
    const trials = [];

    options = options || {};

    stimuli = options.stimuli || STIMULI;

    random = typeof options.random === 'function'
        ? options.random
        : Math.random;

    challengeTarget =
        options.challengeTarget || 'conventional';

    if (
        challengeTarget !== 'conventional' &&
        challengeTarget !== 'extension'
    ) {
        throw new Error(
            'challengeTarget must be ' +
            '"conventional" or "extension".'
        );
    }

    WORDS.forEach(function(word) {
        stimuli[word].conventional.forEach(
            function(conventionalImage, imageIndex) {
                const conventionalIsTarget =
                    challengeTarget ===
                    'conventional';

                trials.push({
                    condition: 'challenge',
                    word: word,
                    audio: stimuli[word].audio,
                    targetImage:
                        conventionalIsTarget
                            ? conventionalImage
                            : stimuli[word].extension,
                    targetType:
                        conventionalIsTarget
                            ? 'conventional'
                            : 'extension',
                    foilWord: word,
                    foilImage:
                        conventionalIsTarget
                            ? stimuli[word].extension
                            : conventionalImage,
                    foilType:
                        conventionalIsTarget
                            ? 'extension'
                            : 'conventional',
                    conventionalImageNumber:
                        imageIndex + 1,
                    repetition: 1
                });
            }
        );
    });

    return assignBalancedSides(
        shuffle(trials, random),
        random
    );
}

export function validateTrialList(trials) {
    const expectedCounts = {
        conventional: 24,
        novel_extension: 12,
        challenge: 12
    };

    if (trials.length !== 48) {
        throw new Error(
            'Expected 48 trials, received ' +
            trials.length +
            '.'
        );
    }

    Object.keys(expectedCounts).forEach(
        function(condition) {
            const expectedCount =
                expectedCounts[condition];

            const block = trials.filter(
                function(trial) {
                    return (
                        trial.condition === condition
                    );
                }
            );

            const leftCount = block.filter(
                function(trial) {
                    return (
                        trial.targetSide === 'left'
                    );
                }
            ).length;

            const rightCount = block.filter(
                function(trial) {
                    return (
                        trial.targetSide === 'right'
                    );
                }
            ).length;

            if (block.length !== expectedCount) {
                throw new Error(
                    condition +
                    ': expected ' +
                    expectedCount +
                    ' trials, received ' +
                    block.length +
                    '.'
                );
            }

            if (
                leftCount !== expectedCount / 2 ||
                rightCount !== expectedCount / 2
            ) {
                throw new Error(
                    condition +
                    ': target sides are not ' +
                    'exactly balanced.'
                );
            }
        }
    );

    trials.forEach(function(trial) {
        if (trial.targetImage === trial.foilImage) {
            throw new Error(
                'Trial ' +
                trial.trialNumber +
                ' has identical images.'
            );
        }
    });

    return true;
}

export function createParticipantTrials(
    participantId,
    options
) {
    let seed;
    let challengeTarget;
    let reuseYokingAcrossBlocks;
    let resolvedSeed;
    let random;
    let blockOrderIndex;
    let blockOrder;
    let sharedYoking;
    let conventionalYoking;
    let extensionYoking;
    let participantIdForOutput;

    const participantNumber =
        participantIdToNumber(participantId);

    const trials = [];
    let overallTrialNumber = 1;

    options = options || {};

    seed = options.seed;

    challengeTarget =
        options.challengeTarget ||
        'conventional';

    reuseYokingAcrossBlocks =
        options.reuseYokingAcrossBlocks;

    if (
        reuseYokingAcrossBlocks === undefined ||
        reuseYokingAcrossBlocks === null
    ) {
        reuseYokingAcrossBlocks = true;
    }

    if (
        typeof seed === 'number' &&
        isFinite(seed) &&
        Math.floor(seed) === seed
    ) {
        resolvedSeed = seed;
    } else {
        resolvedSeed = participantNumber;
    }

    random = mulberry32(resolvedSeed);

    blockOrderIndex =
        participantNumber %
        CONDITION_ORDERS.length;

    blockOrder =
        CONDITION_ORDERS[blockOrderIndex].slice();

    sharedYoking = createYoking(
        WORDS,
        random
    );

    if (reuseYokingAcrossBlocks) {
        conventionalYoking = sharedYoking;
        extensionYoking = sharedYoking;
    } else {
        conventionalYoking = createYoking(
            WORDS,
            random
        );

        extensionYoking = createYoking(
            WORDS,
            random
        );
    }

    const blocks = {
        conventional:
            generateConventionalBlock({
                stimuli: STIMULI,
                yoking: conventionalYoking,
                random: random
            }),

        novel_extension:
            generateNovelExtensionBlock({
                stimuli: STIMULI,
                yoking: extensionYoking,
                random: random
            }),

        challenge:
            generateChallengeBlock({
                stimuli: STIMULI,
                random: random,
                challengeTarget:
                    challengeTarget
            })
    };

    if (
        participantId === null ||
        participantId === undefined
    ) {
        participantIdForOutput = '';
    } else {
        participantIdForOutput =
            String(participantId);
    }

    blockOrder.forEach(
        function(condition, blockIndex) {
            blocks[condition].forEach(
                function(
                    trial,
                    trialWithinBlockIndex
                ) {
                    const outputTrial =
                        copyTrial(trial);

                    outputTrial.participantId =
                        participantIdForOutput;

                    outputTrial.seed =
                        resolvedSeed;

                    outputTrial.counterbalanceVersion =
                        blockOrderIndex + 1;

                    outputTrial.blockOrder =
                        blockOrder.slice();

                    outputTrial.blockNumber =
                        blockIndex + 1;

                    outputTrial.trialWithinBlock =
                        trialWithinBlockIndex + 1;

                    outputTrial.trialNumber =
                        overallTrialNumber;

                    trials.push(outputTrial);
                    overallTrialNumber += 1;
                }
            );
        }
    );

    validateTrialList(trials);

    return {
        trials: trials,
        seed: resolvedSeed,
        counterbalanceVersion:
            blockOrderIndex + 1,
        blockOrder: blockOrder.slice(),
        yoking: {
            conventional:
                conventionalYoking,
            novelExtension:
                extensionYoking
        }
    };
}