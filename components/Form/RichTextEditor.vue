<script setup>
const props = defineProps({
    modelValue: {
        type: String,
        default: '',
    },
    label: {
        type: String,
        default: '',
    },
    required: {
        type: Boolean,
        default: false,
    },
});

const editor = useEditor({
    content: props.modelValue,
    onUpdate: ({ editor }) => {
        emit('update:model-value', editor.getHTML());
    },
    editorProps: {
        attributes: {
            class: 'prose min-h-64 w-full max-h-96 rounded-xl p-3 bg-white rounded-b-xl rounded-t-none max-w-none focus:outline-none overflow-y-auto',
        },
    },
    extensions: [
        TiptapStarterKit,
        TiptapUnderline,
        TiptapTextAlign.configure({
            types: ['heading', 'paragraph'],
        }),
        TiptapImage.configure({
            inline: true,
            allowBase64: true,
        }),
        TiptapLink.configure({
            openOnClick: false,
        }),
        TipTapTextStyle,
        TiptapColor,
    ],
});
const emit = defineEmits(['update:model-value']);
function setLink() {
    const previousUrl = editor.value.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    // cancelled
    if (url === null) {
        return;
    }
    // empty
    if (url === '') {
        editor.value.chain().focus().extendMarkRange('link').unsetLink().run();

        return;
    }
    // update link
    editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
}

