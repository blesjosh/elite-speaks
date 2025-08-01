"use client";

/**
 * @author: @dorian_baffier
 * @description: File Upload
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import {
    useState,
    useRef,
    useCallback,
    type DragEvent,
    useEffect,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { UploadCloud, File as FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type FileStatus = "idle" | "dragging" | "uploading" | "error";

interface FileError {
    message: string;
    code: string;
}

interface FileUploadProps {
    onUploadSuccess?: (file: File) => void;
    onUploadError?: (error: FileError) => void;
    acceptedFileTypes?: string[];
    maxFileSize?: number;
    currentFile?: File | null;
    onFileRemove?: () => void;
    /** Duration in milliseconds for the upload simulation. Defaults to 2000ms (2s), 0 for no simulation */
    uploadDelay?: number;
    validateFile?: (file: File) => FileError | null;
    className?: string;
    disabled?: boolean;
}

const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const UPLOAD_STEP_SIZE = 5;
const FILE_SIZES = [
    "Bytes",
    "KB",
    "MB",
    "GB",
    "TB",
    "PB",
    "EB",
    "ZB",
    "YB",
] as const;

const formatBytes = (bytes: number, decimals = 2): string => {
    if (!+bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const unit = FILE_SIZES[i] || FILE_SIZES[FILE_SIZES.length - 1];
    return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${unit}`;
};

const UploadIllustration = () => (
    <div className="relative w-16 h-16">
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            aria-label="Upload illustration"
        >
            <title>Upload File Illustration</title>
            <circle
                cx="50"
                cy="50"
                r="45"
                className="stroke-gray-200 dark:stroke-gray-700"
                strokeWidth="2"
                strokeDasharray="4 4"
            >
                <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 50 50"
                    to="360 50 50"
                    dur="60s"
                    repeatCount="indefinite"
                />
            </circle>

            <path
                d="M30 35H70C75 35 75 40 75 40V65C75 70 70 70 70 70H30C25 70 25 65 25 65V40C25 35 30 35 30 35Z"
                className="fill-blue-100 dark:fill-blue-900/30 stroke-blue-500 dark:stroke-blue-400"
                strokeWidth="2"
            >
                <animate
                    attributeName="d"
                    dur="2s"
                    repeatCount="indefinite"
                    values="
                        M30 35H70C75 35 75 40 75 40V65C75 70 70 70 70 70H30C25 70 25 65 25 65V40C25 35 30 35 30 35Z;
                        M30 38H70C75 38 75 43 75 43V68C75 73 70 73 70 73H30C25 73 25 68 25 68V43C25 38 30 38 30 38Z;
                        M30 35H70C75 35 75 40 75 40V65C75 70 70 70 70 70H30C25 70 25 65 25 65V40C25 35 30 35 30 35Z"
                />
            </path>

            <path
                d="M30 35C30 35 35 35 40 35C45 35 45 30 50 30C55 30 55 35 60 35C65 35 70 35 70 35"
                className="stroke-blue-500 dark:stroke-blue-400"
                strokeWidth="2"
                fill="none"
            />

            <g className="transform translate-y-2">
                <line
                    x1="50"
                    y1="45"
                    x2="50"
                    y2="60"
                    className="stroke-blue-500 dark:stroke-blue-400"
                    strokeWidth="2"
                    strokeLinecap="round"
                >
                    <animate
                        attributeName="y2"
                        values="60;55;60"
                        dur="2s"
                        repeatCount="indefinite"
                    />
                </line>
                <polyline
                    points="42,52 50,45 58,52"
                    className="stroke-blue-500 dark:stroke-blue-400"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                >
                    <animate
                        attributeName="points"
                        values="42,52 50,45 58,52;42,47 50,40 58,47;42,52 50,45 58,52"
                        dur="2s"
                        repeatCount="indefinite"
                    />
                </polyline>
            </g>
        </svg>
    </div>
);

const UploadingAnimation = ({ progress }: { progress: number }) => (
    <div className="relative w-16 h-16">
        <svg
            viewBox="0 0 240 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            aria-label={`Upload progress: ${Math.round(progress)}%`}
        >
            <title>Upload Progress Indicator</title>

            <defs>
                <mask id="progress-mask">
                    <rect width="240" height="240" fill="black" />
                    <circle
                        r="120"
                        cx="120"
                        cy="120"
                        fill="white"
                        strokeDasharray={`${(progress / 100) * 754}, 754`}
                        transform="rotate(-90 120 120)"
                    />
                </mask>
            </defs>

            <style>
                {`
                    @keyframes rotate-cw {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    @keyframes rotate-ccw {
                        from { transform: rotate(360deg); }
                        to { transform: rotate(0deg); }
                    }
                    .g-spin circle {
                        transform-origin: 120px 120px;
                    }
                    .g-spin circle:nth-child(1) { animation: rotate-cw 8s linear infinite; }
                    .g-spin circle:nth-child(2) { animation: rotate-ccw 8s linear infinite; }
                    .g-spin circle:nth-child(3) { animation: rotate-cw 8s linear infinite; }
                    .g-spin circle:nth-child(4) { animation: rotate-ccw 8s linear infinite; }
                    .g-spin circle:nth-child(5) { animation: rotate-cw 8s linear infinite; }
                    .g-spin circle:nth-child(6) { animation: rotate-ccw 8s linear infinite; }
                    .g-spin circle:nth-child(7) { animation: rotate-cw 8s linear infinite; }
                    .g-spin circle:nth-child(8) { animation: rotate-ccw 8s linear infinite; }
                    .g-spin circle:nth-child(9) { animation: rotate-cw 8s linear infinite; }
                    .g-spin circle:nth-child(10) { animation: rotate-ccw 8s linear infinite; }
                    .g-spin circle:nth-child(11) { animation: rotate-cw 8s linear infinite; }
                    .g-spin circle:nth-child(12) { animation: rotate-ccw 8s linear infinite; }
                    .g-spin circle:nth-child(13) { animation: rotate-cw 8s linear infinite; }
                    .g-spin circle:nth-child(14) { animation: rotate-ccw 8s linear infinite; }

                    .g-spin circle:nth-child(2n) { animation-delay: 0.2s; }
                    .g-spin circle:nth-child(3n) { animation-delay: 0.3s; }
                    .g-spin circle:nth-child(5n) { animation-delay: 0.5s; }
                    .g-spin circle:nth-child(7n) { animation-delay: 0.7s; }
                `}
            </style>

            <g
                className="g-spin"
                strokeWidth="10"
                strokeDasharray="18% 40%"
                mask="url(#progress-mask)"
            >
                <circle
                    r="150"
                    cx="120"
                    cy="120"
                    stroke="#FF2E7E"
                    opacity="0.95"
                />
                <circle
                    r="140"
                    cx="120"
                    cy="120"
                    stroke="#FFD600"
                    opacity="0.95"
                />
                <circle
                    r="130"
                    cx="120"
                    cy="120"
                    stroke="#00E5FF"
                    opacity="0.95"
                />
                <circle
                    r="120"
                    cx="120"
                    cy="120"
                    stroke="#FF3D71"
                    opacity="0.95"
                />
                <circle
                    r="110"
                    cx="120"
                    cy="120"
                    stroke="#4ADE80"
                    opacity="0.95"
                />
                <circle
                    r="100"
                    cx="120"
                    cy="120"
                    stroke="#2196F3"
                    opacity="0.95"
                />
                <circle
                    r="90"
                    cx="120"
                    cy="120"
                    stroke="#FFA726"
                    opacity="0.95"
                />
                <circle
                    r="80"
                    cx="120"
                    cy="120"
                    stroke="#FF1493"
                    opacity="0.95"
                />
                <circle
                    r="70"
                    cx="120"
                    cy="120"
                    stroke="#FFEB3B"
                    opacity="0.95"
                />
                <circle
                    r="60"
                    cx="120"
                    cy="120"
                    stroke="#00BCD4"
                    opacity="0.95"
                />
                <circle
                    r="50"
                    cx="120"
                    cy="120"
                    stroke="#FF4081"
                    opacity="0.95"
                />
                <circle
                    r="40"
                    cx="120"
                    cy="120"
                    stroke="#76FF03"
                    opacity="0.95"
                />
                <circle
                    r="30"
                    cx="120"
                    cy="120"
                    stroke="#448AFF"
                    opacity="0.95"
                />
                <circle
                    r="20"
                    cx="120"
                    cy="120"
                    stroke="#FF3D00"
                    opacity="0.95"
                />
            </g>
        </svg>
    </div>
);

export default function FileUpload({
    onUploadSuccess,
    onUploadError,
    acceptedFileTypes = ["*"],
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
    currentFile,
    onFileRemove,
    uploadDelay = 2000,
    validateFile: customValidateFile,
    className,
    disabled = false,
}: FileUploadProps) {
    const [status, setStatus] = useState<FileStatus>("idle");
    const [file, setFile] = useState<File | null>(currentFile || null);
    const [error, setError] = useState<FileError | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setFile(currentFile || null);
    }, [currentFile]);

    const handleFileChange = useCallback(
        (selectedFile: File | null) => {
            if (disabled || !selectedFile) return;

            const validationError = customValidateFile
                ? customValidateFile(selectedFile)
                : validateFile(selectedFile);

            if (validationError) {
                setStatus("error");
                setError(validationError);
                onUploadError?.(validationError);
                return;
            }

            setError(null);
            setFile(selectedFile);
            setStatus("uploading");
            simulateUpload(selectedFile);
        },
        [customValidateFile, onUploadError, disabled]
    );

    const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        setStatus("dragging");
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        setStatus("idle");
    };

    const handleDrop = useCallback(
        (e: DragEvent<HTMLDivElement>) => {
            if (disabled) return;
            e.preventDefault();
            e.stopPropagation();
            setStatus("idle");
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile) {
                handleFileChange(droppedFile);
            }
        },
        [handleFileChange, disabled]
    );

    const handleButtonClick = () => {
        if (disabled) return;
        fileInputRef.current?.click();
    };

    const handleRemoveFile = () => {
        if (disabled) return;
        setFile(null);
        setStatus("idle");
        setError(null);
        setUploadProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        onFileRemove?.();
    };

    const validateFile = (fileToValidate: File): FileError | null => {
        if (fileToValidate.size > maxFileSize) {
            return {
                message: `File is too large. Maximum size: ${formatBytes(maxFileSize)}.`,
                code: "file-too-large",
            };
        }
        if (
            !acceptedFileTypes.includes("*") &&
            !acceptedFileTypes.some((type) =>
                new RegExp(`^${type.replace(/\*/g, ".*")}$`).test(
                    fileToValidate.type
                )
            )
        ) {
            return {
                message: `Invalid file type. Accepted types: ${acceptedFileTypes.join(
                    ", "
                )}.`,
                code: "invalid-file-type",
            };
        }
        return null;
    };

    const simulateUpload = (fileToUpload: File) => {
        setUploadProgress(0);
        const step = () => {
            setUploadProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    onUploadSuccess?.(fileToUpload);
                    return 100;
                }
                return prev + UPLOAD_STEP_SIZE;
            });
        };
        const interval = setInterval(step, uploadDelay / (100 / UPLOAD_STEP_SIZE));
    };

    return (
        <div
            className={cn(
                "group relative w-full p-4 sm:p-6 border-2 border-dashed rounded-lg text-center transition-colors duration-300 ease-in-out",
                {
                    "border-primary bg-primary/5": status === "dragging",
                    "border-gray-300 dark:border-gray-600 hover:border-primary/50":
                        status === "idle",
                    "border-destructive bg-destructive/5": status === "error",
                    "cursor-not-allowed opacity-50": disabled,
                },
                className
            )}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => {
                if (disabled) return;
                e.preventDefault();
            }}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                className="hidden"
                accept={acceptedFileTypes.join(",")}
                disabled={disabled}
            />

            <AnimatePresence mode="wait">
                {!file ? (
                    <motion.div
                        key="upload-prompt"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex flex-col items-center justify-center space-y-2"
                    >
                        <div className="p-3 bg-background rounded-full shadow-sm">
                            <UploadIllustration />
                        </div>
                        <p className="font-semibold text-lg text-foreground">
                            Drag & drop a file here or{" "}
                            <button
                                type="button"
                                onClick={handleButtonClick}
                                className="text-primary hover:underline focus:outline-none font-semibold"
                                disabled={disabled}
                            >
                                browse
                            </button>
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Max file size: {formatBytes(maxFileSize)}
                        </p>
                        {disabled && (
                            <p className="text-sm text-muted-foreground">
                                (Uploading is disabled)
                            </p>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="file-info"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex flex-col items-center justify-center space-y-2"
                    >
                        <FileIcon className="w-10 h-10 text-primary" />
                        <p
                            className="font-semibold text-foreground truncate max-w-full px-4"
                            title={file.name}
                        >
                            {file.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {formatBytes(file.size)}
                        </p>
                        {status === "uploading" && (
                            <div className="w-full max-w-xs mt-2">
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-primary"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${uploadProgress}%` }}
                                        transition={{
                                            duration:
                                                uploadDelay /
                                                (100 / UPLOAD_STEP_SIZE) /
                                                1000,
                                            ease: "linear",
                                        }}
                                    />
                                </div>
                                <p className="text-sm mt-1 text-muted-foreground">
                                    {uploadProgress}%
                                </p>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="mt-2 text-sm text-destructive hover:underline"
                            disabled={disabled}
                        >
                            Remove
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {status === "error" && error && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 w-11/12 p-2 bg-destructive/10 text-destructive text-sm rounded-md"
                >
                    {error.message}
                </motion.div>
            )}
        </div>
    );
}
