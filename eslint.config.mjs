import googleappsscript from "eslint-plugin-googleappsscript";
import js from "@eslint/js";
import globals from "globals";

export default [
    js.configs.recommended,
    {
        files: ["src/**/*.{gs,js}"],
        plugins: {
            googleappsscript: googleappsscript
        },
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "script",
            globals: {
                ...globals.browser,
                ...googleappsscript.environments.googleappsscript.globals
            }
        },
        rules: {
            "no-unused-vars": "warn",
            "no-console": "off"
        }
    }
];
