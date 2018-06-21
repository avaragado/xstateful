const { Machine } = require('xstate');
const { createStatefulMachine, Reducer } = require('..');

// let's go async!
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const dtStart = new Date();
const stamp = () => Math.round((new Date() - dtStart) / 100) / 10;
const log = msg => console.log(`${stamp()}s  ${msg}`);

const machine = Machine({
    key: 'effects',
    initial: 'powerOff',
    states: {
        powerOff: {
            on: {
                SWITCH: 'powerOn',
            },
        },
        powerOn: {
            activities: ['log'],
            on: {
                SWITCH: 'powerOff',
            },
            initial: 'wheeze',
            states: {
                wheeze: {
                    // see comment before delayTick in the reducer about ordering
                    onEntry: ['delayTick', 'inc'],
                    on: {
                        TICK: 'groan',
                    },
                },
                groan: {
                    onEntry: 'delayTick',
                    on: {
                        TICK: 'wheeze',
                    },
                },
            },
        },
    },
});

const extstate = {
    count: 0,
};

const reducer = Reducer.map({
    // use effects for things that aren't synchronous updates to extended state,
    // such as logging, fetches, or delayed events
    'log:start': Reducer.effect(() => {
        log('POWER ON!');
    }),

    'log:stop': Reducer.effect(() => {
        log('POWER OFF!');
    }),

    inc: Reducer.update(({ extstate: xs }) => ({ count: xs.count + 1 })),

    // effects run after updates: even though delayTick appears before inc in
    // the onEntry value for powerOn.wheeze, the inc has already occurred when
    // the effect runs.
    delayTick: Reducer.effect(xsf => {
        // careful! this *always* fires, whichever state the machine is currently in
        setTimeout(() => xsf.transition('TICK'), 1000);
    }),
});

const xsf = createStatefulMachine({ machine, extstate, reducer });

const logState = ({ state, extstate: xs }) => {
    log(`state: ${state.toString()}, count: ${xs.count}`);
};

const run = async () => {
    xsf.on('change', logState);

    xsf.init();

    xsf.transition('SWITCH');

    await delay(5000);

    xsf.transition('SWITCH');

    xsf.off('change', logState);
};

run();

// output:
// 0s  state: powerOff, count: 0
// 0s  POWER ON!
// 0s  state: powerOn.wheeze, count: 1
// 1s  state: powerOn.groan, count: 1
// 2s  state: powerOn.wheeze, count: 2
// 3s  state: powerOn.groan, count: 2
// 4s  state: powerOn.wheeze, count: 3
// 5s  POWER OFF!
// 5s  state: powerOff, count: 3
