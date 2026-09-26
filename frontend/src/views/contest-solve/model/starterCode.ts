import { algorithmTemplates } from "@/entities/contest";
import type { ContestTask } from "@/shared/api";

const genericStarter = `import sys

def solve():
    tokens = sys.stdin.read().split()
    if tokens:
        print(tokens[0])

solve()
`;

export function getStarterCode(task?: ContestTask): string {
  if (!task) return genericStarter;
  const match = algorithmTemplates.find(
    (t) => t.title.toLowerCase() === task.title.toLowerCase()
  );
  if (match && match.starterCode) {
    return match.starterCode;
  }
  return genericStarter;
}
