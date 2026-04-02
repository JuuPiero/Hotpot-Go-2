import { createContainer, asClass, asValue, Lifetime } from 'awilix';

export const container = createContainer({
    injectionMode: 'PROXY', // phù hợp TS
});

export const registerSingleton = (name: string, Class: any) => {
    container.register({
        [name]: asClass(Class).singleton(),
    });
};

export const registerTransient = (name: string, Class: any) => {
    container.register({
        [name]: asClass(Class).transient(),
    });
};

export const registerValue = (name: string, value: any) => {
    container.register({
        [name]: asValue(value),
    });
};