onBeforeUnmount(() => {
    unref(editor).destroy();
});
</script>
<template>
    <div>
        <label v-if="label" class="form-label opacity-75 font-light">
            <span>{{ label }}</span>
            <span v-if="label && required" class="ml-1 text-sm text-danger">*</span>
        </label>
        <div class="rounded-xl border bg-slate-50">
            <div v-if="editor" class="p-2 flex items-center gap-1.5 flex-wrap">
                <button type="button" class="editor-button" :disabled="!editor.can().chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }" @click="editor.chain().focus().toggleBold().run()">
                    <Icon name="oui:editor-bold" class="size-5" />
                </button>
                <button type="button" class="editor-button" :disabled="!editor.can().chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }" @click="editor.chain().focus().toggleItalic().run()">
                    <Icon name="oui:editor-italic" class="size-5" />
                </button>
                <button type="button" class="editor-button" :disabled="!editor.can().chain().focus().toggleStrike().run()" :class="{ 'is-active': editor.isActive('strike') }" @click="editor.chain().focus().toggleStrike().run()">
                    <Icon name="oui:editor-strike" class="size-5" />
                </button>
                <button type="button" class="editor-button" :disabled="!editor.can().chain().focus().toggleUnderline().run()" :class="{ 'is-active': editor.isActive('underline') }" @click="editor.chain().focus().toggleUnderline().run()">
                    <Icon name="oui:editor-underline" class="size-5" />
                </button>
                <button type="button" class="editor-button" :disabled="!editor.can().chain().focus().toggleCode().run()" :class="{ 'is-active': editor.isActive('code') }" @click="editor.chain().focus().toggleCode().run()">
                    <Icon name="oui:editor-code-block" class="size-5" />
                </button>
                <!--            <button type="button" class="editor-button" @click="editor.chain().focus().unsetAllMarks().run()">clear marks</button>-->
                <!--            <button type="button" class="editor-button" @click="editor.chain().focus().clearNodes().run()">clear nodes</button>-->
                <!--            <button type="button" class="editor-button" :class="{ 'is-active': editor.isActive('paragraph') }" @click="editor.chain().focus().setParagraph().run()">-->
                <!--                <Icon name="oui:token-parameter" class="size-5" />-->
                <!--            </button>-->
                <input type="color" class="editor-button size-8 !p-0" :value="editor.getAttributes('textStyle').color" @input="editor.chain().focus().setColor($event.target.value).run()" />
                <button type="button" class="editor-button !h-8 text-xs" @click="editor.chain().focus().unsetColor().run()">Remove Color</button>
                <button type="button" class="editor-button !size-8" :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }" @click="editor.chain().focus().toggleHeading({ level: 1 }).run()">h1</button>
                <button type="button" class="editor-button !size-8" :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()">h2</button>
                <button type="button" class="editor-button !size-8" :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()">h3</button>
                <button type="button" class="editor-button !size-8" :class="{ 'is-active': editor.isActive('heading', { level: 4 }) }" @click="editor.chain().focus().toggleHeading({ level: 4 }).run()">h4</button>
                <button type="button" class="editor-button !size-8" :class="{ 'is-active': editor.isActive('heading', { level: 5 }) }" @click="editor.chain().focus().toggleHeading({ level: 5 }).run()">h5</button>
                <button type="button" class="editor-button !size-8" :class="{ 'is-active': editor.isActive('heading', { level: 6 }) }" @click="editor.chain().focus().toggleHeading({ level: 6 }).run()">h6</button>
                <button type="button" class="editor-button !size-8" :class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }" @click="editor.chain().focus().setTextAlign('left').run()">
                    <Icon name="oui:editor-align-left" class="size-5" />
                </button>
                <button type="button" class="editor-button" :class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }" @click="editor.chain().focus().setTextAlign('center').run()">
                    <Icon name="oui:editor-align-center" class="size-5" />
                </button>
                <button type="button" class="editor-button" :class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }" @click="editor.chain().focus().setTextAlign('right').run()">
                    <Icon name="oui:editor-align-right" class="size-5" />
                </button>
                <button type="button" class="editor-button" :class="{ 'is-active': editor.isActive({ textAlign: 'justify' }) }" @click="editor.chain().focus().setTextAlign('justify').run()">
                    <Icon name="solar:hamburger-menu-outline" class="size-5" />
                </button>
                <button type="button" class="editor-button" @click="editor.chain().focus().unsetTextAlign().run()">
                    <Icon name="solar:list-cross-minimalistic-bold" class="size-5" />
                </button>
                <button type="button" class="editor-button" :class="{ 'is-active': editor.isActive('link') }" @click="setLink">
                    <Icon name="solar:link-bold" class="size-5" />
                </button>
                <button type="button" class="editor-button" :disabled="!editor.isActive('link')" @click="editor.chain().focus().unsetLink().run()">
                    <Icon name="solar:link-broken-linear" class="size-5" />
                </button>
                <button type="button" class="editor-button" :class="{ 'is-active': editor.isActive('bulletList') }" @click="editor.chain().focus().toggleBulletList().run()">
                    <Icon name="oui:editor-unordered-list" class="size-5" />
                </button>
                <button type="button" class="editor-button" :class="{ 'is-active': editor.isActive('orderedList') }" @click="editor.chain().focus().toggleOrderedList().run()">
                    <Icon name="oui:editor-ordered-list" class="size-5" />
                </button>
                <button type="button" class="editor-button" :class="{ 'is-active': editor.isActive('codeBlock') }" @click="editor.chain().focus().toggleCodeBlock().run()">
                    <Icon name="oui:editor-code-block" class="size-5" />
                </button>
                <button type="button" class="editor-button" :class="{ 'is-active': editor.isActive('blockquote') }" @click="editor.chain().focus().toggleBlockquote().run()">
                    <Icon name="oui:quote" class="size-5" />
                </button>
                <button type="button" class="editor-button" @click="editor.chain().focus().setHorizontalRule().run()">
                    <Icon name="octicon:horizontal-rule-24" class="size-5" />
                </button>
                <button type="button" class="editor-button" @click="editor.chain().focus().setHardBreak().run()">
                    <Icon name="carbon:text-new-line" class="size-5" />
                </button>
                <button type="button" class="editor-button" :disabled="!editor.can().chain().focus().undo().run()" @click="editor.chain().focus().undo().run()">
                    <Icon name="oui:editor-undo" class="size-5" />
                </button>
                <button type="button" class="editor-button" :disabled="!editor.can().chain().focus().redo().run()" @click="editor.chain().focus().redo().run()">
                    <Icon name="oui:editor-redo" class="size-5" />
                </button>
            </div>
            <TiptapEditorContent :editor="editor" />
        </div>
    </div>
</template>
<style scoped>
.editor-button {
    @apply p-1.5 flex place-content-center items-center bg-white hover:bg-slate-100 border disabled:opacity-25 rounded-md disabled:cursor-not-allowed cursor-pointer;
}
.is-active {
    @apply bg-dark text-white hover:text-slate-800;
}
</style>
