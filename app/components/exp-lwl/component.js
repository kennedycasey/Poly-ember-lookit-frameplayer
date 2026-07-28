import Ember from 'ember';

import layout from './template';
import ExpFrameBaseComponent from '../exp-frame-base/component';
import VideoRecord from '../../mixins/video-record';

import {
    createParticipantTrials
} from '../../utils/lookit-lwl-trials';

const {
    computed,
    run
} = Ember;

export default ExpFrameBaseComponent.extend(VideoRecord, {
    layout,
    type: 'exp-lwl',
    classNames: ['exp-lwl'],
    displayFullscreen: true,

    // VideoRecord configuration.
    doUseCamera: computed.alias('doRecording'),
    startRecordingAutomatically: computed.alias('doRecording'),

    frameSchemaProperties: {
imageBaseUrl: {
    type: 'string',
    default:
        'https://raw.githubusercontent.com/kennedycasey/Poly-Lookit/master/img'
},
audioBaseUrl: {
    type: 'string',
    default:
        'https://raw.githubusercontent.com/kennedycasey/Poly-Lookit/master/mp3'
},

introAudio: {
    type: 'string',
    default: 'intro.mp3'
},

attentionVideoBaseUrl: {
    type: 'string',
    default:
        'https://raw.githubusercontent.com/kennedycasey/Poly-Lookit/master/mp4'
},

calibrationEnabled: {
    type: 'boolean',
    default: true
},

calibrationDuration: {
    type: 'number',
    default: 750
},

calibrationRepeats: {
    type: 'number',
    default: 2
},

attentionVideos: {
    type: 'array',
    default: [
        'AG1.mp4',
        'AG2.mp4', 
        'AG3.mp4', 
        'AG4.mp4', 
        'AG5.mp4', 
        'AG6.mp4', 
        'AG7.mp4'
    ]
},

lightImage: {
    type: 'string',
    default: 'light.png'
},

darkImage: {
    type: 'string',
    default: 'dark.png'
},

lightDarkDuration: {
    type: 'number',
    default: 750
},

attentionEveryNTrials: {
    type: 'number',
    minimum: 1,
    default: 6
},

fixationImage: {
    type: 'string',
    default: 'fixation.gif'
},
itiAudio: {
    type: 'string',
    default: 'ITI.mp3'
},
        imageDuration: {
            type: 'number',
            minimum: 1,
            default: 7000
        },
        audioDelay: {
            type: 'number',
            minimum: 0,
            default: 2000
        },
        interTrialInterval: {
            type: 'number',
            minimum: 0,
            default: 500
        },
        challengeTarget: {
            type: 'string',
            enum: ['conventional', 'extension'],
            default: 'conventional'
        },
        reuseYokingAcrossBlocks: {
            type: 'boolean',
            default: true
        },
        doRecording: {
            type: 'boolean',
            default: true
        },
        restartAfterPause: {
            type: 'boolean',
            default: true
        },
        pauseKey: {
            type: 'string',
            default: ' '
        },
        pauseKeyDescription: {
            type: 'string',
            default: 'Space'
        }
    },

    meta: {
        data: {
            type: 'object',
            properties: {
                participantSeed: {
                    type: 'number'
                },
counterbalanceVersion: {
    type: 'number'
},
yokingVersion: {
    type: 'number'
},
counterbalanceCell: {
    type: 'number'
},
blockOrder: {
    type: 'array'
},
                yoking: {
                    type: 'object'
                },
                generatedTrials: {
                    type: 'array'
                },
                completedTrialCount: {
                    type: 'number'
                }
            }
        }
    },

    trials: null,
    currentTrial: null,
    currentTrialIndex: 0,
    completedTrialCount: 0,
    attentionVideoIndex: 0,
    currentAttentionVideo: null,    

participantSeed: null,
counterbalanceVersion: null,
yokingVersion: null,
counterbalanceCell: null,
blockOrder: null,
    yoking: null,
    generatedTrials: null,

    phase: 'loading',
    paused: false,
    finishing: false,
    experimentStarted: false,

    audioElement: null,
    audioTimer: null,
    trialTimer: null,
    interTrialTimer: null,

    leftImageUrl: computed(
        'currentTrial.leftImage',
        'imageBaseUrl',
        function() {
            const trial = this.get('currentTrial');
            return trial
                ? this.joinUrl(this.get('imageBaseUrl'), trial.leftImage)
                : '';
        }
    ),

    rightImageUrl: computed(
        'currentTrial.rightImage',
        'imageBaseUrl',
        function() {
            const trial = this.get('currentTrial');
            return trial
                ? this.joinUrl(this.get('imageBaseUrl'), trial.rightImage)
                : '';
        }
    ),

    lightImageUrl: computed(
    'lightImage',
    'imageBaseUrl',
    function() {
        return this.joinUrl(
            this.get('imageBaseUrl'),
            this.get('lightImage')
        );
    }
),

darkImageUrl: computed(
    'darkImage',
    'imageBaseUrl',
    function() {
        return this.joinUrl(
            this.get('imageBaseUrl'),
            this.get('darkImage')
        );
    }
),

    itiAudioUrl: computed(
    'itiAudio',
    'audioBaseUrl',
    function() {
        return this.joinUrl(
            this.get('audioBaseUrl'),
            this.get('itiAudio')
        );
    }
),

introAudioUrl: computed(
    'introAudio',
    'audioBaseUrl',
    function() {
        return this.joinUrl(
            this.get('audioBaseUrl'),
            this.get('introAudio')
        );
    }
),

calibrationOnLeft: computed(
    'calibrationStep',
    function() {
        return this.get('calibrationStep') % 2 === 0;
    }
),

calibrationOnRight: computed(
    'calibrationStep',
    function() {
        return this.get('calibrationStep') % 2 === 1;
    }
),

attentionVideoUrl: computed(
    'currentAttentionVideo',
    'attentionVideoBaseUrl',
    function() {
        const filename =
            this.get('currentAttentionVideo');

        if (!filename) {
            return '';
        }

        return this.joinUrl(
            this.get('attentionVideoBaseUrl'),
            filename
        );
    }
),
    fixationImageUrl: computed(
    'fixationImage',
    'imageBaseUrl',
    function() {
        return this.joinUrl(
            this.get('imageBaseUrl'),
            this.get('fixationImage')
        );
    }
),

    init() {
        this._super(...arguments);
        this.set('trials', []);
        this.set('blockOrder', []);
        this.set('generatedTrials', []);
        this.set('yoking', {});
    },

    didInsertElement() {
        this._super(...arguments);

        this._boundKeyHandler = event => this.handleKeyDown(event);
        Ember.$(document).on('keydown.exp-lwl', this._boundKeyHandler);

        // VideoRecord calls onRecordingStarted when automatic recording begins.
        // With recording disabled, begin immediately after insertion.
        if (!this.get('doRecording')) {
            run.next(this, this.beginExperiment);
        }
    },

    willDestroyElement() {
        this.clearTimers();
        this.stopAudio();
        Ember.$(document).off('keydown.exp-lwl', this._boundKeyHandler);
        this._super(...arguments);
    },

onRecordingStarted() {
    this.hideRecorder();
    this.beginExperiment();
},

    participantIdentifier() {
        const session = this.get('session');
        return session && session.get
            ? session.get('id')
            : 'local-preview-participant';
    },

    beginExperiment() {
        if (this.get('experimentStarted') || this.get('isDestroyed')) {
            return;
        }

        console.log('exp-lwl imageBaseUrl:', this.get('imageBaseUrl'));
        console.log('exp-lwl audioBaseUrl:', this.get('audioBaseUrl'));

        const participantId = this.participantIdentifier();
        const generated = createParticipantTrials(participantId, {
            challengeTarget: this.get('challengeTarget'),
            reuseYokingAcrossBlocks: this.get('reuseYokingAcrossBlocks')
        });

this.setProperties({
    experimentStarted: true,
    trials: generated.trials,
    generatedTrials: generated.trials,
participantSeed: generated.seed,
counterbalanceVersion:
    generated.counterbalanceVersion,
yokingVersion:
    generated.yokingVersion,
counterbalanceCell:
    generated.counterbalanceCell,
blockOrder:
    generated.blockOrder,
    yoking: generated.yoking,
    currentTrialIndex: 0,
    completedTrialCount: 0,
    attentionVideoIndex: 0,
    calibrationStep: 0,
    currentAttentionVideo: null,
    phase: 'loading'
});

this.send('setTimeEvent', 'experimentGenerated', {
    participantId: participantId,
    seed: generated.seed,

    counterbalanceVersion:
        generated.counterbalanceVersion,

    yokingVersion:
        generated.yokingVersion,

    counterbalanceCell:
        generated.counterbalanceCell,

    blockOrder:
        generated.blockOrder,

    yoking:
        generated.yoking,

    trialCount:
        generated.trials.length
});

if (this.get('calibrationEnabled')) {
    this.startCalibration();
} else {
    this.startLightDarkSequence();
}},

preloadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => resolve(url);
        img.onerror = () => {
            reject(new Error(`Failed to load image: ${url}`));
        };

        img.src = url;
    });
},

