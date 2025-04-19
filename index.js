import http from "http";

const PORT = 3000;

http
  .createServer((req, res) => {
    if (req.method !== "POST" || req.url !== "/") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid Request Method/Endpoint" }));
      return;
    }
    let data = "";
    req.on("data", (chunk) => {
      data += chunk.toString();
    });
    
    req.on("end", () => {
      try {
        const order = JSON.parse(data);
        if (!validateData(order)) {
          throw Error("Invalid Order");
        }
        const cost = calculateCost(order);
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(Math.round(cost).toString());
      } catch (err) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(
          JSON.stringify({ error: "Invalid Request/Something went wrong" }),
        );
      }
    });
  })
  .listen(PORT);

function calculateCost(order) {
  const c = new Set();

  const products = {
    C1: ["A", "B", "C"],
    C2: ["D", "E", "F"],
    C3: ["G", "H", "I"],
  };

  const weight = {
    A: 3,
    B: 2,
    C: 8,
    D: 12,
    E: 25,
    F: 15,
    G: 0.5,
    H: 1,
    I: 2,
  };

  let total = 0;

  for (const i in order) {
    total += order[i] * weight[i];
  }

  order.total = total;
  if (order.A || order.B || order.C) {
    c.add("C1");
  }
  if (order.D || order.E || order.F) {
    c.add("C2");
  }
  if (order.G || order.H || order.I) {
    c.add("C3");
  }

  let cost = Infinity;
  let vis = new Set();
  function dfs(node, w, l, mn) {
    if (node == "L") {
      if (l + w == order.total) {
        cost = Math.min(cost, mn);
      } else {
        c.forEach((x) => {
          if (!vis.has(x)) {
            dfs(x, 0, l + w, mn + fare("L", x, 0));
          }
        });
      }
    } else {
      if (vis.has(node)) {
        return;
      }
      vis.add(node);
      let temp = 0;
      products[node].forEach((x) => {
        temp += (order[x] ?? 0) * weight[x];
      });
      dfs("L", w + temp, l, mn + fare(node, "L", w + temp));
      c.forEach((x) => {
        if (!vis.has(x)) {
          dfs(x, w + temp, l, mn + fare(node, x, w + temp));
        }
      });
      vis.delete(node);
    }
  }
  if (c.has("C1")) {
    dfs("C1", 0, 0, 0);
  }
  if (c.has("C2")) {
    dfs("C2", 0, 0, 0);
  }
  if (c.has("C3")) {
    dfs("C3", 0, 0, 0);
  }
  return cost;
}

function validateData(data) {
  const keys = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
  keys.forEach((k) => (data[k] ??= 0));
  return Object.keys(data).length < 10;
}

function fare(from, to, weight) {
  const d = {
    C1: {
      C2: 4,
      C3: 5,
      L: 3,
    },
    C2: {
      C1: 4,
      C3: 3,
      L: 2.5,
    },
    C3: {
      C1: 5,
      C2: 3,
      L: 2,
    },
    L: {
      C1: 3,
      C2: 2.5,
      C3: 2,
    },
  };
  const slab = weight ? Math.floor((weight + 4) / 5) : 1;
  return d[from][to] * (10 + (slab - 1) * 8);
}
