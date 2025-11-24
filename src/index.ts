import joplin from 'api';
import { ContentScriptType } from 'api/types';
import useSettings, { settingNames } from "./settings";

const pluginId = "joseajohnson.JoplinCodeBlockDisplayPlugin"

joplin.plugins.register({
    onStart: async function () {

        const { registerSettings, handleChange, getSetting, loadSetting } = useSettings()
        registerSettings();

        await joplin.contentScripts.register(
            ContentScriptType.MarkdownItPlugin,
            pluginId,
            // compiled output of src/codeBlockDisplay.ts
            './codeBlockDisplay.js'
        );

        await joplin.contentScripts.onMessage(pluginId, (message: any) => {
            joplin.clipboard.writeText(decodeURIComponent(message));
        });

        const installDir = await joplin.plugins.installationDir();

        await joplin.window.loadNoteCssFile(`${installDir}/css/codeBlockDisplay.css`);
        await joplin.window.loadNoteCssFile(`${installDir}/css/line-number.css`);
        await joplin.window.loadNoteCssFile(`${installDir}/css/clipboard.css`);

        const settingInfo = {}
        for (let settingNamesKey in settingNames) {
            const settingVal = await getSetting(settingNamesKey)
            settingInfo[settingNamesKey] = settingVal;
        }
        await loadSetting(settingInfo);

        await handleChange(async (settingInfo, event) => {
            await loadSetting(settingInfo);
        })
    },
});