shouldShowAttentionGetter(completedCount) {
    const everyN =
        this.get('attentionEveryNTrials');

    const totalTrials =
        (this.get('trials') || []).length;

    return (
        completedCount > 0 &&
        completedCount < totalTrials &&
        completedCount % everyN === 0
    );
},

startAttentionGetter() {
    const videos =
        this.get('attentionVideos') || [];

    if (videos.length === 0) {
        this.startCurrentTrial();
        return;
    }

    const videoIndex =
        this.get('attentionVideoIndex') %
        videos.length;

    const filename = videos[videoIndex];

    this.setProperties({
        phase: 'attention',
        currentTrial: null,
        currentAttentionVideo: filename,
        attentionVideoIndex: videoIndex + 1
    });

    this.send(
        'setTimeEvent',
        'attentionGetterStarted',
        {
            completedTrialCount:
                this.get('completedTrialCount'),
            attentionVideo: filename,
            attentionVideoUrl:
                this.get('attentionVideoUrl')
        }
    );
},

endAttentionGetter() {
    if (
        this.get('paused') ||
        this.get('finishing')
    ) {
        return;
    }

    const filename =
        this.get('currentAttentionVideo');

    this.send(
        'setTimeEvent',
        'attentionGetterEnded',
        {
            completedTrialCount:
                this.get('completedTrialCount'),
            attentionVideo: filename
        }
    );

    this.setProperties({
        currentAttentionVideo: null,
        phase: 'intertrial'
    });

    // Fixation appears and ITI audio begins together.
    this.playITIAudio();

    this.set(
        'interTrialTimer',
        run.later(this, () => {
            this.startCurrentTrial();
        }, this.get('interTrialInterval'))
    );
},

