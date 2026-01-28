package com.studybuddy.service;

import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.parser.ParseContext;
import org.apache.tika.sax.BodyContentHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class FileExtractionService {

    private final Tika tika = new Tika();

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.tesseract.datapath:}")
    private String tesseractDatapath; // e.g., C:\\Program Files\\Tesseract-OCR

    @Value("${app.tesseract.lang:eng}")
    private String tesseractLang; // e.g., eng or eng+spa

    private static final Set<String> IMAGE_EXTS = new HashSet<>(Arrays.asList(
            "png", "jpg", "jpeg", "bmp", "tiff", "tif", "webp"
    ));

    public String saveFile(MultipartFile file) throws IOException {
        // Ensure upload dir exists
        Path dir = Paths.get(uploadDir);
        if (!Files.exists(dir)) {
            Files.createDirectories(dir);
        }
        String original = file.getOriginalFilename();
        String safeName = (original == null || original.isBlank()) ? "file" : original.replaceAll("[^a-zA-Z0-9._-]", "_");
        String timestamp = DateTimeFormatter.ofPattern("yyyyMMddHHmmss").format(LocalDateTime.now());
        String newName = UUID.randomUUID() + "_" + timestamp + "_" + safeName;
        Path target = dir.resolve(newName);
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, target);
        }
        return target.toString();
    }

    public String extractText(Path path) throws IOException {
        String ext = getExtension(path.getFileName().toString()).toLowerCase(Locale.ROOT);

        // For images: use Tesseract OCR only (as requested)
        if (IMAGE_EXTS.contains(ext)) {
            try {
                String ocr = ocrImage(path);
                return ocr == null ? "" : ocr;
            } catch (IOException e) {
                // Graceful fallback: if OCR fails (e.g., tesseract not found), return empty text
                return "";
            }
        }

        // For non-images (PDF, DOCX, PPTX, etc.): use Tika (no OCR)
        try (InputStream in = Files.newInputStream(path)) {
            String text = parseWithTika(in);
            if (text != null && !text.isBlank()) {
                return text;
            }
        } catch (Exception ignored) {
        }
        return "";
    }

    public String extractText(MultipartFile file, Path savedPath) throws IOException {
        return extractText(savedPath);
    }

    private String parseWithTika(InputStream in) throws IOException, TikaException {
        BodyContentHandler handler = new BodyContentHandler(-1);
        Metadata metadata = new Metadata();
        AutoDetectParser parser = new AutoDetectParser();
        ParseContext context = new ParseContext();
        try {
            parser.parse(in, handler, metadata, context);
        } catch (org.xml.sax.SAXException e) {
            throw new IOException(e);
        }
        return handler.toString();
    }

    private String ocrImage(Path imagePath) throws IOException {
        // Build tesseract command: <tesseractExe> <image> stdout -l <lang> [--tessdata-dir <dir>]
        String image = imagePath.toAbsolutePath().toString();
        String tesseractExe = resolveTesseractExecutable();

        ProcessBuilder pb;
        if (tesseractDatapath != null && !tesseractDatapath.isBlank()) {
            // Use provided datapath as the base; tessdata is typically under that dir
            String tessdataDir = Paths.get(tesseractDatapath, "tessdata").toString();
            pb = new ProcessBuilder(
                    tesseractExe,
                    image,
                    "stdout",
                    "-l", tesseractLang,
                    "--tessdata-dir", tessdataDir
            );
        } else {
            // Rely on PATH configuration
            pb = new ProcessBuilder(
                    tesseractExe,
                    image,
                    "stdout",
                    "-l", tesseractLang
            );
        }
        pb.redirectErrorStream(true);
        Process p = pb.start();
        boolean finished;
        try {
            finished = p.waitFor(120, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("OCR interrupted", e);
        }
        if (!finished) {
            p.destroyForcibly();
            throw new IOException("OCR timed out");
        }
        int code = p.exitValue();
        String output;
        try (InputStream is = p.getInputStream()) {
            output = new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
        if (code != 0) {
            // Include snippet of output for easier debugging
            String msg = output == null ? "" : output.trim();
            throw new IOException("Tesseract returned non-zero exit code " + code + (msg.isEmpty() ? "" : ": " + msg));
        }
        return output == null ? "" : output.trim();
    }

    private String resolveTesseractExecutable() {
        String exeName = isWindows() ? "tesseract.exe" : "tesseract";
        if (tesseractDatapath != null && !tesseractDatapath.isBlank()) {
            String candidate = Paths.get(tesseractDatapath, exeName).toString();
            try {
                if (Files.exists(Paths.get(candidate))) {
                    return candidate;
                }
            } catch (Exception ignored) {}
        }
        return "tesseract";
    }

    private boolean isWindows() {
        String os = System.getProperty("os.name");
        return os != null && os.toLowerCase(Locale.ROOT).contains("win");
    }

    private String getExtension(String name) {
        int i = name.lastIndexOf('.');
        return i >= 0 ? name.substring(i + 1) : "";
    }
}
