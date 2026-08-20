import { useAtomValue, useSetAtom } from "jotai";
import { Upload } from "lucide-react";
import { useRef, type ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { parseUploadFile, UPLOAD_ACCEPT } from "@/lib/upload/parse-file";
import { UploadError } from "@/lib/upload/types";
import { drawAtom } from "@/store/draw";
import { uploadFeaturesAtom, uploadResultAtom } from "@/store/upload";

/**
 * Uploads a file of areas (zipped shapefile, KML/KMZ, GeoJSON) into the draw store.
 * Rendered inside the `DrawControls` fieldset, next to the tools it feeds.
 *
 * The file input is a real element rather than a programmatic picker: Playwright's
 * `setInputFiles` and screen readers both need one in the DOM. It stays visually
 * hidden and out of the tab order; the visible button is what triggers it.
 */
export function UploadControl() {
  const draw = useAtomValue(drawAtom);
  const uploadFeatures = useSetAtom(uploadFeaturesAtom);
  const setUploadResult = useSetAtom(uploadResultAtom);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];

    // Reset so picking the same file again still fires a change event.
    event.currentTarget.value = "";

    if (!file) return;

    try {
      const outcome = await parseUploadFile(file);

      uploadFeatures({ fileName: file.name, outcome });
    } catch (error) {
      const message = error instanceof UploadError ? error.message : "The file could not be read.";

      setUploadResult({ fileName: file.name, accepted: 0, warnings: [], error: message });
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => inputRef.current?.click()}
        disabled={!draw.bound}
        aria-label="Upload areas"
        title="Upload areas"
      >
        <Upload />
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept={UPLOAD_ACCEPT}
        onChange={(event) => void handleChange(event)}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />
    </>
  );
}
