import joplin from 'api';
import { SettingItemType } from "api/types";
import { ChangeEvent } from "api/JoplinSettings";

const SECTION_NAME = 'codeBlockDisplaySection';

export const settingNames = {
    codeTheme: 'codeTheme',
    showLineNumbers: 'showLineNumbers',
    showCopy: 'showCopy'
}

export const CodeThemes = [
    "1c-light",
    "agate",
    "a11y-dark",
    "a11y-light",
    "an-old-hope",
    "androidstudio",
    "arduino-light",
    "arta",
    "ascetic",
    "atom-one-dark",
    "atom-one-light",
    "brown-paper",
    "codepen-embed",
    "color-brewer",
    "dark",
    "default",
    "devibeans",
    "docco",
    "far",
    "felipec",
    "foundation",
    "github",
    "github-dark",
    "gml",
    "googlecode",
    "gradient-dark",
    "gradient-light",
    "grayscale",
    "hybrid",
    "idea",
    "intellij-light",
    "ir-black",
    "isbl-editor-dark",
    "isbl-editor-light",
    "kimbie-dark",
    "kimbie-light",
    "lightfair",
    "lioshi",
    "magula",
    "mono-blue",
    "monokai",
    "monokai-sublime",
    "night-owl",
    "nnfx-dark",
    "nord",
    "obsidian",
    "panda-syntax-dark",
    "panda-syntax-light",
    "paraiso-dark",
    "paraiso-light",
    "pojoaque",
    "purebasic",
    "qtcreator-dark",
    "qtcreator-light",
    "rainbow",
    // "rose-pine-dawn", //  as of v11.11.0, lang rec breaking changes in highlight.js
    // "rose-pine-moon",
    // "rose-pine",
    "routeros",
    "school-book",
    "shades-of-purple",
    "srcery",
    "stackoverflow-dark",
    "stackoverflow-light",
    "sunburst",
    "tokyo-night-dark",
    "tokyo-night-light",
    "tomorrow-night-blue",
    "tomorrow-night-bright",
    "vs",
    "vs2015",
    "xcode",
    "xt256"
]

function getCodeThemeOptions() {
    const res = {}
    CodeThemes.forEach((value, index) => {
        res[index] = value;
    })
    return res
}

// Set up content - 设置内容
const settingsValue = {
    [settingNames.codeTheme]: {
        label: 'Code Block Theme - 代码主题',
        type: SettingItemType.Int,
        value: CodeThemes["atom-one-dark"],
        public: true,
        isEnum: true,
        options: getCodeThemeOptions(),
        section: SECTION_NAME
    },
    [settingNames.showLineNumbers]: {
        label: 'Display Line Number - 显示行号',
        type: SettingItemType.Bool,
        value: true,
        public: true,
        section: SECTION_NAME
    },
    [settingNames.showCopy]: {
        label: 'Show Copy Button - 显示复制',
        type: SettingItemType.Bool,
        value: true,
        public: true,
        section: SECTION_NAME
    }
}

function useSettings() {

    async function registerSettings() {
        // The registration menu - 注册菜单
        await joplin.settings.registerSection(SECTION_NAME, {
            label: 'CodeBlockDisplay',
        });
        // Registration settings - 注册设置
        await joplin.settings.registerSettings(settingsValue);
    }

    async function getSetting(name: string): Promise<any> {
        return await joplin.settings.value(name)
    }

    async function handleChange(cb: (settingInfo: Record<string, any>, event: ChangeEvent) => void) {
        await joplin.settings.onChange(async event => {
            const keys = event.keys
            const settingInfo: Record<string, any> = {}
            for (let key of keys) {
                const settingVal = await getSetting(key)
                settingInfo[key] = settingVal
            }
            cb && cb(settingInfo, event);
        })
    }

    async function loadSetting(settingInfo: Record<string, any>) {
        const installDir = await joplin.plugins.installationDir();
        for (let settingInfoKey in settingInfo) {
            const settingVal = settingInfo[settingInfoKey];
            if (settingInfoKey === settingNames.codeTheme) {
                await joplin.window.loadNoteCssFile(`${installDir}/highlight/styles/${CodeThemes[settingVal]}.css`);
            } else if (settingInfoKey === settingNames.showLineNumbers) {
                if (settingVal) {
                    await joplin.window.loadNoteCssFile(`${installDir}/css/line-number.css`);
                } else {
                    await joplin.window.loadNoteCssFile(`${installDir}/css/line-number-hide.css`);
                }
            } else if (settingInfoKey === settingNames.showCopy) {
                if (settingVal) {
                    await joplin.window.loadNoteCssFile(`${installDir}/css/clipboard.css`);
                } else {
                    await joplin.window.loadNoteCssFile(`${installDir}/css/clipboard-hide.css`);
                }
            }
        }
    }

    return {
        registerSettings,
        getSetting,
        handleChange,
        loadSetting
    }
}

export default useSettings
