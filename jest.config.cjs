module.exports = {
    projects: [
        {
            displayName: 'unit',
            testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
            setupFiles: ['<rootDir>/tests/setupEnv.js']
        },
        {
            displayName: 'integration',
            testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
            testEnvironment: 'node',
            setupFiles: ['<rootDir>/tests/setupEnv.js']
        }
    ]
};
