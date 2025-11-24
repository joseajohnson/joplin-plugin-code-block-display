import hljs = require("./highlight/highlight");

module.exports = {
    default: function (context) {
        return {
            plugin: async function (markdownIt, options) {
                const pluginId = context.pluginId;

                const defaultRender = markdownIt.renderer.rules.fence || function (tokens, idx, options, env, self) {
                    return self.renderToken(tokens, idx, options, env, self);
                };

                // https://github.com/markdown-it/markdown-it/blob/master/docs/examples/renderer_rules.md
                markdownIt.renderer.rules.fence = function (tokens, idx, options, env, self) {

                    // Graceful fail on unrecognized languages - 识别不了的语言也能正常显示
                    tokens[idx].attrJoin("class", "hljs");

                    // Customized highlight.js implementation - 自定义highlight
                    // https://markdown-it.github.io/markdown-it/#MarkdownIt.new
                    options.highlight = (str, lang) => {
                        let codeVal = ''
                        try {
                            codeVal = hljs.highlight(str, {
                                language: lang,
                                ignoreIllegals: true
                            }).value
                        } catch (__) {
                            codeVal = str;
                        }
                        return [
                            '<div class="code-block-language">',
                            lang,
                            '</div>',
                            '<pre class="hljs">',
                            '<code class="hljs">',
                            codeVal,
                            '</code></pre>'
                        ].join('')
                    }

                    // Copy button - 复制按钮
                    const token = tokens[idx];
                    const oneLineContent = encodeURIComponent(token.content)
                        .replace(/'/g, "\\'");
                    const onClick = `
                        webviewApi.postMessage('${pluginId}', '${oneLineContent}');
                        document.getElementsByClassName('code-block-display-clipboard-button-${idx}')[0].classList.add('copied');
                        setTimeout(() => document.getElementsByClassName('code-block-display-clipboard-button-${idx}')[0].classList.remove('copied'), ${2 * 1000});
                    `.replace(/\n/g, ' ');

                    const button = `
                        <div class="code-block-display-clipboard-button code-block-display-clipboard-button-${idx}" onclick="${onClick}" title="Copy">
                            <span class="code-block-display-clipboard-copy">Copy</span>
                            <span class="code-block-display-clipboard-copied">Copied</span>
                        </div>
                    `

                    // Line number - 行号
                    const codeBlockDisplayContainerElement = document.createElement("div");
                    codeBlockDisplayContainerElement.innerHTML = `${defaultRender(tokens, idx, options, env, self)} ${button}`;

                    // filter `pre` elements with `hljs` class only
                    const preElems = codeBlockDisplayContainerElement.querySelectorAll("pre.hljs");
                    Array.from(preElems).forEach((item, index) => {
                        let num = item.innerHTML.split('\n').length - 1
                        let ul = document.createElement("ul")
                        ul.setAttribute('class', 'hljs hljs-line-num')
                        // line numbering always starts with one; good place to catch a passed start:stop range.
                        for (let i = 0; i < num; i++) {
                            let n = i + 1
                            let childLi = document.createElement("li")
                            let li_text = document.createTextNode(String(n));
                            childLi.appendChild(li_text)
                            ul.appendChild(childLi)
                        }
                        item.appendChild(ul)
                    });

                    // Folded - 折叠
                    // const foldElem = document.createElement("div");
                    // foldElem.classList.add("code-block-display-fold-button");

                    const escapeHtml = markdownIt.utils.escapeHtml;
                    const language = escapeHtml(token.info).split(/\s+/g)[0];
                    const source = `${token.markup}${escapeHtml(token.info)}&NewLine;`

                    return `
                        <div class="joplin-editable code-block-display-container">
                            <pre
                                class="joplin-source"
                                data-joplin-language="${language}"
                                data-joplin-source-open="${source}"
                                data-joplin-source-close="${token.markup}"
                            >${escapeHtml(token.content)}</pre>
                            ${codeBlockDisplayContainerElement.innerHTML}
                        </div>
                    `;
                }
            },
        }
    }
}
