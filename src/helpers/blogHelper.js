// Helper: find previous element in DOM order (walks backwards)
const previousNode = (node) => {
    if (!node) return null;
    if (node.previousSibling) {
        node = node.previousSibling;
        // go deep to the last descendant
        while (node.lastChild) node = node.lastChild;
        return node;
    }
    return node.parentElement;
};

// Helper: find nearest previous OL element before the current selection inside the editor
export const findPreviousOL = (rangeRoot, contentEditableRef) => {
    const sel = window.getSelection();
    if (sel.rangeCount === 0) return null;
    let node = sel.anchorNode;
    // If anchorNode is text, use its parent element
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    // Bound node to inside editor
    if (!contentEditableRef.current.contains(node)) node = contentEditableRef.current;

    let prev = node;
    // Walk backwards until we hit the editor root
    while (prev && prev !== rangeRoot && prev !== document) {
        prev = previousNode(prev);
        if (!prev) break;
        if (prev.nodeType === Node.ELEMENT_NODE && prev.tagName === 'OL') {
            return prev; // found previous ordered list
        }
        // if prev is an LI, check if its parent is OL
        if (prev.nodeType === Node.ELEMENT_NODE && prev.tagName === 'LI') {
            const parentOl = prev.closest('ol');
            if (parentOl && rangeRoot.contains(parentOl)) return parentOl;
        }
    }
    return null;
};

// Format date for display
export const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
};

// Handle image file upload and convert to base64
export const handleImageFileUpload = (file, callback) => {
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            callback(reader.result);
        };
        reader.readAsDataURL(file);
    }
};

// Apply text formatting with special handling for ordered lists
export const applyFormatCommand = (command, value, contentEditableRef) => {
    contentEditableRef.current.focus();

    // Special handling for ordered lists
    if (command === 'insertOrderedList') {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) {
            // position cursor at end of editor if no selection
            const range = document.createRange();
            range.selectNodeContents(contentEditableRef.current);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }

        // If inside a list item, preserve indent/outdent behavior
        const node = selection.anchorNode;
        const parentLi = node?.parentElement?.closest('li');
        if (parentLi) {
            const currentList = parentLi.parentElement;
            const isOrdered = currentList?.tagName === 'OL';
            if (isOrdered) {
                // same list type -> outdent (toggle behavior)
                document.execCommand('outdent', false, null);
                contentEditableRef.current.focus();
                return;
            } else {
                // different list type -> indent then make ordered
                document.execCommand('indent', false, null);
                document.execCommand('insertOrderedList', false, null);
                contentEditableRef.current.focus();
                return;
            }
        }

        // If we are here, user is creating a new ordered list (not toggling in same li)
        // 1) find nearest previous <ol> (if any) and compute next start
        const prevOl = findPreviousOL(contentEditableRef.current, contentEditableRef);
        let nextStart = 1;
        if (prevOl) {
            // compute last number of prevOl: start attr + number of direct li children - 1
            const prevStart = parseInt(prevOl.getAttribute('start')) || 1;
            // count only direct li children (top-level list items)
            const directLis = Array.from(prevOl.children).filter(c => c.tagName === 'LI').length;
            nextStart = prevStart + directLis;
            if (nextStart < 1) nextStart = 1;
        }

        // 2) create the ordered list
        document.execCommand('insertOrderedList', false, null);

        // 3) find the newly created ol near the selection and set its start attribute
        const selAfter = window.getSelection();
        let newOl = selAfter.anchorNode?.parentElement?.closest('ol');
        // fallback: search forwards a bit within editor for the first ol (defensive)
        if (!newOl) {
            newOl = contentEditableRef.current.querySelector('ol');
        }

        if (newOl) {
            // If nextStart is 1 then no change needed, otherwise set start so numbering continues
            if (nextStart && nextStart > 1) {
                try {
                    // set attribute and also property for browser support
                    newOl.setAttribute('start', String(nextStart));
                    newOl.start = nextStart;
                } catch (err) {
                    // some browsers may not allow setting .start property; attribute should work
                    newOl.setAttribute('start', String(nextStart));
                }
            }
        }

        contentEditableRef.current.focus();
        return;
    }

    // For unordered lists
    if (command === 'insertUnorderedList') {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) {
            const range = document.createRange();
            range.selectNodeContents(contentEditableRef.current);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }
        const node = selection.anchorNode;
        const parentLi = node?.parentElement?.closest('li');
        if (parentLi) {
            const currentList = parentLi.parentElement;
            const isUnordered = currentList?.tagName === 'UL';
            if (isUnordered) {
                document.execCommand('outdent', false, null);
            } else {
                document.execCommand('indent', false, null);
                document.execCommand('insertUnorderedList', false, null);
            }
            contentEditableRef.current.focus();
            return;
        }
        document.execCommand('insertUnorderedList', false, null);
        contentEditableRef.current.focus();
        return;
    }

    // default behavior for other commands
    document.execCommand(command, false, value);
    contentEditableRef.current.focus();
};