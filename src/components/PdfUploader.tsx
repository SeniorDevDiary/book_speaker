// "use client";

// import PdfUploader from "@/components/PdfUploader";

// export default function Home() {
//   return (
//     <div style={{ padding: "50px" }}>
//       <h1>PDF to JSON Converter</h1>
//       <PdfUploader />
//     </div>
//   );
// }

import { Upload, message } from "antd";
import { RcFile } from "antd/es/upload/interface";
import { InboxOutlined } from "@ant-design/icons";
import { useState } from "react";

const { Dragger } = Upload;

export default function PdfUploader() {
  const [loading, setLoading] = useState(false);
  const handlePdfUpload = async (file: RcFile) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/process-pdf", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        result.files.forEach(
          (jsonFile: { filename: string; content: string }) => {
            saveJsonFile(jsonFile.content, jsonFile.filename);
          }
        );

        message.success("PDF processed and JSON files created successfully!");
      } else {
        message.error("Error processing PDF.");
      }
    } catch (error) {
      console.error("Error processing PDF:", error);
      message.error("Error processing PDF.");
    } finally {
      setLoading(false);
    }
  };

  const saveJsonFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const props = {
    name: "file",
    multiple: false,
    accept: ".pdf",
    beforeUpload: (file: RcFile) => {
      handlePdfUpload(file);
      return false;
    },
    onChange(info: { file: { name?: any; status?: any } }) {
      const { status } = info.file;
      if (status === "done") {
        message.success(`${info.file.name} file uploaded successfully.`);
      } else if (status === "error") {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  return (
    <Dragger {...props} disabled={loading} style={{ marginTop: "20px" }}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">
        Click or drag file to this area to upload
      </p>
      <p className="ant-upload-hint">
        Support for a single upload. Strictly prohibit from uploading company
        data or other band files
      </p>
    </Dragger>
  );
}