startCalibration() {
    if (
        this.get('paused') ||
        this.get('finishing') ||
        this.get('isDestroyed')
    ) {
        return;
    }

    this.stopAudio();
    this.cancelTimer('interTrialTimer');

    this.setProperties({
        phase: 'calibration',
        currentTrial: null,
        calibrationStep: 0
    });

    this.send(
        'setTimeEvent',
        'calibrationStarted',
        {
            repeats: this.get('calibrationRepeats'),
            duration: this.get('calibrationDuration')
        }
    );

    this.send(
        'setTimeEvent',
        'calibrationPositionChanged',
        {
            step: 1,
            position: 'left'
        }
    );

    this.scheduleNextCalibrationStep();
},

scheduleNextCalibrationStep() {
    this.set(
        'interTrialTimer',
        run.later(this, () => {
            this.advanceCalibration();
        }, this.get('calibrationDuration'))
    );
},

advanceCalibration() {
    if (
        this.get('paused') ||
        this.get('finishing') ||
        this.get('isDestroyed')
    ) {
        return;
    }

    const currentStep =
        this.get('calibrationStep');

    const totalSteps =
        Math.max(
            1,
            this.get('calibrationRepeats')
        ) * 2;

    const nextStep = currentStep + 1;

    if (nextStep >= totalSteps) {
        this.finishCalibration();
        return;
    }

    this.set('calibrationStep', nextStep);

    this.send(
        'setTimeEvent',
        'calibrationPositionChanged',
        {
            step: nextStep + 1,
            position:
                nextStep % 2 === 0
                    ? 'left'
                    : 'right'
        }
    );

    this.scheduleNextCalibrationStep();
},
startLightDarkSequence() {
    if (
        this.get('paused') ||
        this.get('finishing') ||
        this.get('isDestroyed')
    ) {
        return;
    }

    this.cancelTimer('interTrialTimer');
    this.stopAudio();

    const lightUrl = this.get('lightImageUrl');
    const darkUrl = this.get('darkImageUrl');

    Promise.all([
        this.preloadImage(lightUrl),
        this.preloadImage(darkUrl)
    ]).then(() => {
        if (
            this.get('paused') ||
            this.get('finishing') ||
            this.get('isDestroyed')
        ) {
            return;
        }

        this.setProperties({
            phase: 'light',
            currentTrial: null
        });

        this.send('setTimeEvent', 'lightScreenStarted', {
            imageUrl: lightUrl,
            duration: this.get('lightDarkDuration')
        });

        this.set(
            'interTrialTimer',
            run.later(this, () => {
                this.showDarkScreen();
            }, this.get('lightDarkDuration'))
        );
    }).catch(error => {
        console.error('Failed to preload startup images:', error);

        // Continue even if preloading fails.
        this.set('phase', 'light');

        this.set(
            'interTrialTimer',
            run.later(this, () => {
                this.showDarkScreen();
            }, this.get('lightDarkDuration'))
        );
    });
},

