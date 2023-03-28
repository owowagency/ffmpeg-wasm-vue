<script setup lang="ts">
import {computed, ref, watch} from 'vue';
import {createFFmpeg, fetchFile} from '@ffmpeg/ffmpeg';
import sourceVideo from '@/assets/gate.mp4';
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

const createHash = async(data: Uint8Array): Promise<string> => {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    return hashArray
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
};

const openIndexDB = async(name: string, version: number, onCreateObjects: (db: IDBDatabase) => void | Promise<void>): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(name, version);
        request.onerror = function(this: IDBRequest<IDBDatabase>) {
            reject(this.error);
        };
        request.onupgradeneeded = async function(this: IDBOpenDBRequest) {
            try {
                await onCreateObjects(this.result);
            } catch (e) {
                reject(e);
            }
        };
        request.onsuccess = function(this: IDBRequest<IDBDatabase>) {
            resolve(this.result);
        };
    });
};

function awaitTransaction(request: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
        request.oncomplete = function() {
            resolve();
        };
        request.onerror = function(this: IDBTransaction) {
            reject(this.error);
        };
    });
}

function awaitRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = function() {
            resolve(request.result);
        };
        request.onerror = function() {
            reject(request.error);
        };
    });
}

const createDatabase = async() => {
    return await openIndexDB('ffmpeg-cache', 1, (db: IDBDatabase) => {
        const store = db.createObjectStore('frames', {autoIncrement: true});
        store.createIndex('hash', 'hash', {unique: false});
    });
};

const saveFrames = async(hash: string, blobs: Blob[]) => {
    const database = await createDatabase();
    const transaction = database.transaction(['frames'], 'readwrite');
    const store = transaction.objectStore('frames');
    for (const blob of blobs) {
        await awaitRequest(store.add({blob, hash}));
    }
    transaction.commit();
    await awaitTransaction(transaction);
};

const getFrames = async(hash: string): Promise<Blob[]> => {
    const database = await createDatabase();
    const transaction = database.transaction(['frames'], 'readonly');
    const request = transaction.objectStore('frames')
        .index('hash')
        .getAll(hash);
    const result = await awaitRequest(request);
    return result.map(item => item.blob);
};

const extractFrames = async() => {
    try {
        const video = await fetchFile(sourceVideo);
        const hash = await createHash(video);
        const cached = await getFrames(hash);

        if (cached.length > 0) {
            frames.value = cached.map(blob => {
                const img = new Image;

                img.src = URL.createObjectURL(blob);

                return img;
            });
            return;
        }

        await ffmpeg.load();

        const output = 'gate.mp4';

        await ffmpeg.FS(
            'writeFile',
            output,
            video,
        );

        await ffmpeg.run('-i', output, '-q:v', '2', '%d.jpg');

        const framePaths = ffmpeg.FS('readdir', '/')
            .filter(f => f.endsWith('.jpg'));

        const blobs = framePaths
            .map((p) => {
                const data = ffmpeg.FS('readFile', p);

                return new Blob([data.buffer], {type: 'image/jpg'});
            });

        await saveFrames(hash, blobs);

        frames.value = blobs.map(blob => {
            const img = new Image;

            img.src = URL.createObjectURL(blob);

            return img;
        });
    } catch (e) {
        if (e instanceof Error) {
            log.value += e.message;
        }
    }
};
</script>

<template>
    <canvas
        ref="canvas"
        height="1080"
        width="1920"
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
