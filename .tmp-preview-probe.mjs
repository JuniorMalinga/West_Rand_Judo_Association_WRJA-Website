for (const url of ["http://localhost:5173/", "http://localhost:5174/"]) {
  try {
    const response = await fetch(url);
    const body = await response.text();
    console.log(JSON.stringify({ url, status: response.status, contentType: response.headers.get("content-type"), body: body.slice(0, 400) }));
  } catch (error) {
    console.log(JSON.stringify({ url, error: error.message }));
  }
}