finishCalibration() {
    this.cancelTimer('interTrialTimer');

    this.send(
        'setTimeEvent',
        'calibrationEnded',
        {
            repeats:
                this.get('calibrationRepeats')
        }
    );

    this.startLightDarkSequence();
},
showDarkScreen() {
    if (
        this.get('paused') ||
        this.get('finishing') ||
        this.get('isDestroyed')
    ) {
        return;
    }

    this.setProperties({
        phase: 'dark',
        currentTrial: null
    });

    this.send(
        'setTimeEvent',
        'darkScreenStarted',
        {
            imageUrl:
                this.get('darkImageUrl'),
            duration:
                this.get('lightDarkDuration')
        }
    );

    this.set(
        'interTrialTimer',
        run.later(this, () => {
            this.showIntroScreen();
        }, this.get('lightDarkDuration'))
    );
},

showIntroScreen() {
    if (
        this.get('paused') ||
        this.get('finishing') ||
        this.get('isDestroyed')
    ) {
        return;
    }

    this.setProperties({
        phase: 'intro',
        currentTrial: null
    });

    run.next(this, this.playIntroAudio);
},
    startCurrentTrial() {
    if (this.get('paused') || this.get('finishing')) {
        return;
    }

    const trials = this.get('trials') || [];
    const index = this.get('currentTrialIndex');

    if (index >= trials.length) {
        this.finishExperiment();
        return;
    }

    const trial = trials[index];

    const leftUrl = this.joinUrl(
        this.get('imageBaseUrl'),
        trial.leftImage
    );

    const rightUrl = this.joinUrl(
        this.get('imageBaseUrl'),
        trial.rightImage
    );

 Promise.all([
    this.preloadImage(leftUrl),
    this.preloadImage(rightUrl)
]).then(() => {
    if (
        this.get('isDestroyed') ||
        this.get('paused') ||
        this.get('finishing')
    ) {
        return;
    }

    this.setProperties({
        currentTrial: trial,
        phase: 'stimulus'
    });

    this.send(
        'setTimeEvent',
        'trialStarted',
        this.trialEventData(trial)
    );

    this.set(
        'audioTimer',
        run.later(this, () => {
            this.playTrialAudio();
        }, this.get('audioDelay'))
    );

    this.set(
        'trialTimer',
        run.later(this, () => {
            this.endCurrentTrial();
        }, this.get('imageDuration'))
    );
}).catch(error => {
    console.error('Failed to preload trial images:', {
        leftUrl,
        rightUrl,
        error
    });

    if (this.get('isDestroyed')) {
        return;
    }

    this.send('setTimeEvent', 'imageError', {
        ...this.trialEventData(trial),
        leftUrl,
        rightUrl,
        errorMessage: error.message || 'Image preload failed'
    });

    const nextIndex = this.get('currentTrialIndex') + 1;
this.setProperties({
    currentTrialIndex: nextIndex,
    completedTrialCount: nextIndex,
    currentTrial: null,
    phase: 'intertrial'
});
this.set(
    'interTrialTimer',
    run.later(this, () => {
        this.startCurrentTrial();
    }, this.get('interTrialInterval'))
);
});
},

