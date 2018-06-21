const { Machine } = require('xstate');
const { createStatefulMachine, Reducer } = require('..');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const dtStart = new Date();
const stamp = () => Math.round((new Date() - dtStart) / 100) / 10;
const log = msg => console.log(`${stamp()}s  ${msg}`);

// use an interval activity to send an event periodically
// while in the same state.
const ticker = Reducer.util.intervalActivity({
    activity: 'tickEvery1s',
    ms: 1000,
    event: 'TICK',
});

// use a timeout activity to send a delayed event once
// while in the same state.
const autoOff = Reducer.util.timeoutActivity({
    activity: 'switchAfter5s',
    ms: 5000,
    event: 'SWITCH',
});

const machine = Machine({
    key: 'tick-tock',
    initial: 'powerOff',
    states: {
        powerOff: {
            on: {
                SWITCH: 'powerOn',
            },
        },
        powerOn: {
            // the activity property holds the name of the activity
            activities: ['log', ticker.activity, autoOff.activity],
            on: {
                SWITCH: 'powerOff',
            },
            initial: 'wheeze',
            states: {
                wheeze: {
                    activities: ['tick'],
                    on: {
                        TICK: 'groan',
                    },
                },
                groan: {
                    activities: ['tock'],
                    on: {
                        TICK: 'wheeze',
                    },
                },
            },
        },
    },
});

const reducer = Reducer.map({
    'log:start': Reducer.effect(() => {
        log('POWER ON!');
    }),

    'log:stop': Reducer.effect(() => {
        log('POWER OFF!');
    }),

    // spread the map property into the reducer map
    ...ticker.map,
    ...autoOff.map,
});

const xsf = createStatefulMachine({ machine, reducer });

const logChange = ({ state }) => {
    const tick = state.activities.tick ? 'TICK  <' : '       ';
    const tock = state.activities.tock ? '>  TOCK' : '       ';
    log(`${tick}----${tock}`);
};

const run = async () => {
    xsf.on('change', logChange);
    log('start');

    xsf.init();

    // powerOff -> powerOn.wheeze
    xsf.transition('SWITCH');

    await delay(7000);

    // as we wait, ticker fires TICK every second
    // but after 5 seconds, autoOff fires SWITCH.

    // manually restart
    xsf.transition('SWITCH');

    await delay(4000);

    // ticker and autoOff do their stuff again.
    // but before autoOff has time to fire, we manually power down.
    xsf.transition('SWITCH');

    // wait longer to prove that autoOff won't fire
    // (because it exited the state)
    await delay(5000);

    log('stop');
    xsf.off('change', logChange);
};

run();

// output:
// 0s  start
// 0s         ----
// 0s  POWER ON!
// 0s  TICK  <----
// 1s         ---->  TOCK
// 2s  TICK  <----
// 3s         ---->  TOCK
// 4s  TICK  <----
// 5s  POWER OFF!
// 5s         ----
// 7s  POWER ON!
// 7s  TICK  <----
// 8s         ---->  TOCK
// 9s  TICK  <----
// 10s         ---->  TOCK
// 11s  POWER OFF!
// 11s         ----
// 16s  stop
