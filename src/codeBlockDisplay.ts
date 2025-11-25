import hljs = require("./highlight/highlight");

console.log('codeBlockDisplay hljs:', !!hljs);

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

                    // Copy button - 复制按钮
                    const token = tokens[idx];
                    const oneLineContent = encodeURIComponent(token.content)
                        .replace(/'/g, "\\'");
                    const onClick = `
webviewApi.postMessage('${pluginId}', '${oneLineContent}');
document.getElementsByClassName('code-block-display-clipboard-button-${idx}')[0].classList.add('copied');
setTimeout(() => document.getElementsByClassName('code-block-display-clipboard-button-${idx}')[0].classList.remove('copied'), ${4 * 1000});`.replace(/\n/g, ' ');

                    const copyButton = `
<div class="code-block-display-clipboard-button code-block-display-clipboard-button-${idx}" onclick="${onClick}" title="Copy">
    <span class="code-block-display-clipboard-copy">Copy</span>
    <span class="code-block-display-clipboard-copied">Copied</span>
</div>`

                    // Folded - 折叠
                    // const foldElem = document.createElement("div");
                    // foldElem.classList.add("code-block-display-fold-button");

                    const foldedOnClick = [
                        '( function(el){',
                        ' try {',
                        " const langDiv = el.closest('.code-block-language');",
                        " const target = langDiv ? langDiv.nextElementSibling : (el.closest('pre') || el.nextElementSibling);",
                        " if(target){ target.classList.toggle('code-block-display-fold-hidden'); }",
                        ' } catch(e){ console.error(e); }',
                        ' })(this);',
                        " document.getElementsByClassName('code-block-display-fold-button-",
                        idx,
                        "')[0].classList.add('folded');",
                        " setTimeout(() => document.getElementsByClassName('code-block-display-fold-button-",
                        idx,
                        "')[0].classList.remove('folded'), ",
                        (4 * 1000),
                        ");"
                    ].join('')

                    const foldedButton = [
                        '<div class="code-block-display-fold-button code-block-display-fold-button-',
                        idx,
                        '" onclick="',
                        foldedOnClick,
                        '" title="Fold">',
                        '<span class="code-block-display-fold">Fold</span>',
                        '<span class="code-block-display-folded">Toggled</span>',
                        '</div>'
                    ].join('')

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
                            '<pre class="hljs">',
                            '<code class="hljs">',
                            codeVal,
                            '</code></pre>'
                        ].join('')
                    }

                    // Line number - 行号
                    const codeBlockDisplayContainerElement = document.createElement("div");
                    codeBlockDisplayContainerElement.innerHTML = `${defaultRender(tokens, idx, options, env, self)}`;

                    // filter only for `pre` elements with `hljs` class
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

                    const escapeHtml = markdownIt.utils.escapeHtml;
                    const language = escapeHtml(token.info).split(/\s+/g)[0];
                    const source = `${token.markup}${escapeHtml(token.info)}&NewLine;`

                    // Group buttons so their relative positions are stable; copy button remains to the right
                    return `
                        <div class="joplin-editable code-block-display-container">
                            <pre
                                class="joplin-source"
                                data-joplin-language="${language}"
                                data-joplin-source-open="${source}"
                                data-joplin-source-close="${token.markup}"
                            >${escapeHtml(token.content)}</pre>
                            <div class="code-block-language">${language}
                                <div class="code-block-display-buttons">${foldedButton}${copyButton}</div>
                            </div>
                            ${codeBlockDisplayContainerElement.innerHTML}
                        </div>
                    `;
                }
            },
        }
    }
}
