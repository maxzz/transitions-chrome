export const INVALID_CTX_MESSAGE_TYPE = "invalidctx";

export function showInvalidCtx() {
    let div = document.getElementById('dpport-invalid-ctx');
    if (!div) {
        div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.padding = '1px 8px';
        div.style.right = '2px';
        div.style.top = '1px';
        div.style.fontSize = '0.65rem';
        div.style.textAlign = 'center';
        div.style.color = 'white';
        div.style.backgroundColor = 'red';
        div.style.border = '1px dotted white';
        div.style.borderRadius = '3px';
        div.style.pointerEvents = 'none';
        div.style.zIndex = '2147483646';

        div.textContent = `The extension has been reloaded: reload this page.`;
        div.id = 'dpport-invalid-ctx';
        document.body.insertBefore(div, document.body.firstChild);
    }
}
