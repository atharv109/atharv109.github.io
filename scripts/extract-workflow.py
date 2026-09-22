import json
from pathlib import Path

journal_path = Path("C:/Users/athar/.claude/projects/C--Users-athar-atharv109-github-io/d0f95ed6-db62-4c91-a15f-541aa5025b1e/subagents/workflows/wf_0fe0b70e-26b/journal.jsonl")
out_dir = Path("C:/Users/athar/atharv109.github.io/src/components/visuals")
out_dir.mkdir(parents=True, exist_ok=True)

research = {}
visuals = {}

with open(journal_path, "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        try:
            entry = json.loads(line)
        except json.JSONDecodeError:
            continue
        if entry.get("type") != "result":
            continue
        result = entry.get("result", {})
        if "componentCode" in result:
            visuals[result["projectId"]] = result
        elif "oneLiner" in result and "id" in result:
            research[result["id"]] = result

print(f"Found {len(research)} research results and {len(visuals)} visuals")

# Write visual component files
for pid, v in visuals.items():
    component_name = v["componentName"]
    code = v["componentCode"]
    file_path = out_dir / f"{component_name}.tsx"
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(code)
    print(f"Wrote {file_path}")

# Write combined data for inspection
summary = {
    "research": list(research.values()),
    "visuals": [{"projectId": v["projectId"], "componentName": v["componentName"], "description": v["description"]} for v in visuals.values()]
}
summary_path = Path("C:/Users/athar/atharv109.github.io/reference/workflow-summary.json")
with open(summary_path, "w", encoding="utf-8") as f:
    json.dump(summary, f, indent=2)
print(f"Wrote {summary_path}")
