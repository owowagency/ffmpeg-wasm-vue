<script setup lang="ts">
import {computed, ref, watch} from 'vue';
import {createFFmpeg, fetchFile} from '@ffmpeg/ffmpeg';
import sourceVideo from '@/assets/video.webm';
import {useInterval} from '@vueuse/shared';

const canvas = ref<HTMLCanvasElement>();

const frames = ref<HTMLImageElement[]>([]);

const log = ref('');

const logElement = ref<HTMLElement>();

watch(
    log,
    () => logElement.value && (logElement.value.scrollTop = logElement.value.scrollHeight),
);

const timer = useInterval(1000 / 24);

const currentFrameIndex = computed(() => (
    timer.value % frames.value.length
));

watch(
    currentFrameIndex,
    i => {
        if (isNaN(i) || !canvas.value) {
            return;
        }

        const ctx = canvas.value.getContext('2d');

        ctx?.drawImage(frames.value[i], 0, 0);
    },
);

const ffmpeg = createFFmpeg();

ffmpeg.setLogger(({message}) => log.value += `${message}\n`);

const extractFrames = async() => {
    await ffmpeg.load();

    const video = await fetchFile(sourceVideo);

    await ffmpeg.FS(
        'writeFile',
        'sourceVideo.webm',
        video,
    );

    await ffmpeg.run('-i', 'sourceVideo.webm', '%d.webp');

    const framePaths = ffmpeg.FS('readdir', '/')
        .filter(f => f.endsWith('.webp'));

    frames.value = framePaths.map((p) => {
        const data = ffmpeg.FS('readFile', p);

        const blob = new Blob([data.buffer], {type: 'image/webp'});

        const img = new Image;

        img.src = URL.createObjectURL(blob);

        return img;
    });
};
</script>

<template>
    <canvas
        ref="canvas"
        height="500"
        width="500"
    />

    <div>
        <button @click="extractFrames">
            Extract frames
        </button>

        <pre
            ref="logElement"
            style="max-height: 400px; overflow: auto;"
            v-text="log"
        />
    </div>
</template>
