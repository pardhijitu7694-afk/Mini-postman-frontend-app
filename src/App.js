import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  Typography,
  Paper,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Grid,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { Delete } from "lucide-react";

export default function ApiRequestTool() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState([{ key: "", value: "" }]);
  const [body, setBody] = useState("{}");
  const [response, setResponse] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/history`);
      setHistory(res.data);
    } catch (error) {
      console.log("Error loading history:", error);
    }
  };

  const sendRequest = async () => {
    try {
      let jsonBody = null;
      if (["POST", "PUT", "PATCH"].includes(method)) {
        jsonBody = JSON.parse(body);
      }

      const start = performance.now();

      const res = await fetch("http://localhost:5000/api/request/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          method,
          headers: headers
            .filter((h) => h.key.trim() !== "")
            .reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {}),
          body: jsonBody,
        }),
      });

      const end = performance.now();
      const text = await res.text();

      let jsonParsed;
      try {
        jsonParsed = JSON.parse(text);
      } catch {
        jsonParsed = text;
      }

      setResponse({
        status: res.status,
        time: Math.round(end - start),
        size: text.length,
        headers: Object.fromEntries(res.headers.entries()),
        body: jsonParsed,
      });

      loadHistory();
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  const loadHistoryItem = (item) => {
    setLoading(true);

    setMethod(item.method);
    setUrl(item.url);
    setHeaders(
      Object.entries(item.headers).map(([key, value]) => ({ key, value }))
    );
    setBody(item.body == null ? "{}" : JSON.stringify(item.body, null, 2));

    setLoading(false);
  };

  return (
    <Box sx={{ width: "100vw" }}>
      <Box p={2}>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : (
          <Grid
            container
            spacing={2}
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",              // Mobile
                md: "1fr 1fr",          // Tablet
                lg: "2fr 2fr 1.2fr",    
              },
            }}
          >
           
            <Grid item>
              <Paper sx={{ p: 2, height: "85vh", overflow: "auto" }}>
                <Typography variant="h6">Request Builder</Typography>
                <Divider sx={{ my: 1 }} />

                <TextField
                  fullWidth
                  label="URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  sx={{ mb: 2 }}
                />

                <Select
                  fullWidth
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  {"GET POST PUT PATCH DELETE".split(" ").map((m) => (
                    <MenuItem key={m} value={m}>
                      {m}
                    </MenuItem>
                  ))}
                </Select>

                <Typography mt={2}>Headers</Typography>

                <Table size="small" sx={{ display: "block", overflowX: "auto" }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Key</TableCell>
                      <TableCell>Value</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {headers.map((h, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <TextField
                            size="small"
                            value={h.key}
                            onChange={(e) => {
                              const newHeaders = [...headers];
                              newHeaders[i].key = e.target.value;
                              setHeaders(newHeaders);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={h.value}
                            onChange={(e) => {
                              const newHeaders = [...headers];
                              newHeaders[i].value = e.target.value;
                              setHeaders(newHeaders);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() =>
                              setHeaders(
                                headers.filter((_, idx) => idx !== i)
                              )
                            }
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Button
                  sx={{ mt: 1 }}
                  onClick={() =>
                    setHeaders([...headers, { key: "", value: "" }])
                  }
                >
                  + Add Header
                </Button>

                <Typography mt={2}>JSON Body</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={8}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />

                <Button
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2, py: 1.2 }}
                  onClick={sendRequest}
                >
                  Send Request
                </Button>
              </Paper>
            </Grid>

          
            <Grid item>
              <Paper sx={{ p: 2, height: "85vh", overflow: "auto" }}>
                <Typography variant="h6">Response</Typography>
                <Divider sx={{ my: 1 }} />

                {response ? (
                  response.error ? (
                    <Typography color="red">
                      Error: {response.error}
                    </Typography>
                  ) : (
                    <>
                      <Typography>Status: {response.status}</Typography>
                      <Typography>Time: {response.time} ms</Typography>
                      <Typography>Size: {response.size} bytes</Typography>

                      <Typography mt={2} fontWeight="bold">
                        Body
                      </Typography>
                      <Paper sx={{ p: 1, maxHeight: 220, overflow: "auto" }}>
                        <pre>{JSON.stringify(response.body, null, 2)}</pre>
                      </Paper>

                      <Typography mt={2} fontWeight="bold">
                        Headers
                      </Typography>
                      <Paper sx={{ p: 1, maxHeight: 180, overflow: "auto" }}>
                        <pre>
                          {JSON.stringify(response.headers, null, 2)}
                        </pre>
                      </Paper>
                    </>
                  )
                ) : (
                  <Typography>No response yet</Typography>
                )}
              </Paper>
            </Grid>

            <Grid item>
              <Paper sx={{ p: 2, height: "85vh" }}>
                <Typography variant="h6">History</Typography>
                <Divider sx={{ my: 1 }} />

                <Button
                  color="error"
                  fullWidth
                  onClick={async () => {
                    await axios.delete(
                      `http://localhost:5000/api/history`
                    );
                    setHistory([]);
                  }}
                >
                  Clear All
                </Button>

                <Box mt={2} maxHeight="70vh" overflow="auto">
                  {history.map((item, index) => (
                    <Paper key={index} sx={{ p: 1, mb: 1 }}>
                      <Typography fontWeight="bold">
                        {item.method}
                      </Typography>
                      <Typography variant="body2">{item.url}</Typography>
                      <Typography variant="caption">
                        {item.timestamp}
                      </Typography>

                      <Box display="flex" gap={1} mt={1}>
                        <Button
                          size="small"
                          onClick={() => loadHistoryItem(item)}
                        >
                          Load
                        </Button>

                        <IconButton
                          color="error"
                          onClick={async () => {
                            await axios.delete(
                              `http://localhost:5000/api/history/${item._id}`
                            );
                            setHistory(
                              history.filter((h) => h._id !== item._id)
                            );
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
}
