"use client";
import React, { useEffect, useState } from "react";
import { Button, Layout, List, message } from "antd";
import { useRouter } from "next/navigation";
import Link from "next/link";

const { Content } = Layout;

export interface HistoryEntry {
  selectedBook: string;
  lastWords: string;
}

const ClearHistory: React.FC = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const router = useRouter();

  useEffect(() => {
    const storedHistory = JSON.parse(localStorage.getItem("history") || "[]");
    setHistory(storedHistory);
  }, []);

  const handleDelete = (index: number) => {
    const newHistory = history.filter((_, i) => i !== index);
    localStorage.setItem("history", JSON.stringify(newHistory));
    setHistory(newHistory);
    message.success(`Deleted entry ${index + 1} from history`);
  };

  const clearAllHistory = () => {
    localStorage.removeItem("history");
    setHistory([]);
    message.success("All history cleared!");
    router.push("/"); // Redirect back to the home page
  };

  return (
    <Layout style={{ padding: "24px", minHeight: "100vh" }}>
      <Content>
        <Link href="/">
          <Button type="link" style={{ marginBottom: "24px" }}>
            Home
          </Button>
        </Link>

        <br />

        <Button
          type="primary"
          danger
          onClick={clearAllHistory}
          style={{ marginBottom: "20px" }}
        >
          Clear All LocalStorage History
        </Button>

        <List
          header={<div>LocalStorage History</div>}
          bordered
          dataSource={history}
          renderItem={(item, index) => (
            <List.Item
              actions={[
                <Button type="link" danger onClick={() => handleDelete(index)}>
                  Delete
                </Button>,
              ]}
            >
              <div>
                <strong>Book:</strong> {item.selectedBook}
                <br />
                <strong>Last Words:</strong> {item.lastWords}
              </div>
            </List.Item>
          )}
        />
      </Content>
    </Layout>
  );
};

export default ClearHistory;