playTrialAudio() {
    if (this.get('paused') || !this.get('currentTrial')) {
        return;
    }

    this.stopAudio();

    const trial = this.get('currentTrial');
    const audioUrl = this.joinUrl(
        this.get('audioBaseUrl'),
        trial.audio
    );

    const audio = new Audio(audioUrl);

    this.set('audioElement', audio);

    audio.addEventListener('play', () => {
        if (!this.get('isDestroyed')) {
            this.send('setTimeEvent', 'audioStarted', {
                ...this.trialEventData(trial),
                audioUrl
            });
        }
    }, { once: true });

    audio.addEventListener('ended', () => {
        if (!this.get('isDestroyed')) {
            this.send(
                'setTimeEvent',
                'audioEnded',
                this.trialEventData(trial)
            );
        }
    }, { once: true });

    audio.play().catch(error => {
        console.error('Failed to play trial audio:', {
            audioUrl,
            error
        });

        if (!this.get('isDestroyed')) {
            this.send('setTimeEvent', 'audioError', {
                ...this.trialEventData(trial),
                audioUrl,
                errorMessage: error.message || 'Audio playback failed'
            });
        }
    });
},
playIntroAudio() {
    if (
        this.get('paused') ||
        this.get('finishing') ||
        this.get('isDestroyed')
    ) {
        return;
    }

    this.stopAudio();

    const audioUrl =
        this.get('introAudioUrl');

    const audio =
        new Audio(audioUrl);

    this.set('audioElement', audio);

    const beginTrials = () => {
        if (
            this.get('isDestroyed') ||
            this.get('paused') ||
            this.get('finishing')
        ) {
            return;
        }

        this.set('audioElement', null);

        this.send(
            'setTimeEvent',
            'introAudioEnded',
            {
                audioUrl: audioUrl
            }
        );

        this.set('phase', 'intertrial');
        this.startCurrentTrial();
    };

    audio.addEventListener(
        'play',
        () => {
            if (!this.get('isDestroyed')) {
                this.send(
                    'setTimeEvent',
                    'introAudioStarted',
                    {
                        audioUrl: audioUrl
                    }
                );
            }
        },
        { once: true }
    );

    audio.addEventListener(
        'ended',
        beginTrials,
        { once: true }
    );

    audio.play().catch(error => {
        console.error(
            'Failed to play intro audio:',
            {
                audioUrl: audioUrl,
                error: error
            }
        );

        if (!this.get('isDestroyed')) {
            this.send(
                'setTimeEvent',
                'introAudioError',
                {
                    audioUrl: audioUrl,
                    errorMessage:
                        error.message ||
                        'Intro audio playback failed'
                }
            );
        }

        /*
         * Continue to Trial 1 even if the
         * intro audio cannot be played.
         */
        this.set('audioElement', null);
        this.set('phase', 'intertrial');
        this.startCurrentTrial();
    });
},
playITIAudio() {
    if (this.get('paused')) {
        return;
    }

    const audio = new Audio(this.get('itiAudioUrl'));

    this.set('audioElement', audio);

    audio.play().catch(error => {
        console.error('Failed to play ITI audio:', error);
    });
},
    endCurrentTrial() {
    const trial = this.get('currentTrial');

    if (!trial || this.get('paused') || this.get('finishing')) {
        return;
    }

    this.stopAudio();
    this.cancelTimer('audioTimer');
    this.cancelTimer('trialTimer');

    this.send(
        'setTimeEvent',
        'trialEnded',
        this.trialEventData(trial)
    );

    const nextIndex =
        this.get('currentTrialIndex') + 1;

    this.setProperties({
        currentTrialIndex: nextIndex,
        completedTrialCount: nextIndex,
        currentTrial: null,
        phase: 'intertrial'
    });

if (this.shouldShowAttentionGetter(nextIndex)) {
    this.set(
        'interTrialTimer',
        run.later(this, () => {
            this.startAttentionGetter();
        }, this.get('interTrialInterval'))
    );
} else {
    // Fixation is now visible, so start ITI audio immediately.
    this.playITIAudio();

    this.set(
        'interTrialTimer',
        run.later(this, () => {
            this.startCurrentTrial();
        }, this.get('interTrialInterval'))
    );
}
},

    finishExperiment() {
        if (this.get('finishing')) {
            return;
        }

        this.setProperties({
            finishing: true,
            phase: 'finished',
            currentTrial: null
        });

        this.clearTimers();
        this.stopAudio();

this.send('setTimeEvent', 'experimentCompleted', {
    completedTrialCount:
        this.get('completedTrialCount'),

    seed:
        this.get('participantSeed'),

    counterbalanceVersion:
        this.get('counterbalanceVersion'),

    yokingVersion:
        this.get('yokingVersion'),

    counterbalanceCell:
        this.get('counterbalanceCell'),

    blockOrder:
        this.get('blockOrder')
});

        if (this.get('doRecording')) {
            if (!this.get('stopping') && !this.get('stoppedRecording')) {
                this.set('stopping', true);

                this.stopRecorder().then(
                    () => this.advanceAfterRecording(),
                    () => this.advanceAfterRecording()
                );
            } else {
                this.advanceAfterRecording();
            }
        } else {
            this.send('next');
        }
    },

    advanceAfterRecording() {
        if (this.get('isDestroyed')) {
            return;
        }

        this.set('stoppedRecording', true);
        this.destroyRecorder();
        this.send('next');
    },

    handleKeyDown(event) {
        const expectedKey = this.get('pauseKey') || ' ';

        if (event.key !== expectedKey && event.code !== 'Space') {
            return;
        }

        event.preventDefault();

        if (this.get('paused')) {
            this.resumeExperiment();
        } else {
            this.pauseExperiment();
        }
    },

    pauseExperiment() {
        if (
            this.get('paused') ||
            this.get('finishing') ||
            !this.get('experimentStarted')
        ) {
            return;
        }

        this.set('paused', true);
        this.clearTimers();
        this.stopAudio();

        this.send('setTimeEvent', 'experimentPaused', {
            currentTrialIndex: this.get('currentTrialIndex'),
            trialNumber: this.get('currentTrial.trialNumber') || null
        });
    },

    resumeExperiment() {
        if (!this.get('paused') || this.get('finishing')) {
            return;
        }

        this.set('paused', false);

        this.send('setTimeEvent', 'experimentResumed', {
            currentTrialIndex: this.get('currentTrialIndex'),
            restartAfterPause: this.get('restartAfterPause')
        });
if (this.get('phase') === 'calibration') {
    this.scheduleNextCalibrationStep();
    return;
}

if (this.get('restartAfterPause')) {
    this.startCurrentTrial();
} else {
    this.endCurrentTrial();
}
    },

    trialEventData(trial) {
        return {
            trialNumber: trial.trialNumber,
            trialWithinBlock: trial.trialWithinBlock,
            blockNumber: trial.blockNumber,
            condition: trial.condition,
            word: trial.word,
            audio: trial.audio,
            targetImage: trial.targetImage,
            targetType: trial.targetType,
            foilWord: trial.foilWord,
            foilImage: trial.foilImage,
            foilType: trial.foilType,
            targetSide: trial.targetSide,
            leftImage: trial.leftImage,
            rightImage: trial.rightImage,
            repetition: trial.repetition,
            conventionalImageNumber: trial.conventionalImageNumber || null,
            seed: trial.seed,
counterbalanceVersion:
    trial.counterbalanceVersion,

yokingVersion:
    trial.yokingVersion
        };
    },

    joinUrl(baseUrl, filename) {
        if (!baseUrl) {
            return filename;
        }

        return `${baseUrl.replace(/\/$/, '')}/${filename}`;
    },

    stopAudio() {
        const audio = this.get('audioElement');

        if (audio) {
            audio.pause();

            try {
                audio.currentTime = 0;
            } catch (error) {
                // Some browsers reject resetting media before metadata loads.
            }
        }

        this.set('audioElement', null);
    },

    cancelTimer(timerName) {
        const timer = this.get(timerName);

        if (timer) {
            run.cancel(timer);
            this.set(timerName, null);
        }
    },

    clearTimers() {
        this.cancelTimer('audioTimer');
        this.cancelTimer('trialTimer');
        this.cancelTimer('interTrialTimer');
    },

actions: {
    togglePause() {
        if (this.get('paused')) {
            this.resumeExperiment();
        } else {
            this.pauseExperiment();
        }
    },

    attentionEnded() {
        this.endAttentionGetter();
    }
}
});