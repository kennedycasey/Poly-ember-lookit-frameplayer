exp-lwl
=======

``exp-lwl`` presents a 48-trial Looking-While-Listening task using two
side-by-side images and word audio while optionally recording webcam video.

Design
------

The generated experiment contains three within-participant blocks:

* 24 conventional trials
* 12 novel-extension trials
* 12 challenge trials

The frame assigns one of six block orders using the Lookit session ID,
generates a reproducible seeded randomization, creates one-to-one yoked foils,
and balances target side exactly within each block.

Example
-------

.. code-block:: json

    "experiment": {
        "kind": "exp-lwl",
        "imageBaseUrl": "https://raw.githubusercontent.com/NAME/REPO/main/img",
        "audioBaseUrl": "https://raw.githubusercontent.com/NAME/REPO/main/mp3",
        "imageDuration": 7000,
        "audioDelay": 2000,
        "interTrialInterval": 1000,
        "challengeTarget": "conventional",
        "reuseYokingAcrossBlocks": true,
        "restartAfterPause": true,
        "pauseKey": " ",
        "pauseKeyDescription": "Space",
        "doRecording": true,
        "showWaitForRecordingMessage": true,
        "showWaitForUploadMessage": true,
        "maximizeDisplay": true,
        "displayFullscreenOverride": true
    }

Parameters
----------

imageBaseUrl
    Base URL containing PNG stimulus files.

audioBaseUrl
    Base URL containing MP3 word files.

imageDuration
    Total trial duration in milliseconds.

audioDelay
    Delay from image onset to audio onset in milliseconds.

interTrialInterval
    Fixation interval between trials in milliseconds.

challengeTarget
    Either ``conventional`` or ``extension``.

reuseYokingAcrossBlocks
    Whether conventional and novel-extension blocks share the same yoking.

doRecording
    Whether the frame starts and stops a frame-level webcam recording.

Data saved
----------

The frame saves the random seed, counterbalance version, block order, yoking,
full generated trial list, completed trial count, video IDs, stream timestamps,
and detailed event timing records for trial and audio onsets/offsets.
